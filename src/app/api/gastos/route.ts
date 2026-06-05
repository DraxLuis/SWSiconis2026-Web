import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rubro = searchParams.get('rubro');
    const clasificador = searchParams.get('clasificador');

    let whereClause = 'WHERE 1=1';
    const params: Record<string, unknown> = {};

    if (rubro) {
      whereClause += ' AND eg.rubro = @rubro';
      params.rubro = rubro;
    }
    if (clasificador) {
      whereClause += ' AND eg.clasificador LIKE @clasificador + \'%\'';
      params.clasificador = clasificador;
    }

    const sql = `
      SELECT 
        eg.rubro,
        rf.nombre AS rubro_nombre,
        eg.clasificador,
        c.nombre AS clasificador_nombre,
        SUM(eg.mto_pia) AS pia,
        SUM(eg.mto_pim) AS pim,
        SUM(eg.mto_certif) AS certificado,
        SUM(eg.mto_cpanua) AS comprometido,
        SUM(eg.mto_dev_01) AS dev_01, SUM(eg.mto_dev_02) AS dev_02, SUM(eg.mto_dev_03) AS dev_03, SUM(eg.mto_dev_04) AS dev_04,
        SUM(eg.mto_dev_05) AS dev_05, SUM(eg.mto_dev_06) AS dev_06, SUM(eg.mto_dev_07) AS dev_07, SUM(eg.mto_dev_08) AS dev_08,
        SUM(eg.mto_dev_09) AS dev_09, SUM(eg.mto_dev_10) AS dev_10, SUM(eg.mto_dev_11) AS dev_11, SUM(eg.mto_dev_12) AS dev_12,
        SUM(eg.mto_gir_01) AS gir_01, SUM(eg.mto_gir_02) AS gir_02, SUM(eg.mto_gir_03) AS gir_03, SUM(eg.mto_gir_04) AS gir_04,
        SUM(eg.mto_gir_05) AS gir_05, SUM(eg.mto_gir_06) AS gir_06, SUM(eg.mto_gir_07) AS gir_07, SUM(eg.mto_gir_08) AS gir_08,
        SUM(eg.mto_gir_09) AS gir_09, SUM(eg.mto_gir_10) AS gir_10, SUM(eg.mto_gir_11) AS gir_11, SUM(eg.mto_gir_12) AS gir_12
      FROM ejecucion_gasto eg
      LEFT JOIN rubro rf ON eg.rubro = rf.fuente_fin AND eg.ano_eje = rf.ano_eje
      LEFT JOIN clasificador c ON eg.clasificador = c.codigo AND eg.ano_eje = c.ano_eje
      ${whereClause}
      GROUP BY eg.rubro, rf.nombre, eg.clasificador, c.nombre
      ORDER BY eg.rubro, eg.clasificador
    `;

    const result = await query(sql, params);
    
    // Process and sum totals
    const rows = result.recordset.map(row => {
      const devengado_total = 
        (row.dev_01 || 0) + (row.dev_02 || 0) + (row.dev_03 || 0) + (row.dev_04 || 0) + 
        (row.dev_05 || 0) + (row.dev_06 || 0) + (row.dev_07 || 0) + (row.dev_08 || 0) + 
        (row.dev_09 || 0) + (row.dev_10 || 0) + (row.dev_11 || 0) + (row.dev_12 || 0);

      const girado_total = 
        (row.gir_01 || 0) + (row.gir_02 || 0) + (row.gir_03 || 0) + (row.gir_04 || 0) + 
        (row.gir_05 || 0) + (row.gir_06 || 0) + (row.gir_07 || 0) + (row.gir_08 || 0) + 
        (row.gir_09 || 0) + (row.gir_10 || 0) + (row.gir_11 || 0) + (row.gir_12 || 0);

      return {
        ...row,
        devengado_total,
        girado_total,
      };
    });

    const rubrosResult = await query('SELECT codigo, nombre FROM fuente_financ ORDER BY codigo');

    return NextResponse.json({
      success: true,
      rows,
      rubros: rubrosResult.recordset,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
