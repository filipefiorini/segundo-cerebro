---
tags: [indice, tarefas]
tipo: indice
status: active
criado: 2026-11-07
---
# Tarefas — índice

Toda tarefa é uma nota em `06 - TAREFAS/Tarefas/`, uma por tarefa, criada a partir de `_templates/Template de Tarefa.md`. As views em `06 - TAREFAS/Views/` (arquivos `.base`, plugin TaskNotes) são só consultas sobre essas notas.

## Frontmatter esperado

| Campo | Valores |
|---|---|
| `title` | nome da tarefa, sem dado pessoal |
| `status` | `open`, `in-progress`, `waiting` ou `done` |
| `priority` | `none`, `low`, `normal` ou `high` |
| `projects` | `["[[caminho/_CONTEXTO\|Escopo]]"]` |
| `executor` | `eu` ou `code` |
| `due` | `YYYY-MM-DD`, obrigatório |
| `prazo_padrao` | `true` quando o Code pôs o dia útil seguinte por falta de prazo; apague ao combinar a data |
| `dateCreated` | `YYYY-MM-DD` |
| `dateModified` | `YYYY-MM-DD` |
| `completedDate` | `YYYY-MM-DD`, preenchido ao concluir |
| `tags` | `[task]` |

## Views

- **Aguardando** — tarefas com `status: waiting`, agrupadas por executor.
- **Concluídas** — tarefas com `status: done`, da mais recente para a mais antiga.
- **Hoje** — tarefas não concluídas com prazo hoje ou atrasado, agrupadas por executor.
- **Kanban** — quadro com uma coluna por status.
- **Por projeto** — tarefas não concluídas agrupadas por escopo (`projects`).
- **Semana** — tarefas não concluídas de hoje até sete dias à frente; as atrasadas ficam em Hoje.
- **Padrões do TaskNotes** — `tasks-default`, `kanban-default`, `calendar-default`, `mini-calendar-default`, `agenda-default`, `pomodoro-stats` e `relationships`, as sete views que o plugin cria.
