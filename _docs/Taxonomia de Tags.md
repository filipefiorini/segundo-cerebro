---
tags: [docs, vault, tags, taxonomia]
tipo: documentacao
criado: 2026-11-07
atualizado: 2026-11-07
status: active
---

![[_assets/banner-segundo-cerebro.png]]

# 🏷️ Taxonomia de Tags

> [!info] Vocabulário controlado do vault
> Referência para tags, status, tipo e campos do frontmatter. Consultar antes de criar tags novas. As tags de domínio abaixo são um ponto de partida: acrescente as do seu trabalho e da sua vida conforme as notas aparecerem.

---

## 📐 Regras Gerais

- Tags no frontmatter sempre no formato inline: `tags: [tag1, tag2]` — nunca lista `- item`
- Minúsculas, sem acentos, separadas por hífen quando compostas
- Tags estruturais em **inglês** (EN) — identificam o tipo/função da nota
- Tags de domínio em **português** (PT) — identificam o assunto/área
- Adicionar quantas tags de domínio forem relevantes
- Tags novas são permitidas, mas verificar aqui antes para evitar duplicatas

---

## 🏗️ Tags Estruturais (EN)

Identificam a função da nota no vault. Cada nota deve ter pelo menos uma.

| Tag | Quando usar | Exemplo de arquivo |
|---|---|---|
| `galaxy` | Notas permanentes, em cinco camadas | `05 - GALÁXIA/...` |
| `nota-literatura` | Fichas de materiais externos processados | `03 - RECURSOS/Fontes/Livros/...` |
| `project` | Projetos e seus contextos | `01 - PROJETOS/.../...` |
| `area` | Áreas de vida e seus contextos | `02 - ÁREAS/.../...` |
| `resource` | Material de referência reutilizável | `03 - RECURSOS/...` |
| `meeting` | Notas de reunião | pasta `Reuniões/` do escopo |
| `person` | Fichas do Banco de Pessoas | `02 - ÁREAS/Pessoas/...` |
| `context` | Arquivos `_CONTEXTO.md` de projetos e áreas | `_CONTEXTO.md` em qualquer projeto/área |
| `sop` | Procedimentos Operacionais Padrão | `03 - RECURSOS/Procedimentos/...` |
| `prompt` | Prompts de IA reutilizáveis | `03 - RECURSOS/Prompts de IA/...` |
| `template` | Templates do vault | `_templates/...` |
| `task` | Nota de tarefa (TaskNotes) | `06 - TAREFAS/Tarefas/...` |
| `dashboard` | Dashboards e painéis Dataview | Índices com queries |
| `indice` | Índices e listas curadas | `_INDICE.md` |
| `docs` | Documentação do vault | `_docs/...` |
| `log` | Registro de execução de skill | `_logs/...` |
| `decisoes` | Decisões e histórico do próprio sistema (exceção em PT, como o `tipo` homônimo) | `02 - ÁREAS/Segundo Cérebro/_DECISOES.md` e `_HISTORICO.md` |
| `vault` | Documentação sobre o próprio vault | `BEM-VINDO.md` e `_docs/...` |
| `sistema` | Arquivos de sistema do vault (par de `tipo: sistema`; exceção em PT) | `memory.md` e `memory/...` |
| `memoria` | Memória do agente (exceção em PT, par de `tipo: memoria`) | `memory.md` e `memory/...` |
| `tarefas` | Índice e vistas de tarefas (exceção em PT, par de `tipo: tarefas`) | `06 - TAREFAS/_INDICE.md` e `_TAREFAS.md` |
| `metricas` | Dashboards de métricas (exceção em PT) | `_templates/Template de Dashboard de Métricas.md` |
| `charts` | Dashboards com gráficos (plugin Charts) | `_templates/Template de Dashboard de Métricas.md` |

---

## 🌐 Tags de Domínio (PT)

Identificam o assunto. Organizadas por área de vida.

### Trabalho

Acrescente aqui as tags do seu trabalho.

| Tag | Quando usar |
|---|---|
| `trabalho` | Trabalho (genérico) |
| `vendas` | Vendas, funil comercial |
| `mercado` | Análise e inteligência de mercado |

### Tecnologia

| Tag | Quando usar |
|---|---|
| `ai` | Inteligência artificial, ferramentas e automação com IA |
| `obsidian` | Obsidian, plugins, configurações |
| `claude` | Claude, Claude Code, Anthropic |
| `automacao` | Automação em geral |
| `seguranca` | Segurança da informação |
| `segundo-cerebro` | PKM, sistema de notas, este vault |
| `zettelkasten` | Método Zettelkasten, notas atômicas |

### Conhecimento e Criação

| Tag | Quando usar |
|---|---|
| `conhecimento` | Conteúdo sobre conhecimento, aprendizado e síntese |
| `produtividade` | Sistemas, fluxos de trabalho, gestão de tempo |
| `criatividade` | Criação de conteúdo, escrita, processo criativo |
| `aprendizado` | Leitura, síntese, aquisição de habilidades |
| `conteudo` | Criação de conteúdo (genérico) |
| `mindset` | Modelos mentais, psicologia, crenças |

### Vida Pessoal

| Tag | Quando usar |
|---|---|
| `saude` | Saúde, fitness, nutrição, bem-estar |
| `financas` | Finanças pessoais, investimentos |
| `familia` | Assuntos familiares |
| `relacionamento` | Relacionamentos e conexões interpessoais |
| `estudos` | Estudos e aprendizado formal |
| `private` | Conteúdo privado ou sensível |

### Tags novas

> [!info] Regra da cauda longa
> Tag de domínio em uso em menos de 3 notas não precisa estar aqui; a auditoria a mostra só como informativo. Ao chegar a 3 notas, entra numa das tabelas acima ou é unificada com uma existente.

`skill` fica reservada ao frontmatter dos próprios arquivos de skill em `.claude/skills/`; notas sobre skills usam `skills`.

---

## 📊 Vocabulário Controlado — Campos do Frontmatter

### `status` — Ciclo de vida da nota

| Valor | Quando usar |
|---|---|
| `active` | Nota ou área ativa, em manutenção contínua |
| `in-progress` | Trabalho em andamento com atividade recente |
| `draft` | Rascunho, conteúdo ainda não finalizado |
| `complete` | Nota ou projeto finalizado |
| `waiting` | Aguardando condição externa, pausado |
| `archived` | Inativo, mantido para referência histórica |
| `cancelled` | Cancelado, não será retomado |

> [!warning] Status em inglês
> Todos os valores de status são em EN. Não usar `em-andamento`, `ativo`, `concluida`.

### Ciclo da captura no INBOX

Eixo **distinto** do `status` acima, só para arquivos de `00 - INBOX/`. Valores em PT por exceção declarada à regra do EN: são o padrão das capturas gravadas pelo Claude.ai.

| Valor | Quando usar |
|---|---|
| `aguardando-processamento` | Captura pronta para gravar no destino sugerido |
| `aguardando-planejamento` | Captura que pede plano antes de qualquer gravação |
| `processada` | Captura gravada ou descartada; vai para `04 - ARQUIVO/INBOX/AAAA-MM/` |

### Tarefas (`06 - TAREFAS/Tarefas/`)

Nota de tarefa, uma por tarefa. Identificada pela tag `task`; não usa `tipo:` (padrão do TaskNotes). Valores em EN, salvo `executor`. Frontmatter completo no [[06 - TAREFAS/_INDICE|índice de Tarefas]].

| Campo | Valores |
|---|---|
| `status` | `open` · `in-progress` · `waiting` (depende de terceiro ou de outra tarefa) · `done` |
| `priority` | `none` · `low` · `normal` · `high` |
| `executor` | `eu` · `code` |
| `projects` | Link para o `_CONTEXTO` do escopo (`["[[caminho/_CONTEXTO\|Escopo]]"]`) |
| `contexts` | Livre, para agrupar tarefas além do escopo |
| `due` | `AAAA-MM-DD` ou `AAAA-MM-DDTHH:MM`, obrigatório |
| `prazo_padrao` | `true` quando o Code pôs o prazo padrão (dia útil seguinte) por falta de prazo na fonte; apagar ao combinar a data |

### Campos de captura, reunião e área

| Campo | Valores |
|---|---|
| `origem` | `claude.ai` · `code` · `manual`: de onde veio a captura do INBOX |
| `destino_sugerido` | Caminho da nota ou pasta onde a captura deve ser gravada (capturas do INBOX) |
| `subtipo` | Só em reunião: `externa` · `interna` · `estudo` |
| `sensivel` | `true` · `false`, no `_CONTEXTO.md` da área. `true` marca área sensível: a auditoria olha só a estrutura e o conteúdo dela não é processado |

### Campos da nota da Galáxia

| Campo | Valores |
|---|---|
| `tipo_nota` | `atômico` (um conceito) · `resumo` (visão geral de uma fonte) · `misto` |
| `validade` | `permanente`, salvo ideia com prazo de validade conhecido |
| `data_verificacao` | `AAAA-MM-DD` da última conferência da ideia contra a realidade; vazio até a primeira |

### Campos de qualquer nota

| Campo | Valores |
|---|---|
| `exemplo` | `true` marca as notas que o framework traz como exemplo; o usuário pode apagá-las. Ausente ou `false` nas notas do usuário |

### `tipo` — Tipo da nota

| Valor | Quando usar | Onde vive |
|---|---|---|
| `nota-permanente` | Notas permanentes, em cinco camadas | `05 - GALÁXIA/` |
| `literatura` | Notas de Literatura (fichas de materiais) | `03 - RECURSOS/Fontes/` |
| `contexto` | Arquivos `_CONTEXTO.md` | Projetos e Áreas |
| `pessoa` | Fichas do Banco de Pessoas | `02 - ÁREAS/Pessoas/` |
| `reuniao` | Notas de reunião | Pasta `Reuniões/` do escopo |
| `prompt` | Prompts de IA | `03 - RECURSOS/Prompts de IA/` |
| `sop` | Procedimentos operacionais | `03 - RECURSOS/Procedimentos/` |
| `documentacao` | Documentação do vault | `_docs/` |
| `indice` | Índices e dashboards | Vários |
| `dashboard` | Painéis com queries Dataview | Vários |
| `template` | Templates | `_templates/` |
| `recurso` | Material de referência genérico | `03 - RECURSOS/` |
| `ideia` | Ideia solta: captura no INBOX, vira execução imediata ou tarefa | `00 - INBOX/` |
| `sistema` | Arquivos de sistema do vault | Raiz |
| `memoria` | Índice e arquivos de memória do agente | `memory.md` e `memory/` |
| `captura` | Captura bruta (Claude.ai ou manual) | `00 - INBOX/` |
| `tarefa` | Captura cujo conteúdo é uma ação a fazer; o `/processar-inbox` a grava como nota de tarefa (não confundir com a tag `task`) | `00 - INBOX/` |
| `log` | Registro de execução de skill | `_logs/` |
| `plano-inbox` | Plano de captura do INBOX à espera de validação | `_logs/inbox-planos/` |
| `tarefas` | Vista `_TAREFAS.md` de projeto ou área | Projetos e Áreas |
| `deliberacao` | Deliberação de projeto ou área | Pastas `Deliberações/` |
| `decisoes` | Registro de decisões sobre funcionalidades | `02 - ÁREAS/Segundo Cérebro/_DECISOES.md` |
| `historico` | Histórico de evolução de um escopo | `_HISTORICO.md` |
| `spec` | Especificação técnica de funcionalidade | `_specs/` do escopo |

> [!note] Variantes que não se usam
> `deliberação` → `deliberacao` · `procedimento` e `politica` → `sop` · `nota` → `nota-permanente` · `nota-literatura` → `literatura` · `análise`, `analise` e `pesquisa` → `recurso` · `moc` → `indice` · `decisao` e `registro-decisoes` → `deliberacao`.

### `camada` — Camadas da Galáxia (só Galáxia)

| Valor | Pergunta |
|---|---|
| `Filosofias` | No que eu acredito? |
| `Conceitos` | Que nome dou a isto? |
| `Frameworks` | Quais são as partes e como se ligam? |
| `Metodologias` | Em que ordem eu faço? |
| `Táticas` | O que faço nesta situação? |

Critério completo, desempate e exemplos: Manual › A Galáxia. A camada é propriedade da nota; a pasta é única (`05 - GALÁXIA/`) e as vistas ficam em `Galáxia.base`.

### `confianca` — Nível de confiança (só Galáxia)

| Valor | Critério |
|---|---|
| `alta` | Validado por experiência ou múltiplas fontes |
| `media` | Bem fundamentado mas sem validação pessoal |
| `baixa` | Hipótese ou insight preliminar |

### `fonte_tipo` — Origem do conhecimento

| Valor | Quando usar |
|---|---|
| `Livro` | Livro físico ou digital |
| `Vídeo` | Vídeo avulso (YouTube, Vimeo, gravação) |
| `Podcast` | Episódio de podcast ou programa de áudio |
| `Artigo` | Artigo, post, página web, newsletter |
| `Curso` | Curso estruturado com módulos e aulas |
| `Reunião` | Conversa, call, reunião de trabalho ou pessoal |
| `Experiência` | Vivência pessoal ou profissional direta |
| `Reflexão` | Insight por processo interno, sem fonte externa |
| `Projeto` | Aprendizado emergente da execução de um projeto |

---

## ⚠️ Tags Deprecated (não usar em notas novas)

Tags consolidadas ou substituídas. Se aparecerem, a auditoria sugere a troca.

| Tag deprecated | Substituída por | Motivo |
|---|---|---|
| `second-brain` | `segundo-cerebro` | Consolidação — manter em PT |
| `tag1`, `tag2` | *(remover)* | Placeholders de template, não são tags reais |
| `pessoa` | `person` | Tag estrutural fica em EN |
| `pessoas` | `person` | Tag estrutural fica em EN |
| `projeto` | `project` | Tag estrutural fica em EN |
| `projetos` | `project` | Tag estrutural fica em EN |
| `galaxia` | `galaxy` | Tag estrutural fica em EN |
| `reuniao` (como tag) | `meeting` | Tag estrutural fica em EN |
| `relacionamentos` | `relacionamento` | Consolidação — singular |
| `health` | `saude` | Tag de domínio, fica em PT |
| `ia` | `ai` | Tag estrutural, fica em EN |
| `sales` | `vendas` | Tag de domínio, fica em PT |
| `fontes` | `nota-literatura` | Tag redundante |
| `inprogress` | `in-progress` (campo status) | Formato corrigido |
| `recurso` (como tag) | `resource` | Tag estrutural fica em EN |
| `skill` (em nota sobre skills) | `skills` | `skill` é reservada aos arquivos de skill |
| `social-media` | `redes-sociais` | Tag de domínio, fica em PT |

---

<!-- usuario:inicio -->
## 🏷️ Tags e valores próprios

Tags e valores de campo que são só seus ficam aqui. O `/atualizar` preserva tudo o que estiver entre os marcadores, e mexer ali não dispara a regra MUDANÇA-ESTRUTURAL do `CLAUDE.md`.
<!-- usuario:fim -->

---

## 📎 Relacionado

- [[_docs/Manual do Segundo Cérebro]] — estrutura, roteamento e campos por cenário
- [[_docs/Ferramentas]] — padrão visual e de frontmatter
