---
tags: [galaxy, seguranca, ai]
tipo: nota-permanente
tipo_nota: atômico
camada: Frameworks
fonte: "[[Ecossistema Second Brain com IA]]"
fonte_tipo: Reflexão
criado: 2026-04-05
revisado:
confianca: alta
status: active
exemplo: true
---

![[_assets/banner-galaxia.png]]

# 💡 Lethal Trifecta — Framework de Segurança para Agentes de IA

## 🧬 Ideia Central
> Todo agente de IA genuinamente útil expõe, por design, três vetores de risco simultaneamente: acesso a dados privados, contato com conteúdo não confiável e capacidade de exfiltração. A coexistência dos três é a "tríade letal".

## 📖 Desenvolvimento

O termo "lethal trifecta" foi cunhado por Simon Willison (2025) e popularizado no contexto de second brains por Cole Medin. Nomeia a tensão fundamental de qualquer segundo cérebro ou agente pessoal de IA:

**Componentes:**
1. **Private Data Access** — o agente tem acesso a dados sensíveis (notas pessoais, e-mails, decisões financeiras, informações de clientes)
2. **Untrusted Content** — o agente processa conteúdo externo não verificado (web, documentos de terceiros, transcrições)
3. **Exfiltration Vector** — o agente tem capacidade de enviar dados para fora (APIs, webhooks, e-mails, chamadas HTTP)

A tríade não é um bug — é uma consequência direta de fazer o sistema ser útil. Um agente que não acessa dados privados não te conhece. Um que não processa conteúdo externo não aprende. Um sem capacidade de ação é apenas consulta.

**A fragilidade:** quando os três coexistem sem política de permissões explícita, um único prompt adversarial em conteúdo externo pode exfiltrar dados privados.

## 🔗 Conexões
- Relacionado com: [[Zero Trust em Permissões de Agente]]
- Apoia: [[Tríade AGENTS + SOUL + TOOLS]]
- Contradiz: abordagem de "tudo permitido por padrão"

## 💼 Aplicação Prática

Um vault com agente tem a tríade presente desde o primeiro dia: guarda dados pessoais e de trabalho, processa conteúdo externo (artigos, transcrições, páginas web) e o agente pode fazer chamadas de rede.

**Mitigação:** política Zero Trust — o agente só escreve onde foi explicitamente autorizado, nunca envia dados para fora por padrão, e conteúdo externo passa por um passo de aprovação antes de virar nota. A tabela Zero Trust do `CLAUDE.md` deste vault é o lugar dessa política.

## 📎 Fonte
[[Ecossistema Second Brain com IA]]

---
*Camada: Frameworks | Confiança: alta*
