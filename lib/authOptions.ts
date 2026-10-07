import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { DISCORD_SERVER_ID, getHighestRole } from "@/lib/discord-config";
import { supabase } from "@/lib/supabase";

const ADMIN_DISCORD_ID = process.env.ADMIN_DISCORD_ID || "";

type GuildMembership = {
  inGuild: boolean;
  roles: string[];
  // Pourquoi ce n'est pas un membre valide, quand inGuild = false :
  // 'not_member'    -> Discord répond 404 : le compte n'est juste pas sur le serveur.
  // 'missing_scope' -> Discord répond 401/403 : le scope guilds.members.read n'a
  //                     pas été accordé à l'écran d'autorisation (case décochée).
  // 'api_error'      -> autre code/erreur réseau.
  failReason?: "not_member" | "missing_scope" | "api_error";
};

// ⚠️ Distingue "pas membre du serveur Discord" (inGuild: false) de "membre mais
// aucun des rôles suivis" (inGuild: true, roles: []). Avant ce fix, les deux cas
// renvoyaient un simple [] et getHighestRole() retombait sur "Opérateur stagiaire"
// par défaut — donnant accès au site à N'IMPORTE QUI se connectant via Discord,
// même hors du serveur. Voir Admin > Journaux pour vérifier qui s'est connecté ainsi.
async function fetchGuildMembership(accessToken: string): Promise<GuildMembership> {
  const res = await fetch(
    `https://discord.com/api/users/@me/guilds/${DISCORD_SERVER_ID}/member`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (res.ok) {
    const data = await res.json();
    return { inGuild: true, roles: data.roles || [] };
  }
  if (res.status === 404) return { inGuild: false, roles: [], failReason: "not_member" };
  if (res.status === 401 || res.status === 403) return { inGuild: false, roles: [], failReason: "missing_scope" };
  return { inGuild: false, roles: [], failReason: "api_error" };
}

// Synchro auto des rôles Discord -> site : intervalle de relecture.
const ROLE_SYNC_INTERVAL_MS = 5 * 60 * 1000;

// Renouvelle le token Discord de l'utilisateur (il expire après ~7 jours).
async function refreshDiscordToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
  try {
    const res = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Journalise une connexion REFUSÉE (avant création de session) avec la vraie raison,
// pour ne plus avoir à deviner quand quelqu'un dit "je n'arrive pas à me connecter".
// Ne doit jamais faire planter la connexion si la table n'existe pas encore.
async function logFailedLogin(discordId: string, discordName: string, reason: string) {
  if (!supabase) return;
  try {
    await supabase.from("site_login_failures").insert([{ discord_id: discordId, discord_name: discordName, reason }]);
  } catch {
    // Table pas encore créée (migration non exécutée) — ne bloque jamais la connexion pour ça.
  }
}

async function getRoleOverride(discordId: string): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("role_overrides")
    .select("role")
    .eq("discord_id", discordId)
    .maybeSingle();
  return data?.role || null;
}

async function getRolePermissions(roleName: string): Promise<string[] | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("roles")
    .select("permissions")
    .eq("nom", roleName)
    .maybeSingle();
  return data?.permissions ?? null;
}

// Vérifie si ce Discord ID est banni du site. Ne doit jamais faire planter la
// connexion si la table n'existe pas encore (migration pas encore exécutée).
async function checkBan(discordId: string): Promise<{ banned: boolean; motif: string }> {
  if (!supabase) return { banned: false, motif: "" };
  try {
    const { data } = await supabase.from("site_bans").select("motif").eq("discord_id", discordId).maybeSingle();
    return data ? { banned: true, motif: data.motif || "" } : { banned: false, motif: "" };
  } catch {
    return { banned: false, motif: "" };
  }
}

// Trace chaque connexion/déconnexion réelle (pas les rafraîchissements de token) dans
// site_session_log, pour un vrai journal consultable dans Admin > Journaux.
async function logSession(discordId: string, discordName: string, event: "connect" | "disconnect") {
  if (!supabase) return;
  try {
    await supabase.from("site_session_log").insert([{ discord_id: discordId, discord_name: discordName, event }]);
  } catch {
    // Table pas encore créée (migration non exécutée) — ne bloque jamais la connexion pour ça.
  }
}

// Trace chaque connexion (nom + rôle détecté + horodatage) dans site_logins, pour
// avoir une vraie liste des membres qui utilisent le site (Admin > Membres) — et
// pouvoir vérifier si quelqu'un qui dit "je n'arrive pas à accéder au site" s'est
// réellement connecté ou non. Ne doit jamais faire planter la connexion en cas d'échec.
async function recordLogin(discordId: string, discordName: string, role: string) {
  if (!supabase) return;
  try {
    const { data: existing } = await supabase
      .from("site_logins")
      .select("discord_id")
      .eq("discord_id", discordId)
      .maybeSingle();
    if (existing) {
      await supabase.from("site_logins").update({ discord_name: discordName, site_role: role, last_login: new Date().toISOString() }).eq("discord_id", discordId);
    } else {
      await supabase.from("site_logins").insert([{ discord_id: discordId, discord_name: discordName, site_role: role }]);
    }
  } catch {
    // La table n'existe peut-être pas encore (script SQL non exécuté) — ne bloque jamais la connexion pour ça.
  }
}

// Config NextAuth centralisée, exportée pour être réutilisable côté serveur
// (route handler ET lib/serverAuth.ts pour les routes API protégées).
export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      // ⚠️ Discord renvoie désormais un paramètre `iss` au callback (RFC 9207).
      // next-auth v4 (openid-client) le vérifie, mais le provider Discord intégré
      // n'a aucun `issuer` configuré → erreur "issuer must be configured on the
      // issuer" (OAuthCallback) AVANT d'exécuter signIn()/jwt(). Même symptôme que
      // celui rapporté pour GitHub avec RFC 9207. Fix : déclarer l'issuer Discord.
      // Si les logs Vercel affichent ensuite "unexpected iss value, expected X, got Y",
      // remplacer cette valeur par le "got Y" exact.
      issuer: "https://discord.com",
      authorization: { params: { scope: "identify guilds guilds.members.read" } },
    }),
  ],
  callbacks: {
    // Bloque la connexion AVANT même de créer une session si la personne n'est pas
    // membre du serveur Discord (sauf le compte admin, qui garde toujours l'accès).
    // Retourne une URL de redirection différente selon la vraie cause (pas membre /
    // scope refusé / erreur API) au lieu d'un simple true/false opaque, pour que
    // /login affiche un message précis et qu'on n'ait plus à deviner.
    async signIn({ account, profile }) {
      // Tout est enveloppé dans un try/catch : avant ce fix, une exception imprévue
      // ici (fetch qui throw, etc.) remontait tout droit à NextAuth, qui affichait
      // juste "Connexion refusée. Réessaie." SANS rien logguer dans
      // site_login_failures — impossible de savoir pourquoi. Maintenant la vraie
      // erreur est toujours enregistrée, visible dans Admin > Journaux > 🚫 Refusées.
      const discordName = (profile as any)?.username || "Inconnu";
      try {
        if (!account?.access_token) {
          await logFailedLogin("inconnu", discordName, "no_access_token");
          return "/login?error=AccessDenied";
        }
        if (account.providerAccountId === ADMIN_DISCORD_ID) return true;
        const { inGuild, failReason } = await fetchGuildMembership(account.access_token);
        if (inGuild) return true;
        await logFailedLogin(account.providerAccountId, discordName, failReason || "api_error");
        if (failReason === "missing_scope") return "/login?error=MissingScope";
        if (failReason === "not_member") return "/login?error=NotMember";
        return "/login?error=AccessDenied";
      } catch (err: any) {
        const reason = `exception: ${err?.message || String(err)}`.slice(0, 500);
        await logFailedLogin(account?.providerAccountId || "inconnu", discordName, reason);
        return "/login?error=AccessDenied";
      }
    },
    async jwt({ token, account, profile }) {
      // 1) Connexion : on mémorise l'identité + les tokens Discord (pour la synchro auto).
      if (account?.access_token) {
        const { inGuild, roles } = await fetchGuildMembership(account.access_token);
        token.discord_id = account.providerAccountId;
        token.discord_name = (profile as any)?.username || "Membre";
        token.discord_access = account.access_token;
        token.discord_refresh = account.refresh_token;
        token.discord_expires = account.expires_at ? account.expires_at * 1000 : 0;
        token.roles_checked_at = Date.now();
        token.discord_roles = roles;
        token.in_guild = inGuild;
      } else if (token.discord_id && token.discord_id !== ADMIN_DISCORD_ID) {
        // 2) Sessions suivantes : re-lit les rôles Discord toutes les 5 min.
        const last = (token.roles_checked_at as number) || 0;
        if (Date.now() - last > ROLE_SYNC_INTERVAL_MS) {
          token.roles_checked_at = Date.now(); // évite de retenter en boucle si Discord est en panne
          let access = token.discord_access as string | undefined;
          if (token.discord_refresh && (!access || Date.now() > ((token.discord_expires as number) || 0) - 60_000)) {
            const fresh = await refreshDiscordToken(token.discord_refresh as string);
            if (fresh) {
              access = fresh.access_token;
              token.discord_access = fresh.access_token;
              token.discord_refresh = fresh.refresh_token;
              token.discord_expires = Date.now() + fresh.expires_in * 1000;
            } else {
              access = undefined; // refresh impossible : on garde les rôles actuels
            }
          }
          if (access) {
            const m = await fetchGuildMembership(access);
            if (m.inGuild) { token.discord_roles = m.roles; token.in_guild = true; }
            else if (m.failReason === "not_member") { token.discord_roles = []; token.in_guild = false; }
            // missing_scope / api_error : on ne touche à rien
          }
        }
      }
      if (token.discord_id) {
        token.site_role =
          token.discord_id === ADMIN_DISCORD_ID
            ? "Associé / Patron"
            // Garde-fou : plus membre du serveur -> plus de rôle (donc plus d'accès).
            : (token.in_guild ? getHighestRole((token.discord_roles as string[]) || []) : null);
        const override = await getRoleOverride(token.discord_id as string);
        if (override) token.site_role = override;
      }
      if (token.site_role) {
        const perms = await getRolePermissions(token.site_role as string);
        token.permissions = perms;
      }
      if (account?.access_token && token.discord_id) {
        await recordLogin(token.discord_id as string, (token.discord_name as string) || "Membre", (token.site_role as string) || "");
        await logSession(token.discord_id as string, (token.discord_name as string) || "Membre", "connect");
      }
      if (token.discord_id) {
        const ban = await checkBan(token.discord_id as string);
        token.banned = ban.banned;
        token.ban_reason = ban.motif;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).site_role = token.site_role;
        (session.user as any).discord_name = token.discord_name;
        (session.user as any).discord_id = token.discord_id;
        (session.user as any).permissions = token.permissions || null;
        (session.user as any).banned = !!token.banned;
        (session.user as any).ban_reason = token.ban_reason || "";
      }
      return session;
    },
  },
  pages: { signIn: "/login", error: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
