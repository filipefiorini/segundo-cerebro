# CLAUDE.md — Constituição do vault

> Vault sem `.segundo-cerebro-version` na raiz? Chame `/instalar`.

Comportamento do Claude Code dentro deste vault. Estado operacional vive em `memory/` (ver `memory.md`).

<!-- usuario:inicio -->
## Dono do vault

- Nome e tratamento: (preencher pelo /instalar)
- Onde vive: (preencher pelo /instalar)
- Ofício: (preencher pelo /instalar)
- Idioma: português brasileiro, sempre.
- Tom: (preencher pelo /instalar)
- Áreas de vida: uma linha por área, apontando para o `_CONTEXTO.md` dela em `02 - ÁREAS/`.

## Prioridades do momento

1. (preencher pelo /instalar)
2. (preencher pelo /instalar)
<!-- usuario:fim -->

## Estrutura do vault

| Pasta | Propósito |
|---|---|
| `00 - INBOX` | Entrada única. Nada fica aqui mais de uma semana. |
| `01 - PROJETOS` | Trabalho que termina: tem entrega e critério de pronto. `Em Andamento/`, `Em Espera/`. |
| `02 - ÁREAS` | O que você mantém sem prazo para acabar. |
| `03 - RECURSOS` | Material de consulta, usado em mais de um contexto: Fontes, Procedimentos. |
| `04 - ARQUIVO` | Saiu de uso, mas continua guardado. |
| `05 - GALÁXIA` | Síntese própria e duradoura, em cinco camadas. |
| `06 - TAREFAS` | Tarefas: uma nota por tarefa em `Tarefas/`, vistas em `Views/`. |
| `memory/` | Memória do Code: fatos, aprendizados, sessões. |
| `_assets/` | Imagens e anexos. |
| `_docs/` | Manual, Ferramentas, Taxonomia, O Método. |
| `_logs/` | Registros de execução e diagnósticos. |
| `_templates/` | Templates (Templater). |
| `.claude/skills/` | Skills e módulos (Guarda, Painel). |

<!-- usuario:inicio -->
## Projetos e áreas ativos

| Escopo | Tipo | Local |
|---|---|---|
| Segundo Cérebro | Área | `02 - ÁREAS/Segundo Cérebro/` |
| (preencher pelo /instalar) | | |
<!-- usuario:fim -->

## Regras

- **GRAVAÇÃO** — Antes de gravar, decidir o destino pelo Mapa de Responsabilidade em `_docs/Ferramentas.md`. Este arquivo só muda com aprovação explícita do usuário no chat. Em dúvida sobre destino ou área que o usuário ainda não aprovou: perguntar, nunca gravar.
- **CONFLITO** — Instrução nova que contraria regra deste arquivo ou padrão documentado: parar e perguntar antes de executar. Nunca resolver em silêncio, nem assumir erro de digitação.
- **PLANO** — Tarefa com múltiplos arquivos ou mudança estrutural: apresentar o plano e aguardar aprovação antes de agir. Tarefa pontual com escopo claro dispensa plano.
- **DESTRUTIVO** — Mover, arquivar, renomear, deletar ou enviar (e-mail, mensagem, convite) exige confirmação explícita, em qualquer pasta ou integração. Ao executar, localizar e corrigir as referências afetadas na mesma operação.
- **VERIFICAÇÃO** — Nunca declarar concluído sem ler o resultado: arquivo criado ou editado, conteúdo, wikilinks. "Parece certo" não é verificação.
- **FONTE-DE-TAREFAS** — Toda tarefa vive em `06 - TAREFAS/Tarefas/`, uma nota por tarefa, com `projects` (escopo), `executor` (`eu` | `code`) e `due`: nenhuma tarefa nasce sem prazo. Fonte sem prazo → `due` no dia útil seguinte à criação, com `prazo_padrao: true` para o usuário rever a data. Os `_TAREFAS.md` são vistas. `_CONTEXTO.md` é descritivo e não tem `- [ ]`. Dado pessoal nunca no título da tarefa.
- **PARCEIRO** — Pedido de análise ou decisão: o Code pergunta antes de responder, traz o que o vault já registra sobre o assunto e argumenta contra a opção preferida antes de concordar. `/deliberar` formaliza isso numa nota.
- **ZERO-TRUST** — Cada integração tem escopo declarado na tabela abaixo. Operação fora do escopo: confirmar antes.
- **SENSÍVEL** — Saúde, finanças pessoais, jurídico, família, credenciais, IDs de sistemas e telefones nunca entram em `CLAUDE.md`, `memory.md` ou qualquer arquivo lido em toda sessão. Vivem na nota canônica do escopo.
- **MUDANÇA-ESTRUTURAL** — Vale só para: nova skill, nova regra, mudança de pasta IPARAG ou de `_docs/`. Sequência: plano → execução → verificação dos arquivos afetados → registro no `_HISTORICO.md` da área Segundo Cérebro → confirmação ao usuário com a lista. A versão do framework é do mantenedor e não muda aqui. O que fica entre marcadores `usuario:` é da pessoa e não dispara esta regra. Não se aplica a sessões de conteúdo.
- **GRADUAÇÃO** — Ideia que passaria no filtro da Galáxia ("eu buscaria isto fora de qualquer projeto?") e surgiu numa sessão, reunião ou deliberação é oferecida ao usuário no fim da tarefa como candidata, com a camada sugerida. Nunca gravada sem aprovação. A candidata oferecida entra em `05 - GALÁXIA/_CANDIDATOS.md` na hora da oferta: aprovada, vira nota e sai da lista; negada de forma expressa, sai; sem manifestação, fica para a próxima `/revisar-memoria`. Só a negativa expressa descarta.

## Zero Trust dos módulos

| Integração | Pode | Não pode |
|---|---|---|
| Guarda da Constituição (módulo do Claude Code, `.claude/skills/guarda-constituicao/`) | Ver cada chamada de ferramenta na sessão; pedir confirmação em governança, sobrescrita, comando destrutivo e escrita em conector; recusar CPF em nota, tarefa aberta sem `due`, telefone em arquivo lido em toda sessão, `.env` e credencial, push forçado e reescrita de histórico | Ler conteúdo de arquivo (só confere se existe) ou gravar arquivo; rede; enviar mensagem; liberar o que recusa. A liberação das confirmações (`/guarda liberar`, 1 h) é só da pessoa |
| Painel de tarefas (módulo do Claude Code, `.claude/skills/painel-tarefas/`) | Ler as notas de `06 - TAREFAS/Tarefas/` e o frontmatter (`sensivel`) dos `_CONTEXTO.md` apontados por `projects`; por clique da pessoa, alterar `status`, `due`, `scheduled`, `priority`, `projects`, `completedDate`, `dateModified`, `complete_instances` e `skipped_instances` (ao mudar o `due`, apaga `prazo_padrao`) e criar nota de tarefa nova, sem sobrescrever; acrescentar ao fim do corpo de tarefa recorrente uma linha de histórico (data da ocorrência, concluída ou pulada, data do clique); preencher o campo do chat com o pedido de uma tarefa do Code, que a pessoa revisa e envia; abrir a nota no Obsidian | Gravar nos `_CONTEXTO.md`; ler ou gravar fora de `06 - TAREFAS/Tarefas/` e dos `_CONTEXTO.md`; alterar outro campo; alterar o corpo da nota fora dessa linha; apagar; rede; enviar mensagem |

Os dois ficam inertes quando a pasta aberta não tem `segundo-cerebro.manifest.json`; a Guarda também vale quando a "Pasta do vault" do plugin aponta para o vault e a sessão está nele ou numa subpasta.

<!-- usuario:inicio -->
## Zero Trust

| Integração | Pode | Não pode |
|---|---|---|
| Context7 | Buscar documentação de libs | — |

<!-- Exemplo de conector: | Google Calendar (claude.ai) | Listar e ler eventos | Criar, alterar ou apagar evento sem confirmação | -->
<!-- usuario:fim -->

## Onde está o resto

- `_docs/Manual do Segundo Cérebro.md` — estrutura, roteamento, como registrar cada tipo de nota.
- `_docs/Ferramentas.md` — Mapa de Responsabilidade, skills, templates, padrão visual.
- `_docs/Taxonomia de Tags.md` — tags e vocabulário do frontmatter.
- `02 - ÁREAS/Segundo Cérebro/_DECISOES.md` — decisões sobre funcionalidades.

*Versão do framework instalada: `.segundo-cerebro-version` na raiz.*
