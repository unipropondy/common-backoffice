
const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// ========================================
// GET USERS FROM UserMaster
// GET /api/user-sales/users
// ========================================
router.get("/users", async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
      SELECT UserId, UserName
      FROM UserMaster
      ORDER BY UserName
    `);

        res.json(result.recordset);
    } catch (error) {
        console.error("UserMaster API Error:", error);

        res.status(500).json({
            message: error.message || "Failed to load users",
        });
    }
});

// ========================================
// USER-WISE SALES REPORT
// GET /api/user-sales?userId=USER_ID
// ========================================
router.get("/", async (req, res) => {
    try {
        const { userId, fromDate, toDate } = req.query;

        if (!userId || !fromDate || !toDate) {
            return res.status(400).json({
                message: "User, From Date, and To Date are required",
            });
        }

        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        const parsedFromDate = new Date(`${fromDate}T00:00:00Z`);
        const parsedToDate = new Date(`${toDate}T00:00:00Z`);
        if (
            !datePattern.test(fromDate) ||
            !datePattern.test(toDate) ||
            Number.isNaN(parsedFromDate.getTime()) ||
            Number.isNaN(parsedToDate.getTime()) ||
            parsedFromDate.toISOString().slice(0, 10) !== fromDate ||
            parsedToDate.toISOString().slice(0, 10) !== toDate
        ) {
            return res.status(400).json({
                message: "From Date and To Date must be valid dates",
            });
        }

        if (fromDate > toDate) {
            return res.status(400).json({
                message: "From Date cannot be later than To Date",
            });
        }

        const userIdValue = String(userId).trim();
        const pool = await poolPromise;

        const result = await pool
            .request()
            .input("UserId", sql.VarChar(100), userIdValue)
            .input("FromDate", sql.VarChar(10), fromDate)
            .input("ToDate", sql.VarChar(10), toDate)
            .query(`
                SELECT DISTINCT
                    a.SettlementID,
                    a.SysAmount,
                    a.BillNo,
                    CONVERT(char(10), a.start_date, 23) AS BillDate,
                    a.CreatedBy,
                    COALESCE(c.UserName, CAST(a.CreatedBy AS varchar(50))) AS UserName
                FROM SettlementHeader a
                LEFT JOIN SettlementItemDetail b
                    ON a.SettlementID = b.SettlementID
                LEFT JOIN UserMaster c
                    ON CAST(c.UserId AS varchar(50)) = CAST(a.CreatedBy AS varchar(50))
                    OR c.UserName = CAST(a.CreatedBy AS varchar(50))
                    OR c.UserCode = CAST(a.CreatedBy AS varchar(50))
                WHERE
                    (
                        CAST(a.CreatedBy AS varchar(50)) = @UserId
                        OR CAST(c.UserId AS varchar(50)) = @UserId
                        OR c.UserName = @UserId
                        OR c.UserCode = @UserId
                    )
                    AND CAST(a.start_date AS date)
                        BETWEEN CONVERT(date, @FromDate, 23) AND CONVERT(date, @ToDate, 23)
                ORDER BY a.BillNo DESC
            `);

        res.json(result.recordset);
    } catch (error) {
        console.error("User Sales Error:", error);

        res.status(500).json({
            message: error.message || "Failed to load user sales",
        });
    }
});

module.exports = router;
