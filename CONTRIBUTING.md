# Contribuindo

Este arquivo é para quem mexe no próprio framework. Para usar o vault, comece pelo [README](README.pt-BR.md).

## Para mantenedores

Depois de clonar, ative o hook versionado:

```
git config core.hooksPath .githooks
```

O hook `pre-commit` roda `uv run --no-project python scripts/verificar.py` e bloqueia o commit se qualquer bloco achar item:

- manifesto: arquivo fora do `segundo-cerebro.manifest.json`;
- segredos e nomes: chaves, dados pessoais, caminhos de usuário e os nomes da lista local (abaixo), no conteúdo e nos nomes de arquivo;
- wikilinks: `[[links]]` e embeds quebrados.

No repositório do framework não existe `.segundo-cerebro-version`: se o `/instalar` for chamado ali, recuse, ou instale num clone separado, para não gravar dados pessoais no repositório público.

Rode o verificador à mão com o mesmo comando. Testes: `uv run --with pytest pytest scripts/tests -v`.

## Lista local de nomes

O filtro versionado só tem padrões genéricos; os nomes e caminhos de quem mantém o repositório ficam em `.git/info/filtro-nomes.txt`, um padrão por linha (`#` comenta), sem distinguir caixa. Uma palavra simples só casa isolada de letras e dígitos; qualquer outra linha é uma regex (por exemplo `(?:nome)` para casar dentro de outras palavras). Cada acerto é barrado como nome pessoal, no conteúdo e nos nomes de arquivo. O arquivo fica dentro de `.git/`, então nunca é versionado: crie o seu depois de clonar.

## Para quem quer contribuir

Framework é o que o `segundo-cerebro.manifest.json` lista: skills, templates, `_docs/`, scripts e o resto do que vai no zip da release. Notas pessoais não são framework e não entram aqui.

- Issue e PR podem ser em português ou em inglês.
- Faça um fork. Não há push direto neste repositório.
- Abra o PR para o ramo `dev`, não para o `main`.
- Mudança de arquitetura passa pelo mantenedor antes do código: abra uma issue e espere a resposta.
- As licenças são MIT para o código e CC BY 4.0 para o conteúdo. Ao contribuir, você aceita que sua contribuição siga a licença do arquivo que alterou.

## Publicar uma versão

Só o mantenedor publica.

- O `main` é sempre a última versão publicada. O trabalho corrente fica no `dev`.
- Antes do `preparar`, rode `git add VERSION _docs/CHANGELOG.md`. Sem isso o `empacotar` falha por árvore suja.
- Versão de ensaio nunca entra no `main` nem no `dev`.
- Exemplo novo (nota de exemplo da Galáxia ou das Fontes) entra no `_docs/CHANGELOG.md` com o caminho do arquivo.
- A `version` do `plugin.json` da Guarda (`.claude/skills/guarda-constituicao/.claude-plugin/plugin.json`) sobe a cada mudança de comportamento dela.
- O zip e o arquivo `.sha256` sobem juntos na release.
- Push só do ramo e da tag nomeados: `git push origin <ramo>` e `git push origin <tag>`. Nunca `--all`, `--tags`, `--mirror` ou `--force`.
