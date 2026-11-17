"""Testes do CLI exportar.py: porte, preparo e empacotamento."""
import hashlib
import json
import os
import subprocess
import sys
import zipfile
from pathlib import Path

import pytest

import exportar
import manifesto
import release

_IDENTIDADE = ["-c", "user.name=Teste", "-c", "user.email=" + "teste" + "@" + "exemplo.test"]


def _git(raiz: Path, *args: str) -> str:
    r = subprocess.run(
        ["git", *_IDENTIDADE, *args], cwd=raiz, check=True, capture_output=True
    )
    return r.stdout.decode("utf-8")


def _commit(raiz: Path, msg: str = "teste") -> None:
    _git(raiz, "add", "-A")
    _git(raiz, "commit", "-q", "-m", msg)


@pytest.fixture
def repo(tmp_path):
    """Repositório mínimo e válido para o verificador, com a release inicial commitada."""
    raiz = tmp_path / "repo"
    raiz.mkdir()
    subprocess.run(["git", "init", "-q"], cwd=raiz, check=True)
    (raiz / ".gitattributes").write_bytes(b"* text=auto eol=lf\n")
    (raiz / "CLAUDE.md").write_bytes(b"regras\r\nde teste\r\n")  # CRLF na árvore
    (raiz / "_docs").mkdir()
    (raiz / "_docs" / "Manual.md").write_bytes(b"manual\n")
    (raiz / "VERSION").write_bytes(b"1.0.0-dev\n")
    (raiz / "_docs" / "CHANGELOG.md").write_bytes(b"# Changelog\n\n## 1.1.0\n\nMudancas.\n")
    (raiz / release.ARQUIVO_MUDANCAS).write_text(
        json.dumps({"removidos": [], "renomeados": [], "migracoes": []}), encoding="utf-8"
    )
    itens = [
        {"caminho": ".gitattributes", "tipo": "repo"},
        {"caminho": manifesto.NOME_MANIFESTO, "tipo": "repo"},
        {"caminho": "VERSION", "tipo": "repo"},
        {"caminho": release.ARQUIVO_MUDANCAS, "tipo": "repo"},
        {"caminho": "CLAUDE.md", "tipo": "fixo"},
        {"caminho": "_docs/", "tipo": "fixo"},
        {"caminho": "_docs/CHANGELOG.md", "tipo": "fixo"},
        {"caminho": release.ARQUIVO_RELEASE, "tipo": "fixo"},
    ]
    (raiz / manifesto.NOME_MANIFESTO).write_text(
        json.dumps({"versao_schema": 1, "itens": itens}), encoding="utf-8"
    )
    _git(raiz, "add", "-A")
    release.gravar(raiz, release.gerar(raiz, "1.0.0-dev"))
    _commit(raiz, "inicial")
    return raiz


def _versao(raiz: Path, texto: str) -> None:
    (raiz / "VERSION").write_bytes((texto + "\n").encode("utf-8"))
    _commit(raiz, "versao")


def _privado(tmp_path: Path) -> Path:
    privado = tmp_path / "privado"
    privado.mkdir()
    (privado / "CLAUDE.md").write_text("regras\n", encoding="utf-8")
    (privado / "_docs").mkdir()
    (privado / "_docs" / "a.md").write_text("a\n", encoding="utf-8")
    (privado / "_docs" / "b.md").write_text("b\n", encoding="utf-8")
    return privado


def _release_json(raiz: Path) -> dict:
    return json.loads((raiz / release.ARQUIVO_RELEASE).read_text(encoding="utf-8"))


# ---------------------------------------------------------------- porte


def test_pendencias_rc_e_saida(tmp_path, capsys):
    privado = _privado(tmp_path)
    (privado / "_docs" / "a.md").unlink()
    (privado / "_docs" / "b.md").unlink()
    registro = tmp_path / "reg.json"
    base = ["--privado", str(privado), "--registro", str(registro)]
    assert exportar.main(["pendencias", *base]) == 1
    assert "novo: CLAUDE.md -> CLAUDE.md" in capsys.readouterr().out
    marcar = ["marcar", *base, "--arquivo", "CLAUDE.md", "--estado", "portado"]
    assert exportar.main(marcar) == 0
    capsys.readouterr()
    assert exportar.main(["pendencias", *base]) == 0
    assert "nenhuma pendência de porte" in capsys.readouterr().out


def test_marcar_varios_arquivos(tmp_path):
    privado = _privado(tmp_path)
    registro = tmp_path / "reg.json"
    rc = exportar.main([
        "marcar", "--privado", str(privado), "--registro", str(registro),
        "--arquivo", "_docs/a.md", "_docs/b.md", "--estado", "so-privado",
    ])
    assert rc == 0
    pares = json.loads(registro.read_text(encoding="utf-8"))["pares"]
    assert [p["privado"] for p in pares] == ["_docs/a.md", "_docs/b.md"]
    assert {p["estado"] for p in pares} == {"so-privado"}


def test_marcar_publico_com_varios_arquivos_recusa(tmp_path):
    privado = _privado(tmp_path)
    registro = tmp_path / "reg.json"
    rc = exportar.main([
        "marcar", "--privado", str(privado), "--registro", str(registro),
        "--arquivo", "_docs/a.md", "_docs/b.md", "--estado", "portado",
        "--publico", "_docs/x.md",
    ])
    assert rc != 0
    assert not registro.exists()


def test_changelog_rc(tmp_path, capsys):
    privado = tmp_path / "privado"
    privado.mkdir()
    (privado / "SEGUNDO-CEREBRO-VERSION").write_text(
        "3.31.0\n\n### v3.31.0 — 2026-11-01\n**Publicar:** sim\n", encoding="utf-8"
    )
    assert exportar.main(["changelog", "--privado", str(privado)]) == 1
    assert "a publicar: 3.31.0" in capsys.readouterr().out


def test_changelog_sem_pendencia_rc_0(tmp_path):
    privado = tmp_path / "privado"
    privado.mkdir()
    (privado / "SEGUNDO-CEREBRO-VERSION").write_text(
        "### v3.31.0 — 2026-11-01\n**Publicar:** não\n", encoding="utf-8"
    )
    assert exportar.main(["changelog", "--privado", str(privado)]) == 0


# ---------------------------------------------------------------- lista


def test_lista_atualiza_arquivos(repo):
    (repo / "_docs" / "Novo.md").write_bytes(b"novo\n")
    _git(repo, "add", "-A")
    assert exportar.main(["lista"], raiz=repo) == 0
    caminhos = [a["caminho"] for a in _release_json(repo)["arquivos"]]
    assert "_docs/Novo.md" in caminhos


# ---------------------------------------------------------------- preparar


def test_preparar_recusa_versao_diferente(repo):
    antes = (repo / release.ARQUIVO_RELEASE).read_bytes()
    assert exportar.main(["preparar", "--versao", "1.1.0"], raiz=repo) == 1
    assert (repo / release.ARQUIVO_RELEASE).read_bytes() == antes


def test_preparar_recusa_changelog_sem_secao(repo):
    _versao(repo, "1.2.0")
    antes = (repo / release.ARQUIVO_RELEASE).read_bytes()
    assert exportar.main(["preparar", "--versao", "1.2.0"], raiz=repo) == 1
    assert (repo / release.ARQUIVO_RELEASE).read_bytes() == antes


def test_preparar_recusa_pendencia_de_porte(repo, tmp_path):
    _versao(repo, "1.1.0")
    privado = _privado(tmp_path)
    registro = tmp_path / "reg.json"
    antes = (repo / release.ARQUIVO_RELEASE).read_bytes()
    rc = exportar.main(
        ["preparar", "--versao", "1.1.0", "--privado", str(privado), "--registro", str(registro)],
        raiz=repo,
    )
    assert rc == 1
    assert (repo / release.ARQUIVO_RELEASE).read_bytes() == antes


def test_preparar_grava_release_e_zera_mudancas(repo, capsys):
    _versao(repo, "1.1.0")
    (repo / release.ARQUIVO_MUDANCAS).write_text(
        json.dumps({"removidos": ["velho.md"], "renomeados": [], "migracoes": []}),
        encoding="utf-8",
    )
    assert exportar.main(["preparar", "--versao", "1.1.0"], raiz=repo) == 0
    assert "porte não conferido" in capsys.readouterr().out
    dados = _release_json(repo)
    assert dados["versao"] == "1.1.0"
    assert dados["historico"][0]["removidos"] == ["velho.md"]
    mudancas = json.loads((repo / release.ARQUIVO_MUDANCAS).read_text(encoding="utf-8"))
    assert mudancas == {"removidos": [], "renomeados": [], "migracoes": []}


def _mudancas(repo, **campos):
    dados = {"removidos": [], "renomeados": [], "migracoes": []}
    dados.update(campos)
    (repo / release.ARQUIVO_MUDANCAS).write_text(json.dumps(dados), encoding="utf-8")


def test_preparar_recusa_removido_ainda_citado(repo, capsys):
    _versao(repo, "1.1.0")
    (repo / "_docs" / "Template de Livro.md").write_bytes(b"livro\n")
    (repo / "_docs" / "Ferramentas.md").write_bytes(b"uso\nveja o [[Template de Livro]] aqui\n")
    _git(repo, "add", "-A")
    release.gravar(repo, release.atualizar_lista(repo))
    _commit(repo)
    _mudancas(repo, removidos=["_docs/Template de Livro.md"])
    antes = (repo / release.ARQUIVO_RELEASE).read_bytes()
    mud_antes = (repo / release.ARQUIVO_MUDANCAS).read_bytes()
    assert exportar.main(["preparar", "--versao", "1.1.0"], raiz=repo) == 1
    saida = capsys.readouterr()
    assert (
        "aviso: _docs/Template de Livro.md ainda citado em _docs/Ferramentas.md:2"
        in saida.out + saida.err
    )
    assert (repo / release.ARQUIVO_RELEASE).read_bytes() == antes
    assert (repo / release.ARQUIVO_MUDANCAS).read_bytes() == mud_antes


def test_preparar_recusa_renomeado_com_nome_antigo_citado(repo, capsys):
    _versao(repo, "1.1.0")
    (repo / "_docs" / "Antigo.md").write_bytes(b"x\n")
    (repo / "_docs" / "Manual.md").write_bytes(b"manual cita [[Antigo]]\n")
    _git(repo, "add", "-A")
    release.gravar(repo, release.atualizar_lista(repo))
    _commit(repo)
    _mudancas(repo, renomeados=[{"de": "_docs/Antigo.md", "para": "_docs/Novo.md"}])
    assert exportar.main(["preparar", "--versao", "1.1.0"], raiz=repo) == 1
    saida = capsys.readouterr()
    assert "ainda citado em _docs/Manual.md:1" in saida.out + saida.err


def test_preparar_aceita_removido_sem_citacao(repo):
    _versao(repo, "1.1.0")
    (repo / "_docs" / "Velho.md").write_bytes(b"x\n")
    _git(repo, "add", "-A")
    release.gravar(repo, release.atualizar_lista(repo))
    _commit(repo)
    _mudancas(repo, removidos=["_docs/Velho.md"])
    assert exportar.main(["preparar", "--versao", "1.1.0"], raiz=repo) == 0


def test_preparar_com_porte_em_dia(repo, tmp_path):
    _versao(repo, "1.1.0")
    privado = _privado(tmp_path)
    registro = tmp_path / "reg.json"
    base = ["--privado", str(privado), "--registro", str(registro)]
    arquivos = ["CLAUDE.md", "_docs/a.md", "_docs/b.md"]
    assert exportar.main(["marcar", *base, "--arquivo", *arquivos, "--estado", "so-privado"]) == 0
    assert exportar.main(["preparar", "--versao", "1.1.0", *base], raiz=repo) == 0


def test_preparar_duas_vezes(repo):
    _versao(repo, "1.1.0")
    assert exportar.main(["preparar", "--versao", "1.1.0"], raiz=repo) == 0
    _commit(repo, "release 1.1.0")
    (repo / "_docs" / "Manual.md").write_bytes(b"manual corrigido\n")
    _commit(repo, "correcao")
    assert exportar.main(["preparar", "--versao", "1.1.0"], raiz=repo) == 0
    dados = _release_json(repo)
    assert [h["versao"] for h in dados["historico"]] == ["1.1.0"]
    hash_novo = hashlib.sha256(b"manual corrigido\n").hexdigest()
    por_caminho = {a["caminho"]: a["sha256"] for a in dados["arquivos"]}
    assert por_caminho["_docs/Manual.md"] == hash_novo


# ---------------------------------------------------------------- empacotar


def _preparada(repo: Path) -> None:
    _versao(repo, "1.1.0")
    assert exportar.main(["preparar", "--versao", "1.1.0"], raiz=repo) == 0
    _commit(repo, "release 1.1.0")


def _tags(repo: Path) -> list[str]:
    return _git(repo, "tag").split()


def test_empacotar_recusa_arvore_suja(repo):
    _preparada(repo)
    (repo / "sujo.txt").write_bytes(b"x")
    assert exportar.main(["empacotar", "--versao", "1.1.0"], raiz=repo) == 1
    assert _tags(repo) == []


def test_empacotar_recusa_versao_do_head_diferente(repo):
    _preparada(repo)
    assert exportar.main(["empacotar", "--versao", "1.2.0"], raiz=repo) == 1
    assert _tags(repo) == []


def test_empacotar_zip_bate_com_os_hashes(repo):
    _preparada(repo)
    # a árvore de trabalho continua com CRLF; o zip leva o que o Git guarda
    assert (repo / "CLAUDE.md").read_bytes() == b"regras\r\nde teste\r\n"
    assert exportar.main(["empacotar", "--versao", "1.1.0"], raiz=repo) == 0
    assert _tags(repo) == ["v1.1.0"]
    zip_caminho = repo / "dist" / "segundo-cerebro-v1.1.0.zip"
    arquivos = _release_json(repo)["arquivos"]
    assert arquivos
    with zipfile.ZipFile(zip_caminho) as z:
        for item in arquivos:
            conteudo = z.read("segundo-cerebro-v1.1.0/" + item["caminho"])
            assert hashlib.sha256(conteudo).hexdigest() == item["sha256"], item["caminho"]
        assert z.read("segundo-cerebro-v1.1.0/CLAUDE.md") == b"regras\nde teste\n"


def test_empacotar_recusa_zip_com_hash_diferente(repo, capsys):
    _preparada(repo)
    dados = _release_json(repo)
    dados["arquivos"][0]["sha256"] = "0" * 64
    release.gravar(repo, dados)
    _commit(repo, "hash trocado")
    assert exportar.main(["empacotar", "--versao", "1.1.0"], raiz=repo) == 1
    assert dados["arquivos"][0]["caminho"] in capsys.readouterr().out
    assert _tags(repo) == []
    assert not (repo / "dist" / "segundo-cerebro-v1.1.0.zip").exists()


def test_help_lista_os_seis_subcomandos(capsys):
    with pytest.raises(SystemExit) as e:
        exportar.main(["--help"])
    assert e.value.code == 0
    saida = capsys.readouterr().out
    for nome in ("pendencias", "marcar", "changelog", "lista", "preparar", "empacotar"):
        assert nome in saida


def test_preparar_e_empacotar_com_sufixo(repo):
    (repo / "_docs" / "CHANGELOG.md").write_bytes(b"# Changelog\n\n## 1.0.0-ensaio\n\nEnsaio.\n")
    _versao(repo, "1.0.0-ensaio")
    assert exportar.main(["preparar", "--versao", "1.0.0-ensaio"], raiz=repo) == 0
    dados = _release_json(repo)
    assert dados["versao"] == "1.0.0-ensaio"
    assert [h["versao"] for h in dados["historico"]] == ["1.0.0-ensaio"]
    _commit(repo, "release ensaio")
    assert exportar.main(["empacotar", "--versao", "1.0.0-ensaio"], raiz=repo) == 0
    assert _tags(repo) == ["v1.0.0-ensaio"]
    zip_caminho = repo / "dist" / "segundo-cerebro-v1.0.0-ensaio.zip"
    with zipfile.ZipFile(zip_caminho) as z:
        for item in dados["arquivos"]:
            conteudo = z.read("segundo-cerebro-v1.0.0-ensaio/" + item["caminho"])
            assert hashlib.sha256(conteudo).hexdigest() == item["sha256"], item["caminho"]


def test_changelog_acusa_cabecalho_fora_do_formato(tmp_path, capsys):
    privado = tmp_path / "privado"
    privado.mkdir()
    (privado / "SEGUNDO-CEREBRO-VERSION").write_text(
        "### v3.31.0 — 2026-11-01\n**Publicar:** não\n\n### v3.30 sem data\n", encoding="utf-8"
    )
    assert exportar.main(["changelog", "--privado", str(privado)]) == 1
    assert "cabeçalho fora do formato: ### v3.30 sem data" in capsys.readouterr().out


def test_changelog_aceita_cabecalho_com_sufixo(tmp_path):
    privado = tmp_path / "privado"
    privado.mkdir()
    (privado / "SEGUNDO-CEREBRO-VERSION").write_text(
        "### v3.31.0 — 2026-11-01 (sessão 2)\n**Publicar:** não\n", encoding="utf-8"
    )
    assert exportar.main(["changelog", "--privado", str(privado)]) == 0


# ---------------------------------------------------------------- menores herdados


def test_saida_em_utf8(tmp_path):
    privado = tmp_path / "privado"
    privado.mkdir()
    script = Path(exportar.__file__)
    env = {k: v for k, v in os.environ.items() if k not in ("PYTHONIOENCODING", "PYTHONUTF8")}
    r = subprocess.run(
        [sys.executable, str(script), "pendencias", "--privado", str(privado),
         "--registro", str(tmp_path / "reg.json")],
        capture_output=True, env=env,
    )
    assert r.returncode == 0
    assert "nenhuma pendência de porte" in r.stdout.decode("utf-8")


def _com_arquivos(repo, arquivos):
    for rel, conteudo in arquivos.items():
        alvo = repo / rel
        alvo.parent.mkdir(parents=True, exist_ok=True)
        alvo.write_bytes(conteudo)
    _git(repo, "add", "-A")
    release.gravar(repo, release.atualizar_lista(repo))
    _commit(repo)


def _citacoes(repo, removidos):
    _mudancas(repo, removidos=removidos)
    return exportar._citacoes_de_removidos(repo)


def test_citacao_por_caminho_completo_bloqueia(repo):
    _com_arquivos(repo, {"_docs/Velho.md": b"x\n", "_docs/Guia.md": b"ver _docs/Velho.md\n"})
    assert any("_docs/Guia.md:1" in a for a in _citacoes(repo, ["_docs/Velho.md"]))


def test_citacao_por_wikilink_bloqueia(repo):
    formas = ["[[Velho]]", "[[Velho|apelido]]", "[[Velho#Secao]]", "[[_docs/Velho]]"]
    for forma in formas:
        _com_arquivos(repo, {"_docs/Velho.md": b"x\n", "_docs/Guia.md": f"ver {forma}\n".encode()})
        assert any("_docs/Guia.md:1" in a for a in _citacoes(repo, ["_docs/Velho.md"])), forma


def test_nome_unico_com_extensao_bloqueia(repo):
    _com_arquivos(repo, {"_docs/Velho.md": b"x\n", "_docs/Guia.md": b"abra Velho.md agora\n"})
    assert any("_docs/Guia.md:1" in a for a in _citacoes(repo, ["_docs/Velho.md"]))


def test_stem_generico_nao_bloqueia(repo):
    arquivo_manifesto = repo / manifesto.NOME_MANIFESTO
    dados = json.loads(arquivo_manifesto.read_text(encoding="utf-8"))
    dados["itens"].append({"caminho": ".claude/", "tipo": "fixo"})
    arquivo_manifesto.write_text(json.dumps(dados), encoding="utf-8")
    _com_arquivos(
        repo,
        {
            ".claude/skills/x/exemplos.md": b"x\n",
            ".claude/skills/y/exemplos.md": b"y\n",
            "_docs/Guia.md": b"veja exemplos.md e os exemplos\n",
        },
    )
    _mudancas(repo, removidos=[".claude/skills/x/exemplos.md"])
    assert exportar._citacoes_de_removidos(repo) == []
    _versao(repo, "1.1.0")
    assert exportar.main(["preparar", "--versao", "1.1.0"], raiz=repo) == 0


def test_preparar_sem_version_da_mensagem(repo, capsys):
    (repo / "VERSION").unlink()
    assert exportar.main(["preparar", "--versao", "1.1.0"], raiz=repo) == 1
    assert "VERSION ausente" in capsys.readouterr().err


def test_preparar_sem_changelog_da_mensagem(repo, capsys):
    _versao(repo, "1.1.0")
    (repo / "_docs" / "CHANGELOG.md").unlink()
    assert exportar.main(["preparar", "--versao", "1.1.0"], raiz=repo) == 1
    assert "_docs/CHANGELOG.md ausente" in capsys.readouterr().err


def test_marcar_recusa_caminho_fora_das_raizes(tmp_path, capsys):
    privado = _privado(tmp_path)
    (privado / "solto.md").write_text("s\n", encoding="utf-8")
    registro = tmp_path / "reg.json"
    rc = exportar.main(
        ["marcar", "--privado", str(privado), "--registro", str(registro),
         "--arquivo", "solto.md", "--estado", "so-privado"]
    )
    assert rc == 1
    assert "fora das raízes do framework: solto.md" in capsys.readouterr().err
    assert not registro.exists()


def test_registro_sem_chave_da_mensagem(tmp_path, capsys):
    privado = _privado(tmp_path)
    registro = tmp_path / "reg.json"
    registro.write_text(
        json.dumps({"versao_schema": 1, "pares": [{"privado": "CLAUDE.md", "estado": "portado"}]}),
        encoding="utf-8",
    )
    rc = exportar.main(["pendencias", "--privado", str(privado), "--registro", str(registro)])
    assert rc == 1
    assert "registro de porte: par sem 'publico'" in capsys.readouterr().err


def test_preparar_falha_nao_deixa_meio_feito(repo, monkeypatch, capsys):
    _versao(repo, "1.1.0")
    _mudancas(repo, removidos=["x.md"])
    antes_release = (repo / release.ARQUIVO_RELEASE).read_bytes()
    antes_mudancas = (repo / release.ARQUIVO_MUDANCAS).read_bytes()
    original = os.replace
    chamadas = []

    def falha_na_segunda(origem, destino):
        chamadas.append(destino)
        if len(chamadas) == 2:
            raise OSError("disco cheio")
        return original(origem, destino)

    monkeypatch.setattr(exportar.os, "replace", falha_na_segunda)
    assert exportar.main(["preparar", "--versao", "1.1.0"], raiz=repo) == 1
    assert (repo / release.ARQUIVO_RELEASE).read_bytes() == antes_release
    assert (repo / release.ARQUIVO_MUDANCAS).read_bytes() == antes_mudancas
    assert not list(repo.glob("*.tmp"))
    assert "disco cheio" in capsys.readouterr().err
