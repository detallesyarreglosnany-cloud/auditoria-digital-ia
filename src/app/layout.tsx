import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Auditoría Digital IA — LLAVE DIGITAL 3.0",
  description: "Descubre exactamente por qué tu negocio digital no vende lo que debería. Auditoría con Inteligencia Artificial en minutos. Gratis o completa por $9.99.",
  keywords: ["auditoría digital", "IA", "ventas online", "LLAVE DIGITAL", "optimización", "negocio digital"],
  openGraph: {
    title: "Auditoría Digital IA — LLAVE DIGITAL 3.0",
    description: "Descubre exactamente por qué tu negocio digital no vende lo que debería.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-[#0F0D0B] text-[#E2D9CC]`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
