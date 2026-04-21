import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { negocio } from "@/config";

const accentMap: Record<string, { accent: string; accentHover: string }> = {
  red:   { accent: '#ef4444', accentHover: '#dc2626' },
  green: { accent: '#22c55e', accentHover: '#16a34a' },
}
const theme = accentMap[negocio.accentColor ?? 'red'] ?? accentMap.red
const bg = negocio.bgColor ?? '#000000'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${negocio.nombre} — Reservas`,
  description: `Reservá tu turno en ${negocio.nombre}. ${negocio.recursos.length} ${negocio.recursoNombre.toLowerCase()}s · Turnos de ${negocio.duracionMinutos} min · ${negocio.direccion}.`,
  openGraph: {
    title: `${negocio.nombre} — Reservas`,
    description: `Reservá tu turno en ${negocio.nombre}. ${negocio.recursos.length} ${negocio.recursoNombre.toLowerCase()}s · Turnos de ${negocio.duracionMinutos} min · ${negocio.direccion}.`,
    siteName: negocio.nombre,
    locale: "es_AR",
    type: "website",
    images: [{ url: '/og-image.jpg', width: 1024, height: 1024 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <style>{`:root { --accent: ${theme.accent}; --accent-hover: ${theme.accentHover}; --bg: ${bg}; }`}</style>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
