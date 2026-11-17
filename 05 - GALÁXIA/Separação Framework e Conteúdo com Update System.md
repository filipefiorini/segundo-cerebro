---
tags: [galaxy, segundo-cerebro, obsidian]
tipo: nota-permanente
tipo_nota: atômico
camada: Conceitos
fonte: "[[Ecossistema Second Brain com IA]]"
fonte_tipo: Reflexão
criado: 2026-04-05
revisado:
confianca: alta
status: active
exemplo: true
---

![[_assets/banner-galaxia.png]]

# 💡 Separação Framework e Conteúdo com Update System

## 🧬 Ideia Central
> Um sistema de gestão do conhecimento durável trata seu framework (estrutura, regras, templates, skills) e seu conteúdo (notas, análises, registros pessoais) como camadas independentes — cada uma com seu ciclo de atualização, versionamento e responsável.

## 📖 Desenvolvimento

O conceito aparece em projetos públicos de "second brain" com IA, como o COG (COG-second-brain). É uma decisão arquitetural fundamental:

**As duas camadas:**

| Camada | O que contém | Quem atualiza | Frequência |
|--------|-------------|---------------|------------|
| **Framework** | CLAUDE.md, templates, skills, _docs/, estrutura de pastas | Mantenedor do framework | Raramente (mudanças estruturais) |
| **Conteúdo** | Notas da Galáxia, Fontes, Reuniões, Projetos, Áreas | Fluxo normal de uso | Constantemente |

**O Update System do COG:** um script interativo (`cog-update.sh`) que aplica atualizações do framework sem tocar no conteúdo. Lista o que vai mudar, pede confirmação, executa. Versiona o framework separadamente do conteúdo.

**Por que isso importa:** quando o framework e o conteúdo estão entrelaçados, qualquer atualização estrutural vira uma operação de risco. A separação cria uma zona de segurança: você pode evoluir o sistema sem arriscar o conhecimento acumulado.

## 🔗 Conexões
- Relacionado com: [[Self-Healing de Cross-References]]
- Apoia: manutenibilidade do vault a longo prazo
- Contradiz: edição livre e não estruturada do vault

## 💼 Aplicação Prática

Neste vault a separação é explícita: `_docs/`, `_templates/` e as skills são framework; o restante é conteúdo. O arquivo de versão na raiz marca qual versão do framework está instalada, e o manifesto do repositório diz, pasta por pasta, o que uma atualização pode substituir e o que nunca toca.

**Regra prática:** antes de editar um arquivo do framework, perguntar se a mudança é sua (conteúdo, preferência) ou do sistema (estrutura). Preferências vão nas áreas marcadas para o usuário; estrutura fica com o framework.

## 📎 Fonte
[[Ecossistema Second Brain com IA]]

---
*Camada: Conceitos | Confiança: alta*
