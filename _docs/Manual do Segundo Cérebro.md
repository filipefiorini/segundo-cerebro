---
tags: [docs, vault, manual, segundo-cerebro]
tipo: documentacao
criado: 2026-11-07
atualizado: 2026-11-10
status: active
---

![[_assets/banner-segundo-cerebro.png]]

# 📖 Manual do Segundo Cérebro

> [!info] Estrutura, roteamento e registro
> Como o vault está organizado, para onde vai cada coisa e como registrar cada tipo de nota. Regras de comportamento do Code estão no [[CLAUDE.md]]; referência técnica (skills, templates, padrão visual, modelos) no [[_docs/Ferramentas|Ferramentas]]; tags na [[_docs/Taxonomia de Tags|Taxonomia]].

---

## 🧠 O Que É

Vault do Obsidian para vida e conhecimento, operado pelo Claude Code em sessões no Claude Desktop. Resolve três problemas:

1. **Captura dispersa** — ideias, referências e decisões que se perdem entre apps e conversas.
2. **Conhecimento sem síntese** — consumir sem extrair e conectar insights.
3. **Silos** — projetos, áreas e conhecimento desconectados.

Funciona com **IPARAG** (cada pasta responde ao uso que a nota terá) + **Galáxia** (5 camadas de conhecimento permanente) + um operador de IA que conhece a estrutura e age dentro da Constituição.

---

## 🏗️ Arquitetura

| Camada | Componentes |
|---|---|
| 1. Vault IPARAG | `00 - INBOX` a `06 - TAREFAS`: uma pasta por arquivo, decidida pelo uso que ele terá |
| 2. Galáxia | `05 - GALÁXIA/`, pasta única; conhecimento permanente em cinco camadas, que são a propriedade `camada` (Filosofias, Conceitos, Frameworks, Metodologias, Táticas), com vistas em `Galáxia.base` |
| 3. Infraestrutura | `_assets/`, `_docs/`, `_logs/`, `_templates/`, `memory/`, `.claude/skills/` |
| 4. Governança | O que a Guarda protege: `CLAUDE.md` (Constituição), `VERSION`, `.segundo-cerebro-version`, `_docs/` (Manual, Ferramentas, Taxonomia, O Método, Roadmap, Como o Autor Opera em Casa, Configuração de Plugins e CHANGELOG), `_templates/`, `.claude/` e `02 - ÁREAS/Segundo Cérebro/` (com o `_DECISOES.md` e o `_HISTORICO.md`). `memory.md` e `memory/` dão o contexto de cada sessão, fora dessa lista |
| 5. Skills | `atualizar`, `auditar-vault`, `deliberar`, `instalar`, `processar-conteudo`, `processar-inbox`, `processar-reuniao`, `revisar-memoria`, em `.claude/skills/`. Catálogo em [[_docs/Ferramentas|Ferramentas]] |
| 6. Integrações | Opcionais. Só entram as declaradas na tabela Zero Trust do `CLAUDE.md`; o vault funciona sem nenhuma |
| 7. Operador | Claude Code no Claude Desktop, sob demanda, dentro das regras do `CLAUDE.md` |

**Fluxo principal:** captura → INBOX → processamento → pasta IPARAG → consulta.

A versão do framework instalada fica em `.segundo-cerebro-version`, na raiz, criado pelo `/instalar` ao fim da instalação.

Para trazer uma versão nova, use o `/atualizar`: baixe o zip da versão, e o Code mostra o que muda, preserva o que é seu (notas, tarefas, áreas, os blocos entre marcadores `usuario:` e as suas mudanças nos arquivos do framework) e guarda um backup antes de gravar. Não atualize por `git pull`. Detalhes em [[_docs/Ferramentas]] › Versionamento.

---

## 🗂️ IPARAG — Pastas e Roteamento

Nenhum arquivo mora em duas pastas. Para escolher a pasta, o critério é o uso que a nota vai ter daqui para a frente; o tema dela não decide nada.

| Pasta | Propósito | Pergunta de roteamento |
|---|---|---|
| **00 - INBOX** | Entrada bruta, ainda sem destino. Esvaziada a cada rodada de processamento. | *"Preciso guardar isso agora?"* |
| **01 - PROJETOS** | Trabalho com entrega e critério de pronto. `Em Andamento/`, `Em Espera/`. | *"Tem entregável definido?"* |
| **02 - ÁREAS** | O que você mantém, sem prazo para acabar. Inclui `Segundo Cérebro/`. | *"É algo que mantenho sempre?"* |
| **03 - RECURSOS** | Material de consulta: Fontes, Procedimentos. | *"Vou reusar em vários contextos?"* |
| **04 - ARQUIVO** | O que acabou ou perdeu validade. Arquivar preserva a nota; apagar é outra decisão, com confirmação. | *"Acabou ou perdeu validade?"* |
| **05 - GALÁXIA** | Conhecimento permanente com palavras próprias, só síntese sua, nas cinco camadas. | *"É um insight atemporal meu?"* |
| **06 - TAREFAS** | Uma nota por tarefa em `Tarefas/`, vistas em `Views/` (TaskNotes). | *"É algo a fazer?"* |

- Em dúvida sobre o destino, ou área que o usuário ainda não aprovou: perguntar antes de gravar.
- Reorganizar pastas é mudança estrutural: plano, aprovação e correção de referências na mesma operação.
- Projeto concluído vai para `04 - ARQUIVO/`, salvo quando vira responsabilidade contínua: aí vira área em `02 - ÁREAS/`.
- O vault não duplica sistema oficial de terceiros (CRM, sistema da empresa, drive da equipe). Ele guarda o seu contexto e aponta para lá.

---

## ✅ Tarefas e Decisões

Cada tarefa é uma nota em `06 - TAREFAS/Tarefas/`, criada pelo [[Template de Tarefa]]. Índice e frontmatter esperado em [[06 - TAREFAS/_INDICE|Tarefas — índice]].

- `executor`: `eu` (você faz) ou `code` (o Code faz numa sessão).
- `due` é obrigatório: nenhuma tarefa nasce sem prazo. Fonte sem prazo → `due` no dia útil seguinte, com `prazo_padrao: true` para você rever a data. Ao combinar o prazo, troque a data e apague a marca.
- `projects` aponta para o `_CONTEXTO` do escopo. Dado pessoal nunca no título.

Projetos e áreas guardam arquivos com papéis distintos:

| Arquivo | Papel |
|---|---|
| `_TAREFAS.md` | Vista das tarefas do escopo (bloco Bases filtrando `projects`). Não recebe `- [ ]`. |
| `_CONTEXTO.md` | Descritivo: objetivo, estado, contexto. Nunca contém `- [ ]`. |
| `_HISTORICO.md` | Registro da evolução do escopo, quando ele precisar de um. |

As decisões sobre o próprio sistema vivem num lugar só: `02 - ÁREAS/Segundo Cérebro/_DECISOES.md`, fonte única do que fica, migra ou fecha. Uma linha por decisão:

```
| # | Funcionalidade | Decisão | Motivo | Origem | Data |
```

`02 - ÁREAS/Segundo Cérebro/_HISTORICO.md` é o log das mudanças estruturais (regra MUDANÇA-ESTRUTURAL): nova skill, nova regra, mudança de pasta ou de `_docs/`.

- Reuniões e deliberações registram tarefas como histórico, com a referência `> Acompanhado em [[nota da tarefa]]`.
- Suas tarefas entram como nota. Tarefas de terceiros ficam na ata. Responsável genérico ou ausente: confirmar antes de criar.
- Ações de reunião são **ações sugeridas** até você decidir que viram tarefa.
- `memory.md` nunca lista pendências; aponta para `06 - TAREFAS/`.
- [[_docs/Roadmap|Roadmap]] acompanha o que vem agora e depois, sem detalhe operacional.

---

## 🧠 Memória

O Code lê no início da sessão o índice [[memory]]; `fatos.md` e `aprendizados.md` quando o assunto pedir, e `sessoes.md` ao retomar um escopo ou quando você perguntar onde parou.

**O que entra na memória.** Só o que muda o comportamento da próxima sessão.
- `memory/fatos.md` — fatos estáveis sobre você, preferências, decisões de longo prazo. Uma linha por fato, com data. Só entra com sua confirmação explícita.
- `memory/aprendizados.md` — o que deu errado ou funcionou e virou regra prática. Entrada de 3–4 linhas: **situação · o que aconteceu · regra derivada · data · n=quantas vezes**. Regra com n=1 é hipótese. Hipótese com mais de 90 dias sem reincidência recebe `· fria`; fria há mais de 90 dias é candidata a arquivar na revisão seguinte, com seu ok.
- `memory/sessoes.md` — episódico. Uma entrada por sessão significativa, **máximo 5 linhas**: data, escopo, o que mudou, link para o `_HISTORICO` ou `_TAREFAS` do escopo. Entradas com mais de 30 dias são roladas em uma linha por semana; com mais de 90, apagadas.

**Revisão mensal:** a skill `revisar-memoria` propõe o que sobe de n, esfria, arquiva ou rola. Nunca grava sozinha.

**O que não entra:** hash de commit, caminhos de artefatos, detalhes de produção, IDs, telefones, conteúdo de saúde, finanças ou jurídico (regra SENSÍVEL), qualquer coisa que já está numa nota canônica. Narrativa de projeto vai para o `_HISTORICO.md` do escopo.

**Comando "Registre":** grava no máximo 5 linhas em `sessoes.md`, propõe (não grava) candidatos a `aprendizados.md`, e nunca toca `fatos.md` sem confirmação.

Memória arquivada, quando existir, fica em `_logs/memory-arquivo-AAAA-MM-DD.md`, só para consulta.

---

## 🌌 A Galáxia

| Camada | Pergunta | Exemplo |
|---|---|---|
| Filosofias | No que eu acredito? | *O cérebro é para ter ideias, não para guardá-las* |
| Conceitos | Que nome dou a isto? | *Pacotes Intermediários — nada do que você cria precisa ser descartado* |
| Frameworks | Quais são as partes e como se ligam? | *Lethal Trifecta — Framework de Segurança para Agentes de IA* |
| Metodologias | Em que ordem eu faço? | *Sumarização Progressiva — ler em camadas* |
| Táticas | O que faço nesta situação? | *Toda tarefa nasce com prazo* |

Se a nota responde a mais de uma pergunta, recebe a camada da pergunta que você faria para reencontrá-la. Uma nota, uma camada; as outras viram tags.

- Cada nota trata de um conceito só, escrito por você; trecho copiado fica na Nota de Literatura. As notas se ligam por `[[wikilinks]]`. Template: [[Template de Nota da Galáxia]].

**Filtro de graduação** (orientação). Antes de levar um insight para a Galáxia, perguntar: *"Eu buscaria essa ideia de forma independente, fora de qualquer projeto?"* Se não, ele fica no contexto de origem. Protocolo completo na skill `processar-conteudo`.

**Evolução de conteúdo** (opcional). Quando uma nota nova expande um conceito já existente na Galáxia, ela referencia a original por `[[wikilink]]` e a original pode ganhar `desenvolvido_em: [[nova-nota]]` no frontmatter. Aplicar a pedido ou quando `processar-conteudo` detectar sobreposição.

### Fontes → Galáxia

```
Material externo → 00 - INBOX → 03 - RECURSOS/Fontes/[tipo]/ (Nota de Literatura)
  → 05 - GALÁXIA/ (Nota da Galáxia, com `camada`) → conexões via [[wikilinks]]
```

A Nota de Literatura conecta o material original aos insights derivados. Transcrições brutas nunca entram em Fontes.

---

## 📝 Como Registrar

### Antes de criar uma nota

1. Identificar o cenário na tabela abaixo.
2. Aplicar o template indicado (catálogo completo em [[_docs/Ferramentas|Ferramentas]]).
3. Preencher o frontmatter com valores da [[_docs/Taxonomia de Tags|Taxonomia]].
4. Seguir o padrão visual (banner embutido, tags inline).

### Cenários

| # | Situação | Skill | Template | Destino |
|---|---|---|---|---|
| 1 | Livro lido | `processar-conteudo` | Nota de Literatura - Livro + nota da Galáxia | `03 - RECURSOS/Fontes/Livros/` + Galáxia |
| 2 | Artigo, post, página web | `processar-conteudo` | Nota de Literatura - Artigo + nota da Galáxia | `03 - RECURSOS/Fontes/Artigos/` + Galáxia |
| 3 | Vídeo | `processar-conteudo` | Nota de Literatura - Vídeo + nota da Galáxia | `03 - RECURSOS/Fontes/Vídeos/` + Galáxia |
| 4 | Podcast | `processar-conteudo` | Nota de Literatura - Podcast + nota da Galáxia | `03 - RECURSOS/Fontes/Podcasts/` + Galáxia |
| 5 | Curso estruturado | `processar-conteudo` | Nota de Literatura - Curso + nota da Galáxia | `03 - RECURSOS/Fontes/Cursos/` + Galáxia |
| 6 | Reunião (transcrição colada ou arquivo no INBOX) | `processar-reuniao` | Reunião + tarefas | pasta `Reuniões/` da área ou do projeto |
| 7 | Insight próprio | direto ou `processar-conteudo` | Nota da Galáxia | `05 - GALÁXIA/[Título].md` |
| 8 | Pessoa nova | direto | Pessoa | pasta Pessoas dentro de `02 - ÁREAS/`, criada na primeira ficha |
| 9 | Projeto novo | direto | Projeto (_CONTEXTO) + Tarefas | `01 - PROJETOS/Em Andamento/[Projeto]/` |
| 10 | Área nova | direto | Área (_CONTEXTO) + Tarefas | `02 - ÁREAS/[Área]/` |
| 11 | Deliberação | `deliberar` | Deliberação | pasta `Deliberações/` do escopo |
| 12 | Ficha de livro (Template de Livro) | direto | Livro | pasta de biblioteca dentro da área que você escolher |
| 13 | Procedimento / SOP | direto | frontmatter padrão | `03 - RECURSOS/Procedimentos/` |
| 14 | Prompt de IA | direto | frontmatter padrão | `03 - RECURSOS/Prompts de IA/` (criada no primeiro prompt) |
| 15 | Painel de números | direto | Dashboard de Métricas | escopo a que os números pertencem |
| 16 | Ideia solta | captura no INBOX → `processar-inbox` | frontmatter de captura | execução imediata ou tarefa em `06 - TAREFAS/Tarefas/` |
| 17 | Captura vinda do Claude.ai (`origem: claude.ai`) | `processar-inbox` | conforme o destino | destino da captura |
| 18 | Tarefa | direto | Tarefa | `06 - TAREFAS/Tarefas/` |
| 19 | Reflexão própria que vira fonte de várias notas | direto ou `processar-conteudo` | Nota de Literatura - Artigo (`fonte_tipo: Reflexão`) + nota da Galáxia | `03 - RECURSOS/Fontes/Reflexões/` + Galáxia |

Depois de processar um item bruto do INBOX, o original vai para `04 - ARQUIVO/INBOX/AAAA-MM/`, com sua confirmação (regra DESTRUTIVO).

### Frontmatter por tipo

**Nota de Literatura** (`fonte_tipo`: Livro · Artigo · Vídeo · Podcast · Curso · Reflexão):
```yaml
tags: [nota-literatura, conhecimento]
tipo: literatura
fonte_tipo: Livro
fonte_titulo: Título completo
fonte_autor: Autor, canal ou plataforma
fonte_url:
fonte_data: AAAA-MM-DD
criado: AAAA-MM-DD
status: in-progress
```
Ciclo de status: `in-progress` (consumindo) → `draft` (insights pendentes) → `complete` (notas da Galáxia criadas).

**Nota da Galáxia:**
```yaml
tags: [galaxy, conhecimento]
tipo: nota-permanente
tipo_nota: atômico | resumo | misto
camada: Filosofias | Conceitos | Frameworks | Metodologias | Táticas
fonte: "[[Nota de Literatura]]"
fonte_tipo: Livro | Vídeo | Podcast | Artigo | Curso | Experiência | Reflexão | Projeto
fonte_titulo:
fonte_autor:
fonte_url:
fonte_data:
criado: AAAA-MM-DD
revisado:
confianca: alta | media | baixa
data_verificacao:
validade: permanente
desenvolvido_em:
status: active
exemplo:
```
`camada` é propriedade obrigatória (um dos cinco valores); a pasta é única e as vistas por camada ficam em `Galáxia.base`. A auditoria confere. `exemplo` só nas notas que o framework traz. Insight sem fonte externa: `fonte: "[[]]"` + `fonte_tipo: Experiência` ou `Reflexão`, ou, se a reflexão tiver ficha, o link para ela em `03 - RECURSOS/Fontes/Reflexões/`.

**Reunião:** ver Ferramentas › Reuniões (nome e participante padrão) e o [[Template de Reunião]].

**Pessoa:** `tags: [person, relacionamento]` · `tipo: pessoa` · `status: active`. Nome: `Nome Sobrenome.md` ou `Nome Sobrenome (Apelido) - Empresa.md`.

**`_CONTEXTO.md` de projeto:** `tags: [project, ...]` · `tipo: contexto` · `status: in-progress` · `prazo: AAAA-MM-DD | contínuo`. Registrar o projeto na tabela do `CLAUDE.md` (exige aprovação).

**`_CONTEXTO.md` de área:** `tags: [area, ...]` · `tipo: contexto` · `status: active`.

**SOP:** `tags: [resource, sop, ...]` · `tipo: sop` · `status: active`.
**Prompt:** `tags: [resource, prompt, ai, ...]` · `tipo: prompt` · `status: active`.

### Cadeia de rastreabilidade

```
Material original (fonte_titulo, fonte_autor, fonte_url, fonte_data)
  → Nota de Literatura (fonte_tipo)
    → Nota da Galáxia (fonte: "[[Nota de Literatura]]", fonte_tipo herdado)
```
A skill `auditar-vault` identifica wikilinks quebrados e campos de fonte vazios.

---

## 🤖 Como o Operador Trabalha no Vault

- O operador é o Claude Code, aberto no Claude Desktop com a pasta do vault como pasta de trabalho. Na primeira sessão, o `/instalar` instala os plugins do Obsidian, pergunta quem você é, cria suas áreas, traz as instruções e os arquivos dos seus projetos de outras IAs (Claude, ChatGPT, Gemini ou outra; as conversas ficam de fora), ajuda a ligar conectores do claude.ai e plugins do Claude, se você quiser, e orienta o backup; dá para parar e continuar noutra sessão.
- A cada sessão, o Code lê o `CLAUDE.md`: identidade, estrutura, regras e Zero Trust. `memory.md` e `memory/` complementam com fatos, aprendizados e sessões recentes. Referência técnica é consultada no Ferramentas sob demanda.
- Na prática: você pede em linguagem natural ou chama uma skill (`/processar-inbox`, `/processar-conteudo`...). O Desktop carrega as skills de `.claude/skills/` sozinho.
- O dia a dia em três gestos: capture qualquer coisa solta em `00 - INBOX/` (nota, link, trecho colado); chame `/processar-inbox` para o Code gravar cada captura no destino certo e arquivar a original; abra o painel com `/tarefas` para ver o que vence e ajustar prazo, status e prioridade.
- O Code apresenta plano antes de mudança com vários arquivos, pede confirmação antes de mover, renomear, apagar ou enviar, e lê o resultado antes de dizer que terminou.
- Integrações (agenda, e-mail, drive) são conectores do claude.ai: você conecta no claude.ai (Configurações › Conectores) e eles valem nas sessões do Code da mesma conta. Só entram no trabalho depois de declaradas na tabela Zero Trust do `CLAUDE.md`, com o que podem e o que não podem fazer; o `/instalar` propõe a linha de cada um com o padrão de só buscar e ler.
- Dois módulos acompanham a sessão. A Guarda da Constituição confere cada ação contra as regras do `CLAUDE.md` e pede confirmação (ou recusa) em governança, sobrescrita, comando destrutivo, CPF, tarefa sem `due` e push forçado; `/guarda liberar` suspende as confirmações por 1 hora, só a pedido seu. O Painel de tarefas (`/tarefas`) mostra e ajusta as notas de `06 - TAREFAS/Tarefas/` ao lado do chat. Detalhes e como desligar: `_docs/Ferramentas.md`, seção Módulos.
- Nada roda sozinho: o vault só muda quando você abre uma sessão e pede. Quem quiser rotinas agendadas encontra a ideia em [[_docs/Como o Autor Opera em Casa|Como o Autor Opera em Casa]].

---

## 📎 Relacionado

- [[CLAUDE.md]] — Constituição
- [[BEM-VINDO]] — primeiros passos
- [[_docs/Ferramentas]] — referência técnica
- [[_docs/Taxonomia de Tags]] — vocabulário controlado
- [[_docs/O Método]] — o método numa página
- [[_docs/Roadmap]] — o que vem agora e depois
- [[_docs/CHANGELOG]] — histórico de versões do framework, que o `/atualizar` mostra
- `02 - ÁREAS/Segundo Cérebro/_DECISOES.md` — decisões sobre funcionalidades
