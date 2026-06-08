import { NextResponse } from 'next/server';
import { loadTable, preloadTables, str, AÑO, SEC_EJEC } from '@/lib/db';

export const dynamic = 'force-dynamic';

const PRODUCT_NAMES_FALLBACK: Record<string, string> = {
  '3000669': 'PERSONAS AFECTADAS CON TUBERCULOSIS RECIBEN APOYO NUTRICIONAL',
  '3000355': 'PERSONAS QUE RECIBEN SERVICIO DE PATRULLAJE MUNICIPAL POR SECTOR',
  '3000356': 'COMUNIDAD RECIBE ACCIONES DE PREVENCION EN EL MARCO DEL PLAN DE SEGURIDAD CIUDADANA',
  '3000848': 'MANEJO DE RESIDUOS SOLIDOS MUNICIPALES',
  '3000850': 'FISCALIZACION DE LA GESTION DE RESIDUOS SOLIDOS',
  '3000523': 'PREVENCION, CONTROL Y ERRADICACION DE ENFERMEDADES EN ANIMALES',
  '3000735': 'MANTENIMIENTO DE CAUCES, DRENAJES Y SEGURIDAD FISICA',
  '3000882': 'SISTEMAS DE SANEAMIENTO BASICO EN LA LOCALIDAD',
  '3000662': 'FORTALECIMIENTO DEL SECTOR ARTESANAL',
  '3000887': 'ATENCION A NIÑAS, NIÑOS Y ADOLESCENTES EN RIESGO',
  '3000630': 'ASISTENCIA TECNICA A PRODUCTORES AGRICOLAS Y PECUARIOS',
  '3000664': 'CONSERVACION Y PUESTA EN VALOR DE RECURSOS TURISTICOS',
  '3000384': 'RECUPERACION DE AREAS FORESTALES DEGRADADAS',
  '3000133': 'MANTENIMIENTO DE CAMINOS VECINALES',
  '3033251': 'FAMILIAS SALUDABLES CON CONOCIMIENTOS PARA EL CUIDADO INFANTIL Y ALIMENTACION',
  '3000808': 'SEGUIMIENTO Y VERIFICACION DEL CUMPLIMIENTO DE LAS OBLIGACIONES AMBIENTALES',
  '3999999': 'SIN PRODUCTO'
};

export async function GET() {
  try {
    await preloadTables(['meta', 'producto_proyecto']);
    const metas = loadTable('meta');
    const producto = loadTable('producto_proyecto');

    const list: { codigo: string; nombre: string; tipo: string }[] = [];

    // Create maps from meta to resolve names of projects and activities
    const metaProjMap = new Map<string, string>();

    metas.forEach(m => {
      const actProy = str(m['ACT_PROY']);
      const name = str(m['NOMBRE']);
      if (actProy && name) {
        metaProjMap.set(actProy, name);
      }
    });

    producto
      .filter(p => str(p['ANO_EJE']) === AÑO && str(p['SEC_EJEC']) === SEC_EJEC)
      .forEach(p => {
        const codigo = str(p['ACT_PROY']);
        let nombre = str(p['NOMBRE']);
        if (!nombre || nombre === 'null') {
          nombre = PRODUCT_NAMES_FALLBACK[codigo] || metaProjMap.get(codigo) || '';
        }
        list.push({
          codigo,
          nombre: nombre || 'Producto / Proyecto ' + codigo,
          tipo: codigo.startsWith('2') ? 'Proyecto' : 'Producto'
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

