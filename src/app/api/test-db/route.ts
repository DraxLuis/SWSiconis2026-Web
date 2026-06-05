import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await query('SELECT @@VERSION as version');
    return NextResponse.json({
      success: true,
      message: 'Conexión a SQL Server exitosa',
      version: result.recordset[0].version,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      message: 'Error de conexión a la base de datos',
      error: errorMessage,
    }, { status: 500 });
  }
}
