# atualizar — referência

> Detalhe das etapas 0 a 10 e do modo desfazer: textos das mensagens, comandos, esquemas e regras. Carregado sob demanda pelo [SKILL.md](SKILL.md).

Os textos em bloco de citação são ditos à pessoa como estão, trocando só o que vem entre `<>`. Uma pergunta por mensagem. Os comandos rodam a partir da raiz do vault, pelo Code; a pessoa nunca digita nada. A saída de um comando nunca vai crua para a pessoa: o Code conta o resultado em linguagem simples.

`<de>` é a versão instalada (`.segundo-cerebro-version`), `<para>` a versão nova, `<p>` a pasta `.segundo-cerebro/preparo/v<para>`.

---

## Comparação de versões

Uma versão tem três números e, opcionalmente, um sufixo: `1.2.0`, `1.2.0-dev`, `1.2.0-ensaio`.

- Compara-se número a número, da esquerda para a direita: `1.10.0` é maior que `1.9.3`.
- Com os três números iguais, a versão com sufixo vem antes da sem sufixo: `1.2.0-dev` é menor que `1.2.0`.
- Dois sufixos diferentes sobre os mesmos números (`1.2.0-dev` e `1.2.0-ensaio`) não se comparam. Formato fora deste também não.

O `comparar.ps1` usa a mesma regra e sai com 3 quando as versões não se comparam. Ele não recusa `para` menor ou igual a `de`: quem para nesse caso é a skill, na etapa 1, antes de extrair.

---

## Blocos `usuario:` — regra de transplante

Um bloco é o trecho entre uma linha `<!-- usuario:inicio -->` e a linha `<!-- usuario:fim -->` seguinte. A regra é a mesma do `comparar.ps1`:

- O marcador só conta quando ocupa a linha inteira (espaço em volta é permitido) e está fora de cerca de código (linhas entre ```` ``` ```` ou `~~~`). Marcador citado no meio de uma frase ou dentro de cerca é texto comum, e o que vem depois dele não é bloco.
- Bloco aberto sem fechamento até o fim do arquivo não conta.
- A comparação do script desconta o conteúdo dos blocos nos três lados (instância, base, nova). O `comparacao.json` traz o número de blocos de cada lado em `blocos.instancia` e `blocos.nova`.

**Quando transplantar:** sempre que o arquivo existe na instância, o resultado vai ser a versão nova ou uma mescla, e `blocos.instancia` ou `blocos.nova` é maior que 0. Vale para `substituir`, `mesclar` e para toda escolha de "a nova" ou de mescla numa pergunta (`perguntar`, número de blocos diferente). Nesses casos o arquivo nunca é copiado direto de `origem/`: copiar de `origem/` apagaria os blocos da pessoa. Só vai direto de `origem/` o arquivo ausente na instância ou com 0 blocos dos dois lados.

Transplantar é montar o arquivo final assim:

1. Se `blocos.instancia` ≠ `blocos.nova`, não transplantar sozinho: mostrar os dois lados e perguntar (texto na etapa 3). Se a pessoa aceitar a versão nova com os trechos dela nos lugares propostos, o Code monta esse arquivo em `mesclados/` e mostra para aprovação.
2. Partir do texto da versão nova (`substituir`, ou "a nova" numa pergunta) ou da mescla aprovada (`mesclar`, ou mescla numa pergunta).
3. Trocar o conteúdo do 1º bloco pelo conteúdo do 1º bloco da instância, o do 2º pelo 2º, e assim por diante. As linhas dos marcadores ficam como estão na versão nova. Fora dos blocos, nada da instância entra.
4. Manter os fins de linha da versão nova (LF). Assim, na próxima atualização, o texto fora dos blocos bate com a base.
5. Gravar em `<p>/mesclados/<rel>` e reler: o número de blocos tem de ser o mesmo da instância.

---

## Log — `_logs/atualizacao-v<para>.md`

Criado na etapa 1, logo depois da conferência de versões, com Write. Depois, só Edit. Se o arquivo já existe (atualização para a mesma versão desfeita e refeita, ou abandonada), nunca Write: ver "Log que já existe", abaixo do modelo.

```markdown
---
tipo: log
tags: [log, atualizacao]
criado: AAAA-MM-DD
de: 1.0.0
para: 1.1.0
tem_base: true
etapa_atual: 2
etapas_concluidas: [0, 1]
commit_antes:
backup:
modulos_mudaram:
migracoes: []
abandonado:
---

# Atualização para a versão 1.1.0

Estado da atualização, atualizado pelo `/atualizar` ao fim de cada etapa. Para continuar de onde parou, chame `/atualizar` de novo. Para desfazer, `/atualizar desfazer`.

## Etapas

| Etapa | Concluída em | Resumo |
|---|---|---|
| 0 — Estado | AAAA-MM-DD | Versão 1.0.0, com base |
| 1 — Release | AAAA-MM-DD | Zip conferido; comparação gravada |

## Ações

| Arquivo | Ação do script | Decisão | Vem de |
|---|---|---|---|

## Pendências

## Desfeito
```

- `etapa_atual` é a próxima etapa a fazer. Ao terminar a etapa N: N entra em `etapas_concluidas`, `etapa_atual` passa a N+1 (fica 10 depois da etapa 10) e a tabela de etapas ganha uma linha.
- `## Ações` recebe, na etapa 3, uma linha por arquivo cuja ação não é `nada` nem `ignorar`, mais uma por remoção e renomeação. "Decisão" é o que vai acontecer (`copiar`, `substituir`, `transplantar`, `manter`, `mesclar`, `restaurar`, `manter apagado`, `remover`, `renomear`, `não remover`) e "Vem de" é `origem`, `mesclados` ou `—`. Uma decisão registrada não é perguntada de novo na retomada.
- `## Pendências`: uma linha por item adiado, com a etapa.
- `## Desfeito`: uma linha por uso do modo desfazer: `- AAAA-MM-DD — <tudo | arquivo> a partir de <pasta do backup>: <resultado>`.
- `modulos_mudaram` é gravado na etapa 3, quando as decisões estão tomadas.
- `abandonado`: vazio; recebe a data quando a pessoa troca esta atualização por outra versão (etapa 0). Log com `abandonado` não é retomado.

**Log que já existe.** Na etapa 1, se `_logs/atualizacao-v<para>.md` já existe e não está aberto (10 em `etapas_concluidas`, ou `abandonado` preenchido), o Code o preserva e, com Edit:

1. logo depois do parágrafo de abertura, insere o título `## Tentativa anterior (até AAAA-MM-DD)` com uma linha que guarda os valores do frontmatter antigo (`de`, `etapas_concluidas`, `commit_antes`, `backup`, `migracoes`, `abandonado`), e rebaixa os títulos `## Etapas`, `## Ações` e `## Pendências` antigos para `###`, que ficam dentro dela;
2. insere, antes de `## Desfeito` (que continua uma só, no fim, com as linhas antigas), as seções novas `## Etapas`, `## Ações` e `## Pendências`, vazias como no modelo;
3. recomeça o frontmatter: `criado` de hoje, `de`, `tem_base`, `etapa_atual: 1`, `etapas_concluidas: [0]` e os outros campos vazios.

---

## `comparacao.json` (gravado pelo `comparar.ps1`)

```json
{
  "de": "1.0.0",
  "para": "1.1.0",
  "tem_base": true,
  "arquivos": [
    {"caminho": "CLAUDE.md", "tipo": "fixo", "acao": "substituir", "blocos": {"instancia": 3, "nova": 3}}
  ],
  "removidos": ["_templates/Template antigo.md"],
  "renomeados": [{"de": "_docs/Nome antigo.md", "para": "_docs/Nome novo.md"}],
  "migracoes": [{"id": "tarefas-executor", "descricao": "...", "instrucoes": "..."}]
}
```

- `acao`: `copiar`, `perguntar-apagado`, `nada`, `substituir`, `manter`, `mesclar`, `modulo`, `perguntar`, `criar` ou `ignorar` (tabela no SKILL.md).
- `removidos`, `renomeados` e `migracoes` juntam os itens do `historico` da release com versão maior que `de` e até `para`.
- Sem base (`tem_base: false`), todo `fixo` diferente da nova (ou ausente) vem como `perguntar`.

Códigos de saída: 0 gravou; 1 uso errado ou pasta não encontrada; 2 a release não confere (arquivo ausente ou hash diferente, lista impressa) ou o `segundo-cerebro.release.json` falta ou é inválido; 3 versões que não se comparam ou falta o `.segundo-cerebro-version`.

---

## `plano.json` (gravado pelo Code na etapa 5)

```json
{
  "de": "1.0.0",
  "para": "1.1.0",
  "renomear": [
    {"de": "_docs/Nome antigo.md", "para": "_docs/Nome novo.md"},
    {"de": ".segundo-cerebro/base/_docs/Nome antigo.md", "para": ".segundo-cerebro/base/_docs/Nome novo.md"}
  ],
  "copiar": [
    {"de": ".segundo-cerebro/preparo/v1.1.0/origem/_docs/Ferramentas.md", "para": "_docs/Ferramentas.md"},
    {"de": ".segundo-cerebro/preparo/v1.1.0/mesclados/CLAUDE.md", "para": "CLAUDE.md"},
    {"de": ".segundo-cerebro/preparo/v1.1.0/origem/CLAUDE.md", "para": ".segundo-cerebro/base/CLAUDE.md"},
    {"de": ".segundo-cerebro/preparo/v1.1.0/.segundo-cerebro-version", "para": ".segundo-cerebro-version"},
    {"de": ".segundo-cerebro/preparo/v1.1.0/origem/segundo-cerebro.release.json", "para": "segundo-cerebro.release.json"}
  ],
  "remover": ["_templates/Template antigo.md", ".segundo-cerebro/base/_templates/Template antigo.md"]
}
```

Caminhos relativos à raiz, com `/`, sem `..` e sem letra de unidade. UTF-8 sem BOM (o Write grava assim). O `aplicar.ps1` recusa, antes de gravar qualquer coisa: caminho fora da raiz; `copiar.de` fora de `.segundo-cerebro/preparo/`; `copiar.para` que não seja arquivo listado na release, `.segundo-cerebro/base/<fixo listado>`, `.segundo-cerebro-version` ou `segundo-cerebro.release.json`; `remover` e `renomear` que o `historico` da release não lista (nem a cópia deles na base).

Ordem de execução do script: renomeia, copia, remove. Renomeação cuja origem não existe é pulada.

Como montar:

| Situação | Entradas |
|---|---|
| `copiar`, `criar`, `modulo`, `perguntar-apagado` restaurado, `perguntar` com "traga" (arquivo ausente); `substituir` ou `perguntar` com "a nova" quando `blocos.instancia` e `blocos.nova` são 0 | `copiar` de `<p>/origem/<rel>` para `<rel>` |
| `substituir` ou `perguntar` com "a nova" quando algum lado tem blocos (transplante), `mesclar`, mescla numa pergunta | `copiar` de `<p>/mesclados/<rel>` para `<rel>` |
| `nada`, `manter`, `ignorar`, `perguntar` com "a minha", `perguntar-apagado` mantido apagado | nenhuma |
| Base nova | `copiar` de `<p>/origem/<rel>` para `.segundo-cerebro/base/<rel>`, para cada `fixo` da release, inclusive os que não mudam |
| Versão | `copiar` de `<p>/.segundo-cerebro-version` para `.segundo-cerebro-version` e de `<p>/origem/segundo-cerebro.release.json` para `segundo-cerebro.release.json` |
| Removido, confirmado | `remover` `<rel>` e `.segundo-cerebro/base/<rel>` |
| Removido, recusado | `remover` só `.segundo-cerebro/base/<rel>`; o arquivo fica, fora da release, e nunca mais é tocado |
| Renomeado | `renomear` `<de>` → `<para>` (se a pessoa confirmou) e, sempre, a mesma renomeação na base |

As entradas da base nova saem prontas deste comando (só lê; o Code cola o resultado na lista `copiar`):

```
$p = '.segundo-cerebro/preparo/v<para>'; $r = Get-Content -LiteralPath "$p/origem/segundo-cerebro.release.json" -Raw -Encoding UTF8 | ConvertFrom-Json; ConvertTo-Json -Compress -InputObject @($r.arquivos | Where-Object { $_.tipo -eq 'fixo' } | ForEach-Object { [ordered]@{ de = "$p/origem/$($_.caminho)"; para = ".segundo-cerebro/base/$($_.caminho)" } })
```

---

## `backup.json` (gravado pelo `aplicar.ps1`)

Na pasta `.segundo-cerebro/backup/<AAAAMMDD-HHMMSS>-v<de>-para-v<para>/` (com `-2`, `-3` se o nome repetir no mesmo segundo), junto de `arquivos/<rel>` com a cópia de cada alvo que existia:

```json
{"de": "1.0.0", "para": "1.1.0", "criado": "2026-11-10T14:03:22.418-03:00",
 "arquivos": [{"caminho": "CLAUDE.md", "existia": true}, {"caminho": "_docs/Novo.md", "existia": false}]}
```

O script mantém os dois backups bons mais novos (pelo `criado`) e apaga os outros. Pasta com `falha.txt` é de aplicação que falhou e já foi desfeita: não entra na rotação, não conta entre os dois e se acumula até a pessoa apagar.

---

## Etapa 0 — Estado

**Ler:** se existem `segundo-cerebro.manifest.json` e `.segundo-cerebro-version`; a versão instalada; se `.segundo-cerebro/base/` tem arquivos; os `_logs/atualizacao-v*.md` (frontmatter); a lista de `.segundo-cerebro/backup/` (comando do modo desfazer).

Sem manifesto:

> Esta pasta não parece ser a raiz do seu vault: falta o arquivo `segundo-cerebro.manifest.json`. No Claude Desktop, abra o Claude Code escolhendo a pasta principal do vault (a que tem `CLAUDE.md` e as pastas `00 - INBOX` a `06 - TAREFAS`) e chame `/atualizar` de novo.

Sem `.segundo-cerebro-version`:

> Este vault ainda não foi instalado: falta o arquivo que guarda a versão. Chame `/instalar` primeiro. A atualização vem depois.

**Abertura** (atualização nova):

> Vou atualizar o seu Segundo Cérebro, hoje na versão <de>. Funciona assim: você me passa o zip da versão nova, eu confiro, mostro o que mudou e o que vou fazer com cada arquivo, e só então gravo tudo de uma vez, com um backup antes.
>
> Três coisas antes de começar:
> - Suas notas, tarefas e áreas não mudam. Só os arquivos do framework (regras, skills, templates, documentação). Os trechos que são seus, como o seu bloco no `CLAUDE.md`, passam para a versão nova.
> - Você pode parar quando quiser. Para continuar depois, é só chamar `/atualizar` de novo.
> - Perto do fim, a Guarda vai pedir uma confirmação para gravar a atualização. É esperado: eu aviso antes.

Sem base, acrescentar:

> Uma observação: o seu vault foi instalado antes de existir a cópia da versão instalada que eu uso para saber o que você mudou. Por isso, desta vez, todo arquivo do framework que estiver diferente da versão nova vira pergunta: eu mostro a diferença e você decide. A partir desta atualização, a cópia passa a existir e as próximas perguntam bem menos.

**Retomada:**

> Bem-vindo de volta. A atualização para a versão <para> parou na etapa <etapa_atual> — <nome>. Já fizemos: <etapas concluídas, por nome>. Vamos continuar.

**Zip de outra versão com log aberto** (a pessoa traz, na retomada, um zip cuja versão, lida pelo comando da etapa 1, difere da `para` do log):

> Há uma atualização para a <para do log> começada e não terminada, e esse zip é da <versão do zip>. Retomo a atualização para a <para do log>, ou deixo ela de lado e sigo com a <versão do zip>?

Deixar de lado: Edit no log antigo, `abandonado: <hoje>` e uma linha em `## Pendências` ("abandonada em favor da <versão do zip>"); seguir na etapa 1 com o zip novo. A pasta de preparo antiga fica; a pessoa pode apagá-la pelo Explorador de Arquivos. Se o log antigo está na etapa 7 com backup (interrupção, abaixo), tratar a interrupção antes.

**Interrupção na etapa 7** (há pasta `*-v<de>-para-v<para>` em `.segundo-cerebro/backup/` com `backup.json`, sem `falha.txt`, criada depois do log, e 7 fora de `etapas_concluidas`; pasta sem `backup.json` é backup que nem chegou a ser criado e não conta):

> A última sessão parou enquanto a atualização era gravada, e não sei se terminou. Há um backup feito logo antes. Posso desfazer agora a partir dele, e o vault volta a ficar como antes de começar. Ou, se preferir, eu confiro arquivo a arquivo se tudo chegou. Qual?

**Feito quando:** o modo está decidido e dito à pessoa.

---

## Etapa 1 — Release

**De onde baixar:**

> Agora preciso do zip da versão nova. Baixe pela página de releases do repositório oficial do Segundo Cérebro (a mesma página de onde você baixou o vault): na versão mais recente, o arquivo que termina em `.zip`. Não use zip de outro lugar, recebido por mensagem ou montado por alguém: eu confiro cada arquivo contra a lista da própria release, e um zip diferente é recusado. Quando baixar, me diga onde ele está (por exemplo, na pasta Downloads). Se você já extraiu o zip, pode me indicar a pasta.

**Ler a versão nova sem extrair** (zip; só lê):

```
Add-Type -AssemblyName System.IO.Compression.FileSystem; $z = [IO.Compression.ZipFile]::OpenRead('<zip>'); try { $e = @($z.Entries | Where-Object { $_.FullName.Replace('\','/') -match '(^|/)segundo-cerebro\.release\.json$' } | Sort-Object { $_.FullName.Length }); if ($e.Count -eq 0) { 'sem segundo-cerebro.release.json' } else { $nome = $e[0].FullName.Replace('\','/'); $l = New-Object IO.StreamReader($e[0].Open(), (New-Object Text.UTF8Encoding $false)); try { 'versao: ' + ($l.ReadToEnd() | ConvertFrom-Json).versao } finally { $l.Dispose() }; 'prefixo: ' + $nome.Substring(0, $nome.Length - 'segundo-cerebro.release.json'.Length) } } finally { $z.Dispose() }
```

O prefixo é a pasta de cima do zip (o zip oficial tem `segundo-cerebro-v<para>/`). Pasta indicada pela pessoa: ler o `segundo-cerebro.release.json` dela com a ferramenta de leitura; se não estiver na raiz da pasta, procurar uma subpasta com ele.

Sem `segundo-cerebro.release.json`:

> Esse zip não é uma release do Segundo Cérebro: falta a lista de arquivos dela. Confira se baixou o arquivo certo na página de releases.

**Conferir versões** (regra acima), antes de extrair:

- `para` igual a `de`:
  > O seu vault já está na versão <de>. Não há o que atualizar.
- `para` menor que `de`:
  > Esse zip é da versão <para>, mais antiga que a instalada (<de>). Para voltar a uma versão anterior, o caminho é `/atualizar desfazer`, que usa o backup feito na atualização.
- Não se comparam:
  > Não consigo comparar a versão instalada (<de>) com a do zip (<para>): são duas versões de teste diferentes da mesma numeração. Me diga de onde veio esse zip. Se você está testando o framework, comece por um vault instalado a partir da mesma linha de versões.

Em todos os três, parar sem extrair e sem criar log.

**Extrair** para `<p>/origem/`, sem a pasta de cima do zip. Não usar `Expand-Archive` direto: o zip oficial tem a pasta `segundo-cerebro-v<para>/` por cima, e o `comparar.ps1` e o `aplicar.ps1` esperam a raiz da release em `origem/`. Do zip:

```
Add-Type -AssemblyName System.IO.Compression.FileSystem; $prefixo = '<prefixo>'; $destino = Join-Path (Get-Location).Path '.segundo-cerebro\preparo\v<para>\origem'; if (Test-Path -LiteralPath $destino) { 'a pasta origem já existe' } else { $raizDestino = [IO.Path]::GetFullPath($destino).TrimEnd('\') + '\'; $z = [IO.Compression.ZipFile]::OpenRead('<zip>'); try { $n = 0; foreach ($e in $z.Entries) { $nome = $e.FullName.Replace('\', '/'); if (-not $nome.StartsWith($prefixo, [StringComparison]::Ordinal) -or $nome.EndsWith('/')) { continue }; $alvo = [IO.Path]::GetFullPath($raizDestino + $nome.Substring($prefixo.Length).Replace('/', '\')); if (-not $alvo.StartsWith($raizDestino, [StringComparison]::OrdinalIgnoreCase)) { throw "caminho fora da pasta de destino: $nome" }; [void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($alvo)); [IO.Compression.ZipFileExtensions]::ExtractToFile($e, $alvo, $false); $n++ }; "extraídos: $n arquivos" } finally { $z.Dispose() } }
```

Da pasta (a que tem o `segundo-cerebro.release.json` na raiz). Confere antes se `origem/` existe, para o `Copy-Item -Recurse` não copiar a pasta para dentro dela:

```
$destino = '.segundo-cerebro/preparo/v<para>/origem'; if (Test-Path -LiteralPath $destino) { 'a pasta origem já existe' } else { New-Item -ItemType Directory -Force -Path '.segundo-cerebro/preparo/v<para>' | Out-Null; Copy-Item -LiteralPath '<pasta>' -Destination $destino -Recurse -Force; 'copiada' }
```

**Retomada na etapa 1** (o log existe, com `etapa_atual: 1`, e `origem/` já foi extraída): não extrair de novo; ir direto ao `comparar.ps1`, que reconfere cada hash. Se ele sair com 2, a extração pode ter parado no meio: tratar como a pasta de preparo antiga, abaixo (apagar com confirmação e extrair de novo), em vez de pedir outro download na primeira vez.

"caminho fora da pasta de destino": o zip não é oficial; parar e pedir para baixar de novo. "a pasta origem já existe" numa atualização nova (sem log aberto desta versão): sobrou de uma tentativa anterior.

> Encontrei uma pasta de preparo de uma tentativa anterior de atualizar para a <para>. Para começar limpo, preciso apagá-la: são só cópias de trabalho, nada do seu vault. A Guarda vai pedir confirmação para apagar. Posso?

Com o sim: `Remove-Item -LiteralPath '.segundo-cerebro/preparo/v<para>' -Recurse -Force`, e extrair de novo.

**Criar o log** pelo modelo, com `de`, `para`, `tem_base`, `etapa_atual: 1`, `etapas_concluidas: [0]`. Se `_logs/atualizacao-v<para>.md` já existe, não usar Write: seguir "Log que já existe" (seção Log).

**Comparar** (só lê; grava só o `comparacao.json`):

```
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/skills/atualizar/comparar.ps1 -Raiz . -Origem .segundo-cerebro/preparo/v<para>/origem -Saida .segundo-cerebro/preparo/v<para>/comparacao.json
```

- Código 2:
  > Parei aqui. Alguns arquivos do zip não batem com a lista da própria release: <lista curta, até cinco, e "e mais N">. Pode ser download incompleto, zip corrompido ou zip de outra origem. Nada foi preparado e nada do seu vault mudou. Baixe o zip de novo pela página de releases oficial e me avise.
- Código 3: como "Não se comparam" acima, ou, se a mensagem falar do `.segundo-cerebro-version`, como o texto de vault não instalado.
- Código 1: erro de uso do Code; corrigir o comando e rodar de novo.

**Feito quando:** o `comparacao.json` existe e o log tem a etapa 1 concluída.

---

## Etapa 2 — Novidades

**Ler:** `<p>/origem/_docs/CHANGELOG.md`. Seções `## <versão>` com versão maior que `<de>` e menor ou igual a `<para>`.

> O que muda da <de> para a <para>:
> <para cada versão, da mais antiga à mais nova: o título e um resumo em tópicos curtos, em linguagem simples>
>
> Agora eu vejo, arquivo por arquivo, o que fazer. Sigo?

**Feito quando:** a pessoa respondeu que segue. Se não quiser seguir, a etapa fica como está e o log diz onde parou.

---

## Etapa 3 — Plano por arquivo

**Ler:** `<p>/comparacao.json`. Para cada arquivo, a ação manda:

- `nada`, `ignorar`, `manter`: nada a perguntar. `manter` entra no resumo como "fica como você deixou".
- `copiar`, `criar`: entra no plano. Sem pergunta.
- `substituir` com `blocos.instancia` e `blocos.nova` iguais a 0: entra no plano, de `origem/`. Sem pergunta.
- `substituir` com `blocos.instancia` igual a `blocos.nova`, maior que 0: transplantar (regra acima), gravar em `mesclados/`, reler. Sem pergunta.
- `substituir` (ou `mesclar`, ou `perguntar`) com número de blocos diferente:
  > O `<rel>` mudou na versão nova, e o número de trechos seus (blocos marcados como seus) não bate: você tem <blocos.instancia>, a versão nova tem <blocos.nova>. Não dá para encaixar sozinho. Os dois lados:
  > <os blocos da instância e a estrutura de blocos da nova>
  >
  > Posso montar a versão nova com os seus trechos nos lugares que eu proponho, para você aprovar, ou deixar o seu arquivo como está. Qual prefere?
- `modulo`:
  > O código do módulo <Guarda | Painel> mudou na versão nova, e o seu `<rel>` também tinha mudanças. Código de módulo não se mescla: entra a versão nova, e a sua fica guardada no backup. Se a mudança era sua de propósito, me diga e eu mostro onde ela está no backup depois.
- `perguntar-apagado`:
  > O `<rel>` existia na versão que você instalou e não está mais no seu vault: imagino que você apagou. A versão nova <traz mudanças nele | não mudou nada nele>. Quer que eu restaure, ou mantenho apagado? Se mantiver, eu pergunto de novo na próxima atualização.
- `perguntar` com base (arquivo seu, sem entrada na base, com o nome de um arquivo da release):
  > A versão nova traz um `<rel>`, e você já tem um arquivo com esse nome, diferente. As diferenças:
  > <diff>
  >
  > Fico com o da versão nova, mantenho o seu ou faço uma mescla dos dois para você aprovar?
- `perguntar` sem base, arquivo presente:
  > O `<rel>` está diferente da versão nova. Como não tenho a cópia do que você instalou, não sei se a diferença é sua ou da versão nova. As diferenças:
  > <diff>
  >
  > Fico com o da versão nova, mantenho o seu ou faço uma mescla dos dois para você aprovar?
- `perguntar` sem base, arquivo ausente:
  > A versão nova tem o `<rel>`, e ele não está no seu vault. Pode ser um arquivo novo, ou um que você apagou. Trago ele?

**Mostrar o diff:** o Code lê os dois lados e mostra só os trechos que mudam, num bloco `diff` curto (linhas `-` do lado da pessoa, `+` da versão nova), com uma frase sobre o que cada trecho é. Arquivo de código: só a frase e o número de linhas. Arquivo com blocos `usuario:`: o diff desconta os blocos, que vão por transplante.

**Resposta "a nova" em arquivo com blocos:** em qualquer pergunta, se a pessoa fica com a versão nova e o arquivo tem blocos de algum lado, o resultado é a versão nova com os blocos dela, por transplante em `mesclados/`, nunca a cópia direta de `origem/`. Com o mesmo número de blocos, transplanta sem nova pergunta; com número diferente, segue o texto de "número de blocos diferente" acima.

**Removidos**, um por um. Com base, o Code confere se a pessoa alterou o arquivo (`Get-FileHash` do arquivo e da cópia em `.segundo-cerebro/base/`; com blocos, descontando-os):

> A versão nova deixa de ter o `<rel>`. <Se alterado: "Atenção: você fez mudanças nele, e elas se perdem se ele sair (ficam só no backup)."> Removo, ou deixo ele no vault? Se ficar, ele passa a ser só seu e nenhuma atualização mexe mais nele.

Sem base, no lugar do aviso: "Não sei se você mudou algo nele."

**Renomeados**, um por um:

> Na versão nova, o `<de>` passa a se chamar `<para>`. <Se alterado: "Você fez mudanças nele: eu levo as suas mudanças para o arquivo com o nome novo, numa mescla que você aprova."> Posso renomear? Links de notas suas que apontem para o nome antigo param de funcionar: depois eu procuro e mostro quais são, para corrigir com o seu ok.

O `comparar.ps1` não liga o nome antigo ao novo: o nome novo vem no `comparacao.json` como `copiar` (ou `perguntar`). Renomeação confirmada de arquivo que a pessoa alterou: o Code faz a mescla do antigo da instância com o novo da release, tendo o antigo da base como referência, grava em `mesclados/<para>` e o plano copia de lá. Renomeação recusada: o antigo fica, fora da release, e o novo chega ao lado dele; dizer isso.

**Gravar:** cada decisão na tabela `## Ações` do log, na hora; `modulos_mudaram: sim` se alguma cópia do plano vai cair em `.claude/skills/guarda-constituicao/` ou `.claude/skills/painel-tarefas/` (fora `.md`), senão `nao`.

**Feito quando:** cada ação que pede pergunta tem decisão no log.

---

## Etapa 4 — Mescla

Para cada `mesclar` (com base: três lados) e cada `perguntar` em que a pessoa escolheu mescla (dois lados):

1. Com base, ler `.segundo-cerebro/base/<rel>` (o que foi instalado), `<rel>` (o da pessoa) e `<p>/origem/<rel>` (a versão nova). O que a pessoa mudou é a diferença base → instância; o que a release mudou é base → nova.
2. Montar a versão mesclada: a versão nova com as mudanças da pessoa aplicadas onde não colidem. Onde os dois lados mudaram o mesmo trecho, a mescla não decide: pergunta.
3. Blocos `usuario:` por transplante, por último.
4. Gravar em `<p>/mesclados/<rel>` (Write a primeira vez; depois, Edit).

> No `<rel>`, você e a versão nova mudaram coisas diferentes. Juntei as duas:
> - Seu: <o que veio da pessoa, em uma linha por mudança>
> - Da versão nova: <o que veio da release>
>
> <Se houver trecho contraditório: "Num ponto os dois mudaram a mesma coisa: <trecho seu> × <trecho da versão nova>. Fico com qual, ou quer um texto que junte os dois?">
>
> Posso usar essa versão?

Sem base (dois lados), dizer "a sua versão" e "a versão nova", sem separar quem mudou o quê, e perguntar trecho a trecho onde diferem.

**Feito quando:** cada mesclado está gravado, relido e aprovado; a tabela de ações diz `mesclar` e `mesclados`.

---

## Etapa 5 — Resumo e plano

**Mostrar:**

> Resumo da atualização para a <para>:
>
> | O que acontece | Arquivos |
> |---|---|
> | Arquivo novo | <n> |
> | Substituído pela versão nova | <n> |
> | Substituído, com os seus trechos preservados | <lista> |
> | Mesclado com as suas mudanças | <lista> |
> | Fica como você deixou | <lista> |
> | Removido | <lista> |
> | Renomeado | <lista> |
> | Código de módulo trocado | <lista, ou "nenhum"> |
>
> Antes de gravar, eu <faço um commit do estado atual no Git | não faço commit, porque o vault não usa Git> e o próprio script guarda um backup de tudo o que vai mudar. Posso aplicar?

**Gravar** em `<p>/`: `.segundo-cerebro-version` com `<para>` (uma linha) e o `plano.json` montado pela tabela de "Como montar". Reler o `plano.json` e conferir que cada `copiar.de` existe.

**Feito quando:** o plano está gravado e a pessoa disse que pode aplicar.

---

## Etapa 6 — Commit antes

Se existe a pasta `.git`:

```
git add -A -- . ':!.segundo-cerebro/preparo' ':!.segundo-cerebro/backup'
git commit -m "antes da atualização para v<para>"
```

O `add` deixa de fora o preparo e os backups por pathspec, sem depender do `.gitignore`: ele é do tipo `repo`, o `/atualizar` não o atualiza, e o de uma instância antiga pode não ignorar essas pastas. A base (`.segundo-cerebro/base/`) entra no commit.

- Commit feito: `commit_antes: sim`.
- "nothing to commit" (nada mudou desde o último commit): o último commit já guarda o estado; `commit_antes: sim`.
- Qualquer outra falha (Git não instalado, autor não configurado):
  > Não consegui fazer o commit antes (<motivo em uma frase>). Sigo só com o backup que o script faz, que é suficiente para desfazer.

  `commit_antes: nao`.
- Sem `.git`: `commit_antes: sem-git`, sem mensagem.

**Feito quando:** `commit_antes` tem valor.

---

## Etapa 7 — Aplicar

**Avisar:**

> Agora eu gravo a atualização. Vai aparecer um pedido de confirmação da Guarda com o motivo `ATUALIZAÇÃO`, para o comando que aplica o plano que você aprovou. Confira que é esse e aceite.
>
> <Se `modulos_mudaram: sim`: "Esta atualização troca o código da <Guarda | do Painel | Guarda e do Painel>. A troca vale a partir da próxima sessão; no fim eu peço para você fechar e abrir o Claude Code de novo.">

**Rodar** o comando do SKILL.md, etapa 7.

- Código 0: a saída termina em "Backup em .segundo-cerebro/backup/<pasta>." Gravar `backup: <pasta>` no log.
- Código 2 (recusa, nada gravado):
  > O script recusou o plano antes de gravar qualquer coisa: <motivo>. O seu vault está como estava.

  Se o erro é do Code (caminho digitado errado, entrada fora da tabela de montagem), corrigir o `plano.json` com Edit, mostrar a correção e pedir aprovação de novo. Se não, parar e registrar a pendência.
- Código 1: três casos, pela mensagem de erro do script (saída de erro, em português):
  - Começa por "Falha ao criar o backup; nada foi alterado na instância": o script parou antes de mexer em qualquer arquivo. Pode ter ficado em `.segundo-cerebro/backup/` uma pasta incompleta, sem `falha.txt` e talvez sem `backup.json`; ela não serve para desfazer.
    > Não consegui guardar o backup antes de gravar (<motivo>), então parei antes de mexer em qualquer arquivo. O seu vault está como estava. Pode ter ficado uma pasta de backup incompleta em `.segundo-cerebro/backup/`, que você pode apagar quando quiser. <Se o motivo fala de espaço em disco: "Parece falta de espaço no disco: libere um pouco e eu tento de novo." Senão: "Quer que eu tente de novo?">
  - Contém "A instância voltou ao que era": falhou no meio e o script restaurou tudo; a pasta do backup ficou, com `falha.txt`.
    > A gravação falhou no meio (<motivo>) e o script voltou tudo ao que era. O seu vault está como antes. Ficou uma pasta de backup marcada como falha, que você pode apagar quando quiser. <Se o motivo sugere arquivo aberto em outro programa: "Feche o arquivo e eu tento de novo.">
  - Contém "A restauração não conseguiu voltar": falhou no meio e a restauração não voltou alguns arquivos. Ler a lista depois dos dois-pontos e a pasta do backup em "Backup em .segundo-cerebro/backup/<pasta>". Não dizer que o vault está como antes.
    > A gravação falhou no meio (<motivo>), e o script não conseguiu voltar estes arquivos ao que eram: <lista>. Os outros voltaram. O backup de antes está guardado em `.segundo-cerebro/backup/<pasta>`. Posso tentar desfazer a partir dele agora, só para esses arquivos? <Se o motivo sugere arquivo aberto em outro programa: "Antes, feche o que estiver aberto deles.">

    Com o sim, modo desfazer com esse backup (mesmo marcado como falha), um `-Arquivo` por arquivo da lista, com o aviso da Guarda. Gravar `backup: <pasta>` e a pendência "restauração incompleta: <lista>" no log até o desfazer conferir.

  A tentativa de novo é o mesmo comando, com novo aviso da Guarda.
- Recusa da Guarda: nada gravado; perguntar o que a pessoa estranhou e parar.

**Feito quando:** o script saiu com 0 e `backup` está no log.

---

## Etapa 8 — Conferir

**Rodar** (só lê; não cita os nomes dos scripts):

```
$p = '.segundo-cerebro/preparo/v<para>'; $plano = Get-Content -LiteralPath "$p/plano.json" -Raw -Encoding UTF8 | ConvertFrom-Json; $release = Get-Content -LiteralPath "$p/origem/segundo-cerebro.release.json" -Raw -Encoding UTF8 | ConvertFrom-Json; $lista = @{}; foreach ($a in $release.arquivos) { $lista[$a.caminho] = $a.sha256 }; $h = { param($c) if (Test-Path -LiteralPath $c -PathType Leaf) { (Get-FileHash -LiteralPath $c -Algorithm SHA256).Hash.ToLowerInvariant() } }; $pre = "$p/origem/"; foreach ($c in @($plano.copiar)) { $tem = & $h $c.para; $quer = & $h $c.de; if ($c.de.StartsWith($pre) -and $lista.ContainsKey($c.de.Substring($pre.Length))) { $quer = $lista[$c.de.Substring($pre.Length)] }; if ($null -ne $tem -and $tem -eq $quer) { "ok  $($c.para)" } else { "DIFERENTE  $($c.para)" } }; foreach ($x in @($plano.remover)) { if (Test-Path -LiteralPath $x) { "AINDA EXISTE  $x" } else { "removido  $x" } }; foreach ($r in @($plano.renomear)) { if (Test-Path -LiteralPath $r.para) { "ok  $($r.para)" } else { "FALTA  $($r.para)" } }
```

Cada cópia que veio de `origem/` bate com o hash da release; cada uma que veio de `mesclados/` bate com o arquivo aprovado ali.

**Blocos:** para cada arquivo com `blocos.instancia` maior que 0, contar as linhas de marcador no arquivo da raiz (regra acima): o número de pares é o mesmo de antes, e o conteúdo de cada bloco é o da instância.

**Versão:** `.segundo-cerebro-version` diz `<para>`; o `segundo-cerebro.release.json` da raiz tem `"versao": "<para>"`.

Tudo confere:

> Conferi arquivo por arquivo: tudo chegou como planejado, os seus trechos estão no lugar e o vault agora está na versão <para>.

Algo não confere:

> Conferi e <n> arquivo(s) não estão como planejado: <lista>. Posso desfazer a atualização inteira a partir do backup, e o vault volta a ficar como antes. Ou olho um por um com você. Qual?

**Feito quando:** tudo confere, ou a pessoa decidiu (e a decisão está no log).

---

## Etapa 9 — Migrações

Migração é uma mudança que a versão nova pede nas notas da pessoa (um campo de frontmatter renomeado, por exemplo). O script não faz migração: o Code faz, nota por nota.

Sem `migracoes` no `comparacao.json`: pular, com "sem migrações" no resumo da etapa.

Para cada migração:

> A versão nova traz uma mudança que pode ser aplicada às suas notas: <descricao>. Quer que eu aplique? Eu mostro cada nota antes de mudar.

- Aceita: seguir as `instrucoes` só dentro do que elas descrevem. Listar as notas afetadas (Grep, Glob), dizer quantas são e, para cada uma, mostrar a mudança e gravar com aprovação (Edit). A pessoa pode aprovar "todas iguais a esta" depois de ver as duas primeiras. Nota em governança (`CLAUDE.md`, `_docs/`, `_templates/` e afins): a Guarda pede confirmação; avisar antes. Notas de área sensível: listar só a contagem e perguntar se entram.
- Recusada: `migracoes` no log recebe `"<id>: recusada"`. Sem pendência.
- Parou no meio: `"<id>: parcial"` e a pendência "migração <id>: faltam <n> notas".

**Feito quando:** cada migração está em `migracoes` no log.

---

## Etapa 10 — Fim

**Gravar:** no log, `etapa_atual: 10`, 10 em `etapas_concluidas` e a linha da etapa. Reler o log.

**Mensagem final.** O que vem entre `<>` sai do log; bloco entre colchetes só aparece na condição indicada.

> **Pronto. Seu Segundo Cérebro está na versão <para>.**
>
> **O que mudou**
> - <n> arquivos novos, <n> substituídos pela versão nova.
> - Com os seus trechos preservados: <lista, ou "nenhum">.
> - Mesclados com as suas mudanças: <lista, ou "nenhum">.
> - Removidos: <lista, ou "nenhum">. Renomeados: <lista, ou "nenhum">.
> - Migrações: <aplicadas e recusadas, ou "nenhuma">.
>
> **O que ficou como você deixou**
> - <lista de `manter` e das escolhas "manter o meu", ou "Nada.">
>
> **O que ficou pendente**
> - <uma linha por pendência, ou "Nada.">
>
> **Se precisar voltar atrás**
> O backup de tudo o que mudou está em `.segundo-cerebro/backup/<pasta>`. Chame `/atualizar desfazer`: dá para voltar a atualização inteira ou só um arquivo. <Se `commit_antes: sim`: "Também há um commit no Git com o estado de antes.">
>
> [Se `modulos_mudaram: sim`:]
> **Falta um passo:** feche o Claude Code e abra de novo nesta pasta. O código novo da <Guarda | do Painel> só carrega numa sessão nova.

**Feito quando:** a mensagem foi mostrada.

---

## Modo desfazer

**Listar os backups** (só lê):

```
Get-ChildItem -LiteralPath .segundo-cerebro/backup -Directory | ForEach-Object { $info = Join-Path $_.FullName 'backup.json'; $falha = Join-Path $_.FullName 'falha.txt'; if (Test-Path -LiteralPath $info) { $b = Get-Content -LiteralPath $info -Raw -Encoding UTF8 | ConvertFrom-Json; $estado = 'bom'; if (Test-Path -LiteralPath $falha) { $estado = 'falhou'; if (Select-String -LiteralPath $falha -SimpleMatch 'restaurados:' -Quiet) { $estado = 'falhou, restauracao incompleta' } }; '{0} | {1} -> {2} | {3} | {4} arquivos | {5}' -f $_.Name, $b.de, $b.para, $b.criado, @($b.arquivos).Count, $estado } else { '{0} | sem backup.json' -f $_.Name } }
```

Sem pasta ou sem backup bom:

> Não há backup de atualização neste vault: nenhuma atualização foi aplicada por aqui, ou os backups foram apagados. <Se `commit_antes: sim` em algum log: "Há um commit no Git com o estado de antes; voltar por ele exige o Git, e eu posso te orientar.">

Com backups. Entram na lista os `bom` e os `falhou, restauracao incompleta` (a restauração não voltou tudo: esse backup ainda serve para desfazer, e a pessoa vê a marca "restauração incompleta"):

> Tenho estes backups de atualização:
> 1. <data> — da <de> para a <para> (o mais recente)
> 2. <data> — da <de> para a <para>
>
> <Se houver pastas `falhou` ou `sem backup.json`: "Há também <n> pasta(s) de tentativas que falharam e já foram desfeitas, ou de backups que nem chegaram a ser criados; elas não servem para nada e você pode apagá-las pelo Explorador de Arquivos, em `.segundo-cerebro/backup/`.">
>
> Quer voltar uma atualização inteira, ou só um arquivo? E de qual?

Um arquivo: perguntar qual (mostrar os do `backup.json`, com "voltaria à versão de antes" ou "seria apagado, porque não existia antes").

Tudo, de um backup que não é o mais recente:

> Esse backup é anterior à última atualização. Voltar tudo por ele desfaz também o que a última mudou nos mesmos arquivos. O mais seguro é desfazer primeiro a mais recente. Sigo assim mesmo?

**Avisar e rodar:**

> Vai aparecer um pedido de confirmação da Guarda com o motivo `ATUALIZAÇÃO`, para o comando que desfaz. Confira e aceite.

```
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/skills/atualizar/desfazer.ps1 -Raiz . -Backup .segundo-cerebro/backup/<pasta>
```

Um arquivo: o mesmo comando com `-Arquivo "<rel>"` no fim.

- Código 0:
  > Pronto: <tudo voltou à versão <de> | o `<rel>` voltou a ser o de antes>.
  > <Tudo: "Se o código da Guarda ou do Painel mudou, feche e abra o Claude Code de novo.">
  > <Um arquivo: "Na próxima atualização ele conta como alterado por você: se a versão nova mudar esse arquivo, eu mostro a mescla para você aprovar.">
- Código 1:
  > Quase tudo voltou, mas estes não: <lista>. Costuma ser arquivo aberto em outro programa. Feche e eu tento de novo, só com eles.
- Código 2: nada mudou; dizer o motivo (backup sem `backup.json`, arquivo que não está no backup).

**Gravar:** em `## Desfeito` do log da versão do backup (`_logs/atualizacao-v<para do backup>.md`), com Edit. Se o log não existir, criar com Write só o frontmatter e essa seção.

---

## Duas notas

- **Arquivos de tipo `repo` não são atualizados.** O zip da instalação trouxe arquivos que servem ao repositório público e não à instância: `VERSION`, `segundo-cerebro.manifest.json`, `.claude-plugin/`, `.gitignore`, `.gitattributes`, as licenças. Quem instalou por clone tem também `scripts/`, `.githooks/`, `.github/`, os READMEs, `CONTRIBUTING.md` e `mudancas-proxima-versao.json`. Eles não estão no `segundo-cerebro.release.json`, então o `/atualizar` nunca os toca. Ficam como vieram. O `segundo-cerebro.manifest.json` e o `VERSION` não devem ser apagados: é pelo manifesto que a Guarda, o Painel e o `/atualizar` reconhecem a raiz do vault (sem ele a Guarda fica inativa e o `/atualizar` recusa), e o `VERSION` é lido pelo `/instalar`. O resto (licenças e, no clone, `scripts/` e READMEs) a pessoa pode apagar se quiser.
- **Quem instalou por clone atualiza pelo `/atualizar`, não por `git pull`.** O `git pull` traz a versão nova por cima de tudo: passa por fora da base (as próximas atualizações não saberiam mais o que a pessoa mudou) e do backup, e pode sobrescrever os blocos `usuario:`. O caminho é o mesmo de quem baixou o zip: baixar o zip da versão nova e chamar `/atualizar`.
