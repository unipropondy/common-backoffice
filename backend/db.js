const sql = require("mssql");
const { AsyncLocalStorage } = require("async_hooks");

require("dotenv").config();

// ✅ POOL CACHE
const pools = new Map();

// ✅ AsyncLocalStorage — carries the active DB name per request
const dbContext = new AsyncLocalStorage();

// ✅ DYNAMIC CONNECTION FUNCTION
const getPool = async (dbname) => {
  if (!dbname) throw new Error("Database name is required");
  if (pools.has(dbname)) return pools.get(dbname);

  try {
    const pool = await new sql.ConnectionPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      server: process.env.DB_SERVER,
      port: Number(process.env.DB_PORT),
      database: dbname,
      requestTimeout: 120000,
      options: {
        encrypt: false,
        trustServerCertificate: true
      }
    }).connect();

    console.log(`✅ SQL Connected : ${dbname}`);
    pools.set(dbname, pool);
    return pool;

  } catch (err) {
    console.error(`❌ DB Connection Failed [${dbname}]:`, err);
    throw err;
  }
};

// MASTER DATABASE POOL
const masterPoolPromise = getPool(
  process.env.MASTER_DB_NAME || "UNIPRO"
);

const getDatabaseByBranchCode = async (branchCode) => {

  if (!branchCode) {
    throw new Error("Branch Code is required");
  }

  const masterPool = await masterPoolPromise;

  const result = await masterPool
    .request()
    .input(
      "BranchCode",
      sql.VarChar,
      branchCode
    )
    .query(`
      SELECT DatabaseName
      FROM BranchDatabaseMaster
      WHERE BranchCode = @BranchCode
    `);

  if (result.recordset.length === 0) {
    throw new Error("Invalid Branch Code");
  }

  return result.recordset[0].DatabaseName;
};

// ✅ DEFAULT POOL PROMISE (for explicit use or fallback)
const defaultPoolPromise = getPool(process.env.DB_NAME || 'UCSPONDY');

// ✅ SMART poolPromise — awaiting this automatically picks the
//    DB for the current request (set via dbContext) or falls back
//    to the default. All existing routes need zero changes.
const poolPromise = {
  then(onFulfilled, onRejected) {
    const dbname = dbContext.getStore();
    const promise = dbname
      ? getPool(dbname)
      : defaultPoolPromise;
    return promise.then(onFulfilled, onRejected);
  },
  catch(onRejected) {
    return this.then(undefined, onRejected);
  }
};

module.exports = {
  sql,
  getPool,
  poolPromise,
  dbContext,
  defaultPoolPromise,
  masterPoolPromise,
  getDatabaseByBranchCode
};