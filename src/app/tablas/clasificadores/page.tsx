'use client';

import { useState, useEffect } from 'react';
import { BookMarked, Search, RefreshCw, AlertTriangle, Copy, Check, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Clasificador {
  codigo: string;
  nombre: string;
  tipo: string;
}

export default function ClasificadoresCatalogPage() {
  const [loading, setLoading] = useState(true);
  const [clasificadores, setClasificadores] = useState<Clasificador[]>([]);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tablas/clasificadores');
      const data = await res.json();
      if (data.success) {
        setClasificadores(data.clasificadores ?? []);
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

  const filtered = clasificadores.filter(c => {
    if (filterTipo && c.tipo !== filterTipo) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.codigo.includes(q) || c.nombre.toLowerCase().includes(q);
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, filterTipo]);

  const getTipoBadgeCls = (tipo: string) => {
    if (tipo === 'Ingreso') return 'bg-emerald-950/40 text-emerald-400 border-emerald-800/30';
    return 'bg-blue-950/40 text-blue-400 border-blue-800/30';
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#d40000] text-xs font-bold uppercase tracking-widest mb-1">
            <BookMarked className="h-4 w-4" /> Catálogos del Sistema
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">
            Clasificadores Presupuestales
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Listado oficial de partidas y clasificadores de ingresos y gastos públicos — 2026
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
          <SlidersHorizontal className="h-4 w-4 text-[#d40000]" /> Filtros
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tipo de Clasificador</label>
            <select 
              value={filterTipo} 
              onChange={e => setFilterTipo(e.target.value)}
              className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-300 focus:outline-none focus:border-[#d40000]/60 transition-all"
            >
              <option value="">Todos</option>
              <option value="Ingreso">Ingresos (1.x.x.x.x.x)</option>
              <option value="Gasto">Gastos (2.x.x.x.x.x)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <Search className="h-3 w-3" /> Buscar clasificador
            </label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Escriba código o nombre de clasificador..."
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#d40000]/60 transition-all" 
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#081020]/60 backdrop-blur-md shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/35 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-3.5 px-6 w-36">Código</th>
                <th className="py-3.5 px-4">Descripción / Nombre</th>
                <th className="py-3.5 px-4 w-32 text-center">Tipo</th>
                <th className="py-3.5 px-6 w-16 text-center">Copiar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-medium text-slate-300">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-24" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-3/4" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-16 mx-auto" /></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-6 mx-auto" /></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-slate-600" />
                      <span className="font-semibold">No se encontraron clasificadores presupuestales.</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.map(row => (
                <tr key={row.codigo} className="hover:bg-[#0c162b]/40 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-[#d40000] text-[12px]">{row.codigo}</td>
                  <td className="py-4 px-4 font-semibold text-slate-200">{row.nombre}</td>
                  <td className="py-4 px-4 text-center">
                    <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border', getTipoBadgeCls(row.tipo))}>
                      {row.tipo}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => handleCopy(row.codigo)}
                      className="p-1.5 rounded-lg bg-slate-800/30 hover:bg-slate-700/60 text-slate-400 hover:text-white transition-all inline-flex items-center justify-center"
                      title="Copiar código"
                    >
                      {copiedId === row.codigo ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/20 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-400 font-semibold">
              Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length} clasificadores
            </span>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0b1329]/40 hover:bg-slate-800/40 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </button>
              <span className="text-xs text-slate-400 font-semibold px-2">{page} / {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0b1329]/40 hover:bg-slate-800/40 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all"
              >
                Siguiente <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
