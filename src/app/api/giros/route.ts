import { NextResponse } from 'next/server';
import { loadTable, str, AÑO, SEC_EJEC } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const giros = loadTable('documentos_giros');

    const filtered = giros.filter(r => {
      const ano = str(r['ANO_EJE']);
      const ejec = str(r['SEC_EJEC']);
      if (ano !== AÑO && ano !== '') return false;
      if (ejec && ejec !== SEC_EJEC) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!str(r['NOMBRE']).toLowerCase().includes(q) &&
            !str(r['NUM_DOC']).includes(q) &&
            !str(r['COD_DOC']).includes(q)) return false;
      }
      return true;
    });

    const rows = filtered.map(r => ({
      ano_eje: str(r['ANO_EJE']),
      sec_ejec: str(r['SEC_EJEC']),
      cod_doc: str(r['COD_DOC']),
      num_doc: str(r['NUM_DOC']),
      nombre: str(r['NOMBRE']),
    }));

    rows.sort((a, b) => b.num_doc.localeCompare(a.num_doc));

    const total = rows.length;
    const paginated = rows.slice((page - 1) * pageSize, page * pageSize);

    return NextResponse.json({ success: true, rows: paginated, total, page, pageSize });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
