---
tags: [galaxy, conhecimento, ai, segundo-cerebro]
tipo: nota-permanente
tipo_nota: atômico
camada: Frameworks
fonte: "[[LLM Wiki - Andrej Karpathy]]"
fonte_tipo: Artigo
fonte_titulo: LLM Wiki
fonte_autor: Andrej Karpathy
fonte_url: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
fonte_data: 2026-04-03
criado: 2026-04-21
revisado:
confianca: alta
data_verificacao: 2026-04-21
validade: permanente
desenvolvido_em:
status: active
exemplo: true
---

![[_assets/banner-galaxia.png]]

# 💡 LLM Wiki Pattern

## 🧬 Ideia Central
> Um LLM constrói e mantém automaticamente uma wiki interligada a partir de fontes brutas — sem edição humana — sustentado por apenas 3 operações: /ingest, /query e /lint.

## 📖 Desenvolvimento

O padrão foi descrito por Andrej Karpathy em abril de 2026. A premissa é radical na sua simplicidade: você despeja material bruto em uma pasta e o agente constrói e mantém toda a estrutura de conhecimento por conta própria.

A separação central é entre **bruto** e **sintetizado**:
- `raw/` — fontes como chegam, sem processamento
- `wiki/` — conhecimento organizado em quatro camadas: sources (resumo de cada fonte), entities (pessoas, orgs, ferramentas), concepts (ideias, frameworks), synthesis (comparações, análises)

O que sustenta o sistema são 3 operações atômicas:
1. **`/ingest`** — processa nova fonte, cria/atualiza páginas, atualiza index.md, acrescenta ao log.md
2. **`/query`** — consulta em linguagem natural sobre toda a wiki
3. **`/lint`** — varredura de saúde: links quebrados, páginas órfãs, contradições, lacunas

O `index.md` e o `log.md` são a memória operacional do agente — não são conteúdo de conhecimento, são infraestrutura.

## 🔗 Conexões
- Relacionado com: [[Tríade AGENTS + SOUL + TOOLS]]
- Relacionado com: [[Vibe Coding]]
- Apoia: [[O método CODE — Capturar, Organizar, Destilar, Expressar]]

## 💼 Aplicação Prática

Este vault segue o mesmo núcleo: `00 - INBOX` faz o papel de `raw/`, e Fontes + Galáxia fazem o papel de `wiki/`. A diferença é que o padrão de Karpathy é mais explícito na separação bruto/sintetizado e mais sistemático no uso de índice e log como memória operacional do agente.

O princípio que vale levar: o agente deve ser **mantenedor ativo do sistema**, não só uma ferramenta de consulta. Skills de manutenção (como `/auditar-vault`, o equivalente do `/lint`) valem tanto quanto as de consulta.

## 📎 Fonte
[[LLM Wiki - Andrej Karpathy]]

---
*Camada: Frameworks | Confiança: alta | Verificado em: 2026-04-21 | Validade: permanente*
