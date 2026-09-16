import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Obsidian Logistique',
  description: 'Plateforme de gestion - Obsidian Logistique',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
      <body className="bg-slate-900 text-slate-100 antialiased h-screen w-screen overflow-hidden flex">
        <Providers>
          <div className="w-64 flex-shrink-0 h-full z-20">
            <Sidebar />
          </div>
          <main className="flex-1 h-full relative overflow-hidden z-10">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
