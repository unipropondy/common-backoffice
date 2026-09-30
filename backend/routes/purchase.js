const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const { v4: uuidv4 } = require("uuid");

// 🔢 AUTO TRAN NO
router.get("/next-tran-no", async (req, res) => {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT NextPurchaseNumber FROM Organization
  `);

  let no = result.recordset[0].NextPurchaseNumber;
  res.json({ tranNo: "P" + String(no).padStart(6, "0") });
});

// 📋 LIST
router.get("/", async (req, res) => {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT TranId, TranNo, SupplierName, NetAmount FROM PurchaseHeader
  `);

  res.json(result.recordset);
});

// 💾 SAVE
router.post("/save", async (req, res) => {

  const { header, details } = req.body;
  const tranId = uuidv4();

  const pool = await poolPromise;
  const tx = new sql.Transaction(pool);

  try {
    await tx.begin();

    let total = 0, gstTotal = 0;

    for (let item of details) {

      let qty = +item.qty;
      let price = +item.price;
      let gst = +item.gst;

      let amt = qty * price;
      let gstAmt = header.gstType === "Inclusive"
        ? amt * (gst / (100 + gst))
        : amt * (gst / 100);

      if (header.gstType === "Inclusive") amt -= gstAmt;

      total += amt;
      gstTotal += gstAmt;

      await tx.request().query(`
        INSERT INTO PurchaseDetail
        VALUES('${tranId}','${item.itemCode}','${item.desc}',
        ${qty},${price},${amt},${gst},${gstAmt})
      `);
    }

    await tx.request().query(`
      INSERT INTO PurchaseHeader
      VALUES('${tranId}','${header.tranNo}',GETDATE(),
      '${header.tranType}','${header.vendorId}','${header.vendorName}',
      '${header.gstType}',${header.gstPercentage},
      ${total},${gstTotal},${total + gstTotal})
    `);

    await tx.request().query(`
      UPDATE Organization SET NextPurchaseNumber += 1
    `);

    await tx.commit();

    res.json({ message: "Saved" });

  } catch (err) {
    await tx.rollback();
    res.status(500).json({ error: err.message });
  }
});

// ❌ DELETE
router.delete("/:id", async (req, res) => {
  const pool = await poolPromise;

  await pool.request().query(`
    DELETE FROM PurchaseDetail WHERE TranId='${req.params.id}'
  `);

  await pool.request().query(`
    DELETE FROM PurchaseHeader WHERE TranId='${req.params.id}'
  `);

  res.json({ message: "Deleted" });
});

// 🔥 GET SINGLE (FOR EDIT)
router.get("/:tranNo", async (req, res) => {
  const pool = await poolPromise;

  try {
    // HEADER
    const header = await pool.request().query(`
      SELECT * FROM PurchaseHeader
      WHERE TranNo = '${req.params.tranNo}'
    `);

    if (header.recordset.length === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    const tranId = header.recordset[0].TranId;

    // DETAILS
    const details = await pool.request().query(`
      SELECT * FROM PurchaseDetail
      WHERE TranId = '${tranId}'
    `);

    res.json({
      ...header.recordset[0],
      items: details.recordset
    });

  } catch (err) {
    console.log("GET ERROR ❌", err);
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;