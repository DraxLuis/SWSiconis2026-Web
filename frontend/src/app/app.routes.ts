import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'gastos',
    loadComponent: () => import('./pages/gastos/gastos.component').then(m => m.GastosComponent)
  },
  {
    path: 'ingresos',
    loadComponent: () => import('./pages/ingresos/ingresos.component').then(m => m.IngresosComponent)
  },
  {
    path: 'pagos',
    loadComponent: () => import('./pages/pagos/pagos.component').then(m => m.PagosComponent)
  },
  {
    path: 'reportes',
    loadComponent: () => import('./pages/reportes/reportes.component').then(m => m.ReportesComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
