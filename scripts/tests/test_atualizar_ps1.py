"""Testes dos scripts PowerShell do /atualizar: baixar, comparar, aplicar e desfazer."""
import hashlib
import io
import json
import os
import re
import shutil
import subprocess
import zipfile
from pathlib import Path

import pytest

POWERSHELL = shutil.which("powershell.exe")
pytestmark = pytest.mark.skipif(POWERSHELL is None, reason="sem powershell.exe")

DIR_SCRIPTS = Path(__file__).resolve().parents[2] / ".claude" / "skills" / "atualizar"
PREPARO = ".segundo-cerebro/preparo/v1.1.0"
ORIGEM = PREPARO + "/origem"
BLOCO_VAZIO = "<!-- usuario:inicio -->\n<!-- usuario:fim -->"


def rodar(script, *args):
    return subprocess.run(
        [POWERSHELL, "-NoProfile", "-ExecutionPolicy", "Bypass", "-File",
         str(DIR_SCRIPTS / script), *args],
        capture_output=True,
    )


def gravar(raiz: Path, rel: str, conteudo: str) -> Path:
    caminho = raiz / rel
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_bytes(conteudo.encode("utf-8"))
    return caminho


def ler(raiz: Path, rel: str) -> str:
    return (raiz / rel).read_bytes().decode("utf-8")


def gravar_release(pasta: Path, versao: str, tipos: dict, historico=None) -> None:
    """Grava o segundo-cerebro.release.json com o hash dos arquivos já gravados em `pasta`."""
    arquivos = []
    for caminho, tipo in sorted(tipos.items()):
        arquivo = pasta / caminho
        sha = hashlib.sha256(arquivo.read_bytes()).hexdigest() if arquivo.is_file() else "0" * 64
        arquivos.append({"caminho": caminho, "tipo": tipo, "sha256": sha})
    dados = {"versao_schema": 1, "versao": versao, "arquivos": arquivos,
             "historico": historico or []}
    gravar(pasta, "segundo-cerebro.release.json", json.dumps(dados, ensure_ascii=False, indent=2))


def comparar(raiz: Path):
    r = rodar("comparar.ps1", "-Raiz", str(raiz), "-Origem", ORIGEM,
              "-Saida", PREPARO + "/comparacao.json")
    saida = raiz / PREPARO / "comparacao.json"
    dados = json.loads(saida.read_text(encoding="utf-8")) if saida.is_file() else None
    return r, dados


def acoes(dados) -> dict:
    return {a["caminho"]: a["acao"] for a in dados["arquivos"]}


def montar_aplicacao(raiz: Path, copias: dict, tipos: dict, historico=None,
                     remover=(), renomear=()):
    """Grava no preparo a origem das cópias, a release nova e o plano.json."""
    for para, conteudo in copias.items():
        gravar(raiz, f"{ORIGEM}/{para}", conteudo)
    gravar_release(raiz / ORIGEM, "1.1.0", tipos, historico)
    plano = {
        "de": "1.0.0", "para": "1.1.0",
        "copiar": [{"de": f"{ORIGEM}/{p}", "para": p} for p in copias],
        "remover": list(remover),
        "renomear": [{"de": d, "para": p} for d, p in renomear],
    }
    gravar_plano(raiz, plano)


def gravar_plano(raiz: Path, plano: dict) -> None:
    gravar(raiz, PREPARO + "/plano.json", json.dumps(plano, ensure_ascii=False))


def aplicar(raiz: Path, *extra):
    return rodar("aplicar.ps1", "-Raiz", str(raiz), "-Plano", PREPARO + "/plano.json",
                 "-Release", ORIGEM + "/segundo-cerebro.release.json", *extra)


def backups(raiz: Path) -> list:
    pasta = raiz / ".segundo-cerebro" / "backup"
    return sorted(p.name for p in pasta.iterdir()) if pasta.is_dir() else []


def test_scripts_tem_bom():
    for nome in ("baixar.ps1", "comparar.ps1", "aplicar.ps1", "desfazer.ps1"):
        assert (DIR_SCRIPTS / nome).read_bytes()[:3] == b"\xef\xbb\xbf", nome


# --- comparar ---------------------------------------------------------------

def test_comparar_recusa_hash_diferente(tmp_path):
    gravar(tmp_path, ".segundo-cerebro-version", "1.0.0\n")
    gravar(tmp_path, f"{ORIGEM}/a.md", "original\n")
    gravar_release(tmp_path / ORIGEM, "1.1.0", {"a.md": "fixo"})
    gravar(tmp_path, f"{ORIGEM}/a.md", "alterado depois\n")
    r, dados = comparar(tmp_path)
    assert r.returncode == 2
    assert dados is None
    assert "a.md" in r.stdout.decode("utf-8", "replace")


def test_comparar_classifica_pela_tabela(tmp_path):
    gravar(tmp_path, ".segundo-cerebro-version", "1.0.0\n")
    modulo = ".claude/skills/guarda-constituicao/motor.py"
    modulo_md = ".claude/skills/guarda-constituicao/LEIA.md"
    # (instância, base, nova); None = ausente
    casos = {
        "novo.md": (None, None, "n"),
        "apagado.md": (None, "b", "b"),
        "igual.md": ("x", "x", "x"),
        "so-release.md": ("x", "x", "y"),
        "so-pessoa.md": ("p", "x", "x"),
        "os-dois.md": ("p", "x", "y"),
        "ja-igual-nova.md": ("y", "x", "y"),
        modulo: ("p", "x", "y"),
        modulo_md: ("p", "x", "y"),
    }
    for rel, (inst, base, nova) in casos.items():
        if inst is not None:
            gravar(tmp_path, rel, inst)
        if base is not None:
            gravar(tmp_path, f".segundo-cerebro/base/{rel}", base)
        gravar(tmp_path, f"{ORIGEM}/{rel}", nova)
    gravar(tmp_path, f"{ORIGEM}/semente-ausente.md", "s")
    gravar(tmp_path, "semente-presente.md", "minha")
    gravar(tmp_path, f"{ORIGEM}/semente-presente.md", "s")
    gravar(tmp_path, "exemplo.md", "meu")
    gravar(tmp_path, f"{ORIGEM}/exemplo.md", "e")
    tipos = {rel: "fixo" for rel in casos}
    tipos.update({"semente-ausente.md": "semente", "semente-presente.md": "semente",
                  "exemplo.md": "exemplo"})
    gravar_release(tmp_path / ORIGEM, "1.1.0", tipos)

    r, dados = comparar(tmp_path)
    assert r.returncode == 0, r.stderr.decode("utf-8", "replace")
    assert dados["de"] == "1.0.0" and dados["para"] == "1.1.0"
    assert dados["tem_base"] is True
    assert acoes(dados) == {
        "novo.md": "copiar",
        "apagado.md": "perguntar-apagado",
        "igual.md": "nada",
        "so-release.md": "substituir",
        "so-pessoa.md": "manter",
        "os-dois.md": "mesclar",
        "ja-igual-nova.md": "nada",
        modulo: "modulo",
        modulo_md: "mesclar",
        "semente-ausente.md": "criar",
        "semente-presente.md": "ignorar",
        "exemplo.md": "ignorar",
    }
    tipos_saida = {a["caminho"]: a["tipo"] for a in dados["arquivos"]}
    assert tipos_saida == tipos
    assert dados["removidos"] == [] and dados["renomeados"] == [] and dados["migracoes"] == []


def test_comparar_desconta_bloco_usuario(tmp_path):
    gravar(tmp_path, ".segundo-cerebro-version", "1.0.0\n")
    base = f"# Regras\n{BLOCO_VAZIO}\nlinha fixa\n"
    nova = f"# Regras novas\n{BLOCO_VAZIO}\nlinha fixa\n"
    pessoa = "# Regras\n<!-- usuario:inicio -->\nminha regra\n<!-- usuario:fim -->\nlinha fixa\n"
    gravar(tmp_path, "CLAUDE.md", pessoa)
    gravar(tmp_path, ".segundo-cerebro/base/CLAUDE.md", base)
    gravar(tmp_path, f"{ORIGEM}/CLAUDE.md", nova)
    gravar_release(tmp_path / ORIGEM, "1.1.0", {"CLAUDE.md": "fixo"})

    r, dados = comparar(tmp_path)
    assert r.returncode == 0, r.stderr.decode("utf-8", "replace")
    (item,) = dados["arquivos"]
    assert item["acao"] == "substituir"
    assert item["blocos"] == {"instancia": 1, "nova": 1}

    gravar(tmp_path, "CLAUDE.md", pessoa.replace("linha fixa", "linha minha"))
    r, dados = comparar(tmp_path)
    assert r.returncode == 0
    assert acoes(dados) == {"CLAUDE.md": "mesclar"}


def test_comparar_ignora_marcador_citado(tmp_path):
    gravar(tmp_path, ".segundo-cerebro-version", "1.0.0\n")
    citado = ("Use `<!-- usuario:inicio -->` e `<!-- usuario:fim -->` em volta.\n"
              "{abre}\n<!-- usuario:inicio -->\n{modelo}\n<!-- usuario:fim -->\n{fecha}\nfim\n")
    for rel, abre, fecha in (("crase.md", "```markdown", "```"), ("til.md", "~~~", "~~~")):
        velho = citado.format(abre=abre, fecha=fecha, modelo="modelo velho")
        novo = velho.replace("modelo velho", "modelo novo")
        gravar(tmp_path, rel, velho)
        gravar(tmp_path, f".segundo-cerebro/base/{rel}", velho)
        gravar(tmp_path, f"{ORIGEM}/{rel}", novo)
    # Marcador na linha inteira, com espaço em volta e CRLF, continua valendo.
    gravar(tmp_path, "crlf.md", "a\r\n  <!-- usuario:inicio -->  \r\nminha\r\n<!-- usuario:fim -->\r\nb\r\n")
    vazio = "a\r\n  <!-- usuario:inicio -->  \r\n<!-- usuario:fim -->\r\nb\r\n"
    gravar(tmp_path, ".segundo-cerebro/base/crlf.md", vazio)
    gravar(tmp_path, f"{ORIGEM}/crlf.md", vazio)
    gravar_release(tmp_path / ORIGEM, "1.1.0",
                   {"crase.md": "fixo", "til.md": "fixo", "crlf.md": "fixo"})

    r, dados = comparar(tmp_path)
    assert r.returncode == 0, r.stderr.decode("utf-8", "replace")
    assert acoes(dados) == {"crase.md": "substituir", "til.md": "substituir", "crlf.md": "nada"}
    blocos = {a["caminho"]: a["blocos"] for a in dados["arquivos"]}
    assert blocos["crase.md"] == {"instancia": 0, "nova": 0}
    assert blocos["til.md"] == {"instancia": 0, "nova": 0}
    assert blocos["crlf.md"] == {"instancia": 1, "nova": 1}


def test_comparar_sem_base(tmp_path):
    gravar(tmp_path, ".segundo-cerebro-version", "1.0.0\n")
    gravar(tmp_path, "igual.md", "x")
    gravar(tmp_path, f"{ORIGEM}/igual.md", "x")
    gravar(tmp_path, "diferente.md", "p")
    gravar(tmp_path, f"{ORIGEM}/diferente.md", "y")
    gravar(tmp_path, f"{ORIGEM}/ausente.md", "y")
    gravar(tmp_path, f"{ORIGEM}/semente.md", "s")
    gravar_release(tmp_path / ORIGEM, "1.1.0", {
        "igual.md": "fixo", "diferente.md": "fixo", "ausente.md": "fixo",
        "semente.md": "semente"})

    r, dados = comparar(tmp_path)
    assert r.returncode == 0, r.stderr.decode("utf-8", "replace")
    assert dados["tem_base"] is False
    assert acoes(dados) == {"igual.md": "nada", "diferente.md": "perguntar",
                            "ausente.md": "perguntar", "semente.md": "criar"}
    blocos = {a["caminho"]: a["blocos"] for a in dados["arquivos"]}
    assert blocos["ausente.md"] == {"instancia": 0, "nova": 0}


def test_comparar_historico_so_de_versoes_maiores(tmp_path):
    gravar(tmp_path, ".segundo-cerebro-version", "1.0.0\n")
    gravar(tmp_path, f"{ORIGEM}/a.md", "a")
    historico = [
        {"versao": "1.0.0", "removidos": ["r100.md"], "renomeados": [], "migracoes": []},
        {"versao": "1.1.0", "removidos": ["r110.md"],
         "renomeados": [{"de": "x.md", "para": "y.md"}],
         "migracoes": [{"id": "m1", "descricao": "d", "instrucoes": "i"}]},
        {"versao": "1.2.0", "removidos": ["r120.md"], "renomeados": [], "migracoes": []},
    ]
    gravar_release(tmp_path / ORIGEM, "1.2.0", {"a.md": "fixo"}, historico)

    r, dados = comparar(tmp_path)
    assert r.returncode == 0, r.stderr.decode("utf-8", "replace")
    assert dados["para"] == "1.2.0"
    assert dados["removidos"] == ["r110.md", "r120.md"]
    assert dados["renomeados"] == [{"de": "x.md", "para": "y.md"}]
    assert dados["migracoes"] == [{"id": "m1", "descricao": "d", "instrucoes": "i"}]


def test_comparar_versoes_que_nao_se_comparam(tmp_path):
    gravar(tmp_path, ".segundo-cerebro-version", "1.1.0-dev\n")
    gravar(tmp_path, f"{ORIGEM}/a.md", "a")
    gravar_release(tmp_path / ORIGEM, "1.1.0-ensaio", {"a.md": "fixo"})
    r, dados = comparar(tmp_path)
    assert r.returncode == 3
    assert dados is None


def test_rc_para_final_compara(tmp_path):
    gravar(tmp_path, ".segundo-cerebro-version", "1.0.0-rc.1\n")
    gravar(tmp_path, f"{ORIGEM}/a.md", "a")
    gravar_release(tmp_path / ORIGEM, "1.0.0", {"a.md": "fixo"})
    r, dados = comparar(tmp_path)
    assert r.returncode == 0, r.stderr.decode("utf-8", "replace")
    assert dados["para"] == "1.0.0"
    assert acoes(dados) == {"a.md": "perguntar"}


def test_rc_para_outro_rc_recusa(tmp_path):
    gravar(tmp_path, ".segundo-cerebro-version", "1.0.0-rc.1\n")
    gravar(tmp_path, f"{ORIGEM}/a.md", "a")
    gravar_release(tmp_path / ORIGEM, "1.0.0-rc.2", {"a.md": "fixo"})
    r, dados = comparar(tmp_path)
    assert r.returncode == 3
    assert dados is None


# --- aplicar ----------------------------------------------------------------

def test_aplicar_copia_e_guarda_backup(tmp_path):
    gravar(tmp_path, "CLAUDE.md", "velho")
    montar_aplicacao(tmp_path, {"CLAUDE.md": "novo"}, {"CLAUDE.md": "fixo"})
    r = aplicar(tmp_path)
    assert r.returncode == 0, r.stderr.decode("utf-8", "replace")
    assert ler(tmp_path, "CLAUDE.md") == "novo"
    (nome,) = backups(tmp_path)
    assert re.fullmatch(r"\d{8}-\d{6}-v1\.0\.0-para-v1\.1\.0", nome)
    pasta = tmp_path / ".segundo-cerebro" / "backup" / nome
    assert (pasta / "arquivos" / "CLAUDE.md").read_bytes() == b"velho"
    info = json.loads((pasta / "backup.json").read_text(encoding="utf-8"))
    assert info["de"] == "1.0.0" and info["para"] == "1.1.0"
    assert re.match(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}", info["criado"])
    assert info["arquivos"] == [{"caminho": "CLAUDE.md", "existia": True}]


def test_aplicar_caminho_com_acento(tmp_path):
    rel = "02 - ÁREAS/Segundo Cérebro/_CONTEXTO.md"
    montar_aplicacao(tmp_path, {rel: "contexto"}, {rel: "fixo"})
    r = aplicar(tmp_path)
    assert r.returncode == 0, r.stderr.decode("utf-8", "replace")
    assert "Segundo Cérebro" in os.listdir(tmp_path / "02 - ÁREAS")
    assert "_CONTEXTO.md" in os.listdir(tmp_path / "02 - ÁREAS" / "Segundo Cérebro")
    assert ler(tmp_path, rel) == "contexto"

    (nome,) = backups(tmp_path)
    r = rodar("desfazer.ps1", "-Raiz", str(tmp_path), "-Backup",
              f".segundo-cerebro/backup/{nome}")
    assert r.returncode == 0, r.stderr.decode("utf-8", "replace")
    assert not (tmp_path / rel).exists()


def test_aplicar_renomeia_e_remove(tmp_path):
    gravar(tmp_path, "velho.md", "sai")
    gravar(tmp_path, "a.md", "conteudo de a")
    historico = [{"versao": "1.1.0", "removidos": ["velho.md"],
                  "renomeados": [{"de": "a.md", "para": "pasta/b.md"}], "migracoes": []}]
    montar_aplicacao(tmp_path, {}, {"pasta/b.md": "fixo"}, historico,
                     remover=["velho.md"], renomear=[("a.md", "pasta/b.md")])
    r = aplicar(tmp_path)
    assert r.returncode == 0, r.stderr.decode("utf-8", "replace")
    assert not (tmp_path / "velho.md").exists()
    assert not (tmp_path / "a.md").exists()
    assert ler(tmp_path, "pasta/b.md") == "conteudo de a"
    (nome,) = backups(tmp_path)
    info = json.loads((tmp_path / ".segundo-cerebro/backup" / nome / "backup.json")
                      .read_text(encoding="utf-8"))
    existia = {a["caminho"]: a["existia"] for a in info["arquivos"]}
    assert existia == {"a.md": True, "pasta/b.md": False, "velho.md": True}


@pytest.mark.parametrize("para", ["../fora.txt", "C:/x.txt"])
def test_aplicar_recusa_caminho_fora_da_raiz(tmp_path, para):
    raiz = tmp_path / "vault"
    gravar(raiz, "CLAUDE.md", "velho")
    montar_aplicacao(raiz, {"CLAUDE.md": "novo"}, {"CLAUDE.md": "fixo"})
    plano = json.loads(ler(raiz, PREPARO + "/plano.json"))
    plano["copiar"].append({"de": f"{ORIGEM}/CLAUDE.md", "para": para})
    gravar_plano(raiz, plano)
    r = aplicar(raiz)
    assert r.returncode != 0
    assert ler(raiz, "CLAUDE.md") == "velho"
    assert not (tmp_path / "fora.txt").exists()
    assert backups(raiz) == []


def test_aplicar_recusa_alvo_fora_da_release(tmp_path):
    gravar(tmp_path, "CLAUDE.md", "velho")
    gravar(tmp_path, "outro.md", "fica")
    montar_aplicacao(tmp_path, {"CLAUDE.md": "novo"}, {"CLAUDE.md": "fixo"})
    plano = json.loads(ler(tmp_path, PREPARO + "/plano.json"))

    nota = dict(plano, copiar=plano["copiar"] + [
        {"de": f"{ORIGEM}/CLAUDE.md", "para": "05 - GALÁXIA/minha nota.md"}])
    gravar_plano(tmp_path, nota)
    r = aplicar(tmp_path)
    assert r.returncode != 0
    assert not (tmp_path / "05 - GALÁXIA").exists()

    gravar_plano(tmp_path, dict(plano, remover=["outro.md"]))
    r = aplicar(tmp_path)
    assert r.returncode != 0
    assert ler(tmp_path, "outro.md") == "fica"

    gravar_plano(tmp_path, dict(plano, copiar=[{"de": "CLAUDE.md", "para": "CLAUDE.md"}]))
    r = aplicar(tmp_path)
    assert r.returncode != 0

    assert ler(tmp_path, "CLAUDE.md") == "velho"
    assert backups(tmp_path) == []


def test_aplicar_falha_no_meio_desfaz_tudo(tmp_path):
    gravar(tmp_path, "CLAUDE.md", "velho")
    gravar(tmp_path, "b.md", "b velho")
    montar_aplicacao(tmp_path, {"CLAUDE.md": "novo"}, {"CLAUDE.md": "fixo", "b.md": "fixo"})
    plano = json.loads(ler(tmp_path, PREPARO + "/plano.json"))
    plano["copiar"].append({"de": f"{ORIGEM}/nao-existe.md", "para": "b.md"})
    gravar_plano(tmp_path, plano)
    r = aplicar(tmp_path)
    assert r.returncode == 1
    assert ler(tmp_path, "CLAUDE.md") == "velho"
    assert ler(tmp_path, "b.md") == "b velho"


def test_aplicar_mantem_dois_backups(tmp_path):
    gravar(tmp_path, "CLAUDE.md", "velho")
    montar_aplicacao(tmp_path, {"CLAUDE.md": "novo"}, {"CLAUDE.md": "fixo"})
    vistos = []
    for _ in range(3):
        r = aplicar(tmp_path)
        assert r.returncode == 0, r.stderr.decode("utf-8", "replace")
        vistos.append(backups(tmp_path))
    assert len(vistos[-1]) == 2
    (primeiro,) = vistos[0]
    assert primeiro not in vistos[-1]


def test_aplicar_rotacao_ignora_backup_de_falha(tmp_path):
    gravar(tmp_path, "CLAUDE.md", "velho")
    gravar(tmp_path, "b.md", "b velho")
    montar_aplicacao(tmp_path, {"CLAUDE.md": "novo"}, {"CLAUDE.md": "fixo", "b.md": "fixo"})
    bom = json.loads(ler(tmp_path, PREPARO + "/plano.json"))
    ruim = dict(bom, copiar=bom["copiar"] + [{"de": f"{ORIGEM}/nao-existe.md", "para": "b.md"}])

    assert aplicar(tmp_path).returncode == 0
    (primeiro_bom,) = backups(tmp_path)
    gravar_plano(tmp_path, ruim)
    assert aplicar(tmp_path).returncode == 1
    (falho,) = set(backups(tmp_path)) - {primeiro_bom}
    assert (tmp_path / ".segundo-cerebro/backup" / falho / "falha.txt").is_file()
    gravar_plano(tmp_path, bom)
    assert aplicar(tmp_path).returncode == 0

    finais = backups(tmp_path)
    assert primeiro_bom in finais
    assert len(set(finais) - {falho}) == 2


def test_aplicar_erro_em_utf8_sem_registro(tmp_path):
    gravar(tmp_path, "outro.md", "fica")
    montar_aplicacao(tmp_path, {}, {"CLAUDE.md": "fixo"}, remover=["outro.md"])
    r = aplicar(tmp_path)
    assert r.returncode == 2
    erro = r.stderr.decode("utf-8")
    assert "release não autoriza" in erro
    assert "At line" not in erro and "caractere:" not in erro


def test_gravar_base_falha_nao_deixa_base_parcial(tmp_path):
    gravar(tmp_path, "a.md", "a")
    gravar(tmp_path, "z.md", "z")
    gravar_release(tmp_path, "1.0.0", {"a.md": "fixo", "z.md": "fixo"})
    # Uma pasta no lugar do destino de z.md faz a cópia falhar depois de a.md ter sido copiado.
    (tmp_path / ".segundo-cerebro" / "base" / "z.md").mkdir(parents=True)
    r = rodar("aplicar.ps1", "-Raiz", str(tmp_path), "-GravarBase")
    assert r.returncode == 1
    assert not (tmp_path / ".segundo-cerebro" / "base" / "a.md").exists()

    (tmp_path / ".segundo-cerebro" / "base" / "z.md").rmdir()
    r = rodar("aplicar.ps1", "-Raiz", str(tmp_path), "-GravarBase")
    assert r.returncode == 0, r.stderr.decode("utf-8", "replace")
    assert (tmp_path / ".segundo-cerebro" / "base" / "z.md").read_bytes() == b"z"


def test_gravar_base_copia_os_fixo(tmp_path):
    gravar(tmp_path, "a.md", "a")
    gravar(tmp_path, "pasta/c.md", "c")
    gravar(tmp_path, "s.md", "s")
    gravar_release(tmp_path, "1.0.0", {"a.md": "fixo", "pasta/c.md": "fixo", "s.md": "semente"})
    r = rodar("aplicar.ps1", "-Raiz", str(tmp_path), "-GravarBase")
    assert r.returncode == 0, r.stderr.decode("utf-8", "replace")
    base = tmp_path / ".segundo-cerebro" / "base"
    assert (base / "a.md").read_bytes() == b"a"
    assert (base / "pasta" / "c.md").read_bytes() == b"c"
    assert not (base / "s.md").exists()

    r = rodar("aplicar.ps1", "-Raiz", str(tmp_path), "-GravarBase")
    assert r.returncode != 0


# --- desfazer ---------------------------------------------------------------

def _aplicar_novo_e_claude(raiz: Path) -> str:
    gravar(raiz, "CLAUDE.md", "velho")
    montar_aplicacao(raiz, {"CLAUDE.md": "novo", "novo.md": "criado"},
                     {"CLAUDE.md": "fixo", "novo.md": "fixo"})
    r = aplicar(raiz)
    assert r.returncode == 0, r.stderr.decode("utf-8", "replace")
    assert ler(raiz, "CLAUDE.md") == "novo" and ler(raiz, "novo.md") == "criado"
    (nome,) = backups(raiz)
    return f".segundo-cerebro/backup/{nome}"


def test_desfazer_restaura_e_apaga_novos(tmp_path):
    backup = _aplicar_novo_e_claude(tmp_path)
    r = rodar("desfazer.ps1", "-Raiz", str(tmp_path), "-Backup", backup)
    assert r.returncode == 0, r.stderr.decode("utf-8", "replace")
    assert ler(tmp_path, "CLAUDE.md") == "velho"
    assert not (tmp_path / "novo.md").exists()


def test_desfazer_um_arquivo(tmp_path):
    backup = _aplicar_novo_e_claude(tmp_path)
    r = rodar("desfazer.ps1", "-Raiz", str(tmp_path), "-Backup", backup,
              "-Arquivo", "CLAUDE.md")
    assert r.returncode == 0, r.stderr.decode("utf-8", "replace")
    assert ler(tmp_path, "CLAUDE.md") == "velho"
    assert ler(tmp_path, "novo.md") == "criado"


# --- código de módulo só entra vindo da release ----------------------------

MODULO = ".claude/skills/guarda-constituicao/hooks/register.ts"
MESCLADOS = PREPARO + "/mesclados"


def _plano_modulo(raiz: Path, de: str, para: str, conteudo_origem: str, tipo="fixo"):
    gravar(raiz, f"{ORIGEM}/{para}", conteudo_origem)
    gravar_release(raiz / ORIGEM, "1.1.0", {para: tipo})
    gravar_plano(raiz, {"de": "1.0.0", "para": "1.1.0",
                        "copiar": [{"de": de, "para": para}], "remover": [], "renomear": []})


def test_aplicar_recusa_modulo_vindo_de_mesclados(tmp_path):
    gravar(tmp_path, f"{MESCLADOS}/{MODULO}", "codigo")
    _plano_modulo(tmp_path, f"{MESCLADOS}/{MODULO}", MODULO, "codigo")
    r = aplicar(tmp_path)
    assert r.returncode == 2
    assert not (tmp_path / MODULO).exists()
    assert backups(tmp_path) == []


def test_aplicar_recusa_modulo_com_hash_diferente(tmp_path):
    _plano_modulo(tmp_path, f"{ORIGEM}/{MODULO}", MODULO, "codigo")
    gravar(tmp_path, f"{ORIGEM}/{MODULO}", "outro codigo")
    r = aplicar(tmp_path)
    assert r.returncode == 2
    assert not (tmp_path / MODULO).exists()
    assert backups(tmp_path) == []


def test_aplicar_aceita_modulo_da_origem(tmp_path):
    _plano_modulo(tmp_path, f"{ORIGEM}/{MODULO}", MODULO, "codigo")
    r = aplicar(tmp_path)
    assert r.returncode == 0, r.stderr.decode("utf-8", "replace")
    assert ler(tmp_path, MODULO) == "codigo"


def test_aplicar_aceita_md_de_modulo_mesclado(tmp_path):
    rel = ".claude/skills/painel-tarefas/README.md"
    gravar(tmp_path, f"{MESCLADOS}/{rel}", "mesclado")
    _plano_modulo(tmp_path, f"{MESCLADOS}/{rel}", rel, "origem", tipo="semente")
    r = aplicar(tmp_path)
    assert r.returncode == 0, r.stderr.decode("utf-8", "replace")
    assert ler(tmp_path, rel) == "mesclado"


# --- gravar base pula fixo ausente -----------------------------------------

def test_gravar_base_pula_fixo_ausente(tmp_path):
    gravar(tmp_path, "a.md", "a")
    gravar_release(tmp_path, "1.0.0", {"a.md": "fixo", "z-falta.md": "fixo"})
    r = rodar("aplicar.ps1", "-Raiz", str(tmp_path), "-GravarBase")
    assert r.returncode == 0, r.stderr.decode("utf-8", "replace")
    base = tmp_path / ".segundo-cerebro" / "base"
    assert (base / "a.md").read_bytes() == b"a"
    assert not (base / "z-falta.md").exists()
    assert "ausente: z-falta.md" in r.stdout.decode("utf-8")


# --- cerca indentada e erros em UTF-8 --------------------------------------

def test_comparar_cerca_indentada_nao_conta(tmp_path):
    gravar(tmp_path, ".segundo-cerebro-version", "1.0.0\n")
    velho = "    ```\ntexto\n<!-- usuario:inicio -->\nmeu\n<!-- usuario:fim -->\n"
    novo = velho.replace("texto", "texto novo")
    gravar(tmp_path, "a.md", velho)
    gravar(tmp_path, ".segundo-cerebro/base/a.md", velho)
    gravar(tmp_path, f"{ORIGEM}/a.md", novo)
    gravar_release(tmp_path / ORIGEM, "1.1.0", {"a.md": "fixo"})
    r, dados = comparar(tmp_path)
    assert r.returncode == 0, r.stderr.decode("utf-8", "replace")
    blocos = {a["caminho"]: a["blocos"] for a in dados["arquivos"]}
    assert blocos["a.md"] == {"instancia": 1, "nova": 1}


def test_comparar_erro_em_utf8(tmp_path):
    r = rodar("comparar.ps1", "-Raiz", str(tmp_path / "não-existe"), "-Origem", ORIGEM,
              "-Saida", PREPARO + "/comparacao.json")
    assert r.returncode != 0
    assert "não" in r.stderr.decode("utf-8")


def test_desfazer_erro_em_utf8(tmp_path):
    r = rodar("desfazer.ps1", "-Raiz", str(tmp_path), "-Backup", ".segundo-cerebro/backup/não-existe")
    assert r.returncode != 0
    assert "não" in r.stderr.decode("utf-8")


# --- baixar -----------------------------------------------------------------
# Os testes usam -Origem com uma pasta local: nada vai à rede.

MANUAL = "página de releases"


def zip_de_teste() -> bytes:
    memoria = io.BytesIO()
    with zipfile.ZipFile(memoria, "w") as z:
        z.writestr("segundo-cerebro-v1.1.0/segundo-cerebro.release.json", '{"versao": "1.1.0"}')
    return memoria.getvalue()


def publicar(origem: Path, versao: str, conteudo: bytes, sha=None, latest=None) -> None:
    """Simula os arquivos de uma release na pasta `origem`."""
    origem.mkdir(parents=True, exist_ok=True)
    nome = f"segundo-cerebro-v{versao}.zip"
    (origem / nome).write_bytes(conteudo)
    sha = sha or hashlib.sha256(conteudo).hexdigest()
    (origem / (nome + ".sha256")).write_bytes(f"{sha} *{nome}\n".encode("ascii"))
    if latest:
        (origem / "latest.json").write_text(json.dumps({"tag_name": f"v{latest}"}), encoding="utf-8")


def baixar(destino: Path, origem: Path, *extra):
    return rodar("baixar.ps1", "-Destino", str(destino), "-Origem", str(origem), *extra)


def test_baixar_hash_certo(tmp_path):
    conteudo = zip_de_teste()
    publicar(tmp_path / "origem", "1.1.0", conteudo)
    destino = tmp_path / "preparo"
    r = baixar(destino, tmp_path / "origem", "-Versao", "1.1.0")
    assert r.returncode == 0, r.stderr.decode("utf-8", "replace")
    zip_baixado = destino / "segundo-cerebro-v1.1.0.zip"
    assert zip_baixado.read_bytes() == conteudo
    assert str(zip_baixado) in r.stdout.decode("utf-8").strip().splitlines()
    assert sorted(p.name for p in destino.iterdir()) == ["segundo-cerebro-v1.1.0.zip"]


def test_baixar_sem_versao_usa_a_mais_recente(tmp_path):
    publicar(tmp_path / "origem", "1.1.0", zip_de_teste(), latest="1.1.0")
    r = baixar(tmp_path / "preparo", tmp_path / "origem")
    assert r.returncode == 0, r.stderr.decode("utf-8", "replace")
    assert (tmp_path / "preparo" / "segundo-cerebro-v1.1.0.zip").is_file()


def test_baixar_hash_maiusculo_confere(tmp_path):
    conteudo = zip_de_teste()
    publicar(tmp_path / "origem", "1.1.0", conteudo, sha=hashlib.sha256(conteudo).hexdigest().upper())
    r = baixar(tmp_path / "preparo", tmp_path / "origem", "-Versao", "1.1.0")
    assert r.returncode == 0, r.stderr.decode("utf-8", "replace")


def test_baixar_hash_diferente(tmp_path):
    publicar(tmp_path / "origem", "1.1.0", zip_de_teste(), sha="0" * 64)
    destino = tmp_path / "preparo"
    r = baixar(destino, tmp_path / "origem", "-Versao", "1.1.0")
    assert r.returncode == 2
    assert MANUAL in r.stderr.decode("utf-8")
    assert not destino.is_dir() or list(destino.iterdir()) == []


def test_baixar_resposta_html(tmp_path):
    # um HTML no lugar do zip, com o .sha256 batendo com ele: a conferência de zip recusa
    html = b"<!DOCTYPE html><html><body>Not Found</body></html>"
    publicar(tmp_path / "origem", "1.1.0", html)
    destino = tmp_path / "preparo"
    r = baixar(destino, tmp_path / "origem", "-Versao", "1.1.0")
    assert r.returncode == 2
    erro = r.stderr.decode("utf-8")
    assert "não é um zip" in erro and MANUAL in erro
    assert not destino.is_dir() or list(destino.iterdir()) == []


def test_baixar_arquivo_vazio(tmp_path):
    publicar(tmp_path / "origem", "1.1.0", b"")
    r = baixar(tmp_path / "preparo", tmp_path / "origem", "-Versao", "1.1.0")
    assert r.returncode == 2
    assert MANUAL in r.stderr.decode("utf-8")


def test_baixar_versao_inexistente(tmp_path):
    publicar(tmp_path / "origem", "1.1.0", zip_de_teste())
    r = baixar(tmp_path / "preparo", tmp_path / "origem", "-Versao", "9.9.9")
    assert r.returncode == 2
    assert MANUAL in r.stderr.decode("utf-8")


def test_baixar_sem_release_publicada(tmp_path):
    # a API devolve 404 enquanto só há pre-release; aqui, a falta do latest.json
    publicar(tmp_path / "origem", "1.0.0-rc.1", zip_de_teste())
    r = baixar(tmp_path / "preparo", tmp_path / "origem")
    assert r.returncode == 2
    assert MANUAL in r.stderr.decode("utf-8")


@pytest.mark.parametrize("versao", ["1.1", "1.1.0/../x", "latest"])
def test_baixar_recusa_versao_mal_formada(tmp_path, versao):
    publicar(tmp_path / "origem", "1.1.0", zip_de_teste())
    r = baixar(tmp_path / "preparo", tmp_path / "origem", "-Versao", versao)
    assert r.returncode == 2


def test_baixar_origem_so_pasta_local(tmp_path):
    r = rodar("baixar.ps1", "-Destino", str(tmp_path / "preparo"), "-Origem",
              "https://exemplo.test/releases", "-Versao", "1.1.0")
    assert r.returncode == 1
    assert "pasta" in r.stderr.decode("utf-8")
