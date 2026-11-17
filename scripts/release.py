"""Release: lista de arquivos com tipo e hash, e histórico de mudanças.

O `segundo-cerebro.release.json` é lido pelo exportador e pelos scripts de
atualização. Os hashes são SHA-256 dos bytes que o Git guarda no índice
(`git show :<caminho>`), que é o que o commit e o zip levam; a árvore de
trabalho pode estar com CRLF e não serve de fonte.

Uso: `uv run --no-project python scripts/release.py` refaz a lista de
arquivos (caminho, tipo e hash) do arquivo gravado na raiz.
"""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

import manifesto

ARQUIVO_RELEASE = "segundo-cerebro.release.json"
ARQUIVO_MUDANCAS = "mudancas-proxima-versao.json"
VERSAO_SCHEMA = 1
VERSAO_INICIAL = "1.0.0-dev"

_SHA256 = re.compile(r"^[0-9a-f]{64}$")


def sha256_arquivo(caminho: Path) -> str:
    """SHA-256 dos bytes do arquivo em disco, hexadecimal minúsculo."""
    return hashlib.sha256(Path(caminho).read_bytes()).hexdigest()


def sha256_indice(raiz: Path, rel: str) -> str:
    """SHA-256 do conteúdo que o Git guarda no índice para o arquivo rastreado."""
    conteudo = subprocess.run(
        ["git", "show", f":{rel}"], cwd=raiz, check=True, capture_output=True
    ).stdout
    return hashlib.sha256(conteudo).hexdigest()


def arquivos_da_release(raiz: Path) -> dict[str, str]:
    """Arquivo rastreado -> tipo, sem os de tipo repo e sem o próprio release."""
    raiz = Path(raiz)
    itens = manifesto.carregar(raiz)
    resultado: dict[str, str] = {}
    for arquivo in manifesto._arquivos_rastreados(raiz):
        if arquivo == ARQUIVO_RELEASE:
            continue
        tipo = manifesto.tipo_de(itens, arquivo)
        if tipo is None or tipo == "repo":
            continue
        resultado[arquivo] = tipo
    return resultado


def _lista(raiz: Path) -> list[dict]:
    return [
        {"caminho": c, "tipo": t, "sha256": sha256_indice(raiz, c)}
        for c, t in sorted(arquivos_da_release(raiz).items())
    ]


def _ler_json(caminho: Path) -> dict | None:
    if not caminho.is_file():
        return None
    return json.loads(caminho.read_text(encoding="utf-8"))


def _uniao(antigos: list, novos: list, chave) -> list:
    """União sem duplicar, mantendo a ordem; o item novo vence na mesma chave."""
    resultado: list = []
    posicao: dict = {}
    for item in list(antigos) + list(novos):
        k = chave(item)
        if k in posicao:
            resultado[posicao[k]] = item
        else:
            posicao[k] = len(resultado)
            resultado.append(item)
    return resultado


def _item_historico(versao: str, mudancas: dict, existente: dict | None) -> dict:
    base = existente or {"removidos": [], "renomeados": [], "migracoes": []}
    return {
        "versao": versao,
        "removidos": _uniao(base["removidos"], mudancas.get("removidos", []), lambda x: x),
        "renomeados": _uniao(
            base["renomeados"],
            mudancas.get("renomeados", []),
            lambda x: (x["de"], x["para"]),
        ),
        "migracoes": _uniao(
            base["migracoes"], mudancas.get("migracoes", []), lambda x: x["id"]
        ),
    }


def gerar(raiz: Path, versao: str) -> dict:
    """Monta o conteúdo do release para a versão, herdando o histórico gravado."""
    raiz = Path(raiz)
    atual = _ler_json(raiz / ARQUIVO_RELEASE) or {}
    historico = list(atual.get("historico", []))
    if not versao.endswith("-dev"):
        mudancas = _ler_json(raiz / ARQUIVO_MUDANCAS) or {}
        indice = next((i for i, h in enumerate(historico) if h["versao"] == versao), None)
        existente = historico[indice] if indice is not None else None
        item = _item_historico(versao, mudancas, existente)
        if indice is None:
            historico.append(item)
        else:
            historico[indice] = item
    return {
        "versao_schema": VERSAO_SCHEMA,
        "versao": versao,
        "arquivos": _lista(raiz),
        "historico": historico,
    }


def atualizar_lista(raiz: Path) -> dict:
    """Refaz só `arquivos`; `versao` e `historico` ficam como estão."""
    raiz = Path(raiz)
    atual = _ler_json(raiz / ARQUIVO_RELEASE)
    if atual is None:
        return gerar(raiz, VERSAO_INICIAL)
    atual["arquivos"] = _lista(raiz)
    return atual


def serializar(dados: dict) -> bytes:
    """Bytes do JSON do release: UTF-8 sem BOM, com LF."""
    return (json.dumps(dados, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def gravar(raiz: Path, dados: dict) -> None:
    """Grava o release em UTF-8 sem BOM, com LF."""
    (Path(raiz) / ARQUIVO_RELEASE).write_bytes(serializar(dados))


# ---------------------------------------------------------------- validação


def _caminho_seguro(caminho) -> str | None:
    """Mensagem de problema do caminho, ou None se estiver certo."""
    if not isinstance(caminho, str) or not caminho:
        return "caminho vazio ou que não é texto"
    if "\\" in caminho:
        return f"caminho com barra invertida: {caminho}"
    if caminho.startswith("/") or re.match(r"^[A-Za-z]:", caminho):
        return f"caminho absoluto: {caminho}"
    if ".." in caminho.split("/"):
        return f"caminho com '..': {caminho}"
    return None


def _lista_de(dados: dict, campo: str, prefixo: str, erros: list[str]) -> list:
    valor = dados.get(campo)
    if not isinstance(valor, list):
        erros.append(f"{prefixo}: campo '{campo}' ausente ou não é lista")
        return []
    return valor


def _validar_mudancas_itens(dados: dict, prefixo: str, erros: list[str]) -> None:
    for caminho in _lista_de(dados, "removidos", prefixo, erros):
        problema = _caminho_seguro(caminho)
        if problema:
            erros.append(f"{prefixo}: removidos: {problema}")
    for r in _lista_de(dados, "renomeados", prefixo, erros):
        for campo in ("de", "para"):
            if not isinstance(r, dict) or campo not in r:
                erros.append(f"{prefixo}: renomeado sem '{campo}'")
                continue
            problema = _caminho_seguro(r[campo])
            if problema:
                erros.append(f"{prefixo}: renomeados.{campo}: {problema}")
    for m in _lista_de(dados, "migracoes", prefixo, erros):
        for campo in ("id", "descricao", "instrucoes"):
            if not isinstance(m, dict) or not isinstance(m.get(campo), str) or not m[campo]:
                erros.append(f"{prefixo}: migração sem '{campo}'")


def validar_release(dados: dict) -> list[str]:
    """Valida só o esquema do release."""
    erros: list[str] = []
    if dados.get("versao_schema") != VERSAO_SCHEMA:
        erros.append(f"release: versao_schema deve ser {VERSAO_SCHEMA}")
    if not isinstance(dados.get("versao"), str) or not dados.get("versao"):
        erros.append("release: campo 'versao' ausente ou vazio")
    vistos: set = set()
    repetidos: set = set()
    for a in _lista_de(dados, "arquivos", "release", erros):
        if not isinstance(a, dict):
            erros.append("release: item de arquivos não é objeto")
            continue
        caminho = a.get("caminho")
        if isinstance(caminho, str) and caminho in vistos and caminho not in repetidos:
            erros.append(f"release: caminho repetido: {caminho}")
            repetidos.add(caminho)
        vistos.add(caminho)
        problema = _caminho_seguro(a.get("caminho"))
        if problema:
            erros.append(f"release: arquivos: {problema}")
        if a.get("tipo") not in manifesto.TIPOS_VALIDOS or a.get("tipo") == "repo":
            erros.append(f"release: tipo inválido em {a.get('caminho')}: {a.get('tipo')}")
        if not isinstance(a.get("sha256"), str) or not _SHA256.match(a["sha256"]):
            erros.append(f"release: sha256 inválido em {a.get('caminho')}")
    for h in _lista_de(dados, "historico", "release", erros):
        if not isinstance(h, dict) or not isinstance(h.get("versao"), str) or not h["versao"]:
            erros.append("release: item do histórico sem 'versao'")
            continue
        _validar_mudancas_itens(h, f"release: histórico {h['versao']}", erros)
    return erros


def validar_mudancas(dados: dict) -> list[str]:
    """Valida só o esquema do arquivo de mudanças da próxima versão."""
    erros: list[str] = []
    _validar_mudancas_itens(dados, "mudanças", erros)
    return erros


def validar(raiz: Path) -> list[str]:
    """Bloco `release` do verificador: esquemas e lista em dia (hash não é comparado)."""
    raiz = Path(raiz)
    erros: list[str] = []
    try:
        atual = _ler_json(raiz / ARQUIVO_RELEASE)
    except json.JSONDecodeError:
        return [f"release: JSON inválido: {ARQUIVO_RELEASE}"]
    try:
        mudancas = _ler_json(raiz / ARQUIVO_MUDANCAS)
    except json.JSONDecodeError:
        return [f"release: JSON inválido: {ARQUIVO_MUDANCAS}"]
    if atual is None:
        return [f"release: arquivo ausente: {ARQUIVO_RELEASE}"]
    erros += validar_release(atual)
    if mudancas is None:
        erros.append(f"release: arquivo ausente: {ARQUIVO_MUDANCAS}")
    else:
        erros += validar_mudancas(mudancas)
    if erros:
        return erros

    gravados = {a["caminho"]: a["tipo"] for a in atual["arquivos"]}
    esperados = arquivos_da_release(raiz)
    for caminho in sorted(set(gravados) | set(esperados)):
        if caminho in gravados and caminho in esperados:
            if gravados[caminho] != esperados[caminho]:
                erros.append(f"release: tipo defasado: {caminho}")
        else:
            erros.append(f"release: lista defasada: {caminho}")
    return sorted(set(erros), key=erros.index)


def main(raiz: Path | None = None) -> int:
    raiz = Path(raiz) if raiz else Path(__file__).resolve().parent.parent
    gravar(raiz, atualizar_lista(raiz))
    return 0


if __name__ == "__main__":
    sys.exit(main())
