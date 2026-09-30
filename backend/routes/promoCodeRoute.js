const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// ================= GET ALL MEMBERS ================= 

router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT *
      FROM PromoCodeMaster
      ORDER BY CreatedDate DESC
    `);

    const data = result.recordset.map(row => {
      let promoImage = null;

      if (row.PromoImage) {
        promoImage =
          `data:image/jpeg;base64,${row.PromoImage.toString("base64")}`;
      }

      return {
        ...row,
        PromoImage: promoImage
      };
    });

    res.json({
      success: true,
      data: data,
    });

  } catch (err) {
    console.error("GET PROMO ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ================= GET MEMBER BY ID ================= 

router.get("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("PromoId", sql.UniqueIdentifier, req.params.id)
      .query(`
       SELECT *
        FROM PromoCodeMaster
        WHERE PromoId = @PromoId
      `);

    res.json({
      success: true,
      data: result.recordset[0],
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ================= post  ====insert============= 
const { v4: uuidv4 } = require("uuid");

router.post("/", async (req, res) => {

  try {

    const {
      PromoCode,
      PromoName,
      DiscountType,
      DiscountValue,
      MaxUsage,
      UsedCount,
      PromoImage,
      IsActive
    } = req.body;

    const PromoId = uuidv4();

    const pool = await poolPromise;

    let promoImageBuffer = null;

    if (PromoImage) {
      const base64Data = PromoImage.includes(",")
        ? PromoImage.split(",")[1]
        : PromoImage;

      promoImageBuffer = Buffer.from(base64Data, "base64");
    }


    const existingPromo = await pool.request()
      .input("PromoCode", sql.NVarChar, PromoCode)
      .query(`
    SELECT PromoId
    FROM PromoCodeMaster
    WHERE PromoCode = @PromoCode
  `);

    if (existingPromo.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Promo Code already exists."
      });
    }

    await pool.request()
      .input("PromoId", sql.UniqueIdentifier, PromoId)
      .input("PromoCode", sql.NVarChar, PromoCode)
      .input("PromoName", sql.NVarChar, PromoName)
      .input("DiscountType", sql.NVarChar, DiscountType)
      .input("DiscountValue", sql.Decimal(18, 2), DiscountValue || 0)
      .input("MaxUsage", sql.Int, MaxUsage || 0)
      .input("UsedCount", sql.Int, UsedCount || 0)
      .input("PromoImage", sql.VarBinary(sql.MAX), promoImageBuffer)
      .input("IsActive", sql.Bit, IsActive ?? true)

      .query(`
      INSERT INTO PromoCodeMaster
      (
        PromoId,
        PromoCode,
        PromoName,
        DiscountType,
        DiscountValue,
        MaxUsage,
        UsedCount,
        PromoImage,
        IsActive
      )
    VALUES
      (
        @PromoId,
        @PromoCode,
        @PromoName,
        @DiscountType,
        @DiscountValue,
        @MaxUsage,
        @UsedCount,
        @PromoImage,
        @IsActive
      )
      
      `);

    res.json({
      success: true,
      message: "Promo Code Created Successfully"
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});

// =================member put update BY ID ================= 

router.put("/:id", async (req, res) => {

  try {

    const {
      PromoCode,
      PromoName,
      DiscountType,
      DiscountValue,
      MaxUsage,
      UsedCount,
      PromoImage,
      IsActive
    } = req.body;

    const pool = await poolPromise;

    let promoImageBuffer = null;

    if (PromoImage) {
      const base64Data = PromoImage.includes(",")
        ? PromoImage.split(",")[1]
        : PromoImage;

      promoImageBuffer = Buffer.from(base64Data, "base64");
    }

    const existingPromo = await pool.request()
      .input("PromoCode", sql.NVarChar, PromoCode)
      .input("PromoId", sql.UniqueIdentifier, req.params.id)
      .query(`
    SELECT PromoId
    FROM PromoCodeMaster
    WHERE PromoCode = @PromoCode
      AND PromoId <> @PromoId
  `);

    if (existingPromo.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Promo Code already exists."
      });
    }

    await pool.request()

      .input("PromoId", sql.UniqueIdentifier, req.params.id)
      .input("PromoCode", sql.NVarChar, PromoCode)
      .input("PromoName", sql.NVarChar, PromoName)
      .input("DiscountType", sql.NVarChar, DiscountType)
      .input("DiscountValue", sql.Decimal(18, 2), DiscountValue)
      .input("MaxUsage", sql.Int, MaxUsage)
      .input("UsedCount", sql.Int, UsedCount || 0)
      .input("PromoImage", sql.VarBinary(sql.MAX), promoImageBuffer)
      .input("IsActive", sql.Bit, IsActive ?? true)

      .query(`

      UPDATE PromoCodeMaster

      SET

      PromoCode=@PromoCode,
      PromoName=@PromoName,
      DiscountType=@DiscountType,
      DiscountValue=@DiscountValue,
      MaxUsage=@MaxUsage,
      UsedCount=@UsedCount,
      PromoImage=@PromoImage,
      IsActive=@IsActive

      WHERE PromoId=@PromoId

      `);

    res.json({
      success: true,
      message: "Updated Successfully"
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});

// ================= delete BY ID ================= 

router.delete("/:id", async (req, res) => {

  try {

    const pool = await poolPromise;

    await pool.request()
      .input("PromoId", sql.UniqueIdentifier, req.params.id)
      .query(`
        DELETE FROM PromoCodeMaster
        WHERE PromoId=@PromoId
      `);

    res.json({
      success: true,
      message: "Deleted Successfully"
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});

module.exports = router;