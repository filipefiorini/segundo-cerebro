"""Testes do registro de porte do vault do mantenedor."""
from pathlib import Path

import porte
from porte import Pendencia


def _vault(raiz: Path, arquivos: dict[str, str]) -> Path:
    for rel, texto in arquivos.items():
        alvo = raiz / rel
        alvo.parent.mkdir(parents=True, exist_ok=True)
        alvo.write_text(texto, encoding="utf-8")
    return raiz


def test_par_publico():
    assert porte.par_publico("_skills/deliberar/SKILL.md") == ".claude/skills/deliberar/SKILL.md"
    assert porte.par_publico("_docs/Manual do Segundo Cérebro.md") == "_docs/Manual do Segundo Cérebro.md"


def test_framework_privado_so_as_raizes(tmp_path):
    _vault(tmp_path, {
        "CLAUDE.md": "c", "_docs/a.md": "a", "_skills/x/SKILL.md": "s", "notas/z.md": "z",
    })
    assert porte.framework_privado(tmp_path) == ["CLAUDE.md", "_docs/a.md", "_skills/x/SKILL.md"]


def test_pendencias_novo_mudou_e_so_privado(tmp_path):
    _vault(tmp_path, {"CLAUDE.md": "c", "_docs/a.md": "novo texto", "_skills/x/SKILL.md": "s2"})
    registro = {"versao_schema": 1, "pares": [
        {"privado": "_docs/a.md", "publico": "_docs/a.md", "estado": "portado",
         "sha256": "0" * 64, "nota": ""},
        {"privado": "_skills/x/SKILL.md", "publico": None, "estado": "so-privado",
         "sha256": "0" * 64, "nota": ""},
    ]}
    assert porte.pendencias(tmp_path, registro) == [
        Pendencia("CLAUDE.md", None, "novo"),
        Pendencia("_docs/a.md", "_docs/a.md", "mudou"),
    ]


def test_marcar_e_releitura(tmp_path):
    _vault(tmp_path, {"_docs/a.md": "texto"})
    caminho = tmp_path / "saida" / "porte.json"
    registro = porte.carregar_registro(caminho)
    assert registro == {"versao_schema": 1, "pares": []}
    registro = porte.marcar(tmp_path, registro, "_docs/a.md", "portado")
    porte.salvar_registro(caminho, registro)
    relido = porte.carregar_registro(caminho)
    assert relido["pares"][0]["publico"] == "_docs/a.md"
    assert porte.pendencias(tmp_path, relido) == []
    bruto = caminho.read_bytes()
    assert not bruto.startswith(b"\xef\xbb\xbf") and b"\r" not in bruto


def test_marcar_so_privado_e_skill(tmp_path):
    _vault(tmp_path, {"_skills/x/SKILL.md": "s"})
    r = porte.marcar(tmp_path, porte.carregar_registro(tmp_path / "n.json"),
                     "_skills/x/SKILL.md", "portado")
    assert r["pares"][0]["publico"] == ".claude/skills/x/SKILL.md"
    r = porte.marcar(tmp_path, r, "_skills/x/SKILL.md", "so-privado", nota="uso interno")
    assert len(r["pares"]) == 1
    assert r["pares"][0]["publico"] is None and r["pares"][0]["nota"] == "uso interno"


def test_framework_privado_ignora_temporarios(tmp_path):
    _vault(tmp_path, {
        "CLAUDE.md": "c\n",
        "_docs/Manual.md": "m\n",
        "_docs/~$Manual.md": "t\n",
        "_docs/rascunho.tmp": "t\n",
        "_docs/Manual.md.bak": "t\n",
        "_docs/Manual.bak2": "t\n",
        "_docs/Thumbs.db": "t\n",
    })
    assert porte.framework_privado(tmp_path) == ["CLAUDE.md", "_docs/Manual.md"]


def _escrever_bytes(raiz: Path, rel: str, dados: bytes) -> None:
    alvo = raiz / rel
    alvo.parent.mkdir(parents=True, exist_ok=True)
    alvo.write_bytes(dados)


def test_hash_do_porte_ignora_fim_de_linha(tmp_path):
    _escrever_bytes(tmp_path, "lf.md", b"a\nb\n")
    _escrever_bytes(tmp_path, "crlf.md", b"a\r\nb\r\n")
    assert porte.sha256_porte(tmp_path / "lf.md") == porte.sha256_porte(tmp_path / "crlf.md")


def test_lf_marcado_e_reescrito_em_crlf_nao_pendente(tmp_path):
    _escrever_bytes(tmp_path, "_docs/a.md", b"linha 1\nlinha 2\n")
    registro = porte.marcar(tmp_path, {"versao_schema": 1, "pares": []}, "_docs/a.md", "portado")
    _escrever_bytes(tmp_path, "_docs/a.md", b"linha 1\r\nlinha 2\r\n")
    assert porte.pendencias(tmp_path, registro) == []


def test_mudanca_real_continua_pendente_em_crlf(tmp_path):
    _escrever_bytes(tmp_path, "_docs/a.md", b"linha 1\nlinha 2\n")
    registro = porte.marcar(tmp_path, {"versao_schema": 1, "pares": []}, "_docs/a.md", "portado")
    _escrever_bytes(tmp_path, "_docs/a.md", b"linha 1\r\nlinha 3\r\n")
    assert porte.pendencias(tmp_path, registro) == [Pendencia("_docs/a.md", "_docs/a.md", "mudou")]
