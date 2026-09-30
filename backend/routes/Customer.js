const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const { v4: uuidv4 } = require("uuid");

// ✅ ADD HERE

const toInt = (val) => {
  if (val === "" || val === undefined || val === null) return 0; // 🔥 CHANGE
  return parseInt(val);
};

const toDecimal = (val) => {
  if (val === "" || val === undefined || val === null) return null;
  return parseFloat(val);
};

const toBit = (val) => {
  return val === true || val === 1 || val === "1" ? 1 : 0;
};

const toDate = (val) => {
  return val ? new Date(val) : null;
};



// ================= GET =================
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        CustomerId,
        CustomerCode,
        Name,
        ContactPerson,
        EmailId1,
        Address1_City,
        Address1_Telephone1
      FROM dbo.CustomerMaster
      ORDER BY Name
    `);

    res.json(result.recordset);

  } catch (err) {
    console.log("GET ERROR ❌", err);
    res.status(500).json({ error: err.message });
  }
});

// ================= GET NEW CODE =================
router.get("/newcode", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        'C-' + RIGHT('00000000' + 
        CAST(ISNULL(MAX(CAST(SUBSTRING(CustomerCode, 3, LEN(CustomerCode)) AS INT)), 0) + 1 AS VARCHAR), 
        8) AS NewCustomerCode
      FROM dbo.CustomerMaster
    `);

    res.json({ code: result.recordset[0].NewCustomerCode });

  } catch (err) {
    console.log("NEW CODE ERROR ❌", err);
    res.status(500).json({ error: err.message });
  }
});


// ================= GET BY ID =================
router.get("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;

    const paramId = req.params.id;

    console.log("API HIT ID 👉", paramId);

    // 🔥 THIS LINE FIXES YOUR ERROR
    if (!paramId || paramId === "undefined") {
      return res.status(400).json({ error: "Invalid CustomerId" });
    }

    const result = await pool.request()
      .input("CustomerId", sql.UniqueIdentifier, paramId)
      .query(`
        SELECT 
          CustomerId,
          CustomerCode,
          Name,
          ContactPerson,
          EmailId1,
          Address1_City,
          Address1_Telephone1
        FROM dbo.CustomerMaster
        WHERE CustomerId = @CustomerId
      `);

    res.json(result.recordset[0]);

  } catch (err) {
    console.log("GET BY ID ERROR ❌", err);
    res.status(500).json({ error: err.message });
  }
});


// ================= INSERT / UPDATE =================
router.post("/", async (req, res) => {
  try {
    const {
    CustomerId,
    Name,
    ContactPerson,
    EmailId1,
    Address1_Line1,
    Address1_City,
    Address1_PostalCode,
    Address1_Telephone1,
    DOB,
    Anniversary,
    CreatedBy,

    // 🔥 ADD THIS
    FromDate,
    ToDate,
    InvoiceDate,
    CardNo,
    TotalPoints,
    RedeemPoints

  } = req.body;

    const pool = await poolPromise;

const isValidGuid = (val) => {
  if (!val) return false;   // 🔥 MOST IMPORTANT LINE

  return typeof val === "string" &&
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val.trim());
};

let id;

if (isValidGuid(CustomerId)) {
  id = CustomerId;
} else {
  id = uuidv4();
}



let createdByValue;

if (isValidGuid(CreatedBy)) {
  createdByValue = CreatedBy;
} else {
  createdByValue = "00000000-0000-0000-0000-000000000001";
}

    // 🔥 ADD HERE
console.log("CustomerId 👉", CustomerId);
console.log("Final ID 👉", id);
console.log("CreatedBy 👉", CreatedBy);
console.log("Final CreatedBy 👉", createdByValue);

    // ✅ SAFE DATE
    const dobValue = DOB && DOB !== "" ? new Date(DOB) : null;
    const annValue = Anniversary && Anniversary !== "" ? new Date(Anniversary) : null;

    let newCode = null;

    // ================= CHECK EXISTS =================
   let exists;

if (CustomerId && CustomerId !== "") {
  // 🔵 EDIT MODE
  exists = await pool.request()
    .input("CustomerId", sql.UniqueIdentifier, CustomerId)
    .query(`
      SELECT CustomerId 
      FROM dbo.CustomerMaster
      WHERE CustomerId = @CustomerId
    `);
} else {
  // 🟢 NEW MODE (IMPORTANT FIX)
  exists = { recordset: [] };   // 🔥 SKIP SQL CALL
}

    if (exists.recordset.length > 0) {

      // ================= UPDATE =================
     await pool.request()

  // 🔥 PRIMARY
  .input("CustomerId", sql.UniqueIdentifier, id)

  // 🔥 BASIC
  .input("Name", sql.VarChar, Name || "")
  .input("ContactPerson", sql.VarChar, ContactPerson || "")
  .input("GovermentId", sql.VarChar, req.body.GovermentId || "")

  // 🔥 CATEGORY
  .input("CategoryCode", sql.Int, 1)
  .input("ClassificationCode", sql.Int, 1)

  // 🔥 EMAIL
  .input("EmailId1", sql.VarChar, EmailId1 || "")
  .input("EmailId2", sql.VarChar, req.body.EmailId2 || "")

  // 🔥 ADDRESS 1
  .input("Address1_Name", sql.VarChar, req.body.Address1_Name || "")
  .input("Address1_Id", sql.UniqueIdentifier,
    isValidGuid(req.body.Address1_Id) ? req.body.Address1_Id : null)
  .input("Address1_TypeCode", sql.Int, 1)
  .input("Address1_Line1", sql.VarChar, Address1_Line1 || "")
  .input("Address1_Line2", sql.VarChar, req.body.Address1_Line2 || "")
  .input("Address1_Line3", sql.VarChar, req.body.Address1_Line3 || "")
  .input("Address1_City", sql.VarChar, Address1_City || "")
  .input("Address1_State", sql.VarChar, req.body.Address1_State || "")
  .input("Address1_Country", sql.VarChar, req.body.Address1_Country || "")
  .input("Address1_PostalCode", sql.VarChar, Address1_PostalCode || "")
  .input("Address1_Telephone1", sql.VarChar, Address1_Telephone1 || "")

  // 🔥 ADDRESS 2
  .input("Address2_Id", sql.UniqueIdentifier,
    isValidGuid(req.body.Address2_Id) ? req.body.Address2_Id : null)

  // 🔥 FINANCE
  .input("PaymentTermsCode", sql.Int, toInt(req.body.PaymentTermsCode))
  .input("CreditLimit", sql.Decimal(18,2), toDecimal(req.body.CreditLimit))
  .input("CreditOnHold", sql.Bit, toBit(req.body.CreditOnHold))
  .input("RevenueThisYear", sql.Decimal(18,2), toDecimal(req.body.RevenueThisYear))

  // 🔥 STATUS
  .input("StatusCode", sql.Int, 1)

  // 🔥 OWNER
  .input("OwnerBusinessUnitId", sql.UniqueIdentifier,
    isValidGuid(req.body.OwnerBusinessUnitId) ? req.body.OwnerBusinessUnitId : null)

  // 🔥 DATES
  .input("DOB", sql.SmallDateTime, toDate(DOB))
  .input("Anniversary", sql.SmallDateTime, toDate(Anniversary))
 .input("FromDate", sql.DateTime, req.body.FromDate ? toDate(req.body.FromDate) : null)
.input("ToDate", sql.DateTime, req.body.ToDate ? toDate(req.body.ToDate) : null)


  // 🔥 EXTRA
  .input("RouteId", sql.UniqueIdentifier,
    isValidGuid(req.body.RouteId) ? req.body.RouteId : null)

  .input("MealRates", sql.Int, toInt(req.body.MealRates))
  .input(
  "OpeningBalance",
  sql.Int,
  req.body.OpeningBalance !== undefined
    ? toInt(req.body.OpeningBalance)
    : 0
)
  .input("MemberMealAllowed", sql.Int, toInt(req.body.MemberMealAllowed))
  .input("Nosales", sql.Int, toInt(req.body.Nosales))
  .input("CardNo", sql.VarChar, CardNo || "")
 .input("InvoiceDate", sql.DateTime, req.body.InvoiceDate ? toDate(req.body.InvoiceDate) : null)
  .input("TotalPoints", sql.Decimal(18,2), toDecimal(TotalPoints))
  .input("RedeemPoints", sql.Decimal(18,2), toDecimal(RedeemPoints))


  .query(`
    UPDATE dbo.CustomerMaster
    SET 
      Name = @Name,
      ContactPerson = @ContactPerson,
      GovermentId = @GovermentId,
      CategoryCode = @CategoryCode,
      ClassificationCode = @ClassificationCode,
      EmailId1 = @EmailId1,
      EmailId2 = @EmailId2,

      Address1_Name = @Address1_Name,
      Address1_Id = @Address1_Id,
      Address1_TypeCode = @Address1_TypeCode,
      Address1_Line1 = @Address1_Line1,
      Address1_Line2 = @Address1_Line2,
      Address1_Line3 = @Address1_Line3,
      Address1_City = @Address1_City,
      Address1_State = @Address1_State,
      Address1_Country = @Address1_Country,
      Address1_PostalCode = @Address1_PostalCode,
      Address1_Telephone1 = @Address1_Telephone1,

      Address2_Id = @Address2_Id,

      PaymentTermsCode = @PaymentTermsCode,
      CreditLimit = @CreditLimit,
      CreditOnHold = @CreditOnHold,
      RevenueThisYear = @RevenueThisYear,

      StatusCode = @StatusCode,
      OwnerBusinessUnitId = @OwnerBusinessUnitId,

      DOB = @DOB,
      Anniversary = @Anniversary,
      FromDate = @FromDate,
      ToDate = @ToDate,

      RouteId = @RouteId,
      MealRates = @MealRates,
      OpeningBalance = @OpeningBalance,
      MemberMealAllowed = @MemberMealAllowed,
      Nosales = @Nosales,

      CardNo = @CardNo,
      InvoiceDate = @InvoiceDate,
      TotalPoints = @TotalPoints,
      RedeemPoints = @RedeemPoints,

      ModifiedOn = GETDATE()

    WHERE CustomerId = @CustomerId
  `);

      // ✅ GET EXISTING CODE
      const codeRes = await pool.request()
        .input("CustomerId", sql.UniqueIdentifier, id)
        .query(`
          SELECT CustomerCode 
          FROM dbo.CustomerMaster
          WHERE CustomerId = @CustomerId
        `);

      newCode = codeRes.recordset[0]?.CustomerCode || null;

    } else {

      // ================= GENERATE CODE =================
      const codeResult = await pool.request().query(`
        SELECT 
          'C-' + RIGHT('00000000' + 
          CAST(ISNULL(MAX(CAST(SUBSTRING(CustomerCode, 3, LEN(CustomerCode)) AS INT)), 0) + 1 AS VARCHAR), 
          8) AS NewCustomerCode
        FROM dbo.CustomerMaster
      `);

      newCode = codeResult.recordset[0]?.NewCustomerCode || "C-00000001";

      // 🔥 FINAL CHECK (ADD HERE)
console.log("🔥 FINAL CHECK");
console.log("CustomerId 👉", id);
console.log("CreatedBy 👉", createdByValue);
console.log("TYPE ID 👉", typeof id);
console.log("TYPE CreatedBy 👉", typeof createdByValue);

      // ================= INSERT =================
     await pool.request()

    // 🔥 PRIMARY
    .input("CustomerId", sql.UniqueIdentifier, id)
    .input("CustomerCode", sql.VarChar, newCode)

    // 🔥 BASIC
    .input("Name", sql.VarChar, Name || "")
    .input("ContactPerson", sql.VarChar, ContactPerson || "")
    .input("GovermentId", sql.VarChar, req.body.GovermentId || "")

    // 🔥 CATEGORY
    .input("CategoryCode", sql.Int, 1)
    .input("ClassificationCode", sql.Int, 1)

    // 🔥 EMAIL
    .input("EmailId1", sql.VarChar, EmailId1 || "")
    .input("EmailId2", sql.VarChar, req.body.EmailId2 || "")

    // 🔥 ADDRESS 1
    .input("Address1_Name", sql.VarChar, req.body.Address1_Name || "")
    .input("Address1_Id", sql.UniqueIdentifier,
      isValidGuid(req.body.Address1_Id) ? req.body.Address1_Id : null)
    .input("Address1_TypeCode", sql.Int, 1)
    .input("Address1_Line1", sql.VarChar, Address1_Line1 || "")
    .input("Address1_Line2", sql.VarChar, req.body.Address1_Line2 || "")
    .input("Address1_Line3", sql.VarChar, req.body.Address1_Line3 || "")
    .input("Address1_City", sql.VarChar, Address1_City || "")
    .input("Address1_State", sql.VarChar, req.body.Address1_State || "")
    .input("Address1_Country", sql.VarChar, req.body.Address1_Country || "")
    .input("Address1_PostalCode", sql.VarChar, Address1_PostalCode || "")
    .input("Address1_Telephone1", sql.VarChar, Address1_Telephone1 || "")

    // 🔥 ADDRESS 2
    .input("Address2_Id", sql.UniqueIdentifier,
      isValidGuid(req.body.Address2_Id) ? req.body.Address2_Id : null)

    // 🔥 FINANCE
    .input("PaymentTermsCode", sql.Int, toInt(req.body.PaymentTermsCode))
    .input("CreditLimit", sql.Decimal(18,2), toDecimal(req.body.CreditLimit))
    .input("CreditOnHold", sql.Bit, toBit(req.body.CreditOnHold))
    .input("RevenueThisYear", sql.Decimal(18,2), toDecimal(req.body.RevenueThisYear))

    // 🔥 STATUS
    .input("StatusCode", sql.Int, 1)

    // 🔥 OWNER
    .input("OwnerBusinessUnitId", sql.UniqueIdentifier,
      isValidGuid(req.body.OwnerBusinessUnitId) ? req.body.OwnerBusinessUnitId : null)

    // 🔥 CREATED
    .input("CreatedBy", sql.UniqueIdentifier, createdByValue)

    // 🔥 DATES
    .input("DOB", sql.SmallDateTime, toDate(DOB))
    .input("Anniversary", sql.SmallDateTime, toDate(Anniversary))
    .input("FromDate", sql.DateTime, req.body.FromDate ? toDate(req.body.FromDate) : null)
    .input("ToDate", sql.DateTime, req.body.ToDate ? toDate(req.body.ToDate) : null)

    // 🔥 EXTRA
    .input("RouteId", sql.UniqueIdentifier,
      isValidGuid(req.body.RouteId) ? req.body.RouteId : null)

  
    .input(
  "OpeningBalance",
  sql.Int,
  req.body.OpeningBalance !== undefined
    ? toInt(req.body.OpeningBalance)
    : 0
)
    .input("MemberMealAllowed", sql.Int, toInt(req.body.MemberMealAllowed))
    .input("Nosales", sql.Int, toInt(req.body.Nosales))
    .input("CardNo", sql.VarChar, CardNo || "")
    .input("InvoiceDate", sql.DateTime, req.body.InvoiceDate ? toDate(req.body.InvoiceDate) : null)
    .input("TotalPoints", sql.Decimal(18,2), toDecimal(TotalPoints))
    .input("RedeemPoints", sql.Decimal(18,2), toDecimal(RedeemPoints))

    .input("MealRates", sql.Int, toInt(req.body.MealRates))
    // .input("MemberMealAllowed", sql.Int, toInt(req.body.MemberMealAllowed))
    // .input("Nosales", sql.Int, toInt(req.body.Nosales))

    .query(`
    INSERT INTO dbo.CustomerMaster (
      CustomerId, CustomerCode, Name, ContactPerson,
      GovermentId, CategoryCode, ClassificationCode,
      EmailId1, EmailId2,
      Address1_Name, Address1_Id, Address1_TypeCode,
      Address1_Line1, Address1_Line2, Address1_Line3,
      Address1_City, Address1_State, Address1_Country,
      Address1_PostalCode, Address1_Telephone1,
      Address2_Id,
      PaymentTermsCode, CreditLimit, CreditOnHold, RevenueThisYear,
      StatusCode, OwnerBusinessUnitId,
      CreatedBy, CreatedOn,
      DOB, Anniversary, FromDate, ToDate,
      RouteId,
      MealRates, OpeningBalance, MemberMealAllowed, Nosales,CardNo,
      InvoiceDate, TotalPoints, RedeemPoints
    )
    VALUES (
      @CustomerId, @CustomerCode, @Name, @ContactPerson,
      @GovermentId, @CategoryCode, @ClassificationCode,
      @EmailId1, @EmailId2,
      @Address1_Name, @Address1_Id, @Address1_TypeCode,
      @Address1_Line1, @Address1_Line2, @Address1_Line3,
      @Address1_City, @Address1_State, @Address1_Country,
      @Address1_PostalCode, @Address1_Telephone1,
      @Address2_Id,
      @PaymentTermsCode, @CreditLimit, @CreditOnHold, @RevenueThisYear,
      @StatusCode, @OwnerBusinessUnitId,
      @CreatedBy, GETDATE(),
      @DOB, @Anniversary, @FromDate, @ToDate,
      @RouteId,
      @MealRates, @OpeningBalance, @MemberMealAllowed, @Nosales,@CardNo,
      @InvoiceDate, @TotalPoints, @RedeemPoints
    )
    `);
    }

    res.json({
      message: "Saved Successfully",
      CustomerId: id,
      CustomerCode: newCode
    });

  } catch (err) {
    console.log("POST ERROR ❌", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;