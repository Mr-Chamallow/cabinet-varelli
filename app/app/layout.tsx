import type { Metadata } from "next";
import "./globals.css";
import AuthGuard from "./AuthGuard";

export const metadata: Metadata = {
  title: "Cabinet Varelli",
  description: "Cabinet d'avocats — Seul Dieu peut juger",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
