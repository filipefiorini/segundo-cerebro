---
tipo: tarefas
escopo: <% tp.file.folder(true).split("/").pop().toLowerCase().replace(/ /g, "-") %>
tags: [tarefas, <% tp.file.folder(true).split("/").pop().toLowerCase().replace(/ /g, "-") %>]
criado: <% tp.date.now("YYYY-MM-DD") %>
atualizado: <% tp.date.now("YYYY-MM-DD") %>
status: active
---

> [!info] Vista das tarefas do escopo
> As tarefas vivem em `06 - TAREFAS/Tarefas/`, uma nota por tarefa, com `projects` apontando para o `_CONTEXTO` deste escopo. Esta nota só as mostra.

# Tarefas — <% tp.file.folder(true).split("/").pop() %>

```base
filters:
  and:
    - file.hasTag("task")
    - file.inFolder("06 - TAREFAS/Tarefas")
    - 'list(note.projects).map(file(value.replace(/^\[[^\]]+\]\((.*)\)$/, "$1").replace(/%20/g, " ")).asLink()).contains(file("<% tp.file.folder(true) %>/_CONTEXTO.md").asLink())'
views:
  - type: table
    name: Abertas
    filters:
      and:
        - status != "done"
    order:
      - file.name
      - status
      - due
      - executor
      - priority
    sort:
      - property: due
        direction: ASC
  - type: table
    name: Concluídas
    filters:
      and:
        - status == "done"
    order:
      - file.name
      - completedDate
      - executor
    sort:
      - property: completedDate
        direction: DESC
```
