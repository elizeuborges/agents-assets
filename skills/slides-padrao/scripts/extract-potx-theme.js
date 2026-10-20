#!/usr/bin/env node
// Lê a paleta e as fontes do template de uma marca (.potx, ou qualquer .pptx feito a partir dele)
// e grava em brand/tokens.json, mantendo o resto do arquivo (rodapé, logo, cores extras).
//
//   node extract-potx-theme.js Template.potx [../brand/tokens.json]
//
// Depois disso, todos os decks gerados pela skill passam a usar as cores e fontes do template.
const fs = require("fs");
const path = require("path");
const JSZip = require(require.resolve("jszip", { paths: [path.dirname(require.resolve("pptxgenjs"))] }));

const SLOTS = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];

(async () => {
  const [src, dst = path.join(__dirname, "..", "brand", "tokens.json")] = process.argv.slice(2);
  if (!src) { console.error("uso: node extract-potx-theme.js template.potx [tokens.json]"); process.exit(2); }
  const zip = await JSZip.loadAsync(fs.readFileSync(src));
  const themePart = Object.keys(zip.files).filter((n) => /^ppt\/theme\/theme\d+\.xml$/.test(n)).sort()[0];
  if (!themePart) throw new Error("o arquivo não tem ppt/theme/theme*.xml");
  const xml = await zip.file(themePart).async("string");
  const colors = {};
  for (const k of SLOTS) {
    const m = xml.match(new RegExp(`<a:${k}>\\s*<a:(?:srgbClr val|sysClr[^>]*lastClr)="([0-9A-Fa-f]{6})"`));
    if (!m) throw new Error(`cor ${k} não encontrada no tema`);
    colors[k] = m[1].toUpperCase();
  }
  const font = (tag) => (xml.match(new RegExp(`<a:${tag}>\\s*<a:latin typeface="([^"]+)"`)) || [])[1];
  const tokens = fs.existsSync(dst) ? JSON.parse(fs.readFileSync(dst, "utf8")) : {};
  tokens.colors = colors;
  tokens.fonts = { head: font("majorFont") || "Calibri", body: font("minorFont") || "Calibri" };
  tokens.source = `Extraído de ${path.basename(src)} em ${new Date().toISOString().slice(0, 10)}`;
  fs.writeFileSync(dst, JSON.stringify(tokens, null, 2) + "\n");
  console.log(`tokens atualizados em ${dst}`);
  console.log(JSON.stringify({ fonts: tokens.fonts, colors }, null, 2));
  console.log("Confira: dk2 é o fundo da capa, accent1 a cor de destaque, lt2 o fundo dos cartões. Ajuste 'extra' se os tons neutros não combinarem.");
})().catch((e) => { console.error("ERRO " + e.message); process.exit(1); });
