'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Search,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportChequesGirados } from '@/lib/excel-exports';

interface GiroRow {
  index: number;
  ano_eje: string;
  mes_eje: string;
  tipo_op: string;
  expediente: string;
  sec_reg: string;
  corr: string;
  rb: string;
  tr: string;
  ctacte: string;
  cod_doc: string;
  num_doc: string;
  fecha_doc: string;
  beneficiario: string;
  monto: number;
  estado: string;
  ruc: string;
}

const formatMoney = (val: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);

export default function GirosPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<GiroRow[]>([]);
  const [selectedRow, setSelectedRow] = useState<GiroRow | null>(null);
  const [total, setTotal] = useState(0);
  const [totalMonto, setTotalMonto] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  // Filter lists fetched from API
  const [rubros, setRubros] = useState<{ codigo: string; nombre: string }[]>([]);
  const [meses, setMeses] = useState<string[]>([]);
  const [tiposOperacion, setTiposOperacion] = useState<string[]>([]);
  const [anos, setAnos] = useState<string[]>([]);

  // Selected filters
  const [filterAno, setFilterAno] = useState('');
  const [filterMes, setFilterMes] = useState('');
  const [filterTipoOp, setFilterTipoOp] = useState('');
  const [filterRubro, setFilterRubro] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterAno) params.append('ano', filterAno);
      if (filterMes) params.append('mes', filterMes);
      if (filterTipoOp) params.append('tipo_op', filterTipoOp);
      if (filterRubro) params.append('rubro', filterRubro);
      if (search) params.append('search', search);
      params.append('page', String(page));
      params.append('pageSize', String(PAGE_SIZE));

      const res = await fetch(`/api/giros?${params}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.rows || []);
        setTotal(data.total || 0);
        setTotalMonto(data.totalMonto || 0);
        
        if (data.rubros) setRubros(data.rubros);
        if (data.meses) setMeses(data.meses);
        if (data.tiposOperacion) setTiposOperacion(data.tiposOperacion);
        if (data.anos) setAnos(data.anos);

        // Auto-select first row
        if (data.rows.length > 0) {
          const exists = data.rows.find((r: GiroRow) => r.expediente === selectedRow?.expediente && r.sec_reg === selectedRow?.sec_reg && r.corr === selectedRow?.corr);
          if (exists) {
            setSelectedRow(exists);
          } else {
            setSelectedRow(data.rows[0]);
          }
        } else {
          setSelectedRow(null);
        }
      }
    } catch (e) {
      console.error('Error fetching checks:', e);
    } finally {
      setLoading(false);
    }
  }, [filterAno, filterMes, filterTipoOp, filterRubro, search, page, selectedRow?.expediente, selectedRow?.sec_reg, selectedRow?.corr]);

  useEffect(() => {
    setPage(1);
  }, [filterAno, filterMes, filterTipoOp, filterRubro, search]);

  useEffect(() => {
    fetchData();
  }, [page, filterMes, filterTipoOp, filterRubro, fetchData]);

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (filterAno) params.append('ano', filterAno);
      if (filterMes) params.append('mes', filterMes);
      if (filterTipoOp) params.append('tipo_op', filterTipoOp);
      if (filterRubro) params.append('rubro', filterRubro);
      if (search) params.append('search', search);
      params.append('page', '1');
      params.append('pageSize', '100000'); // large size to fetch all

      const res = await fetch(`/api/giros?${params}`);
      const data = await res.json();
      if (data.success && data.rows) {
        exportChequesGirados(data.rows);
      }
    } catch (e) {
      console.error('Error exporting checks:', e);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div className="w-full space-y-6">
      {/* Outer VFP Window Wrapper */}
      <div className="w-full rounded-xl border border-slate-700 bg-[#070e1b] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Window Top Title / Metadata Banner */}
        <div className="bg-[#0c1938] border-b border-slate-700 px-4 py-2 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
              Cheques Girados
            </span>
          </div>
          <div className="text-xs font-bold text-[#3b82f6] bg-blue-950/40 border border-blue-900/60 rounded px-2.5 py-0.5">
            301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA
          </div>
        </div>

        {/* Mint Green Banner */}
        <div className="bg-[#a7f3d0] text-[#064e3b] px-4 py-2.5 flex items-center justify-between shadow-sm select-none">
          <h2 className="font-extrabold text-sm tracking-wide uppercase flex items-center gap-2">
            Cheques Girados{filterAno ? ` - Año ${filterAno}` : ' - Todos los Períodos'}
          </h2>
          <button 
            onClick={fetchData}
            className="flex items-center gap-1 text-[11px] font-bold bg-[#064e3b] hover:bg-[#064e3b]/90 text-white rounded px-2 py-0.5 transition-all"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            Recargar
          </button>
        </div>

        {/* Toolbar & Search & Filters */}
        <div className="p-4 bg-[#0a1426] border-b border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left side dropdown filters */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Año Dropdown */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <span>Año:</span>
                <select 
                  value={filterAno} 
                  onChange={e => setFilterAno(e.target.value)}
                  className="bg-[#070e1b] border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                >
                  <option value="">Todos</option>
                  {anos.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Mes Dropdown */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <span>Mes:</span>
                <select 
                  value={filterMes} 
                  onChange={e => setFilterMes(e.target.value)}
                  className="bg-[#070e1b] border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                >
                  <option value="">Todos</option>
                  {meses.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Tipo Operacion / Recurso Dropdown */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <span>Tipo Rec.:</span>
                <select 
                  value={filterTipoOp} 
                  onChange={e => setFilterTipoOp(e.target.value)}
                  className="bg-[#070e1b] border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                >
                  <option value="">Todos</option>
                  {tiposOperacion.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Rubro Dropdown */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <span>Rubro:</span>
                <select 
                  value={filterRubro} 
                  onChange={e => setFilterRubro(e.target.value)}
                  className="bg-[#070e1b] border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-[11px] max-w-[150px] truncate"
                >
                  <option value="">Todos</option>
                  {rubros.map(r => (
                    <option key={r.codigo} value={r.codigo}>{r.codigo} - {r.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right side search bar */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Buscar por Expediente, Doc Banco, RUC..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-mono"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Checks Table Grid */}
        <div className="w-full max-w-full overflow-x-auto bg-[#080f1d] min-h-[450px]">
          <table className="min-w-[1185px] w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 bg-[#0c182e] border-b border-slate-700 text-slate-400 text-[10px] uppercase font-black tracking-wider z-20 select-none">
              <tr>
                <th className="py-2.5 px-3 w-[30px]"></th>
                <th className="py-2.5 px-2 w-[60px] text-center">Ano Eje</th>
                <th className="py-2.5 px-2 w-[40px] text-center">Mes</th>
                <th className="py-2.5 px-2 w-[80px] text-center">Expediente</th>
                <th className="py-2.5 px-2 w-[45px] text-center">Sec..</th>
                <th className="py-2.5 px-2 w-[45px] text-center">Corr.</th>
                <th className="py-2.5 px-2 w-[40px] text-center">Rub.</th>
                <th className="py-2.5 px-2 w-[40px] text-center">TR</th>
                <th className="py-2.5 px-2 w-[110px] text-center">Cta.Cte</th>
                <th className="py-2.5 px-2 w-[40px] text-center">Doc.</th>
                <th className="py-2.5 px-2 w-[110px] text-center">Num.Doc.</th>
                <th className="py-2.5 px-2 w-[85px] text-center">Fec.Doc.</th>
                <th className="py-2.5 px-3 w-[350px]">Beneficiario</th>
                <th className="py-2.5 px-3 text-right w-[110px]">Monto</th>
                <th className="py-2.5 px-2 w-[40px] text-center">Est</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-semibold text-slate-300">
              {loading ? (
                Array.from({ length: 10 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={15} className="py-3 px-4"><div className="h-4 bg-slate-800 rounded w-full" /></td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-24 text-center text-slate-500 font-bold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-slate-600" />
                      <span>No se encontraron cheques girados registrados.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const isSelected = selectedRow?.expediente === r.expediente && selectedRow?.sec_reg === r.sec_reg && selectedRow?.corr === r.corr;
                  return (
                    <tr 
                      key={`${r.expediente}-${r.sec_reg}-${r.corr}-${r.index}`}
                      onClick={() => setSelectedRow(r)}
                      className={cn(
                        "cursor-pointer transition-all select-none",
                        isSelected 
                          ? "bg-[#f59e0b] text-[#070e1b] font-bold" 
                          : "even:bg-[#070e1a]/50 text-slate-300 hover:bg-[#112240]"
                      )}
                    >
                      {/* Selected Indicator cursor ▶ */}
                      <td className="py-2 px-1 text-center font-black">
                        {isSelected && <span className="text-red-600">▶</span>}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-[11px]">{r.ano_eje}</td>
                      <td className="py-2 px-2 text-center font-mono text-[11px]">{r.mes_eje}</td>
                      <td className="py-2 px-2 text-center font-mono text-[11px] font-bold">{r.expediente}</td>
                      <td className="py-2 px-2 text-center font-mono text-[11px]">{r.sec_reg}</td>
                      <td className="py-2 px-2 text-center font-mono text-[11px]">{r.corr}</td>
                      <td className="py-2 px-2 text-center font-mono text-[11px]">{r.rb}</td>
                      <td className="py-2 px-2 text-center font-mono text-[11px]">{r.tr}</td>
                      <td className="py-2 px-2 text-center font-mono text-[11px]">{r.ctacte}</td>
                      <td className="py-2 px-2 text-center font-mono text-[11px]">{r.cod_doc}</td>
                      <td className="py-2 px-2 text-center font-mono text-[11px] font-bold">{r.num_doc}</td>
                      <td className="py-2 px-2 text-center font-mono text-[11px]">{r.fecha_doc}</td>
                      <td className="py-2 px-3 truncate" title={r.beneficiario}>{r.beneficiario || '—'}</td>
                      <td className={cn("py-2 px-3 text-right font-mono font-bold", isSelected ? "text-[#070e1b]" : "text-emerald-400")}>
                        {formatMoney(r.monto)}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-[11px]">{r.estado}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Sum & Action Panel */}
        <div className="bg-[#0c1938] border-t border-slate-700 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Excel Export Button */}
            <button
              onClick={handleExportExcel}
              disabled={loading || rows.length === 0}
              className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg border border-emerald-800 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 hover:text-emerald-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar a EXCEL
            </button>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              SICONIS 2026 · TESORERÍA
            </div>
          </div>

          {/* Sum total and pagination */}
          <div className="flex items-center gap-6">
            {/* Pagination Controls */}
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

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 select-none">
              <span>Registros: <span className="font-mono text-white font-extrabold">{total.toLocaleString('es-PE')}</span></span>
            </div>

            <div className="flex items-center gap-2 text-sm font-black text-slate-300 select-none bg-slate-950/60 border border-slate-800 px-4 py-1.5 rounded-lg">
              <span>TOTAL:</span>
              <span className="font-mono text-[#f59e0b] text-base">{formatMoney(totalMonto)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
