---
tags: [galaxy, conhecimento, segundo-cerebro, ai]
tipo: nota-permanente
tipo_nota: atômico
camada: Conceitos
fonte: "[[]]"
fonte_tipo: Experiência
fonte_titulo:
fonte_autor:
fonte_url:
fonte_data:
criado: 2026-11-08
revisado:
confianca: alta
data_verificacao:
validade: permanente
desenvolvido_em:
status: active
exemplo: true
---

![[_assets/banner-galaxia.png]]

# 💡 Mapa de Responsabilidade: cada arquivo tem dono e escopo

## 🧬 Ideia Central
> O Mapa de Responsabilidade é a tabela que diz, para cada arquivo do vault, de que ele é a fonte de verdade, quem pode atualizá-lo e quando.

## 📖 Desenvolvimento
Fica em `_docs/Ferramentas.md` e é consultado antes de qualquer gravação (regra GRAVAÇÃO). Cada linha tem quatro colunas: o arquivo, a fonte de verdade para o quê, quem atualiza e quando.

Exemplos: `memory/fatos.md` guarda fatos estáveis e só muda com confirmação; `06 - TAREFAS/Tarefas/` guarda as tarefas, uma nota por tarefa; `_DECISOES.md` guarda o que fica, migra ou fecha.

Gravar fora do escopo declarado é proibido. Quando dois documentos discordam, o mapa traz a ordem de prevalência: o `CLAUDE.md` manda no comportamento do Code, o Manual e as Ferramentas mandam na estrutura.

## 🔗 Conexões
- Apoia: [[O agente só faz o que está escrito]]
- Relacionado com: [[IPARAG — sete pastas, uma pergunta cada]]
- Relacionado com: [[Zero Trust em Permissões de Agente]]

## 💼 Aplicação Prática
Ao criar um arquivo que o agente vai manter, acrescente uma linha ao mapa: o que ele guarda, quem escreve nele e em que momento. Arquivo sem dono acaba com duas versões da mesma informação.

## 📎 Fonte
Experiência de desenhar e operar este vault. Sem fonte externa.

---
*Camada: Conceitos | Confiança: alta*
