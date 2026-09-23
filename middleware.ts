import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ADMIN_ONLY_PATHS = ["/admin", "/settings", "/supervision"];

// ⚠️ Le middleware tourne dans l'Edge Runtime de Vercel : il ne doit JAMAIS importer
// lib/auth.ts (qui importe lib/supabase.ts → @supabase/supabase-js). Ce module n'est
// pas compatible Edge Runtime et provoque un crash immédiat (500
// MIDDLEWARE_INVOCATION_FAILED) sur TOUT le site, même si `next build` passe en local
// (le build ne détecte pas ce type d'incompatibilité runtime).
// On duplique donc volontairement ici, en pur JS sans dépendance, la liste des rôles
// qui donnent l'accès admin par défaut (doit rester alignée avec DEFAULT_PERMISSIONS
// dans lib/auth.ts). Un rôle personnalisé avec la permission "admin" dans la table
// Supabase `roles` passe lui via token.permissions, sans avoir besoin d'être ici.
const ADMIN_DEFAULT_ROLES = [
  "Associé / Patron",
  "CEO - Directeur général",
  "COO - Directrice opérationnel",
];

export default withAuth(
  function middleware(req) {
    const token = (req as any).nextauth?.token;
    const pathname = req.nextUrl.pathname;

    if (ADMIN_ONLY_PATHS.some(p => pathname.startsWith(p))) {
      const perms: string[] = token?.permissions || [];
      const role = token?.site_role as string | undefined;
      const isAdmin = perms.includes("admin") || (!!role && ADMIN_DEFAULT_ROLES.includes(role));
      if (!isAdmin) {
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