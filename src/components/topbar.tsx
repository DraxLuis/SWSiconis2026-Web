'use client';

import { useState, useEffect } from 'react';
import { User, ChevronDown, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Topbar() {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fecha = now
    ? now.toLocaleDateString('es-PE', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '';

  const hora = now
    ? now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <header className="topbar px-6 h-[72px] flex items-center justify-between">
      {/* Left — Brand & Entity (Scaled for Legibility) */}
      <div className="flex items-center gap-4">
        {/* SICONIS Logo */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#D40000] to-[#8B0000] flex items-center justify-center shadow-lg shadow-red-950/40 border border-white/15">
            <span className="text-base font-black text-white tracking-widest">SC</span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 leading-none">
              <h1 className="text-base md:text-[17px] font-black tracking-widest text-white leading-none">
                SICONIS
              </h1>
              <span className="text-xs md:text-sm font-black text-[#FF3B30]">2026</span>
            </div>
            <p className="text-[11px] text-[#5F7A9F] font-extrabold tracking-widest uppercase mt-1.5 leading-none">
              Consultas SIAF®
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-10 w-px bg-white/[0.08] hidden lg:block" />

        {/* Entity details */}
        <div className="hidden lg:flex flex-col justify-center">
          <span className="text-[13.5px] font-black tracking-wider text-slate-100 uppercase leading-none">
            MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA
          </span>
          <span className="text-[11px] text-[#5F7A9F] font-extrabold tracking-widest uppercase leading-none mt-1.5">
            UE 301548 · PIURA
          </span>
        </div>
      </div>

      {/* Center — Period badge */}
      <div className="hidden md:flex items-center gap-2.5">
        <span className="text-[11px] font-extrabold tracking-widest text-[#5F7A9F] uppercase">
          AÑO FISCAL
        </span>
        <span className="text-sm font-black px-3 py-1.5 rounded-lg bg-[#D40000]/12 border border-[#D40000]/30 text-[#FF453A] font-mono leading-none">
          2026
        </span>
      </div>

      {/* Right — User & Date */}
      <div className="flex items-center gap-4">
        {/* Compact Date/Time */}
        {now && (
          <div className="hidden sm:flex flex-col text-right min-w-[120px]">
            <p className="text-[12px] font-bold text-slate-200 leading-none uppercase font-mono">
              {fecha}
            </p>
            <p className="text-[11px] text-[#5F7A9F] font-bold tracking-wider leading-none mt-1.5 font-mono">
              {hora}
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="h-8 w-px bg-white/[0.08] hidden sm:block" />

        {/* User dropdown chip */}
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-200 group focus:outline-none"
          >
            <div className="h-8.5 w-8.5 rounded-lg bg-gradient-to-br from-[#D40000] to-[#8B0000] flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-950/20 border border-white/10">
              <User className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-[12px] font-black text-white leading-tight tracking-wider">ADMINISTRADOR</p>
              <p className="text-[10.5px] text-[#5F7A9F] font-extrabold tracking-widest uppercase leading-none mt-1.5">SQL Server</p>
            </div>
            <ChevronDown className="h-4.5 w-4.5 text-[#5F7A9F] group-hover:text-slate-300 transition-colors hidden md:block" />
          </button>
          
          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={() => setDropdownOpen(false)}
              />
              
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#061526] border border-white/[0.08] shadow-2xl z-50 py-1.5 animate-scale-in">
                <div className="px-3 py-2 border-b border-white/[0.06]">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SESIÓN ACTIVA</p>
                  <p className="text-xs font-semibold text-white mt-0.5">Administrador</p>
                </div>
                <button 
                  onClick={() => {
                    document.cookie = 'siconis_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
                    router.push('/login');
                    router.refresh();
                  }}
                  className="w-full text-left px-3 py-2 text-[11.5px] font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
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
