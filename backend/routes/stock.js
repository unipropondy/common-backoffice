const express = require("express");
const router = express.Router();
const { poolPromise } = require("../db");


// 🔥 GET LIST (VB LOGIC)
router.get("/", async (req, res) => {
  try {
    const tranType = req.query.tranType;

    const pool = await poolPromise;

    let query = `
      SELECT 
       *
      FROM PurchaseHeader
    `;

    if (tranType) {
      query += ` WHERE TranType='${tranType}'`;
    }

    query += ` ORDER BY TranNo DESC`;

    const result = await pool.request().query(query);

    res.json(result.recordset);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔥 GET SINGLE (EDIT LOAD)
router.get("/:tranNo", async (req, res) => {

  try {
    const pool = await poolPromise;

    const header = await pool.request().query(`
      SELECT * FROM PurchaseHeader 
      WHERE TranNo='${req.params.tranNo}'
    `);

    if (header.recordset.length === 0) {
      return res.json({ header: {}, details: [] });
    }

    const details = await pool.request().query(`
      SELECT * FROM PurchaseDetail 
      WHERE TranId='${header.recordset[0].TranId}'
    `);

    res.json({
      header: header.recordset[0],
      details: details.recordset
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔥 DELETE
router.delete("/:id", async (req, res) => {

  try {
    const pool = await poolPromise;

    await pool.request().query(`
      DELETE FROM PurchaseDetail WHERE TranId='${req.params.id}'
    `);

    await pool.request().query(`
      DELETE FROM PurchaseHeader WHERE TranId='${req.params.id}'
    `);

    res.json({ message: "Deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;