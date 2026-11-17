"""Verificador de wikilinks e embeds.

Varre as notas `.md` rastreadas pelo git e acusa `[[alvo]]` e `![[alvo]]` que
não resolvem para nenhum arquivo rastreado, com a semântica do Obsidian:

- `[[nome]]` resolve por nome de nota (sem extensão) ou por caminho;
- `[[pasta/nome]]` resolve pelo caminho a partir da raiz, com ou sem `.md`;
- `|alias` e `#seção` / `#^bloco` são descartados; `[[#seção]]` sempre resolve;
- anexos (`![[_assets/x.png]]`) resolvem pelo caminho exato ou pelo nome do arquivo.

No frontmatter (entre o primeiro e o segundo `---`), `[[]]` vazio é aceito: é o
marcador de "sem fonte externa" (`fonte: "[[]]"`). No corpo continua acusado.

Ignora blocos de código cercados, código em linha e `_templates/` (o Templater
gera links só em tempo de uso). Maiúsculas e acentos contam.

Cada acerto sai como `arquivo:linha: [[alvo]]` (ou `![[alvo]]` para embed).
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

import manifesto

DIR_SCRIPTS = Path(__file__).resolve().parent
PASTA_IGNORADA = "_templates/"

LINK = re.compile(r"(!?)\[\[([^\[\]]*)\]\]")
CERCA = re.compile(r"^ {0,3}(`{3,}|~{3,})")
CODIGO_EM_LINHA = re.compile(r"(`+).+?\1")


def _arquivos_rastreados(raiz: Path) -> list[str]:
    bruto = subprocess.run(
        ["git", "ls-files", "-z"], cwd=raiz, check=True, capture_output=True
    ).stdout
    return [p for p in bruto.decode("utf-8").split("\0") if p]


def _alvo(bruto: str) -> str:
    """Parte do alvo que identifica o arquivo: antes de `|` e de `#`, aparada."""
    alvo = bruto.split("|", 1)[0].rstrip("\\")  # `\|` aparece em tabelas
    return alvo.split("#", 1)[0].strip()


class _Indice:
    def __init__(self, rastreados: list[str]) -> None:
        self.caminhos = set(rastreados)
        self.nomes_md = {Path(p).stem for p in rastreados if p.endswith(".md")}
        self.nomes_arquivo = {Path(p).name for p in rastreados}

    def resolve(self, alvo: str) -> bool:
        if alvo == "":
            return False
        if "/" in alvo:
            return alvo in self.caminhos or f"{alvo}.md" in self.caminhos
        if alvo in self.nomes_md or f"{alvo}.md" in self.caminhos:
            return True
        # Anexo ou arquivo com extensão: Obsidian também resolve pelo nome do arquivo.
        return alvo in self.caminhos or alvo in self.nomes_arquivo

    def arquivos_de(self, alvo: str) -> list[str]:
        """Arquivos rastreados a que o alvo resolve (mesma regra de `resolve`)."""
        if alvo == "":
            return []
        if "/" in alvo:
            return [c for c in (alvo, f"{alvo}.md") if c in self.caminhos]
        return sorted(
            c for c in self.caminhos
            if (Path(c).stem == alvo and c.endswith(".md")) or Path(c).name == alvo or c == alvo
        )


def _links_da_nota(texto: str):
    """Gera (linha, embed, bruto, em_frontmatter) para cada link fora de código."""
    cerca: tuple[str, int] | None = None
    linhas = texto.splitlines()
    fim_frontmatter = 0  # número da linha do segundo `---`; 0 = sem frontmatter
    if linhas and linhas[0].strip() == "---":
        for i, linha in enumerate(linhas[1:], start=2):
            if linha.strip() == "---":
                fim_frontmatter = i
                break
    for numero, linha in enumerate(linhas, start=1):
        m = CERCA.match(linha)
        if cerca:
            if m and m.group(1)[0] == cerca[0] and len(m.group(1)) >= cerca[1] \
                    and not linha.strip().strip(cerca[0]):
                cerca = None
            continue
        if m:
            cerca = (m.group(1)[0], len(m.group(1)))
            continue
        for achado in LINK.finditer(CODIGO_EM_LINHA.sub(" ", linha)):
            yield numero, achado.group(1) == "!", achado.group(2), numero < fim_frontmatter


def quebrados(raiz: Path) -> list[str]:
    """Uma linha `arquivo:linha: [[alvo]]` por link que não resolve."""
    raiz = Path(raiz)
    rastreados = _arquivos_rastreados(raiz)
    indice = _Indice(rastreados)
    saida: list[str] = []
    for caminho in rastreados:
        if not caminho.endswith(".md") or caminho.startswith(PASTA_IGNORADA):
            continue
        arquivo = raiz / caminho
        if not arquivo.is_file():
            continue
        texto = arquivo.read_text(encoding="utf-8", errors="replace")
        for numero, embed, bruto, em_frontmatter in _links_da_nota(texto):
            alvo = _alvo(bruto)
            if em_frontmatter and not embed and bruto == "":
                continue  # `fonte: "[[]]"`: sem fonte externa
            if bruto.strip().startswith("#"):
                continue  # link para seção da própria nota
            if not indice.resolve(alvo):
                saida.append(f"{caminho}:{numero}: {'!' if embed else ''}[[{bruto}]]")
    return saida


def links_para_exemplo(raiz: Path) -> list[str]:
    """Uma linha `arquivo: wikilink para exemplo: alvo` por alvo.

    Vale para arquivo `fixo` ou `semente` cujo wikilink (ou embed) resolve em
    arquivo `exemplo`. Quem recusa os exemplos na instalação apaga esses arquivos:
    o que sobra não pode apontar para eles. Sem manifesto, não há o que acusar.
    """
    raiz = Path(raiz)
    if not (raiz / manifesto.NOME_MANIFESTO).is_file():
        return []
    itens = manifesto.carregar(raiz)
    rastreados = _arquivos_rastreados(raiz)
    indice = _Indice(rastreados)
    saida: list[str] = []
    for caminho in rastreados:
        if not caminho.endswith(".md") or caminho.startswith(PASTA_IGNORADA):
            continue
        if manifesto.tipo_de(itens, caminho) not in ("fixo", "semente"):
            continue
        arquivo = raiz / caminho
        if not arquivo.is_file():
            continue
        texto = arquivo.read_text(encoding="utf-8", errors="replace")
        vistos: set[str] = set()
        for _numero, _embed, bruto, _fm in _links_da_nota(texto):
            alvo = _alvo(bruto)
            if alvo in vistos or bruto.strip().startswith("#"):
                continue
            destinos = indice.arquivos_de(alvo)
            if any(manifesto.tipo_de(itens, d) == "exemplo" for d in destinos):
                vistos.add(alvo)
                saida.append(f"{caminho}: wikilink para exemplo: {alvo}")
    return saida


def main(raiz: Path | None = None) -> int:
    raiz = Path(raiz) if raiz else DIR_SCRIPTS.parent
    resultado = quebrados(raiz)
    for linha in resultado:
        print(linha)
    return 1 if resultado else 0


if __name__ == "__main__":
    sys.exit(main())
