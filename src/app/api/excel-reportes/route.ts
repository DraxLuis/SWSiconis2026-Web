import { NextResponse } from 'next/server';
import { trySQL, loadTable, num, str, SEC_EJEC } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || '';
  const year = searchParams.get('year') || '2026';

  try {
    let rows: Record<string, unknown>[] = [];
    let sqlResult = null;

    // ─────────────────────────────────────────────────────────────────────────
    // TRY SQL SERVER FIRST
    // ─────────────────────────────────────────────────────────────────────────
    if (type === 'ejecucion_metas') {
      sqlResult = await trySQL(`
        SELECT 
          m.sec_func as codigo,
          m.nombre as nombre,
          SUM(ISNULL(eg.mto_pia, 0)) as pia,
          SUM(ISNULL(eg.mto_modif, 0)) as modif,
          SUM(ISNULL(eg.mto_pim, 0)) as pim,
          SUM(ISNULL(eg.mto_certif, 0)) as certif,
          SUM(ISNULL(eg.mto_cpanua, 0)) as cpanua,
          SUM(ISNULL(eg.mto_atcp01,0)+ISNULL(eg.mto_atcp02,0)+ISNULL(eg.mto_atcp03,0)+ISNULL(eg.mto_atcp04,0)+ISNULL(eg.mto_atcp05,0)+ISNULL(eg.mto_atcp06,0)+ISNULL(eg.mto_atcp07,0)+ISNULL(eg.mto_atcp08,0)+ISNULL(eg.mto_atcp09,0)+ISNULL(eg.mto_atcp10,0)+ISNULL(eg.mto_atcp11,0)+ISNULL(eg.mto_atcp12,0)) as atcp,
          SUM(ISNULL(eg.mto_dev_01,0)+ISNULL(eg.mto_dev_02,0)+ISNULL(eg.mto_dev_03,0)+ISNULL(eg.mto_dev_04,0)+ISNULL(eg.mto_dev_05,0)+ISNULL(eg.mto_dev_06,0)+ISNULL(eg.mto_dev_07,0)+ISNULL(eg.mto_dev_08,0)+ISNULL(eg.mto_dev_09,0)+ISNULL(eg.mto_dev_10,0)+ISNULL(eg.mto_dev_11,0)+ISNULL(eg.mto_dev_12,0)) as devengado,
          SUM(ISNULL(eg.mto_gir_01,0)+ISNULL(eg.mto_gir_02,0)+ISNULL(eg.mto_gir_03,0)+ISNULL(eg.mto_gir_04,0)+ISNULL(eg.mto_gir_05,0)+ISNULL(eg.mto_gir_06,0)+ISNULL(eg.mto_gir_07,0)+ISNULL(eg.mto_gir_08,0)+ISNULL(eg.mto_gir_09,0)+ISNULL(eg.mto_gir_10,0)+ISNULL(eg.mto_gir_11,0)+ISNULL(eg.mto_gir_12,0)) as girado
        FROM [meta] m
        LEFT JOIN [ejecucion_gasto] eg ON eg.sec_func = m.sec_func AND eg.sec_ejec = m.sec_ejec AND eg.ano_eje = m.ano_eje
        WHERE m.sec_ejec = @sec_ejec AND m.ano_eje = @year
        GROUP BY m.sec_func, m.nombre
        ORDER BY m.sec_func
      `, { sec_ejec: SEC_EJEC, year });
    }

    else if (type === 'certificado') {
      sqlResult = await trySQL(`
        SELECT 
          c.ANO_EJE as ano_eje,
          c.CERTIF as certif,
          c.SEC_FUNC as sec_func,
          c.RUBRO as rubro,
          c.CLASIF + '     ' + cl.nombre as clasif,
          SUM(CASE WHEN c.ETAPA = 'CERTIFICACIÓN' THEN c.MONTO ELSE 0 END) as certificado,
          SUM(CASE WHEN c.ETAPA = 'COMPROMISO ANUA' THEN c.MONTO ELSE 0 END) as compromiso,
          SUM(CASE WHEN c.ETAPA = 'CERTIFICACIÓN' THEN c.MONTO ELSE 0 END) - SUM(CASE WHEN c.ETAPA = 'COMPROMISO ANUA' THEN c.MONTO ELSE 0 END) as saldo
        FROM [certificado] c
        LEFT JOIN [meta] m ON c.SEC_FUNC = m.sec_func AND c.sec_ejec = m.sec_ejec AND c.ano_eje = m.ano_eje
        LEFT JOIN [clasificador] cl ON c.CLASIF = cl.codigo AND c.ano_eje = cl.ano_eje
        WHERE c.sec_ejec = @sec_ejec AND c.ano_eje = @year
        GROUP BY c.ANO_EJE, c.CERTIF, c.SEC_FUNC, c.RUBRO, c.CLASIF, cl.nombre
        ORDER BY c.CERTIF
      `, { sec_ejec: SEC_EJEC, year });
    }

    else if (type === 'data_certificados' || type === 'meta_certificados') {
      sqlResult = await trySQL(`
        SELECT 
          c.ANO_EJE as ano_eje,
          c.SEC_EJEC as sec_ejec,
          c.CERTIF as certif,
          c.SECUENCIA as secuencia,
          c.CORRELAT as correlat,
          c.RUBRO as rubro,
          c.COD_DOC as cod_doc,
          c.NUM_DOC as num_doc,
          c.FECHA_DOC as fecha_doc,
          c.PROVEEDOR as proveedor,
          c.CLASIF as clasif,
          cl.nombre as clasif_nombre,
          c.SEC_FUNC as sec_func,
          m.nombre as meta_nombre,
          c.MONTO as monto,
          c.FEC_PROC as fec_proc,
          c.TIPO_REG as tipo_reg,
          c.EST_ENV as est_env,
          c.EST_REG as est_reg
        FROM [certificado] c
        LEFT JOIN [meta] m ON c.SEC_FUNC = m.sec_func AND c.sec_ejec = m.sec_ejec AND c.ano_eje = m.ano_eje
        LEFT JOIN [clasificador] cl ON c.CLASIF = cl.codigo AND c.ano_eje = cl.ano_eje
        WHERE c.sec_ejec = @sec_ejec AND c.ano_eje = @year
        ORDER BY c.CERTIF, c.SECUENCIA, c.CORRELAT
      `, { sec_ejec: SEC_EJEC, year });
    }

    else if (type === 'data_devengados' || type === 'meta_devengados' || type === 'programa_devengados' || type === 'programa_accion_inversion') {
      const groupKeyCol = type === 'programa_devengados' 
        ? 'm.programa' 
        : type === 'programa_accion_inversion' 
          ? 'm.act_proy' 
          : 'm.sec_func';

      sqlResult = await trySQL(`
        SELECT 
          eg.ANO_EJE as ano_eje,
          eg.MES_EJE as mes_eje,
          ${groupKeyCol} as group_key,
          m.programa as prog_key,
          m.act_proy as proyecto,
          pp.nombre as prog_nombre,
          eg.EXPEDIENTE as expediente,
          eg.TIPO_OP as tipo_op,
          eg.SEC_REG as sec_reg,
          eg.CORR as corr,
          eg.RB as rb,
          eg.TR as tr,
          eg.COD_DOC as cod_doc,
          eg.NUM_DOC as num_doc,
          eg.FECHA_DOC as fecha_doc,
          ISNULL(COALESCE(NULLIF(np.BENEFICI, ''), p.nombre), eg.PROVEEDOR) as proveedor_nombre,
          eg.PROVEEDOR as proveedor_ruc,
          eg.CLASIFICAD as clasificad,
          cl.nombre as clasif_nombre,
          m.sec_func as sec_func,
          m.nombre as meta_nombre,
          eg.MONTO as monto,
          eg.FEC_APROB as fec_aprob,
          eg.EST_REG as estado,
          eg.CERTIF as certif,
          eg.CERTIF_SEC as certif_sec,
          eg.TIPO_OP as oper,
          eg.MOD_COMPRA as mod,
          eg.CICLO as ciclo,
          eg.FASE as fase,
          eg.COD_DOC as cod,
          eg.TP as tp,
          eg.TC as tc,
          eg.PROVEEDOR as proveedor
        FROM [expedientes_gastos_2026] eg
        INNER JOIN [meta] m ON eg.SEC_FUNC = m.sec_func AND eg.sec_ejec = m.sec_ejec AND eg.ano_eje = m.ano_eje
        LEFT JOIN [programa_pptal] pp ON m.programa = pp.progppto AND m.ano_eje = pp.ano_eje
        LEFT JOIN [clasificador] cl ON eg.CLASIFICAD = cl.codigo AND eg.ano_eje = cl.ano_eje
        LEFT JOIN [proveedor] p ON eg.PROVEEDOR = p.ruc
        LEFT JOIN [nota_pago] np ON eg.EXPEDIENTE = np.EXPEDIENTE AND eg.NUM_DOC = np.NUM_DOC
        WHERE eg.FASE = 'D' AND eg.sec_ejec = @sec_ejec AND eg.ano_eje = @year
        ORDER BY eg.MES_EJE, eg.EXPEDIENTE, eg.SEC_REG
      `, { sec_ejec: SEC_EJEC, year });
    }

    else if (type === 'data_girados') {
      sqlResult = await trySQL(`
        SELECT 
          eg.ANO_EJE as ano,
          eg.MES_EJE as mes,
          eg.EXPEDIENTE as expediente,
          eg.TIPO_OP as tipo,
          eg.CICLO as c,
          eg.FASE as f,
          eg.SEC_REG as secuen,
          eg.CORR as corr,
          eg.RB as rb,
          eg.TR as tr,
          eg.COD_DOC as cod,
          eg.NUM_DOC as num_doc,
          eg.FECHA_DOC as fecha_doc,
          eg.TP as tp,
          eg.TC as tc,
          eg.ANO_BANCO as ano_banco,
          eg.BANCO as banco,
          eg.CTA_CTE as cta_cte,
          ISNULL(COALESCE(NULLIF(np.BENEFICI, ''), CASE WHEN eg.PROVEEDOR = '0' THEN 'CARRASCO MARTINEZ MARIA HERLINDA' ELSE p.nombre END), eg.PROVEEDOR) as beneficiario,
          eg.CLASIFICAD as clasificad,
          ISNULL(m.sec_func + ' ' + m.nombre, '') as sec_func,
          eg.TIPO_GIR as tipo_gir,
          eg.COD_DOC_B as cod_b,
          eg.NUM_DOC_B as num_doc_b,
          eg.FEC_DOC_B as fec_doc_b,
          eg.MONTO as monto,
          eg.FEC_APROB as fec_aprob,
          eg.SEC_EST as sec_est,
          eg.EST_REG as est_reg,
          eg.CERTIF as certif,
          eg.CERTIF_SEC as certif_sec
        FROM [expedientes_gastos_2026] eg
        LEFT JOIN [meta] m ON eg.SEC_FUNC = m.sec_func AND eg.sec_ejec = m.sec_ejec AND eg.ano_eje = m.ano_eje
        LEFT JOIN [proveedor] p ON eg.PROVEEDOR = p.ruc
        LEFT JOIN [nota_pago] np ON eg.EXPEDIENTE = np.EXPEDIENTE AND eg.NUM_DOC = np.NUM_DOC
        WHERE eg.FASE = 'G' AND eg.sec_ejec = @sec_ejec AND eg.ano_eje = @year
        ORDER BY eg.MES_EJE, eg.EXPEDIENTE, eg.SEC_REG
      `, { sec_ejec: SEC_EJEC, year });
    }

    else if (type === 'ejecucion_activ_obra_accinv') {
      sqlResult = await trySQL(`
        SELECT 
          ao.actobracin as codigo,
          ao.nombre as nombre,
          SUM(ISNULL(eg.mto_pia, 0)) as pia,
          SUM(ISNULL(eg.mto_modif, 0)) as modif,
          SUM(ISNULL(eg.mto_pim, 0)) as pim,
          SUM(ISNULL(eg.mto_certif, 0)) as certif,
          SUM(ISNULL(eg.mto_cpanua, 0)) as cpanua,
          SUM(ISNULL(eg.mto_atcp01,0)+ISNULL(eg.mto_atcp02,0)+ISNULL(eg.mto_atcp03,0)+ISNULL(eg.mto_atcp04,0)+ISNULL(eg.mto_atcp05,0)+ISNULL(eg.mto_atcp06,0)+ISNULL(eg.mto_atcp07,0)+ISNULL(eg.mto_atcp08,0)+ISNULL(eg.mto_atcp09,0)+ISNULL(eg.mto_atcp10,0)+ISNULL(eg.mto_atcp11,0)+ISNULL(eg.mto_atcp12,0)) as atcp,
          SUM(ISNULL(eg.mto_dev_01,0)+ISNULL(eg.mto_dev_02,0)+ISNULL(eg.mto_dev_03,0)+ISNULL(eg.mto_dev_04,0)+ISNULL(eg.mto_dev_05,0)+ISNULL(eg.mto_dev_06,0)+ISNULL(eg.mto_dev_07,0)+ISNULL(eg.mto_dev_08,0)+ISNULL(eg.mto_dev_09,0)+ISNULL(eg.mto_dev_10,0)+ISNULL(eg.mto_dev_11,0)+ISNULL(eg.mto_dev_12,0)) as devengado,
          SUM(ISNULL(eg.mto_gir_01,0)+ISNULL(eg.mto_gir_02,0)+ISNULL(eg.mto_gir_03,0)+ISNULL(eg.mto_gir_04,0)+ISNULL(eg.mto_gir_05,0)+ISNULL(eg.mto_gir_06,0)+ISNULL(eg.mto_gir_07,0)+ISNULL(eg.mto_gir_08,0)+ISNULL(eg.mto_gir_09,0)+ISNULL(eg.mto_gir_10,0)+ISNULL(eg.mto_gir_11,0)+ISNULL(eg.mto_gir_12,0)) as girado
        FROM [meta] m
        INNER JOIN [activ_obra_accinv] ao ON m.act_proy = ao.actobracin AND m.ano_eje = ao.ano_eje AND m.sec_ejec = ao.sec_ejec
        LEFT JOIN [ejecucion_gasto] eg ON eg.sec_func = m.sec_func AND eg.sec_ejec = m.sec_ejec AND eg.ano_eje = m.ano_eje
        WHERE m.sec_ejec = @sec_ejec AND m.ano_eje = @year
        GROUP BY ao.actobracin, ao.nombre
        ORDER BY ao.actobracin
      `, { sec_ejec: SEC_EJEC, year });
    }

    else if (type === 'ejecucion_actproy') {
      sqlResult = await trySQL(`
        SELECT 
          pp.act_proy as codigo,
          pp.nombre as nombre,
          SUM(ISNULL(eg.mto_pia, 0)) as pia,
          SUM(ISNULL(eg.mto_modif, 0)) as modif,
          SUM(ISNULL(eg.mto_pim, 0)) as pim,
          SUM(ISNULL(eg.mto_certif, 0)) as certif,
          SUM(ISNULL(eg.mto_cpanua, 0)) as cpanua,
          SUM(ISNULL(eg.mto_atcp01,0)+ISNULL(eg.mto_atcp02,0)+ISNULL(eg.mto_atcp03,0)+ISNULL(eg.mto_atcp04,0)+ISNULL(eg.mto_atcp05,0)+ISNULL(eg.mto_atcp06,0)+ISNULL(eg.mto_atcp07,0)+ISNULL(eg.mto_atcp08,0)+ISNULL(eg.mto_atcp09,0)+ISNULL(eg.mto_atcp10,0)+ISNULL(eg.mto_atcp11,0)+ISNULL(eg.mto_atcp12,0)) as atcp,
          SUM(ISNULL(eg.mto_dev_01,0)+ISNULL(eg.mto_dev_02,0)+ISNULL(eg.mto_dev_03,0)+ISNULL(eg.mto_dev_04,0)+ISNULL(eg.mto_dev_05,0)+ISNULL(eg.mto_dev_06,0)+ISNULL(eg.mto_dev_07,0)+ISNULL(eg.mto_dev_08,0)+ISNULL(eg.mto_dev_09,0)+ISNULL(eg.mto_dev_10,0)+ISNULL(eg.mto_dev_11,0)+ISNULL(eg.mto_dev_12,0)) as devengado,
          SUM(ISNULL(eg.mto_gir_01,0)+ISNULL(eg.mto_gir_02,0)+ISNULL(eg.mto_gir_03,0)+ISNULL(eg.mto_gir_04,0)+ISNULL(eg.mto_gir_05,0)+ISNULL(eg.mto_gir_06,0)+ISNULL(eg.mto_gir_07,0)+ISNULL(eg.mto_gir_08,0)+ISNULL(eg.mto_gir_09,0)+ISNULL(eg.mto_gir_10,0)+ISNULL(eg.mto_gir_11,0)+ISNULL(eg.mto_gir_12,0)) as girado
        FROM [meta] m
        INNER JOIN [producto_proyecto] pp ON m.act_proy = pp.act_proy AND m.ano_eje = pp.ano_eje AND m.sec_ejec = pp.sec_ejec
        LEFT JOIN [ejecucion_gasto] eg ON eg.sec_func = m.sec_func AND eg.sec_ejec = m.sec_ejec AND eg.ano_eje = m.ano_eje
        WHERE m.sec_ejec = @sec_ejec AND m.ano_eje = @year
        GROUP BY pp.act_proy, pp.nombre
        ORDER BY pp.act_proy
      `, { sec_ejec: SEC_EJEC, year });
    }

    else if (type === 'ejecucion_ppto') {
      sqlResult = await trySQL(`
        SELECT 
          p.progppto as codigo,
          p.nombre as nombre,
          SUM(ISNULL(eg.mto_pia, 0)) as pia,
          SUM(ISNULL(eg.mto_modif, 0)) as modif,
          SUM(ISNULL(eg.mto_pim, 0)) as pim,
          SUM(ISNULL(eg.mto_certif, 0)) as certif,
          SUM(ISNULL(eg.mto_cpanua, 0)) as cpanua,
          SUM(ISNULL(eg.mto_atcp01,0)+ISNULL(eg.mto_atcp02,0)+ISNULL(eg.mto_atcp03,0)+ISNULL(eg.mto_atcp04,0)+ISNULL(eg.mto_atcp05,0)+ISNULL(eg.mto_atcp06,0)+ISNULL(eg.mto_atcp07,0)+ISNULL(eg.mto_atcp08,0)+ISNULL(eg.mto_atcp09,0)+ISNULL(eg.mto_atcp10,0)+ISNULL(eg.mto_atcp11,0)+ISNULL(eg.mto_atcp12,0)) as atcp,
          SUM(ISNULL(eg.mto_dev_01,0)+ISNULL(eg.mto_dev_02,0)+ISNULL(eg.mto_dev_03,0)+ISNULL(eg.mto_dev_04,0)+ISNULL(eg.mto_dev_05,0)+ISNULL(eg.mto_dev_06,0)+ISNULL(eg.mto_dev_07,0)+ISNULL(eg.mto_dev_08,0)+ISNULL(eg.mto_dev_09,0)+ISNULL(eg.mto_dev_10,0)+ISNULL(eg.mto_dev_11,0)+ISNULL(eg.mto_dev_12,0)) as devengado,
          SUM(ISNULL(eg.mto_gir_01,0)+ISNULL(eg.mto_gir_02,0)+ISNULL(eg.mto_gir_03,0)+ISNULL(eg.mto_gir_04,0)+ISNULL(eg.mto_gir_05,0)+ISNULL(eg.mto_gir_06,0)+ISNULL(eg.mto_gir_07,0)+ISNULL(eg.mto_gir_08,0)+ISNULL(eg.mto_gir_09,0)+ISNULL(eg.mto_gir_10,0)+ISNULL(eg.mto_gir_11,0)+ISNULL(eg.mto_gir_12,0)) as girado
        FROM [meta] m
        INNER JOIN [programa_pptal] p ON m.programa = p.progppto AND m.ano_eje = p.ano_eje
        LEFT JOIN [ejecucion_gasto] eg ON eg.sec_func = m.sec_func AND eg.sec_ejec = m.sec_ejec AND eg.ano_eje = m.ano_eje
        WHERE m.sec_ejec = @sec_ejec AND m.ano_eje = @year
        GROUP BY p.progppto, p.nombre
        ORDER BY p.progppto
      `, { sec_ejec: SEC_EJEC, year });
    }

    else if (type === 'ejecucion_metas_clasificador') {
      sqlResult = await trySQL(`
        SELECT 
          m.sec_func as meta_codigo,
          m.nombre as meta_nombre,
          eg.rubro as rubro_codigo,
          r.nombre as rubro_nombre,
          eg.clasificad as clasif_codigo,
          cl.nombre as clasif_nombre,
          SUM(ISNULL(eg.mto_pia, 0)) as pia,
          SUM(ISNULL(eg.mto_modif, 0)) as modif,
          SUM(ISNULL(eg.mto_pim, 0)) as pim,
          SUM(ISNULL(eg.mto_certif, 0)) as certif,
          SUM(ISNULL(eg.mto_cpanua, 0)) as cpanua,
          SUM(ISNULL(eg.mto_atcp01,0)+ISNULL(eg.mto_atcp02,0)+ISNULL(eg.mto_atcp03,0)+ISNULL(eg.mto_atcp04,0)+ISNULL(eg.mto_atcp05,0)+ISNULL(eg.mto_atcp06,0)+ISNULL(eg.mto_atcp07,0)+ISNULL(eg.mto_atcp08,0)+ISNULL(eg.mto_atcp09,0)+ISNULL(eg.mto_atcp10,0)+ISNULL(eg.mto_atcp11,0)+ISNULL(eg.mto_atcp12,0)) as atcp,
          SUM(ISNULL(eg.mto_dev_01,0)+ISNULL(eg.mto_dev_02,0)+ISNULL(eg.mto_dev_03,0)+ISNULL(eg.mto_dev_04,0)+ISNULL(eg.mto_dev_05,0)+ISNULL(eg.mto_dev_06,0)+ISNULL(eg.mto_dev_07,0)+ISNULL(eg.mto_dev_08,0)+ISNULL(eg.mto_dev_09,0)+ISNULL(eg.mto_dev_10,0)+ISNULL(eg.mto_dev_11,0)+ISNULL(eg.mto_dev_12,0)) as devengado,
          SUM(ISNULL(eg.mto_gir_01,0)+ISNULL(eg.mto_gir_02,0)+ISNULL(eg.mto_gir_03,0)+ISNULL(eg.mto_gir_04,0)+ISNULL(eg.mto_gir_05,0)+ISNULL(eg.mto_gir_06,0)+ISNULL(eg.mto_gir_07,0)+ISNULL(eg.mto_gir_08,0)+ISNULL(eg.mto_gir_09,0)+ISNULL(eg.mto_gir_10,0)+ISNULL(eg.mto_gir_11,0)+ISNULL(eg.mto_gir_12,0)) as girado
        FROM [ejecucion_gasto] eg
        INNER JOIN [meta] m ON eg.sec_func = m.sec_func AND eg.sec_ejec = m.sec_ejec AND eg.ano_eje = m.ano_eje
        LEFT JOIN [rubro] r ON eg.rubro = r.fuente_fin AND eg.ano_eje = r.ano_eje
        LEFT JOIN [clasificador] cl ON eg.clasificad = cl.codigo AND eg.ano_eje = cl.ano_eje
        WHERE eg.sec_ejec = @sec_ejec AND eg.ano_eje = @year
        GROUP BY m.sec_func, m.nombre, eg.rubro, r.nombre, eg.clasificad, cl.nombre
        ORDER BY m.sec_func, eg.rubro, eg.clasificad
      `, { sec_ejec: SEC_EJEC, year });
    }

    else if (type === 'ejecucion_ppto_meta') {
      sqlResult = await trySQL(`
        SELECT 
          pp.progppto as prog_codigo,
          pp.nombre as prog_nombre,
          m.sec_func as meta_codigo,
          m.nombre as meta_nombre,
          SUM(ISNULL(eg.mto_pia, 0)) as pia,
          SUM(ISNULL(eg.mto_modif, 0)) as modif,
          SUM(ISNULL(eg.mto_pim, 0)) as pim,
          SUM(ISNULL(eg.mto_certif, 0)) as certif,
          SUM(ISNULL(eg.mto_cpanua, 0)) as cpanua,
          SUM(ISNULL(eg.mto_atcp01,0)+ISNULL(eg.mto_atcp02,0)+ISNULL(eg.mto_atcp03,0)+ISNULL(eg.mto_atcp04,0)+ISNULL(eg.mto_atcp05,0)+ISNULL(eg.mto_atcp06,0)+ISNULL(eg.mto_atcp07,0)+ISNULL(eg.mto_atcp08,0)+ISNULL(eg.mto_atcp09,0)+ISNULL(eg.mto_atcp10,0)+ISNULL(eg.mto_atcp11,0)+ISNULL(eg.mto_atcp12,0)) as atcp,
          SUM(ISNULL(eg.mto_dev_01,0)+ISNULL(eg.mto_dev_02,0)+ISNULL(eg.mto_dev_03,0)+ISNULL(eg.mto_dev_04,0)+ISNULL(eg.mto_dev_05,0)+ISNULL(eg.mto_dev_06,0)+ISNULL(eg.mto_dev_07,0)+ISNULL(eg.mto_dev_08,0)+ISNULL(eg.mto_dev_09,0)+ISNULL(eg.mto_dev_10,0)+ISNULL(eg.mto_dev_11,0)+ISNULL(eg.mto_dev_12,0)) as devengado,
          SUM(ISNULL(eg.mto_gir_01,0)+ISNULL(eg.mto_gir_02,0)+ISNULL(eg.mto_gir_03,0)+ISNULL(eg.mto_gir_04,0)+ISNULL(eg.mto_gir_05,0)+ISNULL(eg.mto_gir_06,0)+ISNULL(eg.mto_gir_07,0)+ISNULL(eg.mto_gir_08,0)+ISNULL(eg.mto_gir_09,0)+ISNULL(eg.mto_gir_10,0)+ISNULL(eg.mto_gir_11,0)+ISNULL(eg.mto_gir_12,0)) as girado
        FROM [ejecucion_gasto] eg
        INNER JOIN [meta] m ON eg.sec_func = m.sec_func AND eg.sec_ejec = m.sec_ejec AND eg.ano_eje = m.ano_eje
        INNER JOIN [programa_pptal] pp ON m.programa = pp.progppto AND m.ano_eje = pp.ano_eje
        WHERE eg.sec_ejec = @sec_ejec AND eg.ano_eje = @year
        GROUP BY pp.progppto, pp.nombre, m.sec_func, m.nombre
        ORDER BY pp.progppto, m.sec_func
      `, { sec_ejec: SEC_EJEC, year });
    }

    // Process SQL results if successful
    if (sqlResult) {
      rows = sqlResult;
    } else {
      // ─────────────────────────────────────────────────────────────────────────
      // FALLBACK TO JSON FILES
      // ─────────────────────────────────────────────────────────────────────────
      console.log(`Fallback active for excel-reportes type: ${type}, year: ${year}`);
      
      const meta = loadTable('meta');
      const ejecGasto = loadTable('presupuesto_ejecucion_gasto');
      const clasificador = loadTable('clasificador');
      const rubro = loadTable('rubro');
      const programa = loadTable('programa_pptal');
      const producto = loadTable('producto_proyecto');
      const activObra = loadTable('activ_obra_accinv');
      const certificado = loadTable('certificado');
      const expedientes = loadTable('expedientes_gastos_2026');
      const proveedor = loadTable('proveedor');
      const notaPago = loadTable('nota_pago_2026');

      const metaMap = new Map<string, Record<string, unknown>>();
      meta.filter(m => str(m['ANO_EJE']) === year && str(m['SEC_EJEC']) === SEC_EJEC)
        .forEach(m => metaMap.set(str(m['SEC_FUNC']), m));

      const clasifMap = new Map<string, string>();
      clasificador.filter(c => str(c['ANO_EJE']) === year)
        .forEach(c => clasifMap.set(str(c['CODIGO']), str(c['NOMBRE'])));

      const rubroMap = new Map<string, string>();
      rubro.filter(r => str(r['ANO_EJE']) === year)
        .forEach(r => rubroMap.set(str(r['FUENTE_FIN']), str(r['NOMBRE'])));

      const provMap = new Map<string, string>();
      proveedor.forEach(p => provMap.set(str(p['RUC']), str(p['NOMBRE'])));

      const npMap = new Map<string, string>();
      notaPago.forEach(n => npMap.set(`${str(n['EXPEDIENTE'])}-${str(n['NUM_DOC'])}`, str(n['BENEFICI'])));

      const sumMonthly = (r: Record<string, unknown>, prefix: string) => {
        let sum = 0;
        for (let m = 1; m <= 12; m++) {
          sum += num(r[`${prefix}_${m.toString().padStart(2, '0')}`] ?? r[`${prefix}${m.toString().padStart(2, '0')}`]);
        }
        return sum;
      };

      const filterEjec = ejecGasto.filter(eg => str(eg['ANO_EJE'] ?? eg['ANO_PROC']) === year && str(eg['SEC_EJEC']) === SEC_EJEC);

      if (type === 'ejecucion_metas') {
        const grouped = new Map<string, {
          codigo: string;
          nombre: string;
          pia: number;
          modif: number;
          pim: number;
          certif: number;
          cpanua: number;
          atcp: number;
          devengado: number;
          girado: number;
        }>();
        filterEjec.forEach(eg => {
          const secFunc = str(eg['SEC_FUNC']);
          const m = metaMap.get(secFunc);
          if (!m) return;
          const metaCode = str(m['SEC_FUNC']);
          if (!grouped.has(metaCode)) {
            grouped.set(metaCode, {
              codigo: metaCode,
              nombre: str(m['NOMBRE']),
              pia: 0, modif: 0, pim: 0, certif: 0, cpanua: 0, atcp: 0, devengado: 0, girado: 0
            });
          }
          const item = grouped.get(metaCode)!;
          item.pia += num(eg['MTO_PIA']);
          item.modif += num(eg['MTO_MODIF']);
          item.pim += num(eg['MTO_PIM']);
          item.certif += num(eg['MTO_CERTIF']);
          item.cpanua += num(eg['MTO_CPANUA']);
          item.atcp += sumMonthly(eg, 'MTO_ATCP');
          item.devengado += sumMonthly(eg, 'MTO_DEV');
          item.girado += sumMonthly(eg, 'MTO_GIR');
        });
        rows = Array.from(grouped.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
      }

      else if (type === 'certificado') {
        const grouped = new Map<string, {
          ano_eje: string;
          certif: string;
          sec_func: string;
          rubro: string;
          clasif: string;
          certificado: number;
          compromiso: number;
        }>();
        certificado.filter(c => str(c['ANO_EJE']) === year && str(c['SEC_EJEC']) === SEC_EJEC)
          .forEach(c => {
            const key = `${str(c['CERTIF'])}-${str(c['SEC_FUNC'])}-${str(c['RUBRO'])}-${str(c['CLASIF'])}`;
            if (!grouped.has(key)) {
              grouped.set(key, {
                ano_eje: year,
                certif: str(c['CERTIF']),
                sec_func: str(c['SEC_FUNC']),
                rubro: str(c['RUBRO']),
                clasif: `${str(c['CLASIF'])}     ${clasifMap.get(str(c['CLASIF'])) || ''}`.trim(),
                certificado: 0, compromiso: 0
              });
            }
            const item = grouped.get(key)!;
            const etapa = str(c['ETAPA']);
            const mto = num(c['MONTO']);
            if (etapa === 'CERTIFICACIÓN') item.certificado += mto;
            if (etapa === 'COMPROMISO ANUA') item.compromiso += mto;
          });
        rows = Array.from(grouped.values()).map(r => ({
          ...r,
          saldo: r.certificado - r.compromiso
        })).sort((a, b) => a.certif.localeCompare(b.certif));
      }

      else if (type === 'data_certificados' || type === 'meta_certificados') {
        rows = certificado.filter(c => str(c['ANO_EJE']) === year && str(c['SEC_EJEC']) === SEC_EJEC)
          .map(c => {
            const m = metaMap.get(str(c['SEC_FUNC']));
            return {
              ano_eje: year,
              sec_ejec: SEC_EJEC,
              certif: str(c['CERTIF']),
              secuencia: str(c['SECUENCIA']),
              correlat: str(c['CORRELAT']),
              rubro: str(c['RUBRO']),
              cod_doc: str(c['COD_DOC']),
              num_doc: str(c['NUM_DOC']),
              fecha_doc: str(c['FECHA_DOC']),
              proveedor: str(c['PROVEEDOR']),
              clasif: str(c['CLASIF']),
              clasif_nombre: clasifMap.get(str(c['CLASIF'])) || '',
              sec_func: str(c['SEC_FUNC']),
              meta_nombre: m ? str(m['NOMBRE']) : '',
              monto: num(c['MONTO']),
              fec_proc: str(c['FEC_PROC']),
              tipo_reg: str(c['TIPO_REG']),
              est_env: str(c['EST_ENV']),
              est_reg: str(c['EST_REG'])
            };
          }).sort((a, b) => a.certif.localeCompare(b.certif) || a.secuencia.localeCompare(b.secuencia) || a.correlat.localeCompare(b.correlat));
      }

      else if (type === 'data_devengados' || type === 'meta_devengados' || type === 'programa_devengados' || type === 'programa_accion_inversion') {
        rows = expedientes.filter(eg => str(eg['FASE']) === 'D' && str(eg['ANO_EJE']) === year && str(eg['SEC_EJEC']) === SEC_EJEC)
          .map(eg => {
            const secFunc = str(eg['SEC_FUNC']);
            const m = metaMap.get(secFunc);
            const ruc = str(eg['PROVEEDOR']);
            const npBenefici = npMap.get(`${str(eg['EXPEDIENTE'])}-${str(eg['NUM_DOC'])}`);
            const fallbackBenef = ruc === '0' ? 'CARRASCO MARTINEZ MARIA HERLINDA' : (provMap.get(ruc) || ruc);
            const beneficiario = npBenefici || fallbackBenef;
            const prog = m ? str(m['PROGRAMA']) : '';
            const ppMatch = programa.find(p => str(p['PROGPPTO']) === prog && str(p['ANO_EJE']) === year);

            let groupKey = secFunc;
            if (type === 'programa_devengados') {
              groupKey = m ? str(m['PROGRAMA']) : '';
            } else if (type === 'programa_accion_inversion') {
              groupKey = m ? str(m['ACT_PROY']) : '';
            }

            return {
              ano_eje: year,
              mes_eje: str(eg['MES_EJE']),
              group_key: groupKey,
              prog_key: prog,
              proyecto: m ? str(m['ACT_PROY']) : '',
              prog_nombre: ppMatch ? str(ppMatch['NOMBRE']) : '',
              expediente: str(eg['EXPEDIENTE']),
              tipo_op: str(eg['TIPO_OP']),
              sec_reg: str(eg['SEC_REG']),
              corr: str(eg['CORR']),
              rb: str(eg['RB']),
              tr: str(eg['TR']),
              cod_doc: str(eg['COD_DOC']),
              num_doc: str(eg['NUM_DOC']),
              fecha_doc: str(eg['FECHA_DOC']),
              proveedor_nombre: beneficiario,
              proveedor_ruc: ruc,
              clasificad: str(eg['CLASIFICAD']),
              clasif_nombre: clasifMap.get(str(eg['CLASIFICAD'])) || '',
              sec_func: secFunc,
              meta_nombre: m ? str(m['NOMBRE']) : '',
              monto: num(eg['MONTO']),
              fec_aprob: str(eg['FEC_APROB']),
              estado: str(eg['EST_REG']),
              certif: str(eg['CERTIF']),
              certif_sec: str(eg['CERTIF_SEC']),
              oper: str(eg['TIPO_OP']),
              mod: str(eg['MOD_COMPRA']),
              ciclo: str(eg['CICLO']),
              fase: str(eg['FASE']),
              cod: str(eg['COD_DOC']),
              tp: str(eg['TP']),
              tc: str(eg['TC']),
              proveedor: beneficiario
            };
          }).sort((a, b) => a.mes_eje.localeCompare(b.mes_eje) || a.expediente.localeCompare(b.expediente) || a.sec_reg.localeCompare(b.sec_reg));

        if (type === 'programa_accion_inversion') {
          rows = rows.filter(r => str(r.proyecto).startsWith('4'));
        }
      }

      else if (type === 'data_girados') {
        rows = expedientes.filter(eg => str(eg['FASE']) === 'G' && str(eg['ANO_EJE']) === year && str(eg['SEC_EJEC']) === SEC_EJEC)
          .map(eg => {
            const secFunc = str(eg['SEC_FUNC']);
            const m = metaMap.get(secFunc);
            const ruc = str(eg['PROVEEDOR']);
            const npBenefici = npMap.get(`${str(eg['EXPEDIENTE'])}-${str(eg['NUM_DOC'])}`);
            const fallbackBenef = ruc === '0' ? 'CARRASCO MARTINEZ MARIA HERLINDA' : (provMap.get(ruc) || ruc);
            const beneficiario = npBenefici || fallbackBenef;

            return {
              ano: year,
              mes: str(eg['MES_EJE']),
              expediente: str(eg['EXPEDIENTE']),
              tipo: str(eg['TIPO_OP']),
              c: str(eg['CICLO']),
              f: str(eg['FASE']),
              secuen: str(eg['SEC_REG']),
              corr: str(eg['CORR']),
              rb: str(eg['RB']),
              tr: str(eg['TR']),
              cod: str(eg['COD_DOC']),
              num_doc: str(eg['NUM_DOC']),
              fecha_doc: str(eg['FECHA_DOC']),
              tp: str(eg['TP']),
              tc: str(eg['TC']),
              ano_banco: str(eg['ANO_BANCO']),
              banco: str(eg['BANCO']),
              cta_cte: str(eg['CTA_CTE']),
              beneficiario,
              clasificad: str(eg['CLASIFICAD']),
              sec_func: m ? `${str(m['SEC_FUNC'])} ${str(m['NOMBRE'])}`.trim() : secFunc,
              alignment: {}, // temporary placeholder to ease structure matching
              tipo_gir: str(eg['TIPO_GIR']),
              cod_b: str(eg['COD_DOC_B']),
              num_doc_b: str(eg['NUM_DOC_B']),
              fec_doc_b: str(eg['FEC_DOC_B']),
              monto: num(eg['MONTO']),
              fec_aprob: str(eg['FEC_APROB']),
              sec_est: str(eg['SEC_EST']),
              est_reg: str(eg['EST_REG']),
              certif: str(eg['CERTIF']),
              certif_sec: str(eg['CERTIF_SEC'])
            };
          }).sort((a, b) => a.mes.localeCompare(b.mes) || a.expediente.localeCompare(b.expediente) || a.secuen.localeCompare(b.secuen));
      }

      else if (type === 'ejecucion_activ_obra_accinv') {
        const grouped = new Map<string, {
          codigo: string;
          nombre: string;
          pia: number;
          modif: number;
          pim: number;
          certif: number;
          cpanua: number;
          atcp: number;
          devengado: number;
          girado: number;
        }>();
        const actObraMap = new Map<string, string>();
        activObra.filter(ao => str(ao['ANO_EJE']) === year && str(ao['SEC_EJEC']) === SEC_EJEC)
          .forEach(ao => actObraMap.set(str(ao['ACTOBRACIN']), str(ao['NOMBRE'])));

        filterEjec.forEach(eg => {
          const secFunc = str(eg['SEC_FUNC']);
          const m = metaMap.get(secFunc);
          if (!m) return;
          const actProy = str(m['ACT_PROY']);
          if (!actObraMap.has(actProy)) return;
          
          if (!grouped.has(actProy)) {
            grouped.set(actProy, {
              codigo: actProy,
              nombre: actObraMap.get(actProy) || '',
              pia: 0, modif: 0, pim: 0, certif: 0, cpanua: 0, atcp: 0, devengado: 0, girado: 0
            });
          }
          const item = grouped.get(actProy)!;
          item.pia += num(eg['MTO_PIA']);
          item.modif += num(eg['MTO_MODIF']);
          item.pim += num(eg['MTO_PIM']);
          item.certif += num(eg['MTO_CERTIF']);
          item.cpanua += num(eg['MTO_CPANUA']);
          item.atcp += sumMonthly(eg, 'MTO_ATCP');
          item.devengado += sumMonthly(eg, 'MTO_DEV');
          item.girado += sumMonthly(eg, 'MTO_GIR');
        });
        rows = Array.from(grouped.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
      }

      else if (type === 'ejecucion_actproy') {
        const grouped = new Map<string, {
          codigo: string;
          nombre: string;
          pia: number;
          modif: number;
          pim: number;
          certif: number;
          cpanua: number;
          atcp: number;
          devengado: number;
          girado: number;
        }>();
        const prodMap = new Map<string, string>();
        producto.filter(p => str(p['ANO_EJE']) === year && str(p['SEC_EJEC']) === SEC_EJEC)
          .forEach(p => prodMap.set(str(p['ACT_PROY']), str(p['NOMBRE'])));

        filterEjec.forEach(eg => {
          const secFunc = str(eg['SEC_FUNC']);
          const m = metaMap.get(secFunc);
          if (!m) return;
          const actProy = str(m['ACT_PROY']);
          if (!prodMap.has(actProy)) return;

          if (!grouped.has(actProy)) {
            grouped.set(actProy, {
              codigo: actProy,
              nombre: prodMap.get(actProy) || '',
              pia: 0, modif: 0, pim: 0, certif: 0, cpanua: 0, atcp: 0, devengado: 0, girado: 0
            });
          }
          const item = grouped.get(actProy)!;
          item.pia += num(eg['MTO_PIA']);
          item.modif += num(eg['MTO_MODIF']);
          item.pim += num(eg['MTO_PIM']);
          item.certif += num(eg['MTO_CERTIF']);
          item.cpanua += num(eg['MTO_CPANUA']);
          item.atcp += sumMonthly(eg, 'MTO_ATCP');
          item.devengado += sumMonthly(eg, 'MTO_DEV');
          item.girado += sumMonthly(eg, 'MTO_GIR');
        });
        rows = Array.from(grouped.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
      }

      else if (type === 'ejecucion_ppto') {
        const grouped = new Map<string, {
          codigo: string;
          nombre: string;
          pia: number;
          modif: number;
          pim: number;
          certif: number;
          cpanua: number;
          atcp: number;
          devengado: number;
          girado: number;
        }>();
        const progMap = new Map<string, string>();
        programa.filter(p => str(p['ANO_EJE']) === year)
          .forEach(p => progMap.set(str(p['PROGPPTO']), str(p['NOMBRE'])));

        filterEjec.forEach(eg => {
          const secFunc = str(eg['SEC_FUNC']);
          const m = metaMap.get(secFunc);
          if (!m) return;
          const progCode = str(m['PROGRAMA']);
          if (!progMap.has(progCode)) return;

          if (!grouped.has(progCode)) {
            grouped.set(progCode, {
              codigo: progCode,
              nombre: progMap.get(progCode) || '',
              pia: 0, modif: 0, pim: 0, certif: 0, cpanua: 0, atcp: 0, devengado: 0, girado: 0
            });
          }
          const item = grouped.get(progCode)!;
          item.pia += num(eg['MTO_PIA']);
          item.modif += num(eg['MTO_MODIF']);
          item.pim += num(eg['MTO_PIM']);
          item.certif += num(eg['MTO_CERTIF']);
          item.cpanua += num(eg['MTO_CPANUA']);
          item.atcp += sumMonthly(eg, 'MTO_ATCP');
          item.devengado += sumMonthly(eg, 'MTO_DEV');
          item.girado += sumMonthly(eg, 'MTO_GIR');
        });
        rows = Array.from(grouped.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
      }

      else if (type === 'ejecucion_metas_clasificador') {
        const grouped = new Map<string, {
          meta_codigo: string;
          meta_nombre: string;
          rubro_codigo: string;
          rubro_nombre: string;
          clasif_codigo: string;
          clasif_nombre: string;
          pia: number;
          modif: number;
          pim: number;
          certif: number;
          cpanua: number;
          atcp: number;
          devengado: number;
          girado: number;
        }>();
        filterEjec.forEach(eg => {
          const secFunc = str(eg['SEC_FUNC']);
          const m = metaMap.get(secFunc);
          if (!m) return;
          const metaCode = str(m['SEC_FUNC']);
          const rubCode = str(eg['RUBRO']);
          const clCode = str(eg['CLASIFICAD']);
          const key = `${metaCode}-${rubCode}-${clCode}`;

          if (!grouped.has(key)) {
            grouped.set(key, {
              meta_codigo: metaCode,
              meta_nombre: str(m['NOMBRE']),
              rubro_codigo: rubCode,
              rubro_nombre: rubroMap.get(rubCode) || '',
              clasif_codigo: clCode,
              clasif_nombre: clasifMap.get(clCode) || '',
              pia: 0, modif: 0, pim: 0, certif: 0, cpanua: 0, atcp: 0, devengado: 0, girado: 0
            });
          }
          const item = grouped.get(key)!;
          item.pia += num(eg['MTO_PIA']);
          item.modif += num(eg['MTO_MODIF']);
          item.pim += num(eg['MTO_PIM']);
          item.certif += num(eg['MTO_CERTIF']);
          item.cpanua += num(eg['MTO_CPANUA']);
          item.atcp += sumMonthly(eg, 'MTO_ATCP');
          item.devengado += sumMonthly(eg, 'MTO_DEV');
          item.girado += sumMonthly(eg, 'MTO_GIR');
        });
        rows = Array.from(grouped.values()).sort((a, b) => a.meta_codigo.localeCompare(b.meta_codigo) || a.rubro_codigo.localeCompare(b.rubro_codigo) || a.clasif_codigo.localeCompare(b.clasif_codigo));
      }

      else if (type === 'ejecucion_ppto_meta') {
        const grouped = new Map<string, {
          prog_codigo: string;
          prog_nombre: string;
          meta_codigo: string;
          meta_nombre: string;
          pia: number;
          modif: number;
          pim: number;
          certif: number;
          cpanua: number;
          atcp: number;
          devengado: number;
          girado: number;
        }>();
        const progMap = new Map<string, string>();
        programa.filter(p => str(p['ANO_EJE']) === year)
          .forEach(p => progMap.set(str(p['PROGPPTO']), str(p['NOMBRE'])));

        filterEjec.forEach(eg => {
          const secFunc = str(eg['SEC_FUNC']);
          const m = metaMap.get(secFunc);
          if (!m) return;
          const progCode = str(m['PROGRAMA']);
          const metaCode = str(m['SEC_FUNC']);
          const key = `${progCode}-${metaCode}`;

          if (!grouped.has(key)) {
            grouped.set(key, {
              prog_codigo: progCode,
              prog_nombre: progMap.get(progCode) || '',
              meta_codigo: metaCode,
              meta_nombre: str(m['NOMBRE']),
              pia: 0, modif: 0, pim: 0, certif: 0, cpanua: 0, atcp: 0, devengado: 0, girado: 0
            });
          }
          const item = grouped.get(key)!;
          item.pia += num(eg['MTO_PIA']);
          item.modif += num(eg['MTO_MODIF']);
          item.pim += num(eg['MTO_PIM']);
          item.certif += num(eg['MTO_CERTIF']);
          item.cpanua += num(eg['MTO_CPANUA']);
          item.atcp += sumMonthly(eg, 'MTO_ATCP');
          item.devengado += sumMonthly(eg, 'MTO_DEV');
          item.girado += sumMonthly(eg, 'MTO_GIR');
        });
        rows = Array.from(grouped.values()).sort((a, b) => a.prog_codigo.localeCompare(b.prog_codigo) || a.meta_codigo.localeCompare(b.meta_codigo));
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HIERARCHICAL FLATTENING (Meta/Rubro/Clasificador structures)
    // ─────────────────────────────────────────────────────────────────────────
    if (type === 'ejecucion_metas_clasificador') {
      // Deconstruct the sorted rows into structured hierarchical rows
      const flatRows: Record<string, unknown>[] = [];
      const metas = new Map<string, {
        pia: number;
        modif: number;
        pim: number;
        certif: number;
        cpanua: number;
        atcp: number;
        devengado: number;
        girado: number;
        name: string;
        children: Map<string, {
          pia: number;
          modif: number;
          pim: number;
          certif: number;
          cpanua: number;
          atcp: number;
          devengado: number;
          girado: number;
          name: string;
          children: Record<string, unknown>[];
        }>;
      }>();

      rows.forEach(r => {
        const mCode = String(r.meta_codigo);
        const rCode = String(r.rubro_codigo);
        if (!metas.has(mCode)) {
          metas.set(mCode, {
            pia: 0, modif: 0, pim: 0, certif: 0, cpanua: 0, atcp: 0, devengado: 0, girado: 0,
            name: String(r.meta_nombre),
            children: new Map()
          });
        }
        const m = metas.get(mCode)!;
        m.pia += num(r.pia); m.modif += num(r.modif); m.pim += num(r.pim);
        m.certif += num(r.certif); m.cpanua += num(r.cpanua); m.atcp += num(r.atcp);
        m.devengado += num(r.devengado); m.girado += num(r.girado);

        if (!m.children.has(rCode)) {
          m.children.set(rCode, {
            pia: 0, modif: 0, pim: 0, certif: 0, cpanua: 0, atcp: 0, devengado: 0, girado: 0,
            name: String(r.rubro_nombre),
            children: []
          });
        }
        const rub = m.children.get(rCode)!;
        rub.pia += num(r.pia); rub.modif += num(r.modif); rub.pim += num(r.pim);
        rub.certif += num(r.certif); rub.cpanua += num(r.cpanua); rub.atcp += num(r.atcp);
        rub.devengado += num(r.devengado); rub.girado += num(r.girado);

        rub.children.push(r);
      });

      for (const [mCode, mData] of Array.from(metas.entries()).sort()) {
        const mPim = mData.pim;
        const mDev = mData.devengado;
        // Meta Row
        flatRows.push({
          codigo: mCode,
          nombre: mData.name,
          pia: mData.pia,
          modif: mData.modif,
          pim: mPim,
          certif: mData.certif,
          cpanua: mData.cpanua,
          atcp: mData.atcp,
          devengado: mDev,
          girado: mData.girado,
          saldo: mPim - mDev,
          avance: mPim > 0 ? mDev / mPim : 0
        });

        for (const [rCode, rData] of Array.from(mData.children.entries()).sort()) {
          const rPim = rData.pim;
          const rDev = rData.devengado;
          // Rubro Row
          flatRows.push({
            codigo: '',
            nombre: `${rCode} ${rData.name}`.trim(),
            pia: rData.pia,
            modif: rData.modif,
            pim: rPim,
            certif: rData.certif,
            cpanua: rData.cpanua,
            atcp: rData.atcp,
            devengado: rDev,
            girado: rData.girado,
            saldo: rPim - rDev,
            avance: rPim > 0 ? rDev / rPim : 0
          });

          rData.children.forEach((cItem: Record<string, unknown>) => {
            const cPim = num(cItem.pim);
            const cDev = num(cItem.devengado);
            // Clasificador Row
            flatRows.push({
              codigo: '',
              nombre: `${cItem.clasif_codigo}     ${cItem.clasif_nombre}`.trim(),
              pia: num(cItem.pia),
              modif: num(cItem.modif),
              pim: cPim,
              certif: num(cItem.certif),
              cpanua: num(cItem.cpanua),
              atcp: num(cItem.atcp),
              devengado: cDev,
              girado: num(cItem.girado),
              saldo: cPim - cDev,
              avance: cPim > 0 ? cDev / cPim : 0
            });
          });
        }
      }
      rows = flatRows;
    }

    else if (type === 'ejecucion_ppto_meta') {
      const flatRows: Record<string, unknown>[] = [];
      const progs = new Map<string, {
        pia: number;
        modif: number;
        pim: number;
        certif: number;
        cpanua: number;
        atcp: number;
        devengado: number;
        girado: number;
        name: string;
        children: Record<string, unknown>[];
      }>();

      rows.forEach(r => {
        const pCode = String(r.prog_codigo);
        if (!progs.has(pCode)) {
          progs.set(pCode, {
            pia: 0, modif: 0, pim: 0, certif: 0, cpanua: 0, atcp: 0, devengado: 0, girado: 0,
            name: String(r.prog_nombre),
            children: []
          });
        }
        const p = progs.get(pCode)!;
        p.pia += num(r.pia); p.modif += num(r.modif); p.pim += num(r.pim);
        p.certif += num(r.certif); p.cpanua += num(r.cpanua); p.atcp += num(r.atcp);
        p.devengado += num(r.devengado); p.girado += num(r.girado);
        p.children.push(r);
      });

      for (const [pCode, pData] of Array.from(progs.entries()).sort()) {
        const pPim = pData.pim;
        const pDev = pData.devengado;
        // Program Row
        flatRows.push({
          codigo: pCode,
          nombre: pData.name,
          pia: pData.pia,
          modif: pData.modif,
          pim: pPim,
          certif: pData.certif,
          cpanua: pData.cpanua,
          atcp: pData.atcp,
          devengado: pDev,
          girado: pData.girado,
          saldo: pPim - pDev,
          avance: pPim > 0 ? pDev / pPim : 0
        });

        pData.children.forEach(cItem => {
          const cPim = num(cItem.pim);
          const cDev = num(cItem.devengado);
          // Meta Row
          flatRows.push({
            codigo: '',
            nombre: `${cItem.meta_codigo} ${cItem.meta_nombre}`.trim(),
            pia: num(cItem.pia),
            modif: num(cItem.modif),
            pim: cPim,
            certif: num(cItem.certif),
            cpanua: num(cItem.cpanua),
            atcp: num(cItem.atcp),
            devengado: cDev,
            girado: num(cItem.girado),
            saldo: cPim - cDev,
            avance: cPim > 0 ? cDev / cPim : 0
          });
        });
      }
      rows = flatRows;
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
