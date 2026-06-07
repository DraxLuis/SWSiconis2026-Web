import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'SICONIS 2026 — Municipalidad Provincial de Huancabamba',
  description:
    'Sistema Integrado de Consultas Interactivas con Conexión a SIAF® — Team Libera Sistemas Informáticos',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
