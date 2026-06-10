import { NextResponse } from 'next/server';
import { trySQL, str, num, getAño, SEC_EJEC } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const activeAño = getAño();
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const ciclo = searchParams.get('ciclo') || '';
    const fase = searchParams.get('fase') || '';
    const mes = searchParams.get('mes') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // Mappings for proveedores
    const proveedores = await trySQL(`SELECT ruc, nombre FROM [proveedor]`) || [];
    const provCatalogMap = new Map<string, string>();
    proveedores.forEach(p => provCatalogMap.set(str(p.ruc), str(p.nombre)));

    // Fetch glosas map
    const glosas = await trySQL(
      `SELECT EXPEDIENTE, CICLO, FASE, SEC_REG, GLOSA 
       FROM [expedientes_glosa] 
       WHERE ANO_EJE = @ano AND SEC_EJEC = @sec`,
      { ano: activeAño, sec: SEC_EJEC }
    ) || [];
    const glosaMap = new Map<string, string>();
    glosas.forEach(g => {
      const key = `${str(g.EXPEDIENTE)}-${str(g.CICLO)}-${str(g.FASE)}-${str(g.SEC_REG)}`;
      glosaMap.set(key, str(g.GLOSA));
    });

    // Fetch custom names map
    const nombres = await trySQL(
      `SELECT EXPEDIENTE, CICLO, FASE, SEC_REG, RUC, NOMBRE 
       FROM [expedientes_nombre_prov]`
    ) || [];
    const customProvMap = new Map<string, { nombre: string; ruc: string }>();
    nombres.forEach(n => {
      const key = `${str(n.EXPEDIENTE)}-${str(n.CICLO)}-${str(n.FASE)}-${str(n.SEC_REG)}`;
      customProvMap.set(key, { nombre: str(n.NOMBRE), ruc: str(n.RUC) });
    });

    let query = `
      SELECT 
        t.id, t.ANO_EJE, t.SEC_EJEC, t.EXPEDIENTE, t.CICLO, t.FASE, t.SEC_REG, t.MONTO, t.MES_EJE,
        COALESCE(g.GLOSA, '') as GLOSA,
        COALESCE(np.RUC, t.PROVEEDOR) as RUC,
        COALESCE(np.NOMBRE, p.nombre, t.PROVEEDOR) as PROVEEDOR_NOMBRE
      FROM (
        SELECT id, ANO_EJE, SEC_EJEC, EXPEDIENTE, CICLO, FASE, SEC_REG, MONTO, PROVEEDOR, MES_EJE
        FROM [expedientes_gastos_2026]
        WHERE SEC_EJEC = @sec AND ANO_EJE = @ano
        UNION ALL
        SELECT id, ANO_EJE, SEC_EJEC, EXPEDIENTE, CICLO, FASE, SEC_REG, MONTO, PROVEEDOR, MES_EJE
        FROM [expedientes_ingresos_2026]
        WHERE SEC_EJEC = @sec AND ANO_EJE = @ano
      ) t
      LEFT JOIN [expedientes_glosa] g ON g.ANO_EJE = t.ANO_EJE AND g.SEC_EJEC = t.SEC_EJEC AND g.EXPEDIENTE = t.EXPEDIENTE AND g.CICLO = t.CICLO AND g.FASE = t.FASE AND g.SEC_REG = t.SEC_REG
      LEFT JOIN [expedientes_nombre_prov] np ON np.EXPEDIENTE = t.EXPEDIENTE AND np.CICLO = t.CICLO AND np.FASE = t.FASE AND np.SEC_REG = t.SEC_REG
      LEFT JOIN [proveedor] p ON p.ruc = COALESCE(np.RUC, t.PROVEEDOR)
    `;

    let whereClause = ' WHERE 1=1';
    const queryParams: Record<string, unknown> = { sec: SEC_EJEC, ano: activeAño };

    if (ciclo) {
      whereClause += ' AND t.CICLO = @ciclo';
      queryParams.ciclo = ciclo;
    }
    if (fase) {
      whereClause += ' AND t.FASE = @fase';
      queryParams.fase = fase;
    }
    if (mes) {
      whereClause += ' AND t.MES_EJE = @mes';
      queryParams.mes = mes;
    }
    if (q) {
      whereClause += ' AND (t.EXPEDIENTE LIKE @q OR g.GLOSA LIKE @q OR np.RUC LIKE @q OR t.PROVEEDOR LIKE @q OR np.NOMBRE LIKE @q OR p.nombre LIKE @q)';
      queryParams.q = `%${q}%`;
    }

    query += whereClause;
    query += ' ORDER BY t.EXPEDIENTE ASC, t.SEC_REG ASC';

    const allRecords = await trySQL(query, queryParams);
    if (!allRecords) {
      return NextResponse.json({ success: true, rows: [], total: 0 });
    }

    const total = allRecords.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedRows = allRecords.slice(startIndex, startIndex + pageSize).map(r => ({
      id: `${str(r.CICLO)}-${Number(r.id)}`,
      ano_eje: str(r.ANO_EJE),
      sec_ejec: str(r.SEC_EJEC),
      expediente: str(r.EXPEDIENTE),
      ciclo: str(r.CICLO),
      fase: str(r.FASE),
      sec_reg: str(r.SEC_REG),
      mes_eje: str(r.MES_EJE),
      monto: num(r.MONTO),
      glosa: str(r.GLOSA),
      ruc: str(r.RUC),
      proveedor: str(r.PROVEEDOR_NOMBRE)
    }));

    return NextResponse.json({
      success: true,
      rows: paginatedRows,
      total,
      page,
      pageSize
    });
  } catch (error) {
    console.error('Error in /api/presupuesto/actualizar GET:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const activeAño = getAño();
  try {
    const body = await request.json();
    const expediente = str(body.expediente);
    const ciclo = str(body.ciclo) || 'G';
    const fase = str(body.fase);
    const secReg = str(body.sec_reg);
    const glosa = str(body.glosa);
    const ruc = str(body.ruc);
    const proveedor = str(body.proveedor);

    if (!expediente || !fase || !secReg) {
      return NextResponse.json({ success: false, error: 'Expediente, Fase and Sec. Reg. are required.' }, { status: 400 });
    }

    // 1. Update or Insert expedientes_glosa
    const glosaExists = await trySQL(
      `SELECT COUNT(*) as c FROM [expedientes_glosa] 
       WHERE ANO_EJE = @ano AND SEC_EJEC = @sec AND EXPEDIENTE = @expediente AND CICLO = @ciclo AND FASE = @fase AND SEC_REG = @secReg`,
      { ano: activeAño, sec: SEC_EJEC, expediente, ciclo, fase, secReg }
    );

    const hasGlosa = glosaExists && glosaExists[0].c > 0;

    if (hasGlosa) {
      await trySQL(
        `UPDATE [expedientes_glosa] 
         SET GLOSA = @glosa 
         WHERE ANO_EJE = @ano AND SEC_EJEC = @sec AND EXPEDIENTE = @expediente AND CICLO = @ciclo AND FASE = @fase AND SEC_REG = @secReg`,
        { glosa, ano: activeAño, sec: SEC_EJEC, expediente, ciclo, fase, secReg }
      );
    } else {
      await trySQL(
        `INSERT INTO [expedientes_glosa] (ANO_EJE, SEC_EJEC, EXPEDIENTE, CICLO, FASE, SEC_REG, GLOSA) 
         VALUES (@ano, @sec, @expediente, @ciclo, @fase, @secReg, @glosa)`,
        { ano: activeAño, sec: SEC_EJEC, expediente, ciclo, fase, secReg, glosa }
      );
    }

    // 2. Update or Insert expedientes_nombre_prov
    const provExists = await trySQL(
      `SELECT COUNT(*) as c FROM [expedientes_nombre_prov] 
       WHERE EXPEDIENTE = @expediente AND CICLO = @ciclo AND FASE = @fase AND SEC_REG = @secReg`,
      { expediente, ciclo, fase, secReg }
    );

    const hasProv = provExists && provExists[0].c > 0;

    if (hasProv) {
      await trySQL(
        `UPDATE [expedientes_nombre_prov] 
         SET RUC = @ruc, NOMBRE = @proveedor 
         WHERE EXPEDIENTE = @expediente AND CICLO = @ciclo AND FASE = @fase AND SEC_REG = @secReg`,
        { ruc, proveedor, expediente, ciclo, fase, secReg }
      );
    } else {
      await trySQL(
        `INSERT INTO [expedientes_nombre_prov] (EXPEDIENTE, CICLO, FASE, SEC_REG, RUC, NOMBRE) 
         VALUES (@expediente, @ciclo, @fase, @secReg, @ruc, @proveedor)`,
        { expediente, ciclo, fase, secReg, ruc, proveedor }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in /api/presupuesto/actualizar POST:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
