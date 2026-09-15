import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Obsidian Logistique',
  description: 'Solutions de transport, de stockage et d\'import/export d\'urgence.',
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
    <html lang="fr">
      <body className="bg-slate-900 text-slate-100 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
