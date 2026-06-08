import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { GastoRow, RubroOption } from '../../models/api.models';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gastos.component.html',
  styleUrls: []
})
export class GastosComponent implements OnInit {
  loading = signal(true);
  rows = signal<GastoRow[]>([]);
  rubrosList = signal<RubroOption[]>([]);
  
  // Filters
  filterRubro = signal('');
  filterClasificador = signal('');
  searchQuery = signal('');

  // Expanded rows state (using record dictionary for row tracking: 'rubro-clasificador')
  expandedRows = signal<Record<string, boolean>>({});

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  // Computeds
  filteredRows = computed(() => {
    const list = this.rows();
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return list;

    return list.filter(row => 
      row.clasificador.toLowerCase().includes(query) ||
      (row.clasificador_nombre && row.clasificador_nombre.toLowerCase().includes(query)) ||
      (row.rubro_nombre && row.rubro_nombre.toLowerCase().includes(query))
    );
  });

  totals = computed(() => {
    const list = this.filteredRows();
    return list.reduce((acc, row) => {
      acc.pia += row.pia || 0;
      acc.pim += row.pim || 0;
      acc.certificado += row.certificado || 0;
      acc.comprometido += row.comprometido || 0;
      acc.devengado_total += row.devengado_total || 0;
      acc.girado_total += row.girado_total || 0;
      return acc;
    }, { pia: 0, pim: 0, certificado: 0, comprometido: 0, devengado_total: 0, girado_total: 0 });
  });

  paginatedRows = computed(() => {
    const list = this.filteredRows();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  totalPages = computed(() => {
    const total = this.filteredRows().length;
    return Math.ceil(total / this.pageSize()) || 1;
  });

  monthsHeader = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
    'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'
  ];

  constructor(private apiService: ApiService) {
    // Reload data on filter change
    effect(() => {
      this.fetchGastos();
      this.currentPage.set(1); // Reset page on filter changes
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {}

  fetchGastos(): void {
    this.loading.set(true);
    this.apiService.getGastos(this.filterRubro(), this.filterClasificador()).subscribe({
      next: (data) => {
        if (data.success) {
          this.rows.set(data.rows || []);
          if (data.rubros && this.rubrosList().length === 0) {
            this.rubrosList.set(data.rubros);
          }
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error fetching gastos:', error);
        this.loading.set(false);
      }
    });
  }

  toggleRow(rubro: string, clasificador: string): void {
    const key = `${rubro}-${clasificador}`;
    const current = { ...this.expandedRows() };
    current[key] = !current[key];
    this.expandedRows.set(current);
  }

  isExpanded(rubro: string, clasificador: string): boolean {
    return !!this.expandedRows()[`${rubro}-${clasificador}`];
  }

  toggleAllRows(): void {
    const paginated = this.paginatedRows();
    const current = this.expandedRows();
    const allExpanded = paginated.every(r => current[`${r.rubro}-${r.clasificador}`]);

    if (allExpanded) {
      // Collapse all on current page
      const updated = { ...current };
      paginated.forEach(r => {
        delete updated[`${r.rubro}-${r.clasificador}`];
      });
      this.expandedRows.set(updated);
    } else {
      // Expand all on current page
      const updated = { ...current };
      paginated.forEach(r => {
        updated[`${r.rubro}-${r.clasificador}`] = true;
      });
      this.expandedRows.set(updated);
    }
  }

  formatMoney(val: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(val || 0);
  }

  exportToExcel(): void {
    const exportData = this.filteredRows().map((row) => ({
      'Rubro': row.rubro,
      'Nombre Rubro': row.rubro_nombre || '',
      'Clasificador': row.clasificador,
      'Nombre Clasificador': row.clasificador_nombre || '',
      'PIA (S/)': row.pia,
      'PIM (S/)': row.pim,
      'Certificado (S/)': row.certificado,
      'Comprometido (S/)': row.comprometido,
      'Devengado Total (S/)': row.devengado_total,
      'Girado Total (S/)': row.girado_total,
      'Avance Devengado (%)': row.pim > 0 ? ((row.devengado_total / row.pim) * 100).toFixed(2) : '0.00',
      'Avance Girado (%)': row.pim > 0 ? ((row.girado_total / row.pim) * 100).toFixed(2) : '0.00',
      // Monthly devengados
      'Dev Ene': row.dev_01, 'Dev Feb': row.dev_02, 'Dev Mar': row.dev_03, 'Dev Abr': row.dev_04,
      'Dev May': row.dev_05, 'Dev Jun': row.dev_06, 'Dev Jul': row.dev_07, 'Dev Ago': row.dev_08,
      'Dev Set': row.dev_09, 'Dev Oct': row.dev_10, 'Dev Nov': row.dev_11, 'Dev Dic': row.dev_12,
      // Monthly girados
      'Gir Ene': row.gir_01, 'Gir Feb': row.gir_02, 'Gir Mar': row.gir_03, 'Gir Abr': row.gir_04,
      'Gir May': row.gir_05, 'Gir Jun': row.gir_06, 'Gir Jul': row.gir_07, 'Gir Ago': row.gir_08,
      'Gir Set': row.gir_09, 'Gir Oct': row.gir_10, 'Gir Nov': row.gir_11, 'Gir Dic': row.gir_12,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ejecución Gastos');
    
    // Auto-fit column widths
    const maxLens = Object.keys(exportData[0] || {}).map(key => {
      let maxLen = key.length;
      exportData.forEach(row => {
        const val = row[key as keyof typeof row];
        if (val !== null && val !== undefined) {
          maxLen = Math.max(maxLen, String(val).length);
        }
      });
      return { wch: maxLen + 2 };
    });
    worksheet['!cols'] = maxLens;

    XLSX.writeFile(workbook, `SWSiconis_Ejecucion_Gastos_${new Date().getFullYear()}.xlsx`);
  }

  changePage(dir: number): void {
    const next = this.currentPage() + dir;
    if (next >= 1 && next <= this.totalPages()) {
      this.currentPage.set(next);
    }
  }
}
