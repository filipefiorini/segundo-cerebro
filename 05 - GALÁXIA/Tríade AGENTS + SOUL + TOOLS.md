---
tags: [galaxy, ai, claude]
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

# 💡 Tríade AGENTS + SOUL + TOOLS

## 🧬 Ideia Central
> Um assistente de IA bem arquitetado separa suas responsabilidades em três arquivos distintos: regras operacionais (AGENTS), identidade e personalidade (SOUL) e capacidades externas (TOOLS). Colocar tudo em um único arquivo cria acoplamento, ambiguidade e dificuldade de manutenção.

## 📖 Desenvolvimento

O padrão vem do OpenClaw e aparece também no trabalho de Cole Medin. É uma resposta ao problema do arquivo de configuração monolítico (como o `CLAUDE.md`):

**Os três componentes:**

| Arquivo | Responsabilidade |
|---------|-----------------|
| **AGENTS.md** (ou CLAUDE.md) | Regras operacionais: o que o agente faz, como age, restrições, fluxos de trabalho |
| **SOUL.md** | Identidade: quem o agente é, tom de voz, valores, como se relaciona com o usuário |
| **TOOLS.md** | Capacidades: quais ferramentas, MCPs e integrações estão disponíveis e como usá-las |

**Por que separar:**
- SOUL não muda com frequência — é a essência do assistente
- TOOLS mudam quando novas integrações são adicionadas
- AGENTS muda com regras e fluxos operacionais
- Arquivos menores = contexto mais eficiente = menos tokens consumidos por sessão

## 🔗 Conexões
- Relacionado com: [[Lethal Trifecta — Framework de Segurança para Agentes de IA]]
- Relacionado com: [[Zero Trust em Permissões de Agente]]
- Apoia: separação de responsabilidades em engenharia de software
- Contradiz: configuração monolítica em arquivo único

## 💼 Aplicação Prática

O `CLAUDE.md` deste vault reúne as três responsabilidades num arquivo só, mas em seções separadas: quem usa o vault e o tom (SOUL), as regras (AGENTS) e a tabela Zero Trust das integrações (TOOLS). Enquanto o arquivo é curto, isso basta.

**Gatilho para separar em arquivos:** quando o `CLAUDE.md` ficar longo demais para ler numa passada, ou quando uma das três partes passar a mudar com muito mais frequência que as outras.

## 📎 Fonte
[[Ecossistema Second Brain com IA]]

---
*Camada: Frameworks | Confiança: alta*
