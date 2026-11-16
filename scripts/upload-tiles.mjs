// Envoie le dossier public/map vers le stockage Supabase (bucket public "carte-tiles").
// A lancer une seule fois depuis la racine du projet :
//   node scripts/upload-tiles.mjs
// Variables requises : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from "@supabase/supabase-js";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const URL_SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_SUPA || !KEY) {
  console.error("Il manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const BUCKET = "carte-tiles";
const RACINE = path.resolve("public");
const supa = createClient(URL_SUPA, KEY, { auth: { persistSession: false } });

// Crée le bucket public s'il n'existe pas encore
const { error: errBucket } = await supa.storage.createBucket(BUCKET, { public: true });
if (errBucket && !/already exists|exist/i.test(errBucket.message)) {
  console.error("Création du bucket impossible :", errBucket.message);
  process.exit(1);
}

async function listerFichiers(dossier) {
  const sortie = [];
  for (const entree of await readdir(dossier, { withFileTypes: true })) {
    const chemin = path.join(dossier, entree.name);
    if (entree.isDirectory()) sortie.push(...(await listerFichiers(chemin)));
    else sortie.push(chemin);
  }
  return sortie;
}

const fichiers = await listerFichiers(path.join(RACINE, "map"));
console.log(`${fichiers.length} fichiers à envoyer...`);

let ok = 0;
let ko = 0;
async function envoyer(fichier) {
  const cle = path.relative(RACINE, fichier).split(path.sep).join("/"); // ex: map/tiles/...
  const contenu = await readFile(fichier);
  const type = fichier.endsWith(".png") ? "image/png" : "image/jpeg";
  const { error } = await supa.storage.from(BUCKET).upload(cle, contenu, {
    contentType: type,
    upsert: true,
    cacheControl: "604800",
  });
  if (error) {
    ko++;
    console.error("ECHEC", cle, "-", error.message);
  } else {
    ok++;
  }
  if ((ok + ko) % 250 === 0) console.log(`${ok + ko} / ${fichiers.length}`);
}

// 6 envois en parallèle
const file = [...fichiers];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (file.length) await envoyer(file.shift());
  })
);
console.log(`Terminé : ${ok} envoyés, ${ko} en échec sur ${fichiers.length}.`);
if (ko > 0) console.log("Relance le script : les fichiers déjà envoyés seront simplement remplacés.");
