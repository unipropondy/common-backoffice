const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const { v4: uuidv4 } = require("uuid");
 
/* ===============================
   🔥 PASSWORD ENCODE FUNCTION
================================*/
const encodePassword = (input) => {
  const original = (input || "").toString();
  const encoded = Buffer.from(original).toString("base64");
  return encoded; 
};
 
/* ===============================
   GET ALL USERS
================================*/
router.get("/usermaster", async (req, res) => {
  try {
    const pool = await poolPromise;
 
    const result = await pool.request().query(`
      SELECT
        UserId,
        UserCode,
        UserName,
        UserGroupid AS UserGroupId,
        CreatedBy,
        CreatedOn
      FROM dbo.UserMaster
    `);
 
    res.json(result.recordset);
 
  } catch (err) {
    console.error("GET USER ERROR:", err.message);
    res.status(500).send(err.message);
  }
});
 
/* ===============================
   GET SINGLE USER
================================*/
router.get("/usermaster/:code", async (req, res) => {
  try {
    const pool = await poolPromise;
 
    const result = await pool.request()
      .input("code", sql.VarChar, req.params.code)
      .query(`
        SELECT
          UserId,
          UserCode,
          UserName,
          UserPassword,
          UserGroupid AS UserGroupId,  
          FirstName,
          LastName,
          FullName,
          NickName,
          IdentificationNo,
          CardNumber,
          isWaiter,
          IsDisabled,
          CreatedBy,
          CreatedOn
        FROM UserMaster
        WHERE UserCode = @code
      `);
 
    res.json(result.recordset[0]);
 
  } catch (err) {
    console.error("GET SINGLE USER ERROR:", err.message);
    res.status(500).send(err.message);
  }
});
 
/* ===============================
   INSERT OR UPDATE
================================*/
router.post("/usermaster", async (req, res) => {
  try {
    const pool = await poolPromise;
 
    const {
      UserId,
      UserCode, UserName, UserPassword,
      UserGroupId, FirstName, LastName, FullName, NickName,
      IdentificationNo, CardNumber, isWaiter, IsDisabled,
      CreatedBy
    } = req.body;
 
    // 🔥 PASSWORD ENCODE
    const finalPassword = encodePassword(UserPassword);
 
    // 🔥 CREATED INFO (from frontend)
    const createdBy = CreatedBy || "SYSTEM";
    const createdOn = new Date();
 
    const cleanUserId = (UserId && UserId.length === 36) ? UserId : null;
    const cleanGroupId = (UserGroupId && UserGroupId.length === 36) ? UserGroupId : null;
 
    /* ======================
       UPDATE
    ======================*/
    if (cleanUserId) {
      await pool.request()
        .input("UserId", sql.UniqueIdentifier, cleanUserId)
        .input("UserCode", sql.VarChar(50), UserCode)
        .input("UserName", sql.VarChar(100), UserName)
        .input("UserPassword", sql.VarChar(100), finalPassword)
        .input("UserGroupid", sql.UniqueIdentifier, cleanGroupId) // ✅ FIX
        .input("FirstName", sql.VarChar(100), FirstName)
        .input("LastName", sql.VarChar(100), LastName)
        .input("FullName", sql.VarChar(150), FullName)
        .input("NickName", sql.VarChar(100), NickName)
        .input("IdentificationNo", sql.VarChar(50), IdentificationNo)
        .input("CardNumber", sql.VarChar(50), CardNumber)
        .input("isWaiter", sql.Bit, isWaiter ? 1 : 0)
        .input("IsDisabled", sql.Bit, IsDisabled ? 1 : 0)
        .query(`
          UPDATE UserMaster SET
            UserCode=@UserCode,
            UserName=@UserName,
            UserPassword=@UserPassword,
            UserGroupid=@UserGroupid,
            FirstName=@FirstName,
            LastName=@LastName,
            FullName=@FullName,
            NickName=@NickName,
            IdentificationNo=@IdentificationNo,
            CardNumber=@CardNumber,
            isWaiter=@isWaiter,
            IsDisabled=@IsDisabled
          WHERE UserId=@UserId
        `);
 
      return res.json({ message: "User Updated" });
    }
 
    /* ======================
       INSERT
    ======================*/
    if (!UserName) {
      return res.status(400).json({ message: "UserName is required" });
    }
 
    const generateUserCode = () => {
      const timePart = Date.now().toString().slice(-7);
      const randomPart = Math.floor(Math.random() * 900 + 100);
      return `USR${timePart}${randomPart}`;
    };
 
    let finalUserCode = UserCode && UserCode.trim() ? UserCode.trim() : generateUserCode();
 
    let existingUser = await pool.request()
      .input("UserCode", sql.VarChar(50), finalUserCode)
      .query(`SELECT UserId FROM UserMaster WHERE UserCode = @UserCode`);
 
    while (existingUser.recordset.length) {
      finalUserCode = generateUserCode();
      existingUser = await pool.request()
        .input("UserCode", sql.VarChar(50), finalUserCode)
        .query(`SELECT UserId FROM UserMaster WHERE UserCode = @UserCode`);
    }
 
    await pool.request()
      .input("UserId", sql.UniqueIdentifier, uuidv4())
      .input("UserCode", sql.VarChar(50), finalUserCode)
      .input("UserName", sql.VarChar(100), UserName)
      .input("UserPassword", sql.VarChar(100), finalPassword)
      .input("UserGroupid", sql.UniqueIdentifier, cleanGroupId)
      .input("FirstName", sql.VarChar(100), FirstName)
      .input("LastName", sql.VarChar(100), LastName)
      .input("FullName", sql.VarChar(150), FullName)
      .input("NickName", sql.VarChar(100), NickName)
      .input("IdentificationNo", sql.VarChar(50), IdentificationNo)
      .input("CardNumber", sql.VarChar(50), CardNumber)
      .input("isWaiter", sql.Bit, isWaiter ? 1 : 0)
      .input("IsDisabled", sql.Bit, IsDisabled ? 1 : 0)
      .input("CreatedBy", sql.VarChar(50), createdBy) // ✅ FIXED
      .input("CreatedOn", sql.DateTime, new Date())   // ✅ FIXED
      .query(`
        INSERT INTO UserMaster
        (
          UserId,UserCode,UserName,UserPassword,UserGroupid,
          FirstName,LastName,FullName,NickName,
          IdentificationNo,CardNumber,isWaiter,IsDisabled,
          CreatedBy,CreatedOn
        )
        VALUES
        (
          @UserId,@UserCode,@UserName,@UserPassword,@UserGroupid,
          @FirstName,@LastName,@FullName,@NickName,
          @IdentificationNo,@CardNumber,@isWaiter,@IsDisabled,
          @CreatedBy,GETDATE()
        )
      `);
 
    res.json({ message: "User Created" });
 
  } catch (err) {
    console.error("SAVE USER ERROR:", err.message);
    res.status(500).send(err.message);
  }
});
 
/* ===============================
   DELETE USER
================================*/
router.delete("/usermaster/:code", async (req, res) => {
  try {
    const pool = await poolPromise;
 
    await pool.request()
      .input("code", sql.VarChar, req.params.code)
      .query(`DELETE FROM UserMaster WHERE UserCode = @code`);
 
    res.json({ message: "User Deleted" });
 
  } catch (err) {
    console.error("DELETE USER ERROR:", err.message);
    res.status(500).send(err.message);
  }
});


router.get("/usergroupmaster", async (req, res) => {
  try {
    const pool = await poolPromise;
 
    const result = await pool.request().query(`
      SELECT
        UserGroupId,
        UserGroupCode,
        UserGroupName
      FROM UserGroupMaster
      ORDER BY UserGroupCode
    `);
 
    res.json(result.recordset);
 
  } catch (err) {
    console.error("GET USERGROUP ERROR:", err.message);
    res.status(500).send(err.message);
  }
});
 
module.exports = router;
 