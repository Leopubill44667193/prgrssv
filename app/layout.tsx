import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OC.Hobbies.Racing — Reservas",
  description: "Reservá tu turno en los simuladores de conducción. 4 simuladores · Turnos de 60 min · Av. 3 de Febrero 283, Rojas.",
  openGraph: {
    title: "OC.Hobbies.Racing — Reservas",
    description: "Reservá tu turno en los simuladores de conducción. 4 simuladores · Turnos de 60 min · Av. 3 de Febrero 283, Rojas.",
    siteName: "OC.Hobbies.Racing",
    locale: "es_AR",
    type: "website",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
