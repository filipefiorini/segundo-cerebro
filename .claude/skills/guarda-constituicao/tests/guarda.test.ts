import { expect, test } from 'claude-code/testing'
import { comandoLiberacao, configAvulsa, entradasDescartadas, liberado, LIBERACAO_MS, modo, temCpf, veredito } from '../hooks/register'

// Raiz fictícia de um vault; o manifesto existe nela, e uma nota já existe.
const RAIZ = 'C:\\Cofre\\Vault'
const V = `${RAIZ}\\`
// O motor entrega fs.exists com o separador do sistema; o teste compara sem depender dele.
const comoNoDisco = (p: string) => p.replace(/\//g, '\\')
const MANIFESTO = `${V}segundo-cerebro.manifest.json`
const EXISTENTES = new Set([MANIFESTO, `${V}02 - ÁREAS\\Trabalho\\nota existente.md`])

// Valores sensíveis montados por concatenação, para o filtro do repositório não acusar o teste.
// Um CPF válido (dígitos verificadores corretos), o mesmo sem máscara, e um inválido.
const CPF_VALIDO = '529.982.' + '247-25'
const CPF_SEM_MASCARA = '529982' + '24725'
const CPF_INVALIDO = '529.982.' + '247-26'
const TELEFONE = '(11) 9876' + '5-4321'
const TELEFONE_DDI = '+55 11 9876' + '5-4321'

// Servidor de conector com identificador no formato UUID (fictício).
const CONECTOR = 'mcp__aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee__'

type Caso = { nome: string; tool: string; input: Record<string, unknown>; espera: 'allow' | 'ask' | 'deny'; motivo?: string; tambem?: string[]; semMotivo?: string }

const APLICAR = '.claude/skills/atualizar/aplicar.ps1'
const DESFAZER = '.claude/skills/atualizar/desfazer.ps1'
const PS = 'powershell -NoProfile -ExecutionPolicy Bypass -File'

const tarefa = (fm: string) => `---\ntitle: "X — fazer"\n${fm}\nprojects: ["[[Trabalho]]"]\ntags: [task]\n---\n`
// Nota recorrente como o TaskNotes regrava: listas em bloco, dateModified com hora, DTSTART na regra.
const REGRAVADA = `---\ntitle: Teste — recorrência\nstatus: open\npriority: none\nscheduled: 2026-12-01\ndue: 2026-12-01\nrecurrence: DTSTART:20261102;FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=1\nrecurrence_anchor: scheduled\ncomplete_instances:\n  - 2026-11-02\nprojects:\n  - "[[02 - ÁREAS/Trabalho/_CONTEXTO|Trabalho]]"\ncontexts: []\nexecutor: code\ndateCreated: 2026-11-19\ndateModified: 2026-11-19T08:56:48.633-03:00\ntags:\n  - task\nskipped_instances: []\n---\n\nCorpo.\n`

const CASOS: Caso[] = [
  // GRAVAÇÃO: governança
  { nome: 'Edit no CLAUDE.md pergunta', tool: 'Edit', input: { file_path: `${V}CLAUDE.md`, old_string: 'a', new_string: 'b' }, espera: 'ask' },
  { nome: 'Write no CLAUDE.md pergunta', tool: 'Write', input: { file_path: `${V}CLAUDE.md`, content: 'x' }, espera: 'ask' },
  { nome: 'Edit no _DECISOES pergunta', tool: 'Edit', input: { file_path: `${V}02 - ÁREAS\\Segundo Cérebro\\_DECISOES.md`, old_string: 'a', new_string: 'b' }, espera: 'ask' },
  { nome: 'Write no _DECISOES pergunta', tool: 'Write', input: { file_path: `${V}02 - ÁREAS\\Segundo Cérebro\\_DECISOES.md`, content: 'x' }, espera: 'ask' },
  { nome: 'Write em 02 - ÁREAS/Segundo Cérebro pergunta', tool: 'Write', input: { file_path: `${V}02 - ÁREAS\\Segundo Cérebro\\_HISTORICO.md`, content: 'x' }, espera: 'ask' },
  { nome: 'Write em _docs pergunta', tool: 'Write', input: { file_path: `${V}_docs\\Novo.md`, content: 'x' }, espera: 'ask' },
  { nome: 'Edit em _templates pergunta', tool: 'Edit', input: { file_path: `${V}_templates\\Template de Área.md`, old_string: 'a', new_string: 'b' }, espera: 'ask' },
  { nome: 'Edit em .claude pergunta', tool: 'Edit', input: { file_path: `${V}.claude\\skills\\processar-inbox\\SKILL.md`, old_string: 'a', new_string: 'b' }, espera: 'ask' },
  { nome: 'Edit no próprio módulo pergunta', tool: 'Edit', input: { file_path: `${V}.claude\\skills\\guarda-constituicao\\hooks\\register.ts`, old_string: 'a', new_string: 'b' }, espera: 'ask' },
  { nome: 'Edit no VERSION pergunta', tool: 'Edit', input: { file_path: `${V}VERSION`, old_string: 'a', new_string: 'b' }, espera: 'ask' },
  { nome: 'Write do .segundo-cerebro-version pergunta', tool: 'Write', input: { file_path: `${V}.segundo-cerebro-version`, content: '1.0.0' }, espera: 'ask' },
  { nome: 'CLAUDE.md em subpasta pergunta', tool: 'Write', input: { file_path: `${V}01 - PROJETOS\\X\\CLAUDE.md`, content: 'x' }, espera: 'ask' },
  { nome: 'caminho estilo git bash pergunta', tool: 'Edit', input: { file_path: '/c/Cofre/Vault/CLAUDE.md', old_string: 'a', new_string: 'b' }, espera: 'ask' },
  { nome: 'CLAUDE.md fora do vault passa', tool: 'Edit', input: { file_path: 'C:\\Outro\\CLAUDE.md', old_string: 'a', new_string: 'b' }, espera: 'allow' },
  // memory/ fora da confirmação
  { nome: 'Edit em memory/ passa', tool: 'Edit', input: { file_path: `${V}memory\\sessoes.md`, old_string: 'a', new_string: 'sessão nova' }, espera: 'allow' },
  // DESTRUTIVO: sobrescrita
  { nome: 'Write sobre nota existente pergunta', tool: 'Write', input: { file_path: `${V}02 - ÁREAS\\Trabalho\\nota existente.md`, content: 'x' }, espera: 'ask' },
  { nome: 'Write de nota nova passa', tool: 'Write', input: { file_path: `${V}00 - INBOX\\nova.md`, content: 'x' }, espera: 'allow' },
  { nome: 'Edit em nota comum passa', tool: 'Edit', input: { file_path: `${V}02 - ÁREAS\\Trabalho\\nota existente.md`, old_string: 'a', new_string: 'b' }, espera: 'allow' },
  { nome: 'Write fora do vault passa', tool: 'Write', input: { file_path: 'C:\\Temp\\x.md', content: 'x' }, espera: 'allow' },
  // SENSÍVEL e FONTE-DE-TAREFAS
  { nome: 'CPF válido em nota bloqueia', tool: 'Write', input: { file_path: `${V}00 - INBOX\\c.md`, content: `CPF ${CPF_VALIDO}` }, espera: 'deny' },
  { nome: 'CPF sem máscara bloqueia', tool: 'Edit', input: { file_path: `${V}02 - ÁREAS\\Trabalho\\nota existente.md`, old_string: 'a', new_string: CPF_SEM_MASCARA }, espera: 'deny' },
  { nome: 'número com dígito errado passa', tool: 'Write', input: { file_path: `${V}00 - INBOX\\c.md`, content: `id ${CPF_INVALIDO}` }, espera: 'allow' },
  { nome: 'tarefa nova com due vazio bloqueia', tool: 'Write', input: { file_path: `${V}06 - TAREFAS\\Tarefas\\x.md`, content: tarefa('status: open\ndue:') }, espera: 'deny' },
  { nome: 'tarefa nova sem linha due bloqueia', tool: 'Write', input: { file_path: `${V}06 - TAREFAS\\Tarefas\\x.md`, content: tarefa('status: open') }, espera: 'deny' },
  { nome: 'tarefa nova com due passa', tool: 'Write', input: { file_path: `${V}06 - TAREFAS\\Tarefas\\x.md`, content: tarefa('status: open\ndue: 2026-11-09\nprazo_padrao: true') }, espera: 'allow' },
  { nome: 'tarefa concluída sem due passa', tool: 'Write', input: { file_path: `${V}06 - TAREFAS\\Tarefas\\y.md`, content: tarefa('status: done\ncompletedDate: 2026-11-06') }, espera: 'allow' },
  { nome: 'Edit que esvazia o due bloqueia', tool: 'Edit', input: { file_path: `${V}06 - TAREFAS\\Tarefas\\x.md`, old_string: 'due: 2026-11-09', new_string: 'due:' }, espera: 'deny' },
  { nome: 'Edit que muda o due passa', tool: 'Edit', input: { file_path: `${V}06 - TAREFAS\\Tarefas\\x.md`, old_string: 'due: 2026-11-09', new_string: 'due: 2026-11-10' }, espera: 'allow' },
  { nome: 'Edit que apaga a linha due bloqueia', tool: 'Edit', input: { file_path: `${V}06 - TAREFAS\\Tarefas\\x.md`, old_string: 'due: 2026-11-09\n', new_string: '' }, espera: 'deny' },
  { nome: 'Edit que apaga a linha due com tags em fluxo bloqueia', tool: 'Edit', input: { file_path: `${V}06 - TAREFAS\\Tarefas\\x.md`, old_string: 'status: open\ndue: 2026-11-09\ntags: [task]', new_string: 'status: open\ntags: [task]' }, espera: 'deny' },
  { nome: 'Edit que apaga a linha due de tarefa recorrente bloqueia', tool: 'Edit', input: { file_path: `${V}06 - TAREFAS\\Tarefas\\Teste — recorrência.md`, old_string: 'due: 2026-12-01\nrecurrence: X\n', new_string: 'recurrence: X\n' }, espera: 'deny' },
  { nome: 'Edit que apaga o due de tarefa em bloco bloqueia', tool: 'Edit', input: { file_path: `${V}06 - TAREFAS\\Tarefas\\Teste — recorrência.md`, old_string: 'due: 2026-12-01\ntags:\n  - task\n', new_string: 'tags:\n  - task\n' }, espera: 'deny' },
  { nome: 'Edit que apaga o due de tarefa concluída passa', tool: 'Edit', input: { file_path: `${V}06 - TAREFAS\\Tarefas\\y.md`, old_string: 'status: done\ndue: 2026-11-09', new_string: 'status: done' }, espera: 'allow' },
  { nome: 'Edit que cancela e apaga o due passa', tool: 'Edit', input: { file_path: `${V}06 - TAREFAS\\Tarefas\\x.md`, old_string: 'status: open\ndue: 2026-11-09', new_string: 'status: cancelled' }, espera: 'allow' },
  { nome: 'Edit que reabre e apaga o due bloqueia', tool: 'Edit', input: { file_path: `${V}06 - TAREFAS\\Tarefas\\y.md`, old_string: 'status: done\ndue: 2026-11-09', new_string: 'status: open' }, espera: 'deny' },
  { nome: 'Edit que apaga due de nota sem tag task (fluxo) passa', tool: 'Edit', input: { file_path: `${V}06 - TAREFAS\\Tarefas\\_rascunho.md`, old_string: 'tags: [nota]\ndue: 2026-11-09', new_string: 'tags: [nota]' }, espera: 'allow' },
  { nome: 'Edit que apaga due de nota sem tag task (bloco) passa', tool: 'Edit', input: { file_path: `${V}06 - TAREFAS\\Tarefas\\_rascunho.md`, old_string: 'tags:\n  - nota\ndue: 2026-11-09', new_string: 'tags:\n  - nota' }, espera: 'allow' },
  { nome: 'Edit que apaga due fora da pasta de tarefas passa', tool: 'Edit', input: { file_path: `${V}02 - ÁREAS\\Trabalho\\nota existente.md`, old_string: 'due: 2026-11-09\n', new_string: '' }, espera: 'allow' },
  { nome: 'aceita Write de tarefa recorrente com due', tool: 'Write', input: { file_path: `${V}06 - TAREFAS\\Tarefas\\Teste — recorrência.md`, content: REGRAVADA }, espera: 'allow' },
  { nome: 'Write de tarefa recorrente sem a linha due bloqueia', tool: 'Write', input: { file_path: `${V}06 - TAREFAS\\Tarefas\\Teste — recorrência.md`, content: REGRAVADA.replace(/^due:.*\n/m, '') }, espera: 'deny' },
  { nome: 'nota sem tag task na pasta passa', tool: 'Write', input: { file_path: `${V}06 - TAREFAS\\Tarefas\\_rascunho.md`, content: '---\ntags: [nota]\n---\nx' }, espera: 'allow' },
  { nome: 'telefone em memory/ bloqueia', tool: 'Edit', input: { file_path: `${V}memory\\fatos.md`, old_string: 'a', new_string: `tel ${TELEFONE}` }, espera: 'deny' },
  { nome: 'telefone no memory.md bloqueia', tool: 'Edit', input: { file_path: `${V}memory.md`, old_string: 'a', new_string: `tel ${TELEFONE}` }, espera: 'deny' },
  { nome: 'telefone no CLAUDE.md bloqueia', tool: 'Edit', input: { file_path: `${V}CLAUDE.md`, old_string: 'a', new_string: TELEFONE_DDI }, espera: 'deny' },
  { nome: 'telefone em nota comum passa', tool: 'Edit', input: { file_path: `${V}02 - ÁREAS\\Trabalho\\nota existente.md`, old_string: 'a', new_string: TELEFONE }, espera: 'allow' },
  { nome: 'data em memory/ passa', tool: 'Edit', input: { file_path: `${V}memory\\sessoes.md`, old_string: 'a', new_string: '### 2026-10-27 09:08 — sessão' }, espera: 'allow' },
  { nome: '.env bloqueia', tool: 'Write', input: { file_path: `${V}.env`, content: 'X=1' }, espera: 'deny' },
  { nome: '.env fora do vault bloqueia', tool: 'Write', input: { file_path: 'C:\\Projeto\\.env.local', content: 'X=1' }, espera: 'deny' },
  { nome: '.credentials.json bloqueia', tool: 'Write', input: { file_path: 'C:\\Temp\\.credentials.json', content: '{}' }, espera: 'deny' },
  // Shell
  { nome: 'rm no vault pergunta', tool: 'Bash', input: { command: 'rm "/c/Cofre/Vault/00 - INBOX/x.md"' }, espera: 'ask' },
  { nome: 'mv depois de && pergunta', tool: 'Bash', input: { command: 'cd /tmp && mv a b' }, espera: 'ask' },
  { nome: 'rm absoluto fora do vault passa', tool: 'Bash', input: { command: 'rm "/c/Temp/scratchpad/a.md"' }, espera: 'allow' },
  { nome: 'rm -rf em /tmp passa', tool: 'Bash', input: { command: 'rm -rf /tmp/teste' }, espera: 'allow' },
  { nome: 'Remove-Item fora do vault passa', tool: 'PowerShell', input: { command: 'Remove-Item -Recurse "C:\\Temp\\lixo"' }, espera: 'allow' },
  { nome: 'rm misto pergunta', tool: 'Bash', input: { command: 'rm /tmp/a "C:\\Cofre\\Vault\\00 - INBOX\\b.md"' }, espera: 'ask' },
  { nome: 'rm relativo pergunta', tool: 'Bash', input: { command: 'rm "00 - INBOX/x.md"' }, espera: 'ask' },
  { nome: 'rm com variável pergunta', tool: 'Bash', input: { command: 'rm -rf "$D/guarda"' }, espera: 'ask' },
  { nome: 'xargs rm pergunta', tool: 'Bash', input: { command: 'find /tmp -name x | xargs rm' }, espera: 'ask' },
  { nome: 'Remove-Item relativo pergunta', tool: 'PowerShell', input: { command: 'Remove-Item -Recurse x' }, espera: 'ask' },
  { nome: 'git rm pergunta', tool: 'Bash', input: { command: 'git rm nota.md' }, espera: 'ask' },
  { nome: 'git clean pergunta', tool: 'Bash', input: { command: 'git clean -fd' }, espera: 'ask' },
  { nome: 'git reset --hard pergunta', tool: 'Bash', input: { command: 'git reset --hard HEAD~1' }, espera: 'ask' },
  { nome: 'commit --amend pergunta', tool: 'Bash', input: { command: 'git commit --amend -m x' }, espera: 'ask' },
  { nome: 'git push --force bloqueia', tool: 'Bash', input: { command: 'git push --force origin main' }, espera: 'deny' },
  { nome: 'git push -f bloqueia', tool: 'Bash', input: { command: 'git push -f' }, espera: 'deny' },
  { nome: 'filter-branch bloqueia', tool: 'Bash', input: { command: 'git filter-branch --tree-filter x' }, espera: 'deny' },
  { nome: 'sed -i no CLAUDE.md pergunta', tool: 'Bash', input: { command: 'sed -i "s/a/b/" "/c/Cofre/Vault/CLAUDE.md"' }, espera: 'ask' },
  { nome: 'redirecionar para _DECISOES pergunta', tool: 'Bash', input: { command: 'echo x >> "/c/Cofre/Vault/02 - ÁREAS/Segundo Cérebro/_DECISOES.md"' }, espera: 'ask' },
  { nome: 'redirecionar para VERSION pergunta', tool: 'Bash', input: { command: 'echo 1.0.0 > VERSION' }, espera: 'ask' },
  { nome: 'grep com 2>/dev/null passa', tool: 'Bash', input: { command: 'grep -rn "x" CLAUDE.md 2>/dev/null | head' }, espera: 'allow' },
  { nome: 'git status passa', tool: 'Bash', input: { command: 'git status --short' }, espera: 'allow' },
  { nome: 'git push simples passa', tool: 'Bash', input: { command: 'git push origin main' }, espera: 'allow' },
  { nome: 'script de plugins do /instalar passa (Bash)', tool: 'Bash', input: { command: 'powershell -NoProfile -ExecutionPolicy Bypass -File ".claude/skills/instalar/plugins.ps1"' }, espera: 'allow' },
  { nome: 'script de plugins do /instalar passa (PowerShell)', tool: 'PowerShell', input: { command: 'pwsh -NoProfile -File .claude\\skills\\instalar\\plugins.ps1' }, espera: 'allow' },
  { nome: 'Write de arquivo novo em .obsidian/plugins passa', tool: 'Write', input: { file_path: `${V}.obsidian\\plugins\\dataview\\data.json`, content: '{}' }, espera: 'allow' },
  { nome: 'grep -rn não confunde com rm', tool: 'Bash', input: { command: 'grep -rn perform arquivo.md' }, espera: 'allow' },
  // ATUALIZAÇÃO: aplicar e desfazer pedem uma confirmação; comparar só lê
  ...(['Bash', 'PowerShell'] as const).flatMap((tool): Caso[] => [
    { nome: `aplicar.ps1 pergunta (${tool})`, tool, input: { command: `${PS} ${APLICAR} -Raiz . -Plano .segundo-cerebro/preparo/v1.1.0/plano.json -Release .segundo-cerebro/preparo/v1.1.0/origem/segundo-cerebro.release.json` }, espera: 'ask', motivo: 'ATUALIZAÇÃO' },
    { nome: `desfazer.ps1 pergunta (${tool})`, tool, input: { command: `${PS} ${DESFAZER} -Raiz .` }, espera: 'ask', motivo: 'ATUALIZAÇÃO' },
    { nome: `aplicar.ps1 -GravarBase pergunta (${tool})`, tool, input: { command: `${PS} ${APLICAR} -Raiz . -GravarBase` }, espera: 'ask', motivo: 'ATUALIZAÇÃO' },
    { nome: `comparar.ps1 passa (${tool})`, tool, input: { command: `${PS} .claude/skills/atualizar/comparar.ps1 -Raiz . -Origem .segundo-cerebro/preparo/v1.1.0/origem` }, espera: 'allow' },
    // baixar só grava o zip no preparo: nem ATUALIZAÇÃO nem recusa
    { nome: `baixar.ps1 passa (${tool})`, tool, input: { command: `${PS} .claude/skills/atualizar/baixar.ps1 -Destino .segundo-cerebro/preparo` }, espera: 'allow' },
    { nome: `baixar.ps1 com -Versao passa (${tool})`, tool, input: { command: `${PS} .claude/skills/atualizar/baixar.ps1 -Destino .segundo-cerebro/preparo -Versao 1.1.0` }, espera: 'allow' },
  ]),
  { nome: 'aplicar.ps1 com .\\ e barra invertida pergunta', tool: 'PowerShell', input: { command: 'pwsh -File .\\.claude\\skills\\atualizar\\aplicar.ps1 -Raiz .' }, espera: 'ask', motivo: 'ATUALIZAÇÃO' },
  { nome: 'desfazer.ps1 com ./ pergunta', tool: 'Bash', input: { command: 'pwsh -File ./.claude/skills/atualizar/desfazer.ps1 -Raiz .' }, espera: 'ask', motivo: 'ATUALIZAÇÃO' },
  { nome: 'cd na pasta e ./aplicar.ps1 pergunta', tool: 'Bash', input: { command: 'cd .claude/skills/atualizar; ./aplicar.ps1 -Raiz .' }, espera: 'ask', motivo: 'ATUALIZAÇÃO' },
  { nome: 'Set-Location e .\\desfazer.ps1 pergunta', tool: 'PowerShell', input: { command: 'Set-Location .claude\\skills\\atualizar; .\\desfazer.ps1 -Raiz .' }, espera: 'ask', motivo: 'ATUALIZAÇÃO' },
  { nome: 'aplicar.ps1 com caminho absoluto pergunta', tool: 'PowerShell', input: { command: `pwsh -File ${V}.claude\\skills\\atualizar\\aplicar.ps1 -Raiz .` }, espera: 'ask', motivo: 'ATUALIZAÇÃO' },
  { nome: 'cd na pasta e comparar.ps1 passa', tool: 'Bash', input: { command: 'cd .claude/skills/atualizar; ./comparar.ps1 -Raiz .' }, espera: 'allow' },
  { nome: 'preparo/../../CLAUDE.md pergunta', tool: 'Write', input: { file_path: '.segundo-cerebro/preparo/../../CLAUDE.md', content: 'x' }, espera: 'ask', motivo: 'GRAVAÇÃO' },
  { nome: 'preparo/../../CLAUDE.md absoluto pergunta', tool: 'Write', input: { file_path: `${V}.segundo-cerebro\\preparo\\..\\..\\CLAUDE.md`, content: 'x' }, espera: 'ask', motivo: 'GRAVAÇÃO' },
  { nome: 'preparo/../../_docs/x.md pergunta', tool: 'Write', input: { file_path: '.segundo-cerebro/preparo/../../_docs/x.md', content: 'x' }, espera: 'ask', motivo: 'GRAVAÇÃO' },
  { nome: 'preparo/../../.claude da Guarda pergunta', tool: 'Write', input: { file_path: `${V}.segundo-cerebro\\preparo\\..\\..\\.claude\\skills\\guarda-constituicao\\hooks\\register.ts`, content: 'x' }, espera: 'ask', motivo: 'GRAVAÇÃO' },
  { nome: 'notas/../_docs/x.md pergunta', tool: 'Write', input: { file_path: 'notas/../_docs/x.md', content: 'x' }, espera: 'ask', motivo: 'GRAVAÇÃO' },
  { nome: 'pwsh -Command & {./aplicar.ps1} pergunta', tool: 'PowerShell', input: { command: 'pwsh -Command "& {./aplicar.ps1 -Raiz .}"' }, espera: 'ask', motivo: 'ATUALIZAÇÃO' },
  { nome: '$(./aplicar.ps1) pergunta', tool: 'Bash', input: { command: 'x=$(./aplicar.ps1 -Raiz .)' }, espera: 'ask', motivo: 'ATUALIZAÇÃO' },
  { nome: 'preparo/../../../vault/_docs/x.md não é isento', tool: 'Write', input: { file_path: '.segundo-cerebro/preparo/../../../vault/_docs/x.md', content: 'x' }, espera: 'ask', motivo: 'GRAVAÇÃO' },
  { nome: 'Write em preparo/ passa', tool: 'Write', input: { file_path: `${V}.segundo-cerebro\\preparo\\v1.1.0\\mesclados\\CLAUDE.md`, content: 'x' }, espera: 'allow' },
  { nome: 'Edit em base/ pergunta', tool: 'Edit', input: { file_path: `${V}.segundo-cerebro\\base\\_docs\\Manual do Segundo Cérebro.md`, old_string: 'a', new_string: 'b' }, espera: 'ask', motivo: 'GRAVAÇÃO' },
  { nome: 'Write em backup/ pergunta', tool: 'Write', input: { file_path: `${V}.segundo-cerebro\\backup\\x\\backup.json`, content: '{}' }, espera: 'ask', motivo: 'GRAVAÇÃO' },
  { nome: 'Write no CLAUDE.md da raiz continua perguntando (GRAVAÇÃO)', tool: 'Write', input: { file_path: `${V}CLAUDE.md`, content: 'x' }, espera: 'ask', motivo: 'GRAVAÇÃO' },
  // Comando composto: o motivo mais grave aparece, e a atualização é citada junto
  { nome: 'aplicar.ps1 seguido de Remove-Item mostra DESTRUTIVO e a atualização', tool: 'PowerShell', input: { command: `${PS} ${APLICAR} -Raiz . -Plano p.json -Release r.json; Remove-Item -Recurse _docs` }, espera: 'ask', motivo: 'DESTRUTIVO', tambem: ['atualização'] },
  { nome: 'aplicar.ps1 seguido de Set-Content mostra GRAVAÇÃO e a atualização', tool: 'PowerShell', input: { command: `${PS} ${APLICAR} -Raiz . -Plano p.json -Release r.json; Set-Content CLAUDE.md x` }, espera: 'ask', motivo: 'GRAVAÇÃO', tambem: ['atualização'] },
  { nome: 'aplicar.ps1 -GravarBase não diz listada no plano', tool: 'PowerShell', input: { command: 'aplicar.ps1 -Raiz . -GravarBase' }, espera: 'ask', motivo: 'ATUALIZAÇÃO', semMotivo: 'listada no plano' },
  // Nome do script depois de :, ; ou = (sem ./)
  { nome: 'pwsh -File:aplicar.ps1 pergunta', tool: 'PowerShell', input: { command: 'pwsh -File:aplicar.ps1 -Raiz .' }, espera: 'ask', motivo: 'ATUALIZAÇÃO' },
  { nome: 'x=$(aplicar.ps1) sem ./ pergunta', tool: 'Bash', input: { command: 'x=$(aplicar.ps1 -Raiz .)' }, espera: 'ask', motivo: 'ATUALIZAÇÃO' },
  { nome: '& {aplicar.ps1} sem ./ pergunta', tool: 'PowerShell', input: { command: 'pwsh -Command "& {aplicar.ps1 -Raiz .}"' }, espera: 'ask', motivo: 'ATUALIZAÇÃO' },
  { nome: 'echo a;aplicar.ps1 pergunta', tool: 'Bash', input: { command: 'echo a;aplicar.ps1 -Raiz .' }, espera: 'ask', motivo: 'ATUALIZAÇÃO' },
  { nome: 'x=aplicar.ps1 pergunta', tool: 'Bash', input: { command: 'x=aplicar.ps1' }, espera: 'ask', motivo: 'ATUALIZAÇÃO' },
  { nome: 'nao-aplicar.ps1 passa', tool: 'Bash', input: { command: 'nao-aplicar.ps1 -Raiz .' }, espera: 'allow' },
  // Conectores: regra genérica por verbo no nome da ferramenta
  { nome: 'conector send pergunta', tool: `${CONECTOR}send_message`, input: {}, espera: 'ask' },
  { nome: 'conector com prefixo e verbo pergunta', tool: `${CONECTOR}servico_send_mail`, input: {}, espera: 'ask' },
  { nome: 'conector delete pergunta', tool: `${CONECTOR}delete_item`, input: {}, espera: 'ask' },
  { nome: 'conector com prefixo e verbo com hífen pergunta', tool: `${CONECTOR}app-create-item`, input: {}, espera: 'ask' },
  { nome: 'conector claude_ai update pergunta', tool: 'mcp__claude_ai_Servico__update_event', input: {}, espera: 'ask' },
  { nome: 'conector busca passa', tool: `${CONECTOR}search_items`, input: {}, espera: 'allow' },
  { nome: 'conector leitura passa', tool: `${CONECTOR}get_item`, input: {}, espera: 'allow' },
  { nome: 'MCP local passa', tool: 'mcp__ferramentas-locais__ferramenta_local', input: {}, espera: 'allow' },
  { nome: 'Read passa', tool: 'Read', input: { file_path: `${V}CLAUDE.md` }, espera: 'allow' },
]

// O motor, abaixo do mod: libera tudo e responde fs.exists pela lista.
function motor(on: Parameters<Parameters<typeof test>[1]>[1], existentes: Set<string>) {
  on('tool.check', () => ({ decision: 'allow' }))
  on('fs.exists', (_, e) => ({ value: existentes.has(comoNoDisco(e.path)) }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('command.register', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
}

for (const c of CASOS) {
  test(c.nome, async ($, on) => {
    motor(on, EXISTENTES)
    await $.session.start({ cwd: RAIZ, surface: null, isInteractive: true })
    const r = await $.tool.check({ tool: c.tool, input: c.input })
    expect(r.decision).toBe(c.espera)
    if (c.espera !== 'allow') expect(r.reason ?? '').toContain('Constituição')
    if (c.motivo) expect(r.reason ?? '').toContain(c.motivo)
    for (const t of c.tambem ?? []) expect(r.reason ?? '').toContain(t)
    if (c.semMotivo) expect(r.reason ?? '').not.toContain(c.semMotivo)
  })
}

test('raiz sem manifesto: guarda inerte e avisa', async ($, on) => {
  const avisos: string[] = []
  on('tool.check', () => ({ decision: 'allow' }))
  on('fs.exists', () => ({ value: false }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', (_, e) => {
    avisos.push(String((e as { text?: unknown }).text ?? ''))
    return { value: undefined }
  })
  on('command.register', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: 'C:\\Cofre\\Vault\\01 - PROJETOS\\subpasta', surface: null, isInteractive: true })
  const r = await $.tool.check({ tool: 'Edit', input: { file_path: `${V}CLAUDE.md`, old_string: 'a', new_string: 'b' } })
  expect(r.decision).toBe('allow')
  const push = await $.tool.check({ tool: 'Bash', input: { command: 'git push --force' } })
  expect(push.decision).toBe('allow')
  expect(avisos.join(' ')).toContain('Guarda inativa')
})

test('veredito puro: raiz vazia devolve null (inerte)', () => {
  expect(veredito('Edit', { file_path: `${V}CLAUDE.md`, old_string: 'a', new_string: 'b' }, '', 0)).toBe(null)
  expect(veredito('Bash', { command: 'git push --force' }, '', 0)).toBe(null)
})

test('veredito puro: raiz com barra final e caminho em barra invertida', () => {
  const v = veredito('Edit', { file_path: `${V}CLAUDE.md`, old_string: 'a', new_string: 'b' }, `${RAIZ}\\`, 0)
  expect(v?.decision).toBe('ask')
  const d = veredito('Write', { file_path: `${V}00 - INBOX\\c.md`, content: `CPF ${CPF_VALIDO}` }, RAIZ, 0)
  expect(d?.decision).toBe('deny')
})

test('/guarda liberar suspende ask por 1 hora, não suspende deny; travar encerra', () => {
  const t0 = Date.UTC(2026, 9, 27, 15, 0)
  const editar = { file_path: `${V}CLAUDE.md`, old_string: 'a', new_string: 'b' }
  const empurrar = { command: 'git push --force origin main' }
  expect(comandoLiberacao('liberar', 'plugin', t0) ?? '').toContain('só vale digitado pela pessoa')
  expect(liberado(t0)).toBe(false)
  expect(comandoLiberacao('liberar', 'task-notification', t0) ?? '').toContain('só vale digitado pela pessoa')
  expect(veredito('Edit', editar, RAIZ, t0)?.decision).toBe('ask')
  expect(comandoLiberacao('liberar', 'composer', t0) ?? '').toContain('Confirmações suspensas')
  expect(veredito('Edit', editar, RAIZ, t0 + 1)).toBe(null)
  expect(veredito('Bash', empurrar, RAIZ, t0 + 1)?.decision).toBe('deny')
  expect(liberado(t0 + LIBERACAO_MS - 1)).toBe(true)
  expect(veredito('Edit', editar, RAIZ, t0 + LIBERACAO_MS)?.decision).toBe('ask')
  expect(comandoLiberacao('travar', 'composer', t0) ?? '').toContain('travada')
  expect(veredito('Edit', editar, RAIZ, t0 + 1)?.decision).toBe('ask')
  expect(comandoLiberacao('', 'composer', t0)).toBe(null)
})

test('recusa do motor prevalece sobre a pergunta do mod', async ($, on) => {
  on('tool.check', () => ({ decision: 'deny', reason: 'regra do motor' }))
  on('fs.exists', (_, e) => ({ value: comoNoDisco(e.path) === MANIFESTO }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('command.register', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: RAIZ, surface: null, isInteractive: true })
  const r = await $.tool.check({ tool: 'Edit', input: { file_path: `${V}CLAUDE.md`, old_string: 'a', new_string: 'b' } })
  expect(r.decision).toBe('deny')
  expect(r.reason).toBe('regra do motor')
})

// Modo avulso: a Guarda instalada sozinha, num vault sem o framework.
const NOTAS = 'C:\\Cofre\\Notas'
const N = `${NOTAS}\\`

test('modo: completo com manifesto, avulso dentro da pasta configurada, inerte fora', () => {
  expect(modo('C:/Cofre/Vault', '', true)).toBe('completo')
  expect(modo('C:/Cofre/Notas', 'C:/Cofre/Notas', false)).toBe('avulso')
  expect(modo('C:/Cofre/Notas/sub', 'C:/Cofre/Notas', false)).toBe('avulso')
  expect(modo('C:/Codigo/app', 'C:/Cofre/Notas', false)).toBe('inerte')
  expect(modo('C:/Cofre/Notas', '', false)).toBe('inerte')
})

test('configAvulsa: padrões e listas separadas por ; ou quebra de linha', () => {
  const p = configAvulsa({})
  expect(p.governanca).toEqual(['claude.md', 'agents.md', '.claude/'])
  expect(p.sempreLidos).toEqual(['claude.md'])
  expect(p.pastaTarefas).toBe(null)
  expect(p.completo).toBe(false)
  expect(configAvulsa({ governanca: ' _docs/ ; Regras.md ' }).governanca).toEqual(['_docs/', 'regras.md', 'claude.md', '.claude/'])
  expect(configAvulsa({ pasta_tarefas: 'Tarefas' }).pastaTarefas).toBe('tarefas/')
})

test('modo avulso com os padrões: valem as recusas e a governança padrão; não valem as regras do framework', () => {
  const c = configAvulsa({})
  const v = (tool: string, input: Record<string, unknown>) => veredito(tool, input, NOTAS, 0, c)
  const claude = v('Write', { file_path: `${N}CLAUDE.md`, content: 'x' })
  expect(claude?.decision).toBe('ask')
  expect(claude?.reason ?? '').toContain('GRAVAÇÃO')
  expect(v('Write', { file_path: `${N}_docs\\x.md`, content: 'x' })).toBe(null)
  const cpf = v('Write', { file_path: `${N}notas\\c.md`, content: `CPF ${CPF_VALIDO}` })
  expect(cpf?.decision).toBe('deny')
  expect(cpf?.reason ?? '').toContain('SENSÍVEL')
  expect(v('Write', { file_path: `${N}.env`, content: 'X=1' })?.decision).toBe('deny')
  expect(v('Bash', { command: 'git push --force' })?.decision).toBe('deny')
  const rm = v('Bash', { command: 'rm notas/x.md' })
  expect(rm?.decision).toBe('ask')
  expect(rm?.reason ?? '').toContain('DESTRUTIVO')
  expect(v('Write', { file_path: `${N}06 - TAREFAS\\Tarefas\\x.md`, content: tarefa('status: open') })).toBe(null)
  expect(v('PowerShell', { command: `${PS} ${APLICAR} -Raiz .` })).toBe(null)
  expect(v('Write', { file_path: `${N}.segundo-cerebro\\base\\x.md`, content: 'x' })).toBe(null)
})

test('modo avulso com governança e pasta de tarefas indicadas', () => {
  const c = configAvulsa({ governanca: '_docs/', pasta_tarefas: 'Tarefas' })
  const v = (tool: string, input: Record<string, unknown>) => veredito(tool, input, NOTAS, 0, c)
  expect(v('Write', { file_path: `${N}_docs\\x.md`, content: 'x' })?.decision).toBe('ask')
  const t = v('Write', { file_path: `${N}Tarefas\\x.md`, content: tarefa('status: open') })
  expect(t?.decision).toBe('deny')
  expect(t?.reason ?? '').toContain('FONTE-DE-TAREFAS')
  const sc = v('PowerShell', { command: 'Set-Content _docs/x.md y' })
  expect(sc?.decision).toBe('ask')
  expect(sc?.reason ?? '').toContain('GRAVAÇÃO')
})

test('sessão avulsa: dentro da pasta configurada a Guarda age pelas opções', { options: { vault: NOTAS, governanca: '_docs/' } }, async ($, on) => {
  motor(on, new Set())
  await $.session.start({ cwd: `${N}sub`, surface: null, isInteractive: true })
  const docs = await $.tool.check({ tool: 'Write', input: { file_path: `${N}_docs\\x.md`, content: 'x' } })
  expect(docs.decision).toBe('ask')
  expect(docs.reason ?? '').toContain('GRAVAÇÃO')
  // CLAUDE.md e .claude/ ficam protegidos mesmo com lista própria.
  const claude = await $.tool.check({ tool: 'Write', input: { file_path: `${N}CLAUDE.md`, content: 'x' } })
  expect(claude.decision).toBe('ask')
  expect(claude.reason ?? '').toContain('GRAVAÇÃO')
  const aplicar = await $.tool.check({ tool: 'PowerShell', input: { command: `${PS} ${APLICAR} -Raiz .` } })
  expect(aplicar.decision).toBe('allow')
})

test('sessão avulsa: fora da pasta configurada a Guarda fica inerte', { options: { vault: NOTAS } }, async ($, on) => {
  motor(on, new Set())
  await $.session.start({ cwd: 'C:\\Codigo\\app', surface: null, isInteractive: true })
  const rm = await $.tool.check({ tool: 'Bash', input: { command: 'rm src/x.ts' } })
  expect(rm.decision).toBe('allow')
  const claude = await $.tool.check({ tool: 'Write', input: { file_path: 'C:\\Codigo\\app\\CLAUDE.md', content: 'x' } })
  expect(claude.decision).toBe('allow')
})

// Correção 1
test('modo: manifesto na pasta da sessão vence a "Pasta do vault" preenchida', () => {
  expect(modo('C:/Cofre/Vault', 'C:/Cofre/Notas', true)).toBe('completo')
})

test('sessão no vault completo com "Pasta do vault" apontando para outra pasta: modo completo', { options: { vault: NOTAS } }, async ($, on) => {
  motor(on, EXISTENTES)
  await $.session.start({ cwd: RAIZ, surface: null, isInteractive: true })
  const claude = await $.tool.check({ tool: 'Edit', input: { file_path: `${V}CLAUDE.md`, old_string: 'a', new_string: 'b' } })
  expect(claude.decision).toBe('ask')
  expect(claude.reason ?? '').toContain('GRAVAÇÃO')
  const aplicar = await $.tool.check({ tool: 'PowerShell', input: { command: `${PS} ${APLICAR} -Raiz .` } })
  expect(aplicar.reason ?? '').toContain('ATUALIZAÇÃO')
})

test('"Pasta do vault" preenchida e sessão fora: nenhum aviso', { options: { vault: NOTAS } }, async ($, on) => {
  const avisos: string[] = []
  on('tool.check', () => ({ decision: 'allow' }))
  // A pasta configurada existe (sem ela, o aviso de pasta inexistente aparece).
  on('fs.exists', (_, e) => ({ value: comoNoDisco(e.path) === NOTAS }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', (_, e) => {
    avisos.push(String((e as { text?: unknown }).text ?? ''))
    return { value: undefined }
  })
  on('command.register', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: 'C:\\Codigo\\app', surface: null, isInteractive: true })
  expect(avisos).toEqual([])
  const { text } = await $.command.run({ command: 'guarda' })
  expect(text ?? '').toContain('Guarda inativa')
})

test('configAvulsa: absoluta dentro da raiz vira relativa; .. e absoluta fora são descartadas', () => {
  const o = { governanca: `${N}_docs\\; ../fora.md; D:\\Outro\\x.md; Regras.md`, pasta_tarefas: `${N}Tarefas` }
  const c = configAvulsa(o, NOTAS)
  expect(c.governanca).toEqual(['_docs/', 'regras.md', 'claude.md', '.claude/'])
  expect(c.pastaTarefas).toBe('tarefas/')
  expect(entradasDescartadas(o, NOTAS)).toEqual(['../fora.md', 'D:\\Outro\\x.md'])
  expect(configAvulsa({ pasta_tarefas: '../Tarefas' }, NOTAS).pastaTarefas).toBe(null)
})

test('/guarda avulso mostra pasta e arquivo de cada entrada e as descartadas', { options: { vault: NOTAS, governanca: '_docs/; regras.md; ../x.md' } }, async ($, on) => {
  motor(on, new Set())
  await $.session.start({ cwd: NOTAS, surface: null, isInteractive: true })
  const { text } = await $.command.run({ command: 'guarda' })
  expect(text ?? '').toContain('_docs/ (pasta)')
  expect(text ?? '').toContain('regras.md (arquivo)')
  expect(text ?? '').toContain('Descartadas')
  expect(text ?? '').toContain('../x.md')
})

// Correção 2: a "Pasta do vault" com manifesto só vale como raiz completa com a sessão dentro dela.
const VAULT_CONFIGURADO = { options: { vault: RAIZ } }

test('"Pasta do vault" é um vault completo e a sessão está fora: inerte, sem aviso', VAULT_CONFIGURADO, async ($, on) => {
  const avisos: string[] = []
  on('tool.check', () => ({ decision: 'allow' }))
  on('fs.exists', (_, e) => ({ value: comoNoDisco(e.path) === RAIZ || EXISTENTES.has(comoNoDisco(e.path)) }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', (_, e) => {
    avisos.push(String((e as { text?: unknown }).text ?? ''))
    return { value: undefined }
  })
  on('command.register', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: 'C:\\Codigo\\app', surface: null, isInteractive: true })
  const rm = await $.tool.check({ tool: 'Bash', input: { command: 'rm src/x.ts' } })
  expect(rm.decision).toBe('allow')
  const claude = await $.tool.check({ tool: 'Edit', input: { file_path: `${V}CLAUDE.md`, old_string: 'a', new_string: 'b' } })
  expect(claude.decision).toBe('allow')
  expect(avisos).toEqual([])
  const { text } = await $.command.run({ command: 'guarda' })
  expect(text ?? '').toContain('Guarda inativa')
})

test('"Pasta do vault" é um vault completo e a sessão está numa subpasta: modo completo', VAULT_CONFIGURADO, async ($, on) => {
  motor(on, EXISTENTES)
  await $.session.start({ cwd: 'c:\\cofre\\vault\\02 - ÁREAS', surface: null, isInteractive: true })
  const claude = await $.tool.check({ tool: 'Edit', input: { file_path: `${V}CLAUDE.md`, old_string: 'a', new_string: 'b' } })
  expect(claude.decision).toBe('ask')
  expect(claude.reason ?? '').toContain('GRAVAÇÃO')
})

test('pasta irmã com o mesmo prefixo da "Pasta do vault" completa conta como fora', VAULT_CONFIGURADO, async ($, on) => {
  motor(on, EXISTENTES)
  await $.session.start({ cwd: `${RAIZ}2`, surface: null, isInteractive: true })
  const rm = await $.tool.check({ tool: 'Bash', input: { command: 'rm src/x.ts' } })
  expect(rm.decision).toBe('allow')
})

test('pasta irmã com o mesmo prefixo da "Pasta do vault" avulsa conta como fora', () => {
  expect(modo('C:/Cofre/Notas2', 'C:/Cofre/Notas', false)).toBe('inerte')
  expect(modo('c:\\cofre\\notas\\sub', 'C:/Cofre/Notas', false)).toBe('avulso')
})

// I2: "Pasta do vault" com aspas (como sai de "Copiar como caminho") ou inexistente.
function motorComAvisos(on: Parameters<Parameters<typeof test>[1]>[1], existe: (p: string) => boolean): string[] {
  const avisos: string[] = []
  on('tool.check', () => ({ decision: 'allow' }))
  on('fs.exists', (_, e) => ({ value: existe(comoNoDisco(e.path)) }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', (_, e) => {
    avisos.push(String((e as { text?: unknown }).text ?? ''))
    return { value: undefined }
  })
  on('command.register', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  return avisos
}

for (const [nome, valor] of [['aspas duplas', `"${NOTAS}"`], ['aspas simples', ` '${NOTAS}\\' `]] as const) {
  test(`"Pasta do vault" entre ${nome} funciona como sem aspas`, { options: { vault: valor } }, async ($, on) => {
    const avisos = motorComAvisos(on, p => p === NOTAS)
    await $.session.start({ cwd: `${N}sub`, surface: null, isInteractive: true })
    const claude = await $.tool.check({ tool: 'Write', input: { file_path: `${N}CLAUDE.md`, content: 'x' } })
    expect(claude.decision).toBe('ask')
    expect(claude.reason ?? '').toContain('GRAVAÇÃO')
    expect(avisos).toEqual([])
    const { text } = await $.command.run({ command: 'guarda' })
    expect(text ?? '').toContain('Modo: avulso, no vault C:/Cofre/Notas (opções')
  })
}

test('"Pasta do vault" inexistente: avisa uma vez com o valor configurado', { options: { vault: 'C:\\Cofre\\Notsa' } }, async ($, on) => {
  const avisos = motorComAvisos(on, () => false)
  await $.session.start({ cwd: 'C:\\Codigo\\app', surface: null, isInteractive: true })
  await $.session.start({ cwd: 'C:\\Codigo\\app', surface: null, isInteractive: true })
  expect(avisos.length).toBe(1)
  expect(avisos[0] ?? '').toContain("A 'Pasta do vault' configurada não existe: C:\\Cofre\\Notsa")
})

// I3: lista própria de governança soma-se a CLAUDE.md e .claude/, que ficam sempre.
test('governança própria mantém CLAUDE.md e .claude/', () => {
  const c = configAvulsa({ governanca: '_docs/' }, NOTAS)
  const v = (tool: string, input: Record<string, unknown>) => veredito(tool, input, NOTAS, 0, c)
  expect(v('Write', { file_path: `${N}CLAUDE.md`, content: 'x' })?.decision).toBe('ask')
  expect(v('Write', { file_path: `${N}.claude\\settings.json`, content: '{}' })?.decision).toBe('ask')
  expect(v('Write', { file_path: `${N}_docs\\x.md`, content: 'x' })?.decision).toBe('ask')
  expect(configAvulsa({ governanca: 'CLAUDE.md; .claude/' }).governanca).toEqual(['claude.md', '.claude/'])
})

// M6: o que a Guarda descarta aparece no /guarda.
test('pasta_tarefas: itens além do primeiro e ./ vão para as descartadas', () => {
  const o = { pasta_tarefas: 'Tarefas; Outras' }
  expect(configAvulsa(o, NOTAS).pastaTarefas).toBe('tarefas/')
  expect(entradasDescartadas(o, NOTAS)).toEqual(['Outras'])
  const raiz = { pasta_tarefas: './' }
  expect(configAvulsa(raiz, NOTAS).pastaTarefas).toBe(null)
  expect(entradasDescartadas(raiz, NOTAS)).toEqual(['./'])
})

test('governanca: . e a própria raiz são descartados', () => {
  const o = { governanca: `.; ./; ${N}; _docs/` }
  expect(configAvulsa(o, NOTAS).governanca).toEqual(['_docs/', 'claude.md', '.claude/'])
  expect(entradasDescartadas(o, NOTAS)).toEqual(['.', './', N])
  const c = configAvulsa(o, NOTAS)
  expect(veredito('Bash', { command: 'echo a > notas/x.txt' }, NOTAS, 0, c)).toBe(null)
})

test('/guarda mostra a pasta de tarefas extra entre as descartadas', { options: { vault: NOTAS, pasta_tarefas: 'Tarefas; Outras' } }, async ($, on) => {
  motor(on, new Set([NOTAS]))
  await $.session.start({ cwd: NOTAS, surface: null, isInteractive: true })
  const { text } = await $.command.run({ command: 'guarda' })
  expect(text ?? '').toContain('Descartadas')
  expect(text ?? '').toContain('Outras')
})

test('/guarda liberar sem origem: recusa sem "(origem: )" vazio', () => {
  const r = comandoLiberacao('liberar', '', Date.now()) ?? ''
  expect(r).toContain('só vale digitado pela pessoa')
  expect(r).not.toContain('(origem: )')
  expect(liberado(Date.now())).toBe(false)
})

// CPF de teste com pontuação em volta: ponto final, vírgula, parênteses, fim de linha, lista Markdown.
const CPF_B = '123.456.' + '789-09'
const CPF_B_SEM_MASCARA = '123456' + '78909'
const CPF_B_INVALIDO = '123.456.' + '789-08'
const REPETIDO = '111.111.' + '111-11'

test('temCpf: CPF seguido de pontuação é reconhecido', () => {
  for (const cpf of [CPF_B, CPF_B_SEM_MASCARA]) {
    const textos = [
      `CPF ${cpf}.`,
      `CPF ${cpf}. Outra frase.`,
      `CPF ${cpf}, depois`,
      `CPF ${cpf};`,
      `CPF ${cpf}:`,
      `(CPF ${cpf})`,
      `CPF ${cpf}!`,
      `CPF ${cpf}?`,
      `(${cpf})`,
      `CPF ${cpf}\nlinha seguinte`,
      `CPF ${cpf}\r\nlinha seguinte`,
      `CPF ${cpf}.Fim`,
      `- CPF: ${cpf}.`,
    ]
    for (const t of textos) expect([t, temCpf(t)]).toEqual([t, true])
  }
})

test('temCpf: número colado a dígitos, sequência pontuada maior, inválido e repetido não casam', () => {
  const textos = [
    `1${CPF_B}`,
    `${CPF_B}1`,
    `1${CPF_B_SEM_MASCARA}`,
    `${CPF_B_SEM_MASCARA}1`,
    `1${CPF_B_SEM_MASCARA}1`,
    `1.${CPF_B}.5`,
    `${CPF_B}.12`,
    `id ${CPF_B_INVALIDO}.`,
    `id ${REPETIDO}.`,
  ]
  for (const t of textos) expect([t, temCpf(t)]).toEqual([t, false])
})

test('temCpf: ponto antes só bloqueia se precedido de dígito', () => {
  expect(temCpf(`1.${CPF_B}`)).toBe(false)
  expect(temCpf(`Fim.${CPF_B}`)).toBe(true)
})

test('CPF seguido de ponto em nota é recusado', () => {
  const d = veredito('Write', { file_path: `${V}00 - INBOX\\c.md`, content: `CPF ${CPF_B}.` }, RAIZ, 0)
  expect(d?.decision).toBe('deny')
})
