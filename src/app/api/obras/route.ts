import { NextResponse } from 'next/server';
import { loadTable, num, str, getAño, SEC_EJEC, trySQL } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const activeAño = getAño();
  try {
    const { searchParams } = new URL(request.url);
    const filterRubro = searchParams.get('rubro') || '';

    interface ObraResponseRow {
      act_proy: string;
      act_proy_nombre: string;
      tipo: string;
      pia: number;
      pim: number;
      certif: number;
      comprometido: number;
      atcp: number;
      devengado: number;
      girado: number;
      metas_count: number;
      sec_funcs?: string[];
    }

    let rows: ObraResponseRow[] = [];

    if (process.env.DB_SERVER) {
      const queryParams: Record<string, string | number | boolean> = { sec_ejec: SEC_EJEC, year: activeAño };
      if (filterRubro) {
        queryParams.rubro = filterRubro;
      }

      const sqlResult = await trySQL(`
        SELECT 
          ao.actobracin as codigo,
          ao.nombre as nombre,
          SUM(ISNULL(eg.mto_pia, 0)) as pia,
          SUM(ISNULL(eg.mto_modif, 0)) as modif,
          SUM(ISNULL(eg.mto_pim, 0)) as pim,
          SUM(ISNULL(eg.mto_certif, 0)) as certif,
          SUM(ISNULL(eg.mto_cpanua, 0)) as comprometido,
          SUM(ISNULL(eg.mto_dev_01,0)+ISNULL(eg.mto_dev_02,0)+ISNULL(eg.mto_dev_03,0)+ISNULL(eg.mto_dev_04,0)+ISNULL(eg.mto_dev_05,0)+ISNULL(eg.mto_dev_06,0)+ISNULL(eg.mto_dev_07,0)+ISNULL(eg.mto_dev_08,0)+ISNULL(eg.mto_dev_09,0)+ISNULL(eg.mto_dev_10,0)+ISNULL(eg.mto_dev_11,0)+ISNULL(eg.mto_dev_12,0)) as devengado,
          SUM(ISNULL(eg.mto_gir_01,0)+ISNULL(eg.mto_gir_02,0)+ISNULL(eg.mto_gir_03,0)+ISNULL(eg.mto_gir_04,0)+ISNULL(eg.mto_gir_05,0)+ISNULL(eg.mto_gir_06,0)+ISNULL(eg.mto_gir_07,0)+ISNULL(eg.mto_gir_08,0)+ISNULL(eg.mto_gir_09,0)+ISNULL(eg.mto_gir_10,0)+ISNULL(eg.mto_gir_11,0)+ISNULL(eg.mto_gir_12,0)) as girado
        FROM [meta] m
        INNER JOIN [activ_obra_accinv] ao ON m.componente = ao.actobracin AND m.ano_eje = ao.ano_eje AND m.sec_ejec = ao.sec_ejec
        LEFT JOIN [ejecucion_gasto] eg ON eg.sec_func = m.sec_func AND eg.sec_ejec = m.sec_ejec AND eg.ano_eje = m.ano_eje
        WHERE m.sec_ejec = @sec_ejec AND m.ano_eje = @year
        ${filterRubro ? 'AND eg.rubro = @rubro' : ''}
        GROUP BY ao.actobracin, ao.nombre
        ORDER BY ao.actobracin
      `, queryParams);

      if (sqlResult) {
        rows = sqlResult.map((r: Record<string, unknown>) => ({
          act_proy: String(r.codigo || ''),
          act_proy_nombre: String(r.nombre || ''),
          tipo: 'O',
          pia: Number(r.pia || 0),
          pim: Number(r.pim || 0),
          certif: Number(r.certif || 0),
          comprometido: Number(r.comprometido || 0),
          atcp: Number(r.atcp || 0),
          devengado: Number(r.devengado || 0),
          girado: Number(r.girado || 0),
          metas_count: 0
        }));
      }
    }

    // Fallback if not configured or query failed
    if (rows.length === 0) {
      const activObra = loadTable('activ_obra_accinv');
      const metas = loadTable('meta');
      const gastos = loadTable('presupuesto_ejecucion_gasto');

      const metaMap = new Map<string, Record<string, unknown>>();
      metas.filter(m => str(m['ANO_EJE']) === activeAño && str(m['SEC_EJEC']) === SEC_EJEC)
        .forEach(m => metaMap.set(str(m['SEC_FUNC']), m));

      const actObraMap = new Map<string, string>();
      activObra.filter(ao => str(ao['ANO_EJE']) === activeAño && str(ao['SEC_EJEC']) === SEC_EJEC)
        .forEach(ao => actObraMap.set(str(ao['ACTOBRACIN']), str(ao['NOMBRE'])));

      const filterEjec = gastos.filter(eg => {
        const ano = str(eg['ANO_EJE'] ?? eg['ANO_PROC']);
        const ejec = str(eg['SEC_EJEC']);
        if (ano !== activeAño && ano !== '') return false;
        if (ejec && ejec !== SEC_EJEC) return false;
        if (filterRubro && str(eg['RUBRO']) !== filterRubro) return false;
        return true;
      });

      const grouped = new Map<string, {
        act_proy: string;
        act_proy_nombre: string;
        tipo: string;
        pia: number;
        pim: number;
        certif: number;
        comprometido: number;
        atcp: number;
        devengado: number;
        girado: number;
        metas_count: number;
      }>();

      filterEjec.forEach(eg => {
        const secFunc = str(eg['SEC_FUNC']);
        const m = metaMap.get(secFunc);
        if (!m) return;
        const compCode = str(m['COMPONENTE']);
        if (!actObraMap.has(compCode)) return;

        if (!grouped.has(compCode)) {
          grouped.set(compCode, {
            act_proy: compCode,
            act_proy_nombre: actObraMap.get(compCode) || '',
            tipo: 'O',
            pia: 0, pim: 0, certif: 0, comprometido: 0, atcp: 0, devengado: 0, girado: 0,
            metas_count: 0
          });
        }
        const item = grouped.get(compCode)!;
        item.pia += num(eg['MTO_PIA']);
        item.pim += num(eg['MTO_PIM']);
        item.certif += num(eg['MTO_CERTIF']);
        item.comprometido += num(eg['MTO_CPANUA']);
        for (let m = 1; m <= 12; m++) {
          const mk = m.toString().padStart(2, '0');
          item.devengado += num(eg[`MTO_DEV_${mk}`]);
          item.girado += num(eg[`MTO_GIR_${mk}`]);
          item.atcp += num(eg[`MTO_ATCP${mk}`]);
        }
      });

      rows = Array.from(grouped.values())
        .sort((a, b) => a.act_proy.localeCompare(b.act_proy));
    }

    // Populate sec_funcs and metas_count dynamically
    const metaTable = loadTable('meta');
    const compMetaMap = new Map<string, string[]>();
    metaTable.filter(m => str(m['ANO_EJE']) === activeAño && str(m['SEC_EJEC']) === SEC_EJEC)
      .forEach(m => {
        const comp = str(m['COMPONENTE']);
        const sf = str(m['SEC_FUNC']);
        if (!compMetaMap.has(comp)) compMetaMap.set(comp, []);
        if (!compMetaMap.get(comp)!.includes(sf)) {
          compMetaMap.get(comp)!.push(sf);
        }
      });

    rows.forEach(r => {
      const sfs = compMetaMap.get(r.act_proy) || [];
      r.sec_funcs = sfs;
      r.metas_count = sfs.length;
    });

    const rubros = loadTable('rubro');
    const rubrosList = rubros
      .filter(r => str(r['ANO_EJE']) === activeAño)
      .map(r => ({ codigo: str(r['FUENTE_FIN']), nombre: str(r['NOMBRE']) }))
      .filter((r, i, arr) => arr.findIndex(x => x.codigo === r.codigo) === i);

    return NextResponse.json({ success: true, rows, rubros: rubrosList });
  } catch (error) {
    console.error('Error en /api/obras:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
