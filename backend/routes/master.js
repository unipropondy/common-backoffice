const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// 🔍 ITEMS
router.get("/items", async (req, res) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input("search", sql.VarChar, `%${req.query.search || ""}%`)
    .query(`
      SELECT ItemCode, ItemName, GstPerc
      FROM InventoryMaster
      WHERE ItemCode LIKE @search OR ItemName LIKE @search
    `);

  res.json(result.recordset);
});

// 👤 VENDORS
router.get("/vendors", async (req, res) => {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT VendorCode, VendorName FROM VendorMaster
  `);

  res.json(result.recordset);
});

// 📊 GST
router.get("/gst", async (req, res) => {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT Value FROM PickListmaster WHERE Type='GST'
  `);

  res.json(result.recordset);
});

module.exports = router;