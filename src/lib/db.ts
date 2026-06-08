import path from 'path';
import fs from 'fs';

// ============================================================
// DATA LAYER — reads JSON files exported from DBF
// Falls back gracefully if SQL Server is not configured
// ============================================================

const DATA_DIR = path.join(process.cwd(), 'datos_exportados');

interface DBFJson {
  table: string;
  fields: { name: string; type: string }[];
  count: number;
  data: Record<string, unknown>[];
}

/** Cache to avoid re-reading files on every request */
const cache: Map<string, Record<string, unknown>[]> = new Map();

// Map from application/JSON table names to actual SQL Server table names
const TABLE_NAME_MAP: Record<string, string> = {
  'presupuesto_ejecucion_gasto': 'ejecucion_gasto',
  'presupuesto_ejecucion_ingreso': 'ejecucion_ingreso',
  'nota_pago_2026': 'nota_pago'
};

/** Preload specific tables from SQL Server into the in-memory cache if DB is configured */
export async function preloadTables(tableNames: string[], forceRefresh = false) {
  if (!process.env.DB_SERVER) return;

  try {
    const mssql = await import('mssql');
    const config: import('mssql').config = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: process.env.DB_SERVER || 'localhost',
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
      options: { encrypt: false, trustServerCertificate: true },
    };

    const pool = await new mssql.default.ConnectionPool(config).connect();
    
    for (const name of tableNames) {
      const key = name.toLowerCase();
      if (cache.has(key) && !forceRefresh) continue;

      const sqlTableName = TABLE_NAME_MAP[name] || name;

      try {
        const request = pool.request();
        const result = await request.query(`SELECT * FROM [${sqlTableName}]`);
        cache.set(key, result.recordset || []);
      } catch (err) {
        console.error(`Error precargando tabla "${name}" (as [${sqlTableName}]) desde SQL Server:`, err);
        // No guardamos en caché si falla la consulta (ej. tabla inexistente), para dar opción al fallback JSON
      }
    }
    await pool.close();
  } catch (err) {
    console.error('Error de conexión a SQL Server durante la precarga:', err);
  }
}

/** Load a table from the exported JSON file */
export function loadTable(tableName: string): Record<string, unknown>[] {
  const key = tableName.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  // Try multiple filename variants
  const variants = [
    `${key}.json`,
    `${key.toUpperCase()}.json`,
  ];

  for (const variant of variants) {
    const filePath = path.join(DATA_DIR, variant);
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed: DBFJson | Record<string, unknown>[] = JSON.parse(raw);
        const rows = Array.isArray(parsed)
          ? parsed
          : (parsed as DBFJson).data ?? [];
        cache.set(key, rows);
        return rows;
      } catch {
        return [];
      }
    }
  }
  return [];
}

/** Helper: get numeric value safely */
export function num(val: unknown): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val.trim());
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/** Helper: get string value safely */
export function str(val: unknown): string {
  if (val == null) return '';
  return String(val).trim();
}

/** Filter for the current year and executora */
export const AÑO = '2026';
export const SEC_EJEC = '301548';

/** Filter rows for the current entity */
export function filterEntity<T extends Record<string, unknown>>(rows: T[]): T[] {
  return rows.filter(r => {
    const ano = str(r['ANO_EJE'] ?? r['ANO_PROC']);
    const ejec = str(r['SEC_EJEC']);
    if (ejec && ejec !== SEC_EJEC) return false;
    if (ano && ano !== AÑO && ano !== '2025' && ano !== '') return false;
    return true;
  });
}

/** Format number as currency */
export function formatCurrency(val: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(val);
}

// ============================================================
// SQL Server support (optional - used if env vars are set)
// ============================================================
// If DB_SERVER is set in environment, attempts SQL Server connection.
// Otherwise falls back to JSON files.
export async function trySQL(sqlQuery: string, params?: Record<string, unknown>) {
  if (!process.env.DB_SERVER) return null;
  try {
    const mssql = await import('mssql');
    const config: import('mssql').config = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: process.env.DB_SERVER || 'localhost',
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
      options: { encrypt: false, trustServerCertificate: true },
    };
    const pool = await new mssql.default.ConnectionPool(config).connect();
    const request = pool.request();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        request.input(key, value as never);
      }
    }
    const result = await request.query(sqlQuery);
    await pool.close();
    return result.recordset;
  } catch {
    return null;
  }
}
