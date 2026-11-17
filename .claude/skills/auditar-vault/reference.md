# auditar-vault — referência das etapas

> Detalhe das verificações 1 a 11 e template do relatório. Carregado sob demanda pelo [SKILL.md](SKILL.md).

**`.segundo-cerebro/` fica fora de toda varredura.** Num vault instalado, essa pasta guarda o trabalho do framework (`base/` é a cópia dos arquivos do framework usada pelo `/atualizar`, além de backups e preparos). Nenhuma etapa que varre arquivos (frontmatter, `status`, tags, banners, wikilinks, templates, contagens, local errado) olha dentro dela: o que está lá não é nota do vault.

### ETAPA 1 — Estrutura de Pastas

Verificar se as pastas esperadas existem.

**IPARAG:**
- `00 - INBOX`
- `01 - PROJETOS` → `Em Andamento/`, `Em Espera/`
- `02 - ÁREAS` → as áreas listadas na tabela "Projetos e áreas ativos" do `CLAUDE.md`, cada uma com `_CONTEXTO.md`; `Segundo Cérebro/` (com `_DECISOES.md` e `_HISTORICO.md`); `Pessoas/` quando houver ficha de pessoa
- `03 - RECURSOS` → `Fontes/`, `Procedimentos/`. As subpastas de `Fontes/` (`Livros/`, `Artigos/`, `Vídeos/`, `Podcasts/`, `Cursos/`, `Reflexões/`) e `Prompts de IA/` nascem na primeira nota: ausência não é achado
- `04 - ARQUIVO`
- `05 - GALÁXIA` → pasta única: as notas ficam direto nela, com `_INDICE.md` e `Galáxia.base`; nenhuma subpasta esperada
- `06 - TAREFAS` → `Tarefas/` (uma nota por tarefa, tag `task`), `Views/` (arquivos `.base` do TaskNotes), `_INDICE.md`

**Infraestrutura:**
- `_assets/`, `_docs/`, `_templates/`, `_logs/`, `memory/`, `.claude/skills/`

Na raiz, também são esperadas as pastas de repositório do manifesto (`scripts/`, `.githooks/`, `.github/`, `.claude-plugin/`), as de apoio (`.claude/`, `.obsidian/`, `_assets/`, `_docs/`, `_logs/`, `_templates/`, `memory/`), `.segundo-cerebro/` e `.git/`: nenhuma delas é "inesperada". As pastas de repositório, `.segundo-cerebro/`, `.git/` e `.obsidian/` são esperadas quando presentes e não contam como ausentes quando faltam (um vault fora do repositório não tem as de repositório; `.segundo-cerebro/` nasce na instalação).

Reportar: pastas esperadas ausentes, pastas inesperadas na raiz, área listada no `CLAUDE.md` sem pasta (ou pasta de área sem linha na tabela).

**Fallback:** vault vazio ou sem estrutura IPARAG → 🔴 Crítico e interromper as demais verificações.

---

### ETAPA 2 — Frontmatter YAML (vault inteiro)

Varrer **todos** os arquivos `.md` do vault, exceto `.obsidian/`, `_assets/`, `.git/` e `.segundo-cerebro/`.

Para cada arquivo, verificar:

1. **Existência de frontmatter** — bloco `---` válido no topo do arquivo.
2. **Campos obrigatórios mínimos** de qualquer nota:

| Campo | Obrigatório | Regra |
|-------|-------------|-------|
| `tags` | ✅ | Array inline `[tag1, tag2]`, nunca formato lista |
| `tipo` | ✅ | Valor do vocabulário de `tipo` da Taxonomia |
| `criado` | ✅ | Formato `AAAA-MM-DD` |
| `status` | ✅ | Valor do vocabulário EN (ver Etapa 3) |

3. **Campos extras por tipo de nota:**

| Tipo de nota | Campos extras obrigatórios |
|---|---|
| Nota da Galáxia (`05 - GALÁXIA/`, fora `_INDICE`) | `camada` presente e com um dos cinco valores (Filosofias, Conceitos, Frameworks, Metodologias, Táticas); ausente ou fora do vocabulário é médio, porque a nota some das vistas por camada; `fonte_tipo`, `confianca`; `fonte_tipo` `Reflexão` ou `Experiência` aceitam `fonte: "[[]]"` (insight sem ficha) ou um link para uma ficha em `03 - RECURSOS/Fontes/Reflexões/`; outro alvo é médio |
| Nota de Literatura (`03 - RECURSOS/Fontes/`) | `fonte_tipo`, `fonte_titulo`, `fonte_autor` |
| Reunião (pasta `Reuniões/` de qualquer escopo) | `data`, `participantes`, `plataforma` |
| Pessoa (`02 - ÁREAS/Pessoas/`) | os campos do Template de Pessoa |
| Template (`_templates/`) | tag `template` presente (exceções na Etapa 7) |
| Tarefa (`06 - TAREFAS/Tarefas/`) | frontmatter do TaskNotes (índice de Tarefas): sem `tipo` nem `criado`; `status` open, in-progress, waiting ou done; `due` preenchido |

**Exceções por desenho** (não são achado):
- Capturas de `00 - INBOX/` seguem o esquema de captura (`tipo`, `status`, `data`; sem `criado`).
- `CLAUDE.md`, `Homepage.md`, `_docs/CHANGELOG.md`, `CONTRIBUTING.md`, os `README*.md` e os `LEIA-ME.md` não têm frontmatter.
- Em `.claude/skills/`, o `SKILL.md` segue o formato de skill (`name`, `description`, `version`); `reference.md` e `exemplos.md` não têm frontmatter.
- `_logs/` segue o formato que cada skill define (`tipo: log` nos registros, `tipo: plano-inbox` nos planos do INBOX); só o `status` é conferido (Etapa 3).

Reportar: arquivos sem frontmatter, campos obrigatórios ausentes, tags em formato lista, tarefa sem `due`.

**Fallback:** nenhum `.md` encontrado → 🔴 Crítico.

---

### ETAPA 3 — Consistência de Status

Vocabulário aceito para notas:
```
active | in-progress | complete | archived | draft | waiting | cancelled
```

Vocabulários próprios, válidos só no seu lugar (ver Taxonomia):
- Tarefas: `open | in-progress | waiting | done`
- Capturas do INBOX: `aguardando-processamento | aguardando-planejamento | processada`
- Planos do INBOX (`_logs/inbox-planos/`): `aguardando-validacao | aplicado | descartado`

Varrer todos os campos `status:`, exceto em `_templates/` (o template traz o valor da nota que gera). Reportar valor fora do vocabulário do lugar, incluindo:
- valores em português em notas (`em-andamento`, `ativo`, `concluida`, `arquivada`, `cancelada`);
- valores não padronizados (`published`, `inprogress`, `ideia`, `ready-to-publish`).

**Fallback:** nenhum arquivo com `status` → 🟠 Médio (pode indicar migração incompleta).

---

### ETAPA 4 — Tags contra a Taxonomia

Referência oficial: [[_docs/Taxonomia de Tags|Taxonomia de Tags]].

Para cada arquivo, verificar:
1. As tags do frontmatter existem na Taxonomia.
2. Não há tag deprecated (tabela "Tags Deprecated" da Taxonomia); sugerir a substituta.
3. Não há duplicata semântica (`reuniao` × `meeting`, `contexto` × `context`, `projeto` × `project`).
4. Tags estruturais em EN: `project`, `area`, `resource`, `galaxy`, `meeting`, `person`, `sop`, `prompt`, `context`, `indice`, `dashboard`, `task`, `template`, `docs`.

Reportar: tag fora da Taxonomia usada em 3 ou mais notas (menos de 3 é cauda longa: só 🔵 Informativo), tag deprecated, duplicata semântica. `skill` é a tag dos próprios arquivos de `.claude/skills/`; em nota sobre skills, sugerir `skills`. `_logs/` fica fora desta etapa: os registros das skills usam `tags: [log]`.

**Fallback:** Taxonomia inexistente → 🔴 Crítico e pular esta etapa.

---

### ETAPA 5 — Banners

Regra em [[_docs/Ferramentas|Ferramentas]] › Padrão Visual: embed `![[_assets/banner-*.png]]` no corpo, logo após o frontmatter; `banner:` e `banner_y:` no frontmatter são **proibidos**.

1. **`banner:` ou `banner_y:` no frontmatter** → 🟠 Médio.
2. **Arquivo existe** em `_assets/` para cada banner referenciado.
3. **Órfãos** — arquivos `banner-*` em `_assets/` sem nenhuma referência (🔵 Informativo: o vault traz banners para uso futuro).

Reportar: notas com `banner:` no frontmatter, banners referenciados e ausentes, órfãos. Nota sem banner não é achado; banner em local onde a tabela do Ferramentas diz "Não" (`04 - ARQUIVO/`, `.claude/skills/`, `_logs/`…) é 🟡 Menor.

**Fallback:** `_assets/` inexistente → 🔴 Crítico.

---

### ETAPA 6 — Wikilinks

Varrer os padrões `[[...]]` e `![[...]]` fora de blocos de código e de código em linha:
1. O arquivo referenciado existe no vault (por nome de nota ou por caminho, como o Obsidian resolve).
2. Wikilinks vazios `[[]]` fora de `_templates/`. Exceção por desenho: `fonte: "[[]]"` em nota da Galáxia com `fonte_tipo` `Reflexão` ou `Experiência` (insight sem ficha) não é achado. Com outro `fonte_tipo` (fonte externa ainda sem ficha), é 🔵 Informativo: "fonte sem ficha; rever quando souber a fonte".
3. Barra invertida antes do pipe fora de tabela (`\_CONTEXTO\|`) — problema de escape.
4. Wikilinks para caminhos antigos ou renomeados.

`_templates/` fica de fora (os links ali são preenchidos no uso), e `.segundo-cerebro/` também.

Reportar: wikilink quebrado com o arquivo de origem, a linha e a correção sugerida.

**Fallback:** nenhum wikilink no vault → 🟡 Menor (vault em fase inicial).

---

### ETAPA 7 — Templates

Verificar os arquivos de `_templates/`:
1. `criado`, quando existe, usa expressão Templater (`<% tp.date.now(...) %>`), não data fixa.
2. Frontmatter com tag `template` e `tipo: template`. Exceções: o Template de Tarefa (formato do TaskNotes, `tags: [task]`) e o Template de Tarefas (vista `_TAREFAS.md`, `tipo: tarefas`) já trazem o frontmatter da nota que geram; template sem `criado` (ex.: Template de Livro) é só 🔵 Informativo.
3. Todo template do catálogo em [[_docs/Ferramentas|Ferramentas]] › `_templates/` — Catálogo existe em `_templates/`.
4. Não há template órfão (existe na pasta e falta no catálogo).

Reportar: datas fixas, templates fora do catálogo, templates ausentes. **Esta etapa só reporta: qualquer correção em template exige aprovação explícita.**

**Fallback:** `_templates/` vazia → 🟠 Médio.

---

### ETAPA 8 — Projetos

Consistência entre projetos reais e documentação:
1. Cada subpasta de `01 - PROJETOS/Em Andamento/` e `01 - PROJETOS/Em Espera/` tem `_CONTEXTO.md`.
2. Cada projeto com `_CONTEXTO.md` está na tabela "Projetos e áreas ativos" do `CLAUDE.md`.
3. Cada projeto da tabela existe no vault.
4. O status descrito na tabela combina com o `status` do `_CONTEXTO.md` e com a pasta (`Em Andamento` × `Em Espera`).
5. `_CONTEXTO.md` não contém `- [ ]` (regra FONTE-DE-TAREFAS).

Reportar: projeto sem `_CONTEXTO.md`, projeto fora da tabela, divergência de status, checkbox em `_CONTEXTO.md`.

**Fallback:** nenhum projeto em `01 - PROJETOS/` → 🔵 Informativo.

---

### ETAPA 9 — Documentação e Contagens

Os arquivos de governança refletem a realidade?

1. Templates em `_templates/` × catálogo do Ferramentas.
2. Skills em `.claude/skills/` × catálogo do Ferramentas › Skills e a linha de skills do Manual (Arquitetura).
3. Pastas descritas no Manual e no `CLAUDE.md` (Estrutura do vault) × pastas reais. As pastas de apoio e de repositório que a Etapa 1 aceita na raiz (`.segundo-cerebro/`, `.github/`, `.claude-plugin/` e as demais) não viram achado por faltarem na tabela do `CLAUDE.md`.
4. `BEM-VINDO.md` cita as pastas de infraestrutura corretas.
5. **Referências mortas em texto** nos arquivos que dão instrução (`.claude/skills/`, `_docs/`, `_templates/`, `CLAUDE.md`, `BEM-VINDO.md`):
   - regra numerada (`R` + número, "Hard Rule", "Regra N do CLAUDE"): a Constituição nomeia as regras por palavra (GRAVAÇÃO, DESTRUTIVO…), então toda numeração é referência morta;
   - caminho entre crases que começa por uma pasta do vault e não existe.

   Ficam de fora: `exemplos.md` (notas fictícias de propósito), linhas de changelog, itens `- [x]` e seus subitens, moldes (`AAAA`, `<…>`, `[…]`, `*`, `…`), caminhos em `_logs/` e caminhos que nascem no primeiro uso: a pasta ou o arquivo que uma skill (ou um plugin do núcleo, como o TaskNotes) cria quando grava ali a primeira nota ou o primeiro registro não é referência morta enquanto não existe. Exemplos: `_logs/auditoria.md`, `_logs/inbox-AAAA-MM.md`, `_logs/inbox-planos/`, `_logs/revisao-memoria/`, `04 - ARQUIVO/INBOX/`, `04 - ARQUIVO/Tarefas/`, subpastas de `Fontes/`, `Prompts de IA/`, `Pessoas/`, pastas `Reuniões/` e `Deliberações/` de um escopo.

Reportar: contagens divergentes (esperado × real); referências mortas como `arquivo:linha → referência`.

**Fallback:** arquivo de governança inexistente → 🟠 Médio.

---

### ETAPA 10 — Queries Dataview

Nos arquivos com blocos ` ```dataview `:
1. Caminhos `FROM "..."` apontam para pastas existentes.
2. Filtros `WHERE` usam campos que existem no frontmatter das notas-alvo.

Reportar: caminho inválido, campo inexistente.

**Fallback:** nenhum bloco Dataview → ✅ não aplicável.

---

### ETAPA 11 — Arquivos em Local Errado

Verificar (fora `_templates/`, cujos arquivos carregam tag e tipo da nota que geram, e fora `.segundo-cerebro/`):
- Nota em subpasta de `05 - GALÁXIA/` (menor): a Galáxia é pasta única. Correção: mover para a raiz da Galáxia, com confirmação.
- Templates fora de `_templates/`.
- Procedimentos (`tipo: sop`) fora de `03 - RECURSOS/Procedimentos/`.
- Prompts (`tipo: prompt`) fora de `03 - RECURSOS/Prompts de IA/`.
- Notas de literatura fora de `03 - RECURSOS/Fontes/`.
- Skills fora de `.claude/skills/`.
- Notas de tarefa (tag `task`) fora de `06 - TAREFAS/Tarefas/` e de `04 - ARQUIVO/`.
- Captura bruta (`tipo: captura`) fora de `00 - INBOX/` e de `04 - ARQUIVO/INBOX/`.

Reportar: arquivo, local atual, destino sugerido.

**Fallback:** tudo no lugar → ✅.

---

## Template do relatório (ETAPA 12)

```
## RELATÓRIO DE AUDITORIA — [DATA]

**Modo:** [Completo | Rápido | Seção: nome]

### 🔴 Crítico (bloqueia funcionamento)
- [arquivo] → [problema] → [correção sugerida]

### 🟠 Médio (inconsistência funcional)
- [arquivo] → [problema] → [correção sugerida]

### 🟡 Menor (cosmético ou melhoria)
- [arquivo] → [problema] → [correção sugerida]

### 🔵 Informativo (observação sem ação necessária)
- [observação]

### ✅ Verificações sem problemas
- [etapas que passaram limpas]

---
Total: X críticos | Y médios | Z menores | W informativos
Vault está [SAUDÁVEL / ATENÇÃO NECESSÁRIA / CRÍTICO]
```

**Classificação geral:**
- **SAUDÁVEL** — 0 críticos e até 2 médios
- **ATENÇÃO NECESSÁRIA** — 0 críticos e mais de 2 médios, ou 1 a 2 críticos
- **CRÍTICO** — mais de 2 críticos
