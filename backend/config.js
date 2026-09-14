import mysql from 'mysql2/promise';
import { env } from './environment.js';

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: env.DB_CONNECTION_LIMIT,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}
