import mssql from 'mssql';

const config: mssql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
  options: {
    encrypt: true,
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
};

// Prevent multiple pools in development due to hot-reloading
let poolPromise: Promise<mssql.ConnectionPool> | null = null;

export async function getDatabaseConnection(): Promise<mssql.ConnectionPool> {
  if (poolPromise) {
    return poolPromise;
  }

  poolPromise = new mssql.ConnectionPool(config)
    .connect()
    .then((pool) => {
      console.log('Successfully connected to SQL Server');
      return pool;
    })
    .catch((err) => {
      poolPromise = null;
      console.error('Database connection failed: ', err);
      throw err;
    });

  return poolPromise;
}

export async function query(sqlQuery: string, params?: Record<string, unknown>) {
  const pool = await getDatabaseConnection();
  const request = pool.request();

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      request.input(key, value as any);
    }
  }

  return await request.query(sqlQuery);
}
