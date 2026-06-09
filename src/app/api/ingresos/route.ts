import { NextResponse } from 'next/server';
import { loadTable, num, str, getAño, SEC_EJEC } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const activeAño = getAño();
  try {
    const { searchParams } = new URL(request.url);
    const filterRubro = searchParams.get('rubro') || '';
    const filterClasificador = searchParams.get('clasificador') || '';

    const ingresos = loadTable('presupuesto_ejecucion_ingreso');
    const rubros = loadTable('rubro');
    const clasificadores = loadTable('clasificador');

    const clasifMap = new Map<string, string>();
    clasificadores.filter(c => str(c['ANO_EJE']) === activeAño)
      .forEach(c => clasifMap.set(str(c['CLASIFIC']), str(c['NOMBRE'])));

    const rubroMap = new Map<string, string>();
    rubros.filter(r => str(r['ANO_EJE']) === activeAño)
      .forEach(r => rubroMap.set(str(r['FUENTE_FIN']), str(r['NOMBRE'])));

    const filtered = ingresos.filter(r => {
      const ano = str(r['ANO_EJE'] ?? r['ANO_PROC']);
      const ejec = str(r['SEC_EJEC']);
      if (ano !== activeAño && ano !== '') return false;
      if (ejec && ejec !== SEC_EJEC) return false;
      if (filterRubro && str(r['RUBRO']) !== filterRubro) return false;
      if (filterClasificador && !str(r['CLASIFICAD']).startsWith(filterClasificador)) return false;
      return true;
    });

    const rows = filtered.map(r => {
      const rubro = str(r['RUBRO']);
      const clasif = str(r['CLASIFICAD']);
      const meses = Array.from({ length: 12 }, (_, i) => {
        const mk = (i + 1).toString().padStart(2, '0');
        return num(r[`RECAUD_${mk}`]);
      });
      return {
        rubro,
        rubro_nombre: rubroMap.get(rubro) ?? '',
        clasificador: clasif,
        clasificador_nombre: clasifMap.get(clasif) ?? '',
        pia: num(r['MTO_PIA']),
        pim: num(r['MTO_PIM']),
        recaudado_total: meses.reduce((a, b) => a + b, 0),
        recaud_01: meses[0], recaud_02: meses[1], recaud_03: meses[2],
        recaud_04: meses[3], recaud_05: meses[4], recaud_06: meses[5],
        recaud_07: meses[6], recaud_08: meses[7], recaud_09: meses[8],
        recaud_10: meses[9], recaud_11: meses[10], recaud_12: meses[11],
      };
    });

    rows.sort((a, b) => a.rubro.localeCompare(b.rubro) || a.clasificador.localeCompare(b.clasificador));

    const rubrosList = rubros
      .filter(r => str(r['ANO_EJE']) === activeAño)
      .map(r => ({ codigo: str(r['FUENTE_FIN']), nombre: str(r['NOMBRE']) }))
      .filter((r, i, arr) => arr.findIndex(x => x.codigo === r.codigo) === i);

    return NextResponse.json({ success: true, rows, rubros: rubrosList });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
