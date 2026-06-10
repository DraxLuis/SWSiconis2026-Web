'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Banknote, 
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

interface GiroDoc {
  id: number;
  cod_doc: string;
  num_doc: string;
  nombre: string;
}

export default function DocumentosGirosPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<GiroDoc[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  // Selected row for Edit/Delete actions
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [formCodDoc, setFormCodDoc] = useState('');
  const [formNumDoc, setFormNumDoc] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Giro Documents
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
        pageSize: String(PAGE_SIZE)
      });
      const res = await fetch(`/api/tablas/documentos-giros?${params}`);
      const data = await res.json();
      if (data.success) {
        setDocs(data.rows ?? []);
        setTotal(data.total ?? 0);
        // Reset selection if it's no longer in the rows
        if (selectedId && !data.rows.some((d: GiroDoc) => d.id === selectedId)) {
          setSelectedId(null);
        }
      }
    } catch (e) {
      console.error('Error fetching giro documents:', e);
    } finally {
      setLoading(false);
    }
  }, [search, page, selectedId]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedDoc = docs.find(d => d.id === selectedId) || null;

  // Open Add Modal
  const openAdd = () => {
    setFormCodDoc('');
    setFormNumDoc('');
    setFormNombre('');
    setFormError('');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const openEdit = () => {
    if (!selectedDoc) return;
    setFormCodDoc(selectedDoc.cod_doc);
    setFormNumDoc(selectedDoc.num_doc);
    setFormNombre(selectedDoc.nombre);
    setFormError('');
    setShowEditModal(true);
  };

  // Open Delete Modal
  const openDelete = () => {
    if (!selectedDoc) return;
    setShowDeleteModal(true);
  };

  // Create Doc
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCodDoc || !formNumDoc || !formNombre) {
      setFormError('Todos los campos son obligatorios.');
      return;
    }

    setActionLoading(true);
    setFormError('');
    try {
      const res = await fetch('/api/tablas/documentos-giros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cod_doc: formCodDoc, num_doc: formNumDoc, nombre: formNombre })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        fetchData();
      } else {
        setFormError(data.error || 'Error al crear el documento.');
      }
    } catch (e) {
      setFormError('Error de red al crear el documento.');
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Update Doc
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCodDoc || !formNumDoc || !formNombre) {
      setFormError('Todos los campos son obligatorios.');
      return;
    }

    setActionLoading(true);
    setFormError('');
    try {
      const res = await fetch('/api/tablas/documentos-giros', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId, cod_doc: formCodDoc, num_doc: formNumDoc, nombre: formNombre })
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        fetchData();
      } else {
        setFormError(data.error || 'Error al actualizar el documento.');
      }
    } catch (e) {
      setFormError('Error de red al actualizar el documento.');
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Doc
  const handleDelete = async () => {
    if (!selectedId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tablas/documentos-giros?id=${selectedId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setShowDeleteModal(false);
        setSelectedId(null);
        fetchData();
      } else {
        alert(data.error || 'Error al eliminar el documento.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al eliminar el documento.');
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

        const response = await fetch('/api/tablas/documentos-giros', {
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
              Registro de Documentos de Giros
            </span>
          </div>
          <div className="text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 rounded px-2.5 py-0.5">
            301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA
          </div>
        </div>

        {/* Emerald/Green Banner */}
        <div className="bg-[#d1fae5] text-[#065f46] px-4 py-2.5 flex items-center justify-between shadow-sm select-none">
          <h2 className="font-extrabold text-sm tracking-wide uppercase flex items-center gap-2">
            <Banknote className="h-4 w-4" /> REGISTRO DE DOCUMENTOS DE GIROS (BANCO)
          </h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-[10px] font-extrabold bg-[#065f46] hover:bg-[#047857] text-white rounded-md px-3 py-1 transition-all"
            >
              <Upload className="h-3 w-3" />
              IMPORTAR CSV
            </button>
            <button 
              onClick={fetchData}
              className="flex items-center gap-1.5 text-[10px] font-extrabold bg-white border border-[#065f46]/30 text-[#065f46] rounded-md px-3 py-1 hover:bg-slate-100 transition-all"
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
              Nuevo Doc.
            </button>
            <button
              onClick={openEdit}
              disabled={!selectedId}
              className="flex items-center gap-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded px-3 py-1.5 border border-slate-700 transition-all disabled:opacity-40 disabled:hover:bg-slate-800"
            >
              <Edit2 className="h-3.5 w-3.5 text-amber-400" />
              Modificar Doc.
            </button>
            <button
              onClick={openDelete}
              disabled={!selectedId}
              className="flex items-center gap-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded px-3 py-1.5 border border-slate-700 transition-all disabled:opacity-40 disabled:hover:bg-slate-800"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-400" />
              Eliminar Doc.
            </button>
          </div>

          {/* Search input */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 w-full sm:w-auto">
            <span>Buscar:</span>
            <div className="relative w-full sm:w-72">
              <input 
                type="text" 
                placeholder="Código, número o nombre..."
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
                <th className="py-2.5 px-4 w-[120px] text-center">Código Doc.</th>
                <th className="py-2.5 px-4 w-[200px] text-center">Número Doc.</th>
                <th className="py-2.5 px-4">Nombre de Documento / Chequera</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-semibold text-slate-300">
              {loading ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={3} className="py-3 px-4"><div className="h-4 bg-slate-800 rounded w-full" /></td>
                  </tr>
                ))
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-24 text-center text-slate-500 font-bold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-slate-600" />
                      <span>No se encontraron documentos de giros. Use el botón superior para agregar uno nuevo o importar CSV.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                docs.map((d) => (
                  <tr 
                    key={d.id} 
                    onClick={() => setSelectedId(d.id === selectedId ? null : d.id)}
                    className={cn(
                      "hover:bg-[#112240] transition-colors cursor-pointer select-none",
                      selectedId === d.id && "bg-[#112240] border-l-2 border-emerald-500"
                    )}
                  >
                    <td className="py-2.5 px-4 text-center font-mono text-[11px] font-bold text-white">{d.cod_doc}</td>
                    <td className="py-2.5 px-4 text-center font-mono text-[11px] text-emerald-400 font-bold">{d.num_doc}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] truncate" title={d.nombre}>{d.nombre}</td>
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
              SICONIS 2026 · TESORERÍA
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
              <span>Documentos Registrados: <span className="font-mono text-white font-extrabold">{total.toLocaleString('es-PE')}</span></span>
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
              <span className="text-xs font-bold text-slate-300">Nuevo Documento de Giro</span>
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
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Código del Documento (COD_DOC)</label>
                <input 
                  type="text" 
                  maxLength={3}
                  placeholder="Ej: 009"
                  value={formCodDoc}
                  onChange={e => setFormCodDoc(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-slate-500 font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Número de Documento (NUM_DOC)</label>
                <input 
                  type="text" 
                  maxLength={15}
                  placeholder="Ej: 98765432"
                  value={formNumDoc}
                  onChange={e => setFormNumDoc(e.target.value)}
                  className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-slate-500 font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nombre del Documento / Chequera</label>
                <input 
                  type="text" 
                  placeholder="Ej: CHEQUE BANCO DE LA NACIÓN"
                  value={formNombre}
                  onChange={e => setFormNombre(e.target.value.toUpperCase())}
                  className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-slate-500 font-mono"
                  required
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
                  {actionLoading ? 'Guardando...' : 'Crear Documento'}
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
              <span className="text-xs font-bold text-slate-300">Modificar Documento de Giro</span>
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
                <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Código del Documento (COD_DOC)</label>
                <input 
                  type="text" 
                  maxLength={3}
                  value={formCodDoc}
                  onChange={e => setFormCodDoc(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-slate-500 font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Número de Documento (NUM_DOC)</label>
                <input 
                  type="text" 
                  maxLength={15}
                  value={formNumDoc}
                  onChange={e => setFormNumDoc(e.target.value)}
                  className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-slate-500 font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nombre del Documento / Chequera</label>
                <input 
                  type="text" 
                  value={formNombre}
                  onChange={e => setFormNombre(e.target.value.toUpperCase())}
                  className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-slate-500 font-mono"
                  required
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
      {showDeleteModal && selectedDoc && (
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
                    Esta acción eliminará de forma permanente el documento de giro con Código <span className="font-mono text-white font-bold">{selectedDoc.cod_doc}</span> y Número:
                  </p>
                  <p className="text-xs text-white font-black bg-rose-950/40 border border-rose-900/40 px-2.5 py-1 rounded mt-1 font-mono">
                    {selectedDoc.num_doc} - {selectedDoc.nombre}
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
                  {actionLoading ? 'Eliminando...' : 'Eliminar Documento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
