"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { AppUser, hasPermission } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getPreviewRole, PREVIEW_ROLE_EVENT } from "@/lib/previewRole";

export function useCurrentUser(): {
  user: AppUser | null;
  loading: boolean;
  realUser: AppUser | null;
  previewRole: string | null;
} {
  const sessionState = useSession();
  const [previewRoleRaw, setPreviewRoleRaw] = useState<string | null>(null);
  const [previewPerms, setPreviewPerms] = useState<string[] | null>(null);

  // Écoute les changements du mode aperçu (sessionStorage ne déclenche pas de
  // re-render tout seul, on passe par un petit événement custom).
  useEffect(() => {
    setPreviewRoleRaw(getPreviewRole());
    const handler = () => setPreviewRoleRaw(getPreviewRole());
    window.addEventListener(PREVIEW_ROLE_EVENT, handler);
    return () => window.removeEventListener(PREVIEW_ROLE_EVENT, handler);
  }, []);

  if (!sessionState) {
    return { user: null, loading: true, realUser: null, previewRole: null };
  }

  const { data: session, status } = sessionState;
  const s = session?.user as any;

  const discordId = s?.discord_id;
  const discordName = s?.discord_name;
  const role = s?.site_role;
  const permsKey = s?.permissions ? JSON.stringify(s.permissions) : "";

  const realUser = useMemo<AppUser | null>(() => {
    if (!discordId) return null;
    return {
      id: discordId,
      nom: discordName,
      role: role,
      couleur: "#5865F2",
      discord_id: discordId,
      permissions: permsKey ? JSON.parse(permsKey) : undefined,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discordId, discordName, role, permsKey]);

  const isRealAdmin = !!realUser && hasPermission(realUser, "admin");
  const previewRole = isRealAdmin ? previewRoleRaw : null;

  // Va chercher les VRAIES permissions configurées pour le rôle prévisualisé
  // (table `roles`), pour un aperçu fidèle — pas une approximation figée.
  useEffect(() => {
    if (!previewRole || !supabase) { setPreviewPerms(null); return; }
    let cancelled = false;
    supabase.from("roles").select("permissions").eq("nom", previewRole).maybeSingle().then(({ data }: any) => {
      if (!cancelled) setPreviewPerms(data?.permissions ?? []);
    });
    return () => { cancelled = true; };
  }, [previewRole]);

  const effectiveUser = useMemo<AppUser | null>(() => {
    if (!realUser) return null;
    if (!previewRole) return realUser;
    return { ...realUser, role: previewRole, permissions: previewPerms ?? [] };
  }, [realUser, previewRole, previewPerms]);

  if (status === "loading") return { user: null, loading: true, realUser: null, previewRole: null };
  if (!session?.user) return { user: null, loading: false, realUser: null, previewRole: null };

  return { user: effectiveUser, loading: false, realUser, previewRole };
}
