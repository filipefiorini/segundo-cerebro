---
tags: [galaxy, conhecimento, ai, automacao]
tipo: nota-permanente
tipo_nota: atômico
camada: Conceitos
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

# 💡 Vibe Coding

## 🧬 Ideia Central
> Construir software apenas descrevendo o que você quer em linguagem natural — sem escrever código diretamente. A IA gera, itera e corrige. Você valida.

## 📖 Desenvolvimento

O termo foi cunhado por Andrej Karpathy em fevereiro de 2025. O nome captura algo preciso: você não programa — você "vibra" com a intenção do que quer construir e deixa a IA materializar.

A prática tem três características centrais:
1. **Prompts como especificação** — a instrução em linguagem natural substitui o código como primeiro artefato
2. **Iteração sobre resultado** — você reage ao que a IA produziu, não redige linha a linha
3. **Expertise de domínio > expertise de código** — entender O QUE construir vale mais que saber COMO implementar

O que torna o conceito relevante não é a técnica em si, mas o que ela muda: a barreira de entrada para construir software cai radicalmente. Quem entende bem um domínio (negócios, saúde, direito) pode construir ferramentas sem depender de um desenvolvedor.

A crítica legítima ao vibe coding é que ele esconde complexidade — o sistema funciona até que não funciona, e aí quem não entende o código não consegue depurar. Mas para MVPs, automações e ferramentas internas, o trade-off frequentemente favorece a velocidade.

## 🔗 Conexões
- Relacionado com: [[LLM Wiki Pattern]]
- Relacionado com: [[Tríade AGENTS + SOUL + TOOLS]]

## 💼 Aplicação Prática

Uma sessão com o Claude Code neste vault já é vibe coding: você descreve o resultado esperado, avalia o que foi produzido, corrige o rumo. Formalizar o conceito deixa claro que **a sua expertise de domínio é o ativo principal** — não o conhecimento técnico de implementação.

Para automações pequenas (um fluxo de captura, um script de relatório), a abordagem natural é descrever o comportamento esperado e validar o resultado, em vez de escrever código de integração linha a linha. Para o que vai rodar sozinho, sem você olhando, vale ler o código antes de confiar nele.

## 📎 Fonte
[[LLM Wiki - Andrej Karpathy]] (o termo foi cunhado por Karpathy em fevereiro de 2025; o texto o cita de passagem).

---
*Camada: Conceitos | Confiança: alta | Verificado em: 2026-04-21 | Validade: permanente*
