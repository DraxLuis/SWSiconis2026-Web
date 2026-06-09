import { NextResponse } from 'next/server';
import { loadTable, num, str, getAño, SEC_EJEC } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const activeAño = getAño();
  try {
    const gastos = loadTable('presupuesto_ejecucion_gasto');
    const rubros = loadTable('rubro');

    const filtered = gastos.filter(r => {
      const ano = str(r['ANO_EJE'] ?? r['ANO_PROC']);
      const ejec = str(r['SEC_EJEC']);
      return (ano === activeAño || ano === '') && (!ejec || ejec === SEC_EJEC);
    });

    const cards = filtered.reduce<{
      total_pia: number; total_pim: number; total_certif: number;
      total_comprometido: number; total_devengado: number; total_girado: number;
    }>((acc, r) => {
      acc.total_pia += num(r['MTO_PIA']);
      acc.total_pim += num(r['MTO_PIM']);
      acc.total_certif += num(r['MTO_CERTIF']);
      acc.total_comprometido += num(r['MTO_CPANUA']);
      for (let m = 1; m <= 12; m++) {
        const mk = m.toString().padStart(2, '0');
        acc.total_devengado += num(r[`MTO_DEV_${mk}`]);
        acc.total_girado += num(r[`MTO_GIR_${mk}`]);
      }
      return acc;
    }, { total_pia: 0, total_pim: 0, total_certif: 0, total_comprometido: 0, total_devengado: 0, total_girado: 0 });

    // Monthly trend
    const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'];
    const months = monthNames.map((name, i) => {
      const mk = (i + 1).toString().padStart(2, '0');
      const devengado = filtered.reduce((s, r) => s + num(r[`MTO_DEV_${mk}`]), 0);
      const girado = filtered.reduce((s, r) => s + num(r[`MTO_GIR_${mk}`]), 0);
      return { name, devengado, girado };
    });

    const rubrosList = rubros
      .filter(r => str(r['ANO_EJE']) === activeAño)
      .map(r => ({ codigo: str(r['FUENTE_FIN']), nombre: str(r['NOMBRE']) }))
      .filter((r, i, arr) => arr.findIndex(x => x.codigo === r.codigo) === i);

    return NextResponse.json({ success: true, cards, months, rubros: rubrosList });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
