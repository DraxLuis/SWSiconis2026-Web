import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { CardData, MonthData, RubroOption } from '../../models/api.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: []
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  filterRubro = signal('');
  filterClasificador = signal('');
  
  rubrosList = signal<RubroOption[]>([]);
  cards = signal<CardData>({
    total_pia: 0,
    total_pim: 0,
    total_certif: 0,
    total_comprometido: 0,
    total_devengado: 0,
    total_girado: 0
  });
  
  months = signal<MonthData[]>([]);
  
  // Hovered state for custom SVG chart tooltip
  hoveredMonthIndex = signal<number | null>(null);

  // Computeds
  progressPercent = computed(() => {
    const pim = this.cards().total_pim;
    const dev = this.cards().total_devengado;
    return pim > 0 ? (dev / pim) * 100 : 0;
  });

  gaugeDashOffset = computed(() => {
    const percent = Math.min(this.progressPercent(), 100);
    // Circle circumference = 2 * PI * r = 2 * PI * 40 = 251.3
    return 251.3 - (251.3 * percent) / 100;
  });

  chartMaxVal = computed(() => {
    const dataset = this.months();
    if (dataset.length === 0) return 1;
    const maxVal = Math.max(...dataset.map(m => Math.max(m.devengado, m.girado)));
    return maxVal > 0 ? maxVal : 1;
  });

  // SVG Chart Paths Generator
  chartPaths = computed(() => {
    const dataset = this.months();
    const max = this.chartMaxVal();
    const width = 1000;
    const height = 260; // Chart height inside the viewBox
    const topMargin = 20;
    
    if (dataset.length === 0) {
      return { devLine: '', devArea: '', girLine: '', girArea: '', points: [] };
    }

    const points = dataset.map((d, i) => {
      const x = (i / (dataset.length - 1)) * width;
      // Map Y coordinates: higher values are closer to 0 (top)
      const yDev = height - (d.devengado / max) * (height - topMargin) + topMargin;
      const yGir = height - (d.girado / max) * (height - topMargin) + topMargin;
      return { x, yDev, yGir, data: d };
    });

    const devLine = `M ${points.map(p => `${p.x},${p.yDev}`).join(' L ')}`;
    const devArea = `M 0,${height + 40} L ${points.map(p => `${p.x},${p.yDev}`).join(' L ')} L ${width},${height + 40} Z`;

    const girLine = `M ${points.map(p => `${p.x},${p.yGir}`).join(' L ')}`;
    const girArea = `M 0,${height + 40} L ${points.map(p => `${p.x},${p.yGir}`).join(' L ')} L ${width},${height + 40} Z`;

    return { devLine, devArea, girLine, girArea, points };
  });

  constructor(private apiService: ApiService) {
    // React to filter signals changes to trigger data loading
    effect(() => {
      this.fetchDashboardData();
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    // Initial fetch is triggered by effect on signal init
  }

  fetchDashboardData(): void {
    this.loading.set(true);
    this.apiService.getDashboard(this.filterRubro(), this.filterClasificador()).subscribe({
      next: (data) => {
        if (data.success) {
          this.cards.set(data.cards);
          this.months.set(data.months);
          if (data.rubros && this.rubrosList().length === 0) {
            this.rubrosList.set(data.rubros);
          }
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error fetching dashboard data:', error);
        this.loading.set(false);
      }
    });
  }

  // Formatting helpers
  formatMoney(val: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(val || 0);
  }

  setHoveredMonth(index: number | null): void {
    this.hoveredMonthIndex.set(index);
  }
}
