'use client';

import { useState, useEffect } from 'react';
import { Target, Search, RefreshCw, AlertTriangle, Copy, Check, ChevronLeft, ChevronRight, MapPin, Layers, Layout, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Meta {
  sec_func: string;
  meta: string;
  nombre: string;
  unidmed: string;
  cantidad: number;

  // Geográficos
  departamento_cod: string;
  departamento_nombre: string;
  provincia_cod: string;
  provincia_nombre: string;
  distrito_cod: string;
  distrito_nombre: string;

  // Finalidad
  finalidad_cod: string;
  finalidad_nombre: string;

  // Estructura funcional
  programa_cod: string;
  programa_nombre: string;
  producto_cod: string;
  producto_nombre: string;
  actividad_cod: string;
  actividad_nombre: string;
  funcion_cod: string;
  funcion_nombre: string;
  division_cod: string;
  division_nombre: string;
  grupo_cod: string;
  grupo_nombre: string;
}

export default function MetasCatalogPage() {
  const [loading, setLoading] = useState(true);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [search, setSearch] = useState('');
  const [selectedMeta, setSelectedMeta] = useState<Meta | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 14;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tablas/metas');
      const data = await res.json();
      if (data.success) {
        const rows = data.metas ?? [];
        setMetas(rows);
        if (rows.length > 0) {
          setSelectedMeta(rows[0]);
        }
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
        m.producto_cod.includes(q)
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
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[#d40000] text-xs font-bold uppercase tracking-widest mb-1">
            <Target className="h-4 w-4" /> Catálogos del Sistema
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">
            Descripción de Metas — 2026
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Consulta interactiva de metas presupuestales, finalidades, y estructura programática (Migración SIAF/FoxPro)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-800 bg-[#0b1329]/40 hover:bg-slate-800/40 text-slate-300 hover:text-white transition-all shadow-md"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Meta List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl border border-slate-800/70 bg-[#091122]/40 backdrop-blur-md shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-[#d40000] tracking-wider flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5" /> Búsqueda Rápida
              </label>
              <span className="text-[10px] text-slate-500 font-bold font-mono">Total: {filtered.length}</span>
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar por SecFunc, Finalidad, Nombre..."
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl pl-9 pr-3.5 py-2 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#d40000]/60 transition-all" 
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-600" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-[#081020]/60 backdrop-blur-md shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/35 text-slate-400 text-[10px] uppercase font-black tracking-wider">
                    <th className="py-3 px-4 w-20">SecFunc</th>
                    <th className="py-3 px-3 w-16">Meta</th>
                    <th className="py-3 px-4">Finalidad</th>
                    <th className="py-3 px-3 text-center">Ubic.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs font-semibold text-slate-300">
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3 px-4"><div className="h-4 bg-slate-800 rounded w-10" /></td>
                        <td className="py-3 px-3"><div className="h-4 bg-slate-800 rounded w-8" /></td>
                        <td className="py-3 px-4"><div className="h-4 bg-slate-800 rounded w-20" /></td>
                        <td className="py-3 px-3"><div className="h-4 bg-slate-800 rounded w-12 mx-auto" /></td>
                      </tr>
                    ))
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-16 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <AlertTriangle className="h-7 w-7 text-slate-600" />
                          <span className="font-semibold text-xs">No se encontraron metas.</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginated.map(row => (
                    <tr 
                      key={row.sec_func} 
                      onClick={() => setSelectedMeta(row)}
                      className={cn(
                        'hover:bg-[#0c162b]/40 cursor-pointer transition-all duration-200 border-l-2',
                        selectedMeta?.sec_func === row.sec_func 
                          ? 'bg-[#0f1d3a]/70 border-l-[#d40000] text-white' 
                          : 'border-l-transparent text-slate-400 hover:text-slate-200'
                      )}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[12px]">{row.sec_func}</td>
                      <td className="py-3.5 px-3 font-mono">{row.meta}</td>
                      <td className="py-3.5 px-4 truncate max-w-[150px]" title={row.finalidad_nombre}>
                        {row.finalidad_cod} - {row.finalidad_nombre}
                      </td>
                      <td className="py-3.5 px-3 text-center text-[10px] text-slate-500 font-mono">
                        {row.departamento_cod}/{row.provincia_cod}/{row.distrito_cod}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {!loading && filtered.length > PAGE_SIZE && (
              <div className="px-4 py-3 border-t border-slate-800/80 bg-slate-900/20 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500 font-bold">
                  {page} / {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))} 
                    disabled={page === 1}
                    className="p-1 rounded bg-[#0b1329]/40 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                    disabled={page === totalPages}
                    className="p-1 rounded bg-[#0b1329]/40 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed View Form (Reflecting FoxPro window layout) */}
        <div className="lg:col-span-7">
          {selectedMeta ? (
            <div className="rounded-2xl border border-slate-800 bg-[#060e1d]/90 backdrop-blur-md shadow-2xl p-6 space-y-6 animate-in fade-in duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#d40000]/5 rounded-full blur-[80px] -z-10 pointer-events-none" />
              
              {/* Card Title */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h2 className="text-sm font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
                  <Layout className="h-4 w-4 text-[#d40000]" /> Detalle Ficha de Meta Presupuestal
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-[#d40000]/15 text-[#d40000] border border-[#d40000]/30 font-mono font-bold px-2 py-0.5 rounded">
                    SecFunc: {selectedMeta.sec_func}
                  </span>
                  <button
                    onClick={() => handleCopy(selectedMeta.sec_func)}
                    className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                    title="Copiar SecFunc"
                  >
                    {copiedId === selectedMeta.sec_func ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Form Body */}
              <div className="space-y-5">
                {/* 1. Descripción Meta */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <span>Descripción de la Meta</span>
                    <span className="font-mono text-slate-600">Max. 250 caracteres</span>
                  </div>
                  <div className="w-full text-xs font-semibold bg-[#030812] border border-slate-800/80 rounded-xl px-4 py-3 text-slate-200 leading-relaxed min-h-[56px] shadow-inner">
                    {selectedMeta.nombre}
                  </div>
                </div>

                {/* 2. Finalidad y Geográficos */}
                <div className="p-4 rounded-xl border border-slate-800/60 bg-[#091122]/30 space-y-3.5 shadow-md">
                  {/* Finalidad */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <label className="sm:col-span-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-[#d40000]" /> Finalidad
                    </label>
                    <div className="sm:col-span-9 flex gap-2">
                      <div className="w-20 font-mono text-xs font-bold bg-[#030812] border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-[#d40000] text-center select-none shrink-0 self-start">
                        {selectedMeta.finalidad_cod.slice(0, 5)}
                      </div>
                      <div className="flex-1 text-xs font-semibold bg-[#030812] border border-slate-800/80 rounded-lg px-3 py-2 text-slate-200 whitespace-normal break-words leading-relaxed">
                        {selectedMeta.finalidad_nombre}
                      </div>
                    </div>
                  </div>

                  {/* Departamento */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <label className="sm:col-span-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" /> Departamento
                    </label>
                    <div className="sm:col-span-9 flex gap-2">
                      <div className="w-20 font-mono text-xs font-bold bg-[#030812] border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-slate-400 text-center">
                        {selectedMeta.departamento_cod}
                      </div>
                      <div className="flex-1 text-xs font-semibold bg-[#030812] border border-slate-800/80 rounded-lg px-3 py-1.5 text-slate-300">
                        {selectedMeta.departamento_nombre}
                      </div>
                    </div>
                  </div>

                  {/* Provincia */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <label className="sm:col-span-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" /> Provincia
                    </label>
                    <div className="sm:col-span-9 flex gap-2">
                      <div className="w-20 font-mono text-xs font-bold bg-[#030812] border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-slate-400 text-center">
                        {selectedMeta.provincia_cod}
                      </div>
                      <div className="flex-1 text-xs font-semibold bg-[#030812] border border-slate-800/80 rounded-lg px-3 py-1.5 text-slate-300">
                        {selectedMeta.provincia_nombre}
                      </div>
                    </div>
                  </div>

                  {/* Distrito */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <label className="sm:col-span-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" /> Distrito
                    </label>
                    <div className="sm:col-span-9 flex gap-2">
                      <div className="w-20 font-mono text-xs font-bold bg-[#030812] border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-slate-400 text-center">
                        {selectedMeta.distrito_cod}
                      </div>
                      <div className="flex-1 text-xs font-semibold bg-[#030812] border border-slate-800/80 rounded-lg px-3 py-1.5 text-slate-300">
                        {selectedMeta.distrito_nombre}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Estructura Programática Grid (Legacy table clone) */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-[#d40000]" /> Estructura Funcional Programática (SIAF)
                  </span>
                  
                  <div className="rounded-xl border border-slate-800 overflow-hidden bg-[#030812] shadow-md">
                    <table className="w-full text-center border-collapse text-[11px] font-semibold text-slate-300">
                      <thead>
                        <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-800 font-bold">
                          <th className="py-2 px-2 border-r border-slate-800">Prg.</th>
                          <th className="py-2 px-2 border-r border-slate-800">Prod/Proy</th>
                          <th className="py-2 px-2 border-r border-slate-800">Act/Al/Obr</th>
                          <th className="py-2 px-2 border-r border-slate-800">Fn.</th>
                          <th className="py-2 px-2 border-r border-slate-800">Prg. (Div)</th>
                          <th className="py-2 px-2">GrpF.</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="font-mono">
                          <td className="py-2.5 px-2 border-r border-slate-800 text-white font-bold">{selectedMeta.programa_cod}</td>
                          <td className="py-2.5 px-2 border-r border-slate-800 text-slate-300">{selectedMeta.producto_cod}</td>
                          <td className="py-2.5 px-2 border-r border-slate-800 text-slate-300">{selectedMeta.actividad_cod}</td>
                          <td className="py-2.5 px-2 border-r border-slate-800 text-white font-bold">{selectedMeta.funcion_cod}</td>
                          <td className="py-2.5 px-2 border-r border-slate-800 text-slate-300">{selectedMeta.division_cod}</td>
                          <td className="py-2.5 px-2 text-[#d40000] font-bold">{selectedMeta.grupo_cod}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Estructura Programática Descripciones */}
                <div className="p-4 rounded-xl border border-slate-800/60 bg-[#091122]/30 space-y-3 shadow-md">
                  {/* Programa */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <label className="sm:col-span-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Programa</label>
                    <div className="sm:col-span-9 flex gap-2">
                      <div className="w-20 font-mono text-xs font-bold bg-[#030812] border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-slate-400 text-center select-none shrink-0 self-start">
                        {selectedMeta.programa_cod}
                      </div>
                      <div className="flex-1 text-xs font-semibold bg-[#030812] border border-slate-800/80 rounded-lg px-3 py-2 text-slate-300 whitespace-normal break-words leading-relaxed">
                        {selectedMeta.programa_nombre}
                      </div>
                    </div>
                  </div>

                  {/* Producto / Proyecto */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <label className="sm:col-span-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Prod./Proy.</label>
                    <div className="sm:col-span-9 flex gap-2">
                      <div className="w-20 font-mono text-xs font-bold bg-[#030812] border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-slate-400 text-center select-none shrink-0 self-start">
                        {selectedMeta.producto_cod}
                      </div>
                      <div className="flex-1 text-xs font-semibold bg-[#030812] border border-slate-800/80 rounded-lg px-3 py-2 text-slate-300 whitespace-normal break-words leading-relaxed">
                        {selectedMeta.producto_nombre || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Actividad / Obra */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <label className="sm:col-span-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Act./Al./Obra</label>
                    <div className="sm:col-span-9 flex gap-2">
                      <div className="w-20 font-mono text-xs font-bold bg-[#030812] border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-slate-400 text-center select-none shrink-0 self-start">
                        {selectedMeta.actividad_cod}
                      </div>
                      <div className="flex-1 text-xs font-semibold bg-[#030812] border border-slate-800/80 rounded-lg px-3 py-2 text-slate-300 whitespace-normal break-words leading-relaxed">
                        {selectedMeta.actividad_nombre}
                      </div>
                    </div>
                  </div>

                  {/* Función */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <label className="sm:col-span-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Función</label>
                    <div className="sm:col-span-9 flex gap-2">
                      <div className="w-20 font-mono text-xs font-bold bg-[#030812] border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-slate-400 text-center select-none shrink-0 self-start">
                        {selectedMeta.funcion_cod}
                      </div>
                      <div className="flex-1 text-xs font-semibold bg-[#030812] border border-slate-800/80 rounded-lg px-3 py-2 text-slate-300 whitespace-normal break-words leading-relaxed">
                        {selectedMeta.funcion_nombre}
                      </div>
                    </div>
                  </div>

                  {/* Programa (División Funcional) */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <label className="sm:col-span-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Programa (Div)</label>
                    <div className="sm:col-span-9 flex gap-2">
                      <div className="w-20 font-mono text-xs font-bold bg-[#030812] border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-slate-400 text-center select-none shrink-0 self-start">
                        {selectedMeta.division_cod}
                      </div>
                      <div className="flex-1 text-xs font-semibold bg-[#030812] border border-slate-800/80 rounded-lg px-3 py-2 text-slate-300 whitespace-normal break-words leading-relaxed">
                        {selectedMeta.division_nombre}
                      </div>
                    </div>
                  </div>

                  {/* Grupo Funcional */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <label className="sm:col-span-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Grupo Func.</label>
                    <div className="sm:col-span-9 flex gap-2">
                      <div className="w-20 font-mono text-xs font-bold bg-[#030812] border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-slate-400 text-center select-none shrink-0 self-start">
                        {selectedMeta.grupo_cod}
                      </div>
                      <div className="flex-1 text-xs font-semibold bg-[#030812] border border-slate-800/80 rounded-lg px-3 py-2 text-slate-300 whitespace-normal break-words leading-relaxed">
                        {selectedMeta.grupo_nombre}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Metas Físicas (UnidMed y Cantidad) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-800/60 bg-[#091122]/30 text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Unidad de Medida</span>
                    <p className="text-xs font-extrabold text-white uppercase">{selectedMeta.unidmed || '—'}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-800/60 bg-[#091122]/30 text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cantidad Programada</span>
                    <p className="text-base font-black text-[#d40000] font-mono">
                      {selectedMeta.cantidad > 0 ? selectedMeta.cantidad.toLocaleString('es-PE') : '0'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800/60 bg-[#081020]/20 py-32 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <Target className="h-10 w-10 text-slate-700 animate-pulse" />
              <span className="font-semibold text-sm">Selecciona una meta en el panel izquierdo para ver su detalle</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
