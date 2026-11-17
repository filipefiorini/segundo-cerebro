# Painel de tarefas

Módulo do Claude Code que abre, ao lado do chat, um painel com as tarefas de `06 - TAREFAS/Tarefas/`. Mostra o dia por projeto e deixa tratar cada tarefa com um clique, sem sair da conversa. Carrega sozinho quando o vault é aberto no Claude Code (aparece como `painel-tarefas@skills-dir`), sem instalação nem configuração. Abre no começo de cada sessão interativa; `/tarefas` reabre.

## O que mostra

- Dois blocos: "Minhas tarefas" (executor `eu`) e "Tarefas do Code" (executor `code`, recolhido), cada um agrupado por projeto em ordem alfabética, com "Sem projeto" por último.
- Filtros Hoje, Semana, Aguardando, Concluídas e Todas, e filtro de prioridade.
- Resumo do dia: atrasadas, em aberto e concluídas hoje.
- No cartão de cada tarefa: concluir, adiar (amanhã, segunda ou outra data), marcar aguardando, trocar prioridade, status e projeto, "Fazer agora" (tarefas do Code: preenche o pedido no campo do chat, para você revisar e enviar) e abrir a nota no Obsidian.
- "+ Nova" cria a nota pelo mesmo esquema do `_templates/Template de Tarefa.md`, sempre com prazo, executor `eu` e o projeto escolhido. Título com CPF é recusado.

## O que lê e grava

- Lê as notas de `06 - TAREFAS/Tarefas/`.
- Lê só o frontmatter do `_CONTEXTO.md` apontado pelo campo `projects` de cada tarefa (por exemplo `[[02 - ÁREAS/Trabalho/_CONTEXTO|Trabalho]]`, ou `[[Trabalho]]`, que vira o `_CONTEXTO.md` da pasta com esse nome); nunca outro arquivo. Com `sensivel: true`, as tarefas daquela área ficam ocultas até você clicar em "Mostrar privadas", e aparecem num grupo próprio. Sem o arquivo ou sem o campo, a área conta como não sensível. Nunca grava no `_CONTEXTO.md`.
- Grava só em `06 - TAREFAS/Tarefas/` e só os campos `status`, `due`, `scheduled`, `priority`, `projects`, `completedDate` e `dateModified`; quando você escolhe uma data, apaga a marca `prazo_padrao`. O corpo da nota nunca muda, e uma nota nova nunca sobrescreve outra. Tarefa recorrente se trata no Obsidian.

## Onde vale

A raiz do vault é a pasta onde a sessão abre. Se ela não tiver `segundo-cerebro.manifest.json`, o painel avisa uma vez ("Painel inativo: esta pasta não é um vault do Segundo Cérebro") e não lê nem grava nada. Quem abre a sessão numa subpasta pode apontar a raiz no campo opcional `vault` da configuração do módulo.

"Abrir no Obsidian" usa o endereço `obsidian://` pelo `explorer.exe`, então só funciona no Windows. O nome do vault no Obsidian precisa ser o nome da pasta raiz.

## Como desligar

Troque `"defaultEnabled": true` por `false` em `.claude-plugin/plugin.json`, desative o módulo pelo `/plugin`, ou apague esta pasta. As tarefas continuam no Obsidian, pelas vistas de `06 - TAREFAS/Views/`.

## Testes

Para quem mantém o módulo: `claude plugin validate .claude/skills/painel-tarefas` e `claude plugin test .claude/skills/painel-tarefas`.
