#!/usr/bin/env node
// Converte o .pptx em PDF e em uma imagem PNG por slide, para conferir o resultado visualmente.
//
//   node scripts/render.js saida.pptx [pasta-de-saida] [--engine auto|powerpoint|libreoffice]
//
// Usa o que já estiver instalado, nesta ordem:
//   1. PowerPoint, no Windows (via automação COM pelo PowerShell): PDF e um PNG por slide.
//   2. LibreOffice (soffice): PDF; com o poppler (pdftoppm) também um PNG por slide.
// No WSL, procura também os programas do Windows: o PowerPoint e, se não houver LibreOffice no Linux,
// o do Windows. Eles trabalham numa pasta temporária do Windows, e o resultado volta para a pasta de saída.
// Nada é instalado. Sem nenhum dos dois, sai com código 3: o deck precisa ser conferido manualmente.
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const WIN = process.platform === "win32";
const WSL = process.platform === "linux" && (!!process.env.WSL_DISTRO_NAME || /microsoft/i.test(readOr("/proc/version")));
const NO_ENGINE = 3;

function readOr(file) {
  try { return fs.readFileSync(file, "utf8"); } catch { return ""; }
}

const onPath = (cmd) => {
  const r = spawnSync(WIN ? "where" : "which", [cmd], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.split(/\r?\n/)[0].trim() : null;
};

// No WSL, o PowerShell do Windows vem pela interoperabilidade (no PATH ou no caminho padrão em /mnt/c).
const POWERSHELL = WIN ? "powershell.exe"
  : WSL ? onPath("powershell.exe") || ["/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe"].find((p) => fs.existsSync(p)) || null
  : null;

// Roda um script PowerShell; os caminhos vão por variável de ambiente para evitar problemas de aspas.
// No WSL, só as variáveis listadas em WSLENV chegam ao Windows.
function powershell(script, env = {}, cwd) {
  const encoded = Buffer.from(script, "utf16le").toString("base64");
  const extra = Object.assign({}, env);
  if (WSL && Object.keys(env).length) extra.WSLENV = [process.env.WSLENV, ...Object.keys(env)].filter(Boolean).join(":");
  return spawnSync(POWERSHELL, ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encoded],
    { encoding: "utf8", env: Object.assign({}, process.env, extra), timeout: 300000, cwd });
}

function hasPowerPoint() {
  if (!POWERSHELL) return false;
  const r = powershell("if ([type]::GetTypeFromProgID('PowerPoint.Application')) { 'sim' } else { 'nao' }", {}, WSL ? winCwd() : undefined);
  return r.status === 0 && r.stdout.trim() === "sim";
}

// Pasta do Windows para rodar comandos do Windows pelo WSL sem o aviso de caminho UNC.
const winCwd = () => ["/mnt/c", "/mnt/d"].find((p) => fs.existsSync(p));

// Converte caminhos entre o WSL e o Windows.
function wslpath(flag, p) {
  const r = spawnSync("wslpath", [flag, p], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`wslpath não converteu ${p}: ${(r.stderr || "").trim()}`);
  return r.stdout.trim();
}

function findSoffice() {
  const fromPath = onPath("soffice");
  if (fromPath) return { soffice: fromPath, windows: WIN };
  const candidates = WIN
    ? [process.env.ProgramFiles, process.env["ProgramFiles(x86)"]].filter(Boolean).map((p) => path.join(p, "LibreOffice", "program", "soffice.exe"))
    : ["/Applications/LibreOffice.app/Contents/MacOS/soffice", "/usr/bin/soffice", "/usr/local/bin/soffice", "/opt/homebrew/bin/soffice"];
  const local = candidates.find((p) => fs.existsSync(p));
  if (local) return { soffice: local, windows: WIN };
  if (WSL) {
    const win = ["Program Files", "Program Files (x86)"].map((d) => path.join(winCwd() || "/mnt/c", d, "LibreOffice", "program", "soffice.exe")).find((p) => fs.existsSync(p));
    if (win) return { soffice: win, windows: true };
  }
  return null;
}
const findPdftoppm = () => onPath("pdftoppm");

// O que está disponível nesta máquina, na ordem de preferência.
// `windows: true` indica um programa do Windows; no WSL, ele trabalha numa pasta temporária do Windows.
function detectEngines() {
  const out = [];
  if (hasPowerPoint()) out.push({ name: "powerpoint", label: WSL ? "PowerPoint (Windows, pelo WSL)" : "PowerPoint (Windows)", windows: true, pngs: true });
  const lo = findSoffice();
  if (lo) out.push({ name: "libreoffice", label: WSL && lo.windows ? "LibreOffice (Windows, pelo WSL)" : "LibreOffice", soffice: lo.soffice, windows: lo.windows, pngs: !!findPdftoppm() });
  return out;
}

// No WSL, os programas do Windows não abrem bem arquivos do sistema de arquivos do Linux. O deck é copiado
// para uma pasta temporária do Windows, convertido lá, e o PDF e as imagens voltam para a pasta de saída.
function viaWindowsTemp(deck, outDir, convert) {
  if (!WSL) return convert(deck, outDir, (p) => p);
  const cwd = winCwd();
  const r = spawnSync("cmd.exe", ["/d", "/c", "echo %TEMP%"], { encoding: "utf8", cwd });
  const temp = r.status === 0 && r.stdout.trim() ? wslpath("-u", r.stdout.trim()) : null;
  if (!temp || !fs.existsSync(temp)) throw new Error("não encontrei a pasta temporária do Windows (%TEMP%) pelo WSL");
  const stage = fs.mkdtempSync(path.join(temp, "slides-padrao-"));
  try {
    const staged = path.join(stage, path.basename(deck));
    fs.copyFileSync(deck, staged);
    convert(staged, stage, (p) => wslpath("-w", p), cwd);
    const results = fs.readdirSync(stage).filter((f) => /\.pdf$/i.test(f) || /^slide-\d+\.png$/i.test(f));
    for (const f of results) fs.copyFileSync(path.join(stage, f), path.join(outDir, f));
    return path.join(outDir, path.basename(deck).replace(/\.[^.]+$/, "") + ".pdf");
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }
}

// `win` traduz um caminho local para o que o programa do Windows entende (no Windows, não muda nada).
function renderPowerPoint(deck, outDir, win, cwd) {
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
  const r = powershell(script, { SP_DECK: win(deck), SP_PDF: win(pdf), SP_OUT: win(outDir) }, cwd);
  if (r.status !== 0 || !fs.existsSync(pdf)) throw new Error(`o PowerPoint não conseguiu exportar: ${(r.stderr || r.stdout || "").trim()}`);
  return pdf;
}

// No Linux, o LibreOffice acha as fontes pelo fontconfig. Uma configuração temporária acrescenta
// as fontes da skill (Carlito, com as mesmas métricas da Calibri) sem instalar nada na máquina.
const FONTS_DIR = path.join(__dirname, "..", "fonts");
function fontconfigEnv(outDir) {
  if (process.platform !== "linux" || !fs.existsSync(FONTS_DIR)) return {};
  const conf = path.join(outDir, ".fonts.conf");
  fs.writeFileSync(conf, `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <include ignore_missing="yes">${process.env.FONTCONFIG_FILE || "/etc/fonts/fonts.conf"}</include>
  <dir>${FONTS_DIR}</dir>
  <alias binding="same"><family>Calibri</family><accept><family>Carlito</family></accept></alias>
</fontconfig>
`);
  return { FONTCONFIG_FILE: conf };
}

// O LibreOffice do Windows usa as fontes do Windows, que já têm a Calibri: a Carlito só entra no Linux.
// Sem `win`, o LibreOffice é local; com `win`, é o do Windows chamado pelo WSL.
function renderLibreOffice(deck, outDir, soffice, win, cwd) {
  const fontEnv = win ? {} : fontconfigEnv(outDir);
  const at = win || ((p) => p);
  const r = spawnSync(soffice, ["--headless", "--convert-to", "pdf", "--outdir", at(outDir), at(deck)],
    { encoding: "utf8", timeout: 180000, cwd, env: Object.assign({}, process.env, fontEnv) });
  if (fontEnv.FONTCONFIG_FILE) fs.rmSync(fontEnv.FONTCONFIG_FILE, { force: true });
  const pdf = path.join(outDir, path.basename(deck).replace(/\.[^.]+$/, "") + ".pdf");
  if (!fs.existsSync(pdf)) throw new Error(`o LibreOffice não conseguiu converter: ${(r.stderr || r.stdout || "").trim()}`);
  return pdf;
}

// Imagens por slide a partir do PDF, quando o poppler está instalado (o PowerPoint já exporta as suas).
function pdfToPngs(pdf, outDir) {
  const pdftoppm = findPdftoppm();
  if (pdftoppm) spawnSync(pdftoppm, ["-png", "-r", "60", pdf, path.join(outDir, "slide")]);
}

function render(deck, outDir, engine = "auto") {
  const engines = detectEngines();
  const chosen = engine === "auto" ? engines[0] : engines.find((e) => e.name === engine);
  if (!chosen) {
    const e = new Error(engine === "auto"
      ? "Nenhuma ferramenta de conferência visual disponível (PowerPoint no Windows, também pelo WSL, ou LibreOffice). O deck foi gerado, mas precisa ser conferido manualmente, abrindo o .pptx."
      : `A ferramenta "${engine}" não está disponível nesta máquina.`);
    e.code = NO_ENGINE;
    throw e;
  }
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of fs.readdirSync(outDir)) if (/^slide-\d+\.png$/i.test(f)) fs.unlinkSync(path.join(outDir, f));
  let pdf;
  if (chosen.name === "powerpoint") pdf = viaWindowsTemp(deck, outDir, renderPowerPoint);
  else if (chosen.windows && WSL) pdf = viaWindowsTemp(deck, outDir, (d, o, win, cwd) => renderLibreOffice(d, o, chosen.soffice, win, cwd));
  else pdf = renderLibreOffice(deck, outDir, chosen.soffice);
  if (chosen.name === "libreoffice") pdfToPngs(pdf, outDir);
  const pngs = fs.readdirSync(outDir).filter((f) => /^slide-\d+\.png$/i.test(f)).sort().map((f) => path.join(outDir, f));
  return { engine: chosen.label, pdf, pngs };
}

module.exports = { render, detectEngines, NO_ENGINE, WSL };

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
