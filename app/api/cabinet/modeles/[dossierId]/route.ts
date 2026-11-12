import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { accesDossier, estStaff } from "@/lib/cabinetAcces";
import { nomAffiche } from "@/lib/cabinetServer";
import { MODELES_DOCUMENTS, remplir } from "@/lib/modelesDocuments";

const echap = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

// Document prêt à imprimer (ou enregistrer en PDF), pré-rempli avec le dossier. Employés assignés ou direction.
export async function GET(req: Request, ctx: { params: Promise<{ dossierId: string }> }) {
  try {
    const { dossierId } = await ctx.params;
    const r = await requireAnyPermission(["cabinet_dossiers", "cabinet_rdv"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    if (!estStaff(user)) return NextResponse.json({ error: "Réservé aux employés" }, { status: 403 });
    const db = r.supabaseAdmin;
    const a = await accesDossier(db, user, dossierId);
    if (!a.peutGerer) return NextResponse.json({ error: "Dossier non attribué à ton nom" }, { status: 403 });
    const modele = MODELES_DOCUMENTS.find(m => m.id === new URL(req.url).searchParams.get("modele"));
    if (!modele) return NextResponse.json({ error: "Modèle inconnu" }, { status: 400 });

    const { data: dossier } = await db.from("cabinet_dossiers").select("titre,client_nom,cabinet_dossier_types(nom)").eq("id", dossierId).maybeSingle();
    const { data: acces } = await db.from("cabinet_dossier_acces").select("avocat_nom").eq("dossier_id", dossierId).limit(1).maybeSingle();
    const vars = {
      client: dossier?.client_nom || "[Nom du client]",
      dossier: dossier?.titre || "[Dossier]",
      type: (dossier as any)?.cabinet_dossier_types?.nom || "[Domaine]",
      avocat: acces?.avocat_nom || nomAffiche(user),
      cabinet: "Varelli & Associés",
      date: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    };
    const paragraphes = modele.paragraphes.map(p => `<p>${echap(remplir(p, vars))}</p>`).join("");
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${echap(modele.nom)} - ${echap(vars.dossier)}</title>
<style>
body{font-family:Georgia,serif;color:#18181b;max-width:760px;margin:40px auto;padding:0 24px;line-height:1.6}
h1{font-size:22px;letter-spacing:.08em;border-bottom:2px solid #b08a3e;padding-bottom:10px}
.meta{color:#6e6e76;font-size:13px;margin-bottom:28px}
p{margin:0 0 14px;text-align:justify}
.signatures{display:flex;justify-content:space-between;margin-top:60px;font-size:14px}
.signatures div{width:45%;border-top:1px solid #18181b;padding-top:8px}
@media print{.noprint{display:none}body{margin:0}}
</style></head><body>
<p class="noprint" style="text-align:right"><button onclick="window.print()">Imprimer / enregistrer en PDF</button></p>
<h1>${echap(modele.titre)}</h1>
<div class="meta">Cabinet Varelli &amp; Associés · ${echap(vars.date)} · Dossier : ${echap(vars.dossier)}</div>
${paragraphes}
<div class="signatures"><div>Le Cabinet<br>${echap(vars.avocat)}</div><div>Le Client<br>${echap(vars.client)}</div></div>
</body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
