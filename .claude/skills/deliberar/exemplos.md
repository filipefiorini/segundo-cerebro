# deliberar — exemplos de execução

> Carregado sob demanda pelo [SKILL.md](SKILL.md). Pessoa e situação fictícias.

## Exemplo 1 — Deliberação completa

Ana estuda inglês num curso em grupo e quer trocar por aulas particulares. Escreve: `/deliberar trocar o curso de inglês por aulas particulares. Prefiro as particulares.`

**Leitura.** O Code identifica a área Estudos, lê o `_CONTEXTO.md` dela (meta: conversar com clientes estrangeiros até junho; orçamento mensal de estudos) e uma nota da Galáxia, "Prática deliberada". Não há `_DECISOES.md` na área. Diz: "Li o contexto da área Estudos e a nota Prática deliberada. A área não tem `_DECISOES.md`."

**Briefing.** O pedido trouxe a decisão, as duas opções e a inclinação, sem o porquê. O contexto da área deu o sucesso e o prazo (junho) e o limite de orçamento. Faltam os números da troca e o que ela não aceita perder: viram as perguntas.

**Perguntas, uma por vez.**

> **Code:** Quanto custa a hora particular, comparada à mensalidade do curso?
> **Ana:** R$ 90 a hora, duas vezes por semana. O curso é R$ 380 por mês.
>
> **Code:** O que você não aceita perder na troca?
> **Ana:** O ritmo. No curso eu não falto porque pago adiantado e tem turma.

**Perspectivas (mostradas na conversa antes da síntese, o Crítico por inteiro).**

- **Estrategista:** aulas sob medida aceleram a meta de conversar com clientes *(inferência)*; o conteúdo pode ser o vocabulário do trabalho dela.
- **Crítico (contra a opção preferida):** o custo vai de R$ 380 para cerca de R$ 720 por mês, quase o dobro, e fura o orçamento de estudos. Sem turma, some o compromisso social que hoje a faz ir. Aula particular rende mais por hora, mas só se ela chegar preparada *(suposição)*; sem isso paga para ouvir a correção de erros que treinaria sozinha. E "sob medida" depende de achar um bom professor, o que ela ainda não fez; se existe um bom na faixa de R$ 90 é *(desconhecido)*.
- **Pragmático:** dá para testar com uma aula por semana (cerca de R$ 360 por mês) sem sair do curso até o fim do semestre.
- **Integrador:** a Galáxia dela defende prática com correção imediata, o que favorece a particular, mas a regra de orçamento da área limita o gasto.
- **Temporal:** o semestre do curso acaba em dezembro; trocar agora perde a matrícula já paga. Em janeiro a troca é limpa.

**Síntese.**

- **Em aberto:** se ela vai se preparar sem a pressão da turma *(suposição)* e se há bom professor na faixa de preço *(desconhecido)*. As duas aulas de teste respondem às duas.
- **Recomendação:** `FAZER DEPOIS`. A particular provavelmente serve melhor à meta, mas o custo e a perda do compromisso são reais. Gatilho para revisitar: janeiro, depois de duas aulas de teste e de ela definir a rotina de preparo.
- **Critérios de abandono:** faltar a duas aulas particulares seguidas, ou não achar professor que caiba no orçamento.
- **Previsão e revisão:** com a troca em janeiro, ela sustenta uma conversa de 15 minutos com um cliente até junho. Mudaria a recomendação chegar sem preparo às aulas de teste. Revisar em 2026-12-15.

**Tarefas sugeridas** (não gravadas):

- Agendar duas aulas de teste com professores diferentes. Prazo: 2026-11-20.
- Decidir a troca com base nas duas aulas. Prazo: 2026-12-15.

**Candidatos à Galáxia.**

```markdown
- **Teste barato antes de trocar o que funciona** — camada: Táticas — por quê: vale para qualquer troca de serviço e responde a "o que faço nesta situação?". Origem: [[Deliberação - 2026-11-08 - Curso de inglês]].
```

> **Code:** Gravo a Deliberação em `02 - ÁREAS/Estudos/Deliberações/`?
> **Ana:** Grava.

O Code cria `Deliberações/` se faltar, grava `Deliberação - 2026-11-08 - Curso de inglês.md`, relê o arquivo e confirma o caminho. Oferece criar a tarefa de revisão (prazo 2026-12-15, com link para a nota), as duas tarefas sugeridas e levar o candidato pelo `/processar-conteudo`, sem executar nenhuma delas.

## Exemplo 2 — Sem `_CONTEXTO.md`

Bruno escreve: `/deliberar devo abrir uma segunda frente de renda com fotografia?`

O Code procura a área em `02 - ÁREAS/`. Há uma pasta `Renda Extra/` sem `_CONTEXTO.md`, e a Galáxia não tem nota sobre o assunto.

> **Code:** Sigo só com o que você me contou. A área Renda Extra ainda não tem contexto e a Galáxia não tem nota sobre isso, então a análise vai ser mais genérica do que poderia. Antes de começar: quantas horas por semana você tem livres hoje?
> **Bruno:** Umas cinco.

O Code faz as cinco perspectivas com esse dado, rotula na nota o que é inferência, suposição ou desconhecido e, na síntese, abre o "Em aberto" com o que faltou: "Sem o contexto da área, não consegui conferir se isso compete com seus objetivos atuais. Vale registrar um `_CONTEXTO.md` para Renda Extra." Pergunta se grava a Deliberação, cria a pasta `Deliberações/` na área se faltar e não cria o `_CONTEXTO.md` por conta própria.

## Exemplo 3 — Decisão sobre o próprio vault

Carla escreve: `/deliberar passar a revisão semanal do INBOX para o domingo. Prefiro domingo.`

O escopo é o próprio Segundo Cérebro (`02 - ÁREAS/Segundo Cérebro/`). O Code lê o `_CONTEXTO.md` da área, o `_DECISOES.md` dela (porque a decisão é sobre o vault) e uma nota da Galáxia, "Capturar sem decidir". Diz: "Li o contexto do Segundo Cérebro, o `_DECISOES.md` e a nota Capturar sem decidir. O `_DECISOES.md` registra que a rotina do INBOX roda duas vezes por dia; a revisão semanal ainda não tem decisão."

O Crítico ataca o domingo: é o dia em que ela menos abre o vault, e uma revisão adiada acumula planos pendentes. A síntese sai `EXPLORAR MAIS`, com uma semana de teste. Na gravação, o Code oferece registrar a decisão no `_DECISOES.md`, sem fazê-lo: esse arquivo só muda a pedido dela.

## Exemplo 4 — Área sensível

Dani escreve: `/deliberar renegociar a parcela do financiamento. Prefiro renegociar.`

O escopo é uma área com `sensivel: true` no `_CONTEXTO.md`. O Code lê só o frontmatter e não abre o corpo do `_CONTEXTO.md`, o `_DECISOES.md` nem as notas da área:

> **Code:** Esta é uma área sensível, e eu só leio o que há nela se você pedir de forma explícita. Quer que eu leia o contexto e as decisões desta área para a deliberação, ou prefere me passar os números aqui na conversa?

Com o pedido explícito, lê e segue; sem ele, continua só com o que Dani contar. Na nota gravada, valores e dados de contrato entram só no que a decisão exige, e o candidato à Galáxia, se houver, sai em termos gerais, sem número nem contrato.

## Exemplo 5 — Unanimidade

Eduardo escreve: `/deliberar migrar as notas de estudo para uma pasta por curso. Prefiro migrar.`

Estrategista, Pragmático, Integrador e Temporal apontam para migrar. O Code trata isso como alerta. O Crítico ataca a migração e defende a alternativa sem defensor, "manter como está e criar só uma vista por curso": entrega a mesma navegação, não mexe em nenhum link e é reversível em um clique. Na síntese, o "Em aberto" diz que a alternativa ficou de pé, porque nenhuma perspectiva trouxe um fato que só a migração resolva. A recomendação vira `EXPLORAR MAIS`, com a vista por uma semana antes de mover qualquer arquivo.
