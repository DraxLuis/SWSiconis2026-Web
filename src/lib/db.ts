import path from 'path';
import fs from 'fs';
import { cookies } from 'next/headers';

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
        const normalizedRows = (result.recordset || []).map(row => {
          const newRow: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(row)) {
            newRow[k.toUpperCase()] = v;
          }
          return newRow;
        });
        cache.set(key, normalizedRows);
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
export const SEC_EJEC = '301548';

// Return active year dynamically from cookies
export function getAño(): string {
  try {
    const cookieStore = cookies();
    const c = cookieStore.get('siconis_year')?.value;
    if (c === '2025' || c === '2026') return c;
    return c || '2026';
  } catch {
    return '2026';
  }
}

// Keep a fallback AÑO string for compatibility where static values are needed during compilation, 
// but all request-level logic should call getAño().
export const AÑO = '2026';

/** Filter rows for the current entity */
export function filterEntity<T extends Record<string, unknown>>(rows: T[]): T[] {
  const activeAño = getAño();
  return rows.filter(r => {
    const ano = str(r['ANO_EJE'] ?? r['ANO_PROC']);
    const ejec = str(r['SEC_EJEC']);
    if (ejec && ejec !== SEC_EJEC) return false;
    if (ano && ano !== activeAño && ano !== '2025' && ano !== '') return false;
    return true;
  });
}

// --- UTILS FOR USER AND CONFIG LOGIC ---
let tablesEnsured = false;

export async function ensureUtilitariosTables() {
  if (tablesEnsured) return;
  if (!process.env.DB_SERVER) {
    const usersPath = path.join(process.cwd(), 'datos_exportados', 'usuarios.json');
    const configPath = path.join(process.cwd(), 'datos_exportados', 'configuracion.json');

    if (!fs.existsSync(usersPath)) {
      const defaultUsers = [
        {
          ID: 1,
          EQUIPO: 'ADMINISTRADOR',
          USUARIO: 'ADMINISTRADOR',
          DESCRIPCION: 'ADMINISTRADOR',
          CLAVE: 'libera16+',
          ATRIBUTO: 'Control Total',
          SUSPENDIDO: 0
        }
      ];
      fs.writeFileSync(usersPath, JSON.stringify(defaultUsers, null, 2), 'utf8');
    } else {
      try {
        const raw = fs.readFileSync(usersPath, 'utf8');
        const parsed: RawUser[] = JSON.parse(raw);
        let changed = false;
        parsed.forEach((u: RawUser) => {
          if ((u.USUARIO || u.usuario || '').toUpperCase() === 'ADMINISTRADOR' && !(u.CLAVE || u.clave)) {
            if (u.CLAVE !== undefined) u.CLAVE = 'libera16+';
            else u.clave = 'libera16+';
            changed = true;
          }
        });
        if (changed) {
          fs.writeFileSync(usersPath, JSON.stringify(parsed, null, 2), 'utf8');
        }
      } catch {}
    }

    if (!fs.existsSync(configPath)) {
      const defaultConfig = [
        { KEY: 'ruta_siaf', VALUE: 'C:\\SIAF\\DATA' },
        { KEY: 'nombre_entidad', VALUE: '301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA' }
      ];
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
    }
    tablesEnsured = true;
    return;
  }

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
    
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'usuarios')
      BEGIN
          CREATE TABLE usuarios (
              id INT IDENTITY(1,1) PRIMARY KEY,
              equipo VARCHAR(100) NOT NULL,
              usuario VARCHAR(100) NOT NULL UNIQUE,
              descripcion VARCHAR(200),
              clave VARCHAR(200) NOT NULL DEFAULT '',
              atributo VARCHAR(50) NOT NULL DEFAULT 'Control Total',
              suspendido BIT NOT NULL DEFAULT 0
          );
          INSERT INTO usuarios (equipo, usuario, descripcion, clave, atributo, suspendido)
          VALUES ('ADMINISTRADOR', 'ADMINISTRADOR', 'ADMINISTRADOR', 'libera16+', 'Control Total', 0);
      END
      ELSE
      BEGIN
          UPDATE usuarios 
          SET clave = 'libera16+' 
          WHERE usuario = 'ADMINISTRADOR' AND (clave IS NULL OR clave = '');
      END
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'configuracion')
      BEGIN
          CREATE TABLE configuracion (
              [key] VARCHAR(100) PRIMARY KEY,
              [value] NVARCHAR(MAX)
          );
          INSERT INTO configuracion ([key], [value])
          VALUES ('ruta_siaf', 'C:\\SIAF\\DATA'),
                 ('nombre_entidad', '301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA');
      END
    `);

    await pool.close();
    tablesEnsured = true;
  } catch (err) {
    console.error('Error ensuring utilitarios tables in SQL Server:', err);
  }
}

export interface UsuarioDB {
  id: number;
  equipo: string;
  usuario: string;
  descripcion: string;
  clave: string;
  atributo: string;
  suspendido: number;
}

interface RawUser {
  ID?: number;
  id?: number;
  EQUIPO?: string;
  equipo?: string;
  USUARIO?: string;
  usuario?: string;
  DESCRIPCION?: string;
  descripcion?: string;
  CLAVE?: string;
  clave?: string;
  ATRIBUTO?: string;
  atributo?: string;
  SUSPENDIDO?: number | boolean;
  suspendido?: number | boolean;
}

interface RawConfig {
  KEY?: string;
  key?: string;
  VALUE?: string;
  value?: string;
}

export async function getUsuarios(): Promise<UsuarioDB[]> {
  await ensureUtilitariosTables();
  if (process.env.DB_SERVER) {
    const res = await trySQL('SELECT * FROM usuarios');
    if (res) {
      return res.map(r => ({
        id: Number(r.id),
        equipo: String(r.equipo),
        usuario: String(r.usuario),
        descripcion: String(r.descripcion || ''),
        clave: String(r.clave || ''),
        atributo: String(r.atributo || 'Control Total'),
        suspendido: r.suspendido ? 1 : 0
      }));
    }
  }
  const usersPath = path.join(process.cwd(), 'datos_exportados', 'usuarios.json');
  try {
    const raw = fs.readFileSync(usersPath, 'utf8');
    const parsed: RawUser[] = JSON.parse(raw);
    return parsed.map((r: RawUser) => ({
      id: Number(r.ID ?? r.id ?? 0),
      equipo: String(r.EQUIPO ?? r.equipo ?? 'PC-CLIENTE'),
      usuario: String(r.USUARIO ?? r.usuario ?? ''),
      descripcion: String(r.DESCRIPCION ?? r.descripcion ?? ''),
      clave: String(r.CLAVE ?? r.clave ?? ''),
      atributo: String(r.ATRIBUTO ?? r.atributo ?? 'Control Total'),
      suspendido: (r.SUSPENDIDO ?? r.suspendido) ? 1 : 0
    }));
  } catch {
    return [];
  }
}

export async function saveUsuario(user: { id?: number; equipo: string; usuario: string; descripcion: string; clave?: string; atributo: string; suspendido: number | boolean }) {
  await ensureUtilitariosTables();
  if (process.env.DB_SERVER) {
    const exists = await trySQL('SELECT * FROM usuarios WHERE usuario = @usuario', { usuario: user.usuario });
    if (exists && exists.length > 0) {
      if (user.clave !== undefined && user.clave !== null) {
        await trySQL(`
          UPDATE usuarios 
          SET equipo = @equipo, descripcion = @descripcion, clave = @clave, atributo = @atributo, suspendido = @suspendido 
          WHERE usuario = @usuario
        `, {
          equipo: user.equipo,
          descripcion: user.descripcion,
          clave: user.clave,
          atributo: user.atributo,
          suspendido: user.suspendido ? 1 : 0,
          usuario: user.usuario
        });
      } else {
        await trySQL(`
          UPDATE usuarios 
          SET equipo = @equipo, descripcion = @descripcion, atributo = @atributo, suspendido = @suspendido 
          WHERE usuario = @usuario
        `, {
          equipo: user.equipo,
          descripcion: user.descripcion,
          atributo: user.atributo,
          suspendido: user.suspendido ? 1 : 0,
          usuario: user.usuario
        });
      }
    } else {
      await trySQL(`
        INSERT INTO usuarios (equipo, usuario, descripcion, clave, atributo, suspendido)
        VALUES (@equipo, @usuario, @descripcion, @clave, @atributo, @suspendido)
      `, {
        equipo: user.equipo,
        usuario: user.usuario,
        descripcion: user.descripcion,
        clave: user.clave || '',
        atributo: user.atributo || 'Control Total',
        suspendido: user.suspendido ? 1 : 0
      });
    }
    return true;
  }
  
  const usersPath = path.join(process.cwd(), 'datos_exportados', 'usuarios.json');
  const list = await getUsuarios();
  const idx = list.findIndex((u: UsuarioDB) => u.usuario.toUpperCase() === user.usuario.toUpperCase());
  
  const normalizedUser = {
    ID: idx >= 0 ? list[idx].id : (list.length > 0 ? Math.max(...list.map((u: UsuarioDB) => u.id || 0)) + 1 : 1),
    EQUIPO: user.equipo,
    USUARIO: user.usuario,
    DESCRIPCION: user.descripcion,
    CLAVE: user.clave !== undefined ? user.clave : (idx >= 0 ? list[idx].clave : ''),
    ATRIBUTO: user.atributo || 'Control Total',
    SUSPENDIDO: user.suspendido ? 1 : 0
  };

  const listToSave = list.map((u: UsuarioDB) => ({
    ID: u.id,
    EQUIPO: u.equipo,
    USUARIO: u.usuario,
    DESCRIPCION: u.descripcion,
    CLAVE: u.clave,
    ATRIBUTO: u.atributo,
    SUSPENDIDO: u.suspendido
  }));

  if (idx >= 0) {
    listToSave[idx] = normalizedUser;
  } else {
    listToSave.push(normalizedUser);
  }
  fs.writeFileSync(usersPath, JSON.stringify(listToSave, null, 2), 'utf8');
  return true;
}

export async function deleteUsuario(usuario: string) {
  await ensureUtilitariosTables();
  if (process.env.DB_SERVER) {
    await trySQL('DELETE FROM usuarios WHERE usuario = @usuario', { usuario });
    return true;
  }

  const usersPath = path.join(process.cwd(), 'datos_exportados', 'usuarios.json');
  const list = await getUsuarios();
  const filtered = list.filter((u: UsuarioDB) => u.usuario.toUpperCase() !== usuario.toUpperCase());
  const listToSave = filtered.map((u: UsuarioDB) => ({
    ID: u.id,
    EQUIPO: u.equipo,
    USUARIO: u.usuario,
    DESCRIPCION: u.descripcion,
    CLAVE: u.clave,
    ATRIBUTO: u.atributo,
    SUSPENDIDO: u.suspendido
  }));
  fs.writeFileSync(usersPath, JSON.stringify(listToSave, null, 2), 'utf8');
  return true;
}

export async function getConfig(key: string): Promise<string> {
  await ensureUtilitariosTables();
  if (process.env.DB_SERVER) {
    const res = await trySQL('SELECT [value] FROM configuracion WHERE [key] = @key', { key });
    if (res && res.length > 0) {
      return String(res[0].value);
    }
  }

  const configPath = path.join(process.cwd(), 'datos_exportados', 'configuracion.json');
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const list: RawConfig[] = JSON.parse(raw);
    const item = list.find((c: RawConfig) => (c.KEY || c.key) === key);
    return item ? (item.VALUE ?? item.value ?? '') : '';
  } catch {
    return '';
  }
}

export async function saveConfig(key: string, value: string) {
  await ensureUtilitariosTables();
  if (process.env.DB_SERVER) {
    const exists = await trySQL('SELECT * FROM configuracion WHERE [key] = @key', { key });
    if (exists && exists.length > 0) {
      await trySQL('UPDATE configuracion SET [value] = @value WHERE [key] = @key', { key, value });
    } else {
      await trySQL('INSERT INTO configuracion ([key], [value]) VALUES (@key, @value)', { key, value });
    }
    return true;
  }

  const configPath = path.join(process.cwd(), 'datos_exportados', 'configuracion.json');
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const list: RawConfig[] = JSON.parse(raw);
    const item = list.find((c: RawConfig) => (c.KEY || c.key) === key);
    if (item) {
      if (item.KEY !== undefined) item.VALUE = value;
      else item.value = value;
    } else {
      list.push({ KEY: key, VALUE: value });
    }
    fs.writeFileSync(configPath, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch {
    const list = [{ KEY: key, VALUE: value }];
    fs.writeFileSync(configPath, JSON.stringify(list, null, 2), 'utf8');
    return true;
  }
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
