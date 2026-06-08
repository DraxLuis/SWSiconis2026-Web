import { NextResponse } from 'next/server';
import { trySQL, loadTable, str, SEC_EJEC } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || '2026';

  try {
    const counts: Record<string, number> = {
      ejecucion_metas: 0,
      certificado: 0,
      data_certificados: 0,
      data_devengados: 0,
      data_girados: 0,
      ejecucion_activ_obra_accinv: 0,
      ejecucion_actproy: 0,
      ejecucion_ppto: 0,
      ejecucion_metas_clasificador: 0,
      ejecucion_ppto_meta: 0,
      meta_certificados: 0,
      meta_devengados: 0,
      programa_accion_inversion: 0,
      programa_devengados: 0
    };

    let sqlSuccess = false;

    // Try SQL Server
    const resSql = await trySQL(`
      SELECT 'ejecucion_metas' as type, COUNT(DISTINCT sec_func) as cnt FROM [meta] WHERE sec_ejec = @sec_ejec AND ano_eje = @year
      UNION ALL
      SELECT 'certificado' as type, COUNT(*) as cnt FROM (
        SELECT c.CERTIF FROM [certificado] c 
        LEFT JOIN [meta] m ON c.SEC_FUNC = m.sec_func AND c.sec_ejec = m.sec_ejec AND c.ano_eje = m.ano_eje
        WHERE c.sec_ejec = @sec_ejec AND c.ano_eje = @year 
        GROUP BY c.ANO_EJE, c.CERTIF, c.SEC_FUNC, c.RUBRO, c.CLASIF
      ) x
      UNION ALL
      SELECT 'data_certificados' as type, COUNT(*) as cnt FROM [certificado] WHERE sec_ejec = @sec_ejec AND ano_eje = @year
      UNION ALL
      SELECT 'data_devengados' as type, COUNT(*) as cnt FROM [expedientes_gastos_2026] WHERE FASE = 'D' AND sec_ejec = @sec_ejec AND ano_eje = @year
      UNION ALL
      SELECT 'data_girados' as type, COUNT(*) as cnt FROM [expedientes_gastos_2026] WHERE FASE = 'G' AND sec_ejec = @sec_ejec AND ano_eje = @year
      UNION ALL
      SELECT 'ejecucion_activ_obra_accinv' as type, COUNT(DISTINCT ao.actobracin) as cnt FROM [meta] m 
      INNER JOIN [activ_obra_accinv] ao ON m.componente = ao.actobracin AND m.ano_eje = ao.ano_eje AND m.sec_ejec = ao.sec_ejec
      WHERE m.sec_ejec = @sec_ejec AND m.ano_eje = @year
      UNION ALL
      SELECT 'ejecucion_actproy' as type, COUNT(DISTINCT m.act_proy) as cnt FROM [meta] m 
      INNER JOIN [producto_proyecto] pp ON m.act_proy = pp.act_proy AND m.ano_eje = pp.ano_eje AND m.sec_ejec = pp.sec_ejec
      WHERE m.sec_ejec = @sec_ejec AND m.ano_eje = @year
      UNION ALL
      SELECT 'ejecucion_ppto' as type, COUNT(DISTINCT p.progppto) as cnt FROM [meta] m 
      INNER JOIN [programa_pptal] p ON m.ppto = p.progppto AND m.ano_eje = p.ano_eje
      WHERE m.sec_ejec = @sec_ejec AND m.ano_eje = @year
      UNION ALL
      SELECT 'ejecucion_metas_clasificador' as type, COUNT(*) as cnt FROM [ejecucion_gasto] WHERE sec_ejec = @sec_ejec AND ano_eje = @year
      UNION ALL
      SELECT 'ejecucion_ppto_meta' as type, COUNT(*) as cnt FROM (
        SELECT m.ppto, m.sec_func FROM [ejecucion_gasto] eg 
        INNER JOIN [meta] m ON eg.sec_func = m.sec_func AND eg.sec_ejec = m.sec_ejec AND eg.ano_eje = m.ano_eje
        WHERE eg.sec_ejec = @sec_ejec AND eg.ano_eje = @year 
        GROUP BY m.ppto, m.sec_func
      ) y
      UNION ALL
      SELECT 'programa_accion_inversion' as type, COUNT(*) as cnt FROM [expedientes_gastos_2026] eg
      INNER JOIN [meta] m ON eg.SEC_FUNC = m.sec_func AND eg.sec_ejec = m.sec_ejec AND eg.ano_eje = m.ano_eje
      WHERE eg.FASE = 'D' AND eg.sec_ejec = @sec_ejec AND eg.ano_eje = @year AND (m.componente LIKE '4%' OR m.componente LIKE '5%')
    `, { sec_ejec: SEC_EJEC, year });

    if (resSql) {
      sqlSuccess = true;
      resSql.forEach((r: Record<string, unknown>) => {
        const typeKey = String(r.type);
        counts[typeKey] = Number(r.cnt);
      });
      // Set aliases
      counts.meta_certificados = counts.data_certificados;
      counts.meta_devengados = counts.data_devengados;
      counts.programa_devengados = counts.data_devengados;
    }

    if (!sqlSuccess) {
      // JSON Fallback
      const meta = loadTable('meta');
      const ejecGasto = loadTable('presupuesto_ejecucion_gasto');
      const activObra = loadTable('activ_obra_accinv');
      const producto = loadTable('producto_proyecto');
      const programa = loadTable('programa_pptal');
      const certificado = loadTable('certificado');
      const expedientes = loadTable('expedientes_gastos_2026');

      const metaFiltered = meta.filter(m => str(m['ANO_EJE']) === year && str(m['SEC_EJEC']) === SEC_EJEC);
      const metaMap = new Map<string, Record<string, unknown>>();
      metaFiltered.forEach(m => metaMap.set(str(m['SEC_FUNC']), m));

      const ejecFiltered = ejecGasto.filter(eg => str(eg['ANO_EJE'] ?? eg['ANO_PROC']) === year && str(eg['SEC_EJEC']) === SEC_EJEC);

      counts.ejecucion_metas = new Set(metaFiltered.map(m => str(m['SEC_FUNC'])).filter(Boolean)).size;

      // unique certifs
      const uniqueCertKeys = new Set<string>();
      certificado.filter(c => str(c['ANO_EJE']) === year && str(c['SEC_EJEC']) === SEC_EJEC)
        .forEach(c => {
          const metaCode = str(c['SEC_FUNC']);
          uniqueCertKeys.add(`${str(c['CERTIF'])}-${metaCode}-${str(c['RUBRO'])}-${str(c['CLASIF'])}`);
        });
      counts.certificado = uniqueCertKeys.size;
      counts.data_certificados = certificado.filter(c => str(c['ANO_EJE']) === year && str(c['SEC_EJEC']) === SEC_EJEC).length;
      counts.meta_certificados = counts.data_certificados;

      const devengadosList = expedientes.filter(eg => str(eg['FASE']) === 'D' && str(eg['ANO_EJE']) === year && str(eg['SEC_EJEC']) === SEC_EJEC);
      counts.data_devengados = devengadosList.length;
      counts.meta_devengados = counts.data_devengados;
      counts.programa_devengados = counts.data_devengados;

      counts.data_girados = expedientes.filter(eg => str(eg['FASE']) === 'G' && str(eg['ANO_EJE']) === year && str(eg['SEC_EJEC']) === SEC_EJEC).length;

      // ejecucion_activ_obra_accinv
      const actObraCodes = new Set(activObra.filter(ao => str(ao['ANO_EJE']) === year && str(ao['SEC_EJEC']) === SEC_EJEC).map(ao => str(ao['ACTOBRACIN'])));
      const actObraSet = new Set<string>();
      ejecFiltered.forEach(eg => {
        const m = metaMap.get(str(eg['SEC_FUNC']));
        if (m) {
          const comp = str(m['COMPONENTE']);
          if (actObraCodes.has(comp)) {
            actObraSet.add(comp);
          }
        }
      });
      counts.ejecucion_activ_obra_accinv = actObraSet.size;

      // ejecucion_actproy
      const prodCodes = new Set(producto.filter(p => str(p['ANO_EJE']) === year && str(p['SEC_EJEC']) === SEC_EJEC).map(p => str(p['ACT_PROY'])));
      const actProySet = new Set<string>();
      ejecFiltered.forEach(eg => {
        const m = metaMap.get(str(eg['SEC_FUNC']));
        if (m && prodCodes.has(str(m['ACT_PROY']))) {
          actProySet.add(str(m['ACT_PROY']));
        }
      });
      counts.ejecucion_actproy = actProySet.size;

      // ejecucion_ppto
      const progCodes = new Set(programa.filter(p => str(p['ANO_EJE']) === year).map(p => str(p['PROGPPTO'])));
      const progSet = new Set<string>();
      ejecFiltered.forEach(eg => {
        const m = metaMap.get(str(eg['SEC_FUNC']));
        if (m) {
          const progCode = str(m['PPTO'] ?? m['ppto']);
          if (progCodes.has(progCode)) {
            progSet.add(progCode);
          }
        }
      });
      counts.ejecucion_ppto = progSet.size;

      counts.ejecucion_metas_clasificador = ejecFiltered.length;

      // ejecucion_ppto_meta
      const pptoMetaSet = new Set<string>();
      ejecFiltered.forEach(eg => {
        const m = metaMap.get(str(eg['SEC_FUNC']));
        if (m) {
          pptoMetaSet.add(`${str(m['PPTO'] ?? m['ppto'])}-${str(m['SEC_FUNC'])}`);
        }
      });
      counts.ejecucion_ppto_meta = pptoMetaSet.size;

      counts.programa_accion_inversion = devengadosList.filter(eg => {
        const m = metaMap.get(str(eg['SEC_FUNC']));
        if (!m) return false;
        const comp = str(m['COMPONENTE']);
        return comp.startsWith('4') || comp.startsWith('5');
      }).length;
    }

    return NextResponse.json({ success: true, year, counts });
  } catch (err) {
    console.error('Error fetching report counts:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
