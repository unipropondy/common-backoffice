const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");


// ===== TOTAL SALES =====
router.get("/total-sales/:terminal", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("TerminalCode", sql.VarChar, req.params.terminal)
      .query(`SELECT 
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

    res.json(result.recordset[0] || {});

  } catch (err) {
    console.error("❌ TOTAL SALES ERROR:", err);
    res.status(500).send(err.message);
  }
});


// ===== PAYMENT DETAILS =====
router.get("/payment/:terminal/:userId", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("TerminalCode", sql.VarChar, req.params.terminal)
      .input("UserId", sql.VarChar, req.params.userId)
      .query(`
           SELECT 
          Remarks AS PaymentType,
          ISNULL(SUM(Amount),0) AS Amount,
          COUNT(*) AS PayCount
         FROM PaymentDetailCur
        WHERE isSettlement = 0
        AND isDayend = 0
        AND TerminalCode = @TerminalCode
        GROUP BY Remarks
        
      `);

    res.json(result.recordset || []);

  } catch (err) {
    console.error("❌ PAYMENT ERROR:", err);
    res.status(500).send(err.message);
  }
});
// SELECT 
//           ISNULL(PaymentName,'') AS PaymodeName,
//           ISNULL(SUM(Amount),0) AS Amount,
//           COUNT(*) AS PayCount
//         FROM PaymentDetailCur
//         WHERE isSettlement = 0
//         AND isDayend = 0
//         AND TerminalCode = @TerminalCode

//         GROUP BY PaymentName

// ===== TRANSACTIONS =====
// router.get("/transactions/:terminal/:userId", async (req, res) => {
//   try {
//     const pool = await poolPromise;

//     const result = await pool.request()
//       .input("TerminalCode", sql.VarChar, req.params.terminal)
//       .input("UserId", sql.VarChar, req.params.userId)
//       .query(`SELECT 
//               ISNULL(TransactionMode,'') AS TransactionMode,
//               ISNULL(TransactionType,'') AS TransactionType,
//               ISNULL(Amount,0) AS Amount
//               FROM Transactions
//               WHERE TerminalCode = @TerminalCode
//          AND UserId = @UserId
//       `);

//     res.json(result.recordset || []);

//   } catch (err) {
//     console.error("❌ TRANSACTION ERROR:", err);
//     res.status(500).send(err.message);
//   }
// });


// ===== SALES SUMMARY =====
router.get("/sales-summary/:terminal", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("TerminalCode", sql.VarChar, req.params.terminal)
      .query(`

             SELECT 
          ISNULL(Paymode,'') AS Paymode,
          ISNULL(SUM(Amount),0) AS Amount
        FROM PaymentDetailCur
        WHERE TerminalCode = @TerminalCode
        AND isSettlement = 0
        GROUP BY Paymode 
      `);

    res.json(result.recordset || []);

  } catch (err) {
    console.error("❌ SALES SUMMARY ERROR:", err);
    res.status(500).send(err.message);
  }
});

// SELECT 
//         ISNULL(PaymodeName,'') AS PaymodeName,
//         ISNULL(SUM(Amount),0) AS Amount
//       FROM PaymentDetailCur
//       WHERE TerminalCode = @TerminalCode
//       AND isSettlement = 0
//       GROUP BY PaymodeName


// ===== CHECK PENDING ORDERS =====
router.get("/pending-orders", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT * FROM RestaurantOrderCur
      WHERE StatusCode < 5
    `);

    res.json({
      hasPending: result.recordset.length > 0,
      data: result.recordset
    });

  } catch (err) {
    console.error("❌ PENDING ERROR:", err);
    res.status(500).send(err.message);
  }
});


// ===== SAVE SETTLEMENT =====
router.post("/settlement", async (req, res) => {
  const { terminal, userId } = req.body;

  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    const request = new sql.Request(transaction);

    // HEADER
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

    // UPDATE ONLY THIS TERMINAL
    await request
      .input("TerminalCode", sql.VarChar, terminal)
      .query(`
        UPDATE PaymentDetailCur
        SET isSettlement = 1
        WHERE isSettlement = 0
        AND TerminalCode = @TerminalCode
      `);

    await transaction.commit();

    res.json({
      message: "Settlement Completed ✅",
      settlementId
    });

  } catch (err) {
    console.error("❌ SETTLEMENT ERROR:", err);
    res.status(500).send(err.message);
  }
});


// ===== LAST SETTLEMENT =====
router.get("/last-settlement/:terminal", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("TerminalCode", sql.VarChar, req.params.terminal)
      .query(`
        SELECT 
          ISNULL(MAX(CreatedOn), DATEADD(DAY,-1,GETDATE())) AS LastSettlementDate
        FROM SettlementHeader
        WHERE TerminalCode = @TerminalCode
      `);

    res.json(result.recordset[0]);

  } catch (err) {
    console.error("❌ LAST SETTLEMENT ERROR:", err);
    res.status(500).send(err.message);
  }
});

// ===== TERMINAL LIST =====
router.get("/terminals", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT TerminalCode, TerminalName FROM TerminalMaster
    `);

    console.log("🔥 TERMINALS FROM DB 👉", result.recordset);

    res.json(result.recordset);

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

module.exports = router;