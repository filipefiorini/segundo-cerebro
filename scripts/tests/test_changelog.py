"""Testes da leitura da marcação `Publicar:` do changelog do mantenedor."""
import changelog
from changelog import Entrada

TEXTO = """# Changelog

### v3.31.0 — 2026-11-10
- algo
**Publicar:** sim

### v3.30.0 — 2026-11-09
**Publicar:** sim, publicado como v1.0.0

### v3.26.0 — 2026-11-01
- sem linha
"""


def test_entradas_le_publicar():
    assert changelog.entradas(TEXTO) == [
        Entrada("3.31.0", "sim"),
        Entrada("3.30.0", "sim, publicado como v1.0.0"),
        Entrada("3.26.0", None),
    ]


def test_publicar_nao_vaza_para_a_entrada_seguinte():
    texto = "### v3.2.0 — 2026-01-02\n- x\n\n### v3.1.0 — 2026-01-01\n**Publicar:** sim\n"
    assert changelog.entradas(texto) == [Entrada("3.2.0", None), Entrada("3.1.0", "sim")]


def test_pendentes_e_sem_marcacao():
    itens = changelog.entradas(TEXTO)
    assert changelog.pendentes_de_publicacao(itens) == ["3.31.0"]
    itens.insert(0, Entrada("3.32.0", None))
    assert changelog.sem_marcacao(itens) == ["3.32.0"]


def test_sem_marcacao_compara_pelos_numeros():
    itens = [Entrada("3.100.0", None), Entrada("3.9.0", None), Entrada("3.31.0", None)]
    assert changelog.sem_marcacao(itens) == ["3.100.0", "3.31.0"]


def test_cabecalho_com_sufixo_apos_a_data_e_lido():
    texto = (
        "### v2.3.0 — 2026-04-05 (sessão 2)\n**Publicar:** sim\n\n"
        "### v2.1.0 — 2026-03-25 a 26\n- x\n"
    )
    assert changelog.entradas(texto) == [Entrada("2.3.0", "sim"), Entrada("2.1.0", None)]
    assert changelog.fora_do_formato(texto) == []


def test_fora_do_formato_lista_o_cabecalho_nao_reconhecido():
    texto = "### v3.1.0 — 2026-01-01\n\n### v3.0 sem data\n- x\n\n### Outro título\n"
    assert changelog.fora_do_formato(texto) == ["### v3.0 sem data"]
    assert changelog.entradas(texto) == [Entrada("3.1.0", None)]


def test_publicar_vazio_conta_como_sem_marcacao():
    texto = "### v3.40.0 — 2026-11-10\n- algo\n**Publicar:**\n\n### v3.41.0 — 2026-11-11\n**Publicar:**   \n"
    itens = changelog.entradas(texto)
    assert [i.publicar for i in itens] == [None, None]
    assert changelog.sem_marcacao(itens) == ["3.40.0", "3.41.0"]
