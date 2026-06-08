import { NextResponse } from 'next/server';
import { loadTable, preloadTables, num, str, AÑO, SEC_EJEC } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const codigo = searchParams.get('codigo') || '';

    if (!codigo) {
      return NextResponse.json({ success: false, error: 'Código de proyecto es requerido' }, { status: 400 });
    }

    // Preload tables
    await preloadTables([
      'meta',
      'presupuesto_ejecucion_gasto',
      'programa_pptal',
      'activ_obra_accinv',
      'funcion',
      'division_fn',
      'grupo_fn',
      'producto_proyecto',
      'clasificador'
    ]);

    const metas = loadTable('meta');
    const gastos = loadTable('presupuesto_ejecucion_gasto');
    const progNamesTable = loadTable('programa_pptal');
    const actObraTable = loadTable('activ_obra_accinv');
    const funcionTable = loadTable('funcion');
    const divisionTable = loadTable('division_fn');
    const grupoTable = loadTable('grupo_fn');
    const productoTable = loadTable('producto_proyecto');
    const clasificadorTable = loadTable('clasificador');

    // Find metas of the project
    const projectMetas = metas.filter(m => 
      str(m['ANO_EJE']) === AÑO && 
      str(m['SEC_EJEC']) === SEC_EJEC && 
      str(m['ACT_PROY']) === codigo
    );

    if (projectMetas.length === 0) {
      return NextResponse.json({ success: false, error: 'No se encontraron metas para el proyecto especificado' }, { status: 404 });
    }

    // Extract sec_func list
    const secFuncList = projectMetas.map(m => str(m['SEC_FUNC']));
    const firstMeta = projectMetas[0];

    // Read metadata codes
    const pptoCode = str(firstMeta['PPTO']);
    const componenteCode = str(firstMeta['componente']);
    const funcionCode = str(firstMeta['funcion']);
    const divisionCode = str(firstMeta['programa']); // DIVISION_FN corresponds to 'programa' column in meta
    const grupoCode = str(firstMeta['subprograma']);  // GRUPO_FN corresponds to 'subprograma' column in meta

    // Lookups
    const projectName = productoTable.find(p => str(p['ANO_EJE']) === AÑO && str(p['ACT_PROY']) === codigo)?.['NOMBRE'] || 'PROYECTO DE INVERSION';
    const programName = progNamesTable.find(p => str(p['ANO_EJE']) === AÑO && str(p['PROGPPTO']) === pptoCode)?.['NOMBRE'] || 'SIN PROGRAMA PPTAL';
    const obraName = actObraTable.find(o => str(o['ANO_EJE']) === AÑO && str(o['ACTOBRACIN']) === componenteCode)?.['NOMBRE'] || 'SIN DETALLE DE OBRA';
    const funcionName = funcionTable.find(f => str(f['ANO_EJE']) === AÑO && str(f['FUNCION']) === funcionCode)?.['NOMBRE'] || 'SIN DETALLE DE FUNCION';
    const divisionName = divisionTable.find(d => str(d['ANO_EJE']) === AÑO && str(d['DIVISION_FN']) === divisionCode)?.['NOMBRE'] || 'SIN DIV. FUNCIONAL';
    const grupoName = grupoTable.find(g => str(g['ANO_EJE']) === AÑO && str(g['GRUPO_FN']) === grupoCode)?.['NOMBRE'] || 'SIN GRUPO FUNCIONAL';

    // Group execution by classifier
    const grouped = new Map<string, {
      clasificador: string;
      nombre: string;
      pia: number;
      pim: number;
      certificado: number;
      devengado: number;
      girado: number;
    }>();

    const clasifNames = new Map<string, string>();
    clasificadorTable.filter(c => str(c['ANO_EJE']) === AÑO)
      .forEach(c => clasifNames.set(str(c['CLASIFIC']), str(c['NOMBRE'])));

    // Filter and group gastos
    const projectGastos = gastos.filter(r => {
      const ano = str(r['ANO_EJE'] ?? r['ANO_PROC']);
      const ejec = str(r['SEC_EJEC']);
      if (ano !== AÑO && ano !== '') return false;
      if (ejec && ejec !== SEC_EJEC) return false;
      return secFuncList.includes(str(r['SEC_FUNC']));
    });

    for (const row of projectGastos) {
      const cls = str(row['CLASIFICAD']);
      const pia = num(row['MTO_PIA']);
      const pim = num(row['MTO_PIM']);
      const cert = num(row['MTO_CERTIF']);
      
      let dev = 0;
      let gir = 0;
      for (let m = 1; m <= 12; m++) {
        const mk = m.toString().padStart(2, '0');
        dev += num(row[`MTO_DEV_${mk}`]);
        gir += num(row[`MTO_GIR_${mk}`]);
      }

      if (!grouped.has(cls)) {
        grouped.set(cls, {
          clasificador: cls,
          nombre: clasifNames.get(cls) || 'CLASIFICADOR PRESUPUESTAL',
          pia: 0,
          pim: 0,
          certificado: 0,
          devengado: 0,
          girado: 0
        });
      }

      const g = grouped.get(cls)!;
      g.pia += pia;
      g.pim += pim;
      g.certificado += cert;
      g.devengado += dev;
      g.girado += gir;
    }

    const classifiers = Array.from(grouped.values())
      .sort((a, b) => a.clasificador.localeCompare(b.clasificador));

    // Totals
    const totals = classifiers.reduce(
      (acc, c) => {
        acc.pia += c.pia;
        acc.pim += c.pim;
        acc.certificado += c.certificado;
        acc.devengado += c.devengado;
        acc.girado += c.girado;
        return acc;
      },
      { pia: 0, pim: 0, certificado: 0, devengado: 0, girado: 0 }
    );

    return NextResponse.json({
      success: true,
      projectInfo: {
        codigo,
        nombre: projectName,
        programa: pptoCode,
        programaNombre: programName,
        obra: componenteCode,
        obraNombre: obraName,
        funcion: funcionCode,
        funcionNombre: funcionName,
        division: divisionCode,
        divisionNombre: divisionName,
        grupo: grupoCode,
        grupoNombre: grupoName
      },
      classifiers,
      totals
    });
  } catch (error) {
    console.error('Error en /api/proyectos/ficha:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
