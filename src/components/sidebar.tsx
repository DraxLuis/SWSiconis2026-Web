'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Target,
  BookMarked,
  Layers,
  FolderKanban,
  BarChart3,
  TrendingDown,
  TrendingUp,
  FileCheck,
  FolderOpen,
  FileText,
  Users,
  CreditCard,
  Building2,
  Wallet,
  ShoppingCart,
  ArrowRightLeft,
  Upload,
  FileOutput,
  Landmark,
  FileSpreadsheet,
  Settings,
  KeyRound,
  HardDrive,
  HelpCircle,
  Info,
  BookOpen,
  ScrollText,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  UserCog,
  Banknote,
  ListChecks,
  PenLine,
  CalendarDays,
  Table2,
} from 'lucide-react';
import { useState } from 'react';

/* ─────────────────────────────────────────────────────────
   NAVIGATION — limpia y optimizada para web
   Eliminado: Calculadora, Especificar Impresora, Salir
   Movido:    Autorizar período → Utilitarios
   ───────────────────────────────────────────────────────── */

interface NavItem {
  label: string;
  icon?: React.ElementType;
  href?: string;
  children?: NavItem[];
}

const navigation: { section?: string; items: NavItem[] }[] = [
  // ── PRINCIPAL ─────────────────────────────────────────
  {
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    ],
  },

  // ── TABLAS DE REFERENCIA ──────────────────────────────
  {
    section: 'Catálogos',
    items: [
      {
        label: 'Tablas',
        icon: Table2,
        children: [
          { label: 'Metas',                    icon: Target,       href: '/tablas/metas' },
          { label: 'Clasificadores',           icon: BookMarked,   href: '/tablas/clasificadores' },
          { label: 'Rubros',                   icon: Layers,       href: '/tablas/rubros' },
          { label: 'Proyectos',                icon: FolderKanban, href: '/tablas/proyectos' },
          { label: 'Programas Presupuestales', icon: BarChart3,    href: '/tablas/programas' },
        ],
      },
    ],
  },

  // ── PRESUPUESTO ───────────────────────────────────────
  {
    section: 'Presupuesto',
    items: [
      {
        label: 'Ejecución',
        icon: ListChecks,
        children: [
          { label: 'Metas',                icon: Target,       href: '/presupuesto/metas' },
          { label: 'Actividad / Proyecto', icon: FolderKanban, href: '/presupuesto/actividad-proyecto' },
          { label: 'Obras · Acc. Inv.',    icon: Building2,    href: '/presupuesto/obras' },
          { label: 'Ejecución de Ingresos', icon: TrendingUp,  href: '/ingresos' },
          { label: 'Certificaciones',      icon: FileCheck,    href: '/certificados' },
          {
            label: 'Expedientes Administrativos',
            icon: FolderOpen,
            children: [
              { label: 'Expedientes de Gastos',   icon: TrendingDown, href: '/expedientes/gastos' },
              { label: 'Expedientes de Ingresos', icon: TrendingUp,   href: '/expedientes/ingresos' },
            ],
          },
          { label: 'Act. Nombre / Proveedor', icon: PenLine,   href: '/presupuesto/actualizar' },
          { label: 'Proveedores',            icon: Users,       href: '/proveedores' },
          { label: 'Documentos de Giros',    icon: Banknote,    href: '/tablas/documentos-giros' },
        ],
      },
      {
        label: 'Programas Presupuestales',
        icon: BarChart3,
        children: [
          { label: 'Programa Presupuestal',  icon: BarChart3,    href: '/programas' },
          { label: 'Ejecución de Programas', icon: TrendingDown, href: '/programas/ejecucion' },
        ],
      },
      {
        label: 'Inversión',
        icon: Building2,
        children: [
          { label: 'Consulta de Proyectos', icon: FolderKanban, href: '/inversion' },
          { label: 'Ejecución Proyectos',   icon: TrendingDown, href: '/inversion/ejecucion' },
        ],
      },
    ],
  },

  // ── TESORERÍA / LOGÍSTICA ─────────────────────────────
  {
    section: 'Gestión',
    items: [
      {
        label: 'Tesorería',
        icon: Wallet,
        children: [
          { label: 'Comprobantes de Pago', icon: CreditCard, href: '/pagos' },
          { label: 'Cheques Girados',      icon: Banknote,   href: '/giros' },
          { label: 'Viáticos y Encargos',  icon: Wallet,     href: '/viaticos' },
        ],
      },
      {
        label: 'Logística',
        icon: ShoppingCart,
        children: [
          { label: 'Proveedores', icon: Users, href: '/logistica/proveedores' },
        ],
      },
    ],
  },

  // ── INTEGRACIÓN SIAF ──────────────────────────────────
  {
    section: 'Integración',
    items: [
      {
        label: 'Interfase SIAF',
        icon: ArrowRightLeft,
        children: [
          {
            label: 'Presupuesto',
            icon: ListChecks,
            children: [
              { label: 'Carga PIA – Ingresos', icon: Upload, href: '/interfase/pia-ingresos' },
              { label: 'Carga PIA – Gastos',   icon: Upload, href: '/interfase/pia-gastos' },
            ],
          },
          { label: 'Certificaciones',          icon: FileCheck,    href: '/interfase/certificaciones' },
          { label: 'Expedientes Ingresos',     icon: FolderOpen,   href: '/interfase/exp-ingresos' },
          { label: 'Expedientes Gastos',       icon: FolderOpen,   href: '/interfase/exp-gastos' },
          { label: 'Notas de Pago',            icon: FileText,     href: '/interfase/notas-pago' },
          { label: 'Transfer. (TXT)',          icon: FileOutput,   href: '/interfase/txt' },
          { label: 'Transfer. CtaCte BN',      icon: Landmark,     href: '/interfase/bn' },
          { label: 'Transfer. RR.OO',          icon: FileOutput,   href: '/interfase/rroo' },
        ],
      },
    ],
  },

  // ── SALIDAS / CONFIG ──────────────────────────────────
  {
    section: 'Sistema',
    items: [
      {
        label: 'Excel / Reportes',
        icon: FileSpreadsheet,
        children: [
          { label: 'Reporte Excel', icon: FileSpreadsheet, href: '/reportes' },
        ],
      },
      {
        label: 'Utilitarios',
        icon: Settings,
        children: [
          { label: 'Seleccionar Periodo',   icon: CalendarDays, href: '/utilitarios/periodo' },
          { label: 'Usuarios',              icon: UserCog,      href: '/utilitarios/usuarios' },
          { label: 'Actualizar Clave',      icon: KeyRound,     href: '/utilitarios/clave' },
          { label: 'Ruta DATA SIAF',        icon: HardDrive,    href: '/utilitarios/ruta-siaf' },
        ],
      },
      {
        label: 'Ayuda',
        icon: HelpCircle,
        children: [
          { label: 'Acerca de…',         icon: Info,       href: '/ayuda/acerca' },
          { label: 'Manual del Sistema', icon: BookOpen,   href: '/ayuda/manual' },
          { label: 'Reportes Sistema',   icon: ScrollText, href: '/ayuda/reportes' },
        ],
      },
    ],
  },
];

/* ─────────────────────────────────────────────────────────
   RECURSIVE NAV NODE
   ───────────────────────────────────────────────────────── */
function NavNode({
  item,
  level = 0,
  collapsed,
}: {
  item: NavItem;
  level?: number;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const isLeaf = !item.children?.length;
  const isActive = !!item.href && pathname === item.href;
  const hasActiveChild = !!item.children?.some(
    (c) =>
      (c.href && (pathname === c.href || pathname.startsWith(c.href + '/'))) ||
      c.children?.some((cc) => cc.href && pathname === cc.href)
  );
  const [open, setOpen] = useState(hasActiveChild);

  const Icon = item.icon;
  const baseClasses = cn(
    'flex items-center gap-3 w-full rounded-xl text-left cursor-pointer',
    'transition-all duration-200 select-none',
    level === 0 && 'px-3 py-2.5',
    level === 1 && 'px-3 py-2 pl-9',
    level === 2 && 'px-3 py-1.5 pl-14',
  );

  if (isLeaf && item.href) {
    return (
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={cn(
          baseClasses,
          isActive
            ? 'bg-[#D40000]/15 text-white border border-[#D40000]/25'
            : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
        )}
      >
        {Icon && (
          <Icon className={cn(
            'flex-shrink-0 transition-colors',
            level === 0 ? 'h-[18px] w-[18px]' : level === 1 ? 'h-4 w-4' : 'h-3.5 w-3.5',
            isActive ? 'text-[#D40000]' : 'text-slate-500'
          )} />
        )}
        {!collapsed && (
          <span className={cn(
            'flex-1 font-medium leading-tight truncate',
            level === 0 ? 'text-[15px]' : level === 1 ? 'text-[13.5px]' : 'text-[12.5px]'
          )}>
            {item.label}
          </span>
        )}
        {isActive && !collapsed && (
          <span className="h-1.5 w-1.5 rounded-full bg-[#D40000] flex-shrink-0" />
        )}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        title={collapsed ? item.label : undefined}
        className={cn(
          baseClasses,
          hasActiveChild
            ? 'text-white'
            : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
        )}
      >
        {Icon && (
          <Icon className={cn(
            'flex-shrink-0 transition-colors',
            level === 0 ? 'h-[18px] w-[18px]' : 'h-4 w-4',
            hasActiveChild ? 'text-[#D40000]' : 'text-slate-500'
          )} />
        )}
        {!collapsed && (
          <>
            <span className={cn(
              'flex-1 font-semibold leading-tight truncate',
              level === 0 ? 'text-[15px]' : 'text-[13.5px]'
            )}>
              {item.label}
            </span>
            {open
              ? <ChevronDown className="h-4 w-4 text-slate-500 flex-shrink-0" />
              : <ChevronRight className="h-4 w-4 text-slate-500 flex-shrink-0" />
            }
          </>
        )}
      </button>

      {open && !collapsed && item.children && (
        <div className={cn(
          'mt-0.5 space-y-0.5 animate-fade-in',
          level === 0 && 'border-l border-white/[0.06] ml-6',
          level === 1 && 'border-l border-white/[0.04] ml-10',
        )}>
          {item.children.map((child) => (
            <NavNode key={child.label} item={child} level={level + 1} collapsed={collapsed} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SIDEBAR
   ───────────────────────────────────────────────────────── */
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside className={cn(
      'fixed left-0 top-[72px] bottom-0 z-40 flex flex-col',
      'border-r border-white/[0.06] bg-[#020D1C]/98 backdrop-blur-2xl',
      'transition-all duration-300 ease-in-out',
      collapsed ? 'w-[68px]' : 'w-[268px]'
    )}>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className={cn(
          'absolute -right-3 top-5 z-50',
          'h-6 w-6 rounded-full flex items-center justify-center',
          'bg-[#061527] border border-white/[0.08] text-slate-400',
          'hover:text-white hover:bg-[#D40000] hover:border-[#D40000] hover:shadow-[0_0_12px_rgba(212,0,0,0.45)]',
          'transition-all duration-200 cursor-pointer'
        )}
      >
        <ChevronLeft className={cn(
          'h-3.5 w-3.5 transition-transform duration-300',
          collapsed && 'rotate-180'
        )} />
      </button>

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden pt-14 pb-4 px-3 space-y-1">
        {navigation.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-2' : ''}>

            {/* Section label */}
            {group.section && !collapsed && (
              <div className="px-3 pt-4 pb-1.5">
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-600">
                  {group.section}
                </p>
                <div className="mt-1.5 h-px bg-white/[0.05]" />
              </div>
            )}
            {group.section && collapsed && (
              <div className="mx-auto my-3 h-px w-8 bg-white/[0.08]" />
            )}

            {/* Items */}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavNode key={item.label} item={item} level={0} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="mx-3 mb-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#D40000] to-[#8B0000] flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-[11px] font-black text-white tracking-tight">TL</span>
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-sm font-bold text-white truncate">Team Libera</p>
            <p className="text-xs text-slate-500 truncate">Sistemas Informáticos</p>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="mx-auto mb-4">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#D40000] to-[#8B0000] flex items-center justify-center">
            <span className="text-[11px] font-black text-white">TL</span>
          </div>
        </div>
      )}
    </aside>
  );
}
