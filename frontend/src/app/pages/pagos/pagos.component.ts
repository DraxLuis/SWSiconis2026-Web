import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { PagoRow, RubroOption } from '../../models/api.models';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagos.component.html',
  styleUrls: []
})
export class PagosComponent implements OnInit {
  loading = signal(true);
  rows = signal<PagoRow[]>([]);
  rubrosList = signal<RubroOption[]>([]);
  
  // Filters
  filterRubro = signal('');
  filterExpediente = signal('');
  filterEstado = signal('');
  searchQuery = signal('');

  // Expanded rows state (using record dictionary for row tracking: number ID)
  expandedRows = signal<Record<number, boolean>>({});

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  // Computeds
  // The API returns already filtered records for 'q' search, but we can compute totals and paginated rows.
  totalMonto = computed(() => {
    return this.rows().reduce((acc, row) => acc + (row.monto || 0), 0);
  });

  paginatedRows = computed(() => {
    const list = this.rows();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  totalPages = computed(() => {
    const total = this.rows().length;
    return Math.ceil(total / this.pageSize()) || 1;
  });

  constructor(private apiService: ApiService) {
    // Fetch data when filter signals change
    effect(() => {
      this.fetchPagos();
      this.currentPage.set(1); // Reset page on filter changes
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {}

  fetchPagos(): void {
    this.loading.set(true);
    const filters = {
      rubro: this.filterRubro(),
      expediente: this.filterExpediente(),
      estado: this.filterEstado(),
      q: this.searchQuery()
    };

    this.apiService.getPagos(filters).subscribe({
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
        console.error('Error fetching pagos:', error);
        this.loading.set(false);
      }
    });
  }

  toggleRow(id: number): void {
    const current = { ...this.expandedRows() };
    current[id] = !current[id];
    this.expandedRows.set(current);
  }

  isExpanded(id: number): boolean {
    return !!this.expandedRows()[id];
  }

  toggleAllRows(): void {
    const paginated = this.paginatedRows();
    const current = this.expandedRows();
    const allExpanded = paginated.every(r => current[r.id]);

    if (allExpanded) {
      const updated = { ...current };
      paginated.forEach(r => {
        delete updated[r.id];
      });
      this.expandedRows.set(updated);
    } else {
      const updated = { ...current };
      paginated.forEach(r => {
        updated[r.id] = true;
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

  // Get status details for UI classes
  getStatusType(estado: string): 'success' | 'warning' | 'default' {
    const est = (estado || '').toLowerCase().trim();
    if (est === 'aprobado' || est === 'pagado') {
      return 'success';
    }
    if (est === 'proceso' || est === 'pendiente') {
      return 'warning';
    }
    return 'default';
  }

  exportToExcel(): void {
    const exportData = this.rows().map((row) => ({
      'Expediente': row.expediente,
      'Secuencia': row.secuencia,
      'Num Doc': row.num_doc,
      'RUC': row.ruc,
      'Beneficiario': row.beneficiario,
      'Rubro': row.rubro,
      'Nombre Rubro': row.rubro_nombre || '',
      'Monto (S/)': row.monto,
      'Estado': row.estado || '',
      'Fecha Doc': row.fecha_doc || '',
      'Glosa': row.glosa || '',
      'Constancia Pago': row.const_pago || '',
      'Doc Banco': row.nom_doc_b || '',
      'Fec Banco': row.fec_doc_b || '',
      'Conformidad Doc': row.confor_doc || '',
      'Conformidad Des': row.confor_des || '',
      'Conformidad Fec': row.confor_fec || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Notas de Pago');
    
    // Auto-fit column widths
    const maxLens = Object.keys(exportData[0] || {}).map(key => {
      let maxLen = key.length;
      exportData.forEach(row => {
        const val = row[key as keyof typeof row];
        if (val !== null && val !== undefined) {
          maxLen = Math.max(maxLen, String(val).length);
        }
      });
      return { wch: Math.min(maxLen + 2, 50) }; // Cap width at 50
    });
    worksheet['!cols'] = maxLens;

    XLSX.writeFile(workbook, `SWSiconis_Notas_Pago_${new Date().getFullYear()}.xlsx`);
  }

  changePage(dir: number): void {
    const next = this.currentPage() + dir;
    if (next >= 1 && next <= this.totalPages()) {
      this.currentPage.set(next);
    }
  }
}
