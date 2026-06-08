import { Router, Request, Response } from 'express';
import { query } from '../config/db';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const rubro = req.query.rubro as string | undefined;
    const expediente = req.query.expediente as string | undefined;
    const q = req.query.q as string | undefined; // Search query for beneficiary, ruc or num_doc
    const estado = req.query.estado as string | undefined;

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

    return res.json({
      success: true,
      rows: result.recordset,
      rubros: rubrosResult.recordset,
    });
  } catch (error: any) {
    console.error('Error in pagos route:', error);
    return res.status(500).json({
      success: false,
      error: error.message || String(error),
    });
  }
});

export default router;
