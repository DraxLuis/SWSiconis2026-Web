import { Router, Request, Response } from 'express';
import { query } from '../config/db';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT @@VERSION as version');
    return res.json({
      success: true,
      message: 'Conexión a SQL Server exitosa',
      version: result.recordset[0].version,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error de conexión a la base de datos',
      error: error.message || String(error),
    });
  }
});

export default router;
