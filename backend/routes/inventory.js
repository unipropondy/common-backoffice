const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");


// ================== 🔍 GET ALL ==================
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .query("SELECT * FROM InventoryMaster ORDER BY CreatedOn DESC");

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================== 🔍 GET BY ID ==================
router.get("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("id", sql.UniqueIdentifier, req.params.id)
      .query("SELECT * FROM InventoryMaster WHERE InventoryId=@id");

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================== ➕ CREATE ==================
 router.post("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    const {
      InventoryCode,
      Description,
      InventoryGroup,
      BrandId,
      Uom,
      Price,
      GrossCost,
      CurrentCost,
      QuantityOnHand,
      IsActive,
      SordCode,
      ShortName,
      isDiscountAllowed,
      VendorId
    } = req.body;

   await pool.request()
  .input("InventoryId", sql.UniqueIdentifier, require("crypto").randomUUID())
  .input("InventoryCode", sql.VarChar, InventoryCode || "")
  .input("Description", sql.NVarChar, Description || "")
  .input("InventoryGroup", sql.VarChar, InventoryGroup || "")
  .input("BrandId", sql.UniqueIdentifier, BrandId || "00000000-0000-0000-0000-000000000000")
  .input("Uom", sql.VarChar, Uom || "NOS")
  .input("Price", sql.Decimal(18,2), Price || 0)
  .input("GrossCost", sql.Decimal(18,2), GrossCost || 0)
  .input("CurrentCost", sql.Decimal(18,2), CurrentCost || 0)
  .input("QuantityOnHand", sql.Decimal(18,2), QuantityOnHand || 0)
  .input("IsActive", sql.Bit, IsActive ?? true)
  .input("SordCode", sql.Numeric(18,0), SordCode || 0)
  .input("ShortName", sql.VarChar, ShortName || "")
  .input("isDiscountAllowed", sql.Bit, isDiscountAllowed ?? false)
  .input("VendorId", sql.UniqueIdentifier, VendorId || "00000000-0000-0000-0000-000000000000")
  .input("CreatedBy", sql.UniqueIdentifier, "00000000-0000-0000-0000-000000000000")

      .query(`
        INSERT INTO InventoryMaster (
          InventoryId, InventoryCode, Description, InventoryGroup, BrandId,
          Uom, Price, GrossCost, CurrentCost, QuantityOnHand,
          IsActive, CreatedOn, SordCode, ShortName, isDiscountAllowed, VendorId,CreatedBy
        )
        VALUES (
          @InventoryId, @InventoryCode, @Description, @InventoryGroup, @BrandId,
          @Uom, @Price, @GrossCost, @CurrentCost, @QuantityOnHand,
          @IsActive, GETDATE(), @SordCode, @ShortName, @isDiscountAllowed, @VendorId,@CreatedBy
        )
      `);

    res.json({ message: "✅ Created successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================== ✏️ UPDATE ==================
router.put("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;

    const {
      Description,
      InventoryGroup,
      BrandId,
      Uom,
      Price,
      GrossCost,
      CurrentCost,
      QuantityOnHand,
      IsActive,
      SordCode,
      ShortName,
      isDiscountAllowed,
      VendorId
    } = req.body;

    await pool.request()
      .input("id", sql.UniqueIdentifier, req.params.id)
      .input("Description", sql.NVarChar, Description)
      .input("InventoryGroup", sql.VarChar, InventoryGroup)
      .input("BrandId", sql.UniqueIdentifier, BrandId || null)
      .input("Uom", sql.VarChar, Uom)
      .input("Price", sql.Decimal(18,2), Price || 0)
      .input("GrossCost", sql.Decimal(18,2), GrossCost || 0)
      .input("CurrentCost", sql.Decimal(18,2), CurrentCost || 0)
      .input("QuantityOnHand", sql.Decimal(18,2), QuantityOnHand || 0)
      .input("IsActive", sql.Bit, IsActive ?? true)
      .input("SordCode", sql.Numeric(18,0), SordCode || 0)
      .input("ShortName", sql.VarChar, ShortName)
      .input("isDiscountAllowed", sql.Bit, isDiscountAllowed ?? false)
      .input("VendorId", sql.UniqueIdentifier, VendorId || null)
      .input("ModifiedOn", sql.DateTime, new Date())

      .query(`
        UPDATE InventoryMaster
        SET Description=@Description,
            InventoryGroup=@InventoryGroup,
            BrandId=@BrandId,
            Uom=@Uom,
            Price=@Price,
            GrossCost=@GrossCost,
            CurrentCost=@CurrentCost,
            QuantityOnHand=@QuantityOnHand,
            IsActive=@IsActive,
            SordCode=@SordCode,
            ShortName=@ShortName,
            isDiscountAllowed=@isDiscountAllowed,
            VendorId=@VendorId,
            ModifiedOn=@ModifiedOn
        WHERE InventoryId=@id
      `);

    res.json({ message: "✅ Updated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================== ❌ DELETE ==================
router.delete("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool.request()
      .input("id", sql.UniqueIdentifier, req.params.id)
      .query("DELETE FROM InventoryMaster WHERE InventoryId=@id");

    res.json({ message: "🗑️ Deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;