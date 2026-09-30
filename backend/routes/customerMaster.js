const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");


// ================= GET ALL =================
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    console.log("POOL TYPE 👉", pool.constructor.name);
    console.log("POOL OBJECT 👉", pool);

    const result = await pool.request().query(`
      SELECT 
        CustomerId,
        CustomerCode,
        Name,
        ContactPerson,
        EmailId1,
        Address1_City,
        Address1_Telephone1
      FROM dbo.CustomerMaster
      ORDER BY Name
    `);

    res.json(result.recordset);

  } catch (err) {
    console.error("❌ GET ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;