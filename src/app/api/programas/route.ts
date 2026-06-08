import { NextResponse } from 'next/server';
import { loadTable, preloadTables, num, str, AÑO, SEC_EJEC } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Preload tables from SQL Server
    await preloadTables(['meta', 'programa_pptal', 'presupuesto_ejecucion_gasto']);

    const metas = loadTable('meta');
    const progNamesTable = loadTable('programa_pptal');
    const gastos = loadTable('presupuesto_ejecucion_gasto');

    // Map SEC_FUNC -> PPTO (Program Code)
    const metaMap = new Map<string, string>();
    metas.filter(m => str(m['ANO_EJE']) === AÑO && str(m['SEC_EJEC']) === SEC_EJEC)
      .forEach(m => {
        const sf = str(m['SEC_FUNC']);
        const ppto = str(m['PPTO']);
        if (sf && ppto) {
          metaMap.set(sf, ppto);
        }
      });

    // Map Program Code -> Program Name
    const progNames = new Map<string, string>();
    progNamesTable.filter(p => str(p['ANO_EJE']) === AÑO)
      .forEach(p => {
        const code = str(p['PROGPPTO']);
        const name = str(p['NOMBRE']);
        if (code && name) {
          progNames.set(code, name);
        }
      });

    // Group and aggregate gastos by program (PPTO)
    const grouped = new Map<string, { pim: number; devengado: number; girado: number }>();
    
    // Filter gastos
    const filteredGastos = gastos.filter(r => {
      const ano = str(r['ANO_EJE'] ?? r['ANO_PROC']);
      const ejec = str(r['SEC_EJEC']);
      if (ano !== AÑO && ano !== '') return false;
      if (ejec && ejec !== SEC_EJEC) return false;
      return true;
    });

    for (const row of filteredGastos) {
      const secFunc = str(row['SEC_FUNC']);
      const progCode = metaMap.get(secFunc) || '9002'; // default fallback if not matched
      
      const pim = num(row['MTO_PIM']);
      let dev = 0;
      let gir = 0;
      
      for (let m = 1; m <= 12; m++) {
        const mk = m.toString().padStart(2, '0');
        dev += num(row[`MTO_DEV_${mk}`]);
        gir += num(row[`MTO_GIR_${mk}`]);
      }

      if (!grouped.has(progCode)) {
        grouped.set(progCode, { pim: 0, devengado: 0, girado: 0 });
      }
      const g = grouped.get(progCode)!;
      g.pim += pim;
      g.devengado += dev;
      g.girado += gir;
    }

    // Convert grouped map to rows
    const rows = Array.from(grouped.entries()).map(([codigo, vals]) => {
      const nombre = progNames.get(codigo) || 'PROGRAMA PPTO ' + codigo;
      return {
        codigo,
        nombre,
        pim: vals.pim,
        devengado: vals.devengado,
        girado: vals.girado,
        saldo: vals.pim - vals.devengado
      };
    }).sort((a, b) => a.codigo.localeCompare(b.codigo));

    // Calculate overall totals
    const totals = rows.reduce(
      (acc, r) => {
        acc.pim += r.pim;
        acc.devengado += r.devengado;
        acc.girado += r.girado;
        acc.saldo += r.saldo;
        return acc;
      },
      { pim: 0, devengado: 0, girado: 0, saldo: 0 }
    );

    return NextResponse.json({ success: true, rows, totals });
  } catch (error) {
    console.error('Error en /api/programas:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
