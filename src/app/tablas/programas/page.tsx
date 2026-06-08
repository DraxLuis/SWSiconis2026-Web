'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Search, RefreshCw, AlertTriangle, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Programa {
  progppto: string;
  nombre: string;
}

export default function ProgramasCatalogPage() {
  const [loading, setLoading] = useState(true);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tablas/programas');
      const data = await res.json();
      if (data.success) {
        setProgramas(data.programas ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filtered = programas.filter(p => 
    p.progppto.includes(search) || 
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const getProgramType = (code: string) => {
    if (code === '9001') return 'Acciones Centrales';
    if (code === '9002') return 'Asignaciones APNOP';
    return 'Programa Presupuestal';
  };

  const getProgramBadgeCls = (code: string) => {
    if (code === '9001') return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    if (code === '9002') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#d40000] text-xs font-bold uppercase tracking-widest mb-1">
            <BarChart3 className="h-4 w-4" /> Catálogos del Sistema
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">
            Programas Presupuestales
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Programas orientados a resultados, acciones centrales y asignaciones presupuestales vigentes en 2026
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData}
            className="p-2.5 rounded-lg border border-slate-800 bg-[#0b1329]/40 hover:bg-slate-800/40 text-slate-300 hover:text-white transition-all"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-5 rounded-2xl border border-slate-800/70 bg-[#091122]/40 backdrop-blur-md shadow-lg max-w-xl">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
            <Search className="h-3 w-3 text-[#d40000]" /> Buscar Programa
          </label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Escriba código o nombre de programa..."
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#d40000]/60 transition-all" 
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-600" />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border border-slate-800 bg-[#081020]/40 animate-pulse h-36 flex flex-col justify-between">
              <div className="h-4 bg-slate-800 rounded w-16" />
              <div className="h-4 bg-slate-800 rounded w-5/6" />
              <div className="h-3 bg-slate-800 rounded w-1/3" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 rounded-2xl border border-slate-800/60 bg-[#081020]/20">
            <div className="flex flex-col items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-slate-600" />
              <span className="font-semibold text-sm">No se encontraron programas presupuestales.</span>
            </div>
          </div>
        ) : (
          filtered.map(prog => {
            const isExpanded = !!expandedIds[prog.progppto];
            const isLong = prog.nombre.length > 55;
            return (
              <div 
                key={prog.progppto}
                className="group relative p-5 rounded-2xl border border-slate-800/80 bg-[#081020]/60 hover:bg-[#0c162b]/80 backdrop-blur-md transition-all duration-300 hover:border-[#d40000]/40 hover:shadow-[0_0_20px_rgba(212,0,0,0.05)] flex flex-col justify-between min-h-[10rem] h-auto"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-black text-[#d40000] bg-[#d40000]/10 px-2.5 py-1 rounded-lg">
                      {prog.progppto}
                    </span>
                    <button
                      onClick={() => handleCopy(prog.progppto)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-white transition-all"
                      title="Copiar código"
                    >
                      {copiedId === prog.progppto ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <h3 className={cn(
                    "font-bold text-white text-[13px] group-hover:text-[#d40000] transition-colors leading-snug mt-3.5",
                    isExpanded ? "" : "line-clamp-2"
                  )} title={prog.nombre}>
                    {prog.nombre}
                  </h3>
                  {isLong && (
                    <button
                      onClick={() => toggleExpand(prog.progppto)}
                      className="text-[#d40000] hover:text-[#ff3b3b] text-[10px] font-extrabold mt-1.5 transition-colors focus:outline-none flex items-center gap-1 bg-[#d40000]/5 px-2.5 py-0.5 rounded border border-[#d40000]/10 w-fit"
                    >
                      {isExpanded ? 'Ver menos' : 'Ver todo'}
                    </button>
                  )}
                </div>
                <div className="mt-4">
                  <span className={cn('inline-flex px-2 py-0.5 rounded text-[9px] font-bold border', getProgramBadgeCls(prog.progppto))}>
                    {getProgramType(prog.progppto)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
