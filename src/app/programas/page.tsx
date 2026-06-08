'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Search,
  RefreshCw,
  AlertTriangle,
  FileSpreadsheet,
  TrendingDown,
  FileCheck,
  Banknote,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import * as XLSX from 'xlsx';

interface ProgramRow {
  codigo: string;
  nombre: string;
  pim: number;
  devengado: number;
  girado: number;
  saldo: number;
}

const formatMoney = (val: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(val || 0);

export default function ProgramasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ProgramRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRow, setSelectedRow] = useState<ProgramRow | null>(null);

  const fetchProgramas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/programas');
      const data = await res.json();
      if (data.success) {
        setRows(data.rows || []);
        if (data.rows.length > 0) {
          setSelectedRow(data.rows[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching programs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgramas();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        row.codigo.includes(q) ||
        row.nombre.toLowerCase().includes(q)
      );
    });
  }, [rows, searchQuery]);

  // Update selected row if it's no longer in filtered rows
  useEffect(() => {
    if (filteredRows.length > 0) {
      const exists = filteredRows.some(r => r.codigo === selectedRow?.codigo);
      if (!exists) {
        setSelectedRow(filteredRows[0]);
      }
    } else {
      setSelectedRow(null);
    }
  }, [filteredRows, selectedRow]);

  const filteredTotals = useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => {
        acc.pim += r.pim;
        acc.devengado += r.devengado;
        acc.girado += r.girado;
        acc.saldo += r.saldo;
        return acc;
      },
      { pim: 0, devengado: 0, girado: 0, saldo: 0 }
    );
  }, [filteredRows]);

  const exportToExcel = () => {
    const data = filteredRows.map((row) => ({
      'Programa': row.codigo,
      'Descripción': row.nombre,
      'PIM (S/)': row.pim,
      'Devengado (S/)': row.devengado,
      'Girado (S/)': row.girado,
      'Saldo (S/)': row.saldo,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ejecución Programas');
    XLSX.writeFile(wb, `SWSiconis_Programas_Presupuestales_2026.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto">
      {/* Header */}
      <PageHeader
        sectionLabel="Módulo de Presupuesto"
        icon={BarChart3}
        title="Programa Presupuestal"
        description="Ejecución presupuestal consolidada por programas presupuestales vigentes para el año fiscal 2026."
        actions={
          <>
            <button
              onClick={exportToExcel}
              disabled={loading || filteredRows.length === 0}
              className="btn-excel"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Exportar Excel
            </button>
            <button onClick={fetchProgramas} className="btn-secondary p-2">
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin-smooth')} />
            </button>
          </>
        }
      />

      {/* Search Bar */}
      <div className="p-4 rounded-2xl border border-white/[0.06] bg-[#061526]/40 backdrop-blur-md shadow-lg max-w-md">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-[#d40000] tracking-wider flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" /> Búsqueda Rápida
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por código o descripción de programa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-8"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#4A6080]" />
          </div>
        </div>
      </div>

      {/* Grid container */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#061526]/70 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="data-table relative">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="w-24 text-center">Código</th>
                <th>Programa Presupuestal</th>
                <th className="text-right w-44">PIM</th>
                <th className="text-right w-44">Devengado</th>
                <th className="text-right w-44">Girado</th>
                <th className="text-right w-44">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j}><div className="skeleton h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-[#2A3A50]">
                      <AlertTriangle className="h-10 w-10" />
                      <p className="text-sm font-semibold">No se encontraron programas presupuestales.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isSelected = selectedRow?.codigo === row.codigo;
                  return (
                    <tr
                      key={row.codigo}
                      className={cn(
                        'cursor-pointer transition-colors duration-150 border-l-2',
                        isSelected 
                          ? 'bg-white/[0.05] border-l-[#d40000] text-white' 
                          : 'border-l-transparent text-[#D0D8E8] hover:bg-white/[0.02]'
                      )}
                      onClick={() => setSelectedRow(row)}
                    >
                      <td className="text-center font-mono font-bold text-[#d40000]">{row.codigo}</td>
                      <td className="font-semibold whitespace-normal break-words leading-relaxed max-w-[400px] py-3">
                        {row.nombre}
                      </td>
                      <td className="text-right font-mono text-slate-300">{formatMoney(row.pim)}</td>
                      <td className="text-right font-mono text-red-400 font-semibold">{formatMoney(row.devengado)}</td>
                      <td className="text-right font-mono text-emerald-400">{formatMoney(row.girado)}</td>
                      <td className="text-right font-mono text-blue-400 font-bold">{formatMoney(row.saldo)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {!loading && filteredRows.length > 0 && (
              <tfoot className="sticky bottom-0 z-10 border-t border-white/[0.1]">
                <tr className="bg-[#050f1b] font-bold">
                  <td colSpan={2} className="font-sans font-extrabold uppercase tracking-wide text-[#94A3B8] text-[10px]">
                    Total General
                  </td>
                  <td className="text-right font-mono text-slate-200">{formatMoney(filteredTotals.pim)}</td>
                  <td className="text-right font-mono text-red-400">{formatMoney(filteredTotals.devengado)}</td>
                  <td className="text-right font-mono text-emerald-400">{formatMoney(filteredTotals.girado)}</td>
                  <td className="text-right font-mono text-blue-400">{formatMoney(filteredTotals.saldo)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Detail Panel at bottom (resembling the FoxPro layout) */}
      {selectedRow && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch animate-in fade-in duration-300">
          {/* Bottom Left: Program details */}
          <div className="md:col-span-5 p-5 rounded-2xl border border-white/[0.06] bg-[#061526]/75 backdrop-blur-md flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-[#4A6080] tracking-wider">Programa Seleccionado</span>
            <div className="flex gap-3 mt-3">
              <div className="w-20 font-mono text-xs font-bold bg-[#030812] border border-slate-800/80 rounded-lg px-2.5 py-2 text-[#d40000] text-center select-none shrink-0 self-start">
                {selectedRow.codigo}
              </div>
              <div className="flex-1 text-xs font-semibold bg-[#030812] border border-slate-800/80 rounded-lg px-3.5 py-2.5 text-slate-200 whitespace-normal break-words leading-relaxed">
                {selectedRow.nombre}
              </div>
            </div>
          </div>

          {/* Bottom Right: Action buttons (Certificados, Devengados, Giros, Giros con glosa) */}
          <div className="md:col-span-7 p-5 rounded-2xl border border-white/[0.06] bg-[#061526]/75 backdrop-blur-md flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-[#4A6080] tracking-wider">Consulta de Ejecución Presupuestal</span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-[#d40000]/15 text-[#d40000] border border-[#d40000]/30 font-mono font-bold px-2.5 py-1 rounded">
                  Programa: {selectedRow.codigo}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                <button
                  onClick={() => router.push(`/certificados?programa=${selectedRow.codigo}`)}
                  className="btn-secondary text-[11px] font-bold flex items-center gap-1.5 px-3 py-2 w-full sm:w-auto"
                >
                  <FileCheck className="h-3.5 w-3.5 text-purple-400" />
                  Certificados
                </button>
                <button
                  onClick={() => router.push(`/gastos?programa=${selectedRow.codigo}`)}
                  className="btn-secondary text-[11px] font-bold flex items-center gap-1.5 px-3 py-2 w-full sm:w-auto"
                >
                  <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                  Devengados
                </button>
                <button
                  onClick={() => router.push(`/giros?programa=${selectedRow.codigo}`)}
                  className="btn-secondary text-[11px] font-bold flex items-center gap-1.5 px-3 py-2 w-full sm:w-auto"
                >
                  <Banknote className="h-3.5 w-3.5 text-emerald-400" />
                  Giros
                </button>
                <button
                  onClick={() => router.push(`/giros?programa=${selectedRow.codigo}&glosa=1`)}
                  className="btn-secondary text-[11px] font-bold flex items-center gap-1.5 px-3 py-2 w-full sm:w-auto"
                >
                  <FolderOpen className="h-3.5 w-3.5 text-blue-400" />
                  Giros con glosa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
