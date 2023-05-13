import mysql from 'mysql2/promise';
// import Database from '@replit/database';
// (await import('dotenv')).config();
import db from '../helpers/database.js';
// const db = new Database()

const mysql_config = {
  host: process.env['MYSQL_HOST'],
  user: process.env['MYSQL_USER'],
  password: process.env['MYSQL_PW'],
  database: process.env['MYSQL_DB']
}

/**
 * @type {mysql.Connection}
 */
let con = null;
async function getConnection() {
  if(con === null) {
    con = await mysql.createConnection(mysql_config);
  }
  await con.ping(async (err) => {
    if(err) {
      con = await mysql.createConnection(mysql_config);
    }
  })
  return con;
}

// thanks chatgpt for the documentation below
/**
 * Executes an SQL query with optional parameters and returns a JSON object with the query results or an error message if the query fails.
 *
 * @async
 * @function query
 * @param {string} sql - A string representing the SQL query to execute.
 * @param {Array} [params=[]] - An array of parameters to pass to the SQL query. The default value is an empty array.
 * @param {boolean} [storeIfFailed=false] - A boolean value indicating whether to store the error message in a database if the query fails. The default value is false.
 * @returns {Promise<Object>} - A Promise that resolves to a JSON object with the following properties:
 *      - `status` {number} - A number representing the HTTP status code. If the query is successful, this value is set to 200. If the query fails, this value is set to the error number.
 *      - `data` {Array} - An array of objects representing the rows returned by the query. If the query fails, this value is set to an empty array.
 *      - `error` {string} - A string representing the error message if the query fails. If the query is successful, this value is set to an empty string.
 *
 * @example
 * const result = await query("SELECT * FROM users WHERE id = ?", [userId]);
 * if (result.status === 200) {
 *   console.log(`Found user with ID ${userId}: ${JSON.stringify(result.data)}`);
 * } else {
 *   console.error(`Error ${result.status}: ${result.error}`);
 * }
 */
export async function query(sql, params = [], storeIfFailed = false) {
  try {
    let con = await getConnection();
    let [rows, fields] = await con.execute(sql, params);
    massQueryFromTempDb();
    return {
      status: 200,
      data: rows
    };
  } catch (e) {
    // add to temp db
    if(storeIfFailed) {
      let data = {
        sql: sql,
        params: params,
        sif: storeIfFailed
      }
      await db.push("mySQL_TEMP", data);
    }

    return {
      status: e.errno,
      error: e
    }
  }

  // console.log(rows)
  // console.log(fields) // `fields` itu tidak berguna di konteks ini
}

let LOCK = false;
async function massQueryFromTempDb() {
  if(LOCK !== true) {
    let tempDbSnap = await db.getLD("mySQL_TEMP")
    if (tempDbSnap.exists() && LOCK !== true) {
      LOCK = true;
      tempDbSnap.forEach((snp) => {
        let key = snp.key, val = snp.val();
        try {
          query(val.sql, val.params, val.sif).then(async () => {
            console.log("Redo SQL OK for: " + key);
            await db.delete(`mySQL_TEMP/${key}`);
          });
        } catch (e) {
          console.log(e);
        }
      })

      LOCK = false;
    } else {
      LOCK = false;
    }
  }

  return {
    status: 200
  }
}