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
      whereClause += ' AND ei.rubro = @rubro';
      params.rubro = rubro;
    }
    if (clasificador) {
      whereClause += ' AND ei.clasificador LIKE @clasificador + \'%\'';
      params.clasificador = clasificador;
    }

    const sql = `
      SELECT 
        ei.rubro,
        rf.nombre AS rubro_nombre,
        ei.clasificador,
        c.nombre AS clasificador_nombre,
        SUM(ei.mto_pia) AS pia,
        SUM(ei.mto_pim) AS pim,
        SUM(ei.recaud_01) AS recaud_01, SUM(ei.recaud_02) AS recaud_02, SUM(ei.recaud_03) AS recaud_03, SUM(ei.recaud_04) AS recaud_04,
        SUM(ei.recaud_05) AS recaud_05, SUM(ei.recaud_06) AS recaud_06, SUM(ei.recaud_07) AS recaud_07, SUM(ei.recaud_08) AS recaud_08,
        SUM(ei.recaud_09) AS recaud_09, SUM(ei.recaud_10) AS recaud_10, SUM(ei.recaud_11) AS recaud_11, SUM(ei.recaud_12) AS recaud_12
      FROM ejecucion_ingreso ei
      LEFT JOIN rubro rf ON ei.rubro = rf.fuente_fin AND ei.ano_eje = rf.ano_eje
      LEFT JOIN clasificador c ON ei.clasificador = c.codigo AND ei.ano_eje = c.ano_eje
      ${whereClause}
      GROUP BY ei.rubro, rf.nombre, ei.clasificador, c.nombre
      ORDER BY ei.rubro, ei.clasificador
    `;

    const result = await query(sql, params);
    
    // Process monthly collections and calculate total recaudado
    const rows = result.recordset.map(row => {
      const recaudado_total = 
        (row.recaud_01 || 0) + (row.recaud_02 || 0) + (row.recaud_03 || 0) + (row.recaud_04 || 0) + 
        (row.recaud_05 || 0) + (row.recaud_06 || 0) + (row.recaud_07 || 0) + (row.recaud_08 || 0) + 
        (row.recaud_09 || 0) + (row.recaud_10 || 0) + (row.recaud_11 || 0) + (row.recaud_12 || 0);

      return {
        ...row,
        recaudado_total,
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
