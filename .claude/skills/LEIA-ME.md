# Skills

O Claude Desktop carrega sozinho as skills desta pasta quando o vault é aberto no Claude Code. Cada uma é uma pasta com `SKILL.md`; chame pelo nome (`/processar-inbox`) ou peça em linguagem natural. Nenhuma depende de servidor MCP ou conector; a única com script é a `instalar`, que instala os plugins do núcleo do Obsidian (`plugins.ps1`).

- `auditar-vault` — varre o vault atrás de inconsistências (pastas, frontmatter, tags, banners, wikilinks), relata por severidade e só corrige com aprovação.
- `deliberar` — parceiro de pensamento para uma decisão: lê o que o vault registra, pergunta o que falta, argumenta contra a opção que você prefere e grava a Deliberação só com o seu ok. Termina listando candidatos à Galáxia.
- `instalar` — conduz a primeira configuração do vault pelo chat, sem terminal para você: instala os plugins do núcleo, quem você é, `CLAUDE.md`, áreas e projetos, projetos de outras IAs (Claude, ChatGPT, Gemini), conectores e plugins do Claude, módulos e backup. Termina ensinando três gestos, entre eles levar uma ideia para a Galáxia. Retoma de onde parou pelo `_logs/instalacao.md`.
- `processar-conteudo` — transforma texto, arquivo, URL ou transcrição em Nota de Literatura e notas da Galáxia, com plano e aprovação antes de gravar.
- `processar-inbox` — propõe destino para cada captura do `00 - INBOX/`, grava o aprovado, arquiva o original e retém com plano o que é governança, ambíguo ou sensível. Termina listando candidatos à Galáxia.
- `processar-reuniao` — transforma uma transcrição colada ou um arquivo do INBOX em nota de reunião e nas tarefas do usuário. Termina listando candidatos à Galáxia.
- `revisar-memoria` — propõe a revisão mensal de `memory/` e salva a proposta em `_logs/revisao-memoria/`; a memória só muda com o seu ok. Termina listando candidatos à Galáxia do mês.

As pastas `guarda-constituicao/` e `painel-tarefas/` são módulos do Claude Code, não skills: rodam sozinhos ao lado da sessão. Ver `_docs/Ferramentas.md` › Módulos.

`/atualizar` traz uma versão nova do framework: você baixa o zip da versão, e o Code compara com o seu vault, mostra o que muda, preserva o que é seu (inclusive os blocos `usuario:`), faz um backup e só então grava. Também desfaz uma atualização. Nunca atualize por `git pull`.

Catálogo e convenções (frontmatter, limite de linhas, changelog): `_docs/Ferramentas.md` › Skills.
