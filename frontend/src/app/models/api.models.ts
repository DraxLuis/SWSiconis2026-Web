export interface CardData {
  total_pia: number;
  total_pim: number;
  total_certif: number;
  total_comprometido: number;
  total_devengado: number;
  total_girado: number;
}

export interface MonthData {
  name: string;
  devengado: number;
  girado: number;
}

export interface RubroOption {
  codigo: string;
  nombre: string;
}

export interface GastoRow {
  rubro: string;
  rubro_nombre: string;
  clasificador: string;
  clasificador_nombre: string;
  pia: number;
  pim: number;
  certificado: number;
  comprometido: number;
  devengado_total: number;
  girado_total: number;
  dev_01: number; dev_02: number; dev_03: number; dev_04: number;
  dev_05: number; dev_06: number; dev_07: number; dev_08: number;
  dev_09: number; dev_10: number; dev_11: number; dev_12: number;
  gir_01: number; gir_02: number; gir_03: number; gir_04: number;
  gir_05: number; gir_06: number; gir_07: number; gir_08: number;
  gir_09: number; gir_10: number; gir_11: number; gir_12: number;
}

export interface IngresoRow {
  rubro: string;
  rubro_nombre: string;
  clasificador: string;
  clasificador_nombre: string;
  pia: number;
  pim: number;
  recaudado_total: number;
  recaud_01: number; recaud_02: number; recaud_03: number; recaud_04: number;
  recaud_05: number; recaud_06: number; recaud_07: number; recaud_08: number;
  recaud_09: number; recaud_10: number; recaud_11: number; recaud_12: number;
}

export interface PagoRow {
  id: number;
  ano_proc: string;
  ano_eje: string;
  sec_ejec: string;
  expediente: string;
  secuencia: string;
  num_doc: string;
  ruc: string;
  beneficiario: string;
  rubro: string;
  rubro_nombre: string;
  glosa: string;
  cod_doc: string;
  fecha_doc: string;
  cod_doc_b: string;
  nom_doc_b: string;
  fec_doc_b: string;
  const_pago: string;
  confor_doc: string;
  confor_des: string;
  confor_fec: string;
  monto: number;
  estado: string;
}

export interface ReportRow {
  meta?: string;
  rubro?: string;
  rubro_nombre?: string;
  clasificador?: string;
  clasificador_nombre?: string;
  pia: number;
  pim: number;
  certificado: number;
  comprometido: number;
  devengado: number;
  girado: number;
  recaudado: number;
  id?: number;
  ano_eje?: string;
  sec_ejec?: string;
  nro_certificado?: string;
  secuencia?: string;
  num_doc?: string;
  fecha_doc?: string;
  ruc_proveedor?: string;
  etapa?: string;
  estado?: string;
  monto: number;
  anio?: string;
}

export interface ReportDefinition {
  id: string;
  title: string;
  category: 'gastos' | 'ingresos' | 'otros';
  description: string;
}
