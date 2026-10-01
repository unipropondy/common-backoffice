const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

let cachedColumns = null;

// Helper function to dynamically discover available columns in the MemberMaster table
async function getTableColumns(pool) {
  if (cachedColumns) return cachedColumns;
  try {
    const checkQuery = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'MemberMaster'
    `;
    const res = await pool.request().query(checkQuery);
    cachedColumns = res.recordset.map(r => r.COLUMN_NAME.toLowerCase());
    return cachedColumns;
  } catch (err) {
    console.error("Schema check warning:", err.message);
    return [];
  }
}

// ================= GET ALL MEMBERS =================
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const columns = await getTableColumns(pool);
    const result = await pool.request().query("SELECT * FROM MemberMaster ORDER BY Name");
    
    let recordset = result.recordset;
    if (columns.includes("password")) {
      recordset = recordset.map(row => {
        if (row.Password) {
          try {
            row.Password = Buffer.from(row.Password, "base64").toString("utf8");
          } catch (e) {
            console.error("Failed to decode password:", e.message);
          }
        }
        return row;
      });
    }
    res.json(recordset);
  } catch (err) {
    console.error("GET Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ================= INSERT NEW MEMBER =================
router.post("/", async (req, res) => {
  try {
    const { Name, Phone, Email, Balance, CreditLimit, CurrentBalance, Password } = req.body;

    if (!Name || !Name.trim()) {
      return res.status(400).json({ error: "Member Name is required." });
    }

    if (!Phone || !Phone.trim()) {
      return res.status(400).json({ error: "Phone number is required and must be unique." });
    }

    if (!Email || !Email.trim()) {
      return res.status(400).json({ error: "Email is required." });
    }

    if (!Password || !Password.trim()) {
      return res.status(400).json({ error: "Password is required." });
    }

    const pool = await poolPromise;

    // Check if phone number already exists
    const phoneCheck = await pool.request()
      .input("Phone", sql.NVarChar, Phone.trim())
      .query("SELECT COUNT(*) as count FROM MemberMaster WHERE Phone = @Phone");
    if (phoneCheck.recordset[0].count > 0) {
      return res.status(400).json({ error: "This phone number is already registered to another member." });
    }

    const columns = await getTableColumns(pool);

    const insertFields = ["MemberId", "Name", "Phone", "Email", "Balance", "CreditLimit", "CurrentBalance"];
    const valuePlaceholders = ["NEWID()", "@Name", "@Phone", "@Email", "@Balance", "@CreditLimit", "@CurrentBalance"];
    let requestObj = pool.request();

    // Check for datetime columns
    if (columns.includes("createdon")) {
      insertFields.push("CreatedOn");
      valuePlaceholders.push("GETDATE()");
    } else if (columns.includes("createdat")) {
      insertFields.push("CreatedAt");
      valuePlaceholders.push("GETDATE()");
    }

    // Check for CreatedBy column
    if (columns.includes("createdby")) {
      const createdByUserId = req.body.CreatedBy || req.headers['x-user-id'] || null;
      if (createdByUserId) {
        insertFields.push("CreatedBy");
        valuePlaceholders.push("@CreatedBy");
        requestObj = requestObj.input("CreatedBy", sql.UniqueIdentifier, createdByUserId);
      }
    }

    // Check for IsActive column
    if (columns.includes("isactive")) {
      insertFields.push("IsActive");
      valuePlaceholders.push("1");
    }

    // Check for Password column
    if (columns.includes("password")) {
      insertFields.push("Password");
      valuePlaceholders.push("@Password");
      const base64Password = Password ? Buffer.from(String(Password).trim()).toString("base64") : null;
      requestObj = requestObj.input("Password", sql.VarChar, base64Password);
    }

    const queryStr = `
      INSERT INTO MemberMaster (${insertFields.join(", ")})
      VALUES (${valuePlaceholders.join(", ")})
    `;

    await requestObj
      .input("Name", sql.NVarChar, Name.trim())
      .input("Phone", sql.NVarChar, Phone ? Phone.trim() : null)
      .input("Email", sql.NVarChar, Email ? Email.trim() : null)
      .input("Balance", sql.Decimal(18, 2), (Balance !== undefined && Balance !== "" && Balance !== null) ? parseFloat(Balance) : null)
      .input("CreditLimit", sql.Decimal(18, 2), (CreditLimit !== undefined && CreditLimit !== "" && CreditLimit !== null) ? parseFloat(CreditLimit) : null)
      .input("CurrentBalance", sql.Decimal(18, 2), (CurrentBalance !== undefined && CurrentBalance !== "" && CurrentBalance !== null) ? parseFloat(CurrentBalance) : null)
      .query(queryStr);

    res.json({ success: true, message: "Member inserted successfully" });
  } catch (err) {
    console.error("INSERT Error:", err.message);
    res.status(500).json({ error: "Insert Error" });
  }
});

// ================= UPDATE MEMBER =================
router.put("/:id", async (req, res) => {
  try {
    const { Name, Phone, Email, Balance, CreditLimit, CurrentBalance, Password } = req.body;
    const { id } = req.params;

    if (!Name || !Name.trim()) {
      return res.status(400).json({ error: "Member Name is required." });
    }

    if (!Phone || !Phone.trim()) {
      return res.status(400).json({ error: "Phone number is required and must be unique." });
    }

    if (!Email || !Email.trim()) {
      return res.status(400).json({ error: "Email is required." });
    }

    if (!Password || !Password.trim()) {
      return res.status(400).json({ error: "Password is required." });
    }

    const pool = await poolPromise;

    // Check if phone number already exists for a different member
    const phoneCheck = await pool.request()
      .input("Phone", sql.NVarChar, Phone.trim())
      .input("MemberId", sql.UniqueIdentifier, id)
      .query("SELECT COUNT(*) as count FROM MemberMaster WHERE Phone = @Phone AND MemberId <> @MemberId");
    if (phoneCheck.recordset[0].count > 0) {
      return res.status(400).json({ error: "This phone number is already registered to another member." });
    }

    const columns = await getTableColumns(pool);
    let requestObj = pool.request();

    const updateFields = [
      "Name = @Name",
      "Phone = @Phone",
      "Email = @Email",
      "Balance = @Balance",
      "CreditLimit = @CreditLimit",
      "CurrentBalance = @CurrentBalance"
    ];

    // Check for ModifiedBy / ModifyUser
    const modifiedByUserId = req.body.ModifiedBy || req.headers['x-user-id'] || null;
    if (columns.includes("modifiedby") && modifiedByUserId) {
      updateFields.push("ModifiedBy = @ModifiedBy");
      requestObj = requestObj.input("ModifiedBy", sql.UniqueIdentifier, modifiedByUserId);
    } else if (columns.includes("modifyuser") && modifiedByUserId) {
      updateFields.push("ModifyUser = @ModifiedBy");
      requestObj = requestObj.input("ModifiedBy", sql.UniqueIdentifier, modifiedByUserId);
    }

    // Check for datetime columns
    if (columns.includes("modifiedon")) {
      updateFields.push("ModifiedOn = GETDATE()");
    }
    if (columns.includes("modifieddate")) {
      updateFields.push("ModifiedDate = GETDATE()");
    }
    if (columns.includes("modifyon")) {
      updateFields.push("ModifyOn = GETDATE()");
    }

    // Check for Password column
    if (columns.includes("password")) {
      updateFields.push("Password = @Password");
      const base64Password = Password ? Buffer.from(String(Password).trim()).toString("base64") : null;
      requestObj = requestObj.input("Password", sql.VarChar, base64Password);
    }

    const queryStr = `
      UPDATE MemberMaster
      SET ${updateFields.join(", ")}
      WHERE MemberId = @MemberId
    `;

    const result = await requestObj
      .input("MemberId", sql.UniqueIdentifier, id)
      .input("Name", sql.NVarChar, Name.trim())
      .input("Phone", sql.NVarChar, Phone ? Phone.trim() : null)
      .input("Email", sql.NVarChar, Email ? Email.trim() : null)
      .input("Balance", sql.Decimal(18, 2), (Balance !== undefined && Balance !== "" && Balance !== null) ? parseFloat(Balance) : null)
      .input("CreditLimit", sql.Decimal(18, 2), (CreditLimit !== undefined && CreditLimit !== "" && CreditLimit !== null) ? parseFloat(CreditLimit) : null)
      .input("CurrentBalance", sql.Decimal(18, 2), (CurrentBalance !== undefined && CurrentBalance !== "" && CurrentBalance !== null) ? parseFloat(CurrentBalance) : null)
      .query(queryStr);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Member not found" });
    }

    res.json({ success: true, message: "Member updated successfully" });
  } catch (err) {
    console.error("UPDATE Error:", err.message);
    res.status(500).json({ error: "Update Error" });
  }
});

// ================= DELETE MEMBER =================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input("MemberId", sql.UniqueIdentifier, id)
      .query("DELETE FROM MemberMaster WHERE MemberId = @MemberId");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Member not found" });
    }

    res.json({ success: true, message: "Member deleted successfully" });
  } catch (err) {
    console.error("DELETE Error:", err.message);
    res.status(500).json({ error: "Delete Error" });
  }
});

// ================= GET MEMBER USAGE STATISTICS =================
router.get("/:id/usage", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    // 1. Get total orders and total spent (both overall and current month)
    const summaryQuery = `
      SELECT 
          COUNT(DISTINCT sh.SettlementID) AS TotalOrders,
          ISNULL(SUM(sh.SysAmount), 0) AS TotalSpent,
          COUNT(DISTINCT CASE WHEN MONTH(COALESCE(sh.LastSettlementDate, sh.start_date)) = MONTH(GETDATE()) AND YEAR(COALESCE(sh.LastSettlementDate, sh.start_date)) = YEAR(GETDATE()) THEN sh.SettlementID END) AS OrdersThisMonth,
          ISNULL(SUM(CASE WHEN MONTH(COALESCE(sh.LastSettlementDate, sh.start_date)) = MONTH(GETDATE()) AND YEAR(COALESCE(sh.LastSettlementDate, sh.start_date)) = YEAR(GETDATE()) THEN sh.SysAmount ELSE 0 END), 0) AS SpentThisMonth
      FROM MemberMaster m
      INNER JOIN SettlementHeader sh ON (
          sh.MemberId = m.MemberId 
          OR REPLACE(REPLACE(sh.MobileNo, ' ', ''), '+', '') = REPLACE(REPLACE(m.Phone, ' ', ''), '+', '')
          OR RIGHT(REPLACE(REPLACE(sh.MobileNo, ' ', ''), '+', ''), 8) = RIGHT(REPLACE(REPLACE(m.Phone, ' ', ''), '+', ''), 8)
      )
      WHERE m.MemberId = @MemberId
        AND sh.IsCancelled = 0
    `;
    const summaryResult = await pool.request()
      .input("MemberId", sql.UniqueIdentifier, id)
      .query(summaryQuery);

    const summary = summaryResult.recordset[0] || { TotalOrders: 0, TotalSpent: 0, OrdersThisMonth: 0, SpentThisMonth: 0 };
    const hasThisMonth = summary.OrdersThisMonth > 0;

    // 2. Get items consumed
    const itemsQuery = `
      SELECT 
          sid.DishName,
          SUM(sid.Qty) AS TotalQty
      FROM MemberMaster m
      INNER JOIN SettlementHeader sh ON (
          sh.MemberId = m.MemberId 
          OR REPLACE(REPLACE(sh.MobileNo, ' ', ''), '+', '') = REPLACE(REPLACE(m.Phone, ' ', ''), '+', '')
          OR RIGHT(REPLACE(REPLACE(sh.MobileNo, ' ', ''), '+', ''), 8) = RIGHT(REPLACE(REPLACE(m.Phone, ' ', ''), '+', ''), 8)
      )
      INNER JOIN SettlementItemDetail sid ON sh.SettlementID = sid.SettlementID
      WHERE m.MemberId = @MemberId
        AND sh.IsCancelled = 0
      GROUP BY sid.DishName
      ORDER BY TotalQty DESC
    `;
    const itemsResult = await pool.request()
      .input("MemberId", sql.UniqueIdentifier, id)
      .query(itemsQuery);

    // 3. Get recent bills
    const billsQuery = `
      SELECT DISTINCT TOP 10
          sh.BillNo,
          COALESCE(sh.LastSettlementDate, sh.start_date) AS BillDate,
          sh.SysAmount AS TotalAmount
      FROM MemberMaster m
      INNER JOIN SettlementHeader sh ON (
          sh.MemberId = m.MemberId 
          OR REPLACE(REPLACE(sh.MobileNo, ' ', ''), '+', '') = REPLACE(REPLACE(m.Phone, ' ', ''), '+', '')
          OR RIGHT(REPLACE(REPLACE(sh.MobileNo, ' ', ''), '+', ''), 8) = RIGHT(REPLACE(REPLACE(m.Phone, ' ', ''), '+', ''), 8)
      )
      WHERE m.MemberId = @MemberId
        AND sh.IsCancelled = 0
      ORDER BY BillDate DESC
    `;
    const billsResult = await pool.request()
      .input("MemberId", sql.UniqueIdentifier, id)
      .query(billsQuery);

    // 4. Get creation details (username and date)
    const creatorQuery = `
      SELECT TOP 1
          COALESCE(NULLIF(u_mm.FullName, ''), u_mm.UserName, NULLIF(u_sh.FullName, ''), u_sh.UserName, 'System') AS CreatedByName,
          COALESCE(m.CreatedAt, sh.CreatedOn, sh.LastSettlementDate, sh.start_date) AS CreatedOnDate
      FROM MemberMaster m
      LEFT JOIN UserMaster u_mm ON m.CreatedBy = u_mm.UserId
      LEFT JOIN (
          SELECT SettlementID, MemberId, MobileNo, CreatedBy, CreatedOn, LastSettlementDate, start_date
          FROM dbo.SettlementHeader
          WHERE IsCancelled = 0
      ) sh ON (
          sh.MemberId = m.MemberId 
          OR REPLACE(REPLACE(sh.MobileNo, ' ', ''), '+', '') = REPLACE(REPLACE(m.Phone, ' ', ''), '+', '')
          OR RIGHT(REPLACE(REPLACE(sh.MobileNo, ' ', ''), '+', ''), 8) = RIGHT(REPLACE(REPLACE(m.Phone, ' ', ''), '+', ''), 8)
      )
      LEFT JOIN UserMaster u_sh ON sh.CreatedBy = u_sh.UserId
      WHERE m.MemberId = @MemberId
      ORDER BY 
          CASE WHEN m.CreatedAt IS NOT NULL THEN 0 ELSE 1 END,
          COALESCE(sh.LastSettlementDate, sh.start_date) ASC
    `;
    const creatorResult = await pool.request()
      .input("MemberId", sql.UniqueIdentifier, id)
      .query(creatorQuery);

    const creatorInfo = creatorResult.recordset[0] || { CreatedByName: 'System', CreatedOnDate: null };

    // 5. Get member financial summary
    const finQuery = `
      SELECT TOP 1
        ISNULL(Balance, 0) AS Balance,
        ISNULL(CurrentBalance, 0) AS CurrentBalance,
        ISNULL(CreditLimit, 0) AS CreditLimit
      FROM MemberMaster
      WHERE MemberId = @MemberId
    `;
    const finResult = await pool.request()
      .input("MemberId", sql.UniqueIdentifier, id)
      .query(finQuery);
    const finInfo = finResult.recordset[0] || { Balance: 0, CurrentBalance: 0, CreditLimit: 0 };

    res.json({
      success: true,
      totalOrders: hasThisMonth ? summary.OrdersThisMonth : summary.TotalOrders,
      totalSpent: hasThisMonth ? summary.SpentThisMonth : summary.TotalSpent,
      overallTotalOrders: summary.TotalOrders,
      overallTotalSpent: summary.TotalSpent,
      isThisMonth: hasThisMonth,
      items: itemsResult.recordset || [],
      recentBills: billsResult.recordset || [],
      createdByName: creatorInfo.CreatedByName,
      createdOnDate: creatorInfo.CreatedOnDate,
      balance: finInfo.Balance,
      currentBalance: finInfo.CurrentBalance,
      creditLimit: finInfo.CreditLimit
    });

  } catch (err) {
    console.error("Member Usage Error:", err.message);
    res.status(500).json({ error: "Failed to fetch member usage data." });
  }
});

module.exports = router;
