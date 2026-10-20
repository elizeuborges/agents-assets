# Blocos propostos

Especificação de sete blocos novos para a skill `slides-padrao`. Para cada bloco: quando usar, o formato JSON, o desenho e os limites de texto. A implementação segue `references/adding-blocks.md` (função em `scripts/slides.js`, `case` em `scripts/build-from-spec.js`, documentação em `spec-format.md` e `SKILL.md`, slide em `examples/exemplo.json`).

Regras que valem para todos:
- Posição e tamanho só a partir da área `A`; o bloco precisa funcionar na área útil inteira e numa coluna (`layout: "columns"`).
- Cores só de `K` (tokens). `highlight` usa a cor de destaque com texto `K.lt1`; os demais itens, fundo claro (`K.lt2`) com texto `K.dk1`/`K.dk2`.
- `icon` é sempre opcional. Campos `text` são opcionais, salvo indicação.
- Fora da faixa de itens aceita, lançar `Error` com o slide (`where`) e a faixa.

---

## 1. `layers` — camadas empilhadas

**Quando usar:** arquitetura em camadas, níveis de maturidade, pilha tecnológica, "do canal ao dado". Cada camada se apoia na de baixo.

**Diferença de `cards`/`steps`:** a ordem é vertical e significa dependência, não sequência no tempo.

```json
{ "type": "layers", "order": "top-down | bottom-up", "highlight": [1],
  "items": [{ "icon": "users", "title": "Canais", "text": "App, internet banking, agência",
              "tags": ["App", "IB", "Agência"] }] }
```

**Desenho:** faixas horizontais de largura total, empilhadas com espaçamento pequeno. À esquerda, ícone + título numa coluna fixa (~25% da largura); à direita, o texto ou, se houver `tags`, pílulas arredondadas lado a lado. `order: "bottom-up"` (padrão `top-down`) desenha o primeiro item embaixo. Altura de cada faixa limitada com `Math.min` e conjunto centralizado na vertical.

**Faixa:** 2 a 6 camadas. **Limites:** título 30, texto 120, até 6 tags de 18 caracteres.

---

## 2. `cycle` — ciclo contínuo

**Quando usar:** processos que se repetem (PDCA, ciclo de sprint, melhoria contínua, ciclo de feedback).

**Diferença de `steps`:** o último passo volta ao primeiro; não há início nem fim.

```json
{ "type": "cycle", "center": "Melhoria contínua", "centerIcon": "FaSync", "highlight": [0],
  "items": [{ "icon": "bulb", "title": "Planejar", "text": "…" }] }
```

**Desenho:** nós circulares (ícone) distribuídos num círculo, começando no topo e em sentido horário, com setas curtas entre nós vizinhos, inclusive do último para o primeiro. `center` opcional no meio. Título e texto de cada nó ficam do lado de fora do círculo, alinhados conforme o quadrante (à direita para nós à direita, à esquerda para nós à esquerda, centralizado em cima e embaixo). Em área estreita (coluna), reduzir o raio e mostrar só o título.

**Faixa:** 3 a 6 itens. **Limites:** título 25, texto 80.

---

## 3. `options` — opções para decisão

**Quando usar:** apresentar alternativas para a liderança escolher, com a recomendação destacada.

**Diferença de `cards`:** estrutura fixa por opção (resumo, prós, contras, custo/prazo) e um selo de "Recomendada".

```json
{ "type": "options", "recommended": 1,
  "items": [{ "label": "Opção A", "title": "Comprar solução de mercado", "text": "…",
              "pros": ["…"], "cons": ["…"],
              "facts": [{ "label": "Custo", "value": "R$ 1,2 mi" }, { "label": "Prazo", "value": "6 meses" }] }] }
```

**Desenho:** colunas de mesma largura. Topo: `label` (eyebrow) e título. Depois o texto, a lista de prós (ícone de check, cor positiva) e contras (ícone de x, cor de alerta). Rodapé da coluna: `facts` em pares rótulo/valor, alinhados entre colunas (mesma altura de rodapé em todas). A opção `recommended` (índice) ganha borda/fundo de destaque e um selo "Recomendada" no canto superior. Sem `pros`/`cons`/`facts`, a seção some e o espaço é redistribuído.

**Faixa:** 2 a 4 opções. **Limites:** título 45, texto 140, até 3 prós e 3 contras de 60 caracteres, até 3 facts (valor 20).

---

## 4. `prosCons` — prós e contras

**Quando usar:** avaliar uma única proposta, decisão ou tecnologia, com o veredito no fim.

**Diferença de `compare`:** `compare` contrapõe dois cenários linha a linha; `prosCons` são duas listas independentes sobre o mesmo assunto.

```json
{ "type": "prosCons", "pros": { "title": "A favor", "items": ["…"] },
  "cons": { "title": "Contra", "items": ["…"] },
  "verdict": { "title": "Recomendação:", "text": "…" } }
```

**Desenho:** duas colunas. Cabeçalho de cada uma com ícone (check / x) e título (padrão "Prós" e "Contras"), faixa fina na cor positiva/alerta. Itens como lista com ícone pequeno à esquerda. `verdict` opcional numa faixa de largura total embaixo, no estilo de `callout` escuro. Em coluna estreita, empilhar prós sobre contras.

**Faixa:** 1 a 6 itens por lado. **Limites:** item 90, veredito 160.

---

## 5. `funnel` — funil

**Quando usar:** conversão ou redução entre etapas (leads → clientes, ideias → entregas, backlog → produção).

```json
{ "type": "funnel", "highlight": [3],
  "items": [{ "label": "Ideias recebidas", "value": "320", "text": "…" }] }
```

**Desenho:** faixas horizontais centralizadas, cada uma mais estreita que a anterior (trapézios com `pres.shapes.TRAPEZOID` ou retângulos de largura decrescente), cor do mais claro para o mais escuro ou o inverso. Dentro da faixa, `value` em destaque e `label`. `text` opcional à direita do funil, alinhado à faixa correspondente, com uma linha-guia. Opcional `showRate: true`: calcula e mostra a taxa entre etapas quando os `value` são numéricos.

**Faixa:** 3 a 6 etapas. **Limites:** label 30, value 10, texto 90.

---

## 6. `roadmap` — roadmap em trilhas

**Quando usar:** planejamento por período (trimestres, meses) com várias frentes em paralelo.

**Diferença de `timeline`:** `timeline` é uma linha única de fases; `roadmap` é uma grade período × trilha, com itens que podem ocupar vários períodos.

```json
{ "type": "roadmap", "periods": ["T1", "T2", "T3", "T4"], "today": 1.5,
  "lanes": [{ "title": "Plataforma", "icon": "server",
              "items": [{ "title": "Migração", "start": 0, "end": 2, "style": "done | doing | planned", "milestone": false }] }] }
```

**Desenho:** cabeçalho com os períodos em colunas iguais; coluna fixa à esquerda com o nome de cada trilha; linhas finas separando trilhas. Cada item é uma barra arredondada de `start` a `end` (índices de período, aceitando frações), com o título dentro. Estilos: `done` cor sólida escura, `doing` destaque, `planned` contorno. `milestone: true` desenha um losango em `start` com o título ao lado. `today` (opcional, fracionário) desenha uma linha vertical tracejada "Hoje". Itens da mesma trilha que se sobrepõem vão para sub-linhas.

**Faixa:** 2 a 8 períodos, 1 a 6 trilhas. **Limites:** título de trilha 20, título de item 30 (barras curtas cortam antes; o gerador deve avisar se o texto não cabe na largura da barra).

---

## 7. `checklist` — checklist

**Quando usar:** critérios de pronto, pré-requisitos, itens de go-live, conformidade — mostrando o que já está atendido.

**Diferença de `status`:** `status` é uma tabela de acompanhamento com responsável e prazo; `checklist` é uma lista curta de verificação.

```json
{ "type": "checklist", "cols": 2, "showProgress": true,
  "items": [{ "text": "Ambiente provisionado", "state": "done | pending | blocked | na", "note": "…" }] }
```

**Desenho:** lista em 1 ou 2 colunas (`cols`, padrão 1; 2 quando houver mais de 6 itens). Cada linha: caixa de seleção com ícone conforme o estado (check cheio para `done`, vazio para `pending`, x na cor de alerta para `blocked`, traço cinza para `na`), texto e `note` menor ao lado ou embaixo. `done` com texto em cor atenuada. `showProgress` mostra no topo "7 de 10 concluídos" e uma barra de progresso (ignorando `na`).

**Faixa:** 1 a 14 itens. **Limites:** texto 70, nota 60.

---

## Conferência

Para cada bloco, acrescentar em `examples/exemplo.json` um slide com a área inteira e, quando fizer sentido, outro em `layout: "columns"`; testar o menor e o maior número de itens e textos no limite; rodar `node scripts/build-from-spec.js examples/exemplo.json examples/exemplo.pptx` e `node scripts/setup.js`.
