---
tags: [docs, vault, ferramentas, referencia-tecnica]
tipo: documentacao
criado: 2026-11-07
atualizado: 2026-11-19
status: active
---

![[_assets/banner-segundo-cerebro.png]]

# 🔧 Ferramentas — Referência Técnica do Vault

> [!info] Documento de referência técnica
> Consultado sob demanda, não em toda sessão. Comportamento e regras vivem no [[CLAUDE.md]]; estrutura e roteamento no [[_docs/Manual do Segundo Cérebro|Manual]]; tags na [[_docs/Taxonomia de Tags|Taxonomia]].

---

## 🗺️ Mapa de Responsabilidade dos Arquivos

Consultar antes de gravar (regra GRAVAÇÃO). Cada arquivo tem escopo declarado; gravar fora dele é proibido.

| Arquivo | Fonte de verdade para | Quem atualiza | Quando |
|---|---|---|---|
| `CLAUDE.md`, blocos entre `<!-- usuario:inicio -->` e `<!-- usuario:fim -->` | Dono do vault, prioridades do momento, projetos e áreas ativos, Zero Trust | `/instalar` na instalação; depois, o Code com aprovação explícita do usuário no chat | Área, projeto ou integração nova aprovada. O resto do arquivo é do framework |
| `memory/fatos.md` | Fatos estáveis e decisões de longo prazo | o Code, com confirmação explícita do usuário | Quando um fato é confirmado |
| `memory/aprendizados.md` | Regras práticas derivadas de erro ou acerto | o Code propõe, o usuário aprova | Revisão mensal ou candidato aprovado |
| `memory/sessoes.md` | Episódico recente (≤ 5 linhas por sessão) | o Code | Final de sessão significativa |
| `05 - GALÁXIA/_CANDIDATOS.md` | Candidatos à Galáxia oferecidos e sem resposta | o Code: grava na oferta, tira na decisão ou aos 60 dias | Oferta de candidato; `revisar-memoria` |
| `06 - TAREFAS/Tarefas/` | Tarefas: uma nota por tarefa (`projects`, `executor`, `due`) | o Code; o usuário no Obsidian | Quando tarefa é criada ou muda de status |
| `_TAREFAS.md` (por escopo) | Vista das tarefas do escopo | o Code | Só ao mudar a vista |
| `_CONTEXTO.md` (por escopo) | Descrição do projeto ou área (sem `- [ ]`) | o Code | Quando o estado descrito muda |
| `_DECISOES.md` (área Segundo Cérebro) | Decisões sobre funcionalidades: fica / migra / fecha | o Code, com aprovação do usuário | Quando uma decisão é tomada |
| `_HISTORICO.md` (área Segundo Cérebro) | Log das mudanças estruturais | o Code | Na mesma operação da mudança estrutural |
| `00 - INBOX/` | Capturas ainda não processadas | o usuário; o Claude.ai pelo Desktop; o Code arquiva com confirmação | A cada captura e a cada processamento |
| `_logs/` | Registros das skills (auditoria, revisão da memória, INBOX, instalação) e memória arquivada | o Code, pelas skills | A cada execução |

**Conflito entre documentos:**
1. `CLAUDE.md` prevalece para comportamento do Code.
2. Manual e Ferramentas prevalecem para estrutura e padrões do vault.
3. `06 - TAREFAS/` prevalece para pendências; `_DECISOES.md` para decisões; `memory/` para fatos e aprendizados do agente.
4. `CLAUDE.md` contra `_docs/` → perguntar ao usuário.

---

## 📝 Comando "Atualize" / "Registre"

Só entra na memória o que muda o comportamento da próxima sessão (regra completa no [[_docs/Manual do Segundo Cérebro|Manual]] › Memória). Quando o usuário disser "Atualize" ou "Registre":
1. `memory/sessoes.md` — no máximo 5 linhas: data, escopo, o que mudou, link para `_HISTORICO` ou `_TAREFAS` do escopo.
2. `memory/aprendizados.md` — propor candidatos (situação · o que aconteceu · regra · data · n); não gravar sem aprovação.
3. `memory/fatos.md` — nunca tocar sem confirmação explícita.
4. Fora da memória: [[_docs/Roadmap|Roadmap]] se algo avançou; `_HISTORICO.md` da área Segundo Cérebro se houve mudança estrutural; `CLAUDE.md` só com regra nova aprovada no chat.

Não entra: hash de commit, caminhos de artefatos, detalhes de produção, IDs, telefones, dado SENSÍVEL, nada que já esteja numa nota canônica.

---

## 🔢 Versionamento

A versão do framework instalada no vault fica em `.segundo-cerebro-version`, na raiz, gravado pelo `/instalar` ao fim da instalação. Ela é do mantenedor: quem lança versão nova é ele, no repositório público. A versão nova chega ao seu vault pelo `/atualizar`, nunca por `git pull`: você baixa o zip da versão nova, e o Code compara com o que você tem, mostra o que muda e só grava depois do seu ok. O `git pull` passaria por cima das suas mudanças e da base de comparação, e as próximas atualizações deixariam de saber o que é seu.

A pasta `.segundo-cerebro/` guarda o que o `/atualizar` precisa:

- `base/` (versionada no Git): uma cópia de cada arquivo fixo do framework como foi instalado ou atualizado pela última vez. É por ela que o `/atualizar` sabe o que você mudou e o que a versão nova mudou. O `/instalar` a grava na etapa 9.
- `backup/` (fora do Git): o que a atualização sobrescreveria, guardado antes de gravar. Ficam os dois últimos.
- `preparo/` (fora do Git): a pasta de trabalho de uma atualização, com o zip extraído e as versões mescladas que você aprovou.

O que a atualização preserva: suas notas, tarefas e áreas; o que estiver entre os marcadores `usuario:` (no `CLAUDE.md`, o bloco do dono, a tabela de projetos e áreas e a Zero Trust; na Taxonomia, a seção "Tags e valores próprios"); e as mudanças que você fez em arquivo do framework. Quando você e a versão nova mudaram o mesmo arquivo, o Code faz a mescla: mostra os dois lados e pergunta trecho a trecho onde há conflito. Se você mudou só dentro dos blocos `usuario:`, o arquivo vai para a versão nova com os seus blocos, sem mescla.

Para voltar atrás, `/atualizar desfazer` restaura uma atualização inteira ou um só arquivo, a partir do backup.

As mudanças estruturais que você fizer no seu vault não mudam essa versão: vão para o `_HISTORICO.md` da área Segundo Cérebro (regra MUDANÇA-ESTRUTURAL). O prefixo `publicar:` em mensagens de commit é marcação usada pelo mantenedor do framework para separar o que vai para o público; no seu vault, ignore.

---

## ⚡ Skills

### Convenções

- Skill é **pasta** com `SKILL.md`: `.claude/skills/<nome>/SKILL.md`. O Claude Desktop as carrega sozinho.
- `name` (minúsculas, números e hífen, igual ao comando) e `description` com "USE WHEN" são obrigatórios; `version`, `created` e `updated` são a convenção do vault.
- Corpo do `SKILL.md` em até **300 linhas**. O excedente vai para auxiliares na mesma pasta (`reference.md`, `exemplos.md`), referenciados do `SKILL.md`.
- Toda modificação: incrementar `version`, atualizar `updated` e registrar no Changelog do arquivo.
- Skill nova ou modificada é mudança estrutural: atualizar este catálogo e o `_HISTORICO.md` na mesma operação.

### Catálogo

| Skill | O que faz | Invocação |
|---|---|---|
| `atualizar` | Leva o vault para a versão nova do framework a partir do zip da release, conferido pelos hashes: mostra as novidades, compara arquivo a arquivo, mescla com aprovação o que os dois lados mudaram, preserva os blocos `usuario:`, faz commit e backup antes e grava tudo de uma vez, com uma confirmação da Guarda. Estado em `_logs/atualizacao-v<versão>.md`, retomável; o modo desfazer volta a atualização inteira ou um arquivo. | `/atualizar` · `/atualizar desfazer` |
| `auditar-vault` | Varredura de inconsistências (pastas, frontmatter, tags, banners, wikilinks) por severidade. Nunca corrige sem aprovação; registra em `_logs/auditoria.md`. | `/auditar-vault` |
| `deliberar` | Parceiro de pensamento para uma decisão: lê `_CONTEXTO.md`, notas da Galáxia e `_DECISOES.md` do escopo, confere o pedido contra um briefing de seis itens e faz até três perguntas sobre o que faltar, analisa pelas cinco perspectivas do Template de Deliberação, com rótulos de evidência (inferência, suposição, desconhecido), argumenta contra a opção preferida (e, se as outras convergirem, a favor da melhor alternativa sem defensor) e recomenda. A síntese abre pelo que ficou em aberto e traz critérios de abandono, previsão e data de revisão. Grava `Deliberação - AAAA-MM-DD - <Título>.md` em `Deliberações/` do escopo só com aprovação. Termina com tarefas sugeridas e candidatos à Galáxia (os oferecidos entram em `05 - GALÁXIA/_CANDIDATOS.md`). | `/deliberar <decisão em uma frase>` |
| `instalar` | Primeira configuração do vault, pelo chat e sem terminal para a pessoa: instala os seis plugins do núcleo pelo `plugins.ps1` (baixa só dos repositórios oficiais no GitHub e grava em `.obsidian/plugins/` só com o Obsidian fechado e o comando aprovado, sem sobrescrever `data.json` existente), entrevista, grava o bloco do usuário no `CLAUDE.md`, cria áreas e projetos, importa projetos de outras IAs (Projects do Claude, Projetos e GPTs do ChatGPT, Gems do Gemini: instruções e arquivos, sem conversas), guia, se a pessoa quiser, conectores do claude.ai (grava a linha Zero Trust aprovada) e plugins recomendados do Claude, explica os módulos, orienta o backup, grava `.segundo-cerebro-version` e fecha com três gestos para o primeiro dia (capturar, ver tarefas, levar uma ideia para a Galáxia). Tudo com aprovação; estado em `_logs/instalacao.md`, retomável. Num vault instalado, oferece revisão do bloco, área nova, projeto novo de outra IA, backup, reinstalar os plugins ou ligar uma ferramenta do Claude. | `/instalar` |
| `processar-conteudo` | Conteúdo externo (texto, arquivo, URL, transcrição) → Nota de Literatura + Notas da Galáxia, com plano e aprovação antes de gravar. | `/processar-conteudo [conteúdo]` |
| `processar-inbox` | Lê `00 - INBOX/`, propõe destino para cada captura, grava o aprovado e arquiva o original em `04 - ARQUIVO/INBOX/AAAA-MM/`. Governança, destino ambíguo ou área sensível viram plano em `_logs/inbox-planos/`; registra em `_logs/inbox-AAAA-MM.md`. Termina listando candidatos à Galáxia (os oferecidos entram em `05 - GALÁXIA/_CANDIDATOS.md`). | `/processar-inbox` |
| `processar-reuniao` | Transcrição colada ou arquivo no INBOX → nota de reunião estruturada e tarefas do usuário, gravadas depois de uma aprovação. Termina listando candidatos à Galáxia (os oferecidos entram em `05 - GALÁXIA/_CANDIDATOS.md`). | `/processar-reuniao` |
| `revisar-memoria` | Proposta mensal de revisão da memória (subir n, esfriar, arquivar, rolar sessões), mostrada na sessão e salva em `_logs/revisao-memoria/AAAA-MM.md`; a memória só muda com ok. Termina com a síntese do mês: candidatos à Galáxia, e os candidatos aguardando em `05 - GALÁXIA/_CANDIDATOS.md`. | `/revisar-memoria` |

## 🧩 Módulos

Módulos são extensões do Claude Code que vivem em `.claude/skills/<nome>/` e carregam sozinhas quando o vault é aberto como pasta de trabalho. Os dois que vêm no framework só agem se a pasta aberta tiver `segundo-cerebro.manifest.json`; fora disso avisam uma vez e ficam inertes. Quem abre a sessão numa subpasta aponta a raiz no campo opcional `vault` da configuração do módulo.

| Módulo | O que faz | Comando |
|---|---|---|
| `guarda-constituicao` | Olha cada chamada de ferramenta antes de rodar. Pede confirmação em escrita de governança (`CLAUDE.md`, `VERSION`, `.segundo-cerebro-version`, `_docs/`, `_templates/`, `.claude/`, `02 - ÁREAS/Segundo Cérebro/`), em sobrescrita de nota, em comando destrutivo e em escrita em conector. Recusa CPF em nota, tarefa aberta sem `due`, telefone em arquivo lido em toda sessão, `.env` e credenciais, push forçado e reescrita de histórico. Sem pessoa para responder (`claude -p`), toda confirmação vira recusa. Ao responder, confira o caminho do arquivo e o resumo da mudança; aceite se baterem com o que você aprovou, recuse se não (detalhe em `/guarda`). | `/guarda` |
| `painel-tarefas` | Painel ao lado do chat com as notas de `06 - TAREFAS/Tarefas/`: blocos por projeto, filtros, resumo do dia, concluir, adiar, aguardar, prioridade, "+ Nova" e abrir a nota no Obsidian (`explorer.exe`, só no Windows). Grava só `status`, `due`, `scheduled`, `priority`, `projects`, `completedDate`, `dateModified`, `complete_instances` e `skipped_instances` (e apaga `prazo_padrao` ao mudar o `due`); cria nota nova sem sobrescrever. Lê o `sensivel` dos `_CONTEXTO.md` apontados por `projects`, sem nunca gravar neles, e oculta por padrão as áreas sensíveis. Tarefa recorrente: marca visual, "Concluir esta", "Pular esta" e "Encerrar rotina", com uma linha de histórico no fim do corpo; o cartão esconde adiar e reagendar ("Pular esta" faz esse papel), e "▶ Fazer agora" pede ao Code que não mexa em status nem datas, deixando o clique em "Concluir esta" para você; o campo Repete do "+ Nova" cria a tarefa com a regra. Regra fora das três do [[Template de Tarefa]] fica para o Obsidian. | `/tarefas` |

### `/guarda`

- `/guarda` mostra as regras e o que foi interceptado na sessão.
- `/guarda liberar` suspende as confirmações por 1 hora. As recusas continuam valendo. Só vale digitado pela pessoa; o Code não deve nem sugerir que o faça sozinho.
- `/guarda travar` encerra a liberação antes da hora.

Quando a Guarda perguntar, confira o caminho do arquivo (é o que você aprovou no chat?) e o resumo da mudança (bate com o que foi mostrado?). Se as duas baterem, aceite; recuse se o arquivo for outro, se a mudança não foi mostrada ou se estiver fora do que a etapa disse. Recusar não quebra nada: o Code para e explica.

### Só a Guarda, em outro vault

A Guarda pode ser instalada sozinha num vault sem o framework: no terminal do Claude Code, `/plugin marketplace add filipefiorini/segundo-cerebro` e `/plugin install guarda-constituicao@segundo-cerebro`; no Claude Desktop, Configurações › Plugins › Adicionar, com `filipefiorini/segundo-cerebro`. Ela só age com a opção "Pasta do vault" preenchida e na sessão aberta nessa pasta ou dentro dela; fora disso fica inerte. No terminal, a opção se preenche em `/plugin`; o Desktop não tem campo para ela, e o caminho é o PowerShell (ou pedir ao Claude, numa sessão, que rode o comando): `'{"vault": "C:\\caminho\\do\\vault"}' | claude plugin configure guarda-constituicao@segundo-cerebro --values-stdin`, com as barras invertidas dobradas, e depois uma sessão nova. `/guarda` confere ("Modo: avulso…"). As opções "Arquivos de governança", "Arquivos lidos em toda sessão" e "Pasta de tarefas" dizem o que proteger (padrões: `CLAUDE.md; AGENTS.md; .claude/`, `CLAUDE.md` e nenhuma). Valem as recusas (CPF, credencial, telefone, push forçado, reescrita de histórico) e as confirmações de comando destrutivo, sobrescrita, conector e governança listada; não valem a atualização do framework nem `.segundo-cerebro/`, e tarefa sem `due` só com a pasta de tarefas preenchida. Um vault por instalação. Quem usa o vault completo não instala o plugin por cima: o instalado pelo marketplace desliga o da pasta. Detalhe no README do módulo.

### Desligar um módulo

Duas formas: `"defaultEnabled": false` no `.claude-plugin/plugin.json` do módulo, ou apagar a pasta dele em `.claude/skills/`. Mexer em `.claude/` é escrita em governança: a Guarda pede confirmação, e o `CLAUDE.md` (tabela "Zero Trust dos módulos") deve acompanhar a mudança.

---

## 🧠 Política de Seleção de Modelo

**Opus — julgamento estratégico.** Raciocínio multi-etapa com consequência difícil de reverter.
- Exemplos: planejar uma skill nova, definir estrutura do vault, comparar abordagens com trade-offs, plano de ação a partir de vários documentos.
- Regra prática: *"Se errar, custa mais de 30 min para corrigir."*

**Sonnet — leitura, interpretação e síntese.** Bom padrão para o dia a dia.
- Exemplos: `processar-conteudo`, `processar-reuniao`, diagnóstico do vault, resposta sobre o conteúdo registrado, relatório com narrativa.
- Regra prática: *"Preciso que o modelo entenda o que os números significam, não só o que eles são."*

**Haiku — operações mecânicas e determinísticas.**
- Exemplos: renomear em lote, frontmatter repetitivo, busca de texto, append simples, formatar dados.
- Regra prática: *"Se desse para resolver com fórmula de planilha ou script, é Haiku."*

Linha divisória: dados brutos → Haiku / padrão nos dados → Sonnet / decisão sobre os dados → Opus.

---

## 🌐 Pesquisa Web

- Página que não é artigo ou busca rápida: `WebFetch` e `WebSearch` nativos do Claude Code.
- Artigo para virar Nota de Literatura: passar a URL para `processar-conteudo`.
- Antes de declarar que não encontrou informação, tentar `WebSearch` e `WebFetch`.

---

## 🌌 Galáxia

Base de conhecimento permanente, em pasta única (`05 - GALÁXIA/`); a camada é a propriedade `camada` e as vistas ficam em `Galáxia.base`. Só síntese própria, no template da Galáxia. Fontes (Notas de Literatura) ficam em `03 - RECURSOS/Fontes/`.

| Camada | Pergunta |
|---|---|
| Filosofias | No que eu acredito? |
| Conceitos | Que nome dou a isto? |
| Frameworks | Quais são as partes e como se ligam? |
| Metodologias | Em que ordem eu faço? |
| Táticas | O que faço nesta situação? |

Critério completo, desempate e exemplos: Manual › A Galáxia.

**Regras:** um conceito por nota, escrito por você · trecho copiado fica na Nota de Literatura · ligações por `[[wikilinks]]` · template [[Template de Nota da Galáxia]] · transcrições brutas nunca entram em Fontes. Filtro de graduação e evolução de conteúdo: ver [[_docs/Manual do Segundo Cérebro|Manual]].

---

## 📋 _templates/ — Catálogo

Ao criar nota nova, aplicar o template mais adequado via Templater.

| Template | Quando usar | Banner |
|---|---|---|
| **Template de Nota da Galáxia** | Qualquer nota permanente na Galáxia | `banner-galaxia.png` |
| **Template de Nota de Literatura - Livro** | Livro → `03 - RECURSOS/Fontes/Livros/`. Seções: tese em uma frase, ideias com o capítulo, discordâncias, efeito prático, trechos | `banner-literatura-livro.png` |
| **Template de Nota de Literatura - Artigo** | Artigo, post, conteúdo web → `03 - RECURSOS/Fontes/Artigos/`. Mesmas seções, com a seção do texto como referência | `banner-literatura-artigo.png` |
| **Template de Nota de Literatura - Vídeo** | Vídeo → `03 - RECURSOS/Fontes/Vídeos/`. Mesmas seções, com o minuto como referência | `banner-literatura-video.png` |
| **Template de Nota de Literatura - Podcast** | Podcast → `03 - RECURSOS/Fontes/Podcasts/`. Mesmas seções, com o minuto do episódio como referência | `banner-literatura-podcast.png` |
| **Template de Nota de Literatura - Curso** | Curso estruturado → `03 - RECURSOS/Fontes/Cursos/`. Mesmas seções, com módulo e aula como referência | `banner-literatura-curso.png` |
| **Template de Livro** | Ficha de livro; `isbn` evita duplicata | `banner-literatura-livro.png` |
| **Template de Pessoa** | Banco de Pessoas → `02 - ÁREAS/Pessoas/` | `banner-pessoas.png` |
| **Template de Reunião** | Reunião, call ou conversa relevante | `banner-reuniao.png` |
| **Template de Deliberação** | Deliberação de projeto ou área (pasta `Deliberações/` do escopo); traz também Em aberto, Critérios de abandono, Previsão e Revisão (Resultado preenchido só na revisão), Tarefas sugeridas e Candidatos à Galáxia, preenchidos pela `/deliberar` | — |
| **Template de Tarefa** | Uma tarefa → `06 - TAREFAS/Tarefas/`; nasce com `due` no dia útil seguinte e `prazo_padrao: true`. O comentário do template traz as três regras de tarefa recorrente | — |
| **Template de Tarefas** | `_TAREFAS.md` de projeto ou área (vista) | — |
| **Template de Projeto (_CONTEXTO)** | Novo projeto em `01 - PROJETOS/` | `banner-projeto.png` |
| **Template de Área (_CONTEXTO)** | Nova área em `02 - ÁREAS/` | `banner-area.png` |
| **Template de Dashboard de Métricas** | Dashboard com Obsidian Charts, com números fictícios para trocar | `banner-dashboard-metricas.png` |

Todos os banners ficam em `_assets/`; a lista completa está no `_assets/LEIA-ME.md`, inclusive os que ficaram sem template e estão livres para uso próprio.

---

## 🤝 Reuniões

- Template: [[Template de Reunião]]. Skill: `processar-reuniao`, a partir de transcrição colada ou arquivo no INBOX.
- Nome: `Reunião - AAAA-MM-DD - [Assunto].md`, na pasta `Reuniões/` da área ou do projeto.
- Tag base `meeting`; `tipo: reuniao`; `fonte_tipo: Reunião`.
- O usuário é sempre o primeiro participante, salvo instrução contrária.
- Ações combinadas são sugeridas; viram nota em `06 - TAREFAS/Tarefas/` quando o usuário decide.

---

## 🎨 Padrão Visual das Notas

### Frontmatter mínimo
```yaml
---
tags: [tag1, tag2]
tipo: nota-permanente | literatura | contexto | recurso | documentacao | ...
criado: AAAA-MM-DD
status: draft | active | in-progress | complete | archived | waiting | cancelled
---
```
- Tags sempre inline `[tag1, tag2]`, nunca lista `- item`. Valores válidos na [[_docs/Taxonomia de Tags|Taxonomia]].
- Imagens e anexos locais em `_assets/`, referenciados como `![[_assets/nome-do-arquivo.png]]`.

### Banner

- Embed no corpo, logo após o frontmatter e antes do título `#`: `![[_assets/banner-nome-da-nota.png]]`.
- **Proibido** `banner:` e `banner_y:` no frontmatter: o plugin Banners sobrepõe a imagem ao painel de propriedades.
- Dimensão 1500×500px (3:1). Prefixo `banner-` em `_assets/`. Qualquer gerador de imagem ou editor serve.

| Localização | Banner |
|---|---|
| Notas ativas (Galáxia, Fontes, Reuniões, Pessoas, Projetos, Áreas, Recursos) | Sim |
| `_docs/` | Sim — `banner-segundo-cerebro.png` |
| `BEM-VINDO.md` e índices de pastas ativas | Sim |
| `04 - ARQUIVO/`, `.claude/skills/`, `_templates/`, `_logs/`, `_assets/` | Não |
| Documentos de trabalho (Deliberações, Avaliações) | Não |

Sugestão de cor por categoria: Galáxia/Conhecimento → roxo · Projetos → azul profundo · Áreas → verde profundo · Conteúdo → âmbar · Documentação → cinza-azulado.

**Lembrete ao criar pasta nova:** banner em `_assets/banner-[nome].png` embutido logo após o frontmatter das notas dela. Nota nova feita por template já traz o banner do template. Ícone de pasta no Iconize é opcional e manual (botão direito → Add icon).

### Formatação

- Callouts: `[!tip]` dica · `[!warning]` risco · `[!info]` contexto · `[!success]` resultado · `[!question]` pergunta aberta · `[!quote]` citação.
- Checklists `- [ ]` / `- [x]`; tabelas para dados estruturados; blocos de código com linguagem; `---` entre seções; ícones nos títulos de seção.

---

## 🔤 Padrão de Nomes de Arquivos e Pastas

A caixa e o prefixo do nome dizem o que o item é antes de abri-lo.

| Regra | O que | Forma | Exemplos |
|---|---|---|---|
| N1 | Pastas IPARAG da raiz | `NN - CAIXA ALTA` | `00 - INBOX`, `05 - GALÁXIA` |
| N2 | Pastas de apoio, na raiz ou dentro de um escopo | `_minúscula`, kebab-case se composto | `_assets`, `_logs`, `_anexos`, `_specs`, `_pdfs` |
| N3 | Arquivos de sistema de um escopo | `_CAIXA-ALTA.md`, nome fixo, sem acento | `_CONTEXTO`, `_TAREFAS`, `_DECISOES`, `_HISTORICO`, `_INDICE`, `_DASHBOARD` |
| N4 | Governança na raiz | `CAIXA-ALTA` | `CLAUDE.md`, `BEM-VINDO.md` |
| N5 | Documentação em `_docs/` | Title Case | `Manual do Segundo Cérebro.md`, `Ferramentas.md` |
| N6 | Pastas e notas de conteúdo | Title Case, palavras separadas por espaço, não por hífen | `Em Andamento`, `Prompts de IA`, `Plano de Estudos 2027` |
| N7 | O que a máquina lê | kebab-case ou snake_case minúsculo | skills, scripts, tags, anexos em `_assets/`, logs |
| N8 | Capturas do INBOX e seu arquivo | `AAAA-MM-DD - Tipo - Título` | `2026-11-03 - Reunião - Planejamento do trimestre` |

Wikilink para arquivo de sistema que se repete em vários escopos (N3) leva o caminho e um alias: `[[05 - GALÁXIA/_INDICE|Índice da Galáxia]]`.

**Exceções aceitas** (nome imposto de fora ou lido por máquina): `memory/` e `memory.md` (Claude Code); `Homepage.md` (plugin Homepage); o `README.md` dos módulos, `SKILL.md` e `LEIA-ME.md` (convenção de repositório); `_docs/CHANGELOG.md` (convenção de repositório, lido pelo `/atualizar`); os `.base` em minúsculas de `06 - TAREFAS/Views/` (gerados pelo TaskNotes); nome próprio mantém a grafia oficial (`n8n`, `claude-mem`, `iPhone`).

Renomear segue a regra DESTRUTIVO: confirmação, referências corrigidas na mesma operação e `auditar-vault` antes e depois.

---

## 📎 Relacionado

- [[CLAUDE.md]] — Constituição: regras e comportamento
- [[_docs/Manual do Segundo Cérebro]] — estrutura, roteamento e como registrar
- [[_docs/Taxonomia de Tags]] — tags e vocabulário do frontmatter
- `02 - ÁREAS/Segundo Cérebro/_DECISOES.md` — decisões sobre funcionalidades
