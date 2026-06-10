import { NextResponse } from 'next/server';
import { trySQL, str, num, getAño, SEC_EJEC } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const activeAño = getAño();
  try {
    const { searchParams } = new URL(request.url);
    const mesDesde = searchParams.get('mes_desde') || '';
    const mesHasta = searchParams.get('mes_hasta') || '';
    const searchProveedor = searchParams.get('proveedor') || '';
    const searchQuery = searchParams.get('q') || '';
    const incluirGenerica = searchParams.get('incluirGenerica') !== 'false';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // Advanced filters from FoxPro toolbar
    const fase = searchParams.get('fase') || 'D';
    const fteFinanc = searchParams.get('fte_financ') || '';
    const tipOp = searchParams.get('tip_op') || '';
    const metaFilter = searchParams.get('meta') || '';
    const genericaFilter = searchParams.get('generica') || '';
    const clasificadorFilter = searchParams.get('clasificador') || '';

    // Preload meta, clasificadores and proveedores mappings
    const clasificadores = await trySQL(
      `SELECT CLASIFICAD, NOMBRE FROM [clasificador] WHERE ANO_EJE = @ano`,
      { ano: activeAño }
    ) || [];
    const clasifMap = new Map<string, string>();
    clasificadores.forEach(c => clasifMap.set(str(c.CLASIFICAD), str(c.NOMBRE)));

    const metas = await trySQL(
      `SELECT SEC_FUNC, NOMBRE FROM [meta] WHERE ANO_EJE = @ano AND SEC_EJEC = @sec`,
      { ano: activeAño, sec: SEC_EJEC }
    ) || [];
    const metaMap = new Map<string, string>();
    metas.forEach(m => metaMap.set(str(m.SEC_FUNC), str(m.NOMBRE)));

    const proveedores = await trySQL(`SELECT ruc, nombre FROM [proveedor]`) || [];
    const provCatalogMap = new Map<string, string>();
    proveedores.forEach(p => provCatalogMap.set(str(p.ruc), str(p.nombre)));

    // Fetch glosas map for cycle G
    const glosas = await trySQL(
      `SELECT EXPEDIENTE, CICLO, FASE, SEC_REG, GLOSA 
       FROM [expedientes_glosa] 
       WHERE ANO_EJE = @ano AND SEC_EJEC = @sec AND CICLO = 'G'`,
      { ano: activeAño, sec: SEC_EJEC }
    ) || [];
    const glosaMap = new Map<string, string>();
    glosas.forEach(g => {
      const key = `${str(g.EXPEDIENTE)}-G-${str(g.FASE)}-${str(g.SEC_REG)}`;
      glosaMap.set(key, str(g.GLOSA));
    });

    // Fetch custom names map
    const nombres = await trySQL(
      `SELECT EXPEDIENTE, CICLO, FASE, SEC_REG, RUC, NOMBRE 
       FROM [expedientes_nombre_prov] 
       WHERE CICLO = 'G'`
    ) || [];
    const proveedorMap = new Map<string, { nombre: string; ruc: string }>();
    nombres.forEach(n => {
      const key = `${str(n.EXPEDIENTE)}-G-${str(n.FASE)}-${str(n.SEC_REG)}`;
      proveedorMap.set(key, { nombre: str(n.NOMBRE), ruc: str(n.RUC) });
    });

    // Query administrative records from SQL Server
    let query = `
      SELECT id, ANO_EJE, MES_EJE, EXPEDIENTE, TIPO_OP, CICLO, FASE, SEC_REG, CORR, RB, TR, TIPO_FINAN,
             COD_DOC, NUM_DOC, FECHA_DOC, CLASIFICAD, SEC_FUNC, PROVEEDOR, MONEDA,
             MONTO_ORIG, MONTO, FEC_PROC, EST_REG, SEC_EST, CERTIF, CERTIF_SEC
      FROM [expedientes_gastos_2026]
      WHERE SEC_EJEC = @sec AND CICLO = 'G' AND FASE = @fase
    `;

    const params: Record<string, unknown> = { sec: SEC_EJEC, fase };

    if (mesDesde) {
      if (mesHasta) {
        query += ` AND MES_EJE >= @mesDesde AND MES_EJE <= @mesHasta`;
        params.mesDesde = mesDesde;
        params.mesHasta = mesHasta;
      } else {
        query += ` AND MES_EJE = @mesDesde`;
        params.mesDesde = mesDesde;
      }
    }

    if (!incluirGenerica) {
      query += ` AND CLASIFICAD != '0.0.0.0.0.0'`;
    }

    // Apply advanced VFP filters
    if (fteFinanc) {
      query += ` AND RB = @fteFinanc`;
      params.fteFinanc = fteFinanc;
    }
    if (tipOp) {
      query += ` AND TIPO_OP = @tipOp`;
      params.tipOp = tipOp;
    }
    if (metaFilter) {
      query += ` AND SEC_FUNC = @metaFilter`;
      params.metaFilter = metaFilter;
    }
    if (genericaFilter) {
      query += ` AND CLASIFICAD LIKE @genericaFilter`;
      params.genericaFilter = `${genericaFilter}%`;
    }
    if (clasificadorFilter) {
      query += ` AND CLASIFICAD = @clasificadorFilter`;
      params.clasificadorFilter = clasificadorFilter;
    }

    query += ` ORDER BY EXPEDIENTE ASC, SEC_REG ASC`;

    const records = await trySQL(query, params);
    if (!records) {
      throw new Error('Database query returned null.');
    }

    // Enrich and search in memory
    const enriched = records.map(r => {
      const key = `${str(r.EXPEDIENTE)}-G-${str(r.FASE)}-${str(r.SEC_REG)}`;
      const customProv = proveedorMap.get(key) ?? { nombre: '', ruc: '' };
      
      const ruc = customProv.ruc || str(r.PROVEEDOR);
      const nombre = customProv.nombre || provCatalogMap.get(ruc) || ruc;
      const glosa = glosaMap.get(key) ?? '';
      
      // Filter by provider search
      if (searchProveedor && !nombre.toLowerCase().includes(searchProveedor.toLowerCase()) && !ruc.includes(searchProveedor)) {
        return null;
      }

      // Filter by general search query (Expediente, Num_doc, Glosa, RUC/Proveedor, Clasificador)
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const expediente = str(r.EXPEDIENTE).toLowerCase();
        const numDoc = str(r.NUM_DOC).toLowerCase();
        const docGlosa = glosa.toLowerCase();
        const provNombre = nombre.toLowerCase();
        const provRuc = ruc.toLowerCase();
        const clasificad = str(r.CLASIFICAD).toLowerCase();
        
        if (!expediente.includes(q) && 
            !numDoc.includes(q) && 
            !docGlosa.includes(q) && 
            !provNombre.includes(q) && 
            !provRuc.includes(q) &&
            !clasificad.includes(q)) {
          return null;
        }
      }

      return {
        id: Number(r.id),
        ano_eje: str(r.ANO_EJE),
        expediente: str(r.EXPEDIENTE),
        mes_eje: str(r.MES_EJE),
        tipo_op: str(r.TIPO_OP),
        ciclo: str(r.CICLO),
        fase: str(r.FASE),
        sec_reg: str(r.SEC_REG),
        corr: str(r.CORR),
        rb: str(r.RB),
        tr: str(r.TR),
        tipo_finan: str(r.TIPO_FINAN),
        cod_doc: str(r.COD_DOC),
        num_doc: str(r.NUM_DOC),
        fecha_doc: str(r.FECHA_DOC),
        clasificad: str(r.CLASIFICAD),
        clasif_nombre: clasifMap.get(str(r.CLASIFICAD)) || '',
        sec_func: str(r.SEC_FUNC),
        meta_nombre: metaMap.get(str(r.SEC_FUNC)) || str(r.SEC_FUNC),
        proveedor_ruc: ruc,
        proveedor_nombre: nombre,
        glosa,
        moneda: str(r.MONEDA),
        monto_orig: num(r.MONTO_ORIG),
        monto: num(r.MONTO),
        fec_proc: str(r.FEC_PROC),
        estado: str(r.EST_REG || r.SEC_EST),
        certif: str(r.CERTIF),
        certif_sec: str(r.CERTIF_SEC)
      };
    }).filter(Boolean);

    const total = enriched.length;
    const paginated = enriched.slice((page - 1) * pageSize, page * pageSize);

    return NextResponse.json({
      success: true,
      rows: paginated,
      total,
      page,
      pageSize
    });
  } catch (error) {
    console.error('Error in /api/expedientes/gastos:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
