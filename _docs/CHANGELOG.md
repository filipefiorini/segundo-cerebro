# Changelog

## 1.0.1 — 2026-11-19

Tarefas recorrentes e a lista de candidatos à Galáxia.

- Painel de tarefas 1.2.0: tarefa recorrente numa nota só, pela recorrência do TaskNotes. Concluir uma ocorrência leva `scheduled` e `due` para a próxima; "Concluir esta", "Pular esta" e "Encerrar rotina" (com confirmação) no cartão; linha de histórico no fim da nota. Três regras: 1º dia útil do mês, toda semana num dia, todo mês num dia de 1 a 28. Campo "Repete" no "＋ Nova". O painel passa a ler a nota que o TaskNotes regravou (listas em bloco), que antes sumia da lista. Também: a lista segue a prioridade, a tarefa nova nasce com prioridade normal e o título não perde o que você digita.
- Guarda 1.0.2: reconhece tarefa com `tags` em bloco, para recusar tarefa sem `due` também depois que o TaskNotes regrava a nota; recusa o Edit que apaga a linha `due` e diz como contornar.
- Candidatos à Galáxia: a ideia oferecida e sem resposta fica em `05 - GALÁXIA/_CANDIDATOS.md` até você aprovar ou recusar (`/deliberar` 1.4.0, `/processar-inbox` 1.2.0, `/processar-reuniao` 1.2.0, `/revisar-memoria` 1.3.0).
- `/auditar-vault` 1.2.4 aceita `tags` em bloco em nota de tarefa. Template de Tarefa, Manual, Ferramentas e Zero Trust do Painel no `CLAUDE.md` descrevem a tarefa recorrente.

## 1.0.0 — 2026-11-18

Primeira versão estável, depois do teste de instalação da 1.0.0-rc.1.

- `/atualizar` 1.1.1: baixa sozinho o zip da versão nova na página de releases oficial e confere o SHA-256 (indicar um zip já baixado continua valendo); arquivo removido ou renomeado numa versão e de volta numa seguinte fica; acrescenta ao `.gitignore` as linhas do preparo e do backup que faltarem.
- `/instalar` 1.4.4: avisa quanto tempo levam a conferência inicial e os plugins; com o vault dentro do OneDrive, explica o risco e deixa você decidir; tira os CPFs do material dos projetos de outras IAs antes de propor a gravação.
- README: como extrair o ZIP sem criar a pasta duas vezes e numa pasta fora do OneDrive; link de instalação para a página da última versão.

## 1.0.0-rc.1 — 2026-11-17

Versão candidata à 1.0.0.

Primeira versão pública.
