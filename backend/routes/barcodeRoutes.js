const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const { v4: uuidv4 } = require("uuid");


// ================= GET ALL BARCODES =================
router.get("/", async (req, res) => {
  try {
    console.log("🔥 GET HIT");

    const pool = await poolPromise;

    // Try the enriched query first; fall back to simple if DishId column doesn't exist
    let result;
    try {
      result = await pool.request().query(`
        SELECT
          B.Id,
          B.BarCode,
          B.Description,
          B.DishId,
          D.DishCode,
          D.Name AS DishName,
          DG.DishGroupName,
          D.CurrentCost AS Price
        FROM dbo.BarCodeMaster B
        LEFT JOIN dbo.DishMaster D ON B.DishId = D.DishId
        LEFT JOIN dbo.DishGroupMaster DG ON D.DishGroupId = DG.DishGroupId
      `);
    } catch (joinErr) {
      console.warn("⚠️ JOIN query failed, falling back to simple query:", joinErr.message);
      result = await pool.request()
        .query("SELECT Id, BarCode, Description FROM dbo.BarCodeMaster");
    }

    res.json(result.recordset);

  } catch (err) {
    console.error("❌ GET ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ================= GET DISH LIST (LOV) =================
router.get("/dish-list", async (req, res) => {
  try {
    console.log("🔥 DISH LIST HIT");

    const pool = await poolPromise;

    const result = await pool.request()
      .query(`
        SELECT
          D.DishId,
          D.DishCode,
          D.Name AS DishName,
          D.CurrentCost,
          DG.DishGroupName
        FROM dbo.DishMaster D
        LEFT JOIN dbo.DishGroupMaster DG ON D.DishGroupId = DG.DishGroupId
        WHERE D.isActive = 1
        ORDER BY D.DishCode
      `);

    res.json(result.recordset);

  } catch (err) {
    console.error("❌ DISH LIST ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ================= INSERT =================
router.post("/", async (req, res) => {
  try {
    const { DishId, BarCode, Description } = req.body;

    if (!BarCode) {
      return res.status(400).json({ message: "BarCode is required" });
    }

    if (!DishId) {
      return res.status(400).json({ message: "DishId is required" });
    }

    const pool = await poolPromise;
    const barcodeId = uuidv4();

    // Try insert with DishId; if column doesn't exist, insert without it
    try {
      await pool.request()
        .input("Id", sql.UniqueIdentifier, barcodeId)
        .input("DishId", sql.UniqueIdentifier, DishId)
        .input("BarCode", sql.VarChar, BarCode)
        .input("Description", sql.VarChar, Description || "")
        .query(`
          INSERT INTO dbo.BarCodeMaster (Id, DishId, BarCode, Description)
          VALUES (@Id, @DishId, @BarCode, @Description)
        `);
    } catch (insertErr) {
      // Fallback: insert without DishId (old schema)
      console.warn("⚠️ DishId column may not exist, trying without it:", insertErr.message);
      await pool.request()
        .input("Id", sql.UniqueIdentifier, barcodeId)
        .input("BarCode", sql.VarChar, BarCode)
        .input("Description", sql.VarChar, Description || "")
        .query(`
          INSERT INTO dbo.BarCodeMaster (Id, BarCode, Description)
          VALUES (@Id, @BarCode, @Description)
        `);
    }

    res.json({ message: "Saved ✅" });

  } catch (err) {
    console.error("❌ INSERT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ================= UPDATE =================
router.put("/:id", async (req, res) => {
  try {
    const { DishId, BarCode, Description } = req.body;
    const { id } = req.params;

    console.log("🔥 UPDATE HIT:", id);

    const pool = await poolPromise;

    const result = await pool.request()
      .input("Id", sql.UniqueIdentifier, id)
      .input("DishId", sql.UniqueIdentifier, DishId)
      .input("BarCode", sql.VarChar, BarCode)
      .input("Description", sql.VarChar, Description || "")
      .query(`
        UPDATE dbo.BarCodeMaster
        SET
          DishId = @DishId,
          BarCode = @BarCode,
          Description = @Description
        WHERE Id = @Id
      `);

    console.log("Rows affected:", result.rowsAffected[0]);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json({ message: "Updated ✅" });

  } catch (err) {
    console.error("❌ UPDATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ================= DELETE =================
router.delete("/:id", async (req, res) => {
  try {
    console.log("🔥 DELETE HIT:", req.params.id);

    const pool = await poolPromise;

    const result = await pool.request()
      .input("Id", sql.UniqueIdentifier, req.params.id)
      .query("DELETE FROM dbo.BarCodeMaster WHERE Id = @Id");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json({ message: "Deleted ✅" });

  } catch (err) {
    console.error("❌ DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;