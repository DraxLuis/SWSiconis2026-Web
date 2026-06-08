import { NextResponse } from 'next/server';
import { loadTable, preloadTables, str, AÑO, SEC_EJEC } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const filterPrograma = searchParams.get('programa') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // Preload tables from SQL Server
    await preloadTables(['meta', 'documentos_giros', 'expedientes_gastos_2026', 'nota_pago']);

    const giros = loadTable('documentos_giros');
    const expedientesGastos = loadTable('expedientes_gastos_2026');
    const notaPago = loadTable('nota_pago');
    const metas = loadTable('meta');

    // Map SEC_FUNC -> PPTO (Program code)
    const metaProgramMap = new Map<string, string>();
    metas.filter(m => str(m['ANO_EJE']) === AÑO && str(m['SEC_EJEC']) === SEC_EJEC)
      .forEach(m => metaProgramMap.set(str(m['SEC_FUNC']), str(m['PPTO'])));

    // Map giro NUM_DOC -> Set of program codes (via expedientes_gastos_2026 and meta)
    const docPrograms = new Map<string, Set<string>>();
    expedientesGastos.filter(eg => str(eg['FASE']) === 'G')
      .forEach(eg => {
        const numDoc = str(eg['NUM_DOC']);
        const secFunc = str(eg['SEC_FUNC']);
        const progCode = metaProgramMap.get(secFunc) || '';
        if (numDoc && progCode) {
          if (!docPrograms.has(numDoc)) {
            docPrograms.set(numDoc, new Set());
          }
          docPrograms.get(numDoc)!.add(progCode);
        }
      });

    // Map giro NUM_DOC -> Glosa (from nota_pago)
    const glosaMap = new Map<string, string>();
    notaPago.forEach(np => {
      const numDoc = str(np['NUM_DOC']);
      const glosa = str(np['GLOSA']);
      if (numDoc && glosa) {
        glosaMap.set(numDoc, glosa);
      }
    });

    const filtered = giros.filter(r => {
      const ano = str(r['ANO_EJE']);
      const ejec = str(r['SEC_EJEC']);
      if (ano !== AÑO && ano !== '') return false;
      if (ejec && ejec !== SEC_EJEC) return false;
      
      const numDoc = str(r['NUM_DOC']);

      // Filter by program code if requested
      if (filterPrograma) {
        const progs = docPrograms.get(numDoc);
        if (!progs || !progs.has(filterPrograma)) return false;
      }

      if (search) {
        const q = search.toLowerCase();
        const glosa = glosaMap.get(numDoc) || '';
        if (!str(r['NOMBRE']).toLowerCase().includes(q) &&
            !numDoc.includes(q) &&
            !glosa.toLowerCase().includes(q) &&
            !str(r['COD_DOC']).includes(q)) return false;
      }
      return true;
    });

    const rows = filtered.map(r => {
      const numDoc = str(r['NUM_DOC']);
      return {
        ano_eje: str(r['ANO_EJE']),
        sec_ejec: str(r['SEC_EJEC']),
        cod_doc: str(r['COD_DOC']),
        num_doc: numDoc,
        nombre: str(r['NOMBRE']),
        glosa: glosaMap.get(numDoc) || '',
      };
    });

    rows.sort((a, b) => b.num_doc.localeCompare(a.num_doc));

    const total = rows.length;
    const paginated = rows.slice((page - 1) * pageSize, page * pageSize);

    return NextResponse.json({ success: true, rows: paginated, total, page, pageSize });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
