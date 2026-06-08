import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { IngresoRow, RubroOption } from '../../models/api.models';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-ingresos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ingresos.component.html',
  styleUrls: []
})
export class IngresosComponent implements OnInit {
  loading = signal(true);
  rows = signal<IngresoRow[]>([]);
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
      acc.recaudado_total += row.recaudado_total || 0;
      return acc;
    }, { pia: 0, pim: 0, recaudado_total: 0 });
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
      this.fetchIngresos();
      this.currentPage.set(1); // Reset page on filter changes
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {}

  fetchIngresos(): void {
    this.loading.set(true);
    this.apiService.getIngresos(this.filterRubro(), this.filterClasificador()).subscribe({
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
        console.error('Error fetching ingresos:', error);
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
      'Recaudado Total (S/)': row.recaudado_total,
      'Avance Recaudación (%)': row.pim > 0 ? ((row.recaudado_total / row.pim) * 100).toFixed(2) : '0.00',
      // Monthly breakdown columns
      'Rec Ene': row.recaud_01, 'Rec Feb': row.recaud_02, 'Rec Mar': row.recaud_03, 'Rec Abr': row.recaud_04,
      'Rec May': row.recaud_05, 'Rec Jun': row.recaud_06, 'Rec Jul': row.recaud_07, 'Rec Ago': row.recaud_08,
      'Rec Set': row.recaud_09, 'Rec Oct': row.recaud_10, 'Rec Nov': row.recaud_11, 'Rec Dic': row.recaud_12,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ejecución Ingresos');
    
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

    XLSX.writeFile(workbook, `SWSiconis_Ejecucion_Ingresos_${new Date().getFullYear()}.xlsx`);
  }

  changePage(dir: number): void {
    const next = this.currentPage() + dir;
    if (next >= 1 && next <= this.totalPages()) {
      this.currentPage.set(next);
    }
  }
}
