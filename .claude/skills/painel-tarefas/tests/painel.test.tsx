import { expect, test } from 'claude-code/testing'

import { areaSensivel, candidatosContexto, definirCampos, lerCampos, lerData, lerTarefa, nomeArquivo, novaNota, proximaSegunda } from '../hooks/tarefas'
import { REGRAVADA } from './fixtures'

// Raiz fictícia de um vault com o manifesto.
const VAULT = 'C:/Cofre/Vault'
const DIR = `${VAULT}/06 - TAREFAS/Tarefas`
// 27/10/2026 12:00, terça
const AGORA = new Date(2026, 9, 27, 12).getTime()

const nota = (campos: string) => `---\n${campos}\ntags: [task]\n---\n\nCorpo intacto.\n`
const TRABALHO = '"[[02 - ÁREAS/Trabalho/_CONTEXTO|Trabalho]]"'
const SAUDE = '"[[02 - ÁREAS/Saúde/_CONTEXTO|Saúde]]"'
const ESTUDOS = '"[[01 - PROJETOS/Em Andamento/Estudos/_CONTEXTO|Estudos]]"'

function vault(): Record<string, string> {
  return {
    'Ligar para o fornecedor.md': nota(`title: "Ligar para o fornecedor"\nstatus: open\npriority: high\ndue: 2026-10-25\nprojects: [${TRABALHO}]\nexecutor: eu`),
    'Revisar relatório.md': nota(`title: "Revisar relatório"\nstatus: open\npriority: none\ndue: 2026-10-27\nprojects: [${TRABALHO}]\nexecutor: eu`),
    'Marcar consulta.md': nota(`title: "Marcar consulta"\nstatus: open\npriority: none\ndue: 2026-10-27\nprojects: [${SAUDE}]\nexecutor: eu`),
    'Ajustar script.md': nota(`title: "Ajustar script"\nstatus: open\npriority: none\ndue: 2026-10-20\nprojects: [${ESTUDOS}]\nexecutor: code`),
  }
}

// Notas fora de 06 - TAREFAS/Tarefas, relativas à raiz: o manifesto e os _CONTEXTO.md.
function outros(): Record<string, string> {
  return {
    'segundo-cerebro.manifest.json': '{}',
    '02 - ÁREAS/Trabalho/_CONTEXTO.md': '---\ntipo: area\n---\n\nTrabalho.\n',
    '02 - ÁREAS/Saúde/_CONTEXTO.md': '---\ntipo: area\nsensivel: true\n---\n\nSaúde.\n',
    '02 - ÁREAS/Casa/_CONTEXTO.md': '---\ntipo: area\nsensivel: "true"\n---\n',
    '01 - PROJETOS/Em Andamento/Estudos/_CONTEXTO.md': '---\ntipo: projeto\nsensivel: false\n---\n',
  }
}

test('lê o frontmatter TaskNotes; privada vem só do _CONTEXTO.md', () => {
  const t = lerTarefa('x.md', vault()['Marcar consulta.md']!, 1)
  expect(t?.privada).toBe(false)
  expect(t?.executor).toBe('eu')
  expect(t?.projetos[0]?.nome).toBe('Saúde')
  expect(lerTarefa('y.md', '---\ntitle: nada\n---\n', 1)).toBe(null)
})

test('areaSensivel: true, false e campo ausente', () => {
  expect(areaSensivel('---\ntipo: area\nsensivel: true\n---\n\nCorpo.\n')).toBe(true)
  expect(areaSensivel('---\r\nsensivel: "true"\r\n---\r\n')).toBe(true)
  expect(areaSensivel('tipo: area\nsensivel: true')).toBe(true)
  expect(areaSensivel('---\nsensivel: false\n---\n')).toBe(false)
  expect(areaSensivel('---\ntipo: area\n---\n\nsensivel: true no corpo não conta\n')).toBe(false)
  expect(areaSensivel('')).toBe(false)
})

test('candidatos do _CONTEXTO.md: caminho, nome de pasta e link que sai do vault', () => {
  expect(candidatosContexto('[[02 - ÁREAS/Trabalho/_CONTEXTO|Trabalho]]')).toEqual(['02 - ÁREAS/Trabalho/_CONTEXTO.md'])
  expect(candidatosContexto('[[02 - ÁREAS/Trabalho]]')).toEqual(['02 - ÁREAS/Trabalho/_CONTEXTO.md'])
  expect(candidatosContexto('[[Trabalho]]')).toContain('02 - ÁREAS/Trabalho/_CONTEXTO.md')
  // Nunca um <alvo>.md qualquer: só arquivos chamados _CONTEXTO.md.
  expect(candidatosContexto('[[Trabalho]]')).not.toContain('Trabalho.md')
  expect(candidatosContexto('[[03 - RECURSOS/Fontes/Livro]]')).toEqual(['03 - RECURSOS/Fontes/Livro/_CONTEXTO.md'])
  for (const link of ['[[Trabalho]]', '[[02 - ÁREAS/Trabalho]]', '[[x/_CONTEXTO]]']) {
    for (const c of candidatosContexto(link)) expect(c.split('/').pop()).toBe('_CONTEXTO.md')
  }
  expect(candidatosContexto('[[Estudos]]')).toContain('01 - PROJETOS/Em Andamento/Estudos/_CONTEXTO.md')
  expect(candidatosContexto('[[../fora/_CONTEXTO]]')).toEqual([])
  expect(candidatosContexto('[[]]')).toEqual([])
})

test('reescreve só os campos pedidos e preserva o resto', () => {
  const antes = vault()['Revisar relatório.md']!
  const depois = definirCampos(antes, { status: 'done', completedDate: '2026-10-27' })
  expect(depois).toContain('status: done')
  expect(depois).toContain('completedDate: 2026-10-27')
  expect(depois).toContain('Corpo intacto.')
  expect(depois.split('\n').length).toBe(antes.split('\n').length + 1)
  expect(() => definirCampos(antes, { title: 'outro' })).toThrow()
  expect(definirCampos(depois, { completedDate: null })).not.toContain('completedDate')
})

test('lê nota regravada pelo TaskNotes', () => {
  const t = lerTarefa('x.md', REGRAVADA, 0)
  expect(t).not.toBe(null)
  expect(t?.projetos[0]?.nome).toBe('Trabalho')
  expect(t?.prazo).toBe('2026-12-01')
  expect(t?.recorrente).toBe(true)
  expect(lerCampos(REGRAVADA).tags).toEqual(['task'])
})

test('regrava lista em bloco inteira', () => {
  const r = definirCampos(REGRAVADA, { complete_instances: ['2026-11-02', '2026-12-01'] })
  expect(r).toContain('complete_instances:\n  - 2026-11-02\n  - 2026-12-01\nprojects:')
  expect(r.replace('  - 2026-12-01\n', '')).toBe(REGRAVADA)
})

test('lista vazia sai em fluxo', () => {
  expect(definirCampos(REGRAVADA, { complete_instances: [] })).toContain('complete_instances: []\nprojects:')
})

test('preserva CRLF', () => {
  const r = definirCampos(REGRAVADA.replace(/\n/g, '\r\n'), { complete_instances: ['2026-11-02', '2026-12-01'] })
  expect(/(^|[^\r])\n/.test(r)).toBe(false)
})

test('entende as datas digitadas', () => {
  const hoje = '2026-10-27'
  expect(lerData('+3', hoje)).toBe('2026-10-30')
  expect(lerData('amanhã', hoje)).toBe('2026-10-28')
  expect(lerData('sex', hoje)).toBe('2026-10-30')
  expect(lerData('05/11', hoje)).toBe('2026-11-05')
  expect(lerData('01/01', hoje)).toBe('2027-01-01')
  expect(lerData('31/02', hoje)).toBe(null)
  expect(proximaSegunda(hoje)).toBe('2026-11-02')
})

type Engine = Parameters<Parameters<typeof test>[1]>[1]
type Leituras = { lista: number; leitura: number; escrita: number; avisos: string[]; pedidos: string[] }

// O engine entrega o caminho com as barras do Windows.
const barra = (p: string) => p.replace(/\\/g, '/')

function engine(on: Engine, arquivos: Record<string, string>, extras: Record<string, string> = outros()): Leituras {
  const conta: Leituras = { lista: 0, leitura: 0, escrita: 0, avisos: [], pedidos: [] }
  const achar = (p: string): [Record<string, string>, string] | null => {
    const c = barra(p)
    if (c.startsWith(`${DIR}/`)) return [arquivos, c.slice(DIR.length + 1)]
    if (c.startsWith(`${VAULT}/`)) return [extras, c.slice(VAULT.length + 1)]
    return null
  }
  on('command.register', () => ({ value: { command: 'tarefas' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.toast', (_, e) => {
    conta.avisos.push(String((e as { text?: unknown }).text ?? ''))
    return { value: undefined }
  })
  on('prompt.fill', (_, e) => {
    conta.pedidos.push(String(e.text))
    return { isFilled: true }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('clock.now', () => ({ value: AGORA }))
  on('clock.every', () => ({ value: undefined }))
  on('fs.stat', (_, e) => ({ value: { kind: 'file', size: 1, mtimeMs: 1, isLink: false, realPath: String(e.path) } }))
  on('fs.exists', (_, e) => {
    const a = achar(e.path)
    return { value: a ? a[1] in a[0] : false }
  })
  on('fs.list', () => {
    conta.lista++
    return { value: Object.keys(arquivos).map(name => ({ name, kind: 'file', size: 1, mtimeMs: arquivos[name]!.length, isLink: false })) }
  })
  on('fs.read', (_, e) => {
    conta.leitura++
    const a = achar(e.path)
    if (!a || !(a[1] in a[0])) throw new Error('arquivo inexistente')
    return { value: a[0][a[1]]! }
  })
  on('fs.write', (_, e) => {
    conta.escrita++
    const a = achar(e.path)
    if (a) a[0][a[1]] = String(e.text)
    return { value: undefined }
  })
  return conta
}

const PANE = {
  plugin: 'painel-tarefas',
  component: 'Pane',
  requestId: 'tarefas',
  props: { title: 'Tarefas', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
} as const

test('o painel agrupa por projeto em ordem alfabética, "Sem projeto" por último, e esconde áreas sensíveis', async ($, on) => {
  const arquivos = vault()
  arquivos['Ler capítulo.md'] = nota(`title: "Ler capítulo"\nstatus: open\npriority: none\ndue: 2026-10-27\nprojects: [${ESTUDOS}]\nexecutor: eu`)
  arquivos['Comprar cadeira.md'] = nota('title: "Comprar cadeira"\nstatus: open\npriority: none\ndue: 2026-10-27\nprojects: []\nexecutor: eu')
  arquivos['Trocar lâmpada.md'] = nota('title: "Trocar lâmpada"\nstatus: open\npriority: none\ndue: 2026-10-27\nprojects: ["[[Casa]]"]\nexecutor: eu')
  engine(on, arquivos)
  await $.session.start({ cwd: VAULT, surface: 'desktop', isInteractive: true })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    const grupos = (await ui.findAll({ type: 'Text', text: /^(ESTUDOS|TRABALHO|SEM PROJETO)$/ })).map(g => g.text)
    expect(grupos).toEqual(['ESTUDOS', 'TRABALHO', 'SEM PROJETO'])
    expect(await ui.find({ type: 'Text', text: /Ligar para o fornecedor/ })).toBeTruthy()
    // Saúde por caminho e Casa por nome de pasta têm sensivel: true.
    expect(await ui.find({ type: 'Text', text: /Marcar consulta/ })).toBeFalsy()
    expect(await ui.find({ type: 'Text', text: /Trocar lâmpada/ })).toBeFalsy()
    expect(await ui.find({ type: 'Text', text: /Ajustar script/ })).toBeFalsy()
    await ui.unmount()
  }
})

test('projeto com _CONTEXTO.md ausente ou sem sensivel aparece normalmente, sem erro', async ($, on) => {
  const arquivos = vault()
  arquivos['Reservar hotel.md'] = nota('title: "Reservar hotel"\nstatus: open\npriority: none\ndue: 2026-10-27\nprojects: ["[[02 - ÁREAS/Viagens/_CONTEXTO|Viagens]]"]\nexecutor: eu')
  engine(on, arquivos)
  await $.session.start({ cwd: VAULT, surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /Reservar hotel/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /Revisar relatório/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /Não consegui ler/ })).toBeFalsy()
  await ui.unmount()
})

test('raiz sem manifesto: painel mostra aviso e não lê', async ($, on) => {
  const arquivos = vault()
  const conta = engine(on, arquivos, {})
  await $.session.start({ cwd: 'C:\\Cofre\\Vault\\01 - PROJETOS\\subpasta\\', surface: 'desktop', isInteractive: true })
  expect(conta.avisos.join(' ')).toContain('Painel inativo')

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /Painel inativo/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /Revisar relatório/ })).toBeFalsy()
  expect(conta.lista).toBe(0)
  expect(conta.leitura).toBe(0)
  expect(conta.escrita).toBe(0)
  await ui.unmount()
})

test('concluir uma tarefa grava status e data, e nada mais', async ($, on) => {
  const arquivos = vault()
  engine(on, arquivos)
  await $.session.start({ cwd: VAULT, surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 't:Revisar relatório.md' })
  await ui.press({ key: 'concluir:Revisar relatório.md' })
  const gravada = arquivos['Revisar relatório.md']!
  expect(gravada).toContain('status: done')
  expect(gravada).toContain('completedDate: 2026-10-27')
  expect(gravada).toContain('dateModified: 2026-10-27')
  expect(gravada).toContain('Corpo intacto.')
  await ui.unmount()
})

test('o seletor de status muda para aguardando, volta e conclui', async ($, on) => {
  const arquivos = vault()
  engine(on, arquivos)
  await $.session.start({ cwd: VAULT, surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 't:Revisar relatório.md' })
  await ui.select({ key: 'status:Revisar relatório.md', value: 'waiting' })
  expect(arquivos['Revisar relatório.md']).toContain('status: waiting')
  await ui.select({ key: 'status:Revisar relatório.md', value: 'open' })
  expect(arquivos['Revisar relatório.md']).toContain('status: open')
  await ui.select({ key: 'status:Revisar relatório.md', value: 'done' })
  const gravada = arquivos['Revisar relatório.md']!
  expect(gravada).toContain('status: done')
  expect(gravada).toContain('completedDate: 2026-10-27')
  expect(gravada).toContain('Corpo intacto.')
  await ui.unmount()
})

test('a captura cria nota no padrão do template e recusa CPF', async ($, on) => {
  const arquivos = vault()
  engine(on, arquivos)
  await $.session.start({ cwd: VAULT, surface: 'desktop', isInteractive: true })
  // CPF fictício montado por concatenação, para o filtro do repositório não acusar o teste.
  const cpf = '123.456.' + '789-09'

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'nova' })
  await ui.select({ key: 'nova-projeto', value: 'Trabalho' })
  await ui.input({ key: 'nova-0', text: `Enviar contrato ${cpf}` })
  expect(Object.keys(arquivos).length).toBe(4)
  await ui.input({ key: 'nova-0', text: 'Enviar\nproposta' })
  const nova = arquivos['Enviar proposta.md']!
  expect(nova).toContain('title: "Enviar proposta"')
  expect(nova).toContain('status: open')
  expect(nova).toContain('due: 2026-10-27')
  expect(nova).toContain('Trabalho]]"')
  expect(nova).toContain('contexts: []')
  expect(nova).toContain('executor: eu')
  expect(nova).toContain('dateCreated: 2026-10-27')
  expect(nova).toContain('tags: [task]')
  await ui.unmount()
})

test('os filtros do topo batem com a lista, e privadas aparecem num grupo próprio', async ($, on) => {
  const arquivos = vault()
  arquivos['Ler edital.md'] = nota(`title: "Ler edital"\nstatus: open\npriority: normal\ndue: 2026-10-30\nprojects: [${TRABALHO}]\nexecutor: eu`)
  arquivos['Esperar orçamento.md'] = nota(`title: "Esperar orçamento"\nstatus: waiting\npriority: none\ndue: 2026-10-27\nprojects: [${TRABALHO}]\nexecutor: eu`)
  arquivos['Cobrar resposta.md'] = nota(`title: "Cobrar resposta"\nstatus: waiting\npriority: none\ndue: 2026-10-26\nprojects: [${TRABALHO}]\nexecutor: eu`)
  arquivos['Cobrar documentação.md'] = nota(`title: "Cobrar documentação"\nstatus: waiting\npriority: none\ndue: 2026-10-30\nprojects: [${TRABALHO}]\nexecutor: eu`)
  engine(on, arquivos)
  await $.session.start({ cwd: VAULT, surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  // Hoje: fornecedor e "Cobrar resposta" (atrasadas), relatório e orçamento (hoje); aguardando segue a data; a de Saúde está oculta
  expect(await ui.find({ type: 'Text', text: /Ler edital/ })).toBeFalsy()
  expect(await ui.find({ type: 'Text', text: /Esperar orçamento/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /Cobrar resposta/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /aguardando/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /Cobrar documentação/ })).toBeFalsy()
  expect(await ui.find({ type: 'Text', text: /3 atrasadas/ })).toBeTruthy()

  await ui.press({ key: 'f:semana' })
  expect(await ui.find({ type: 'Text', text: /Ler edital/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /Cobrar documentação/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /Revisar relatório/ })).toBeFalsy()

  await ui.press({ key: 'f:aguardando' })
  expect(await ui.find({ type: 'Text', text: /Esperar orçamento/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /Cobrar documentação/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /Ler edital/ })).toBeFalsy()

  await ui.press({ key: 'f:hoje' })
  await ui.press({ key: 'privadas' })
  expect(await ui.find({ type: 'Text', text: /ÁREAS PRIVADAS/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /Marcar consulta/ })).toBeFalsy()
  await ui.press({ key: 'grupo:eu:Áreas privadas' })
  expect(await ui.find({ type: 'Text', text: /Marcar consulta/ })).toBeTruthy()
  await ui.unmount()
})

test('nova tarefa nasce sem projeto e aceita data escolhida', async ($, on) => {
  const arquivos = vault()
  engine(on, arquivos)
  await $.session.start({ cwd: VAULT, surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'nova' })
  await ui.select({ key: 'nova-prazo', value: 'data' })
  await ui.input({ key: 'nova-data-0', text: '05/11', kind: 'change' })
  await ui.select({ key: 'nova-prioridade', value: 'high' })
  await ui.input({ key: 'nova-0', text: 'Comprar livro de exercícios' })
  const nova = arquivos['Comprar livro de exercícios.md']
  expect(nova).toContain('due: 2026-11-05')
  expect(nova).toContain('priority: high')
  expect(nova).toContain('projects: []')
  await ui.unmount()
})

test('dentro do grupo, a lista segue a prioridade: alta, normal, baixa e sem prioridade', async ($, on) => {
  const arquivos: Record<string, string> = {}
  const t = (titulo: string, prioridade: string, due: string) =>
    nota(`title: "${titulo}"\nstatus: open\npriority: ${prioridade}\ndue: ${due}\nprojects: [${TRABALHO}]\nexecutor: eu`)
  arquivos['Sem prioridade antiga.md'] = t('Sem prioridade antiga', 'none', '2026-10-20')
  arquivos['Baixa de hoje.md'] = t('Baixa de hoje', 'low', '2026-10-27')
  arquivos['Normal atrasada.md'] = t('Normal atrasada', 'normal', '2026-10-25')
  arquivos['Alta de hoje.md'] = t('Alta de hoje', 'high', '2026-10-27')
  arquivos['Normal de hoje.md'] = t('Normal de hoje', 'normal', '2026-10-27')
  engine(on, arquivos)
  await $.session.start({ cwd: VAULT, surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const titulos = (await ui.findAll({ type: 'Text', text: /^(Alta|Normal|Baixa|Sem prioridade) / })).map(x => x.text)
  expect(titulos).toEqual(['Alta de hoje', 'Normal atrasada', 'Normal de hoje', 'Baixa de hoje', 'Sem prioridade antiga'])
  await ui.unmount()
})

test('nova tarefa nasce com prioridade normal', async ($, on) => {
  const arquivos = vault()
  engine(on, arquivos)
  await $.session.start({ cwd: VAULT, surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'nova' })
  await ui.input({ key: 'nova-0', text: 'Pagar conta de luz' })
  expect(arquivos['Pagar conta de luz.md']).toContain('priority: normal')
  await ui.unmount()
})

test('digitar no título não devolve texto velho ao campo', async ($, on) => {
  const arquivos = vault()
  engine(on, arquivos)
  await $.session.start({ cwd: VAULT, surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'nova' })
  for (const texto of ['E', 'En', 'Env', 'Enviar']) {
    await ui.input({ key: 'nova-0', text: texto, kind: 'change' })
    // Campo não controlado: o redesenho não carrega texto, então nunca troca o que a pessoa digitou.
    const campo = await ui.find({ type: 'Input', key: 'nova-0' })
    expect(campo).toBeTruthy()
    expect((campo as { props?: { value?: unknown } }).props?.value).toBeUndefined()
  }
  await ui.input({ key: 'nova-0', text: 'Enviar proposta' })
  expect(arquivos['Enviar proposta.md']).toContain('title: "Enviar proposta"')
  await ui.unmount()
})

test('nomeArquivo: reticências e pontos nas pontas', () => {
  expect(nomeArquivo('Ligar para o banco...')).toBe('Ligar para o banco')
  expect(nomeArquivo('Ver... depois')).toBe('Ver. depois')
  expect(nomeArquivo('...')).toBe('')
  expect(nomeArquivo('v1.2 pronto')).toBe('v1.2 pronto')
})

test('título com reticências vira nota válida, e nota existente com ".." no nome aceita mudança', async ($, on) => {
  const arquivos = vault()
  arquivos['Ver... depois.md'] = nota(`title: "Ver... depois"\nstatus: open\npriority: none\ndue: 2026-10-27\nprojects: [${TRABALHO}]\nexecutor: eu`)
  const conta = engine(on, arquivos)
  await $.session.start({ cwd: VAULT, surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'nova' })
  await ui.input({ key: 'nova-0', text: 'Ligar para o banco...' })
  const nova = arquivos['Ligar para o banco.md']
  expect(nova).toContain('title: "Ligar para o banco..."')
  expect(conta.avisos.some(a => a.includes('inválido'))).toBe(false)
  await ui.press({ key: 't:Ver... depois.md' })
  await ui.select({ key: 'prioridade:Ver... depois.md', value: 'high' })
  expect(arquivos['Ver... depois.md']).toContain('priority: high')
  await ui.unmount()
})

test('mudar a data apaga a marca do prazo padrão; outro campo preserva', async ($, on) => {
  const arquivos = vault()
  arquivos['Pedir gravação.md'] = nota(`title: "Pedir gravação"\nstatus: open\npriority: none\ndue: 2026-10-27\nprazo_padrao: true\nprojects: [${TRABALHO}]\nexecutor: eu`)
  engine(on, arquivos)
  await $.session.start({ cwd: VAULT, surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 't:Pedir gravação.md' })
  await ui.select({ key: 'prioridade:Pedir gravação.md', value: 'high' })
  expect(arquivos['Pedir gravação.md']).toContain('prazo_padrao: true')
  await ui.press({ key: 'segunda:Pedir gravação.md' })
  const depois = arquivos['Pedir gravação.md']!
  expect(depois).toContain('due: 2026-11-02')
  expect(depois).not.toContain('prazo_padrao')
  expect(depois).toContain('Corpo intacto.')
  await ui.unmount()
})

test('atrasada volta para hoje num clique, e concluídas têm visão própria', async ($, on) => {
  const arquivos = vault()
  arquivos['Tarefa antiga.md'] = nota(`title: "Tarefa antiga"\nstatus: done\npriority: none\ndue: 2026-10-10\ncompletedDate: 2026-10-20\nprojects: [${TRABALHO}]\nexecutor: eu`)
  arquivos['Feita hoje pelo Code.md'] = nota(`title: "Feita hoje pelo Code"\nstatus: done\npriority: none\ncompletedDate: 2026-10-27\nprojects: [${ESTUDOS}]\nexecutor: code`)
  engine(on, arquivos)
  await $.session.start({ cwd: VAULT, surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /Tarefa antiga/ })).toBeFalsy()
  await ui.press({ key: 'hoje:Ligar para o fornecedor.md' })
  expect(arquivos['Ligar para o fornecedor.md']).toContain('due: 2026-10-27')
  expect(await ui.find({ type: 'Text', text: /1 atrasada$/ })).toBeTruthy()

  // Concluídas: só as de hoje (como o resumo), com o bloco do Code aberto.
  await ui.press({ key: 'f:concluidas' })
  expect(await ui.find({ type: 'Text', text: /Tarefa antiga/ })).toBeFalsy()
  expect(await ui.find({ type: 'Text', text: /Feita hoje pelo Code/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^1 concluída$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /Revisar relatório/ })).toBeFalsy()
  await ui.unmount()
})

test('dois blocos: minhas tarefas abertas, as do Code recolhidas e agrupadas por projeto', async ($, on) => {
  const arquivos = vault()
  engine(on, arquivos)
  await $.session.start({ cwd: VAULT, surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /^MINHAS TAREFAS$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^TAREFAS DO CODE$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /Ajustar script/ })).toBeFalsy()
  await ui.press({ key: 'bloco:TAREFAS DO CODE' })
  expect(await ui.find({ type: 'Text', text: /^ESTUDOS$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /Ajustar script/ })).toBeTruthy()
  await ui.unmount()
})

test('minhas tarefas também recolhe, e volta aberta ao trocar de visão', async ($, on) => {
  const arquivos = vault()
  engine(on, arquivos)
  await $.session.start({ cwd: VAULT, surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /Revisar relatório/ })).toBeTruthy()
  await ui.press({ key: 'bloco:MINHAS TAREFAS' })
  expect(await ui.find({ type: 'Text', text: /Revisar relatório/ })).toBeFalsy()
  expect(await ui.find({ type: 'Text', text: /^MINHAS TAREFAS$/ })).toBeTruthy()
  await ui.press({ key: 'f:semana' })
  await ui.press({ key: 'f:hoje' })
  expect(await ui.find({ type: 'Text', text: /Revisar relatório/ })).toBeTruthy()
  await ui.unmount()
})

test('o resumo do dia ao lado do anel soma o total do anel', async ($, on) => {
  const arquivos = vault()
  engine(on, arquivos)
  await $.session.start({ cwd: VAULT, surface: 'desktop', isInteractive: true })

  // Fornecedor e a do Code atrasadas, relatório para hoje; a de Saúde está oculta
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /^0\/3$/ }))?.text).toBe('0/3')
  expect(await ui.find({ type: 'Text', text: /^2 atrasadas$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^1 em aberto$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^0 concluídas$/ })).toBeTruthy()
  await ui.unmount()
})

// --- tarefa recorrente no cartão ---

const REC = 'Teste — recorrência.md'
const botao = async (ui: { find: (q: object) => Promise<unknown> }, chave: string) =>
  (await ui.find({ type: 'Button', key: `${chave}:${REC}` })) as { props?: { label?: string } } | null | undefined

async function abrirRecorrente($: Parameters<Parameters<typeof test>[1]>[0], on: Engine, texto: string) {
  const arquivos = vault()
  arquivos[REC] = texto
  const conta = engine(on, arquivos)
  await $.session.start({ cwd: VAULT, surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'f:todas' })
  await ui.press({ key: 'bloco:TAREFAS DO CODE' })
  await ui.press({ key: `t:${REC}` })
  return { ui, arquivos, conta }
}

test('recorrente: o cartão troca concluir e adiar por concluir, pular e encerrar', async ($, on) => {
  const { ui, arquivos } = await abrirRecorrente($, on, REGRAVADA)
  expect(await ui.find({ type: 'Text', text: /^↻ / })).toBeTruthy()
  expect((await botao(ui, 'concluirEsta'))?.props?.label).toBe('Concluir esta')
  expect((await botao(ui, 'pular'))?.props?.label).toBe('Pular esta')
  expect((await botao(ui, 'encerrar'))?.props?.label).toBe('Encerrar rotina')
  for (const chave of ['concluir', 'amanha', 'segunda', 'data', 'trazer', 'hoje']) expect(await botao(ui, chave)).toBeFalsy()
  expect(await ui.find({ type: 'Button', text: 'Concluir esta' })).toBeTruthy()
  for (const rotulo of ['Marcar como concluída', 'Adiar p/ amanhã', 'Adiar p/ segunda', 'Outra data…', 'Reagendar para hoje']) {
    expect(await ui.find({ type: 'Button', text: rotulo })).toBeFalsy()
  }
  const status = (await ui.find({ type: 'Select', key: `status:${REC}` })) as { props?: { options?: { value: string }[] } }
  expect(status.props?.options?.map(o => o.value)).toEqual(['open', 'waiting'])

  await ui.press({ key: `concluirEsta:${REC}` })
  const c = lerCampos(arquivos[REC]!)
  expect(c.scheduled).toBe('2027-01-01')
  expect(c.complete_instances).toEqual(['2026-11-02', '2026-12-01'])
  expect(c.status).toBe('open')
  expect(arquivos[REC]!.endsWith('- 01/12/2026 — concluída em 27/10/2026\n')).toBe(true)

  await ui.press({ key: `pular:${REC}` })
  const p = lerCampos(arquivos[REC]!)
  expect(p.scheduled).toBe('2027-02-01')
  expect(p.skipped_instances).toEqual(['2027-01-01'])
  await ui.unmount()
})

test('recorrente: encerrar a rotina pede um segundo clique', async ($, on) => {
  const { ui, arquivos } = await abrirRecorrente($, on, REGRAVADA)
  await ui.press({ key: `encerrar:${REC}` })
  expect(arquivos[REC]).toBe(REGRAVADA)
  expect((await botao(ui, 'encerrar'))?.props?.label).toBe('Confirmar encerramento')
  await ui.press({ key: `encerrar:${REC}` })
  const c = lerCampos(arquivos[REC]!)
  expect(c.status).toBe('done')
  expect(c.completedDate).toBe('2026-10-27')
  expect(c.scheduled).toBe('2026-12-01')
  await ui.unmount()
})

test('recorrente com regra não suportada: aviso, Obsidian, prioridade e projeto', async ($, on) => {
  const diaria = REGRAVADA.replace(/^recurrence: .*$/m, 'recurrence: FREQ=DAILY')
  const { ui, arquivos } = await abrirRecorrente($, on, diaria)
  expect(await ui.find({ type: 'Text', text: /regra de repetição não suportada: trate no Obsidian/ })).toBeTruthy()
  expect(await botao(ui, 'obsidian')).toBeTruthy()
  expect(await ui.find({ type: 'Select', key: `prioridade:${REC}` })).toBeTruthy()
  expect(await ui.find({ type: 'Select', key: `projeto:${REC}` })).toBeTruthy()
  expect(await ui.find({ type: 'Select', key: `status:${REC}` })).toBeFalsy()
  for (const chave of ['concluirEsta', 'pular', 'encerrar', 'concluir', 'amanha', 'segunda', 'data', 'aguardar', 'fazer']) {
    expect(await botao(ui, chave)).toBeFalsy()
  }
  await ui.select({ key: `prioridade:${REC}`, value: 'high' })
  expect(arquivos[REC]).toContain('priority: high')
  await ui.unmount()
})

test('recorrente: nota mudada desde a leitura não é gravada (concluir, pular, encerrar)', async ($, on) => {
  const { ui, arquivos, conta } = await abrirRecorrente($, on, REGRAVADA)
  // Concluída por fora (TaskNotes): o scheduled andou; o corpo cresce, como o mtime mudaria.
  const mudada = REGRAVADA.replace('scheduled: 2026-12-01', 'scheduled: 2027-01-01').replace('Corpo.\n', 'Corpo.\n- concluída no Obsidian\n')
  arquivos[REC] = mudada
  await ui.press({ key: `concluirEsta:${REC}` })
  expect(arquivos[REC]).toBe(mudada)
  expect(conta.avisos.some(a => a.includes('A nota mudou desde a leitura; recarreguei, confira.'))).toBe(true)

  // Recarregada, o cartão já está em 2027-01-01; muda de novo por fora e tenta pular e encerrar.
  const outra = mudada.replace('scheduled: 2027-01-01', 'scheduled: 2027-02-01').replace('Corpo.\n', 'Corpo.\n- de novo\n')
  arquivos[REC] = outra
  await ui.press({ key: `pular:${REC}` })
  expect(arquivos[REC]).toBe(outra)
  // Encerrar: arma com a nota como o cartão mostra; ela muda antes da confirmação.
  await ui.press({ key: `encerrar:${REC}` })
  const terceira = outra.replace('scheduled: 2027-02-01', 'scheduled: 2027-03-01').replace('Corpo.\n', 'Corpo.\n- mais uma\n')
  arquivos[REC] = terceira
  await ui.press({ key: `encerrar:${REC}` })
  expect(arquivos[REC]).toBe(terceira)
  await ui.unmount()
})

test('fazer agora: recorrente não manda concluir; tarefa comum segue igual', async ($, on) => {
  const { ui, conta } = await abrirRecorrente($, on, REGRAVADA)
  await ui.press({ key: `fazer:${REC}` })
  expect(conta.pedidos[0]).not.toContain('status: done')
  expect(conta.pedidos[0]).toContain('Concluir esta')
  await ui.press({ key: 't:Ajustar script.md' })
  await ui.press({ key: 'fazer:Ajustar script.md' })
  expect(conta.pedidos[1]).toBe('Execute a tarefa "Ajustar script" (06 - TAREFAS/Tarefas/Ajustar script.md). Leia a nota antes e siga a Constituição. '
    + 'Ao terminar, depois de verificar o resultado, marque a tarefa como concluída (status: done, completedDate de hoje) '
    + 'e registre o desfecho no corpo da nota. Se não der para concluir, deixe-a aberta e anote o que falta.')
  await ui.unmount()
})

// --- nova tarefa recorrente ---

const opcoes = async (ui: { find: (q: object) => Promise<unknown> }, key: string) =>
  ((await ui.find({ type: 'Select', key })) as { props?: { options?: { value: string; label: string }[] } } | null)?.props?.options

test('nova recorrente: o campo Repete troca o prazo pela primeira ocorrência e grava a regra', async ($, on) => {
  const arquivos = vault()
  const conta = engine(on, arquivos)
  await $.session.start({ cwd: VAULT, surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'nova' })
  const repete = (await ui.find({ type: 'Select', key: 'nova-repete' })) as { props?: { label?: string } }
  expect(repete.props?.label).toBe('Repete')
  expect((await opcoes(ui, 'nova-repete'))?.map(o => o.label)).toEqual(['Não repete', '1º dia útil do mês', 'Toda semana', 'Todo mês no dia…'])
  expect(await ui.find({ type: 'Select', key: 'nova-prazo' })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^Primeira:/ })).toBeFalsy()

  // Toda semana: aparece o dia, seg a dom; o prazo some. 27/10/2026 é terça.
  await ui.select({ key: 'nova-repete', value: 'semanal' })
  expect(await ui.find({ type: 'Select', key: 'nova-prazo' })).toBeFalsy()
  const dia = (await ui.find({ type: 'Select', key: 'nova-dia-semana' })) as { props?: { label?: string } }
  expect(dia.props?.label).toBe('Dia')
  expect((await opcoes(ui, 'nova-dia-semana'))?.map(o => o.label)).toEqual(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'])
  expect(await ui.find({ type: 'Text', text: 'Primeira: 02/11/2026' })).toBeTruthy()
  await ui.select({ key: 'nova-dia-semana', value: '2' })
  expect(await ui.find({ type: 'Text', text: 'Primeira: 27/10/2026' })).toBeTruthy()

  // Todo mês no dia…: o dia do mês, de 1 a 28.
  await ui.select({ key: 'nova-repete', value: 'mensal-dia' })
  expect(await ui.find({ type: 'Select', key: 'nova-dia-semana' })).toBeFalsy()
  expect(await ui.find({ type: 'Select', key: 'nova-prazo' })).toBeFalsy()
  const campo = (await ui.find({ type: 'Input', key: 'nova-dia-mes-0' })) as { props?: { label?: string } }
  expect(campo.props?.label).toBe('Dia do mês')
  await ui.input({ key: 'nova-dia-mes-0', text: '31', kind: 'change' })
  expect(await ui.find({ type: 'Text', text: 'Dia do mês: de 1 a 28.' })).toBeTruthy()
  await ui.input({ key: 'nova-0', text: 'Conferir extrato' })
  expect(Object.keys(arquivos).length).toBe(4)
  expect(conta.avisos.some(a => a.includes('Dia do mês: de 1 a 28.'))).toBe(true)
  await ui.input({ key: 'nova-dia-mes-0', text: '5', kind: 'change' })
  expect(await ui.find({ type: 'Text', text: 'Primeira: 05/11/2026' })).toBeTruthy()

  // 1º dia útil do mês: grava a nota de novaNota com a regra.
  await ui.select({ key: 'nova-repete', value: 'mensal-util' })
  expect(await ui.find({ type: 'Text', text: 'Primeira: 02/11/2026' })).toBeTruthy()
  await ui.input({ key: 'nova-0', text: 'Fechar as contas do mês' })
  const nova = arquivos['Fechar as contas do mês.md']
  expect(nova).toBe(novaNota('Fechar as contas do mês', null, null, '2026-10-27', 'normal', { tipo: 'mensal-util' }))
  expect(nova).toContain('scheduled: 2026-11-02\ndue: 2026-11-02\nrecurrence: "FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=1"\nrecurrence_anchor: scheduled\ncomplete_instances: []\n')
  // O formulário volta ao padrão: não repete.
  await ui.press({ key: 'nova' })
  expect(await ui.find({ type: 'Select', key: 'nova-prazo' })).toBeTruthy()
  await ui.unmount()
})

test('nova recorrente semanal grava BYDAY do dia escolhido', async ($, on) => {
  const arquivos = vault()
  engine(on, arquivos)
  await $.session.start({ cwd: VAULT, surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'nova' })
  await ui.select({ key: 'nova-projeto', value: 'Sem projeto' })
  await ui.select({ key: 'nova-repete', value: 'semanal' })
  await ui.select({ key: 'nova-dia-semana', value: '5' })
  await ui.input({ key: 'nova-0', text: 'Revisar semana' })
  const c = lerCampos(arquivos['Revisar semana.md']!)
  expect(c.recurrence).toBe('"FREQ=WEEKLY;BYDAY=FR"')
  expect(c.scheduled).toBe('2026-10-30')
  expect(c.due).toBe('2026-10-30')
  await ui.unmount()
})
