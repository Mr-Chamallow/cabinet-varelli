"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ComptabilitePage() {
  const [entrees, setEntrees] = useState(0);
  const [sorties, setSorties] = useState(0);

  useEffect(() => {
    charger();
  }, []);

  async function charger() {
    if (!supabase) return;

    const { data } = await supabase
      .from("operations")
      .select("*");

    const liste = data || [];

    const totalEntrees = liste
      .filter((x) => x.type === "Entrée")
      .reduce((a, b) => a + Number(b.montant), 0);

    const totalSorties = liste
      .filter((x) => x.type === "Sortie")
      .reduce((a, b) => a + Number(b.montant), 0);

    setEntrees(totalEntrees);
    setSorties(totalSorties);
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>📈 Comptabilité</h1>

      <h2>Entrées : {entrees.toLocaleString()}$</h2>

      <h2>Sorties : {sorties.toLocaleString()}$</h2>

      <h1>
        Solde : {(entrees - sorties).toLocaleString()}$
      </h1>
    </main>
  );
}