const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const { v4: uuidv4 } = require("uuid");
 
/* ===============================
   GET ALL USER GROUPS
================================*/
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
 
    const result = await pool.request().query(`
      SELECT
        UserGroupId AS id,
        UserGroupCode AS code,
        UserGroupName AS name,
        isActive AS active,
        CreatedDate AS createdDate,
        ModifyDate AS modifyDate
      FROM UserGroupMaster
      ORDER BY UserGroupCode
    `);
 
    res.json(result.recordset);
 
  } catch (err) {
    console.error("GET USERGROUP ERROR:", err.message);
    res.status(500).send(err.message);
  }
});
 
/* ===============================
   INSERT / UPDATE
================================*/
router.post("/", async (req, res) => {
  try {
    const pool = await poolPromise;
 
    const { code, name, active } = req.body;
 
    const check = await pool.request()
      .input("code", sql.VarChar, code)
      .query(`SELECT * FROM UserGroupMaster WHERE UserGroupCode = @code`);
 
    if (check.recordset.length > 0) {
      await pool.request()
        .input("code", sql.VarChar, code)
        .input("name", sql.VarChar, name)
        .input("active", sql.Bit, active)
        .query(`
          UPDATE UserGroupMaster SET
            UserGroupName=@name,
            isActive=@active,
            ModifyDate=GETDATE()
          WHERE UserGroupCode=@code
        `);
 
      return res.json({ message: "Updated" });
    }
 
    await pool.request()
      .input("id", sql.UniqueIdentifier, uuidv4())
      .input("code", sql.VarChar, code)
      .input("name", sql.VarChar, name)
      .input("active", sql.Bit, active)
      .query(`
        INSERT INTO UserGroupMaster
        (UserGroupId, UserGroupCode, UserGroupName, isActive, CreatedDate)
        VALUES
        (@id, @code, @name, @active, GETDATE())
      `);
 
    res.json({ message: "Inserted" });
 
  } catch (err) {
    console.error("SAVE USERGROUP ERROR:", err.message);
    res.status(500).send(err.message);
  }
});
 
/* ===============================
   DELETE
================================*/
router.delete("/:code", async (req, res) => {
  try {
    const pool = await poolPromise;
 
    const check = await pool.request()
      .input("code", sql.VarChar, req.params.code)
      .query(`
        SELECT * FROM UserMaster
        WHERE UserGroupId = (
          SELECT UserGroupId FROM UserGroupMaster WHERE UserGroupCode=@code
        )
      `);
 
    if (check.recordset.length > 0) {
      return res.status(400).send("Users exist under this group");
    }
 
    await pool.request()
      .input("code", sql.VarChar, req.params.code)
      .query(`
        DELETE FROM UserGroupMaster WHERE UserGroupCode=@code
      `);
 
    res.json({ message: "Deleted" });
 
  } catch (err) {
    console.error("DELETE USERGROUP ERROR:", err.message);
    res.status(500).send(err.message);
  }
});
 
module.exports = router;
 