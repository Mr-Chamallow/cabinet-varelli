import type { Metadata } from "next";
import "./globals.css";
import AuthGuard from "./AuthGuard";

export const metadata: Metadata = {
  title: "Cabinet BullHead",
  description: "Cabinet BullHead — Law · Finance · Property",
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
