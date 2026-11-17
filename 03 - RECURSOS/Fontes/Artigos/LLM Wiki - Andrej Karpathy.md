---
tags: [nota-literatura, ai, segundo-cerebro]
tipo: literatura
fonte_tipo: Artigo
fonte_titulo: LLM Wiki
fonte_autor: Andrej Karpathy
fonte_url: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
fonte_data: 2026-04-03
criado: 2026-04-21
status: complete
exemplo: true
---

![[_assets/banner-literatura-artigo.png]]

# 📰 LLM Wiki — Andrej Karpathy

---
## Em uma frase
Em vez de buscar trechos nos documentos a cada pergunta, deixe o LLM construir e manter uma wiki de arquivos Markdown interligados, de modo que o conhecimento seja compilado uma vez e mantido atual.

---
## Ideias que ficam
- (seção: A ideia central) O contraste com RAG: a busca por trechos redescobre tudo a cada pergunta e nada se acumula; a wiki persistente acumula referências cruzadas, contradições já sinalizadas e síntese.
- (seção: Arquitetura) Três camadas: fontes brutas que o LLM só lê, a wiki que o LLM escreve e mantém, e um documento de esquema (como o `CLAUDE.md`) que diz como tudo se organiza.
- (seção: Operações) Três operações: ingerir uma fonte (resumo, índice, páginas afetadas, registro), consultar (e devolver boas respostas à wiki como páginas novas) e inspecionar a saúde (contradições, páginas órfãs, lacunas).
- (seção: Índice e registro) Dois arquivos de navegação: um índice por conteúdo, que o LLM lê primeiro, e um registro cronológico, que só recebe acréscimos.
- (seção: Por que funciona) O trabalho caro de uma base de conhecimento é a manutenção, não a leitura. O LLM não se cansa de atualizar referências, e a pessoa fica com a curadoria das fontes e as perguntas.
- (seção: Dicas) A wiki é um repositório de arquivos Markdown, então histórico e ramificações vêm de graça; o texto cita de passagem o "vibe coding" como forma de montar ferramentas auxiliares de busca.

---
## Discordo ou duvido
O texto assume que o LLM escreve quase toda a wiki. Para quem quer que a Galáxia seja síntese própria, isso muda a natureza da nota: aqui o agente propõe e a pessoa escreve ou aprova. O índice como único mecanismo de busca também só se sustenta em escala moderada, como o próprio autor admite.

---
## O que muda na prática
O vault separa bruto (INBOX) de sintetizado (Fontes e Galáxia), tem índice por pasta e registro de execução em `_logs/`, e uma auditoria que faz o papel da inspeção de saúde. A diferença deliberada é a aprovação: o agente propõe a nota da Galáxia, a pessoa decide.

---
## Trechos
Nenhum trecho copiado. O texto original está no endereço acima.

---
## 🌌 Notas da Galáxia geradas
- [[LLM Wiki Pattern]]
- [[Vibe Coding]]
