'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  FileText,
  CreditCard,
  Target,
  FolderOpen,
  ClipboardCheck,
  Layers,
  ChevronDown,
  ChevronRight,
  Banknote,
  Printer,
  Building2,
  ChevronLeft,
  BarChart3,
  Wallet,
  ShoppingCart,
  GitMerge,
  Settings,
  HelpCircle,
  ArrowRightLeft
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  children?: NavItem[];
  tag?: string;
}

const navigation: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },

  {
    label: 'Presupuesto',
    icon: Layers,
    children: [
      { label: 'Ejecución de Gastos',  icon: TrendingDown, href: '/gastos' },
      { label: 'Por Meta / Func.',      icon: Target,       href: '/metas' },
      { label: 'Por Actividad / Proy.', icon: FolderOpen,   href: '/proyectos' },
      { label: 'Ejecución Ingresos',   icon: TrendingUp,   href: '/ingresos' },
      { label: 'Certificaciones',      icon: ClipboardCheck, href: '/certificados' },
      { label: 'Expedientes Gastos',   icon: FileText,     href: '/expedientes' },
    ],
  },

  {
    label: 'Prog. Presupuestales',
    icon: BarChart3,
    tag: 'Próx.',
    children: [
      { label: 'Programa Presupuestal', icon: BarChart3,   href: '/programas' },
      { label: 'Ejecución Programas',   icon: TrendingDown, href: '/programas/ejecucion' },
    ],
  },

  {
    label: 'Inversión',
    icon: Building2,
    tag: 'Próx.',
    children: [
      { label: 'Proyectos 2025',     icon: Building2,  href: '/inversion' },
      { label: 'Ejecución Proyectos', icon: TrendingDown, href: '/inversion/ejecucion' },
    ],
  },

  {
    label: 'Tesorería',
    icon: Wallet,
    children: [
      { label: 'Comprobantes de Pago', icon: CreditCard, href: '/pagos' },
      { label: 'Cheques Girados',      icon: Banknote,   href: '/giros' },
      { label: 'Viáticos y Encargos',  icon: Wallet,     href: '/viaticos', tag: 'Próx.' },
    ],
  },

  {
    label: 'Logística',
    icon: ShoppingCart,
    tag: 'Próx.',
    children: [
      { label: 'Proveedores', icon: ShoppingCart, href: '/proveedores' },
    ],
  },

  {
    label: 'Interfase SIAF',
    icon: ArrowRightLeft,
    tag: 'Próx.',
    children: [
      { label: 'Carga PIA Ingresos',  icon: TrendingUp,   href: '/interfase/pia-ing' },
      { label: 'Carga PIA Gastos',    icon: TrendingDown, href: '/interfase/pia-gas' },
      { label: 'Certificaciones',     icon: ClipboardCheck, href: '/interfase/certif' },
      { label: 'Transferencia TXT',   icon: GitMerge,     href: '/interfase/txt' },
    ],
  },

  { label: 'Reportes',   icon: Printer,   href: '/reportes' },
  { label: 'Utilitarios', icon: Settings,  href: '/utilitarios', tag: 'Próx.' },
  { label: 'Ayuda',      icon: HelpCircle, href: '/ayuda', tag: 'Próx.' },
];

function NavGroup({
  item,
  level = 0,
  collapsed,
}: {
  item: NavItem;
  level?: number;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const isLeaf = !item.children;
  const isActive = item.href ? pathname === item.href : false;
  const hasActiveChild = item.children?.some(
    (c) => c.href && pathname.startsWith(c.href)
  );
  const [open, setOpen] = useState(hasActiveChild || false);

  if (isLeaf && item.href) {
    return (
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={cn(
          'nav-item group relative',
          level > 0 && !collapsed && 'pl-8 text-[0.73rem]',
          isActive
            ? 'active'
            : 'hover:bg-white/5'
        )}
      >
        <item.icon
          className={cn(
            'flex-shrink-0 transition-colors duration-200',
            level > 0 ? 'h-3.5 w-3.5' : 'h-4 w-4',
            isActive ? 'text-[#D40000]' : 'text-[#4A6080] group-hover:text-slate-300'
          )}
        />
        {!collapsed && (
          <span className="flex-1 truncate leading-tight">{item.label}</span>
        )}
        {!collapsed && item.tag && (
          <span className="badge badge-muted flex-shrink-0">{item.tag}</span>
        )}
        {isActive && (
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#D40000] rounded-l-full" />
        )}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        title={collapsed ? item.label : undefined}
        className={cn(
          'nav-item w-full',
          hasActiveChild ? 'text-white' : 'hover:bg-white/5'
        )}
      >
        <item.icon
          className={cn(
            'flex-shrink-0 h-4 w-4 transition-colors duration-200',
            hasActiveChild ? 'text-[#D40000]' : 'text-[#4A6080] group-hover:text-slate-300'
          )}
        />
        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">{item.label}</span>
            {item.tag && (
              <span className="badge badge-muted mr-1">{item.tag}</span>
            )}
            {open ? (
              <ChevronDown className="h-3.5 w-3.5 text-[#4A6080] flex-shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-[#4A6080] flex-shrink-0" />
            )}
          </>
        )}
      </button>

      {open && !collapsed && item.children && (
        <div className="mt-0.5 ml-2 pl-2 border-l border-white/5 space-y-0.5 animate-fade-in">
          {item.children.map((child) => (
            <NavGroup key={child.label} item={child} level={level + 1} collapsed={collapsed} />
          ))}
        </div>
      )}
    </div>
  );
}

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
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={cn(
          'absolute -right-3 top-6 z-50',
          'h-6 w-6 rounded-full flex items-center justify-center',
          'bg-[#0A1F35] border border-white/10 text-[#4A6080]',
          'hover:text-white hover:border-white/20 transition-all duration-200',
          'shadow-lg'
        )}
      >
        <ChevronLeft
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-300',
            collapsed && 'rotate-180'
          )}
        />
      </button>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-0.5">

        {/* Main nav items */}
        {navigation.map((item) => {
          // Add section separators
          const separatorBefore =
            item.label === 'Prog. Presupuestales' ||
            item.label === 'Tesorería' ||
            item.label === 'Interfase SIAF' ||
            item.label === 'Reportes';

          return (
            <div key={item.label}>
              {separatorBefore && !collapsed && (
                <div className="nav-group-label mt-4 mb-1">
                  {item.label === 'Tesorería' ? 'Gestión' :
                   item.label === 'Interfase SIAF' ? 'Integración' :
                   item.label === 'Reportes' ? 'Salidas' : 'Más módulos'}
                </div>
              )}
              {separatorBefore && !collapsed && (
                <div className="h-px bg-white/[0.04] mx-1 mb-2" />
              )}
              <NavGroup item={item} collapsed={collapsed} />
            </div>
          );
        })}
      </div>

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
