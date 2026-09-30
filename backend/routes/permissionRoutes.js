const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
 
// ================= FORM GROUPS =================
router.get("/form-groups", async (req, res) => {
  try {
    const pool = await poolPromise;
 
    const result = await pool.request().query(`
      SELECT DISTINCT FormGroupCode
      FROM Forms
      ORDER BY FormGroupCode
    `);
 
    res.json(result.recordset);
 
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching form groups");
  }
});
 
 
// ================= FETCH PERMISSIONS =================
router.post("/permissions/fetch", async (req, res) => {
  try {
    const { userGroup, formGroups } = req.body;
   
    // 🔥 DEBUG LOG
    console.log(`[PERMISSIONS v4] Request for Group: "${userGroup}"`);
 
    const pool = await poolPromise;
 
    // 🔥 v4 - CONDITIONAL ROLE FILTER
    let baseQuery = `
      SELECT
        a.UserGroupCode,
        b.FormGroupCode,
        b.FormCode,
        b.FormDescription,
 
        CASE WHEN LTRIM(RTRIM(a.AllowRead)) = 'R' THEN 'R' ELSE 'N' END AS AllowRead,
        CASE WHEN LTRIM(RTRIM(a.AllowAdd)) = 'A' THEN 'A' ELSE 'N' END AS AllowAdd,
        CASE WHEN LTRIM(RTRIM(a.AllowUpdate)) = 'U' THEN 'U' ELSE 'N' END AS AllowUpdate,
        CASE WHEN LTRIM(RTRIM(a.AllowDelete)) = 'D' THEN 'D' ELSE 'N' END AS AllowDelete
 
      FROM Forms b
      INNER JOIN UserPermission a ON LTRIM(RTRIM(a.FormCode)) = LTRIM(RTRIM(b.FormCode))
      WHERE (
        @userGroup = 'ALL'
        OR UPPER(LTRIM(RTRIM(a.UserGroupCode))) = UPPER(LTRIM(RTRIM(@userGroup)))
      )
    `;
 
    // 🔥 ADDITIONAL FILTER (FormGroup)
    if (formGroups && formGroups.length > 0) {
      const groups = formGroups
        .map(g => `'${g.trim()}'`)
        .join(",");
 
      baseQuery += `
        AND LTRIM(RTRIM(b.FormGroupCode)) IN (${groups})
      `;
    }
 
    // 🔥 ORDER
    baseQuery += ` ORDER BY a.UserGroupCode, b.FormGroupCode, b.FormDescription`;
 
    const result = await pool.request()
      .input("userGroup", sql.NVarChar, userGroup ? userGroup.toString().trim() : "ALL")
      .query(baseQuery);
 
    console.log(`[PERMISSIONS v4] Returned ${result.recordset.length} rows`);
 
    // 🔥 LOG DATA
    const data = result.recordset.map(r => ({
      UserGroupCode: (r.UserGroupCode || "").trim(),
      FormGroupCode: (r.FormGroupCode || "").trim(),
      FormCode: (r.FormCode || "").trim(),
      FormDescription: (r.FormDescription || "").trim(),
      AllowAdd: (r.AllowAdd || "").trim() === "A",
      AllowUpdate: (r.AllowUpdate || "").trim() === "U",
      AllowDelete: (r.AllowDelete || "").trim() === "D",
      AllowRead: (r.AllowRead || "").trim() === "R"
    }));
 
    res.json({ version: "v4", data: data });
 
  } catch (err) {
    console.error("FETCH ERROR:", err.message);
    res.status(500).send(err.message);
  }
});
 
 
// ================= UPDATE PERMISSIONS =================
router.post("/permissions/update", async (req, res) => {
  try {
    const { userGroup, data } = req.body;
 
    const pool = await poolPromise;
 
    for (let item of data) {
 
      await pool.request()
        .input("userGroup", sql.VarChar, userGroup)
        .input("formCode", sql.VarChar, item.FormCode)
        .input("add", sql.VarChar, item.AllowAdd ? "A" : "N")
        .input("update", sql.VarChar, item.AllowUpdate ? "U" : "N")
        .input("delete", sql.VarChar, item.AllowDelete ? "D" : "N")
        .input("read", sql.VarChar, item.AllowRead ? "R" : "N")
        .query(`
          MERGE UserPermission AS target
          USING (SELECT @userGroup AS UserGroupCode, @formCode AS FormCode) AS source
          ON target.UserGroupCode = source.UserGroupCode
          AND target.FormCode = source.FormCode
 
          WHEN MATCHED THEN
            UPDATE SET
              AllowAdd = @add,
              AllowUpdate = @update,
              AllowDelete = @delete,
              AllowRead = @read
 
          WHEN NOT MATCHED THEN
            INSERT (UserGroupCode, FormCode, AllowAdd, AllowUpdate, AllowDelete, AllowRead)
            VALUES (@userGroup, @formCode, @add, @update, @delete, @read);
        `);
    }
 
    res.send("Permission Updated Successfully ✅");
 
  } catch (err) {
    console.error("UPDATE ERROR:", err.message);
    res.status(500).send(err.message);
  }
});
 
module.exports = router;
 