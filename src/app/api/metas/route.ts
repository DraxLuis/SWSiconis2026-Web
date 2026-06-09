import { NextResponse } from 'next/server';
import { loadTable, preloadTables, num, str, getAño, SEC_EJEC } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const activeAño = getAño();
  try {
    await preloadTables(['meta', 'producto_proyecto', 'activ_obra_accinv', 'rubro', 'finalidad']);
    const { searchParams } = new URL(request.url);
    const filterRubro = searchParams.get('rubro') || '';
    const filterFuncion = searchParams.get('funcion') || '';

    // Load tables
    const gastos = loadTable('presupuesto_ejecucion_gasto');
    const metas = loadTable('meta');
    const rubros = loadTable('rubro');
    const producto = loadTable('producto_proyecto');
    const actObraAcin = loadTable('activ_obra_accinv');
    const finalidad = loadTable('finalidad');

    // Filter for our entity/year
    const gastosFiltered = gastos.filter(r => {
      const ano = str(r['ANO_EJE'] ?? r['ANO_PROC']);
      const ejec = str(r['SEC_EJEC']);
      if (ano !== activeAño && ano !== '') return false;
      if (ejec && ejec !== SEC_EJEC) return false;
      if (filterRubro && str(r['RUBRO']) !== filterRubro) return false;
      return true;
    });

    // Build lookup maps
    const metaMap = new Map<string, Record<string, unknown>>();
    metas.filter(m => str(m['ANO_EJE']) === activeAño && str(m['SEC_EJEC']) === SEC_EJEC)
      .forEach(m => {
        metaMap.set(str(m['SEC_FUNC']), m);
      });

    const productoMap = new Map<string, string>();
    producto.filter(p => str(p['ANO_EJE']) === activeAño && str(p['SEC_EJEC']) === SEC_EJEC)
      .forEach(p => productoMap.set(str(p['ACT_PROY']), str(p['NOMBRE'])));

    // Also add from activ_obra_accinv
    actObraAcin.filter(a => str(a['ANO_EJE']) === activeAño && str(a['SEC_EJEC']) === SEC_EJEC)
      .forEach(a => {
        const key = str(a['ACTOBRACIN']);
        if (!productoMap.has(key)) productoMap.set(key, str(a['NOMBRE']));
      });

    const finalidadMap = new Map<string, string>();
    finalidad.forEach(f => finalidadMap.set(str(f['FINALIDAD']), str(f['NOMBRE'])));

    const rubroMap = new Map<string, string>();
    rubros.forEach(r => rubroMap.set(str(r['FUENTE_FIN']), str(r['NOMBRE'])));

    // Group by SEC_FUNC (meta)
    const grouped = new Map<string, {
      sec_func: string;
      act_proy: string;
      componente: string;
      funcion: string;
      programa: string;
      meta_nombre: string;
      finalidad_nombre: string;
      act_proy_nombre: string;
      unidmed: string;
      cantidad: number;
      pia: number; pim: number; certif: number; comprometido: number;
      devengado: number; girado: number;
      dev_01: number; dev_02: number; dev_03: number; dev_04: number;
      dev_05: number; dev_06: number; dev_07: number; dev_08: number;
      dev_09: number; dev_10: number; dev_11: number; dev_12: number;
      gir_01: number; gir_02: number; gir_03: number; gir_04: number;
      gir_05: number; gir_06: number; gir_07: number; gir_08: number;
      gir_09: number; gir_10: number; gir_11: number; gir_12: number;
    }>();

    for (const row of gastosFiltered) {
      const sec_func = str(row['SEC_FUNC']);
      const meta = metaMap.get(sec_func);

      if (filterFuncion && meta && str(meta['FUNCION']) !== filterFuncion) continue;

      const key = sec_func || 'SIN_META';
      if (!grouped.has(key)) {
        const actProy = meta ? str(meta['ACT_PROY']) : '';
        grouped.set(key, {
          sec_func: key,
          act_proy: actProy,
          componente: meta ? str(meta['COMPONENTE']) : '',
          funcion: meta ? str(meta['FUNCION']) : '',
          programa: meta ? str(meta['PROGRAMA']) : '',
          meta_nombre: meta ? str(meta['NOMBRE']) : '(Sin meta)',
          finalidad_nombre: meta ? (finalidadMap.get(str(meta['FINALIDAD'])) ?? str(meta['FINALIDAD'])) : '',
          act_proy_nombre: productoMap.get(actProy) ?? actProy,
          unidmed: meta ? str(meta['UNIDMED']) : '',
          cantidad: meta ? num(meta['CANTIDAD']) : 0,
          pia: 0, pim: 0, certif: 0, comprometido: 0, devengado: 0, girado: 0,
          dev_01: 0, dev_02: 0, dev_03: 0, dev_04: 0, dev_05: 0, dev_06: 0,
          dev_07: 0, dev_08: 0, dev_09: 0, dev_10: 0, dev_11: 0, dev_12: 0,
          gir_01: 0, gir_02: 0, gir_03: 0, gir_04: 0, gir_05: 0, gir_06: 0,
          gir_07: 0, gir_08: 0, gir_09: 0, gir_10: 0, gir_11: 0, gir_12: 0,
        });
      }

      const g = grouped.get(key)!;
      g.pia += num(row['MTO_PIA']);
      g.pim += num(row['MTO_PIM']);
      g.certif += num(row['MTO_CERTIF']);
      g.comprometido += num(row['MTO_CPANUA']);
      // Sum monthly devengados
      for (let m = 1; m <= 12; m++) {
        const mk = m.toString().padStart(2, '0');
        const devKey = `dev_${mk}` as keyof typeof g;
        const girKey = `gir_${mk}` as keyof typeof g;
        (g[devKey] as number) += num(row[`MTO_DEV_${mk}`]);
        (g[girKey] as number) += num(row[`MTO_GIR_${mk}`]);
      }
      g.devengado = [g.dev_01,g.dev_02,g.dev_03,g.dev_04,g.dev_05,g.dev_06,
                    g.dev_07,g.dev_08,g.dev_09,g.dev_10,g.dev_11,g.dev_12].reduce((a,b)=>a+b,0);
      g.girado = [g.gir_01,g.gir_02,g.gir_03,g.gir_04,g.gir_05,g.gir_06,
                  g.gir_07,g.gir_08,g.gir_09,g.gir_10,g.gir_11,g.gir_12].reduce((a,b)=>a+b,0);
    }

    const rows = Array.from(grouped.values())
      .sort((a, b) => a.sec_func.localeCompare(b.sec_func));

    // Distinct rubros for filter
    const rubrosList = rubros
      .filter(r => str(r['ANO_EJE']) === activeAño)
      .map(r => ({ codigo: str(r['FUENTE_FIN']), nombre: str(r['NOMBRE']) }))
      .filter((r, i, arr) => arr.findIndex(x => x.codigo === r.codigo) === i);

    // Distinct funciones for filter
    const funcionesList = Array.from(metaMap.values())
      .map(m => str(m['FUNCION']))
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();

    return NextResponse.json({ success: true, rows, rubros: rubrosList, funciones: funcionesList });
  } catch (error) {
    console.error('Error en /api/metas:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
