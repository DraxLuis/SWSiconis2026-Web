import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // gasto_1, gasto_2, gasto_3, ingreso_1, ingreso_2, ingreso_3, certificados, multianual
    const rubro = searchParams.get('rubro');
    const meta = searchParams.get('meta');
    const anio = searchParams.get('anio');

    if (!type) {
      return NextResponse.json({
        success: false,
        error: 'El parámetro "type" es obligatorio.',
      }, { status: 400 });
    }

    let whereClauseGasto = 'WHERE 1=1';
    let whereClauseIngreso = 'WHERE 1=1';
    let whereClauseCertificado = 'WHERE 1=1';
    const params: Record<string, unknown> = {};

    if (rubro) {
      whereClauseGasto += ' AND eg.rubro = @rubro';
      whereClauseIngreso += ' AND ei.rubro = @rubro';
      whereClauseCertificado += ' AND JSON_VALUE(datos, \'$.RUBRO\') = @rubro';
      params.rubro = rubro;
    }

    if (meta) {
      whereClauseGasto += ' AND eg.sec_func = @meta';
      whereClauseCertificado += ' AND JSON_VALUE(datos, \'$.SEC_FUNC\') = @meta';
      params.meta = meta;
    }

    if (anio) {
      whereClauseGasto += ' AND eg.ano_eje = @anio';
      whereClauseIngreso += ' AND ei.ano_eje = @anio';
      whereClauseCertificado += ' AND ano_eje = @anio';
      params.anio = anio;
    }

    let sql = '';
    
    switch (type) {
      case 'gasto_1':
        // Gastos Nivel 1 (Meta, Rubro, Genérica/Clasificador 1)
        sql = `
          SELECT 
            eg.sec_func AS meta,
            eg.rubro,
            rf.nombre AS rubro_nombre,
            LEFT(eg.clasificador, 3) AS clasificador,
            c.nombre AS clasificador_nombre,
            SUM(eg.mto_pia) AS pia,
            SUM(eg.mto_pim) AS pim,
            SUM(eg.mto_certif) AS certificado,
            SUM(eg.mto_cpanua) AS comprometido,
            SUM(eg.mto_dev_01+eg.mto_dev_02+eg.mto_dev_03+eg.mto_dev_04+eg.mto_dev_05+eg.mto_dev_06+eg.mto_dev_07+eg.mto_dev_08+eg.mto_dev_09+eg.mto_dev_10+eg.mto_dev_11+eg.mto_dev_12) AS devengado,
            SUM(eg.mto_gir_01+eg.mto_gir_02+eg.mto_gir_03+eg.mto_gir_04+eg.mto_gir_05+eg.mto_gir_06+eg.mto_gir_07+eg.mto_gir_08+eg.mto_gir_09+eg.mto_gir_10+eg.mto_gir_11+eg.mto_gir_12) AS girado
          FROM ejecucion_gasto eg
          LEFT JOIN rubro rf ON eg.rubro = rf.fuente_fin AND eg.ano_eje = rf.ano_eje
          LEFT JOIN clasificador c ON LEFT(eg.clasificador, 3) = c.codigo AND eg.ano_eje = c.ano_eje
          ${whereClauseGasto}
          GROUP BY eg.sec_func, eg.rubro, rf.nombre, LEFT(eg.clasificador, 3), c.nombre
          ORDER BY eg.sec_func, eg.rubro, LEFT(eg.clasificador, 3)
        `;
        break;

      case 'gasto_2':
        // Gastos Nivel 2 (Meta, Rubro, Subgenérica/Clasificador 2)
        sql = `
          SELECT 
            eg.sec_func AS meta,
            eg.rubro,
            rf.nombre AS rubro_nombre,
            LEFT(eg.clasificador, 5) AS clasificador,
            c.nombre AS clasificador_nombre,
            SUM(eg.mto_pia) AS pia,
            SUM(eg.mto_pim) AS pim,
            SUM(eg.mto_certif) AS certificado,
            SUM(eg.mto_cpanua) AS comprometido,
            SUM(eg.mto_dev_01+eg.mto_dev_02+eg.mto_dev_03+eg.mto_dev_04+eg.mto_dev_05+eg.mto_dev_06+eg.mto_dev_07+eg.mto_dev_08+eg.mto_dev_09+eg.mto_dev_10+eg.mto_dev_11+eg.mto_dev_12) AS devengado,
            SUM(eg.mto_gir_01+eg.mto_gir_02+eg.mto_gir_03+eg.mto_gir_04+eg.mto_gir_05+eg.mto_gir_06+eg.mto_gir_07+eg.mto_gir_08+eg.mto_gir_09+eg.mto_gir_10+eg.mto_gir_11+eg.mto_gir_12) AS girado
          FROM ejecucion_gasto eg
          LEFT JOIN rubro rf ON eg.rubro = rf.fuente_fin AND eg.ano_eje = rf.ano_eje
          LEFT JOIN clasificador c ON LEFT(eg.clasificador, 5) = c.codigo AND eg.ano_eje = c.ano_eje
          ${whereClauseGasto}
          GROUP BY eg.sec_func, eg.rubro, rf.nombre, LEFT(eg.clasificador, 5), c.nombre
          ORDER BY eg.sec_func, eg.rubro, LEFT(eg.clasificador, 5)
        `;
        break;

      case 'gasto_3':
        // Gastos Nivel 3 (Meta, Rubro, Clasificador Detallado)
        sql = `
          SELECT 
            eg.sec_func AS meta,
            eg.rubro,
            rf.nombre AS rubro_nombre,
            eg.clasificador,
            c.nombre AS clasificador_nombre,
            SUM(eg.mto_pia) AS pia,
            SUM(eg.mto_pim) AS pim,
            SUM(eg.mto_certif) AS certificado,
            SUM(eg.mto_cpanua) AS comprometido,
            SUM(eg.mto_dev_01+eg.mto_dev_02+eg.mto_dev_03+eg.mto_dev_04+eg.mto_dev_05+eg.mto_dev_06+eg.mto_dev_07+eg.mto_dev_08+eg.mto_dev_09+eg.mto_dev_10+eg.mto_dev_11+eg.mto_dev_12) AS devengado,
            SUM(eg.mto_gir_01+eg.mto_gir_02+eg.mto_gir_03+eg.mto_gir_04+eg.mto_gir_05+eg.mto_gir_06+eg.mto_gir_07+eg.mto_gir_08+eg.mto_gir_09+eg.mto_gir_10+eg.mto_gir_11+eg.mto_gir_12) AS girado
          FROM ejecucion_gasto eg
          LEFT JOIN rubro rf ON eg.rubro = rf.fuente_fin AND eg.ano_eje = rf.ano_eje
          LEFT JOIN clasificador c ON eg.clasificador = c.codigo AND eg.ano_eje = c.ano_eje
          ${whereClauseGasto}
          GROUP BY eg.sec_func, eg.rubro, rf.nombre, eg.clasificador, c.nombre
          ORDER BY eg.sec_func, eg.rubro, eg.clasificador
        `;
        break;

      case 'ingreso_1':
        // Ingresos Nivel 1 (Rubro, Genérica/Clasificador 1)
        sql = `
          SELECT 
            ei.rubro,
            rf.nombre AS rubro_nombre,
            LEFT(ei.clasificador, 3) AS clasificador,
            c.nombre AS clasificador_nombre,
            SUM(ei.mto_pia) AS pia,
            SUM(ei.mto_pim) AS pim,
            SUM(ei.recaud_01+ei.recaud_02+ei.recaud_03+ei.recaud_04+ei.recaud_05+ei.recaud_06+ei.recaud_07+ei.recaud_08+ei.recaud_09+ei.recaud_10+ei.recaud_11+ei.recaud_12) AS recaudado
          FROM ejecucion_ingreso ei
          LEFT JOIN rubro rf ON ei.rubro = rf.fuente_fin AND ei.ano_eje = rf.ano_eje
          LEFT JOIN clasificador c ON LEFT(ei.clasificador, 3) = c.codigo AND ei.ano_eje = c.ano_eje
          ${whereClauseIngreso}
          GROUP BY ei.rubro, rf.nombre, LEFT(ei.clasificador, 3), c.nombre
          ORDER BY ei.rubro, LEFT(ei.clasificador, 3)
        `;
        break;

      case 'ingreso_2':
        // Ingresos Nivel 2 (Rubro, Subgenérica/Clasificador 2)
        sql = `
          SELECT 
            ei.rubro,
            rf.nombre AS rubro_nombre,
            LEFT(ei.clasificador, 5) AS clasificador,
            c.nombre AS clasificador_nombre,
            SUM(ei.mto_pia) AS pia,
            SUM(ei.mto_pim) AS pim,
            SUM(ei.recaud_01+ei.recaud_02+ei.recaud_03+ei.recaud_04+ei.recaud_05+ei.recaud_06+ei.recaud_07+ei.recaud_08+ei.recaud_09+ei.recaud_10+ei.recaud_11+ei.recaud_12) AS recaudado
          FROM ejecucion_ingreso ei
          LEFT JOIN rubro rf ON ei.rubro = rf.fuente_fin AND ei.ano_eje = rf.ano_eje
          LEFT JOIN clasificador c ON LEFT(ei.clasificador, 5) = c.codigo AND ei.ano_eje = c.ano_eje
          ${whereClauseIngreso}
          GROUP BY ei.rubro, rf.nombre, LEFT(ei.clasificador, 5), c.nombre
          ORDER BY ei.rubro, LEFT(ei.clasificador, 5)
        `;
        break;

      case 'ingreso_3':
        // Ingresos Nivel 3 (Rubro, Clasificador Detallado)
        sql = `
          SELECT 
            ei.rubro,
            rf.nombre AS rubro_nombre,
            ei.clasificador,
            c.nombre AS clasificador_nombre,
            SUM(ei.mto_pia) AS pia,
            SUM(ei.mto_pim) AS pim,
            SUM(ei.recaud_01+ei.recaud_02+ei.recaud_03+ei.recaud_04+ei.recaud_05+ei.recaud_06+ei.recaud_07+ei.recaud_08+ei.recaud_09+ei.recaud_10+ei.recaud_11+ei.recaud_12) AS recaudado
          FROM ejecucion_ingreso ei
          LEFT JOIN rubro rf ON ei.rubro = rf.fuente_fin AND ei.ano_eje = rf.ano_eje
          LEFT JOIN clasificador c ON ei.clasificador = c.codigo AND ei.ano_eje = c.ano_eje
          ${whereClauseIngreso}
          GROUP BY ei.rubro, rf.nombre, ei.clasificador, c.nombre
          ORDER BY ei.rubro, ei.clasificador
        `;
        break;

      case 'certificados':
        // Reporte de Certificaciones
        sql = `
          SELECT 
            id,
            ano_eje,
            sec_ejec,
            JSON_VALUE(datos, '$.CERTIF') AS nro_certificado,
            JSON_VALUE(datos, '$.SECUENCIA') AS secuencia,
            JSON_VALUE(datos, '$.RUBRO') AS rubro,
            JSON_VALUE(datos, '$.NUM_DOC') AS num_doc,
            JSON_VALUE(datos, '$.FECHA_DOC') AS fecha_doc,
            JSON_VALUE(datos, '$.PROVEEDOR') AS ruc_proveedor,
            JSON_VALUE(datos, '$.CLASIF') AS clasificador,
            JSON_VALUE(datos, '$.SEC_FUNC') AS meta,
            JSON_VALUE(datos, '$.ETAPA') AS etapa,
            JSON_VALUE(datos, '$.EST_REG') AS estado,
            CAST(JSON_VALUE(datos, '$.MONTO') AS DECIMAL(18,2)) AS monto
          FROM certificado
          ${whereClauseCertificado}
          ORDER BY nro_certificado DESC, secuencia ASC
        `;
        break;

      case 'multianual':
        // Comparativo Multianual de Ejecución
        sql = `
          SELECT 
            eg.ano_eje AS anio,
            eg.rubro,
            rf.nombre AS rubro_nombre,
            SUM(eg.mto_pia) AS pia,
            SUM(eg.mto_pim) AS pim,
            SUM(eg.mto_certif) AS certificado,
            SUM(eg.mto_cpanua) AS comprometido,
            SUM(eg.mto_dev_01+eg.mto_dev_02+eg.mto_dev_03+eg.mto_dev_04+eg.mto_dev_05+eg.mto_dev_06+eg.mto_dev_07+eg.mto_dev_08+eg.mto_dev_09+eg.mto_dev_10+eg.mto_dev_11+eg.mto_dev_12) AS devengado,
            SUM(eg.mto_gir_01+eg.mto_gir_02+eg.mto_gir_03+eg.mto_gir_04+eg.mto_gir_05+eg.mto_gir_06+eg.mto_gir_07+eg.mto_gir_08+eg.mto_gir_09+eg.mto_gir_10+eg.mto_gir_11+eg.mto_gir_12) AS girado
          FROM ejecucion_gasto eg
          LEFT JOIN rubro rf ON eg.rubro = rf.fuente_fin AND eg.ano_eje = rf.ano_eje
          GROUP BY eg.ano_eje, eg.rubro, rf.nombre
          ORDER BY eg.ano_eje DESC, eg.rubro ASC
        `;
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `El tipo de reporte "${type}" no es válido.`,
        }, { status: 400 });
    }

    const result = await query(sql, params);
    
    // Process rubros and metas lists to populate filters dynamically
    const rubrosResult = await query('SELECT codigo, nombre FROM fuente_financ ORDER BY codigo');
    const metasResult = await query('SELECT DISTINCT sec_func as codigo FROM ejecutora ORDER BY sec_func');

    return NextResponse.json({
      success: true,
      rows: result.recordset,
      rubros: rubrosResult.recordset,
      metas: metasResult.recordset.map(r => r.codigo),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
