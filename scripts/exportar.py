"""CLI do mantenedor: porte, preparo e empacotamento da release.

Subcomandos: pendencias, marcar, changelog, lista, preparar, empacotar.
Uso: `uv run --no-project python scripts/exportar.py --help`.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import zipfile
from pathlib import Path

import changelog
import porte
import release
import verificar

ARQUIVO_VERSION = "VERSION"
ARQUIVO_CHANGELOG = "_docs/CHANGELOG.md"
ARQUIVO_VERSAO_PRIVADA = "SEGUNDO-CEREBRO-VERSION"
_VERSAO = re.compile(r"^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$")


def _raiz_padrao() -> Path:
    return Path(__file__).resolve().parent.parent


def _git(raiz: Path, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(["git", *args], cwd=raiz, capture_output=True)


def _versao_valida(versao: str) -> bool:
    return bool(_VERSAO.match(versao))


# ---------------------------------------------------------------- porte


def _carregar_registro(caminho: Path) -> dict | None:
    """Registro de porte, ou None (com a mensagem em stderr) se um par está incompleto."""
    try:
        return porte.carregar_registro(caminho)
    except ValueError as e:
        print(str(e), file=sys.stderr)
        return None


def _cmd_pendencias(args, raiz: Path) -> int:
    registro = _carregar_registro(Path(args.registro))
    if registro is None:
        return 1
    itens = porte.pendencias(Path(args.privado), registro)
    if not itens:
        print("nenhuma pendência de porte")
        return 0
    for p in itens:
        print(f"{p.motivo}: {p.privado} -> {p.publico or porte.par_publico(p.privado)}")
    return 1


def _cmd_marcar(args, raiz: Path) -> int:
    if args.publico and len(args.arquivo) != 1:
        print("--publico só vale com um único --arquivo", file=sys.stderr)
        return 2
    privado, caminho = Path(args.privado), Path(args.registro)
    registro = _carregar_registro(caminho)
    if registro is None:
        return 1
    for rel in args.arquivo:
        if not (privado / rel).is_file():
            print(f"arquivo inexistente no privado: {rel}", file=sys.stderr)
            return 1
    do_framework = set(porte.framework_privado(privado))
    for rel in args.arquivo:
        if rel.replace("\\", "/") not in do_framework:
            print(f"arquivo fora das raízes do framework: {rel}", file=sys.stderr)
            return 1
    for rel in args.arquivo:
        registro = porte.marcar(
            privado, registro, rel, args.estado, publico=args.publico, nota=args.nota
        )
    porte.salvar_registro(caminho, registro)
    for rel in args.arquivo:
        print(f"marcado {args.estado}: {rel}")
    return 0


def _cmd_changelog(args, raiz: Path) -> int:
    texto = (Path(args.privado) / ARQUIVO_VERSAO_PRIVADA).read_text(encoding="utf-8")
    itens = changelog.entradas(texto)
    a_publicar = changelog.pendentes_de_publicacao(itens)
    sem = changelog.sem_marcacao(itens)
    fora = changelog.fora_do_formato(texto)
    for linha in fora:
        print(f"cabeçalho fora do formato: {linha}")
    for v in a_publicar:
        print(f"a publicar: {v}")
    for v in sem:
        print(f"sem marcação: {v}")
    if not a_publicar and not sem and not fora:
        print("nenhuma entrada a publicar ou sem marcação")
    return 1 if (a_publicar or sem or fora) else 0


# ---------------------------------------------------------------- release


def _cmd_lista(args, raiz: Path) -> int:
    release.gravar(raiz, release.atualizar_lista(raiz))
    print(f"lista de arquivos atualizada em {release.ARQUIVO_RELEASE}")
    return 0


def _citacoes_de_removidos(raiz: Path) -> list[str]:
    """Avisos de arquivo removido ou renomeado que algum .md rastreado ainda cita.

    Em cada .md rastreado, menos o _docs/CHANGELOG.md (que cita o removido de propósito),
    procura o caminho completo, as formas de wikilink do nome (`[[nome]]`,
    `[[nome|`, `[[nome#`, `[[pasta/nome`) e o nome com extensão, este só quando
    nenhum outro arquivo rastreado tem o mesmo nome. O nome solto não conta.
    """
    mudancas = release._ler_json(raiz / release.ARQUIVO_MUDANCAS) or {}
    alvos = list(mudancas.get("removidos", []))
    alvos += [r["de"] for r in mudancas.get("renomeados", []) if isinstance(r, dict) and "de" in r]
    if not alvos:
        return []
    saida = _git(raiz, "ls-files", "-z").stdout.decode("utf-8")
    rastreados = [a for a in saida.split("\0") if a]
    arquivos = [a for a in rastreados if a.endswith(".md") and a != ARQUIVO_CHANGELOG]
    avisos = []
    for alvo in alvos:
        nome = Path(alvo).stem
        com_extensao = Path(alvo).name
        if not nome:
            continue
        formas = [re.escape(alvo), r"\[\[(?:[^\]|#\n]*/)?" + re.escape(nome) + r"(?:\]\]|\||#)"]
        if not any(r != alvo and Path(r).name == com_extensao for r in rastreados):
            formas.append(re.escape(com_extensao))
        busca = re.compile("|".join(formas))
        for arq in arquivos:
            if arq == alvo or not (raiz / arq).is_file():
                continue
            linhas = (raiz / arq).read_text(encoding="utf-8", errors="replace").splitlines()
            for n, linha in enumerate(linhas, 1):
                if busca.search(linha):
                    avisos.append(f"aviso: {alvo} ainda citado em {arq}:{n}")
    return avisos


def _cmd_preparar(args, raiz: Path) -> int:
    versao = args.versao
    if not _versao_valida(versao):
        print(f"versão inválida (use X.Y.Z ou X.Y.Z-sufixo): {versao}", file=sys.stderr)
        return 1
    if not (raiz / ARQUIVO_VERSION).is_file():
        print(f"{ARQUIVO_VERSION} ausente na raiz do repositório", file=sys.stderr)
        return 1
    if not (raiz / ARQUIVO_CHANGELOG).is_file():
        print(f"{ARQUIVO_CHANGELOG} ausente no repositório", file=sys.stderr)
        return 1
    atual = (raiz / ARQUIVO_VERSION).read_text(encoding="utf-8").strip()
    if atual != versao:
        print(f"{ARQUIVO_VERSION} diz '{atual}', mas a versão pedida é '{versao}'", file=sys.stderr)
        return 1
    texto = (raiz / ARQUIVO_CHANGELOG).read_text(encoding="utf-8")
    if not re.search(rf"^## {re.escape(versao)}(\s|$)", texto, re.MULTILINE):
        print(f"{ARQUIVO_CHANGELOG} sem a seção '## {versao}'", file=sys.stderr)
        return 1
    if verificar.main(raiz) != 0:
        print("verificar.py acusou problemas; corrija antes de preparar", file=sys.stderr)
        return 1
    if args.privado:
        registro = _carregar_registro(Path(args.registro))
        if registro is None:
            return 1
        pend = porte.pendencias(Path(args.privado), registro)
        if pend:
            for p in pend:
                print(f"{p.motivo}: {p.privado}", file=sys.stderr)
            print("há pendência de porte; rode 'pendencias' e resolva", file=sys.stderr)
            return 1
    else:
        print("porte não conferido")
    citacoes = _citacoes_de_removidos(raiz)
    if citacoes:
        for c in citacoes:
            print(c)
        print("há arquivo removido ou renomeado ainda citado; corrija a documentação", file=sys.stderr)
        return 1
    vazio = {"removidos": [], "renomeados": [], "migracoes": []}
    texto_vazio = json.dumps(vazio, ensure_ascii=False, indent=2) + "\n"
    try:
        _gravar_juntos(
            {
                raiz / release.ARQUIVO_RELEASE: release.serializar(release.gerar(raiz, versao)),
                raiz / release.ARQUIVO_MUDANCAS: texto_vazio.encode("utf-8"),
            }
        )
    except OSError as e:
        print(f"não foi possível gravar a release: {e}", file=sys.stderr)
        return 1
    print(f"release {versao} preparada")
    return 0


def _gravar_juntos(conteudos: dict[Path, bytes]) -> None:
    """Grava os arquivos por temporário e troca no fim; se algo falha, volta ao que era."""
    antes = {c: c.read_bytes() if c.is_file() else None for c in conteudos}
    temporarios = {c: c.with_name(c.name + ".tmp") for c in conteudos}
    trocados: list[Path] = []
    try:
        for caminho, dados in conteudos.items():
            temporarios[caminho].write_bytes(dados)
        for caminho in conteudos:
            os.replace(temporarios[caminho], caminho)
            trocados.append(caminho)
    except OSError:
        for caminho in trocados:
            if antes[caminho] is not None:
                caminho.write_bytes(antes[caminho])
        raise
    finally:
        for temporario in temporarios.values():
            temporario.unlink(missing_ok=True)


def _diferencas_do_zip(raiz: Path, zip_caminho: Path, versao: str) -> list[str]:
    """Caminhos da release do HEAD cujo conteúdo no zip difere do hash listado, ou faltam."""
    bruto = _git(raiz, "show", f"HEAD:{release.ARQUIVO_RELEASE}").stdout
    arquivos = json.loads(bruto.decode("utf-8"))["arquivos"]
    prefixo = f"segundo-cerebro-v{versao}/"
    diferentes: list[str] = []
    with zipfile.ZipFile(zip_caminho) as z:
        nomes = set(z.namelist())
        for item in arquivos:
            nome = prefixo + item["caminho"]
            if nome not in nomes:
                diferentes.append(item["caminho"])
            elif hashlib.sha256(z.read(nome)).hexdigest() != item["sha256"]:
                diferentes.append(item["caminho"])
    return diferentes


def _cmd_empacotar(args, raiz: Path) -> int:
    versao = args.versao
    if not _versao_valida(versao):
        print(f"versão inválida (use X.Y.Z ou X.Y.Z-sufixo): {versao}", file=sys.stderr)
        return 1
    if _git(raiz, "status", "--porcelain").stdout.strip():
        print("árvore suja; faça commit ou descarte as mudanças antes de empacotar", file=sys.stderr)
        return 1
    mostrado = _git(raiz, "show", f"HEAD:{release.ARQUIVO_RELEASE}")
    if mostrado.returncode != 0:
        print(f"{release.ARQUIVO_RELEASE} ausente no HEAD", file=sys.stderr)
        return 1
    if json.loads(mostrado.stdout.decode("utf-8")).get("versao") != versao:
        print(f"{release.ARQUIVO_RELEASE} do HEAD não é da versão {versao}", file=sys.stderr)
        return 1
    tag = f"v{versao}"
    if _git(raiz, "rev-parse", "-q", "--verify", f"refs/tags/{tag}").returncode == 0:
        print(f"a tag {tag} já existe", file=sys.stderr)
        return 1
    zip_caminho = raiz / "dist" / f"segundo-cerebro-{tag}.zip"
    zip_caminho.parent.mkdir(exist_ok=True)

    def desfazer() -> None:
        _git(raiz, "tag", "-d", tag)
        zip_caminho.unlink(missing_ok=True)

    if _git(raiz, "tag", tag).returncode != 0:
        print(f"não foi possível criar a tag {tag}", file=sys.stderr)
        return 1
    gerado = _git(
        raiz, "archive", "--format=zip", f"--prefix=segundo-cerebro-{tag}/",
        "-o", str(zip_caminho), tag,
    )
    if gerado.returncode != 0:
        desfazer()
        print("git archive falhou", file=sys.stderr)
        return 1
    try:
        diferentes = _diferencas_do_zip(raiz, zip_caminho, versao)
    except (zipfile.BadZipFile, OSError, ValueError, KeyError) as e:
        desfazer()
        print(f"zip ilegível: {e}", file=sys.stderr)
        return 1
    if diferentes:
        desfazer()
        print("arquivos do zip com hash diferente do listado, ou ausentes:")
        for caminho in diferentes:
            print(caminho)
        return 1
    print(f"{zip_caminho.relative_to(raiz).as_posix()} conferido contra {release.ARQUIVO_RELEASE}")
    return 0


# ---------------------------------------------------------------- CLI


def _parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="exportar.py", description="Porte, preparo e empacotamento da release."
    )
    sub = p.add_subparsers(dest="comando", required=True, metavar="comando")

    s = sub.add_parser("pendencias", help="lista o que do framework privado falta portar")
    s.add_argument("--privado", required=True)
    s.add_argument("--registro", required=True)
    s.set_defaults(func=_cmd_pendencias)

    s = sub.add_parser("marcar", help="registra arquivos como portados ou só do privado")
    s.add_argument("--privado", required=True)
    s.add_argument("--registro", required=True)
    s.add_argument("--arquivo", required=True, nargs="+")
    s.add_argument("--estado", required=True, choices=porte.ESTADOS)
    s.add_argument("--publico", default=None)
    s.add_argument("--nota", default="")
    s.set_defaults(func=_cmd_marcar)

    s = sub.add_parser("changelog", help="lista entradas a publicar e sem marcação")
    s.add_argument("--privado", required=True)
    s.set_defaults(func=_cmd_changelog)

    s = sub.add_parser("lista", help="refaz a lista de arquivos da release")
    s.set_defaults(func=_cmd_lista)

    s = sub.add_parser("preparar", help="confere e grava a release da versão")
    s.add_argument("--versao", required=True)
    s.add_argument("--privado", default=None)
    s.add_argument("--registro", default=None)
    s.set_defaults(func=_cmd_preparar)

    s = sub.add_parser("empacotar", help="cria a tag e o zip da versão e confere os hashes")
    s.add_argument("--versao", required=True)
    s.set_defaults(func=_cmd_empacotar)
    return p


def main(argv: list[str] | None = None, raiz: Path | None = None) -> int:
    for fluxo in (sys.stdout, sys.stderr):
        if hasattr(fluxo, "reconfigure"):
            fluxo.reconfigure(encoding="utf-8")
    args = _parser().parse_args(argv)
    if args.comando == "preparar" and bool(args.privado) != bool(args.registro):
        print("--privado e --registro vêm juntos", file=sys.stderr)
        return 2
    return args.func(args, Path(raiz) if raiz else _raiz_padrao())


if __name__ == "__main__":
    sys.exit(main())
