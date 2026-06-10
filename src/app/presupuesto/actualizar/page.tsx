'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Search, 
  Save, 
  LogOut, 
  AlertTriangle 
} from 'lucide-react';

export default function ActualizarNombreProveedorGlosaPage() {
  const router = useRouter();
  
  // Selection fields
  const [expediente, setExpediente] = useState('');
  const [ciclo, setCiclo] = useState('G');
  const [fase, setFase] = useState('D');
  const [secReg, setSecReg] = useState('0001');
  const [corr] = useState('00');

  // Loaded data state
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [monto, setMonto] = useState(0);

  // Values
  const [glosaActual, setGlosaActual] = useState('');
  const [glosaModificar, setGlosaModificar] = useState('');
  
  const [rucActual, setRucActual] = useState('');
  const [rucModificar, setRucModificar] = useState('');

  const [proveedorActual, setProveedorActual] = useState('');
  const [proveedorModificar, setProveedorModificar] = useState('');

  const handleBuscar = async () => {
    if (!expediente || !fase || !secReg) {
      alert('Por favor complete los campos: Expediente, Fase y Sec. Reg.');
      return;
    }

    setLoading(true);
    setLoaded(false);
    try {
      const params = new URLSearchParams({
        expediente: expediente.padStart(10, '0'),
        ciclo,
        fase,
        sec_reg: secReg.padStart(4, '0'),
        corr: corr.padStart(2, '0')
      });

      const res = await fetch(`/api/presupuesto/actualizar?${params}`);
      const resData = await res.json();
      
      if (resData.success) {
        const d = resData.data;
        setMonto(d.monto);
        setGlosaActual(d.glosa);
        setGlosaModificar(d.glosa);
        
        setRucActual(d.ruc);
        setRucModificar(d.ruc);

        setProveedorActual(d.proveedor);
        setProveedorModificar(d.proveedor);
        
        setLoaded(true);
      } else {
        alert('Error: ' + resData.error);
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al consultar el expediente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGrabar = async () => {
    if (!loaded) return;

    setSaving(true);
    try {
      const res = await fetch('/api/presupuesto/actualizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expediente: expediente.padStart(10, '0'),
          ciclo,
          fase,
          sec_reg: secReg.padStart(4, '0'),
          glosa: glosaModificar,
          ruc: rucModificar,
          proveedor: proveedorModificar
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Cambios grabados exitosamente.');
        // Refresh values
        setGlosaActual(glosaModificar);
        setRucActual(rucModificar);
        setProveedorActual(proveedorModificar);
      } else {
        alert('Error al grabar cambios: ' + data.error);
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al grabar cambios.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="w-full rounded-xl border border-slate-700 bg-[#070e1b] shadow-2xl overflow-hidden flex flex-col">
        
        {/* VFP Window Header Banner */}
        <div className="bg-[#0c1938] border-b border-slate-700 px-4 py-2 flex items-center justify-between select-none">
          <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
            Actualizar Nombre / Proveedor / Glosa
          </span>
          <div className="text-xs font-bold text-[#f59e0b] bg-amber-950/40 border border-amber-900/60 rounded px-2.5 py-0.5">
            301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA
          </div>
        </div>

        {/* Amber Banner */}
        <div className="bg-[#fef3c7] text-[#92400e] px-4 py-3 flex items-center justify-between shadow-sm select-none">
          <h2 className="font-extrabold text-sm tracking-wide uppercase flex items-center gap-2">
            <FileText className="h-4 w-4" /> ACTUALIZAR NOMBRE / PROVEEDOR / GLOSA
          </h2>
        </div>

        {/* Selection panel */}
        <div className="p-5 bg-[#0a1426] border-b border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Expediente</label>
            <input 
              type="text" 
              placeholder="Ej: 0000000023"
              value={expediente}
              onChange={e => setExpediente(e.target.value)}
              className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ciclo</label>
            <select 
              value={ciclo}
              onChange={e => setCiclo(e.target.value)}
              className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded px-2 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
            >
              <option value="G">G - GASTO</option>
              <option value="I">I - INGRESO</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fase</label>
            <select 
              value={fase}
              onChange={e => setFase(e.target.value)}
              className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded px-2 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
            >
              <option value="C">C - COMPROMETIDO</option>
              <option value="D">D - DEVENGADO</option>
              <option value="G">G - GIRADO</option>
              <option value="P">P - PAGADO</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sec. Reg</label>
            <input 
              type="text" 
              placeholder="Ej: 0001"
              value={secReg}
              onChange={e => setSecReg(e.target.value)}
              className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <button 
              onClick={handleBuscar}
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-[#070e1b] rounded py-2 transition-all disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              {loading ? 'Buscando...' : 'Buscar Registro'}
            </button>
          </div>
        </div>

        {/* Content editing panel */}
        <div className="p-6 bg-[#080f1d] min-h-[350px] space-y-6">
          {!loaded ? (
            <div className="py-16 text-center text-slate-500 font-bold border-2 border-dashed border-slate-800 rounded-xl">
              <div className="flex flex-col items-center justify-center gap-2">
                <AlertTriangle className="h-8 w-8 text-slate-600 animate-pulse" />
                <span>Ingrese los filtros superiores y haga clic en Buscar Registro para empezar a editar.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Monto Alert Banner */}
              <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-3 flex items-center justify-between text-xs text-amber-400 font-mono">
                <span>Expediente: <span className="font-extrabold text-white">{expediente}</span> | Fase: <span className="font-extrabold text-white">{fase}</span> | Sec Reg: <span className="font-extrabold text-white">{secReg}</span></span>
                <span>Monto Registrado: <span className="font-extrabold text-white text-sm">S/ {monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span></span>
              </div>

              {/* Glosa editor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Glosa Actual (Solo lectura)</label>
                  <div className="w-full text-xs bg-[#0b1426] border border-slate-800 rounded-lg p-3 text-slate-500 font-mono min-h-[70px] select-none">
                    {glosaActual || '(Vacía)'}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Glosa a Modificar</label>
                  <textarea 
                    value={glosaModificar}
                    onChange={e => setGlosaModificar(e.target.value)}
                    className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-amber-500 font-mono min-h-[70px]"
                    placeholder="Escriba la nueva glosa..."
                  />
                </div>
              </div>

              <hr className="border-slate-800" />

              {/* RUC editor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">RUC Actual</label>
                  <input 
                    type="text" 
                    value={rucActual}
                    disabled
                    className="w-full text-xs bg-[#0b1426] border border-slate-800 rounded px-3 py-2 text-slate-500 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">RUC a Modificar</label>
                  <input 
                    type="text" 
                    value={rucModificar}
                    onChange={e => setRucModificar(e.target.value)}
                    className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    placeholder="Ingrese el nuevo RUC del proveedor..."
                  />
                </div>
              </div>

              <hr className="border-slate-800" />

              {/* Proveedor editor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Proveedor Actual</label>
                  <input 
                    type="text" 
                    value={proveedorActual}
                    disabled
                    className="w-full text-xs bg-[#0b1426] border border-slate-800 rounded px-3 py-2 text-slate-500 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Proveedor a Modificar</label>
                  <input 
                    type="text" 
                    value={proveedorModificar}
                    onChange={e => setProveedorModificar(e.target.value)}
                    className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    placeholder="Ingrese el nuevo nombre del proveedor..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Sum & Action Panel */}
        <div className="bg-[#0c1938] border-t border-slate-700 px-6 py-4 flex items-center justify-between select-none">
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

          <button 
            onClick={handleGrabar}
            disabled={!loaded || saving}
            className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-[#070e1b] rounded px-5 py-2 transition-all shadow-lg shadow-emerald-950/20"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Grabar Cambios'}
          </button>
        </div>

      </div>
    </div>
  );
}
