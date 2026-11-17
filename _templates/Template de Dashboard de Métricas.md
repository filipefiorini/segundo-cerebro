---
tags: [template, dashboard, metricas, charts]
tipo: template
criado: <% tp.date.now("YYYY-MM-DD") %>
status: active
---

![[_assets/banner-dashboard-metricas.png]]

# Dashboard de Métricas — [Escopo]

> Os números abaixo são fictícios: troque pelos do seu escopo e atualize os blocos `data:` a cada fechamento de mês.
> Requer o plugin **Obsidian Charts** instalado e habilitado.

---

## Resultado Mensal (unidades)

Linha de referência: média do ano anterior = 100 | Meta do ano = 120

```chart
type: line
labels: [Mês 1, Mês 2, Mês 3, Mês 4, Mês 5, Mês 6]
series:
  - title: Realizado
    data: [90, 95, 100, 105, 110, 0]
  - title: Meta
    data: [120, 120, 120, 120, 120, 120]
  - title: Mínimo aceitável
    data: [80, 80, 80, 80, 80, 80]
tension: 0.4
width: 80%
labelColors: false
fill: false
beginAtZero: false
```

> **Como atualizar:** troque o `0` do último mês pelo valor fechado. Mês novo entra no fim da lista, nos `labels` e em cada série.

---

## Indicador vs. Meta

Comparativo entre a referência do ano anterior, a meta do ano e o último mês fechado.

```chart
type: bar
labels: [Referência, Meta, Último mês]
series:
  - title: Indicador A
    data: [10, 12, 11]
  - title: Indicador B
    data: [20, 25, 22]
tension: 0.2
width: 80%
labelColors: false
fill: false
beginAtZero: true
```

> **Leitura:** descreva aqui o que cada indicador mede e o que fazer quando o último mês fica abaixo da referência.

---

## Distribuição por Categoria

Base total: 100 itens | Referência: [mês/ano]

```chart
type: pie
labels: [Categoria A, Categoria B, Categoria C]
series:
  - title: Itens por categoria
    data: [50, 30, 20]
width: 60%
labelColors: true
```

> **Legenda:**
> - **Categoria A:** o que entra nela
> - **Categoria B:** o que entra nela
> - **Categoria C:** o que entra nela

---

## Notas de Uso

- Os dados ficam fixos na nota. Para um painel que se atualiza sozinho, use **Dataview** sobre notas mensais com os valores.
- No gráfico de linha, cada mês novo entra no fim da lista.
- A pizza vale para uma data: atualize quando refizer a contagem da base.
- Contexto do escopo: o `_CONTEXTO.md` do projeto ou da área a que os números pertencem.
