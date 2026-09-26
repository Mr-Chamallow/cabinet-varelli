export async function apiRequest(url: string, options: RequestInit): Promise<{ ok: boolean; status: number; data: any; error?: string }> {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { /* réponse non-JSON */ }
    if (!res.ok) {
      return { ok: false, status: res.status, data, error: data?.error || text?.slice(0, 300) || `Erreur HTTP ${res.status}` };
    }
    return { ok: true, status: res.status, data };
  } catch (e: any) {
    return { ok: false, status: 0, data: null, error: `Réseau/connexion : ${e?.message || e}` };
  }
}
