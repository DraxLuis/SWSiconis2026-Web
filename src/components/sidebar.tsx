'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  CreditCard,
  Building2
} from 'lucide-react';

export function Sidebar({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const pathname = usePathname();

  const routes = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/',
      active: pathname === '/',
    },
    {
      label: 'Ejecución de Gastos',
      icon: TrendingDown,
      href: '/gastos',
      active: pathname === '/gastos',
    },
    {
      label: 'Ejecución de Ingresos',
      icon: TrendingUp,
      href: '/ingresos',
      active: pathname === '/ingresos',
    },
    {
      label: 'Notas de Pago',
      icon: CreditCard,
      href: '/pagos',
      active: pathname === '/pagos',
    },
    {
      label: 'Reportes Presupuestales',
      icon: FileText,
      href: '/reportes',
      active: pathname === '/reportes',
    },
  ];

  return (
    <div className={cn("pb-12 min-h-screen border-r border-slate-800 bg-[#070f1e]/85 backdrop-blur-md text-white w-64 fixed flex flex-col justify-between", className)}>
      <div className="px-3 py-6 flex-1">
        {/* Institutional Logo Section */}
        <div className="flex items-center pl-3 mb-10 gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#d40000] to-red-800 flex items-center justify-center shadow-lg shadow-red-900/30">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wider uppercase text-white leading-tight">
              SWSiconis <span className="text-[#d40000]">2026</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">HUANCABAMBA — PIURA</p>
          </div>
        </div>

        {/* Navigation Routes */}
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-lg transition-all duration-300 relative overflow-hidden",
                route.active 
                  ? "bg-gradient-to-r from-red-950/40 to-[#d40000]/10 text-white font-semibold border-l-4 border-[#d40000] pl-2" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/35 hover:pl-4"
              )}
            >
              <div className="flex items-center flex-1 gap-3 z-10">
                <route.icon className={cn("h-5 w-5 transition-colors duration-300", 
                  route.active ? "text-[#d40000]" : "text-slate-400 group-hover:text-white"
                )} />
                {route.label}
              </div>
              
              {/* Subtle hover background highlight */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/0 to-red-600/0 transition-all duration-500 group-hover:from-red-600/5",
                route.active && "from-red-600/10"
              )} />
            </Link>
          ))}
        </div>
      </div>

      {/* Footer / User info */}
      <div className="px-6 py-4 border-t border-slate-800/60 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shadow-inner">
            UE
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-semibold text-slate-200 truncate">Gobierno Local</h4>
            <p className="text-[10px] text-slate-500 truncate">MPH - Piura</p>
          </div>
        </div>
      </div>
    </div>
  );
}
