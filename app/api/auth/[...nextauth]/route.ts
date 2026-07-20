import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { DISCORD_SERVER_ID, getHighestRole } from "@/lib/discord-config";

const handler = NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify guilds guilds.members.read" } },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (!account?.access_token) return false;
      try {
        const res = await fetch(`https://discord.com/api/v10/users/@me/guilds/${DISCORD_SERVER_ID}/member`, {
          headers: { Authorization: `Bearer ${account.access_token}` },
        });
        
        if (!res.ok) {
          // Si le membre n'est pas sur le serveur Discord
          return "/login?error=not_member";
        }
        
        const member = await res.json();
        account.site_role = getHighestRole(member.roles || []);
        account.discord_username = member.nick || (profile as any)?.username || "Membre";
        return true;
      } catch (err) {
        console.error("Erreur Discord API:", err);
        return "/login?error=server_error";
      }
    },
    async jwt({ token, account }) {
      if (account) {
        token.site_role = account.site_role;
        token.discord_name = account.discord_username;
        token.discord_id = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).site_role = token.site_role;
        (session.user as any).discord_name = token.discord_name;
        (session.user as any).discord_id = token.discord_id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirige les erreurs directement vers la page de login au lieu de la route introuvable /api/auth/error
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };