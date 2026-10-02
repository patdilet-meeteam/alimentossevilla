import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alimentos Sevilla — Plataforma de Gestión Técnica y Nutricional",
  description:
    "Sistema centralizado para formulaciones, perfiles nutricionales, cálculo normativo y control técnico de Alimentos Sevilla S.A.S.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
