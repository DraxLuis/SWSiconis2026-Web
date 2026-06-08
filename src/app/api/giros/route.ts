import { NextResponse } from 'next/server';
import { trySQL, str, num } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterAno = searchParams.get('ano') || '';
    const filterMes = searchParams.get('mes') || '';
    const filterTipoOp = searchParams.get('tipo_op') || '';
    const filterRubro = searchParams.get('rubro') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // Build dynamic query for Cheques Girados
    let query = `
      SELECT eg.ANO_EJE, eg.MES_EJE, eg.TIPO_OP, eg.EXPEDIENTE, eg.SEC_REG, eg.CORR, eg.RB, eg.TR,
             eg.ANO_BANCO, eg.BANCO, eg.CTA_CTE, eg.COD_DOC_B, eg.NUM_DOC_B, eg.FEC_DOC_B,
             eg.MONTO, eg.SEC_EST,
             COALESCE(
               NULLIF(np.BENEFICI, ''),
               CASE WHEN eg.PROVEEDOR = '0' THEN 'DIRECCION GENERAL DEL TESORO PUBLICO' ELSE p.nombre END,
               ''
             ) as BENEFICIARIO,
             eg.PROVEEDOR as RUC
      FROM [expedientes_gastos_2026] eg
      LEFT JOIN [nota_pago] np ON eg.EXPEDIENTE = np.EXPEDIENTE AND eg.NUM_DOC = np.NUM_DOC
      LEFT JOIN [proveedor] p ON eg.PROVEEDOR = p.ruc
      WHERE eg.FASE = 'G' AND eg.SEC_EJEC = '301548' AND eg.COD_DOC IN ('243', '099')
    `;

    const params: Record<string, unknown> = {};

    if (filterAno) {
      query += ` AND eg.ANO_EJE = @ano`;
      params.ano = filterAno;
    }
    if (filterMes) {
      query += ` AND eg.MES_EJE = @mes`;
      params.mes = filterMes;
    }
    if (filterTipoOp) {
      query += ` AND eg.TIPO_OP = @tipoOp`;
      params.tipoOp = filterTipoOp;
    }
    if (filterRubro) {
      query += ` AND eg.RB = @rubro`;
      params.rubro = filterRubro;
    }
    if (search) {
      query += ` AND (eg.EXPEDIENTE LIKE @search OR eg.NUM_DOC_B LIKE @search OR eg.PROVEEDOR LIKE @search OR np.BENEFICI LIKE @search OR p.nombre LIKE @search)`;
      params.search = `%${search}%`;
    }

    query += ` ORDER BY eg.ANO_EJE ASC, eg.MES_EJE ASC, eg.EXPEDIENTE ASC, eg.SEC_REG ASC, eg.CORR ASC`;

    const allRows = await trySQL(query, params);
    if (!allRows) {
      throw new Error('Database query returned null.');
    }

    const total = allRows.length;
    const totalMonto = allRows.reduce((sum, r) => sum + num(r.MONTO), 0);

    // Pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedRows = allRows.slice(startIndex, startIndex + pageSize).map((r, idx) => {
      // Build CtaCte string ANO_BANCO-BANCO-CTA_CTE if bank info exists
      const ctaParts = [str(r.ANO_BANCO), str(r.BANCO), str(r.CTA_CTE)].filter(Boolean);
      const ctaCte = ctaParts.length > 0 ? ctaParts.join('-') : '';

      return {
        index: startIndex + idx + 1,
        ano_eje: str(r.ANO_EJE),
        mes_eje: str(r.MES_EJE),
        tipo_op: str(r.TIPO_OP),
        expediente: str(r.EXPEDIENTE),
        sec_reg: str(r.SEC_REG),
        corr: str(r.CORR),
        rb: str(r.RB),
        tr: str(r.TR),
        ctacte: ctaCte,
        cod_doc: str(r.COD_DOC_B),
        num_doc: str(r.NUM_DOC_B),
        fecha_doc: str(r.FEC_DOC_B),
        beneficiario: str(r.BENEFICIARIO),
        monto: num(r.MONTO),
        estado: str(r.SEC_EST),
        ruc: str(r.RUC)
      };
    });

    // Fetch filters catalogs
    const rubros = await trySQL(
      `SELECT DISTINCT FUENTE_FIN as codigo, NOMBRE as nombre 
       FROM [rubro] 
       WHERE SEC_EJEC = '301548'
       ORDER BY FUENTE_FIN`
    ) || [];

    const tiposOperacion = await trySQL(
      `SELECT DISTINCT TIPO_OP 
       FROM [expedientes_gastos_2026] 
       WHERE FASE = 'G' AND SEC_EJEC = '301548' AND TIPO_OP IS NOT NULL AND TIPO_OP != ''
       ORDER BY TIPO_OP`
    ) || [];

    const meses = await trySQL(
      `SELECT DISTINCT MES_EJE 
       FROM [expedientes_gastos_2026] 
       WHERE FASE = 'G' AND SEC_EJEC = '301548' AND MES_EJE IS NOT NULL AND MES_EJE != ''
       ORDER BY MES_EJE`
    ) || [];

    const anos = await trySQL(
      `SELECT DISTINCT ANO_EJE 
       FROM [expedientes_gastos_2026] 
       WHERE FASE = 'G' AND SEC_EJEC = '301548' AND ANO_EJE IS NOT NULL AND ANO_EJE != ''
       ORDER BY ANO_EJE`
    ) || [];

    return NextResponse.json({
      success: true,
      rows: paginatedRows,
      total,
      totalMonto,
      rubros: rubros.map(r => ({ codigo: str(r.codigo), nombre: str(r.nombre) })),
      tiposOperacion: tiposOperacion.map(t => str(t.TIPO_OP)),
      meses: meses.map(m => str(m.MES_EJE)),
      anos: anos.map(a => str(a.ANO_EJE)),
      page,
      pageSize
    });
  } catch (error) {
    console.error('Error in /api/giros:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
