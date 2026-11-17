## O que muda e por quê

<!-- Duas ou três linhas. Mudança de arquitetura: link para a issue em que o mantenedor aprovou. -->

## Conferência

- [ ] O PR é para o ramo `dev`, a partir de um fork.
- [ ] `uv run --no-project python scripts/verificar.py` passa nos quatro blocos.
- [ ] `uv run --with pytest pytest scripts/tests -q` passa.
- [ ] Nenhum dado pessoal, caminho de usuário ou conteúdo de notas no diff.
- [ ] Arquivo novo, removido ou renomeado: rodei `uv run --no-project python scripts/release.py` e o `segundo-cerebro.release.json` está no commit.
