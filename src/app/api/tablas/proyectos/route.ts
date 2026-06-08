import { NextResponse } from 'next/server';
import { loadTable, preloadTables, str, AÑO, SEC_EJEC } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await preloadTables(['producto_proyecto', 'activ_obra_accinv']);
    const producto = loadTable('producto_proyecto');
    const actObra = loadTable('activ_obra_accinv');

    const list: { codigo: string; nombre: string; tipo: string }[] = [];

    producto
      .filter(p => str(p['ANO_EJE']) === AÑO && str(p['SEC_EJEC']) === SEC_EJEC)
      .forEach(p => {
        list.push({
          codigo: str(p['ACT_PROY']),
          nombre: str(p['NOMBRE']),
          tipo: str(p['ACT_PROY']).startsWith('2') ? 'Proyecto' : 'Actividad'
        });
      });

    actObra
      .filter(a => str(a['ANO_EJE']) === AÑO && str(a['SEC_EJEC']) === SEC_EJEC)
      .forEach(a => {
        list.push({
          codigo: str(a['ACTOBRACIN']),
          nombre: str(a['NOMBRE']),
          tipo: 'Obra/Acción de Inversión'
        });
      });

    // Deduplicate and sort
    const seen = new Set<string>();
    const filtered = list
      .filter(item => {
        if (seen.has(item.codigo)) return false;
        seen.add(item.codigo);
        return true;
      })
      .sort((a, b) => a.codigo.localeCompare(b.codigo));

    return NextResponse.json({ success: true, proyectos: filtered });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
