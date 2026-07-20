import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

// Remplace par ton ID Discord copié à l'étape 1 (ex: "289412345678901234")
const ADMIN_DISCORD_ID = "460865920278069248"; 

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
      if (!account?.providerAccountId) return false;

      const discordId = account.providerAccountId;
      const discordUsername = (profile as any)?.username || "Admin";

      // Si c'est ton ID Discord, tu es d'office Patron / Admin
      if (discordId === ADMIN_DISCORD_ID) {
        account.site_role = "Patron";
      } else {
        account.site_role = "MEMBRE";
      }

      account.discord_username = discordUsername;
      return true;
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
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };