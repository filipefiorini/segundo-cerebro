# processar-conteudo — referência

> Detalhe da ETAPA 2: classificação de fonte, graduação para a Galáxia, tags, ações, projeto e sobreposição. Carregado sob demanda pelo [SKILL.md](SKILL.md).

### ETAPA 2 — Analisar e Classificar

Leitura completa do conteúdo para identificar seis dimensões.

#### a) Tipo de material → Classificação de Fonte

| O conteúdo é... | Destino |
|-----------------|---------|
| Livro (ou capítulo, resumo de livro) | `03 - RECURSOS/Fontes/Livros/` |
| Artigo, post, página web | `03 - RECURSOS/Fontes/Artigos/` |
| Vídeo (YouTube, palestra, webinar) | `03 - RECURSOS/Fontes/Vídeos/` |
| Episódio de podcast | `03 - RECURSOS/Fontes/Podcasts/` |
| Curso estruturado (módulos, aulas) | `03 - RECURSOS/Fontes/Cursos/` |
| Transcrição de reunião | pasta `Reuniões/` da área ou do projeto, pelo Template de Reunião (regras da skill `processar-reuniao`) |
| Nota bruta, anotação pessoal | Avaliar: pode ser nota da Galáxia direto ou continuar no INBOX |

**Regra: transcrição bruta nunca entra em Fontes.** Vira reunião ou fonte de insights.

#### b) Insights extraíveis → Camadas da Galáxia

##### Graduação para a Galáxia — filtro obrigatório antes de classificar

**Filtro primário:**
> "Eu buscaria essa ideia de forma independente, fora de qualquer projeto ou conversa específica?"

- **Sim** → candidato à Galáxia. Seguir para a validação secundária.
- **Não** → fica no contexto de origem (Nota de Literatura, deliberação, `_CONTEXTO` do escopo). Sem nota da Galáxia.

**Validação secundária (para os candidatos):**
1. **Síntese própria** — está escrito com a voz e a perspectiva do usuário, não do autor original? Se não, passa primeiro pela Nota de Literatura e a nota da Galáxia é a reescrita com palavras próprias.
2. **Isolabilidade** — representa uma ideia central única? Se não, quebrar em dois candidatos e aplicar o filtro primário a cada um.

##### Heurística de classificação por camada

A camada certa sai da pergunta que a nota responde:

| Camada | Pergunta |
|---|---|
| Filosofias | No que eu acredito? |
| Conceitos | Que nome dou a isto? |
| Frameworks | Quais são as partes e como se ligam? |
| Metodologias | Em que ordem eu faço? |
| Táticas | O que faço nesta situação? |

Critério completo, desempate e exemplos: Manual › A Galáxia. Desempate: se a nota responde a mais de uma pergunta, recebe a camada da pergunta que você faria para reencontrá-la.

**Regra da âncora primária (insights compostos):** insight que cruza camadas **não é dividido à força**. Recebe a camada da pergunta que você faria para reencontrá-lo; a relevância secundária fica nas tags. Sem duplicação, sem fragmentação forçada.

**Atomicidade:** cada nota guarda um conceito só. Insight com vários conceitos independentes vira notas separadas, cada uma passando pelo filtro primário.

**Campos da nota da Galáxia** (Template de Nota da Galáxia; vocabulário na Taxonomia):

| Campo | Como preencher |
|---|---|
| `tipo_nota` | `atômico` (um conceito), `resumo` (visão geral de uma fonte) ou `misto` |
| `camada` | a camada escolhida acima, um dos cinco valores (a nota fica sempre direto em `05 - GALÁXIA/`) |
| `fonte` | wikilink para a Nota de Literatura; `"[[]]"` se não houver fonte externa |
| `fonte_tipo` | herdado da fonte; sem fonte externa, `Experiência` ou `Reflexão` |
| `confianca` | `alta` (validado por experiência ou várias fontes), `media` (bem fundamentado, sem validação pessoal), `baixa` (hipótese) |
| `validade` | `permanente`, salvo ideia com prazo de validade conhecido |

#### c) Seleção de Tags

Consultar `_docs/Taxonomia de Tags.md`:
1. **Tag estrutural** obrigatória: `nota-literatura` (fontes), `galaxy` (nota da Galáxia), `meeting` (reunião), `project` + `context` (projeto novo).
2. **Tags de domínio** (PT): escolher entre as documentadas na Taxonomia.
3. Tag nova só depois de conferir que não há equivalente; o plano diz que ela é nova.

#### d) Ações ou tarefas no conteúdo

Extrair ações mencionadas (prazos, responsáveis, próximos passos). No plano entram como **sugestão**. Se o usuário pedir a tarefa, ela segue a regra FONTE-DE-TAREFAS do `CLAUDE.md`: nota em `06 - TAREFAS/Tarefas/` pelo Template de Tarefa, com `projects`, `executor` (`eu` ou `code`) e `due` (sem prazo na fonte: dia útil seguinte e `prazo_padrao: true`).

#### e) Sugestão de projeto

Avaliar se o conteúdo pede um projeto novo em `01 - PROJETOS/Em Andamento/`. Projeto novo também entra na tabela "Projetos e áreas ativos" do `CLAUDE.md`, o que exige aprovação explícita à parte.

#### f) Sobreposição conceitual na Galáxia

Para cada nota classificada como nota da Galáxia:
1. Procurar em `05 - GALÁXIA/` nota com conceito relacionado (por título, tags e wikilinks existentes).
2. **Achou** → sinalizar no plano: `⚠️ Expande [[Nota Existente]] — protocolo de evolução`.
3. Depois da aprovação e da criação: (a) wikilink para a nota existente no corpo da nova; (b) `desenvolvido_em: "[[nova-nota]]"` no frontmatter da original.
4. **Não achou** → seguir sem sinalização.

**Fallbacks da ETAPA 2:**
- **Sem insights extraíveis** → só a Nota de Literatura; dizer que não houve insight para a Galáxia.
- **Conteúdo misto** (reunião com insight de conhecimento) → nota de reunião em `Reuniões/` + notas da Galáxia separadas.
- **Conteúdo já processado** (nota estruturada, não bruta) → avisar e perguntar se é para reprocessar.
- **Idioma diferente do português** → processar normalmente; as notas da Galáxia são sintetizadas em português (síntese sempre na língua do vault).
