---
title: "<% tp.file.title %>"
status: open
priority: none
due: <% tp.date.now("YYYY-MM-DD", tp.date.now("d") == "5" ? 3 : tp.date.now("d") == "6" ? 2 : 1) %>
prazo_padrao: true
projects: []
contexts: []
executor: eu
dateCreated: <% tp.date.now("YYYY-MM-DD") %>
dateModified: <% tp.date.now("YYYY-MM-DD") %>
tags: [task]
---

<!-- Uma nota por tarefa, em 06 - TAREFAS/Tarefas/.
status: open | in-progress | waiting | done · priority: none | low | normal | high
projects: ["[[caminho/_CONTEXTO|Escopo]]"] · executor: eu | code
due obrigatório: o template põe o dia útil seguinte com prazo_padrao: true; prazo combinado → troque a data e apague a marca.
Dado pessoal nunca no título. -->

Contexto suficiente para retomar sem o chat.

**Origem:** 
