"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import FacturationLecture from "@/components/cabinet/FacturationLecture";

// Devis et factures, en lecture seule pour le personnel
export default function Page() {
  return (
    <CabinetShell title="Devis & factures" icon="🧾" desc="Consultation seule (la comptabilité reste réservée au bureau)" perms={["avocat"]} staff>
      {() => <FacturationLecture />}
    </CabinetShell>
  );
}
