import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { supabase } from "@/lib/supabase";

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

      const discordUsername = (profile as any)?.username;

      if (supabase && discordUsername) {
        const { data: membre } = await supabase
          .from("membres")
          .select("role, nom")
          .ilike("nom", discordUsername)
          .single();

        account.site_role = membre?.role || "Patron";
        account.discord_username = membre?.nom || discordUsername;
      } else {
        account.site_role = "Patron";
        account.discord_username = discordUsername || "Membre";
      }

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