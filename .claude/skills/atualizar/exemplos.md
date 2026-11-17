# atualizar — exemplos de execução

> Carregado sob demanda pelo [SKILL.md](SKILL.md). Pessoas, versões e arquivos fictícios. Diálogo resumido: os textos completos estão no [reference.md](reference.md).

## Exemplo 1 — Nada alterado pela pessoa

Ana instalou a 1.0.0 pelo `/instalar` e, fora do que a instalação gravou (o bloco do dono e a tabela de áreas no `CLAUDE.md`), nunca mexeu nos arquivos do framework. Saiu a 1.1.0.

**Etapa 0.** O Code acha o manifesto, `.segundo-cerebro-version` com `1.0.0`, a base com arquivos e nenhum `_logs/atualizacao-v*.md`. Atualização nova. Dá a abertura, com o aviso de que a Guarda vai pedir uma confirmação perto do fim.

**Etapa 1.** O Code diz de onde baixar. Ana baixa o zip pela página de releases e diz que está em Downloads. O Code lê a versão de dentro do zip: `1.1.0`, maior que `1.0.0`. Extrai para `.segundo-cerebro/preparo/v1.1.0/origem/` (sem a pasta `segundo-cerebro-v1.1.0/` de cima), cria `_logs/atualizacao-v1.1.0.md` e roda o `comparar.ps1`: código 0.

**Etapa 2.**

> **Code:** O que muda da 1.0.0 para a 1.1.0:
> - O template de tarefa ganha o campo de tempo estimado.
> - O `/processar-inbox` passa a sugerir o prazo pela data citada na captura.
> - Duas páginas novas de ajuda em `_docs/`.
>
> Agora eu vejo, arquivo por arquivo, o que fazer. Sigo?
>
> **Ana:** Segue.

**Etapa 3.** No `comparacao.json`: 2 `copiar` (as páginas novas), 4 `substituir`, 1 `substituir` com blocos (`CLAUDE.md`, 3 de cada lado), o resto `nada` ou `ignorar`. Nenhuma pergunta: o Code transplanta os três blocos do `CLAUDE.md` da Ana para a versão nova, grava em `mesclados/CLAUDE.md`, relê e confere os três pares. Tabela de ações no log. A release não muda código de módulo: `modulos_mudaram: nao`.

**Etapa 4.** Nada a mesclar.

**Etapa 5.**

> **Code:** Resumo da atualização para a 1.1.0: 2 arquivos novos, 4 substituídos pela versão nova, e o `CLAUDE.md` substituído com os seus trechos preservados. Nada removido, nada renomeado, nenhum código de módulo trocado. Antes de gravar, eu faço um commit do estado atual no Git e o próprio script guarda um backup de tudo o que vai mudar. Posso aplicar?
>
> **Ana:** Pode.

O Code grava `preparo/v1.1.0/.segundo-cerebro-version` e o `plano.json`: 7 cópias para o vault, as cópias de cada `fixo` para a base, a versão e a lista da release.

**Etapa 6.** `git add -A`, sem as pastas de preparo e de backup, e o commit "antes da atualização para v1.1.0". `commit_antes: sim`.

**Etapa 7.** O Code avisa da confirmação da Guarda e roda o `aplicar.ps1`. A Guarda pergunta, com o motivo `ATUALIZAÇÃO`; Ana confere que é o comando anunciado e aceita (a única confirmação da atualização). Código 0; `backup: <data-hora>-v1.0.0-para-v1.1.0`.

**Etapa 8.** A conferência dá "ok" em todas as linhas; os três blocos do `CLAUDE.md` estão lá, com o conteúdo de antes; a raiz diz `1.1.0`.

**Etapa 9.** Sem migrações.

**Etapa 10.** Mensagem final com o que mudou e como desfazer, sem o passo de reabrir a sessão.

---

## Exemplo 2 — Blocos alterados pela pessoa e um template mudado pelos dois lados

Ana, agora na 1.1.0, vai para a 1.2.0. Desde a última atualização, ela:

- mudou as prioridades no bloco do dono e acrescentou dois projetos à tabela "Projetos e áreas ativos" do `CLAUDE.md`, que fica dentro de um bloco `usuario:`;
- escreveu tags próprias na seção "Tags e valores próprios" da `_docs/Taxonomia de Tags.md`, também dentro de um bloco;
- acrescentou ao `_templates/Template de Reunião.md` um campo `local:` no frontmatter.

A 1.2.0 muda uma regra no `CLAUDE.md` (fora dos blocos), acrescenta uma tag de status à Taxonomia (fora do bloco) e uma seção "Gravação" no fim do template de reunião.

**Etapas 0 a 2** como no exemplo 1.

**Etapa 3.** O `comparacao.json` traz:

| Arquivo | `acao` | Blocos (instância / nova) |
|---|---|---|
| `CLAUDE.md` | `substituir` | 3 / 3 |
| `_docs/Taxonomia de Tags.md` | `substituir` | 1 / 1 |
| `_templates/Template de Reunião.md` | `mesclar` | 0 / 0 |

O `CLAUDE.md` e a Taxonomia vêm como `substituir`, não `mesclar`: tudo o que Ana mudou está dentro dos blocos, que o script desconta. O Code transplanta os blocos dela (no `CLAUDE.md`, o dono com as prioridades novas, a tabela com os dois projetos e a Zero Trust; na Taxonomia, as tags dela) para a versão nova e grava os dois em `mesclados/`, sem pergunta. Relê: 3 pares e 1 par, com o conteúdo da Ana.

**Etapa 4.** O template de reunião mudou dos dois lados.

> **Code:** No `_templates/Template de Reunião.md`, você e a versão nova mudaram coisas diferentes. Juntei as duas:
> - Seu: o campo `local:` no frontmatter.
> - Da versão nova: a seção "Gravação" no fim, com o link da gravação e o resumo.
>
> Posso usar essa versão?
>
> **Ana:** Pode.

Gravado em `mesclados/_templates/Template de Reunião.md`, relido.

**Etapa 5.** Resumo: o `CLAUDE.md` e a Taxonomia "substituídos, com os seus trechos preservados", o template "mesclado com as suas mudanças", mais os substituídos e novos. Ana aprova. O `plano.json` copia os três de `mesclados/` e o resto de `origem/`; a base recebe os três como vieram na release, de `origem/`.

**Etapas 6 a 8** como no exemplo 1. Na conferência, os três arquivos de `mesclados/` batem com o aprovado; o `CLAUDE.md` tem os 3 pares com os dois projetos novos da Ana; a Taxonomia, o bloco com as tags dela.

**Etapa 9.** A 1.2.0 traz uma migração:

> **Code:** A versão nova traz uma mudança que pode ser aplicada às suas notas: as notas de reunião passam a ter o campo `gravacao:` no frontmatter, vazio quando não houver gravação. Quer que eu aplique? Eu mostro cada nota antes de mudar.
>
> **Ana:** Agora não.

Log: `migracoes: ["reuniao-gravacao: recusada"]`.

**Etapa 10.** Mensagem final; em "O que ficou como você deixou", nada; a migração recusada aparece em "O que mudou" como recusada.

---

## Exemplo 3 — Template removido na release e alterado pela pessoa

Carlos, na 1.2.0, vai para a 1.3.0. A 1.3.0 tira o `_templates/Template de Livro.md` (o de Nota de Literatura - Livro cobre o mesmo uso). Carlos tinha acrescentado ao template de livro uma seção "Citações favoritas".

**Etapa 3.** O arquivo vem em `removidos` do `comparacao.json`. O Code compara o arquivo do Carlos com a cópia da base: diferentes.

> **Code:** A versão nova deixa de ter o `_templates/Template de Livro.md`. Atenção: você fez mudanças nele, e elas se perdem se ele sair (ficam só no backup). Removo, ou deixo ele no vault? Se ficar, ele passa a ser só seu e nenhuma atualização mexe mais nele.
>
> **Carlos:** Deixa.

Tabela de ações: `_templates/Template de Livro.md` | removido | não remover | —. No `plano.json`, só `remover` da cópia na base, `.segundo-cerebro/base/_templates/Template de Livro.md`; o template do Carlos fica onde está.

Se Carlos tivesse dito "remove", o `plano.json` teria as duas remoções, e o template voltaria pelo modo desfazer, de um arquivo.

**Etapas 4 a 10** como no exemplo 1. Em "O que ficou como você deixou": `_templates/Template de Livro.md` (removido da versão nova; agora é só seu).

---

## Exemplo 4 — Vault sem base e desfazer de um arquivo

Bruno instalou a 1.0.0-dev, antes de a instalação guardar a cópia da versão instalada: o vault não tem `.segundo-cerebro/base/`. Ele vai para a 1.1.0 (`1.0.0-dev` é menor que `1.0.0`, que é menor que `1.1.0`).

**Etapa 0.** Sem base: a abertura ganha a observação de que, desta vez, toda diferença vira pergunta.

**Etapa 3.** O `comparacao.json` tem `tem_base: false`. Os arquivos iguais à nova vêm como `nada`; os diferentes, e os ausentes, como `perguntar`. São nove perguntas. Duas delas:

> **Code:** O `_docs/Manual do Segundo Cérebro.md` está diferente da versão nova. Como não tenho a cópia do que você instalou, não sei se a diferença é sua ou da versão nova. As diferenças:
>
> ```diff
> - O INBOX é esvaziado uma vez por semana.
> + O INBOX é esvaziado uma vez por semana, pelo /processar-inbox.
> ```
>
> Fico com o da versão nova, mantenho o seu ou faço uma mescla dos dois para você aprovar?
>
> **Bruno:** O da versão nova.

> **Code:** A versão nova tem o `_docs/Guia do Painel.md`, e ele não está no seu vault. Pode ser um arquivo novo, ou um que você apagou. Trago ele?
>
> **Bruno:** Traz.

No `CLAUDE.md`, com 3 blocos de cada lado, o diff desconta os blocos; Bruno escolhe a versão nova, e o Code transplanta os blocos dele em `mesclados/CLAUDE.md`: o plano copia de lá, não de `origem/`, para o bloco do dono e a tabela de projetos não se perderem.

**Etapas 4 a 10** como no exemplo 1. O plano grava a base pela primeira vez: a próxima atualização do Bruno já compara a três.

**Uma semana depois, o desfazer.** Bruno sente falta da frase antiga do Manual.

> **Bruno:** /atualizar desfazer
>
> **Code:** Tenho estes backups de atualização:
> 1. 08/12 — da 1.0.0-dev para a 1.1.0 (o mais recente)
>
> Quer voltar uma atualização inteira, ou só um arquivo? E de qual?
>
> **Bruno:** Só o Manual.
>
> **Code:** Vai aparecer um pedido de confirmação da Guarda com o motivo `ATUALIZAÇÃO`, para o comando que desfaz. Confira e aceite.

O Code roda o `desfazer.ps1` com `-Backup .segundo-cerebro/backup/<data-hora>-v1.0.0-dev-para-v1.1.0 -Arquivo "_docs/Manual do Segundo Cérebro.md"`. Bruno aceita a confirmação. Código 0.

> **Code:** Pronto: o `_docs/Manual do Segundo Cérebro.md` voltou a ser o de antes. Na próxima atualização ele conta como alterado por você: se a versão nova mudar esse arquivo, eu mostro a mescla para você aprovar.

Log `_logs/atualizacao-v1.1.0.md`, em `## Desfeito`: `- 2026-12-15 — arquivo _docs/Manual do Segundo Cérebro.md a partir de <data-hora>-v1.0.0-dev-para-v1.1.0: restaurado`.
