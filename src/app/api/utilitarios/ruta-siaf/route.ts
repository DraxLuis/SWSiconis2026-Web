import { NextResponse } from 'next/server';
import { getConfig, saveConfig } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ruta = await getConfig('ruta_siaf') || 'C:\\SIAF\\DATA';
    const entidad = await getConfig('nombre_entidad') || '301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA';
    const dbMode = process.env.DB_SERVER ? 'SQL Server' : 'JSON Local';
    return NextResponse.json({ success: true, ruta, entidad, dbMode });
  } catch (error) {
    console.error('Error fetching SIAF config:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ruta } = body;

    if (ruta === undefined || ruta === null) {
      return NextResponse.json({ success: false, message: 'La ruta es requerida' }, { status: 400 });
    }

    await saveConfig('ruta_siaf', ruta.trim());
    return NextResponse.json({ success: true, message: 'Ruta DATA SIAF guardada con éxito' });
  } catch (error) {
    console.error('Error saving SIAF config:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
