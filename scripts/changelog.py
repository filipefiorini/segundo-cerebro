"""Leitura da marcação `**Publicar:**` no changelog do vault do mantenedor."""
from __future__ import annotations

import re
from dataclasses import dataclass

_CABECALHO = re.compile(r"^### v(\d+\.\d+\.\d+) — \d{4}-\d{2}-\d{2}(?:\s.*)?$")
_ENTRADA_QUALQUER = re.compile(r"^### v")
_PUBLICAR = re.compile(r"^\*\*Publicar:\*\*[ \t]*(.*?)\s*$")


@dataclass(frozen=True)
class Entrada:
    versao: str
    publicar: str | None


def entradas(texto: str) -> list[Entrada]:
    """Entradas `### vX.Y.Z — AAAA-MM-DD[ sufixo]` na ordem do texto, com o valor de `Publicar:`."""
    itens: list[Entrada] = []
    versao: str | None = None
    publicar: str | None = None
    for linha in texto.splitlines():
        if _ENTRADA_QUALQUER.match(linha):
            if versao is not None:
                itens.append(Entrada(versao, publicar))
            achado = _CABECALHO.match(linha)
            versao, publicar = (achado.group(1), None) if achado else (None, None)
        elif versao is not None and publicar is None:
            achado = _PUBLICAR.match(linha)
            if achado and achado.group(1):
                publicar = achado.group(1)
    if versao is not None:
        itens.append(Entrada(versao, publicar))
    return itens


def fora_do_formato(texto: str) -> list[str]:
    """Linhas `### v...` que `entradas` não reconhece (nenhum registro se perde)."""
    return [
        linha.rstrip()
        for linha in texto.splitlines()
        if _ENTRADA_QUALQUER.match(linha) and not _CABECALHO.match(linha)
    ]


def pendentes_de_publicacao(itens: list[Entrada]) -> list[str]:
    """Versões marcadas exatamente com `sim`."""
    return [i.versao for i in itens if i.publicar == "sim"]


def _numeros(versao: str) -> tuple[int, ...]:
    return tuple(int(p) for p in versao.split("."))


def sem_marcacao(itens: list[Entrada], desde: str = "3.31.0") -> list[str]:
    """Versões a partir de `desde` sem a linha `Publicar:` (nenhum registro se perde)."""
    minimo = _numeros(desde)
    return [i.versao for i in itens if i.publicar is None and _numeros(i.versao) >= minimo]
