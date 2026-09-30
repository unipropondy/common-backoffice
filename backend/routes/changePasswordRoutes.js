const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// CHANGE PASSWORD
router.post("/", async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const { userId, oldPassword, newPassword } = req.body;

    // ✅ Validate input
    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const pool = await poolPromise;

    // 🔍 Get user password
    const result = await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .query(`
        SELECT UserPassword
        FROM UserMaster
        WHERE UserId = @userId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const dbPassword = result.recordset[0].UserPassword;

    // 🔓 Decode password
   const encodedOldPassword = Buffer.from(oldPassword).toString("base64");

    console.log("DB Password RAW:", dbPassword);
    console.log("Encoded Entered Password:", encodedOldPassword);
    console.log("Entered Password:", oldPassword);

    // ❌ Check old password
   if (dbPassword.trim() !== encodedOldPassword.trim()) {
  return res.status(400).json({ message: "Old password incorrect" });
}

    // 🔐 Encode new password
    const encodedNewPassword = Buffer.from(newPassword).toString("base64");

    // ✅ Update password
    await pool.request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("newPassword", sql.VarChar, encodedNewPassword)
      .query(`
        UPDATE UserMaster
        SET UserPassword = @newPassword
        WHERE UserId = @userId
      `);

    // ✅ FINAL RESPONSE (ONLY HERE)
    res.json({ message: "Password updated successfully ✅" });

  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;