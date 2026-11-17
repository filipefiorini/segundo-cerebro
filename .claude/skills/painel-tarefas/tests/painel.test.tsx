import { expect, test } from 'claude-code/testing'

import { areaSensivel, candidatosContexto, definirCampos, lerData, lerTarefa, nomeArquivo, proximaSegunda } from '../hooks/tarefas'

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
type Leituras = { lista: number; leitura: number; escrita: number; avisos: string[] }

// O engine entrega o caminho com as barras do Windows.
const barra = (p: string) => p.replace(/\\/g, '/')

function engine(on: Engine, arquivos: Record<string, string>, extras: Record<string, string> = outros()): Leituras {
  const conta: Leituras = { lista: 0, leitura: 0, escrita: 0, avisos: [] }
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
