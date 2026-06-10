'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  LogOut,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface ExpRow {
  id: number;
  ano_eje: string;
  expediente: string;
  mes_eje: string;
  tipo_op: string;
  ciclo: string;
  fase: string;
  sec_reg: string;
  corr: string;
  rb: string;
  tr: string;
  tipo_finan: string;
  cod_doc: string;
  num_doc: string;
  fecha_doc: string;
  clasificad: string;
  clasif_nombre: string;
  sec_func: string;
  meta_nombre: string;
  proveedor_ruc: string;
  proveedor_nombre: string;
  glosa: string;
  moneda: string;
  monto: number;
  estado: string;
  certif: string;
}

interface MetaOption {
  sec_func: string;
  nombre: string;
}

interface RubroOption {
  fuente_fin: string;
  nombre: string;
}

interface ClasifOption {
  codigo: string;
  nombre: string;
  tipo: string;
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

export default function ExpedientesIngresosPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ExpRow[]>([]);
  const [total, setTotal] = useState(0);

  // Filters from FoxPro Screen
  const [fase, setFase] = useState('I'); // I = Ingreso default
  const [mesDesde, setMesDesde] = useState('01');
  const [mesHasta, setMesHasta] = useState('06');
  const [searchClasificador, setSearchClasificador] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [incluirGenerica, setIncluirGenerica] = useState(true);
  const [incluirSaldosBalance, setIncluirSaldosBalance] = useState(true);
  const [verFiltro, setVerFiltro] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  // Filtro panel states
  const [filterFteFinanc, setFilterFteFinanc] = useState('');
  const [filterTipOp, setFilterTipOp] = useState('');
  const [filterMeta, setFilterMeta] = useState('');
  const [filterGenerica, setFilterGenerica] = useState('');
  const [filterClasificador, setFilterClasificador] = useState('');

  // Dropdown options loaded from catalog APIs
  const [metaOptions, setMetaOptions] = useState<MetaOption[]>([]);
  const [rubroOptions, setRubroOptions] = useState<RubroOption[]>([]);
  const [clasifOptions, setClasifOptions] = useState<ClasifOption[]>([]);

  // Load lookup options once
  useEffect(() => {
    async function loadOptions() {
      try {
        const metaRes = await fetch('/api/tablas/metas');
        const metaData = await metaRes.json();
        if (metaData.success) setMetaOptions(metaData.metas || []);

        const rubroRes = await fetch('/api/tablas/rubros');
        const rubroData = await rubroRes.json();
        if (rubroData.success) setRubroOptions(rubroData.rubros || []);

        const clasifRes = await fetch('/api/tablas/clasificadores');
        const clasifData = await clasifRes.json();
        if (clasifData.success) setClasifOptions(clasifData.clasificadores || []);
      } catch (e) {
        console.error('Failed to load lookup catalogs', e);
      }
    }
    loadOptions();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('fase', fase);
      params.append('mes_desde', mesDesde);
      params.append('mes_hasta', mesHasta);
      if (searchClasificador) params.append('clasificador', searchClasificador);
      if (searchQuery) params.append('q', searchQuery);
      params.append('incluirGenerica', String(incluirGenerica));
      params.append('incluirSaldosBalance', String(incluirSaldosBalance));
      params.append('page', String(page));
      params.append('pageSize', String(PAGE_SIZE));

      // Advanced filters
      if (filterFteFinanc) params.append('fte_financ', filterFteFinanc);
      if (filterTipOp) params.append('tip_op', filterTipOp);
      if (filterMeta) params.append('meta', filterMeta);
      if (filterGenerica) params.append('generica', filterGenerica);
      if (filterClasificador) params.append('clasificador', filterClasificador);

      const res = await fetch(`/api/expedientes/ingresos?${params}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.rows ?? []);
        setTotal(data.total ?? 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [fase, mesDesde, mesHasta, searchClasificador, searchQuery, incluirGenerica, incluirSaldosBalance, page, filterFteFinanc, filterTipOp, filterMeta, filterGenerica, filterClasificador]);

  // Reset pagination on filter change
  useEffect(() => {
    setPage(1);
  }, [fase, mesDesde, mesHasta, searchClasificador, searchQuery, incluirGenerica, incluirSaldosBalance, filterFteFinanc, filterTipOp, filterMeta, filterGenerica, filterClasificador]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLimpiarFiltro = () => {
    setFilterFteFinanc('');
    setFilterTipOp('');
    setFilterMeta('');
    setFilterGenerica('');
    setFilterClasificador('');
    setPage(1);
  };

  const handleAplicarFiltro = () => {
    setPage(1);
    fetchData();
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat('es-PE', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v || 0);

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const totalMonto = rows.reduce((s, r) => s + r.monto, 0);

  const exportExcel = () => {
    const data = rows.map(r => ({
      'Año': r.ano_eje,
      'Expediente': r.expediente,
      'Mes_eje': r.mes_eje,
      'TO': r.tipo_op,
      'Meta': `${r.sec_func} - ${r.meta_nombre}`,
      'FF': r.rb,
      'TR': r.tr,
      'TipF': r.tipo_finan,
      'Clasificador': `${r.clasificad} - ${r.clasif_nombre}`,
      'Cod_Doc': r.cod_doc,
      'Num_doc': r.num_doc,
      'Fecha_doc': r.fecha_doc,
      'Fase': r.fase,
      'Monto': r.monto,
      'Glosa': r.glosa
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expedientes Ingresos');
    XLSX.writeFile(wb, `SWSiconis_Expedientes_Ingresos_2026.xlsx`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setLoading(true);
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);

        const response = await fetch('/api/expedientes/ingresos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: json })
        });
        const resData = await response.json();
        if (resData.success) {
          alert(`Importación exitosa. Se insertaron ${resData.count} registros.`);
          fetchData();
        } else {
          alert('Error al importar: ' + resData.error);
        }
      } catch (err) {
        console.error(err);
        alert('Error al procesar el archivo.');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".csv,.xlsx,.xls" 
        className="hidden" 
      />

      <div className="w-full rounded-xl border border-slate-700 bg-[#070e1b] shadow-2xl overflow-hidden flex flex-col">
        
        {/* VFP Window Header Banner */}
        <div className="bg-[#0c1938] border-b border-slate-700 px-4 py-2 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
              Consulta de Expedientes de Ingresos
            </span>
          </div>
          <div className="text-xs font-bold text-[#60a5fa] bg-blue-950/40 border border-blue-900/60 rounded px-2.5 py-0.5">
            301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA
          </div>
        </div>        {/* Top Control Bar */}
        <div className="p-4 bg-[#0a1426] border-b border-slate-800 space-y-4 select-none">
          {/* Row 1: Configurations & Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-5">
              {/* Selector de Fase */}
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <span>Consulta de expedientes - Fase:</span>
                <select
                  value={fase}
                  onChange={e => setFase(e.target.value)}
                  className="bg-[#070e1b] border border-slate-700 rounded px-3 py-1 text-blue-400 font-mono text-[11px] focus:outline-none focus:border-blue-500 font-bold"
                >
                  <option value="I">I - INGRESO</option>
                  <option value="R">R - RECAUDADO</option>
                </select>
              </div>

              {/* Rango de Meses */}
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <span>Mes 01:</span>
                <select 
                  value={mesDesde} 
                  onChange={e => setMesDesde(e.target.value)}
                  className="bg-[#070e1b] border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                >
                  {MESES.map(m => <option key={m.val} value={m.val}>{m.val}</option>)}
                </select>
                <span>Mes 02:</span>
                <select 
                  value={mesHasta} 
                  onChange={e => setMesHasta(e.target.value)}
                  className="bg-[#070e1b] border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                >
                  {MESES.map(m => <option key={m.val} value={m.val}>{m.val}</option>)}
                </select>
              </div>

              {/* Opciones Checkboxes */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={incluirGenerica}
                    onChange={e => setIncluirGenerica(e.target.checked)}
                    className="rounded border-slate-700 bg-[#070e1b] text-blue-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span>Incluir genérica 00</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={incluirSaldosBalance}
                    onChange={e => setIncluirSaldosBalance(e.target.checked)}
                    className="rounded border-slate-700 bg-[#070e1b] text-blue-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span>Incluir Saldos de Balance 19</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={verFiltro}
                    onChange={e => setVerFiltro(e.target.checked)}
                    className="rounded border-slate-700 bg-[#070e1b] text-blue-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span>Ver filtro</span>
                </label>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-[10px] font-extrabold bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded px-3 py-1.5 transition-all"
              >
                <Upload className="h-3.5 w-3.5" />
                IMPORTAR CSV
              </button>
              <button 
                onClick={exportExcel} 
                disabled={loading || !rows.length}
                className="flex items-center gap-1.5 text-[10px] font-extrabold bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded px-3 py-1.5 transition-all disabled:opacity-50"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                EXCEL
              </button>
              <button 
                onClick={fetchData}
                className="flex items-center gap-1.5 text-[10px] font-extrabold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded px-3 py-1.5 transition-all"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                RECARGAR
              </button>
            </div>
          </div>

          {/* Row 2: Search Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3.5 border-t border-slate-800/40">
            {/* Buscador General */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Buscador General (Expediente / Documento / Glosa)</span>
              <input 
                type="text" 
                placeholder="Escriba término para buscar..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-[#070e1b] border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-[#3b82f6] font-mono text-xs w-full placeholder:text-slate-600"
              />
            </div>

            {/* Buscar Clasificador */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Filtrar por Código o Prefijo de Clasificador</span>
              <input 
                type="text" 
                placeholder="Escriba código o prefijo de clasificador..."
                value={searchClasificador}
                onChange={e => setSearchClasificador(e.target.value)}
                className="bg-[#070e1b] border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-[#3b82f6] font-mono text-xs w-full placeholder:text-slate-600"
              />
            </div>
          </div>
        </div>

        {/* Collapsible VFP Filtro Panel */}
        {verFiltro && (
          <div className="p-4 bg-[#091223] border-b border-slate-800 select-none animate-in slide-in-from-top duration-200">
            <div className="border border-slate-700 rounded-lg p-4 relative pt-5 bg-[#050b16]">
              {/* Fieldset style title */}
              <span className="absolute -top-3 left-4 bg-[#091223] px-2.5 text-xs font-black text-blue-400 border border-slate-700 rounded uppercase tracking-wider">
                Filtro de Consulta
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
                {/* Fte. Financ. */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fte. Financ. (Rubro)</label>
                  <select 
                    value={filterFteFinanc}
                    onChange={e => setFilterFteFinanc(e.target.value)}
                    className="w-full text-[11px] bg-[#070e1b] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono font-semibold"
                  >
                    <option value="">(Todos)</option>
                    {rubroOptions.map(r => (
                      <option key={r.fuente_fin} value={r.fuente_fin}>{r.fuente_fin} - {r.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Tip.Op. */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tip.Op.</label>
                  <select 
                    value={filterTipOp}
                    onChange={e => setFilterTipOp(e.target.value)}
                    className="w-full text-[11px] bg-[#070e1b] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono font-semibold"
                  >
                    <option value="">(Todos)</option>
                    <option value="ON">ON - Gasto Corriente</option>
                    <option value="A">A - Encargos</option>
                    <option value="AV">AV - Viáticos</option>
                    <option value="OG">OG - Otros</option>
                    <option value="TF">TF - Transferencias</option>
                  </select>
                </div>

                {/* Meta */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Meta</label>
                  <select 
                    value={filterMeta}
                    onChange={e => setFilterMeta(e.target.value)}
                    className="w-full text-[11px] bg-[#070e1b] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono font-semibold"
                  >
                    <option value="">(Todas)</option>
                    {metaOptions.map(m => (
                      <option key={m.sec_func} value={m.sec_func}>{m.sec_func} - {m.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Genérica */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Genérica</label>
                  <input 
                    type="text" 
                    placeholder="Ej: 1.1"
                    value={filterGenerica}
                    onChange={e => setFilterGenerica(e.target.value)}
                    className="w-full text-[11px] bg-[#070e1b] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono font-semibold"
                  />
                </div>

                {/* Clasificador */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Clasificador</label>
                  <select 
                    value={filterClasificador}
                    onChange={e => setFilterClasificador(e.target.value)}
                    className="w-full text-[11px] bg-[#070e1b] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono font-semibold"
                  >
                    <option value="">(Todos)</option>
                    {clasifOptions.map(c => (
                      <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action buttons at bottom-right */}
              <div className="flex justify-end gap-3 mt-4 pt-2 border-t border-slate-800/60">
                <button
                  onClick={handleLimpiarFiltro}
                  className="px-4 py-1.5 text-[10px] font-extrabold border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded transition-all"
                >
                  Limpiar Filtro
                </button>
                <button
                  onClick={handleAplicarFiltro}
                  className="px-4 py-1.5 text-[10px] font-extrabold bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded transition-all"
                >
                  Aplicar Filtro
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data Grid Table */}
        <div className="w-full overflow-x-auto bg-[#080f1d] min-h-[400px]">
          <table className="min-w-[1500px] w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 bg-[#0c182e] border-b border-slate-700 text-slate-400 text-[10px] uppercase font-black tracking-wider z-20 select-none">
              <tr>
                <th className="py-2.5 px-2 w-[60px] text-center">Año</th>
                <th className="py-2.5 px-3 w-[120px] text-center">Expediente</th>
                <th className="py-2.5 px-2 w-[70px] text-center">Mes_eje</th>
                <th className="py-2.5 px-2 w-[50px] text-center">TO</th>
                <th className="py-2.5 px-3 w-[320px]">Meta</th>
                <th className="py-2.5 px-2 w-[50px] text-center">FF</th>
                <th className="py-2.5 px-2 w-[50px] text-center">TR</th>
                <th className="py-2.5 px-2 w-[50px] text-center">TipF</th>
                <th className="py-2.5 px-3 w-[320px]">Clasificador</th>
                <th className="py-2.5 px-2 w-[70px] text-center">Cod_Doc</th>
                <th className="py-2.5 px-3 w-[150px] text-center">Num_doc</th>
                <th className="py-2.5 px-2.5 w-[95px] text-center">Fecha_doc</th>
                <th className="py-2.5 px-2 w-[60px] text-center">Fase</th>
                <th className="py-2.5 px-3 text-right w-[110px]">Monto</th>
                <th className="py-2.5 px-3 w-[300px]">Glosa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-semibold text-slate-300">
              {loading ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={15} className="py-3 px-4"><div className="h-4 bg-slate-800 rounded w-full" /></td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-24 text-center text-slate-500 font-bold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-slate-600" />
                      <span>No se encontraron expedientes de ingresos. Use la importación CSV para poblar datos reales.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={`${r.expediente}-${r.sec_reg}-${idx}`} className="hover:bg-[#112240] transition-colors font-mono text-[11px]">
                    <td className="py-2 px-2 text-center text-slate-400">{r.ano_eje}</td>
                    <td className="py-2 px-3 text-center font-bold text-white">{r.expediente}</td>
                    <td className="py-2 px-2 text-center">{r.mes_eje}</td>
                    <td className="py-2 px-2 text-center text-amber-500">{r.tipo_op}</td>
                    <td className="py-2 px-3 truncate text-slate-400" title={`${r.sec_func} - ${r.meta_nombre}`}>
                      <span className="text-white font-bold">{r.sec_func}</span> - {r.meta_nombre}
                    </td>
                    <td className="py-2 px-2 text-center">{r.rb}</td>
                    <td className="py-2 px-2 text-center">{r.tr || '—'}</td>
                    <td className="py-2 px-2 text-center">{r.tipo_finan || '—'}</td>
                    <td className="py-2 px-3 truncate text-slate-450" title={`${r.clasificad} - ${r.clasif_nombre}`}>
                      <span className="text-slate-300 font-bold">{r.clasificad}</span> - {r.clasif_nombre}
                    </td>
                    <td className="py-2 px-2 text-center">{r.cod_doc}</td>
                    <td className="py-2 px-3 text-center">{r.num_doc}</td>
                    <td className="py-2 px-2.5 text-center">{r.fecha_doc}</td>
                    <td className="py-2 px-2 text-center text-blue-400 font-bold">{r.fase}</td>
                    <td className="py-2 px-3 text-right font-bold text-blue-400">{fmt(r.monto)}</td>
                    <td className="py-2 px-3 truncate font-sans text-xs" title={r.glosa}>{r.glosa || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary & Pagination */}
        <div className="bg-[#0c1938] border-t border-slate-700 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-3">
            {/* Exit Button */}
            <button 
              onClick={() => router.push('/')}
              className="flex items-center gap-1.5 text-xs font-bold bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded px-4 py-1.5 transition-all"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              SICONIS 2026 · PRESUPUESTO
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Pagination */}
            {!loading && total > PAGE_SIZE && (
              <div className="flex items-center gap-3 select-none">
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

            <div className="flex items-center gap-2 text-sm font-black text-slate-300 bg-slate-950/60 border border-slate-800 px-4 py-1.5 rounded-lg">
              <span>TOTAL S/:</span>
              <span className="font-mono text-blue-400 text-base">{fmt(totalMonto)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
