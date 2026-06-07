'use client';

import { useState, useEffect, useCallback } from 'react';
import { Banknote, Search, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GiroRow {
  ano_eje: string; sec_ejec: string;
  cod_doc: string; num_doc: string; nombre: string;
}

export default function GirosPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<GiroRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('page', String(page));
      params.append('pageSize', String(PAGE_SIZE));
      const res = await fetch(`/api/giros?${params}`);
      const data = await res.json();
      if (data.success) { setRows(data.rows ?? []); setTotal(data.total ?? 0); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div className="space-y-7 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#d40000] text-xs font-bold uppercase tracking-widest mb-1">
            <Banknote className="h-4 w-4" /> Módulo de Pagos
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">Comprobantes de Giro 2026</h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Documentos de giro registrados en el sistema SIAF
          </p>
        </div>
        <button onClick={fetchData}
          className="p-2.5 rounded-lg border border-slate-800 bg-[#0b1329]/40 hover:bg-slate-800/40 text-slate-300 hover:text-white transition-all self-start md:self-auto">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Search */}
      <div className="p-5 rounded-2xl border border-slate-800/70 bg-[#091122]/40 backdrop-blur-md shadow-lg">
        <div className="relative max-w-md">
          <input type="text" placeholder="Buscar por nombre, tipo o N° documento..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#d40000]/60 transition-all" />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-600" />
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs font-semibold">
        <span className="px-3 py-1.5 rounded-lg bg-slate-900/40 border border-slate-800 text-slate-400">
          {total.toLocaleString('es-PE')} documentos
        </span>
      </div>

      <div className="rounded-2xl border border-slate-800/80 bg-[#081020]/60 backdrop-blur-md shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/35 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-3.5 px-4">Tipo Doc.</th>
                <th className="py-3.5 px-4">N° Documento</th>
                <th className="py-3.5 px-4">Descripción / Nombre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-medium text-slate-300">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[1,2,3].map(j => <td key={j} className="py-4 px-4"><div className="h-3.5 bg-slate-800 rounded w-full"/></td>)}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-slate-600" />
                      <span className="font-semibold">No se encontraron documentos.</span>
                    </div>
                  </td>
                </tr>
              ) : rows.map((row, i) => (
                <tr key={i} className="hover:bg-[#0c162b]/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-400 text-[11px]">{row.cod_doc}</td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-white">{row.num_doc}</td>
                  <td className="py-3.5 px-4 text-slate-300">{row.nombre || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && total > PAGE_SIZE && (
          <div className="px-5 py-4 border-t border-slate-800/80 bg-slate-900/20 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Página {page} de {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0b1329]/40 hover:bg-slate-800/40 text-slate-400 hover:text-white disabled:opacity-30 text-xs font-bold transition-all">
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0b1329]/40 hover:bg-slate-800/40 text-slate-400 hover:text-white disabled:opacity-30 text-xs font-bold transition-all">
                Siguiente <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
