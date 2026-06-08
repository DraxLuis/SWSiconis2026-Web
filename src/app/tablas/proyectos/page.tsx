'use client';

import { useState, useEffect } from 'react';
import { FolderKanban, Search, RefreshCw, AlertTriangle, Copy, Check, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Proyecto {
  codigo: string;
  nombre: string;
  tipo: string;
}

export default function ProyectosCatalogPage() {
  const [loading, setLoading] = useState(true);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('Producto');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tablas/proyectos');
      const data = await res.json();
      if (data.success) {
        setProyectos(data.proyectos ?? []);
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

  const filtered = proyectos.filter(p => {
    if (filterTipo && p.tipo !== filterTipo) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.codigo.includes(q) || p.nombre.toLowerCase().includes(q);
    }
    return true;
  });

  const getTipoBadgeCls = (tipo: string) => {
    if (tipo === 'Proyecto') return 'bg-purple-900/40 text-purple-300 border-purple-800/30';
    return 'bg-blue-900/40 text-blue-300 border-blue-800/30';
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#d40000] text-xs font-bold uppercase tracking-widest mb-1">
            <FolderKanban className="h-4 w-4" /> Catálogos del Sistema
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">
            Productos y Proyectos
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Códigos de productos y proyectos de inversión pública — 2026
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

      {/* Filters */}
      <div className="p-5 rounded-2xl border border-slate-800/70 bg-[#091122]/40 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
          <SlidersHorizontal className="h-4 w-4 text-[#d40000]" /> Filtros y Búsqueda
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Ver Tipo</label>
            <div className="flex bg-[#0b1428] border border-slate-800/80 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setFilterTipo('Producto')}
                className={cn(
                  "flex-1 text-xs py-2.5 px-3 rounded-lg font-bold transition-all text-center",
                  filterTipo === 'Producto' 
                    ? "bg-[#d40000] text-white shadow-md shadow-[#d40000]/10" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
                )}
              >
                Productos
              </button>
              <button
                type="button"
                onClick={() => setFilterTipo('Proyecto')}
                className={cn(
                  "flex-1 text-xs py-2.5 px-3 rounded-lg font-bold transition-all text-center",
                  filterTipo === 'Proyecto' 
                    ? "bg-[#d40000] text-white shadow-md shadow-[#d40000]/10" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
                )}
              >
                Proyectos
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <Search className="h-3 w-3" /> Buscar
            </label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Nombre o código..."
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#d40000]/60 transition-all" 
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
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
              <span className="font-semibold text-sm">No se encontraron actividades o proyectos.</span>
            </div>
          </div>
        ) : (
          filtered.map(proj => {
            const isExpanded = !!expandedIds[proj.codigo];
            const isLong = proj.nombre.length > 55;
            return (
              <div 
                key={proj.codigo}
                className="group relative p-5 rounded-2xl border border-slate-800/80 bg-[#081020]/60 hover:bg-[#0c162b]/80 backdrop-blur-md transition-all duration-300 hover:border-[#d40000]/40 hover:shadow-[0_0_20px_rgba(212,0,0,0.05)] flex flex-col justify-between min-h-[10rem] h-auto"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-black text-[#d40000] bg-[#d40000]/10 px-2.5 py-1 rounded-lg">
                      {proj.codigo}
                    </span>
                    <button
                      onClick={() => handleCopy(proj.codigo)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-white transition-all"
                      title="Copiar código"
                    >
                      {copiedId === proj.codigo ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <h3 className={cn(
                    "font-bold text-white text-[13px] group-hover:text-[#d40000] transition-colors leading-snug mt-3.5",
                    isExpanded ? "" : "line-clamp-2"
                  )} title={proj.nombre}>
                    {proj.nombre}
                  </h3>
                  {isLong && (
                    <button
                      onClick={() => toggleExpand(proj.codigo)}
                      className="text-[#d40000] hover:text-[#ff3b3b] text-[10px] font-extrabold mt-1.5 transition-colors focus:outline-none flex items-center gap-1 bg-[#d40000]/5 px-2.5 py-0.5 rounded border border-[#d40000]/10 w-fit"
                    >
                      {isExpanded ? 'Ver menos' : 'Ver todo'}
                    </button>
                  )}
                </div>
                <div className="mt-4">
                  <span className={cn('inline-flex px-2 py-0.5 rounded text-[9px] font-bold border', getTipoBadgeCls(proj.tipo))}>
                    {proj.tipo}
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
