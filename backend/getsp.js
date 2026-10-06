const { poolPromise } = require('./db');
poolPromise.then(async (pool) => {
    try {
        const res = await pool.request().query("SELECT TOP 5 DishCode, Name FROM DishMaster ORDER BY CreatedOn DESC");
        console.log("Latest Dishes:", res.recordset);
        process.exit(0);
    } catch(err) {
        console.log("SP ERROR:", err.message);
        process.exit(1);
    }
});
