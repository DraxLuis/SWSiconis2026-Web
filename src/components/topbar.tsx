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
    <header className="topbar px-6">
      {/* Left — Brand & Entity (Merged & Simplified) */}
      <div className="flex items-center gap-4">
        {/* SICONIS Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-br from-[#D40000] to-[#8B0000] flex items-center justify-center shadow-lg shadow-red-950/40 border border-white/10">
            <span className="text-xs font-black text-white tracking-widest">SC</span>
          </div>
          <div>
            <div className="flex items-baseline gap-1 leading-none">
              <h1 className="text-xs font-black tracking-widest text-white">
                SICONIS
              </h1>
              <span className="text-[9px] font-bold text-[#D40000]">2026</span>
            </div>
            <p className="text-[7.5px] text-[#4A6080] font-bold tracking-widest uppercase mt-0.5">
              Consultas SIAF®
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-white/[0.06] hidden lg:block" />

        {/* Entity details (Text-only, no border box) */}
        <div className="hidden lg:flex flex-col justify-center">
          <span className="text-[9.5px] font-extrabold tracking-wider text-slate-200 uppercase leading-none">
            MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA
          </span>
          <span className="text-[8px] text-[#4A6080] font-bold tracking-widest uppercase leading-none mt-1">
            UE 301548 · PIURA
          </span>
        </div>
      </div>

      {/* Center — Period badge (Simplified) */}
      <div className="hidden md:flex items-center gap-2">
        <span className="text-[8.5px] font-extrabold tracking-widest text-[#4A6080] uppercase">
          AÑO FISCAL
        </span>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#D40000]/10 border border-[#D40000]/20 text-[#D40000] font-mono leading-none">
          2026
        </span>
      </div>

      {/* Right — User & Date */}
      <div className="flex items-center gap-4">
        {/* Compact Date/Time */}
        {now && (
          <div className="hidden sm:flex flex-col text-right min-w-[100px]">
            <p className="text-[9.5px] font-bold text-slate-300 leading-none uppercase font-mono">
              {fecha}
            </p>
            <p className="text-[8.5px] text-[#4A6080] font-bold tracking-wider leading-none mt-1 font-mono">
              {hora}
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="h-6 w-px bg-white/[0.06] hidden sm:block" />

        {/* User dropdown chip */}
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.03] transition-all duration-200 group focus:outline-none"
          >
            <div className="h-6.5 w-6.5 rounded-lg bg-gradient-to-br from-[#D40000] to-[#8B0000] flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-950/20 border border-white/5">
              <User className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-[9.5px] font-black text-white leading-tight tracking-wider">ADMINISTRADOR</p>
              <p className="text-[8px] text-[#4A6080] font-bold tracking-widest uppercase leading-none mt-0.5">SQL Server</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-[#4A6080] group-hover:text-slate-300 transition-colors hidden md:block" />
          </button>
          
          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={() => setDropdownOpen(false)}
              />
              
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#061526] border border-white/[0.08] shadow-2xl z-50 py-1.5 animate-scale-in">
                <div className="px-3 py-2 border-b border-white/[0.06]">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">SESIÓN ACTIVA</p>
                  <p className="text-[11px] font-semibold text-white mt-0.5">Administrador</p>
                </div>
                <button 
                  onClick={() => {
                    document.cookie = 'siconis_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
                    router.push('/login');
                    router.refresh();
                  }}
                  className="w-full text-left px-3 py-2 text-[11px] font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150 flex items-center gap-2"
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
