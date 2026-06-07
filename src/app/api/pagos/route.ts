import { NextResponse } from 'next/server';
import { loadTable, num, str, AÑO, SEC_EJEC } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface PagoEnriched {
  expediente: string;
  secuencia: string;
  num_doc: string;
  ruc: string;
  benefici: string;
  proveedor_nombre: string;
  rubro: string;
  glosa: string;
  cod_doc: string;
  fecha_doc: string;
  cod_doc_b: string;
  nom_doc_b: string;
  fec_doc_b: string;
  const_pago: string;
  confor_doc: string;
  confor_des: string;
  confor_fec: string;
  monto: number;
  estado: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterRubro = searchParams.get('rubro') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');

    const pagos = loadTable('nota_pago_2026');
    const proveedores = loadTable('proveedor');
    const rubros = loadTable('rubro');
    const glosas = loadTable('expedientes_glosa');

    // Build lookups
    const provMap = new Map<string, string>();
    proveedores.forEach(p => provMap.set(str(p['RUC']), str(p['NOMBRE'])));

    const glosaMap = new Map<string, string>();
    glosas.forEach(g => {
      const key = `${str(g['EXPEDIENTE'])}-${str(g['CICLO'])}-${str(g['FASE'])}-${str(g['SEC_REG'])}`;
      glosaMap.set(key, str(g['GLOSA']));
    });

    // Filter
    const rows = pagos.filter(r => {
      const ano = str(r['ANO_EJE'] ?? r['ANO_PROC']);
      const ejec = str(r['SEC_EJEC']);
      if (ano !== AÑO && ano !== '') return false;
      if (ejec && ejec !== SEC_EJEC) return false;
      if (filterRubro && str(r['RUBRO']) !== filterRubro) return false;
      return true;
    });

    const enriched = rows.map(r => {
      const ruc = str(r['RUC']);
      const glosa = str(r['GLOSA']) || glosaMap.get(`${str(r['EXPEDIENTE'])}-C-D-0`) || '';
      const provNombre = str(r['BENEFICI']) || provMap.get(ruc) || ruc;

      if (search && !provNombre.toLowerCase().includes(search.toLowerCase()) &&
          !ruc.includes(search) && !str(r['NUM_DOC']).includes(search)) {
        return null;
      }

      return {
        expediente: str(r['EXPEDIENTE']),
        secuencia: str(r['SECUENCIA']),
        num_doc: str(r['NUM_DOC']),
        ruc,
        benefici: provNombre,
        proveedor_nombre: provMap.get(ruc) || provNombre,
        rubro: str(r['RUBRO']),
        glosa: glosa || str(r['GLOSA']),
        cod_doc: str(r['COD_DOC']),
        fecha_doc: str(r['FECHA_DOC']),
        cod_doc_b: str(r['COD_DOC_B']),
        nom_doc_b: str(r['NOM_DOC_B']),
        fec_doc_b: str(r['FEC_DOC_B']),
        const_pago: str(r['CONST_PAGO']),
        confor_doc: str(r['CONFOR_DOC']),
        confor_des: str(r['CONFOR_DES']),
        confor_fec: str(r['CONFOR_FEC']),
        monto: num(r['MONTO']),
        estado: str(r['ESTADO']),
      };
    }).filter(Boolean) as PagoEnriched[];

    enriched.sort((a, b) => b.expediente.localeCompare(a.expediente));

    const total = enriched.length;
    const totalMonto = enriched.reduce((s, r) => s + r.monto, 0);
    const paginated = enriched.slice((page - 1) * pageSize, page * pageSize);

    const rubrosList = rubros
      .filter(r => str(r['ANO_EJE']) === AÑO)
      .map(r => ({ codigo: str(r['FUENTE_FIN']), nombre: str(r['NOMBRE']) }))
      .filter((r, i, arr) => arr.findIndex(x => x.codigo === r.codigo) === i);

    return NextResponse.json({
      success: true, rows: paginated, total, totalMonto, page, pageSize, rubros: rubrosList
    });
  } catch (error) {
    console.error('Error en /api/pagos:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
