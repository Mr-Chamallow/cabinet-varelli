// Statistiques completes du projet. Lancer : node scripts/stats-projet.mjs   (ou : npm run stats)
// Options : --top=25 (nb de gros fichiers)   --json (sortie JSON)
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(["node_modules", ".next", ".git", ".vercel", "dist", "build", "out", "coverage", ".turbo", ".cache"]);
const arg = n => (process.argv.find(a => a.startsWith(`--${n}=`)) || "").split("=")[1];
const TOP = Number(arg("top")) || 15;
const AS_JSON = process.argv.includes("--json");

const LANG = {
  ".tsx": "TypeScript React (TSX)", ".ts": "TypeScript", ".jsx": "JavaScript React", ".js": "JavaScript", ".mjs": "JavaScript", ".cjs": "JavaScript",
  ".css": "CSS", ".scss": "SCSS", ".html": "HTML", ".sql": "SQL", ".json": "JSON", ".md": "Markdown", ".yml": "YAML", ".yaml": "YAML",
  ".py": "Python", ".ps1": "PowerShell", ".sh": "Shell", ".svg": "SVG", ".txt": "Texte", ".env": "Env",
};
const BINARY = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".woff", ".woff2", ".ttf", ".otf", ".pdf", ".zip", ".mp3", ".mp4", ".lock"]);

const files = [];
const dirs = new Set();
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") && e.name !== ".gitignore" && e.name !== ".env.example") { if (e.isDirectory()) continue; }
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (IGNORE_DIRS.has(e.name)) continue; dirs.add(path.relative(ROOT, p)); walk(p); }
    else if (!/^(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$|\.tsbuildinfo$/.test(e.name)) files.push(p);
  }
})(ROOT);

const rel = p => path.relative(ROOT, p).split(path.sep).join("/");
const fmt = n => n.toLocaleString("fr-FR");
const kb = b => (b / 1024).toFixed(b > 1048576 ? 0 : 1) + " Ko";

const byLang = {}, byTopDir = {}, bigFiles = [];
let totalLines = 0, totalCode = 0, totalBlank = 0, totalComment = 0, totalBytes = 0, textFiles = 0, todo = 0, fixme = 0, consoleLogs = 0, anyCount = 0, fnCount = 0;
const comp = { pages: 0, api: 0, components: 0, libs: 0, sqlMig: 0, hooks: 0 };

for (const f of files) {
  const ext = path.extname(f).toLowerCase();
  const size = fs.statSync(f).size; totalBytes += size;
  const r = rel(f); const top = r.includes("/") ? r.split("/")[0] : "(racine)";
  const lang = LANG[ext] || (BINARY.has(ext) ? "Binaire / medias" : ext ? ext.slice(1).toUpperCase() : "Autre");
  const L = (byLang[lang] ??= { files: 0, lines: 0, code: 0, bytes: 0 });
  L.files++; L.bytes += size;
  const T = (byTopDir[top] ??= { files: 0, lines: 0, code: 0 }); T.files++;
  if (/\/page\.tsx$/.test(r)) comp.pages++;
  if (/^app\/api\/.*route\.ts$/.test(r)) comp.api++;
  if (/^components\//.test(r) && ext === ".tsx") comp.components++;
  if (/^lib\//.test(r)) comp.libs++;
  if (/^supabase\/.*\.sql$/.test(r)) comp.sqlMig++;
  if (/\/use[A-Z]\w+\.tsx?$/.test(r)) comp.hooks++;
  if (BINARY.has(ext) || size > 3_000_000) continue;
  let txt; try { txt = fs.readFileSync(f, "utf8"); } catch { continue; }
  textFiles++;
  const lines = txt.split(/\r?\n/);
  let inBlock = false, code = 0, blank = 0, comment = 0;
  const cstyle = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".scss"].includes(ext);
  for (const raw of lines) {
    const l = raw.trim();
    if (!l) { blank++; continue; }
    if (cstyle) {
      if (inBlock) { comment++; if (l.includes("*/")) inBlock = false; continue; }
      if (l.startsWith("//")) { comment++; continue; }
      if (l.startsWith("/*")) { comment++; if (!l.includes("*/")) inBlock = true; continue; }
    } else if (ext === ".sql" && l.startsWith("--")) { comment++; continue; }
    code++;
  }
  L.lines += lines.length; L.code += code; T.lines += lines.length; T.code += code;
  totalLines += lines.length; totalCode += code; totalBlank += blank; totalComment += comment;
  bigFiles.push({ file: r, lines: lines.length, size });
  if ([".ts", ".tsx", ".js", ".jsx", ".mjs"].includes(ext)) {
    todo += (txt.match(/\bTODO\b/g) || []).length; fixme += (txt.match(/\bFIXME\b/g) || []).length;
    consoleLogs += (txt.match(/console\.log\(/g) || []).length;
    anyCount += (txt.match(/:\s*any\b|as any\b|<any>/g) || []).length;
    fnCount += (txt.match(/\bfunction\s+\w+|=>\s*[{(]/g) || []).length;
  }
}
bigFiles.sort((a, b) => b.lines - a.lines);

// package.json
let pkg = {}; try { pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")); } catch {}
const deps = Object.keys(pkg.dependencies || {}), dev = Object.keys(pkg.devDependencies || {});

// SQL : tables creees
let tables = new Set();
for (const f of files.filter(x => x.endsWith(".sql"))) {
  const t = fs.readFileSync(f, "utf8");
  for (const m of t.matchAll(/create table (?:if not exists )?(?:public\.)?"?([a-z_0-9]+)"?/gi)) tables.add(m[1].toLowerCase());
}

// Git
const git = c => { try { return execSync(`git ${c}`, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch { return ""; } };
const g = {
  commits: git("rev-list --count HEAD"), branch: git("rev-parse --abbrev-ref HEAD"),
  first: git("log --reverse --format=%ad --date=short").split("\n")[0], last: git("log -1 --format=%ad --date=short"),
  authors: git("shortlog -sn HEAD").split("\n").filter(Boolean).slice(0, 5),
  remote: git("remote get-url origin"),
};

const langRows = Object.entries(byLang).sort((a, b) => b[1].code - a[1].code || b[1].files - a[1].files);
const dirRows = Object.entries(byTopDir).sort((a, b) => b[1].code - a[1].code);

if (AS_JSON) {
  console.log(JSON.stringify({ totaux: { fichiers: files.length, dossiers: dirs.size, lignes: totalLines, code: totalCode, vides: totalBlank, commentaires: totalComment, octets: totalBytes }, langages: byLang, dossiersRacine: byTopDir, composition: comp, git: g, tables: [...tables], gros: bigFiles.slice(0, TOP) }, null, 2));
  process.exit(0);
}

const line = (c = "=") => c.repeat(78);
const h = t => console.log(`\n${line()}\n  ${t}\n${line()}`);
const pad = (s, n) => String(s).padEnd(n), padL = (s, n) => String(s).padStart(n);
const bar = (v, max, w = 24) => "#".repeat(Math.max(v > 0 ? 1 : 0, Math.round((v / (max || 1)) * w)));

console.log(`\n  STATISTIQUES DU PROJET : ${pkg.name || path.basename(ROOT)}${pkg.version ? " v" + pkg.version : ""}`);
console.log(`  ${ROOT}`);

h("VUE D'ENSEMBLE");
const rows = [
  ["Fichiers (hors node_modules/.next/.git)", fmt(files.length)], ["Dossiers", fmt(dirs.size)], ["Fichiers texte analyses", fmt(textFiles)],
  ["Lignes totales", fmt(totalLines)], ["  dont lignes de code", fmt(totalCode)], ["  dont commentaires", fmt(totalComment)], ["  dont lignes vides", fmt(totalBlank)],
  ["Poids total", kb(totalBytes)], ["Taille moyenne d'un fichier de code", fmt(Math.round(totalCode / Math.max(textFiles, 1))) + " lignes"],
];
rows.forEach(([a, b]) => console.log(`  ${pad(a, 44)} ${padL(b, 14)}`));

h("LANGAGES (tries par lignes de code)");
console.log(`  ${pad("Langage", 26)}${padL("Fichiers", 9)}${padL("Lignes", 10)}${padL("Code", 10)}${padL("%", 7)}  `);
const maxCode = langRows[0]?.[1].code || 1;
for (const [n, v] of langRows) console.log(`  ${pad(n, 26)}${padL(fmt(v.files), 9)}${padL(fmt(v.lines), 10)}${padL(fmt(v.code), 10)}${padL(((v.code / Math.max(totalCode, 1)) * 100).toFixed(1), 7)}  ${bar(v.code, maxCode)}`);

h("DOSSIERS RACINE");
console.log(`  ${pad("Dossier", 26)}${padL("Fichiers", 9)}${padL("Lignes", 10)}${padL("Code", 10)}`);
for (const [n, v] of dirRows) console.log(`  ${pad(n, 26)}${padL(fmt(v.files), 9)}${padL(fmt(v.lines), 10)}${padL(fmt(v.code), 10)}  ${bar(v.code, dirRows[0][1].code)}`);

h("COMPOSITION DE L'APPLICATION");
[["Pages (app/**/page.tsx)", comp.pages], ["Routes API (app/api/**/route.ts)", comp.api], ["Composants (components/*.tsx)", comp.components],
 ["Fichiers lib/", comp.libs], ["Hooks (useXxx)", comp.hooks], ["Scripts SQL (supabase/*.sql)", comp.sqlMig], ["Tables SQL creees (dans les .sql)", tables.size],
 ["Fonctions / fleches (approx.)", fnCount]].forEach(([a, b]) => console.log(`  ${pad(a, 44)} ${padL(fmt(b), 10)}`));

h(`TOP ${TOP} DES PLUS GROS FICHIERS (lignes)`);
bigFiles.slice(0, TOP).forEach((b, i) => console.log(`  ${padL(i + 1, 2)}. ${padL(fmt(b.lines), 6)} l  ${padL(kb(b.size), 9)}  ${b.file}`));

h("QUALITE (indicateurs simples)");
[["TODO", todo], ["FIXME", fixme], ["console.log", consoleLogs], ["Usages de 'any' (TypeScript)", anyCount]].forEach(([a, b]) => console.log(`  ${pad(a, 44)} ${padL(fmt(b), 10)}`));
console.log(`  Fichiers de plus de 400 lignes : ${bigFiles.filter(b => b.lines > 400).length}  (a decouper si possible)`);

h("DEPENDANCES");
console.log(`  ${deps.length} dependances, ${dev.length} dev`);
if (deps.length) console.log("  " + deps.map(d => `${d}@${pkg.dependencies[d]}`).join("\n  "));

if (g.commits) {
  h("GIT");
  console.log(`  Branche : ${g.branch}   Commits : ${g.commits}`);
  console.log(`  Premier commit : ${g.first}   Dernier : ${g.last}`);
  if (g.remote) console.log(`  Depot : ${g.remote}`);
  g.authors.forEach(a => console.log(`  ${a}`));
}
console.log(`\n${line("-")}\n  Astuces : --top=30 (plus de gros fichiers)   --json (sortie JSON)\n`);
