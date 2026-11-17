# Guarda da Constituição

Módulo do Claude Code que faz valer, no próprio harness, as regras do `CLAUDE.md` do vault. O Code lê a Constituição, mas pode esquecer; a Guarda olha cada chamada de ferramenta antes de ela rodar e, quando a chamada toca numa regra, pede confirmação ou recusa. Carrega sozinho quando o vault é aberto no Claude Code (aparece como `guarda-constituicao@skills-dir`), sem instalação nem configuração.

## Onde vale

A raiz do vault é a pasta onde a sessão abre. Se ela não tiver `segundo-cerebro.manifest.json` e a sessão não abrir na "Pasta do vault" configurada (modo avulso, abaixo), a Guarda não intervém em nada; com a "Pasta do vault" vazia, avisa uma vez ("Guarda inativa"). Quem abre a sessão numa subpasta e quer a Guarda ativa pode apontar a raiz no campo opcional `vault` da configuração do módulo: ela vale nessa pasta e nas subpastas dela, nunca fora.

## O que pede confirmação

- Escrita em governança: `CLAUDE.md` (em qualquer pasta do vault), `VERSION`, `.segundo-cerebro-version`, `_DECISOES.md`, `_docs/`, `_templates/`, `.claude/` (inclusive este módulo) e `02 - ÁREAS/Segundo Cérebro/`.
- `Write` que sobrescreve uma nota existente do vault.
- Comando destrutivo: `rm`, `mv`, `del`, `Remove-Item` e afins com alvo no vault ou relativo; `git rm`, `git mv`, `git clean`, `git restore`, `git rebase`, `git reset --hard`, `git commit --amend`; `find -delete`; comando de shell que escreve em arquivo de governança.
- Atualização do framework: rodar `aplicar.ps1` (inclusive com `-GravarBase`) ou `desfazer.ps1` de `.claude/skills/atualizar/` pede uma confirmação, a do plano inteiro; `comparar.ps1` só lê e passa. Escrever em `.segundo-cerebro/base/` e `.segundo-cerebro/backup/` conta como governança; o preparo (`.segundo-cerebro/preparo/`) é livre.
- Envio, escrita ou exclusão em conector do claude.ai: ferramenta cujo nome indica enviar, criar, alterar, mover ou apagar.

## O que recusa

- CPF válido em nota do vault.
- Tarefa aberta em `06 - TAREFAS/Tarefas/` gravada sem `due`, ou `Edit` que deixa o `due` vazio.
- Telefone em `CLAUDE.md`, `memory.md` ou `memory/`, lidos em toda sessão.
- Escrita em `.env` e arquivos de credencial.
- `git push --force` (e `-f`, `--force-with-lease`) e reescrita de histórico (`filter-branch`, `filter-repo`).

Onde ninguém pode responder (por exemplo `claude -p`), toda confirmação vira recusa.

## Comando `/guarda`

- `/guarda` mostra as regras e o que a Guarda interceptou na sessão.
- `/guarda liberar` suspende as confirmações por 1 hora. As recusas continuam valendo. Só vale digitado pela pessoa, e não vale onde ninguém responde.
- `/guarda travar` encerra a liberação antes da hora.

## Só a Guarda, em qualquer vault

A Guarda também pode ser instalada sozinha, como plugin, num vault que não usa o resto do framework (sem `segundo-cerebro.manifest.json`).

**Pelo terminal do Claude Code:**

```
/plugin marketplace add filipefiorini/segundo-cerebro
/plugin install guarda-constituicao@segundo-cerebro
```

Depois, em `/plugin`, preencha as opções do plugin (tabela abaixo).

**Pelo Claude Desktop:** em Configurações › Plugins › Adicionar, informe `filipefiorini/segundo-cerebro` e instale a Guarda. O Desktop não tem campo para as opções do plugin: preencha-as no PowerShell (ou peça ao Claude, numa sessão, que rode o comando), com um JSON de textos e as barras invertidas dobradas, e abra uma sessão nova:

```powershell
'{"vault": "C:\\Users\\voce\\Notas"}' | claude plugin configure guarda-constituicao@segundo-cerebro --values-stdin
```

Sem o `--values-stdin`, o comando só lista as opções e quais faltam.

Opções do plugin:

| Opção | O que faz | Vazia |
|---|---|---|
| Pasta do vault (`vault`) | Liga a Guarda: ela age só nas sessões abertas nesta pasta ou dentro dela. | A Guarda fica inerte. |
| Arquivos de governança (`governanca`) | Caminhos relativos à raiz cuja escrita pede confirmação, separados por `;`; terminado em `/` é pasta. `CLAUDE.md` e `.claude/` ficam sempre, somados à sua lista. | `CLAUDE.md; AGENTS.md; .claude/` |
| Arquivos lidos em toda sessão (`sempre_lidos`) | Onde telefone é recusado, no mesmo formato. | `CLAUDE.md` |
| Pasta de tarefas (`pasta_tarefas`) | Pasta das notas de tarefa (uma só); tarefa aberta gravada nela sem `due` é recusada. | A regra não vale. |

A Guarda continua sem ler arquivo do vault: a configuração vem só dessas opções. Aspas e espaços nas pontas da "Pasta do vault" são ignorados; se a pasta não existir, a Guarda avisa uma vez ("A 'Pasta do vault' configurada não existe").

Por fim, abra uma sessão nova no vault e rode `/guarda` para conferir que está ativa: deve aparecer "Modo: avulso…".

**Vale no modo avulso:** recusa de CPF em nota, de escrita em `.env` e credenciais, de telefone nos arquivos lidos em toda sessão, de push forçado e de reescrita de histórico; confirmação em comando destrutivo, em `Write` que sobrescreve nota existente, em escrita em conector e na governança listada. Tarefa sem `due`, só com a pasta de tarefas preenchida.

**Não vale no modo avulso:** a confirmação da atualização do framework (`aplicar.ps1`, `desfazer.ps1`), as regras de `.segundo-cerebro/`, a proteção desta pasta do módulo e a governança fixa do framework (`_docs/`, `_templates/`, `_DECISOES.md`, `CLAUDE.md` em subpasta), a não ser que você as liste.

Limite: um vault por instalação (a opção guarda uma pasta só). Fora dela, inclusive em projetos de código, a Guarda não pede nada nem avisa. Entrada com `..`, caminho absoluto fora da pasta do vault, `.` ou a própria raiz, e pasta de tarefas além da primeira são descartados; o `/guarda` mostra como cada entrada foi lida (pasta ou arquivo) e as descartadas.

A Guarda do vault completo vale sempre que a sessão abre num vault com o `segundo-cerebro.manifest.json`, mesmo com a "Pasta do vault" preenchida apontando para outro lugar. A "Pasta do vault" deve ser a pasta do vault, nunca a raiz de um disco.

Quem usa o vault completo do Segundo Cérebro não instala o plugin por cima: a Guarda já vem na pasta `.claude/skills/`, e o plugin instalado pelo marketplace, de mesmo nome, desliga o da pasta.

## Como desligar

Troque `"defaultEnabled": true` por `false` em `.claude-plugin/plugin.json`, desative o módulo pelo `/plugin`, ou apague esta pasta. Sem a Guarda, as regras continuam no `CLAUDE.md`, mas só o Code as segue, sem rede de segurança.

## Testes

Para quem mantém o módulo: `claude plugin validate .claude/skills/guarda-constituicao` e `claude plugin test .claude/skills/guarda-constituicao`.
