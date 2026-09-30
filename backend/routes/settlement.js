const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// 🔥 GET TOTAL SALES
router.get("/total-sales/:terminal", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("TerminalCode", sql.VarChar, req.params.terminal)
      .query(`
        SELECT 
          ISNULL(SUM(TotalLineItemAmount),0) AS SubTotal,
          ISNULL(SUM(TotalDiscountAmount),0) AS DiscountAmount,
          ISNULL(SUM(ServiceCharge),0) AS ServiceCharge,
          ISNULL(SUM(AdditionalServiceCharge),0) AS AdditionalServiceCharge,
          ISNULL(SUM(TotalTax),0) AS TotalTax,
          ISNULL(SUM(RoundedBy),0) AS RoundedBy,
          ISNULL(SUM(Tips),0) AS Tips,
          COUNT(*) AS InvoiceCount,
          ISNULL(SUM(TotalAmount),0) AS NetTotal
        FROM RestaurantInvoiceCur
        WHERE RestaurantBillid IN (
          SELECT RestaurantBillid 
          FROM PaymentDetailCur 
          WHERE isSettlement = 0 AND Amount <> 0
        )
        AND TerminalCode = @TerminalCode
      `);

    res.json(result.recordset[0]);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching total sales");
  }
});

// 🔥 GET TOTAL SALES
router.get("/total-sales/:terminal", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("TerminalCode", sql.VarChar, req.params.terminal)
      .query(`
        SELECT 
          ISNULL(SUM(TotalLineItemAmount),0) AS SubTotal,
          ISNULL(SUM(TotalDiscountAmount),0) AS DiscountAmount,
          ISNULL(SUM(ServiceCharge),0) AS ServiceCharge,
          ISNULL(SUM(AdditionalServiceCharge),0) AS AdditionalServiceCharge,
          ISNULL(SUM(TotalTax),0) AS TotalTax,
          ISNULL(SUM(RoundedBy),0) AS RoundedBy,
          ISNULL(SUM(Tips),0) AS Tips,
          COUNT(*) AS InvoiceCount,
          ISNULL(SUM(TotalAmount),0) AS NetTotal
        FROM RestaurantInvoiceCur
        WHERE RestaurantBillid IN (
          SELECT RestaurantBillid 
          FROM PaymentDetailCur 
          WHERE isSettlement = 0 AND Amount <> 0
        )
        AND TerminalCode = @TerminalCode
      `);

    res.json(result.recordset[0]);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching total sales");
  }
});

// 🔥 GET PAYMENT DETAILS
/*router.get("/payment/:terminal", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("TerminalCode", sql.VarChar, req.params.terminal)
      .query(`
        SELECT 
          PaymodeName,
          SUM(Amount) AS Amount,
          COUNT(*) AS PayCount
        FROM PaymentDetailCur
        WHERE isSettlement = 0
        AND isDayend = 0
        AND TerminalCode = @TerminalCode
        GROUP BY PaymodeName
      `);

    res.json(result.recordset);

  } catch (err) {
    res.status(500).send(err.message);
  }
});*/

// 🔥 CHECK PENDING ORDERS
router.get("/pending-orders", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .query(`
        SELECT * 
        FROM RestaurantOrderCur
        WHERE StatusCode < 5
      `);

    res.json({
      hasPending: result.recordset.length > 0,
      data: result.recordset
    });

  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post("/settlement", async (req, res) => {
  const { terminal, userId } = req.body;

  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    const request = new sql.Request(transaction);

    // 🔥 Insert Settlement Header
    const result = await request
      .input("TerminalCode", sql.VarChar, terminal)
      .input("UserId", sql.VarChar, userId)
      .query(`
        INSERT INTO SettlementHeader (
          SettlementId,
          TerminalCode,
          CreatedBy,
          CreatedOn
        )
        OUTPUT INSERTED.SettlementId
        VALUES (NEWID(), @TerminalCode, @UserId, GETDATE())
      `);

    const settlementId = result.recordset[0].SettlementId;

    // 🔥 Update Payment as Settled
    await request
      .input("SettlementId", sql.UniqueIdentifier, settlementId)
      .query(`
        UPDATE PaymentDetailCur
        SET isSettlement = 1
        WHERE isSettlement = 0
      `);

    await transaction.commit();

    res.json({
      message: "Settlement Completed ✅",
      settlementId
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Settlement Failed ❌");
  }
});

router.get("/last-settlement/:terminal", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("TerminalCode", sql.VarChar, req.params.terminal)
      .query(`
        SELECT ISNULL(MAX(LastSettlementDate), DATEADD(DAY,-1,GETDATE())) AS LastSettlementDate
        FROM SettlementHeader
        WHERE TerminalCode = @TerminalCode
      `);

    res.json(result.recordset[0]);

  } catch (err) {
    res.status(500).send(err.message);
  }
});
module.exports = router;