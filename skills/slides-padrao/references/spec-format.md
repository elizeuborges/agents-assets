# Formato do roteiro (JSON)

```json
{
  "title": "Nome do arquivo e das propriedades do .pptx",
  "author": "Área responsável",
  "footer": "Texto do rodapé dos slides de conteúdo (padrão: tokens.footer)",
  "slides": [ { "type": "cover", ... }, { "type": "content", ... } ]
}
```

## Slides

```json
{ "type": "cover", "title": "…", "subtitle": "…", "meta": "Área  ·  Mês de Ano",
  "icons": [{ "icon": "question", "label": "Inception" }, "code", "server"], "notes": "…" }

{ "type": "section", "title": "Nome da seção", "subtitle": "…", "icon": "sitemap" }

{ "type": "content", "section": "Seção (opcional)", "title": "…", "message": "…", "notes": "…",
  "layout": "stack | columns", "ratios": [1, 1], "blocks": [ … ] }

{ "type": "closing", "title": "Obrigado", "subtitle": "…", "contact": "…" }
```

- `section` em um slide de conteúdo abre uma seção do PowerPoint sem slide de abertura.
- Sem `message`, a área de conteúdo sobe e fica mais alta.
- `layout: "stack"` (padrão) empilha os blocos; cada bloco aceita `"weight"` (padrão 1) para dividir a altura. `callout` tem altura fixa.
- `layout: "columns"` põe os blocos lado a lado; `ratios` define a largura relativa de cada um.

## Blocos

```json
{ "type": "cards", "cols": 3, "highlight": [0], "style": "tint | outline",
  "items": [{ "icon": "robot", "title": "…", "text": "…" }] }

{ "type": "iconList", "items": [{ "icon": "check", "title": "…", "text": "…" }] }

{ "type": "bullets", "fontSize": 16, "items": ["…", { "text": "…", "sub": ["…"] }] }

{ "type": "compare", "left": { "title": "Hoje", "icon": "user" }, "right": { "title": "Proposta", "icon": "users" },
  "rows": [["lado esquerdo", "lado direito"]] }

{ "type": "table", "header": ["Coluna A", "Coluna B"], "colW": [3, 9.13], "fontSize": 12.5,
  "rows": [["…", "…"]] }

{ "type": "steps", "highlightLast": true, "items": [{ "icon": "file", "title": "…", "text": "…" }] }

{ "type": "timeline", "highlight": [0], "items": [{ "label": "Onda 1", "title": "…", "text": "…" }] }

{ "type": "kpis", "items": [{ "value": "42%", "label": "…", "text": "…" }] }

{ "type": "chart", "chartType": "bar | line | pie | doughnut", "title": "…",
  "labels": ["Jan", "Fev"], "series": [{ "name": "Série", "values": [1, 2] }] }

{ "type": "callout", "variant": "dark | light | warn", "icon": "bulb", "title": "Destaque:", "text": "…" }

{ "type": "quote", "text": "…", "author": "…" }

{ "type": "agenda", "current": "Nome da seção ou índice (opcional)",
  "items": ["opcional; sem items, usa os slides section do roteiro", { "title": "…", "text": "…" }] }

{ "type": "imageText", "image": "caminho/relativo/ao/roteiro.png", "caption": "…", "side": "left | right", "ratio": 0.55,
  "title": "…", "text": "…", "bullets": ["…"] }

{ "type": "hub", "center": "Sistema", "centerIcon": "cogs",
  "items": [{ "icon": "jira", "title": "…", "text": "…" }] }

{ "type": "diagram", "cols": 4, "rows": 2,
  "nodes": [{ "id": "a", "title": "…", "sub": "…", "col": 0, "row": 0, "colSpan": 1, "rowSpan": 1, "style": "light | dark | accent | outline" }],
  "edges": [{ "from": "a", "to": "b", "label": "…", "both": false }] }

{ "type": "matrix", "x": { "label": "…", "low": "…", "high": "…" }, "y": { "label": "…", "low": "…", "high": "…" },
  "quadrants": [{ "title": "…", "text": "…" }], "highlight": 1,
  "points": [{ "label": "…", "x": 0.8, "y": 0.3 }] }

{ "type": "status", "columns": ["Item", "Status", "Responsável", "Prazo", "Observação"],
  "rows": [{ "item": "…", "status": "ok | atencao | risco | concluido", "owner": "…", "due": "…", "note": "…" }] }

{ "type": "layers", "order": "top-down | bottom-up", "highlight": [1],
  "items": [{ "icon": "users", "title": "…", "text": "…", "tags": ["…"] }] }

{ "type": "cycle", "center": "…", "centerIcon": "FaSync", "highlight": [0],
  "items": [{ "icon": "bulb", "title": "…", "text": "…" }] }

{ "type": "options", "recommended": 1,
  "items": [{ "label": "Opção A", "title": "…", "text": "…", "pros": ["…"], "cons": ["…"],
              "facts": [{ "label": "Custo", "value": "…" }] }] }

{ "type": "prosCons", "pros": { "title": "Prós", "items": ["…"] }, "cons": { "title": "Contras", "items": ["…"] },
  "verdict": { "title": "Recomendação:", "text": "…", "icon": "bulb" } }

{ "type": "funnel", "highlight": [3], "showRate": true,
  "items": [{ "label": "…", "value": "320", "text": "…" }] }

{ "type": "roadmap", "periods": ["T1", "T2", "T3", "T4"], "today": 1.5,
  "lanes": [{ "title": "…", "icon": "server",
              "items": [{ "title": "…", "start": 0, "end": 2, "style": "done | doing | planned", "milestone": false }] }] }

{ "type": "checklist", "cols": 2, "showProgress": true,
  "items": [{ "text": "…", "state": "done | pending | blocked | na", "note": "…" }] }
```

Quantidade de itens aceita (fora dela, o gerador para com erro):

| Bloco | Itens |
|---|---|
| `layers` | 2 a 6 camadas |
| `cycle` | 3 a 6 itens |
| `options` | 2 a 4 opções |
| `prosCons` | 1 a 6 itens de cada lado |
| `funnel` | 3 a 6 etapas |
| `roadmap` | 2 a 8 períodos, 1 a 6 trilhas |
| `checklist` | 1 a 14 itens |

- `matrix`: os quadrantes seguem a ordem superior esquerdo, superior direito, inferior esquerdo, inferior direito. Nos pontos, `x` e `y` vão de 0 a 1, com `y` crescendo para cima.
- `diagram`: a seta sai da borda do nó de origem; nós lado a lado ganham seta horizontal e nós empilhados, vertical. Prefira grades de até 4 × 3.
- `imageText`: sem a imagem no caminho indicado, aparece um espaço reservado tracejado com o caminho procurado.
- `layers`: a ordem vertical significa dependência (cada camada se apoia na de baixo). `order: "bottom-up"` desenha o primeiro item embaixo. Com `tags`, as pílulas aparecem no lugar do texto (até 6).
- `cycle`: nós em círculo, em sentido horário a partir do topo, e o último volta ao primeiro. Sem `icon`, o nó mostra o número. Numa coluna estreita, só o título aparece.
- `options`: `recommended` é o índice da opção destacada com o selo "Recomendada". Seções sem conteúdo (prós, contras, facts) somem, e as que existem ficam alinhadas entre as colunas.
- `prosCons`: os títulos padrão são "Prós" e "Contras". `verdict` aparece numa faixa escura embaixo. Numa coluna estreita, os prós ficam sobre os contras.
- `funnel`: sem `highlight`, as faixas escurecem de cima para baixo; com `highlight`, só as destacadas ficam escuras. `showRate` mostra, à esquerda, a taxa entre etapas cujo `value` é numérico ("1.200", "12,5", "10 mil").
- `roadmap`: `start` e `end` são índices de período e aceitam frações (`end` é exclusivo: `0` a `2` ocupa os dois primeiros). Estilos: `done` escuro, `doing` destaque, `planned` contorno tracejado. `milestone: true` desenha um losango em `start`. `today` desenha a linha "Hoje". Itens sobrepostos na mesma trilha vão para sub-linhas. Título que não cabe na barra vai para o lado dela, com aviso.
- `checklist`: `cols` padrão é 1, ou 2 com mais de 6 itens. `showProgress` conta os `done` sobre os itens que não são `na`.

## Limites recomendados

| Campo | Caracteres |
|---|---|
| Título do slide | 60 |
| Mensagem | 170 |
| Título de cartão | 45 |
| Texto de cartão ou item | 200 |
| Célula de `compare` | 110 |
| Texto de etapa (`steps`) | 90 |
| Texto de fase (`timeline`) | 330 |
| Texto de item do `hub` | 90 |
| Texto de quadrante (`matrix`) | 160 |
| Título / texto de camada (`layers`) | 30 / 120; tag 18 |
| Título / texto de item do `cycle` | 25 / 80 |
| Título / texto de opção (`options`) | 45 / 140; pró ou contra 60 (até 3 de cada); valor de fact 20 (até 3) |
| Item / veredito de `prosCons` | 90 / 160 |
| Label / value / texto de etapa (`funnel`) | 30 / 10 / 90 |
| Trilha / item de `roadmap` | 20 / 30 |
| Texto / nota de `checklist` | 70 / 60 |
| Observação (`status`) | 70 |
| Texto de `imageText` | 400 |

O gerador avisa quando um limite é passado. Colunas estreitas (`layout: columns`) comportam menos texto que isso.
