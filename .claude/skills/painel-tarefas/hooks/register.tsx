import { atom, read, update } from 'claude-code'
import type { EngineInterface as $T, Register } from 'claude-code'

import type { Filtro, FiltroPrioridade, PrazoNovo, Projeto, Rascunho, Tarefa, Visao } from '../types'
import {
  NOME_PRIORIDADE, PRIORIDADES, areaSensivel, ativa, candidatosContexto, dataExtensa, definirCampos, faixa,
  iso, lerData, lerTarefa, nomeArquivo, novaNota, ordenar, proximaSegunda, rotuloData, somarDias, temCpf,
} from './tarefas'
import type { Faixa } from './tarefas'

const PANE = 'tarefas'
const TITULO = 'Tarefas'
const PASTA = '06 - TAREFAS/Tarefas'
const MANIFESTO = 'segundo-cerebro.manifest.json'
const INATIVO = 'Painel inativo: esta pasta não é um vault do Segundo Cérebro'
const SEM_PROJETO = 'Sem projeto'
const PRIVADAS = 'Áreas privadas'

const tarefas = atom({ plugin: 'painel-tarefas', key: 'tarefas' } as const, [] as Tarefa[])
const VISAO_PADRAO: Visao = {
  filtro: 'hoje',
  prioridade: 'todas',
  privadas: false,
  aberta: null,
  editandoData: null,
  // Grupos de projeto que a pessoa alternou: todos começam abertos dentro do bloco.
  abertos: [],
  codeAberto: false,
  minhasAberto: true,
  novaAberta: false,
  erro: null,
  atualizadoEm: 0,
}
const RASCUNHO_PADRAO: Rascunho = {
  titulo: '',
  projeto: SEM_PROJETO,
  prazo: 'hoje',
  dataLivre: '',
  prioridade: 'none',
  versao: 0,
}
const visao = atom({ plugin: 'painel-tarefas', key: 'visao' } as const, VISAO_PADRAO)
const rascunho = atom({ plugin: 'painel-tarefas', key: 'rascunho' } as const, RASCUNHO_PADRAO)

// Cores do tema: seguem claro/escuro sozinhas.
const COR: Record<Faixa, string> = {
  atrasada: 'error',
  hoje: 'warning',
  semana: 'suggestion',
  depois: 'subtle',
  'sem-data': 'subtle',
}
const STATUS: Record<string, string> = { open: 'aberta', waiting: 'aguardando', done: 'concluída' }
const LARGURA_DATA = 11
const VAZIA: Tarefa = {
  arquivo: '', titulo: '', status: 'open', prioridade: 'none', prazo: null, agendada: null, projetos: [],
  executor: 'eu', concluidaEm: null, recorrente: false, privada: false, mtime: 0,
}

// Ícone de estado: SVG de tamanho fixo onde o surface desenha SVG; glifo no terminal.
type Icone = 'cheio' | 'anel' | 'ponto' | 'meio' | 'feita' | 'lista'
const HEX: Record<string, string> = {
  error: '#e5534b', warning: '#e0a030', suggestion: '#5b9dff', subtle: '#8b8b8b', success: '#46a758',
}
const GLIFO: Record<Icone, string> = { cheio: '●', anel: '○', ponto: '·', meio: '◔', feita: '✓', lista: '≡' }

function svgIcone(tipo: Icone, cor: string): string {
  const c = HEX[cor] ?? HEX.subtle
  const corpo = {
    cheio: `<circle cx="7" cy="7" r="5" fill="${c}"/>`,
    anel: `<circle cx="7" cy="7" r="4.25" fill="none" stroke="${c}" stroke-width="1.5"/>`,
    ponto: `<circle cx="7" cy="7" r="4.25" fill="none" stroke="${c}" stroke-width="1.5" stroke-dasharray="1.6 2"/>`,
    meio: `<circle cx="7" cy="7" r="4.25" fill="none" stroke="${c}" stroke-width="1.5"/><path d="M7 2.75 A4.25 4.25 0 0 1 7 11.25 Z" fill="${c}"/>`,
    feita: `<circle cx="7" cy="7" r="5" fill="${c}"/><path d="M4.6 7.2 L6.3 8.8 L9.4 5.4" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    lista: `<path d="M2.5 4 H11.5 M2.5 7 H11.5 M2.5 10 H11.5" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/>`,
  }[tipo]
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" width="14" height="14">${corpo}</svg>`
}

const normal = (p: string) => p.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()

// Grupo de hover da linha (até 64 caracteres): o "→ hoje" só aparece com o ponteiro sobre ela.
function escopo(arquivo: string): string {
  let h = 5381
  for (const c of arquivo) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0
  return `linha-${h.toString(36)}`
}
const dataBR = (d: string) => d.split('-').reverse().join('/')

// Raiz do vault: lida no session.start. Vazia = painel inerte (não lê nem grava nada).
let raiz = ''
let dir = ''
let nomeVault = ''
let dirReal = ''
let avisado = false
const cache = new Map<string, Tarefa | null>()
// `sensivel` de cada link de `projects`, lido uma vez por sessão.
const sensiveis = new Map<string, boolean>()

async function hoje($: $T): Promise<string> {
  return iso(new Date(await $.clock.now()))
}

// Só lê o frontmatter do _CONTEXTO.md; nunca grava. Ausente ou ilegível → não sensível.
async function linkSensivel($: $T, link: string): Promise<boolean> {
  const salvo = sensiveis.get(link)
  if (salvo !== undefined) return salvo
  let r = false
  for (const rel of candidatosContexto(link)) {
    try {
      const p = `${raiz}/${rel}`
      if (!(await $.fs.exists(p))) continue
      r = areaSensivel(await $.fs.read(p))
      break
    } catch {
      continue
    }
  }
  sensiveis.set(link, r)
  return r
}

async function carregar($: $T): Promise<void> {
  if (!raiz) return
  try {
    if (!dirReal) dirReal = normal((await $.fs.stat(dir, { resolve: true })).realPath ?? dir)
    const entradas = (await $.fs.list(dir)).filter(e => e.kind === 'file' && e.name.endsWith('.md'))
    const lista: Tarefa[] = []
    for (const e of entradas) {
      const chave = `${e.name}@${e.mtimeMs}`
      if (!cache.has(chave)) {
        for (const k of cache.keys()) if (k.startsWith(`${e.name}@`)) cache.delete(k)
        cache.set(chave, lerTarefa(e.name, await $.fs.read(`${dir}/${e.name}`), e.mtimeMs))
      }
      const t = cache.get(chave)
      if (!t) continue
      let privada = false
      for (const p of t.projetos) if (await linkSensivel($, p.link)) privada = true
      lista.push(privada === t.privada ? t : { ...t, privada })
    }
    const agora = await $.clock.now()
    await update($, tarefas, () => lista)
    await update($, visao, v => ({ ...v, erro: null, atualizadoEm: agora }))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await update($, visao, v => ({ ...v, erro: `Não consegui ler ${PASTA}: ${msg}` }))
  }
}

// O mod grava fora do alcance da Guarda: o escopo é conferido aqui.
async function caminho($: $T, arquivo: string, deveExistir: boolean): Promise<string> {
  if (!/^[^\\/]+\.md$/.test(arquivo) || arquivo.split(/[\\/]/).includes('..')) throw new Error('nome de arquivo inválido')
  const p = `${dir}/${arquivo}`
  if (deveExistir) {
    const real = normal((await $.fs.stat(p, { resolve: true })).realPath ?? '')
    if (!dirReal || !real.startsWith(`${dirReal}/`)) throw new Error('fora de 06 - TAREFAS/Tarefas')
  } else if (await $.fs.exists(p)) {
    throw new Error('já existe uma nota com esse nome')
  }
  return p
}

async function alterar($: $T, t: Tarefa, campos: Record<string, string | null>, aviso: string) {
  try {
    if (t.recorrente) throw new Error('tarefa recorrente: trate no Obsidian')
    const p = await caminho($, t.arquivo, true)
    const dia = await hoje($)
    // Data escolhida pela pessoa apaga a marca do prazo padrão (regra FONTE-DE-TAREFAS).
    const marca = 'due' in campos ? { prazo_padrao: null } : {}
    await $.fs.write(p, definirCampos(await $.fs.read(p), { ...campos, ...marca, dateModified: dia }))
    await carregar($)
    $.ui.toast(aviso)
  } catch (err) {
    $.ui.toast(`Não gravei: ${err instanceof Error ? err.message : String(err)}`)
  }
}

async function criar($: $T, digitado: string | null, projetos: Projeto[]) {
  const r = await read($, rascunho)
  // O campo tem várias linhas: quebra vira espaço.
  const t = (digitado ?? r.titulo).replace(/\s+/g, ' ').trim()
  if (!t) return $.ui.toast('Escreva o título da tarefa.')
  if (temCpf(t)) return $.ui.toast('Recusado: o título parece ter um CPF.')
  try {
    const dia = await hoje($)
    const prazo = r.prazo === 'data'
      ? lerData(r.dataLivre, dia)
      : { hoje: dia, amanha: somarDias(dia, 1), segunda: proximaSegunda(dia) }[r.prazo]
    if (!prazo) return $.ui.toast(r.prazo === 'data' ? `Não entendi a data "${r.dataLivre}".` : 'Toda tarefa nasce com prazo.')
    const projeto = projetos.find(p => p.nome === r.projeto) ?? null
    const p = await caminho($, `${nomeArquivo(t)}.md`, false)
    await $.fs.write(p, novaNota(t, projeto, prazo, dia, r.prioridade))
    await update($, rascunho, x => ({ ...RASCUNHO_PADRAO, versao: x.versao + 1 }))
    await update($, visao, v => ({ ...v, novaAberta: false }))
    await carregar($)
    $.ui.toast(`Criada: ${t}`)
  } catch (err) {
    $.ui.toast(`Não criei: ${err instanceof Error ? err.message : String(err)}`)
  }
}

async function fazerAgora($: $T, t: Tarefa) {
  const texto = `Execute a tarefa "${t.titulo}" (${PASTA}/${t.arquivo}). Leia a nota antes e siga a Constituição. `
    + 'Ao terminar, depois de verificar o resultado, marque a tarefa como concluída (status: done, completedDate de hoje) '
    + 'e registre o desfecho no corpo da nota. Se não der para concluir, deixe-a aberta e anote o que falta.'
  const r = await $.prompt.fill({ text: texto, mode: 'replace' })
  $.ui.toast(r.isFilled ? 'Pedido no campo do chat: revise e envie.' : 'Não consegui preencher o chat.')
}

// O desktop não abre link que não seja https: o Windows abre o obsidian:// pelo Explorer.
async function abrirNoObsidian($: $T, t: Tarefa) {
  const arquivo = `${PASTA}/${t.arquivo.replace(/\.md$/, '')}`
  const url = `obsidian://open?vault=${encodeURIComponent(nomeVault)}&file=${encodeURIComponent(arquivo)}`
  await $.process.run(['explorer.exe', url])
}

async function abrirPainel($: $T) {
  return $.ui.open({ id: PANE, title: TITULO })
}

// Ordem alfabética; o grupo das áreas privadas (quando visível) e "Sem projeto" por último.
function ordenarProjetos(nomes: string[]): string[] {
  const peso = (n: string) => (n === SEM_PROJETO ? 900 : n === PRIVADAS ? 800 : 100)
  return [...new Set(nomes)].sort((a, b) => peso(a) - peso(b) || a.localeCompare(b, 'pt-BR'))
}

function naVisao(t: Tarefa, filtro: Filtro, dia: string): boolean {
  // Concluídas: as de hoje, como o resumo do topo; também riscadas em Hoje e Todas.
  if (!ativa(t)) return (filtro === 'concluidas' || filtro === 'hoje' || filtro === 'todas') && t.concluidaEm === dia
  if (filtro === 'concluidas') return false
  // Aguardando segue a data em Hoje e Semana: é cobrança a fazer, e fora da vista cai no esquecimento.
  const f = faixa(t, dia)
  if (filtro === 'hoje') return f === 'atrasada' || f === 'hoje'
  if (filtro === 'semana') return f === 'semana'
  if (filtro === 'aguardando') return t.status === 'waiting'
  return true
}

function naPrioridade(t: Tarefa, p: FiltroPrioridade): boolean {
  if (p === 'alta') return t.prioridade === 'high'
  if (p === 'normal') return t.prioridade === 'high' || t.prioridade === 'normal'
  return true
}

export const register: Register = (on, options) => {
  raiz = ''
  dir = ''
  nomeVault = ''
  dirReal = ''
  avisado = false
  cache.clear()
  sensiveis.clear()

  on('session.start', async ($, e, next) => {
    const r = await next(e)
    // Raiz: a pasta da sessão, ou o userConfig `vault` quando preenchido; precisa ter o manifesto.
    const configurada = String(options?.vault ?? '').trim()
    const candidata = (configurada || e.cwd).replace(/\\/g, '/').replace(/\/+$/, '')
    let temManifesto = false
    try {
      temManifesto = candidata !== '' && (await $.fs.exists(`${candidata}/${MANIFESTO}`))
    } catch {
      temManifesto = false
    }
    raiz = temManifesto ? candidata : ''
    dir = raiz ? `${raiz}/${PASTA}` : ''
    nomeVault = raiz ? raiz.split('/').pop() ?? '' : ''
    dirReal = ''
    cache.clear()
    sensiveis.clear()
    if (!raiz && !avisado) {
      avisado = true
      $.ui.toast(INATIVO)
    }
    await $.command.register({ name: 'tarefas', description: 'Abre o painel de tarefas do dia' })
    if (raiz && e.isInteractive) {
      await carregar($)
      $.clock.every(60_000, () => void carregar($))
      void abrirPainel($)
    }
    return r
  })

  on('command.run', { command: 'tarefas' }, async $ => {
    if (!raiz) return { text: `${INATIVO} (falta o ${MANIFESTO} na raiz).` }
    await carregar($)
    await abrirPainel($)
    return { text: 'Painel de tarefas aberto.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const tabela = $.ui.resolve(e)
    const { Box, Text, Button } = tabela
    if (!raiz) {
      return (
        <Box flexDirection="column" paddingX={1}>
          <Text size="title" weight="bold">{TITULO}</Text>
          <Text color="warning" wrap="wrap">{`${INATIVO} (falta o ${MANIFESTO} na raiz).`}</Text>
        </Box>
      )
    }
    const Input = 'Input' in tabela ? tabela.Input : undefined
    const Select = 'Select' in tabela ? tabela.Select : undefined
    const Svg = 'Svg' in tabela ? tabela.Svg : undefined
    const todas = await read($, tarefas)
    const v = await read($, visao)
    const r = await read($, rascunho)
    const dia = await hoje($)

    const setV = (fn: (x: Visao) => Visao) => void update($, visao, fn)
    const alternar = (lista: string[], item: string) =>
      lista.includes(item) ? lista.filter(i => i !== item) : [...lista, item]
    const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

    // Áreas privadas (sensivel: true) entram só quando a pessoa pede, e sempre num grupo próprio.
    const visiveis = todas.filter(t => v.privadas || !t.privada)
    const minhas = visiveis.filter(t => t.executor !== 'code')
    const doCode = visiveis.filter(t => t.executor === 'code')

    // --- contagens: tudo o que a lista mostra, o Code incluído ---
    const contar = (lista: Tarefa[], f: Filtro) =>
      lista.filter(t => (f === 'concluidas' || ativa(t)) && naVisao(t, f, dia) && naPrioridade(t, v.prioridade)).length
    const n: Record<Filtro, number> = {
      hoje: contar(visiveis, 'hoje'),
      semana: contar(visiveis, 'semana'),
      aguardando: contar(visiveis, 'aguardando'),
      todas: contar(visiveis, 'todas'),
      concluidas: contar(visiveis, 'concluidas'),
    }
    const ocultas = contar(todas.filter(t => t.privada), v.filtro)
    // Resumo do dia: as três partes somam o total do anel.
    const doDia = (f: Faixa) => visiveis.filter(t => ativa(t) && faixa(t, dia) === f).length
    const atrasadas = doDia('atrasada')
    const abertasHoje = doDia('hoje')
    const feitasHoje = visiveis.filter(t => t.concluidaEm === dia).length
    const meta = feitasHoje + atrasadas + abertasHoje
    const progresso = meta === 0 ? 1 : feitasHoje / meta

    const anel = (() => {
      const raio = 15, volta = 2 * Math.PI * raio
      const cheio = (volta * progresso).toFixed(2)
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">`
        + `<circle cx="20" cy="20" r="${raio}" fill="none" stroke="#8a8a8a" stroke-opacity="0.25" stroke-width="5"/>`
        + `<circle cx="20" cy="20" r="${raio}" fill="none" stroke="#5b9dff" stroke-width="5" stroke-linecap="round"`
        + ` stroke-dasharray="${cheio} ${volta.toFixed(2)}" transform="rotate(-90 20 20)"/></svg>`
    })()
    const barra = (() => {
      const total = 10, cheios = Math.round(progresso * total)
      return '▰'.repeat(cheios) + '▱'.repeat(total - cheios)
    })()

    // O mesmo ícone das linhas de tarefa, no resumo, nos filtros e nas linhas.
    const icone = (tipo: Icone, cor: string) => Svg
      ? <Svg source={svgIcone(tipo, cor)} alt={tipo} width={14} height={14} />
      : <Text color={cor}>{GLIFO[tipo]}</Text>

    const linhaResumo = (tipo: Icone, cor: string, n: number, rotulo: string) => (
      <Box flexDirection="row" alignItems="center" columnGap={1}>
        {icone(tipo, n > 0 ? cor : 'subtle')}
        <Text size="footnote">
          <Text weight="semibold" tabular dimColor={n === 0}>{n}</Text>
          <Text dimColor> {rotulo}</Text>
        </Text>
      </Box>
    )

    const cabecalho = (
      <Box flexDirection="row" flexWrap="wrap" justifyContent="space-between" alignItems="center" columnGap={2} rowGap={1}>
        <Box flexDirection="column">
          <Text size="title" weight="bold">{TITULO}</Text>
          <Text dimColor>{dataExtensa(dia)}</Text>
        </Box>
        <Box flexDirection="row" alignItems="center" columnGap={1}>
          {Svg
            ? <Svg source={anel} alt={`${feitasHoje} de ${meta} concluídas hoje`} width={40} height={40} />
            : <Text color="suggestion">{barra}</Text>}
          <Text weight="bold" size="heading" tabular>{feitasHoje}/{meta}</Text>
          <Box flexDirection="column" marginLeft={1}>
            {linhaResumo('cheio', 'error', atrasadas, atrasadas === 1 ? 'atrasada' : 'atrasadas')}
            {linhaResumo('cheio', 'warning', abertasHoje, 'em aberto')}
            {linhaResumo('feita', 'success', feitasHoje, feitasHoje === 1 ? 'concluída' : 'concluídas')}
          </Box>
        </Box>
        <Box flexDirection="row" alignItems="center" columnGap={1}>
          {/* Botão inteiro, como o ＋ Nova, para ter a mesma altura; ASCII no "+" para centralizar. */}
          <Button key="atualizar" label="↻" onPress={() => {
            setV(() => VISAO_PADRAO)
            void carregar($)
          }} />
          <Button key="nova" label="+ Nova" variant="primary"
            onPress={() => setV(x => ({ ...x, novaAberta: !x.novaAberta }))} />
        </Box>
      </Box>
    )

    // --- visões: os números do topo são os filtros. Pílula própria porque o botão nativo
    // não leva SVG, e o ícone é o mesmo das linhas de tarefa.
    const visoes: { id: Filtro; rotulo: string; tipo: Icone; cor: string }[] = [
      { id: 'hoje', rotulo: 'Hoje', tipo: 'cheio', cor: 'warning' },
      { id: 'semana', rotulo: 'Semana', tipo: 'anel', cor: 'suggestion' },
      { id: 'aguardando', rotulo: 'Aguardando', tipo: 'meio', cor: 'subtle' },
      { id: 'concluidas', rotulo: 'Concluídas', tipo: 'feita', cor: 'success' },
      { id: 'todas', rotulo: 'Todas', tipo: 'lista', cor: 'subtle' },
    ]
    const abas = (
      <Box flexDirection="column" marginTop={1} rowGap={1}>
        <Box flexDirection="row" flexWrap="wrap" columnGap={1} rowGap={1}>
          {visoes.map(x => {
            const ativo = v.filtro === x.id
            return (
              <Box key={`chip:${x.id}`} flexDirection="row" alignItems="center" columnGap={1} paddingX={1}
                backgroundColor={ativo ? 'inactive' : undefined} hover={{ backgroundColor: 'inactive' }}>
                {icone(x.tipo, x.cor)}
                <Button key={`f:${x.id}`} plain dimColor={!ativo}
                  onPress={() => setV(y => ({ ...y, filtro: x.id, aberta: null, abertos: VISAO_PADRAO.abertos, codeAberto: x.id === 'concluidas', minhasAberto: true }))}>
                  <Text weight={ativo ? 'bold' : undefined} underline={ativo}>{x.rotulo}</Text>
                  <Text weight="bold" tabular> {n[x.id]}</Text>
                </Button>
              </Box>
            )
          })}
        </Box>
        <Box flexDirection="row" flexWrap="wrap" columnGap={2} rowGap={1} alignItems="center">
            {Select
              ? (
                <Select key="f:prioridade" label="Prioridade" value={v.prioridade}
                  options={[
                    { value: 'todas', label: 'Todas' },
                    { value: 'alta', label: 'Só alta' },
                    { value: 'normal', label: 'Normal e alta' },
                  ]}
                  onSelect={(p: string) => setV(x => ({ ...x, prioridade: p as FiltroPrioridade }))} />
              )
              : null}
            {v.privadas
              ? <Button key="privadas" plain dimColor onPress={() => setV(x => ({ ...x, privadas: false }))}>🔓 Ocultar privadas</Button>
              : <Button key="privadas" plain dimColor onPress={() => setV(x => ({ ...x, privadas: true }))}>{`🔒 Mostrar privadas (${ocultas} nesta visão)`}</Button>}
        </Box>
      </Box>
    )

    // --- nova tarefa: abre pelo ＋ ---
    const projetosConhecidos = (() => {
      const mapa = new Map<string, Projeto>()
      for (const t of todas) {
        if (t.privada && !v.privadas) continue
        for (const p of t.projetos) if (!mapa.has(p.nome)) mapa.set(p.nome, p)
      }
      return [...mapa.values()]
    })()
    const nomesProjetos = ordenarProjetos([...projetosConhecidos.map(p => p.nome), SEM_PROJETO])
    const opcoesPrioridade = PRIORIDADES.map(p => ({ value: p, label: NOME_PRIORIDADE[p] ?? p }))
    const opcoesStatus = Object.entries(STATUS).map(([value, rotulo]) => ({ value, label: rotulo[0]!.toUpperCase() + rotulo.slice(1) }))
    const formulario = v.novaAberta && Input && Select
      ? (
        <Box flexDirection="column" marginTop={1} paddingX={1} paddingY={1} borderStyle="round" borderColor="claude" rowGap={1}>
          <Text weight="bold">Nova tarefa</Text>
          <Input
            key={`nova-${r.versao}`}
            label="Título"
            placeholder="O que precisa ser feito"
            value={r.titulo}
            rows={2}
            autoFocus
            onInput={(texto: string) => void update($, rascunho, x => ({ ...x, titulo: texto }))}
            onSubmit={(texto: string) => void criar($, texto, projetosConhecidos)}
          />
          <Box flexDirection="row" flexWrap="wrap" columnGap={2} rowGap={1}>
            <Select key="nova-projeto" label="Projeto"
              value={nomesProjetos.includes(r.projeto) ? r.projeto : nomesProjetos[0]}
              options={nomesProjetos.map(p => ({ value: p, label: p }))}
              onSelect={(p: string) => void update($, rascunho, x => ({ ...x, projeto: p }))} />
            <Select key="nova-prazo" label="Prazo" value={r.prazo}
              options={[
                { value: 'hoje', label: 'Hoje' },
                { value: 'amanha', label: 'Amanhã' },
                { value: 'segunda', label: 'Segunda' },
                { value: 'data', label: 'Escolher data…' },
              ]}
              onSelect={(p: string) => void update($, rascunho, x => ({ ...x, prazo: p as PrazoNovo }))} />
            <Select key="nova-prioridade" label="Prioridade" value={r.prioridade}
              options={opcoesPrioridade}
              onSelect={(p: string) => void update($, rascunho, x => ({ ...x, prioridade: p }))} />
          </Box>
          {r.prazo === 'data'
            ? (
              <Box flexDirection="column">
                <Input
                  key={`nova-data-${r.versao}`}
                  label="Data"
                  placeholder="dd/mm, dd/mm/aaaa, +10, sex"
                  value={r.dataLivre}
                  onInput={(texto: string) => void update($, rascunho, x => ({ ...x, dataLivre: texto }))}
                  onSubmit={(texto: string) => void update($, rascunho, x => ({ ...x, dataLivre: texto }))}
                />
                {r.dataLivre
                  ? (() => {
                    const lida = lerData(r.dataLivre, dia)
                    return lida
                      ? <Text color="success">{`→ ${dataBR(lida)} (${rotuloData({ ...VAZIA, prazo: lida }, dia)})`}</Text>
                      : <Text color="error">Data não reconhecida</Text>
                  })()
                  : null}
              </Box>
            )
            : null}
          <Box flexDirection="row" columnGap={1}>
            <Button key="nova-criar" label="Criar tarefa" variant="primary" onPress={() => void criar($, null, projetosConhecidos)} />
            <Button key="nova-cancelar" label="Cancelar" onPress={() => setV(x => ({ ...x, novaAberta: false }))} />
          </Box>
        </Box>
      )
      : null

    // --- linha de tarefa: ícone | prioridade | título (corta) | data (coluna fixa) ---

    // Um selo só, mesmo desenho para toda prioridade, logo antes da data: os títulos ficam alinhados.
    // Fora da Text do título, porque o desktop não pinta cor de Text aninhada num Button.
    const SELO: Record<string, { texto: string; cor: string }> = {
      high: { texto: 'ALTA', cor: 'error' },
      normal: { texto: 'NORMAL', cor: 'warning' },
      low: { texto: 'BAIXA', cor: 'subtle' },
    }
    const selo = (t: Tarefa) => {
      const s = ativa(t) ? SELO[t.prioridade] : undefined
      if (!s) return null
      return (
        <Box flexShrink={0}>
          <Text backgroundColor={s.cor} color="inverseText" weight="bold" size="caption">{` ${s.texto} `}</Text>
        </Box>
      )
    }

    const linha = (t: Tarefa, chip: boolean) => {
      const f = faixa(t, dia)
      const feita = !ativa(t)
      const esperando = t.status === 'waiting'
      const alta = ativa(t) && t.prioridade === 'high'
      const cor = feita ? 'success' : esperando ? 'subtle' : COR[f]
      const tipo: Icone = feita ? 'feita' : esperando ? 'meio'
        : f === 'atrasada' || f === 'hoje' ? 'cheio' : f === 'sem-data' ? 'ponto' : 'anel'
      const rotulo = feita
        ? (t.concluidaEm === dia ? 'hoje' : t.concluidaEm ? dataBR(t.concluidaEm).slice(0, 5) : 'feita')
        : rotuloData(t, dia)
      const atrasada = ativa(t) && !esperando && f === 'atrasada'
      const aberta = v.aberta === t.arquivo
      return (
        <Box flexDirection="column">
          <Box key={`r:${t.arquivo}`} flexDirection="row" alignItems="center" columnGap={1} hover={{ backgroundColor: 'inactive', scope: escopo(t.arquivo) }}
            backgroundColor={aberta ? 'inactive' : undefined}>
            <Box width={2} flexShrink={0} alignItems="center" justifyContent="center">{icone(tipo, cor)}</Box>
            <Box flexGrow={1} flexShrink={1} minWidth={0} overflow="hidden">
              <Button key={`t:${t.arquivo}`} plain
                onPress={() => setV(x => ({ ...x, aberta: x.aberta === t.arquivo ? null : t.arquivo, editandoData: null }))}>
                <Text wrap="truncate-end" strikethrough={feita} dimColor={feita || esperando} weight={alta ? 'semibold' : undefined}>
                  {t.titulo}
                  {esperando && !feita ? <Text dimColor>  · aguardando</Text> : ''}
                  {chip && t.projetos[0] ? <Text dimColor>  · {t.projetos[0].nome}</Text> : ''}
                </Text>
              </Button>
            </Box>
            {selo(t)}
            {atrasada
              ? (
                <Box flexShrink={0} display="none" hover={{ display: 'flex', scope: escopo(t.arquivo) }}>
                  <Button key={`hoje:${t.arquivo}`} label="→ hoje"
                    onPress={() => void alterar($, t, { due: dia }, 'Reagendada para hoje.')} />
                </Box>
              )
              : null}
            <Box width={LARGURA_DATA} flexShrink={0} justifyContent="flex-end">
              <Text color={cor} dimColor={feita || f === 'depois' || f === 'sem-data'} tabular wrap="truncate-end">{rotulo}</Text>
            </Box>
          </Box>
          {aberta ? acoes(t) : null}
        </Box>
      )
    }

    const acoes = (t: Tarefa) => {
      const feita = !ativa(t)
      const esperando = t.status === 'waiting'
      const k = (s: string) => `${s}:${t.arquivo}`
      const detalhe = (rotulo: string, valor: string, cor?: string) => (
        <Text><Text dimColor>{rotulo} </Text><Text weight="semibold" color={cor}>{valor}</Text></Text>
      )
      const prazo = t.prazo ? `${rotuloData({ ...t, agendada: null }, dia)} (${dataBR(t.prazo)})` : 'sem prazo'
      return (
        <Box flexDirection="column" marginLeft={2} marginY={1} paddingX={1} paddingY={1} rowGap={1}
          borderStyle="round" borderColor="claude">
          <Text weight="bold" wrap="wrap">{t.titulo}</Text>
          <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
            {feita || !Select ? detalhe('Status:', STATUS[t.status] ?? t.status, feita ? 'success' : esperando ? 'subtle' : undefined) : null}
            {feita && t.concluidaEm ? detalhe('Concluída em:', dataBR(t.concluidaEm), 'success') : null}
            {detalhe('Prazo:', prazo, feita ? undefined : COR[faixa(t, dia)])}
            {feita || !Select ? detalhe('Projeto:', t.projetos.map(p => p.nome).join(', ') || SEM_PROJETO) : null}
          </Box>
          {!feita && Select
            ? (
              <Box flexDirection="row" flexWrap="wrap" columnGap={2} rowGap={1}>
                <Select key={k('status')} label="Status" value={esperando ? 'waiting' : 'open'}
                  options={opcoesStatus}
                  onSelect={(s: string) => void alterar($, t, s === 'done' ? { status: 'done', completedDate: dia } : { status: s },
                    s === 'done' ? 'Concluída. 🎉' : `Status: ${STATUS[s] ?? s}.`)} />
                <Select key={k('prioridade')} label="Prioridade" value={PRIORIDADES.includes(t.prioridade) ? t.prioridade : 'none'}
                  options={opcoesPrioridade}
                  onSelect={(p: string) => void alterar($, t, { priority: p }, `Prioridade: ${NOME_PRIORIDADE[p] ?? p}.`)} />
                <Select key={k('projeto')} label="Projeto" value={t.projetos[0]?.nome ?? SEM_PROJETO}
                  options={ordenarProjetos([...nomesProjetos, ...t.projetos.map(p => p.nome)]).map(p => ({ value: p, label: p }))}
                  onSelect={(p: string) => {
                    // Troca o projeto principal; os demais da tarefa ficam.
                    const novo = projetosConhecidos.find(x => x.nome === p)
                    const resto = t.projetos.slice(1).filter(x => x.nome !== p)
                    const lista = [...(novo ? [novo] : []), ...resto]
                    void alterar($, t, { projects: `[${lista.map(x => `"${x.link}"`).join(', ')}]` }, `Projeto: ${p}.`)
                  }} />
              </Box>
            )
            : null}
          <Text dimColor weight="semibold">Ações:</Text>
          <Box flexDirection="row" flexWrap="wrap" columnGap={1} rowGap={1}>
            {!feita && t.executor === 'code'
              ? <Button key={k('fazer')} label="▶ Fazer agora" hotkey="f" variant="primary" onPress={() => void fazerAgora($, t)} />
              : null}
            {feita
              ? <Button key={k('reabrir')} label="Reabrir" onPress={() => void alterar($, t, { status: 'open', completedDate: null }, 'Reaberta.')} />
              : <Button key={k('concluir')} label="Marcar como concluída" hotkey="c" onPress={() => void alterar($, t, { status: 'done', completedDate: dia }, 'Concluída. 🎉')} />}
            {!feita && !esperando && faixa(t, dia) === 'atrasada'
              ? <Button key={k('trazer')} label="Reagendar para hoje" hotkey="h" onPress={() => void alterar($, t, { due: dia }, 'Reagendada para hoje.')} />
              : null}
            {!feita ? <Button key={k('amanha')} label="Adiar p/ amanhã" hotkey="a" onPress={() => void alterar($, t, { due: somarDias(dia, 1) }, 'Adiada para amanhã.')} /> : null}
            {!feita ? <Button key={k('segunda')} label="Adiar p/ segunda" hotkey="s" onPress={() => void alterar($, t, { due: proximaSegunda(dia) }, 'Adiada para segunda.')} /> : null}
            {!feita ? <Button key={k('data')} label="Outra data…" hotkey="d" onPress={() => setV(x => ({ ...x, editandoData: x.editandoData === t.arquivo ? null : t.arquivo }))} /> : null}
            {!feita
              ? <Button key={k('aguardar')} label={esperando ? 'Voltar para a fila' : 'Marcar aguardando'} hotkey="w"
                  onPress={() => void alterar($, t, { status: esperando ? 'open' : 'waiting' }, esperando ? 'De volta à fila.' : 'Marcada como aguardando.')} />
              : null}
            <Button key={k('obsidian')} label="Abrir no Obsidian ↗" hotkey="o" onPress={() => void abrirNoObsidian($, t)} />
          </Box>
          {v.editandoData === t.arquivo && Input
            ? (
              <Input
                key={k('nova-data')}
                label="Nova data"
                placeholder="dd/mm, +3, sex, aaaa-mm-dd"
                submitLabel="Adiar"
                autoFocus
                onSubmit={(texto: string) => {
                  const nova = lerData(texto, dia)
                  if (!nova) return $.ui.toast(`Não entendi a data "${texto}".`)
                  setV(x => ({ ...x, editandoData: null }))
                  void alterar($, t, { due: nova }, `Nova data: ${dataBR(nova)}.`)
                }}
              />
            )
            : null}
        </Box>
      )
    }

    // --- grupos por projeto, só com o que a visão mostra ---
    const filtradas = (lista: Tarefa[]) => {
      const sel = lista.filter(t => naVisao(t, v.filtro, dia) && naPrioridade(t, v.prioridade))
      // Concluídas: a mais recente primeiro.
      return v.filtro === 'concluidas'
        ? sel.sort((a, b) => (b.concluidaEm ?? '').localeCompare(a.concluidaEm ?? '') || a.titulo.localeCompare(b.titulo, 'pt-BR'))
        : ordenar(sel, dia)
    }
    const agrupar = (lista: Tarefa[]) => {
      const grupos = new Map<string, Tarefa[]>()
      for (const t of lista) {
        const nome = t.privada ? PRIVADAS : t.projetos[0]?.nome ?? SEM_PROJETO
        grupos.set(nome, [...(grupos.get(nome) ?? []), t])
      }
      return grupos
    }

    const cabecalhoGrupo = (chave: string, nome: string, cor: string, lista: Tarefa[], aberto: boolean, alternarGrupo: () => void) => {
      const abertas = v.filtro === 'concluidas' ? lista.filter(t => !ativa(t)).length : lista.filter(ativa).length
      const vencidas = lista.filter(t => ativa(t) && t.status !== 'waiting' && faixa(t, dia) === 'atrasada').length
      return (
        <Box key={`g:${chave}`} flexDirection="row" columnGap={1} hover={{ backgroundColor: 'inactive' }}>
          <Box flexGrow={1} flexShrink={1} minWidth={0}>
            <Button key={`grupo:${chave}`} plain onPress={alternarGrupo}>
              <Text color="subtle">{aberto ? '▾ ' : '▸ '}</Text>
              <Text weight="bold" color={cor}>{nome}</Text>
            </Button>
          </Box>
          <Box flexShrink={0}>
            <Text dimColor tabular>
              {vencidas > 0 ? <Text color="error">{plural(vencidas, 'atrasada', 'atrasadas')} · </Text> : ''}
              {abertas}
            </Text>
          </Box>
        </Box>
      )
    }

    // Grupo de projeto dentro de um bloco: abre por padrão, e `abertos` guarda os que a pessoa alternou.
    // O grupo das áreas privadas começa recolhido mesmo depois de "Mostrar privadas".
    const grupo = (secao: 'eu' | 'code', nome: string, lista: Tarefa[]) => {
      const chave = `${secao}:${nome}`
      const privado = nome === PRIVADAS
      const aberto = privado ? v.abertos.includes(chave) : !v.abertos.includes(chave)
      return (
        <Box flexDirection="column" marginTop={1}>
          {cabecalhoGrupo(chave, privado ? `🔒 ${nome.toUpperCase()}` : nome.toUpperCase(),
            privado ? 'remember' : 'text', lista, aberto,
            () => setV(x => ({ ...x, abertos: alternar(x.abertos, chave) })))}
          {aberto ? <Box flexDirection="column" paddingLeft={1}>{lista.map(t => linha(t, privado))}</Box> : null}
        </Box>
      )
    }

    const projetos = (secao: 'eu' | 'code', lista: Tarefa[]) => {
      const grupos = agrupar(lista)
      return ordenarProjetos([...grupos.keys()]).map(nome => grupo(secao, nome, grupos.get(nome) ?? []))
    }

    // Bloco de um responsável: moldura, título com as contagens, e os projetos dentro.
    const bloco = (titulo: string, cor: string, lista: Tarefa[], corpo: unknown, aberto: boolean, alternarBloco: () => void) => {
      const abertas = lista.filter(ativa).length
      const feitas = lista.filter(t => !ativa(t)).length
      const vencidas = lista.filter(t => ativa(t) && t.status !== 'waiting' && faixa(t, dia) === 'atrasada').length
      // Mesmo respiro em cima e embaixo, aberto ou recolhido: o título não encosta na moldura.
      return (
        <Box flexDirection="column" marginTop={1} paddingX={1} paddingY={1}
          borderStyle="round" borderColor={cor} borderDimColor>
          <Box flexDirection="row" alignItems="center" columnGap={1}>
            <Box flexGrow={1} flexShrink={1} minWidth={0}>
              <Button key={`bloco:${titulo}`} plain onPress={alternarBloco}>
                <Text color="subtle">{aberto ? '▾ ' : '▸ '}</Text>
                <Text weight="bold" color={cor}>{titulo}</Text>
              </Button>
            </Box>
            <Box flexShrink={0}>
              <Text dimColor tabular>
                {vencidas > 0 ? <Text color="error">{plural(vencidas, 'atrasada', 'atrasadas')} · </Text> : ''}
                {v.filtro === 'concluidas' ? plural(feitas, 'concluída', 'concluídas') : plural(abertas, 'aberta', 'abertas')}
              </Text>
            </Box>
          </Box>
          {aberto ? corpo as never : null}
        </Box>
      )
    }

    const listaMinhas = filtradas(minhas)
    const listaCode = filtradas(doCode)
    const vazio = (
      <Box marginTop={1}>
        <Text dimColor italic>
          {v.filtro === 'hoje' ? 'Nada para hoje. 🎉' : v.filtro === 'concluidas' ? 'Nenhuma tarefa concluída.' : 'Nenhuma tarefa nesta visão.'}
        </Text>
      </Box>
    )

    return (
      <Box flexDirection="column" paddingX={1}>
        {cabecalho}
        {formulario}
        {abas}
        {v.erro ? <Text color="error">{v.erro}</Text> : null}
        {bloco('MINHAS TAREFAS', 'success', listaMinhas,
          listaMinhas.length === 0 ? vazio : projetos('eu', listaMinhas),
          v.minhasAberto, () => setV(x => ({ ...x, minhasAberto: !x.minhasAberto })))}
        {listaCode.length === 0 ? null : bloco('TAREFAS DO CODE', 'suggestion', listaCode, projetos('code', listaCode),
          v.codeAberto, () => setV(x => ({ ...x, codeAberto: !x.codeAberto })))}
      </Box>
    )
  })
}
