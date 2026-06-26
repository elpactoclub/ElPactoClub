// EN: Root Next.js layout defining fonts, metadata, PWA viewport settings and the HTML shell for the entire app.
// ES: Layout raíz de Next.js que define fuentes, metadatos, configuración de viewport PWA y el shell HTML para toda la aplicación.

import type { Metadata, Viewport } from "next";
import { DM_Sans, Bebas_Neue } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "El Pacto — Fan App",
  description:
    "Club nativo digital de baloncesto. Vota decisiones del club, habla con los jugadores, sube en el ranking de fans.",
  keywords: ["basketball", "fan app", "El Pacto BC", "baloncesto", "comunidad"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "El Pacto",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0A0A0A",
};

// EN: Root layout component that wraps all pages with global fonts, CSS variables and the base HTML structure.
// ES: Componente de layout raíz que envuelve todas las páginas con fuentes globales, variables CSS y la estructura HTML base.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${dmSans.variable} ${bebasNeue.variable} h-full`}>
      <head>
        {/* Preload onboarding and landing hero images so they're ready before JS runs */}
        <link rel="preload" as="image" href="/imagenes/herson2.jpg" fetchPriority="high" />
        <link rel="preload" as="image" href="/imagenes/herson.jpg" />
        <link rel="preload" as="image" href="/imagenes/violeta.jpg" />
        <link rel="preload" as="image" href="/imagenes/elvis.jpg" />
      </head>
      <body className="h-full bg-black">
        {children}
      </body>
    </html>
  );
}
