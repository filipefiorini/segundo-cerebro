"""Testes da release: lista de arquivos, hashes e histórico de mudanças."""
import hashlib
import json
import subprocess
from pathlib import Path

import manifesto
import release


def _repo(raiz: Path, arquivos: dict[str, bytes], itens: list[dict]) -> Path:
    """Repositório git mínimo, com LF no índice (como o repositório real)."""
    subprocess.run(["git", "init", "-q"], cwd=raiz, check=True)
    (raiz / ".gitattributes").write_bytes(b"* text=auto eol=lf\n")
    for rel, conteudo in arquivos.items():
        alvo = raiz / rel
        alvo.parent.mkdir(parents=True, exist_ok=True)
        alvo.write_bytes(conteudo)
    itens = itens + [
        {"caminho": ".gitattributes", "tipo": "repo"},
        {"caminho": manifesto.NOME_MANIFESTO, "tipo": "repo"},
    ]
    (raiz / manifesto.NOME_MANIFESTO).write_text(
        json.dumps({"versao_schema": 1, "itens": itens}), encoding="utf-8"
    )
    subprocess.run(["git", "add", "-A"], cwd=raiz, check=True)
    return raiz


def _mudancas(raiz: Path, **campos) -> None:
    dados = {"removidos": [], "renomeados": [], "migracoes": []}
    dados.update(campos)
    (raiz / release.ARQUIVO_MUDANCAS).write_text(json.dumps(dados), encoding="utf-8")


def _repo_simples(raiz: Path) -> Path:
    return _repo(
        raiz,
        {"CLAUDE.md": b"a\n", "_docs/Manual.md": b"b\n", release.ARQUIVO_MUDANCAS: b"{}"},
        [
            {"caminho": "CLAUDE.md", "tipo": "fixo"},
            {"caminho": "_docs/", "tipo": "fixo"},
            {"caminho": release.ARQUIVO_RELEASE, "tipo": "fixo"},
            {"caminho": release.ARQUIVO_MUDANCAS, "tipo": "repo"},
        ],
    )


def test_sha256_arquivo_bytes_crus(tmp_path):
    arq = tmp_path / "a.txt"
    arq.write_bytes(b"a\r\n")
    assert release.sha256_arquivo(arq) == hashlib.sha256(b"a\r\n").hexdigest()


def test_sha256_indice_ignora_crlf_da_arvore(tmp_path):
    _repo(tmp_path, {"a.md": b"a\r\nb\r\n"}, [{"caminho": "a.md", "tipo": "fixo"}])
    assert (tmp_path / "a.md").read_bytes() == b"a\r\nb\r\n"
    esperado = hashlib.sha256(b"a\nb\n").hexdigest()
    assert release.sha256_indice(tmp_path, "a.md") == esperado
    assert release.sha256_arquivo(tmp_path / "a.md") != esperado


def test_arquivos_da_release_sem_repo_e_sem_o_proprio(tmp_path):
    _repo(
        tmp_path,
        {
            "README.md": b"x\n",
            "CLAUDE.md": b"x\n",
            "_docs/Manual.md": b"x\n",
            "_docs/Roadmap.md": b"x\n",
            release.ARQUIVO_RELEASE: b"{}",
        },
        [
            {"caminho": "README.md", "tipo": "repo"},
            {"caminho": "CLAUDE.md", "tipo": "fixo"},
            {"caminho": "_docs/", "tipo": "fixo"},
            {"caminho": "_docs/Roadmap.md", "tipo": "semente"},
            {"caminho": release.ARQUIVO_RELEASE, "tipo": "fixo"},
        ],
    )
    assert release.arquivos_da_release(tmp_path) == {
        "CLAUDE.md": "fixo",
        "_docs/Manual.md": "fixo",
        "_docs/Roadmap.md": "semente",
    }


def test_arquivos_da_release_caminho_com_acento_e_espaco(tmp_path):
    _repo(
        tmp_path,
        {"02 - ÁREAS/Nota.md": b"x\n"},
        [{"caminho": "02 - ÁREAS/", "tipo": "semente"}],
    )
    assert release.arquivos_da_release(tmp_path) == {"02 - ÁREAS/Nota.md": "semente"}
    assert len(release.sha256_indice(tmp_path, "02 - ÁREAS/Nota.md")) == 64


def test_gerar_acumula_historico(tmp_path):
    _repo_simples(tmp_path)
    anterior = {
        "versao_schema": 1,
        "versao": "1.0.0",
        "arquivos": [],
        "historico": [
            {"versao": "1.0.0", "removidos": [], "renomeados": [], "migracoes": []}
        ],
    }
    (tmp_path / release.ARQUIVO_RELEASE).write_text(json.dumps(anterior), encoding="utf-8")
    _mudancas(
        tmp_path,
        removidos=["_templates/Velho.md"],
        renomeados=[{"de": "a.md", "para": "b.md"}],
    )
    dados = release.gerar(tmp_path, "1.1.0")
    assert dados["versao"] == "1.1.0"
    assert len(dados["historico"]) == 2
    ultimo = dados["historico"][-1]
    assert ultimo["versao"] == "1.1.0"
    assert ultimo["removidos"] == ["_templates/Velho.md"]
    assert ultimo["renomeados"] == [{"de": "a.md", "para": "b.md"}]
    caminhos = [a["caminho"] for a in dados["arquivos"]]
    assert caminhos == sorted(caminhos) and caminhos
    assert all(len(a["sha256"]) == 64 for a in dados["arquivos"])
    assert release.validar_release(dados) == []


def test_gerar_mesma_versao_nao_duplica_historico(tmp_path):
    _repo_simples(tmp_path)
    _mudancas(tmp_path, removidos=["x.md"])
    release.gravar(tmp_path, release.gerar(tmp_path, "1.1.0"))
    _mudancas(tmp_path)
    dados = release.gerar(tmp_path, "1.1.0")
    assert [h["versao"] for h in dados["historico"]] == ["1.1.0"]
    assert dados["historico"][0]["removidos"] == ["x.md"]


def test_gerar_dev_nao_cria_item_de_historico(tmp_path):
    _repo_simples(tmp_path)
    assert release.gerar(tmp_path, "1.1.0-dev")["historico"] == []


def test_validar_release_acusa_campos():
    ok = {
        "versao_schema": 1,
        "versao": "1.0.0",
        "arquivos": [{"caminho": "a.md", "tipo": "fixo", "sha256": "0" * 64}],
        "historico": [],
    }
    assert release.validar_release(ok) == []

    sem_versao = {k: v for k, v in ok.items() if k != "versao"}
    assert any("versao" in e for e in release.validar_release(sem_versao))

    sem_para = dict(
        ok,
        historico=[
            {"versao": "1.0.0", "removidos": [], "renomeados": [{"de": "a"}], "migracoes": []}
        ],
    )
    assert any("para" in e for e in release.validar_release(sem_para))

    com_pontos = dict(ok, arquivos=[dict(ok["arquivos"][0], caminho="../fora.md")])
    assert any(".." in e for e in release.validar_release(com_pontos))


def test_validar_mudancas_acusa_campos():
    assert release.validar_mudancas({"removidos": [], "renomeados": [], "migracoes": []}) == []
    assert any("removidos" in e for e in release.validar_mudancas({"renomeados": [], "migracoes": []}))
    erros = release.validar_mudancas(
        {"removidos": [], "renomeados": [], "migracoes": [{"id": "m1", "descricao": "d"}]}
    )
    assert any("instrucoes" in e for e in erros)


def test_validar_acusa_lista_defasada(tmp_path):
    _repo_simples(tmp_path)
    _mudancas(tmp_path)
    release.gravar(tmp_path, release.gerar(tmp_path, "1.0.0-dev"))
    subprocess.run(["git", "add", "-A"], cwd=tmp_path, check=True)
    assert release.validar(tmp_path) == []

    (tmp_path / "_docs" / "Novo.md").write_bytes(b"n\n")
    subprocess.run(["git", "add", "-A"], cwd=tmp_path, check=True)
    assert "release: lista defasada: _docs/Novo.md" in release.validar(tmp_path)

    release.gravar(tmp_path, release.atualizar_lista(tmp_path))
    assert release.validar(tmp_path) == []


def test_atualizar_lista_preserva_versao_e_historico(tmp_path):
    _repo_simples(tmp_path)
    _mudancas(tmp_path, removidos=["x.md"])
    release.gravar(tmp_path, release.gerar(tmp_path, "1.2.0"))
    (tmp_path / "_docs" / "Novo.md").write_bytes(b"n\n")
    subprocess.run(["git", "add", "-A"], cwd=tmp_path, check=True)
    dados = release.atualizar_lista(tmp_path)
    assert dados["versao"] == "1.2.0"
    assert [h["versao"] for h in dados["historico"]] == ["1.2.0"]
    assert "_docs/Novo.md" in [a["caminho"] for a in dados["arquivos"]]


def _release_em_dia(raiz: Path) -> None:
    _repo_simples(raiz)
    _mudancas(raiz)
    release.gravar(raiz, release.gerar(raiz, "1.0.0-dev"))
    subprocess.run(["git", "add", "-A"], cwd=raiz, check=True)


def test_validar_tipo_defasado_separado_de_lista_defasada(tmp_path):
    _release_em_dia(tmp_path)
    dados = json.loads((tmp_path / release.ARQUIVO_RELEASE).read_text(encoding="utf-8"))
    for a in dados["arquivos"]:
        if a["caminho"] == "CLAUDE.md":
            a["tipo"] = "semente"
    release.gravar(tmp_path, dados)
    erros = release.validar(tmp_path)
    assert "release: tipo defasado: CLAUDE.md" in erros
    assert "release: lista defasada: CLAUDE.md" not in erros


def test_validar_acusa_caminho_repetido(tmp_path):
    _release_em_dia(tmp_path)
    dados = json.loads((tmp_path / release.ARQUIVO_RELEASE).read_text(encoding="utf-8"))
    dados["arquivos"].append(dict(dados["arquivos"][0]))
    dados["arquivos"].append(dict(dados["arquivos"][0]))
    release.gravar(tmp_path, dados)
    repetido = dados["arquivos"][0]["caminho"]
    erros = release.validar(tmp_path)
    assert erros.count(f"release: caminho repetido: {repetido}") == 1


def test_validar_json_malformado_cita_o_arquivo(tmp_path):
    _release_em_dia(tmp_path)
    (tmp_path / release.ARQUIVO_MUDANCAS).write_text("{ quebrado", encoding="utf-8")
    assert release.validar(tmp_path) == [f"release: JSON inválido: {release.ARQUIVO_MUDANCAS}"]
    (tmp_path / release.ARQUIVO_RELEASE).write_text("{ quebrado", encoding="utf-8")
    assert release.validar(tmp_path) == [f"release: JSON inválido: {release.ARQUIVO_RELEASE}"]
