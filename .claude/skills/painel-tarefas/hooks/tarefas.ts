// Lógica pura do painel: ler o frontmatter das notas TaskNotes, classificar
// por data e reescrever só os campos que o painel trata.

import type { Projeto, Tarefa } from '../types'
import { primeiraOcorrencia, regraDa, regraParaTexto } from './recorrencia'
import type { Regra } from './recorrencia'

// prazo_padrao só é apagado (quando a pessoa escolhe a data), nunca escrito.
export const CAMPOS_EDITAVEIS = ['status', 'due', 'scheduled', 'priority', 'completedDate', 'dateModified', 'projects', 'prazo_padrao', 'complete_instances', 'skipped_instances']
const CPF = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// --- datas (sempre AAAA-MM-DD no fuso local) ---

export function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${dia}`
}

function data(isoDia: string): Date {
  const [a = 1970, m = 1, d = 1] = isoDia.split('-').map(Number)
  return new Date(a, m - 1, d)
}

export function somarDias(isoDia: string, n: number): string {
  const d = data(isoDia)
  d.setDate(d.getDate() + n)
  return iso(d)
}

export function diasEntre(de: string, ate: string): number {
  return Math.round((data(ate).getTime() - data(de).getTime()) / 86400000)
}

export function proximaSegunda(hoje: string): string {
  const dow = data(hoje).getDay()
  return somarDias(hoje, ((8 - dow) % 7) || 7)
}

export function dataExtensa(hoje: string): string {
  const d = data(hoje)
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`
}

// "dd/mm", "dd/mm/aaaa", "aaaa-mm-dd", "+3", "hoje", "amanhã", "seg".."dom"
export function lerData(texto: string, hoje: string): string | null {
  const t = texto.trim().toLowerCase()
  if (!t) return null
  if (t === 'hoje') return hoje
  if (t === 'amanhã' || t === 'amanha') return somarDias(hoje, 1)
  const rel = t.match(/^\+(\d{1,3})$/)
  if (rel) return somarDias(hoje, Number(rel[1]))
  const dow = DIAS.findIndex(d => t.startsWith(d.slice(0, 3)) || t.startsWith(d.replace('á', 'a')))
  if (dow >= 0) {
    const atual = data(hoje).getDay()
    return somarDias(hoje, ((dow - atual + 7) % 7) || 7)
  }
  const isoM = t.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoM) return validar(Number(isoM[1]), Number(isoM[2]), Number(isoM[3]))
  const br = t.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/)
  if (br) {
    const ano = br[3] ? Number(br[3].length === 2 ? `20${br[3]}` : br[3]) : data(hoje).getFullYear()
    let r = validar(ano, Number(br[2]), Number(br[1]))
    // sem ano e já passou: é o do ano que vem
    if (r && !br[3] && r < hoje) r = validar(ano + 1, Number(br[2]), Number(br[1]))
    return r
  }
  return null
}

function validar(a: number, m: number, d: number): string | null {
  const dt = new Date(a, m - 1, d)
  if (dt.getFullYear() !== a || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null
  return iso(dt)
}

// --- classificação ---

export type Faixa = 'atrasada' | 'hoje' | 'semana' | 'depois' | 'sem-data'

export function dataDe(t: Tarefa): string | null {
  if (t.prazo && t.agendada) return t.prazo < t.agendada ? t.prazo : t.agendada
  return t.prazo ?? t.agendada
}

export function faixa(t: Tarefa, hoje: string): Faixa {
  const d = dataDe(t)
  if (!d) return 'sem-data'
  const n = diasEntre(hoje, d)
  if (n < 0) return 'atrasada'
  if (n === 0) return 'hoje'
  if (n <= 7) return 'semana'
  return 'depois'
}

export function rotuloData(t: Tarefa, hoje: string): string {
  const d = dataDe(t)
  if (!d) return ''
  const n = diasEntre(hoje, d)
  if (n === 0) return 'hoje'
  if (n === 1) return 'amanhã'
  if (n === -1) return 'ontem'
  if (n < 0) return `${-n}d atrás`
  const dt = data(d)
  if (n <= 6) return `${DIAS[dt.getDay()]} ${dt.getDate()}`
  return `${dt.getDate()} ${MESES[dt.getMonth()]}`
}

export const ativa = (t: Tarefa) => t.status !== 'done'

export function emFoco(t: Tarefa, hoje: string): boolean {
  if (!ativa(t)) return t.concluidaEm === hoje
  const f = faixa(t, hoje)
  return f === 'atrasada' || f === 'hoje' || f === 'semana' || t.prioridade === 'high'
}

const PESO: Record<Faixa, number> = { atrasada: 0, hoje: 1, semana: 2, depois: 3, 'sem-data': 4 }
const PESO_PRIORIDADE: Record<string, number> = { high: 0, normal: 1, low: 2, none: 3 }

export function ordenar(lista: Tarefa[], hoje: string): Tarefa[] {
  return [...lista].sort((a, b) => {
    if (ativa(a) !== ativa(b)) return ativa(a) ? -1 : 1
    if ((a.status === 'waiting') !== (b.status === 'waiting')) return a.status === 'waiting' ? 1 : -1
    // Prioridade primeiro: alta, normal, baixa, sem prioridade; depois a data.
    const pa = PESO_PRIORIDADE[a.prioridade] ?? 3, pb = PESO_PRIORIDADE[b.prioridade] ?? 3
    if (pa !== pb) return pa - pb
    const fa = PESO[faixa(a, hoje)], fb = PESO[faixa(b, hoje)]
    if (fa !== fb) return fa - fb
    const da = dataDe(a) ?? '9999', db = dataDe(b) ?? '9999'
    if (da !== db) return da < db ? -1 : 1
    return a.titulo.localeCompare(b.titulo, 'pt-BR')
  })
}

// --- frontmatter ---

type Bloco = { eol: string; linhas: string[]; fim: number }

function bloco(texto: string): Bloco | null {
  const eol = texto.includes('\r\n') ? '\r\n' : '\n'
  const linhas = texto.split(eol)
  if (linhas[0] !== '---') return null
  const fim = linhas.indexOf('---', 1)
  return fim > 0 ? { eol, linhas, fim } : null
}

function valor(bruto: string): string {
  const v = bruto.trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1)
  return v
}

function nomeProjeto(link: string): string {
  const alvo = link.replace(/^\[\[|\]\]$/g, '')
  const [caminho = alvo, alias] = alvo.split('|')
  if (alias) return alias
  const partes = caminho.split('/').filter(p => !p.startsWith('_'))
  return partes[partes.length - 1] ?? caminho
}

// Lê o frontmatter: lista em bloco ("chave:" + linhas "  - item") vira string[];
// os demais campos ficam como texto bruto (inclusive a lista em fluxo "[a, b]").
export function lerCampos(texto: string): Record<string, string | string[]> {
  const b = bloco(texto)
  if (!b) return {}
  const campos: Record<string, string | string[]> = {}
  let lista: string[] | null = null
  for (const linha of b.linhas.slice(1, b.fim)) {
    const item = linha.match(/^\s+-\s+(.*)$/)
    if (item && lista) {
      lista.push(valor(item[1] ?? ''))
      continue
    }
    lista = null
    const m = linha.match(/^([A-Za-z_]+):\s?(.*)$/)
    if (!m?.[1]) continue
    if ((m[2] ?? '').trim() === '') {
      lista = []
      campos[m[1]] = lista
    } else {
      campos[m[1]] = m[2] ?? ''
    }
  }
  // "chave:" vazia sem itens é texto vazio, não lista
  for (const [k, v] of Object.entries(campos)) if (Array.isArray(v) && v.length === 0) campos[k] = ''
  return campos
}

const txt = (v: string | string[] | undefined): string => (Array.isArray(v) ? v.join(' ') : v ?? '')

export function lerTarefa(arquivo: string, textoNota: string, mtime: number): Tarefa | null {
  const campos = lerCampos(textoNota)
  if (!Object.keys(campos).length) return null
  if (!/\btask\b/.test(txt(campos.tags))) return null
  const links = Array.isArray(campos.projects)
    ? campos.projects
    : [...(campos.projects ?? '').matchAll(/"([^"]+)"/g)].map(m => m[1] ?? '')
  const projetos: Projeto[] = links.map(l => ({ link: l, nome: nomeProjeto(l) }))
  const dia = (k: string) => {
    const v = valor(txt(campos[k])).slice(0, 10)
    return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null
  }
  return {
    arquivo,
    titulo: valor(txt(campos.title)) || arquivo.replace(/\.md$/, ''),
    status: valor(txt(campos.status) || 'open') || 'open',
    prioridade: valor(txt(campos.priority) || 'none') || 'none',
    prazo: dia('due'),
    agendada: dia('scheduled'),
    projetos,
    executor: valor(txt(campos.executor) || 'eu') || 'eu',
    concluidaEm: dia('completedDate'),
    recorrente: valor(txt(campos.recurrence)) !== '',
    regraValida: regraDa(campos) !== null,
    // Preenchida depois, pelo `sensivel` do _CONTEXTO.md de cada projeto (ver areaSensivel).
    privada: false,
    mtime,
  }
}

// --- áreas sensíveis ---

// `sensivel: true` no frontmatter do _CONTEXTO.md. Aceita o texto da nota inteira ou só as
// linhas do frontmatter; campo ausente, outro valor ou texto sem frontmatter → false.
export function areaSensivel(contextoFrontmatter: string): boolean {
  const b = bloco(contextoFrontmatter)
  const linhas = b ? b.linhas.slice(1, b.fim) : contextoFrontmatter.split(/\r?\n/)
  for (const linha of linhas) {
    const m = linha.match(/^sensivel:\s*(.*)$/)
    if (m) return valor((m[1] ?? '').replace(/\s+#.*$/, '')).toLowerCase() === 'true'
  }
  return false
}

const PASTAS_ESCOPO = ['02 - ÁREAS', '01 - PROJETOS/Em Andamento', '01 - PROJETOS/Em Espera']

// Arquivos candidatos, relativos à raiz, para o _CONTEXTO.md apontado por um link de `projects`.
// Só arquivos chamados _CONTEXTO.md: "[[02 - ÁREAS/Trabalho/_CONTEXTO|Trabalho]]" → a própria nota;
// "[[Trabalho]]" ou "[[02 - ÁREAS/Trabalho]]" → o _CONTEXTO.md da pasta. Nunca "<alvo>.md" arbitrário.
// Link que tenta sair do vault não tem candidato.
export function candidatosContexto(link: string): string[] {
  const alvo = (link.replace(/^\[\[|\]\]$/g, '').split('|')[0] ?? '').split('#')[0]!.trim()
    .replace(/\\/g, '/').replace(/^\/+|\/+$/g, '').replace(/\.md$/, '')
  if (!alvo || alvo.split('/').includes('..') || /^[A-Za-z]:/.test(alvo)) return []
  if (alvo.split('/').pop() === '_CONTEXTO') return [`${alvo}.md`]
  const lista = [`${alvo}/_CONTEXTO.md`]
  if (!alvo.includes('/')) for (const p of PASTAS_ESCOPO) lista.push(`${p}/${alvo}/_CONTEXTO.md`)
  return lista
}

// Reescreve só os campos pedidos; null apaga a linha (e os itens em bloco dela).
// string[] grava lista em bloco, ou "chave: []" se vazia. Recusa campo fora da lista.
export function definirCampos(textoNota: string, mudar: Record<string, string | string[] | null>): string {
  const b = bloco(textoNota)
  if (!b) throw new Error('nota sem frontmatter')
  const linhas = [...b.linhas]
  let fim = b.fim
  for (const [chave, novo] of Object.entries(mudar)) {
    if (!CAMPOS_EDITAVEIS.includes(chave)) throw new Error(`campo fora do escopo: ${chave}`)
    const i = linhas.slice(0, fim).findIndex((l, n) => n > 0 && l.startsWith(`${chave}:`))
    let itens = 0
    if (i > 0) while (/^\s+-(\s|$)/.test(linhas[i + 1 + itens] ?? '') && i + 1 + itens < fim) itens++
    const nova = novo === null ? [] : Array.isArray(novo)
      ? (novo.length ? [`${chave}:`, ...novo.map(x => `  - ${x}`)] : [`${chave}: []`])
      : [`${chave}: ${novo}`]
    if (i > 0) {
      linhas.splice(i, 1 + itens, ...nova)
      fim += nova.length - (1 + itens)
    } else if (novo !== null) {
      linhas.splice(fim, 0, ...nova)
      fim += nova.length
    }
  }
  return linhas.join(b.eol)
}

// --- criação ---

export function temCpf(texto: string): boolean {
  return CPF.test(texto)
}

// Reticências viram um ponto e pontos nas pontas saem: o Windows não guarda ponto final no nome
// de arquivo, e "..." não pode parecer caminho.
export function nomeArquivo(titulo: string): string {
  const limpar = (s: string) => s.replace(/^[.\s]+|[.\s]+$/g, '')
  return limpar(limpar(titulo.replace(/[\\/:*?"<>|#^[\]]/g, '').replace(/\s+/g, ' ').replace(/\.{2,}/g, '.')).slice(0, 150))
}

export const PRIORIDADES = ['none', 'low', 'normal', 'high']
export const NOME_PRIORIDADE: Record<string, string> = { none: 'Sem', low: 'Baixa', normal: 'Normal', high: 'Alta' }

/** Nota nova. Com `regra`, recorrente: `scheduled` e `due` na primeira ocorrência (hoje incluído); `prazo` não conta. */
export function novaNota(
  titulo: string, projeto: Projeto | null, prazo: string | null, hoje: string, prioridade = 'none', regra: Regra | null = null,
): string {
  const [a, m, d] = hoje.split('-')
  const primeira = regra ? primeiraOcorrencia(regra, hoje) : null
  return [
    '---',
    `title: "${titulo.replace(/"/g, "'")}"`,
    'status: open',
    `priority: ${PRIORIDADES.includes(prioridade) ? prioridade : 'none'}`,
    ...(regra && primeira
      ? [
        `scheduled: ${primeira}`,
        `due: ${primeira}`,
        `recurrence: "${regraParaTexto(regra)}"`,
        'recurrence_anchor: scheduled',
        'complete_instances: []',
      ]
      : prazo ? [`due: ${prazo}`] : []),
    `projects: [${projeto ? `"${projeto.link}"` : ''}]`,
    'contexts: []',
    'executor: eu',
    `dateCreated: ${hoje}`,
    `dateModified: ${hoje}`,
    'tags: [task]',
    '---',
    '',
    `**Origem:** painel de tarefas, ${d}/${m}/${a}.`,
    '',
  ].join('\n')
}
