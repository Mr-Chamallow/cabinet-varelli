"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import CabinetShell from "@/components/cabinet/CabinetShell";
import FilMessages from "@/components/cabinet/FilMessages";

const NOMS: Record<string, string> = {
  "salon-general": "Salon général",
  "salon-juridique": "Liaison secrétaire juridique",
};

export default function Page() {
  const { canal } = useParams<{ canal: string }>();
  const [titre, setTitre] = useState("Messagerie");

  // Titre : nom du salon, du bureau de l'avocat ou de la plainte
  useEffect(() => {
    if (!canal) return;
    if (NOMS[canal]) return setTitre(NOMS[canal]);
    if (canal.startsWith("plainte-")) return setTitre("Plainte interne");
    if (canal.startsWith("bureau-")) {
      const id = canal.slice(7);
      fetch("/api/cabinet/staff").then(r => r.json()).then(d => {
        const s = (d.rows || []).find((x: any) => x.discord_id === id);
        setTitre(s ? `Bureau de ${s.nom}` : "Bureau");
      });
    }
  }, [canal]);

  return (
    <CabinetShell title={titre} icon="" desc="Messagerie interne · employés uniquement" perms={["cabinet_dossiers", "cabinet_rdv"]}>
      {() => <FilMessages url={`/api/cabinet/chat/${canal}`} titreVide="Aucun message pour l'instant." />}
    </CabinetShell>
  );
}
