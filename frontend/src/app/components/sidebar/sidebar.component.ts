import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: []
})
export class SidebarComponent {
  routes = [
    {
      label: 'Dashboard',
      iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      href: '/'
    },
    {
      label: 'Ejecución de Gastos',
      iconPath: 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6',
      href: '/gastos'
    },
    {
      label: 'Ejecución de Ingresos',
      iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
      href: '/ingresos'
    },
    {
      label: 'Notas de Pago',
      iconPath: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
      href: '/pagos'
    },
    {
      label: 'Reportes Presupuestales',
      iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      href: '/reportes'
    }
  ];
}
