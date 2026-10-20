#!/usr/bin/env node
// Gera um .pptx com a identidade visual de brand/tokens.json a partir de um roteiro em JSON.
//
//   node build-from-spec.js roteiro.json saida.pptx [--tokens outro-tokens.json]
//
// Formato do roteiro: ver references/spec-format.md. Caminhos de imagem são relativos ao arquivo do roteiro. Avisos de texto longo vão para o stderr;
// o arquivo é gerado mesmo assim, mas vale encurtar o texto ou dividir o slide.
const fs = require("fs");
const path = require("path");
const { createDeck, loadTokens } = require("./slides");

// Limites de caracteres a partir dos quais o texto tende a estourar a caixa.
const LIMITS = { title: 60, message: 170, cardTitle: 45, cardText: 200, rowText: 110, stepText: 90, waveText: 330 };
const warnings = [];
const check = (where, value, max) => {
  if (value && String(value).length > max) warnings.push(`${where}: ${String(value).length} caracteres (recomendado até ${max})`);
};

// Altura fixa de alguns blocos quando empilhados; os demais dividem o restante.
const FIXED_H = { callout: 0.68 };

async function renderBlock(deck, s, b, area, where, ctx) {
  const o = { area };
  switch (b.type) {
    case "cards":
      b.items.forEach((it, i) => { check(`${where} card ${i + 1} título`, it.title, LIMITS.cardTitle); check(`${where} card ${i + 1} texto`, it.text, LIMITS.cardText); });
      return deck.cards(s, b.items, Object.assign(o, { cols: b.cols, highlight: b.highlight || [], style: b.style }));
    case "iconList":
      b.items.forEach((it, i) => check(`${where} item ${i + 1}`, it.text, LIMITS.cardText));
      return deck.iconList(s, b.items, o);
    case "bullets":
      return deck.bullets(s, b.items, Object.assign(o, { fontSize: b.fontSize }));
    case "compare":
      b.rows.forEach((r, i) => r.forEach((c) => check(`${where} linha ${i + 1}`, c, LIMITS.rowText)));
      return deck.compare(s, b, o);
    case "table":
      return deck.table(s, b, Object.assign(o, { fontSize: b.fontSize }));
    case "steps":
      b.items.forEach((it, i) => check(`${where} etapa ${i + 1}`, it.text, LIMITS.stepText));
      return deck.steps(s, b.items, Object.assign(o, { highlightLast: b.highlightLast !== false }));
    case "timeline":
      b.items.forEach((it, i) => check(`${where} fase ${i + 1}`, it.text, LIMITS.waveText));
      return deck.timeline(s, b.items, Object.assign(o, { highlight: b.highlight || [0] }));
    case "kpis":
      return deck.kpis(s, b.items, o);
    case "callout":
      return deck.callout(s, b, o);
    case "quote":
      return deck.quote(s, b, o);
    case "chart":
      return deck.chart(s, b, o);
    case "agenda": {
      // sem itens, a agenda lista os slides de seção do roteiro; `current` aceita índice ou título
      const items = b.items || ctx.sections;
      if (!items.length) throw new Error(`${where}: agenda sem itens e o roteiro não tem slides "section"`);
      const titles = items.map((it) => (typeof it === "string" ? it : it.title));
      const current = typeof b.current === "string" ? titles.indexOf(b.current) : b.current ?? -1;
      return deck.agenda(s, items, Object.assign(o, { current }));
    }
    case "imageText":
      check(`${where} texto`, b.text, 400);
      return deck.imageText(s, Object.assign({}, b, { image: b.image && path.resolve(ctx.baseDir, b.image) }), o);
    case "hub":
      if (b.items.length > 8) warnings.push(`${where}: hub com ${b.items.length} itens (recomendado até 8)`);
      b.items.forEach((it, i) => check(`${where} item ${i + 1}`, it.text, 90));
      return deck.hub(s, b, o);
    case "diagram":
      return deck.diagram(s, b, o);
    case "matrix":
      (b.quadrants || []).forEach((q, i) => check(`${where} quadrante ${i + 1}`, q.text, 160));
      return deck.matrix(s, b, o);
    case "status":
      b.rows.forEach((r, i) => check(`${where} linha ${i + 1} observação`, r.note, 70));
      return deck.status(s, b, Object.assign(o, { fontSize: b.fontSize }));
    default:
      throw new Error(`${where}: bloco desconhecido "${b.type}"`);
  }
}

async function build(spec, out, tokensPath, baseDir = process.cwd()) {
  const ctx = { baseDir, sections: spec.slides.filter((x) => x.type === "section").map((x) => ({ title: x.title, text: x.subtitle })) };
  const tokens = loadTokens(tokensPath);
  const deck = await createDeck({ tokens, title: spec.title, author: spec.author, footer: spec.footer });
  for (const [i, sl] of spec.slides.entries()) {
    const where = `slide ${i + 1}`;
    check(`${where} título`, sl.title, LIMITS.title);
    if (sl.type === "cover") { await deck.cover(sl); continue; }
    if (sl.type === "section") { await deck.section(sl); continue; }
    if (sl.type === "closing") { await deck.closing(sl); continue; }
    if (sl.type && sl.type !== "content") throw new Error(`${where}: tipo de slide desconhecido "${sl.type}"`);

    check(`${where} mensagem`, sl.message, LIMITS.message);
    const s = deck.content(sl);
    const blocks = sl.blocks || [];
    const A = s._area;
    if (sl.layout === "columns") {
      const areas = deck.split(A, sl.ratios || blocks.map(() => 1));
      for (const [j, b] of blocks.entries()) await renderBlock(deck, s, b, areas[j], where, ctx);
    } else {
      // empilhado: blocos de altura fixa ficam com a altura deles; os outros dividem o resto por "weight"
      const gap = 0.25;
      const fixed = blocks.reduce((t, b) => t + (FIXED_H[b.type] || 0), 0);
      const flex = blocks.filter((b) => !FIXED_H[b.type]);
      const totalW = flex.reduce((t, b) => t + (b.weight || 1), 0);
      const free = A.h - fixed - gap * (blocks.length - 1);
      let y = A.y;
      for (const b of blocks) {
        const h = FIXED_H[b.type] || (free * (b.weight || 1)) / totalW;
        await renderBlock(deck, s, b, { x: A.x, y, w: A.w, h }, where, ctx);
        y += h + gap;
      }
    }
  }
  await deck.save(out);
  return warnings;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const ti = args.indexOf("--tokens");
  const tokensPath = ti >= 0 ? path.resolve(args.splice(ti, 2)[1]) : undefined;
  const [specPath, out] = args;
  if (!specPath || !out) {
    console.error("uso: node build-from-spec.js roteiro.json saida.pptx [--tokens tokens.json]");
    process.exit(2);
  }
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  build(spec, out, tokensPath, path.dirname(path.resolve(specPath))).then((w) => {
    w.forEach((m) => console.error("AVISO " + m));
    console.log(`gerado ${out} (${spec.slides.length} slides${w.length ? `, ${w.length} avisos` : ""})`);
  }, (e) => { console.error("ERRO " + e.message); process.exit(1); });
}

module.exports = { build };
