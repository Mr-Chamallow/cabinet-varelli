import type { Row } from "@/lib/types";
export async function apiRequest(url: string, options: RequestInit): Promise<{ ok: boolean; status: number; data: Row; error?: string }> {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let data: Row = null;
    try { data = text ? JSON.parse(text) : null; } catch { /* réponse non-JSON */ }
    if (!res.ok) {
      return { ok: false, status: res.status, data, error: data?.error || text?.slice(0, 300) || `Erreur HTTP ${res.status}` };
    }
    return { ok: true, status: res.status, data };
  } catch (e: unknown) {
    return { ok: false, status: 0, data: null, error: `Réseau/connexion : ${e instanceof Error ? e.message : String(e)}` };
  }
}
