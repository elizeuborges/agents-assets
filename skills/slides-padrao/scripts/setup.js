#!/usr/bin/env node
// Verifica e configura o ambiente para rodar a skill. Rode antes do primeiro uso numa máquina.
//
//   node scripts/setup.js            # verifica, instala as dependências npm e gera o exemplo como teste
//   node scripts/setup.js --check    # só verifica, sem instalar nada
//
// Saída 0: pronto para gerar decks. Saída 1: falta algo obrigatório (a mensagem diz o quê).
// Se o comando `node` não for reconhecido, instale o Node.js 18+ (https://nodejs.org) antes de tudo.
// Só usa módulos nativos do Node até a etapa 2, para funcionar antes de qualquer instalação.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const SKILL_DIR = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const CHECK_ONLY = args.includes("--check");
const WIN = process.platform === "win32";
let failed = false;
const ok = (m) => console.log("  [ok]    " + m);
const warn = (m) => console.log("  [aviso] " + m);
const fail = (m) => { console.log("  [falta] " + m); failed = true; };
const run = (cmd, a, o = {}) => spawnSync(cmd, a, Object.assign({ encoding: "utf8", cwd: SKILL_DIR, shell: WIN }, o));
const stop = (m) => { console.log("\n" + m); process.exit(1); };

console.log("1. Node.js e npm (obrigatórios)");
const major = Number(process.versions.node.split(".")[0]);
major >= 18 ? ok("node v" + process.versions.node) : fail(`node v${process.versions.node}; é preciso a versão 18 ou mais nova`);
const npmV = run("npm", ["-v"]);
npmV.status === 0 ? ok("npm " + npmV.stdout.trim()) : fail("npm não encontrado (vem junto com o Node.js)");
if (failed) stop("Ambiente incompleto: instale o Node.js 18+ e rode de novo.");

console.log("2. Dependências npm (obrigatórias)");
const DEPS = ["pptxgenjs", "react", "react-dom", "react-icons", "sharp"];
const missing = () => DEPS.filter((p) => { try { require.resolve(p, { paths: [SKILL_DIR] }); return false; } catch { return true; } });
let miss = missing();
if (miss.length && CHECK_ONLY) fail(`faltam: ${miss.join(", ")} (rode sem --check para instalar)`);
else if (miss.length) {
  console.log("  instalando: " + miss.join(", "));
  const log = path.join(os.tmpdir(), "slides-padrao-npm.log");
  const r = run("npm", ["install", "--no-audit", "--no-fund"]);
  fs.writeFileSync(log, (r.stdout || "") + (r.stderr || ""));
  r.status === 0 ? ok("npm install concluído") : fail(`npm install falhou; veja ${log} (proxy ou registry da rede?)`);
  miss = missing();
  if (miss.length) fail("ainda faltam: " + miss.join(", "));
} else ok(DEPS.join(", "));
if (!miss.length) {
  try { require(require.resolve("sharp", { paths: [SKILL_DIR] })); ok("sharp carrega (binário nativo compatível)"); }
  catch { fail("sharp não carrega nesta plataforma; rode: npm rebuild sharp"); }
}

console.log("3. Identidade visual");
let tokens;
try {
  tokens = JSON.parse(fs.readFileSync(path.join(SKILL_DIR, "brand", "tokens.json"), "utf8"));
  const slots = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];
  const bad = slots.filter((k) => !/^[0-9A-Fa-f]{6}$/.test((tokens.colors || {})[k] || ""));
  bad.length ? fail("cores inválidas em brand/tokens.json: " + bad.join(", ")) : ok(`brand/tokens.json: "${tokens.name}", fontes ${tokens.fonts.head} / ${tokens.fonts.body}`);
  for (const k of ["onDark", "onLight"]) {
    const p = (tokens.logo || {})[k];
    if (p && !fs.existsSync(path.resolve(SKILL_DIR, "brand", p))) warn(`logo.${k} aponta para ${p}, que não existe`);
  }
} catch (e) { fail("brand/tokens.json não pôde ser lido: " + e.message); }

console.log("4. Conferência visual (opcional; nada é instalado)");
const { detectEngines } = require("./render");
const engines = detectEngines();
if (!engines.length) {
  warn("nenhuma ferramenta de conferência (PowerPoint no Windows ou LibreOffice): os decks serão gerados normalmente, mas precisarão ser conferidos manualmente");
} else {
  const e = engines[0];
  ok(`conferência com ${e.label}` + (e.pngs ? ", com uma imagem por slide" : ", só em PDF (o poppler não foi encontrado)"));
  if (e.name === "libreoffice" && tokens && !WIN) {
    // o LibreOffice troca fontes ausentes, o que muda a quebra de linha em relação ao PowerPoint
    const font = tokens.fonts.body, r = run("fc-list", []);
    if (r.status === 0) {
      const all = r.stdout.toLowerCase();
      if (all.includes(font.toLowerCase())) ok(`fonte ${font} instalada`);
      else if (font === "Calibri" && all.includes("carlito")) ok("Carlito instalada (mesmas métricas da Calibri)");
      else warn(`fonte ${font} não instalada: nas imagens a quebra de linha pode diferir do PowerPoint`);
    }
  }
}
if (failed) stop("Ambiente incompleto: corrija os itens [falta] e rode de novo.");

console.log("5. Teste de geração");
if (CHECK_ONLY) console.log("  (pulado em --check)");
else {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "slides-padrao-"));
  const out = path.join(tmp, "teste.pptx");
  const r = spawnSync(process.execPath, [path.join(__dirname, "build-from-spec.js"), path.join(SKILL_DIR, "examples", "exemplo.json"), out], { encoding: "utf8", cwd: SKILL_DIR });
  if (r.status === 0 && fs.existsSync(out)) ok(`exemplo gerado (${Math.round(fs.statSync(out).size / 1024)} KB)`);
  else fail("a geração do exemplo falhou:\n" + (r.stderr || r.stdout).split("\n").map((l) => "          " + l).join("\n"));
  fs.rmSync(tmp, { recursive: true, force: true });
}
if (failed) stop("Ambiente incompleto.");
console.log(`\nPronto: node "${path.join(SKILL_DIR, "scripts", "build-from-spec.js")}" roteiro.json saida.pptx`);
