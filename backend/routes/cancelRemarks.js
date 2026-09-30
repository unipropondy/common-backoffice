const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");


// ================= GET ALL =================
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        CRCode AS CancelRemarkCode,
        CRName AS CancelRemarkName,
        SortCode
      FROM CancelRemarksMaster
      ORDER BY CRCode
    `);

    res.json(result.recordset);

  } catch (err) {
    console.error("❌ GET ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ================= INSERT =================
router.post("/", async (req, res) => {
  try {
    const { CRCode, CRName, SortCode } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("CRCode", sql.VarChar, CRCode)
      .input("CRName", sql.VarChar, CRName)
      .input("SortCode", sql.Int, SortCode)
      .query(`
        INSERT INTO CancelRemarksMaster (CRCode, CRName, SortCode)
        VALUES (@CRCode, @CRName, @SortCode)
      `);

    res.json({ message: "Inserted" });

  } catch (err) {
    console.error("❌ INSERT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ================= UPDATE =================
router.put("/:code", async (req, res) => {
  try {
    const { CRName, SortCode } = req.body;
    const { code } = req.params;

    const pool = await poolPromise;

    await pool.request()
      .input("CRCode", sql.VarChar, code)
      .input("CRName", sql.VarChar, CRName)
      .input("SortCode", sql.Int, SortCode)
      .query(`
        UPDATE CancelRemarksMaster
        SET CRName=@CRName, SortCode=@SortCode
        WHERE CRCode=@CRCode
      `);

    res.json({ message: "Updated" });

  } catch (err) {
    console.error("❌ UPDATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;