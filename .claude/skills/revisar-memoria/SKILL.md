---
name: revisar-memoria
description: |
  Propõe a revisão mensal da memória do Code: aprendizados a subir de n, a esfriar e a
  arquivar, fatos a revisar e sessões a rolar. Lê `memory/fatos.md`,
  `memory/aprendizados.md`, `memory/sessoes.md`, o log do INBOX do mês, as Deliberações
  do mês citadas, a seção "Evolução Estrutural" do `_HISTORICO.md` da área Segundo Cérebro
  e a proposta anterior em `_logs/revisao-memoria/`, se houver. Mostra a proposta na
  sessão e a salva em `_logs/revisao-memoria/AAAA-MM.md`; termina com a síntese do mês:
  candidatos à Galáxia. A memória só muda com o ok do usuário.
  USE WHEN o usuário digitar "/revisar-memoria", pedir "revisão da memória",
  "revisar a memória" ou "o que rolar na memória", ou no início de cada mês.
version: 1.3.0
created: 2026-11-07
updated: 2026-11-19
tags: [skill]
---

# Skill: revisar-memoria

Só propõe. Regras da memória no Manual do Segundo Cérebro › Memória.

## Passo 1 — Ler

Ler `memory/fatos.md`, `memory/aprendizados.md`, `memory/sessoes.md`, `_logs/inbox-AAAA-MM.md` do mês (se houver) e a seção "Evolução Estrutural" de `02 - ÁREAS/Segundo Cérebro/_HISTORICO.md`, e a proposta anterior em `_logs/revisao-memoria/`, se houver, para saber a data da última revisão. Para a síntese do mês, ler também as Deliberações de `02 - ÁREAS/Segundo Cérebro/Deliberações/` citadas por nome em `sessoes.md`, no log do INBOX ou no `_HISTORICO.md` naquele mês (abrir pelo caminho completo, sem listar a pasta), e `05 - GALÁXIA/_CANDIDATOS.md`, para a seção Candidatos aguardando. Nada além desses. Arquivo ou seção ausente: seguir com o que existe e dizer o que faltou.

## Passo 2 — Montar a proposta

Em PT-BR, no máximo 15 linhas, omitindo seção vazia:

**Subir n** — aprendizados com nova ocorrência visível no `_HISTORICO` ou em `sessoes.md` desde a última revisão. Uma linha cada: nome + evidência.
**Esfriar** — aprendizados com n=1 há mais de 90 dias sem reincidência e ainda sem `· fria`. Uma linha só, com nomes e idade.
**Arquivar** — aprendizados marcados `· fria` há mais de 90 dias. Uma linha só, com nomes e idade.
**Fatos a revisar** — linhas de `fatos.md` que contradizem o estado atual ou descrevem algo provisório cujo prazo passou. Uma linha cada, com o motivo.
**Rolar sessões** — entradas de `sessoes.md` com mais de 30 dias (viram uma linha por semana) e com mais de 90 (apagar). Só a data e a idade.

**Síntese do mês** — ler `memory/sessoes.md`, a seção "Evolução Estrutural" do `_HISTORICO.md`, `_logs/inbox-AAAA-MM.md` do mês e as Deliberações do mês lidas no Passo 1, e listar candidatos à Galáxia pelo bloco padrão abaixo. A `Origem` aponta para a nota de onde a ideia saiu (a Deliberação, quando for dela); ideia só de `sessoes.md` ou do `_HISTORICO.md`, sem nota, cita a data da sessão ou a entrada. Ideia de área com `sensivel: true` não entra. Esta seção fica fora do limite de 15 linhas.

```markdown
### Candidatos à Galáxia
Para cada ideia que passar no filtro ("eu buscaria isto fora de qualquer projeto?"), no máximo três:
- **<título proposto>** — camada: <Filosofias | Conceitos | Frameworks | Metodologias | Táticas> — por quê: <uma frase>. Origem: [[<nota processada>]].
Se nenhuma passar: "Nenhum candidato à Galáxia nesta rodada."
Nada é gravado aqui; o usuário escolhe e a nota é criada pelo /processar-conteudo com a fonte apontando para a origem.
```

Exemplo, nenhuma ideia passa:

```markdown
Nenhum candidato à Galáxia nesta rodada.
```

Exemplo, uma ideia passa (vinda de `sessoes.md`, sem nota):

```markdown
- **Decidir por escrito antes de executar** — camada: Táticas — por quê: apareceu em três sessões do mês e responde a "o que faço nesta situação?". Origem: sessão de 2026-03-12.
```

**Candidatos aguardando** — as linhas da tabela "Pendentes" de `05 - GALÁXIA/_CANDIDATOS.md`: título e idade em dias, uma linha cada; os com mais de 60 dias levam "(vencido)". Fecha com: `Para decidir: diga "revisar candidatos".` Sem linha na tabela, a seção não aparece. Fica fora do limite de 15 linhas. Esta skill não grava na lista: os candidatos da Síntese do mês ficam só na proposta, e os vencidos saem quando a pessoa revisa ou o Claude abre o arquivo noutra tarefa.

O log do INBOX traz só nomes e destinos, não o conteúdo das notas: a síntese sai sobretudo de `sessoes.md` e das Deliberações, e "Nenhum candidato à Galáxia nesta rodada." é um resultado comum e correto.

- Primeira linha: `🧠 Revisão mensal da memória — AAAA-MM`.
- Sem saudação, sem narrativa, sem conclusão.
- Nunca reproduzir dado pessoal ou sensível de terceiros nem ID de sistema.
- Nada nas cinco seções de memória, nenhum candidato à Galáxia e nenhum candidato aguardando: a proposta é só a linha `Memória em dia; nada a revisar.` Com ao menos um candidato, a proposta leva a seção de candidatos, mesmo sem outra seção.
- Última linha, quando houver conteúdo: `Proposta. A memória só muda com o seu ok.`

## Passo 3 — Mostrar e salvar

1. Mostrar a proposta na sessão.
2. Salvar em `_logs/revisao-memoria/AAAA-MM.md` (criar a pasta no primeiro uso). Já existe o arquivo do mês: acrescentar a nova proposta ao fim, com a data, sem apagar a anterior. Frontmatter do arquivo novo:
   ```yaml
   ---
   tags: [log]
   tipo: log
   criado: AAAA-MM-DD
   status: active
   ---
   ```
3. Reler o arquivo salvo.

## Passo 4 — Aplicar (só com ok)

Perguntar o que aplicar. Com o ok do usuário, item a item ou em bloco:

- **Subir n** e **Esfriar** — editar a linha do aprendizado em `memory/aprendizados.md`.
- **Arquivar** — mover a entrada para `_logs/memory-arquivo-AAAA-MM-DD.md` (criado no primeiro uso, só consulta) e tirá-la de `aprendizados.md`.
- **Fatos a revisar** — `memory/fatos.md` só muda com confirmação explícita, fato a fato.
- **Rolar sessões** — reescrever as entradas antigas em uma linha por semana; apagar as com mais de 90 dias.

Remover ou reescrever entrada é DESTRUTIVO: a confirmação é o ok deste passo, item a item ou em bloco. Depois, reler cada arquivo alterado e anotar no fim da proposta salva o que foi aplicado e o que ficou.

## Changelog

- 1.3.0 (2026-11-19) — seção Candidatos aguardando: lê `05 - GALÁXIA/_CANDIDATOS.md` e lista título e idade de cada pendente, marcando os vencidos (mais de 60 dias); sem linha, a seção some. A skill continua sem gravar.
- 1.2.1 (2026-11-11) — a descrição do frontmatter passa a quebrar as linhas em até 100 caracteres.
- 1.2.0 (2026-11-10) — a síntese do mês passa a ler também as Deliberações do mês citadas por nome em `sessoes.md`, no log do INBOX ou no `_HISTORICO.md` (abertas pelo caminho completo, sem listar a pasta) e a seção "Evolução Estrutural" do `_HISTORICO.md`, porque a deliberação é a fonte mais provável de candidato à Galáxia. Ideia de área sensível fica de fora.
- 1.1.0 (2026-11-08) — Passo 2 ganha a síntese do mês: lê `sessoes.md` e o log do INBOX do mês e lista candidatos à Galáxia pelo bloco padrão; a proposta salva leva a seção. Exemplo com candidato incluído, e a regra de "Memória em dia": a linha só vale sem nenhuma seção de memória e sem candidato.
- 1.0.0 (2026-11-07) — derivada da skill privada v1.0.0, neutralizada para o framework público: roda na sessão, mostra a proposta e a salva em `_logs/revisao-memoria/`; aplicação só com o ok do usuário.
