'use client';

import { useState } from 'react';
import { BookOpen, Search, ChevronRight, ChevronDown, Target, BarChart3, HelpCircle, Layers, Settings, FileSpreadsheet, Wallet } from 'lucide-react';

interface ManualTopic {
  id: string;
  category: string;
  title: string;
  icon: React.ElementType;
  summary: string;
  content: string[];
}

export default function ManualPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedTopic, setExpandedTopic] = useState<string | null>('intro');

  const topics: ManualTopic[] = [
    {
      id: 'intro',
      category: 'general',
      title: '1. Introducción y Acceso al Sistema',
      icon: HelpCircle,
      summary: 'Aspectos generales de SICONIS y cómo navegar por la plataforma.',
      content: [
        'SICONIS 2026 es el sistema web oficial para la consulta de información presupuestal e institucional de la Municipalidad Provincial de Huancabamba.',
        'La plataforma está sincronizada directamente con las tablas del SIAF (Sistema Integrado de Administración Financiera), consolidando información de ingresos, gastos, viáticos, giros y comprobantes en una interfaz web rápida y amigable.',
        'Para navegar, utilice el panel lateral (Sidebar). Puede expandir o colapsar el menú lateral con el botón de flecha en el borde derecho del menú. Las secciones están divididas de forma lógica en: Catálogos, Presupuesto, Gestión, Integración y Sistema.'
      ]
    },
    {
      id: 'dashboard',
      category: 'presupuesto',
      title: '2. Dashboard de Control Presupuestal',
      icon: BarChart3,
      summary: 'Cómo interpretar los gráficos y los indicadores clave del sistema.',
      content: [
        'La pantalla de inicio (Dashboard) muestra un resumen global de los recursos financieros del año fiscal actual.',
        'Tarjetas de Indicadores: Muestra el consolidado de PIA (Presupuesto Inicial de Apertura), PIM (Presupuesto Modificado), Monto Certificado, Compromisos Anuales, Devengados y Girados.',
        'Gráfico de Barras Interactivo: Presenta una comparativa mes a mes del Devengado frente al Girado, facilitando el análisis visual del ritmo de ejecución de gastos.',
        'Filtros Superiores: Puede filtrar todo el dashboard seleccionando un Rubro específico (por ejemplo, 07 FONCOMUN o 08 Impuestos Municipales) o ingresando el código del clasificador de gasto para profundizar en un sector.'
      ]
    },
    {
      id: 'catalogos',
      category: 'general',
      title: '3. Consulta de Catálogos y Tablas',
      icon: Layers,
      summary: 'Uso de las tablas de consulta de Metas, Clasificadores y Rubros.',
      content: [
        'En la sección "Catálogos > Tablas", el usuario puede buscar códigos de referencia y descripciones del clasificador del gasto público.',
        'Metas: Mapea cada meta presupuestaria de la municipalidad, detallando su código funcional (`sec_func`), finalidad y estado.',
        'Clasificadores: Permite buscar y navegar a través del catálogo de clasificadores de gastos e ingresos SIAF.',
        'Rubros y Programas: Tablas de correspondencia rápida para identificar las fuentes de financiamiento vigentes.'
      ]
    },
    {
      id: 'consultas',
      category: 'presupuesto',
      title: '4. Consultas y Detalle de Expedientes',
      icon: Target,
      summary: 'Búsqueda de expedientes SIAF de gastos, ingresos e inversión.',
      content: [
        'SICONIS agrupa y organiza la base de expedientes SIAF en interfaces interactivas de maestro-detalle.',
        'Expedientes de Gastos: Permite buscar expedientes de gasto por número, mes de ejecución o proveedor. Al seleccionar un expediente de la lista superior, la parte inferior cargará de forma automática su detalle clasificador por clasificador.',
        'Certificaciones y Notas de Pago: Módulo interactivo para examinar el detalle de movimientos de certificaciones anuales (`MTO_CERTIF` y `MTO_CPANUA`).'
      ]
    },
    {
      id: 'tesoreria',
      category: 'gestion',
      title: '5. Gestión de Tesorería y Viáticos',
      icon: Wallet,
      summary: 'Control de viáticos, comprobantes de pago y cheques girados.',
      content: [
        'Comprobantes de Pago: Detalle cronológico de todos los comprobantes emitidos asociados a las fases de pago presupuestal.',
        'Cheques Girados: Detalle de cheques con su respectivo estado de cobro, banco y número de cuenta corriente.',
        'Viáticos y Encargos: Control y seguimiento individualizado de encargos de viáticos por expediente. El sistema calcula automáticamente el saldo pendiente comparando el monto girado frente a las devoluciones y rendiciones registradas en la base de datos.'
      ]
    },
    {
      id: 'interfase',
      category: 'integracion',
      title: '6. Interfase e Integración SIAF',
      icon: Settings,
      summary: 'Ejecución de carga y sincronización de datos presupuestarios.',
      content: [
        'Los módulos de la sección "Integración" son operados únicamente por personal autorizado para actualizar la información local.',
        'Carga PIA e Ingresos / Gastos: Lee directamente los archivos SIAF (.DBF o SQL Server) y carga los saldos iniciales del presupuesto institucional y metas.',
        'Carga de Certificaciones y Expedientes: Procesa y sincroniza los movimientos diarios de la base de datos SIAF para reflejarlos en la web.',
        'Ruta DATA SIAF: En la sección utilitarios, permite configurar la ruta de red de los archivos DBF del servidor SIAF local.'
      ]
    },
    {
      id: 'excel',
      category: 'gestion',
      title: '7. Exportación a Excel y Reportes',
      icon: FileSpreadsheet,
      summary: 'Generación de hojas de cálculo de alta fidelidad compatibles con el sistema FoxPro.',
      content: [
        'Casi todos los módulos de SICONIS contienen un botón con el ícono de Excel para descargar reportes.',
        'Los reportes generados respetan de forma estricta los estilos y formatos del sistema FoxPro tradicional (fuente Arial Narrow, cabeceras con bordes específicos, filas de totales con fórmulas SUBTOTAL, etc.).',
        'Líneas de cuadrícula: Los reportes tienen ocultas las líneas de cuadrícula predeterminadas de Excel por diseño estético del cliente.',
        'Cálculos y Fórmulas: El totalizador final se genera utilizando fórmulas dinámicas (`SUBTOTAL(9, ...)`) en lugar de texto estático, permitiendo realizar filtros interactivos sobre el archivo descargado sin perder la suma de los totales.'
      ]
    }
  ];

  // Filters
  const filteredTopics = topics.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.content.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Window Wrapper */}
      <div className="w-full rounded-xl border border-slate-700 bg-[#070e1b]/90 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col">
        {/* Window Top Title */}
        <div className="bg-[#0c1938] border-b border-slate-700 px-4 py-2.5 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#D40000]" />
            <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
              Ayuda &gt; Manual del Sistema
            </span>
          </div>
          <div className="text-xs font-bold text-[#3b82f6] bg-blue-950/40 border border-blue-900/60 rounded px-2.5 py-0.5">
            Guía de Usuario
          </div>
        </div>

        {/* Toolbar controls */}
        <div className="p-4 md:p-6 border-b border-white/[0.04] bg-white/[0.01] flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar en el manual..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/50 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#D40000]/60 placeholder-slate-500 transition-colors"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 flex-wrap justify-center">
            {[
              { id: 'all', label: 'Todos los temas' },
              { id: 'general', label: 'General' },
              { id: 'presupuesto', label: 'Presupuesto' },
              { id: 'gestion', label: 'Gestión / Reportes' },
              { id: 'integracion', label: 'Integración SIAF' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  activeCategory === cat.id
                    ? 'bg-[#D40000] border-[#D40000] text-white shadow-md shadow-[#D40000]/20'
                    : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion List */}
        <div className="p-4 md:p-6 space-y-4 max-h-[650px] overflow-y-auto">
          {filteredTopics.length > 0 ? (
            filteredTopics.map((t) => {
              const Icon = t.icon;
              const isExpanded = expandedTopic === t.id;
              return (
                <div
                  key={t.id}
                  className={`rounded-xl border transition-all ${
                    isExpanded 
                      ? 'bg-white/[0.02] border-[#D40000]/30 shadow-lg' 
                      : 'bg-white/[0.005] border-white/[0.04] hover:bg-white/[0.015]'
                  }`}
                >
                  {/* Topic Title / Header */}
                  <button
                    onClick={() => setExpandedTopic(isExpanded ? null : t.id)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left select-none cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                        isExpanded ? 'bg-[#D40000]/15 text-[#D40000]' : 'bg-slate-950/40 text-slate-400'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="font-bold text-white text-[15px] leading-snug">{t.title}</h3>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{t.summary}</p>
                      </div>
                    </div>
                    <div>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-slate-600" />
                      )}
                    </div>
                  </button>

                  {/* Topic Content Body */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-white/[0.04] text-sm text-slate-300 space-y-4 leading-relaxed animate-fade-in">
                      {t.content.map((paragraph, pi) => (
                        <p key={pi}>{paragraph}</p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 space-y-3">
              <Search className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-slate-500 text-sm">No se encontraron temas para tu búsqueda.</p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                className="text-xs text-[#3b82f6] font-bold hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
