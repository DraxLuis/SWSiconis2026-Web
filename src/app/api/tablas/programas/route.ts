import { NextResponse } from 'next/server';
import { loadTable, preloadTables, str, AÑO } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await preloadTables(['programa_pptal']);
    const programas = loadTable('programa_pptal');
    const filtered = programas
      .filter(p => str(p['ANO_EJE']) === AÑO)
      .map(p => ({
        progppto: str(p['PROGPPTO']),
        nombre: str(p['NOMBRE'])
      }))
      .sort((a, b) => a.progppto.localeCompare(b.progppto));

    return NextResponse.json({ success: true, programas: filtered });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
