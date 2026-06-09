import { NextResponse } from 'next/server';
import { loadTable, preloadTables, num, str, getAño, SEC_EJEC } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const activeAño = getAño();
  try {
    await preloadTables(['meta', 'producto_proyecto', 'activ_obra_accinv', 'rubro']);
    const { searchParams } = new URL(request.url);
    const filterRubro = searchParams.get('rubro') || '';
    const onlyProjects = searchParams.get('onlyProjects') === 'true';

    const gastos = loadTable('presupuesto_ejecucion_gasto');
    const metas = loadTable('meta');
    const producto = loadTable('producto_proyecto');
    const actObra = loadTable('activ_obra_accinv');
    const rubros = loadTable('rubro');

    // Build ACT_PROY name map
    const nombreMap = new Map<string, string>();
    producto.filter(p => str(p['ANO_EJE']) === activeAño && str(p['SEC_EJEC']) === SEC_EJEC)
      .forEach(p => nombreMap.set(str(p['ACT_PROY']), str(p['NOMBRE'])));
    actObra.filter(a => str(a['ANO_EJE']) === activeAño && str(a['SEC_EJEC']) === SEC_EJEC)
      .forEach(a => {
        const key = str(a['ACTOBRACIN']);
        if (!nombreMap.has(key)) nombreMap.set(key, str(a['NOMBRE']));
      });

    // Map SEC_FUNC → ACT_PROY from meta
    const metaActProyMap = new Map<string, string>();
    metas.filter(m => str(m['ANO_EJE']) === activeAño && str(m['SEC_EJEC']) === SEC_EJEC)
      .forEach(m => metaActProyMap.set(str(m['SEC_FUNC']), str(m['ACT_PROY'])));

    // Filter gastos
    const filtered = gastos.filter(r => {
      const ano = str(r['ANO_EJE'] ?? r['ANO_PROC']);
      const ejec = str(r['SEC_EJEC']);
      if (ano !== activeAño && ano !== '') return false;
      if (ejec && ejec !== SEC_EJEC) return false;
      if (filterRubro && str(r['RUBRO']) !== filterRubro) return false;
      return true;
    });

    // Group by ACT_PROY
    const grouped = new Map<string, {
      act_proy: string; act_proy_nombre: string;
      tipo: string;  // A = Actividad, P = Proyecto, O = Obra
      pia: number; pim: number; certif: number; comprometido: number;
      atcp: number; devengado: number; girado: number;
      metas_count: number;
    }>();

    for (const row of filtered) {
      const secFunc = str(row['SEC_FUNC']);
      const actProy = metaActProyMap.get(secFunc) ?? '';
      if (!actProy) continue;

      // In Peru-SIAF, ACT_PROY codes starting with '2' are Projects (P).
      // Codes starting with '3' are Activities (A).
      const tipo = actProy.startsWith('2') ? 'P' : actProy.startsWith('3') ? 'A' : 'O';

      if (!grouped.has(actProy)) {
        grouped.set(actProy, {
          act_proy: actProy,
          act_proy_nombre: nombreMap.get(actProy) ?? actProy,
          tipo,
          pia: 0, pim: 0, certif: 0, comprometido: 0, atcp: 0, devengado: 0, girado: 0,
          metas_count: 0,
        });
      }

      const g = grouped.get(actProy)!;
      g.pia += num(row['MTO_PIA']);
      g.pim += num(row['MTO_PIM']);
      g.certif += num(row['MTO_CERTIF']);
      g.comprometido += num(row['MTO_CPANUA']);
      // Sum all devengado/girado/atcp months
      for (let m = 1; m <= 12; m++) {
        const mk = m.toString().padStart(2, '0');
        g.devengado += num(row[`MTO_DEV_${mk}`]);
        g.girado += num(row[`MTO_GIR_${mk}`]);
        g.atcp += num(row[`MTO_ATCP${mk}`]);
      }
    }

    // Count metas per act_proy
    metas.filter(m => str(m['ANO_EJE']) === activeAño && str(m['SEC_EJEC']) === SEC_EJEC)
      .forEach(m => {
        const ap = str(m['ACT_PROY']);
        if (grouped.has(ap)) {
          grouped.get(ap)!.metas_count++;
        }
      });

    let rows = Array.from(grouped.values())
      .sort((a, b) => a.act_proy.localeCompare(b.act_proy));

    if (onlyProjects) {
      rows = rows.filter(r => r.tipo === 'P');
    }

    const rubrosList = rubros
      .filter(r => str(r['ANO_EJE']) === activeAño)
      .map(r => ({ codigo: str(r['FUENTE_FIN']), nombre: str(r['NOMBRE']) }))
      .filter((r, i, arr) => arr.findIndex(x => x.codigo === r.codigo) === i);

    return NextResponse.json({ success: true, rows, rubros: rubrosList });
  } catch (error) {
    console.error('Error en /api/proyectos:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
