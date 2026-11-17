---
tags: [docs, segundo-cerebro, arquitetura]
tipo: documentacao
criado: 2026-11-07
atualizado: 2026-11-07
status: active
exemplo: false
---

![[_assets/banner-segundo-cerebro.png]]

# 🏠 Como o Autor Opera em Casa

> [!info] Ideia e arquitetura, não instalação
> Este vault público é a parte interativa: você abre o Claude Code no Desktop e pede. Em casa, o autor roda o mesmo vault com uma camada de automação em volta. Nada dela vem no repositório. Esta nota descreve as peças para quem quiser construir algo parecido.

---

## Princípios

- **A Constituição vale para tudo.** Rotina agendada, script e sessão obedecem ao mesmo `CLAUDE.md`. Cada peça tem uma linha própria na tabela Zero Trust, com o que pode e o que não pode.
- **Menos acesso do que parece necessário.** Cada rotina recebe só as ferramentas da sua tarefa. O que não está liberado é recusado, sem pergunta.
- **Sem modelo onde não precisa.** Vigia, auditoria, captura e sincronização são scripts comuns. O modelo entra só onde há leitura ou síntese.
- **O modelo não escreve log.** Quem grava o resultado de cada rotina em `_logs/` é o script que a chamou.

## Rotinas agendadas

O Agendador de Tarefas do sistema dispara o Claude Code em modo não interativo (`claude -p`), com uma skill e um perfil. O perfil é um cardápio de permissões: ferramentas liberadas, ferramentas negadas e servidores MCP carregados. Sem ninguém para confirmar, toda confirmação vira recusa.

Um script intermediário chama o modelo, grava a saída e registra a execução num arquivo de estado. Em indisponibilidade da API, refaz com um modelo menor; limite de uso da assinatura não gera nova tentativa, só registro.

As rotinas do autor:

- **Mensagem da manhã** — tempo, compromissos do dia, tarefas com prazo padrão a rever e capturas pendentes. Lê dados por uma ferramenta só de leitura; não abre arquivo.
- **Rotina do INBOX** — duas vezes por dia. Grava as capturas com destino claro e fora da governança, arquiva o original e cria tarefas. O que é ambíguo, sensível ou toca a governança vira plano, à espera de validação numa sessão.
- **Reuniões gravadas** — lê as transcrições do dia e deixa capturas no INBOX, que a rotina seguinte grava.
- **Revisão da memória** — no dia 1, propõe o que sobe, esfria ou sai da memória. A gravação fica para uma sessão, com o ok do autor.

## Bot de captura

Um bot de mensagens recebe texto e fotos do celular e os grava no `00 - INBOX/`, com o frontmatter de captura. Só aceita o chat do autor, nunca sobrescreve e responde com uma confirmação fixa. Não usa modelo. Depois de cada rotina do INBOX, avisa o que aconteceu com cada captura enviada.

## Monitor regulatório

Uma rotina diária lê fontes públicas oficiais de um tema que o autor acompanha e grava o que for novo como captura no INBOX. Ela tem web, mas não tem leitura nem escrita genérica de arquivo: usa ferramentas MCP próprias, que leem só a lista de fontes e as notas daquele tema, deduplicam por endereço, limitam capturas por dia e rebaixam a confiança do que não vem de domínio oficial.

## Vigia

Script sem modelo que roda depois das rotinas. Lê o registro de execuções, o batimento do bot e o estado das tarefas agendadas. Se algo falhou ou parou, manda ao autor um aviso de texto fixo. Conteúdo de log nunca vai na mensagem.

## Auditoria mensal

Uma vez por mês, um script sem modelo varre a estrutura do vault: frontmatter, tags fora da taxonomia, wikilinks quebrados, banners, tarefas sem prazo. O relatório vai para `_logs/`, com os caminhos das áreas sensíveis mascarados, e o autor recebe uma linha com o resultado. A correção fica para uma sessão com `auditar-vault`.

## Busca local

Um índice de texto completo (SQLite com FTS5) cobre as partes do vault mais consultadas e é exposto ao Claude Code como servidor MCP só de leitura. As áreas sensíveis ficam fora do índice por código, não por configuração. A reindexação é diária e incremental. Busca por vetores ficou de fora: a busca lexical respondeu bem e não exigiu dependências pesadas numa máquina sem GPU.

## Sincronização

Um script faz, todo dia, commit datado, pull com rebase e push do vault para um repositório privado. Nunca força push nem reescreve histórico. Em conflito, aborta e registra; quem resolve é o autor.

## Dois mods do Claude Code

- **Guarda da Constituição.** Vê cada chamada de ferramenta, nas sessões e nas rotinas, e a confirma ou recusa conforme a Constituição. Faz valer no harness o que o `CLAUDE.md` só pede em texto.
- **Painel de tarefas.** Mostra as notas de `06 - TAREFAS/Tarefas/` ao lado do chat, com filtros de hoje, semana e aguardando. Por clique, muda status, prazo e prioridade e cria tarefa nova, sempre com prazo. Áreas privadas ficam ocultas por padrão.

---

## O que seria preciso para reproduzir

- **Windows**, que é o que o autor usa (outros sistemas têm agendador equivalente).
- **Agendador de Tarefas**, para disparar rotinas, vigia, auditoria e sincronização.
- **Python + uv**, para os scripts, os servidores MCP e o índice de busca.
- **Um bot de mensagens**, para captura e avisos.
- **Assinatura com Claude Code**, para as sessões e as rotinas `claude -p`.

E tempo: cada peça entrou depois que a anterior estava estável, com sua linha no Zero Trust escrita antes do primeiro uso.
