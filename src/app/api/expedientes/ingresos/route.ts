import { NextResponse } from 'next/server';
import { trySQL, str, num, getAño, SEC_EJEC } from '@/lib/db';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const activeAño = getAño();
  try {
    const { searchParams } = new URL(request.url);
    const mesDesde = searchParams.get('mes_desde') || '';
    const mesHasta = searchParams.get('mes_hasta') || '';
    const searchClasificador = searchParams.get('clasificador') || '';
    const searchQuery = searchParams.get('q') || '';
    const incluirGenerica = searchParams.get('incluirGenerica') !== 'false';
    const incluirSaldosBalance = searchParams.get('incluirSaldosBalance') !== 'false';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // Advanced filters from FoxPro toolbar
    const fase = searchParams.get('fase') || 'R'; // default 'R' for incomes (Recaudado)
    const fteFinanc = searchParams.get('fte_financ') || '';
    const tipOp = searchParams.get('tip_op') || '';
    const metaFilter = searchParams.get('meta') || '';
    const genericaFilter = searchParams.get('generica') || '';
    const clasificadorFilter = searchParams.get('clasificador') || '';

    // Preload meta, clasificadores mappings
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

    // Fetch glosas map for Incomes (Ciclo = 'I')
    const glosas = await trySQL(
      `SELECT EXPEDIENTE, CICLO, FASE, SEC_REG, GLOSA 
       FROM [expedientes_glosa] 
       WHERE ANO_EJE = @ano AND SEC_EJEC = @sec AND CICLO = 'I'`,
      { ano: activeAño, sec: SEC_EJEC }
    ) || [];
    const glosaMap = new Map<string, string>();
    glosas.forEach(g => {
      const key = `${str(g.EXPEDIENTE)}-I-${str(g.FASE)}-${str(g.SEC_REG)}`;
      glosaMap.set(key, str(g.GLOSA));
    });

    // Fetch custom names map
    const nombres = await trySQL(
      `SELECT EXPEDIENTE, CICLO, FASE, SEC_REG, RUC, NOMBRE 
       FROM [expedientes_nombre_prov] 
       WHERE CICLO = 'I'`
    ) || [];
    const proveedorMap = new Map<string, { nombre: string; ruc: string }>();
    nombres.forEach(n => {
      const key = `${str(n.EXPEDIENTE)}-I-${str(n.FASE)}-${str(n.SEC_REG)}`;
      proveedorMap.set(key, { nombre: str(n.NOMBRE), ruc: str(n.RUC) });
    });

    // Query administrative records from SQL Server
    let query = `
      SELECT id, ANO_EJE, MES_EJE, EXPEDIENTE, TIPO_OP, CICLO, FASE, SEC_REG, CORR, RB, TR, TIPO_FINAN,
             COD_DOC, NUM_DOC, FECHA_DOC, CLASIFICAD, SEC_FUNC, PROVEEDOR, MONEDA,
             MONTO_ORIG, MONTO, FEC_PROC, EST_REG, SEC_EST, CERTIF, CERTIF_SEC
      FROM [expedientes_ingresos_2026]
      WHERE SEC_EJEC = @sec AND CICLO = 'I' AND FASE = @fase
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

    if (!incluirSaldosBalance) {
      query += ` AND RB != '19'`;
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

    if (searchClasificador) {
      query += ` AND CLASIFICAD LIKE @searchClasificador`;
      params.searchClasificador = `%${searchClasificador}%`;
    }

    query += ` ORDER BY EXPEDIENTE ASC, SEC_REG ASC`;

    const records = await trySQL(query, params);
    if (!records) {
      throw new Error('Database query returned null.');
    }

    // Enrich and search in memory
    const enriched = records.map(r => {
      const key = `${str(r.EXPEDIENTE)}-I-${str(r.FASE)}-${str(r.SEC_REG)}`;
      const customProv = proveedorMap.get(key) ?? { nombre: '', ruc: '' };
      
      const ruc = customProv.ruc || str(r.PROVEEDOR);
      const nombre = customProv.nombre || provCatalogMap.get(ruc) || ruc;
      const glosa = glosaMap.get(key) ?? '';

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
    });

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
    console.error('Error in /api/expedientes/ingresos GET:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { data } = await request.json();
    if (!Array.isArray(data)) {
      return NextResponse.json({ success: false, error: 'Data must be an array' }, { status: 400 });
    }

    const mssql = await import('mssql');
    const envContent = fs.readFileSync('d:/PROYECTOS-PERSONALES/SWSiconis2026-Web/.env.local', 'utf8');
    const env = Object.fromEntries(envContent.split('\n').map(l => l.split('=').map(s => s.trim())).filter(p => p.length === 2));

    const config = {
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      server: env.DB_SERVER || 'localhost',
      database: env.DB_DATABASE,
      port: env.DB_PORT ? parseInt(env.DB_PORT, 10) : 1433,
      options: { encrypt: false, trustServerCertificate: true }
    };

    const pool = await new mssql.default.ConnectionPool(config).connect();
    
    // Begin transaction for bulk insert
    const transaction = new mssql.default.Transaction(pool);
    await transaction.begin();

    try {
      for (const r of data) {
        const req = new mssql.default.Request(transaction);
        req.input('ANO_PROC', mssql.default.VarChar(4), str(r.ANO_PROC || '2026'));
        req.input('ANO_EJE', mssql.default.VarChar(4), str(r.ANO_EJE || '2026'));
        req.input('SEC_EJEC', mssql.default.VarChar(6), str(r.SEC_EJEC || SEC_EJEC));
        req.input('MES_EJE', mssql.default.VarChar(2), str(r.MES_EJE));
        req.input('EXPEDIENTE', mssql.default.VarChar(10), str(r.EXPEDIENTE));
        req.input('TIPO_OP', mssql.default.VarChar(2), str(r.TIPO_OP));
        req.input('MOD_COMPRA', mssql.default.VarChar(2), str(r.MOD_COMPRA));
        req.input('TIPO_PROC', mssql.default.VarChar(2), str(r.TIPO_PROC));
        req.input('AREA', mssql.default.VarChar(4), str(r.AREA));
        req.input('CICLO', mssql.default.VarChar(1), str(r.CICLO || 'I'));
        req.input('FASE', mssql.default.VarChar(1), str(r.FASE || 'I'));
        req.input('SEC_REG', mssql.default.VarChar(4), str(r.SEC_REG));
        req.input('CORR', mssql.default.VarChar(4), str(r.CORR));
        req.input('RB', mssql.default.VarChar(2), str(r.RB));
        req.input('TIPO_FINAN', mssql.default.VarChar(2), str(r.TIPO_FINAN));
        req.input('COD_DOC', mssql.default.VarChar(3), str(r.COD_DOC));
        req.input('NUM_DOC', mssql.default.VarChar(35), str(r.NUM_DOC));
        req.input('FECHA_DOC', mssql.default.VarChar(10), str(r.FECHA_DOC));
        req.input('TP', mssql.default.VarChar(1), str(r.TP));
        req.input('TR', mssql.default.VarChar(2), str(r.TR));
        req.input('TC', mssql.default.VarChar(2), str(r.TC));
        req.input('ANO_BANCO', mssql.default.VarChar(4), str(r.ANO_BANCO));
        req.input('BANCO', mssql.default.VarChar(3), str(r.BANCO));
        req.input('CTA_CTE', mssql.default.VarChar(3), str(r.CTA_CTE));
        req.input('PROVEEDOR', mssql.default.VarChar(11), str(r.PROVEEDOR));
        req.input('PROY', mssql.default.VarChar(7), str(r.PROY));
        req.input('CLASIFICAD', mssql.default.VarChar(15), str(r.CLASIFICAD));
        req.input('SEC_FUNC', mssql.default.VarChar(4), str(r.SEC_FUNC));
        req.input('TIPO_GIR', mssql.default.VarChar(1), str(r.TIPO_GIR));
        req.input('COD_DOC_B', mssql.default.VarChar(3), str(r.COD_DOC_B));
        req.input('NUM_DOC_B', mssql.default.VarChar(15), str(r.NUM_DOC_B));
        req.input('FEC_DOC_B', mssql.default.VarChar(10), str(r.FEC_DOC_B));
        req.input('MONEDA', mssql.default.VarChar(3), str(r.MONEDA));
        req.input('TIPOCAMBIO', mssql.default.Decimal(18, 4), num(r.TIPOCAMBIO));
        req.input('MONTO_ORIG', mssql.default.Decimal(18, 2), num(r.MONTO_ORIG));
        req.input('MONTO', mssql.default.Decimal(18, 2), num(r.MONTO));
        req.input('FEC_APROB', mssql.default.VarChar(10), str(r.FEC_APROB));
        req.input('FEC_PROC', mssql.default.VarChar(10), str(r.FEC_PROC));
        req.input('SEC_EST', mssql.default.VarChar(1), str(r.SEC_EST));
        req.input('EST_REG', mssql.default.VarChar(1), str(r.EST_REG));
        req.input('CERTIF', mssql.default.VarChar(10), str(r.CERTIF));
        req.input('CERTIF_SEC', mssql.default.VarChar(4), str(r.CERTIF_SEC));

        await req.query(`
          INSERT INTO [expedientes_ingresos_2026] (
            ANO_PROC, ANO_EJE, SEC_EJEC, MES_EJE, EXPEDIENTE, TIPO_OP, MOD_COMPRA, TIPO_PROC, AREA, CICLO, FASE,
            SEC_REG, CORR, RB, TIPO_FINAN, COD_DOC, NUM_DOC, FECHA_DOC, TP, TR, TC,
            ANO_BANCO, BANCO, CTA_CTE, PROVEEDOR, PROY, CLASIFICAD, SEC_FUNC, TIPO_GIR,
            COD_DOC_B, NUM_DOC_B, FEC_DOC_B, MONEDA, TIPOCAMBIO, MONTO_ORIG, MONTO,
            FEC_APROB, FEC_PROC, SEC_EST, EST_REG, CERTIF, CERTIF_SEC
          ) VALUES (
            @ANO_PROC, @ANO_EJE, @SEC_EJEC, @MES_EJE, @EXPEDIENTE, @TIPO_OP, @MOD_COMPRA, @TIPO_PROC, @AREA, @CICLO, @FASE,
            @SEC_REG, @CORR, @RB, @TIPO_FINAN, @COD_DOC, @NUM_DOC, @FECHA_DOC, @TP, @TR, @TC,
            @ANO_BANCO, @BANCO, @CTA_CTE, @PROVEEDOR, @PROY, @CLASIFICAD, @SEC_FUNC, @TIPO_GIR,
            @COD_DOC_B, @NUM_DOC_B, @FEC_DOC_B, @MONEDA, @TIPOCAMBIO, @MONTO_ORIG, @MONTO,
            @FEC_APROB, @FEC_PROC, @SEC_EST, @EST_REG, @CERTIF, @CERTIF_SEC
          )
        `);
      }

      await transaction.commit();
      await pool.close();
      return NextResponse.json({ success: true, count: data.length });
    } catch (err) {
      await transaction.rollback();
      await pool.close();
      throw err;
    }
  } catch (error) {
    console.error('Error in /api/expedientes/ingresos POST:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
