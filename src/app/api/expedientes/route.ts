import { NextResponse } from 'next/server';
import { loadTable, preloadTables, num, str, AÑO, SEC_EJEC } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface ExpedienteEnriched {
  expediente: string;
  mes_eje: string;
  tipo_op: string;
  ciclo: string;
  fase: string;
  sec_reg: string;
  corr: string;
  rb: string;
  tr: string;
  cod_doc: string;
  num_doc: string;
  fecha_doc: string;
  clasificad: string;
  clasif_nombre: string;
  sec_func: string;
  meta_nombre: string;
  proveedor_ruc: string;
  proveedor_nombre: string;
  glosa: string;
  moneda: string;
  monto_orig: number;
  monto: number;
  fec_proc: string;
  fec_aprob: string;
  estado: string;
  certif: string;
  certif_sec: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterFase = searchParams.get('fase') || '';
    const filterMes = searchParams.get('mes') || '';
    const filterProveedor = searchParams.get('proveedor') || '';
    const filterPrograma = searchParams.get('programa') || '';
    const pageParam = searchParams.get('page');
    const page = pageParam ? parseInt(pageParam) : null;
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // Preload tables from SQL Server
    await preloadTables(['meta', 'expedientes_gastos_2026', 'expedientes_glosa', 'expedientes_nombre_prov', 'clasificador', 'proveedor']);

    const expedientes = loadTable('expedientes_gastos_2026');
    const glosas = loadTable('expedientes_glosa');
    const nombres = loadTable('expedientes_nombre_prov');
    const clasificadores = loadTable('clasificador');
    const metas = loadTable('meta');
    const proveedores = loadTable('proveedor');

    // Build lookup maps
    const glosaMap = new Map<string, string>();
    glosas.forEach(g => {
      const key = `${str(g['EXPEDIENTE'])}-${str(g['CICLO'])}-${str(g['FASE'])}-${str(g['SEC_REG'])}`;
      glosaMap.set(key, str(g['GLOSA']));
    });

    const proveedorMap = new Map<string, { nombre: string; ruc: string }>();
    nombres.forEach(n => {
      const key = `${str(n['EXPEDIENTE'])}-${str(n['CICLO'])}-${str(n['FASE'])}-${str(n['SEC_REG'])}`;
      proveedorMap.set(key, { nombre: str(n['NOMBRE']), ruc: str(n['RUC']) });
    });

    const provCatalogMap = new Map<string, string>();
    proveedores.forEach(p => {
      provCatalogMap.set(str(p['RUC']), str(p['NOMBRE']));
    });

    const clasifMap = new Map<string, string>();
    clasificadores.filter(c => str(c['ANO_EJE']) === AÑO)
      .forEach(c => clasifMap.set(str(c['CLASIFIC']), str(c['NOMBRE'])));

    const metaMap = new Map<string, string>();
    metas.filter(m => str(m['ANO_EJE']) === AÑO && str(m['SEC_EJEC']) === SEC_EJEC)
      .forEach(m => metaMap.set(str(m['SEC_FUNC']), str(m['NOMBRE'])));

    const metaProgramMap = new Map<string, string>();
    metas.filter(m => str(m['ANO_EJE']) === AÑO && str(m['SEC_EJEC']) === SEC_EJEC)
      .forEach(m => metaProgramMap.set(str(m['SEC_FUNC']), str(m['PPTO'])));

    // Filter expedientes
    const rows = expedientes.filter(r => {
      const ano = str(r['ANO_EJE'] ?? r['ANO_PROC']);
      const ejec = str(r['SEC_EJEC']);
      if (ano !== AÑO && ano !== '') return false;
      if (ejec && ejec !== SEC_EJEC) return false;
      if (filterFase && str(r['FASE']) !== filterFase) return false;
      if (filterMes && str(r['MES_EJE']) !== filterMes) return false;
      
      if (filterPrograma) {
        const secFunc = str(r['SEC_FUNC']);
        const progCode = metaProgramMap.get(secFunc) || '';
        if (progCode !== filterPrograma) return false;
      }
      
      return true;
    });

    // Enrich rows
    const enriched = rows.map(r => {
      const key = `${str(r['EXPEDIENTE'])}-${str(r['CICLO'])}-${str(r['FASE'])}-${str(r['CORR'])}`;
      const prov = proveedorMap.get(key) ?? { nombre: '', ruc: '' };
      
      const ruc = prov.ruc || str(r['PROVEEDOR']);
      const nombre = prov.nombre || provCatalogMap.get(ruc) || ruc;
      
      const glosa = glosaMap.get(key) ?? '';
      const clasif = str(r['CLASIFICAD']);
      const secFunc = str(r['SEC_FUNC']);

      // Filter by provider name search
      if (filterProveedor && !nombre.toLowerCase().includes(filterProveedor.toLowerCase())) {
        return null;
      }

      return {
        expediente: str(r['EXPEDIENTE']),
        mes_eje: str(r['MES_EJE']),
        tipo_op: str(r['TIPO_OP']),
        ciclo: str(r['CICLO']),
        fase: str(r['FASE']),
        sec_reg: str(r['SEC_REG']),
        corr: str(r['CORR']),
        rb: str(r['RB']),
        tr: str(r['TR']),
        cod_doc: str(r['COD_DOC']),
        num_doc: str(r['NUM_DOC']),
        fecha_doc: str(r['FECHA_DOC']),
        clasificad: clasif,
        clasif_nombre: clasifMap.get(clasif) ?? '',
        sec_func: secFunc,
        meta_nombre: metaMap.get(secFunc) ?? secFunc,
        proveedor_ruc: ruc,
        proveedor_nombre: nombre,
        glosa,
        moneda: str(r['MONEDA']),
        monto_orig: num(r['MONTO_ORIG']),
        monto: num(r['MONTO']),
        fec_proc: str(r['FEC_PROC']),
        fec_aprob: str(r['FEC_APROB']),
        estado: str(r['EST_REG'] || r['SEC_EST']),
        certif: str(r['CERTIF']),
        certif_sec: str(r['CERTIF_SEC']),
      };
    }).filter(Boolean) as ExpedienteEnriched[];

    // Sort by expediente desc
    enriched.sort((a, b) => b.expediente.localeCompare(a.expediente));

    const total = enriched.length;
    const paginated = page ? enriched.slice((page - 1) * pageSize, page * pageSize) : enriched;

    // Distinct fases
    const fasesList = expedientes.map(r => str(r['FASE'])).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).sort();
    const mesesList = expedientes.map(r => str(r['MES_EJE'])).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).sort();

    return NextResponse.json({
      success: true, rows: paginated, total, page, pageSize,
      fases: fasesList, meses: mesesList
    });
  } catch (error) {
    console.error('Error en /api/expedientes:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
