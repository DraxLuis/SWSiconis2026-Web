import { NextResponse } from 'next/server';
import { trySQL, str, getAño, SEC_EJEC } from '@/lib/db';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const activeAño = getAño();
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    let query = `
      SELECT id, ANO_EJE, SEC_EJEC, COD_DOC, NUM_DOC, NOMBRE 
      FROM [documentos_giros] 
      WHERE ANO_EJE = @ano AND SEC_EJEC = @sec
    `;
    const params: Record<string, unknown> = {
      ano: activeAño,
      sec: SEC_EJEC
    };

    if (search) {
      query += ` AND (COD_DOC LIKE @search OR NUM_DOC LIKE @search OR NOMBRE LIKE @search)`;
      params.search = `%${search}%`;
    }

    query += ` ORDER BY id DESC`;

    const allRows = await trySQL(query, params);
    if (!allRows) {
      throw new Error('Database query returned null.');
    }

    const total = allRows.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedRows = allRows.slice(startIndex, startIndex + pageSize).map(r => ({
      id: Number(r.id),
      ano_eje: str(r.ANO_EJE),
      sec_ejec: str(r.SEC_EJEC),
      cod_doc: str(r.COD_DOC),
      num_doc: str(r.NUM_DOC),
      nombre: str(r.NOMBRE)
    }));

    return NextResponse.json({
      success: true,
      rows: paginatedRows,
      total,
      page,
      pageSize
    });
  } catch (error) {
    console.error('Error in /api/tablas/documentos-giros GET:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const activeAño = getAño();
  try {
    const body = await request.json();
    const isImport = body.isImport === true;

    if (isImport) {
      const { data } = body;
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
      const transaction = new mssql.default.Transaction(pool);
      await transaction.begin();

      try {
        for (const doc of data) {
          const codDocVal = str(doc.cod_doc || doc.COD_DOC);
          const numDocVal = str(doc.num_doc || doc.NUM_DOC);
          const nombreVal = str(doc.nombre || doc.NOMBRE);

          if (!codDocVal || !numDocVal || !nombreVal) continue;

          const req = new mssql.default.Request(transaction);
          req.input('ano', mssql.default.VarChar(4), activeAño);
          req.input('sec', mssql.default.VarChar(6), SEC_EJEC);
          req.input('cod_doc', mssql.default.VarChar(3), codDocVal);
          req.input('num_doc', mssql.default.VarChar(15), numDocVal);
          req.input('nombre', mssql.default.VarChar(250), nombreVal);

          // Update if exists, else insert
          await req.query(`
            IF EXISTS (SELECT * FROM [documentos_giros] WHERE ANO_EJE = @ano AND SEC_EJEC = @sec AND COD_DOC = @cod_doc AND NUM_DOC = @num_doc)
              UPDATE [documentos_giros] SET NOMBRE = @nombre WHERE ANO_EJE = @ano AND SEC_EJEC = @sec AND COD_DOC = @cod_doc AND NUM_DOC = @num_doc
            ELSE
              INSERT INTO [documentos_giros] (ANO_EJE, SEC_EJEC, COD_DOC, NUM_DOC, NOMBRE) VALUES (@ano, @sec, @cod_doc, @num_doc, @nombre)
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
    } else {
      const cod_doc = str(body.cod_doc);
      const num_doc = str(body.num_doc);
      const nombre = str(body.nombre);

      if (!cod_doc || !num_doc || !nombre) {
        return NextResponse.json({ success: false, error: 'Código, Número Doc. and Nombre are required.' }, { status: 400 });
      }

      // Check duplicate
      const duplicate = await trySQL(
        `SELECT * FROM [documentos_giros] WHERE ANO_EJE = @ano AND SEC_EJEC = @sec AND COD_DOC = @cod_doc AND NUM_DOC = @num_doc`,
        { ano: activeAño, sec: SEC_EJEC, cod_doc, num_doc }
      );
      if (duplicate && duplicate.length > 0) {
        return NextResponse.json({ success: false, error: 'A document with this Code and Number already exists.' }, { status: 400 });
      }

      await trySQL(
        `INSERT INTO [documentos_giros] (ANO_EJE, SEC_EJEC, COD_DOC, NUM_DOC, NOMBRE) VALUES (@ano, @sec, @cod_doc, @num_doc, @nombre)`,
        { ano: activeAño, sec: SEC_EJEC, cod_doc, num_doc, nombre }
      );
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error in /api/tablas/documentos-giros POST:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const activeAño = getAño();
  try {
    const body = await request.json();
    const id = Number(body.id);
    const cod_doc = str(body.cod_doc);
    const num_doc = str(body.num_doc);
    const nombre = str(body.nombre);

    if (!id || !cod_doc || !num_doc || !nombre) {
      return NextResponse.json({ success: false, error: 'ID, Código, Número Doc. and Nombre are required.' }, { status: 400 });
    }

    await trySQL(
      `UPDATE [documentos_giros] 
       SET COD_DOC = @cod_doc, NUM_DOC = @num_doc, NOMBRE = @nombre 
       WHERE id = @id AND ANO_EJE = @ano AND SEC_EJEC = @sec`,
      { id, cod_doc, num_doc, nombre, ano: activeAño, sec: SEC_EJEC }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in /api/tablas/documentos-giros PUT:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const activeAño = getAño();
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required.' }, { status: 400 });
    }

    await trySQL(
      `DELETE FROM [documentos_giros] WHERE id = @id AND ANO_EJE = @ano AND SEC_EJEC = @sec`,
      { id, ano: activeAño, sec: SEC_EJEC }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in /api/tablas/documentos-giros DELETE:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
