import { NextResponse } from 'next/server';
import { loadTable, preloadTables, str, num, AÑO, SEC_EJEC } from '@/lib/db';

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
    // Preload all catalogs to enrich metas
    await preloadTables([
      'meta',
      'finalidad',
      'programa_pptal',
      'funcion',
      'division_fn',
      'grupo_fn',
      'departamento',
      'provincia',
      'distrito',
      'producto_proyecto',
      'activ_obra_accinv'
    ]);

        const metas = loadTable('meta');
    const finalidades = loadTable('finalidad');
    const programas = loadTable('programa_pptal');
    const funciones = loadTable('funcion');
    const divisiones = loadTable('division_fn');
    const grupos = loadTable('grupo_fn');
    const productos = loadTable('producto_proyecto');
    const actObras = loadTable('activ_obra_accinv');
    const dptos = loadTable('departamento');
    const provs = loadTable('provincia');
    const dists = loadTable('distrito');

    // Create maps for fast lookup
    const finalidadMap = new Map<string, string>();
    finalidades.forEach(f => finalidadMap.set(str(f['FINALIDAD']), str(f['NOMBRE'])));

    const progMap = new Map<string, string>();
    programas.forEach(p => progMap.set(str(p['PROGPPTO']), str(p['NOMBRE'])));

    const funcMap = new Map<string, string>();
    funciones.forEach(f => funcMap.set(str(f['FUNCION']), str(f['NOMBRE'])));

    const divMap = new Map<string, string>();
    divisiones.forEach(d => divMap.set(str(d['DIVISION_FN']), str(d['NOMBRE'])));

    const grpMap = new Map<string, string>();
    grupos.forEach(g => grpMap.set(str(g['GRUPO_FN']), str(g['NOMBRE'])));

    const prodMap = new Map<string, string>();
    productos.forEach(p => prodMap.set(str(p['ACT_PROY']), str(p['NOMBRE'])));

    const actObraMap = new Map<string, string>();
    actObras.forEach(o => actObraMap.set(str(o['ACTOBRACIN']), str(o['NOMBRE'])));

    const dptoMap = new Map<string, string>();
    dptos.forEach(d => dptoMap.set(str(d['COD']), str(d['NOMBRE'])));

    const provMap = new Map<string, string>();
    provs.forEach(p => provMap.set(`${str(p['DEPARTAMENTO'])}-${str(p['CODIGO'])}`, str(p['NOMBRE'])));

    const distMap = new Map<string, string>();
    dists.forEach(d => distMap.set(`${str(d['DEPARTAMENTO'])}-${str(d['PROVINCIA'])}-${str(d['CODIGO'])}`, str(d['NOMBRE'])));

    const filtered = metas
      .filter(m => str(m['ANO_EJE']) === AÑO && str(m['SEC_EJEC']) === SEC_EJEC)
      .map(m => {
        const ppto = str(m['PPTO']);
        const actProy = str(m['ACT_PROY']);
        const componente = str(m['COMPONENTE']);
        const funcion = str(m['FUNCION']);
        const programa = str(m['PROGRAMA']); // Division Funcional
        const subprogram = str(m['SUBPROGRAMA']); // Grupo Funcional
        const finalidad = str(m['FINALIDAD']);

        // Default Geographic codes for Huancabamba
        const codDpto = '20';
        const codProv = '03';
        const codDist = '01';

        // Resolve Product Name from SQL Server or fallback
        let producto_nombre = prodMap.get(actProy);
        if (!producto_nombre || producto_nombre === 'null') {
          producto_nombre = PRODUCT_NAMES_FALLBACK[actProy];
        }
        if (!producto_nombre && actProy.startsWith('2')) {
          const match = metas.find(x => str(x['ACT_PROY']) === actProy);
          producto_nombre = match ? str(match['NOMBRE']) : '';
        }

        // Resolve Activity Name from SQL Server or fallback
        let actividad_nombre = actObraMap.get(componente);
        if (!actividad_nombre || actividad_nombre === 'null') {
          actividad_nombre = str(m['NOMBRE']);
        }

        return {
          sec_func: str(m['SEC_FUNC']),
          meta: str(m['META']),
          nombre: str(m['NOMBRE']),
          unidmed: str(m['UNIDMED']),
          cantidad: num(m['CANTIDAD']),

          // Geográficos
          departamento_cod: codDpto,
          departamento_nombre: dptoMap.get(codDpto) ?? 'PIURA',
          provincia_cod: codProv,
          provincia_nombre: provMap.get(`${codDpto}-${codProv}`) ?? 'HUANCABAMBA',
          distrito_cod: codDist,
          distrito_nombre: distMap.get(`${codDpto}-${codProv}-${codDist}`) ?? 'HUANCABAMBA',

          // Finalidad
          finalidad_cod: finalidad,
          finalidad_nombre: finalidadMap.get(finalidad) ?? finalidad,

          // Estructura funcional
          programa_cod: ppto,
          programa_nombre: progMap.get(ppto) ?? '',

          producto_cod: actProy,
          producto_nombre: producto_nombre || '',

          actividad_cod: componente,
          actividad_nombre: actividad_nombre,

          funcion_cod: funcion,
          funcion_nombre: funcMap.get(funcion) ?? '',

          division_cod: programa,
          division_nombre: divMap.get(programa) ?? '',

          grupo_cod: subprogram,
          grupo_nombre: grpMap.get(subprogram) ?? ''
        };
      })
      .sort((a, b) => a.sec_func.localeCompare(b.sec_func));

    return NextResponse.json({ success: true, metas: filtered });
  } catch (error) {
    console.error('Error en /api/tablas/metas:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

