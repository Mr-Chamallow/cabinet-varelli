import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/serverAuth";
import { genererFactureGouvernement, addJours } from "@/lib/factureGouvernement";
import { semaineCourante } from "@/lib/compta";

// Chaque lundi (Vercel Cron) : facture de la semaine précédente. Protégé par CRON_SECRET.
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const lundiPrecedent = addJours(semaineCourante(), -7);
  const facture = await genererFactureGouvernement(supabaseAdmin, lundiPrecedent, "Automatique");
  return NextResponse.json({ semaine: lundiPrecedent, facture: facture ? facture.numero : null });
}
