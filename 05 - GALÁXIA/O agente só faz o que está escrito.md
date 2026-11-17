---
tags: [galaxy, conhecimento, ai, segundo-cerebro, seguranca]
tipo: nota-permanente
tipo_nota: atômico
camada: Filosofias
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

# 💡 O agente só faz o que está escrito

## 🧬 Ideia Central
> Um agente de IA não ganha permissão por ser útil: o que ele pode fazer está escrito em arquivo, e o que não está escrito pede confirmação.

## 📖 Desenvolvimento
O `CLAUDE.md` é a Constituição do vault. O Claude Code o lê no início de cada sessão e obedece a regras como GRAVAÇÃO (decidir o destino antes de gravar), CONFLITO (instrução que contraria a regra pede pergunta, não pressa) e DESTRUTIVO (mover, apagar ou enviar exige confirmação).

A tabela Zero Trust declara, para cada integração, o que ela pode e o que não pode. Operação fora do escopo: confirmar antes.

A Guarda confere cada chamada de ferramenta contra essas regras e recusa ou pede confirmação. Regra nova só entra com aprovação explícita no chat. Quem manda no agente é o texto que a pessoa pode ler e revisar, não o bom senso dele.

## 🔗 Conexões
- Relacionado com: [[Zero Trust em Permissões de Agente]]
- Apoia: [[Mapa de Responsabilidade — cada arquivo tem dono e escopo]]
- Apoia: [[Toda tarefa nasce com prazo]]
- Relacionado com: [[Organize pelo que vai fazer, não pelo assunto]]

## 💼 Aplicação Prática
Antes de ligar um conector novo ou criar uma skill, escreva o que ele pode e não pode fazer na tabela Zero Trust do `CLAUDE.md`. Se você não consegue escrever o limite em uma linha, ainda não deveria dar o acesso.

## 📎 Fonte
Experiência de desenhar e operar este vault. Sem fonte externa.

---
*Camada: Filosofias | Confiança: alta*
