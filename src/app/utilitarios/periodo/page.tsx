'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, X, Check } from 'lucide-react';

export default function PeriodoPage() {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState('2026');

  useEffect(() => {
    // Read current active year from cookies
    const matchYear = document.cookie.match(/(?:^|; )siconis_year=([^;]*)/);
    if (matchYear) {
      setSelectedYear(matchYear[1]);
    }
  }, []);

  const handleAceptar = () => {
    // Save siconis_year cookie (valid for 365 days)
    document.cookie = `siconis_year=${selectedYear}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
    
    // Force route refresh/redirection to apply year change globally
    window.location.href = '/';
  };

  const handleCancelar = () => {
    router.push('/');
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center p-6 relative">
      
      {/* Background Decorative Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at center, rgba(212,0,0,0.15) 0%, transparent 70%)`
        }}
      />

      {/* FoxPro Classic Style Dialog Window Container */}
      <div className="w-full max-w-md bg-[#04101e] border-2 border-[#1E293B] shadow-2xl rounded-lg overflow-hidden animate-scale-in relative z-10">
        
        {/* Titlebar Frame */}
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#0d1e3d] px-4 py-2 flex items-center justify-between border-b border-[#2A3F64]">
          <div className="flex items-center gap-2">
            {/* Retro icon */}
            <div className="h-5 w-5 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <span className="text-[12px] font-black text-slate-100 tracking-wider font-mono">
              Año de Ejecución
            </span>
          </div>
          {/* Close button */}
          <button 
            onClick={handleCancelar}
            className="text-slate-400 hover:text-white transition-colors p-0.5 rounded hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Window Content */}
        <div className="p-8 flex flex-col items-center">
          
          {/* Form Content */}
          <div className="flex items-center gap-6 my-8">
            <label className="text-[13px] font-black tracking-wider text-slate-300 font-mono">
              Año de Ejecución:
            </label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none bg-[#020b18] border-2 border-[#2A3F64] text-slate-200 font-mono text-[14px] font-black px-4 py-1.5 pr-10 rounded shadow-inner focus:outline-none focus:border-[#D40000] focus:ring-1 focus:ring-[#D40000] cursor-pointer"
              >
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400 border-l border-[#2A3F64] bg-[#0d1e3d]/40 rounded-r">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Action buttons (FoxPro Underlined Links Style) */}
          <div className="flex items-center gap-12 mt-4 pt-6 border-t border-[#1E293B] w-full justify-center">
            <button
              onClick={handleAceptar}
              className="text-[#3b82f6] hover:text-[#60a5fa] font-black font-mono text-[13px] hover:underline focus:outline-none flex items-center gap-1.5 transition-colors"
            >
              <Check className="h-4 w-4" />
              Aceptar
            </button>
            <button
              onClick={handleCancelar}
              className="text-[#ef4444] hover:text-[#f87171] font-black font-mono text-[13px] hover:underline focus:outline-none flex items-center gap-1.5 transition-colors"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
