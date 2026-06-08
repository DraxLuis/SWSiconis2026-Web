import { NextResponse } from 'next/server';
import { loadTable, preloadTables, str, num, AÑO, SEC_EJEC } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await preloadTables(['meta', 'finalidad']);
    const metas = loadTable('meta');
    const finalidades = loadTable('finalidad');

    const finalidadMap = new Map<string, string>();
    finalidades.forEach(f => {
      finalidadMap.set(str(f['FINALIDAD']), str(f['NOMBRE']));
    });

    const filtered = metas
      .filter(m => str(m['ANO_EJE']) === AÑO && str(m['SEC_EJEC']) === SEC_EJEC)
      .map(m => {
        const finCode = str(m['FINALIDAD']);
        return {
          sec_func: str(m['SEC_FUNC']),
          programa: str(m['PROGRAMA']),
          act_proy: str(m['ACT_PROY']),
          componente: str(m['COMPONENTE'] ?? m['COMPONENT'] ?? ''),
          funcion: str(m['FUNCION']),
          subprograma: str(m['SUBPROGRAMA']),
          meta: str(m['META']),
          finalidad: finCode,
          nombre: str(m['NOMBRE']),
          finalidad_nombre: finalidadMap.get(finCode) ?? finCode,
          unidmed: str(m['UNIDMED']),
          cantidad: num(m['CANTIDAD'])
        };
      })
      .sort((a, b) => a.sec_func.localeCompare(b.sec_func));

    return NextResponse.json({ success: true, metas: filtered });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
