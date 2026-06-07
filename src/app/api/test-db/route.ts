import { NextResponse } from 'next/server';
import { loadTable } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const gastos = loadTable('presupuesto_ejecucion_gasto');
    return NextResponse.json({
      success: true,
      message: `Datos JSON cargados correctamente. ${gastos.length} registros en presupuesto_ejecucion_gasto.`,
      totalTablas: 38,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
