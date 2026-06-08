'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Banknote, Search, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GiroRow {
  ano_eje: string; sec_ejec: string;
  cod_doc: string; num_doc: string; nombre: string;
  glosa: string;
}

function GirosContent() {
  const searchParams = useSearchParams();
  const initialPrograma = searchParams.get('programa') || '';
  const initialGlosa = searchParams.get('glosa') === '1';

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<GiroRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterPrograma, setFilterPrograma] = useState(initialPrograma);
  const [showGlosa, setShowGlosa] = useState(initialGlosa);
  const PAGE_SIZE = 50;

  // Sync with searchParams
  useEffect(() => {
    setFilterPrograma(searchParams.get('programa') || '');
    setShowGlosa(searchParams.get('glosa') === '1');
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterPrograma) params.append('programa', filterPrograma);
      params.append('page', String(page));
      params.append('pageSize', String(PAGE_SIZE));
      const res = await fetch(`/api/giros?${params}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.rows ?? []);
        setTotal(data.total ?? 0);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, page, filterPrograma]);

  useEffect(() => { setPage(1); }, [search, filterPrograma]);
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

      {/* Filters */}
      <div className="p-5 rounded-2xl border border-slate-800/70 bg-[#091122]/40 backdrop-blur-md shadow-lg space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <SlidersHorizontal className="h-4 w-4 text-[#d40000]" /> Filtros
          </div>
          {filterPrograma && (
            <span className="flex items-center gap-1.5 text-[10px] bg-[#d40000]/15 text-[#d40000] border border-[#d40000]/30 font-bold px-2.5 py-1 rounded-lg">
              Programa: {filterPrograma}
              <button onClick={() => setFilterPrograma('')} className="hover:text-white transition-colors font-black ml-1 text-xs">×</button>
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-6 relative">
            <input type="text" placeholder="Buscar por nombre, tipo, N° documento o glosa..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#d40000]/60 transition-all" />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-600" />
          </div>
          <div className="md:col-span-6 flex items-center gap-2.5">
            <label className="flex items-center gap-2 text-slate-300 text-xs font-semibold cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showGlosa} 
                onChange={e => setShowGlosa(e.target.checked)}
                className="w-4 h-4 rounded border-slate-800 bg-[#0b1428] text-[#d40000] focus:ring-0 cursor-pointer accent-[#d40000]"
              />
              Mostrar Glosa / Concepto del Giro
            </label>
          </div>
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
                <th className="py-3.5 px-4 w-24">Tipo Doc.</th>
                <th className="py-3.5 px-4 w-44">N° Documento</th>
                <th className="py-3.5 px-4 w-72">Descripción / Nombre</th>
                {showGlosa && <th className="py-3.5 px-4">Glosa / Concepto</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-medium text-slate-300">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[1, 2, 3, ...(showGlosa ? [4] : [])].map(j => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-3.5 bg-slate-800 rounded w-full"/>
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={showGlosa ? 4 : 3} className="py-16 text-center text-slate-500">
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
                  <td className="py-3.5 px-4 text-slate-300 font-semibold">{row.nombre || '—'}</td>
                  {showGlosa && (
                    <td className="py-3.5 px-4 text-slate-400 max-w-[500px] whitespace-normal break-words leading-relaxed">
                      {row.glosa || <span className="text-slate-600 italic">Sin glosa registrada</span>}
                    </td>
                  )}
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

export default function GirosPage() {
  return (
    <Suspense fallback={null}>
      <GirosContent />
    </Suspense>
  );
}
