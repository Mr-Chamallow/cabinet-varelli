"use client";

export default function FactureCard({ facture }: any) {
  return (
    <div
      id={`facture-${facture.id}`}
      style={{
        background: "#ffffff",
        color: "#000",
        padding: 40,
        borderRadius: 15,
        width: 800,
        marginTop: 20,
        boxShadow: "0 0 25px rgba(0,0,0,.3)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 30,
        }}
      >
        <div>
          <h1>CABINET VARELLI</h1>
          <p>Cabinet d'Avocats</p>
        </div>

        <div style={{ textAlign: "right" }}>
          <h2>{facture.numero}</h2>
          <p>{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <hr />

      <h3>Client</h3>
      <p>{facture.client}</p>

      <h3>Description</h3>
      <p>{facture.description || "-"}</p>

      <div
        style={{
          marginTop: 40,
          padding: 20,
          background: "#f2f2f2",
          borderRadius: 10,
        }}
      >
        <h2>
          Total :{" "}
          {Number(facture.montant).toLocaleString()} $
        </h2>
      </div>

      <div
        style={{
          marginTop: 80,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>
          ___________________
          <br />
          Signature Client
        </div>

        <div>
          ___________________
          <br />
          Cabinet BullHead
        </div>
      </div>
    </div>
  );
}