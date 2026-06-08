import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rubro = searchParams.get('rubro');
    const expediente = searchParams.get('expediente');
    const q = searchParams.get('q'); // Search query for beneficiary or ruc or num_doc
    const estado = searchParams.get('estado');

    let whereClause = 'WHERE 1=1';
    const params: Record<string, unknown> = {};

    if (rubro) {
      whereClause += ' AND np.rubro = @rubro';
      params.rubro = rubro;
    }
    if (expediente) {
      whereClause += ' AND np.expediente LIKE @expediente + \'%\'';
      params.expediente = expediente;
    }
    if (estado) {
      whereClause += ' AND np.estado = @estado';
      params.estado = estado;
    }
    if (q) {
      whereClause += ' AND (np.beneficiario LIKE \'%\' + @q + \'%\' OR np.ruc LIKE \'%\' + @q + \'%\' OR np.num_doc LIKE \'%\' + @q + \'%\')';
      params.q = q;
    }

    const sql = `
      SELECT 
        np.id,
        np.ano_proc,
        np.ano_eje,
        np.sec_ejec,
        np.expediente,
        np.secuencia,
        np.num_doc,
        np.ruc,
        np.beneficiario,
        np.rubro,
        rf.nombre AS rubro_nombre,
        np.glosa,
        np.cod_doc,
        np.fecha_doc,
        np.cod_doc_b,
        np.nom_doc_b,
        np.fec_doc_b,
        np.const_pago,
        np.confor_doc,
        np.confor_des,
        np.confor_fec,
        np.monto,
        np.estado
      FROM nota_pago np
      LEFT JOIN rubro rf ON np.rubro = rf.fuente_fin AND np.ano_eje = rf.ano_eje
      ${whereClause}
      ORDER BY np.expediente DESC, np.secuencia ASC
    `;

    const result = await query(sql, params);
    const rubrosResult = await query('SELECT codigo, nombre FROM fuente_financ ORDER BY codigo');

    return NextResponse.json({
      success: true,
      rows: result.recordset,
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
