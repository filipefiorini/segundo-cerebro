# instalar — exemplos de execução

> Carregado sob demanda pelo [SKILL.md](SKILL.md). Pessoa, ofício e projetos de IA fictícios. Diálogo resumido: os textos completos estão no [reference.md](reference.md).

## Exemplo 1 — Instalação completa, em uma sessão

Ana, professora de música, baixou o vault e abriu a pasta no Claude Code. Não há `.segundo-cerebro-version` nem `_logs/instalacao.md`.

**Etapa 0 — Confiança e contexto**

O Code lê `CLAUDE.md`, `BEM-VINDO.md`, o LEIA-ME de plugins e `VERSION` (`1.0.0-dev`). Encontra `segundo-cerebro.manifest.json` na raiz: é instalação nova. Dá as boas-vindas, com o aviso de que a Guarda vai pedir confirmação em pelo menos cinco momentos, e cria `_logs/instalacao.md` com `etapa_atual: 1` e `etapas_concluidas: [0]`.

**Etapa 1 — Ambiente**

O Code confere `.obsidian/plugins/`: nenhum plugin do núcleo instalado, nenhum `data.json`. Ana ainda não abriu o vault no Obsidian.

> **Code:** Agora vou instalar os seis plugins do Obsidian que o vault usa, já com as configurações prontas. [...] O Obsidian precisa estar fechado: feche todas as janelas dele e me avise.
>
> **Ana:** Está fechado.

O Code avisa do pedido de permissão e roda `plugins.ps1`; Ana aprova o comando. A saída traz seis linhas "instalado" e cinco "configuração gravada".

> **Code:** Pronto: os seis plugins estão instalados, com as configurações prontas. Agora abra o Obsidian e escolha esta pasta como cofre [...]. Aceite ativar os plugins da comunidade. A Homepage deve abrir sozinha. Me diga o que apareceu.
>
> **Ana:** Abriu uma página inicial com o nome do vault.

O Code relê as seis pastas, os cinco `data.json` e a lista de ativos: conferem. O `.git/config` tem um `origin` (o vault veio por clone) e o log não tem `backup: sim`: o Code avisa que o vault está ligado ao repositório de onde foi baixado e que nada é enviado até a etapa de backup. Log: etapa 1 concluída.

**Etapa 2 — Quem usa**

Uma pergunta por vez. Ana responde: "Ana, por você"; cidade "prefiro não dizer"; "dou aulas de piano e violão, em casa e numa escola"; tom "direto, mas me explica quando for técnico"; prioridades "organizar o material das aulas" e "cuidar melhor das contas"; áreas "Trabalho (as aulas e os alunos), Finanças (contas da casa e do trabalho), Saúde (exames e treino)"; projeto "um recital de fim de ano dos alunos".

O Code guarda as respostas em `## Respostas` do log. Cidade fica "não informado".

**Etapa 3 — Gravar Constituição**

> **Code:** Sugiro marcar como sensíveis estas áreas: Finanças e Saúde. [explicação do que muda] Você pode mudar agora, ou depois, no campo `sensivel` do `_CONTEXTO.md` da área.
>
> **Ana:** Pode marcar.

O Code mostra o bloco "Dono do vault" e "Prioridades do momento" preenchido, com as três áreas só por nome e caminho, e avisa da confirmação da Guarda.

> **Ana:** Pode gravar.

Um Edit no `CLAUDE.md`; a Guarda pede confirmação; Ana confere o arquivo e a mudança e aceita (1ª de 6). O Code relê: os três pares de marcadores estão intactos. Log: etapa 3 concluída, `sensivel` de cada área em `## Respostas`.

**Etapa 4 — Áreas e projetos**

O Code mostra num bloco só: `02 - ÁREAS/Trabalho/_CONTEXTO.md` (`sensivel: false`), `02 - ÁREAS/Finanças/_CONTEXTO.md` (`sensivel: true`), `02 - ÁREAS/Saúde/_CONTEXTO.md` (`sensivel: true`), `01 - PROJETOS/Em Andamento/Recital de Fim de Ano/_CONTEXTO.md`, a amostra do corpo de Trabalho e as quatro linhas da tabela.

> **Ana:** Pode.

Quatro Writes de arquivo novo, sem confirmação. Um Edit na tabela do `CLAUDE.md`; a Guarda pede confirmação; Ana confere o arquivo e a mudança e aceita (2ª de 6). O Code relê os quatro arquivos e a tabela. Log: `areas: [Trabalho, Finanças, Saúde]`, etapa 4 concluída.

**Etapa 5 — Projetos de outras IAs**

> **Ana:** Tenho dois: um Project no Claude, "Planos de aula", e um GPT personalizado no ChatGPT, "Repertório". Também exportei meu histórico do ChatGPT, quer?
>
> **Code:** O histórico fica de fora: é longo demais para virar nota de uma vez, e continua guardado onde está. Quando uma conversa tiver algo que valha guardar, copie o trecho para o `00 - INBOX`. Vamos aos dois projetos, começando por "Planos de aula".

"Planos de aula" (Claude): Ana cola as instruções ("Você me ajuda a montar planos de aula de piano para iniciantes, sempre em tópicos curtos...") e salva três PDFs em `00 - INBOX/Planos de aula/`. O Code lê tudo e propõe:

> - Instruções → `02 - ÁREAS/Trabalho/_CONTEXTO.md`, seção Descrição, como texto descritivo
> - `metodo-iniciante.pdf` (apostila de 80 páginas) → `/processar-conteudo`, Nota de Literatura em `03 - RECURSOS/Fontes/`
> - `plano-marco.pdf` e `plano-abril.pdf` → captura no INBOX: não está claro se são modelo ou registro
>
> Posso gravar?

Ana aprova. O Code edita o `_CONTEXTO.md` de Trabalho, chama `/processar-conteudo` com a apostila (plano e aprovação próprios dele) e grava a captura `AAAA-MM-DD - Captura - Planos de aula - planos mensais.md`. Log: `projects_importados: [Planos de aula (Claude)]`. A pasta `00 - INBOX/Planos de aula/` fica onde está, com os originais.

"Repertório" (ChatGPT): Ana copia as instruções nas configurações do GPT e cola no chat. O GPT tinha uma lista de peças anexada; o ChatGPT não deixa baixar, mas Ana tem o original em MD e salva em `00 - INBOX/Repertório/`. Destino proposto: Nota de Literatura de partituras em `03 - RECURSOS/Fontes/`. Ana aprova. Log: `projects_importados: [Planos de aula (Claude), Repertório (ChatGPT)]` e a pendência dos originais, que continuam nas duas pastas do INBOX.

**Etapa 6 — Ferramentas do Claude**

> **Code:** [...] Quais destes você usa e gostaria que eu pudesse ler? E-mail, agenda, arquivos na nuvem, reuniões gravadas, ou outro.
>
> **Ana:** A agenda do Google. E-mail não, prefiro deixar de fora.

O Code orienta a conexão em claude.ai, Configurações › Conectores, com a janela de permissão do Google. Ana autoriza. O Code propõe a linha:

> | Google Calendar (claude.ai) | Buscar e ler eventos | Enviar, criar, alterar, mover ou apagar sem confirmação |
>
> **Ana:** Pode gravar.

Um Edit no terceiro par de marcadores do `CLAUDE.md`; a Guarda pede confirmação; Ana confere o arquivo e a mudança e aceita (3ª de 6). O Code relê a tabela e os marcadores. Depois oferece o superpowers; Ana instala pelo "+" da aba Code, em "Add plugins", no escopo deste projeto. O Code relê `.claude/settings.json` e encontra o plugin em `enabledPlugins`. Log: `conectores: [Google Calendar]`, `plugins_claude: [superpowers]`.

**Etapa 7 — Módulos**

> **Ana:** Digitei `/tarefas` e abriu um painel do lado. O `/guarda` mostrou uma lista de regras.

O Code explica os dois e como desligar. Ana quer os dois. Log: `modulos: sim`.

**Etapa 8 — Backup**

Ana quer. O Code lê o `.gitignore` (ignora `.obsidian/plugins/` e `.env`) e o `.git/config`: Ana baixou o vault por clone no GitHub Desktop, então já existe `.git`, com o `origin` apontando para o repositório do framework (na etapa 1, o Code já tinha avisado que nada seria enviado até aqui). Passo a passo, um por mensagem: instalador do Git, conta no GitHub, repositório `meu-segundo-cerebro` privado e vazio, autor dos envios no plugin Git. O passo 5 (iniciar repositório) é pulado. No passo 6, "Git: Edit remotes" com `origin` e o endereço HTTPS do repositório de Ana no lugar do antigo; o Code relê o `.git/config` e confere que o `origin` mudou. Depois "Git: Commit-and-sync" com a janela do Credential Manager. Ana recarrega a página do GitHub e vê as pastas. Por fim, liga os 30 minutos em Configurações › Git; o Code relê o `data.json` e confere. Log: `backup: sim`.

**Etapa 9 — Pronto**

O Code mostra a versão (`1.0.0-dev`) e a linha do `_HISTORICO.md`, que lista o `_CONTEXTO.md` de Trabalho e o do recital e fecha com "e 2 áreas sensíveis", sem caminho. Ana aprova. Edit no `_HISTORICO.md` (4ª de 6) e Write do `.segundo-cerebro-version` (5ª de 6). Por último, o Code roda o comando que grava a base do `/atualizar`; a Guarda pergunta com o motivo `ATUALIZAÇÃO` e Ana aceita (6ª de 6). O Code relê o `.segundo-cerebro-version` e o `_HISTORICO.md`, confere que `.segundo-cerebro/base/` tem arquivos e relê o log (`etapa_atual: 9`).

> **Pronto. Seu Segundo Cérebro está instalado (versão 1.0.0-dev).**
>
> **O que foi criado**
> - `CLAUDE.md` com quem você é, suas prioridades e a tabela de áreas e projetos.
> - Áreas: Trabalho, Finanças (sensível), Saúde (sensível).
> - Projetos: Recital de Fim de Ano.
> - Trazido de outras IAs: Planos de aula (Claude), Repertório (ChatGPT).
> - Conectores: Google Calendar.
> - Plugins do Claude: superpowers.
> - Módulos: Guarda e Painel ligados.
> - Backup: ligado, enviando para o seu repositório privado no GitHub a cada 30 minutos.
>
> **O que ficou pendente**
> - Os originais dos projetos de IA continuam em `00 - INBOX/Planos de aula/` e `00 - INBOX/Repertório/`; arquive ou apague quando quiser.
>
> **Seu primeiro dia** [os três passos]
>
> **Se um dia restaurar o backup** [chamar `/instalar` e reinstalar os plugins]
>
> **Para ler mais:** [os três documentos]

Sem o aviso de backup: `backup: sim`.

---

## Exemplo 2 — Retomada a partir da etapa 5

Dois dias depois de começar, Ana abre o Claude Code no vault. Na primeira sessão ela parou no meio da etapa 5. O log diz:

```yaml
etapa_atual: 5
etapas_concluidas: [0, 1, 2, 3, 4]
backup: pendente
modulos:
areas: [Trabalho, Finanças, Saúde]
projects_importados: [Planos de aula (Claude)]
conectores:
plugins_claude:
```

Não há `.segundo-cerebro-version`. O Code chama `/instalar` sozinho (o `CLAUDE.md` manda) ou Ana digita "retomar a instalação".

**Etapa 0, só leitura.** O Code confere o manifesto, lê o log e as respostas guardadas. Nada é gravado.

> **Code:** Bem-vindo de volta. Já fizemos: confiança e contexto, ambiente, quem usa, Constituição, áreas e projetos. Falta: projetos de outras IAs, ferramentas do Claude, módulos, backup e o fechamento. Vamos continuar pela etapa 5 — projetos de outras IAs.
>
> Da última vez entrou "Planos de aula", do Claude. Faltava algum outro?
>
> **Ana:** O "Repertório".

O Code não pergunta de novo sobre "Planos de aula" (está em `projects_importados`) e não refaz nada das etapas 1 a 4: o bloco do `CLAUDE.md` e os `_CONTEXTO.md` já existem. Antes de propor o destino do "Repertório", confere no disco: a pasta `00 - INBOX/Repertório/` já tem o arquivo que Ana salvou na outra sessão, nenhuma Nota de Literatura de partituras existe em `03 - RECURSOS/Fontes/` e não há captura `* - Captura - Repertório - *` no INBOX: nada dele foi gravado ainda. Segue do passo 1 deste projeto de IA: pede as instruções, propõe, grava com aprovação. Log: `projects_importados: [Planos de aula (Claude), Repertório (ChatGPT)]`, etapa 5 concluída, `etapa_atual: 6`.

**Etapas 6 e 7** como no exemplo 1.

**Etapa 8 — Ana recusa o backup.**

> **Ana:** Agora não.
>
> **Code:** Tudo bem. Fica registrado como pendente, e eu lembro no fim.

Log: `backup: pendente`, pendência "configurar o backup (`/instalar` › configurar o backup)".

**Etapa 9** como no exemplo 1, com duas diferenças na mensagem de Pronto: "Backup: não configurado" em O que foi criado e a pendência do backup em O que ficou pendente, e o aviso forte logo depois do primeiro dia:

> **Atenção: seu vault está sem backup.** Se o computador quebrar, for roubado ou o disco falhar, tudo o que está aqui se perde. Quando puder, chame `/instalar` de novo e escolha "configurar o backup". Leva uns 15 minutos.

Se Ana tivesse respondido "não" em vez de "agora não", o log teria `backup: nao`, sem pendência, e o aviso seria o mesmo.

Uma semana depois, Ana chama `/instalar` de novo. Agora há `.segundo-cerebro-version`: o Code oferece só as sete opções da segunda execução (a sétima, apagar os exemplos, aparece porque Ana ficou com eles). Ana escolhe "Configurar o backup", faz a etapa 8, e o log ganha `backup: sim`, a pendência marcada como resolvida e a linha `- AAAA-MM-DD — backup configurado` em `## Depois da instalação`.

---

## Exemplo 3 — Começar sem as notas de exemplo

Na etapa 9, antes de mostrar as gravações de fechamento, o Code pergunta:

> **Code:** O framework traz 36 notas de exemplo, na Galáxia e nas Fontes, para você ver como uma nota fica pronta. Quer ficar com elas ou começar sem? Se começar sem, eu apago todas de uma vez; o `_INDICE.md` de cada pasta e a vista da Galáxia continuam no lugar.
>
> **Ana:** Começar sem.

O Code lista os arquivos com `exemplo: true` em `05 - GALÁXIA/` e em `03 - RECURSOS/Fontes/`, fora os `_INDICE.md`, e mostra a contagem por pasta:

> **Code:** Vou apagar 36 notas (25 da Galáxia e 11 das Fontes). Os dois conjuntos saem juntos, porque as notas da Galáxia citam as Fontes. Não dá para desfazer por aqui; se mudar de ideia, baixe o framework de novo. A Guarda vai pedir uma confirmação para o comando.
>
> **Ana:** Pode apagar.

Um comando, com os 36 caminhos da lista; a Guarda pergunta, Ana confere que é o apagar que ela acabou de aprovar e aceita (a Guarda passa a pedir sete confirmações no total, não seis). O Code confere com Glob que as notas sumiram e que `05 - GALÁXIA/_INDICE.md`, `05 - GALÁXIA/Galáxia.base` e `03 - RECURSOS/Fontes/_INDICE.md` continuam lá. Log: `exemplos: removidos`. A mensagem de Pronto diz "Notas de exemplo: removidas" e a Homepage mostra zero notas na Galáxia, sem erro.

Se Ana tivesse respondido "ficar", o log teria `exemplos: mantidos` e nada seria apagado. Mais tarde, chamando `/instalar` de novo, ela poderia escolher a opção 7 e apagá-las então.
