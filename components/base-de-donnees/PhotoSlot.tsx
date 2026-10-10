"use client";

// --- Emplacement photo (upload / lecture seule) : remplace les cases grises
// peu lisibles par une icône + libellé en bon contraste, cohérent avec le
// design "badge" de la carte enquêteur. ---
export function PhotoSlot({ url, icon, label, size = 64, onUpload, onRemove }: {
  url?: string | null; icon: string; label: string; size?: number;
  onUpload?: (file: File) => void; onRemove?: () => void;
}) {
  return (
    <div
      style={{
        position: "relative", width: size, height: size, borderRadius: 10, overflow: "hidden",
        background: url ? "var(--card)" : "linear-gradient(160deg, var(--surface), var(--card))",
        border: `1px solid ${url ? "var(--border-light)" : "var(--border)"}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
        boxShadow: url ? "0 2px 8px rgba(0,0,0,0.35)" : "none",
      }}
    >
      {url ? (
        <img src={url} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <>
          <span style={{ fontSize: Math.round(size * 0.3), opacity: 0.6 }}>{icon}</span>
          <span style={{ fontSize: 9.5, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.02em", textAlign: "center", padding: "0 4px", textTransform: "uppercase" }}>{label}</span>
        </>
      )}
      {onUpload && (
        <input
          type="file" accept="image/*"
          onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])}
          title={`Changer : ${label}`}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
        />
      )}
      {url && onRemove && (
        <button onClick={onRemove} style={{ position: "absolute", top: 3, right: 3, width: 17, height: 17, borderRadius: "50%", background: "rgba(0,0,0,0.65)", color: "#fff", border: "none", fontSize: 10, cursor: "pointer", lineHeight: "17px" }}>x</button>
      )}
    </div>
  );
}
