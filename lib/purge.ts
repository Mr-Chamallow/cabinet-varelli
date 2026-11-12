// Suppression définitive (réservée à la direction) : efface aussi messages, notes internes, membres et factures liés
export async function supprimerDossiers(db: any, ids: string[]) {
  if (!ids.length) return null;
  await db.from("cabinet_factures").delete().in("dossier_id", ids);
  await db.from("cabinet_messages").delete().in("dossier_id", ids);
  await db.from("cabinet_dossier_acces").delete().in("dossier_id", ids);
  await db.from("cabinet_dossier_masques").delete().in("dossier_id", ids);
  await db.from("cabinet_internes").delete().in("canal", ids.map(i => `interne:${i}`));
  const { error } = await db.from("cabinet_dossiers").delete().in("id", ids);
  return error;
}

export async function supprimerFacture(db: any, id: string) {
  // Le message du dossier qui contenait le PDF disparaît avec la facture
  await db.from("cabinet_messages").delete().eq("fichier_url", `/api/cabinet/factures/${id}/pdf`);
  // Les devis liés à cette facture sont supprimés avec elle
  await db.from("cabinet_devis").delete().eq("facture_id", id);
  const { error } = await db.from("cabinet_factures").delete().eq("id", id);
  return error;
}
