import { ObsLogo } from "@/components/ObsLogo";

export default function Loading() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg)", gap: "1.25rem" }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--gold)", letterSpacing: "0.12em", textAlign: "center" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}><ObsLogo size={34} />CABINET VARELLI &amp; ASSOCIÉS</span>
      </div>
      <div style={{ width: 48, height: 2, background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }} />
      <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.2em" }}>Chargement…</div>
    </div>
  );
}
