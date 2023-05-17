import mysql from 'mysql2/promise';
// import Database from '@replit/database';
// (await import('dotenv')).config();
import fs from 'fs';
// const db = new Database()

const mysql_config = {
  host: process.env['MYSQL_HOST'],
  user: process.env['MYSQL_USER'],
  password: process.env['MYSQL_PW'],
  database: process.env['MYSQL_DB']
}

const tempdb = "./storage/tempdb.log";

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
  let con = null;
  let returnData = null;

  try {
    con = await mysql.createConnection(mysql_config);
    let [rows, _] = await con.execute(sql, params);
    returnData = {
      status: 200,
      data: rows
    }
  } catch (e) {
    // add to temp db
    if(storeIfFailed) {
      insertToTempDb({
        sql: sql,
        params: params,
        sif: storeIfFailed
      })
    }

    console.error(e)

    returnData = {
      status: e.errno,
      error: e
    }
  } finally {
    if(con !== null) {
      con.end();
    }
    // Mass query from temp db
    massQueryFromTempDb();
  }

  return returnData;
}

let LOCK = false;
async function massQueryFromTempDb() {
  if(LOCK !== true) {
    const readline = await import('readline');
    const fileStream = fs.createReadStream(tempdb);

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    // if there is a line, do the query
    for await (let line of rl) {
      LOCK = true;
      try {
        let value = JSON.parse(line);
        await query(value[0], value[1], value[2]).then(async () => {
          console.log("Redo SQL OK for: " + line);
          // delete the line
          let data = fs.readFileSync(tempdb, 'utf8').split('\n');
          data.splice(data.indexOf(line), 1);
          fs.writeFileSync(tempdb, data.join('\n'));
        });
      } catch (e) {
        console.log(e);
      }
    }
    LOCK = false;
  }

  return {
    status: 200
  }
}

async function insertToTempDb({ sql, params, sif }) {
  fs.appendFile(tempdb, JSON.stringify([sql, params, sif]) + '\n', (err) => {
    if(err) {
      console.log(err);
    }
  })
}