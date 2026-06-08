import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/sidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "SWSiconis 2026 — Municipalidad Provincial de Huancabamba",
  description: "Sistema de Seguimiento de la Ejecución de Inversiones - Municipalidad Provincial de Huancabamba",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("font-sans dark", inter.variable)}>
      <body className="antialiased bg-slate-950 text-white">
        <div className="flex h-screen overflow-hidden">
          {/* Fixed Sidebar */}
          <Sidebar />
          
          {/* Scrollable Content Wrapper */}
          <div className="flex-1 pl-64 overflow-y-auto bg-gradient-to-br from-[#040a15] via-[#081326] to-[#040a15] min-h-screen">
            <main className="p-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
