import { expect, test } from 'claude-code/testing'

import { avancar, concluirOcorrencia, lerRegra, primeiraOcorrencia, proxima, pularOcorrencia, regraParaTexto } from '../hooks/recorrencia'
import type { Regra } from '../hooks/recorrencia'
import { lerCampos, lerTarefa, novaNota } from '../hooks/tarefas'
import { REGRAVADA } from './fixtures'

const UTIL = 'FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=1'

test('lerRegra aceita as três regras, com DTSTART e aspas', () => {
  expect(lerRegra(UTIL)).toEqual({ tipo: 'mensal-util' })
  expect(lerRegra(`DTSTART:20261102;${UTIL}`)).toEqual({ tipo: 'mensal-util' })
  expect(lerRegra(`"DTSTART:20261102;${UTIL}"`, 'scheduled')).toEqual({ tipo: 'mensal-util' })
  expect(lerRegra('FREQ=WEEKLY;BYDAY=MO')).toEqual({ tipo: 'semanal', dia: 1 })
  expect(lerRegra('DTSTART:20261102;FREQ=WEEKLY;BYDAY=SU')).toEqual({ tipo: 'semanal', dia: 0 })
  expect(lerRegra('FREQ=MONTHLY;BYMONTHDAY=10')).toEqual({ tipo: 'mensal-dia', dia: 10 })
  expect(lerRegra("'FREQ=MONTHLY;BYMONTHDAY=28'")).toEqual({ tipo: 'mensal-dia', dia: 28 })
})

test('lerRegra recusa regra fora da lista e âncora completion', () => {
  expect(lerRegra('FREQ=MONTHLY;BYSETPOS=-1;BYDAY=MO,TU,WE,TH,FR')).toBe(null)
  expect(lerRegra('FREQ=MONTHLY;BYMONTHDAY=31')).toBe(null)
  expect(lerRegra('FREQ=MONTHLY;BYMONTHDAY=0')).toBe(null)
  expect(lerRegra('FREQ=DAILY')).toBe(null)
  expect(lerRegra('FREQ=WEEKLY;BYDAY=MO,TU')).toBe(null)
  expect(lerRegra('')).toBe(null)
  expect(lerRegra(UTIL, 'completion')).toBe(null)
  expect(lerRegra('FREQ=WEEKLY;BYDAY=MO', 'completion')).toBe(null)
})

test('proxima: primeiro dia útil do mês', () => {
  const r = { tipo: 'mensal-util' } as const
  expect(proxima(r, '2026-11-02')).toBe('2026-12-01')
  expect(proxima(r, '2026-12-01')).toBe('2027-01-01')
  expect(proxima(r, '2027-01-01')).toBe('2027-02-01')
  // 1º de maio de 2027 é sábado
  expect(proxima(r, '2027-04-30')).toBe('2027-05-03')
  // antes do primeiro dia útil do mesmo mês
  expect(proxima(r, '2027-05-01')).toBe('2027-05-03')
})

test('proxima: semanal e mensal por dia', () => {
  expect(proxima({ tipo: 'semanal', dia: 1 }, '2026-11-23')).toBe('2026-11-30')
  expect(proxima({ tipo: 'semanal', dia: 1 }, '2026-11-24')).toBe('2026-11-30')
  expect(proxima({ tipo: 'mensal-dia', dia: 10 }, '2026-11-10')).toBe('2026-12-10')
  expect(proxima({ tipo: 'mensal-dia', dia: 10 }, '2026-11-09')).toBe('2026-11-10')
  expect(proxima({ tipo: 'mensal-dia', dia: 10 }, '2026-12-20')).toBe('2027-01-10')
})

test('avancar: ocorrência do dia, com a distância do prazo', () => {
  const r = { tipo: 'mensal-util' } as const
  expect(avancar(r, '2026-11-02', '2026-11-02', '2026-11-02')).toEqual({ agendada: '2026-12-01', prazo: '2026-12-01' })
  expect(avancar(r, '2026-12-01', '2026-12-04', '2026-12-01')).toEqual({ agendada: '2027-01-01', prazo: '2027-01-04' })
  expect(avancar(r, '2026-12-01', null, '2026-12-01')).toEqual({ agendada: '2027-01-01', prazo: null })
})

test('avancar: atrasada pula para depois de hoje; futura concluída antes anda uma só', () => {
  const r = { tipo: 'mensal-util' } as const
  expect(avancar(r, '2026-09-01', '2026-09-01', '2026-11-19')).toEqual({ agendada: '2026-12-01', prazo: '2026-12-01' })
  expect(avancar(r, '2026-12-01', '2026-12-01', '2026-11-19')).toEqual({ agendada: '2027-01-01', prazo: '2027-01-01' })
})

test('avancar: atrasada e hoje é dia de ocorrência: fica em hoje, como o TaskNotes', () => {
  const r = { tipo: 'mensal-util' } as const
  expect(avancar(r, '2026-11-02', '2026-11-02', '2026-12-01')).toEqual({ agendada: '2026-12-01', prazo: '2026-12-01' })
})

// --- concluir e pular uma ocorrência (nota inteira regravada) ---

const HOJE = '2026-12-05'
const NAO_SUPORTADA = 'regra de repetição não suportada: trate no Obsidian'

test('concluirOcorrencia: avança, registra a ocorrência e anota no corpo', () => {
  const r = concluirOcorrencia(REGRAVADA, HOJE)
  const c = lerCampos(r)
  expect(c.scheduled).toBe('2027-01-01')
  expect(c.due).toBe('2027-01-01')
  expect(c.complete_instances).toEqual(['2026-11-02', '2026-12-01'])
  expect(c.skipped_instances).toBe('[]')
  expect(c.status).toBe('open')
  expect(c.dateModified).toBe('2026-12-05')
  expect(r.endsWith('Corpo.\n- 01/12/2026 — concluída em 05/12/2026\n')).toBe(true)
})

test('concluir duas vezes conclui a seguinte, sem data repetida', () => {
  const r = concluirOcorrencia(concluirOcorrencia(REGRAVADA, HOJE), HOJE)
  const c = lerCampos(r)
  expect(c.scheduled).toBe('2027-02-01')
  expect(c.complete_instances).toEqual(['2026-11-02', '2026-12-01', '2027-01-01'])
  const lista = c.complete_instances as string[]
  expect(new Set(lista).size).toBe(lista.length)
  // Ocorrência já registrada (nota mexida à mão) não se repete.
  const mexida = REGRAVADA.replace('  - 2026-11-02\n', '  - 2026-11-02\n  - 2026-12-01\n')
  expect(lerCampos(concluirOcorrencia(mexida, HOJE)).complete_instances).toEqual(['2026-11-02', '2026-12-01'])
})

test('pularOcorrencia: mesma data nova, ocorrência em skipped_instances', () => {
  const r = pularOcorrencia(REGRAVADA, HOJE)
  const c = lerCampos(r)
  expect(c.scheduled).toBe('2027-01-01')
  expect(c.due).toBe('2027-01-01')
  expect(c.skipped_instances).toEqual(['2026-12-01'])
  expect(c.complete_instances).toEqual(['2026-11-02'])
  expect(c.dateModified).toBe('2026-12-05')
  expect(r.endsWith('Corpo.\n- 01/12/2026 — pulada em 05/12/2026\n')).toBe(true)
})

test('corpo sem quebra no fim ganha uma antes da linha; CRLF se mantém', () => {
  const semFim = concluirOcorrencia(REGRAVADA.replace(/Corpo\.\n$/, 'Corpo.'), HOJE)
  expect(semFim.endsWith('Corpo.\n- 01/12/2026 — concluída em 05/12/2026\n')).toBe(true)
  const crlf = pularOcorrencia(REGRAVADA.replace(/\n/g, '\r\n'), HOJE)
  expect(/(^|[^\r])\n/.test(crlf)).toBe(false)
  expect(crlf.endsWith('Corpo.\r\n- 01/12/2026 — pulada em 05/12/2026\r\n')).toBe(true)
})

test('regra não suportada: concluir e pular lançam, sem devolver texto', () => {
  const diaria = REGRAVADA.replace(/^recurrence: .*$/m, 'recurrence: FREQ=DAILY')
  const completion = REGRAVADA.replace('recurrence_anchor: scheduled', 'recurrence_anchor: completion')
  for (const nota of [diaria, completion]) {
    expect(() => concluirOcorrencia(nota, HOJE)).toThrow(NAO_SUPORTADA)
    expect(() => pularOcorrencia(nota, HOJE)).toThrow(NAO_SUPORTADA)
  }
})

test('lerTarefa marca regraValida', () => {
  expect(lerTarefa('x.md', REGRAVADA, 0)?.regraValida).toBe(true)
  expect(lerTarefa('x.md', REGRAVADA.replace(/^recurrence: .*$/m, 'recurrence: FREQ=DAILY'), 0)?.regraValida).toBe(false)
})

test('regraParaTexto: as três regras, ida e volta com lerRegra', () => {
  expect(regraParaTexto({ tipo: 'mensal-util' })).toBe(UTIL)
  expect(regraParaTexto({ tipo: 'semanal', dia: 1 })).toBe('FREQ=WEEKLY;BYDAY=MO')
  expect(regraParaTexto({ tipo: 'semanal', dia: 0 })).toBe('FREQ=WEEKLY;BYDAY=SU')
  expect(regraParaTexto({ tipo: 'mensal-dia', dia: 10 })).toBe('FREQ=MONTHLY;BYMONTHDAY=10')
  const regras: Regra[] = [
    { tipo: 'mensal-util' },
    ...[0, 1, 2, 3, 4, 5, 6].map(dia => ({ tipo: 'semanal', dia }) as Regra),
    { tipo: 'mensal-dia', dia: 1 },
    { tipo: 'mensal-dia', dia: 28 },
  ]
  for (const r of regras) expect(lerRegra(regraParaTexto(r))).toEqual(r)
})

test('primeiraOcorrencia: hoje incluído', () => {
  expect(primeiraOcorrencia({ tipo: 'mensal-util' }, '2026-11-19')).toBe('2026-12-01')
  expect(primeiraOcorrencia({ tipo: 'mensal-util' }, '2026-12-01')).toBe('2026-12-01')
  // 19/11/2026 é quinta
  expect(primeiraOcorrencia({ tipo: 'semanal', dia: 4 }, '2026-11-19')).toBe('2026-11-19')
  expect(primeiraOcorrencia({ tipo: 'semanal', dia: 1 }, '2026-11-19')).toBe('2026-11-23')
  expect(primeiraOcorrencia({ tipo: 'mensal-dia', dia: 19 }, '2026-11-19')).toBe('2026-11-19')
  expect(primeiraOcorrencia({ tipo: 'mensal-dia', dia: 10 }, '2026-11-19')).toBe('2026-12-10')
})

test('novaNota recorrente: scheduled e due na primeira ocorrência, lida como recorrente', () => {
  const TRABALHO = { nome: 'Trabalho', link: '[[02 - ÁREAS/Trabalho/_CONTEXTO|Trabalho]]' }
  const n = novaNota('Trabalho — fechar o mês', TRABALHO, null, '2026-11-19', 'normal', { tipo: 'mensal-util' })
  expect(n).toContain('scheduled: 2026-12-01\n')
  expect(n).toContain('due: 2026-12-01\n')
  expect(n).toContain(`recurrence: "${UTIL}"\n`)
  expect(n).toContain('recurrence_anchor: scheduled\n')
  expect(n).toContain('complete_instances: []\n')
  expect(n).not.toContain('prazo_padrao')
  const t = lerTarefa('x.md', n, 0)
  expect(t?.recorrente).toBe(true)
  expect(t?.regraValida).toBe(true)
  expect(t?.agendada).toBe('2026-12-01')
  expect(t?.prazo).toBe('2026-12-01')
  // Sem regra, a nota é a de sempre.
  expect(novaNota('X', TRABALHO, '2026-11-20', '2026-11-19', 'normal', null)).toBe(novaNota('X', TRABALHO, '2026-11-20', '2026-11-19', 'normal'))
  expect(novaNota('X', TRABALHO, '2026-11-20', '2026-11-19', 'normal')).not.toContain('recurrence')
})
