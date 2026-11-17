"""Filtro de segredos e nomes pessoais.

Varre os arquivos de texto rastreados pelo git e acusa credenciais, dados
pessoais e nomes que não podem chegar a um commit deste repositório.

Cada acerto sai como `arquivo:linha: categoria`. O valor encontrado nunca é
impresso, para o próprio aviso não vazar o que deveria proteger.

Isenção: `scripts/filtro.py` e `scripts/filtro_permitidos.txt` não são
varridos, porque precisam citar os padrões e a lista de permitidos. A lista de
permitidos isenta e-mails de exemplo e o endereço do repositório
(`conta/repositório`), e só o trecho do endereço. Os testes
não têm isenção: montam os valores proibidos por concatenação.
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

DIR_SCRIPTS = Path(__file__).resolve().parent
ARQUIVO_PERMITIDOS = DIR_SCRIPTS / "filtro_permitidos.txt"

EXTENSOES = (
    ".md", ".json", ".py", ".ps1", ".base", ".txt", ".yml", ".ts", ".tsx",
    ".js", ".mjs", ".css", ".yaml", ".toml", ".sh", ".ini", ".cfg",
)
# Lista local opcional de nomes e caminhos a barrar (um padrão por linha), fora
# do repositório. Ver `compilar_lista`.
ARQUIVO_NOMES_LOCAIS = "info/filtro-nomes.txt"
ISENTOS = ("scripts/filtro.py", "scripts/filtro_permitidos.txt")

# Os cinco primeiros vêm da varredura de segredos do backup do vault privado.
SEGREDOS = (
    ("chave da Anthropic", re.compile(r"sk-ant-[A-Za-z0-9_-]{10,}")),
    ("token de bot do Telegram", re.compile(r"(?<![0-9])\d{8,10}:[A-Za-z0-9_-]{30,}")),
    ("ID de chat", re.compile(r"telegram:\d+")),
    ("valor de chave, token ou senha", re.compile(
        r"(?i)(api[_-]?key|chave|key|token|secret|password|senha)['\"]?\s*[:=]\s*['\"]?[A-Za-z0-9_\-]{16,}")),
    ("chave do Google", re.compile(r"AIza[0-9A-Za-z_-]{30,}")),
    ("token do GitHub", re.compile(r"ghp_[A-Za-z0-9]{30,}")),
    ("token do GitHub", re.compile(r"github_pat_[A-Za-z0-9_]{30,}")),
    ("chave da AWS", re.compile(r"AKIA[0-9A-Z]{16}")),
    ("JWT", re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.")),
    ("token Bearer", re.compile(r"Bearer\s+[A-Za-z0-9._-]{20,}")),
    ("chave privada", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    ("chave da OpenAI", re.compile(r"(?<![A-Za-z0-9])sk-(?:proj-)?[A-Za-z0-9_-]{20,}")),
    ("número longo (possível ID)", re.compile(r"(?<![\w.])\d{9,12}(?!\w)(?!\.\d)")),
)

CATEGORIA_NUMERO_LONGO = "número longo (possível ID)"
URL = re.compile(r"https?://[^\s'\"<>)]+")

DADOS_PESSOAIS = (
    ("CPF", re.compile(r"\d{3}\.\d{3}\.\d{3}-\d{2}")),
    ("telefone", re.compile(r"\(?\d{2}\)?\s?9?\d{4}-\d{4}")),
    ("telefone", re.compile(r"(?<!\d)\(?\d{2}\)?\s?9?\d{4}\s\d{4}(?!\d)")),
)

# Padrões genéricos de caminho e token. Nomes e caminhos de uma pessoa
# específica não ficam aqui: vão na lista local `.git/info/filtro-nomes.txt`.
GENERICOS = (
    ("caminho pessoal", re.compile(r"c:[\\/]users[\\/]\w", re.I)),
    ("token do Notion", re.compile(r"ntn_[A-Za-z0-9]{20,}", re.I)),
)

EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
ROTULO_ALFABETICO = re.compile(r"[A-Za-z]{2,}$")


def _carregar_permitidos(caminho: Path = ARQUIVO_PERMITIDOS) -> list[str]:
    """Strings exatas, uma por linha, de `filtro_permitidos.txt`."""
    if not caminho.is_file():
        return []
    linhas = caminho.read_text(encoding="utf-8").splitlines()
    return [l.strip() for l in linhas if l.strip()]


def _e_endereco(entrada: str) -> bool:
    """`conta/repositório`: forma do endereço do repositório, não um e-mail."""
    return "/" in entrada and "@" not in entrada


_TODOS_PERMITIDOS = _carregar_permitidos()
# Entradas com `@` isentam a linha da categoria e-mail.
PERMITIDOS = [p for p in _TODOS_PERMITIDOS if not _e_endereco(p)]
# Entradas `conta/repositório`: só esse trecho (com `https://github.com/`
# opcional) sai da linha antes dos padrões da lista local. A conta solta, em
# outro ponto da mesma linha, continua barrada.
ENDERECOS = [p for p in _TODOS_PERMITIDOS if _e_endereco(p)]


def _padrao_endereco(endereco: str) -> re.Pattern[str]:
    return re.compile(
        r"(?:https?://)?(?:www\.)?(?:github\.com/)?(?<![\w-])"
        + re.escape(endereco) + r"(?![\w-])", re.I)


_PADROES_ENDERECO = [_padrao_endereco(e) for e in ENDERECOS]


def _sem_endereco(linha: str) -> str:
    for padrao in _PADROES_ENDERECO:
        linha = padrao.sub(" ", linha)
    return linha


def _tem_email(linha: str) -> bool:
    if any(p in linha for p in PERMITIDOS):
        return False
    for m in EMAIL.finditer(linha):
        ultimo_rotulo = m.group(0).rstrip(".").rsplit(".", 1)[-1]
        if ROTULO_ALFABETICO.fullmatch(ultimo_rotulo):
            return True
    return False


PALAVRA = re.compile(r"\w+")


def compilar_lista(linhas: list[str]) -> list[tuple[str, re.Pattern[str]]]:
    """Um padrão por linha; vazio e `#` são ignorados. Sem distinguir caixa.

    Palavra simples (só letras, dígitos e sublinhado) casa isolada de letras e
    dígitos (o sublinhado delimita). Qualquer outra linha é uma regex, usada
    como está; regex inválida vale como texto literal.
    """
    saida: list[tuple[str, re.Pattern[str]]] = []
    for bruta in linhas:
        linha = bruta.strip()
        if not linha or linha.startswith("#"):
            continue
        if PALAVRA.fullmatch(linha):
            padrao = re.compile(
                r"(?<![A-Za-z0-9])" + re.escape(linha) + r"(?![A-Za-z0-9])", re.I)
        else:
            try:
                padrao = re.compile(linha, re.I)
            except re.error:
                padrao = re.compile(re.escape(linha), re.I)
        saida.append(("nome pessoal", padrao))
    return saida


def _nomes_locais(raiz: Path) -> list[tuple[str, re.Pattern[str]]]:
    """Padrões da lista local opcional `.git/info/filtro-nomes.txt` (nunca versionada)."""
    try:
        saida = subprocess.run(
            ["git", "rev-parse", "--git-path", ARQUIVO_NOMES_LOCAIS],
            cwd=raiz, check=True, capture_output=True,
        ).stdout.decode("utf-8").strip()
    except (subprocess.CalledProcessError, OSError):
        return []
    caminho = Path(saida)
    if not caminho.is_absolute():
        caminho = Path(raiz) / caminho
    if not caminho.is_file():
        return []
    return compilar_lista(caminho.read_text(encoding="utf-8").splitlines())


def achados(nome: str, texto: str, extras: tuple = ()) -> list[str]:
    """Uma linha `nome:linha: categoria` por categoria encontrada em cada linha."""
    saida: list[str] = []
    for numero, linha in enumerate(texto.splitlines(), start=1):
        sem_url = URL.sub(" ", linha)
        categorias: list[str] = []
        for categoria, padrao in SEGREDOS:
            alvo = sem_url if categoria == CATEGORIA_NUMERO_LONGO else linha
            if padrao.search(alvo):
                categorias.append(categoria)
        for categoria, padrao in DADOS_PESSOAIS + GENERICOS:
            if padrao.search(linha):
                categorias.append(categoria)
        sem_endereco = _sem_endereco(linha)
        for categoria, padrao in extras:
            if padrao.search(sem_endereco):
                categorias.append(categoria)
        if _tem_email(linha):
            categorias.append("e-mail")
        for categoria in dict.fromkeys(categorias):
            saida.append(f"{nome}:{numero}: {categoria}")
    return saida


def _arquivos_rastreados(raiz: Path) -> list[str]:
    bruto = subprocess.run(
        ["git", "ls-files", "-z"], cwd=raiz, check=True, capture_output=True
    ).stdout
    return [p for p in bruto.decode("utf-8").split("\0") if p]


def _em_stage(raiz: Path) -> set[str]:
    """Arquivos com mudança no índice (o que o próximo commit levaria)."""
    bruto = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"],
        cwd=raiz, check=True, capture_output=True,
    ).stdout
    return {p for p in bruto.decode("utf-8").split("\0") if p}


def _e_texto(caminho: str) -> bool:
    """Extensão de texto conhecida, ou arquivo sem extensão (hook, dotfile, LICENSE)."""
    base = caminho.rsplit("/", 1)[-1]
    return caminho.lower().endswith(EXTENSOES) or "." not in base.lstrip(".")


def _ler(raiz: Path, caminho: str, em_stage: set[str]) -> str | None:
    """Conteúdo do índice quando o arquivo está em stage; senão a cópia de trabalho."""
    if caminho in em_stage:
        r = subprocess.run(["git", "show", f":{caminho}"], cwd=raiz, capture_output=True)
        if r.returncode == 0:
            return r.stdout.decode("utf-8", errors="replace")
    arquivo = raiz / caminho
    if not arquivo.is_file():
        return None
    return arquivo.read_text(encoding="utf-8", errors="replace")


def varrer(raiz: Path) -> list[str]:
    """Aplica `achados` ao conteúdo dos arquivos de texto rastreados (menos os isentos)
    e os padrões de nome ao caminho de todo arquivo rastreado (linha 0)."""
    raiz = Path(raiz)
    extras = tuple(_nomes_locais(raiz))
    em_stage = _em_stage(raiz)
    saida: list[str] = []
    for caminho in _arquivos_rastreados(raiz):
        for categoria, padrao in GENERICOS + extras:
            if categoria != "token do Notion" and padrao.search(caminho):
                saida.append(f"{caminho}:0: nome de arquivo")
                break
        if caminho in ISENTOS or not _e_texto(caminho):
            continue
        texto = _ler(raiz, caminho, em_stage)
        if texto is None:
            continue
        saida.extend(achados(caminho, texto, extras))
    return saida


def main(raiz: Path | None = None) -> int:
    raiz = Path(raiz) if raiz else DIR_SCRIPTS.parent
    resultado = varrer(raiz)
    for linha in resultado:
        print(linha)
    return 1 if resultado else 0


if __name__ == "__main__":
    sys.exit(main())
