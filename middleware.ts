import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/auth";

const ADMIN_ONLY_PATHS = ["/admin", "/settings", "/supervision"];

export default withAuth(
  function middleware(req) {
    const token = (req as any).nextauth?.token;
    const pathname = req.nextUrl.pathname;

    if (ADMIN_ONLY_PATHS.some(p => pathname.startsWith(p))) {
      // Même logique que côté client (lib/auth.ts) : union permissions Supabase + rôle par
      // défaut. Avant, ce check était dupliqué ici avec une liste de rôles codée en dur
      // ("CEO..." / "Associé / Patron" uniquement) qui pouvait désynchroniser le middleware
      // du reste de l'appli et bloquer un admin légitime silencieusement.
      const user = { id: token?.discord_id, nom: token?.discord_name, role: token?.site_role, permissions: token?.permissions } as any;
      if (!hasPermission(user, "admin")) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: [
    // On exclut TOUT /api/* : les routes API gèrent déjà leur propre vérification
    // (requirePermission côté serveur) et doivent répondre en JSON, jamais être
    // redirigées vers /login par le middleware (ça cassait fetch() en boucle).
    "/((?!login|api|_next/static|_next/image|favicon.ico|logo.png).*)",
  ],
};