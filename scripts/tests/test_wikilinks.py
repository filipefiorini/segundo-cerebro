"""Testes do verificador de wikilinks e embeds."""
import subprocess
from pathlib import Path

import wikilinks


def _montar(tmp_path: Path, arquivos: dict[str, str]) -> Path:
    """Cria um repositório git em tmp_path com os arquivos dados, todos rastreados."""
    subprocess.run(["git", "init", "-q"], cwd=tmp_path, check=True)
    for caminho, conteudo in arquivos.items():
        destino = tmp_path / caminho
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(conteudo, encoding="utf-8")
    subprocess.run(["git", "add", "-A"], cwd=tmp_path, check=True)
    return tmp_path


def test_fixture_do_plano(tmp_path):
    raiz = _montar(tmp_path, {
        "A.md": (
            "[[B]] ok\n"
            "[[C]] quebrado\n"
            "[[sub/B|apelido]] ok\n"
            "[[B#Seção]] ok\n"
            "![[_assets/ok.png]] ok\n"
            "![[_assets/nao.png]] quebrado\n"
            "```\n"
            "[[Fantasma]]\n"
            "```\n"
        ),
        "B.md": "texto\n",
        "sub/B.md": "texto\n",
        "_assets/ok.png": "x",
    })
    assert wikilinks.quebrados(raiz) == [
        "A.md:2: [[C]]",
        "A.md:6: ![[_assets/nao.png]]",
    ]


def test_alias_com_caminho(tmp_path):
    raiz = _montar(tmp_path, {"X.md": "[[a/b|c]]\n", "a/b.md": "t\n"})
    assert wikilinks.quebrados(raiz) == []


def test_caminho_com_e_sem_extensao(tmp_path):
    raiz = _montar(tmp_path, {
        "X.md": "[[a/b]] [[a/b.md]] [[a/z]]\n",
        "a/b.md": "t\n",
    })
    assert wikilinks.quebrados(raiz) == ["X.md:1: [[a/z]]"]


def test_nome_existente_so_no_vault_privado_e_reportado(tmp_path):
    raiz = _montar(tmp_path, {"X.md": "veja [[Nota Privada]]\n"})
    assert wikilinks.quebrados(raiz) == ["X.md:1: [[Nota Privada]]"]


def test_secoes_e_blocos_usam_so_o_nome(tmp_path):
    raiz = _montar(tmp_path, {
        "X.md": "[[B#^bloco]] [[B#Seção|alias]] [[#Local]] [[Z#S]]\n",
        "B.md": "t\n",
    })
    assert wikilinks.quebrados(raiz) == ["X.md:1: [[Z#S]]"]


def test_caixa_e_acentos_importam(tmp_path):
    raiz = _montar(tmp_path, {"X.md": "[[ação]] [[Ação]] [[b]]\n", "ação.md": "t\n", "B.md": "t\n"})
    assert wikilinks.quebrados(raiz) == ["X.md:1: [[Ação]]", "X.md:1: [[b]]"]


def test_alvo_vazio_e_aparado(tmp_path):
    raiz = _montar(tmp_path, {"X.md": "[[ B ]] [[]] [[ ]]\n", "B.md": "t\n"})
    assert wikilinks.quebrados(raiz) == ["X.md:1: [[]]", "X.md:1: [[ ]]"]


def test_embed_resolve_por_caminho_ou_nome_de_arquivo(tmp_path):
    raiz = _montar(tmp_path, {
        "X.md": "![[ok.png]] ![[_assets/ok.png]] ![[_assets/outro.png]] ![[B]]\n",
        "_assets/ok.png": "x",
        "B.md": "t\n",
    })
    assert wikilinks.quebrados(raiz) == ["X.md:1: ![[_assets/outro.png]]"]


def test_codigo_cercado_e_em_linha_ignorados(tmp_path):
    raiz = _montar(tmp_path, {
        "X.md": (
            "`[[Um]]` e [[Dois]]\n"
            "~~~python\n"
            "[[Tres]]\n"
            "~~~\n"
            "````\n"
            "```\n"
            "[[Quatro]]\n"
            "```\n"
            "````\n"
            "[[Cinco]]\n"
        ),
    })
    assert wikilinks.quebrados(raiz) == ["X.md:1: [[Dois]]", "X.md:10: [[Cinco]]"]


def test_templates_nao_sao_varridos_mas_servem_de_alvo(tmp_path):
    raiz = _montar(tmp_path, {
        "_templates/T.md": "[[<% tp.x %>]]\n",
        "X.md": "[[T]]\n",
    })
    assert wikilinks.quebrados(raiz) == []


def test_frontmatter_e_verificado(tmp_path):
    raiz = _montar(tmp_path, {"X.md": "---\nprojeto: \"[[Falta]]\"\n---\ncorpo\n"})
    assert wikilinks.quebrados(raiz) == ["X.md:2: [[Falta]]"]


def test_pipe_escapado_em_tabela(tmp_path):
    raiz = _montar(tmp_path, {"X.md": "| [[B\\|apelido]] |\n", "B.md": "t\n"})
    assert wikilinks.quebrados(raiz) == []


def test_main_imprime_e_retorna_codigo(tmp_path, capsys):
    raiz = _montar(tmp_path, {"X.md": "[[Falta]]\n"})
    assert wikilinks.main(raiz) == 1
    assert capsys.readouterr().out == "X.md:1: [[Falta]]\n"


def test_main_limpo_e_silencioso(tmp_path, capsys):
    raiz = _montar(tmp_path, {"X.md": "[[X]]\n"})
    assert wikilinks.main(raiz) == 0
    assert capsys.readouterr().out == ""


def test_fonte_vazia_no_frontmatter_passa(tmp_path):
    raiz = _montar(tmp_path, {"X.md": "---\nfonte: \"[[]]\"\nfonte_tipo: Reflexão\n---\ncorpo\n"})
    assert wikilinks.quebrados(raiz) == []


def test_alvo_vazio_no_corpo_continua_acusado(tmp_path):
    raiz = _montar(tmp_path, {"X.md": "---\nfonte: \"[[]]\"\n---\nveja [[]]\n"})
    assert wikilinks.quebrados(raiz) == ["X.md:4: [[]]"]


def test_fonte_inexistente_no_frontmatter_continua_acusada(tmp_path):
    raiz = _montar(tmp_path, {"X.md": "---\nfonte: \"[[Inexistente]]\"\n---\ncorpo\n"})
    assert wikilinks.quebrados(raiz) == ["X.md:2: [[Inexistente]]"]


MANIFESTO = (
    '{"versao_schema": 1, "itens": ['
    '{"caminho": "fixa/", "tipo": "fixo"},'
    '{"caminho": "semente/", "tipo": "semente"},'
    '{"caminho": "exemplos/", "tipo": "exemplo"},'
    '{"caminho": "README.md", "tipo": "repo"}'
    "]}"
)


def _com_manifesto(tmp_path: Path, arquivos: dict[str, str]) -> Path:
    return _montar(tmp_path, {"segundo-cerebro.manifest.json": MANIFESTO, **arquivos})


def test_fixo_com_wikilink_para_exemplo_acusa(tmp_path):
    raiz = _com_manifesto(tmp_path, {
        "fixa/A.md": "veja [[Modelo]]\n",
        "exemplos/Modelo.md": "t\n",
    })
    assert wikilinks.links_para_exemplo(raiz) == [
        "fixa/A.md: wikilink para exemplo: Modelo"
    ]


def test_semente_com_wikilink_para_exemplo_acusa(tmp_path):
    raiz = _com_manifesto(tmp_path, {
        "semente/A.md": "veja [[exemplos/Modelo|apelido]]\n",
        "exemplos/Modelo.md": "t\n",
    })
    assert wikilinks.links_para_exemplo(raiz) == [
        "semente/A.md: wikilink para exemplo: exemplos/Modelo"
    ]


def test_exemplo_para_exemplo_passa(tmp_path):
    raiz = _com_manifesto(tmp_path, {
        "exemplos/A.md": "veja [[Modelo]]\n",
        "exemplos/Modelo.md": "t\n",
    })
    assert wikilinks.links_para_exemplo(raiz) == []


def test_repo_para_exemplo_passa(tmp_path):
    raiz = _com_manifesto(tmp_path, {
        "README.md": "veja [[Modelo]]\n",
        "exemplos/Modelo.md": "t\n",
    })
    assert wikilinks.links_para_exemplo(raiz) == []


def test_link_para_nao_exemplo_e_link_quebrado_nao_entram(tmp_path):
    raiz = _com_manifesto(tmp_path, {
        "fixa/A.md": "[[Outra]] [[Falta]]\n",
        "fixa/Outra.md": "t\n",
    })
    assert wikilinks.links_para_exemplo(raiz) == []


def test_sem_manifesto_nao_acusa(tmp_path):
    raiz = _montar(tmp_path, {"A.md": "[[B]]\n", "B.md": "t\n"})
    assert wikilinks.links_para_exemplo(raiz) == []
