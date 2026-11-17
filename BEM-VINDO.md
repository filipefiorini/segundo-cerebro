---
tags: [vault, segundo-cerebro]
tipo: documentacao
criado: 2026-11-07
status: active
---

![[_assets/banner-segundo-cerebro.png]]

# 👋 Bem-vindo ao seu vault — Segundo Cérebro

**Notas, projetos, tarefas e o que você aprende, num lugar só.** São sete pastas, e quem mantém a ordem, a seu pedido, é o Claude Code.

---

## 🗂️ As sete pastas

O vault tem sete pastas: seis de conteúdo e uma, `06 - TAREFAS`, das tarefas. Na hora de guardar uma nota, o que decide a pasta é o uso que ela vai ter. Um texto sobre finanças pode ir para um projeto, para uma área ou para a Galáxia, conforme o que você pretende fazer com ele.

| Pasta | Recebe |
|---|---|
| **00 - INBOX** | A porta de entrada. Qualquer coisa ainda sem destino cai aqui e sai no próximo processamento. |
| **01 - PROJETOS** | Trabalho que termina, com entrega e critério de pronto. Dividido em Em Andamento e Em Espera. |
| **02 - ÁREAS** | O que você cuida sem data para acabar. As primeiras nascem no `/instalar`. |
| **03 - RECURSOS** | Material de consulta: Fontes (Notas de Literatura) e Procedimentos (SOPs). |
| **04 - ARQUIVO** | Projeto encerrado e nota que perdeu a validade. Sai da frente sem ser apagado. |
| **05 - GALÁXIA** | Síntese sua, que vale além de um projeto, em notas da Galáxia distribuídas em 5 camadas. |
| **06 - TAREFAS** | Uma nota por tarefa em `Tarefas/`, com prazo; as vistas (hoje, semana, kanban) ficam em `Views/`. |

Na dúvida entre duas pastas, pense no próximo uso da nota. Se ainda não sabe, ela fica no INBOX até saber.

---

## 🌌 A Galáxia

A Galáxia guarda conhecimento permanente sintetizado, todo direto em `05 - GALÁXIA/`, em 5 camadas, da mais abstrata à mais concreta. A camada é a propriedade `camada` da nota; as vistas por camada ficam em `Galáxia.base`:

| Camada | Pergunta |
|---|---|
| Filosofias | No que eu acredito? |
| Conceitos | Que nome dou a isto? |
| Frameworks | Quais são as partes e como se ligam? |
| Metodologias | Em que ordem eu faço? |
| Táticas | O que faço nesta situação? |

Critério completo, desempate e exemplos: Manual › A Galáxia.

As Notas de Literatura (livros, vídeos, podcasts, artigos, cursos) ficam em `03 - RECURSOS/Fontes/`.

O fluxo: consumo → Nota de Literatura em `03 - RECURSOS/Fontes/` → Notas da Galáxia, com a `camada` certa → conexões via `[[wikilinks]]`.

---

## ⚙️ Infraestrutura do vault

Além das sete pastas, a raiz tem a infraestrutura do sistema:

- **`memory/`** — memória do Claude Code: fatos, aprendizados e sessões (índice em `memory.md`)
- **`_assets/`** — banners, imagens e anexos locais
- **`_docs/`** — documentação viva do vault (estrutura, ferramentas, taxonomia e [[_docs/O Método|O Método]], o método numa página)
- **`_logs/`** — registros de execução das skills
- **`_templates/`** — os 15 templates centralizados (use via Templater)
- **`.claude/skills/`** — as skills invocáveis pelo Claude Code; `guarda-constituicao/` e `painel-tarefas/` ali são módulos, não skills (ver `_docs/Ferramentas.md` › Módulos)

---

## 🚀 Como começar

1. **Abra a pasta no Claude Code.** No Claude Desktop, entre na aba Code e escolha a pasta deste vault como pasta de trabalho. O Claude lê o `CLAUDE.md` sozinho e conhece a estrutura.
2. **Chame `/instalar`.** Digite `/instalar` (ou deixe o Code chamar sozinho na primeira abertura). Ele instala os plugins do Obsidian (com o Obsidian fechado), pergunta quem você é, grava isso no `CLAUDE.md`, cria suas áreas, traz seus projetos de outras IAs (Claude, ChatGPT, Gemini), ajuda a ligar conectores e plugins do Claude, se você quiser, e ajuda a ligar o backup. Uma etapa por vez, nada gravado sem o seu ok, e dá para parar e continuar depois. É o que deixa o vault com a sua cara.
3. **Um lugar para o que chega.** Ideia, link, print ou trecho de conversa vão para `00 - INBOX`. Uma vez por semana, `/processar-inbox` dá destino a cada item.
4. **A primeira fonte.** A Nota de Literatura do tipo certo (livro, artigo ou vídeo, o que estiver na sua mão hoje) vai para `03 - RECURSOS/Fontes/`; o que valer além dela vira nota na Galáxia pelo `Template de Nota da Galáxia`. O `/processar-conteudo` faz esse caminho com você.
5. **Tarefa com data, gente e conversas.** O `Template de Tarefa` exige prazo, e a tarefa aparece na Homepage no dia em que vence. `Template de Pessoa` para quem importa, `Template de Reunião` para o que foi combinado.

---

> [!tip] Documentação completa
> Consulte `_docs/Manual do Segundo Cérebro.md` para o mapa completo de roteamento de conteúdo e `_docs/Ferramentas.md` para skills, templates e o Mapa de Responsabilidade.
