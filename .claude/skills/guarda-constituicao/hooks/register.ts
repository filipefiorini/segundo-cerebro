import type { Register } from 'claude-code'

// Guarda da Constituição do Segundo Cérebro (regras do CLAUDE.md do vault).
// Atua no tool.check: 'ask' de mod vai sempre a uma pessoa (nem o modo auto nem
// uma regra salva liberam); onde ninguém pode responder (claude -p), vira recusa.

export type Veredito = { decision: 'ask' | 'deny'; reason: string }

const MANIFESTO = 'segundo-cerebro.manifest.json'
const PASTA_GUARDA = '.claude/skills/guarda-constituicao/'

// O que a Guarda protege. Caminhos relativos à raiz do vault, minúsculos; entrada terminada
// em `/` é pasta, as outras são arquivo exato. `completo` liga as regras do framework
// (CLAUDE.md e _DECISOES em qualquer pasta, a própria Guarda, preparo e ATUALIZAÇÃO).
export type Config = { governanca: string[]; sempreLidos: string[]; pastaTarefas: string | null; completo: boolean }

// Vault completo (com manifesto): os valores fixos do framework. base/ e backup/ da
// atualização: só os scripts gravam nelas.
export const CONFIG_COMPLETA: Config = {
  governanca: [
    'claude.md', 'version', '.segundo-cerebro-version',
    '_docs/', '_templates/', '.claude/', '02 - áreas/segundo cérebro/',
    '.segundo-cerebro/base/', '.segundo-cerebro/backup/',
  ],
  sempreLidos: ['claude.md', 'memory.md', 'memory/'],
  pastaTarefas: '06 - tarefas/tarefas/',
  completo: true,
}

// Preparo da atualização: cópia de trabalho, não muda o vault; nem um CLAUDE.md dentro dele é governança.
const PASTA_PREPARO = '.segundo-cerebro/preparo/'

// Entrada de lista das opções: relativa, minúscula, com '/', sem './'. Absoluta que começa
// pela raiz configurada perde esse prefixo; com `..`, ou absoluta fora da raiz, é descartada (null).
function entrada(bruta: string, raiz: string): string | null {
  let n = normalizar(bruta.trim())
  if (ehAbsoluto(n)) {
    if (!raiz || !n.startsWith(`${raiz}/`)) return null
    n = n.slice(raiz.length + 1)
  }
  n = n.replace(/^(\.\/)+/, '')
  if (n.split('/').includes('..')) return null
  // `.`, `./` ou a própria raiz: valeria para o vault inteiro, então é descartada.
  if (/^[./]*$/.test(n)) return null
  return n
}

function itens(valor: unknown): string[] {
  return String(valor ?? '').split(/[;\r\n]+/).map(s => s.trim()).filter(Boolean)
}

function lista(valor: unknown, padrao: string[], raiz: string): string[] {
  const aceitas = itens(valor).map(i => entrada(i, raiz)).filter((i): i is string => !!i)
  return aceitas.length ? aceitas : padrao
}

const CAMPOS_AVULSOS = ['governanca', 'sempre_lidos', 'pasta_tarefas'] as const

// Governança que fica sempre no avulso, somada à lista da pessoa: sem ela, uma escrita em
// .claude/settings.json poderia desligar a Guarda sem pedir confirmação.
const GOVERNANCA_FIXA = ['claude.md', '.claude/']

// Modo avulso (Guarda instalada sozinha): a configuração vem das opções do plugin. `raiz` é a
// "Pasta do vault", usada para aceitar entrada absoluta dentro dela.
export function configAvulsa(options: Record<string, unknown>, raiz = ''): Config {
  const o = options ?? {}
  const r = normalizarRaiz(raiz)
  const tarefas = (entrada(itens(o.pasta_tarefas)[0] ?? '', r) ?? '').replace(/\/+$/, '')
  const governanca = lista(o.governanca, ['claude.md', 'agents.md', '.claude/'], r)
  return {
    governanca: [...new Set([...governanca, ...GOVERNANCA_FIXA])],
    sempreLidos: lista(o.sempre_lidos, ['claude.md'], r),
    pastaTarefas: tarefas ? `${tarefas}/` : null,
    completo: false,
  }
}

// As entradas das opções que configAvulsa descartou, como a pessoa escreveu. Na pasta de
// tarefas só a primeira vale; as demais também entram aqui.
export function entradasDescartadas(options: Record<string, unknown>, raiz = ''): string[] {
  const o = options ?? {}
  const r = normalizarRaiz(raiz)
  return CAMPOS_AVULSOS.flatMap(c =>
    itens(o[c]).filter((i, k) => entrada(i, r) === null || (c === 'pasta_tarefas' && k > 0)),
  )
}

// Valor da opção "Pasta do vault" sem espaços nem aspas nas pontas (o "Copiar como caminho"
// do Windows põe aspas), como a pessoa escreveu.
export function semAspas(valor: unknown): string {
  return String(valor ?? '').replace(/^["'\s]+|["'\s]+$/g, '')
}

// O mesmo valor com '/' e sem barra final, como a Guarda usa.
export function pastaConfigurada(valor: unknown): string {
  return semAspas(valor).replace(/\\/g, '/').replace(/\/+$/, '')
}

// Completo: há manifesto na raiz. Avulso: sem manifesto, com a pasta do vault configurada e
// a sessão aberta nela ou dentro dela. Fora disso a Guarda fica inerte (projeto de código).
export function modo(cwd: string, vaultConfigurado: string, temManifesto: boolean): 'completo' | 'avulso' | 'inerte' {
  if (temManifesto) return 'completo'
  const vault = normalizarRaiz(vaultConfigurado)
  if (!vault) return 'inerte'
  return dentroDe(cwd, vault) ? 'avulso' : 'inerte'
}

// A sessão está na pasta ou dentro dela (sem diferença de maiúsculas e de separador).
// Pasta irmã com o mesmo prefixo (`Notas2` diante de `Notas`) conta como fora.
export function dentroDe(cwd: string, pasta: string): boolean {
  const p = normalizarRaiz(pasta)
  if (!p) return false
  const c = normalizarRaiz(cwd)
  return c === p || c.startsWith(`${p}/`)
}

function casaLista(rel: string, itens: string[]): boolean {
  return itens.some(p => (p.endsWith('/') ? rel.startsWith(p) : rel === p))
}

// Termos de caminho protegido procurados num comando de shell, no vault completo.
// No avulso, os termos são as próprias entradas de `governanca`.
const TERMOS_SHELL = [
  'claude.md',
  '_decisoes',
  '_docs/',
  '_templates/',
  '.segundo-cerebro-version',
  '.claude/',
  'segundo cérebro/',
  'guarda-constituicao',
  '.segundo-cerebro/base/',
  '.segundo-cerebro/backup/',
]

// Atualização do framework: aplicar.ps1 (inclui -GravarBase) e desfazer.ps1 gravam no vault.
// comparar.ps1 só lê e não entra aqui. Casa o nome como token de comando, com ou sem pasta
// (cd .claude/skills/atualizar; ./aplicar.ps1), com / ou \ (o comando já vem normalizado).
const SCRIPT_ATUALIZACAO = /(^|[\s/"'&{(,:;=])(aplicar|desfazer)\.ps1(?=$|[\s"';|&{}(),])/

// Verbos que, no nome de uma ferramenta de conector, indicam envio, escrita ou exclusão.
const VERBOS_ESCRITA = new Set([
  'send', 'forward', 'reply', 'respond', 'create', 'update', 'edit', 'delete', 'trash',
  'untrash', 'share', 'publish', 'move', 'copy', 'upload', 'duplicate', 'rename', 'merge',
  'resize', 'comment', 'complete', 'uncomplete', 'reschedule', 'add', 'import', 'modify',
  'label', 'unlabel', 'mark', 'unmark', 'batch', 'restore', 'cancel', 'apply', 'set', 'stop',
  'spawn', 'convert', 'reorder', 'generate', 'use', 'remove', 'separate', 'manage', 'write',
  'post', 'archive', 'invite', 'assign', 'insert', 'append', 'put', 'patch', 'drop', 'clear',
])

export function normalizar(caminho: unknown): string {
  return String(caminho ?? '')
    .normalize('NFC')
    .replace(/\\/g, '/')
    .toLowerCase()
    .replace(/^\/([a-z])\//, '$1:/')
}

// Raiz do vault como a guarda compara: normalizada, com '/' e sem barra final.
export function normalizarRaiz(raiz: unknown): string {
  return normalizar(raiz).replace(/\/+$/, '')
}

function ehAbsoluto(n: string): boolean {
  return /^[a-z]:\//.test(n) || n.startsWith('/')
}

// Caminho relativo à raiz, ou null fora do vault. Caminho relativo conta como dentro.
// Os `..` são resolvidos antes de qualquer regra, para que `preparo/../../CLAUDE.md` ou
// `notas/../_docs/x.md` sejam vistos pelo destino real.
function relativoAoVault(n: string, raiz: string): string | null {
  if (!ehAbsoluto(n)) return resolverPontos(n) ?? n.replace(/^\.\//, '')
  const inicio = n.startsWith('/') ? '/' : n.slice(0, 3)
  const resolvido = resolverPontos(n.slice(inicio.length))
  if (resolvido === null) return null
  const abs = inicio + resolvido
  const prefixo = `${raiz}/`
  return abs.startsWith(prefixo) ? abs.slice(prefixo.length) : null
}

// Resolve `.`, `..` e barras repetidas; null quando o `..` sobe acima do começo.
function resolverPontos(n: string): string | null {
  const saida: string[] = []
  for (const parte of n.split('/')) {
    if (parte === '' || parte === '.') continue
    if (parte === '..') {
      if (saida.length === 0) return null
      saida.pop()
    } else saida.push(parte)
  }
  return saida.join('/')
}

function nomeDoArquivo(n: string): string {
  return n.slice(n.lastIndexOf('/') + 1)
}

export function ehGovernanca(n: string, raiz: string, config: Config = CONFIG_COMPLETA): boolean {
  const rel = relativoAoVault(n, raiz)
  if (rel === null) return false
  // `..` sobrando (subiu além do começo) não se resolve: o destino pode voltar ao vault
  // por outro nome, então pergunta, sem a isenção do preparo.
  if (rel.split('/').includes('..')) return true
  if (!config.completo) return casaLista(rel, config.governanca)
  if (rel.startsWith(PASTA_PREPARO)) return false
  if (rel.startsWith(PASTA_GUARDA)) return true
  const nome = nomeDoArquivo(rel)
  return nome === '_decisoes.md' || nome === 'claude.md' || casaLista(rel, config.governanca)
}

function ehSempreLido(n: string, raiz: string, config: Config): boolean {
  const rel = relativoAoVault(n, raiz)
  return rel !== null && casaLista(rel, config.sempreLidos)
}

function ehCredencial(n: string): boolean {
  const nome = nomeDoArquivo(n)
  return nome === '.env' || nome.startsWith('.env.') || nome === '.credentials.json'
}

function cpfValido(d: string): boolean {
  if (/^(\d)\1{10}$/.test(d)) return false
  const dv = (base: string, peso: number) => {
    let soma = 0
    for (const c of base) soma += Number(c) * peso--
    const r = (soma * 10) % 11
    return r === 10 ? 0 : r
  }
  return dv(d.slice(0, 9), 10) === Number(d[9]) && dv(d.slice(0, 10), 11) === Number(d[10])
}

export function temCpf(texto: string): boolean {
  // Ponto antes só bloqueia se precedido de dígito; ponto depois só bloqueia se seguido de dígito.
  const re = /(?<![\d/-])(?<!\d\.)(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})(?![\d/-])(?!\.\d)/g
  for (const m of texto.matchAll(re)) {
    if (cpfValido((m[1] ?? '').replace(/\D/g, ''))) return true
  }
  return false
}

export function temTelefone(texto: string): boolean {
  return (
    /\+55[\s\d()-]{8,}/.test(texto) ||
    /\(\d{2}\)\s?9?\d{4}[\s.-]?\d{4}\b/.test(texto) ||
    /\b\d{2}[\s.-]9?\d{4}[\s.-]\d{4}\b/.test(texto) ||
    /\b\d{2}9\d{8}\b/.test(texto)
  )
}

// FONTE-DE-TAREFAS: nenhuma tarefa nasce sem prazo. Write de nota de tarefa aberta sem
// `due` com data, ou Edit que deixe `due:` vazio ou apague a linha `due`, é recusado. Só onde
// há pasta de tarefas.
const DUE_VAZIO = /^due:[ \t]*$/m
const DUE_COM_DATA = /^due:[ \t]*\d{4}-\d{2}-\d{2}/m
const TAG_TASK_FLUXO = /^tags:.*\btask\b/m
const TAG_TASK_BLOCO = /^tags:[ \t]*\r?\n(?:[ \t]+-[ \t]*[^\r\n]*\r?\n)*?[ \t]+-[ \t]*["']?#?task["']?[ \t]*(?:\r?\n|$)/m

function ehTarefa(n: string, raiz: string, config: Config): boolean {
  if (config.pastaTarefas === null) return false
  const rel = relativoAoVault(n, raiz)
  return rel !== null && rel.startsWith(config.pastaTarefas) && rel.endsWith('.md')
}

const DUE_LINHA = /^due:/m
const STATUS_FECHADO = /^status:[ \t]*(done|cancelled)\b/m
const STATUS_LINHA = /^status:/m

// Edit que apaga a linha `due` inteira: a guarda não lê a nota, então decide só pelo trecho.
// Passa quando o trecho mostra a tarefa fechada (status done/cancelled no novo, ou no antigo
// sem troca de status) ou mostra `tags` sem `task` (não é tarefa).
function editApagaDue(antigo: string, novo: string): boolean {
  if (!DUE_LINHA.test(antigo) || DUE_LINHA.test(novo)) return false
  if (STATUS_FECHADO.test(novo)) return false
  if (STATUS_FECHADO.test(antigo) && !STATUS_LINHA.test(novo)) return false
  const tags = `${antigo}\n${novo}`
  if (/^tags:/m.test(tags) && !TAG_TASK_FLUXO.test(tags) && !TAG_TASK_BLOCO.test(tags)) return false
  return true
}

export function tarefaSemPrazo(tool: string, texto: string, antigo = ''): string | null {
  if (tool === 'Edit') {
    if (DUE_VAZIO.test(texto)) return 'o Edit deixa a tarefa sem `due`; toda tarefa tem prazo.'
    return editApagaDue(antigo, texto) ? 'o Edit apaga a linha `due` da tarefa; toda tarefa tem prazo.' : null
  }
  if (tool !== 'Write') return null
  if (!texto.startsWith('---')) return null
  const fim = texto.indexOf('\n---', 3)
  const fm = fim === -1 ? texto : texto.slice(0, fim)
  // `tags` em fluxo (`tags: [task]`) ou em bloco, como o TaskNotes regrava (`tags:` e `  - task`).
  if (!TAG_TASK_FLUXO.test(fm) && !TAG_TASK_BLOCO.test(fm)) return null
  if (/^status:[ \t]*(done|cancelled)\b/m.test(fm)) return null
  if (DUE_COM_DATA.test(fm)) return null
  return 'tarefa sem `due`; toda tarefa nasce com prazo (sem prazo na fonte: dia útil seguinte, com `prazo_padrao: true`).'
}

function textoEscrito(tool: string, input: Record<string, unknown>): string {
  if (tool === 'Write') return String(input.content ?? '')
  if (tool === 'Edit') return String(input.new_string ?? '')
  if (tool === 'NotebookEdit') return String(input.new_source ?? '')
  return ''
}

function caminhoEscrito(tool: string, input: Record<string, unknown>): string | null {
  if (tool === 'Write' || tool === 'Edit') return normalizar(input.file_path)
  if (tool === 'NotebookEdit') return normalizar(input.notebook_path)
  return null
}

const ask = (regra: string, motivo: string): Veredito => ({
  decision: 'ask',
  reason: `Constituição · ${regra}: ${motivo}`,
})
const deny = (regra: string, motivo: string): Veredito => ({
  decision: 'deny',
  reason: `Constituição · ${regra}: ${motivo}`,
})

export function avaliarArquivo(
  tool: string,
  input: Record<string, unknown>,
  raiz: string,
  config: Config = CONFIG_COMPLETA,
): Veredito | null {
  const n = caminhoEscrito(tool, input)
  if (n === null) return null
  const nome = nomeDoArquivo(n)
  if (ehCredencial(n)) return deny('SENSÍVEL', `escrita em ${nome} (credencial) é bloqueada.`)
  const texto = textoEscrito(tool, input)
  const noVault = relativoAoVault(n, raiz) !== null
  if (noVault && temCpf(texto)) return deny('SENSÍVEL', 'o texto contém um CPF; CPF nunca entra no vault.')
  if (ehTarefa(n, raiz, config)) {
    const motivo = tarefaSemPrazo(tool, texto, tool === 'Edit' ? String(input.old_string ?? '') : '')
    if (motivo) return deny('FONTE-DE-TAREFAS', motivo)
  }
  if (ehSempreLido(n, raiz, config) && temTelefone(texto)) {
    return deny('SENSÍVEL', `telefone não entra em ${nome}, lido em toda sessão; vai para a nota canônica do escopo.`)
  }
  if (ehGovernanca(n, raiz, config)) return ask('GRAVAÇÃO', `${nome} é arquivo de governança; confirmar a gravação.`)
  return null
}

function segmentos(cmd: string): string[] {
  return cmd.split(/&&|\|\||[;|\n]|\$\(|`/).map(s => s.trim()).filter(Boolean)
}

function argumentos(segmento: string): string[] {
  return [...segmento.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map(m => m[1] ?? m[2] ?? m[3] ?? '')
}

// rm, mv e afins só pedem confirmação quando algum alvo pode estar no vault. Caminho
// relativo conta como possível (o shell costuma estar na raiz); só passa quando todo
// alvo é absoluto e fora do vault.
function alvoProtegido(segmento: string, raiz: string): boolean {
  const alvos = argumentos(segmento).slice(1).filter(a => !a.startsWith('-'))
  if (alvos.length === 0) return true
  return alvos.some(a => {
    const n = normalizar(a)
    return !ehAbsoluto(n) || n === raiz || n.startsWith(`${raiz}/`)
  })
}

function termosShell(config: Config): string[] {
  return config.completo ? TERMOS_SHELL : config.governanca
}

function redirecionaParaGovernanca(alvo: string, config: Config): boolean {
  const n = normalizar(alvo.replace(/^["']|["']$/g, ''))
  return (config.completo && nomeDoArquivo(n) === 'version') || termosShell(config).some(t => n.includes(t))
}

export function avaliarShell(comando: unknown, raiz: string, config: Config = CONFIG_COMPLETA): Veredito | null {
  const cmd = normalizar(comando)
  if (/\bgit\b[^;&|\n]*\bpush\b[^;&|\n]*(\s--force(-with-lease)?\b|\s-f\b|\s\+\S)/.test(cmd)) {
    return deny('DESTRUTIVO', 'push forçado no git é bloqueado.')
  }
  if (/\bgit\b[^;&|\n]*\b(filter-branch|filter-repo)\b/.test(cmd)) {
    return deny('DESTRUTIVO', 'reescrever o histórico do git é bloqueado.')
  }
  // O motivo mais grave vence: se o comando também apaga ou grava governança, a pessoa vê isso.
  // A atualização do framework só existe no vault completo.
  const rodaAtualizacao = config.completo && SCRIPT_ATUALIZACAO.test(cmd)
  const tambemAtualiza = rodaAtualizacao ? '; o comando também roda a atualização do framework' : ''
  const destrutivo = segmentos(cmd).some(s =>
    (/^(rm|rmdir|mv|del|erase|ren|shred|rimraf|remove-item|move-item|rename-item)(\s|$)/.test(s) && alvoProtegido(s, raiz)) ||
    (/(^|\s)(rm|rmdir|mv|del|erase|ren|shred|rimraf)(\s|$)/.test(s) && !/^(rm|rmdir|mv|del|erase|ren|shred|rimraf)\s/.test(s)) ||
    (/\b(remove-item|move-item|rename-item)\b/.test(s) && !/^(remove-item|move-item|rename-item)\s/.test(s)) ||
    /\bgit\b.*\s(rm|mv|clean|restore|rebase)(\s|$)/.test(s) ||
    /\bgit\b.*\sreset\s.*--hard\b/.test(s) ||
    /\bgit\b.*\scheckout\s+(--|\.)(\s|$)/.test(s) ||
    /\bgit\b.*\scommit\b.*--amend\b/.test(s) ||
    /\bfind\b.*\s-delete\b/.test(s),
  )
  if (destrutivo) return ask('DESTRUTIVO', `o comando move, renomeia, apaga ou desfaz${tambemAtualiza}; confirmar.`)
  const alvos = [...cmd.matchAll(/>>?\s*("[^"]*"|'[^']*'|[^\s;&|]+)/g)].map(m => m[1] ?? '')
  const redireciona = alvos.some(a => redirecionaParaGovernanca(a, config))
  const escreve =
    /\bsed\s+(-[a-z]*i|--in-place)|\btee\b|\b(set-content|add-content|out-file|copy-item)\b|(^|\s)cp\s|write_text|writealltext/.test(cmd) &&
    termosShell(config).some(t => cmd.includes(t))
  if (redireciona || escreve) return ask('GRAVAÇÃO', `o comando escreve em arquivo de governança${tambemAtualiza}; confirmar.`)
  if (rodaAtualizacao) {
    return ask('ATUALIZAÇÃO', 'aplica ou desfaz uma atualização do framework, ou grava a base dela; confirmar.')
  }
  return null
}

// Conector: servidor do claude.ai (prefixo claude_ai_ ou identificador UUID). Ferramenta
// cujo nome comece por um verbo de envio, escrita ou exclusão (direto ou depois de um
// prefixo, como em `servico_send_mail`) pede confirmação.
export function avaliarMcp(tool: string): Veredito | null {
  const partes = tool.split('__')
  if (partes[0] !== 'mcp' || partes.length < 3) return null
  const servidor = partes[1] ?? ''
  const conector =
    servidor.startsWith('claude_ai_') ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(servidor)
  if (!conector) return null
  const base = partes.slice(2).join('__').toLowerCase()
  const palavras = base.split(/[_-]/).filter(Boolean)
  if (palavras.slice(0, 2).some(p => VERBOS_ESCRITA.has(p))) {
    return ask('DESTRUTIVO', `${base} envia, escreve ou apaga fora do vault; confirmar.`)
  }
  return null
}

// Veredito bruto, sem a liberação nem a checagem de sobrescrita (que precisa do disco).
export function avaliar(tool: string, input: unknown, raiz: string, config: Config = CONFIG_COMPLETA): Veredito | null {
  if (!raiz) return null
  const i = (input ?? {}) as Record<string, unknown>
  if (tool === 'Write' || tool === 'Edit' || tool === 'NotebookEdit') return avaliarArquivo(tool, i, raiz, config)
  if (tool === 'Bash' || tool === 'PowerShell') return avaliarShell(i.command, raiz, config)
  return avaliarMcp(tool)
}

// Função pura, testável sem harness: o veredito da guarda para uma chamada, com a
// liberação aplicada (confirmação some enquanto liberada; recusa nunca). Raiz vazia
// (modo inerte) devolve null.
export function veredito(
  tool: string,
  input: unknown,
  raiz: string,
  agora: number,
  config: Config = CONFIG_COMPLETA,
): Veredito | null {
  const v = avaliar(tool, input, normalizarRaiz(raiz), config)
  if (v !== null && v.decision === 'ask' && liberado(agora)) return null
  return v
}

let intervencoes: string[] = []

// Liberação: suspende as confirmações (nunca as recusas) por uma hora. Só a pessoa liga,
// pelo /guarda liberar; a recarga do módulo zera, e o lado seguro é voltar a perguntar.
export const LIBERACAO_MS = 60 * 60 * 1000
const ORIGENS_DA_PESSOA = new Set(['composer', 'bridge', 'sdk'])
let liberadoAte = 0

export function liberado(agora: number): boolean {
  return agora < liberadoAte
}

// /guarda liberar|travar: devolve o texto da resposta, ou null se não for uma dessas ações.
export function comandoLiberacao(args: string, origem: string, agora: number): string | null {
  const acao = args.trim().toLowerCase()
  if (acao !== 'liberar' && acao !== 'travar') return null
  if (!ORIGENS_DA_PESSOA.has(origem)) return `🛡 /guarda ${acao} só vale digitado pela pessoa (${origem ? `origem: ${origem}` : 'origem ausente'}).`
  liberadoAte = acao === 'liberar' ? agora + LIBERACAO_MS : 0
  intervencoes = [...intervencoes, `${acao === 'liberar' ? 'liberada até ' + hora(liberadoAte) : 'travada'} pela pessoa`].slice(-50)
  return acao === 'liberar'
    ? `🛡 Confirmações suspensas até ${hora(liberadoAte)}. As recusas continuam valendo; /guarda travar encerra antes.`
    : '🛡 Guarda travada: as confirmações voltaram.'
}

function hora(ms: number): string {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// Raiz ativa do vault: original (para o disco) e normalizada (para comparar). Vazia = inerte.
let raizDisco = ''
let raiz = ''
let config: Config = CONFIG_COMPLETA
let descartadas: string[] = []
let avisado = false
let pastaAvisada = false

const INATIVA =
  'Guarda inativa: esta pasta não é um vault do Segundo Cérebro nem fica dentro da "Pasta do vault" configurada no plugin'

function mostrar(itens: string[]): string {
  return itens.length ? itens.join(', ') : '(nada)'
}

function regrasEmVigor(): string[] {
  if (config.completo) {
    return [
      'Modo: vault completo do Segundo Cérebro.',
      'Pede confirmação: escrita em governança (CLAUDE.md, VERSION, .segundo-cerebro-version, _DECISOES, _docs/, _templates/, .claude/, 02 - ÁREAS/Segundo Cérebro/, o próprio módulo); Write que sobrescreve nota existente; rm, mv, del, Remove-Item com alvo no vault ou relativo; git rm/mv/clean/restore/rebase, reset --hard, commit --amend; aplicar.ps1 e desfazer.ps1 da atualização; envio, escrita ou exclusão em conector.',
      'Bloqueia: CPF em nota do vault; tarefa aberta gravada sem due; telefone em CLAUDE.md, memory.md e memory/; escrita em .env e credenciais; push forçado e reescrita de histórico do git.',
    ]
  }
  const tarefas = config.pastaTarefas ? `tarefa aberta gravada sem due em ${config.pastaTarefas}; ` : ''
  const lidas = config.governanca.map(g => `${g} (${g.endsWith('/') ? 'pasta' : 'arquivo'})`)
  return [
    `Modo: avulso, no vault ${raizDisco} (opções do plugin).`,
    descartadas.length
      ? `Descartadas das opções (com .., absolutas fora do vault, a própria raiz, ou pasta de tarefas além da primeira): ${descartadas.join(', ')}.`
      : '',
    `Pede confirmação: escrita em governança (${mostrar(lidas)}); Write que sobrescreve nota existente; rm, mv, del, Remove-Item com alvo no vault ou relativo; git rm/mv/clean/restore/rebase, reset --hard, commit --amend; envio, escrita ou exclusão em conector.`,
    `Bloqueia: CPF em nota do vault; ${tarefas}telefone em ${mostrar(config.sempreLidos)}; escrita em .env e credenciais; push forçado e reescrita de histórico do git.`,
    config.pastaTarefas ? '' : 'Tarefa sem due: não vale (a opção "Pasta de tarefas" está vazia).',
  ].filter(Boolean)
}

function status($: { ui: { status: (t?: string) => unknown } }): void {
  if (!raiz) return
  const base = liberado(Date.now()) ? `🛡 liberado até ${hora(liberadoAte)}` : '🛡 guarda'
  $.ui.status(intervencoes.length ? `${base} · ${intervencoes.length} na sessão` : base)
}

export const register: Register = (on, options) => {
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    const configurada = pastaConfigurada(options?.vault)
    const pastaSessao = String(e.cwd ?? '').replace(/\\/g, '/').replace(/\/+$/, '')
    const comManifesto = async (p: string): Promise<boolean> => {
      try {
        return p !== '' && (await $.fs.exists(`${p}/${MANIFESTO}`))
      } catch {
        return false
      }
    }
    // O vault completo vence: manifesto na pasta da sessão liga o modo completo mesmo com a
    // "Pasta do vault" preenchida (apontando para outro vault, num plugin instalado pelo
    // marketplace). Sem ele, a "Pasta do vault" com manifesto é a raiz completa só se a sessão
    // estiver nela ou numa subpasta; fora dela, inerte. Sem manifesto, vale o avulso ou inerte.
    let completa = ''
    if (await comManifesto(pastaSessao)) completa = pastaSessao
    else if (dentroDe(pastaSessao, configurada) && (await comManifesto(configurada))) completa = configurada
    const m = modo(e.cwd, configurada, completa !== '')
    const ativa = m === 'completo' ? completa : m === 'avulso' ? configurada : ''
    raizDisco = ativa
    raiz = normalizarRaiz(ativa)
    const opcoes = (options ?? {}) as Record<string, unknown>
    config = m === 'avulso' ? configAvulsa(opcoes, configurada) : CONFIG_COMPLETA
    descartadas = m === 'avulso' ? entradasDescartadas(opcoes, configurada) : []
    // Quem preencheu a "Pasta do vault" já sabe onde a Guarda vale: sem aviso em projeto de código.
    if (m === 'inerte' && !configurada && !avisado) {
      avisado = true
      $.ui.toast(INATIVA)
    }
    // Pasta configurada que não existe (digitada errado, movida) deixaria a Guarda inerte em silêncio.
    if (configurada && !pastaAvisada) {
      let existe = true
      try {
        existe = await $.fs.exists(configurada)
      } catch {
        existe = true
      }
      if (!existe) {
        pastaAvisada = true
        $.ui.toast(`A 'Pasta do vault' configurada não existe: ${semAspas(options?.vault)}`)
      }
    }
    await $.command.register({
      name: 'guarda',
      description: 'Regras da guarda da Constituição e o que ela interceptou nesta sessão',
    })
    status($)
    return r
  })

  on('command.run', async ($, e, next) => {
    if (e.command !== 'guarda' && !e.command.endsWith(':guarda')) return next(e)
    if (!raiz) {
      return { text: `🛡 ${INATIVA} (falta o segundo-cerebro.manifest.json na raiz, e a sessão não abriu na pasta configurada).` }
    }
    const resposta = comandoLiberacao(e.args ?? '', e.origin?.kind ?? '', Date.now())
    if (resposta !== null) {
      status($)
      return { text: resposta }
    }
    const regras = [
      ...regrasEmVigor(),
      `Liberação: /guarda liberar suspende as confirmações por 1 hora (nunca as recusas; não vale onde ninguém responde, como claude -p); /guarda travar encerra. Agora: ${liberado(Date.now()) ? 'liberada até ' + hora(liberadoAte) : 'travada'}.`,
    ]
    const vistos = intervencoes.length ? intervencoes.map(i => `- ${i}`).join('\n') : '- nada nesta sessão'
    return { text: `${regras.join('\n')}\n\nIntercepções:\n${vistos}` }
  })

  on('tool.check', async ($, e, next) => {
    if (!raiz) return next(e)
    let v = avaliar(e.tool, e.input, raiz, config)
    if (v === null && e.tool === 'Write') {
      const i = (e.input ?? {}) as Record<string, unknown>
      const n = normalizar(i.file_path)
      if (relativoAoVault(n, raiz) !== null) {
        const alvo = ehAbsoluto(n) ? String(i.file_path) : `${raizDisco}/${String(i.file_path)}`
        let ja = false
        try {
          ja = await $.fs.exists(alvo)
        } catch {
          ja = false
        }
        if (ja) v = ask('DESTRUTIVO', `o Write sobrescreve ${nomeDoArquivo(n)} inteiro; confirmar.`)
      }
    }
    if (v === null) return next(e)
    const base = await next(e)
    if (base.decision === 'deny') return base
    // Liberada, a confirmação some onde há quem responderia; sem ninguém (claude -p), segue recusa.
    const solta = v.decision === 'ask' && e.approver !== undefined && liberado(Date.now())
    if (e.tool_use_id) {
      const verbo = v.decision === 'deny' ? 'recusou' : solta ? 'liberou' : 'perguntou'
      intervencoes = [...intervencoes, `${verbo} · ${e.tool} · ${v.reason}`].slice(-50)
      status($)
    }
    if (solta) return base
    return { decision: v.decision, reason: v.reason }
  }).catch(() => ({ decision: 'deny', reason: 'Constituição: a guarda falhou ao avaliar a chamada; recusada por segurança.' }))
}
