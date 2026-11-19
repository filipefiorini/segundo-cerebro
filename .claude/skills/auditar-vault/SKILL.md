---
name: auditar-vault
description: |
  Varredura estrutural completa do vault Obsidian em busca de inconsistências.
  Verifica pastas, frontmatter YAML, campos obrigatórios, status, tags, banners,
  wikilinks, templates, projetos e documentação. Retorna relatório por severidade
  com sugestões de correção e só corrige com aprovação. Registra a execução em
  `_logs/auditoria.md`.
  USE WHEN o usuário digitar "/auditar-vault", "auditar", "auditoria do vault",
  "verificar vault", "checar consistência", "vault está ok?", "tem algo quebrado?",
  ou após reorganizações estruturais e adição de muitas notas.
version: 1.2.4
created: 2026-11-07
updated: 2026-11-12
tags: [skill]
---

# 🔍 Skill: /auditar-vault

Varredura do vault em busca de inconsistências estruturais, frontmatter inválido, wikilinks quebrados, tags fora da taxonomia, banners ausentes e documentação desatualizada. Devolve um relatório por severidade, com sugestão de correção para cada achado.

---

## Propósito

Manter a estrutura e a consistência do vault, pegando os problemas antes que se acumulem. Skill de **leitura**: reporta sem corrigir. Correção só depois de aprovação explícita do usuário, item a item ou em bloco.

---

## Invocação

```
/auditar-vault                → auditoria completa (todas as verificações)
/auditar-vault --rapido       → só estrutura de pastas, frontmatter e status
/auditar-vault --secao [nome] → audita uma seção (ex.: --secao galaxia)
```

Seções válidas para `--secao`: `pastas`, `frontmatter`, `status`, `tags`, `banners`, `wikilinks`, `templates`, `projetos`, `documentacao`, `galaxia`, `dataview`.

---

## Fluxo de Execução

Ler [reference.md](reference.md) antes de executar as etapas 1 a 11: ali estão as verificações de cada etapa, os fallbacks e o template do relatório. Exemplos de execução em [exemplos.md](exemplos.md).

As verificações são feitas pelo próprio Code, com as ferramentas de leitura e busca da sessão (listar pastas, ler arquivos, buscar texto). Nenhum script ou servidor externo é necessário.

| Etapa | Verifica | Detalhe |
|---|---|---|
| 1 | Estrutura de pastas IPARAG e infraestrutura | `reference.md` › ETAPA 1 |
| 2 | Frontmatter YAML do vault inteiro | `reference.md` › ETAPA 2 |
| 3 | Consistência de `status` | `reference.md` › ETAPA 3 |
| 4 | Tags contra a Taxonomia | `reference.md` › ETAPA 4 |
| 5 | Banners | `reference.md` › ETAPA 5 |
| 6 | Wikilinks | `reference.md` › ETAPA 6 |
| 7 | Templates | `reference.md` › ETAPA 7 |
| 8 | Projetos | `reference.md` › ETAPA 8 |
| 9 | Documentação, contagens e referências mortas em texto | `reference.md` › ETAPA 9 |
| 10 | Queries Dataview | `reference.md` › ETAPA 10 |
| 11 | Arquivos em local errado | `reference.md` › ETAPA 11 |

### Áreas sensíveis

Área cujo `_CONTEXTO.md` tem `sensivel: true` no frontmatter é sensível. Nelas a auditoria verifica só a estrutura (frontmatter, tags, wikilinks, local do arquivo) e nunca reproduz conteúdo de nota no relatório nem no log: cita o caminho do arquivo e o problema, nada mais.

### ETAPA 12 — Apresentar Relatório

Formato obrigatório: [reference.md](reference.md) › Template do relatório.

### ETAPA 13 — Oferecer Correção

Depois do relatório:

> "Quer que eu corrija agora? Posso corrigir tudo de uma vez ou só os itens que você escolher."

**Nunca corrigir sem aprovação explícita.** Correção que move, renomeia ou apaga arquivo segue a regra DESTRUTIVO do `CLAUDE.md`: confirmação própria e referências corrigidas na mesma operação. Correção em `CLAUDE.md`, `_docs/`, `_templates/` ou `.claude/skills/` é mudança de governança: plano antes, aprovação, e registro no `_HISTORICO.md` da área Segundo Cérebro quando for mudança estrutural. Depois de corrigir, reler cada arquivo alterado (regra VERIFICAÇÃO).

### ETAPA 14 — Registrar no Log

Registrar a execução em `_logs/auditoria.md`, **mesmo com o vault saudável**. Se o arquivo não existir, criá-lo com este cabeçalho:

```markdown
---
tags: [log]
tipo: log
criado: AAAA-MM-DD
status: active
---

# Log de auditorias

<!-- Novas entradas acima desta linha -->
```

Formato de cada entrada, acrescentada **acima** do comentário `<!-- Novas entradas acima desta linha -->`:

```markdown
## AAAA-MM-DD — [Completa | Rápida | Seção: nome]

- **Gatilho:** [Manual / Pós-reorganização / Pós-adição de notas / etc.]
- **Resultado:** [SAUDÁVEL / ATENÇÃO NECESSÁRIA / CRÍTICO] — X críticos | Y médios | Z menores
- **Achados:** lista resumida por severidade
- **Ações tomadas:** o que foi corrigido (✅) e o que ficou pendente (⏳)
- **Notas:** contexto relevante da sessão
```

O log leva caminhos e problemas, nunca conteúdo de nota de área sensível.

---

## Modos de Execução

| Modo | Etapas executadas | Quando usar |
|------|-------------------|-------------|
| `--completo` (padrão) | Todas (1–14) | Auditoria mensal ou após mudanças grandes |
| `--rapido` | 1, 2, 3, 12, 13, 14 | Verificação rápida do básico |
| `--secao [nome]` | Etapa correspondente + 12, 13, 14 | Foco numa parte do vault |

---

## Fora do Escopo

Esta skill **não** faz:

- **Análise semântica** — não avalia se o texto de uma nota é bom, claro ou completo.
- **Revisão de escrita** — não analisa gramática, estilo ou coerência.
- **Correção automática** — só reporta; corrigir exige aprovação explícita.
- **Teste de plugins** — não verifica se Dataview, Templater, Banners e outros estão funcionando.
- **Backup ou versionamento** — não cria backup nem lê histórico do git.
- **Arquivos binários** — não verifica a integridade de imagens, PDFs ou outros anexos em `_assets/`.

---

## Frequência Recomendada

| Situação | Frequência | Modo sugerido |
|----------|-----------|---------------|
| Uso normal do vault | Mensal | Completo |
| Após reorganização estrutural | Imediato | Completo |
| Após adicionar 10+ notas novas | Quinzenal | Rápido |
| Antes de compartilhar o vault | Sempre | Completo |
| Após reescrever skills ou templates | Imediato | `--secao templates` |

---

## Relacionado

- [[_docs/Manual do Segundo Cérebro]] — estrutura esperada e roteamento
- [[_docs/Taxonomia de Tags]] — tags, `status`, `tipo` e `fonte_tipo` válidos
- [[_docs/Ferramentas]] — catálogo de templates e de skills, padrão visual e de nomes
- [[CLAUDE]] — regras de operação

---

## Changelog

- 1.2.3 (2026-11-12) — `.segundo-cerebro/` fica fora de toda varredura e é pasta esperada na raiz, como `.github/` e `.claude-plugin/` quando presentes, sem virar achado na Etapa 9 por faltar na tabela do `CLAUDE.md`; `_docs/CHANGELOG.md` e `CONTRIBUTING.md` não têm frontmatter por desenho; caminho que nasce no primeiro uso (pasta ou arquivo que uma skill ou um plugin do núcleo cria ao gravar a primeira nota) não é referência morta; `fonte: "[[]]"` com `fonte_tipo` que não seja `Reflexão` ou `Experiência` passa a informativo ("fonte sem ficha; rever quando souber a fonte").
- 1.2.2 (2026-11-12) — `fonte_tipo` `Reflexão` ou `Experiência` aceita `fonte: "[[]]"` (insight sem ficha) ou link para ficha em `03 - RECURSOS/Fontes/Reflexões/`; outro alvo é médio. O `[[]]` nesses tipos não conta como wikilink vazio.
- 1.2.1 (2026-11-11) — o motivo do achado de `camada` ausente ou fora do vocabulário passa a dizer "some das vistas por camada" (a vista "Todas" ainda mostra a nota, num grupo à parte).
- 1.2.0 (2026-11-11) — Galáxia em pasta única: acusa nota sem `camada` ou com `camada` fora dos cinco valores (médio) e nota em subpasta de `05 - GALÁXIA/` (menor); deixa de comparar a `camada` com a pasta.
- 1.1.0 (2026-11-08) — confere a `camada` da nota da Galáxia contra o nome da pasta (médio quando difere) e passa a usar a ordem e o vocabulário novos das camadas.
- 1.0.0 (2026-11-07) — derivada da skill privada v2.3.0, neutralizada para o framework público: sem varredura por script, sem regras próprias do autor, áreas sensíveis pela marca `sensivel: true`.
