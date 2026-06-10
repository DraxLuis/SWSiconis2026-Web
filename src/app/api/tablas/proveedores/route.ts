import { NextResponse } from 'next/server';
import { trySQL, str } from '@/lib/db';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    let query = `SELECT ruc, nombre, direccion FROM [proveedor] WHERE 1=1`;
    const params: Record<string, unknown> = {};

    if (search) {
      query += ` AND (ruc LIKE @search OR nombre LIKE @search OR direccion LIKE @search)`;
      params.search = `%${search}%`;
    }

    query += ` ORDER BY nombre ASC`;

    const allRows = await trySQL(query, params);
    if (!allRows) {
      throw new Error('Database query returned null.');
    }

    const total = allRows.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedRows = allRows.slice(startIndex, startIndex + pageSize).map(r => ({
      ruc: str(r.ruc),
      nombre: str(r.nombre),
      direccion: str(r.direccion)
    }));

    return NextResponse.json({
      success: true,
      rows: paginatedRows,
      total,
      page,
      pageSize
    });
  } catch (error) {
    console.error('Error in /api/tablas/proveedores GET:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
        for (const p of data) {
          const rucVal = str(p.ruc || p.RUC);
          const nombreVal = str(p.nombre || p.NOMBRE);
          const dirVal = str(p.direccion || p.DIRECCION);

          if (!rucVal || !nombreVal) continue;

          const req = new mssql.default.Request(transaction);
          req.input('ruc', mssql.default.VarChar(11), rucVal);
          req.input('nombre', mssql.default.VarChar(250), nombreVal);
          req.input('direccion', mssql.default.VarChar(250), dirVal);

          // Update if exists, else insert
          await req.query(`
            IF EXISTS (SELECT * FROM [proveedor] WHERE ruc = @ruc)
              UPDATE [proveedor] SET nombre = @nombre, direccion = @direccion WHERE ruc = @ruc
            ELSE
              INSERT INTO [proveedor] (ruc, nombre, direccion) VALUES (@ruc, @nombre, @direccion)
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
      const ruc = str(body.ruc);
      const nombre = str(body.nombre);
      const direccion = str(body.direccion);

      if (!ruc || !nombre) {
        return NextResponse.json({ success: false, error: 'RUC and Nombre are required.' }, { status: 400 });
      }

      // Check if duplicate
      const duplicate = await trySQL(`SELECT * FROM [proveedor] WHERE ruc = @ruc`, { ruc });
      if (duplicate && duplicate.length > 0) {
        return NextResponse.json({ success: false, error: 'A provider with this RUC already exists.' }, { status: 400 });
      }

      await trySQL(
        `INSERT INTO [proveedor] (ruc, nombre, direccion) VALUES (@ruc, @nombre, @direccion)`,
        { ruc, nombre, direccion }
      );
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error in /api/tablas/proveedores POST:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const ruc = str(body.ruc);
    const nombre = str(body.nombre);
    const direccion = str(body.direccion);

    if (!ruc || !nombre) {
      return NextResponse.json({ success: false, error: 'RUC and Nombre are required.' }, { status: 400 });
    }

    await trySQL(
      `UPDATE [proveedor] SET nombre = @nombre, direccion = @direccion WHERE ruc = @ruc`,
      { ruc, nombre, direccion }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in /api/tablas/proveedores PUT:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ruc = str(searchParams.get('ruc'));

    if (!ruc) {
      return NextResponse.json({ success: false, error: 'RUC is required.' }, { status: 400 });
    }

    await trySQL(`DELETE FROM [proveedor] WHERE ruc = @ruc`, { ruc });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in /api/tablas/proveedores DELETE:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
