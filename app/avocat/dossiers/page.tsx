"use client";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { estStaffUser } from "@/lib/cabinetRoles";
import FormulaireDossier from "@/components/cabinet/FormulaireDossier";

// Pas de dossier sélectionné : ouverture d'un nouveau dossier (il devient un salon dans la liste)
export default function Page() {
  const router = useRouter();
  const { user } = useCurrentUser();
  if (!user) return null;
  return (
    <div className="cab-card">
      <div style={{ fontWeight: 700, marginBottom: "0.8rem" }}>Ouvrir un nouveau dossier</div>
      <FormulaireDossier staff={estStaffUser(user)} onCree={d => router.push(`/avocat/dossiers/${d.id}`)} />
    </div>
  );
}
