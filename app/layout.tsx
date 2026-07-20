import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Cabinet BullHead",
  description: "Gestion cabinet et logistique",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar />
            <main style={{ flex: 1, padding: "2rem" }}>
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
