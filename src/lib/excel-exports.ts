import * as XLSX from 'xlsx-js-style';

// Helper to safely convert numbers
function n(val: unknown): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

// Helper to format date strings
function formatDate(val: unknown): string {
  if (val == null) return '';
  return String(val).trim();
}

export interface EjecucionRow {
  codigo: string;
  nombre: string;
  pia: number;
  modif: number;
  pim: number;
  certif: number;
  cpanua: number;
  atcp: number;
  devengado: number;
  girado: number;
  saldo: number;
  avance: number;
}

export interface EjecucionTotals {
  pia: number;
  modif: number;
  pim: number;
  certif: number;
  cpanua: number;
  atcp: number;
  devengado: number;
  girado: number;
  saldo: number;
  avance: number;
}

export interface CertificadoRow {
  ano_eje?: string;
  sec_ejec?: string;
  certif: string;
  secuencia: string;
  correlat: string;
  rubro: string;
  cod_doc: string;
  num_doc: string;
  fecha_doc: string;
  clasif: string;
  clasif_nombre: string;
  sec_func: string;
  meta_nombre: string;
  monto: number;
  fec_proc: string;
  tipo_reg: string;
  est_env?: string;
  est_reg?: string;
}

export interface ExpedienteRow {
  ano_eje?: string;
  mes_eje: string;
  expediente: string;
  tipo_op: string;
  sec_reg: string;
  corr: string;
  rb: string;
  tr: string;
  cod_doc: string;
  num_doc: string;
  fecha_doc: string;
  proveedor_ruc: string;
  proveedor_nombre: string;
  clasificad: string;
  clasif_nombre: string;
  sec_func: string;
  meta_nombre: string;
  glosa?: string;
  monto: number;
  fec_aprob: string;
  estado: string;
  certif: string;
  certif_sec: string;
}

/**
 * 1. Export EJECUCIÓN PRESUPUESTARAL - PROGRAMA PRESUPUESTARAL
 * File: ejecucion-presupuestal.xlsx -> downloaded as 'ejecucion presupuestal.xlsx'
 * Font: Arial Narrow
 * SheetName: Registros
 */
export function exportEjecucionPPTO(rows: EjecucionRow[], filename = 'ejecucion_ppto.xlsx') {
  const wsData: unknown[][] = [];
  
  // Row 1: Entity Name & Current Date (NOW)
  wsData.push([
    '301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA',
    '', '', '', '', '', '', '', '', '',
    { f: 'NOW()' },
    ''
  ]);
  
  // Row 2: Banner (merged A2:L2)
  wsData.push([
    'Ejecución Presupuestal  - Programa Presupuestal',
    '', '', '', '', '', '', '', '', '', '', ''
  ]);
  
  // Row 3: Blank Row
  wsData.push(Array(12).fill(''));
  
  // Row 4: Cabeceras
  wsData.push([
    'Codigo',
    'Nombre Ppto',
    'Pia',
    'Mod',
    'Pím',
    'Certicado',
    'CompromisoA',
    'CompromisoM',
    'Devengado',
    'Girado',
    'Saldo',
    'Avan'
  ]);

  // Data Rows (Starting at row 5, which is index 4 in wsData)
  rows.forEach(r => {
    wsData.push([
      r.codigo,
      r.nombre,
      n(r.pia),
      n(r.modif),
      n(r.pim),
      n(r.certif),
      n(r.cpanua),
      n(r.atcp),
      n(r.devengado),
      n(r.girado),
      n(r.saldo),
      n(r.avance)
    ]);
  });

  const lastDataRowNumber = 4 + rows.length; // Row number of the last data row (1-indexed)
  const totalsRowNumber = lastDataRowNumber + 1; // 1-indexed totals row
  const hasRows = rows.length > 0;
  wsData.push([
    '',
    'T O T A L E S',
    hasRows ? { f: `SUBTOTAL(9,C5:C${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,D5:D${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,E5:E${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,F5:F${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,G5:G${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,H5:H${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,I5:I${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,J5:J${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,K5:K${lastDataRowNumber})` } : 0,
    hasRows ? { f: `I${totalsRowNumber}/E${totalsRowNumber}` } : 0 // Devengado/PIM
  ]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Layout properties
  ws['!cols'] = [
    { wch: 6.33 },   // Codigo
    { wch: 65.11 },  // Nombre Ppto
    { wch: 11.44 },  // Pia
    { wch: 11.44 },  // Mod
    { wch: 11.44 },  // Pim
    { wch: 11.44 },  // Certificado
    { wch: 14.11 },  // CompromisoA
    { wch: 14.00 },  // CompromisoM
    { wch: 11.44 },  // Devengado
    { wch: 11.44 },  // Girado
    { wch: 11.44 },  // Saldo
    { wch: 6.89 }    // Avan
  ];

  ws['!rows'] = [
    { hpt: 14.40 },  // Row 1
    { hpt: 22.50 },  // Row 2 (banner)
    { hpt: 14.40 },  // Row 3
    { hpt: 15.00 }   // Row 4 (headers)
  ];
  for (let r = 4; r < 4 + rows.length; r++) {
    ws['!rows'].push({ hpt: 14.40 });
  }
  ws['!rows'].push({ hpt: 15.00 }); // Totals row

  ws['!merges'] = [
    { s: { r: 0, c: 10 }, e: { r: 0, c: 11 } }, // Merge DATE info
    { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } }  // Merge banner across L columns
  ];

  ws['!views'] = [{ showGridLines: false }];

  // Apply Styling Cell by Cell
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({c, r});
      const cell = ws[cellRef];
      if (!cell) continue;

      if (r === 0) {
        // Row 1
        if (c === 10) {
          cell.s = {
            font: { name: 'Arial Narrow', sz: 11, bold: false, color: { rgb: '000000' } },
            alignment: { horizontal: 'right', vertical: 'center' }
          };
          cell.z = 'm/d/yy h:mm';
        } else if (c === 0) {
          cell.s = {
            font: { name: 'Arial Narrow', sz: 11, bold: false, color: { rgb: '000000' } },
            alignment: { horizontal: 'left', vertical: 'center' }
          };
        }
      } else if (r === 1) {
        // Row 2: Banner
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: '44546A' } }, // VFP Blue-Gray
          font: { name: 'Arial Narrow', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      } else if (r === 3) {
        // Row 4: Cabeceras
        const borderH: Record<string, { style: string; color?: { rgb: string } }> = {
          top: { style: 'medium', color: { rgb: '000000' } },
          bottom: { style: 'medium', color: { rgb: '000000' } }
        };
        if (c === 0) borderH.left = { style: 'medium', color: { rgb: '000000' } };
        if (c === 11) borderH.right = { style: 'medium', color: { rgb: '000000' } };

        cell.s = {
          font: { name: 'Arial Narrow', sz: 10, bold: false, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderH
        };
      } else if (r === range.e.r) {
        // Totals Row
        const borderTot: Record<string, { style: string; color?: { rgb: string } }> = {
          top: { style: 'medium', color: { rgb: '000000' } },
          bottom: { style: 'medium', color: { rgb: '000000' } }
        };
        if (c === 0) borderTot.left = { style: 'medium', color: { rgb: '000000' } };
        if (c === 11) borderTot.right = { style: 'medium', color: { rgb: '000000' } };

        if (c === 1) {
          cell.s = {
            font: { name: 'Arial Narrow', sz: 11, bold: true, color: { rgb: '000000' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderTot
          };
        } else if (c >= 2 && c <= 11) {
          cell.s = {
            font: { name: 'Arial Narrow', sz: 10, bold: false, color: { rgb: '000000' } },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: borderTot
          };
          if (c === 11) {
            cell.z = '0.00%';
          } else if (c >= 2 && c <= 4) {
            cell.z = '#,##0';
          } else {
            cell.z = '#,##0.00';
          }
        } else {
          cell.s = { border: borderTot };
        }
      } else if (r > 3) {
        // Data Rows
        let cellAlign = 'right';
        if (c === 0) cellAlign = 'center';
        if (c === 1) cellAlign = 'left';

        // Setup outer borders and inner hair borders
        const borderD: Record<string, { style: string; color?: { rgb: string } }> = {};
        if (c === 0) borderD.left = { style: 'medium', color: { rgb: '000000' } };
        if (c === 11) borderD.right = { style: 'medium', color: { rgb: '000000' } };
        
        if (r === 4) {
          // first data row
          borderD.top = { style: 'medium', color: { rgb: '000000' } };
          borderD.bottom = { style: 'hair', color: { rgb: 'A0A0A0' } };
        } else if (r === lastDataRowNumber - 1) {
          // last data row
          borderD.top = { style: 'hair', color: { rgb: 'A0A0A0' } };
          borderD.bottom = { style: 'medium', color: { rgb: '000000' } };
        } else {
          borderD.bottom = { style: 'hair', color: { rgb: 'A0A0A0' } };
        }

        cell.s = {
          font: { name: 'Arial Narrow', sz: 10, bold: false, color: { rgb: '000000' } },
          border: borderD,
          alignment: { horizontal: cellAlign, vertical: 'center' }
        };

        if (c >= 2 && c <= 4) {
          cell.t = 'n';
          cell.z = '#,##0';
        } else if (c >= 5 && c <= 10) {
          cell.t = 'n';
          cell.z = '#,##0.00';
        } else if (c === 11) {
          cell.t = 'n';
          cell.z = '0.00%';
        } else {
          cell.t = 's';
        }
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registros');
  XLSX.writeFile(wb, filename);
}

export function exportEjecucionMetas(rows: EjecucionRow[], filename = 'ejecucion-metas.xlsx', year = '2026') {
  const wsData: unknown[][] = [];
  
  // Row 1: Entity Name & Current Date (NOW)
  wsData.push([
    '301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA',
    '', '', '', '', '', '', '', '', '',
    { f: 'NOW()' },
    ''
  ]);
  
  // Row 2: Banner (merged A2:L2)
  wsData.push([
    `Ejecución Presupuestal  - Período ${year}`,
    '', '', '', '', '', '', '', '', '', '', ''
  ]);
  
  // Row 3: Blank Row
  wsData.push(Array(12).fill(''));
  
  // Row 4: Cabeceras
  wsData.push([
    'Codigo',
    'Nombre Meta',
    'Pia',
    'Mod',
    'Pím',
    'Certicado',
    'CompromisoA',
    'CompromisoM',
    'Devengado',
    'Girado',
    'Saldo',
    'Avan'
  ]);

  // Data Rows (Starting at row 5, which is index 4 in wsData)
  rows.forEach(r => {
    wsData.push([
      r.codigo,
      r.nombre,
      n(r.pia),
      n(r.modif),
      n(r.pim),
      n(r.certif),
      n(r.cpanua),
      n(r.atcp),
      n(r.devengado),
      n(r.girado),
      n(r.saldo),
      n(r.avance)
    ]);
  });

  const lastDataRowNumber = 4 + rows.length;
  const totalsRowNumber = lastDataRowNumber + 1;
  const hasRows = rows.length > 0;
  wsData.push([
    '',
    'T O T A L E S',
    hasRows ? { f: `SUBTOTAL(9,C5:C${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,D5:D${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,E5:E${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,F5:F${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,G5:G${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,H5:H${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,I5:I${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,J5:J${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,K5:K${lastDataRowNumber})` } : 0,
    hasRows ? { f: `I${totalsRowNumber}/E${totalsRowNumber}` } : 0
  ]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Layout properties
  ws['!cols'] = [
    { wch: 6.33 },   // Codigo
    { wch: 65.11 },  // Nombre Meta
    { wch: 11.44 },  // Pia
    { wch: 11.44 },  // Mod
    { wch: 11.44 },  // Pim
    { wch: 11.44 },  // Certificado
    { wch: 14.11 },  // CompromisoA
    { wch: 14.00 },  // CompromisoM
    { wch: 11.44 },  // Devengado
    { wch: 11.44 },  // Girado
    { wch: 11.44 },  // Saldo
    { wch: 6.89 }    // Avan
  ];

  ws['!rows'] = [
    { hpt: 14.40 },  // Row 1
    { hpt: 22.50 },  // Row 2 (banner)
    { hpt: 14.40 },  // Row 3
    { hpt: 15.00 }   // Row 4 (headers)
  ];
  for (let r = 4; r < 4 + rows.length; r++) {
    ws['!rows'].push({ hpt: 14.40 });
  }
  ws['!rows'].push({ hpt: 15.00 });

  ws['!merges'] = [
    { s: { r: 0, c: 10 }, e: { r: 0, c: 11 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } }
  ];

  ws['!views'] = [{ showGridLines: false }];

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({c, r});
      const cell = ws[cellRef];
      if (!cell) continue;

      if (r === 0) {
        if (c === 10) {
          cell.s = {
            font: { name: 'Arial Narrow', sz: 11, bold: false, color: { rgb: '000000' } },
            alignment: { horizontal: 'right', vertical: 'center' }
          };
          cell.z = 'm/d/yy h:mm';
        } else if (c === 0) {
          cell.s = {
            font: { name: 'Arial Narrow', sz: 11, bold: false, color: { rgb: '000000' } },
            alignment: { horizontal: 'left', vertical: 'center' }
          };
        }
      } else if (r === 1) {
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: '44546A' } },
          font: { name: 'Arial Narrow', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      } else if (r === 3) {
        const borderH: Record<string, { style: string; color?: { rgb: string } }> = {
          top: { style: 'medium', color: { rgb: '000000' } },
          bottom: { style: 'medium', color: { rgb: '000000' } }
        };
        if (c === 0) borderH.left = { style: 'medium', color: { rgb: '000000' } };
        if (c === 11) borderH.right = { style: 'medium', color: { rgb: '000000' } };

        cell.s = {
          font: { name: 'Arial Narrow', sz: 10, bold: false, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderH
        };
      } else if (r === range.e.r) {
        const borderTot: Record<string, { style: string; color?: { rgb: string } }> = {
          top: { style: 'medium', color: { rgb: '000000' } },
          bottom: { style: 'medium', color: { rgb: '000000' } }
        };
        if (c === 0) borderTot.left = { style: 'medium', color: { rgb: '000000' } };
        if (c === 11) borderTot.right = { style: 'medium', color: { rgb: '000000' } };

        if (c === 1) {
          cell.s = {
            font: { name: 'Arial Narrow', sz: 11, bold: true, color: { rgb: '000000' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderTot
          };
        } else if (c >= 2 && c <= 11) {
          cell.s = {
            font: { name: 'Arial Narrow', sz: 10, bold: false, color: { rgb: '000000' } },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: borderTot
          };
          if (c === 11) {
            cell.z = '0.00%';
          } else if (c >= 2 && c <= 4) {
            cell.z = '#,##0';
          } else {
            cell.z = '#,##0.00';
          }
        } else {
          cell.s = { border: borderTot };
        }
      } else if (r > 3) {
        let cellAlign = 'right';
        if (c === 0) cellAlign = 'center';
        if (c === 1) cellAlign = 'left';

        const borderD: Record<string, { style: string; color?: { rgb: string } }> = {};
        if (c === 0) borderD.left = { style: 'medium', color: { rgb: '000000' } };
        if (c === 11) borderD.right = { style: 'medium', color: { rgb: '000000' } };
        
        if (r === 4) {
          borderD.top = { style: 'medium', color: { rgb: '000000' } };
          borderD.bottom = { style: 'hair', color: { rgb: 'A0A0A0' } };
        } else if (r === lastDataRowNumber - 1) {
          borderD.top = { style: 'hair', color: { rgb: 'A0A0A0' } };
          borderD.bottom = { style: 'medium', color: { rgb: '000000' } };
        } else {
          borderD.bottom = { style: 'hair', color: { rgb: 'A0A0A0' } };
        }

        cell.s = {
          font: { name: 'Arial Narrow', sz: 10, bold: false, color: { rgb: '000000' } },
          border: borderD,
          alignment: { horizontal: cellAlign, vertical: 'center' }
        };

        if (c >= 2 && c <= 4) {
          cell.t = 'n';
          cell.z = '#,##0';
        } else if (c >= 5 && c <= 10) {
          cell.t = 'n';
          cell.z = '#,##0.00';
        } else if (c === 11) {
          cell.t = 'n';
          cell.z = '0.00%';
        } else {
          cell.t = 's';
        }
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registros');
  XLSX.writeFile(wb, filename);
}

export function exportEjecucionPPTOMeta(rows: Record<string, unknown>[], filename = 'ejecucion_ppto_meta.xlsx') {
  const wsData: unknown[][] = [];
  
  // Row 1: Entity Name & Current Date (NOW)
  wsData.push([
    '301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA',
    '', '', '', '', '', '', '', '', '',
    { f: 'NOW()' },
    ''
  ]);
  
  // Row 2: Banner (merged A2:L2)
  wsData.push([
    'Ejecución Presupuestal  - Programa Presupuestal',
    '', '', '', '', '', '', '', '', '', '', ''
  ]);
  
  // Row 3: Blank Row
  wsData.push(Array(12).fill(''));
  
  // Row 4: Cabeceras
  wsData.push([
    'Codigo',
    'Nombre Ppto',
    'Pia',
    'Mod',
    'Pím',
    'Certicado',
    'CompromisoA',
    'CompromisoM',
    'Devengado',
    'Girado',
    'Saldo',
    'Avan'
  ]);

  // Data Rows (Starting at row 5, which is index 4 in wsData)
  rows.forEach((r, idx) => {
    const rowNum = 5 + idx;
    const code = String(r.codigo ?? r.act_proy ?? '');
    
    // In original ppto_meta, Saldo equals Girado
    const giradoVal = n(r.girado);
    
    wsData.push([
      code,
      String(r.nombre ?? r.act_proy_nombre ?? ''),
      n(r.pia),
      n(r.modif),
      n(r.pim),
      n(r.certif),
      n(r.cpanua),
      n(r.atcp),
      n(r.devengado),
      giradoVal,
      giradoVal, // Saldo = Girado
      { f: `IF(E${rowNum}>0,I${rowNum}/E${rowNum},0)` } // Avan = Devengado / PIM
    ]);
  });

  const lastDataRowNumber = 4 + rows.length;
  const totalsRowNumber = lastDataRowNumber + 1;
  const hasRows = rows.length > 0;
  wsData.push([
    '',
    'T O T A L E S',
    hasRows ? { f: `SUBTOTAL(9,C5:C${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,D5:D${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,E5:E${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,F5:F${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,G5:G${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,H5:H${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,I5:I${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,J5:J${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,K5:K${lastDataRowNumber})` } : 0,
    hasRows ? { f: `I${totalsRowNumber}/E${totalsRowNumber}` } : 0
  ]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Layout properties
  ws['!cols'] = [
    { wch: 6.33 },   // Codigo
    { wch: 65.11 },  // Nombre Ppto
    { wch: 11.44 },  // Pia
    { wch: 11.44 },  // Mod
    { wch: 11.44 },  // Pim
    { wch: 11.44 },  // Certificado
    { wch: 14.11 },  // CompromisoA
    { wch: 14.00 },  // CompromisoM
    { wch: 11.44 },  // Devengado
    { wch: 11.44 },  // Girado
    { wch: 11.44 },  // Saldo
    { wch: 6.89 }    // Avan
  ];

  ws['!rows'] = [
    { hpt: 14.40 },  // Row 1
    { hpt: 22.50 },  // Row 2 (banner)
    { hpt: 14.40 },  // Row 3
    { hpt: 15.00 }   // Row 4 (headers)
  ];
  for (let r = 4; r < 4 + rows.length; r++) {
    ws['!rows'].push({ hpt: 14.40 });
  }
  ws['!rows'].push({ hpt: 15.00 });

  ws['!merges'] = [
    { s: { r: 0, c: 10 }, e: { r: 0, c: 11 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } }
  ];

  ws['!views'] = [{ showGridLines: false }];

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({c, r});
      const cell = ws[cellRef];
      if (!cell) continue;

      if (r === 0) {
        if (c === 10) {
          cell.s = {
            font: { name: 'Arial Narrow', sz: 11, bold: false, color: { rgb: '000000' } },
            alignment: { horizontal: 'right', vertical: 'center' }
          };
          cell.z = 'm/d/yy h:mm';
        } else if (c === 0) {
          cell.s = {
            font: { name: 'Arial Narrow', sz: 11, bold: false, color: { rgb: '000000' } },
            alignment: { horizontal: 'left', vertical: 'center' }
          };
        }
      } else if (r === 1) {
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: '44546A' } },
          font: { name: 'Arial Narrow', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      } else if (r === 3) {
        const borderH: Record<string, { style: string; color?: { rgb: string } }> = {
          top: { style: 'medium', color: { rgb: '000000' } },
          bottom: { style: 'medium', color: { rgb: '000000' } }
        };
        if (c === 0) borderH.left = { style: 'medium', color: { rgb: '000000' } };
        if (c === 11) borderH.right = { style: 'medium', color: { rgb: '000000' } };

        cell.s = {
          font: { name: 'Arial Narrow', sz: 10, bold: false, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderH
        };
      } else if (r === range.e.r) {
        const borderTot: Record<string, { style: string; color?: { rgb: string } }> = {
          top: { style: 'medium', color: { rgb: '000000' } },
          bottom: { style: 'medium', color: { rgb: '000000' } }
        };
        if (c === 0) borderTot.left = { style: 'medium', color: { rgb: '000000' } };
        if (c === 11) borderTot.right = { style: 'medium', color: { rgb: '000000' } };

        if (c === 1) {
          cell.s = {
            font: { name: 'Arial Narrow', sz: 11, bold: true, color: { rgb: '000000' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderTot
          };
        } else if (c >= 2 && c <= 11) {
          cell.s = {
            font: { name: 'Arial Narrow', sz: 10, bold: false, color: { rgb: '000000' } },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: borderTot
          };
          if (c === 11) {
            cell.z = '0.00%';
          } else if (c >= 2 && c <= 4) {
            cell.z = '#,##0';
          } else {
            cell.z = '#,##0.00';
          }
        } else {
          cell.s = { border: borderTot };
        }
      } else if (r > 3) {
        const dataRowIdx = r - 4;
        const rowData = rows[dataRowIdx];
        const isProgram = String(rowData.codigo ?? rowData.act_proy ?? '').trim() !== '';

        let cellAlign = 'right';
        if (c === 0) cellAlign = 'center';
        if (c === 1) cellAlign = 'left';

        const borderD: Record<string, { style: string; color?: { rgb: string } }> = {};
        if (c === 0) borderD.left = { style: 'medium', color: { rgb: '000000' } };
        if (c === 11) borderD.right = { style: 'medium', color: { rgb: '000000' } };
        
        if (r === 4) {
          borderD.top = { style: 'medium', color: { rgb: '000000' } };
          borderD.bottom = { style: 'hair', color: { rgb: 'A0A0A0' } };
        } else if (r === lastDataRowNumber - 1) {
          borderD.top = { style: 'hair', color: { rgb: 'A0A0A0' } };
          borderD.bottom = { style: 'medium', color: { rgb: '000000' } };
        } else {
          borderD.bottom = { style: 'hair', color: { rgb: 'A0A0A0' } };
        }

        cell.s = {
          font: { name: 'Arial Narrow', sz: 10, bold: isProgram, color: { rgb: '000000' } },
          border: borderD,
          alignment: { horizontal: cellAlign, vertical: 'center' }
        };

        if (c >= 2 && c <= 4) {
          cell.t = 'n';
          cell.z = '#,##0';
        } else if (c >= 5 && c <= 10) {
          cell.t = 'n';
          cell.z = '#,##0.00';
        } else if (c === 11) {
          cell.t = 'n';
          cell.z = '0.00%';
        } else {
          cell.t = 's';
        }
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registros');
  XLSX.writeFile(wb, filename);
}

export function exportEjecucionMetasClasificador(rows: Record<string, unknown>[], filename = 'ejecucion_metas_clasificador.xlsx', year = '2026') {
  const wsData: unknown[][] = [];
  
  // Row 1: Entity Name & Current Date (NOW)
  wsData.push([
    '301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA',
    '', '', '', '', '', '', '', '', '', '',
    { f: 'NOW()' },
    ''
  ]);
  
  // Row 2: Banner (merged A2:M2)
  wsData.push([
    `Ejecución Presupuestal  - Período ${year}`,
    '', '', '', '', '', '', '', '', '', '', '', ''
  ]);
  
  // Row 3: Blank Row
  wsData.push(Array(13).fill(''));
  
  // Row 4: Cabeceras
  wsData.push([
    'Codigo',
    'Nombre Meta',
    '', // Column C is empty
    'Pia',
    'Mod',
    'Pím',
    'Certicado',
    'CompromisoA',
    'CompromisoM',
    'Devengado',
    'Girado',
    'Saldo',
    'Avan'
  ]);

  // Data Rows (Starting at row 5, which is index 4 in wsData)
  rows.forEach((r, idx) => {
    const rowNum = 5 + idx;
    const code = String(r.codigo ?? r.meta_codigo ?? '');
    const giradoVal = n(r.girado);
    
    wsData.push([
      code,
      String(r.nombre ?? r.meta_nombre ?? ''),
      '', // Column C is empty
      n(r.pia),
      n(r.modif),
      n(r.pim),
      n(r.certif),
      n(r.cpanua),
      n(r.atcp),
      n(r.devengado),
      giradoVal,
      giradoVal, // Saldo = Girado
      { f: `IF(G${rowNum}>0,J${rowNum}/G${rowNum},0)` } // Avan = Devengado / Certificado (J / G)
    ]);
  });

  const lastDataRowNumber = 4 + rows.length;
  const totalsRowNumber = lastDataRowNumber + 1;
  const hasRows = rows.length > 0;
  wsData.push([
    '',
    'T O T A L E S',
    '', // Column C is empty
    hasRows ? { f: `SUBTOTAL(9,D5:D${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,E5:E${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,F5:F${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,G5:G${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,H5:H${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,I5:I${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,J5:J${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,K5:K${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,L5:L${lastDataRowNumber})` } : 0,
    hasRows ? { f: `J${totalsRowNumber}/G${totalsRowNumber}` } : 0 // Devengado/Certificado (J/G)
  ]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Layout properties
  ws['!cols'] = [
    { wch: 6.33 },   // A: Codigo
    { wch: 7.33 },   // B: Nombre Meta (narrow)
    { wch: 34.66 },  // C: (Empty)
    { wch: 11.44 },  // D: Pia
    { wch: 13.00 },  // E: Mod
    { wch: 13.00 },  // F: Pim
    { wch: 13.00 },  // G: Certificado
    { wch: 14.11 },  // H: CompromisoA
    { wch: 14.00 },  // I: CompromisoM
    { wch: 11.44 },  // J: Devengado
    { wch: 13.00 },  // K: Girado
    { wch: 13.00 },  // L: Saldo
    { wch: 6.89 }    // M: Avan
  ];

  ws['!rows'] = [
    { hpt: 14.40 },  // Row 1
    { hpt: 22.50 },  // Row 2 (banner)
    { hpt: 14.40 },  // Row 3
    { hpt: 15.00 }   // Row 4 (headers)
  ];
  for (let r = 4; r < 4 + rows.length; r++) {
    ws['!rows'].push({ hpt: 14.40 });
  }
  ws['!rows'].push({ hpt: 15.00 });

  ws['!merges'] = [
    { s: { r: 0, c: 11 }, e: { r: 0, c: 12 } }, // Merge DATE info (L1:M1)
    { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } }  // Merge banner across M columns (A2:M2)
  ];

  ws['!views'] = [{ showGridLines: false }];

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({c, r});
      const cell = ws[cellRef];
      if (!cell) continue;

      if (r === 0) {
        if (c === 11) {
          cell.s = {
            font: { name: 'Arial Narrow', sz: 11, bold: false, color: { rgb: '000000' } },
            alignment: { horizontal: 'right', vertical: 'center' }
          };
          cell.z = 'm/d/yy h:mm';
        } else if (c === 0) {
          cell.s = {
            font: { name: 'Arial Narrow', sz: 11, bold: false, color: { rgb: '000000' } },
            alignment: { horizontal: 'left', vertical: 'center' }
          };
        }
      } else if (r === 1) {
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: '44546A' } },
          font: { name: 'Arial Narrow', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      } else if (r === 3) {
        const borderH: Record<string, { style: string; color?: { rgb: string } }> = {
          top: { style: 'medium', color: { rgb: '000000' } },
          bottom: { style: 'medium', color: { rgb: '000000' } }
        };
        if (c === 0) borderH.left = { style: 'medium', color: { rgb: '000000' } };
        if (c === 12) borderH.right = { style: 'medium', color: { rgb: '000000' } };

        cell.s = {
          font: { name: 'Arial Narrow', sz: 10, bold: false, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderH
        };
      } else if (r === range.e.r) {
        const borderTot: Record<string, { style: string; color?: { rgb: string } }> = {
          top: { style: 'medium', color: { rgb: '000000' } },
          bottom: { style: 'medium', color: { rgb: '000000' } }
        };
        if (c === 0) borderTot.left = { style: 'medium', color: { rgb: '000000' } };
        if (c === 12) borderTot.right = { style: 'medium', color: { rgb: '000000' } };

        if (c === 1) {
          cell.s = {
            font: { name: 'Arial Narrow', sz: 11, bold: true, color: { rgb: '000000' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderTot
          };
        } else if (c >= 3 && c <= 12) {
          cell.s = {
            font: { name: 'Arial Narrow', sz: 10, bold: false, color: { rgb: '000000' } },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: borderTot
          };
          if (c === 12) {
            cell.z = '0.00%';
          } else if (c >= 3 && c <= 5) {
            cell.z = '#,##0';
          } else {
            cell.z = '#,##0.00';
          }
        } else {
          cell.s = { border: borderTot };
        }
      } else if (r > 3) {
        const dataRowIdx = r - 4;
        const rowData = rows[dataRowIdx];
        const code = String(rowData.codigo ?? rowData.meta_codigo ?? '').trim();
        const nameStr = String(rowData.nombre ?? rowData.meta_nombre ?? '');
        
        const isMeta = code !== '';
        const isRubro = code === '' && !nameStr.startsWith('2.');
        const isBold = isMeta || isRubro;

        let cellAlign = 'right';
        if (c === 0) cellAlign = 'center';
        if (c === 1) cellAlign = 'left';

        const borderD: Record<string, { style: string; color?: { rgb: string } }> = {};
        if (c === 0) borderD.left = { style: 'medium', color: { rgb: '000000' } };
        if (c === 12) borderD.right = { style: 'medium', color: { rgb: '000000' } };
        
        if (r === 4) {
          borderD.top = { style: 'medium', color: { rgb: '000000' } };
          borderD.bottom = { style: 'hair', color: { rgb: 'A0A0A0' } };
        } else if (r === lastDataRowNumber - 1) {
          borderD.top = { style: 'hair', color: { rgb: 'A0A0A0' } };
          borderD.bottom = { style: 'medium', color: { rgb: '000000' } };
        } else {
          borderD.bottom = { style: 'hair', color: { rgb: 'A0A0A0' } };
        }

        cell.s = {
          font: { name: 'Arial Narrow', sz: 10, bold: isBold, color: { rgb: '000000' } },
          border: borderD,
          alignment: { horizontal: cellAlign, vertical: 'center' }
        };

        if (c >= 3 && c <= 5) {
          cell.t = 'n';
          cell.z = '#,##0';
        } else if (c >= 6 && c <= 11) {
          cell.t = 'n';
          cell.z = '#,##0.00';
        } else if (c === 12) {
          cell.t = 'n';
          cell.z = '0.00%';
        } else {
          cell.t = 's';
        }
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registros');
  XLSX.writeFile(wb, filename);
}

/**
 * 2. Export DETALLE DE MOVIMENTOS DE CERTICACIONES Y COMPROMISOS ANUALES
 * File: certificados.xlsx
 * Font: Calibri
 * SheetName: [programCode]
 */
export function exportCertificados(programCode: string, programName: string, rows: CertificadoRow[], filename = 'certificados.xlsx') {
  const wsData: unknown[][] = [];
  
  // Row 1: Entity Name
  wsData.push([
    '301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ]);
  // Row 2: Blank Row
  wsData.push(Array(18).fill(''));
  // Row 3: Banner Title (A3:R3)
  wsData.push([
    'DETALLE DE MOVIMENTOS DE CERTICACIONES Y COMPROMISOS ANUALES',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ]);
  // Row 4: Blank
  wsData.push(Array(18).fill(''));
  // Row 5: Program Header
  wsData.push([
    'PROG:',
    `${programCode} ${programName}`,
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ]);
  // Row 6: Blank
  wsData.push(Array(18).fill(''));
  
  // Row 7: Cabeceras
  wsData.push([
    'ANO_EJE',
    'SEC_EJEC',
    'CERTIFICADO',
    'SECUEN',
    'CORRE',
    'RUBRO',
    'COD_DOC',
    'NUM_DOC',
    'FECHA_DOC',
    'Gen',
    'CLASIF',
    'PROGRAMA',
    'META',
    'CERTIFICADO',
    'COMP.ANUAL',
    'FEC_PROC',
    'TIPO_REG',
    'EST'
  ]);

  // Data rows
  rows.forEach(r => {
    const isCert = r.tipo_reg === 'OP.INICIAL' && (r.est_reg === 'APROBADO' || !r.est_reg);
    const certVal = isCert ? n(r.monto) : 0;
    const compVal = !isCert ? n(r.monto) : 0;

    wsData.push([
      r.ano_eje || '2026',
      '301548',
      r.certif,
      r.secuencia,
      r.correlat,
      r.rubro,
      r.cod_doc,
      r.num_doc,
      formatDate(r.fecha_doc),
      r.clasif ? r.clasif.substring(0, 3) : '',
      `${r.clasif || ''}   ${r.clasif_nombre || ''}`.trim(),
      `${programCode} ${programName}`,
      `${r.sec_func || ''} ${r.meta_nombre || ''}`.trim(),
      certVal,
      compVal,
      formatDate(r.fec_proc),
      r.tipo_reg,
      (r.est_env || r.est_reg || 'A').substring(0, 1)
    ]);
  });

  const lastDataRowNumber = 7 + rows.length; // Row number of the last data row (1-indexed)
  
  // Tail rows: 2 blank rows
  wsData.push(Array(18).fill(''));
  wsData.push(Array(18).fill(''));
  
  const totalsRowIdx = lastDataRowNumber + 3; // 1-indexed totals row

  const hasRows = rows.length > 0;

  // Push Totals Row
  const totalRow: unknown[] = Array(18).fill('');
  totalRow[7] = 'T O T A L E S '; // Put text in H (col index 7)
  totalRow[13] = hasRows ? { f: `SUBTOTAL(9,N8:N${lastDataRowNumber})` } : 0; // SUBTOTAL in N
  totalRow[14] = hasRows ? { f: `SUBTOTAL(9,O8:O${lastDataRowNumber})` } : 0; // SUBTOTAL in O
  wsData.push(totalRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column Dimensions
  ws['!cols'] = [
    { wch: 7.55 },   // ANO_EJE
    { wch: 7.89 },   // SEC_EJEC
    { wch: 11.44 },  // CERTIFICADO
    { wch: 6.55 },   // SECUEN
    { wch: 6.11 },   // CORRE
    { wch: 6.89 },   // RUBRO
    { wch: 7.00 },   // COD_DOC
    { wch: 18.11 },  // NUM_DOC
    { wch: 10.44 },  // FECHA_DOC
    { wch: 6.44 },   // Gen
    { wch: 24.89 },  // CLASIF
    { wch: 46.89 },  // PROGRAMA
    { wch: 52.44 },  // META
    { wch: 12.66 },  // CERTIFICADO (monto)
    { wch: 12.66 },  // COMP.ANUAL (monto)
    { wch: 10.44 },  // FEC_PROC
    { wch: 10.55 },  // TIPO_REG
    { wch: 5.44 }    // EST
  ];

  // Row heights
  ws['!rows'] = [
    { hpt: 12.00 },  // Row 1
    { hpt: 12.00 },  // Row 2
    { hpt: 15.60 },  // Row 3 (banner)
    { hpt: 12.00 },  // Row 4
    { hpt: 12.00 },  // Row 5 (prog info)
    { hpt: 12.00 },  // Row 6
    { hpt: 21.00 }   // Row 7 (headers)
  ];
  for (let r = 7; r < lastDataRowNumber; r++) {
    ws['!rows'].push({ hpt: 24.00 }); // Data rows
  }
  ws['!rows'].push({ hpt: 12.00 });  // Blank tail 1
  ws['!rows'].push({ hpt: 12.00 });  // Blank tail 2
  ws['!rows'].push({ hpt: 16.50 });  // Totals Row

  ws['!merges'] = [
    { s: { r: 2, c: 0 }, e: { r: 2, c: 17 } }, // Title banner
    { s: { r: 4, c: 1 }, e: { r: 4, c: 17 } }, // Prog code/name header
    { s: { r: totalsRowIdx - 1, c: 7 }, e: { r: totalsRowIdx - 1, c: 10 } } // Totals label H to K
  ];

  const borderHairGrid = {
    top: { style: 'hair', color: { rgb: 'B0B0B0' } },
    bottom: { style: 'hair', color: { rgb: 'B0B0B0' } },
    left: { style: 'hair', color: { rgb: 'B0B0B0' } },
    right: { style: 'hair', color: { rgb: 'B0B0B0' } }
  };

  const borderThinHeader = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  };

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({c, r});
      const cell = ws[cellRef];
      if (!cell) continue;

      if (r === 0) {
        // Row 1
        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '000000' } }
        };
      } else if (r === 2) {
        // Row 3: Banner
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: '5B9BD5' } }, // Theme 8
          font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      } else if (r === 4) {
        // Row 5: Prog Info
        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } }
        };
      } else if (r === 6) {
        // Row 7: Cabeceras
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'FFF2CB' } }, // Theme 7 tint 0.8
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThinHeader
        };
      } else if (r === totalsRowIdx - 1) {
        // Totals Row
        if (c >= 7 && c <= 10) {
          cell.s = {
            font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: borderHairGrid
          };
        } else if (c === 13 || c === 14) {
          cell.s = {
            font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: borderHairGrid
          };
          cell.z = '#,##0.00';
        } else if (c >= 11 && c <= 12) {
          cell.s = {
            font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderHairGrid
          };
        }
      } else if (r > 6) {
        // Data Rows
        let cellAlign = 'center';
        if (c === 7 || c === 10 || c === 11 || c === 12 || c === 16) {
          cellAlign = 'left';
        }
        if (c === 13 || c === 14) {
          cellAlign = 'right';
        }

        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '000000' } },
          border: borderHairGrid,
          alignment: { 
            horizontal: cellAlign, 
            vertical: 'top', 
            wrapText: (c === 10 || c === 11 || c === 12) 
          }
        };

        if (c === 13 || c === 14) {
          cell.t = 'n';
          cell.z = '#,##0.00';
        }
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, programCode);
  XLSX.writeFile(wb, filename);
}

/**
 * 3. Export DETALLE DE REGISTROS - DEVENGADOS
 * File: devengados.xlsx
 * Font: Calibri
 * SheetName: [programCode]
 */
export function exportDevengados(programCode: string, programName: string, rows: ExpedienteRow[], filename = 'devengados.xlsx') {
  const wsData: unknown[][] = [];
  
  // Row 1: Entity Name
  wsData.push([
    '301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ]);
  // Row 2: Blank Row
  wsData.push(Array(19).fill(''));
  // Row 3: Banner Title (A3:S3)
  wsData.push([
    'DETALLE DE REGISTROS - DEVENGADOS',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ]);
  // Row 4: Blank
  wsData.push(Array(19).fill(''));
  // Row 5: Program Header
  wsData.push([
    'PROG.:',
    `${programCode} ${programName}`,
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ]);
  // Row 6: Blank
  wsData.push(Array(19).fill(''));
  
  // Row 7: Cabeceras
  wsData.push([
    'ANO_EJE',
    'MES_EJE',
    'EXPEDIENTE',
    'TO',
    'SECUEN',
    'CORR',
    'RB',
    'TR',
    'COD',
    'NUM_DOC',
    'FECHA_DOC',
    'PROVEEDOR',
    'CLASIFICAD',
    'META',
    'MONTO',
    'FEC_APROB',
    'EST',
    'CERTIF',
    'CERTIF_SEC'
  ]);

  // Data rows
  rows.forEach(r => {
    wsData.push([
      r.ano_eje || '2026',
      r.mes_eje,
      r.expediente,
      r.tipo_op,
      r.sec_reg,
      r.corr,
      r.rb,
      r.tr,
      r.cod_doc,
      r.num_doc,
      formatDate(r.fecha_doc),
      `${r.proveedor_ruc || ''} ${r.proveedor_nombre || ''}`.trim(),
      `${r.clasificad || ''}   ${r.clasif_nombre || ''}`.trim(),
      `${r.sec_func || ''} ${r.meta_nombre || ''}`.trim(),
      n(r.monto),
      formatDate(r.fec_aprob),
      r.estado ? r.estado.substring(0, 1) : 'A',
      r.certif,
      r.certif_sec
    ]);
  });

  const lastDataRowNumber = 7 + rows.length; // Row number of the last data row (1-indexed)
  
  // Tail rows: 2 blank rows
  wsData.push(Array(19).fill(''));
  wsData.push(Array(19).fill(''));
  
  const totalsRowIdx = lastDataRowNumber + 3; // 1-indexed totals row

  const hasRows = rows.length > 0;

  // Push Totals Row
  const totalRow: unknown[] = Array(19).fill('');
  totalRow[10] = 'T O T A L E S'; // Put text in K (col index 10)
  totalRow[14] = hasRows ? { f: `SUBTOTAL(9,O8:O${lastDataRowNumber})` } : 0; // SUBTOTAL in O
  wsData.push(totalRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column Dimensions
  ws['!cols'] = [
    { wch: 8.66 },   // ANO_EJE
    { wch: 7.33 },   // MES_EJE
    { wch: 12.11 },  // EXPEDIENTE
    { wch: 4.55 },   // TO
    { wch: 8.89 },   // SECUEN
    { wch: 7.33 },   // CORR
    { wch: 5.33 },   // RB
    { wch: 5.33 },   // TR
    { wch: 8.00 },   // COD
    { wch: 14.66 },  // NUM_DOC
    { wch: 12.00 },  // FECHA_DOC
    { wch: 37.00 },  // PROVEEDOR
    { wch: 38.89 },  // CLASIFICAD
    { wch: 50.44 },  // META
    { wch: 12.33 },  // MONTO
    { wch: 11.66 },  // FEC_APROB
    { wch: 4.66 },   // EST
    { wch: 9.55 },   // CERTIF
    { wch: 9.66 }    // CERTIF_SEC
  ];

  // Row heights
  ws['!rows'] = [
    { hpt: 12.00 },  // Row 1
    { hpt: 12.00 },  // Row 2
    { hpt: 21.00 },  // Row 3 (banner)
    { hpt: 12.00 },  // Row 4
    { hpt: 12.00 },  // Row 5 (prog info)
    { hpt: 12.00 },  // Row 6
    { hpt: 15.00 }   // Row 7 (headers)
  ];
  for (let r = 7; r < lastDataRowNumber; r++) {
    ws['!rows'].push({ hpt: 24.00 }); // Data rows
  }
  ws['!rows'].push({ hpt: 12.00 });  // Blank tail 1
  ws['!rows'].push({ hpt: 12.00 });  // Blank tail 2
  ws['!rows'].push({ hpt: 16.50 });  // Totals Row

  ws['!merges'] = [
    { s: { r: 2, c: 0 }, e: { r: 2, c: 18 } }, // Title banner
    { s: { r: 4, c: 1 }, e: { r: 4, c: 18 } }, // Prog code/name header
    { s: { r: totalsRowIdx - 1, c: 10 }, e: { r: totalsRowIdx - 1, c: 12 } } // Totals label K to M
  ];

  const borderHairGrid = {
    top: { style: 'hair', color: { rgb: 'B0B0B0' } },
    bottom: { style: 'hair', color: { rgb: 'B0B0B0' } },
    left: { style: 'hair', color: { rgb: 'B0B0B0' } },
    right: { style: 'hair', color: { rgb: 'B0B0B0' } }
  };

  const borderThinHeader = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  };

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({c, r});
      const cell = ws[cellRef];
      if (!cell) continue;

      if (r === 0) {
        // Row 1
        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '000000' } }
        };
      } else if (r === 2) {
        // Row 3: Banner
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'BDD6EE' } }, // Theme 8 tint 0.6 (BDD6EE)
          font: { name: 'Calibri', sz: 16, bold: true, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      } else if (r === 4) {
        // Row 5: Prog Info
        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '000000' } }
        };
      } else if (r === 6) {
        // Row 7: Cabeceras
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'BDD6EE' } }, // Theme 8 tint 0.6
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: 'FF0070C0' } }, // Blue text
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThinHeader
        };
      } else if (r === totalsRowIdx - 1) {
        // Totals Row
        if (c >= 10 && c <= 12) {
          cell.s = {
            font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderHairGrid
          };
        } else if (c === 14) {
          cell.s = {
            font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: borderHairGrid
          };
          cell.z = '#,##0.00';
        } else if (c >= 13 && c <= 18) {
          cell.s = {
            font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderHairGrid
          };
        }
      } else if (r > 6) {
        // Data Rows
        let cellAlign = 'center';
        if (c === 11 || c === 12 || c === 13) {
          cellAlign = 'left';
        }
        if (c === 14) {
          cellAlign = 'right';
        }

        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '000000' } },
          border: borderHairGrid,
          alignment: { 
            horizontal: cellAlign, 
            vertical: 'top', 
            wrapText: (c === 11 || c === 12 || c === 13) 
          }
        };

        if (c === 14) {
          cell.t = 'n';
          cell.z = '#,##0.00';
        }
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, programCode);
  XLSX.writeFile(wb, filename);
}

/**
 * 4. Export DETALLE DE REGISTROS - GIRADOS
 * File: giros.xlsx
 * Font: Calibri
 * SheetName: [programCode]
 */
export function exportGiros(programCode: string, programName: string, rows: ExpedienteRow[], filename = 'giros.xlsx') {
  const wsData: unknown[][] = [];
  
  // Row 1: Entity Name
  wsData.push([
    '301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ]);
  // Row 2: Blank Row
  wsData.push(Array(19).fill(''));
  // Row 3: Banner Title (A3:S3)
  wsData.push([
    'DETALLE DE REGISTROS - GIRADOS',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ]);
  // Row 4: Blank
  wsData.push(Array(19).fill(''));
  // Row 5: Program Header
  wsData.push([
    'PROG.:',
    `${programCode} ${programName}`,
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ]);
  // Row 6: Blank
  wsData.push(Array(19).fill(''));
  
  // Row 7: Cabeceras
  wsData.push([
    'ANO_EJE',
    'MES_EJE',
    'EXPEDIENTE',
    'TO',
    'SECUEN',
    'CORR',
    'RB',
    'TR',
    'COD',
    'NUM_DOC',
    'FECHA_DOC',
    'BENEFICIARIO',
    'CLASIFICAD',
    'META',
    'MONTO',
    'FEC_APROB',
    'EST',
    'CERTIF',
    'CERTIF_SEC'
  ]);

  // Data rows
  rows.forEach(r => {
    wsData.push([
      r.ano_eje || '2026',
      r.mes_eje,
      r.expediente,
      r.tipo_op,
      r.sec_reg,
      r.corr,
      r.rb,
      r.tr,
      r.cod_doc,
      r.num_doc,
      formatDate(r.fecha_doc),
      `${r.proveedor_ruc || ''} ${r.proveedor_nombre || ''}`.trim(),
      `${r.clasificad || ''}   ${r.clasif_nombre || ''}`.trim(),
      `${r.sec_func || ''} ${r.meta_nombre || ''}`.trim(),
      n(r.monto),
      formatDate(r.fec_aprob),
      r.estado ? r.estado.substring(0, 1) : 'A',
      r.certif,
      r.certif_sec
    ]);
  });

  const lastDataRowNumber = 7 + rows.length; // Row number of the last data row (1-indexed)
  
  // Tail rows: 2 blank rows
  wsData.push(Array(19).fill(''));
  wsData.push(Array(19).fill(''));
  
  const totalsRowIdx = lastDataRowNumber + 3; // 1-indexed totals row

  const hasRows = rows.length > 0;

  // Push Totals Row
  const totalRow: unknown[] = Array(19).fill('');
  totalRow[10] = 'T O T A L E S'; // Put text in K (col index 10)
  totalRow[14] = hasRows ? { f: `SUBTOTAL(9,O8:O${lastDataRowNumber})` } : 0; // SUBTOTAL in O
  wsData.push(totalRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column Dimensions
  ws['!cols'] = [
    { wch: 8.66 },   // ANO_EJE
    { wch: 7.33 },   // MES_EJE
    { wch: 12.11 },  // EXPEDIENTE
    { wch: 4.33 },   // TO
    { wch: 8.89 },   // SECUEN
    { wch: 7.33 },   // CORR
    { wch: 5.33 },   // RB
    { wch: 5.33 },   // TR
    { wch: 8.00 },   // COD
    { wch: 14.66 },  // NUM_DOC
    { wch: 12.00 },  // FECHA_DOC
    { wch: 35.89 },  // BENEFICIARIO
    { wch: 36.89 },  // CLASIFICAD
    { wch: 52.11 },  // META
    { wch: 12.33 },  // MONTO
    { wch: 11.66 },  // FEC_APROB
    { wch: 4.66 },   // EST
    { wch: 9.55 },   // CERTIF
    { wch: 9.66 }    // CERTIF_SEC
  ];

  // Row heights
  ws['!rows'] = [
    { hpt: 12.00 },  // Row 1
    { hpt: 12.00 },  // Row 2
    { hpt: 21.00 },  // Row 3 (banner)
    { hpt: 12.00 },  // Row 4
    { hpt: 12.00 },  // Row 5 (prog info)
    { hpt: 12.00 },  // Row 6
    { hpt: 15.00 }   // Row 7 (headers)
  ];
  for (let r = 7; r < lastDataRowNumber; r++) {
    ws['!rows'].push({ hpt: 24.00 }); // Data rows
  }
  ws['!rows'].push({ hpt: 12.00 });  // Blank tail 1
  ws['!rows'].push({ hpt: 12.00 });  // Blank tail 2
  ws['!rows'].push({ hpt: 16.50 });  // Totals Row

  ws['!merges'] = [
    { s: { r: 2, c: 0 }, e: { r: 2, c: 18 } }, // Title banner
    { s: { r: 4, c: 1 }, e: { r: 4, c: 18 } }, // Prog code/name header
    { s: { r: totalsRowIdx - 1, c: 10 }, e: { r: totalsRowIdx - 1, c: 12 } } // Totals label K to M
  ];

  const borderHairGrid = {
    top: { style: 'hair', color: { rgb: 'B0B0B0' } },
    bottom: { style: 'hair', color: { rgb: 'B0B0B0' } },
    left: { style: 'hair', color: { rgb: 'B0B0B0' } },
    right: { style: 'hair', color: { rgb: 'B0B0B0' } }
  };

  const borderThinHeader = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  };

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({c, r});
      const cell = ws[cellRef];
      if (!cell) continue;

      if (r === 0) {
        // Row 1
        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '000000' } }
        };
      } else if (r === 2) {
        // Row 3: Banner
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'BDD6EE' } }, // Theme 8 tint 0.6
          font: { name: 'Calibri', sz: 16, bold: true, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      } else if (r === 4) {
        // Row 5: Prog Info
        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '000000' } }
        };
      } else if (r === 6) {
        // Row 7: Cabeceras
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'BDD6EE' } }, // Theme 8 tint 0.6
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: 'FF0070C0' } }, // Blue text
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThinHeader
        };
      } else if (r === totalsRowIdx - 1) {
        // Totals Row
        if (c >= 10 && c <= 12) {
          cell.s = {
            font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderHairGrid
          };
        } else if (c === 14) {
          cell.s = {
            font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: borderHairGrid
          };
          cell.z = '#,##0.00';
        } else if (c >= 13 && c <= 18) {
          cell.s = {
            font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderHairGrid
          };
        }
      } else if (r > 6) {
        // Data Rows
        let cellAlign = 'center';
        if (c === 11 || c === 12 || c === 13) {
          cellAlign = 'left';
        }
        if (c === 14) {
          cellAlign = 'right';
        }

        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '000000' } },
          border: borderHairGrid,
          alignment: { 
            horizontal: cellAlign, 
            vertical: 'top', 
            wrapText: (c === 11 || c === 12 || c === 13) 
          }
        };

        if (c === 14) {
          cell.t = 'n';
          cell.z = '#,##0.00';
        }
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, programCode);
  XLSX.writeFile(wb, filename);
}

/**
 * 5. Export DETALLE DE REGISTROS - GIRADOS CON GLOSA
 * File: giros-con-glosa.xlsx -> downloaded as 'giros con glosa.xlsx'
 * Font: Calibri
 * SheetName: [programCode]
 */
export function exportGirosConGlosa(programCode: string, programName: string, rows: ExpedienteRow[], filename = 'giros con glosa.xlsx') {
  const wsData: unknown[][] = [];
  
  // Row 1: Entity Name
  wsData.push([
    '301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ]);
  // Row 2: Blank Row
  wsData.push(Array(20).fill(''));
  // Row 3: Banner Title (A3:T3)
  wsData.push([
    'DETALLE DE REGISTROS - GIRADOS',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ]);
  // Row 4: Blank
  wsData.push(Array(20).fill(''));
  // Row 5: Program Header (COMP.:)
  wsData.push([
    'COMP.:',
    `${programCode} ${programName}`,
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ]);
  // Row 6: Blank
  wsData.push(Array(20).fill(''));
  
  // Row 7: Cabeceras
  wsData.push([
    'ANO_EJE',
    'MES_EJE',
    'EXPEDIENTE',
    'TO',
    'SECUEN',
    'CORR',
    'RB',
    'TR',
    'COD',
    'NUM_DOC',
    'FECHA_DOC',
    'BENEFICIARIO',
    'CLASIFICAD',
    'META',
    'GLOSA',
    'MONTO',
    'FEC_APROB',
    'EST',
    'CERTIF',
    'CERTIF_SEC'
  ]);

  // Data rows
  rows.forEach(r => {
    wsData.push([
      r.ano_eje || '2026',
      r.mes_eje,
      r.expediente,
      r.tipo_op,
      r.sec_reg,
      r.corr,
      r.rb,
      r.tr,
      r.cod_doc,
      r.num_doc,
      formatDate(r.fecha_doc),
      `${r.proveedor_ruc || ''} ${r.proveedor_nombre || ''}`.trim(),
      `${r.clasificad || ''}   ${r.clasif_nombre || ''}`.trim(),
      `${r.sec_func || ''} ${r.meta_nombre || ''}`.trim(),
      r.glosa || '',
      n(r.monto),
      formatDate(r.fec_aprob),
      r.estado ? r.estado.substring(0, 1) : 'A',
      r.certif,
      r.certif_sec
    ]);
  });

  const lastDataRowNumber = 7 + rows.length; // Row number of the last data row (1-indexed)
  
  // Tail rows: 2 blank rows
  wsData.push(Array(20).fill(''));
  wsData.push(Array(20).fill(''));
  
  const totalsRowIdx = lastDataRowNumber + 3; // 1-indexed totals row

  const hasRows = rows.length > 0;

  // Push Totals Row
  const totalRow: unknown[] = Array(20).fill('');
  totalRow[10] = 'T O T A L E S'; // Put text in K (col index 10)
  totalRow[15] = hasRows ? { f: `SUBTOTAL(9,P8:P${lastDataRowNumber})` } : 0; // SUBTOTAL in P (col index 15)
  wsData.push(totalRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column Dimensions
  ws['!cols'] = [
    { wch: 8.66 },   // ANO_EJE
    { wch: 7.33 },   // MES_EJE
    { wch: 12.11 },  // EXPEDIENTE
    { wch: 4.33 },   // TO
    { wch: 8.89 },   // SECUEN
    { wch: 7.33 },   // CORR
    { wch: 5.33 },   // RB
    { wch: 5.33 },   // TR
    { wch: 8.00 },   // COD
    { wch: 14.66 },  // NUM_DOC
    { wch: 12.00 },  // FECHA_DOC
    { wch: 35.89 },  // BENEFICIARIO
    { wch: 36.89 },  // CLASIFICAD
    { wch: 52.11 },  // META
    { wch: 45.00 },  // GLOSA
    { wch: 12.33 },  // MONTO
    { wch: 11.66 },  // FEC_APROB
    { wch: 4.66 },   // EST
    { wch: 9.55 },   // CERTIF
    { wch: 9.66 }    // CERTIF_SEC
  ];

  // Row heights
  ws['!rows'] = [
    { hpt: 12.00 },  // Row 1
    { hpt: 12.00 },  // Row 2
    { hpt: 21.00 },  // Row 3 (banner)
    { hpt: 12.00 },  // Row 4
    { hpt: 12.00 },  // Row 5 (prog info)
    { hpt: 12.00 },  // Row 6
    { hpt: 15.00 }   // Row 7 (headers)
  ];
  for (let r = 7; r < lastDataRowNumber; r++) {
    ws['!rows'].push({ hpt: 24.00 }); // Data rows
  }
  ws['!rows'].push({ hpt: 12.00 });  // Blank tail 1
  ws['!rows'].push({ hpt: 12.00 });  // Blank tail 2
  ws['!rows'].push({ hpt: 16.50 });  // Totals Row

  ws['!merges'] = [
    { s: { r: 2, c: 0 }, e: { r: 2, c: 19 } }, // Title banner
    { s: { r: 4, c: 1 }, e: { r: 4, c: 19 } }, // Prog code/name header
    { s: { r: totalsRowIdx - 1, c: 10 }, e: { r: totalsRowIdx - 1, c: 13 } } // Totals label K to N
  ];

  const borderHairGrid = {
    top: { style: 'hair', color: { rgb: 'B0B0B0' } },
    bottom: { style: 'hair', color: { rgb: 'B0B0B0' } },
    left: { style: 'hair', color: { rgb: 'B0B0B0' } },
    right: { style: 'hair', color: { rgb: 'B0B0B0' } }
  };

  const borderThinHeader = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  };

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({c, r});
      const cell = ws[cellRef];
      if (!cell) continue;

      if (r === 0) {
        // Row 1
        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '000000' } }
        };
      } else if (r === 2) {
        // Row 3: Banner
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'BDD6EE' } }, // Theme 8 tint 0.6
          font: { name: 'Calibri', sz: 16, bold: true, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      } else if (r === 4) {
        // Row 5: Prog Info
        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '000000' } }
        };
      } else if (r === 6) {
        // Row 7: Cabeceras
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'BDD6EE' } }, // Theme 8 tint 0.6
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: 'FF0070C0' } }, // Blue text
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThinHeader
        };
      } else if (r === totalsRowIdx - 1) {
        // Totals Row
        if (c >= 10 && c <= 13) {
          cell.s = {
            font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderHairGrid
          };
        } else if (c === 15) {
          cell.s = {
            font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: borderHairGrid
          };
          cell.z = '#,##0.00';
        } else if (c >= 14 && c <= 19) {
          cell.s = {
            font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderHairGrid
          };
        }
      } else if (r > 6) {
        // Data Rows
        let cellAlign = 'center';
        if (c === 11 || c === 12 || c === 13 || c === 14) {
          cellAlign = 'left';
        }
        if (c === 15) {
          cellAlign = 'right';
        }

        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '000000' } },
          border: borderHairGrid,
          alignment: { 
            horizontal: cellAlign, 
            vertical: 'top', 
            wrapText: (c === 11 || c === 12 || c === 13 || c === 14) 
          }
        };

        if (c === 15) {
          cell.t = 'n';
          cell.z = '#,##0.00';
        }
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, programCode);
  XLSX.writeFile(wb, filename);
}

/**
 * 6. Export Ficha de Proyecto
 * File: FichaProyecto.xlsx
 * Font: Calibri
 * SheetName: FichaProyecto
 */
export function exportFichaProyecto(projectInfo: {
  codigo: string;
  nombre: string;
  programa: string;
  programaNombre: string;
  obra: string;
  obraNombre: string;
  funcion: string;
  funcionNombre: string;
  division: string;
  divisionNombre: string;
  grupo: string;
  grupoNombre: string;
}, classifiers: {
  clasificador: string;
  nombre: string;
  pia: number;
  pim: number;
  certificado: number;
  devengado: number;
  girado: number;
}[]) {
  const wsData: unknown[][] = [];

  // Row 1: Entity & Date
  wsData.push([
    '301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA',
    '', '', '', '', 
    { f: 'NOW()' }
  ]);

  // Row 2: Title
  wsData.push([
    'FICHA RESUMEN DE PROYECTO - PERÍODO 2026',
    '', '', '', '', '', ''
  ]);

  // Row 3: Blank
  wsData.push(Array(7).fill(''));

  // Rows 4-9: Project Metadata
  wsData.push(['PROYECTO:', `${projectInfo.codigo} — ${projectInfo.nombre}`, '', '', '', '', '']);
  wsData.push(['PROGRAMA :', `${projectInfo.programa} — ${projectInfo.programaNombre}`, '', '', '', '', '']);
  wsData.push(['OBRA/ACC INVERSIÓN:', `${projectInfo.obra} — ${projectInfo.obraNombre}`, '', '', '', '', '']);
  wsData.push(['FUNCION :', `${projectInfo.funcion} — ${projectInfo.funcionNombre}`, '', '', '', '', '']);
  wsData.push(['DIV. FUNCIONAL :', `${projectInfo.division} — ${projectInfo.divisionNombre}`, '', '', '', '', '']);
  wsData.push(['GRUPO FUNCIONAL :', `${projectInfo.grupo} — ${projectInfo.grupoNombre}`, '', '', '', '', '']);

  // Row 10: Blank
  wsData.push(Array(7).fill(''));

  // Row 11: Classifiers Headers (A11:B11 merged)
  wsData.push([
    'C L A S I F I C A D O R E S',
    '',
    'PIA',
    'PIM',
    'CERTIFICADO',
    'DEVENGADO',
    'GIRADO'
  ]);

  // Data Rows (Starting at row 12, index 11 in wsData)
  classifiers.forEach(c => {
    wsData.push([
      c.clasificador,
      c.nombre,
      n(c.pia),
      n(c.pim),
      n(c.certificado),
      n(c.devengado),
      n(c.girado)
    ]);
  });

  const lastDataRowNumber = 11 + classifiers.length;
  const totalsRowNumber = lastDataRowNumber + 1;
  const hasRows = classifiers.length > 0;

  // Totals Row
  wsData.push([
    'TOTALES RESUMEN',
    '',
    hasRows ? { f: `SUBTOTAL(9,C12:C${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,D12:D${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,E12:E${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,F12:F${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,G12:G${lastDataRowNumber})` } : 0
  ]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Layout
  ws['!cols'] = [
    { wch: 15.00 }, // Clasificador
    { wch: 50.00 }, // Descripción
    { wch: 14.00 }, // PIA
    { wch: 14.00 }, // PIM
    { wch: 14.00 }, // CERTIFICADO
    { wch: 14.00 }, // DEVENGADO
    { wch: 14.00 }  // GIRADO
  ];

  ws['!rows'] = [
    { hpt: 15.00 }, // Row 1
    { hpt: 22.00 }, // Row 2 (Title)
    { hpt: 10.00 }  // Row 3
  ];
  for (let r = 3; r < 9; r++) {
    ws['!rows'].push({ hpt: 14.40 }); // Metadata rows
  }
  ws['!rows'].push({ hpt: 10.00 });   // Blank row 10
  ws['!rows'].push({ hpt: 18.00 });   // Headers row 11
  
  for (let r = 11; r < 11 + classifiers.length; r++) {
    ws['!rows'].push({ hpt: 14.40 }); // Data rows
  }
  ws['!rows'].push({ hpt: 18.00 });   // Totals row

  ws['!merges'] = [
    { s: { r: 0, c: 4 }, e: { r: 0, c: 5 } }, // Date NOW() merge
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Title banner merge
    // Metadata value merges (B-G)
    { s: { r: 3, c: 1 }, e: { r: 3, c: 6 } },
    { s: { r: 4, c: 1 }, e: { r: 4, c: 6 } },
    { s: { r: 5, c: 1 }, e: { r: 5, c: 6 } },
    { s: { r: 6, c: 1 }, e: { r: 6, c: 6 } },
    { s: { r: 7, c: 1 }, e: { r: 7, c: 6 } },
    { s: { r: 8, c: 1 }, e: { r: 8, c: 6 } },
    // Headers (A-B)
    { s: { r: 10, c: 0 }, e: { r: 10, c: 1 } },
    // Totals (A-B)
    { s: { r: totalsRowNumber - 1, c: 0 }, e: { r: totalsRowNumber - 1, c: 1 } }
  ];

  // Styles
  const borderHair = { style: 'hair', color: { rgb: 'B0B0B0' } };
  const borderDouble = { style: 'double', color: { rgb: '000000' } };
  const borderNormalThin = { style: 'thin', color: { rgb: '000000' } };

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({c, r});
      const cell = ws[cellRef];
      if (!cell) continue;

      if (r === 0) {
        if (c === 4) {
          cell.s = {
            font: { name: 'Calibri', sz: 9, bold: false },
            alignment: { horizontal: 'right', vertical: 'center' }
          };
          cell.z = 'm/d/yy h:mm';
        } else if (c === 0) {
          cell.s = {
            font: { name: 'Calibri', sz: 11, bold: false },
            alignment: { horizontal: 'left', vertical: 'center' }
          };
        }
      } else if (r === 1) {
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: '5B9BD5' } },
          font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      } else if (r >= 3 && r <= 8) {
        if (c === 0) {
          cell.s = {
            font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '44546A' } },
            alignment: { horizontal: 'left', vertical: 'center' }
          };
        } else if (c === 1) {
          cell.s = {
            font: { name: 'Calibri', sz: 9, bold: false },
            alignment: { horizontal: 'left', vertical: 'center' }
          };
        }
      } else if (r === 10) {
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'FFF2CB' } },
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: borderNormalThin, bottom: borderNormalThin,
            left: borderNormalThin, right: borderNormalThin
          }
        };
      } else if (r === totalsRowNumber - 1) {
        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
          alignment: { horizontal: c <= 1 ? 'center' : 'right', vertical: 'center' },
          border: {
            top: borderNormalThin,
            bottom: borderDouble
          }
        };
        if (c >= 2) {
          cell.t = 'n';
          cell.z = '#,##0.00';
        }
      } else if (r >= 11) {
        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '000000' } },
          alignment: { horizontal: c === 0 ? 'center' : c === 1 ? 'left' : 'right', vertical: 'center' },
          border: {
            top: borderHair, bottom: borderHair,
            left: borderHair, right: borderHair
          }
        };
        if (c >= 2) {
          cell.t = 'n';
          cell.z = '#,##0.00';
        }
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'FichaProyecto');
  XLSX.writeFile(wb, 'FichaProyecto.xlsx');
}

/**
 * 7. Export Resumen de Proyectos de Inversión
 * File: Resumen de Inversion.xlsx
 * Font: Calibri
 * SheetName: Proyectos
 */
export function exportResumenInversion(projects: {
  act_proy: string;
  act_proy_nombre: string;
  pia: number;
  pim: number;
  certif: number;
  comprometido: number;
  atcp: number;
  devengado: number;
  girado: number;
}[]) {
  const wsData: unknown[][] = [];

  // Row 1: Entity & Date
  wsData.push([
    '301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA',
    '', '', '', '', '', '', '',
    { f: 'NOW()' },
    '', ''
  ]);

  // Row 2: Blank
  wsData.push(Array(11).fill(''));

  // Row 3: Title
  wsData.push([
    'RESUMEN DE PROYECTOS DE INVERSION',
    '', '', '', '', '', '', '', '', '', ''
  ]);

  // Row 4: Blank
  wsData.push(Array(11).fill(''));

  // Row 5: Headers
  wsData.push([
    'CodProyecto',
    'NombreProyecto',
    'Pia',
    'Mod',
    'Pim',
    'Certificación',
    'Comp Anual',
    'Compromiso',
    'Devengado',
    'Girado',
    '%'
  ]);

  // Data rows (Starting at row 6, index 5 in wsData)
  projects.forEach((p, idx) => {
    const rowIdx = 6 + idx;
    wsData.push([
      p.act_proy,
      p.act_proy_nombre,
      n(p.pia),
      { f: `E${rowIdx}-C${rowIdx}` },
      n(p.pim),
      n(p.certif),
      n(p.comprometido),
      n(p.atcp),
      n(p.devengado),
      n(p.girado),
      { f: `IF(E${rowIdx}>0,I${rowIdx}/E${rowIdx},0)` }
    ]);
  });

  const lastDataRowNumber = 5 + projects.length;
  const totalsRowNumber = lastDataRowNumber + 1;
  const hasRows = projects.length > 0;

  // Totals row
  wsData.push([
    'TOTALES',
    '',
    hasRows ? { f: `SUM(C6:C${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUM(D6:D${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUM(E6:E${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUM(F6:F${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUM(G6:G${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUM(H6:H${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUM(I6:I${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUM(J6:J${lastDataRowNumber})` } : 0,
    hasRows ? { f: `IF(E${totalsRowNumber}>0,I${totalsRowNumber}/E${totalsRowNumber},0)` } : 0
  ]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Layout
  ws['!cols'] = [
    { wch: 12.00 }, // CodProyecto
    { wch: 55.00 }, // NombreProyecto
    { wch: 14.00 }, // PIA
    { wch: 14.00 }, // MOD
    { wch: 14.00 }, // PIM
    { wch: 14.00 }, // Certificacion
    { wch: 14.00 }, // Comp Anual
    { wch: 14.00 }, // Compromiso
    { wch: 14.00 }, // Devengado
    { wch: 14.00 }, // Girado
    { wch: 8.00 }   // %
  ];

  ws['!rows'] = [
    { hpt: 15.00 }, // Row 1
    { hpt: 10.00 }, // Row 2
    { hpt: 22.00 }, // Row 3
    { hpt: 10.00 }, // Row 4
    { hpt: 18.00 }  // Row 5
  ];
  for (let r = 5; r < 5 + projects.length; r++) {
    ws['!rows'].push({ hpt: 14.40 });
  }
  ws['!rows'].push({ hpt: 18.00 });

  ws['!merges'] = [
    { s: { r: 0, c: 8 }, e: { r: 0, c: 10 } }, // Date NOW() merge
    { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } }, // Title merge
    { s: { r: totalsRowNumber - 1, c: 0 }, e: { r: totalsRowNumber - 1, c: 1 } } // Totals label merge
  ];

  // Styles
  const borderHair = { style: 'hair', color: { rgb: 'B0B0B0' } };
  const borderDouble = { style: 'double', color: { rgb: '000000' } };
  const borderNormalThin = { style: 'thin', color: { rgb: '000000' } };

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({c, r});
      const cell = ws[cellRef];
      if (!cell) continue;

      if (r === 0) {
        if (c === 8) {
          cell.s = {
            font: { name: 'Calibri', sz: 9, bold: false },
            alignment: { horizontal: 'right', vertical: 'center' }
          };
          cell.z = 'm/d/yy h:mm';
        } else if (c === 0) {
          cell.s = {
            font: { name: 'Calibri', sz: 11, bold: false },
            alignment: { horizontal: 'left', vertical: 'center' }
          };
        }
      } else if (r === 2) {
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'BDD6EE' } },
          font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      } else if (r === 4) {
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'BDD6EE' } },
          font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: borderNormalThin, bottom: borderNormalThin,
            left: borderNormalThin, right: borderNormalThin
          }
        };
      } else if (r === totalsRowNumber - 1) {
        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
          alignment: { horizontal: c <= 1 ? 'center' : c === 10 ? 'center' : 'right', vertical: 'center' },
          border: {
            top: borderNormalThin,
            bottom: borderDouble
          }
        };
        if (c >= 2 && c <= 9) {
          cell.t = 'n';
          cell.z = '#,##0.00';
        } else if (c === 10) {
          cell.z = '0.00%';
        }
      } else if (r >= 5) {
        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '000000' } },
          alignment: { horizontal: c === 0 ? 'center' : c === 1 ? 'left' : c === 10 ? 'center' : 'right', vertical: 'center' },
          border: {
            top: borderHair, bottom: borderHair,
            left: borderHair, right: borderHair
          }
        };
        if (c >= 2 && c <= 9) {
          cell.t = 'n';
          cell.z = '#,##0.00';
        } else if (c === 10) {
          cell.z = '0.00%';
        }
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Proyectos');
  XLSX.writeFile(wb, 'Resumen de Inversion.xlsx');
}

/**
 * 8. Export EJECUCIÓN PRESUPUESTARAL - ACTIVIDAD / PROYECTO
 * File: ejecucion-actproy.xlsx
 * Font: Arial Narrow
 * SheetName: Registros
 */
export function exportEjecucionActProy(rows: {
  act_proy: string;
  act_proy_nombre: string;
  pia: number;
  pim: number;
  certif: number;
  comprometido: number;
  atcp: number;
  devengado: number;
  girado: number;
}[], filename = 'ejecucion-actproy.xlsx', title = 'Ejecución Presupuestal  - Actividad / Proyecto') {
  const wsData: unknown[][] = [];

  // Row 1: Entity Name & Current Date
  wsData.push([
    '301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA',
    '', '', '', '', '', '', '', '', '',
    { f: 'NOW()' },
    ''
  ]);

  // Row 2: Banner (merged A2:L2)
  wsData.push([
    title,
    '', '', '', '', '', '', '', '', '', '', ''
  ]);

  // Row 3: Blank Row
  wsData.push(Array(12).fill(''));

  // Row 4: Headers
  wsData.push([
    'Codigo',
    'Nombre Actividad / Proyecto',
    'Pia',
    'Mod',
    'Pïm',
    'Certicado',
    'CompromisoA',
    'CompromisoM',
    'Devengado',
    'Girado',
    'Saldo',
    'Avan'
  ]);

  // Data Rows (Starting at row 5, index 4 in wsData)
  rows.forEach((r, idx) => {
    const rowNum = 5 + idx;
    wsData.push([
      r.act_proy,
      r.act_proy_nombre,
      n(r.pia),
      { f: `E${rowNum}-C${rowNum}` },
      n(r.pim),
      n(r.certif),
      n(r.comprometido),
      n(r.atcp),
      n(r.devengado),
      n(r.girado),
      { f: `E${rowNum}-I${rowNum}` },
      { f: `IF(E${rowNum}>0,I${rowNum}/E${rowNum},0)` }
    ]);
  });

  const lastDataRowNumber = 4 + rows.length;
  const totalsRowNumber = lastDataRowNumber + 1;
  const hasRows = rows.length > 0;

  // Totals Row
  wsData.push([
    '',
    'T O T A L E S',
    hasRows ? { f: `SUBTOTAL(9,C5:C${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,D5:D${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,E5:E${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,F5:F${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,G5:G${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,H5:H${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,I5:I${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,J5:J${lastDataRowNumber})` } : 0,
    hasRows ? { f: `SUBTOTAL(9,K5:K${lastDataRowNumber})` } : 0,
    hasRows ? { f: `I${totalsRowNumber}/E${totalsRowNumber}` } : 0 // Devengado/PIM
  ]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Layout
  ws['!cols'] = [
    { wch: 11.00 },  // Codigo
    { wch: 65.00 },  // Nombre Actividad/Proyecto
    { wch: 13.00 },  // Pia
    { wch: 13.00 },  // Mod
    { wch: 13.00 },  // Pim
    { wch: 13.00 },  // Certificado
    { wch: 14.00 },  // CompromisoA
    { wch: 14.00 },  // CompromisoM
    { wch: 13.00 },  // Devengado
    { wch: 13.00 },  // Girado
    { wch: 13.00 },  // Saldo
    { wch: 8.89 }    // Avan
  ];

  ws['!rows'] = [
    { hpt: 15.00 },  // Row 1
    { hpt: 22.50 },  // Row 2 (banner)
    { hpt: 12.00 },  // Row 3
    { hpt: 16.00 }   // Row 4 (headers)
  ];
  for (let r = 4; r < 4 + rows.length; r++) {
    ws['!rows'].push({ hpt: 14.40 });
  }
  ws['!rows'].push({ hpt: 16.00 }); // Totals row

  ws['!merges'] = [
    { s: { r: 0, c: 10 }, e: { r: 0, c: 11 } }, // Date NOW() merge
    { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } }  // Title banner merge
  ];

  // Apply Styling Cell by Cell
  const borderHairHorizontal = { style: 'hair', color: { rgb: 'A0A0A0' } };
  const borderMediumLine = { style: 'medium', color: { rgb: '000000' } };

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({c, r});
      const cell = ws[cellRef];
      if (!cell) continue;

      if (r === 0) {
        if (c === 10) {
          cell.s = {
            font: { name: 'Arial Narrow', sz: 11, bold: false },
            alignment: { horizontal: 'right', vertical: 'center' }
          };
          cell.z = 'm/d/yy h:mm';
        } else if (c === 0) {
          cell.s = {
            font: { name: 'Arial Narrow', sz: 11, bold: false },
            alignment: { horizontal: 'left', vertical: 'center' }
          };
        }
      } else if (r === 1) {
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: '44546A' } },
          font: { name: 'Arial Narrow', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      } else if (r === 3) {
        // Headers (Row 4)
        const borderH: Record<string, { style: string; color?: { rgb: string } }> = {
          top: borderMediumLine,
          bottom: borderMediumLine
        };
        if (c === 0) borderH.left = borderMediumLine;
        if (c === 11) borderH.right = borderMediumLine;

        cell.s = {
          font: { name: 'Arial Narrow', sz: 10, bold: false },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderH
        };
      } else if (r === range.e.r) {
        // Totals Row
        const borderT: Record<string, { style: string; color?: { rgb: string } }> = {
          top: borderMediumLine,
          bottom: borderMediumLine
        };
        if (c === 0) borderT.left = borderMediumLine;
        if (c === 11) borderT.right = borderMediumLine;

        cell.s = {
          font: { name: 'Arial Narrow', sz: 10, bold: true },
          alignment: { horizontal: c === 1 ? 'center' : c === 11 ? 'center' : 'right', vertical: 'center' },
          border: borderT
        };
        if (c >= 2 && c <= 10) {
          cell.t = 'n';
          cell.z = '#,##0.00';
        } else if (c === 11) {
          cell.z = '0.00%';
        }
      } else if (r >= 4) {
        // Data Rows
        const borderData: Record<string, { style: string; color?: { rgb: string } }> = {
          bottom: borderHairHorizontal
        };
        if (c === 0) borderData.left = borderMediumLine;
        if (c === 11) borderData.right = borderMediumLine;

        cell.s = {
          font: { name: 'Arial Narrow', sz: 10, bold: false },
          alignment: { horizontal: c === 0 ? 'center' : c === 1 ? 'left' : c === 11 ? 'center' : 'right', vertical: 'center' },
          border: borderData
        };

        if (c >= 2 && c <= 10) {
          cell.t = 'n';
          cell.z = '#,##0.00';
        } else if (c === 11) {
          cell.z = '0.00%';
        }
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registros');
  XLSX.writeFile(wb, filename);
}

export interface PagoExportRow {
  ano_eje: string;
  mes_eje: string;
  tipo_op: string;
  expediente: string;
  sec_reg: string;
  corr: string;
  rb: string;
  cod_doc: string;
  num_doc: string;
  fecha_doc: string;
  beneficiario: string;
  monto: number;
  estado: string;
}

export function exportComprobantesPago(rows: PagoExportRow[]) {
  const wsData: unknown[][] = [];

  // Row 1: blank
  wsData.push(Array(13).fill(''));

  // Row 2: Title Banner (merged A2:M2)
  wsData.push([
    'COMPROBANTES DE PAGO',
    '', '', '', '', '', '', '', '', '', '', '', ''
  ]);

  // Row 3: Blank Row
  wsData.push(Array(13).fill(''));

  // Row 4: Cabeceras
  wsData.push([
    'ANO',
    'MES',
    'TIPO',
    'EXPEDIENTE',
    'SECUEN',
    'CORR',
    'RB',
    'COD',
    'NUM_DOC',
    'FECHA_DOC',
    'BENEFICIARIO',
    'MONTO',
    'Est.Reg'
  ]);

  // Data rows
  rows.forEach(r => {
    wsData.push([
      r.ano_eje,
      r.mes_eje,
      r.tipo_op,
      r.expediente,
      r.sec_reg,
      r.corr,
      r.rb,
      r.cod_doc,
      r.num_doc,
      formatDate(r.fecha_doc),
      r.beneficiario,
      n(r.monto),
      r.estado
    ]);
  });

  const lastDataRowNumber = 4 + rows.length; // 1-indexed
  const hasRows = rows.length > 0;

  // Totals Row
  const totalRow: unknown[] = Array(13).fill('');
  totalRow[10] = 'T O T A L E S';
  totalRow[11] = hasRows ? { f: `SUBTOTAL(9,L5:L${lastDataRowNumber})` } : 0;
  wsData.push(totalRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Layout Widths
  ws['!cols'] = [
    { wch: 6.14 },  // ANO
    { wch: 7.29 },  // MES
    { wch: 8.00 },  // TIPO
    { wch: 10.71 }, // EXPEDIENTE
    { wch: 6.57 },  // SECUEN
    { wch: 7.29 },  // CORR
    { wch: 4.71 },  // RB
    { wch: 6.43 },  // COD
    { wch: 14.71 }, // NUM_DOC
    { wch: 12.00 }, // FECHA_DOC
    { wch: 46.71 }, // BENEFICIARIO
    { wch: 14.43 }, // MONTO
    { wch: 7.00 }   // Est.Reg
  ];

  ws['!rows'] = [
    { hpt: 12.00 }, // Row 1
    { hpt: 18.75 }, // Row 2 (Title)
    { hpt: 12.00 }, // Row 3
    { hpt: 18.00 }  // Row 4 (Headers)
  ];
  for (let r = 4; r < lastDataRowNumber; r++) {
    ws['!rows'].push({ hpt: 14.40 });
  }
  ws['!rows'].push({ hpt: 15.00 }); // Totals row

  ws['!merges'] = [
    { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } } // Title banner
  ];

  // Styles
  const borderHair = {
    top: { style: 'hair', color: { rgb: 'B0B0B0' } },
    bottom: { style: 'hair', color: { rgb: 'B0B0B0' } },
    left: { style: 'hair', color: { rgb: 'B0B0B0' } },
    right: { style: 'hair', color: { rgb: 'B0B0B0' } }
  };

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({c, r});
      const cell = ws[cellRef];
      if (!cell) continue;

      if (r === 1) {
        // Row 2 (Title Banner)
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'E7E6E6' } }, // Theme 3 Silver
          font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      } else if (r === 3) {
        // Row 4 (Headers)
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF00' } }, // Yellow
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderHair
        };
      } else if (r === range.e.r) {
        // Totals Row
        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
          alignment: { horizontal: c === 10 ? 'center' : 'right', vertical: 'center' },
          border: {
            top: { style: 'hair', color: { rgb: 'B0B0B0' } },
            bottom: { style: 'hair', color: { rgb: 'B0B0B0' } },
            left: c === 10 || c === 12 ? { style: 'hair', color: { rgb: 'B0B0B0' } } : undefined,
            right: c === 11 || c === 12 ? { style: 'hair', color: { rgb: 'B0B0B0' } } : undefined
          }
        };
        if (c === 11) {
          cell.t = 'n';
          cell.z = '#,##0.00';
        }
      } else if (r >= 4) {
        // Data Rows
        const cellAlign = c === 10 ? 'left' : c === 11 ? 'right' : 'center';
        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '000000' } },
          alignment: { horizontal: cellAlign, vertical: 'center' },
          border: borderHair
        };
        if (c === 11) {
          cell.t = 'n';
          cell.z = '#,##0.00';
        }
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'expedientes');
  XLSX.writeFile(wb, 'comprobantes_pago.xlsx');
}

export interface GiroExportRow {
  ano_eje: string;
  mes_eje: string;
  expediente: string;
  sec_reg: string;
  corr: string;
  rb: string;
  tr: string;
  ctacte: string;
  cod_doc: string;
  num_doc: string;
  fecha_doc: string;
  beneficiario: string;
  monto: number;
  estado: string;
}

export function exportChequesGirados(rows: GiroExportRow[]) {
  const wsData: unknown[][] = [];

  // Row 1: blank
  wsData.push(Array(14).fill(''));

  // Row 2: Title Banner
  wsData.push([
    'CHEQUES GIRADOS',
    '', '', '', '', '', '', '', '', '', '', '', '', ''
  ]);

  // Row 3: blank
  wsData.push(Array(14).fill(''));

  // Row 4: Headers
  wsData.push([
    'ANO',
    'MES',
    'EXPEDIENTE',
    'SECUEN',
    'CORR',
    'RB',
    'TR',
    'CTACTE',
    'COD',
    'NUM_DOC',
    'FECHA_DOC',
    'BENEFICIARIO',
    'MONTO',
    'Est'
  ]);

  // Data rows
  rows.forEach(r => {
    wsData.push([
      r.ano_eje,
      r.mes_eje,
      r.expediente,
      r.sec_reg,
      r.corr,
      r.rb,
      r.tr,
      r.ctacte,
      r.cod_doc,
      r.num_doc,
      formatDate(r.fecha_doc),
      r.beneficiario,
      n(r.monto),
      r.estado
    ]);
  });

  const lastDataRowNumber = 4 + rows.length;
  const hasRows = rows.length > 0;

  // Totals Row
  const totalRow: unknown[] = Array(14).fill('');
  totalRow[11] = 'T O T A L E S';
  totalRow[12] = hasRows ? { f: `SUBTOTAL(9,M5:M${lastDataRowNumber})` } : 0;
  wsData.push(totalRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Layout Widths
  ws['!cols'] = [
    { wch: 6.14 },  // ANO
    { wch: 7.29 },  // MES
    { wch: 10.71 }, // EXPEDIENTE
    { wch: 6.57 },  // SECUEN
    { wch: 7.29 },  // CORR
    { wch: 4.71 },  // RB
    { wch: 3.57 },  // TR
    { wch: 18.14 }, // CTACTE
    { wch: 6.43 },  // COD
    { wch: 14.71 }, // NUM_DOC
    { wch: 12.00 }, // FECHA_DOC
    { wch: 46.71 }, // BENEFICIARIO
    { wch: 14.43 }, // MONTO
    { wch: 4.71 }   // Est
  ];

  ws['!rows'] = [
    { hpt: 12.00 }, // Row 1
    { hpt: 18.75 }, // Row 2
    { hpt: 12.00 }, // Row 3
    { hpt: 18.00 }  // Row 4
  ];
  for (let r = 4; r < lastDataRowNumber; r++) {
    ws['!rows'].push({ hpt: 14.40 });
  }
  ws['!rows'].push({ hpt: 15.00 });

  ws['!merges'] = [
    { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } }
  ];

  const borderHair = {
    top: { style: 'hair', color: { rgb: 'B0B0B0' } },
    bottom: { style: 'hair', color: { rgb: 'B0B0B0' } },
    left: { style: 'hair', color: { rgb: 'B0B0B0' } },
    right: { style: 'hair', color: { rgb: 'B0B0B0' } }
  };

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({c, r});
      const cell = ws[cellRef];
      if (!cell) continue;

      if (r === 1) {
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'E7E6E6' } },
          font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      } else if (r === 3) {
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF00' } },
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderHair
        };
      } else if (r === range.e.r) {
        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
          alignment: { horizontal: c === 11 ? 'center' : 'right', vertical: 'center' },
          border: {
            top: { style: 'hair', color: { rgb: 'B0B0B0' } },
            bottom: { style: 'hair', color: { rgb: 'B0B0B0' } },
            left: c === 11 || c === 13 ? { style: 'hair', color: { rgb: 'B0B0B0' } } : undefined,
            right: c === 12 || c === 13 ? { style: 'hair', color: { rgb: 'B0B0B0' } } : undefined
          }
        };
        if (c === 12) {
          cell.t = 'n';
          cell.z = '#,##0.00';
        }
      } else if (r >= 4) {
        const cellAlign = c === 11 ? 'left' : c === 12 ? 'right' : 'center';
        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '000000' } },
          alignment: { horizontal: cellAlign, vertical: 'center' },
          border: borderHair
        };
        if (c === 12) {
          cell.t = 'n';
          cell.z = '#,##0.00';
        }
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'expedientes');
  XLSX.writeFile(wb, 'cheques_girados.xlsx');
}

export interface ViaticoExportRow {
  expediente: string;
  giro: number;
  devolucion: number;
  rendicion: number;
  saldo: number;
}

export function exportViaticos(rows: ViaticoExportRow[]) {
  const wsData: unknown[][] = [];

  // Row 1: blank
  wsData.push(Array(5).fill(''));

  // Row 2: Title
  wsData.push([
    'EJECUCIÓN DE VIÁTICOS Y ENCARGOS',
    '', '', '', ''
  ]);

  // Row 3: blank
  wsData.push(Array(5).fill(''));

  // Row 4: Headers
  wsData.push([
    'EXPEDIENTE',
    'MONTO GIRO',
    'MONTO DEVOLUCIÓN',
    'MONTO RENDICIÓN',
    'SALDO'
  ]);

  // Data rows
  rows.forEach(r => {
    wsData.push([
      r.expediente,
      n(r.giro),
      n(r.devolucion),
      n(r.rendicion),
      n(r.saldo)
    ]);
  });

  const lastDataRowNumber = 4 + rows.length;
  const hasRows = rows.length > 0;

  // Totals Row
  const totalRow: unknown[] = Array(5).fill('');
  totalRow[0] = 'TOTAL GENERAL';
  totalRow[1] = hasRows ? { f: `SUBTOTAL(9,B5:B${lastDataRowNumber})` } : 0;
  totalRow[2] = hasRows ? { f: `SUBTOTAL(9,C5:C${lastDataRowNumber})` } : 0;
  totalRow[3] = hasRows ? { f: `SUBTOTAL(9,D5:D${lastDataRowNumber})` } : 0;
  totalRow[4] = hasRows ? { f: `SUBTOTAL(9,E5:E${lastDataRowNumber})` } : 0;
  wsData.push(totalRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Layout Widths
  ws['!cols'] = [
    { wch: 15.00 }, // EXPEDIENTE
    { wch: 18.00 }, // MONTO GIRO
    { wch: 18.00 }, // MONTO DEVOLUCION
    { wch: 18.00 }, // MONTO RENDICION
    { wch: 18.00 }  // SALDO
  ];

  ws['!rows'] = [
    { hpt: 12.00 }, // Row 1
    { hpt: 20.00 }, // Row 2
    { hpt: 12.00 }, // Row 3
    { hpt: 18.00 }  // Row 4
  ];
  for (let r = 4; r < lastDataRowNumber; r++) {
    ws['!rows'].push({ hpt: 14.40 });
  }
  ws['!rows'].push({ hpt: 16.00 });

  ws['!merges'] = [
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }
  ];

  const borderHair = {
    top: { style: 'hair', color: { rgb: 'B0B0B0' } },
    bottom: { style: 'hair', color: { rgb: 'B0B0B0' } },
    left: { style: 'hair', color: { rgb: 'B0B0B0' } },
    right: { style: 'hair', color: { rgb: 'B0B0B0' } }
  };

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({c, r});
      const cell = ws[cellRef];
      if (!cell) continue;

      if (r === 1) {
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'E7E6E6' } }, // Silver
          font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      } else if (r === 3) {
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF00' } },
          font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderHair
        };
      } else if (r === range.e.r) {
        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
          alignment: { horizontal: c === 0 ? 'center' : 'right', vertical: 'center' },
          border: borderHair
        };
        if (c >= 1) {
          cell.t = 'n';
          cell.z = '#,##0.00';
        }
      } else if (r >= 4) {
        const cellAlign = c === 0 ? 'center' : 'right';
        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: false, color: { rgb: '000000' } },
          alignment: { horizontal: cellAlign, vertical: 'center' },
          border: borderHair
        };
        if (c >= 1) {
          cell.t = 'n';
          cell.z = '#,##0.00';
        }
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'resumen');
  XLSX.writeFile(wb, 'viaticos_y_encargos.xlsx');
}

// =========================================================================
// NEW EXPORT FUNCTIONS FOR EL GENERADOR DE REPORTES EXCEL
// =========================================================================

export function exportCertificadoResumen(rows: Record<string, unknown>[], filename = 'certificado.xlsx') {
  const wsData: unknown[][] = [];
  wsData.push(['301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA']);
  wsData.push(Array(8).fill(''));
  wsData.push(['Estado de Certificaciones']);
  wsData.push(Array(8).fill(''));
  wsData.push(Array(8).fill(''));
  wsData.push(['AñoEje', 'Número', 'Meta', 'Rubro', 'Clasificador', 'Certificado', 'Compromiso', 'Saldo']);

  rows.forEach(r => {
    wsData.push([
      r.ano_eje || '2026',
      r.certif,
      r.sec_func,
      r.rubro,
      r.clasif,
      n(r.certificado),
      n(r.compromiso),
      n(r.saldo)
    ]);
  });

  const lastDataRowNumber = 6 + rows.length;
  const hasRows = rows.length > 0;
  const totalRow = Array(8).fill('');
  totalRow[5] = hasRows ? { f: `SUBTOTAL(9,F7:F${lastDataRowNumber})` } : 0;
  totalRow[6] = hasRows ? { f: `SUBTOTAL(9,G7:G${lastDataRowNumber})` } : 0;
  totalRow[7] = hasRows ? { f: `SUBTOTAL(9,H7:H${lastDataRowNumber})` } : 0;
  wsData.push(totalRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 8.00 },  // AñoEje
    { wch: 14.00 }, // Número
    { wch: 8.00 },  // Meta
    { wch: 8.00 },  // Rubro
    { wch: 50.00 }, // Clasificador
    { wch: 16.00 }, // Certificado
    { wch: 16.00 }, // Compromiso
    { wch: 16.00 }  // Saldo
  ];

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }
  ];

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({c, r});
      const cell = ws[cellRef];
      if (!cell) continue;

      cell.s = { font: { name: 'Arial Narrow', sz: 10 } };
      if (r === 0 || r === 2) {
        cell.s.font.bold = true;
        cell.s.font.sz = 11;
      } else if (r === 5) {
        cell.s.font.bold = true;
        cell.s.border = {
          top: { style: 'medium', color: { rgb: '000000' } },
          bottom: { style: 'medium', color: { rgb: '000000' } }
        };
        cell.s.alignment = { horizontal: 'center', vertical: 'center' };
      } else if (r === range.e.r) {
        cell.s.font.bold = true;
        cell.s.border = {
          top: { style: 'medium', color: { rgb: '000000' } },
          bottom: { style: 'medium', color: { rgb: '000000' } }
        };
        if (c >= 5 && c <= 7) {
          cell.t = 'n';
          cell.z = '#,##0.00';
          cell.s.alignment = { horizontal: 'right', vertical: 'center' };
        }
      } else if (r >= 6) {
        cell.s.alignment = { horizontal: c >= 5 ? 'right' : 'center', vertical: 'center' };
        if (c === 4) cell.s.alignment.horizontal = 'left';
        if (c >= 5 && c <= 7) {
          cell.t = 'n';
          cell.z = '#,##0.00';
        }
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');
  XLSX.writeFile(wb, filename);
}

export function exportRawDevengados(rows: Record<string, unknown>[], filename = 'data-devengados.xlsx') {
  const wsData: unknown[][] = [];
  wsData.push(['301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA']);
  wsData.push(Array(24).fill(''));
  wsData.push(['DETALLE DE REGISTROS - DEVENGADOS']);
  wsData.push(Array(24).fill(''));
  wsData.push(['ANO_EJE', 'MES_EJE', 'SEC_FUNC', 'EXPEDIENTE', 'OPER', 'MOD', 'CICLO', 'FASE', 'SECUEN', 'CORR', 'RB', 'COD', 'NUM_DOC', 'FECHA_DOC', 'TP', 'TR', 'TC', 'PROVEEDOR', 'CLASIFICAD', 'MONTO', 'FEC_APROB', 'EST', 'CERTIF', 'CERTIF_SEC']);

  rows.forEach(r => {
    wsData.push([
      r.ano_eje || '2026',
      r.mes_eje,
      r.sec_func,
      r.expediente,
      r.oper,
      r.mod,
      r.ciclo,
      r.fase,
      r.secuen,
      r.corr,
      r.rb,
      r.cod,
      r.num_doc,
      formatDate(r.fecha_doc),
      r.tp,
      r.tr,
      r.tc,
      r.proveedor,
      r.clasificad,
      n(r.monto),
      formatDate(r.fec_aprob),
      r.est ? String(r.est).substring(0, 1) : 'A',
      r.certif,
      r.certif_sec
    ]);
  });

  const lastDataRowNumber = 5 + rows.length;
  const hasRows = rows.length > 0;
  const totalRow = Array(24).fill('');
  totalRow[18] = 'T O T A L E S';
  totalRow[19] = hasRows ? { f: `SUBTOTAL(9,T6:T${lastDataRowNumber})` } : 0;
  wsData.push(totalRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = Array(24).fill({ wch: 10 });
  ws['!cols'][17] = { wch: 45 }; // PROVEEDOR
  ws['!cols'][18] = { wch: 18 }; // CLASIFICAD

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }
  ];

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({c, r});
      const cell = ws[cellRef];
      if (!cell) continue;

      cell.s = { font: { name: 'Calibri', sz: 9 } };
      if (r === 0 || r === 2) {
        cell.s.font.bold = true;
        cell.s.font.sz = 11;
      } else if (r === 4) {
        cell.s.font.bold = true;
        cell.s.fill = { patternType: 'solid', fgColor: { rgb: 'FFFFFF00' } };
        cell.s.border = {
          top: { style: 'hair', color: { rgb: 'B0B0B0' } },
          bottom: { style: 'hair', color: { rgb: 'B0B0B0' } },
          left: { style: 'hair', color: { rgb: 'B0B0B0' } },
          right: { style: 'hair', color: { rgb: 'B0B0B0' } }
        };
        cell.s.alignment = { horizontal: 'center', vertical: 'center' };
      } else if (r === range.e.r) {
        cell.s.font.bold = true;
        cell.s.border = {
          top: { style: 'hair', color: { rgb: 'B0B0B0' } },
          bottom: { style: 'hair', color: { rgb: 'B0B0B0' } }
        };
        if (c === 18) cell.s.alignment = { horizontal: 'center' };
        if (c === 19) {
          cell.t = 'n';
          cell.z = '#,##0.00';
          cell.s.alignment = { horizontal: 'right' };
        }
      } else if (r >= 5) {
        cell.s.alignment = { horizontal: 'center', vertical: 'center' };
        if (c === 17) cell.s.alignment.horizontal = 'left'; // PROVEEDOR left-aligned
        if (c === 19) {
          cell.t = 'n';
          cell.z = '#,##0.00';
          cell.s.alignment.horizontal = 'right';
        }
        cell.s.border = {
          top: { style: 'hair', color: { rgb: 'B0B0B0' } },
          bottom: { style: 'hair', color: { rgb: 'B0B0B0' } },
          left: { style: 'hair', color: { rgb: 'B0B0B0' } },
          right: { style: 'hair', color: { rgb: 'B0B0B0' } }
        };
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'expedientes');
  XLSX.writeFile(wb, filename);
}

export function exportRawGirados(rows: Record<string, unknown>[], filename = 'data-girados.xlsx') {
  const wsData: unknown[][] = [];
  wsData.push(['301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA']);
  wsData.push(['DETALLE DE GIROS']);
  wsData.push(Array(31).fill(''));
  wsData.push(['ANO', 'MES', 'EXPEDIENTE', 'TIPO', 'C', 'F', 'SECUEN', 'CORR', 'RB', 'TR', 'COD', 'NUM_DOC', 'FECHA_DOC', 'TP', 'TC', 'ANO_BANCO', 'BANCO', 'CTA_CTE', 'BENEFICIARIO', 'CLASIFICAD', 'SEC_FUNC', 'TIPO_GIR', 'COD_B', 'NUM_DOC_B', 'FEC_DOC_B', 'MONTO', 'FEC_APROB', 'SEC_EST', 'EST_REG', 'CERTIF', 'CERTIF_SEC']);

  rows.forEach(r => {
    wsData.push([
      r.ano || '2026',
      r.mes,
      r.expediente,
      r.tipo,
      r.c,
      r.f,
      r.secuen,
      r.corr,
      r.rb,
      r.tr,
      r.cod,
      r.num_doc,
      formatDate(r.fecha_doc),
      r.tp,
      r.tc,
      r.ano_banco,
      r.banco,
      r.cta_cte,
      r.beneficiario,
      r.clasificad,
      r.sec_func,
      r.tipo_gir,
      r.cod_b,
      r.num_doc_b,
      formatDate(r.fec_doc_b),
      n(r.monto),
      formatDate(r.fec_aprob),
      r.sec_est,
      r.est_reg,
      r.certif,
      r.certif_sec
    ]);
  });

  const lastDataRowNumber = 4 + rows.length;
  const hasRows = rows.length > 0;
  const totalRow = Array(31).fill('');
  totalRow[24] = 'T O T A L E S';
  totalRow[25] = hasRows ? { f: `SUBTOTAL(9,Z5:Z${lastDataRowNumber})` } : 0;
  wsData.push(totalRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = Array(31).fill({ wch: 10 });
  ws['!cols'][18] = { wch: 45 }; // BENEFICIARIO
  ws['!cols'][20] = { wch: 35 }; // SEC_FUNC

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }
  ];

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({c, r});
      const cell = ws[cellRef];
      if (!cell) continue;

      cell.s = { font: { name: 'Calibri', sz: 9 } };
      if (r === 0 || r === 1) {
        cell.s.font.bold = true;
        cell.s.font.sz = 11;
      } else if (r === 3) {
        cell.s.font.bold = true;
        cell.s.alignment = { horizontal: 'center', vertical: 'center' };
        cell.s.border = {
          top: { style: 'hair', color: { rgb: 'B0B0B0' } },
          bottom: { style: 'hair', color: { rgb: 'B0B0B0' } },
          left: { style: 'hair', color: { rgb: 'B0B0B0' } },
          right: { style: 'hair', color: { rgb: 'B0B0B0' } }
        };
      } else if (r === range.e.r) {
        cell.s.font.bold = true;
        cell.s.border = {
          top: { style: 'hair', color: { rgb: 'B0B0B0' } },
          bottom: { style: 'hair', color: { rgb: 'B0B0B0' } }
        };
        if (c === 24) cell.s.alignment = { horizontal: 'center' };
        if (c === 25) {
          cell.t = 'n';
          cell.z = '#,##0.00';
          cell.s.alignment = { horizontal: 'right' };
        }
      } else if (r >= 4) {
        cell.s.alignment = { horizontal: 'center', vertical: 'center' };
        if (c === 18 || c === 20) cell.s.alignment.horizontal = 'left';
        if (c === 25) {
          cell.t = 'n';
          cell.z = '#,##0.00';
          cell.s.alignment.horizontal = 'right';
        }
        cell.s.border = {
          top: { style: 'hair', color: { rgb: 'B0B0B0' } },
          bottom: { style: 'hair', color: { rgb: 'B0B0B0' } },
          left: { style: 'hair', color: { rgb: 'B0B0B0' } },
          right: { style: 'hair', color: { rgb: 'B0B0B0' } }
        };
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'expedientes');
  XLSX.writeFile(wb, filename);
}

export function exportMetaCertificados(rows: Record<string, unknown>[], filename = 'meta_certificados.xlsx') {
  const wb = XLSX.utils.book_new();

  if (rows.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([['No hay registros para exportar']]);
    XLSX.utils.book_append_sheet(wb, ws, 'Sin Datos');
    XLSX.writeFile(wb, filename);
    return;
  }

  // Group rows by sec_func
  const groups = new Map<string, Record<string, unknown>[]>();
  rows.forEach(r => {
    const key = String(r.sec_func || '0000');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  });

  for (const [metaCode, groupRows] of Array.from(groups.entries()).sort()) {
    const wsData: unknown[][] = [];
    wsData.push(['301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA']);
    wsData.push(Array(15).fill(''));
    wsData.push(['DETALLE DE MOVIMENTOS DE CERTICACIONES Y COMPROMISOS ANUALES']);
    wsData.push(Array(15).fill(''));
    const metaName = groupRows[0]?.meta_nombre || 'Sin Meta';
    wsData.push(['Meta:', `${metaCode} ${metaName}`]);
    wsData.push(Array(15).fill(''));
    wsData.push(['ANO_EJE', 'SEC_EJEC', 'CERTIFICADO', 'SECUEN', 'CORRE', 'RUBRO', 'COD_DOC', 'NUM_DOC', 'FECHA_DOC', 'Gen', 'CLASIF', 'MONTO', 'FEC_PROC', 'TIPO_REG', 'EST']);

    groupRows.forEach(r => {
      wsData.push([
        r.ano_eje || '2026',
        r.sec_ejec || '301548',
        r.certif,
        r.secuencia,
        r.correlat,
        r.rubro,
        r.cod_doc,
        r.num_doc,
        formatDate(r.fecha_doc),
        r.clasif ? String(r.clasif).substring(0, 3) : '',
        `${r.clasif || ''}   ${r.clasif_nombre || ''}`.trim(),
        n(r.monto),
        formatDate(r.fec_proc),
        r.tipo_reg,
        String(r.est_env || r.est_reg || 'A').substring(0, 1)
      ]);
    });

    const lastDataRowNumber = 7 + groupRows.length;
    const hasRows = groupRows.length > 0;
    const totalRow = Array(15).fill('');
    totalRow[10] = 'T O T A L E S ';
    totalRow[11] = hasRows ? { f: `SUBTOTAL(9,L8:L${lastDataRowNumber})` } : 0;
    wsData.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = Array(15).fill({ wch: 10 });
    ws['!cols'][10] = { wch: 45 }; // CLASIF
    ws['!cols'][7] = { wch: 18 };  // NUM_DOC

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
      { s: { r: 4, c: 1 }, e: { r: 4, c: 8 } }
    ];

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellRef = XLSX.utils.encode_cell({c, r});
        const cell = ws[cellRef];
        if (!cell) continue;

        cell.s = { font: { name: 'Calibri', sz: 9 } };
        if (r === 0 || r === 2 || r === 4) {
          cell.s.font.bold = true;
          if (r === 0 || r === 2) cell.s.font.sz = 11;
        } else if (r === 6) {
          cell.s.font.bold = true;
          cell.s.alignment = { horizontal: 'center', vertical: 'center' };
        } else if (r === range.e.r) {
          cell.s.font.bold = true;
          if (c === 10) cell.s.alignment = { horizontal: 'center' };
          if (c === 11) {
            cell.t = 'n';
            cell.z = '#,##0.00';
            cell.s.alignment = { horizontal: 'right' };
          }
        } else if (r >= 7) {
          cell.s.alignment = { horizontal: 'center', vertical: 'center' };
          if (c === 10) cell.s.alignment.horizontal = 'left';
          if (c === 11) {
            cell.t = 'n';
            cell.z = '#,##0.00';
            cell.s.alignment.horizontal = 'right';
          }
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, metaCode);
  }

  XLSX.writeFile(wb, filename);
}

export function exportMetaDevengados(rows: Record<string, unknown>[], filename = 'meta_devengados.xlsx') {
  const wb = XLSX.utils.book_new();

  if (rows.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([['No hay registros para exportar']]);
    XLSX.utils.book_append_sheet(wb, ws, 'Sin Datos');
    XLSX.writeFile(wb, filename);
    return;
  }

  const groups = new Map<string, Record<string, unknown>[]>();
  rows.forEach(r => {
    const key = String(r.group_key || '0000');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  });

  for (const [metaCode, groupRows] of Array.from(groups.entries()).sort()) {
    const wsData: unknown[][] = [];
    wsData.push(['301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA']);
    wsData.push(Array(18).fill(''));
    wsData.push(['DETALLE DE REGISTROS - DEVENGADOS']);
    wsData.push(Array(18).fill(''));
    wsData.push(['META:', metaCode]);
    wsData.push(Array(18).fill(''));
    wsData.push(['ANO_EJE', 'MES_EJE', 'EXPEDIENTE', 'TO', 'SECUEN', 'CORR', 'RB', 'TR', 'COD', 'NUM_DOC', 'FECHA_DOC', 'PROVEEDOR', 'CLASIFICAD', 'MONTO', 'FEC_APROB', 'EST', 'CERTIF', 'CERTIF_SEC']);

    groupRows.forEach(r => {
      wsData.push([
        r.ano_eje || '2026',
        r.mes_eje,
        r.expediente,
        r.tipo_op,
        r.sec_reg,
        r.corr,
        r.rb,
        r.tr,
        r.cod_doc,
        r.num_doc,
        formatDate(r.fecha_doc),
        `${r.proveedor_ruc || ''} ${r.proveedor_nombre || ''}`.trim(),
        `${r.clasificad || ''}   ${r.clasif_nombre || ''}`.trim(),
        n(r.monto),
        formatDate(r.fec_aprob),
        r.estado ? String(r.estado).substring(0, 1) : 'A',
        r.certif,
        r.certif_sec
      ]);
    });

    const lastDataRowNumber = 7 + groupRows.length;
    const hasRows = groupRows.length > 0;
    const totalRow = Array(18).fill('');
    totalRow[12] = 'T O T A L E S';
    totalRow[13] = hasRows ? { f: `SUBTOTAL(9,N8:N${lastDataRowNumber})` } : 0;
    wsData.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = Array(18).fill({ wch: 10 });
    ws['!cols'][11] = { wch: 45 }; // PROVEEDOR
    ws['!cols'][12] = { wch: 35 }; // CLASIFICAD

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }
    ];

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellRef = XLSX.utils.encode_cell({c, r});
        const cell = ws[cellRef];
        if (!cell) continue;

        cell.s = { font: { name: 'Calibri', sz: 9 } };
        if (r === 0 || r === 2 || r === 4) {
          cell.s.font.bold = true;
          if (r === 0 || r === 2) cell.s.font.sz = 11;
        } else if (r === 6) {
          cell.s.font.bold = true;
          cell.s.alignment = { horizontal: 'center', vertical: 'center' };
        } else if (r === range.e.r) {
          cell.s.font.bold = true;
          if (c === 12) cell.s.alignment = { horizontal: 'center' };
          if (c === 13) {
            cell.t = 'n';
            cell.z = '#,##0.00';
            cell.s.alignment = { horizontal: 'right' };
          }
        } else if (r >= 7) {
          cell.s.alignment = { horizontal: 'center', vertical: 'center' };
          if (c === 11 || c === 12) cell.s.alignment.horizontal = 'left';
          if (c === 13) {
            cell.t = 'n';
            cell.z = '#,##0.00';
            cell.s.alignment.horizontal = 'right';
          }
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, metaCode);
  }

  XLSX.writeFile(wb, filename);
}

export function exportProgramaDevengados(rows: Record<string, unknown>[], filename = 'programa_devengados.xlsx') {
  const wb = XLSX.utils.book_new();

  if (rows.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([['No hay registros para exportar']]);
    XLSX.utils.book_append_sheet(wb, ws, 'Sin Datos');
    XLSX.writeFile(wb, filename);
    return;
  }

  const groups = new Map<string, Record<string, unknown>[]>();
  rows.forEach(r => {
    const key = String(r.group_key || '0000');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  });

  for (const [programCode, groupRows] of Array.from(groups.entries()).sort()) {
    const wsData: unknown[][] = [];
    wsData.push(['301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA']);
    wsData.push(Array(18).fill(''));
    wsData.push(['DETALLE DE REGISTROS - DEVENGADOS']);
    wsData.push(Array(18).fill(''));
    const programName = groupRows[0]?.prog_nombre || 'Programa';
    wsData.push(['PROGRAMA PPTO:', '', `${programCode} ${programName}`]);
    wsData.push(Array(18).fill(''));
    wsData.push(['ANO_EJE', 'MES_EJE', 'Proyecto', 'EXPEDIENTE', 'SECUEN', 'CORR', 'RB', 'TR', 'COD', 'NUM_DOC', 'FECHA_DOC', 'PROVEEDOR', 'CLASIFICAD', 'MONTO', 'FEC_APROB', 'EST', 'CERTIF', 'CERTIF_SEC']);

    groupRows.forEach(r => {
      wsData.push([
        r.ano_eje || '2026',
        r.mes_eje,
        r.proyecto,
        r.expediente,
        r.sec_reg,
        r.corr,
        r.rb,
        r.tr,
        r.cod_doc,
        r.num_doc,
        formatDate(r.fecha_doc),
        `${r.proveedor_ruc || ''} ${r.proveedor_nombre || ''}`.trim(),
        `${r.clasificad || ''}   ${r.clasif_nombre || ''}`.trim(),
        n(r.monto),
        formatDate(r.fec_aprob),
        r.estado ? String(r.estado).substring(0, 1) : 'A',
        r.certif,
        r.certif_sec
      ]);
    });

    const lastDataRowNumber = 7 + groupRows.length;
    const hasRows = groupRows.length > 0;
    const totalRow = Array(18).fill('');
    totalRow[12] = 'T O T A L E S';
    totalRow[13] = hasRows ? { f: `SUBTOTAL(9,N8:N${lastDataRowNumber})` } : 0;
    wsData.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = Array(18).fill({ wch: 10 });
    ws['!cols'][11] = { wch: 45 }; // PROVEEDOR
    ws['!cols'][12] = { wch: 35 }; // CLASIFICAD

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
      { s: { r: 4, c: 2 }, e: { r: 4, c: 8 } }
    ];

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellRef = XLSX.utils.encode_cell({c, r});
        const cell = ws[cellRef];
        if (!cell) continue;

        cell.s = { font: { name: 'Calibri', sz: 9 } };
        if (r === 0 || r === 2 || r === 4) {
          cell.s.font.bold = true;
          if (r === 0 || r === 2) cell.s.font.sz = 11;
        } else if (r === 6) {
          cell.s.font.bold = true;
          cell.s.alignment = { horizontal: 'center', vertical: 'center' };
        } else if (r === range.e.r) {
          cell.s.font.bold = true;
          if (c === 12) cell.s.alignment = { horizontal: 'center' };
          if (c === 13) {
            cell.t = 'n';
            cell.z = '#,##0.00';
            cell.s.alignment = { horizontal: 'right' };
          }
        } else if (r >= 7) {
          cell.s.alignment = { horizontal: 'center', vertical: 'center' };
          if (c === 11 || c === 12) cell.s.alignment.horizontal = 'left';
          if (c === 13) {
            cell.t = 'n';
            cell.z = '#,##0.00';
            cell.s.alignment.horizontal = 'right';
          }
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, programCode);
  }

  XLSX.writeFile(wb, filename);
}

export function exportProgramaAccionInversion(rows: Record<string, unknown>[], filename = 'programa_accion_inversion.xlsx') {
  const wb = XLSX.utils.book_new();

  if (rows.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([['No hay registros para exportar']]);
    XLSX.utils.book_append_sheet(wb, ws, 'Sin Datos');
    XLSX.writeFile(wb, filename);
    return;
  }

  const groups = new Map<string, Record<string, unknown>[]>();
  rows.forEach(r => {
    const key = String(r.group_key || '0000000');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  });

  for (const [projectCode, groupRows] of Array.from(groups.entries()).sort()) {
    const wsData: unknown[][] = [];
    wsData.push(['301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA']);
    wsData.push(Array(18).fill(''));
    wsData.push(['DETALLE DE REGISTROS - DEVENGADOS']);
    wsData.push(Array(18).fill(''));
    const projectName = groupRows[0]?.meta_nombre || 'Proyecto';
    wsData.push(['ACT_OBRA_ACCINV:', '', '', `${projectCode}  ${projectName}`]);
    wsData.push(Array(18).fill(''));
    wsData.push(['ANO_EJE', 'MES_EJE', 'Proyecto', 'EXPEDIENTE', 'SECUEN', 'CORR', 'RB', 'TR', 'COD', 'NUM_DOC', 'FECHA_DOC', 'PROVEEDOR', 'CLASIFICAD', 'MONTO', 'FEC_APROB', 'EST', 'CERTIF', 'CERTIF_SEC']);

    groupRows.forEach(r => {
      wsData.push([
        r.ano_eje || '2026',
        r.mes_eje,
        r.proyecto,
        r.expediente,
        r.sec_reg,
        r.corr,
        r.rb,
        r.tr,
        r.cod_doc,
        r.num_doc,
        formatDate(r.fecha_doc),
        `${r.proveedor_ruc || ''} ${r.proveedor_nombre || ''}`.trim(),
        `${r.clasificad || ''}   ${r.clasif_nombre || ''}`.trim(),
        n(r.monto),
        formatDate(r.fec_aprob),
        r.estado ? String(r.estado).substring(0, 1) : 'A',
        r.certif,
        r.certif_sec
      ]);
    });

    const lastDataRowNumber = 7 + groupRows.length;
    const hasRows = groupRows.length > 0;
    const totalRow = Array(18).fill('');
    totalRow[12] = 'T O T A L E S';
    totalRow[13] = hasRows ? { f: `SUBTOTAL(9,N8:N${lastDataRowNumber})` } : 0;
    wsData.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = Array(18).fill({ wch: 10 });
    ws['!cols'][11] = { wch: 45 }; // PROVEEDOR
    ws['!cols'][12] = { wch: 35 }; // CLASIFICAD

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
      { s: { r: 4, c: 3 }, e: { r: 4, c: 8 } }
    ];

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellRef = XLSX.utils.encode_cell({c, r});
        const cell = ws[cellRef];
        if (!cell) continue;

        cell.s = { font: { name: 'Calibri', sz: 9 } };
        if (r === 0 || r === 2 || r === 4) {
          cell.s.font.bold = true;
          if (r === 0 || r === 2) cell.s.font.sz = 11;
        } else if (r === 6) {
          cell.s.font.bold = true;
          cell.s.alignment = { horizontal: 'center', vertical: 'center' };
        } else if (r === range.e.r) {
          cell.s.font.bold = true;
          if (c === 12) cell.s.alignment = { horizontal: 'center' };
          if (c === 13) {
            cell.t = 'n';
            cell.z = '#,##0.00';
            cell.s.alignment = { horizontal: 'right' };
          }
        } else if (r >= 7) {
          cell.s.alignment = { horizontal: 'center', vertical: 'center' };
          if (c === 11 || c === 12) cell.s.alignment.horizontal = 'left';
          if (c === 13) {
            cell.t = 'n';
            cell.z = '#,##0.00';
            cell.s.alignment.horizontal = 'right';
          }
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, projectCode);
  }

  XLSX.writeFile(wb, filename);
}



