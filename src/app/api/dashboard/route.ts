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
      whereClause += ' AND rubro = @rubro';
      params.rubro = rubro;
    }
    if (clasificador) {
      whereClause += ' AND clasificador LIKE @clasificador + \'%\'';
      params.clasificador = clasificador;
    }

    // Query for cards
    const cardsQuery = `
      SELECT 
        SUM(mto_pia) AS total_pia,
        SUM(mto_pim) AS total_pim,
        SUM(mto_certif) AS total_certif,
        SUM(mto_cpanua) AS total_comprometido,
        SUM(
          mto_dev_01 + mto_dev_02 + mto_dev_03 + mto_dev_04 + 
          mto_dev_05 + mto_dev_06 + mto_dev_07 + mto_dev_08 + 
          mto_dev_09 + mto_dev_10 + mto_dev_11 + mto_dev_12
        ) AS total_devengado,
        SUM(
          mto_gir_01 + mto_gir_02 + mto_gir_03 + mto_gir_04 + 
          mto_gir_05 + mto_gir_06 + mto_gir_07 + mto_gir_08 + 
          mto_gir_09 + mto_gir_10 + mto_gir_11 + mto_gir_12
        ) AS total_girado
      FROM ejecucion_gasto
      ${whereClause}
    `;

    // Query for monthly devengados
    const monthlyQuery = `
      SELECT 
        SUM(mto_dev_01) AS dev_01,
        SUM(mto_dev_02) AS dev_02,
        SUM(mto_dev_03) AS dev_03,
        SUM(mto_dev_04) AS dev_04,
        SUM(mto_dev_05) AS dev_05,
        SUM(mto_dev_06) AS dev_06,
        SUM(mto_dev_07) AS dev_07,
        SUM(mto_dev_08) AS dev_08,
        SUM(mto_dev_09) AS dev_09,
        SUM(mto_dev_10) AS dev_10,
        SUM(mto_dev_11) AS dev_11,
        SUM(mto_dev_12) AS dev_12,
        SUM(mto_gir_01) AS gir_01,
        SUM(mto_gir_02) AS gir_02,
        SUM(mto_gir_03) AS gir_03,
        SUM(mto_gir_04) AS gir_04,
        SUM(mto_gir_05) AS gir_05,
        SUM(mto_gir_06) AS gir_06,
        SUM(mto_gir_07) AS gir_07,
        SUM(mto_gir_08) AS gir_08,
        SUM(mto_gir_09) AS gir_09,
        SUM(mto_gir_10) AS gir_10,
        SUM(mto_gir_11) AS gir_11,
        SUM(mto_gir_12) AS gir_12
      FROM ejecucion_gasto
      ${whereClause}
    `;

    const cardsResult = await query(cardsQuery, params);
    const monthlyResult = await query(monthlyQuery, params);

    const cards = cardsResult.recordset[0] || {
      total_pia: 0,
      total_pim: 0,
      total_certif: 0,
      total_comprometido: 0,
      total_devengado: 0,
      total_girado: 0,
    };

    const monthlyData = monthlyResult.recordset[0] || {};
    const months = [
      { name: 'Ene', devengado: monthlyData.dev_01 || 0, girado: monthlyData.gir_01 || 0 },
      { name: 'Feb', devengado: monthlyData.dev_02 || 0, girado: monthlyData.gir_02 || 0 },
      { name: 'Mar', devengado: monthlyData.dev_03 || 0, girado: monthlyData.gir_03 || 0 },
      { name: 'Abr', devengado: monthlyData.dev_04 || 0, girado: monthlyData.gir_04 || 0 },
      { name: 'May', devengado: monthlyData.dev_05 || 0, girado: monthlyData.gir_05 || 0 },
      { name: 'Jun', devengado: monthlyData.dev_06 || 0, girado: monthlyData.gir_06 || 0 },
      { name: 'Jul', devengado: monthlyData.dev_07 || 0, girado: monthlyData.gir_07 || 0 },
      { name: 'Ago', devengado: monthlyData.dev_08 || 0, girado: monthlyData.gir_08 || 0 },
      { name: 'Set', devengado: monthlyData.dev_09 || 0, girado: monthlyData.gir_09 || 0 },
      { name: 'Oct', devengado: monthlyData.dev_10 || 0, girado: monthlyData.gir_10 || 0 },
      { name: 'Nov', devengado: monthlyData.dev_11 || 0, girado: monthlyData.gir_11 || 0 },
      { name: 'Dic', devengado: monthlyData.dev_12 || 0, girado: monthlyData.gir_12 || 0 },
    ];

    // Fetch filters options
    const rubrosResult = await query('SELECT codigo, nombre FROM fuente_financ ORDER BY codigo');
    const rubros = rubrosResult.recordset;

    return NextResponse.json({
      success: true,
      cards,
      months,
      rubros,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
