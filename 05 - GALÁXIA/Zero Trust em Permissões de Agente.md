---
tags: [galaxy, seguranca, ai]
tipo: nota-permanente
tipo_nota: atômico
camada: Metodologias
fonte: "[[Ecossistema Second Brain com IA]]"
fonte_tipo: Reflexão
criado: 2026-04-05
revisado:
confianca: alta
status: active
exemplo: true
---

![[_assets/banner-galaxia.png]]

# 💡 Zero Trust em Permissões de Agente

## 🧬 Ideia Central
> Ao configurar um agente de IA, comece com o mínimo de permissões possível e adicione capacidades incrementalmente, conforme a necessidade é demonstrada — nunca o contrário.

## 📖 Desenvolvimento

A metodologia Zero Trust em permissões aparece no trabalho de Cole Medin como resposta direta ao risco da [[Lethal Trifecta — Framework de Segurança para Agentes de IA]]. É a aplicação do princípio de menor privilégio ao contexto de agentes de IA:

**Os passos:**

1. **Inicie read-only** — o agente pode ler e analisar, mas não escrever nem executar ações externas
2. **Adicione escrita local** — permissão para criar e editar arquivos no ambiente controlado
3. **Adicione execução de comandos** — scripts e automações locais, após validação da etapa anterior
4. **Adicione integrações externas** — APIs, MCPs, webhooks — uma por vez, com escopo mínimo por integração
5. **Documente cada permissão** — para que serve, qual o risco aceito, como revogar

**Princípio central:** cada nova capacidade adicionada ao agente é uma decisão consciente com risco avaliado, não um default conveniente.

**Por que não o inverso:** agentes iniciados com permissões amplas raramente têm capacidades removidas depois. O custo de remover é maior que o custo de não ter adicionado.

## 🔗 Conexões
- Relacionado com: [[Lethal Trifecta — Framework de Segurança para Agentes de IA]]
- Apoia: [[Tríade AGENTS + SOUL + TOOLS]] (TOOLS.md como registro explícito de capacidades)
- Contradiz: configuração permissiva por conveniência

## 💼 Aplicação Prática

O `CLAUDE.md` deste vault tem uma tabela Zero Trust: para cada integração, uma linha com o que pode e o que não pode. Operação fora do escopo declarado exige confirmação.

**Na prática:** antes de conectar um MCP ou conector novo (e-mail, agenda, armazenamento na nuvem), escrever a linha dele na tabela — começando só com leitura — e só depois instalar.

## 📎 Fonte
[[Ecossistema Second Brain com IA]]

---
*Camada: Metodologias | Confiança: alta*
