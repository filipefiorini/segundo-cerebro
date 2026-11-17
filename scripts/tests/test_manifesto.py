"""Testes do manifesto de framework e do validador."""
import json
import subprocess
import sys
from pathlib import Path

import manifesto


def _repo_fixture(raiz: Path, arquivos: list[str], itens: list[dict]) -> Path:
    """Cria um repositório git mínimo com os arquivos e o manifesto dados."""
    subprocess.run(["git", "init", "-q"], cwd=raiz, check=True)
    for rel in arquivos:
        alvo = raiz / rel
        alvo.parent.mkdir(parents=True, exist_ok=True)
        alvo.write_text("x\n", encoding="utf-8")
    # o próprio manifesto também é rastreado e precisa estar coberto
    itens = itens + [{"caminho": manifesto.NOME_MANIFESTO, "tipo": "repo"}]
    manifesto_json = {"versao_schema": 1, "itens": itens}
    (raiz / manifesto.NOME_MANIFESTO).write_text(
        json.dumps(manifesto_json), encoding="utf-8"
    )
    subprocess.run(["git", "add", "-A"], cwd=raiz, check=True)
    return raiz


def test_carregar_devolve_itens(tmp_path):
    _repo_fixture(tmp_path, ["a.txt"], [{"caminho": "a.txt", "tipo": "repo"}])
    itens = manifesto.carregar(tmp_path)
    assert itens[0] == manifesto.Item(caminho="a.txt", tipo="repo")


def test_validar_erro_para_caminho_inexistente(tmp_path):
    _repo_fixture(
        tmp_path,
        ["a.txt"],
        [
            {"caminho": "a.txt", "tipo": "repo"},
            {"caminho": "_docs/", "tipo": "fixo"},
        ],
    )
    erros = manifesto.validar(tmp_path)
    assert "manifesto: caminho inexistente: _docs/" in erros


def test_validar_erro_para_arquivo_rastreado_fora_do_manifesto(tmp_path):
    _repo_fixture(
        tmp_path,
        ["a.txt", "scripts/x.py"],
        [{"caminho": "a.txt", "tipo": "repo"}],
    )
    erros = manifesto.validar(tmp_path)
    assert "manifesto: arquivo fora do manifesto: scripts/x.py" in erros


def test_validar_erro_para_tipo_invalido(tmp_path):
    _repo_fixture(tmp_path, ["a.txt"], [{"caminho": "a.txt", "tipo": "xyz"}])
    erros = manifesto.validar(tmp_path)
    assert "manifesto: tipo inválido 'xyz' em a.txt" in erros


def test_validar_lista_vazia_quando_tudo_coberto(tmp_path):
    _repo_fixture(
        tmp_path,
        ["a.txt", "pasta/b.txt"],
        [
            {"caminho": "a.txt", "tipo": "repo"},
            {"caminho": "pasta/", "tipo": "fixo"},
        ],
    )
    assert manifesto.validar(tmp_path) == []


def test_validar_glob_no_ultimo_segmento(tmp_path):
    _repo_fixture(
        tmp_path,
        ["LICENSE", "LICENSE-CONTEUDO"],
        [{"caminho": "LICENSE*", "tipo": "repo"}],
    )
    assert manifesto.validar(tmp_path) == []


def test_validar_gitkeep_coberto_pela_pasta(tmp_path):
    _repo_fixture(
        tmp_path,
        ["00 - INBOX/.gitkeep"],
        [{"caminho": "00 - INBOX/", "tipo": "semente"}],
    )
    assert manifesto.validar(tmp_path) == []


def test_validar_nome_com_acento_rastreado(tmp_path):
    _repo_fixture(
        tmp_path,
        ["02 - ÁREAS/.gitkeep"],
        [{"caminho": "02 - ÁREAS/", "tipo": "semente"}],
    )
    assert manifesto.validar(tmp_path) == []


def test_main_sai_com_zero_e_sem_saida_quando_valido(tmp_path, capsys):
    _repo_fixture(tmp_path, ["a.txt"], [{"caminho": "a.txt", "tipo": "repo"}])
    assert manifesto.main(tmp_path) == 0
    assert capsys.readouterr().out == ""


def test_main_sai_com_um_e_imprime_o_erro(tmp_path, capsys):
    _repo_fixture(tmp_path, ["a.txt", "b.txt"], [{"caminho": "a.txt", "tipo": "repo"}])
    assert manifesto.main(tmp_path) == 1
    assert "manifesto: arquivo fora do manifesto: b.txt" in capsys.readouterr().out


def test_script_via_subprocess_propaga_codigo_de_saida():
    """O script real, rodado como no hook, sai com 0 no repositório atual."""
    script = Path(__file__).resolve().parent.parent / "manifesto.py"
    r = subprocess.run(
        [sys.executable, str(script)], capture_output=True, text=True
    )
    assert r.returncode == 0, r.stdout


def test_tipo_de_arquivo_dentro_de_pasta_vence_pasta():
    itens = [manifesto.Item("_docs/", "fixo"), manifesto.Item("_docs/Roadmap.md", "semente")]
    assert manifesto.tipo_de(itens, "_docs/Roadmap.md") == "semente"
    assert manifesto.tipo_de(itens, "_docs/Manual.md") == "fixo"


def test_tipo_de_pasta_dentro_de_pasta():
    itens = [
        manifesto.Item(".obsidian/", "semente"),
        manifesto.Item(".obsidian/themes/", "fixo"),
    ]
    assert manifesto.tipo_de(itens, ".obsidian/themes/Dracula Official/theme.css") == "fixo"
    assert manifesto.tipo_de(itens, ".obsidian/app.json") == "semente"


def test_tipo_de_independe_da_ordem():
    a = [manifesto.Item("_docs/", "fixo"), manifesto.Item("_docs/Roadmap.md", "semente")]
    b = [
        manifesto.Item(".obsidian/", "semente"),
        manifesto.Item(".obsidian/themes/", "fixo"),
    ]
    for itens in (a, b):
        invertida = list(reversed(itens))
        for arquivo in ("_docs/Roadmap.md", "_docs/Manual.md",
                        ".obsidian/themes/x/theme.css", ".obsidian/app.json"):
            assert manifesto.tipo_de(itens, arquivo) == manifesto.tipo_de(invertida, arquivo)
    assert manifesto.tipo_de(list(reversed(a)), "_docs/Roadmap.md") == "semente"
    assert manifesto.tipo_de(list(reversed(b)), ".obsidian/app.json") == "semente"


def test_tipo_de_fora_do_manifesto():
    itens = [manifesto.Item("_docs/", "fixo")]
    assert manifesto.tipo_de(itens, "solto.md") is None


def test_validar_acusa_caminho_repetido(tmp_path):
    _repo_fixture(
        tmp_path,
        ["_docs/a.md"],
        [
            {"caminho": "_docs/", "tipo": "fixo"},
            {"caminho": "_docs/", "tipo": "fixo"},
        ],
    )
    assert "manifesto: caminho repetido: _docs/" in manifesto.validar(tmp_path)


def test_tipo_de_empate_e_deterministico():
    a = manifesto.Item("d/*.md", "fixo")
    b = manifesto.Item("d/f.md", "semente")
    assert len(a.caminho) == len(b.caminho)
    assert manifesto.tipo_de([a, b], "d/f.md") == "fixo"
    assert manifesto.tipo_de([b, a], "d/f.md") == "fixo"


def test_caminho_repetido_uma_mensagem(tmp_path):
    item = {"caminho": "_docs/", "tipo": "fixo"}
    _repo_fixture(tmp_path, ["_docs/a.md"], [item, item, item])
    erros = manifesto.validar(tmp_path)
    assert erros.count("manifesto: caminho repetido: _docs/") == 1
