import { envoyerDm, lienSite } from "@/lib/discordDm";
import { montant } from "@/lib/montant";

// Messages privés : jamais le contenu, seulement un aperçu et le lien vers le site

// Nouveau message dans un dossier : le client est prévenu si c'est le cabinet qui écrit, les avocats assignés si c'est le client
export async function prevenirDossier(db: any, dossier: any, dossierId: string, estStaff: boolean) {
  const lien = lienSite(`/avocat/dossiers/${dossierId}`);
  if (estStaff) {
    if (dossier.client_discord_id) {
      await envoyerDm(dossier.client_discord_id, `Nouveau message du cabinet dans ton dossier « ${dossier.titre} ». Ouvre-le ici : ${lien}`);
    }
    return;
  }
  const { data } = await db.from("cabinet_dossier_acces").select("avocat_discord_id").eq("dossier_id", dossierId);
  for (const a of data || []) {
    await envoyerDm(a.avocat_discord_id, `Nouveau message du client dans le dossier « ${dossier.titre} ». Ouvre-le ici : ${lien}`);
  }
}

export async function prevenirFacture(clientDiscordId: string | null, numero: string, total: number, echeance: string | null) {
  if (!clientDiscordId) return;
  const quand = echeance ? ` Échéance : ${new Date(echeance).toLocaleDateString("fr-FR")}.` : "";
  await envoyerDm(clientDiscordId, `Nouvelle facture ${numero} de ${montant(total)} émise par Cabinet Varelli & Associés.${quand} Retrouve le PDF dans Mon espace : ${lienSite("/avocat/mon-espace")}`);
}

export async function prevenirRelance(clientDiscordId: string | null, numero: string, total: number) {
  if (!clientDiscordId) return;
  await envoyerDm(clientDiscordId, `Rappel : la facture ${numero} de ${montant(total)} est toujours en attente de paiement. Détails dans Mon espace : ${lienSite("/avocat/mon-espace")}`);
}
