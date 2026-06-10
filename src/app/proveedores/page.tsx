'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Upload, 
  LogOut, 
  RefreshCw, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface Provider {
  ruc: string;
  nombre: string;
  direccion: string;
}

export default function ProveedoresPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  // Selected row for Edit/Delete actions
  const [selectedRuc, setSelectedRuc] = useState<string | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [formRuc, setFormRuc] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formDireccion, setFormDireccion] = useState('');
  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Providers
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
        pageSize: String(PAGE_SIZE)
      });
      const res = await fetch(`/api/tablas/proveedores?${params}`);
      const data = await res.json();
      if (data.success) {
        setProviders(data.rows ?? []);
        setTotal(data.total ?? 0);
        // Reset selection if it's no longer in the rows
        if (selectedRuc && !data.rows.some((p: Provider) => p.ruc === selectedRuc)) {
          setSelectedRuc(null);
        }
      }
    } catch (e) {
      console.error('Error fetching providers:', e);
    } finally {
      setLoading(false);
    }
  }, [search, page, selectedRuc]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedProvider = providers.find(p => p.ruc === selectedRuc) || null;

  // Open Add Modal
  const openAdd = () => {
    setFormRuc('');
    setFormNombre('');
    setFormDireccion('');
    setFormError('');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const openEdit = () => {
    if (!selectedProvider) return;
    setFormRuc(selectedProvider.ruc);
    setFormNombre(selectedProvider.nombre);
    setFormDireccion(selectedProvider.direccion);
    setFormError('');
    setShowEditModal(true);
  };

  // Open Delete Modal
  const openDelete = () => {
    if (!selectedProvider) return;
    setShowDeleteModal(true);
  };

  // Create Provider
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRuc || !formNombre) {
      setFormError('El RUC y el Nombre son obligatorios.');
      return;
    }
    if (formRuc.length !== 11 || !/^\d+$/.test(formRuc)) {
      setFormError('El RUC debe tener exactamente 11 dígitos numéricos.');
      return;
    }

    setActionLoading(true);
    setFormError('');
    try {
      const res = await fetch('/api/tablas/proveedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruc: formRuc, nombre: formNombre, direccion: formDireccion })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        fetchData();
      } else {
        setFormError(data.error || 'Error al guardar el proveedor.');
      }
    } catch (e) {
      setFormError('Error de red al guardar el proveedor.');
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Update Provider
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre) {
      setFormError('El nombre del proveedor es obligatorio.');
      return;
    }

    setActionLoading(true);
    setFormError('');
    try {
      const res = await fetch('/api/tablas/proveedores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruc: formRuc, nombre: formNombre, direccion: formDireccion })
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        fetchData();
      } else {
        setFormError(data.error || 'Error al actualizar el proveedor.');
      }
    } catch (e) {
      setFormError('Error de red al actualizar el proveedor.');
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Provider
  const handleDelete = async () => {
    if (!selectedRuc) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tablas/proveedores?ruc=${selectedRuc}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setShowDeleteModal(false);
        setSelectedRuc(null);
        fetchData();
      } else {
        alert(data.error || 'Error al eliminar el proveedor.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al eliminar el proveedor.');
    } finally {
      setActionLoading(false);
    }
  };

  // Import CSV/Excel
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

        const response = await fetch('/api/tablas/proveedores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isImport: true, data: json })
        });
        const resData = await response.json();
        if (resData.success) {
          alert(`Importación exitosa. Se procesaron ${resData.count} registros.`);
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

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

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
              Registro de Proveedores
            </span>
          </div>
          <div className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 rounded px-2.5 py-0.5">
            301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA
          </div>
        </div>

        {/* Slate-Gray Banner */}
        <div className="bg-[#e2e8f0] text-[#334155] px-4 py-2.5 flex items-center justify-between shadow-sm select-none">
          <h2 className="font-extrabold text-sm tracking-wide uppercase flex items-center gap-2">
            <Users className="h-4 w-4" /> REGISTRO DE PROVEEDORES DE LA ENTIDAD
          </h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-[10px] font-extrabold bg-[#475569] hover:bg-[#334155] text-white rounded-md px-3 py-1 transition-all"
            >
              <Upload className="h-3 w-3" />
              IMPORTAR CSV
            </button>
            <button 
              onClick={fetchData}
              className="flex items-center gap-1.5 text-[10px] font-extrabold bg-white border border-[#475569]/30 text-[#475569] rounded-md px-3 py-1 hover:bg-slate-100 transition-all"
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
              RECARGAR
            </button>
          </div>
        </div>

        {/* Toolbar with actions and search */}
        <div className="p-4 bg-[#0a1426] border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={openAdd}
              className="flex items-center gap-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded px-3 py-1.5 border border-slate-700 transition-all"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-400" />
              Nuevo Prov.
            </button>
            <button
              onClick={openEdit}
              disabled={!selectedRuc}
              className="flex items-center gap-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded px-3 py-1.5 border border-slate-700 transition-all disabled:opacity-40 disabled:hover:bg-slate-800"
            >
              <Edit2 className="h-3.5 w-3.5 text-amber-400" />
              Modificar Prov.
            </button>
            <button
              onClick={openDelete}
              disabled={!selectedRuc}
              className="flex items-center gap-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded px-3 py-1.5 border border-slate-700 transition-all disabled:opacity-40 disabled:hover:bg-slate-800"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-400" />
              Eliminar Prov.
            </button>
          </div>

          {/* Search input */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 w-full sm:w-auto">
            <span>Buscar:</span>
            <div className="relative w-full sm:w-72">
              <input 
                type="text" 
                placeholder="RUC, nombre o dirección..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-[#070e1b] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-slate-500 font-mono text-[11px] w-full"
              />
              <Search className="absolute right-2 top-2 h-3.5 w-3.5 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Data Grid Table */}
        <div className="w-full overflow-x-auto bg-[#080f1d] min-h-[400px]">
          <table className="min-w-[800px] w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 bg-[#0c182e] border-b border-slate-700 text-slate-400 text-[10px] uppercase font-black tracking-wider z-20 select-none">
              <tr>
                <th className="py-2.5 px-4 w-[160px] text-center">R.U.C.</th>
                <th className="py-2.5 px-4 w-[400px]">Nombre / Razón Social</th>
                <th className="py-2.5 px-4">Dirección</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-semibold text-slate-300">
              {loading ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={3} className="py-3 px-4"><div className="h-4 bg-slate-800 rounded w-full" /></td>
                  </tr>
                ))
              ) : providers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-24 text-center text-slate-500 font-bold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-slate-600" />
                      <span>No se encontraron proveedores. Use el botón superior para agregar uno nuevo o importar CSV.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                providers.map((p) => (
                  <tr 
                    key={p.ruc} 
                    onClick={() => setSelectedRuc(p.ruc === selectedRuc ? null : p.ruc)}
                    className={cn(
                      "hover:bg-[#112240] transition-colors cursor-pointer select-none",
                      selectedRuc === p.ruc && "bg-[#112240] border-l-2 border-slate-400"
                    )}
                  >
                    <td className="py-2.5 px-4 text-center font-mono text-[11px] font-bold text-white">{p.ruc}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] truncate" title={p.nombre}>{p.nombre}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] truncate" title={p.direccion}>{p.direccion || '—'}</td>
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
              SICONIS 2026 · LOGÍSTICA
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
              <span>Proveedores Registrados: <span className="font-mono text-white font-extrabold">{total.toLocaleString('es-PE')}</span></span>
            </div>
          </div>
        </div>

      </div>

      {/* ==================== DIALOG MODALS ==================== */}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-[#070e1b] shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-[#0c1938] border-b border-slate-700 px-4 py-2 flex items-center justify-between select-none">
              <span className="text-xs font-bold text-slate-300">Nuevo Proveedor</span>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-950/40 border border-red-900/60 rounded p-3 text-xs text-red-400 font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Número de R.U.C.</label>
                <input 
                  type="text" 
                  maxLength={11}
                  placeholder="Ej: 20123456789"
                  value={formRuc}
                  onChange={e => setFormRuc(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-slate-500 font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nombre / Razón Social</label>
                <input 
                  type="text" 
                  placeholder="Ej: PROVEEDOR GENERAL S.A.C."
                  value={formNombre}
                  onChange={e => setFormNombre(e.target.value.toUpperCase())}
                  className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-slate-500 font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dirección</label>
                <input 
                  type="text" 
                  placeholder="Ej: AV. TUPAC AMARU 123 - HUANCABAMBA"
                  value={formDireccion}
                  onChange={e => setFormDireccion(e.target.value.toUpperCase())}
                  className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-slate-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-700 bg-slate-900 text-slate-300 hover:text-white rounded text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="px-4 py-2 bg-slate-200 hover:bg-white text-[#070e1b] rounded text-xs font-bold transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Guardando...' : 'Crear Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-[#070e1b] shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-[#0c1938] border-b border-slate-700 px-4 py-2 flex items-center justify-between select-none">
              <span className="text-xs font-bold text-slate-300">Modificar Proveedor</span>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-950/40 border border-red-900/60 rounded p-3 text-xs text-red-400 font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Número de R.U.C. (No modificable)</label>
                <input 
                  type="text" 
                  value={formRuc}
                  disabled
                  className="w-full text-xs bg-[#0b1426] border border-slate-800 rounded px-3 py-2 text-slate-500 font-mono select-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nombre / Razón Social</label>
                <input 
                  type="text" 
                  value={formNombre}
                  onChange={e => setFormNombre(e.target.value.toUpperCase())}
                  className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-slate-500 font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dirección</label>
                <input 
                  type="text" 
                  value={formDireccion}
                  onChange={e => setFormDireccion(e.target.value.toUpperCase())}
                  className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-slate-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-700 bg-slate-900 text-slate-300 hover:text-white rounded text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="px-4 py-2 bg-slate-200 hover:bg-white text-[#070e1b] rounded text-xs font-bold transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Actualizando...' : 'Grabar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-[#070e1b] shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-[#0c1938] border-b border-slate-700 px-4 py-2 flex items-center justify-between select-none">
              <span className="text-xs font-bold text-rose-400">Confirmar Eliminación</span>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-rose-950/20 border border-rose-900/40 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs text-rose-300 font-bold">¿Está completamente seguro?</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Esta acción eliminará de forma permanente al proveedor con R.U.C. <span className="font-mono text-white font-bold">{selectedProvider.ruc}</span> y nombre:
                  </p>
                  <p className="text-xs text-white font-black bg-rose-950/40 border border-rose-900/40 px-2.5 py-1 rounded mt-1 font-mono">
                    {selectedProvider.nombre}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-slate-700 bg-slate-900 text-slate-300 hover:text-white rounded text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Eliminando...' : 'Eliminar Proveedor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
