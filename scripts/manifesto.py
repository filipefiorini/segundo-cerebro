"""Manifesto de framework: lê e valida segundo-cerebro.manifest.json.

Tipos de entrada:
  fixo     substituído a cada atualização
  exemplo  copiado na instalação, nunca mais tocado
  semente  criado se não existir
  repo     vive só no repositório, nunca vai para o vault do usuário
"""
from __future__ import annotations

import fnmatch
import json
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

NOME_MANIFESTO = "segundo-cerebro.manifest.json"
TIPOS_VALIDOS = ("fixo", "exemplo", "semente", "repo")


@dataclass(frozen=True)
class Item:
    caminho: str
    tipo: str


def carregar(raiz: Path) -> list[Item]:
    """Lê o manifesto na raiz e devolve a lista de itens."""
    dados = json.loads((Path(raiz) / NOME_MANIFESTO).read_text(encoding="utf-8"))
    return [Item(i["caminho"], i["tipo"]) for i in dados.get("itens", [])]


def _arquivos_rastreados(raiz: Path) -> list[str]:
    """Arquivos rastreados pelo git (git ls-files), com barras normais."""
    saida = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=raiz,
        check=True,
        capture_output=True,
    ).stdout.decode("utf-8")
    return [p.replace("\\", "/") for p in saida.split("\0") if p]


def _e_glob(segmento: str) -> bool:
    return any(c in segmento for c in "*?[")


def _cobre(item: Item, arquivo: str) -> bool:
    """Diz se a entrada cobre o arquivo (igual, pasta ou glob no último segmento)."""
    caminho = item.caminho
    if caminho.endswith("/"):
        return arquivo.startswith(caminho)
    pasta, _, ultimo = caminho.rpartition("/")
    if _e_glob(ultimo):
        pasta_arquivo, _, nome = arquivo.rpartition("/")
        return pasta_arquivo == pasta and fnmatch.fnmatchcase(nome, ultimo)
    return arquivo == caminho


def tipo_de(itens: list[Item], arquivo: str) -> str | None:
    """Tipo da entrada de caminho mais longo que cobre o arquivo (None se nenhuma).

    No empate de comprimento vale a primeira em ordem alfabética do caminho.
    """
    cobrem = [i for i in itens if _cobre(i, arquivo)]
    if not cobrem:
        return None
    return min(cobrem, key=lambda i: (-len(i.caminho), i.caminho)).tipo


def _existe(raiz: Path, item: Item) -> bool:
    caminho = item.caminho
    if caminho.endswith("/"):
        return (raiz / caminho).is_dir()
    pasta, _, ultimo = caminho.rpartition("/")
    if _e_glob(ultimo):
        diretorio = raiz / pasta if pasta else raiz
        return diretorio.is_dir() and any(diretorio.glob(ultimo))
    return (raiz / caminho).exists()


def validar(raiz: Path) -> list[str]:
    """Devolve as mensagens de erro do manifesto (lista vazia = ok)."""
    raiz = Path(raiz)
    erros: list[str] = []
    try:
        itens = carregar(raiz)
    except FileNotFoundError:
        return [f"manifesto: arquivo ausente: {NOME_MANIFESTO}"]
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        return [f"manifesto: formato inválido: {e}"]

    vistos: set[str] = set()
    repetidos: set[str] = set()
    for item in itens:
        if item.caminho in vistos and item.caminho not in repetidos:
            erros.append(f"manifesto: caminho repetido: {item.caminho}")
            repetidos.add(item.caminho)
        vistos.add(item.caminho)
        if item.tipo not in TIPOS_VALIDOS:
            erros.append(f"manifesto: tipo inválido '{item.tipo}' em {item.caminho}")
        if not _existe(raiz, item):
            erros.append(f"manifesto: caminho inexistente: {item.caminho}")

    for arquivo in _arquivos_rastreados(raiz):
        if not any(_cobre(item, arquivo) for item in itens):
            erros.append(f"manifesto: arquivo fora do manifesto: {arquivo}")
    return erros


def main(raiz: Path | None = None) -> int:
    raiz = Path(raiz) if raiz else Path(__file__).resolve().parent.parent
    erros = validar(raiz)
    for erro in erros:
        print(erro)
    return 1 if erros else 0


if __name__ == "__main__":
    sys.exit(main())
