import { NextResponse } from 'next/server';
import { loadTable, num, str, getAño, SEC_EJEC } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const activeAño = getAño();
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'gasto_1';
    const filterRubro = searchParams.get('rubro') || '';

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

    const metaMap = new Map<string, string>();
    metas.filter(m => str(m['ANO_EJE']) === activeAño && str(m['SEC_EJEC']) === SEC_EJEC)
      .forEach(m => metaMap.set(str(m['SEC_FUNC']), str(m['NOMBRE'])));

    const rubrosList = rubros
      .filter(r => str(r['ANO_EJE']) === activeAño)
      .map(r => ({ codigo: str(r['FUENTE_FIN']), nombre: str(r['NOMBRE']) }))
      .filter((r, i, arr) => arr.findIndex(x => x.codigo === r.codigo) === i);

    const gastoFiltered = gastos.filter(r => {
      const ano = str(r['ANO_EJE'] ?? r['ANO_PROC']);
      const ejec = str(r['SEC_EJEC']);
      if (ano !== activeAño && ano !== '') return false;
      if (ejec && ejec !== SEC_EJEC) return false;
      if (filterRubro && str(r['RUBRO']) !== filterRubro) return false;
      return true;
    });

    let rows: Record<string, unknown>[] = [];

    if (type.startsWith('gasto')) {
      const grouped = new Map<string, Record<string, number>>();
      for (const r of gastoFiltered) {
        const clasif = str(r['CLASIFICAD']);
        const truncLen = type === 'gasto_1' ? 3 : type === 'gasto_2' ? 5 : 99;
        const key = `${str(r['RUBRO'])}__${clasif.substring(0, truncLen)}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            rubro_code: 0, clasif_trunc: 0,
            pia: 0, pim: 0, certif: 0, comprometido: 0, devengado: 0, girado: 0
          });
        }
        const g = grouped.get(key)!;
        g.pia += num(r['MTO_PIA']);
        g.pim += num(r['MTO_PIM']);
        g.certif += num(r['MTO_CERTIF']);
        g.comprometido += num(r['MTO_CPANUA']);
        for (let m = 1; m <= 12; m++) {
          const mk = m.toString().padStart(2, '0');
          g.devengado += num(r[`MTO_DEV_${mk}`]);
          g.girado += num(r[`MTO_GIR_${mk}`]);
        }
      }
      rows = Array.from(grouped.entries()).map(([key, g]) => {
        const [rubro, clasifTrunc] = key.split('__');
        return {
          rubro, rubro_nombre: rubroMap.get(rubro) ?? '',
          clasificador: clasifTrunc, clasificador_nombre: clasifMap.get(clasifTrunc) ?? '',
          ...g
        };
      });
    } else if (type.startsWith('ingreso')) {
      const ingresoFiltered = ingresos.filter(r => {
        const ano = str(r['ANO_EJE'] ?? r['ANO_PROC']);
        const ejec = str(r['SEC_EJEC']);
        if (ano !== activeAño && ano !== '') return false;
        if (ejec && ejec !== SEC_EJEC) return false;
        if (filterRubro && str(r['RUBRO']) !== filterRubro) return false;
        return true;
      });
      rows = ingresoFiltered.map(r => ({
        rubro: str(r['RUBRO']),
        rubro_nombre: rubroMap.get(str(r['RUBRO'])) ?? '',
        clasificador: str(r['CLASIFICAD']),
        clasificador_nombre: clasifMap.get(str(r['CLASIFICAD'])) ?? '',
        pia: num(r['MTO_PIA']), pim: num(r['MTO_PIM']),
        recaudado: Array.from({ length: 12 }, (_, i) => num(r[`RECAUD_${(i+1).toString().padStart(2,'0')}`])).reduce((a,b)=>a+b,0),
      }));
    }

    return NextResponse.json({ success: true, rows, rubros: rubrosList });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
