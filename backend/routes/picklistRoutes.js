const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
 
/* ===============================
   GET PICKLIST (FILTER)
================================*/
router.get("/picklist", async (req, res) => {
  try {
    const { tableName, fieldName } = req.query;
 
    if (!tableName || !fieldName) {
      return res.status(400).send("tableName & fieldName required");
    }
 
    const pool = await poolPromise;
 
    const result = await pool.request()
      .input("tableName", sql.VarChar, tableName)
      .input("fieldName", sql.VarChar, fieldName)
      .query(`
        SELECT
          TableName,
          FieldName,
          PickListValue,
          PickListNumber,
          DisplayOrder
        FROM PickListMaster
        WHERE TableName = @tableName
        AND FieldName = @fieldName
        ORDER BY DisplayOrder
      `);
 
    res.json(result.recordset);
 
  } catch (err) {
    console.error("GET PICKLIST ERROR:", err.message);
    res.status(500).send(err.message);
  }
});
 
 
/* ===============================
   🔥 NEW → GET ALL PICKLIST
================================*/
router.get("/picklist/all", async (req, res) => {
  try {
    const pool = await poolPromise;
 
    const result = await pool.request().query(`
      SELECT
        TableName,
        FieldName,
        PickListValue,
        PickListNumber,
        DisplayOrder
      FROM PickListMaster
      ORDER BY TableName, FieldName, DisplayOrder
    `);
 
    res.json(result.recordset);
 
  } catch (err) {
    console.error("GET ALL PICKLIST ERROR:", err.message);
    res.status(500).send(err.message);
  }
});
 
 
/* ===============================
   INSERT / UPDATE
================================*/
router.post("/picklist", async (req, res) => {
  try {
    const { tableName, fieldName, value, number, isDefault } = req.body;
 
    if (!tableName || !fieldName || !value) {
      return res.status(400).send("Required fields missing");
    }
 
    const pool = await poolPromise;
 
    const check = await pool.request()
      .input("tableName", sql.VarChar, tableName)
      .input("fieldName", sql.VarChar, fieldName)
      .input("value", sql.VarChar, value)
      .query(`
        SELECT * FROM PickListMaster
        WHERE TableName=@tableName
        AND FieldName=@fieldName
        AND PickListValue=@value
      `);
 
    // UPDATE
    if (check.recordset.length > 0) {
 
      await pool.request()
        .input("tableName", sql.VarChar, tableName)
        .input("fieldName", sql.VarChar, fieldName)
        .input("value", sql.VarChar, value)
        .input("number", sql.Int, number)
        .input("isDefault", sql.Bit, isDefault)
        .query(`
          UPDATE PickListMaster SET
            PickListNumber=@number,
            isDefault=@isDefault
          WHERE TableName=@tableName
          AND FieldName=@fieldName
          AND PickListValue=@value
        `);
 
      return res.json({ message: "Updated" });
    }
 
    // INSERT
    await pool.request()
      .input("tableName", sql.VarChar, tableName)
      .input("fieldName", sql.VarChar, fieldName)
      .input("value", sql.VarChar, value)
      .input("number", sql.Int, number)
      .input("isDefault", sql.Bit, isDefault)
      .query(`
        INSERT INTO PickListMaster
        (TableName, FieldName, PickListValue, PickListNumber, isDefault)
        VALUES
        (@tableName, @fieldName, @value, @number, @isDefault)
      `);
 
    res.json({ message: "Inserted" });
 
  } catch (err) {
    console.error("SAVE PICKLIST ERROR:", err.message);
    res.status(500).send(err.message);
  }
});
 
 
/* ===============================
   DELETE
================================*/
router.delete("/picklist", async (req, res) => {
  try {
    const { tableName, fieldName, value } = req.body;
 
    const pool = await poolPromise;
 
    await pool.request()
      .input("tableName", sql.VarChar, tableName)
      .input("fieldName", sql.VarChar, fieldName)
      .input("value", sql.VarChar, value)
      .query(`
        DELETE FROM PickListMaster
        WHERE TableName=@tableName
        AND FieldName=@fieldName
        AND PickListValue=@value
      `);
 
    res.json({ message: "Deleted" });
 
  } catch (err) {
    console.error("DELETE PICKLIST ERROR:", err.message);
    res.status(500).send(err.message);
  }
});
 
module.exports = router;
 