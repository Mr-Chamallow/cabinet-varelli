"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { AppUser } from "@/lib/auth";

export function useCurrentUser(): { user: AppUser | null; loading: boolean } {
  const sessionState = useSession();

  if (!sessionState) {
    return { user: null, loading: true };
  }

  const { data: session, status } = sessionState;
  const s = session?.user as any;

  const discordId = s?.discord_id;
  const discordName = s?.discord_name;
  const role = s?.site_role;
  const permsKey = s?.permissions ? JSON.stringify(s.permissions) : "";

  const user = useMemo<AppUser | null>(() => {
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

  if (status === "loading") return { user: null, loading: true };
  if (!session?.user) return { user: null, loading: false };

  return { user, loading: false };
}
