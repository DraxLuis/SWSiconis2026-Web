'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Save, 
  LogOut, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpRow {
  id: string; // compound e.g. "G-123"
  ano_eje: string;
  sec_ejec: string;
  expediente: string;
  ciclo: string;
  fase: string;
  sec_reg: string;
  mes_eje: string;
  monto: number;
  glosa: string;
  ruc: string;
  proveedor: string;
}

const MESES = [
  { val: '01', name: 'Enero' },
  { val: '02', name: 'Febrero' },
  { val: '03', name: 'Marzo' },
  { val: '04', name: 'Abril' },
  { val: '05', name: 'Mayo' },
  { val: '06', name: 'Junio' },
  { val: '07', name: 'Julio' },
  { val: '08', name: 'Agosto' },
  { val: '09', name: 'Setiembre' },
  { val: '10', name: 'Octubre' },
  { val: '11', name: 'Noviembre' },
  { val: '12', name: 'Diciembre' }
];

export default function ActualizarNombreProveedorGlosaPage() {
  const router = useRouter();

  // Table rows and pagination
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ExpRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [cicloFilter, setCicloFilter] = useState('');
  const [faseFilter, setFaseFilter] = useState('');
  const [mesFilter, setMesFilter] = useState('');

  // Selected row
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Editor states (for the selected row)
  const [glosaModificar, setGlosaModificar] = useState('');
  const [rucModificar, setRucModificar] = useState('');
  const [proveedorModificar, setProveedorModificar] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (cicloFilter) params.append('ciclo', cicloFilter);
      if (faseFilter) params.append('fase', faseFilter);
      if (mesFilter) params.append('mes', mesFilter);
      params.append('page', String(page));
      params.append('pageSize', String(PAGE_SIZE));

      const res = await fetch(`/api/presupuesto/actualizar?${params}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.rows ?? []);
        setTotal(data.total ?? 0);
      }
    } catch (e) {
      console.error('Error fetching expedientes:', e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, cicloFilter, faseFilter, mesFilter, page]);

  // Trigger fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset pagination on filter change
  useEffect(() => {
    setPage(1);
    setSelectedId(null);
  }, [searchQuery, cicloFilter, faseFilter, mesFilter]);

  // Get selected row data
  const selectedRow = rows.find(r => r.id === selectedId) || null;

  // Load selected row details into editor
  useEffect(() => {
    if (selectedRow) {
      setGlosaModificar(selectedRow.glosa);
      setRucModificar(selectedRow.ruc);
      setProveedorModificar(selectedRow.proveedor);
    } else {
      setGlosaModificar('');
      setRucModificar('');
      setProveedorModificar('');
    }
  }, [selectedId, selectedRow]);

  const handleLimpiarFiltros = () => {
    setSearchQuery('');
    setCicloFilter('');
    setFaseFilter('');
    setMesFilter('');
    setPage(1);
    setSelectedId(null);
  };

  const handleGrabar = async () => {
    if (!selectedRow) return;

    setSaving(true);
    try {
      const res = await fetch('/api/presupuesto/actualizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expediente: selectedRow.expediente,
          ciclo: selectedRow.ciclo,
          fase: selectedRow.fase,
          sec_reg: selectedRow.sec_reg,
          glosa: glosaModificar,
          ruc: rucModificar,
          proveedor: proveedorModificar
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Cambios grabados exitosamente.');
        // Update local state row
        setRows(prevRows =>
          prevRows.map(r =>
            r.id === selectedId
              ? { ...r, glosa: glosaModificar, ruc: rucModificar, proveedor: proveedorModificar }
              : r
          )
        );
      } else {
        alert('Error al grabar cambios: ' + data.error);
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat('es-PE', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v || 0);

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      
      {/* Page Title Dashboard Style */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-500" />
            ACTUALIZAR NOMBRE / PROVEEDOR / GLOSA
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Modifica la glosa, RUC y nombre del proveedor para cualquier secuencia y fase de un expediente.
          </p>
        </div>
        <div className="text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-900/60 rounded-lg px-3.5 py-1.5">
          301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA
        </div>
      </div>

      <div className="w-full rounded-xl border border-slate-700 bg-[#070e1b] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Filter Toolbar */}
        <div className="p-4 bg-[#0a1426] border-b border-slate-800 space-y-4 select-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
            
            {/* Buscador General */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Buscar (Expediente, Glosa, RUC, Proveedor)</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Escriba término para buscar..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-[#070e1b] border border-slate-700 rounded px-3 py-2 pl-9 text-slate-200 focus:outline-none focus:border-amber-500 font-mono text-xs w-full placeholder:text-slate-600"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
              </div>
            </div>

            {/* Selector de Ciclo */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ciclo</label>
              <select
                value={cicloFilter}
                onChange={e => setCicloFilter(e.target.value)}
                className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
              >
                <option value="">(Todos)</option>
                <option value="G">G - GASTOS</option>
                <option value="I">I - INGRESOS</option>
              </select>
            </div>

            {/* Selector de Fase */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fase</label>
              <select
                value={faseFilter}
                onChange={e => setFaseFilter(e.target.value)}
                className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
              >
                <option value="">(Todas)</option>
                <option value="C">C - COMPROMETIDO</option>
                <option value="D">D - DEVENGADO</option>
                <option value="G">G - GIRADO</option>
                <option value="P">P - PAGADO</option>
                <option value="R">R - RECAUDADO</option>
              </select>
            </div>

            {/* Selector de Mes */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mes de Ejecución</label>
              <select
                value={mesFilter}
                onChange={e => setMesFilter(e.target.value)}
                className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
              >
                <option value="">(Todos)</option>
                {MESES.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
              </select>
            </div>

          </div>

          {/* Action buttons inside toolbar */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-800/40">
            <button
              onClick={handleLimpiarFiltros}
              className="px-4 py-1.5 text-[10px] font-extrabold border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded transition-all"
            >
              Limpiar Filtros
            </button>
            <button
              onClick={fetchData}
              className="px-4 py-1.5 text-[10px] font-extrabold bg-[#d97706] hover:bg-[#b45309] text-white rounded transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
              RECARGAR
            </button>
          </div>
        </div>

        {/* Data Grid Table */}
        <div className="w-full overflow-x-auto bg-[#080f1d] min-h-[350px]">
          <table className="min-w-[1200px] w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 bg-[#0c182e] border-b border-slate-700 text-slate-400 text-[10px] uppercase font-black tracking-wider z-20 select-none">
              <tr>
                <th className="py-2.5 px-3 w-[60px] text-center">Año</th>
                <th className="py-2.5 px-3 w-[100px] text-center">Expediente</th>
                <th className="py-2.5 px-3 w-[60px] text-center">Ciclo</th>
                <th className="py-2.5 px-3 w-[60px] text-center">Fase</th>
                <th className="py-2.5 px-3 w-[80px] text-center">Sec. Reg</th>
                <th className="py-2.5 px-3 w-[60px] text-center">Mes</th>
                <th className="py-2.5 px-3 w-[110px] text-right">Monto</th>
                <th className="py-2.5 px-3 w-[130px] text-center">RUC</th>
                <th className="py-2.5 px-4 w-[250px]">Proveedor</th>
                <th className="py-2.5 px-4">Glosa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-semibold text-slate-300">
              {loading ? (
                Array.from({ length: 7 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={10} className="py-3 px-4"><div className="h-4 bg-slate-800 rounded w-full" /></td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center text-slate-500 font-bold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-slate-600" />
                      <span>No se encontraron expedientes en el período.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr 
                    key={r.id} 
                    onClick={() => setSelectedId(r.id === selectedId ? null : r.id)}
                    className={cn(
                      "hover:bg-[#112240] transition-colors font-mono text-[11px] cursor-pointer select-none",
                      selectedId === r.id && "bg-[#112240] border-l-2 border-amber-500"
                    )}
                  >
                    <td className="py-2 px-3 text-center text-slate-400">{r.ano_eje}</td>
                    <td className="py-2 px-3 text-center font-bold text-white">{r.expediente}</td>
                    <td className="py-2 px-3 text-center text-slate-350">{r.ciclo}</td>
                    <td className="py-2 px-3 text-center text-amber-500 font-bold">{r.fase}</td>
                    <td className="py-2 px-3 text-center">{r.sec_reg}</td>
                    <td className="py-2 px-3 text-center text-slate-400">{r.mes_eje}</td>
                    <td className="py-2 px-3 text-right font-bold text-[#f87171]">{fmt(r.monto)}</td>
                    <td className="py-2 px-3 text-center font-mono">{r.ruc || '—'}</td>
                    <td className="py-2 px-4 truncate" title={r.proveedor}>{r.proveedor || '—'}</td>
                    <td className="py-2 px-4 truncate font-sans text-xs" title={r.glosa}>{r.glosa || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary & Pagination */}
        <div className="bg-[#0c1938] border-t border-slate-700 px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/')}
              className="flex items-center gap-1.5 text-xs font-bold bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded px-4 py-1.5 transition-all"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              SICONIS 2026 · UTILERÍAS
            </div>
          </div>

          <div className="flex items-center gap-6">
            {!loading && total > PAGE_SIZE && (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1}
                  className="p-1.5 rounded border border-slate-700 bg-[#070e1b] text-slate-400 hover:text-white disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  {page} / {totalPages}
                </span>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                  disabled={page === totalPages}
                  className="p-1.5 rounded border border-slate-700 bg-[#070e1b] text-slate-400 hover:text-white disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
              <span>Registros: <span className="font-mono text-white font-extrabold">{total.toLocaleString('es-PE')}</span></span>
            </div>
          </div>
        </div>

      </div>

      {/* Detail / Editor Panel */}
      {selectedRow ? (
        <div className="w-full rounded-xl border border-amber-800 bg-[#070e1b] p-6 shadow-2xl space-y-6 animate-in slide-in-from-bottom duration-300">
          
          {/* Header summary of selected record */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 text-xs font-bold text-slate-300">
            <div className="flex items-center gap-2">
              <span className="bg-amber-600 text-[#070e1b] font-black px-2 py-0.5 rounded text-[10px]">SELECCIONADO</span>
              <span>Expediente: <span className="font-mono text-white text-sm">{selectedRow.expediente}</span></span>
              <span className="text-slate-500">|</span>
              <span>Ciclo: <span className="text-white font-mono">{selectedRow.ciclo === 'G' ? 'Gasto (G)' : 'Ingreso (I)'}</span></span>
              <span className="text-slate-500">|</span>
              <span>Fase: <span className="text-amber-400 font-mono">{selectedRow.fase}</span></span>
              <span className="text-slate-500">|</span>
              <span>Sec Reg: <span className="text-white font-mono">{selectedRow.sec_reg}</span></span>
            </div>
            <div className="text-slate-300 bg-slate-900 border border-slate-800 rounded px-3 py-1.5">
              Monto: <span className="font-mono text-[#f87171] font-extrabold text-sm">S/ {fmt(selectedRow.monto)}</span>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Glosa field */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Glosa a Modificar</label>
              <textarea 
                value={glosaModificar}
                onChange={e => setGlosaModificar(e.target.value)}
                className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-amber-500 font-mono min-h-[100px] placeholder:text-slate-600"
                placeholder="Escriba la nueva glosa para este registro..."
              />
            </div>

            {/* Provider and RUC fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">RUC a Modificar</label>
                <input 
                  type="text" 
                  maxLength={11}
                  value={rucModificar}
                  onChange={e => setRucModificar(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono placeholder:text-slate-600"
                  placeholder="Ingrese el nuevo RUC..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Nombre del Proveedor</label>
                <input 
                  type="text" 
                  value={proveedorModificar}
                  onChange={e => setProveedorModificar(e.target.value.toUpperCase())}
                  className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono placeholder:text-slate-600"
                  placeholder="Ingrese el nombre a modificar..."
                />
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => setSelectedId(null)}
              className="px-5 py-2 border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-350 rounded-lg text-xs font-bold transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleGrabar}
              disabled={saving}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-[#070e1b] rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/20"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Guardando...' : 'Grabar Cambios'}
            </button>
          </div>

        </div>
      ) : (
        <div className="w-full text-center py-10 text-slate-500 font-bold border-2 border-dashed border-slate-800 rounded-xl select-none">
          <div className="flex flex-col items-center justify-center gap-2">
            <AlertTriangle className="h-7 w-7 text-slate-600" />
            <span className="text-sm">Selecciona una fila de la grilla superior para editar sus valores.</span>
          </div>
        </div>
      )}

    </div>
  );
}
