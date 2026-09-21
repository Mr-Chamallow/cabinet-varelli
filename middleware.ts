import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ADMIN_ONLY_PATHS = ["/admin", "/settings", "/supervision"];

export default withAuth(
  function middleware(req) {
    const token = (req as any).nextauth?.token;
    const role = token?.site_role;
    const pathname = req.nextUrl.pathname;

    if (ADMIN_ONLY_PATHS.some(p => pathname.startsWith(p))) {
      const perms = token?.permissions || [];
      const isAdmin = perms.includes("admin") || role === "CEO - Directeur général" || role === "Associé / Patron";
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
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico|logo.png).*)",
  ],
};