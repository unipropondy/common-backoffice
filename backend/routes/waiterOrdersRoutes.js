const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// ================= GET USERS / WAITERS LIST =================
router.get("/users", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT UserId, UserCode, UserName, FullName 
      FROM [dbo].[UserMaster] 
      WHERE IsDisabled = 0 OR IsDisabled IS NULL
      ORDER BY UserName
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("[WAITER ORDERS] Get Users Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ================= GET WAITER ORDERS / SETTLEMENTS (DATE RANGE) =================
router.get("/", async (req, res) => {
  try {
    const { userName, fromDate, toDate } = req.query;

    if (!userName || !userName.trim()) {
      return res.status(400).json({ error: "User / Waiter selection is required." });
    }

    if (!fromDate || !fromDate.trim() || !toDate || !toDate.trim()) {
      return res.status(400).json({ error: "From Date and To Date selections are required." });
    }

    const pool = await poolPromise;
    const request = pool.request();

    request.input("UserName", sql.VarChar, userName.trim());
    request.input("FromDate", sql.Date, fromDate.trim());
    request.input("ToDate", sql.Date, toDate.trim());

    const query = `
      SELECT 
        a.OrderId AS SettlementID,
        a.OrderId,
        a.OrderNumber,
        a.OrderNumber AS BillNo,
        a.OrderNumber AS RefNo,
        MIN(ISNULL(a.OrderDateTime, a.CreatedOn)) AS OrderDateTime,
        MIN(ISNULL(a.OrderDateTime, a.CreatedOn)) AS LastSettlementDate,
        MIN(a.start_date) AS start_date,
        SUM(ISNULL(a.TotalDetailLineAmount, ISNULL(a.ActualAmount, 0))) AS SysAmount,
        MAX(b.FullName) AS Cashier
      FROM RestaurantOrderDetail a
      INNER JOIN UserMaster b
          ON b.UserId = a.CreatedBy
      WHERE b.UserName = @UserName
        AND CAST(ISNULL(a.OrderDateTime, a.CreatedOn) AS DATE) BETWEEN @FromDate AND @ToDate
      GROUP BY a.OrderId, a.OrderNumber
      ORDER BY MIN(ISNULL(a.OrderDateTime, a.CreatedOn)) DESC
    `;

    const result = await request.query(query);

    res.json(result.recordset);
  } catch (err) {
    console.error("[WAITER ORDERS] Get Orders Error:", err);
    res.status(500).json({ error: "Failed to fetch waiter orders data" });
  }
});

module.exports = router;
