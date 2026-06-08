'use client';

import { useState } from 'react';
import { 
  ScrollText, 
  Search, 
  ChevronRight, 
  FileSpreadsheet, 
  BookOpen, 
  Activity, 
  Database, 
  Info,
  Calendar,
  Grid,
  Sparkles
} from 'lucide-react';

interface ReportDetail {
  id: string;
  label: string;
  category: 'presupuestal' | 'certificaciones' | 'tesoreria';
  description: string;
  targetTables: string[];
  columns: { name: string; desc: string }[];
  useCase: string;
}

export default function ReportesHelpPage() {
  const [activeTab, setActiveTab] = useState<'catalogo' | 'glosario' | 'motor'>('catalogo');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportId, setSelectedReportId] = useState<string>('ejecucion_metas');
  const [hoveredTerm, setHoveredTerm] = useState<string | null>(null);

  const reports: ReportDetail[] = [
    {
      id: 'ejecucion_metas',
      label: 'Ejecución - Metas',
      category: 'presupuestal',
      description: 'Reporte consolidado de ejecución del presupuesto institucional agrupado a nivel de Meta Presupuestaria.',
      targetTables: ['[meta]', '[ejecucion_gasto]'],
      useCase: 'Permite a la Oficina de Presupuesto monitorear rápidamente el porcentaje de avance de cada una de las metas autorizadas de la municipalidad.',
      columns: [
        { name: 'CÓDIGO', desc: 'Código de la Meta Presupuestaria (sec_func).' },
        { name: 'NOMBRE', desc: 'Nombre o finalidad del proyecto/actividad de la meta.' },
        { name: 'PIA', desc: 'Presupuesto Inicial de Apertura asignado al inicio del año.' },
        { name: 'MODIF', desc: 'Modificaciones presupuestales acumuladas (créditos o anulaciones).' },
        { name: 'PIM', desc: 'Presupuesto Institucional Modificado (PIA + MODIF).' },
        { name: 'CERTIF', desc: 'Monto acumulado con certificaciones de gasto aprobadas.' },
        { name: 'CPANUA', desc: 'Compromiso anual aprobado para las metas asociadas.' },
        { name: 'ATCP', desc: 'Compromiso mensual devengado acumulado o regularizado.' },
        { name: 'DEVENGADO', desc: 'Fase devengada acumulada en el año fiscal.' },
        { name: 'GIRADO', desc: 'Fase girada acumulada (desembolsos bancarios/cheques).' },
        { name: 'SALDO', desc: 'Saldo por devengar del PIM (PIM - DEVENGADO).' },
        { name: 'AVANCE', desc: 'Porcentaje físico/financiero ejecutado (DEVENGADO / PIM).' }
      ]
    },
    {
      id: 'certificado',
      label: 'Certificado (Resumen)',
      category: 'certificaciones',
      description: 'Resumen ejecutivo de los saldos de cada una de las certificaciones de gasto anuales emitidas.',
      targetTables: ['[certificado]', '[meta]', '[clasificador]'],
      useCase: 'Utilizado para verificar qué porción de una certificación presupuestaria anual ya ha sido comprometida formalmente.',
      columns: [
        { name: 'AÑO_EJE', desc: 'Año de ejecución del certificado.' },
        { name: 'CERTIF', desc: 'Número correlativo del documento de certificación SIAF.' },
        { name: 'SEC_FUNC', desc: 'Meta presupuestaria a la cual se imputó el certificado.' },
        { name: 'RUBRO', desc: 'Rubro o fuente de financiamiento asociada.' },
        { name: 'CLASIF', desc: 'Código y descripción del clasificador de gasto de la certificación.' },
        { name: 'CERTIFICADO', desc: 'Monto total aprobado en la etapa de Certificación.' },
        { name: 'COMPROMISO', desc: 'Monto total anual comprometido (Compromiso Anual).' },
        { name: 'SALDO', desc: 'Saldo pendiente por comprometer (Certificación - Compromiso).' }
      ]
    },
    {
      id: 'data_certificados',
      label: 'Data Certificados (Completo)',
      category: 'certificaciones',
      description: 'Reporte a nivel transaccional detallado con el historial cronológico completo de certificaciones y compromisos.',
      targetTables: ['[certificado]', '[meta]', '[clasificador]'],
      useCase: 'Auditoría detallada de todos los movimientos de documentos, secuencias y correlativos de las fases previas del gasto.',
      columns: [
        { name: 'CERTIF', desc: 'Número del documento de certificación.' },
        { name: 'SECUENCIA', desc: 'Secuencia del registro SIAF.' },
        { name: 'CORRELAT', desc: 'Correlativo interno del movimiento de modificación.' },
        { name: 'COD_DOC / NUM_DOC', desc: 'Tipo y número de documento administrativo que sustenta la operación.' },
        { name: 'FECHA_DOC', desc: 'Fecha de emisión del documento sustentatorio.' },
        { name: 'PROVEEDOR', desc: 'RUC o DNI y razón social del proveedor adjudicado.' },
        { name: 'CLASIF_NOMBRE', desc: 'Nombre del clasificador de gasto afectado.' },
        { name: 'MONTO', desc: 'Monto de la transacción específica del correlativo.' },
        { name: 'TIPO_REG / EST_REG', desc: 'Tipo de registro presupuestario y estado de transmisión (Aprobado, Pendiente).' }
      ]
    },
    {
      id: 'data_devengados',
      label: 'Data Devengados',
      category: 'tesoreria',
      description: 'Listado analítico y cronológico de todas las operaciones que han alcanzado la fase de Devengado.',
      targetTables: ['[expedientes_gastos_2026]'],
      useCase: 'Control del área de Contabilidad para verificar las obligaciones de pago pendientes de giro.',
      columns: [
        { name: 'EXPEDIENTE', desc: 'Número de expediente SIAF.' },
        { name: 'SECUENCIA', desc: 'Secuencia de la fase de gasto.' },
        { name: 'CLASIF', desc: 'Clasificador presupuestal asociado.' },
        { name: 'SEC_FUNC', desc: 'Meta presupuestaria a la que pertenece el gasto.' },
        { name: 'RUBRO', desc: 'Fuente de financiamiento.' },
        { name: 'MONTO', desc: 'Monto de la fase devengada.' },
        { name: 'PROVEEDOR', desc: 'Nombre del beneficiario u operador económico.' },
        { name: 'NOTAS / GLOSA', desc: 'Descripción del concepto del devengado (bienes, servicios u obras).' }
      ]
    },
    {
      id: 'data_girados',
      label: 'Data Girados (Cheques)',
      category: 'tesoreria',
      description: 'Historial detallado de todas las transacciones giradas y cheques o cartas orden emitidas.',
      targetTables: ['[expedientes_gastos_2026]'],
      useCase: 'Monitoreo diario de la Oficina de Tesorería para conciliar bancos y emitir reportes de pagos efectuados.',
      columns: [
        { name: 'EXPEDIENTE', desc: 'Número de expediente SIAF asignado.' },
        { name: 'DOCUMENTO', desc: 'Tipo y número de documento de pago (Cheque, Carta Orden, Transferencia CCI).' },
        { name: 'BANCO', desc: 'Código de la entidad financiera giradora.' },
        { name: 'CUENTA CORRIENTE', desc: 'Número de cuenta corriente de la municipalidad.' },
        { name: 'MONTO', desc: 'Monto neto girado y cargado a la cuenta.' },
        { name: 'PROVEEDOR', desc: 'Identificación y nombre del beneficiario del cheque.' },
        { name: 'GLOSA', desc: 'Explicación del gasto o concepto del pago de tesorería.' }
      ]
    },
    {
      id: 'ejecucion_activ_obra_accinv',
      label: 'Ejecución Actividad / Obra',
      category: 'presupuestal',
      description: 'Resumen del avance presupuestario clasificando los gastos por componentes operativos o infraestructura.',
      targetTables: ['[meta]', '[ejecucion_gasto]'],
      useCase: 'Permite aislar la ejecución de "Actividades" (gasto corriente) frente a la de "Obras" o "Proyectos de Inversión".',
      columns: [
        { name: 'CÓDIGO', desc: 'Código del componente funcional o de inversión (actobracin).' },
        { name: 'NOMBRE', desc: 'Nombre descriptivo de la actividad u obra pública.' },
        { name: 'PIA', desc: 'Presupuesto inicial asignado.' },
        { name: 'PIM', desc: 'Presupuesto modificado vigente.' },
        { name: 'DEVENGADO', desc: 'Avance ejecutado acumulado.' },
        { name: 'GIRADO', desc: 'Monto efectivamente pagado.' }
      ]
    },
    {
      id: 'ejecucion_actproy',
      label: 'Ejecución Actividad / Proyecto',
      category: 'presupuestal',
      description: 'Reporte ejecutivo a nivel de Actividad y Proyecto de Inversión Pública (PIP).',
      targetTables: ['[meta]', '[ejecucion_gasto]'],
      useCase: 'Control estratégico para reportar a la Contraloría y Ministerio de Economía el avance de proyectos de inversión.',
      columns: [
        { name: 'CÓDIGO', desc: 'Código de la actividad o proyecto de inversión (PIP).' },
        { name: 'NOMBRE', desc: 'Denominación de la obra, proyecto o actividad.' },
        { name: 'PIM', desc: 'Presupuesto modificado del proyecto.' },
        { name: 'CERTIFICADO', desc: 'Monto certificado para la licitación/adjudicación.' },
        { name: 'DEVENGADO', desc: 'Gastos devengados correspondientes a valorizaciones de obra.' }
      ]
    },
    {
      id: 'ejecucion_ppto',
      label: 'Ejecución Programa Presupuestal',
      category: 'presupuestal',
      description: 'Reporte agregado por Categoría o Programa Presupuestal (PP) conforme al esquema MEF.',
      targetTables: ['[meta]', '[ejecucion_gasto]'],
      useCase: 'Evaluación del Presupuesto por Resultados (PpR) de la Municipalidad Provincial de Huancabamba.',
      columns: [
        { name: 'CÓDIGO', desc: 'Código del Programa Presupuestario (por ejemplo, 0030, 0083, 9001, etc.).' },
        { name: 'PROGRAMA', desc: 'Descripción de la categoría o programa presupuestario.' },
        { name: 'PIM', desc: 'Presupuesto institucional modificado asignado al programa.' },
        { name: 'DEVENGADO', desc: 'Devengado total registrado bajo ese programa.' },
        { name: 'AVANCE', desc: 'Porcentaje general de ejecución del programa presupuestario.' }
      ]
    },
    {
      id: 'ejecucion_metas_clasificador',
      label: 'Metas por Clasificador (Detallado)',
      category: 'presupuestal',
      description: 'El reporte presupuestal de máxima granularidad que asocia cada meta a sus partidas específicas de gasto.',
      targetTables: ['[meta]', '[ejecucion_gasto]', '[clasificador]'],
      useCase: 'Análisis minucioso por cada jefe de área o proyecto para revisar qué clasificadores específicos (ej. útiles, combustibles) se están gastando.',
      columns: [
        { name: 'META', desc: 'Número de meta funcional.' },
        { name: 'CLASIFICADOR', desc: 'Cadena del clasificador presupuestal (ej. 2.3.1 5.1 2).' },
        { name: 'DESCRIPCIÓN', desc: 'Nombre específico de la partida o insumo según el catálogo MEF.' },
        { name: 'PIM', desc: 'Techo presupuestal de la partida en la meta.' },
        { name: 'DEVENGADO', desc: 'Monto devengado de esa partida específica.' },
        { name: 'SALDO', desc: 'Presupuesto libre remanente de la partida.' }
      ]
    },
    {
      id: 'programa_accion_inversion',
      label: 'Programa Acción de Inversión',
      category: 'presupuestal',
      description: 'Resumen ejecutivo enfocado de forma exclusiva en los Proyectos y Acciones de Inversión (Componentes 4 y 5).',
      targetTables: ['[expedientes_gastos_2026]', '[meta]'],
      useCase: 'Seguimiento por parte de la Gerencia de Infraestructura y Desarrollo Urbano sobre el presupuesto y devengados de obras.',
      columns: [
        { name: 'COMPONENTE', desc: 'Código del componente presupuestario de inversión.' },
        { name: 'PROYECTO', desc: 'Denominación del proyecto de inversión pública.' },
        { name: 'PIA / PIM', desc: 'Límites de recursos iniciales y modificados.' },
        { name: 'DEVENGADO', desc: 'Monto total invertido y valorizado.' },
        { name: 'SALDO / AVANCE', desc: 'Indicadores de saldo disponible y eficiencia financiera del proyecto.' }
      ]
    }
  ];

  const glossaryTerms = [
    { code: 'PIA', name: 'Presupuesto Inicial de Apertura', desc: 'Es el presupuesto aprobado por el Concejo Municipal antes de comenzar el año fiscal, basado en la estimación de ingresos y prioridades de gasto asignadas.' },
    { code: 'PIM', name: 'Presupuesto Institucional Modificado', desc: 'El presupuesto actualizado que resulta de sumar al PIA todas las modificaciones presupuestarias aprobadas (incorporación de saldos de balance, transferencias o créditos suplementarios).' },
    { code: 'CERTIFICADO', name: 'Certificación Presupuestaria', desc: 'Fase administrativa que garantiza la existencia de crédito presupuestario disponible y suficiente para comprometer un gasto específico en una licitación o adquisición.' },
    { code: 'COMPROMISO', name: 'Compromiso Anual / Mensual', desc: 'Fase del gasto donde se formaliza una relación jurídica con un proveedor específico tras una licitación, orden de compra o servicio, reservando formalmente el saldo certificado.' },
    { code: 'DEVENGADO', name: 'Devengado presupuestal', desc: 'Fase crucial donde se reconoce la obligación de pago al acreditarse la entrega de bienes, la prestación de servicios o la valorización de obras de forma conforme.' },
    { code: 'GIRADO', name: 'Girado presupuestal', desc: 'Fase final de tesorería en la cual se ordena el pago de la obligación devengada, ya sea emitiendo un cheque físico, una transferencia CCI o una orden de pago directa.' },
    { code: 'RUBRO', name: 'Fuente de Financiamiento / Rubro', desc: 'Clasificación de los recursos monetarios que financian el gasto (ej. Foncomun, Canon y Sobrecanon, Recursos Directamente Recaudados).' },
    { code: 'SEC_FUNC', name: 'Secuencia Funcional (Meta)', desc: 'Identificador único numérico (habitualmente de 4 dígitos) asignado a cada meta del presupuesto institucional para rastrear actividades específicas.' }
  ];

  const filteredReports = reports.filter(r => 
    r.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedReport = reports.find(r => r.id === selectedReportId) || reports[0];

  return (
    <div className="w-full space-y-6 animate-fade-in text-slate-100">
      {/* Window Wrapper */}
      <div className="w-full rounded-xl border border-slate-700 bg-[#070e1b]/90 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col">
        {/* Window Top Title */}
        <div className="bg-[#0c1938] border-b border-slate-700 px-4 py-2.5 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-[#D40000]" />
            <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
              Ayuda &gt; Reportes del Sistema
            </span>
          </div>
          <div className="text-xs font-bold text-[#3b82f6] bg-blue-950/40 border border-blue-900/60 rounded px-2.5 py-0.5 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            xlsx-js-style Engine active
          </div>
        </div>

        {/* Tab Controls */}
        <div className="border-b border-white/[0.04] bg-white/[0.01] px-6 py-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2">
            {[
              { id: 'catalogo', label: 'Catálogo de Reportes', icon: FileSpreadsheet },
              { id: 'glosario', label: 'Glosario Presupuestal', icon: BookOpen },
              { id: 'motor', label: 'Motor de Exportación', icon: Database },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'catalogo' | 'glosario' | 'motor')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#D40000] border-[#D40000] text-white shadow-lg shadow-[#D40000]/25'
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'catalogo' && (
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filtrar reportes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-950/50 border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#D40000]/60 placeholder-slate-500 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Dynamic Tab Content */}
        <div className="p-6 md:p-8 flex-1 min-h-[500px]">
          {/* TAB 1: CATALOGUE OF EXCEL REPORTS */}
          {activeTab === 'catalogo' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left sidebar: Reports list */}
              <div className="lg:col-span-4 space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {filteredReports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReportId(report.id)}
                    className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      selectedReportId === report.id
                        ? 'bg-[#D40000]/10 border-[#D40000]/40 text-white'
                        : 'bg-white/[0.005] border-white/[0.04] hover:bg-white/[0.02] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        selectedReportId === report.id ? 'bg-[#D40000]/25 text-[#D40000]' : 'bg-slate-950/40 text-slate-500'
                      }`}>
                        <FileSpreadsheet className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-xs truncate leading-snug">{report.label}</p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{report.id}.xlsx</p>
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 flex-shrink-0 ${selectedReportId === report.id ? 'text-[#D40000]' : 'text-slate-700'}`} />
                  </button>
                ))}
              </div>

              {/* Right content: Report detail preview */}
              <div className="lg:col-span-8 bg-slate-950/30 border border-white/[0.04] rounded-2xl p-6 space-y-6">
                {/* Title & Badge */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      {selectedReport.label}
                      <span className="text-[9px] font-bold font-mono text-slate-500 uppercase px-2 py-0.5 bg-white/[0.04] border border-white/[0.08] rounded">
                        ID: {selectedReport.id}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedReport.description}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${
                    selectedReport.category === 'presupuestal' 
                      ? 'bg-blue-950/30 text-[#3b82f6] border-blue-900/40' 
                      : selectedReport.category === 'certificaciones' 
                        ? 'bg-amber-950/30 text-amber-400 border-amber-900/40'
                        : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40'
                  }`}>
                    {selectedReport.category}
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Tablas de Origen SIAF</h4>
                    <div className="flex gap-2 flex-wrap">
                      {selectedReport.targetTables.map((tbl, idx) => (
                        <span key={idx} className="font-mono bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-300">
                          {tbl}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Caso de Uso</h4>
                    <p className="text-slate-300 leading-relaxed bg-white/[0.01] border border-white/[0.03] p-2.5 rounded-lg">
                      {selectedReport.useCase}
                    </p>
                  </div>
                </div>

                {/* Columns Definition List */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Grid className="h-3.5 w-3.5 text-slate-500" />
                    Estructura de Columnas en Excel
                  </h4>
                  <div className="border border-white/[0.06] rounded-xl overflow-hidden bg-slate-950/50">
                    <div className="grid grid-cols-12 bg-white/[0.03] border-b border-white/[0.06] px-4 py-2 font-bold text-[10px] text-slate-400 uppercase">
                      <span className="col-span-4">Columna</span>
                      <span className="col-span-8">Descripción / Significado</span>
                    </div>
                    <div className="divide-y divide-white/[0.04] text-xs max-h-[200px] overflow-y-auto">
                      {selectedReport.columns.map((col, idx) => (
                        <div key={idx} className="grid grid-cols-12 px-4 py-2.5 hover:bg-white/[0.01] transition-colors">
                          <span className="col-span-4 font-mono font-bold text-slate-200">{col.name}</span>
                          <span className="col-span-8 text-slate-400 leading-normal">{col.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BUDGETARY GLOSSARY */}
          {activeTab === 'glosario' && (
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <h2 className="text-lg font-black text-white">Diccionario Presupuestal SICONIS</h2>
                <p className="text-xs text-slate-400">
                  Definiciones oficiales e interpretación de los términos y acrónimos del SIAF configurados en las hojas de cálculo. Pase el cursor o haga clic sobre cada tarjeta para destacar.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                {glossaryTerms.map((term, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredTerm(term.code)}
                    onMouseLeave={() => setHoveredTerm(null)}
                    className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                      hoveredTerm === term.code
                        ? 'bg-slate-950 border-[#D40000]/60 shadow-lg shadow-[#D40000]/5 translate-y-[-2px]'
                        : 'bg-white/[0.005] border-white/[0.04]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
                        <span className="font-mono text-base font-black text-white tracking-tight">{term.code}</span>
                        <Info className={`h-4 w-4 ${hoveredTerm === term.code ? 'text-[#D40000]' : 'text-slate-600'}`} />
                      </div>
                      <h4 className="font-bold text-slate-300 text-xs mt-3">{term.name}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-2">
                        {term.desc}
                      </p>
                    </div>
                    {/* Subtle aesthetic backdrop light */}
                    <div className="absolute -right-6 -bottom-6 text-slate-900/10 font-bold font-mono text-6xl pointer-events-none select-none">
                      {term.code}
                    </div>
                  </div>
                ))}
              </div>

              {/* Formula Panel */}
              <div className="mt-8 bg-slate-950/50 border border-white/[0.04] rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
                <div className="h-12 w-12 rounded-xl bg-blue-950/50 flex items-center justify-center text-[#3b82f6] flex-shrink-0">
                  <Activity className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">Fórmula de Ejecución del PIM</h4>
                  <p className="text-xs text-slate-400">
                    El sistema calcula de forma dinámica: <code className="font-mono bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-emerald-400">Saldo = PIM - Devengado</code> y la tasa de ejecución <code className="font-mono bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-[#3b82f6]">Avance % = (Devengado / PIM) * 100</code>. El devengado representa el consumo contable final ejecutado y el girado el desembolso financiero real.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EXPORT ENGINE SPECS */}
          {activeTab === 'motor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              {/* Engine Spec card */}
              <div className="bg-slate-950/30 border border-white/[0.04] rounded-2xl p-6 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-950/40 border border-emerald-900/40 flex items-center justify-center text-emerald-400">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Fidelidad Visual SICONIS (VFP)</h3>
                      <p className="text-[10px] text-slate-500">xlsx-js-style Integration</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-300 leading-relaxed">
                    SICONIS Web implementa un motor avanzado de formateo de hojas de cálculo compatible con el estilo original heredado de Visual FoxPro. Cada descarga respeta de manera exacta:
                  </p>

                  <ul className="text-xs text-slate-400 space-y-2.5 list-disc pl-4">
                    <li><strong className="text-slate-200">Tipografía Especializada:</strong> Renderizado por defecto en fuentes profesionales condensadas (<code className="font-mono">Arial Narrow</code>) para máxima compactación de datos numéricos.</li>
                    <li><strong className="text-slate-200">Fórmulas Dinámicas:</strong> En lugar de valores sumados estáticos, las filas de totales utilizan fórmulas dinámicas <code className="font-mono">SUBTOTAL(9, ...)</code> de Excel. Esto permite filtrar los datos descargados sin alterar la corrección matemática de las sumatorias.</li>
                    <li><strong className="text-slate-200">Ajuste Dinámico de Columnas:</strong> Cálculo automático del ancho de celdas basado en la longitud máxima de textos para evitar el error común <code className="font-mono">###</code> en campos numéricos y descripciones.</li>
                    <li><strong className="text-slate-200">Estilos de Cabecera Oficiales:</strong> Bordes de caja gruesos, dobles líneas inferiores de totalización contable y fondos de celda de contraste.</li>
                  </ul>
                </div>

                <div className="text-[10px] text-slate-500 border-t border-white/[0.04] pt-4">
                  Desarrollado para asegurar consistencia e interoperabilidad de reportes en la administración pública.
                </div>
              </div>

              {/* Quick Tech Specs */}
              <div className="border border-white/[0.06] rounded-2xl overflow-hidden bg-slate-950/20 flex flex-col">
                <div className="bg-white/[0.03] px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Database className="h-4 w-4 text-slate-400" />
                    Metadata y Métricas del Motor
                  </h3>
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Engine Specs</span>
                </div>
                
                <div className="flex-1 divide-y divide-white/[0.04] text-xs">
                  <div className="p-4 flex justify-between items-center bg-[#070e1b]">
                    <span className="text-slate-400 font-medium">Líneas de cuadrícula:</span>
                    <span className="font-mono text-slate-300">Ocultas por defecto (estética limpia)</span>
                  </div>
                  <div className="p-4 flex justify-between items-center bg-[#070e1b]">
                    <span className="text-slate-400 font-medium">Límite de registros:</span>
                    <span className="font-mono text-slate-300">Sin límite físico (paginado automático)</span>
                  </div>
                  <div className="p-4 flex justify-between items-center bg-[#070e1b]">
                    <span className="text-slate-400 font-medium">Formato numérico contable:</span>
                    <span className="font-mono text-slate-300">&quot;#,##0.00&quot; (dos decimales y separador de miles)</span>
                  </div>
                  <div className="p-4 flex justify-between items-center bg-[#070e1b]">
                    <span className="text-slate-400 font-medium">Compresión de archivo:</span>
                    <span className="font-mono text-[#3b82f6] font-bold">ZIP64 (Alta compresión activa)</span>
                  </div>
                  <div className="p-4 flex justify-between items-center bg-[#070e1b]">
                    <span className="text-slate-400 font-medium">Compatibilidad:</span>
                    <span className="font-mono text-slate-300">Excel 97+, LibreOffice, Google Sheets</span>
                  </div>
                  <div className="p-4 flex justify-between items-center bg-[#070e1b]">
                    <span className="text-slate-400 font-medium">Frecuencia de sincronización:</span>
                    <span className="font-mono text-emerald-400 font-bold">Tiempo Real / Conexión Híbrida SIAF</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info box */}
        <div className="flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 p-6 border-t border-white/[0.04] bg-white/[0.005]">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span>Consultas interactivas para el período SIAF fiscal vigente.</span>
          </div>
          <div className="mt-2 md:mt-0 flex items-center gap-4">
            <span className="text-[10px] text-slate-500 font-mono">SICONIS SWS-2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
