# auditar-vault — exemplos de execução

> Carregado sob demanda pelo [SKILL.md](SKILL.md). Notas, pastas e números fictícios.

## Exemplo 1 — Auditoria completa com achados mistos

**Input:**
```
/auditar-vault
```

**Output esperado:**

```
## RELATÓRIO DE AUDITORIA — 2026-11-07

**Modo:** Completo

### 🔴 Crítico (bloqueia funcionamento)
- `01 - PROJETOS/Em Andamento/Novo Projeto/_CONTEXTO.md` → sem frontmatter YAML →
  adicionar bloco `---` com os campos mínimos (tags, tipo, criado, status)

### 🟠 Médio (inconsistência funcional)
- `02 - ÁREAS/Trabalho/Reuniões/Reunião - 2026-10-30 - Planejamento.md` →
  `status: em-andamento` (PT, inválido) → trocar por `in-progress`
- `05 - GALÁXIA/Novo Conceito.md` → campo `camada` ausente →
  adicionar `camada: Conceitos`
- `CLAUDE.md` → projeto "Novo Projeto" fora da tabela "Projetos e áreas ativos" →
  acrescentar a linha (exige aprovação)

### 🟡 Menor (cosmético ou melhoria)
- `_templates/Template de Pessoa.md` → `criado: 2026-03-08` fixo →
  trocar pela expressão do Templater

### 🔵 Informativo (observação sem ação necessária)
- Tag `jardinagem` em 2 notas, fora da Taxonomia (cauda longa)

### ✅ Verificações sem problemas
- Estrutura de pastas (IPARAG + infraestrutura)
- Banners (todos os referenciados existem)
- Wikilinks (nenhum quebrado)
- Dataview (queries OK)
- Arquivos no local correto

---
Total: 1 crítico | 3 médios | 1 menor | 1 informativo
Vault está ATENÇÃO NECESSÁRIA

Quer que eu corrija agora? Posso corrigir tudo de uma vez ou só os itens
que você escolher.
```

---

## Exemplo 2 — Auditoria rápida, vault saudável

**Input:**
```
/auditar-vault --rapido
```

**Output esperado:**

```
## RELATÓRIO DE AUDITORIA — 2026-11-07

**Modo:** Rápido (estrutura + frontmatter + status)

### ✅ Verificações sem problemas
- Estrutura de pastas (IPARAG + infraestrutura) — todas as pastas esperadas presentes
- Frontmatter YAML — 85 arquivos verificados, todos com os campos obrigatórios
- Status — todos os valores no vocabulário do seu lugar

---
Total: 0 críticos | 0 médios | 0 menores | 0 informativos
Vault está SAUDÁVEL
```

Sem achado, não há o que oferecer na ETAPA 13; a entrada vai para `_logs/auditoria.md` do mesmo jeito.

---

## Exemplo 3 — Auditoria de uma seção

**Input:**
```
/auditar-vault --secao galaxia
```

**Output esperado:** relatório só das notas de `05 - GALÁXIA/`: frontmatter da Galáxia (`camada`, `fonte_tipo`, `confianca`, `tipo`), nota direto na raiz da Galáxia (subpasta é achado menor), `fonte` apontando para Nota de Literatura existente e wikilinks internos. Achado de exemplo: `[MÉDIO] 05 - GALÁXIA/Nota X.md: camada "Estratégias" fora dos cinco valores` (a nota some das vistas por camada).
