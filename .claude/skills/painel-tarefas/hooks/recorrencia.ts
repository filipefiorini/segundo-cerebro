import { definirCampos, diasEntre, lerCampos, somarDias } from './tarefas'

// Recorrência do painel: só três regras. Qualquer outra
// (ou âncora `completion`) volta null e o painel recusa mexer na tarefa.

export type Regra = { tipo: 'mensal-util' } | { tipo: 'semanal'; dia: number } | { tipo: 'mensal-dia'; dia: number }

const DIAS_RRULE = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

export function lerRegra(recurrence: string, ancora?: string): Regra | null {
  if (ancora === 'completion') return null
  const texto = recurrence.trim().replace(/^(["'])(.*)\1$/, '$2').replace(/^DTSTART:\d{8};/, '')
  const p: Record<string, string> = {}
  for (const par of texto.split(';')) {
    const i = par.indexOf('=')
    if (i < 1 || par.slice(0, i) in p) return null
    p[par.slice(0, i)] = par.slice(i + 1)
  }
  const chaves = Object.keys(p).sort().join(',')
  if (p.FREQ === 'MONTHLY' && chaves === 'BYDAY,BYSETPOS,FREQ' && p.BYSETPOS === '1' && p.BYDAY === 'MO,TU,WE,TH,FR') {
    return { tipo: 'mensal-util' }
  }
  if (p.FREQ === 'WEEKLY' && chaves === 'BYDAY,FREQ') {
    const dia = DIAS_RRULE.indexOf(p.BYDAY ?? '')
    return dia >= 0 ? { tipo: 'semanal', dia } : null
  }
  if (p.FREQ === 'MONTHLY' && chaves === 'BYMONTHDAY,FREQ' && /^\d{1,2}$/.test(p.BYMONTHDAY ?? '')) {
    const dia = Number(p.BYMONTHDAY)
    return dia >= 1 && dia <= 28 ? { tipo: 'mensal-dia', dia } : null
  }
  return null
}

function partes(isoDia: string): [number, number, number] {
  const [a = 1970, m = 1, d = 1] = isoDia.split('-').map(Number)
  return [a, m, d]
}

const doisDig = (n: number) => String(n).padStart(2, '0')

function montar(a: number, m: number, d: number): string {
  return `${a}-${doisDig(m)}-${doisDig(d)}`
}

function primeiroUtil(a: number, m: number): string {
  const dow = new Date(a, m - 1, 1).getDay()
  return montar(a, m, dow === 6 ? 3 : dow === 0 ? 2 : 1)
}

/** Primeira ocorrência estritamente depois de `depoisDe`. */
export function proxima(regra: Regra, depoisDe: string): string {
  if (regra.tipo === 'semanal') {
    const [a, m, d] = partes(depoisDe)
    const dow = new Date(a, m - 1, d).getDay()
    const falta = (regra.dia - dow + 7) % 7
    return somarDias(depoisDe, falta === 0 ? 7 : falta)
  }
  const [a, m] = partes(depoisDe)
  for (let k = 0; k < 2; k++) {
    const data = new Date(a, m - 1 + k, 1)
    const ano = data.getFullYear()
    const mes = data.getMonth() + 1
    const cand = regra.tipo === 'mensal-util' ? primeiroUtil(ano, mes) : montar(ano, mes, regra.dia)
    if (cand > depoisDe) return cand
  }
  throw new Error('recorrência sem próxima data')
}

/** O inverso de `lerRegra`, sem `DTSTART`: o texto que vai em `recurrence`. */
export function regraParaTexto(regra: Regra): string {
  if (regra.tipo === 'mensal-util') return 'FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=1'
  if (regra.tipo === 'semanal') return `FREQ=WEEKLY;BYDAY=${DIAS_RRULE[regra.dia]}`
  return `FREQ=MONTHLY;BYMONTHDAY=${regra.dia}`
}

/** Primeira ocorrência em `hoje` ou depois. */
export function primeiraOcorrencia(regra: Regra, hoje: string): string {
  return proxima(regra, somarDias(hoje, -1))
}

/**
 * Concluir ou pular a ocorrência `agendada`. Como o TaskNotes: ocorrência de hoje
 * ou futura → a seguinte (estritamente depois); atrasada → a primeira a partir de
 * hoje, hoje incluído. O prazo mantém a distância em dias que tinha da agendada.
 */
export function avancar(regra: Regra, agendada: string, prazo: string | null, hoje: string): { agendada: string; prazo: string | null } {
  const nova = proxima(regra, agendada >= hoje ? agendada : somarDias(hoje, -1))
  return { agendada: nova, prazo: prazo === null ? null : somarDias(nova, diasEntre(agendada, prazo)) }
}

// --- concluir e pular uma ocorrência: a nota inteira regravada ---

const NAO_SUPORTADA = 'regra de repetição não suportada: trate no Obsidian'

const limpo = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(' ') : v ?? '').trim().replace(/^(["'])(.*)\1$/, '$2')
const diaDe = (v: string | string[] | undefined) => {
  const d = limpo(v).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null
}

// Lista do frontmatter: em bloco (string[]), em fluxo ("[a, b]") ou ausente.
function listaDe(v: string | string[] | undefined): string[] {
  if (Array.isArray(v)) return v
  const t = (v ?? '').trim().replace(/^\[|\]$/g, '')
  return t ? t.split(',').map(x => x.trim().replace(/^(["'])(.*)\1$/, '$2')).filter(Boolean) : []
}

/** A regra da tarefa, ou null se o painel não a trata (inclui faltar `scheduled`). */
export function regraDa(campos: Record<string, string | string[]>): Regra | null {
  if (!diaDe(campos.scheduled)) return null
  return lerRegra(limpo(campos.recurrence), limpo(campos.recurrence_anchor))
}

const br = (d: string) => d.split('-').reverse().join('/')

function registrar(texto: string, hoje: string, lista: 'complete_instances' | 'skipped_instances', verbo: string): string {
  const campos = lerCampos(texto)
  const regra = regraDa(campos)
  if (!regra) throw new Error(NAO_SUPORTADA)
  const agendada = diaDe(campos.scheduled)!
  const nova = avancar(regra, agendada, diaDe(campos.due), hoje)
  const feitas = listaDe(campos[lista])
  const r = definirCampos(texto, {
    scheduled: nova.agendada,
    ...(nova.prazo ? { due: nova.prazo } : {}),
    [lista]: feitas.includes(agendada) ? feitas : [...feitas, agendada],
    dateModified: hoje,
  })
  const eol = r.includes('\r\n') ? '\r\n' : '\n'
  return `${r.endsWith(eol) ? r : r + eol}- ${br(agendada)} — ${verbo} em ${br(hoje)}${eol}`
}

export function concluirOcorrencia(texto: string, hoje: string): string {
  return registrar(texto, hoje, 'complete_instances', 'concluída')
}

export function pularOcorrencia(texto: string, hoje: string): string {
  return registrar(texto, hoje, 'skipped_instances', 'pulada')
}
