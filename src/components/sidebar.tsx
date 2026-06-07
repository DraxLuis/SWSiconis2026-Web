'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Monitor,
  CalendarDays,
  Calculator,
  Printer,
  Clock,
  LogOut,
  Table2,
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
} from 'lucide-react';
import { useState } from 'react';

/* ─────────────────────────────────────────────────────────
   NAVIGATION SCHEMA — exacto al original SICONIS
   ───────────────────────────────────────────────────────── */

interface NavItem {
  label: string;
  icon?: React.ElementType;
  href?: string;
  children?: NavItem[];
  divider?: boolean; // separador antes de este item
}

const navigation: NavItem[] = [
  // ── SISTEMA ───────────────────────────────────────────
  {
    label: 'Sistema',
    icon: Monitor,
    children: [
      { label: 'Agenda',               icon: CalendarDays, href: '/sistema/agenda' },
      { label: 'Calculadora',          icon: Calculator,   href: '/sistema/calculadora' },
      { label: 'Especificar Impresora…', icon: Printer,   href: '/sistema/impresora' },
      { label: 'Autorizar período',    icon: Clock,        href: '/sistema/autorizar-periodo' },
      { label: 'Salir',               icon: LogOut,        href: '/sistema/salir' },
    ],
  },

  // ── TABLAS ────────────────────────────────────────────
  {
    label: 'Tablas',
    icon: Table2,
    children: [
      { label: 'Metas',                     icon: Target,       href: '/tablas/metas' },
      { label: 'Clasificadores',            icon: BookMarked,   href: '/tablas/clasificadores' },
      { label: 'Rubros',                    icon: Layers,       href: '/tablas/rubros' },
      { label: 'Proyectos',                 icon: FolderKanban, href: '/tablas/proyectos' },
      { label: 'Programas Presupuestales',  icon: BarChart3,    href: '/tablas/programas' },
    ],
  },

  // ── PRESUPUESTO ───────────────────────────────────────
  {
    label: 'Presupuesto',
    icon: ListChecks,
    children: [
      { label: 'Metas',                          icon: Target,       href: '/presupuesto/metas' },
      { label: 'Actividad - Proyecto',           icon: FolderKanban, href: '/presupuesto/actividad-proyecto' },
      { label: 'Activ. Obras Acc.Inv.',          icon: Building2,    href: '/presupuesto/obras' },
      { label: 'Ejecución de Ingreso',           icon: TrendingUp,   href: '/ingresos' },
      { label: 'Certificaciones',                icon: FileCheck,    href: '/certificados' },
      {
        label: 'Expedientes Administrativos',
        icon: FolderOpen,
        children: [
          { label: 'Expedientes de Gastos',   icon: TrendingDown, href: '/gastos' },
          { label: 'Expedientes de Ingresos', icon: TrendingUp,   href: '/expedientes/ingresos' },
        ],
      },
      { label: 'Actualizar Nom., Proveedor, Glosa', icon: PenLine,    href: '/presupuesto/actualizar' },
      { label: 'Proveedores',                   icon: Users,        href: '/proveedores' },
      { label: 'Documentos de Giros',           icon: Banknote,     href: '/giros' },
    ],
  },

  // ── PROGRAMAS PRESUPUESTALES ──────────────────────────
  {
    label: 'Programas Presupuestales',
    icon: BarChart3,
    children: [
      { label: 'Programa Presupuestal', icon: BarChart3,    href: '/programas' },
      { label: 'Ejecución de Programas', icon: TrendingDown, href: '/programas/ejecucion' },
    ],
  },

  // ── INVERSIÓN ─────────────────────────────────────────
  {
    label: 'Inversión',
    icon: Building2,
    children: [
      { label: 'Consulta de Proyectos-2025', icon: FolderKanban, href: '/inversion' },
      { label: 'Ejecución Proyectos',        icon: TrendingDown,  href: '/inversion/ejecucion' },
    ],
  },

  // ── TESORERÍA ─────────────────────────────────────────
  {
    label: 'Tesorería',
    icon: Wallet,
    children: [
      { label: 'Comprobantes de Pago', icon: CreditCard,   href: '/pagos' },
      { label: 'Cheques Girados',      icon: Banknote,     href: '/giros' },
      { label: 'Viáticos y Encargos',  icon: Wallet,       href: '/viaticos' },
    ],
  },

  // ── LOGÍSTICA ─────────────────────────────────────────
  {
    label: 'Logística',
    icon: ShoppingCart,
    children: [
      { label: 'Proveedores', icon: Users, href: '/logistica/proveedores' },
    ],
  },

  // ── INTERFASE ─────────────────────────────────────────
  {
    label: 'Interfase',
    icon: ArrowRightLeft,
    children: [
      {
        label: 'Presupuesto',
        icon: ListChecks,
        children: [
          { label: 'Carga de PIA – Ingresos', icon: Upload, href: '/interfase/pia-ingresos' },
          { label: 'Carga de PIA – Gastos',   icon: Upload, href: '/interfase/pia-gastos' },
        ],
      },
      { label: 'Certificaciones',             icon: FileCheck,    href: '/interfase/certificaciones' },
      { label: 'Expedientes Ingresos',        icon: FolderOpen,   href: '/interfase/exp-ingresos' },
      { label: 'Expedientes Gastos',          icon: FolderOpen,   href: '/interfase/exp-gastos' },
      { label: 'Notas de Pago',              icon: FileText,     href: '/interfase/notas-pago' },
      { label: 'Archivo Transferencia (TXT)', icon: FileOutput,   href: '/interfase/txt' },
      { label: 'Arch. Transfer. CtaCte BN',  icon: Landmark,     href: '/interfase/bn' },
      { label: 'Arch. Transfer. RR.OO',      icon: FileOutput,   href: '/interfase/rroo' },
    ],
  },

  // ── EXCEL ─────────────────────────────────────────────
  {
    label: 'Excel',
    icon: FileSpreadsheet,
    children: [
      { label: 'Reporte Excel', icon: FileSpreadsheet, href: '/reportes' },
    ],
  },

  // ── UTILITARIOS ───────────────────────────────────────
  {
    label: 'Utilitarios',
    icon: Settings,
    children: [
      { label: 'Seleccionar Periodo',   icon: CalendarDays, href: '/utilitarios/periodo' },
      { label: 'Usuarios',              icon: UserCog,      href: '/utilitarios/usuarios' },
      { label: 'Actualiza Clave',       icon: KeyRound,     href: '/utilitarios/clave' },
      { label: 'Cambia Ruta DATA SIAF', icon: HardDrive,    href: '/utilitarios/ruta-siaf' },
    ],
  },

  // ── AYUDA ─────────────────────────────────────────────
  {
    label: 'Ayuda',
    icon: HelpCircle,
    children: [
      { label: 'Acerca de…',        icon: Info,       href: '/ayuda/acerca' },
      { label: 'Manual del Sistema', icon: BookOpen,   href: '/ayuda/manual' },
      { label: 'Reportes del Sistema', icon: ScrollText, href: '/ayuda/reportes' },
    ],
  },
];

/* ─────────────────────────────────────────────────────────
   NAV ITEM COMPONENT (recursive — soporta 3 niveles)
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
  const isLeaf = !item.children || item.children.length === 0;
  const isActive = item.href ? pathname === item.href : false;
  const hasActiveChild = !!item.children?.some(
    (c) => (c.href && (pathname === c.href || pathname.startsWith(c.href + '/'))) ||
            c.children?.some((cc) => cc.href && pathname === cc.href)
  );
  const [open, setOpen] = useState(hasActiveChild);

  // ── Leaf (link)
  if (isLeaf && item.href) {
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={cn(
          'nav-item group relative',
          level === 1 && !collapsed && 'pl-7 text-[0.72rem]',
          level === 2 && !collapsed && 'pl-10 text-[0.68rem]',
          isActive ? 'active' : ''
        )}
      >
        {Icon && (
          <Icon
            className={cn(
              'flex-shrink-0',
              level === 0 ? 'h-4 w-4' : 'h-3.5 w-3.5',
              isActive
                ? 'text-[#D40000]'
                : 'text-[#4A6080] group-hover:text-slate-300 transition-colors'
            )}
          />
        )}
        {!collapsed && (
          <span className="flex-1 truncate leading-tight">{item.label}</span>
        )}
        {isActive && (
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#D40000] rounded-l-full" />
        )}
      </Link>
    );
  }

  // ── Group (collapsible)
  const Icon = item.icon;
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        title={collapsed ? item.label : undefined}
        className={cn(
          'nav-item w-full group',
          level === 1 && !collapsed && 'pl-7 text-[0.72rem]',
          hasActiveChild && !isActive ? 'text-white' : ''
        )}
      >
        {Icon && (
          <Icon
            className={cn(
              'flex-shrink-0',
              level === 0 ? 'h-4 w-4' : 'h-3.5 w-3.5',
              hasActiveChild
                ? 'text-[#D40000]'
                : 'text-[#4A6080] group-hover:text-slate-300 transition-colors'
            )}
          />
        )}
        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">{item.label}</span>
            {open ? (
              <ChevronDown className="h-3 w-3 text-[#4A6080] flex-shrink-0" />
            ) : (
              <ChevronRight className="h-3 w-3 text-[#4A6080] flex-shrink-0" />
            )}
          </>
        )}
      </button>

      {open && !collapsed && item.children && (
        <div
          className={cn(
            'mt-0.5 space-y-0.5 animate-fade-in',
            level === 0 && 'ml-2 pl-2 border-l border-white/[0.05]',
            level === 1 && 'ml-3 pl-2 border-l border-white/[0.04]'
          )}
        >
          {item.children.map((child) => (
            <NavNode
              key={child.label}
              item={child}
              level={level + 1}
              collapsed={collapsed}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SIDEBAR COMPONENT
   ───────────────────────────────────────────────────────── */

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-14 bottom-0 z-40 flex flex-col',
        'border-r border-white/[0.05] bg-[#03101F]/95 backdrop-blur-xl',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[60px]' : 'w-[240px]'
      )}
    >
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className={cn(
          'absolute -right-3 top-6 z-50',
          'h-6 w-6 rounded-full flex items-center justify-center',
          'bg-[#0A1F35] border border-white/10 text-[#4A6080]',
          'hover:text-white hover:border-white/20 transition-all duration-200 shadow-lg'
        )}
      >
        <ChevronLeft
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-300',
            collapsed && 'rotate-180'
          )}
        />
      </button>

      {/* Nav list */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
        {navigation.map((item) => (
          <NavNode key={item.label} item={item} level={0} collapsed={collapsed} />
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-3 py-3 border-t border-white/[0.05] bg-black/20 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#D40000] to-[#8B0000] flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-[9px] font-black text-white">TL</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-white truncate">Team Libera</p>
              <p className="text-[9px] text-[#4A6080] truncate">Sistemas Informáticos</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
