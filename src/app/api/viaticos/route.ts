import { NextResponse } from 'next/server';
import { trySQL, str, num } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const expediente = searchParams.get('expediente') || '';

    if (expediente) {
      // Caso 2: Con expediente (Detalle - Grilla Derecha)
      const detailQuery = `
        SELECT SEC_REG, CORR, FASE, COD_DOC, NUM_DOC, FECHA_DOC, MONTO, SEC_EST
        FROM [expedientes_gastos_2026]
        WHERE EXPEDIENTE = @expediente AND FASE IN ('G', 'R') AND SEC_EJEC = '301548'
        ORDER BY FASE ASC, SEC_REG ASC, CORR ASC
      `;
      const rows = await trySQL(detailQuery, { expediente });
      if (!rows) {
        throw new Error('Database query for details returned null.');
      }

      const formattedRows = rows.map(r => {
        const fase = str(r.FASE);
        const secEst = str(r.SEC_EST);
        const monto = num(r.MONTO);

        let girado = 0;
        let devolucion = 0;
        let rendicion = 0;

        if (fase === 'G') {
          if (secEst === 'D') {
            devolucion = Math.abs(monto);
          } else {
            girado = monto;
          }
        } else if (fase === 'R') {
          rendicion = monto;
        }

        return {
          sec_reg: str(r.SEC_REG),
          corr: str(r.CORR),
          cod_doc: str(r.COD_DOC),
          num_doc: str(r.NUM_DOC),
          fecha_doc: str(r.FECHA_DOC),
          girado,
          devolucion,
          rendicion,
          estado: secEst
        };
      });

      return NextResponse.json({
        success: true,
        rows: formattedRows
      });
    } else {
      // Caso 1: Sin expediente (Listado Resumen - Grilla Izquierda)
      const summaryQuery = `
        SELECT 
          eg.EXPEDIENTE,
          SUM(CASE WHEN eg.FASE = 'G' AND eg.SEC_EST != 'D' THEN eg.MONTO ELSE 0 END) as GIRO,
          SUM(CASE WHEN eg.FASE = 'G' AND eg.SEC_EST = 'D' THEN ABS(eg.MONTO) ELSE 0 END) as DEVOLUCION,
          SUM(CASE WHEN eg.FASE = 'R' THEN eg.MONTO ELSE 0 END) as RENDICION
        FROM [expedientes_gastos_2026] eg
        WHERE eg.TIPO_OP IN ('A', 'AV') AND eg.SEC_EJEC = '301548'
        GROUP BY eg.EXPEDIENTE
        ORDER BY eg.EXPEDIENTE ASC
      `;
      const rows = await trySQL(summaryQuery);
      if (!rows) {
        throw new Error('Database query for summary returned null.');
      }

      const formattedRows = rows.map(r => {
        const giro = num(r.GIRO);
        const devolucion = num(r.DEVOLUCION);
        const rendicion = num(r.RENDICION);
        const saldo = giro - devolucion - rendicion;

        return {
          expediente: str(r.EXPEDIENTE),
          giro,
          devolucion,
          rendicion,
          saldo
        };
      });

      // Calculate global totals across all summary rows
      const totalGiro = formattedRows.reduce((sum, r) => sum + r.giro, 0);
      const totalDevolucion = formattedRows.reduce((sum, r) => sum + r.devolucion, 0);
      const totalRendicion = formattedRows.reduce((sum, r) => sum + r.rendicion, 0);
      const totalSaldo = totalGiro - totalDevolucion - totalRendicion;

      return NextResponse.json({
        success: true,
        rows: formattedRows,
        totals: {
          giro: totalGiro,
          devolucion: totalDevolucion,
          rendicion: totalRendicion,
          saldo: totalSaldo
        }
      });
    }
  } catch (error) {
    console.error('Error in /api/viaticos:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
