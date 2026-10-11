// Telecharge les logos des groupes dans public/groupes/ et genere public/groupes/manifest.json.
// 1) Cree un fichier "groupes-liste.txt" a la racine du projet et colles-y ta liste (Nom puis lien, une ligne par groupe).
// 2) Lance :  node scripts/telecharger-logos.mjs
// Les liens Discord expirent : lance-le le plus tot possible. Les groupes sans lien gardent leurs initiales.
import fs from "fs";
import path from "path";

const slug = n => n.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };
const src = path.join(process.cwd(), "groupes-liste.txt");
if (!fs.existsSync(src)) { console.error("groupes-liste.txt introuvable a la racine du projet."); process.exit(1); }
const dir = path.join(process.cwd(), "public", "groupes");
fs.mkdirSync(dir, { recursive: true });
const mf = path.join(dir, "manifest.json");
const manifest = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, "utf8") || "{}") : {};

const items = [];
// Lecture robuste : UTF-8 (avec ou sans BOM) ou UTF-16 (fichier cree avec PowerShell / Bloc-notes "Unicode")
const buf = fs.readFileSync(src);
const texte = buf[0] === 0xff && buf[1] === 0xfe ? buf.toString("utf16le") : buf.toString("utf8");
for (const raw of texte.replace(/^\uFEFF/, "").split(/\r?\n/)) {
  const m = raw.trim().replace(/^[-*•]\s*/, "").match(/^(.+?)\s+(https?:\/\/\S+)\s*$/);
  if (m) items.push({ nom: m[1].trim(), url: m[2].trim() });
}
console.log(`${items.length} logos a telecharger...`);
if (items.length === 0) { console.error("AUCUN lien trouve dans groupes-liste.txt. Chaque ligne doit etre : Nom (espace) https://lien"); process.exit(1); }
if (items.length === 0) { console.error("AUCUN lien trouve dans groupes-liste.txt. Format attendu, une ligne par groupe : Nom https://lien"); process.exit(1); }
let ok = 0; const ko = [];
for (const it of items) {
  try {
    const r = await fetch(it.url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const type = (r.headers.get("content-type") || "").split(";")[0].trim();
    const ext = EXT[type] || (it.url.match(/\.(png|jpe?g|webp|gif)(\?|$)/i)?.[1] || "png").toLowerCase().replace("jpeg", "jpg");
    const file = `${slug(it.nom)}.${ext}`;
    fs.writeFileSync(path.join(dir, file), Buffer.from(await r.arrayBuffer()));
    manifest[slug(it.nom)] = file; ok++;
    console.log("OK   ", it.nom);
  } catch (e) { ko.push(it.nom); console.log("ECHEC", it.nom, "-", e.message); }
}
fs.writeFileSync(mf, JSON.stringify(manifest, null, 1));
console.log(`\nTermine : ${ok} OK, ${ko.length} echec(s)${ko.length ? " : " + ko.join(", ") : ""}`);
