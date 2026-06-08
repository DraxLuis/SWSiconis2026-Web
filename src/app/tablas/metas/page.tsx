'use client';

import { useState, useEffect } from 'react';
import { Target, Search, RefreshCw, AlertTriangle, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Meta {
  sec_func: string;
  programa: string;
  act_proy: string;
  componente: string;
  funcion: string;
  subprograma: string;
  meta: string;
  finalidad: string;
  nombre: string;
  finalidad_nombre: string;
  unidmed: string;
  cantidad: number;
}

export default function MetasCatalogPage() {
  const [loading, setLoading] = useState(true);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tablas/metas');
      const data = await res.json();
      if (data.success) {
        setMetas(data.metas ?? []);
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

  const filtered = metas.filter(m => {
    if (search) {
      const q = search.toLowerCase();
      return (
        m.sec_func.includes(q) || 
        m.nombre.toLowerCase().includes(q) || 
        m.finalidad_nombre.toLowerCase().includes(q) ||
        m.act_proy.includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div className="space-y-7 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#d40000] text-xs font-bold uppercase tracking-widest mb-1">
            <Target className="h-4 w-4" /> Catálogos del Sistema
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">
            Metas Presupuestales
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Secciones funcionales (Metas), finalidades, programas, actividades/proyectos y metas físicas registradas para 2026
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
      <div className="p-5 rounded-2xl border border-slate-800/70 bg-[#091122]/40 backdrop-blur-md shadow-lg max-w-xl">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
            <Search className="h-3 w-3 text-[#d40000]" /> Buscar Meta
          </label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Buscar por código de meta, finalidad, proyecto o nombre..."
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#d40000]/60 transition-all" 
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-600" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#081020]/60 backdrop-blur-md shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/35 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-3.5 px-5 w-24">Meta (Sec)</th>
                <th className="py-3.5 px-4 w-44">Estructura Funcional</th>
                <th className="py-3.5 px-4">Descripción de la Meta / Finalidad</th>
                <th className="py-3.5 px-4 w-48 text-right">Meta Física (Cant / Unid)</th>
                <th className="py-3.5 px-5 w-16 text-center">Copiar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-medium text-slate-300">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-5"><div className="h-4 bg-slate-800 rounded w-12" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-32" /></td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-800 rounded w-3/4 mb-1.5" />
                      <div className="h-3.5 bg-slate-800 rounded w-1/2" />
                    </td>
                    <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-800 rounded w-20 ml-auto" /></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-800 rounded w-6 mx-auto" /></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-slate-600" />
                      <span className="font-semibold">No se encontraron metas presupuestales.</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.map(row => (
                <tr key={row.sec_func} className="hover:bg-[#0c162b]/40 transition-colors">
                  <td className="py-4 px-5 font-mono font-bold text-[#d40000] text-[12px]">{row.sec_func}</td>
                  <td className="py-4 px-4">
                    <div className="space-y-0.5 text-[10px] text-slate-400 font-semibold font-mono">
                      <div><span className="text-slate-500">Prog:</span> {row.programa}</div>
                      <div><span className="text-slate-500">Act/Proy:</span> {row.act_proy}</div>
                      {row.componente && <div><span className="text-slate-500">Comp:</span> {row.componente}</div>}
                      <div><span className="text-slate-500">Func:</span> {row.funcion}-{row.subprograma}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-bold text-slate-200 leading-snug">{row.nombre}</p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1 flex items-center gap-1.5">
                      <span className="text-[#d40000] font-bold">Finalidad:</span> {row.finalidad} - {row.finalidad_nombre}
                    </p>
                  </td>
                  <td className="py-4 px-4 text-right font-mono">
                    <span className="text-white font-extrabold text-sm">
                      {row.cantidad > 0 ? row.cantidad.toLocaleString('es-PE') : '0'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold ml-1.5 uppercase font-sans">
                      {row.unidmed}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-center">
                    <button
                      onClick={() => handleCopy(row.sec_func)}
                      className="p-1.5 rounded-lg bg-slate-800/30 hover:bg-slate-700/60 text-slate-400 hover:text-white transition-all inline-flex items-center justify-center"
                      title="Copiar SecFunc"
                    >
                      {copiedId === row.sec_func ? (
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
          <div className="px-5 py-4 border-t border-slate-800/80 bg-slate-900/20 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-400 font-semibold">
              Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length} metas
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
