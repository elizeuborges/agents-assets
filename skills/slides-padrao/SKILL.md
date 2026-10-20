---
name: slides-padrao
description: Gera apresentações PowerPoint (.pptx) com uma identidade visual padronizada (paleta, fontes, capa, rodapé e layouts) a partir de um roteiro. Use quando pedirem slides, deck ou apresentação que deva seguir a identidade visual configurada.
---

# Apresentações com identidade visual padrão

Esta skill transforma um roteiro (título, mensagem e blocos de cada slide) num `.pptx` com uma identidade visual fixa. Pessoas e agentes usam o mesmo caminho, então todo deck sai com a mesma capa, as mesmas cores, as mesmas fontes e o mesmo rodapé.

## Onde estão as coisas

| Arquivo | Para que serve |
|---|---|
| `brand/tokens.json` | **Única fonte da identidade visual**: paleta (12 cores de tema + neutros), fontes, rodapé padrão e logo. Nenhum componente tem cor solta. |
| `scripts/setup.js` | Verifica e configura o ambiente (ver `references/setup.md`). |
| `scripts/build-from-spec.js` | Gera o deck a partir de um roteiro JSON. É o caminho padrão. |
| `scripts/slides.js` | Biblioteca JavaScript (sobre pptxgenjs) com slides, blocos e primitivas, para layouts sob medida. |
| `scripts/extract-potx-theme.js` | Lê o template de uma marca (.potx) e atualiza `brand/tokens.json`. |
| `scripts/render.js` | Converte o .pptx em PDF e PNG por slide, para conferência visual, com o PowerPoint (Windows) ou o LibreOffice já instalados. No WSL, usa também os do Windows. |
| `fonts/` | Carlito (licença OFL, mesmas métricas da Calibri), que substitui a Calibri na conferência quando ela falta. O deck continua em Calibri. |
| `references/setup.md` | Configuração do ambiente: só no primeiro uso ou quando um script falhar por dependência. |
| `references/spec-format.md` | Formato completo do roteiro e de cada bloco. |
| `references/adding-blocks.md` | Como criar um bloco novo na biblioteca e no gerador. |
| `examples/exemplo.json` | Roteiro que usa todos os tipos de slide e bloco; `examples/exemplo.pptx` é o resultado. |

Todos os caminhos são relativos à pasta desta skill. Os scripts são Node.js e funcionam em Windows, macOS e Linux.

## Primeiro uso

Se a pasta da skill não tiver `node_modules/`, ou se um script falhar por dependência, leia `references/setup.md` e configure o ambiente antes de seguir. Nos demais usos, não é preciso lê-lo.

## Fluxo padrão

1. **Escreva o roteiro** em JSON (ver `references/spec-format.md` e `examples/exemplo.json`). Um slide, uma mensagem:
   - `title`: curto, até ~60 caracteres.
   - `message`: a frase que a plateia deve lembrar, até ~170 caracteres. Aparece em itálico abaixo do título.
   - `blocks`: um ou mais blocos visuais. O detalhe que não cabe vai em `notes` (notas do apresentador).
2. **Gere o deck**:
   ```bash
   node scripts/build-from-spec.js roteiro.json saida.pptx
   ```
   Avisos `AVISO ... caracteres` indicam texto que tende a estourar a caixa: encurte ou divida o slide.
3. **Confira o resultado**: `node scripts/render.js saida.pptx` e olhe as imagens (ou o PDF, quando não houver imagens). Procure texto cortado ou sobreposto, áreas vazias grandes e slides com texto demais. Corrija o roteiro e gere de novo; nunca edite o .pptx à mão para corrigir layout.
   - O `render.js` usa o PowerPoint e, se não houver, o LibreOffice. No WSL, procura também os programas do Windows. Não instala nada.
   - Se ele sair com código `3` (`SEM CONFERÊNCIA`), não existe ferramenta nesta máquina. Se você tiver outra forma de ver o resultado (por exemplo, ler o .pptx ou o PDF com uma ferramenta própria), use-a. Se não tiver, entregue o deck dizendo claramente que ele **não foi conferido visualmente** e que a pessoa precisa abri-lo e conferir.
4. **Entregue o .pptx** e o roteiro JSON juntos, para que a próxima versão seja gerada pelo mesmo caminho.

## Tipos de slide

| `type` | Uso |
|---|---|
| `cover` | Capa com fundo escuro: título, subtítulo, `meta` (área · data) e até 3 ícones com rótulo. |
| `section` | Abertura de seção, com ícone grande. Cria uma seção no PowerPoint. |
| `content` | Slide de conteúdo: título, mensagem, rodapé, número e `blocks`. |
| `closing` | Encerramento (padrão "Obrigado"), com contato. |

## Blocos de conteúdo

| Bloco | Quando usar |
|---|---|
| `cards` | 2 a 8 ideias paralelas com ícone. `highlight: [i]` escurece um cartão para destacar. |
| `iconList` | Lista vertical de 3 a 6 itens com ícone, título e explicação. |
| `bullets` | Tópicos simples, com subtópicos. Use pouco: prefira `cards` ou `iconList`. |
| `compare` | Antes e depois, ou "hoje" e "proposta", em linhas pareadas. |
| `table` | Tabela com cabeçalho escuro e linhas zebradas. |
| `steps` | Processo da esquerda para a direita, com setas; a última etapa fica em destaque. |
| `timeline` | Fases ou ondas de um plano, em escada; a primeira fica em destaque. |
| `kpis` | 2 a 4 números de destaque. |
| `chart` | Gráfico nativo do PowerPoint (`chartType`: bar, line, pie, doughnut), editável. |
| `callout` | Faixa de conclusão no rodapé do slide (`variant`: dark, light, warn). |
| `quote` | Frase de impacto centralizada. |
| `agenda` | Lista numerada das seções. Sem `items`, usa os slides `section` do roteiro; `current` destaca a seção atual. |
| `imageText` | Imagem (captura de tela, foto, diagrama exportado) com título, texto e tópicos ao lado. |
| `hub` | Um elemento central com até 8 itens ao redor, ligados por linhas: um sistema e suas integrações. |
| `diagram` | Caixas e setas numa grade (`col`, `row`, `colSpan`, `rowSpan`), com rótulos nas setas: arquitetura e fluxos. |
| `matrix` | Matriz 2×2 com eixos rotulados, um quadrante em destaque e pontos posicionados de 0 a 1. |
| `status` | Tabela de acompanhamento com farol (`ok`, `atencao`, `risco`, `concluido`), responsável e prazo. |
| `layers` | Arquitetura em camadas, pilha tecnológica, níveis de maturidade: a ordem vertical significa dependência. |
| `cycle` | Processo que se repete (PDCA, sprint, melhoria contínua): o último passo volta ao primeiro. |
| `options` | 2 a 4 alternativas para a liderança decidir, com prós, contras, custo e prazo, e a recomendada em destaque. |
| `prosCons` | Prós e contras de uma única proposta, com o veredito no fim. Para dois cenários lado a lado, use `compare`. |
| `funnel` | Conversão ou redução entre etapas (ideias → entregas, leads → clientes), com a taxa entre elas. |
| `roadmap` | Plano por período com várias frentes em paralelo (trilhas), itens que ocupam vários períodos e marcos. Para uma linha única de fases, use `timeline`. |
| `checklist` | Lista curta de verificação (critérios de pronto, go-live, pré-requisitos) com o progresso. Para acompanhar responsável e prazo, use `status`. |

Os blocos de um slide ficam empilhados (o `callout` ocupa uma faixa fixa e os outros dividem o espaço pelo `weight`), ou lado a lado com `"layout": "columns"` e `"ratios": [1, 1.2]`.

Ícones: apelidos como `robot`, `users`, `check`, `shield`, `chart`, `rocket`, `bulb` (lista completa em `ICON_ALIASES` na biblioteca) ou qualquer nome `FaXxx` do Font Awesome em react-icons.

## Layouts sob medida

Quando nenhum bloco serve, use a biblioteca diretamente e componha com as primitivas, sempre com as cores de `deck.colors`:

```js
const { createDeck } = require("<pasta-da-skill>/scripts/slides.js");
const deck = await createDeck({ title: "Título do arquivo", footer: "Área  ·  Assunto" });
await deck.cover({ title: "…", subtitle: "…", meta: "Área  ·  Outubro de 2026" });
const s = deck.content({ title: "…", message: "…", notes: "…" });
const [esq, dir] = deck.split(s._area, [1, 1]);          // áreas em polegadas
await deck.cards(s, [{ icon: "robot", title: "…", text: "…" }], { area: esq, cols: 1 });
deck.box(s, dir.x, dir.y, dir.w, dir.h, deck.colors.lt2);
deck.text(s, "…", { x: dir.x + 0.2, y: dir.y + 0.2, w: dir.w - 0.4, h: 1, fontSize: 14, color: deck.colors.dk2 });
await deck.save("saida.pptx");                          // também grava a paleta no tema do arquivo
```

Primitivas: `text`, `box`, `icon`, `circleIcon`, `arrow`, `eyebrow`, `shadow`, `split`. O objeto `deck.pres` é a instância pptxgenjs, para o que a biblioteca não cobre. Slide 16:9 (13,333 × 7,5 pol.); a área útil de conteúdo é `deck.AREA`.

Regras para manter a identidade:
- Cor só de `deck.colors` (chaves de `brand/tokens.json`), nunca hex solto no script.
- Fonte só a do tema; corpo de texto entre 10,5 e 16 pt, títulos de cartão 13 a 15 pt.
- Margens laterais de 0,6 pol. e nada abaixo de y = 6,85 (faixa do rodapé).
- Para criar um bloco novo, siga `references/adding-blocks.md`.

## Papel de cada cor do tema

| Chave | Exemplo atual | Uso |
|---|---|---|
| `dk2` | `0F4D2A` verde escuro | Fundo de capa e seção, títulos, cartões em destaque |
| `accent1` | `3FA535` verde | Destaques, ícones, números |
| `accent2` | `8CC63F` verde claro | Texto de destaque sobre fundo escuro |
| `accent4` | `1E6B52` verde petróleo | Mensagem-chave, rótulos |
| `lt2` | `EEF5EC` verde muito claro | Fundo de cartões |
| `accent6` | `D5E8CF` verde suave | Cabeçalhos claros, subtítulo da capa |
| `accent3` | `F2A900` amarelo | Alertas, pontos na matriz, status "atenção" |
| `extra.danger` | `C8382E` vermelho | Status "em risco" |
| `dk1` / `accent5` | `1B2A22` / `6B7A72` | Texto e texto secundário |

A paleta que vem com a skill é só um exemplo. Ao trocar a marca, mantenha o papel de cada chave: `dk2` escuro o bastante para texto branco, `lt2` claro o bastante para texto `dk1`.

## Usar a identidade de outra marca

1. Com o template da marca (.potx ou um .pptx feito a partir dele): `node scripts/extract-potx-theme.js Template.potx` atualiza a paleta e as fontes em `brand/tokens.json`. Sem template, edite as cores e as fontes à mão.
2. Coloque o logo em PNG (versão clara e versão colorida) em `brand/` e preencha `logo.onDark` e `logo.onLight` em `brand/tokens.json`. A capa mostra o logo claro e os slides de conteúdo o colorido no canto superior direito. Defina também `name` e `footer`.
3. Se a marca tiver capa ou rodapé com desenho próprio (faixas, grafismos), ajuste os layouts `CAPA` e `CONTEUDO` em `createDeck` (`scripts/slides.js`), o único lugar onde a moldura dos slides é desenhada.
4. Rode `node scripts/setup.js`, gere `examples/exemplo.json` de novo e confira com `render.js` (ou abrindo o .pptx).

A biblioteca recria os layouts em vez de abrir o .potx, porque o pptxgenjs não parte de um template existente. Se o arquivo final precisar usar os layouts mestres do .potx (por exemplo, para quem edita escolher "Novo slide" com os layouts oficiais), preencha o template por XML com a skill `pptx` e use esta skill só para o roteiro e as regras de conteúdo.
