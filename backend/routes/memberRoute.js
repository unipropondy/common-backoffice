const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// ================= GET ALL MEMBERS ================= 

router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT *
      FROM MemberMaster
      ORDER BY CreatedAt DESC
    `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (err) {
    console.error(err);
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
      .input("MemberId", sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT *
        FROM MemberMaster
        WHERE MemberId=@MemberId
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
      Name,
      Phone,
      Email,
      CreditLimit,
      Address,
      IsActive,
      Balance,
      CurrentBalance,
      CreatedBy,
      LowBalanceAlertSent,
      Promocode,
      Promoamount
    } = req.body;

    const pool = await poolPromise;

    const MemberId = uuidv4();

    await pool.request()
      .input("MemberId", sql.UniqueIdentifier, MemberId)
      .input("Name", sql.NVarChar, Name)
      .input("Phone", sql.NVarChar, Phone)
      .input("Email", sql.NVarChar, Email)
      .input("CreditLimit", sql.Decimal(18,2), CreditLimit || 0)
      .input("Address", sql.VarChar, Address)
      .input("IsActive", sql.Bit, IsActive)
      .input("Balance", sql.Decimal(18,2), Balance || 0)
      .input("CurrentBalance", sql.Decimal(18,2), CurrentBalance || 0)
      .input("CreatedBy", sql.UniqueIdentifier, CreatedBy)
      .input("LowBalanceAlertSent", sql.Bit, LowBalanceAlertSent || 0)
      .input("Promocode", sql.NVarChar, Promocode)
      .input("Promoamount", sql.Decimal(18,2), Promoamount || 0)

      .query(`
      INSERT INTO MemberMaster
      (
        MemberId,
        Name,
        Phone,
        Email,
        CreditLimit,
        CreatedAt,
        Address,
        IsActive,
        Balance,
        CurrentBalance,
        CreatedBy,
        LowBalanceAlertSent,
        Promocode,
        Promoamount
      )

      VALUES
      (
        @MemberId,
        @Name,
        @Phone,
        @Email,
        @CreditLimit,
        GETDATE(),
        @Address,
        @IsActive,
        @Balance,
        @CurrentBalance,
        @CreatedBy,
        @LowBalanceAlertSent,
        @Promocode,
        @Promoamount
      )
      `);

    res.json({
      success: true,
      message: "Member Created Successfully"
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
      Name,
      Phone,
      Email,
      CreditLimit,
      Address,
      IsActive,
      Balance,
      CurrentBalance,
      ModifiedBy,
      LowBalanceAlertSent,
      Promocode,
      Promoamount
    } = req.body;

    const pool = await poolPromise;

    await pool.request()

      .input("MemberId", sql.UniqueIdentifier, req.params.id)
      .input("Name", sql.NVarChar, Name)
      .input("Phone", sql.NVarChar, Phone)
      .input("Email", sql.NVarChar, Email)
      .input("CreditLimit", sql.Decimal(18,2), CreditLimit)
      .input("Address", sql.VarChar, Address)
      .input("IsActive", sql.Bit, IsActive)
      .input("Balance", sql.Decimal(18,2), Balance)
      .input("CurrentBalance", sql.Decimal(18,2), CurrentBalance)
      .input("ModifiedBy", sql.UniqueIdentifier, ModifiedBy)
      .input("LowBalanceAlertSent", sql.Bit, LowBalanceAlertSent)
      .input("Promocode", sql.NVarChar, Promocode)
      .input("Promoamount", sql.Decimal(18,2), Promoamount)

      .query(`

      UPDATE MemberMaster

      SET

      Name=@Name,
      Phone=@Phone,
      Email=@Email,
      CreditLimit=@CreditLimit,
      Address=@Address,
      IsActive=@IsActive,
      Balance=@Balance,
      CurrentBalance=@CurrentBalance,
      ModifiedBy=@ModifiedBy,
      ModifiedDate=GETDATE(),
      LowBalanceAlertSent=@LowBalanceAlertSent,
      Promocode=@Promocode,
      Promoamount=@Promoamount

      WHERE MemberId=@MemberId

      `);

    res.json({
      success:true,
      message:"Updated Successfully"
    });

  } catch(err){

    res.status(500).json({
      success:false,
      message:err.message
    });

  }

});

// ================= delete BY ID ================= 

router.delete("/:id", async (req, res) => {

  try {

    const pool = await poolPromise;

    await pool.request()
      .input("MemberId", sql.UniqueIdentifier, req.params.id)
      .query(`
        DELETE FROM MemberMaster
        WHERE MemberId=@MemberId
      `);

    res.json({
      success:true,
      message:"Deleted Successfully"
    });

  } catch(err){

    res.status(500).json({
      success:false,
      message:err.message
    });

  }

});

module.exports = router;