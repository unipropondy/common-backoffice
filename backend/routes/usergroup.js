const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");


// 🔥 GET ALL
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .query(`
        SELECT 
          UserGroupId,
          UserGroupCode,
          UserGroupName,
          isActive,
          CreatedUser,
          Createddate,
          ModifyUser,
          ModifyDate
        FROM UserGroupMaster
        ORDER BY Createddate DESC
      `);

    res.json(result.recordset);

  } catch (err) {
    res.status(500).send(err.message);
  }
});


// 🔥 GET BY CODE
router.get("/:code", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("UserGroupCode", sql.VarChar, req.params.code)
      .query(`
        SELECT * FROM UserGroupMaster
        WHERE UserGroupCode = @UserGroupCode
      `);

    res.json(result.recordset[0]);

  } catch (err) {
    res.status(500).send(err.message);
  }
});


// 🔥 CREATE (POST)
router.post("/", async (req, res) => {
  try {
    const {
      userGroupCode,
      userGroupName,
      isActive,
      createdUser
    } = req.body;

    const pool = await poolPromise;

    // 🔍 Duplicate check
    const check = await pool.request()
      .input("UserGroupCode", sql.VarChar, userGroupCode)
      .query(`
        SELECT * FROM UserGroupMaster 
        WHERE UserGroupCode = @UserGroupCode
      `);

    if (check.recordset.length > 0) {
      return res.status(400).send("Code already exists ❌");
    }

    await pool.request()
      .input("UserGroupId", sql.UniqueIdentifier, sql.UniqueIdentifier().generate())
      .input("UserGroupCode", sql.VarChar, userGroupCode)
      .input("UserGroupName", sql.VarChar, userGroupName)
      .input("isActive", sql.Bit, isActive)
      .input("CreatedUser", sql.UniqueIdentifier, createdUser || null)
      .query(`
        INSERT INTO UserGroupMaster 
        (
          UserGroupId,
          UserGroupCode,
          UserGroupName,
          isActive,
          CreatedUser,
          Createddate
        )
        VALUES 
        (
          @UserGroupId,
          @UserGroupCode,
          @UserGroupName,
          @isActive,
          @CreatedUser,
          GETDATE()
        )
      `);

    res.send("Created Successfully ✅");

  } catch (err) {
    res.status(500).send(err.message);
  }
});


// 🔥 UPDATE (PUT)
router.put("/:id", async (req, res) => {
  try {
    const {
      userGroupName,
      isActive,
      modifyUser
    } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("UserGroupId", sql.UniqueIdentifier, req.params.id)
      .input("UserGroupName", sql.VarChar, userGroupName)
      .input("isActive", sql.Bit, isActive)
      .input("ModifyUser", sql.UniqueIdentifier, modifyUser || null)
      .query(`
        UPDATE UserGroupMaster
        SET 
          UserGroupName = @UserGroupName,
          isActive = @isActive,
          ModifyUser = @ModifyUser,
          ModifyDate = GETDATE()
        WHERE UserGroupId = @UserGroupId
      `);

    res.send("Updated Successfully ✅");

  } catch (err) {
    res.status(500).send(err.message);
  }
});


// 🔥 DELETE (SOFT DELETE)
router.delete("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool.request()
      .input("UserGroupId", sql.UniqueIdentifier, req.params.id)
      .query(`
        UPDATE UserGroupMaster
        SET 
          isActive = 0,
          ModifyDate = GETDATE()
        WHERE UserGroupId = @UserGroupId
      `);

    res.send("Deleted Successfully ✅");

  } catch (err) {
    res.status(500).send(err.message);
  }
});


module.exports = router;