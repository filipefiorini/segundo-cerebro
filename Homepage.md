![[_assets/banner-homepage.png]]

~~~dataviewjs
const base = "01 - PROJETOS/Em Andamento"
const allFiles = dv.pages('"01 - PROJETOS/Em Andamento"').array()
const projFolders = [...new Set(allFiles.map(p => {
  if (p.file.folder === base) return null
  const top = p.file.folder.slice(base.length + 1).split("/")[0]
  return top ? base + "/" + top : null
}).filter(Boolean))]
const proj = projFolders.slice(0, 6).map(f => ({ file: { name: f.split("/").pop(), path: f } }))
const inbox = dv.pages('"00 - INBOX"')
const galaxy = dv.pages('"05 - GALÁXIA"').where(p => p.file.name != "_INDICE" && !p.exemplo)
const metrics = [
  { label: "Projetos Ativos", value: proj.length, color: "#bd93f9" },
  { label: "Inbox do Vault",  value: inbox.length, color: "#ffb86c" },
  { label: "Notas na Galáxia", value: galaxy.length, color: "#50fa7b" }
]
const cards = metrics.map(m =>
  `<div style="background:#383a59;border-radius:8px;padding:12px 14px">
    <div style="font-size:12px;color:#6272a4;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">${m.label}</div>
    <div style="font-size:28px;font-weight:500;color:${m.color}">${m.value}</div>
  </div>`).join('')
const wrap = this.container.createEl('div')
wrap.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0 20px'
wrap.innerHTML = cards
~~~

~~~dataviewjs
const allPages = dv.pages().where(p => p.file.cday)
const countMap = {}
for (let p of allPages) {
  const key = p.file.cday.toFormat("yyyy-MM-dd")
  countMap[key] = (countMap[key] || 0) + 1
}
const today = dv.luxon.DateTime.now()
const weeks = 26
const days = weeks * 7
const cells = []
for (let i = days - 1; i >= 0; i--) {
  const d = today.minus({ days: i })
  const key = d.toFormat("yyyy-MM-dd")
  const count = countMap[key] || 0
  const colors = ["#383a59","#6272a4","#7c6db5","#bd93f9","#d4b8ff"]
  const c = colors[Math.min(count, 4)]
  cells.push({ key, c, dow: d.weekday % 7 })
}
const wrap = this.container.createEl('div')
wrap.style.cssText = 'background:#282a36;border:0.5px solid #44475a;border-radius:12px;padding:14px 16px;margin:8px 0'
wrap.innerHTML = `<div style="font-size:12px;font-weight:500;color:#6272a4;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:10px">Atividade do vault — últimos 6 meses</div>
<div style="display:flex;gap:3px">${
  Array.from({length: weeks}, (_, w) =>
    `<div style="display:flex;flex-direction:column;gap:3px">${
      Array.from({length: 7}, (_, d) => {
        const idx = w * 7 + d
        const cell = cells[idx]
        return cell
          ? `<div style="width:11px;height:11px;border-radius:2px;background:${cell.c}" title="${cell.key}"></div>`
          : `<div style="width:11px;height:11px;border-radius:2px;background:#282a36"></div>`
      }).join('')
    }</div>`
  ).join('')
}</div>`
~~~

~~~dataviewjs
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const base = "01 - PROJETOS/Em Andamento"
const allFiles = dv.pages('"01 - PROJETOS/Em Andamento"').array()
const projFolders = [...new Set(allFiles.map(p => {
  if (p.file.folder === base) return null
  const top = p.file.folder.slice(base.length + 1).split("/")[0]
  return top ? base + "/" + top : null
}).filter(Boolean))]
const proj = projFolders.slice(0, 6).map(f => ({ file: { name: f.split("/").pop(), path: f } }))
const projHTML = proj.length > 0
  ? proj.map(p =>
    `<div style="padding:7px 0;border-bottom:0.5px solid #44475a;display:flex;align-items:center;gap:8px">
      <div style="width:6px;height:6px;border-radius:50%;background:#bd93f9;flex-shrink:0"></div>
      <a href="${esc(p.file.path)}" class="internal-link" style="font-size:14px;color:#f8f8f2;text-decoration:none">${esc(p.file.name)}</a>
    </div>`).join('')
  : '<span style="font-size:13px;color:#6272a4">Nenhum projeto em andamento</span>'
const hoje = dv.date("today")
const tarefas = dv.pages('"06 - TAREFAS/Tarefas"')
  .where(p => p.status !== "done" && p.due && dv.date(p.due) && dv.date(p.due) <= hoje)
  .sort(p => dv.date(p.due), 'asc')
const tarefHTML = tarefas.length > 0
  ? tarefas.map(p => {
    const due = dv.date(p.due)
    const atrasada = due < hoje
    return `<div style="padding:6px 0;border-bottom:0.5px solid #44475a;display:flex;align-items:center;gap:8px">
      <div style="width:6px;height:6px;border-radius:50%;background:#50fa7b;flex-shrink:0"></div>
      <a href="${esc(p.file.path)}" class="internal-link" style="font-size:14px;color:#f8f8f2;text-decoration:none;flex:1">${esc(p.title || p.file.name)}</a>
      <span style="font-size:12px;color:${atrasada ? '#ff5555' : '#6272a4'}">${due.toFormat("dd/MM")}</span>
    </div>`}).join('')
  : '<span style="font-size:13px;color:#50fa7b">Nada vence hoje ✓</span>'
const panel = (title, color, content, badge) =>
  `<div style="background:#282a36;border:0.5px solid #44475a;border-radius:12px;padding:14px 16px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <span style="font-size:12px;font-weight:500;color:#6272a4;text-transform:uppercase;letter-spacing:0.6px">${title}</span>
      <span style="font-size:10px;padding:2px 7px;border-radius:20px;background:${color}33;color:${color}">${badge}</span>
    </div>
    ${content}
  </div>`
const g1 = this.container.createEl('div')
g1.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:8px 0'
g1.innerHTML = panel('Projetos em Andamento', '#bd93f9', projHTML, proj.length + ' ativos') +
               panel('Tarefas de hoje', '#50fa7b', tarefHTML, tarefas.length + (tarefas.length === 1 ? ' tarefa' : ' tarefas'))
~~~

~~~dataviewjs
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const inbox = dv.pages('"00 - INBOX"').sort(p => p.file.ctime, 'desc')
const wrap = this.container.createEl('div')
wrap.style.cssText = 'background:#282a36;border:0.5px solid #44475a;border-radius:12px;padding:14px 16px;margin:0 0 8px'
wrap.innerHTML = `<div style="font-size:12px;font-weight:500;color:#6272a4;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:10px">Inbox do Vault</div>` +
  (inbox.length === 0
    ? '<span style="font-size:13px;color:#50fa7b">Inbox vazio ✓</span>'
    : inbox.map(p => `<div style="padding:6px 0;border-bottom:0.5px solid #44475a"><a href="${esc(p.file.path)}" class="internal-link" style="font-size:14px;color:#8be9fd;text-decoration:none">${esc(p.file.name)}</a></div>`).join(''))
~~~
