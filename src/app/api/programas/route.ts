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
    const grouped = new Map<string, {
      pia: number;
      modif: number;
      pim: number;
      certif: number;
      cpanua: number;
      atcp: number;
      devengado: number;
      girado: number;
    }>();
    
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
      
      const pia = num(row['MTO_PIA']);
      const modif = num(row['MTO_MODIF']);
      const pim = num(row['MTO_PIM']);
      const certif = num(row['MTO_CERTIF']);
      const cpanua = num(row['MTO_CPANUA']);
      
      let dev = 0;
      let gir = 0;
      let atcp = 0;
      
      for (let m = 1; m <= 12; m++) {
        const mk = m.toString().padStart(2, '0');
        dev += num(row[`MTO_DEV_${mk}`]);
        gir += num(row[`MTO_GIR_${mk}`]);
        atcp += num(row[`MTO_ATCP${mk}`]);
      }

      if (!grouped.has(progCode)) {
        grouped.set(progCode, { pia: 0, modif: 0, pim: 0, certif: 0, cpanua: 0, atcp: 0, devengado: 0, girado: 0 });
      }
      const g = grouped.get(progCode)!;
      g.pia += pia;
      g.modif += modif;
      g.pim += pim;
      g.certif += certif;
      g.cpanua += cpanua;
      g.atcp += atcp;
      g.devengado += dev;
      g.girado += gir;
    }

    // Convert grouped map to rows
    const rows = Array.from(grouped.entries()).map(([codigo, vals]) => {
      const nombre = progNames.get(codigo) || 'PROGRAMA PPTO ' + codigo;
      return {
        codigo,
        nombre,
        pia: vals.pia,
        modif: vals.modif,
        pim: vals.pim,
        certif: vals.certif,
        cpanua: vals.cpanua,
        atcp: vals.atcp,
        devengado: vals.devengado,
        girado: vals.girado,
        saldo: vals.pim - vals.devengado,
        avance: vals.pim > 0 ? vals.devengado / vals.pim : 0
      };
    }).sort((a, b) => a.codigo.localeCompare(b.codigo));

    // Calculate overall totals
    const totals = rows.reduce(
      (acc, r) => {
        acc.pia += r.pia;
        acc.modif += r.modif;
        acc.pim += r.pim;
        acc.certif += r.certif;
        acc.cpanua += r.cpanua;
        acc.atcp += r.atcp;
        acc.devengado += r.devengado;
        acc.girado += r.girado;
        acc.saldo += r.saldo;
        return acc;
      },
      { pia: 0, modif: 0, pim: 0, certif: 0, cpanua: 0, atcp: 0, devengado: 0, girado: 0, saldo: 0, avance: 0 }
    );
    totals.avance = totals.pim > 0 ? totals.devengado / totals.pim : 0;

    return NextResponse.json({ success: true, rows, totals });
  } catch (error) {
    console.error('Error en /api/programas:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
