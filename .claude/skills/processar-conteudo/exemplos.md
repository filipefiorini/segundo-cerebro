# processar-conteudo — exemplos de execução

> Carregado sob demanda pelo [SKILL.md](SKILL.md). Títulos, autores e pessoas fictícios.

## Exemplo 1 — Artigo colado com insights

**Input:**
```
/processar-conteudo
[texto de um artigo sobre revisão semanal e foco no trabalho]
```

**ETAPA 1 — Identificação:** texto colado. Processando diretamente.

**ETAPA 2 — Análise:**
- Material: artigo web sobre revisão semanal
- Insights: 1 metodologia (Revisão Semanal em Três Passos) + 1 conceito (Custo de Troca de Contexto) + 1 tática (Bloco de Foco Antes do E-mail)
- Galáxia já tem `Atenção Fragmentada.md` (camada Conceitos) → o conceito novo expande essa nota

**ETAPA 3 — Plano:**
```
📋 PLANO DE PROCESSAMENTO

📁 Fonte:
- [ ] Artigo → `03 - RECURSOS/Fontes/Artigos/A Revisão Semanal - Ana Souza.md`
      Tags: [nota-literatura, produtividade]
      Banner: `_assets/banner-literatura-artigo.png` (existente)

🌌 Notas da Galáxia:
- [ ] Metodologias → `05 - GALÁXIA/Revisão Semanal em Três Passos.md` (`camada: Metodologias`)
      Tags: [galaxy, produtividade]
      Fonte: [[A Revisão Semanal - Ana Souza]]
- [ ] Conceitos → `05 - GALÁXIA/Custo de Troca de Contexto.md` (`camada: Conceitos`)
      Tags: [galaxy, produtividade, mindset]
      Fonte: [[A Revisão Semanal - Ana Souza]]
      ⚠️ Expande [[Atenção Fragmentada]] — protocolo de evolução
- [ ] Táticas → `05 - GALÁXIA/Bloco de Foco Antes do E-mail.md` (`camada: Táticas`)
      Tags: [galaxy, produtividade]
      Fonte: [[A Revisão Semanal - Ana Souza]]

Aguardo sua aprovação para prosseguir.
```

**ETAPA 4:** o usuário aprova.

**ETAPA 5:** 4 notas criadas pelos templates, frontmatter completo, wikilinks cruzados; `desenvolvido_em` acrescentado em `Atenção Fragmentada.md`. Cada arquivo relido.

**ETAPA 6:**
```
📄 Notas criadas:
- `03 - RECURSOS/Fontes/Artigos/A Revisão Semanal - Ana Souza.md`
- `05 - GALÁXIA/Revisão Semanal em Três Passos.md`
- `05 - GALÁXIA/Custo de Troca de Contexto.md`
- `05 - GALÁXIA/Bloco de Foco Antes do E-mail.md`

📁 Pasta nova: `03 - RECURSOS/Fontes/Artigos/` (primeira nota de artigo)

Wikilinks sugeridos: [[Atenção Fragmentada]], [[Metas Trimestrais]]
```

---

## Exemplo 2 — Transcrição de reunião com um insight

**Input:**
```
/processar-conteudo
[transcrição de uma conversa com um fornecedor sobre migração do sistema de agendamento]
```

**ETAPA 1 — Identificação:** transcrição (falas identificadas, contexto de reunião).

**ETAPA 2 — Análise:**
- Material: reunião de trabalho, escopo Trabalho
- Conteúdo misto: reunião + 1 insight sobre migração em etapas

**ETAPA 3 — Plano:**
```
📋 PLANO DE PROCESSAMENTO

🤝 Reunião:
- [ ] → `02 - ÁREAS/Trabalho/Reuniões/Reunião - 2026-11-05 - Migração do agendamento.md`
      Tags: [meeting, trabalho]
      Participantes: o usuário, Carlos Lima (fornecedor), Bruna Reis (equipe)

🌌 Notas da Galáxia:
- [ ] Táticas → `05 - GALÁXIA/Migrar Por Etapas Reversíveis.md` (`camada: Táticas`)
      Tags: [galaxy, trabalho]
      Fonte: [[Reunião - 2026-11-05 - Migração do agendamento]]

✅ Ações identificadas (sugestões):
- [ ] Enviar a lista de integrações ao fornecedor — o usuário — até 2026-11-10
- [ ] Testar a exportação dos dados — Carlos Lima — sem prazo (fica na ata)

Aguardo sua aprovação para prosseguir.
```

A ação do usuário só vira nota em `06 - TAREFAS/Tarefas/` se ele pedir; a de terceiro fica na ata.

---

## Exemplo 3 — Arquivo do INBOX sem insight para a Galáxia

**Input:**
```
/processar-conteudo 00 - INBOX/2026-11-04 - Captura - Webinar sobre backup de notas.md
```

**ETAPA 1 — Identificação:** arquivo do INBOX. Lendo.

**ETAPA 2 — Análise:**
- Material: anotações de webinar sobre rotinas de backup de notas
- Conteúdo informativo, sem insight próprio extraível para a Galáxia
- Fonte válida para Nota de Literatura

**ETAPA 3 — Plano:**
```
📋 PLANO DE PROCESSAMENTO

📁 Fonte:
- [ ] Vídeo → `03 - RECURSOS/Fontes/Vídeos/Backup de Notas na Prática - Equipe do Webinar.md`
      Tags: [nota-literatura, automacao, seguranca]
      Banner: `_assets/banner-literatura-video.png` (existente)

ℹ️ Sem insights para a Galáxia: conteúdo informativo, sem conceito próprio
   extraível. A Nota de Literatura guarda o material para consulta.

📦 Original:
- [ ] Mover `00 - INBOX/2026-11-04 - Captura - Webinar sobre backup de notas.md`
      para `04 - ARQUIVO/INBOX/2026-11/`

Aguardo sua aprovação para prosseguir.
```

**ETAPA 6 (após execução):** nota criada; original movido para `04 - ARQUIVO/INBOX/2026-11/`.
