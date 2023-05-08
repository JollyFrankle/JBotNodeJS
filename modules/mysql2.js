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
    let con = await mysql.createConnection(mysql_config);
    let [rows, fields] = await con.execute(sql, params);
    con.end();
    massQueryFromTempDb();
    return {
      status: 200,
      data: rows
    };
  } catch (e) {
    // add to temp db
    if(storeIfFailed) {
      let tempDb = await db.get("mySQL_TEMP");
      if(!tempDb || !Array.isArray(tempDb)) {
        tempDb = [];
      }
      tempDb.push({
        sql: sql,
        params: params,
        sif: storeIfFailed
      });
      await db.set("mySQL_TEMP", tempDb);
    }
    // console.log(e);
    return {
      status: e.errno,
      error: e
    }
  }

  // console.log(rows)
  // console.log(fields) // `fields` itu tidak berguna di konteks ini
}

async function massQueryFromTempDb() {
  if((await db.get("mySQL_TEMP_LOCK")) !== true) {
    let tempDb = await db.get("mySQL_TEMP");
    if(tempDb && Array.isArray(tempDb) && tempDb.length > 0) {
      await db.set("mySQL_TEMP_LOCK", true)
      try {
        let con = await mysql.createConnection(mysql_config);
        for(i in tempDb) {
          try {
            let data = tempDb[i];
            let [rows, fields] = await con.execute(data.sql, data.params);
            console.log("Redo SQL OK")
            // Finally: hapus dari queue, entah querynya error atau tidak
            tempDb.splice(i, 1);
            db.set("mySQL_TEMP", tempDb).then(() => {});
          } catch (e) {
            console.log(e);
          }
        }
        con.end()
        await db.delete("mySQL_TEMP_LOCK")
        return {
          status: 200
        };
      } catch (e) {
        await db.delete("mySQL_TEMP_LOCK")
        return {
          status: 500
        }
      }
    }
  }
}