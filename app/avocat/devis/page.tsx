"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import ComptaDevis from "@/components/compta/ComptaDevis";
import { ROLES_BUREAU } from "@/lib/cabinetRoles";

// Devis : séparés de la comptabilité (factures). Patron et secrétaire juridique uniquement.
export default function Page() {
  return (
    <CabinetShell title="Devis" icon="" desc="Devis clients et signatures" perms={["cabinet_compta"]} roles={ROLES_BUREAU}>
      {() => <ComptaDevis />}
    </CabinetShell>
  );
}
