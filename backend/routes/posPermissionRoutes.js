const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
 
 
// 🔥 1. LOV - USER GROUP LIST
router.get("/groups/lov", async (req, res) => {
  try {
    const pool = await poolPromise;
 
    const result = await pool.request().query(`
      SELECT
        UserGroupId,
        UserGroupCode,
        UserGroupName
      FROM UserGroupMaster
      WHERE isActive = 1
      ORDER BY UserGroupCode
    `);
 
    res.json(result.recordset);
 
  } catch (err) {
    console.error("LOV ERROR:", err);
    res.status(500).send(err.message);
  }
});
 
 
// 🔥 2. GET - LOAD FUNCTIONS BASED ON GROUP
router.get("/group/:groupCode", async (req, res) => {
  try {
    const pool = await poolPromise;
 
    const result = await pool.request()
      .input("groupCode", sql.VarChar, req.params.groupCode)
      .query(`
        DECLARE @GroupId UNIQUEIDENTIFIER;
 
        -- 🔥 convert GroupCode → GUID
        SELECT @GroupId = UserGroupId
        FROM UserGroupMaster
        WHERE UserGroupCode = @groupCode;
 
        -- 🔥 load all functions + status
        SELECT
          F.FunctionID,
          F.FunctionCode,
          F.FunctionDescription,
          F.FunctionGroup,
          ISNULL(P.Status, 0) AS Status
        FROM PosFunctions F
        LEFT JOIN POSPermission P
          ON F.FunctionID = P.FunctionID
          AND P.CashierId = @GroupId
        ORDER BY F.SortCode
      `);
 
    res.json(result.recordset);
 
  } catch (err) {
    console.error("GET ERROR:", err);
    res.status(500).send(err.message);
  }
});
 
 
// 🔥 3. SAVE - GROUP BASED PERMISSION
router.post("/group/save", async (req, res) => {
  const { groupCode, permissions, userId } = req.body;
 
  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
 
    await transaction.begin();
 
    // 🔥 STEP 1: get GUID from groupCode
    const groupRes = await new sql.Request(transaction)
      .input("groupCode", sql.VarChar, groupCode)
      .query(`
        SELECT UserGroupId
        FROM UserGroupMaster
        WHERE UserGroupCode = @groupCode
      `);
 
    const groupId = groupRes.recordset[0]?.UserGroupId;
 
    if (!groupId) {
      throw new Error("Invalid Group Code");
    }
 
    // 🔥 STEP 2: loop save
    for (let p of permissions) {
      const request = new sql.Request(transaction);
 
      await request
        .input("groupId", sql.UniqueIdentifier, groupId)
        .input("functionId", sql.UniqueIdentifier, p.FunctionID)
        .input("status", sql.Bit, p.Status ? 1 : 0)
        .input("userId", sql.VarChar, userId)
 
        .query(`
          MERGE POSPermission AS target
          USING (
            SELECT
              @groupId AS CashierId,
              @functionId AS FunctionID
          ) AS source
 
          ON target.CashierId = source.CashierId
          AND target.FunctionID = source.FunctionID
 
          WHEN MATCHED THEN
            UPDATE SET Status = @status
 
          WHEN NOT MATCHED THEN
            INSERT (
              CashierId, FunctionID, Status, CreatedBy
            )
            VALUES (
              @groupId, @functionId, @status, @userId
            );
        `);
    }
 
    await transaction.commit();
 
    res.send("✅ Saved Successfully");
 
  } catch (err) {
    console.error("SAVE ERROR:", err);
    res.status(500).send(err.message);
  }
});
 
module.exports = router;
 