---
tags: [galaxy, obsidian, segundo-cerebro]
tipo: nota-permanente
tipo_nota: atômico
camada: Conceitos
fonte: "[[Ecossistema Second Brain com IA]]"
fonte_tipo: Reflexão
criado: 2026-04-05
revisado:
confianca: media
status: active
exemplo: true
---

![[_assets/banner-galaxia.png]]

# 💡 Self-Healing de Cross-References

## 🧬 Ideia Central
> Um vault saudável mantém suas conexões íntegras automaticamente. Quando um arquivo é renomeado, todos os wikilinks que apontam para ele atualizam sozinhos — sem intervenção manual, sem referências quebradas acumulando.

## 📖 Desenvolvimento

O conceito aparece em projetos públicos de "second brain" com IA, como o COG (COG-second-brain). É um mecanismo de manutenção automática de integridade referencial:

**O problema:** vaults grandes acumulam referências quebradas ao longo do tempo. Um arquivo renomeado deixa dezenas de `[[Título Antigo]]` apontando para o vazio. A auditoria manual é custosa e propensa a falhas.

**A solução Self-Healing:** um script ou hook que, ao detectar renomeação de arquivo, percorre o vault em busca de todos os wikilinks para o nome antigo e os atualiza para o novo nome automaticamente.

**No COG:** implementado via `cog-update.sh` como parte do Update System. O script é interativo — lista o que vai mudar antes de executar.

**Confiança média:** o conceito é sólido, mas a implementação no contexto Obsidian + Claude Code precisa validação. O Obsidian já oferece renomeação automática de links como recurso nativo (configuração "Automatically update internal links"). Verificar se cobre todos os casos antes de construir solução própria.

## 🔗 Conexões
- Relacionado com: [[Separação Framework e Conteúdo com Update System]]
- Apoia: integridade do vault a longo prazo
- Contradiz: manutenção manual de referências

## 💼 Aplicação Prática

Verificar se a configuração nativa do Obsidian ("Files & Links → Automatically update internal links") está ativa. Se sim, o Self-Healing já existe em boa parte. Se não, ativar antes de construir qualquer solução própria.

Automação além disso só compensa quando o vault tem escala: centenas de notas, renomeações frequentes, links criados fora do Obsidian (por scripts ou por um agente).

## 📎 Fonte
[[Ecossistema Second Brain com IA]]

---
*Camada: Conceitos | Confiança: média*
