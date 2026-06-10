'use client';

import { useState, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Fixed Topbar — always at top */}
      <Topbar />

      {/* Sidebar — fixed left, below topbar */}
      <Suspense fallback={null}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
        />
      </Suspense>

      {/* Main content area */}
      <div
        className={cn(
          'min-h-screen pt-[72px] transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'pl-[68px]' : 'pl-[268px]'
        )}
        style={{
          background:
            'linear-gradient(145deg, #020B18 0%, #03101F 50%, #020D1E 100%)',
        }}
      >
        {/* Grid overlay — subtle */}
        <div
          aria-hidden
          className="fixed inset-0 pointer-events-none select-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.017) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.017) 1px, transparent 1px)
            `,
            backgroundSize: '52px 52px',
            zIndex: 0,
          }}
        />

        {/* Accent glow — top-left */}
        <div
          aria-hidden
          className="fixed pointer-events-none select-none"
          style={{
            top: '-15%',
            left: '5%',
            width: '45vw',
            height: '45vh',
            background:
              'radial-gradient(ellipse at center, rgba(212,0,0,0.055) 0%, transparent 70%)',
            zIndex: 0,
          }}
        />
        {/* Accent glow — bottom-right */}
        <div
          aria-hidden
          className="fixed pointer-events-none select-none"
          style={{
            bottom: '-10%',
            right: '5%',
            width: '35vw',
            height: '35vh',
            background:
              'radial-gradient(ellipse at center, rgba(21,101,192,0.04) 0%, transparent 70%)',
            zIndex: 0,
          }}
        />

        <main className="relative z-10 p-6 md:p-8 max-w-[1600px] mx-auto w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

