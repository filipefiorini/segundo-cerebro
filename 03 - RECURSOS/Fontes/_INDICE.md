---
tags: [indice, nota-literatura]
tipo: indice
criado: 2026-03-15
status: active
---

![[_assets/banner-fontes.png]]

# 📚 Índice — Fontes

> [!info] O que são as Fontes
> Fichas processadas de materiais externos consumidos (livros, vídeos, podcasts, artigos, cursos). São Notas de Literatura — registros do que foi consumido, com resumo e citações. Os insights extraídos vão para a Galáxia. Transcrições brutas nunca entram aqui — apenas fichas processadas.

> [!example] Fontes de exemplo
> O framework traz seis livros, quatro artigos e uma reflexão como exemplo (`exemplo: true` no frontmatter). Quando a primeira fonte sua de outro tipo chegar (vídeo, podcast, curso), crie a subpasta (`Vídeos/`, `Podcasts/`, `Cursos/`) e copie uma das seções abaixo trocando a pasta.

---

## 📗 Livros

```dataview
TABLE
  file.link AS "Nota",
  fonte_autor AS "Autor",
  fonte_data AS "Consumido em",
  criado AS "Criado"
FROM "03 - RECURSOS/Fontes/Livros"
SORT criado DESC
```

---

## 📰 Artigos

```dataview
TABLE
  file.link AS "Nota",
  fonte_autor AS "Autor",
  fonte_data AS "Consumido em",
  criado AS "Criado"
FROM "03 - RECURSOS/Fontes/Artigos"
SORT criado DESC
```

---

## 💭 Reflexões

```dataview
TABLE
  file.link AS "Nota",
  fonte_autor AS "Autor",
  fonte_data AS "Registrado em",
  criado AS "Criado"
FROM "03 - RECURSOS/Fontes/Reflexões"
SORT criado DESC
```
