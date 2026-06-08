import { NextResponse } from 'next/server';
import { loadTable, preloadTables, str, AÑO } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await preloadTables(['rubro']);
    const rubros = loadTable('rubro');
    const filtered = rubros
      .filter(r => str(r['ANO_EJE']) === AÑO)
      .map(r => ({
        fuente_fin: str(r['FUENTE_FIN']),
        nombre: str(r['NOMBRE'])
      }))
      .sort((a, b) => a.fuente_fin.localeCompare(b.fuente_fin));

    return NextResponse.json({ success: true, rubros: filtered });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
