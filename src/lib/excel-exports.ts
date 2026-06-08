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
export function exportEjecucionPPTO(rows: EjecucionRow[]) {
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
    'Pïm',
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

  // Totals Row
  const totalsRowNumber = lastDataRowNumber + 1; // 1-indexed totals row
  wsData.push([
    '',
    'T O T A L E S',
    { f: `SUBTOTAL(9,C5:C${lastDataRowNumber})` },
    { f: `SUBTOTAL(9,D5:D${lastDataRowNumber})` },
    { f: `SUBTOTAL(9,E5:E${lastDataRowNumber})` },
    { f: `SUBTOTAL(9,F5:F${lastDataRowNumber})` },
    { f: `SUBTOTAL(9,G5:G${lastDataRowNumber})` },
    { f: `SUBTOTAL(9,H5:H${lastDataRowNumber})` },
    { f: `SUBTOTAL(9,I5:I${lastDataRowNumber})` },
    { f: `SUBTOTAL(9,J5:J${lastDataRowNumber})` },
    { f: `SUBTOTAL(9,K5:K${lastDataRowNumber})` },
    { f: `I${totalsRowNumber}/E${totalsRowNumber}` } // Devengado/PIM
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
  XLSX.writeFile(wb, 'ejecucion presupuestal.xlsx');
}

/**
 * 2. Export DETALLE DE MOVIMENTOS DE CERTICACIONES Y COMPROMISOS ANUALES
 * File: certificados.xlsx
 * Font: Calibri
 * SheetName: [programCode]
 */
export function exportCertificados(programCode: string, programName: string, rows: CertificadoRow[]) {
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

  // Push Totals Row
  const totalRow: unknown[] = Array(18).fill('');
  totalRow[7] = 'T O T A L E S '; // Put text in H (col index 7)
  totalRow[13] = { f: `SUBTOTAL(9,N8:N${lastDataRowNumber})` }; // SUBTOTAL in N
  totalRow[14] = { f: `SUBTOTAL(9,O8:O${lastDataRowNumber})` }; // SUBTOTAL in O
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
  XLSX.writeFile(wb, 'certificados.xlsx');
}

/**
 * 3. Export DETALLE DE REGISTROS - DEVENGADOS
 * File: devengados.xlsx
 * Font: Calibri
 * SheetName: [programCode]
 */
export function exportDevengados(programCode: string, programName: string, rows: ExpedienteRow[]) {
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

  // Push Totals Row
  const totalRow: unknown[] = Array(19).fill('');
  totalRow[10] = 'T O T A L E S'; // Put text in K (col index 10)
  totalRow[14] = { f: `SUBTOTAL(9,O8:O${lastDataRowNumber})` }; // SUBTOTAL in O
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
  XLSX.writeFile(wb, 'devengados.xlsx');
}

/**
 * 4. Export DETALLE DE REGISTROS - GIRADOS
 * File: giros.xlsx
 * Font: Calibri
 * SheetName: [programCode]
 */
export function exportGiros(programCode: string, programName: string, rows: ExpedienteRow[]) {
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

  // Push Totals Row
  const totalRow: unknown[] = Array(19).fill('');
  totalRow[10] = 'T O T A L E S'; // Put text in K (col index 10)
  totalRow[14] = { f: `SUBTOTAL(9,O8:O${lastDataRowNumber})` }; // SUBTOTAL in O
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
  XLSX.writeFile(wb, 'giros.xlsx');
}

/**
 * 5. Export DETALLE DE REGISTROS - GIRADOS CON GLOSA
 * File: giros-con-glosa.xlsx -> downloaded as 'giros con glosa.xlsx'
 * Font: Calibri
 * SheetName: [programCode]
 */
export function exportGirosConGlosa(programCode: string, programName: string, rows: ExpedienteRow[]) {
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

  // Push Totals Row
  const totalRow: unknown[] = Array(20).fill('');
  totalRow[10] = 'T O T A L E S'; // Put text in K (col index 10)
  totalRow[15] = { f: `SUBTOTAL(9,P8:P${lastDataRowNumber})` }; // SUBTOTAL in P (col index 15)
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
  XLSX.writeFile(wb, 'giros con glosa.xlsx'); // Space in name!
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

  // Totals Row
  wsData.push([
    'TOTALES RESUMEN',
    '',
    { f: `SUBTOTAL(9,C12:C${lastDataRowNumber})` },
    { f: `SUBTOTAL(9,D12:D${lastDataRowNumber})` },
    { f: `SUBTOTAL(9,E12:E${lastDataRowNumber})` },
    { f: `SUBTOTAL(9,F12:F${lastDataRowNumber})` },
    { f: `SUBTOTAL(9,G12:G${lastDataRowNumber})` }
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

  // Totals row
  wsData.push([
    'TOTALES',
    '',
    { f: `SUM(C6:C${lastDataRowNumber})` },
    { f: `SUM(D6:D${lastDataRowNumber})` },
    { f: `SUM(E6:E${lastDataRowNumber})` },
    { f: `SUM(F6:F${lastDataRowNumber})` },
    { f: `SUM(G6:G${lastDataRowNumber})` },
    { f: `SUM(H6:H${lastDataRowNumber})` },
    { f: `SUM(I6:I${lastDataRowNumber})` },
    { f: `SUM(J6:J${lastDataRowNumber})` },
    { f: `IF(E${totalsRowNumber}>0,I${totalsRowNumber}/E${totalsRowNumber},0)` }
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
}[]) {
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
    'Ejecución Presupuestal  - Actividad / Proyecto',
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

  // Totals Row
  wsData.push([
    '',
    'T O T A L E S',
    { f: `SUBTOTAL(9,C5:C${lastDataRowNumber})` },
    { f: `SUBTOTAL(9,D5:D${lastDataRowNumber})` },
    { f: `SUBTOTAL(9,E5:E${lastDataRowNumber})` },
    { f: `SUBTOTAL(9,F5:F${lastDataRowNumber})` },
    { f: `SUBTOTAL(9,G5:G${lastDataRowNumber})` },
    { f: `SUBTOTAL(9,H5:H${lastDataRowNumber})` },
    { f: `SUBTOTAL(9,I5:I${lastDataRowNumber})` },
    { f: `SUBTOTAL(9,J5:J${lastDataRowNumber})` },
    { f: `SUBTOTAL(9,K5:K${lastDataRowNumber})` },
    { f: `I${totalsRowNumber}/E${totalsRowNumber}` } // Devengado/PIM
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
  XLSX.writeFile(wb, 'ejecucion-actproy.xlsx');
}

