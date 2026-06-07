import { NextResponse } from 'next/server';
import { loadTable, num, str, AÑO, SEC_EJEC } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterRubro = searchParams.get('rubro') || '';

    const certificados = loadTable('certificado');
    const proveedores = loadTable('proveedor');
    const clasificadores = loadTable('clasificador');
    const metas = loadTable('meta');
    const rubros = loadTable('rubro');

    // Build lookup maps
    const provMap = new Map<string, string>();
    proveedores.forEach(p => provMap.set(str(p['RUC']), str(p['NOMBRE'])));

    const clasifMap = new Map<string, string>();
    clasificadores.filter(c => str(c['ANO_EJE']) === AÑO)
      .forEach(c => clasifMap.set(str(c['CLASIFIC']), str(c['NOMBRE'])));

    const metaMap = new Map<string, string>();
    metas.filter(m => str(m['ANO_EJE']) === AÑO && str(m['SEC_EJEC']) === SEC_EJEC)
      .forEach(m => metaMap.set(str(m['SEC_FUNC']), str(m['NOMBRE'])));

    // Filter certificates
    const filtered = certificados.filter(r => {
      const ano = str(r['ANO_EJE'] ?? r['ANO_PROC']);
      const ejec = str(r['SEC_EJEC']);
      if (ano !== AÑO && ano !== '') return false;
      if (ejec && ejec !== SEC_EJEC) return false;
      if (filterRubro && str(r['RUBRO']) !== filterRubro) return false;
      return true;
    });

    const rows = filtered.map(r => {
      const ruc = str(r['PROVEEDOR']);
      const clasif = str(r['CLASIF']);
      const secFunc = str(r['SEC_FUNC']);
      return {
        certif: str(r['CERTIF']),
        secuencia: str(r['SECUENCIA']),
        correlat: str(r['CORRELAT']),
        rubro: str(r['RUBRO']),
        cod_doc: str(r['COD_DOC']),
        num_doc: str(r['NUM_DOC']),
        fecha_doc: str(r['FECHA_DOC']),
        proveedor_ruc: ruc,
        proveedor_nombre: provMap.get(ruc) ?? ruc,
        clasif,
        clasif_nombre: clasifMap.get(clasif) ?? '',
        sec_func: secFunc,
        meta_nombre: metaMap.get(secFunc) ?? secFunc,
        moneda: str(r['MONEDA']),
        monto_orig: num(r['MONTO_ORIG']),
        monto: num(r['MONTO']),
        fec_proc: str(r['FEC_PROC']),
        etapa: str(r['ETAPA']),
        tipo_reg: str(r['TIPO_REG']),
        est_env: str(r['EST_ENV']),
        est_reg: str(r['EST_REG']),
      };
    });

    rows.sort((a, b) => b.certif.localeCompare(a.certif));

    const rubrosList = rubros
      .filter(r => str(r['ANO_EJE']) === AÑO)
      .map(r => ({ codigo: str(r['FUENTE_FIN']), nombre: str(r['NOMBRE']) }))
      .filter((r, i, arr) => arr.findIndex(x => x.codigo === r.codigo) === i);

    // Totals
    const totalMonto = rows.reduce((s, r) => s + r.monto, 0);

    return NextResponse.json({
      success: true, rows, total: rows.length, totalMonto, rubros: rubrosList
    });
  } catch (error) {
    console.error('Error en /api/certificados:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
