const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
 
 
// 🔹 GET all price lists
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
 
    const result = await pool.request()
      .query(`
        SELECT *
        FROM PriceListMaster
        ORDER BY SortCode
      `);
 
    res.json(result.recordset);
 
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});
 
 
// 🔹 GET by ID
router.get("/by-id/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    const id = req.params.id;
 
    const isValidGUID = /^[0-9a-fA-F-]{36}$/.test(id);
 
    if (!isValidGUID) {
      return res.status(400).send("Invalid ID format");
    }
 
    const result = await pool.request()
      .input("id", sql.UniqueIdentifier, id)
      .query(`
        SELECT * FROM PriceListMaster
        WHERE PriceListId = @id
      `);
 
    res.json(result.recordset[0]);
 
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});
 
 
router.post("/", async (req, res) => {
  const {
    Name,
    Description,
    SortCode,
    IsActive,
    CreatedBy
  } = req.body;
  const userId = CreatedBy || req.headers['x-user-id'] || null;
 
  try {
    const pool = await poolPromise;
 
    await pool.request()
      .input("Name", sql.VarChar, Name)
      .input("Description", sql.VarChar, Description)
      .input("SortCode", sql.Int, SortCode)
      .input("IsActive", sql.Bit, IsActive)
      .input("UserId", sql.VarChar, userId)
      .query(`
 
        IF EXISTS (
          SELECT 1 FROM PriceListMaster WHERE Name = @Name
        )
        BEGIN
          -- 🔄 UPDATE
          UPDATE PriceListMaster
          SET
            Description = @Description,
            SortCode = @SortCode,
            IsActive = @IsActive,
            ModifiedBy = CAST(@UserId AS UNIQUEIDENTIFIER),
            ModifiedOn = GETDATE()
          WHERE Name = @Name
        END
        ELSE
        BEGIN
          -- ➕ INSERT
          INSERT INTO PriceListMaster
          (
            PriceListId,
            Name,
            Description,
            BeginDate,
            EndDate,
            IsActive,
            CreatedBy,
            CreatedOn,
            SortCode,
            ExpiryDate
          )
          VALUES
          (
            NEWID(),
            @Name,
            @Description,
            GETDATE(),
            DATEADD(YEAR, 2, GETDATE()),
            @IsActive,
            CAST(@UserId AS UNIQUEIDENTIFIER),
            GETDATE(),
            @SortCode,
            DATEADD(YEAR, 2, GETDATE())
          )
        END
 
      `);
 
    res.send("✅ Saved / Updated successfully");
 
  } catch (err) {
    console.error("UPSERT ERROR:", err.message);
    res.status(500).send(err.message);
  }
});
 
// 🔹 UPDATE PRICE LIST
router.put("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
 
    const id = req.params.id;
 
    const {
      Name,
      Description,
      SortCode,
      IsActive,
      ModifiedBy
    } = req.body;
    const userId = ModifiedBy || req.headers['x-user-id'] || null;
 
    // ✅ ID validation
    const isValidGUID = /^[0-9a-fA-F-]{36}$/.test(id);
 
    if (!isValidGUID) {
      return res.status(400).send("Invalid ID format");
    }
 
    await pool.request()
      .input("id", sql.UniqueIdentifier, id)
      .input("Name", sql.VarChar, Name)
      .input("Description", sql.VarChar, Description)
      .input("SortCode", sql.Int, SortCode)
      .input("IsActive", sql.Bit, IsActive)
      .input("UserId", sql.VarChar, userId)
      .query(`
        UPDATE PriceListMaster
        SET
          Name = @Name,
          Description = @Description,
          SortCode = @SortCode,
          IsActive = @IsActive,
          ModifiedBy = CAST(@UserId AS UNIQUEIDENTIFIER),
          ModifiedOn = GETDATE()
        WHERE PriceListId = @id
      `);
 
    res.send("✅ Updated successfully");
 
  } catch (err) {
    console.error("UPDATE ERROR:", err.message);
    res.status(500).send(err.message);
  }
});
 
module.exports = router;

 