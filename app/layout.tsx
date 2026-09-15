import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Cabinet Bullhead',
  description: 'Gestion et opérations',
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
      <body className="bg-slate-900 text-slate-100 antialiased h-full overflow-hidden flex">
        <Providers>
          <Sidebar />
          <main className="flex-1 relative h-full overflow-auto">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
