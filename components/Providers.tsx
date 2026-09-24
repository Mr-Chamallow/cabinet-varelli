"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BootScreen } from "@/components/BootScreen";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <BootScreen />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
