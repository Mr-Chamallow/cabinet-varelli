"use client";

import { useSession } from "next-auth/react";
import { AppUser } from "@/lib/auth";

export function useCurrentUser(): { user: AppUser | null; loading: boolean } {
  const { data: session, status } = useSession();

  if (status === "loading") return { user: null, loading: true };
  if (!session?.user) return { user: null, loading: false };

  const s = session.user as any;
  return {
    user: {
      id: s.discord_id,
      nom: s.discord_name,
      role: s.site_role,
      couleur: "#5865F2",
      discord_id: s.discord_id,
    },
    loading: false,
  };
}
