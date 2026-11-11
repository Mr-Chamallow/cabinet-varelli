import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { AppShell } from '@/components/AppShell';
import { PwaRegister } from '@/components/PwaRegister';

export const metadata: Metadata = {
  title: 'Cabinet Varelli & Associés',
  description: 'Plateforme du Cabinet Varelli & Associés',
  manifest: '/manifest.json',
  icons: {
    icon: '/cabinet-logo.jpg',
    shortcut: '/cabinet-logo.jpg',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Cabinet Varelli & Associés',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0b0e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem("obs-mode")==="light")document.documentElement.setAttribute("data-theme","light")}catch(e){}` }} /></head>
      <body>
        <PwaRegister />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
