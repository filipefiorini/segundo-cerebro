export type Projeto = { link: string; nome: string }

export type Tarefa = {
  arquivo: string
  titulo: string
  status: string
  prioridade: string
  prazo: string | null
  agendada: string | null
  projetos: Projeto[]
  executor: string
  concluidaEm: string | null
  recorrente: boolean
  privada: boolean
  mtime: number
}

export type Filtro = 'hoje' | 'semana' | 'aguardando' | 'todas' | 'concluidas'

export type FiltroPrioridade = 'todas' | 'alta' | 'normal'

export type Visao = {
  filtro: Filtro
  prioridade: FiltroPrioridade
  privadas: boolean
  aberta: string | null
  editandoData: string | null
  abertos: string[]
  codeAberto: boolean
  minhasAberto: boolean
  novaAberta: boolean
  erro: string | null
  atualizadoEm: number
}

export type PrazoNovo = 'hoje' | 'amanha' | 'segunda' | 'data'

export type Rascunho = {
  titulo: string
  projeto: string
  prazo: PrazoNovo
  dataLivre: string
  prioridade: string
  versao: number
}

declare module 'claude-code' {
  interface PluginState {
    'painel-tarefas': { tarefas: Tarefa[]; visao: Visao; rascunho: Rascunho }
  }
}
