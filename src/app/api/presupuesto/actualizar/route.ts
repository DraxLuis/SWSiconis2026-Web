import { NextResponse } from 'next/server';
import { trySQL, str, getAño, SEC_EJEC } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const activeAño = getAño();
  try {
    const { searchParams } = new URL(request.url);
    const expediente = str(searchParams.get('expediente'));
    const ciclo = str(searchParams.get('ciclo')) || 'G';
    const fase = str(searchParams.get('fase'));
    const secReg = str(searchParams.get('sec_reg'));
    const corr = str(searchParams.get('corr')) || '00';

    if (!expediente || !fase || !secReg) {
      return NextResponse.json({ success: false, error: 'Expediente, Fase and Sec. Reg. are required.' }, { status: 400 });
    }

    const tableName = ciclo === 'I' ? 'expedientes_ingresos_2026' : 'expedientes_gastos_2026';

    // 1. Fetch administrative record
    const records = await trySQL(
      `SELECT PROVEEDOR, MONTO FROM [${tableName}] 
       WHERE SEC_EJEC = @sec AND EXPEDIENTE = @expediente AND FASE = @fase AND SEC_REG = @secReg`,
      { sec: SEC_EJEC, expediente, fase, secReg }
    );

    if (!records || records.length === 0) {
      return NextResponse.json({ success: false, error: 'Administrative record not found in ' + tableName });
    }

    const r = records[0];

    // 2. Fetch glosa
    const glosas = await trySQL(
      `SELECT GLOSA FROM [expedientes_glosa] 
       WHERE ANO_EJE = @ano AND SEC_EJEC = @sec AND EXPEDIENTE = @expediente AND CICLO = @ciclo AND FASE = @fase AND SEC_REG = @secReg`,
      { ano: activeAño, sec: SEC_EJEC, expediente, ciclo, fase, secReg }
    );
    const glosaActual = glosas && glosas.length > 0 ? str(glosas[0].GLOSA) : '';

    // 3. Fetch custom provider
    const customProvs = await trySQL(
      `SELECT RUC, NOMBRE FROM [expedientes_nombre_prov] 
       WHERE EXPEDIENTE = @expediente AND CICLO = @ciclo AND FASE = @fase AND SEC_REG = @secReg`,
      { expediente, ciclo, fase, secReg }
    );

    let rucActual = '';
    let proveedorActual = '';

    if (customProvs && customProvs.length > 0) {
      rucActual = str(customProvs[0].RUC);
      proveedorActual = str(customProvs[0].NOMBRE);
    } else {
      // Fallback to record PROVEEDOR (RUC) and search in catalog
      rucActual = str(r.PROVEEDOR);
      const catalog = await trySQL(`SELECT nombre FROM [proveedor] WHERE ruc = @ruc`, { ruc: rucActual });
      if (catalog && catalog.length > 0) {
        proveedorActual = str(catalog[0].nombre);
      } else {
        proveedorActual = rucActual === '0' ? 'DIRECCION GENERAL DEL TESORO PUBLICO' : rucActual;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        expediente,
        ciclo,
        fase,
        sec_reg: secReg,
        corr,
        monto: Number(r.MONTO),
        glosa: glosaActual,
        ruc: rucActual,
        proveedor: proveedorActual
      }
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
