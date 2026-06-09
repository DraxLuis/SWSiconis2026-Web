import { NextResponse } from 'next/server';
import { loadTable, preloadTables, num, str, getAño, SEC_EJEC } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const activeAño = getAño();
  try {
    const { searchParams } = new URL(request.url);
    const filterRubro = searchParams.get('rubro') || '';
    const filterPrograma = searchParams.get('programa') || '';

    // Preload tables from SQL Server
    await preloadTables(['meta', 'presupuesto_ejecucion_gasto', 'presupuesto_ejecucion_ingreso', 'rubro', 'clasificador']);

    const gastos = loadTable('presupuesto_ejecucion_gasto');
    const ingresos = loadTable('presupuesto_ejecucion_ingreso');
    const rubros = loadTable('rubro');
    const clasifTable = loadTable('clasificador');
    const metas = loadTable('meta');

    const clasifMap = new Map<string, string>();
    clasifTable.filter(c => str(c['ANO_EJE']) === activeAño)
      .forEach(c => clasifMap.set(str(c['CLASIFIC']), str(c['NOMBRE'])));

    const rubroMap = new Map<string, string>();
    rubros.filter(r => str(r['ANO_EJE']) === activeAño)
      .forEach(r => rubroMap.set(str(r['FUENTE_FIN']), str(r['NOMBRE'])));

    const metaProgramMap = new Map<string, string>();
    metas.filter(m => str(m['ANO_EJE']) === activeAño && str(m['SEC_EJEC']) === SEC_EJEC)
      .forEach(m => metaProgramMap.set(str(m['SEC_FUNC']), str(m['PPTO'])));

    // Gasto rows
    const gastoFiltered = gastos.filter(r => {
      const ano = str(r['ANO_EJE'] ?? r['ANO_PROC']);
      const ejec = str(r['SEC_EJEC']);
      if (ano !== activeAño && ano !== '') return false;
      if (ejec && ejec !== SEC_EJEC) return false;
      if (filterRubro && str(r['RUBRO']) !== filterRubro) return false;
      if (filterPrograma) {
        const secFunc = str(r['SEC_FUNC']);
        const progCode = metaProgramMap.get(secFunc) || '';
        if (progCode !== filterPrograma) return false;
      }
      return true;
    });

    const rows = gastoFiltered.map(r => {
      const rubro = str(r['RUBRO']);
      const clasif = str(r['CLASIFICAD']);
      const devTotal = Array.from({ length: 12 }, (_, i) => num(r[`MTO_DEV_${(i+1).toString().padStart(2,'0')}`])).reduce((a,b)=>a+b,0);
      const girTotal = Array.from({ length: 12 }, (_, i) => num(r[`MTO_GIR_${(i+1).toString().padStart(2,'0')}`])).reduce((a,b)=>a+b,0);
      return {
        rubro,
        rubro_nombre: rubroMap.get(rubro) ?? '',
        clasificador: clasif,
        clasificador_nombre: clasifMap.get(clasif) ?? '',
        pia: num(r['MTO_PIA']),
        pim: num(r['MTO_PIM']),
        certificado: num(r['MTO_CERTIF']),
        comprometido: num(r['MTO_CPANUA']),
        devengado_total: devTotal,
        girado_total: girTotal,
        dev_01: num(r['MTO_DEV_01']), dev_02: num(r['MTO_DEV_02']), dev_03: num(r['MTO_DEV_03']),
        dev_04: num(r['MTO_DEV_04']), dev_05: num(r['MTO_DEV_05']), dev_06: num(r['MTO_DEV_06']),
        dev_07: num(r['MTO_DEV_07']), dev_08: num(r['MTO_DEV_08']), dev_09: num(r['MTO_DEV_09']),
        dev_10: num(r['MTO_DEV_10']), dev_11: num(r['MTO_DEV_11']), dev_12: num(r['MTO_DEV_12']),
        gir_01: num(r['MTO_GIR_01']), gir_02: num(r['MTO_GIR_02']), gir_03: num(r['MTO_GIR_03']),
        gir_04: num(r['MTO_GIR_04']), gir_05: num(r['MTO_GIR_05']), gir_06: num(r['MTO_GIR_06']),
        gir_07: num(r['MTO_GIR_07']), gir_08: num(r['MTO_GIR_08']), gir_09: num(r['MTO_GIR_09']),
        gir_10: num(r['MTO_GIR_10']), gir_11: num(r['MTO_GIR_11']), gir_12: num(r['MTO_GIR_12']),
      };
    });

    rows.sort((a, b) => a.rubro.localeCompare(b.rubro) || a.clasificador.localeCompare(b.clasificador));

    const rubrosList = rubros
      .filter(r => str(r['ANO_EJE']) === activeAño)
      .map(r => ({ codigo: str(r['FUENTE_FIN']), nombre: str(r['NOMBRE']) }))
      .filter((r, i, arr) => arr.findIndex(x => x.codigo === r.codigo) === i);

    // Suppress unused var warning for ingresos
    void ingresos;

    return NextResponse.json({ success: true, rows, rubros: rubrosList });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
