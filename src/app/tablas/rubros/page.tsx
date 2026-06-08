'use client';

import { useState, useEffect } from 'react';
import { Layers, Search, RefreshCw, AlertTriangle, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Rubro {
  fuente_fin: string;
  nombre: string;
}

export default function RubrosCatalogPage() {
  const [loading, setLoading] = useState(true);
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tablas/rubros');
      const data = await res.json();
      if (data.success) {
        setRubros(data.rubros ?? []);
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

  const filtered = rubros.filter(r => 
    r.fuente_fin.includes(search) || 
    r.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-7 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#d40000] text-xs font-bold uppercase tracking-widest mb-1">
            <Layers className="h-4 w-4" /> Catálogos del Sistema
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">
            Rubros de Financiamiento
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Fuentes de financiamiento y rubros presupuestales autorizados para el año fiscal 2026
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
            <Search className="h-3 w-3 text-[#d40000]" /> Buscar Rubro
          </label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Escriba código o nombre de rubro..."
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#d40000]/60 transition-all" 
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-600" />
          </div>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border border-slate-800 bg-[#081020]/40 animate-pulse h-32 flex flex-col justify-between">
              <div className="h-4 bg-slate-800 rounded w-12" />
              <div className="h-4 bg-slate-800 rounded w-3/4" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 rounded-2xl border border-slate-800/60 bg-[#081020]/20">
            <div className="flex flex-col items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-slate-600" />
              <span className="font-semibold text-sm">No se encontraron rubros de financiamiento.</span>
            </div>
          </div>
        ) : (
          filtered.map(rubro => (
            <div 
              key={rubro.fuente_fin}
              className="group relative p-5 rounded-2xl border border-slate-800/80 bg-[#081020]/60 hover:bg-[#0c162b]/80 backdrop-blur-md transition-all duration-300 hover:border-[#d40000]/40 hover:shadow-[0_0_20px_rgba(212,0,0,0.05)] flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                <span className="font-mono text-sm font-black text-[#d40000] bg-[#d40000]/10 px-2.5 py-1 rounded-lg">
                  {rubro.fuente_fin}
                </span>
                <button
                  onClick={() => handleCopy(rubro.fuente_fin)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-white transition-all"
                  title="Copiar código"
                >
                  {copiedId === rubro.fuente_fin ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <div className="mt-4">
                <h3 className="font-bold text-white text-sm group-hover:text-[#d40000] transition-colors leading-snug">
                  {rubro.nombre}
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1.5">
                  Rubro Presupuestal
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
