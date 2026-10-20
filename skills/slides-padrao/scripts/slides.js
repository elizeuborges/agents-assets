// Biblioteca de slides com identidade visual padronizada, sobre pptxgenjs.
//
//   const { createDeck } = require("<skill>/scripts/slides.js");
//   const deck = await createDeck({ title: "Minha apresentação", footer: "Área · Assunto" });
//   deck.cover({ title: "...", subtitle: "...", meta: "Área · Mês de Ano" });
//   const s = deck.content({ title: "...", message: "Uma frase com a mensagem do slide." });
//   await deck.cards(s, [{ icon: "robot", title: "...", text: "..." }, ...]);
//   await deck.save("saida.pptx");
//
// Toda cor, fonte, rodapé e logo vem de brand/tokens.json. Nada de cor solta nos componentes.
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const RDS = require("react-dom/server");
const sharp = require("sharp");

const SKILL_DIR = path.resolve(__dirname, "..");
const DEFAULT_TOKENS = path.join(SKILL_DIR, "brand", "tokens.json");

// Apelidos curtos para ícones Font Awesome (react-icons/fa). Qualquer nome "FaXxx" também funciona.
const ICON_ALIASES = {
  robot: "FaRobot", question: "FaQuestionCircle", sitemap: "FaSitemap", layers: "FaLayerGroup",
  users: "FaUsers", user: "FaUser", route: "FaRoute", userCheck: "FaUserCheck", book: "FaBook",
  building: "FaBuilding", history: "FaHistory", tachometer: "FaTachometerAlt", code: "FaCode",
  graph: "FaProjectDiagram", jira: "FaJira", gitlab: "FaGitlab", confluence: "FaConfluence",
  database: "FaDatabase", cubes: "FaCubes", check: "FaCheckCircle", search: "FaSearch",
  lock: "FaLock", cogs: "FaCogs", flow: "FaStream", arrow: "FaArrowRight", shield: "FaShieldAlt",
  clipboard: "FaClipboardCheck", server: "FaServer", plug: "FaPlug", flag: "FaFlag",
  times: "FaTimesCircle", terminal: "FaTerminal", brain: "FaBrain", list: "FaListUl",
  file: "FaFileAlt", sensor: "FaSatelliteDish", eye: "FaEye", hands: "FaHandshake",
  chart: "FaChartLine", bars: "FaChartBar", money: "FaCoins", clock: "FaClock", calendar: "FaCalendarAlt",
  rocket: "FaRocket", bulb: "FaLightbulb", target: "FaBullseye", star: "FaStar", heart: "FaHeart",
  warning: "FaExclamationTriangle", info: "FaInfoCircle", leaf: "FaLeaf", handshake: "FaHandshake",
  piggy: "FaPiggyBank", mobile: "FaMobileAlt", cloud: "FaCloud", globe: "FaGlobeAmericas",
  people: "FaUserFriends", comments: "FaComments", tools: "FaTools", puzzle: "FaPuzzlePiece",
};

// Área útil de um slide de conteúdo (polegadas, LAYOUT_WIDE 13,333 x 7,5).
const PAGE = { w: 13.333, h: 7.5, mx: 0.6 };
const AREA = { x: 0.6, y: 1.9, w: 12.13, h: 4.95 };
const AREA_NO_MSG = { x: 0.6, y: 1.35, w: 12.13, h: 5.5 };

function loadTokens(tokensPath = DEFAULT_TOKENS) {
  const t = JSON.parse(fs.readFileSync(tokensPath, "utf8"));
  t._dir = path.dirname(tokensPath);
  return t;
}

async function createDeck(opts = {}) {
  const tokens = opts.tokens || loadTokens(opts.tokensPath);
  const K = Object.assign({}, tokens.colors, tokens.extra);
  const FONT = tokens.fonts;
  const footer = opts.footer || tokens.footer || "";

  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.title = opts.title || "Apresentação";
  pres.author = opts.author || tokens.name;
  pres.company = (tokens.name || "").replace(/&/g, "&amp;");
  pres.theme = { headFontFace: FONT.head, bodyFontFace: FONT.body };

  // ---------- logo (opcional) ----------
  const logo = {};
  for (const k of ["onDark", "onLight"]) {
    const rel = tokens.logo && tokens.logo[k];
    if (!rel) continue;
    const p = path.resolve(tokens._dir, rel);
    if (!fs.existsSync(p)) { console.warn(`[slides-padrao] logo ${k} não encontrado: ${p}`); continue; }
    const meta = await sharp(p).metadata();
    logo[k] = { path: p, ratio: meta.width / meta.height };
  }
  const logoObj = (k, x, y, h, alignRight) => {
    const l = logo[k]; if (!l) return [];
    const w = h * l.ratio;
    return [{ image: { path: l.path, x: alignRight ? x - w : x, y, w, h } }];
  };

  // ---------- layouts ----------
  pres.defineSlideMaster({
    title: "CAPA",
    background: { color: K.dk2 },
    objects: [
      ...logoObj("onDark", 0.9, 0.6, 0.55),
      { placeholder: { options: { name: "title", type: "title", x: 0.9, y: 2.2, w: 9.0, h: 1.6, fontSize: 50, bold: true, color: K.lt1, fontFace: FONT.head, valign: "bottom", align: "left", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.9, y: 3.95, w: 9.0, h: 1.0, fontSize: 22, color: K.accent6, fontFace: FONT.body, valign: "top", align: "left", margin: 0 }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "CONTEUDO",
    background: { color: K.lt1 },
    margin: [0.4, 0.6, 0.6, 0.6],
    objects: [
      ...logoObj("onLight", PAGE.w - PAGE.mx, 0.42, 0.42, true),
      { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: logo.onLight ? 10.6 : 12.13, h: 0.7, fontSize: 30, bold: true, color: K.dk2, fontFace: FONT.head, valign: "middle", align: "left", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "msg", type: "body", x: 0.6, y: 1.05, w: 12.13, h: 0.7, fontSize: 16, italic: true, color: K.accent4, fontFace: FONT.body, valign: "top", align: "left", margin: 0 }, text: "" } },
      { rect: { x: 0.6, y: 6.93, w: 12.13, h: 0.012, fill: { color: K.border }, line: { color: K.border, width: 0 } } },
      { text: { text: footer, options: { x: 0.6, y: 7.0, w: 10, h: 0.3, fontSize: 10, color: K.accent5, fontFace: FONT.body, margin: 0 } } },
    ],
    slideNumber: { x: 12.23, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: K.accent5, align: "right" },
  });

  // ---------- primitivas ----------
  const iconCache = new Map();
  async function iconData(name, color) {
    const key = name + "|" + color;
    if (iconCache.has(key)) return iconCache.get(key);
    const fa = require("react-icons/fa");
    const comp = fa[ICON_ALIASES[name] || name];
    if (!comp) throw new Error(`Ícone desconhecido: "${name}". Use um apelido (${Object.keys(ICON_ALIASES).join(", ")}) ou um nome FaXxx de react-icons/fa.`);
    const svg = RDS.renderToStaticMarkup(React.createElement(comp, { color: "#" + color, size: 256 }));
    const data = "image/png;base64," + (await sharp(Buffer.from(svg)).png().toBuffer()).toString("base64");
    iconCache.set(key, data);
    return data;
  }

  const text = (s, t, o) => s.addText(t, Object.assign({ isTextBox: true, margin: 0, valign: "top", color: K.dk1, fontSize: 12, fontFace: FONT.body }, o));
  const box = (s, x, y, w, h, fill, o = {}) =>
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, Object.assign({ x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: fill, width: 0 } }, o));
  const shadow = () => ({ type: "outer", color: "000000", opacity: 0.12, blur: 6, offset: 2, angle: 90 });
  async function icon(s, name, x, y, size, color = K.dk2) {
    s.addImage({ data: await iconData(name, color), x, y, w: size, h: size });
  }
  async function circleIcon(s, name, x, y, d, bg = K.dk2, fg = K.lt1) {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: bg }, line: { color: bg, width: 0 } });
    const p = d * 0.26;
    s.addImage({ data: await iconData(name, fg), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p });
  }
  const arrow = (s, x1, y1, x2, y2, o = {}) => s.addShape(pres.shapes.LINE, {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
    flipH: x2 < x1, flipV: y2 < y1,
    line: Object.assign({ color: K.accent5, width: 1.5, endArrowType: "triangle" }, o),
  });
  const eyebrow = (s, t, x, y, w, color = K.accent4) =>
    text(s, t.toUpperCase(), { x, y, w, h: 0.3, fontSize: 9.5, bold: true, color, charSpacing: 1 });

  // Divide uma área em colunas (ratios) ou linhas, com espaçamento.
  function split(area, ratios = [1, 1], { gap = 0.3, dir = "cols" } = {}) {
    const total = ratios.reduce((a, b) => a + b, 0);
    const span = (dir === "cols" ? area.w : area.h) - gap * (ratios.length - 1);
    let cur = dir === "cols" ? area.x : area.y;
    return ratios.map((r) => {
      const size = (span * r) / total;
      const a = dir === "cols" ? { x: cur, y: area.y, w: size, h: area.h } : { x: area.x, y: cur, w: area.w, h: size };
      cur += size + gap;
      return a;
    });
  }

  let currentSection = null;
  const sectionOf = (sec) => {
    if (sec && sec !== currentSection) { pres.addSection({ title: sec }); currentSection = sec; }
    return currentSection || undefined;
  };

  // ---------- slides ----------
  async function cover({ title, subtitle = "", meta = "", icons = [], notes, section } = {}) {
    const s = pres.addSlide({ masterName: "CAPA", sectionTitle: sectionOf(section || "Abertura") });
    s.addText(title, { placeholder: "title" });
    if (subtitle) s.addText(subtitle, { placeholder: "body" });
    if (meta) text(s, meta, { x: 0.9, y: 6.4, w: 9, h: 0.4, fontSize: 14, color: K.accent2 });
    // motivo: até 3 ícones em ciclo à direita; sem ícones, um círculo decorativo
    const pos = [[0.9, 0], [0, 2.1], [1.8, 2.1]];
    const cx = 10.2, cy = 1.6;
    if (icons.length) {
      for (const [i, it] of icons.slice(0, 3).entries()) {
        const { icon: ic, label } = typeof it === "string" ? { icon: it } : it;
        const [dx, dy] = pos[i];
        await circleIcon(s, ic, cx + dx, cy + dy, 1.2, K.accent1);
        if (label) text(s, label, { x: cx + dx - 0.4, y: cy + dy + 1.28, w: 2.0, h: 0.35, fontSize: 13, color: K.lt1, align: "center" });
      }
    } else {
      s.addShape(pres.shapes.OVAL, { x: 9.9, y: 1.4, w: 3.6, h: 3.6, fill: { color: K.accent4 }, line: { color: K.accent4, width: 0 } });
      s.addShape(pres.shapes.OVAL, { x: 11.2, y: 3.9, w: 1.6, h: 1.6, fill: { color: K.accent1 }, line: { color: K.accent1, width: 0 } });
    }
    if (notes) s.addNotes(notes);
    return s;
  }

  async function sectionSlide({ title, subtitle = "", icon: ic, notes } = {}) {
    const s = pres.addSlide({ masterName: "CAPA", sectionTitle: sectionOf(title) });
    s.addText(title, { placeholder: "title" });
    if (subtitle) s.addText(subtitle, { placeholder: "body" });
    if (ic) await circleIcon(s, ic, 10.4, 2.7, 1.6, K.accent1);
    if (notes) s.addNotes(notes);
    return s;
  }

  function content({ title, message = "", notes, section } = {}) {
    const s = pres.addSlide({ masterName: "CONTEUDO", sectionTitle: sectionOf(section) });
    s.addText(title.length > 40 ? [{ text: title, options: { fontSize: 26 } }] : title, { placeholder: "title" });
    if (message) s.addText(message, { placeholder: "msg" });
    if (notes) s.addNotes(notes);
    s._area = Object.assign({}, message ? AREA : AREA_NO_MSG);
    return s;
  }

  async function closing({ title = "Obrigado", subtitle = "", contact = "", notes } = {}) {
    const s = pres.addSlide({ masterName: "CAPA", sectionTitle: currentSection || undefined });
    s.addText(title, { placeholder: "title" });
    if (subtitle) s.addText(subtitle, { placeholder: "body" });
    if (contact) text(s, contact, { x: 0.9, y: 6.4, w: 9, h: 0.4, fontSize: 14, color: K.accent2 });
    s.addShape(pres.shapes.OVAL, { x: 10.6, y: 2.4, w: 2.2, h: 2.2, fill: { color: K.accent1 }, line: { color: K.accent1, width: 0 } });
    if (notes) s.addNotes(notes);
    return s;
  }

  // ---------- componentes (desenham dentro de uma área; padrão = área útil do slide) ----------
  const areaOf = (s, a) => a || s._area || AREA;
  // estimativa de linhas que um texto ocupa numa largura (pol.) e corpo (pt)
  const estLines = (t, w, fs) => Math.ceil(String(t).length / ((w * 72) / (fs * 0.5)));

  // Grade de cartões: [{ icon, title, text }]. highlight: índices com fundo escuro.
  async function cards(s, items, { area, cols, highlight = [], style = "tint" } = {}) {
    const A = areaOf(s, area);
    const n = items.length;
    const C = cols || (n <= 4 ? n : n === 5 || n === 6 || n === 9 ? 3 : 4);
    const R = Math.ceil(n / C), gap = 0.25;
    const w = (A.w - gap * (C - 1)) / C;
    const maxH = (A.h - gap * (R - 1)) / R;
    const small = maxH < 1.7 || w < 3;
    // altura pelo conteúdo: o cartão não fica maior que o texto mais longo pede
    const fs = small ? 11 : 12, d0 = small ? 0.46 : 0.58;
    const lines = Math.max(1, ...items.map((it) => estLines(it.text || "", w - 0.44, fs)));
    const h = Math.min(maxH, Math.max(0.22 + d0 + 0.15 + (lines * fs * 1.3) / 72 + 0.3, small ? 1.2 : 1.9));
    const oy = (A.h - (R * h + gap * (R - 1))) / 2; // grade centralizada na vertical da área
    for (const [i, it] of items.entries()) {
      const x = A.x + (i % C) * (w + gap), y = A.y + oy + Math.floor(i / C) * (h + gap);
      const dark = highlight.includes(i);
      const fill = dark ? K.dk2 : style === "outline" ? K.lt1 : K.lt2;
      box(s, x, y, w, h, fill, style === "outline" && !dark ? { line: { color: K.border, width: 1 }, shadow: shadow() } : {});
      const d = small ? 0.46 : 0.58, pad = 0.22;
      let ty = y + pad;
      if (it.icon) await circleIcon(s, it.icon, x + pad, y + pad, d, dark ? K.accent1 : K.dk2);
      text(s, it.title, { x: x + pad + (it.icon ? d + 0.15 : 0), y: ty, w: w - 2 * pad - (it.icon ? d + 0.15 : 0), h: d, fontSize: small ? 13 : 14.5, bold: true, color: dark ? K.lt1 : K.dk2, valign: "middle" });
      ty += d + 0.15;
      if (it.text) text(s, it.text, { x: x + pad, y: ty, w: w - 2 * pad, h: y + h - ty - 0.12, fontSize: small ? 11 : 12, color: dark ? K.lt1 : K.dk1 });
    }
  }

  // Lista com ícones em linhas: [{ icon, title, text }]
  async function iconList(s, items, { area } = {}) {
    const A = areaOf(s, area);
    const rh = Math.min(A.h / items.length, 1.05), d = Math.min(0.56, rh - 0.2);
    for (const [i, it] of items.entries()) {
      const y = A.y + i * rh;
      await circleIcon(s, it.icon || "check", A.x, y, d, K.dk2);
      text(s, [
        { text: it.title, options: { bold: true, fontSize: 14, color: K.dk2, breakLine: !!it.text } },
        ...(it.text ? [{ text: it.text, options: { fontSize: 12 } }] : []),
      ], { x: A.x + d + 0.25, y: y - 0.02, w: A.w - d - 0.25, h: rh - 0.08 });
    }
  }

  // Tópicos simples: ["texto", { text, sub: ["..."] }]
  function bullets(s, items, { area, fontSize = 16 } = {}) {
    const A = areaOf(s, area);
    const runs = [];
    items.forEach((it) => {
      const o = typeof it === "string" ? { text: it } : it;
      runs.push({ text: o.text, options: { bullet: { indent: 18 }, breakLine: true } });
      (o.sub || []).forEach((t) => runs.push({ text: t, options: { bullet: { indent: 18 }, indentLevel: 1, fontSize: fontSize - 2, color: K.accent5, breakLine: true } }));
    });
    if (runs.length) delete runs[runs.length - 1].options.breakLine;
    text(s, runs, { x: A.x, y: A.y, w: A.w, h: A.h, fontSize, paraSpaceAfter: 8 });
  }

  // Comparação lado a lado: { left: { title, icon }, right: { title, icon }, rows: [[a, b], ...] }
  async function compare(s, { left, right, rows }, { area } = {}) {
    const A = areaOf(s, area);
    const mid = 0.9, cw = (A.w - mid) / 2, xr = A.x + cw + mid;
    box(s, A.x, A.y, cw, 0.5, K.accent6);
    box(s, xr, A.y, cw, 0.5, K.dk2);
    if (left.icon) await icon(s, left.icon, A.x + 0.2, A.y + 0.1, 0.3, K.dk2);
    if (right.icon) await icon(s, right.icon, xr + 0.2, A.y + 0.1, 0.3, K.lt1);
    text(s, left.title, { x: A.x + (left.icon ? 0.65 : 0.2), y: A.y, w: cw - 0.8, h: 0.5, fontSize: 15, bold: true, color: K.dk2, valign: "middle" });
    text(s, right.title, { x: xr + (right.icon ? 0.65 : 0.2), y: A.y, w: cw - 0.8, h: 0.5, fontSize: 15, bold: true, color: K.lt1, valign: "middle" });
    const rh = Math.min((A.h - 0.62) / rows.length, 0.9);
    for (const [i, [a, b]] of rows.entries()) {
      const y = A.y + 0.62 + i * rh, h = rh - 0.1;
      box(s, A.x, y, cw, h, K.neutralBg);
      text(s, a, { x: A.x + 0.2, y, w: cw - 0.35, h, fontSize: 12.5, color: K.accent5, valign: "middle" });
      await icon(s, "arrow", A.x + cw + mid / 2 - 0.15, y + h / 2 - 0.13, 0.3, K.accent1);
      box(s, xr, y, cw, h, K.lt2);
      text(s, b, { x: xr + 0.2, y, w: cw - 0.35, h, fontSize: 12.5, valign: "middle" });
    }
  }

  // Tabela: { header: [...], rows: [[...]], colW?: [...] }. Primeira coluna em negrito.
  function table(s, { header, rows, colW }, { area, fontSize = 12.5 } = {}) {
    const A = areaOf(s, area);
    const H = (t) => ({ text: t, options: { bold: true, fontSize: fontSize + 1, fill: { color: K.dk2 }, color: K.lt1, valign: "middle" } });
    const data = header ? [header.map(H)] : [];
    rows.forEach((r, i) => {
      const fill = { color: i % 2 ? K.lt1 : K.zebra };
      data.push(r.map((c, j) => ({ text: String(c), options: Object.assign({ fill }, j === 0 ? { bold: true, color: K.dk2 } : {}) })));
    });
    const rowH = Math.min(A.h / data.length, 0.75);
    s.addTable(data, {
      x: A.x, y: A.y, w: A.w, colW, rowH, fontSize, fontFace: FONT.body, color: K.dk1, valign: "middle",
      border: { type: "solid", pt: 0.75, color: K.border }, margin: [0.05, 0.15, 0.05, 0.15],
    });
  }

  // Processo em etapas, da esquerda para a direita: [{ icon, title, text }]. A última fica em destaque.
  async function steps(s, items, { area, highlightLast = true } = {}) {
    const A = areaOf(s, area);
    const n = items.length, G = 0.35;
    const W = (A.w - G * (n - 1)) / n, H = Math.min(A.h, 2.4);
    for (const [i, it] of items.entries()) {
      const x = A.x + i * (W + G), last = highlightLast && i === n - 1;
      box(s, x, A.y, W, H, last ? K.accent1 : i % 2 ? K.dk2 : K.lt2);
      const dark = last || i % 2 === 1;
      const d = 0.6;
      if (it.icon) await circleIcon(s, it.icon, x + W / 2 - d / 2, A.y + 0.2, d, dark ? K.lt1 : K.dk2, dark ? K.dk2 : K.lt1);
      text(s, `${i + 1}. ${it.title}`, { x: x + 0.12, y: A.y + 0.9, w: W - 0.24, h: 0.5, fontSize: 13, bold: true, color: dark ? K.lt1 : K.dk2, align: "center", valign: "middle" });
      if (it.text) text(s, it.text, { x: x + 0.12, y: A.y + 1.42, w: W - 0.24, h: H - 1.5, fontSize: 10.5, color: dark ? K.lt1 : K.dk1, align: "center" });
      if (i < n - 1) arrow(s, x + W + 0.03, A.y + H / 2, x + W + G - 0.03, A.y + H / 2);
    }
  }

  // Ondas / fases em escada: [{ label, title, text }]. A primeira fica em destaque.
  function timeline(s, items, { area, highlight = [0] } = {}) {
    const A = areaOf(s, area);
    const n = items.length, G = 0.2, W = (A.w - G * (n - 1)) / n, step = Math.min(0.3, (A.h - 2.5) / n);
    items.forEach((it, i) => {
      const x = A.x + i * (W + G), y = A.y + i * step, h = A.y + A.h - y;
      const hl = highlight.includes(i);
      box(s, x, y, W, h, hl ? K.dk2 : K.lt2, hl ? { shadow: shadow() } : {});
      const ac = hl ? K.accent2 : K.accent4;
      text(s, (it.label || `Fase ${i + 1}`).toUpperCase(), { x: x + 0.2, y: y + 0.15, w: W - 0.4, h: 0.3, fontSize: 11, bold: true, color: ac, charSpacing: 2 });
      text(s, it.title, { x: x + 0.2, y: y + 0.45, w: W - 0.4, h: 0.7, fontSize: 16, bold: true, color: hl ? K.lt1 : K.dk2 });
      if (it.text) text(s, it.text, { x: x + 0.2, y: y + 1.2, w: W - 0.4, h: h - 1.35, fontSize: 11, color: hl ? K.lt1 : K.dk1 });
    });
  }

  // Números de destaque: [{ value, label, text }]
  function kpis(s, items, { area } = {}) {
    const A = areaOf(s, area);
    const n = items.length, G = 0.25, W = (A.w - G * (n - 1)) / n, H = Math.min(A.h, 2.6);
    items.forEach((it, i) => {
      const x = A.x + i * (W + G);
      box(s, x, A.y, W, H, K.lt1, { line: { color: K.border, width: 1 }, shadow: shadow() });
      s.addShape(pres.shapes.RECTANGLE, { x, y: A.y, w: 0.09, h: H, fill: { color: K.accent1 }, line: { color: K.accent1, width: 0 } });
      text(s, String(it.value), { x: x + 0.3, y: A.y + 0.2, w: W - 0.45, h: 1.0, fontSize: 40, bold: true, color: K.accent1, fontFace: FONT.head, valign: "middle" });
      text(s, it.label, { x: x + 0.3, y: A.y + 1.2, w: W - 0.45, h: 0.45, fontSize: 14, bold: true, color: K.dk2 });
      if (it.text) text(s, it.text, { x: x + 0.3, y: A.y + 1.65, w: W - 0.45, h: H - 1.75, fontSize: 11, color: K.accent5 });
    });
  }

  // Faixa de destaque: { title?, text, icon?, variant: "dark" | "light" | "warn" }
  async function callout(s, { title, text: t, icon: ic, variant = "dark" }, { area } = {}) {
    const A = area || { x: AREA.x, y: 6.15, w: AREA.w, h: 0.68 };
    const fill = { dark: K.dk2, light: K.lt2, warn: K.warnBg }[variant];
    const fg = variant === "dark" ? K.lt1 : K.dk2, ac = variant === "dark" ? K.accent2 : variant === "warn" ? K.warnText : K.accent4;
    box(s, A.x, A.y, A.w, A.h, fill);
    const d = Math.min(0.36, A.h - 0.2);
    if (ic) await icon(s, ic, A.x + 0.25, A.y + (A.h - d) / 2, d, variant === "dark" ? K.accent2 : K.accent1);
    const x0 = A.x + (ic ? 0.25 + d + 0.25 : 0.25);
    text(s, [...(title ? [{ text: title + " ", options: { bold: true, color: ac } }] : []), { text: t }],
      { x: x0, y: A.y, w: A.x + A.w - x0 - 0.2, h: A.h, fontSize: 13, color: fg, valign: "middle" });
  }

  // Citação ou frase de impacto, centralizada na área.
  function quote(s, { text: t, author }, { area } = {}) {
    const A = areaOf(s, area);
    text(s, "“", { x: A.x, y: A.y, w: 1, h: 1.2, fontSize: 96, bold: true, color: K.accent6, fontFace: FONT.head });
    text(s, t, { x: A.x + 0.9, y: A.y + 0.5, w: A.w - 1.8, h: A.h - 1.4, fontSize: 26, color: K.dk2, fontFace: FONT.head, valign: "middle" });
    if (author) text(s, "— " + author, { x: A.x + 0.9, y: A.y + A.h - 0.8, w: A.w - 1.8, h: 0.4, fontSize: 14, color: K.accent5 });
  }

  // Gráfico nativo do PowerPoint: { chartType: "bar"|"line"|"pie"|"doughnut", labels, series: [{ name, values }] }
  function chart(s, { chartType: type = "bar", labels, series, title }, { area } = {}) {
    const A = areaOf(s, area);
    const palette = [K.accent1, K.dk2, K.accent2, K.accent4, K.accent3, K.accent5];
    const data = series.map((sr) => ({ name: sr.name, labels, values: sr.values }));
    const T = { bar: pres.charts.BAR, line: pres.charts.LINE, pie: pres.charts.PIE, doughnut: pres.charts.DOUGHNUT }[type];
    s.addChart(T, data, {
      x: A.x, y: A.y, w: A.w, h: A.h, chartColors: palette.slice(0, type === "pie" || type === "doughnut" ? labels.length : series.length),
      showTitle: !!title, title, titleColor: K.dk2, titleFontFace: FONT.head, titleFontSize: 14,
      showLegend: series.length > 1 || type === "pie" || type === "doughnut", legendPos: "b", legendFontFace: FONT.body, legendColor: K.dk1,
      catAxisLabelColor: K.accent5, valAxisLabelColor: K.accent5, catAxisLabelFontFace: FONT.body, valAxisLabelFontFace: FONT.body,
      valGridLine: { color: K.border, size: 0.5 }, catGridLine: { style: "none" },
      showValue: true, dataLabelColor: type === "pie" || type === "doughnut" ? K.lt1 : K.dk1, dataLabelFontFace: FONT.body,
      barGapWidthPct: 60,
    });
  }

  // Agenda: lista numerada das seções; `current` (índice) destaca a seção em que o deck está.
  function agenda(s, items, { area, current = -1 } = {}) {
    const A = areaOf(s, area);
    const n = items.length, gap = 0.14;
    const rh = Math.min((A.h - gap * (n - 1)) / n, 0.85);
    const w = Math.min(A.w, 8.5), oy = (A.h - (n * rh + gap * (n - 1))) / 2;
    items.forEach((it, i) => {
      const { title, text: sub } = typeof it === "string" ? { title: it } : it;
      const y = A.y + oy + i * (rh + gap), on = i === current, past = current >= 0 && i < current;
      box(s, A.x, y, w, rh, on ? K.dk2 : K.lt2);
      s.addShape(pres.shapes.OVAL, { x: A.x + 0.18, y: y + (rh - 0.5) / 2, w: 0.5, h: 0.5, fill: { color: on ? K.accent1 : past ? K.accent6 : K.lt1 }, line: { color: on ? K.accent1 : K.border, width: 1 } });
      text(s, String(i + 1).padStart(2, "0"), { x: A.x + 0.18, y: y + (rh - 0.5) / 2, w: 0.5, h: 0.5, fontSize: 13, bold: true, color: on ? K.lt1 : K.dk2, align: "center", valign: "middle" });
      text(s, [
        { text: title, options: { bold: true, fontSize: 16, color: on ? K.lt1 : past ? K.accent5 : K.dk2, breakLine: !!sub } },
        ...(sub ? [{ text: sub, options: { fontSize: 11, color: on ? K.accent6 : K.accent5 } }] : []),
      ], { x: A.x + 0.9, y, w: w - 1.1, h: rh, valign: "middle" });
    });
  }

  // Imagem com texto ao lado: { image (caminho de arquivo), caption, title, text, bullets: [...], side: "left"|"right" }
  async function imageText(s, { image, caption, title, text: t, bullets: bl, side = "left", ratio = 0.55 }, { area } = {}) {
    const A = areaOf(s, area);
    const gap = 0.4, iw = (A.w - gap) * ratio, tw = A.w - gap - iw;
    const ix = side === "left" ? A.x : A.x + tw + gap, tx = side === "left" ? A.x + iw + gap : A.x;
    const capH = caption ? 0.35 : 0;
    const boxH = A.h - capH;
    let capY = A.y + boxH + 0.08;
    if (image && fs.existsSync(image)) {
      const m = await sharp(image).metadata();
      const r = m.width / m.height;
      let w = iw, h = iw / r;
      if (h > boxH) { h = boxH; w = h * r; }
      const x = ix + (iw - w) / 2, y = A.y + (boxH - h) / 2;
      s.addImage({ path: image, x, y, w, h, altText: caption || title || "" });
      s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { type: "none" }, line: { color: K.border, width: 0.75 } });
      capY = y + h + 0.08;
    } else {
      // sem imagem: um espaço reservado visível, para não passar despercebido
      box(s, ix, A.y, iw, boxH, K.neutralBg, { line: { color: K.accent5, width: 1, dashType: "dash" } });
      text(s, image ? `Imagem não encontrada:\n${image}` : "Imagem", { x: ix, y: A.y, w: iw, h: boxH, fontSize: 12, color: K.accent5, align: "center", valign: "middle" });
    }
    if (caption) text(s, caption, { x: ix, y: capY, w: iw, h: capH - 0.08, fontSize: 10, italic: true, color: K.accent5, align: "center" });
    const runs = [];
    if (title) runs.push({ text: title, options: { bold: true, fontSize: 18, color: K.dk2, breakLine: true, paraSpaceAfter: 8 } });
    if (t) runs.push({ text: t, options: { fontSize: 13, breakLine: !!(bl && bl.length), paraSpaceAfter: 8 } });
    (bl || []).forEach((b, i) => runs.push({ text: b, options: { fontSize: 13, bullet: { indent: 16 }, breakLine: i < bl.length - 1, paraSpaceAfter: 4 } }));
    if (runs.length) text(s, runs, { x: tx, y: A.y, w: tw, h: A.h, valign: "middle" });
  }

  // Elemento central com até 8 itens ao redor (metade à esquerda, metade à direita), ligados por linhas.
  // { center: "Rótulo", centerIcon?, items: [{ icon, title, text }] }
  async function hub(s, { center, centerIcon, items }, { area } = {}) {
    const A = areaOf(s, area);
    const left = items.slice(0, Math.ceil(items.length / 2)), right = items.slice(left.length);
    const R = Math.min(1.1, A.h / 4), cx = A.x + A.w / 2, cy = A.y + A.h / 2;
    const colW = Math.min(4.0, (A.w - 2 * R - 1.2) / 2), gap = 0.2;
    const draw = async (list, isLeft) => {
      const n = list.length; if (!n) return;
      const hh = Math.min((A.h - gap * (n - 1)) / n, 1.5);
      const y0 = cy - (n * hh + gap * (n - 1)) / 2;
      for (const [i, it] of list.entries()) {
        const x = isLeft ? A.x : A.x + A.w - colW, y = y0 + i * (hh + gap);
        const ex = isLeft ? x + colW : x, ey = y + hh / 2;
        const tx = isLeft ? cx - R * 0.95 : cx + R * 0.95, ty = cy + (n === 1 ? 0 : ((i / (n - 1)) - 0.5) * R);
        s.addShape(pres.shapes.LINE, { x: Math.min(ex, tx), y: Math.min(ey, ty), w: Math.abs(tx - ex), h: Math.max(Math.abs(ty - ey), 0.001), line: { color: K.accent6, width: 1.5 }, flipV: (isLeft ? ty < ey : ty > ey) });
        box(s, x, y, colW, hh, K.lt2);
        const d = Math.min(0.5, hh - 0.3);
        if (it.icon) await circleIcon(s, it.icon, x + 0.18, y + 0.15, d, K.dk2);
        const tx0 = x + 0.18 + (it.icon ? d + 0.15 : 0);
        text(s, it.title, { x: tx0, y: y + 0.15, w: x + colW - tx0 - 0.12, h: d, fontSize: 13.5, bold: true, color: K.dk2, valign: "middle" });
        if (it.text && hh > 0.9) text(s, it.text, { x: x + 0.18, y: y + 0.15 + d + 0.08, w: colW - 0.3, h: hh - d - 0.3, fontSize: 10.5 });
      }
    };
    await draw(left, true);
    await draw(right, false);
    s.addShape(pres.shapes.OVAL, { x: cx - R, y: cy - R, w: 2 * R, h: 2 * R, fill: { color: K.accent1 }, line: { color: K.lt1, width: 3 } });
    if (centerIcon) await icon(s, centerIcon, cx - 0.22, cy - R * 0.62, 0.44, K.lt1);
    text(s, center, { x: cx - R + 0.1, y: cy - R + (centerIcon ? 0.3 : 0), w: 2 * R - 0.2, h: 2 * R - (centerIcon ? 0.3 : 0), fontSize: 16, bold: true, color: K.lt1, align: "center", valign: "middle" });
  }

  // Diagrama de caixas e setas numa grade.
  // { cols, rows, nodes: [{ id, title, sub, col, row, colSpan, rowSpan, style: "light"|"dark"|"accent"|"outline" }],
  //   edges: [{ from, to, label, both }] }   (col e row começam em 0)
  function diagram(s, { cols, rows, nodes, edges = [] }, { area } = {}) {
    const A = areaOf(s, area);
    const C = cols || Math.max(...nodes.map((n) => n.col + (n.colSpan || 1)));
    const Rn = rows || Math.max(...nodes.map((n) => n.row + (n.rowSpan || 1)));
    const gx = 0.55, gy = 0.45;
    const cw = (A.w - gx * (C - 1)) / C, ch = Math.min((A.h - gy * (Rn - 1)) / Rn, 1.3);
    const oy = (A.h - (Rn * ch + gy * (Rn - 1))) / 2;
    const pos = {};
    for (const n of nodes) {
      const cs = n.colSpan || 1, rs = n.rowSpan || 1;
      const x = A.x + n.col * (cw + gx), y = A.y + oy + n.row * (ch + gy);
      const w = cs * cw + (cs - 1) * gx, h = rs * ch + (rs - 1) * gy;
      pos[n.id] = { x, y, w, h };
      const st = n.style || "light";
      const fill = { light: K.lt2, dark: K.dk2, accent: K.accent4, outline: K.lt1 }[st];
      const dark = st === "dark" || st === "accent";
      box(s, x, y, w, h, fill, st === "outline" ? { line: { color: K.accent4, width: 1.25, dashType: "dash" } } : {});
      text(s, [
        { text: n.title, options: { bold: true, fontSize: 13, color: dark ? K.lt1 : K.dk2, breakLine: !!n.sub } },
        ...(n.sub ? [{ text: n.sub, options: { fontSize: 10.5, color: dark ? K.accent6 : K.accent5 } }] : []),
      ], { x: x + 0.12, y, w: w - 0.24, h, align: "center", valign: "middle" });
    }
    for (const e of edges) {
      const a = pos[e.from], b = pos[e.to];
      if (!a || !b) throw new Error(`diagram: aresta ${e.from} → ${e.to} cita um nó que não existe`);
      const acx = a.x + a.w / 2, acy = a.y + a.h / 2, bcx = b.x + b.w / 2, bcy = b.y + b.h / 2;
      let x1, y1, x2, y2;
      const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (overlapY > 0.2) {               // lado a lado: seta horizontal na faixa em comum
        const yy = Math.max(a.y, b.y) + overlapY / 2;
        [x1, x2] = bcx > acx ? [a.x + a.w, b.x] : [a.x, b.x + b.w]; y1 = y2 = yy;
      } else if (overlapX > 0.2) {        // um acima do outro: seta vertical
        const xx = Math.max(a.x, b.x) + overlapX / 2;
        [y1, y2] = bcy > acy ? [a.y + a.h, b.y] : [a.y, b.y + b.h]; x1 = x2 = xx;
      } else {                            // diagonal: da borda inferior/superior de um à do outro
        x1 = acx; x2 = bcx;
        [y1, y2] = bcy > acy ? [a.y + a.h, b.y] : [a.y, b.y + b.h];
      }
      arrow(s, x1, y1, x2, y2, e.both ? { beginArrowType: "triangle" } : {});
      if (e.label) {
        const horiz = Math.abs(y2 - y1) < 0.01;
        text(s, e.label, horiz
          ? { x: Math.min(x1, x2) - 0.4, y: y1 - 0.32, w: Math.abs(x2 - x1) + 0.8, h: 0.28, fontSize: 9.5, italic: true, color: K.accent5, align: "center", valign: "bottom" }
          : { x: (x1 + x2) / 2 + 0.08, y: (y1 + y2) / 2 - 0.14, w: 2.2, h: 0.28, fontSize: 9.5, italic: true, color: K.accent5, valign: "middle" });
      }
    }
  }

  // Matriz 2×2. { x: { label, low, high }, y: { label, low, high },
  //   quadrants: [{ title, text }] na ordem: superior esquerdo, superior direito, inferior esquerdo, inferior direito,
  //   highlight: índice do quadrante em destaque, points: [{ label, x: 0..1, y: 0..1 }] }
  function matrix(s, { x: ax = {}, y: ay = {}, quadrants = [], highlight = -1, points = [] }, { area } = {}) {
    const A = areaOf(s, area);
    const lw = 0.45, lh = 0.4;          // faixa dos rótulos dos eixos
    const gx = A.x + lw, gw = A.w - lw, gh = A.h - lh, g = 0.12;
    const qw = (gw - g) / 2, qh = (gh - g) / 2;
    for (let i = 0; i < 4; i++) {
      const q = quadrants[i] || {}, hl = i === highlight;
      const x = gx + (i % 2) * (qw + g), y = A.y + Math.floor(i / 2) * (qh + g);
      box(s, x, y, qw, qh, hl ? K.dk2 : i === 1 ? K.accent6 : K.lt2);
      if (q.title || q.text) text(s, [
        ...(q.title ? [{ text: q.title, options: { bold: true, fontSize: 15, color: hl ? K.lt1 : K.dk2, breakLine: !!q.text } }] : []),
        ...(q.text ? [{ text: q.text, options: { fontSize: 11.5, color: hl ? K.lt1 : K.dk1 } }] : []),
      ], { x: x + 0.22, y: y + 0.18, w: qw - 0.44, h: qh - 0.36 });
    }
    // eixos
    arrow(s, gx, A.y + gh + 0.08, gx + gw, A.y + gh + 0.08, { color: K.accent5, width: 1.25 });
    arrow(s, A.x + lw - 0.1, A.y + gh, A.x + lw - 0.1, A.y, { color: K.accent5, width: 1.25 });
    const small = { fontSize: 10, color: K.accent5 };
    if (ax.low) text(s, ax.low, Object.assign({ x: gx, y: A.y + gh + 0.12, w: 2, h: 0.26 }, small));
    if (ax.high) text(s, ax.high, Object.assign({ x: gx + gw - 2, y: A.y + gh + 0.12, w: 2, h: 0.26, align: "right" }, small));
    if (ax.label) text(s, ax.label.toUpperCase(), { x: gx + gw / 2 - 2, y: A.y + gh + 0.12, w: 4, h: 0.26, fontSize: 10, bold: true, color: K.accent4, align: "center", charSpacing: 1 });
    const vy = (t, y0, al) => text(s, t, Object.assign({ x: A.x - 0.95, y: y0, w: 2, h: 0.26, rotate: 270, align: al }, small));
    if (ay.low) vy(ay.low, A.y + gh - 1.05, "left");
    if (ay.high) vy(ay.high, A.y + 0.85, "right");
    if (ay.label) text(s, ay.label.toUpperCase(), { x: A.x - 1.85, y: A.y + gh / 2 - 0.13, w: 4, h: 0.26, rotate: 270, fontSize: 10, bold: true, color: K.accent4, align: "center", charSpacing: 1 });
    // pontos posicionados por coordenadas de 0 a 1
    points.forEach((p) => {
      const px = gx + p.x * gw, py = A.y + (1 - p.y) * gh, d = 0.22;
      const q = (p.x >= 0.5 ? 1 : 0) + (p.y >= 0.5 ? 0 : 2), onDark = q === highlight;
      s.addShape(pres.shapes.OVAL, { x: px - d / 2, y: py - d / 2, w: d, h: d, fill: { color: K.accent3 }, line: { color: K.lt1, width: 1.5 } });
      if (p.label) text(s, p.label, { x: px + 0.16, y: py - 0.14, w: 2.2, h: 0.28, fontSize: 10.5, bold: true, color: onDark ? K.lt1 : K.dk1, valign: "middle" });
    });
  }

  // Tabela de acompanhamento com farol.
  // { columns?: ["Item", "Status", "Responsável", "Prazo", "Observação"], rows: [{ item, status: "ok"|"atencao"|"risco"|"concluido", owner, due, note }] }
  const STATUS = {
    ok: ["No prazo", "accent1"], atencao: ["Atenção", "accent3"], risco: ["Em risco", "danger"], concluido: ["Concluído", "accent5"],
  };
  function status(s, { columns, rows }, { area, fontSize = 12 } = {}) {
    const A = areaOf(s, area);
    const hdr = columns || ["Item", "Status", "Responsável", "Prazo", "Observação"];
    const H = (t) => ({ text: t, options: { bold: true, fontSize: fontSize + 1, fill: { color: K.dk2 }, color: K.lt1, valign: "middle" } });
    const data = [hdr.map(H)];
    rows.forEach((r, i) => {
      const fill = { color: i % 2 ? K.lt1 : K.zebra };
      const st = STATUS[r.status];
      if (!st) throw new Error(`status: "${r.status}" não é um status válido (${Object.keys(STATUS).join(", ")})`);
      data.push([
        { text: r.item, options: { fill, bold: true, color: K.dk2 } },
        { text: [{ text: "● ", options: { color: K[st[1]] || K.accent3, fontSize: fontSize + 4 } }, { text: st[0], options: { color: K.dk1 } }], options: { fill } },
        { text: r.owner || "", options: { fill } },
        { text: r.due || "", options: { fill } },
        { text: r.note || "", options: { fill, color: K.accent5 } },
      ]);
    });
    const rowH = Math.min(A.h / data.length, 0.7);
    s.addTable(data, {
      x: A.x, y: A.y, w: A.w, colW: [A.w * 0.26, A.w * 0.14, A.w * 0.16, A.w * 0.11, A.w * 0.33], rowH, fontSize, fontFace: FONT.body, color: K.dk1, valign: "middle",
      border: { type: "solid", pt: 0.75, color: K.border }, margin: [0.05, 0.12, 0.05, 0.12],
    });
  }

  async function save(outPath) {
    await pres.writeFile({ fileName: outPath });
    await applyTheme(outPath, tokens);
    return outPath;
  }

  return {
    pres, tokens, colors: K, fonts: FONT, AREA, PAGE,
    // slides
    cover, section: sectionSlide, content, closing,
    // componentes
    cards, iconList, bullets, compare, table, steps, timeline, kpis, callout, quote, chart,
    agenda, imageText, hub, diagram, matrix, status,
    // primitivas, para layouts sob medida
    text, box, icon, circleIcon, arrow, eyebrow, shadow, split,
    save,
  };
}

// Grava a paleta e o nome da marca no tema do .pptx (pptxgenjs escreve a paleta do Office por padrão),
// para que o seletor de cores do PowerPoint mostre as cores da marca a quem editar o arquivo depois.
const SLOTS = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];
async function applyTheme(file, tokens) {
  const JSZip = require(require.resolve("jszip", { paths: [path.dirname(require.resolve("pptxgenjs"))] }));
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const part = "ppt/theme/theme1.xml";
  const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const name = esc(tokens.name || "Marca");
  for (const k of SLOTS) if (!/^[0-9A-Fa-f]{6}$/.test(tokens.colors[k] || "")) throw new Error(`tokens.colors.${k} precisa ter 6 dígitos hex, sem #`);
  const scheme = `<a:clrScheme name="${name}">` + SLOTS.map((k) => `<a:${k}><a:srgbClr val="${tokens.colors[k].toUpperCase()}"/></a:${k}>`).join("") + "</a:clrScheme>";
  let xml = await zip.file(part).async("string");
  xml = xml.replace(/<a:clrScheme\b[\s\S]*?<\/a:clrScheme>/, () => scheme)
    .replace(/(<a:(?:theme|fontScheme)\b[^>]*?\bname=")[^"]*"/g, (_, h) => `${h}${name}"`);
  zip.file(part, xml);
  for (const n of Object.keys(zip.files)) {
    if (!n.endsWith(".xml")) continue;
    const bad = (await zip.file(n).async("string")).match(/<a:srgbClr val="((?![0-9A-Fa-f]{6}")[^"]*)"/);
    if (bad) throw new Error(`${n}: cor inválida "${bad[1]}" (use hex de 6 dígitos sem #)`);
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

module.exports = { createDeck, loadTokens, applyTheme, ICON_ALIASES, AREA, PAGE };
