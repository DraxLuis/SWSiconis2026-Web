import { NextResponse } from 'next/server';
import { trySQL, str, num } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SEC_EJEC = '301548';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || '';

  try {
    let rows: Record<string, unknown>[] = [];

    if (type === 'ejecucion_metas') {
      // Ejecucion-metas: grouped by SEC_FUNC (meta)
      rows = await trySQL(`
        SELECT 
          m.CODIGO_META as codigo,
          ISNULL(m.DESCRIPCION, 'Sin descripcion') as nombre,
          ISNULL(SUM(eg.PIA), 0) as pia,
          ISNULL(SUM(eg.MODIF), 0) as modif,
          ISNULL(SUM(eg.PIA) + SUM(eg.MODIF), 0) as pim,
          ISNULL(SUM(eg.CERTIF), 0) as certif,
          ISNULL(SUM(eg.CPANUA), 0) as cpanua,
          ISNULL(SUM(eg.ATCP), 0) as atcp,
          ISNULL(SUM(eg.DEVENGADO), 0) as devengado,
          ISNULL(SUM(eg.GIRADO), 0) as girado,
          ISNULL(SUM(eg.PIA) + SUM(eg.MODIF) - SUM(eg.DEVENGADO), 0) as saldo,
          CASE WHEN ISNULL(SUM(eg.PIA) + SUM(eg.MODIF), 0) > 0 
               THEN ISNULL(SUM(eg.DEVENGADO), 0) / (ISNULL(SUM(eg.PIA), 0) + ISNULL(SUM(eg.MODIF), 0))
               ELSE 0 END as avance
        FROM [meta] m
        LEFT JOIN [ejecucion_gasto] eg ON eg.SEC_FUNC = m.SEC_FUNC AND eg.SEC_EJEC = '${SEC_EJEC}'
        WHERE m.SEC_EJEC = '${SEC_EJEC}'
        GROUP BY m.CODIGO_META, m.DESCRIPCION, m.SEC_FUNC
        ORDER BY m.CODIGO_META
      `) || [];
    }

    else if (type === 'ejecucion_metas_clasificador') {
      // Ejecucion_metas_clasificador: meta + clasificador
      rows = await trySQL(`
        SELECT 
          m.CODIGO_META as codigo,
          ISNULL(c.NOMBRE, 'Sin clasificador') as nombre,
          eg.CLASIFICAD as clasificador,
          ISNULL(SUM(eg.PIA), 0) as pia,
          ISNULL(SUM(eg.MODIF), 0) as modif,
          ISNULL(SUM(eg.PIA) + SUM(eg.MODIF), 0) as pim,
          ISNULL(SUM(eg.CERTIF), 0) as certif,
          ISNULL(SUM(eg.CPANUA), 0) as cpanua,
          ISNULL(SUM(eg.ATCP), 0) as atcp,
          ISNULL(SUM(eg.DEVENGADO), 0) as devengado,
          ISNULL(SUM(eg.GIRADO), 0) as girado,
          ISNULL(SUM(eg.PIA) + SUM(eg.MODIF) - SUM(eg.DEVENGADO), 0) as saldo,
          CASE WHEN ISNULL(SUM(eg.PIA) + SUM(eg.MODIF), 0) > 0
               THEN ISNULL(SUM(eg.DEVENGADO), 0) / (ISNULL(SUM(eg.PIA), 0) + ISNULL(SUM(eg.MODIF), 0))
               ELSE 0 END as avance
        FROM [ejecucion_gasto] eg
        LEFT JOIN [meta] m ON eg.SEC_FUNC = m.SEC_FUNC AND m.SEC_EJEC = '${SEC_EJEC}'
        LEFT JOIN [clasificador] c ON eg.CLASIFICAD = c.CLASIFICAD AND c.ANO_EJE = '2026'
        WHERE eg.SEC_EJEC = '${SEC_EJEC}'
        GROUP BY m.CODIGO_META, eg.CLASIFICAD, c.NOMBRE
        ORDER BY m.CODIGO_META, eg.CLASIFICAD
      `) || [];
    }

    else if (type === 'certificado') {
      // Certificado: from certificaciones table
      rows = await trySQL(`
        SELECT 
          cert.ANO_EJE as ano_eje,
          cert.SEC_EJEC as sec_ejec,
          cert.NRO_CERTIF as certif,
          cert.SECUENCIA as secuencia,
          cert.CORRELAT as correlat,
          cert.RUBRO as rubro,
          cert.COD_DOC as cod_doc,
          cert.NUM_DOC as num_doc,
          cert.FECHA_DOC as fecha_doc,
          cert.CLASIFICAD as clasif,
          ISNULL(c.NOMBRE, '') as clasif_nombre,
          cert.SEC_FUNC as sec_func,
          ISNULL(m.DESCRIPCION, '') as meta_nombre,
          cert.MONTO as monto,
          cert.FEC_PROC as fec_proc,
          cert.TIPO_REG as tipo_reg,
          cert.EST_ENV as est_env,
          cert.EST_REG as est_reg
        FROM [certificaciones] cert
        LEFT JOIN [clasificador] c ON cert.CLASIFICAD = c.CLASIFICAD AND c.ANO_EJE = '2026'
        LEFT JOIN [meta] m ON cert.SEC_FUNC = m.SEC_FUNC AND m.SEC_EJEC = '${SEC_EJEC}'
        WHERE cert.SEC_EJEC = '${SEC_EJEC}'
        ORDER BY cert.NRO_CERTIF, cert.SECUENCIA
      `) || [];
    }

    else if (type === 'data_certificados') {
      // Data certificados: all cert detail records with amounts
      rows = await trySQL(`
        SELECT 
          cert.ANO_EJE as ano_eje,
          cert.SEC_EJEC as sec_ejec,
          cert.NRO_CERTIF as certif,
          cert.SECUENCIA as secuencia,
          cert.CORRELAT as correlat,
          cert.RUBRO as rubro,
          cert.COD_DOC as cod_doc,
          cert.NUM_DOC as num_doc,
          cert.FECHA_DOC as fecha_doc,
          cert.CLASIFICAD as clasif,
          ISNULL(c.NOMBRE, '') as clasif_nombre,
          cert.SEC_FUNC as sec_func,
          ISNULL(m.DESCRIPCION, '') as meta_nombre,
          cert.MONTO as monto,
          cert.FEC_PROC as fec_proc,
          cert.TIPO_REG as tipo_reg,
          cert.EST_ENV as est_env,
          cert.EST_REG as est_reg
        FROM [certificaciones] cert
        LEFT JOIN [clasificador] c ON cert.CLASIFICAD = c.CLASIFICAD AND c.ANO_EJE = '2026'
        LEFT JOIN [meta] m ON cert.SEC_FUNC = m.SEC_FUNC AND m.SEC_EJEC = '${SEC_EJEC}'
        WHERE cert.SEC_EJEC = '${SEC_EJEC}'
        ORDER BY cert.NRO_CERTIF, cert.SECUENCIA, cert.CORRELAT
      `) || [];
    }

    else if (type === 'data_devengados') {
      // Data Devengados: expedientes_gastos in devengado phase
      rows = await trySQL(`
        SELECT 
          eg.ANO_EJE as ano_eje,
          eg.MES_EJE as mes_eje,
          eg.EXPEDIENTE as expediente,
          eg.TIPO_OP as tipo_op,
          eg.SEC_REG as sec_reg,
          eg.CORR as corr,
          eg.RB as rb,
          eg.TR as tr,
          eg.COD_DOC as cod_doc,
          eg.NUM_DOC as num_doc,
          eg.FECHA_DOC as fecha_doc,
          ISNULL(p.ruc, '') as proveedor_ruc,
          ISNULL(COALESCE(NULLIF(np.BENEFICI,''), p.nombre, ''), '') as proveedor_nombre,
          eg.CLASIFICAD as clasificad,
          ISNULL(c.NOMBRE, '') as clasif_nombre,
          eg.SEC_FUNC as sec_func,
          ISNULL(m.DESCRIPCION, '') as meta_nombre,
          eg.GLOSA as glosa,
          eg.MONTO as monto,
          eg.FEC_APROB as fec_aprob,
          eg.EST_REG as estado,
          eg.NRO_CERTIF as certif,
          eg.SEC_CERTIF as certif_sec
        FROM [expedientes_gastos_2026] eg
        LEFT JOIN [proveedor] p ON eg.PROVEEDOR = p.ruc
        LEFT JOIN [nota_pago] np ON eg.EXPEDIENTE = np.EXPEDIENTE AND eg.NUM_DOC = np.NUM_DOC
        LEFT JOIN [clasificador] c ON eg.CLASIFICAD = c.CLASIFICAD AND c.ANO_EJE = '2026'
        LEFT JOIN [meta] m ON eg.SEC_FUNC = m.SEC_FUNC AND m.SEC_EJEC = '${SEC_EJEC}'
        WHERE eg.FASE = 'D' AND eg.SEC_EJEC = '${SEC_EJEC}'
        ORDER BY eg.MES_EJE, eg.EXPEDIENTE, eg.SEC_REG
      `) || [];
    }

    else if (type === 'data_girados') {
      // Data Girados: expedientes_gastos in girado phase (COD_DOC 243/099)
      rows = await trySQL(`
        SELECT 
          eg.ANO_EJE as ano_eje,
          eg.MES_EJE as mes_eje,
          eg.EXPEDIENTE as expediente,
          eg.TIPO_OP as tipo_op,
          eg.SEC_REG as sec_reg,
          eg.CORR as corr,
          eg.RB as rb,
          eg.TR as tr,
          eg.COD_DOC_B as cod_doc,
          eg.NUM_DOC_B as num_doc,
          eg.FEC_DOC_B as fecha_doc,
          ISNULL(COALESCE(NULLIF(np.BENEFICI,''), CASE WHEN eg.PROVEEDOR='0' THEN 'DIR.GRAL.TESORO PUBLICO' ELSE p.nombre END, ''), '') as proveedor_nombre,
          ISNULL(p.ruc, '') as proveedor_ruc,
          eg.CLASIFICAD as clasificad,
          ISNULL(c.NOMBRE, '') as clasif_nombre,
          eg.SEC_FUNC as sec_func,
          ISNULL(m.DESCRIPCION, '') as meta_nombre,
          eg.GLOSA as glosa,
          eg.MONTO as monto,
          eg.FEC_APROB as fec_aprob,
          eg.SEC_EST as estado,
          eg.NRO_CERTIF as certif,
          eg.SEC_CERTIF as certif_sec
        FROM [expedientes_gastos_2026] eg
        LEFT JOIN [proveedor] p ON eg.PROVEEDOR = p.ruc
        LEFT JOIN [nota_pago] np ON eg.EXPEDIENTE = np.EXPEDIENTE AND eg.NUM_DOC = np.NUM_DOC
        LEFT JOIN [clasificador] c ON eg.CLASIFICAD = c.CLASIFICAD AND c.ANO_EJE = '2026'
        LEFT JOIN [meta] m ON eg.SEC_FUNC = m.SEC_FUNC AND m.SEC_EJEC = '${SEC_EJEC}'
        WHERE eg.FASE = 'G' AND eg.SEC_EJEC = '${SEC_EJEC}' AND eg.COD_DOC IN ('243','099')
        ORDER BY eg.MES_EJE, eg.EXPEDIENTE, eg.SEC_REG
      `) || [];
    }

    else if (type === 'ejecucion_activ_obra_accinv') {
      // Ejecucion_activ_obra_accinv: grouped by ACT_PROY (obras/acc inversión)
      rows = await trySQL(`
        SELECT 
          eg.ACT_PROY as act_proy,
          ISNULL(pr.DESCRIPCION, 'Sin descripcion') as act_proy_nombre,
          ISNULL(SUM(eg.PIA), 0) as pia,
          ISNULL(SUM(eg.PIA) + SUM(eg.MODIF), 0) as pim,
          ISNULL(SUM(eg.CERTIF), 0) as certif,
          ISNULL(SUM(eg.CPANUA), 0) as comprometido,
          ISNULL(SUM(eg.ATCP), 0) as atcp,
          ISNULL(SUM(eg.DEVENGADO), 0) as devengado,
          ISNULL(SUM(eg.GIRADO), 0) as girado
        FROM [ejecucion_gasto] eg
        LEFT JOIN [proyecto] pr ON eg.ACT_PROY = pr.ACT_PROY AND pr.SEC_EJEC = '${SEC_EJEC}'
        WHERE eg.SEC_EJEC = '${SEC_EJEC}' AND eg.ACT_PROY IS NOT NULL AND eg.ACT_PROY != ''
        GROUP BY eg.ACT_PROY, pr.DESCRIPCION
        ORDER BY eg.ACT_PROY
      `) || [];
    }

    else if (type === 'ejecucion_actproy') {
      // Ejecucion_actproy: all actividades/proyectos
      rows = await trySQL(`
        SELECT 
          eg.ACT_PROY as act_proy,
          ISNULL(pr.DESCRIPCION, 'Sin descripcion') as act_proy_nombre,
          ISNULL(SUM(eg.PIA), 0) as pia,
          ISNULL(SUM(eg.PIA) + SUM(eg.MODIF), 0) as pim,
          ISNULL(SUM(eg.CERTIF), 0) as certif,
          ISNULL(SUM(eg.CPANUA), 0) as comprometido,
          ISNULL(SUM(eg.ATCP), 0) as atcp,
          ISNULL(SUM(eg.DEVENGADO), 0) as devengado,
          ISNULL(SUM(eg.GIRADO), 0) as girado
        FROM [ejecucion_gasto] eg
        LEFT JOIN [proyecto] pr ON eg.ACT_PROY = pr.ACT_PROY AND pr.SEC_EJEC = '${SEC_EJEC}'
        WHERE eg.SEC_EJEC = '${SEC_EJEC}'
        GROUP BY eg.ACT_PROY, pr.DESCRIPCION
        ORDER BY eg.ACT_PROY
      `) || [];
    }

    else if (type === 'ejecucion_ppto') {
      // Ejecucion_PPTO: grouped by programa presupuestal
      rows = await trySQL(`
        SELECT 
          eg.PROGRAMA as codigo,
          ISNULL(pp.DESCRIPCION, 'Sin descripcion') as nombre,
          ISNULL(SUM(eg.PIA), 0) as pia,
          ISNULL(SUM(eg.MODIF), 0) as modif,
          ISNULL(SUM(eg.PIA) + SUM(eg.MODIF), 0) as pim,
          ISNULL(SUM(eg.CERTIF), 0) as certif,
          ISNULL(SUM(eg.CPANUA), 0) as cpanua,
          ISNULL(SUM(eg.ATCP), 0) as atcp,
          ISNULL(SUM(eg.DEVENGADO), 0) as devengado,
          ISNULL(SUM(eg.GIRADO), 0) as girado,
          ISNULL(SUM(eg.PIA) + SUM(eg.MODIF) - SUM(eg.DEVENGADO), 0) as saldo,
          CASE WHEN ISNULL(SUM(eg.PIA) + SUM(eg.MODIF), 0) > 0
               THEN ISNULL(SUM(eg.DEVENGADO), 0) / (ISNULL(SUM(eg.PIA), 0) + ISNULL(SUM(eg.MODIF), 0))
               ELSE 0 END as avance
        FROM [ejecucion_gasto] eg
        LEFT JOIN [programa_presupuestal] pp ON eg.PROGRAMA = pp.PROGRAMA AND pp.ANO_EJE = '2026'
        WHERE eg.SEC_EJEC = '${SEC_EJEC}'
        GROUP BY eg.PROGRAMA, pp.DESCRIPCION
        ORDER BY eg.PROGRAMA
      `) || [];
    }

    else if (type === 'ejecucion_ppto_meta') {
      // Ejecucion_ppto_meta: programa + meta
      rows = await trySQL(`
        SELECT 
          eg.PROGRAMA as codigo,
          m.CODIGO_META as meta_codigo,
          ISNULL(pp.DESCRIPCION, 'Sin descripcion') as nombre,
          ISNULL(SUM(eg.PIA), 0) as pia,
          ISNULL(SUM(eg.MODIF), 0) as modif,
          ISNULL(SUM(eg.PIA) + SUM(eg.MODIF), 0) as pim,
          ISNULL(SUM(eg.CERTIF), 0) as certif,
          ISNULL(SUM(eg.CPANUA), 0) as cpanua,
          ISNULL(SUM(eg.ATCP), 0) as atcp,
          ISNULL(SUM(eg.DEVENGADO), 0) as devengado,
          ISNULL(SUM(eg.GIRADO), 0) as girado,
          ISNULL(SUM(eg.PIA) + SUM(eg.MODIF) - SUM(eg.DEVENGADO), 0) as saldo,
          CASE WHEN ISNULL(SUM(eg.PIA) + SUM(eg.MODIF), 0) > 0
               THEN ISNULL(SUM(eg.DEVENGADO), 0) / (ISNULL(SUM(eg.PIA), 0) + ISNULL(SUM(eg.MODIF), 0))
               ELSE 0 END as avance
        FROM [ejecucion_gasto] eg
        LEFT JOIN [programa_presupuestal] pp ON eg.PROGRAMA = pp.PROGRAMA AND pp.ANO_EJE = '2026'
        LEFT JOIN [meta] m ON eg.SEC_FUNC = m.SEC_FUNC AND m.SEC_EJEC = '${SEC_EJEC}'
        WHERE eg.SEC_EJEC = '${SEC_EJEC}'
        GROUP BY eg.PROGRAMA, pp.DESCRIPCION, m.CODIGO_META, eg.SEC_FUNC
        ORDER BY eg.PROGRAMA, m.CODIGO_META
      `) || [];
    }

    else if (type === 'meta_certificados') {
      // Meta_certificados: sum certif by meta
      rows = await trySQL(`
        SELECT 
          m.CODIGO_META as codigo,
          ISNULL(m.DESCRIPCION, 'Sin descripcion') as nombre,
          ISNULL(SUM(CASE WHEN cert.TIPO_REG = 'OP.INICIAL' THEN cert.MONTO ELSE 0 END), 0) as certif,
          ISNULL(SUM(CASE WHEN cert.TIPO_REG != 'OP.INICIAL' THEN cert.MONTO ELSE 0 END), 0) as comprometido,
          ISNULL(SUM(cert.MONTO), 0) as monto
        FROM [meta] m
        LEFT JOIN [certificaciones] cert ON cert.SEC_FUNC = m.SEC_FUNC AND cert.SEC_EJEC = '${SEC_EJEC}'
        WHERE m.SEC_EJEC = '${SEC_EJEC}'
        GROUP BY m.CODIGO_META, m.DESCRIPCION, m.SEC_FUNC
        ORDER BY m.CODIGO_META
      `) || [];
    }

    else if (type === 'meta_devengados') {
      // Meta_devengados: sum devengado by meta
      rows = await trySQL(`
        SELECT 
          m.CODIGO_META as codigo,
          ISNULL(m.DESCRIPCION, 'Sin descripcion') as nombre,
          ISNULL(SUM(eg.DEVENGADO), 0) as devengado,
          ISNULL(SUM(eg.GIRADO), 0) as girado,
          ISNULL(SUM(eg.MONTO), 0) as monto
        FROM [meta] m
        LEFT JOIN [expedientes_gastos_2026] eg ON eg.SEC_FUNC = m.SEC_FUNC AND eg.SEC_EJEC = '${SEC_EJEC}' AND eg.FASE = 'D'
        WHERE m.SEC_EJEC = '${SEC_EJEC}'
        GROUP BY m.CODIGO_META, m.DESCRIPCION, m.SEC_FUNC
        ORDER BY m.CODIGO_META
      `) || [];
    }

    else if (type === 'programa_accion_inversion') {
      // Programa_accion_inversion: inversiones por proyecto
      rows = await trySQL(`
        SELECT 
          pr.ACT_PROY as act_proy,
          ISNULL(pr.DESCRIPCION, 'Sin descripcion') as act_proy_nombre,
          ISNULL(SUM(eg.PIA), 0) as pia,
          ISNULL(SUM(eg.PIA) + SUM(eg.MODIF), 0) as pim,
          ISNULL(SUM(eg.CERTIF), 0) as certif,
          ISNULL(SUM(eg.CPANUA), 0) as comprometido,
          ISNULL(SUM(eg.ATCP), 0) as atcp,
          ISNULL(SUM(eg.DEVENGADO), 0) as devengado,
          ISNULL(SUM(eg.GIRADO), 0) as girado
        FROM [proyecto] pr
        LEFT JOIN [ejecucion_gasto] eg ON eg.ACT_PROY = pr.ACT_PROY AND eg.SEC_EJEC = '${SEC_EJEC}'
        WHERE pr.SEC_EJEC = '${SEC_EJEC}'
        GROUP BY pr.ACT_PROY, pr.DESCRIPCION
        ORDER BY pr.ACT_PROY
      `) || [];
    }

    else if (type === 'programa_devengados') {
      // Pograma_devengados: devengados por programa
      rows = await trySQL(`
        SELECT 
          eg.PROGRAMA as codigo,
          ISNULL(pp.DESCRIPCION, 'Sin descripcion') as nombre,
          eg.MES_EJE as mes_eje,
          eg.EXPEDIENTE as expediente,
          eg.TIPO_OP as tipo_op,
          eg.SEC_REG as sec_reg,
          eg.CORR as corr,
          eg.RB as rb,
          eg.TR as tr,
          eg.COD_DOC as cod_doc,
          eg.NUM_DOC as num_doc,
          eg.FECHA_DOC as fecha_doc,
          ISNULL(COALESCE(NULLIF(np.BENEFICI,''), p.nombre, ''), '') as proveedor_nombre,
          ISNULL(p.ruc, '') as proveedor_ruc,
          eg.CLASIFICAD as clasificad,
          ISNULL(c.NOMBRE, '') as clasif_nombre,
          eg.SEC_FUNC as sec_func,
          ISNULL(m.DESCRIPCION, '') as meta_nombre,
          eg.MONTO as monto,
          eg.FEC_APROB as fec_aprob,
          eg.EST_REG as estado,
          eg.NRO_CERTIF as certif,
          eg.SEC_CERTIF as certif_sec
        FROM [expedientes_gastos_2026] eg
        LEFT JOIN [programa_presupuestal] pp ON eg.PROGRAMA = pp.PROGRAMA AND pp.ANO_EJE = '2026'
        LEFT JOIN [proveedor] p ON eg.PROVEEDOR = p.ruc
        LEFT JOIN [nota_pago] np ON eg.EXPEDIENTE = np.EXPEDIENTE AND eg.NUM_DOC = np.NUM_DOC
        LEFT JOIN [clasificador] c ON eg.CLASIFICAD = c.CLASIFICAD AND c.ANO_EJE = '2026'
        LEFT JOIN [meta] m ON eg.SEC_FUNC = m.SEC_FUNC AND m.SEC_EJEC = '${SEC_EJEC}'
        WHERE eg.FASE = 'D' AND eg.SEC_EJEC = '${SEC_EJEC}'
        ORDER BY eg.PROGRAMA, eg.MES_EJE, eg.EXPEDIENTE
      `) || [];
    }

    return NextResponse.json({
      success: true,
      type,
      count: rows.length,
      rows: rows.map(r => {
        const mapped: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(r)) {
          mapped[k.toLowerCase()] = v;
        }
        return mapped;
      })
    });

  } catch (error) {
    console.error(`Error in /api/excel-reportes [${type}]:`, error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
