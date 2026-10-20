# Como adicionar um bloco novo

Um bloco é uma função que desenha um tipo de conteúdo dentro de uma área retangular do slide. Criar um bloco envolve cinco arquivos, sempre nesta ordem:

| # | Arquivo | O que muda |
|---|---|---|
| 1 | `scripts/slides.js` | A função que desenha o bloco, exportada no objeto `deck`. |
| 2 | `scripts/build-from-spec.js` | Um `case` em `renderBlock`, com os avisos de texto longo. |
| 3 | `references/spec-format.md` | O formato JSON do bloco e os limites de texto. |
| 4 | `SKILL.md` | Uma linha na tabela "Blocos de conteúdo" dizendo quando usar. |
| 5 | `examples/exemplo.json` | Um slide que usa o bloco, para servir de exemplo e de teste. |

## Antes de escrever código

- **Confira se um bloco existente resolve.** Muitas vezes `cards` com `highlight`, `compare` ou duas colunas com `layout: "columns"` já dão conta. Um bloco novo se justifica quando o mesmo desenho sob medida aparece em mais de um deck.
- **Esboce o bloco numa área qualquer**, não num slide inteiro. Ele precisa funcionar ocupando toda a área útil (12,13 × 4,95 pol.) e também metade dela, numa coluna.
- **Defina o formato JSON primeiro**: nomes curtos, em inglês como os demais (`items`, `title`, `text`, `icon`, `highlight`), e listas de objetos em vez de listas paralelas.

## 1. A função em `scripts/slides.js`

Escreva a função dentro de `createDeck`, perto dos outros blocos, seguindo este molde:

```js
  // Uma linha dizendo o que o bloco mostra e o formato da entrada: { items: [{ title, text }] }
  async function meuBloco(s, { items }, { area } = {}) {
    const A = areaOf(s, area);                 // área recebida, ou a área útil do slide
    const n = items.length, gap = 0.25;
    const w = (A.w - gap * (n - 1)) / n;       // tudo calculado a partir de A, nunca coordenadas fixas
    for (const [i, it] of items.entries()) {
      const x = A.x + i * (w + gap);
      box(s, x, A.y, w, A.h, K.lt2);
      if (it.icon) await circleIcon(s, it.icon, x + 0.2, A.y + 0.2, 0.5, K.dk2);
      text(s, it.title, { x: x + 0.2, y: A.y + 0.85, w: w - 0.4, h: 0.5, fontSize: 14, bold: true, color: K.dk2 });
    }
  }
```

Depois, acrescente o nome ao objeto devolvido no fim de `createDeck` (a lista `// componentes`).

Regras:
- **Posição e tamanho só a partir de `A`** (`A.x`, `A.y`, `A.w`, `A.h`). É isso que permite usar o bloco em colunas.
- **Cores só de `K`** (as chaves de `brand/tokens.json`). Se precisar de uma cor nova, acrescente-a em `extra` no `tokens.json`; nunca escreva hex no bloco. Fundo escuro pede texto `K.lt1`; fundo claro, `K.dk1` ou `K.dk2`.
- **Use as primitivas**: `text`, `box`, `icon`, `circleIcon`, `arrow`, `eyebrow`, `shadow`. Para o que elas não cobrem, `pres.shapes` e `s.addShape`/`s.addTable`/`s.addChart` do pptxgenjs.
- **Função `async` só se usar ícone ou imagem** (`icon`, `circleIcon` e `sharp` são assíncronos).
- **Limite a altura dos elementos** com `Math.min(...)` para que um bloco com poucos itens não vire caixas enormes e vazias; quando sobrar espaço, centralize na vertical (veja `cards` e `agenda`).
- **Cuidados do pptxgenjs**: hex sem `#`; um objeto de opções novo a cada chamada (a biblioteca altera os objetos que recebe; por isso `shadow()` é uma função); `breakLine: true` em cada trecho de texto, menos no último; nunca o caractere `•` à mão, use `bullet`.

## 2. O `case` em `scripts/build-from-spec.js`

```js
    case "meuBloco":
      b.items.forEach((it, i) => check(`${where} item ${i + 1}`, it.title, 40));
      return deck.meuBloco(s, b, o);
```

- `check(onde, valor, limite)` registra um aviso quando o texto passa do limite. Calibre o limite gerando o bloco com textos de tamanhos diferentes e vendo onde começa a estourar.
- Erros de formato (um id que não existe, um valor fora da lista) devem lançar `Error` com o slide (`where`) e o que está errado.
- Se o bloco precisar de uma altura fixa quando empilhado (como o `callout`), acrescente-o em `FIXED_H`.
- Caminhos de arquivo no roteiro são relativos ao arquivo do roteiro: resolva com `path.resolve(ctx.baseDir, ...)`, como faz o `imageText`.

## 3 e 4. Documentação

- Em `references/spec-format.md`, acrescente o JSON completo do bloco, com todos os campos opcionais, e os limites de texto na tabela.
- Em `SKILL.md`, uma linha na tabela de blocos: o nome e **quando usar**, não como funciona.

## 5. Exemplo e conferência

1. Acrescente um slide com o bloco em `examples/exemplo.json`. Se o bloco funciona em coluna, mostre-o também num slide com `layout: "columns"`.
2. Gere e confira:
   ```bash
   node scripts/build-from-spec.js examples/exemplo.json examples/exemplo.pptx
   node scripts/render.js examples/exemplo.pptx
   ```
3. Nas imagens (ou no .pptx aberto no PowerPoint, se o `render.js` avisar que não há ferramenta de conferência), procure: texto cortado ou fora da caixa, sobreposição, contraste ruim (texto escuro em fundo escuro), espaço vazio grande e alinhamento com as margens dos outros blocos.
4. Teste também os extremos: o menor e o maior número de itens que o bloco aceita, e textos no limite.
5. Rode `node scripts/setup.js`: a etapa 5 gera o exemplo inteiro e falha se algum bloco lançar erro.
