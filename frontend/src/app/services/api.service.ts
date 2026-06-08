import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiPrefix = '/api';

  constructor(private http: HttpClient) {}

  getDashboard(rubro?: string, clasificador?: string): Observable<any> {
    let params = new HttpParams();
    if (rubro) params = params.set('rubro', rubro);
    if (clasificador) params = params.set('clasificador', clasificador);

    return this.http.get(`${this.apiPrefix}/dashboard`, { params });
  }

  getGastos(rubro?: string, clasificador?: string): Observable<any> {
    let params = new HttpParams();
    if (rubro) params = params.set('rubro', rubro);
    if (clasificador) params = params.set('clasificador', clasificador);

    return this.http.get(`${this.apiPrefix}/gastos`, { params });
  }

  getIngresos(rubro?: string, clasificador?: string): Observable<any> {
    let params = new HttpParams();
    if (rubro) params = params.set('rubro', rubro);
    if (clasificador) params = params.set('clasificador', clasificador);

    return this.http.get(`${this.apiPrefix}/ingresos`, { params });
  }

  getPagos(filters: { rubro?: string; expediente?: string; estado?: string; q?: string }): Observable<any> {
    let params = new HttpParams();
    if (filters.rubro) params = params.set('rubro', filters.rubro);
    if (filters.expediente) params = params.set('expediente', filters.expediente);
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.q) params = params.set('q', filters.q);

    return this.http.get(`${this.apiPrefix}/pagos`, { params });
  }

  getReportes(type: string, rubro?: string, meta?: string, anio?: string): Observable<any> {
    let params = new HttpParams().set('type', type);
    if (rubro) params = params.set('rubro', rubro);
    if (meta) params = params.set('meta', meta);
    if (anio) params = params.set('anio', anio);

    return this.http.get(`${this.apiPrefix}/reportes`, { params });
  }

  testConnection(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/test-db`);
  }
}
