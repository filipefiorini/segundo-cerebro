"""Testes do filtro de segredos e nomes pessoais.

Os valores proibidos são montados por concatenação para que este arquivo
não acuse a si mesmo quando o filtro varre o repositório. Os nomes são
fictícios e chegam ao filtro por uma lista local montada aqui, como a
`.git/info/filtro-nomes.txt` de quem mantém o repositório.
"""
import subprocess

import filtro

NOME_A = "Fula" + "no"
NOME_B = "Belt" + "rano"
NOME_D = "Z" + "ed"
NOME_E = "Q" + "ix"
NOME_C = "Sicr" + "ano"
ASSISTENTE = "Rob" + "ota"
BARRA = chr(92)

# Lista local fictícia: substring com (?:...), palavra isolada, caixa exata
# com (?-i:...) e um caminho.
LISTA_LOCAL = [
    "# comentario",
    "",
    "(?:" + NOME_A.lower() + ")",
    "(?:" + NOME_C.lower() + ")",
    "(?:" + ASSISTENTE.lower() + ")",
    NOME_B.lower(),
    "(?-i:(?<![A-Za-z0-9])(?:" + NOME_D + "|" + NOME_D.lower() + "|"
    + NOME_D.upper() + "|" + NOME_E + ")(?![A-Za-z0-9]))",
    "q:" + "[" + BARRA * 2 + "/]pasta",
]
EXTRAS = tuple(filtro.compilar_lista(LISTA_LOCAL))


def categorias(texto: str, nome: str = "a.md") -> list[str]:
    return [linha.split(": ", 1)[1] for linha in filtro.achados(nome, texto, EXTRAS)]


def _lista_local(raiz, linhas=LISTA_LOCAL):
    info = raiz / ".git" / "info"
    info.mkdir(parents=True, exist_ok=True)
    (info / "filtro-nomes.txt").write_text("\n".join(linhas) + "\n", encoding="utf-8")


def test_formato_da_linha_sem_valor():
    saida = filtro.achados("pasta/nota.md", "ok\n" + NOME_A, EXTRAS)
    assert saida == ["pasta/nota.md:2: nome pessoal"]
    assert NOME_A not in saida[0]


def test_chave_da_anthropic():
    assert "chave da Anthropic" in categorias("sk-ant-" + "abcdefghij12")


def test_token_de_bot_do_telegram():
    assert "token de bot do Telegram" in categorias("12345678" + ":" + "A" * 30)


def test_id_de_chat():
    assert "ID de chat" in categorias("telegram" + ":" + "98765")


def test_valor_de_chave_token_ou_senha():
    assert "valor de chave, token ou senha" in categorias("token" + "=" + "x" * 20)
    assert "valor de chave, token ou senha" in categorias("api_key" + ": " + "y" * 25)


def test_numero_longo_fora_de_url():
    assert "número longo (possível ID)" in categorias("id " + "123456" + "789")


def test_numero_longo_dentro_de_url_nao_acusa():
    assert filtro.achados("a.md", "https://api.exemplo.gov.br/serie/123456789") == []


def test_cpf():
    assert "CPF" in categorias("123.456." + "789-09")


def test_telefone():
    assert "telefone" in categorias("(11) 91234" + "-5678")
    assert "telefone" in categorias("11 3456" + "-7890")


def test_email():
    assert "e-mail" in categorias("fulano" + "@exemplo.com")


def test_email_permitido_pela_lista():
    assert filtro.achados("a.md", "user@host e usuario@servidor") == []


def test_email_pacote_com_versao_nao_acusa_pela_regra_do_dominio():
    # pacote@1.2.3 não consta na lista: passa porque o último rótulo não é alfabético
    assert "pacote@1.2.3" not in filtro.PERMITIDOS
    assert filtro.achados("a.md", "pacote@1.2.3") == []


def test_permitido_so_isenta_email():
    assert categorias("user@host " + NOME_A) == ["nome pessoal"]


def test_token_do_notion():
    assert "token do Notion" in categorias("ntn_" + "a" * 20)


def test_nomes_pessoais_insensiveis_a_caixa():
    assert categorias(NOME_B) == ["nome pessoal"]
    assert categorias(NOME_B.lower()) == ["nome pessoal"]
    assert categorias(NOME_C.upper()) == ["nome pessoal"]
    assert categorias("x" + NOME_A.lower() + "y") == ["nome pessoal"]
    assert categorias(NOME_B + "s") == []


def test_caminho_da_lista_local():
    assert categorias("Q:" + BARRA + "Pasta" + BARRA + "x") == ["nome pessoal"]
    assert categorias("q:/" + "pasta/x") == ["nome pessoal"]


def test_wikilink_com_nome_acusa():
    assert categorias(f"[[{NOME_D} — Reunião]]") == ["nome pessoal"]


def test_embed_com_nome_acusa():
    assert categorias(f"![[_assets/banner-{NOME_A.lower()}.png]]") == ["nome pessoal"]


def test_nome_d_e_tai_so_palavra_inteira_e_com_caixa():
    assert categorias(NOME_D) == ["nome pessoal"]
    assert categorias(NOME_E) == ["nome pessoal"]
    assert categorias("zedro azedo quixote " + NOME_E.lower()) == []


def test_minusculo_e_nome_do_assistente():
    assert categorias("tags: [x, " + NOME_D.lower() + "]") == ["nome pessoal"]
    assert categorias(ASSISTENTE.lower()) == ["nome pessoal"]
    assert categorias(ASSISTENTE.upper()) == ["nome pessoal"]
    for texto in ("zede-o", "azedo", "zedar", "Zed" + "a"):
        assert categorias(texto) == []


def _git(raiz, *args):
    subprocess.run(["git", *args], cwd=raiz, check=True, capture_output=True)


def test_varrer_ignora_o_proprio_filtro_mas_nao_os_testes(tmp_path):
    _git(tmp_path, "init", "-q")
    _lista_local(tmp_path)
    (tmp_path / "scripts" / "tests").mkdir(parents=True)
    (tmp_path / "scripts" / "filtro.py").write_text(NOME_A, encoding="utf-8")
    (tmp_path / "scripts" / "filtro_permitidos.txt").write_text(NOME_A, encoding="utf-8")
    (tmp_path / "scripts" / "tests" / "t.py").write_text("x\n" + NOME_A, encoding="utf-8")
    (tmp_path / "nota.md").write_text("limpa", encoding="utf-8")
    (tmp_path / "foto.png").write_bytes(NOME_A.encode())
    _git(tmp_path, "add", "-A")
    assert filtro.varrer(tmp_path) == ["scripts/tests/t.py:2: nome pessoal"]


def test_main_codigos_de_saida(tmp_path, capsys):
    _git(tmp_path, "init", "-q")
    _lista_local(tmp_path)
    (tmp_path / "a.md").write_text("limpa", encoding="utf-8")
    _git(tmp_path, "add", "-A")
    assert filtro.main(tmp_path) == 0
    assert capsys.readouterr().out == ""
    (tmp_path / "a.md").write_text(NOME_A, encoding="utf-8")
    _git(tmp_path, "add", "-A")
    assert filtro.main(tmp_path) == 1
    assert capsys.readouterr().out == "a.md:1: nome pessoal\n"


def test_chave_com_prefixo_e_json():
    cat = "valor de chave, token ou senha"
    assert cat in categorias("OPENAI_API_KEY" + "=" + "k" * 20)
    assert cat in categorias("TELEGRAM_BOT_TOKEN" + "=" + "k" * 20)
    assert cat in categorias('"token"' + ": " + '"' + "k" * 20 + '"')
    assert cat in categorias('"api_key"' + ": " + '"' + "k" * 20 + '"')
    assert categorias("token" + "=" + "curto123") == []


def test_numero_longo_com_ponto_final():
    cat = "número longo (possível ID)"
    assert cat in categorias("ID 123456" + "789.")
    assert cat in categorias("CPF 12345" + "678909.")
    assert categorias("v1." + "123456" + "789") == []
    assert categorias("3." + "14159" + "2653") == []


def test_nome_d_e_tai_delimitados_por_sublinhado_e_digito():
    assert categorias(NOME_D + "_Parceiros") == ["nome pessoal"]
    assert categorias("Parceiro_" + NOME_D) == ["nome pessoal"]
    assert categorias("Qixo" + "te azedo") == []
    assert categorias(NOME_D + "2") == []


def test_varrer_acusa_nome_de_arquivo(tmp_path):
    _git(tmp_path, "init", "-q")
    _lista_local(tmp_path)
    nome = NOME_D + " — Reunião.md"
    (tmp_path / nome).write_text("limpa", encoding="utf-8")
    (tmp_path / ("banner-" + NOME_A.lower() + ".png")).write_bytes(b"x")
    (tmp_path / "ok.png").write_bytes(b"x")
    _git(tmp_path, "add", "-A")
    assert sorted(filtro.varrer(tmp_path)) == sorted([
        nome + ":0: nome de arquivo",
        "banner-" + NOME_A.lower() + ".png:0: nome de arquivo",
    ])


def test_token_do_telegram_dentro_de_url():
    url = "https://api.exemplo.org/bot" + "12345678" + ":" + "A" * 30 + "/getMe"
    assert "token de bot do Telegram" in categorias(url)


def test_novos_formatos_de_segredo():
    assert "chave do Google" in categorias("AI" + "za" + "A" * 30)
    assert "token do GitHub" in categorias("gh" + "p_" + "a" * 30)
    assert "token do GitHub" in categorias("github" + "_pat_" + "a" * 30)
    assert "chave da AWS" in categorias("AK" + "IA" + "A" * 16)
    assert "JWT" in categorias("ey" + "J" + "a" * 10 + "." + "b" * 10 + ".")
    assert "token Bearer" in categorias("Bear" + "er " + "a" * 20)
    assert "chave privada" in categorias("-----BEGIN " + "RSA PRIVATE" + " KEY-----")
    assert "chave da OpenAI" in categorias("sk" + "-" + "a" * 20)
    assert "chave da OpenAI" in categorias("sk" + "-proj-" + "a" * 20)
    assert categorias("task-notes-default-view-with-long-name") == []


def test_valor_de_chave_a_partir_de_16_e_novas_palavras():
    cat = "valor de chave, token ou senha"
    assert cat in categorias("token" + "=" + "k" * 16)
    assert cat in categorias("chave" + ": " + "k" * 16)
    assert cat in categorias("key" + "=" + "k" * 16)
    assert categorias("token" + "=" + "k" * 15) == []


def test_maiusculo_e_caminho_de_usuario_e_telefone_com_espaco():
    assert categorias(NOME_D.upper()) == ["nome pessoal"]
    assert categorias("ZEDO e AZEDO") == []
    assert categorias("C:" + BARRA + "Users" + BARRA + "maria") == ["caminho pessoal"]
    assert categorias("c:/" + "users/maria") == ["caminho pessoal"]
    assert categorias("C:" + BARRA + "Users" + BARRA + "<usuario>") == []
    assert "telefone" in categorias("11 91234" + " 5678")
    assert "telefone" in categorias("(11) 3456" + " 7890")


def test_varrer_le_extensoes_novas_e_arquivos_sem_extensao(tmp_path):
    _git(tmp_path, "init", "-q")
    _lista_local(tmp_path)
    (tmp_path / ".githooks").mkdir()
    (tmp_path / ".githooks" / "pre-commit").write_text("#!/bin/sh\n" + NOME_A, encoding="utf-8")
    (tmp_path / "LICENSE").write_text(NOME_A, encoding="utf-8")
    for ext in ("js", "mjs", "css", "yaml", "toml", "sh", "ini", "cfg"):
        (tmp_path / ("x." + ext)).write_text(NOME_A, encoding="utf-8")
    (tmp_path / "foto.png").write_bytes(NOME_A.encode())
    _git(tmp_path, "add", "-A")
    achou = sorted(l.split(":", 1)[0] for l in filtro.varrer(tmp_path))
    assert achou == sorted([
        ".githooks/pre-commit", "LICENSE",
        "x.js", "x.mjs", "x.css", "x.yaml", "x.toml", "x.sh", "x.ini", "x.cfg",
    ])


def test_varrer_le_o_indice_quando_o_arquivo_esta_em_stage(tmp_path):
    _git(tmp_path, "init", "-q")
    _lista_local(tmp_path)
    (tmp_path / "a.md").write_text(NOME_A, encoding="utf-8")
    _git(tmp_path, "add", "-A")
    (tmp_path / "a.md").write_text("limpa", encoding="utf-8")
    assert filtro.varrer(tmp_path) == ["a.md:1: nome pessoal"]
    _git(tmp_path, "add", "-A")
    assert filtro.varrer(tmp_path) == []


def test_lista_local_de_nomes_opcional(tmp_path):
    _git(tmp_path, "init", "-q")
    (tmp_path / "a.md").write_text("fala do Bel" + "trano aqui", encoding="utf-8")
    (tmp_path / "b.md").write_text("limpa", encoding="utf-8")
    _git(tmp_path, "add", "-A")
    assert filtro.varrer(tmp_path) == []
    _lista_local(tmp_path, ["# comentario", "", "bel" + "TRANO"])
    assert filtro.varrer(tmp_path) == ["a.md:1: nome pessoal"]


def test_lista_local_e_lida_do_repositorio(tmp_path):
    _git(tmp_path, "init", "-q")
    _lista_local(tmp_path)
    (tmp_path / "a.md").write_text("x\n" + NOME_D + "_Parceiros", encoding="utf-8")
    (tmp_path / ("nota-" + NOME_C.lower() + ".md")).write_text("limpa", encoding="utf-8")
    _git(tmp_path, "add", "-A")
    assert sorted(filtro.varrer(tmp_path)) == sorted([
        "a.md:2: nome pessoal",
        "nota-" + NOME_C.lower() + ".md:0: nome de arquivo",
    ])


def test_sem_lista_local_so_os_padroes_genericos(tmp_path):
    _git(tmp_path, "init", "-q")
    texto = NOME_A + " " + NOME_D + " " + ASSISTENTE + "\nC:" + BARRA + "Users" + BARRA + "maria"
    (tmp_path / "a.md").write_text(texto, encoding="utf-8")
    _git(tmp_path, "add", "-A")
    assert filtro.varrer(tmp_path) == ["a.md:2: caminho pessoal"]
    assert filtro.achados("a.md", NOME_A + " " + NOME_D) == []


def test_regex_invalida_na_lista_vale_como_texto():
    extras = tuple(filtro.compilar_lista(["(abc"]))
    assert filtro.achados("a.md", "x (abc y", extras) == ["a.md:1: nome pessoal"]
    assert filtro.achados("a.md", "abc", extras) == []


def _conta_do_endereco():
    """A conta sai do endereço listado em `filtro_permitidos.txt`, em tempo de execução."""
    endereco = filtro.ENDERECOS[0]
    return endereco.split("/", 1)[0], endereco


def _extras_com_conta(conta):
    return tuple(filtro.compilar_lista(LISTA_LOCAL + [conta]))


def test_endereco_do_repositorio_passa():
    conta, endereco = _conta_do_endereco()
    extras = _extras_com_conta(conta)
    for linha in (
        "https://github.com/" + endereco + "/releases/tag/v1.0.0-rc.1",
        "/plugin marketplace add " + endereco,
        "informe `" + endereco + "` e instale",
    ):
        assert filtro.achados("a.md", linha, extras) == []


def test_conta_fora_do_endereco_barrada():
    conta, _ = _conta_do_endereco()
    extras = _extras_com_conta(conta)
    assert filtro.achados("a.md", "feito por " + conta + " ontem", extras) == [
        "a.md:1: nome pessoal"]
    assert filtro.achados("a.md", conta + "/outro-repo", extras) == ["a.md:1: nome pessoal"]


def test_conta_solta_na_mesma_linha_do_endereco_barrada():
    conta, endereco = _conta_do_endereco()
    extras = _extras_com_conta(conta)
    linha = "veja github.com/" + endereco + " ou fale com " + conta
    assert filtro.achados("a.md", linha, extras) == ["a.md:1: nome pessoal"]


def test_endereco_nao_isenta_email():
    _, endereco = _conta_do_endereco()
    assert "e-mail" in categorias(endereco + " fulano" + "@exemplo.com")
