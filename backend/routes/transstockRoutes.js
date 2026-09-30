const express = require("express");
const router = express.Router();
const { sql, pool, poolConnect } = require("../db");
const { validateHeader, validateItems } = require("../utils/validate");
const { v4: uuidv4 } = require("uuid");


// ================= POST =================
router.post("/stock", async (req, res) => {
  await poolConnect;
  const data = req.body;

  try {
    validateHeader(data);
    validateItems(data.items);

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    const tranId = uuidv4();

    // 🔥 INSERT DETAILS (VB loop same)
    for (let item of data.items) {
      await new sql.Request(transaction)
        .input("TranId", sql.UniqueIdentifier, tranId)
        .input("ItemCode", sql.VarChar, item.itemCode)
        .input("Qty", sql.Decimal(10,2), item.qty)
        .input("UnitPrice", sql.Decimal(10,2), item.price)
        .input("TotalValue", sql.Decimal(10,2), item.total)
        .input("GstPerc", sql.Decimal(5,2), item.gstPerc)
        .query(`
          INSERT INTO PurchaseDetail
          (TranId, ItemCode, Qty, UnitPrice, TotalValue, GstPerc)
          VALUES (@TranId,@ItemCode,@Qty,@UnitPrice,@TotalValue,@GstPerc)
        `);
    }

    // 🔥 INSERT HEADER
    await new sql.Request(transaction)
      .input("TranId", sql.UniqueIdentifier, tranId)
      .input("TranNo", sql.VarChar(50), data.tranNo)
      .input("TranDate", sql.DateTime, data.tranDate)
      .input("TranType", sql.Char(6), data.tranType)
      .input("SupplierId", sql.UniqueIdentifier, data.supplierId)
      .input("SupplierName", sql.VarChar(100), data.supplierName)
      .input("VendorInvoiceDate", sql.DateTime, data.invoiceDate)
      .input("GstType", sql.Char(1), data.gstType)
      .input("GSTPercentage", sql.Decimal(9,2), data.gstPerc)
      .query(`
        INSERT INTO PurchaseHeader
        (TranId,TranNo,TranDate,TranType,SupplierId,SupplierName,VendorInvoiceDate,GstType,GSTPercentage)
        VALUES
        (@TranId,@TranNo,@TranDate,@TranType,@SupplierId,@SupplierName,@VendorInvoiceDate,@GstType,@GSTPercentage)
      `);

    await transaction.commit();

    res.json({ message: "Saved Successfully ✅" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================= GET ALL =================
router.get("/stock", async (req, res) => {
  await poolConnect;

  const result = await pool.request().query(`
    SELECT * FROM PurchaseHeader ORDER BY TranDate DESC
  `);

  res.json(result.recordset);
});


// ================= GET ONE =================
router.get("/stock/:id", async (req, res) => {
  await poolConnect;

  const header = await pool.request()
    .input("TranId", sql.UniqueIdentifier, req.params.id)
    .query(`SELECT * FROM PurchaseHeader WHERE TranId=@TranId`);

  const detail = await pool.request()
    .input("TranId", sql.UniqueIdentifier, req.params.id)
    .query(`SELECT * FROM PurchaseDetail WHERE TranId=@TranId`);

  res.json({
    header: header.recordset[0],
    items: detail.recordset
  });
});


// ================= PUT =================
router.put("/stock/:id", async (req, res) => {
  await poolConnect;
  const data = req.body;

  try {
    validateHeader(data);
    validateItems(data.items);

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    // 🔥 DELETE OLD ITEMS
    await new sql.Request(transaction)
      .input("TranId", sql.UniqueIdentifier, req.params.id)
      .query(`DELETE FROM PurchaseDetail WHERE TranId=@TranId`);

    // 🔥 INSERT NEW ITEMS
    for (let item of data.items) {
      await new sql.Request(transaction)
        .input("TranId", sql.UniqueIdentifier, req.params.id)
        .input("ItemCode", sql.VarChar, item.itemCode)
        .input("Qty", sql.Decimal(10,2), item.qty)
        .query(`
          INSERT INTO PurchaseDetail
          (TranId,ItemCode,Qty)
          VALUES (@TranId,@ItemCode,@Qty)
        `);
    }

    // 🔥 UPDATE HEADER
    await new sql.Request(transaction)
      .input("TranId", sql.UniqueIdentifier, req.params.id)
      .input("SupplierName", sql.VarChar, data.supplierName)
      .query(`
        UPDATE PurchaseHeader
        SET SupplierName=@SupplierName
        WHERE TranId=@TranId
      `);

    await transaction.commit();

    res.json({ message: "Updated Successfully 🔄" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================= DELETE =================
router.delete("/stock/:id", async (req, res) => {
  await poolConnect;

  try {
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    // delete detail first
    await new sql.Request(transaction)
      .input("TranId", sql.UniqueIdentifier, req.params.id)
      .query(`DELETE FROM PurchaseDetail WHERE TranId=@TranId`);

    // delete header
    await new sql.Request(transaction)
      .input("TranId", sql.UniqueIdentifier, req.params.id)
      .query(`DELETE FROM PurchaseHeader WHERE TranId=@TranId`);

    await transaction.commit();

    res.json({ message: "Deleted Successfully ❌" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;