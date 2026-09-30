const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
 
// ================= GET =================
router.get("/", async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query("SELECT * FROM Paymode ORDER BY Paymode ASC;");
  res.json(result.recordset);
});
 
// ================= INSERT =================
router.post("/", async (req, res) => {
  try {
    const { position, paymode, description,DeviceSN, DeviceSalt, active, entertainment,YeahPayEnabled, image } = req.body;
 
    const pool = await poolPromise;
 
    await pool.request()
      .input("Position", sql.Decimal(18,2), Number(position))
      .input("PayMode", sql.VarChar, paymode)
      .input("Description", sql.VarChar, description)
      .input("DeviceSN", sql.VarChar, DeviceSN)
      .input("DeviceSalt", sql.VarChar, DeviceSalt)
      .input("Active", sql.Bit, active ? 1 : 0)
      .input("isEntertainment", sql.Bit, entertainment ? 1 : 0)
      .input("YeahPayEnabled", sql.Bit, YeahPayEnabled ? 1 : 0)
      .input("PaymodeImage", sql.NVarChar, image || "")
      .query(`
        INSERT INTO Paymode
        (Position, PayMode, Description, DeviceSN, DeviceSalt, Active, isEntertainment, YeahPayEnabled, PaymodeImage)
        VALUES
        (@Position, @PayMode, @Description, @DeviceSN, @DeviceSalt, @Active, @isEntertainment, @YeahPayEnabled, @PaymodeImage)
      `);
 
    res.send("Inserted Successfully");
 
  } catch (err) {
    console.log(err);
    res.status(500).send("Insert Error");
  }
});
 
// ================= UPDATE (🔥 FINAL FIX) =================
router.put("/:id", async (req, res) => {
  try {
    const { position, paymode, description,DeviceSN, DeviceSalt, active, entertainment,YeahPayEnabled, image } = req.body;
 
    const pool = await poolPromise;
 
    const oldPos = parseFloat(req.params.id);
    const newPos = parseFloat(position);
 
    console.log("OLD 👉", oldPos);
    console.log("NEW 👉", newPos);
 
    const result = await pool.request()
      .input("OldPosition", sql.Decimal(18,2), oldPos)
      .input("NewPosition", sql.Decimal(18,2), newPos)
      .input("PayMode", sql.VarChar, paymode)
      .input("Description", sql.VarChar, description)
      .input("DeviceSN", sql.VarChar, DeviceSN)
      .input("DeviceSalt", sql.VarChar, DeviceSalt)
      .input("Active", sql.Bit, active ? 1 : 0)
      .input("isEntertainment", sql.Bit, entertainment ? 1 : 0)
      .input("YeahPayEnabled", sql.Bit, YeahPayEnabled ? 1 : 0)
      .input("PaymodeImage", sql.NVarChar, image || "")
      .query(`
        UPDATE TOP (1) Paymode
        SET
          Position = @NewPosition,
          PayMode = @PayMode,
          Description = @Description,
          DeviceSN = @DeviceSN,
          DeviceSalt = @DeviceSalt,
          Active = @Active,
          isEntertainment = @isEntertainment,
          YeahPayEnabled = @YeahPayEnabled,
          PaymodeImage = @PaymodeImage
        WHERE Position = @OldPosition
      `);
 
    console.log("Rows 👉", result.rowsAffected);
 
    if (result.rowsAffected[0] === 0) {
      return res.status(400).send("Update failed");
    }
 
    res.send("Updated Successfully");
 
  } catch (err) {
    console.log(err);
    res.status(500).send("Update Error");
  }
});
 
module.exports = router;
 