"""Verificador único do repositório: manifesto, segredos e nomes, wikilinks, release.

Chamado pelo hook pre-commit. Sai com 1 se qualquer bloco tiver item.
"""
from pathlib import Path

import filtro
import manifesto
import release
import wikilinks


def main(raiz: Path | None = None) -> int:
    raiz = raiz or Path(__file__).resolve().parent.parent
    blocos = [
        ("manifesto", manifesto.validar),
        ("segredos e nomes", filtro.varrer),
        ("wikilinks", lambda r: wikilinks.quebrados(r) + wikilinks.links_para_exemplo(r)),
        ("release", release.validar),
    ]
    falhou = False
    for titulo, funcao in blocos:
        itens = funcao(raiz)
        print(f"== {titulo} ==")
        print("\n".join(itens) if itens else "ok")
        falhou = falhou or bool(itens)
    return 1 if falhou else 0


if __name__ == "__main__":
    raise SystemExit(main())
