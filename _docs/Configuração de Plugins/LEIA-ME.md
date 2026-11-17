# Configuração de Plugins

Esta pasta guarda a configuração pronta de cinco plugins do Obsidian. O `.gitignore` do repositório
não versiona `.obsidian/plugins/`, então a configuração fica aqui, fora dele.

| Arquivo | Plugin no Obsidian | Para que serve |
|---|---|---|
| `tasknotes.data.json` | TaskNotes | Tarefas em `06 - TAREFAS/Tarefas`, arquivo em `04 - ARQUIVO/Tarefas`, campo `executor`, status "Aguardando" |
| `templater-obsidian.data.json` | Templater | Templates lidos de `_templates` |
| `dataview.data.json` | Dataview | JavaScript ligado (`enableDataviewJs`), exigido pela Homepage |
| `homepage.data.json` | Homepage | Abre a nota `Homepage` ao iniciar o Obsidian |
| `obsidian-git.data.json` | Git (obsidian-git) | Mensagem genérica (`vault: {{date}}`), sem remoto configurado, envio automático desligado |

Nenhum deles traz token, chave, conta ou endereço de repositório. Calendários e API vêm desligados.

## Núcleo e opcionais

São seis plugins obrigatórios: **Dataview, Templater, TaskNotes, Homepage, Banners e Git (obsidian-git)**.
Cinco deles têm configuração pronta nesta pasta; o Banners usa os padrões.
Os outros 13 plugins da tabela abaixo são opcionais: instale quando sentir falta, sem pressa.

## Os 19 plugins

Na busca do Obsidian (Configurações › Plugins da comunidade › Procurar), procure pelo nome da primeira coluna.

| Nome no Obsidian | Autor | ID | Uso |
|---|---|---|---|
| [Dataview](https://github.com/blacksmithgu/obsidian-dataview) | blacksmithgu | `dataview` | núcleo |
| [Templater](https://github.com/silentvoid13/Templater) | silentvoid13 | `templater-obsidian` | núcleo |
| [TaskNotes](https://github.com/callumalpass/tasknotes) | callumalpass | `tasknotes` | núcleo |
| [Homepage](https://github.com/mirnovov/obsidian-homepage) | mirnovov | `homepage` | núcleo |
| [Banners](https://github.com/noatpad/obsidian-banners) | noatpad | `obsidian-banners` | núcleo |
| [Git](https://github.com/vinzent03/obsidian-git) | Vinzent | `obsidian-git` | núcleo |
| [Minimal Theme Settings](https://github.com/kepano/obsidian-minimal-settings) | kepano | `obsidian-minimal-settings` | opcional |
| [Style Settings](https://github.com/obsidian-community/obsidian-style-settings) | Obsidian Community Archive | `obsidian-style-settings` | opcional |
| [Calendar](https://github.com/liamcain/obsidian-calendar-plugin) | Liam Cain | `calendar` | opcional |
| [Periodic Notes](https://github.com/liamcain/obsidian-periodic-notes) | Liam Cain | `periodic-notes` | opcional |
| [Kanban](https://github.com/obsidian-community/obsidian-kanban) | Obsidian Community Archive | `obsidian-kanban` | opcional |
| [Charts](https://github.com/phibr0/obsidian-charts) | phibr0 | `obsidian-charts` | opcional |
| [Iconize](https://github.com/florianwoelki/obsidian-iconize) | florianwoelki | `obsidian-icon-folder` | opcional |
| [Excalidraw](https://github.com/zsviczian/obsidian-excalidraw-plugin) | zsviczian | `obsidian-excalidraw-plugin` | opcional |
| [Heatmap Tracker](https://github.com/mokkiebear/heatmap-tracker) | mokkiebear | `heatmap-tracker` | opcional |
| [Tracker](https://github.com/pyrochlore/obsidian-tracker) | pyrochlore | `obsidian-tracker` | opcional |
| [Omnisearch](https://github.com/scambier/obsidian-omnisearch) | Simon Cambier | `omnisearch` | opcional |
| [Tag Wrangler](https://github.com/pjeby/tag-wrangler) | pjeby | `tag-wrangler` | opcional |
| [Book Search](https://github.com/anpigon/obsidian-book-search-plugin) | anpigon | `obsidian-book-search-plugin` | opcional |

## Como aplicar

O `/instalar` faz isso por você, na etapa 1. Com o Obsidian fechado, o Code roda o script
`.claude/skills/instalar/plugins.ps1` (você aprova o comando), que:

- baixa os seis plugins do núcleo, cada um do repositório oficial dele no GitHub, e mais nada. Ele pega a última versão publicada de cada plugin, como o próprio Obsidian faria ao instalar pela busca; não há versão fixa nem conferência de hash;
- grava cada arquivo desta pasta como `data.json` do plugin, só quando o plugin ainda não tem um
  (a sua configuração nunca é sobrescrita);
- acrescenta os seis à lista de plugins ativos.

Depois você abre a pasta no Obsidian e aceita ativar os plugins da comunidade. Num computador novo
(depois de restaurar o backup, por exemplo), chame `/instalar` e escolha "instalar os plugins do
Obsidian". O script funciona no Windows.

## Se o automático falhar

Sem internet na hora, fora do Windows ou com algum erro que não passou na segunda tentativa:

1. Abra o vault no Obsidian e instale os seis plugins do núcleo em Configurações › Plugins da
   comunidade › Procurar, buscando pelo nome: Dataview, Templater, TaskNotes, Homepage, Banners e
   Git (do autor Vinzent). Ative cada um, menos o TaskNotes: instale-o, mas deixe desativado por
   enquanto (ativado antes da configuração, ele cria uma pasta `TaskNotes/` na raiz).
2. Feche o Obsidian.
3. No Explorador de Arquivos, ligue Exibir › Mostrar › "Itens ocultos" (a pasta `.obsidian` é
   oculta) e copie cada arquivo para o destino, trocando o nome para `data.json`:
   - `tasknotes.data.json` para `.obsidian/plugins/tasknotes/data.json`
   - `templater-obsidian.data.json` para `.obsidian/plugins/templater-obsidian/data.json`
   - `dataview.data.json` para `.obsidian/plugins/dataview/data.json`
   - `homepage.data.json` para `.obsidian/plugins/homepage/data.json`
   - `obsidian-git.data.json` para `.obsidian/plugins/obsidian-git/data.json`
4. Abra o Obsidian de novo e, só agora, ative o TaskNotes em Configurações › Plugins da comunidade.

A skill `/instalar` acompanha esse caminho item a item e confere cada cópia.

## Observações

A Homepage já abre a nota `Homepage` ao iniciar; não há o que configurar à mão. O plugin Git
vem sem nada automático: não faz commit, envio nem pull sozinho, nem com o vault baixado por clone
(que já traz a pasta `.git` ligada ao repositório do framework). O backup só começa na etapa 8 do
`/instalar`: você troca o endereço do remoto pelo do seu repositório privado ("Git: Edit remotes";
num vault sem `.git`, antes "Git: Initialize a new repo"), confere o primeiro envio e só então liga
os 30 minutos em Configurações › Git.

Se uma pasta `TaskNotes/` aparecer na raiz, o plugin rodou antes da configuração: pode apagá-la.

Sem o `dataview.data.json`, a Homepage mostra "Dataview JS queries are disabled". A alternativa é
ligar em Configurações › Dataview › "Enable JavaScript Queries".
