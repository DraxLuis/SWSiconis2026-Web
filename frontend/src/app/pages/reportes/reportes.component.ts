import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ReportRow, RubroOption, ReportDefinition } from '../../models/api.models';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrls: []
})
export class ReportesComponent implements OnInit {
  loading = signal(false);
  selectedReport = signal<string>('gasto_1');
  rows = signal<ReportRow[]>([]);
  rubrosList = signal<RubroOption[]>([]);
  metasList = signal<string[]>([]);
  
  // Filters
  filterRubro = signal('');
  filterMeta = signal('');
  searchQuery = signal('');

  reportsList: ReportDefinition[] = [
    {
      id: 'gasto_1',
      title: 'Gastos Nivel 1 (Genérica)',
      category: 'gastos',
      description: 'Resumen de gastos agrupado por meta, rubro y nivel de genérica (2.1, 2.3, 2.6...).',
    },
    {
      id: 'gasto_2',
      title: 'Gastos Nivel 2 (Subgenérica)',
      category: 'gastos',
      description: 'Gastos acumulados a nivel de subgenérica de clasificador (2.3.1, 2.3.2...).',
    },
    {
      id: 'gasto_3',
      title: 'Gastos Nivel 3 (Detallado)',
      category: 'gastos',
      description: 'Listado detallado de ejecución de gastos a nivel de clasificador completo (15 caracteres).',
    },
    {
      id: 'ingreso_1',
      title: 'Ingresos Nivel 1 (Genérica)',
      category: 'ingresos',
      description: 'Resumen de ingresos por rubro y nivel de genérica (1.1, 1.3, 1.5...).',
    },
    {
      id: 'ingreso_2',
      title: 'Ingresos Nivel 2 (Subgenérica)',
      category: 'ingresos',
      description: 'Ingresos acumulados a nivel de subgenérica de clasificador.',
    },
    {
      id: 'ingreso_3',
      title: 'Ingresos Nivel 3 (Detallado)',
      category: 'ingresos',
      description: 'Listado detallado de ejecución de ingresos a nivel de clasificador completo.',
    },
    {
      id: 'certificados',
      title: 'Reporte de Certificaciones',
      category: 'otros',
      description: 'Listado detallado de certificaciones presupuestales registradas (SIAF).',
    },
    {
      id: 'multianual',
      title: 'Comparativo Multianual',
      category: 'otros',
      description: 'Comparativo global del comportamiento del gasto a lo largo de los años registrados.',
    }
  ];

  // Computeds
  filteredRows = computed(() => {
    const list = this.rows();
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return list;

    return list.filter(row => {
      const textFields = [
        row.clasificador,
        row.clasificador_nombre,
        row.rubro,
        row.rubro_nombre,
        row.meta,
        row.nro_certificado,
        row.num_doc,
        row.ruc_proveedor,
        row.etapa,
        row.estado,
        row.anio
      ];
      return textFields.some(field => 
        field !== undefined && field !== null && String(field).toLowerCase().includes(query)
      );
    });
  });

  totals = computed(() => {
    const list = this.filteredRows();
    const defaultTotals = { pia: 0, pim: 0, certificado: 0, comprometido: 0, devengado: 0, girado: 0, recaudado: 0, monto: 0 };
    return list.reduce((acc, row) => {
      acc.pia += row.pia || 0;
      acc.pim += row.pim || 0;
      acc.certificado += row.certificado || 0;
      acc.comprometido += row.comprometido || 0;
      acc.devengado += row.devengado || 0;
      acc.girado += row.girado || 0;
      acc.recaudado += row.recaudado || 0;
      acc.monto += row.monto || 0;
      return acc;
    }, defaultTotals);
  });

  currentReportObj = computed(() => {
    const id = this.selectedReport();
    return this.reportsList.find(r => r.id === id);
  });

  constructor(private apiService: ApiService) {
    // Reload report details when selected report or filters change
    effect(() => {
      this.fetchReportData();
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {}

  selectReport(reportId: string): void {
    this.selectedReport.set(reportId);
  }

  fetchReportData(): void {
    this.loading.set(true);
    this.apiService.getReportes(this.selectedReport(), this.filterRubro(), this.filterMeta()).subscribe({
      next: (data) => {
        if (data.success) {
          this.rows.set(data.rows || []);
          if (data.rubros && this.rubrosList().length === 0) {
            this.rubrosList.set(data.rubros);
          }
          if (data.metas && this.metasList().length === 0) {
            this.metasList.set(data.metas);
          }
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error fetching report data:', error);
        this.loading.set(false);
      }
    });
  }

  formatMoney(val: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(val || 0);
  }

  exportToExcel(): void {
    const list = this.filteredRows();
    const type = this.selectedReport();
    let exportData: any[] = [];

    // Map columns depending on report layout
    if (type.startsWith('gasto_')) {
      exportData = list.map(row => ({
        'Meta': row.meta || '',
        'Rubro': row.rubro || '',
        'Nombre Rubro': row.rubro_nombre || '',
        'Clasificador': row.clasificador || '',
        'Descripción': row.clasificador_nombre || '',
        'PIA': row.pia,
        'PIM': row.pim,
        'Certificado': row.certificado,
        'Comprometido': row.comprometido,
        'Devengado': row.devengado,
        'Girado': row.girado,
        'Avance (%)': row.pim > 0 ? ((row.devengado / row.pim) * 100).toFixed(2) : '0.00'
      }));
    } else if (type.startsWith('ingreso_')) {
      exportData = list.map(row => ({
        'Rubro': row.rubro || '',
        'Nombre Rubro': row.rubro_nombre || '',
        'Clasificador': row.clasificador || '',
        'Descripción': row.clasificador_nombre || '',
        'PIA': row.pia,
        'PIM': row.pim,
        'Recaudado': row.recaudado,
        'Avance (%)': row.pim > 0 ? ((row.recaudado / row.pim) * 100).toFixed(2) : '0.00'
      }));
    } else if (type === 'certificados') {
      exportData = list.map(row => ({
        'Año': row.ano_eje || '',
        'Sec. Ejecutora': row.sec_ejec || '',
        'Nro. Certificado': row.nro_certificado || '',
        'Secuencia': row.secuencia || '',
        'Rubro': row.rubro || '',
        'Nro. Documento': row.num_doc || '',
        'Fecha Doc': row.fecha_doc || '',
        'RUC Proveedor': row.ruc_proveedor || '',
        'Clasificador': row.clasificador || '',
        'Meta': row.meta || '',
        'Etapa': row.etapa || '',
        'Estado': row.estado || '',
        'Monto': row.monto
      }));
    } else if (type === 'multianual') {
      exportData = list.map(row => ({
        'Año': row.anio || '',
        'Rubro': row.rubro || '',
        'Nombre Rubro': row.rubro_nombre || '',
        'PIA': row.pia,
        'PIM': row.pim,
        'Certificado': row.certificado,
        'Comprometido': row.comprometido,
        'Devengado': row.devengado,
        'Girado': row.girado
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    const title = this.currentReportObj()?.title || 'Reporte';
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte Siconis');
    
    // Auto-fit column widths
    const maxLens = Object.keys(exportData[0] || {}).map(key => {
      let maxLen = key.length;
      exportData.forEach(row => {
        const val = row[key as keyof typeof row];
        if (val !== null && val !== undefined) {
          maxLen = Math.max(maxLen, String(val).length);
        }
      });
      return { wch: Math.min(maxLen + 2, 40) };
    });
    worksheet['!cols'] = maxLens;

    XLSX.writeFile(workbook, `SWSiconis_Reporte_${type}_${new Date().getFullYear()}.xlsx`);
  }
}
