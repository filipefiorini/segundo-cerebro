---
tags: [nota-literatura, ai, automacao]
tipo: literatura
fonte_tipo: Artigo
fonte_titulo: notebooklm-py
fonte_autor: teng-lin
fonte_url: https://github.com/teng-lin/notebooklm-py
fonte_data: 2026-04-05
criado: 2026-04-05
status: complete
exemplo: true
---

![[_assets/banner-literatura-artigo.png]]

# 🐍 notebooklm-py — teng-lin

---

## Resumo

API Python não-oficial para o Google NotebookLM, com integração para agentes de IA como o Claude Code. Permite acesso programático a funcionalidades que a interface web não expõe — como exportação em lote, geração de quizzes e flashcards, extração de mapas mentais em JSON e automação de pesquisa com agentes web.

Três modos de uso: Python API (para aplicações), CLI (para scripts) e integração com agentes LLM.

> [!warning] API não-oficial
> Usa APIs internas não documentadas do Google. Pode quebrar sem aviso. Sujeito a rate limiting.

---

## Destaques

> "Batch downloads, quiz/flashcard export in multiple formats, mind map JSON extraction — capabilities the standard interface doesn't provide." — README

**Funcionalidades principais:**
- Gerenciamento de notebooks: criar, listar, renomear, deletar
- Suporte a múltiplos formatos de fonte: URLs, PDFs, YouTube, Google Drive, áudio/vídeo
- Interface de chat com personas customizadas
- Geração de conteúdo: audio overviews, vídeos, slide decks, quizzes, flashcards, infográficos, mapas mentais, tabelas de dados, relatórios
- Automação de pesquisa com agentes web e Drive
- Downloads e exportações em lote em múltiplos formatos
- Gerenciamento de permissões e compartilhamento programático

---

## Síntese

### NotebookLM como camada de leitura antes do vault
Para documentos densos (PDFs extensos, relatórios, livros), o NotebookLM pode fazer a primeira leitura e devolver sínteses que depois viram Notas de Literatura. O notebooklm-py torna esse passo programático, por Python ou CLI, sem depender da interface web.

### Usos possíveis
1. Processar um PDF longo → extrair a síntese pelo NotebookLM → transformar em Nota de Literatura com `/processar-conteudo`.
2. Gerar flashcards de um material de estudo → exportar pela CLI → revisar como Nota de Literatura.

### Cuidado
Por usar APIs internas, é ferramenta para experimento pessoal, não para rotina da qual algo importante dependa.

---

## Citações

> "Capabilities the standard interface doesn't provide." — README

---

## 🌌 Notas da Galáxia geradas

*Preencha após extrair os insights para a Galáxia.*
