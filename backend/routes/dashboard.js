const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db"); // ✅ CHANGE HERE

router.get("/dashboard", async (req, res) => {
  try {
    const pool = await poolPromise; // ✅ ADD THIS

    const result = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM kitchen) AS kitchen_total,
        (SELECT COUNT(*) FROM kitchen WHERE isactive=1) AS kitchen_active,
        (SELECT COUNT(*) FROM kitchen WHERE isactive=0) AS kitchen_inactive,

        (SELECT COUNT(*) FROM CategoryMaster) AS category_total,
        (SELECT COUNT(*) FROM CategoryMaster WHERE isactive=1) AS category_active,
        (SELECT COUNT(*) FROM CategoryMaster WHERE isactive=0) AS category_inactive,

        (SELECT COUNT(*) FROM dishgroupmaster) AS dishgroup_total,
        (SELECT COUNT(*) FROM dishgroupmaster WHERE isactive=1) AS dishgroup_active,
        (SELECT COUNT(*) FROM dishgroupmaster WHERE isactive=0) AS dishgroup_inactive,

        (SELECT COUNT(*) FROM dishmaster) AS dish_total,
        (SELECT COUNT(*) FROM dishmaster WHERE isactive=1) AS dish_active,
        (SELECT COUNT(*) FROM dishmaster WHERE isactive=0) AS dish_inactive
    `);

    res.json(result.recordset[0]); // ✅ CHANGE HERE

  } catch (err) {
    console.log("DASHBOARD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;