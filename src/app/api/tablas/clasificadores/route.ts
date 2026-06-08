import { NextResponse } from 'next/server';
import { loadTable, preloadTables, str, AÑO } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await preloadTables(['clasificador']);
    const clasificadores = loadTable('clasificador');
    
    const filtered = clasificadores
      .filter(c => str(c['ANO_EJE']) === AÑO)
      .map(c => {
        const codigo = str(c['CODIGO'] ?? c['CLASIFIC'] ?? '');
        return {
          codigo,
          nombre: str(c['NOMBRE']),
          tipo: codigo.startsWith('1') ? 'Ingreso' : 'Gasto'
        };
      })
      .filter(c => c.codigo !== '')
      .sort((a, b) => a.codigo.localeCompare(b.codigo));

    return NextResponse.json({ success: true, clasificadores: filtered });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
