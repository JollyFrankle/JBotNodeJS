import mysql, { RowDataPacket } from 'mysql2/promise';

export enum OnDuplicate {
  DoNothing = 0,
  Update = 1,
  Ignore = 2
}

const mysql_config: mysql.PoolOptions = {
  host: process.env['MYSQL_HOST']!,
  user: process.env['MYSQL_USER']!,
  password: process.env['MYSQL_PW']!,
  database: process.env['MYSQL_DB']!,
  waitForConnections: true,
  connectionLimit: 1
}

export const pool = mysql.createPool(mysql_config);

export interface QueryResult {
  status: number;
  data: RowDataPacket[];
  error: string;
}

export default async function query<T=RowDataPacket[]>(sql: string, values?: any) {
  try {
    const conn = await pool.getConnection();
    const [rows, _]: [any, any] = await conn.execute(sql, values).finally(() => conn.release());

    return rows as T;
  } catch (e) {
    throw e
  }
}

export async function insert(tableName: string, data: any, onDuplicateRule: OnDuplicate = OnDuplicate.DoNothing) {
  try {
    let sql = `INSERT INTO ${tableName} (${Object.keys(data).join(', ')}) VALUES (${Object.keys(data).map(() => '?').join(', ')}) `;
    if (onDuplicateRule === OnDuplicate.Update) {
      sql += `ON DUPLICATE KEY UPDATE ${Object.keys(data).map((key) => `${key} = VALUES(${key})`).join(', ')}`;
    } else if (onDuplicateRule === OnDuplicate.Ignore) {
      let firstKey = Object.keys(data)[0];
      sql += `ON DUPLICATE KEY UPDATE ${firstKey} = ${firstKey}`;
    } // else do nothing

    let values = Object.values(data);
    return await query(sql, values);
  } catch (e) {
    throw e;
  }
}

export async function update(tableName: string, data: any, where: any) {
  try {
    let sql = `UPDATE ${tableName} SET ${Object.keys(data).map((key) => `${key} = ?`).join(', ')} WHERE ${Object.keys(where).map((key) => `${key} = ?`).join(' AND ')}`;
    let values = [...Object.values(data), ...Object.values(where)];
    return await query(sql, values);
  } catch (e) {
    throw e;
  }
}