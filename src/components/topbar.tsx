'use client';

import { useState, useEffect } from 'react';
import { Building2, CalendarDays, User, ChevronDown, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Topbar() {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // null = no renderizado aún (evita mismatch servidor/cliente)
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Solo corre en el cliente
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fecha = now
    ? now.toLocaleDateString('es-PE', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      })
    : '';

  const hora = now
    ? now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <header className="topbar">
      {/* Left — Brand */}
      <div className="flex items-center gap-3">
        {/* Logo mark */}
        <div className="relative flex-shrink-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#D40000] to-[#8B0000] flex items-center justify-center shadow-lg shadow-red-950/50">
            <span className="text-[11px] font-black text-white tracking-tight">SC</span>
          </div>
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[#03101F]" />
        </div>

        {/* Brand name */}
        <div>
          <div className="flex items-baseline gap-1.5">
            <h1 className="text-sm font-black tracking-wider text-white leading-none">
              SICONIS
            </h1>
            <span className="text-[10px] font-bold text-[#D40000] leading-none">2026</span>
          </div>
          <p className="text-[9px] text-[#4A6080] font-medium tracking-widest uppercase mt-0.5 leading-none">
            Consultas Interactivas SIAF
          </p>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-white/[0.07] mx-1" />

        {/* Entity info */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center flex-shrink-0">
            <Building2 className="h-3.5 w-3.5 text-[#4A6080]" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-white leading-tight">
              Municipalidad Prov. Huancabamba
            </p>
            <p className="text-[9px] text-[#4A6080] leading-tight">
              UE 301548 · Piura
            </p>
          </div>
        </div>
      </div>

      {/* Center — Period badge */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
        <CalendarDays className="h-3.5 w-3.5 text-[#4A6080]" />
        <span className="text-[11px] font-semibold text-slate-300">
          Año Fiscal <span className="text-[#D40000] font-black">2026</span>
        </span>
      </div>

      {/* Right — User & Date */}
      <div className="flex items-center gap-3">
        {/* Date — solo se muestra cuando now está disponible (cliente) */}
        <div className="hidden lg:block text-right min-w-[120px]">
          {now && (
            <>
              <p className="text-[10px] text-[#4A6080] font-medium capitalize leading-tight">
                {fecha}
              </p>
              <p className="text-[9px] text-[#2A3A50] font-medium leading-tight tabular-nums">
                {hora}
              </p>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-white/[0.07]" />

        {/* User chip */}
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/10 transition-all duration-200 group"
          >
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0">
              <User className="h-3 w-3 text-slate-300" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[10px] font-semibold text-white leading-tight">ADMINISTRADOR</p>
              <p className="text-[9px] text-[#4A6080] leading-tight">SQL Server</p>
            </div>
            <ChevronDown className="h-3 w-3 text-[#4A6080] group-hover:text-slate-300 transition-colors hidden sm:block" />
          </button>
          
          {dropdownOpen && (
            <>
              {/* Overlay invisible para cerrar el menú al hacer click afuera */}
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={() => setDropdownOpen(false)}
              />
              
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#061526] border border-white/[0.08] shadow-2xl z-50 py-1.5 animate-scale-in">
                <div className="px-3 py-2 border-b border-white/[0.06]">
                  <p className="text-[10px] font-bold text-slate-400">SESIÓN ACTIVA</p>
                  <p className="text-xs font-semibold text-white mt-0.5">Administrador</p>
                </div>
                <button 
                  onClick={() => {
                    document.cookie = 'siconis_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
                    router.push('/login');
                    router.refresh();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150 flex items-center gap-2"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Cerrar Sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
