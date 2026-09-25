import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cabinet, switzer } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Electrificarte, panel interno",
  description: "Panel interno de Electrificarte para administración y vendedores oficiales.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-CL" className={`${cabinet.variable} ${switzer.variable}`} suppressHydrationWarning>
      <body>
        {/* next-themes guarda la elección en localStorage y la aplica antes de pintar
            (script propio en el <head>), así no hay parpadeo al recargar. */}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
