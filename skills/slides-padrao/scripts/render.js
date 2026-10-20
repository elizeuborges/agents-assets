#!/usr/bin/env node
// Converte o .pptx em PDF e em uma imagem PNG por slide, para conferir o resultado visualmente.
//
//   node scripts/render.js saida.pptx [pasta-de-saida] [--engine auto|powerpoint|libreoffice]
//
// Usa o que já estiver instalado, nesta ordem:
//   1. PowerPoint, no Windows (via automação COM pelo PowerShell): PDF e um PNG por slide.
//   2. LibreOffice (soffice): PDF; com o poppler (pdftoppm) também um PNG por slide.
// Nada é instalado. Sem nenhum dos dois, sai com código 3: o deck precisa ser conferido manualmente.
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const WIN = process.platform === "win32";
const NO_ENGINE = 3;

const onPath = (cmd) => {
  const r = spawnSync(WIN ? "where" : "which", [cmd], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.split(/\r?\n/)[0].trim() : null;
};

// Roda um script PowerShell; os caminhos vão por variável de ambiente para evitar problemas de aspas.
function powershell(script, env = {}) {
  const encoded = Buffer.from(script, "utf16le").toString("base64");
  return spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encoded],
    { encoding: "utf8", env: Object.assign({}, process.env, env), timeout: 300000 });
}

function hasPowerPoint() {
  if (!WIN) return false;
  const r = powershell("if ([type]::GetTypeFromProgID('PowerPoint.Application')) { 'sim' } else { 'nao' }");
  return r.status === 0 && r.stdout.trim() === "sim";
}

function findSoffice() {
  const fromPath = onPath("soffice");
  if (fromPath) return fromPath;
  const candidates = WIN
    ? [process.env.ProgramFiles, process.env["ProgramFiles(x86)"]].filter(Boolean).map((p) => path.join(p, "LibreOffice", "program", "soffice.exe"))
    : ["/Applications/LibreOffice.app/Contents/MacOS/soffice", "/usr/bin/soffice", "/usr/local/bin/soffice", "/opt/homebrew/bin/soffice"];
  return candidates.find((p) => fs.existsSync(p)) || null;
}
const findPdftoppm = () => onPath("pdftoppm");

// O que está disponível nesta máquina, na ordem de preferência.
function detectEngines() {
  const out = [];
  if (hasPowerPoint()) out.push({ name: "powerpoint", label: "PowerPoint (Windows)", pngs: true });
  const soffice = findSoffice();
  if (soffice) out.push({ name: "libreoffice", label: "LibreOffice", soffice, pngs: !!findPdftoppm() });
  return out;
}

function renderPowerPoint(deck, outDir) {
  const pdf = path.join(outDir, path.basename(deck).replace(/\.[^.]+$/, "") + ".pdf");
  const script = `
$ErrorActionPreference = 'Stop'
$app = New-Object -ComObject PowerPoint.Application
$wasOpen = $app.Presentations.Count
# Open(arquivo, somente leitura, sem título, sem janela)
$p = $app.Presentations.Open($env:SP_DECK, -1, 0, 0)
try {
  $p.SaveAs($env:SP_PDF, 32)   # 32 = ppSaveAsPDF
  $w = 1280; $h = [int](1280 * $p.PageSetup.SlideHeight / $p.PageSetup.SlideWidth)
  $i = 1
  foreach ($s in $p.Slides) {
    $s.Export((Join-Path $env:SP_OUT ('slide-{0:D2}.png' -f $i)), 'PNG', $w, $h)
    $i++
  }
} finally {
  $p.Close()
  if ($wasOpen -eq 0 -and $app.Presentations.Count -eq 0) { $app.Quit() }
}`;
  const r = powershell(script, { SP_DECK: deck, SP_PDF: pdf, SP_OUT: outDir });
  if (r.status !== 0 || !fs.existsSync(pdf)) throw new Error(`o PowerPoint não conseguiu exportar: ${(r.stderr || r.stdout || "").trim()}`);
  return pdf;
}

function renderLibreOffice(deck, outDir, soffice) {
  const r = spawnSync(soffice, ["--headless", "--convert-to", "pdf", "--outdir", outDir, deck], { encoding: "utf8", timeout: 180000 });
  const pdf = path.join(outDir, path.basename(deck).replace(/\.[^.]+$/, "") + ".pdf");
  if (!fs.existsSync(pdf)) throw new Error(`o LibreOffice não conseguiu converter: ${(r.stderr || r.stdout || "").trim()}`);
  const pdftoppm = findPdftoppm();
  if (pdftoppm) spawnSync(pdftoppm, ["-png", "-r", "60", pdf, path.join(outDir, "slide")]);
  return pdf;
}

function render(deck, outDir, engine = "auto") {
  const engines = detectEngines();
  const chosen = engine === "auto" ? engines[0] : engines.find((e) => e.name === engine);
  if (!chosen) {
    const e = new Error(engine === "auto"
      ? "Nenhuma ferramenta de conferência visual disponível (PowerPoint no Windows ou LibreOffice). O deck foi gerado, mas precisa ser conferido manualmente, abrindo o .pptx."
      : `A ferramenta "${engine}" não está disponível nesta máquina.`);
    e.code = NO_ENGINE;
    throw e;
  }
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of fs.readdirSync(outDir)) if (/^slide-\d+\.png$/i.test(f)) fs.unlinkSync(path.join(outDir, f));
  const pdf = chosen.name === "powerpoint" ? renderPowerPoint(deck, outDir) : renderLibreOffice(deck, outDir, chosen.soffice);
  const pngs = fs.readdirSync(outDir).filter((f) => /^slide-\d+\.png$/i.test(f)).sort().map((f) => path.join(outDir, f));
  return { engine: chosen.label, pdf, pngs };
}

module.exports = { render, detectEngines, NO_ENGINE };

if (require.main === module) {
  const args = process.argv.slice(2);
  const ei = args.indexOf("--engine");
  const engine = ei >= 0 ? args.splice(ei, 2)[1] : "auto";
  const [deck, out] = args;
  if (!deck) { console.error("uso: node scripts/render.js saida.pptx [pasta-de-saida] [--engine auto|powerpoint|libreoffice]"); process.exit(2); }
  try {
    const { engine: used, pdf, pngs } = render(path.resolve(deck), path.resolve(out || path.join(path.dirname(deck), "render")), engine);
    console.log(`Conferência gerada com ${used}`);
    console.log("PDF: " + pdf);
    if (pngs.length) pngs.forEach((p) => console.log(p));
    else console.log("Sem imagens por slide (falta o poppler): confira pelo PDF.");
  } catch (e) {
    console.error((e.code === NO_ENGINE ? "SEM CONFERÊNCIA " : "ERRO ") + e.message);
    process.exit(e.code === NO_ENGINE ? NO_ENGINE : 1);
  }
}
