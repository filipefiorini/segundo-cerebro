---
tags: [indice, galaxy, conhecimento]
tipo: indice
criado: 2026-03-08
status: active
---

![[_assets/banner-galaxia.png]]

# 🌌 Índice — Galáxia

> [!info] O que é a Galáxia
> Base de conhecimento permanente do vault. Só síntese própria, no template da Galáxia: Filosofias, Conceitos, Frameworks, Metodologias e Táticas. Cada nota guarda um insight, escrito por você. Uma nota, uma camada, uma pergunta: Manual › A Galáxia. Notas de Literatura (Fontes) ficam em `03 - RECURSOS/Fontes/`.

> [!tip] Vistas por camada
> Todas as notas ficam direto em `05 - GALÁXIA/`; a camada é a propriedade `camada`. A vista [[Galáxia.base]] mostra todas, agrupadas, e uma tabela por camada. As consultas abaixo fazem o mesmo por Dataview.

---

## 📊 Totais — Galáxia

```dataview
TABLE WITHOUT ID
  camada AS "Camada",
  length(rows) AS "Total de Notas"
FROM "05 - GALÁXIA"
WHERE tipo_nota != null
GROUP BY camada
SORT camada ASC
```

## 📊 Totais — Fontes

```dataview
TABLE WITHOUT ID
  file.folder AS "Subpasta",
  length(rows) AS "Total de Fontes"
FROM "03 - RECURSOS/Fontes"
GROUP BY file.folder
SORT file.folder ASC
```

---

## 🧠 Filosofias

```dataview
TABLE
  file.link AS "Nota",
  fonte_tipo AS "Tipo de Fonte",
  fonte_titulo AS "Fonte",
  criado AS "Criado"
FROM "05 - GALÁXIA"
WHERE camada = "Filosofias" AND tipo_nota != null
SORT criado DESC
```

---

## 💡 Conceitos

```dataview
TABLE
  file.link AS "Nota",
  fonte_tipo AS "Tipo de Fonte",
  fonte_titulo AS "Fonte",
  criado AS "Criado"
FROM "05 - GALÁXIA"
WHERE camada = "Conceitos" AND tipo_nota != null
SORT criado DESC
```

---

## 🏗️ Frameworks

```dataview
TABLE
  file.link AS "Nota",
  fonte_tipo AS "Tipo de Fonte",
  fonte_titulo AS "Fonte",
  criado AS "Criado"
FROM "05 - GALÁXIA"
WHERE camada = "Frameworks" AND tipo_nota != null
SORT criado DESC
```

---

## ⚙️ Metodologias

```dataview
TABLE
  file.link AS "Nota",
  fonte_tipo AS "Tipo de Fonte",
  fonte_titulo AS "Fonte",
  criado AS "Criado"
FROM "05 - GALÁXIA"
WHERE camada = "Metodologias" AND tipo_nota != null
SORT criado DESC
```

---

## ⚡ Táticas

```dataview
TABLE
  file.link AS "Nota",
  fonte_tipo AS "Tipo de Fonte",
  fonte_titulo AS "Fonte",
  criado AS "Criado"
FROM "05 - GALÁXIA"
WHERE camada = "Táticas" AND tipo_nota != null
SORT criado DESC
```

---

## 📚 Fontes — Notas de Literatura

> [!info] Fontes ficam em 03 - RECURSOS
> As Notas de Literatura ficam em `03 - RECURSOS/Fontes/`. A Galáxia guarda só síntese própria, no template da Galáxia. Acesse o índice de fontes em [[03 - RECURSOS/Fontes/_INDICE|Índice - Fontes]].
