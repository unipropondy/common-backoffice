const express = require("express");
const router = express.Router();
 
const { sql, poolPromise } = require("../db");
const { v4: uuidv4 } = require("uuid");
 
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
/* =========================
   GET ALL VENDORS
========================= */
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
 
    const result = await pool.request().query(`
      SELECT
        VendorId,
        VendorCode,
        Name,
        ContactPerson,
        EmailId1,
        Address1_City,
        Address1_Telephone2,
        GSTPercentage,
        StatusCode
      FROM VendorMaster
    `);
 
    res.json(result.recordset);
 
  } catch (err) {
    console.error("GET ERROR:", err.message);
    res.status(500).send("Server Error");
  }
});
 
/* =========================
   ADD VENDOR
========================= */
router.post("/", async (req, res) => {
  try {
    const {
      VendorCode,
      CompanyName,
      ContactPerson,
      EmailId,
      HandPhone,
      OfficeAddress,
      City,
      PostalCode,
      Phone,
      GST,
      Active
    } = req.body;
 
    const cleanVendorCode = VendorCode?.trim();
    const cleanCompanyName = CompanyName?.trim();
    const cleanContactPerson = ContactPerson?.trim();

    // 🔥 EMAIL VALIDATION (ADD HERE)
    if (EmailId && !isValidEmail(EmailId)) {
    return res.status(400).send("Invalid Email Format");
    }
 
    if (!cleanVendorCode || !cleanCompanyName || !cleanContactPerson) {
      return res.status(400).send("Missing fields");
    }
 
    const pool = await poolPromise;
 
    await pool.request()
      .input("VendorId", sql.UniqueIdentifier, uuidv4())
      .input("VendorCode", sql.VarChar, cleanVendorCode)
      .input("Name", sql.VarChar, cleanCompanyName)
      .input("ContactPerson", sql.VarChar, cleanContactPerson)
      .input("EmailId1", sql.VarChar, EmailId || "")
      .input("Address1_Line1", sql.VarChar, OfficeAddress || "")
      .input("Address1_City", sql.VarChar, City || "")
      .input("Address1_PostalCode", sql.VarChar, PostalCode || "")
      .input("Address1_Telephone1", sql.VarChar, HandPhone || "")
      .input("Address1_Telephone2", sql.VarChar, Phone || "")
      .input("GSTPercentage", sql.Decimal(18,2), Number(GST) || 0)
      .input("StatusCode", sql.Int, Active ? 1 : 0)
 
      // REQUIRED
      .input("OwnerBusinessUnitId", sql.UniqueIdentifier, uuidv4())
      .input("CreatedBy", sql.UniqueIdentifier, uuidv4())
      .input("CreatedOn", sql.DateTime, new Date())
 
      .query(`
        INSERT INTO VendorMaster
        (
          VendorId,
          VendorCode,
          Name,
          ContactPerson,
          EmailId1,
          EmailId2,
          WebSite,
          Address1_Name,
          Address1_TypeCode,
          Address1_PrimaryContactName,
          Address1_Line1,
          Address1_Line2,
          Address1_Line3,
          Address1_City,
          Address1_State,
          Address1_Country,
          Address1_PostalCode,
          Address1_Telephone1,
          Address1_Telephone2,
          Address1_Fax,
          Address1_FreightTermCode,
          Address1_ShippingMethodCode,
          PaymentTermsCode,
          CreditLimit,
          StatusCode,
          OwnerBusinessUnitId,
          CreatedBy,
          CreatedOn,
          GstType,
          GSTPercentage
        )
        VALUES
        (
          @VendorId,
          @VendorCode,
          @Name,
          @ContactPerson,
          @EmailId1,
          '',
          '',
          'Office Address',
          1,
          @ContactPerson,
          @Address1_Line1,
          '',
          '',
          @Address1_City,
          '',
          '',
          @Address1_PostalCode,
          @Address1_Telephone1,
          @Address1_Telephone2,
          '',
          1,
          1,
          1,
          0,
          @StatusCode,
          @OwnerBusinessUnitId,
          @CreatedBy,
          @CreatedOn,
          'I',
          @GSTPercentage
        )
      `);
 
    res.json({ message: "Vendor saved successfully" });
 
  } catch (err) {
    console.error("POST ERROR:", err.message);
    res.status(500).send(err.message);
  }
});

/* =========================
   UPDATE VENDOR
========================= */
router.put("/:id", async (req, res) => {
  try {
    const {
      VendorCode,
      CompanyName,
      ContactPerson,
      EmailId,
      HandPhone,
      OfficeAddress,
      City,
      PostalCode,
      Phone,
      GST,
      Active
    } = req.body;

    const VendorId = req.params.id;

    // 🔥 EMAIL VALIDATION (ADD HERE)
    if (EmailId && !isValidEmail(EmailId)) {
    return res.status(400).send("Invalid Email Format");
    }

    if (!VendorId) {
      return res.status(400).send("VendorId missing");
    }

    const pool = await poolPromise;

    await pool.request()
      .input("VendorId", sql.UniqueIdentifier, VendorId)
      .input("VendorCode", sql.VarChar, VendorCode)
      .input("Name", sql.VarChar, CompanyName)
      .input("ContactPerson", sql.VarChar, ContactPerson)
      .input("EmailId1", sql.VarChar, EmailId || "")
      .input("Address1_Line1", sql.VarChar, OfficeAddress || "")
      .input("Address1_City", sql.VarChar, City || "")
      .input("Address1_PostalCode", sql.VarChar, PostalCode || "")
      .input("Address1_Telephone1", sql.VarChar, HandPhone || "")
      .input("Address1_Telephone2", sql.VarChar, Phone || "")
      .input("GSTPercentage", sql.Decimal(18,2), Number(GST) || 0)
      .input("StatusCode", sql.Int, Active ? 1 : 0)

      .query(`
        UPDATE VendorMaster SET
          VendorCode=@VendorCode,
          Name=@Name,
          ContactPerson=@ContactPerson,
          EmailId1=@EmailId1,
          Address1_Line1=@Address1_Line1,
          Address1_City=@Address1_City,
          Address1_PostalCode=@Address1_PostalCode,
          Address1_Telephone1=@Address1_Telephone1,
          Address1_Telephone2=@Address1_Telephone2,
          GSTPercentage=@GSTPercentage,
          StatusCode=@StatusCode,
        WHERE VendorId=@VendorId
      `);

    res.json({ message: "Vendor updated successfully" });

  } catch (err) {
    console.error("UPDATE ERROR:", err.message);
    res.status(500).send(err.message);
  }
});
 
module.exports = router;
 
 
 
 