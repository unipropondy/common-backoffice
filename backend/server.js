if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: require("path").join(__dirname, ".env") });
}
const express = require("express");
const cors = require("cors");
const { sql, poolPromise, dbContext } = require("./db");
const { v4: uuidv4 } = require("uuid");
const multer = require('multer');
const path = require("path");
const fs = require("fs");


const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    // Reflect the requesting origin back to allow it, supporting credentials: true
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "X-User-Id", "X-Db-Name"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use((req, res, next) => {
  const dbName = req.headers["x-db-name"];
  dbContext.run(dbName, next);
});

const inventoryRoutes = require("./routes/inventory");

app.use("/inventory", inventoryRoutes);



app.use("/images", express.static(path.join(__dirname, "images")));

const dashboardRoutes = require("./routes/dashboard");

app.use("/api", dashboardRoutes);

const dishMasterMigrationRoutes =
  require("./routes/dishMasterMigration");

app.use(
  "/api/dishmaster-migration",
  dishMasterMigrationRoutes
);
const rewardRoutes = require("./routes/rewardRoutes");

console.log("rewardRoutes TYPE:", typeof rewardRoutes);
console.log("rewardRoutes VALUE:", rewardRoutes);

app.use("/api/rewardpoints", rewardRoutes);

const comboRoutes = require("./routes/comboRoutes");

app.use("/api/combo", comboRoutes);

const memberMasterRoutes = require("./routes/memberMasterRoutes");
app.use("/api/member", memberMasterRoutes);

const waiterOrdersRoutes = require("./routes/waiterOrdersRoutes");
app.use("/api/waiter-orders", waiterOrdersRoutes);



const promoCodeRoute = require("./routes/promoCodeRoute");

app.use("/api/promocode", promoCodeRoute);


const vendorRoutes = require("./routes/vendorRoutes");

// 🔥 USE ROUTES
app.use("/api/vendor", vendorRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api", userRoutes);


const userGroupRoutes = require("./routes/userGroupRoutes");
app.use("/api/usergroup", userGroupRoutes);

const login = require("./routes/login");

app.use("/api", login);

const paymodeRoutes = require("./routes/paymodeRoutes");
app.use("/api/paymode", paymodeRoutes);

const picklistRoutes = require("./routes/picklistRoutes");
app.use("/api", picklistRoutes);

const settlementRoutes = require("./routes/settlementRoutes");
app.use("/api/settlement", settlementRoutes);

const terminalRoutes = require("./routes/terminalRoutes");
app.use("/api/terminal", terminalRoutes);

const customerRoutes = require("./routes/Customer");

app.use("/api/customermember", customerRoutes);

// 🔥 FireCourse Route connect
const firecourseRoutes = require("./routes/firecourse");
app.use("/api/firecourse", firecourseRoutes);

const discountRoutes = require("./routes/discountRoutes");
app.use("/api/discount", discountRoutes);

const emailRoutes = require("./routes/EmailSettings");

app.use("/api/email-settings", emailRoutes);

const changePasswordRoutes = require("./routes/changePasswordRoutes");
app.use("/api/change-password", changePasswordRoutes);

const priceListRoutes = require("./routes/priceListRoutes");
app.use("/api/pricelist", priceListRoutes)

const printerRoutes = require("./routes/printer");

app.use("/api/printer", printerRoutes);

const barcodeRoutes = require("./routes/barcodeRoutes");

app.use("/api/barcode", barcodeRoutes);

const timeEntryRoutes = require("./routes/timeEntry");
app.use("/api/timeEntry", timeEntryRoutes);

const cancelRoutes = require("./routes/cancelRemarks");
app.use("/api/cancelRemarks", cancelRoutes);

const permissionRoutes = require("./routes/permissionRoutes");

app.use("/api", permissionRoutes);

const happyhoursRoutes = require("./routes/happyhours");
app.use("/api/happyhours", happyhoursRoutes);

const posRoutes = require("./routes/posPermissionRoutes");
app.use("/api/pos-permission", posRoutes);

const stockRoutes = require("./routes/stock");
app.use("/api/stock", stockRoutes);

const transstockRoutes = require("./routes/transstockRoutes");
app.use("/api/transstockRoutes", transstockRoutes);

const customerMasterRoutes = require("./routes/customerMaster");

app.use("/api/customermaster", customerMasterRoutes);

const TableRoutes = require("./routes/TableRoutes");

// ✅ FINAL ROUTE
app.use("/api/tablemaster", TableRoutes);

const organizationRoutes = require("./routes/organizationRoutes");

app.use("/api/organization", organizationRoutes);

const dayEndReportRoutes = require("./routes/dayendreportroutes");
app.use("/api/dayendreport", dayEndReportRoutes);


const salesreportRoutes = require("./routes/salesreportRoutes");
app.use("/api/reports", salesreportRoutes);

const serverMasterRoutes = require("./routes/serverMasterRoutes");
app.use("/api/server", serverMasterRoutes);

const qrCodeRoutes = require("./routes/QrcodeRoutes");

app.use("/qrmaster", qrCodeRoutes);

const dishOrderItemShareRoutes = require("./routes/dishOrderItemShareRoutes");

app.use("/dishorderitemshare", dishOrderItemShareRoutes);


app.post("/api/check-target-password", async (req, res) => {
  try {
    const { password } = req.body;

    const pool = await poolPromise;

    const encodedPassword =
      Buffer.from(password).toString("base64");

    const result = await pool.request()
      .input("Password", sql.VarChar(100), encodedPassword)
      .query(`
        SELECT *
        FROM UserMaster
        WHERE UserPassword = @Password
        and   (UserGroupid = (select UserGroupid
                     from UserGroupMaster
                     where UserGroupName ='ADMIN'))
      `);

    if (result.recordset.length > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }

  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
});

/* ------------------- GET ALL KITCHENS ------------------- */
app.get("/kitchen", async (req, res) => {
  try {
    const { KitchenTypeCode } = req.query; // optional filter
    const pool = await poolPromise;

    // Base query
    let query = `
      SELECT KitchenTypeId, KitchenTypeCode, KitchenTypeName, isActive
      FROM Kitchen 
    `;

    // Add WHERE only if KitchenTypeCode is provided
    if (KitchenTypeCode) {
      query += " WHERE KitchenTypeCode = @KitchenTypeCode";
    }

    query += " ORDER BY KitchenTypeCode DESC";

    const request = pool.request();

    // Bind input parameter correctly
    if (KitchenTypeCode) {
      // Use INT if KitchenTypeCode is numeric in SQL
      request.input("KitchenTypeCode", sql.Int, parseInt(KitchenTypeCode));
    }

    // Optional: measure query time
    // console.time("KitchenQuery");
    const result = await request.query(query);
    // console.timeEnd("KitchenQuery");

    res.json(result.recordset);
  } catch (err) {
    console.error("🔥 KITCHEN ERROR FULL:", err);

    res.status(500).json({
      message: "Kitchen API Failed",
      error: err.message,
      stack: err.stack
    });
  }
});
//   catch (err) {
//     console.error("Error fetching kitchens:", err);
//      res.status(500).send("Server Error");
//   }
// });

/* ------------------- GET NEXT KITCHEN CODE ------------------- */
app.get("/kitchen/nextcode", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT NextNumber
      FROM Autonumbers
      WHERE TableName='KitchenType'
      AND FieldName='KitchenTypeCode'
    `);

    res.json(result.recordset[0]);

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

/* ------------------- CREATE KITCHEN ------------------- */
app.post("/kitchen", async (req, res) => {
  try {
    const {
      KitchenTypeCode,
      KitchenTypeName,
      isActive,
      BusinessUnitId,
      CreatedBy
    } = req.body;

    if (!KitchenTypeCode || !KitchenTypeName) {
      return res.status(400).send("Kitchen code and name required");
    }

    const pool = await poolPromise;
    const KitchenTypeId = uuidv4();

    await pool.request()
      .input("KitchenTypeId", sql.UniqueIdentifier, KitchenTypeId)
      .input("KitchenTypeCode", sql.Numeric(18, 0), KitchenTypeCode)
      .input("KitchenTypeName", sql.VarChar(100), KitchenTypeName)
      .input("isActive", sql.Bit, isActive)
      .input("BusinessUnitId", sql.UniqueIdentifier, BusinessUnitId)
      .input("CreatedBy", sql.UniqueIdentifier, CreatedBy)
      .input("CreatedOn", sql.DateTime, new Date())
      .query(`
        INSERT INTO Kitchen
        (KitchenTypeId, KitchenTypeCode, KitchenTypeName, isActive, BusinessUnitId, CreatedBy, CreatedOn)
        VALUES
        (@KitchenTypeId, @KitchenTypeCode, @KitchenTypeName, @isActive, @BusinessUnitId, @CreatedBy, GETDATE())
      `);

    // Update Autonumber
    await pool.request().query(`
      UPDATE Autonumbers
      SET NextNumber = NextNumber + 1
      WHERE TableName='KitchenType'
      AND FieldName='KitchenTypeCode'
    `);

    res.json({ message: "Kitchen Created Successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).send("Save failed");
  }
});

/* ------------------- UPDATE KITCHEN ------------------- */
app.put("/kitchen/:id", async (req, res) => {
  try {
    const KitchenTypeId = req.params.id;
    const {
      KitchenTypeCode,
      KitchenTypeName,
      isActive,
      ModifiedBy
    } = req.body;

    if (!KitchenTypeCode || !KitchenTypeName) {
      return res.status(400).send("Kitchen code and name required");
    }

    const pool = await poolPromise;

    await pool.request()
      .input("KitchenTypeId", sql.UniqueIdentifier, KitchenTypeId)
      .input("KitchenTypeCode", sql.Numeric(18, 0), KitchenTypeCode)
      .input("KitchenTypeName", sql.VarChar(100), KitchenTypeName)
      .input("isActive", sql.Bit, isActive)
      .input("ModifiedBy", sql.UniqueIdentifier, ModifiedBy)
      .input("ModifiedOn", sql.DateTime, new Date())
      .query(`
        UPDATE Kitchen
        SET
          KitchenTypeCode = @KitchenTypeCode,
          KitchenTypeName = @KitchenTypeName,
          isActive = @isActive,
          ModifiedBy = @ModifiedBy,
          ModifiedOn = @ModifiedOn
        WHERE KitchenTypeId = @KitchenTypeId
      `);

    res.json({ message: "Kitchen Updated Successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).send("Update failed");
  }
});

/* ------------------- DELETE KITCHEN ------------------- */
app.delete("/kitchen/:id", async (req, res) => {
  try {
    const KitchenTypeId = req.params.id;
    const pool = await poolPromise;

    // 1. Get the KitchenTypeCode for this Kitchen
    const getCode = await pool.request()
      .input("KitchenTypeId", sql.UniqueIdentifier, KitchenTypeId)
      .query(`
        SELECT KitchenTypeCode 
        FROM Kitchen 
        WHERE KitchenTypeId = @KitchenTypeId
      `);

    if (getCode.recordset.length === 0) {
      return res.status(404).json({ message: "Kitchen not found" });
    }

    const KitchenTypeCode = getCode.recordset[0].KitchenTypeCode;

    // 2. Check dish mapping using KitchenTypeCode
    const check = await pool.request()
      .input("KitchenTypeCode", sql.Numeric, KitchenTypeCode)
      .query(`
        SELECT *
        FROM DishKitchenType
        WHERE KitchenTypeCode = @KitchenTypeCode
      `);

    if (check.recordset.length > 0) {
      return res.status(400).json({
        message: "Dish list having this kitchen type. Cannot delete"
      });
    }

    // 3. Delete from Kitchen using KitchenTypeId
    await pool.request()
      .input("KitchenTypeId", sql.UniqueIdentifier, KitchenTypeId)
      .query(`
        DELETE FROM Kitchen
        WHERE KitchenTypeId = @KitchenTypeId
      `);

    res.json({ message: "Kitchen Deleted Successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});
//======================================================END KITCHEN----============

//-============================================start CATEGORIES==============

// --- Multer config for image upload ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "images", "Dish");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,   // ✅ 10MB image
    fieldSize: 20 * 1024 * 1024   // ✅ FIX for "Field value too long"
  }
});

// ---------------- GET ALL CATEGORIES ----------------
app.get("/category", async (req, res) => {
  try {
    const { CategoryCode } = req.query;
    const pool = await poolPromise;
    let query = `SELECT 
                  C.*,
                  (SELECT I.ImageData
                  from ImageList I
                  where  C.ImageId = I.ImageId) ImageData
                  FROM CategoryMaster C ORDER BY CategoryCode DESC;`;

    if (CategoryCode) query += " WHERE CategoryCode = @CategoryCode";
    const request = pool.request();
    if (CategoryCode) request.input("CategoryCode", sql.VarChar, CategoryCode);
    const result = await request.query(query);
    const data = result.recordset.map(row => {
      let imageBase64 = null;

      if (row.ImageData) {
        imageBase64 = `data:image/jpeg;base64,${row.ImageData.toString("base64")}`;
      }

      return {
        ...row,
        ImageData: imageBase64
      };
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// ---------------- CREATE / UPDATE CATEGORY ----------------
app.post("/category", upload.single("image"), async (req, res) => {
  try {
    console.log("=== START /category POST ===");
    console.log("Body:", req.body);
    console.log("File:", req.file ? req.file.filename : "No file uploaded");

    const {
      CategoryId,
      CategoryCode,
      CategoryName,
      SortCode,
      isActive,
      IsPublished,
      ShortName,
      KitchenTypes,
      Modifiers,
      BackColor,
      ForeColor,
      isKitchenPrint,
      isDiscountAllowed,
      isServiceCharge,
      isDispName,
      isMemberSalesAllowed,
      isTaxAllowed,
      NameInOtherLanguage,
    } = req.body;

    const safeBackColor =
      typeof BackColor === "string" && BackColor.startsWith("#")
        ? BackColor
        : "#000000";

    const safeForeColor =
      typeof ForeColor === "string" && ForeColor.startsWith("#")
        ? ForeColor
        : "#ffffff";

    const pool = await poolPromise;
    let catId = CategoryId;

    if (!catId || catId === "" || catId === "null" || catId === "undefined") {
      catId = uuidv4();
    }

    const parseBit = (val) => {
      if (val === true || val === 'true' || val === 1 || val === '1') return true;
      return false;
    };

    const safeSortCode = parseInt(SortCode, 10) || 0;
    const safeCategoryCode = (CategoryCode || "").substring(0, 20);
    const safeCategoryName = (CategoryName || "").substring(0, 100);
    const safeShortName = (ShortName || "").substring(0, 50);
    const safeNameInOtherLanguage = (NameInOtherLanguage || "").substring(0, 100);

    let imageId = null;
    let imageName = null;

    if (req.file) {
      imageId = uuidv4();
      imageName = req.file.filename;
      const imageBuffer = fs.readFileSync(req.file.path);
      console.log("Inserting image into ImageList...");
      await pool
        .request()
        .input("ImageId", sql.UniqueIdentifier, imageId)
        .input("ImageName", sql.VarChar(100), imageName)
        .input("ImageData", sql.VarBinary(sql.MAX), imageBuffer)
        .query("INSERT INTO ImageList (ImageId, ImageName,ImageData) VALUES (@ImageId, @ImageName,@ImageData)");
      console.log("Image inserted successfully");
    }

    // Check if updating or creating
    console.log("Checking if Category exists:", catId);
    const exists = await pool
      .request()
      .input("CategoryId", sql.UniqueIdentifier, catId)
      .query("SELECT CategoryId FROM CategoryMaster WHERE CategoryId=@CategoryId");

    if (exists.recordset.length > 0) {
      console.log("Category exists. Updating...");
      let request = pool.request()
        .input("CategoryId", sql.UniqueIdentifier, catId)
        .input("CategoryCode", sql.VarChar(20), safeCategoryCode)
        .input("CategoryName", sql.VarChar(100), safeCategoryName)
        .input("SortCode", sql.Int, safeSortCode)
        .input("isActive", sql.Bit, parseBit(isActive))
        .input("IsPublished", sql.Bit, parseBit(IsPublished))
        .input("ShortName", sql.VarChar(50), safeShortName)
        .input("BackColor", sql.NVarChar(50), safeBackColor)
        .input("ForeColor", sql.NVarChar(50), safeForeColor)
        .input("isKitchenPrint", sql.Bit, parseBit(isKitchenPrint))
        .input("isDiscountAllowed", sql.Bit, parseBit(isDiscountAllowed))
        .input("isServiceCharge", sql.Bit, parseBit(isServiceCharge))
        .input("isDispName", sql.Bit, parseBit(isDispName))
        .input("isMemberSalesAllowed", sql.Bit, parseBit(isMemberSalesAllowed))
        .input("isTaxAllowed", sql.Bit, parseBit(isTaxAllowed))
        .input("NameInOtherLanguage", sql.VarChar(100), safeNameInOtherLanguage)
        .input(
          "ModifiedBy",
          sql.UniqueIdentifier,
          req.body.ModifiedBy || null
        )
        .input("ModifiedOn", sql.DateTime, new Date());

      // ⭐ only add ImageId if new image uploaded
      request.input("ImageId", sql.UniqueIdentifier, imageId || null);

      await request.query(`
UPDATE CategoryMaster SET
CategoryCode=@CategoryCode,
CategoryName=@CategoryName,
SortCode=@SortCode,
isActive=@isActive,
IsPublished =@IsPublished,
ShortName=@ShortName,
ImageId = COALESCE(@ImageId, ImageId),  
BackColor=@BackColor,
ForeColor=@ForeColor,
isKitchenPrint=@isKitchenPrint,
isDiscountAllowed=@isDiscountAllowed,
isServiceCharge=@isServiceCharge,
isDispName=@isDispName,
isMemberSalesAllowed=@isMemberSalesAllowed,
isTaxAllowed=@isTaxAllowed,
NameInOtherLanguage=@NameInOtherLanguage,
ModifiedBy=@ModifiedBy,
ModifiedOn=@ModifiedOn
WHERE CategoryId=@CategoryId
`);
      console.log("Category updated successfully");
    } else {
      console.log("Category does not exist. Inserting...");
      await pool
        .request()
        .input("CategoryId", sql.UniqueIdentifier, catId)
        .input("CategoryCode", sql.VarChar(20), safeCategoryCode)
        .input("CategoryName", sql.VarChar(100), safeCategoryName)
        .input("SortCode", sql.Int, safeSortCode)
        .input("isActive", sql.Bit, parseBit(isActive))
        .input("IsPublished", sql.Bit, parseBit(IsPublished))
        .input("ShortName", sql.VarChar(50), safeShortName)
        .input("ImageId", sql.UniqueIdentifier, imageId || null)
        .input("BackColor", sql.NVarChar(50), safeBackColor)
        .input("ForeColor", sql.NVarChar(50), safeForeColor)
        .input("isKitchenPrint", sql.Bit, parseBit(isKitchenPrint))
        .input("isDiscountAllowed", sql.Bit, parseBit(isDiscountAllowed))
        .input("isServiceCharge", sql.Bit, parseBit(isServiceCharge))
        .input("isDispName", sql.Bit, parseBit(isDispName))
        .input("isMemberSalesAllowed", sql.Bit, parseBit(isMemberSalesAllowed))
        .input("isTaxAllowed", sql.Bit, parseBit(isTaxAllowed))
        .input("NameInOtherLanguage", sql.VarChar(100), safeNameInOtherLanguage)
        .input("CreatedBy", sql.UniqueIdentifier, req.body.CreatedBy)
        .input("CreatedOn", sql.DateTime, new Date())
        .query(
          `INSERT INTO CategoryMaster 
                (CategoryId, CategoryCode, CategoryName, SortCode, isActive,IsPublished, ShortName, ImageId, BackColor, ForeColor, isKitchenPrint, isDiscountAllowed, isServiceCharge, isDispName, isMemberSalesAllowed, isTaxAllowed, NameInOtherLanguage, CreatedBy, CreatedOn) 
            VALUES 
            (@CategoryId, @CategoryCode, @CategoryName, @SortCode, @isActive, @IsPublished, @ShortName, @ImageId, @BackColor, @ForeColor, @isKitchenPrint, @isDiscountAllowed, @isServiceCharge, @isDispName, @isMemberSalesAllowed, @isTaxAllowed, @NameInOtherLanguage, @CreatedBy, @CreatedOn)`
        );
      console.log("Category inserted successfully");
    }

    // Safely parse Modifiers
    let safeModifiers = [];
    if (Modifiers && Modifiers !== "null" && Modifiers !== "undefined") {
      try {
        safeModifiers = typeof Modifiers === "string" ? JSON.parse(Modifiers) : Modifiers;
        if (!Array.isArray(safeModifiers)) safeModifiers = [];
      } catch (e) {
        console.warn("Failed to parse Modifiers:", Modifiers);
        safeModifiers = [];
      }
    }

    console.log("Processing Modifiers:", safeModifiers);
    await pool.request()
      .input("CategoryId", sql.UniqueIdentifier, catId)
      .query("DELETE FROM CategoryModifier WHERE CategoryId=@CategoryId");

    for (let modId of safeModifiers) {
      if (modId) {
        await pool
          .request()
          .input("CategoryId", sql.UniqueIdentifier, catId)
          .input("ModifierId", sql.UniqueIdentifier, modId)
          .query("INSERT INTO CategoryModifier (CategoryId, ModifierId) VALUES (@CategoryId, @ModifierId)");
      }
    }
    console.log("Modifiers processed successfully");

    // Safely parse KitchenTypes
    let safeKitchenTypes = [];
    if (KitchenTypes && KitchenTypes !== "null" && KitchenTypes !== "undefined") {
      try {
        safeKitchenTypes = typeof KitchenTypes === "string" ? JSON.parse(KitchenTypes) : KitchenTypes;
        if (!Array.isArray(safeKitchenTypes)) safeKitchenTypes = [];
      } catch (e) {
        console.warn("Failed to parse KitchenTypes:", KitchenTypes);
        safeKitchenTypes = [];
      }
    }

    console.log("Processing KitchenTypes:", safeKitchenTypes);
    await pool.request()
      .input("CategoryId", sql.UniqueIdentifier, catId)
      .query("DELETE FROM CategoryKitchenType WHERE CategoryId=@CategoryId");

    for (let kt of safeKitchenTypes) {
      if (kt && kt.KitchenTypeCode) {
        await pool.request()
          .input("CategoryId", sql.UniqueIdentifier, catId)
          .input("KitchenTypeCode", sql.Int, kt.KitchenTypeCode)
          .input("KitchenTypeName", sql.VarChar(100), kt.KitchenTypeName || "")
          .query(`
IF NOT EXISTS (
SELECT 1 FROM CategoryKitchenType
WHERE CategoryId=@CategoryId
AND KitchenTypeCode=@KitchenTypeCode
)
INSERT INTO CategoryKitchenType
(CategoryId,KitchenTypeCode,KitchenTypeName)
VALUES
(@CategoryId,@KitchenTypeCode,@KitchenTypeName)
`);
      }
    }
    console.log("KitchenTypes processed successfully");
    console.log("=== END /category POST ===");
    res.json({ message: "Category saved successfully", CategoryId: catId });
  } catch (err) {
    console.error("FULL ERROR:", err);

    // ✅ Truncation error
    if (err.message && err.message.includes("String or binary data would be truncated")) {
      return res.status(400).json({
        message: "Category Name or Short Name is too long (max limit exceeded)"
      });
    }

    // ✅ Image / multer error
    if (err.message && err.message.includes("Field value too long")) {
      return res.status(400).json({
        message: "Image size is too large. Please upload smaller file"
      });
    }

    // ✅ Send the actual error message in development response for debugging
    res.status(500).json({
      message: "Category save failed. Please try again",
      error: err.message
    });
  }
});
/* ---------------- CATEGORY KITCHEN INSERT / DELETE ---------------- */

app.post("/categorykitchen", async (req, res) => {

  try {

    const { CategoryId, KitchenTypeCode, KitchenTypeName, checked } = req.body;

    const pool = await poolPromise;

    if (checked) {

      // INSERT
      await pool.request()
        .input("CategoryId", sql.UniqueIdentifier, CategoryId)
        .input("KitchenTypeCode", sql.Int, KitchenTypeCode)
        .input("KitchenTypeName", sql.VarChar(100), KitchenTypeName)
        .query(`
          INSERT INTO CategoryKitchenType
          (CategoryId, KitchenTypeCode, KitchenTypeName)
          VALUES
          (@CategoryId,@KitchenTypeCode,@KitchenTypeName)
        `);

    } else {

      // DELETE
      await pool.request()
        .input("CategoryId", sql.UniqueIdentifier, CategoryId)
        .input("KitchenTypeCode", sql.Int, KitchenTypeCode)
        .query(`
          DELETE FROM CategoryKitchenType
          WHERE CategoryId=@CategoryId
          AND KitchenTypeCode=@KitchenTypeCode
        `);

    }

    res.json({ message: "Kitchen updated successfully" });

  } catch (err) {

    console.log(err);
    res.status(500).send("Error");

  }

});
//kitchen code ------------------

app.get("/categorykitchen/:id", async (req, res) => {
  try {

    const pool = await poolPromise;

    const result = await pool.request()
      .input("CategoryId", sql.UniqueIdentifier, req.params.id)
      .query(`
SELECT KitchenTypeCode
FROM CategoryKitchenType
WHERE CategoryId=@CategoryId
`);

    res.json(result.recordset);

  } catch (err) {

    console.log(err);
    res.status(500).send("error");

  }
});

//------MODIFIER

app.get("/modifier", async (req, res) => {

  try {

    const pool = await poolPromise;

    const result = await pool.request().query(`
SELECT ModifierId,ModifierName
FROM ModifierMaster
ORDER BY ModifierName
`);

    res.json(result.recordset);

  } catch (err) {

    console.log(err);
    res.status(500).send("error");

  }

});

//----categorymodifier

app.post("/categorymodifier", async (req, res) => {

  try {

    const { CategoryId, ModifierId, checked } = req.body;

    const pool = await poolPromise;

    if (checked) {

      await pool.request()
        .input("CategoryId", sql.UniqueIdentifier, CategoryId)
        .input("ModifierId", sql.UniqueIdentifier, ModifierId)
        .query(`
INSERT INTO CategoryModifier
(CategoryId,ModifierId)
VALUES
(@CategoryId,@ModifierId)
`);

    } else {

      await pool.request()
        .input("CategoryId", sql.UniqueIdentifier, CategoryId)
        .input("ModifierId", sql.UniqueIdentifier, ModifierId)
        .query(`
DELETE FROM CategoryModifier
WHERE CategoryId=@CategoryId
AND ModifierId=@ModifierId
`);

    }

    res.json({ message: "Modifier updated" });

  } catch (err) {

    console.log(err);
    res.status(500).send("error");

  }

});

app.get("/categorymodifier/:id", async (req, res) => {

  try {

    const pool = await poolPromise;

    const result = await pool.request()
      .input("CategoryId", sql.UniqueIdentifier, req.params.id)
      .query(`
SELECT ModifierId
FROM CategoryModifier
WHERE CategoryId=@CategoryId
`);

    res.json(result.recordset);

  } catch (err) {

    console.log(err);
    res.status(500).send("error");

  }

});

// ---------------- DELETE CATEGORY ----------------
app.delete("/category/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    // Check mapping before delete
    const check = await pool
      .request()
      .input("CategoryId", sql.UniqueIdentifier, id)
      .query("SELECT * FROM DishGroupMaster WHERE CategoryId=@CategoryId");

    if (check.recordset.length > 0)
      return res.status(400).json({ message: "Category has DishGroup mapping. Cannot delete." });

    await pool.request().input("CategoryId", sql.UniqueIdentifier, id).query("DELETE FROM CategoryMaster WHERE CategoryId=@CategoryId");

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Delete failed");
  }
});
//==============================================END Category=============================

//===============================================start dishgroup==========================

//dishgroup get

app.get("/dishgroup", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        C.DishGroupId,
        C.DishGroupCode,
        C.DishGroupName,
        C.ShortName,
        ISNULL(C.isActive, 0) AS isActive,
        ISNULL(C.IsPublished, 0) AS IsPublished,
        ISNULL(C.isDiscountAllowed, 0) AS isDiscountAllowed,
        ISNULL(C.isTaxAllowed, 0) AS isTaxAllowed,
        ISNULL(C.isKitchenPrint, 0) AS isKitchenPrint,
        ISNULL(C.isServiceCharge, 0) AS isServiceCharge,
        ISNULL(C.isMemberSalesAllowed, 0) AS isMemberSalesAllowed,
        ISNULL(C.ShowModifierTabOrder, 0) AS ShowModifierTabOrder,
        ISNULL(C.SortCode, 0) AS SortCode,
        ISNULL(C.KitchenSortCode, 0) AS KitchenSortCode,
        C.CategoryId,
        C.BackColor,
        C.ForeColor,
         (SELECT I.ImageData
                  from ImageList I
                  where  C.ImageId = I.ImageId) ImageData,
                  DC.CategoryName
      FROM DishGroupMaster C
      LEFT JOIN Categorymaster DC
      on  DC.CategoryId = C.CategoryId 
     ORDER BY CAST(C.DishGroupCode AS INT) DESC
    `);

    const data = result.recordset.map(row => {
      let imageBase64 = null;

      if (row.ImageData) {
        imageBase64 = `data:image/jpeg;base64,${row.ImageData.toString("base64")}`;
      }

      return {
        ...row,
        ImageData: imageBase64
      };
    });

    res.json(data);

  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
});

app.get("/dishgroup/nextcode", async (req, res) => {
  try {
    console.log("NEXTCODE API HIT");

    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        ISNULL(MAX(TRY_CAST(DishGroupCode AS INT)), 0) + 1 AS NewCode
      FROM DishGroupMaster
    `);

    res.json({ code: result.recordset[0].NewCode });

  } catch (err) {
    console.log("NEXTCODE ERROR FULL:", err);
    res.status(500).json({ error: err.message });
  }
});
//GET DishGroup by ID (Edit screen)

app.get("/dishgroup/:id", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("DishGroupId", sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT *
        FROM DishGroupMaster
        WHERE DishGroupId=@DishGroupId
      `);

    res.json(result.recordset[0]);

  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
});
//CREATE / UPDATE DishGroup (MAIN 🔥)
app.post("/dishgroup", upload.single("image"), async (req, res) => {
  try {
    const {
      DishGroupId,
      DishGroupCode,
      DishGroupName,
      SortCode,
      isActive,
      IsPublished,
      isDiscountAllowed,
      isTaxAllowed,
      isKitchenPrint,
      isServiceCharge,
      isMemberSalesAllowed,
      ShortName,
      CategoryId,
      KitchenSortCode,
      BackColor,
      ForeColor,
      Modifiers,
      KitchenTypes
    } = req.body;

    const pool = await poolPromise;
    // 🔥 AUTO GENERATE CODE (ADD HERE)
    const codeResult = await pool.request().query(`
  SELECT 
    ISNULL(MAX(TRY_CAST(DishGroupCode AS INT)), 0) + 1 AS NewCode
  FROM DishGroupMaster
`);

    const newCode = codeResult.recordset[0].NewCode;
    let imageId = null;

    if (req.file) {
      imageId = uuidv4();
      const imageBuffer = fs.readFileSync(req.file.path);
      await pool.request()
        .input("ImageId", sql.UniqueIdentifier, imageId)
        .input("ImageName", sql.VarChar(100), req.file.filename)
        .input("ImageData", sql.VarBinary(sql.MAX), imageBuffer)
        .query(`
      INSERT INTO ImageList (ImageId, ImageName,ImageData)
      VALUES (@ImageId, @ImageName,@ImageData)
    `);
    }

    let dgId = DishGroupId || uuidv4();

    // check exists
    const exists = await pool.request()
      .input("DishGroupId", sql.UniqueIdentifier, dgId)
      .query("SELECT DishGroupId FROM DishGroupMaster WHERE DishGroupId=@DishGroupId");

    if (exists.recordset.length > 0) {

      // 🔄 UPDATE
      await pool.request()
        .input("DishGroupId", sql.UniqueIdentifier, dgId)
        .input("DishGroupCode", sql.VarChar(20), DishGroupCode)
        .input("DishGroupName", sql.VarChar(100), DishGroupName)
        .input("SortCode", sql.Int, SortCode)
        .input("isActive", sql.Bit, isActive == 1)
        .input("IsPublished", sql.Bit, Number(IsPublished) === 1)
        .input("isDiscountAllowed", sql.Bit, isDiscountAllowed == 1)
        .input("isTaxAllowed", sql.Bit, isTaxAllowed == 1)
        .input("isKitchenPrint", sql.Bit, isKitchenPrint == 1)
        .input("isServiceCharge", sql.Bit, isServiceCharge == 1)
        .input("isMemberSalesAllowed", sql.Bit, isMemberSalesAllowed == 1)
        .input("ShortName", sql.VarChar(50), ShortName)
        .input(
          "CategoryId",
          sql.UniqueIdentifier,
          CategoryId && CategoryId !== "null" ? CategoryId : null
        )
        .input("KitchenSortCode", sql.Int, KitchenSortCode)
        .input("BackColor", sql.VarChar(50), BackColor)
        .input("ForeColor", sql.VarChar(50), ForeColor)
        .input("ImageId", sql.UniqueIdentifier, imageId)
        .input("ModifiedBy", sql.UniqueIdentifier, req.body.ModifiedBy || null)
        .input("ModifiedOn", sql.DateTime, new Date())
        .query(`
         UPDATE DishGroupMaster SET
                DishGroupCode=@DishGroupCode,
                DishGroupName=@DishGroupName,
                SortCode=@SortCode,
                isActive=@isActive,
                IsPublished=@IsPublished,
                isDiscountAllowed=@isDiscountAllowed,
                isTaxAllowed=@isTaxAllowed,
                isKitchenPrint=@isKitchenPrint,
                isServiceCharge=@isServiceCharge,
                isMemberSalesAllowed=@isMemberSalesAllowed,
                ShortName=@ShortName,
                CategoryId=@CategoryId,
                KitchenSortCode=@KitchenSortCode,
                BackColor=@BackColor,
                ForeColor=@ForeColor,
                ImageId = COALESCE(@ImageId, ImageId),
                ModifiedBy=@ModifiedBy,
                ModifiedOn=@ModifiedOn
                WHERE DishGroupId=@DishGroupId
        `);

    } else {

      // 🆕 INSERT
      await pool.request()
        .input("DishGroupId", sql.UniqueIdentifier, dgId)
        .input("DishGroupCode", sql.VarChar(20), String(newCode))
        .input("DishGroupName", sql.VarChar(100), DishGroupName)
        .input("SortCode", sql.Int, SortCode)
        .input("isActive", sql.Bit, isActive == 1)
        .input("IsPublished", sql.Bit, Number(IsPublished) === 1)
        .input("isDiscountAllowed", sql.Bit, isDiscountAllowed == 1)
        .input("isTaxAllowed", sql.Bit, isTaxAllowed == 1)
        .input("isKitchenPrint", sql.Bit, isKitchenPrint == 1)
        .input("isServiceCharge", sql.Bit, isServiceCharge == 1)
        .input("isMemberSalesAllowed", sql.Bit, isMemberSalesAllowed == 1)
        .input("ShortName", sql.VarChar(50), ShortName || "")
        .input(
          "CategoryId",
          sql.UniqueIdentifier,
          CategoryId && CategoryId !== "null" ? CategoryId : null
        )
        .input("KitchenSortCode", sql.Int, KitchenSortCode)
        .input("BackColor", sql.VarChar(50), BackColor || "#000000")
        .input("ForeColor", sql.VarChar(50), ForeColor || "#ffffff")
        .input("ImageId", sql.UniqueIdentifier, imageId)
        //  .input("KitchenType", sql.VarChar(50), "")
        //  .input("SubkitchenType", sql.VarChar(50), "")
        .input("CreatedBy", sql.UniqueIdentifier, uuidv4())
        .input("CreatedOn", sql.DateTime, new Date())
        .query(`
          INSERT INTO DishGroupMaster
          (DishGroupId,DishGroupCode,DishGroupName,SortCode,isActive,IsPublished,ShortName,CategoryId,KitchenSortCode,BackColor,ForeColor,ImageId,isDiscountAllowed,
          isTaxAllowed,isKitchenPrint,isServiceCharge,isMemberSalesAllowed,CreatedBy,CreatedOn)
          VALUES
          (@DishGroupId,@DishGroupCode,@DishGroupName,@SortCode,@isActive,@IsPublished,@ShortName,@CategoryId,@KitchenSortCode,@BackColor,@ForeColor,@ImageId,@isDiscountAllowed,
          @isTaxAllowed,@isKitchenPrint,@isServiceCharge,@isMemberSalesAllowed,@CreatedBy,@CreatedOn)
        `);
    }

    // 🔥 DELETE OLD MODIFIERS
    // ✅ DELETE OLD KITCHENS
    await pool.request()
      .input("DishGroupId", sql.UniqueIdentifier, dgId)
      .query("DELETE FROM DishGroupKitchenType WHERE DishGroupId=@DishGroupId");

    // ✅ INSERT KITCHENS
    let kitchens = [];

    if (KitchenTypes) {
      kitchens = typeof KitchenTypes === "string"
        ? JSON.parse(KitchenTypes)
        : KitchenTypes;
    }

    for (let k of kitchens) {
      await pool.request()
        .input("DishGroupId", sql.UniqueIdentifier, dgId)
        .input("KitchenTypeCode", sql.Int, k.KitchenTypeCode)
        .input("KitchenTypeName", sql.VarChar(100), k.KitchenTypeName || "")
        .query(`
      INSERT INTO DishGroupKitchenType
      (DishGroupId,KitchenTypeCode,KitchenTypeName)
      VALUES
      (@DishGroupId,@KitchenTypeCode,@KitchenTypeName)
    `);
    }

    // 🔥 DELETE OLD KITCHENS
    // ✅ DELETE OLD MODIFIERS
    await pool.request()
      .input("DishGroupId", sql.UniqueIdentifier, dgId)
      .query("DELETE FROM DishGroupModifier WHERE DishGroupId=@DishGroupId");

    // ✅ INSERT MODIFIERS
    let mods = [];

    if (Modifiers) {
      mods = typeof Modifiers === "string"
        ? JSON.parse(Modifiers)
        : Modifiers;
    }

    for (let m of mods) {
      const modId = typeof m === "object" && m !== null ? m.ModifierId : m;

      await pool.request()
        .input("DishGroupId", sql.UniqueIdentifier, dgId)
        .input("ModifierId", sql.UniqueIdentifier, modId)
        .query(`
      INSERT INTO DishGroupModifier
      (DishGroupId, ModifierId)
      VALUES
      (@DishGroupId, @ModifierId)
    `);
    }

    res.json({ message: "DishGroup saved successfully", DishGroupId: dgId });

  } catch (err) {
    console.log("🔥 FINAL ERROR FULL:", err);
    console.log("🔥 FINAL ERROR MSG:", err.message);

    res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  }
});

//DELETE DishGroup
app.delete("/dishgroup/:id", async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool.request()
      .input("DishGroupId", sql.UniqueIdentifier, req.params.id)
      .query("DELETE FROM DishGroupMaster WHERE DishGroupId=@DishGroupId");

    res.json({ message: "Deleted successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
});

//ADD / REMOVE Modifier(DISH GROUP MODIFIER API)S
app.post("/dishgroupmodifier", async (req, res) => {
  try {
    const { DishGroupId, ModifierId, checked } = req.body;
    const pool = await poolPromise;

    if (checked) {
      // ✅ INSERT
      await pool.request()
        .input("DishGroupId", sql.UniqueIdentifier, DishGroupId)
        .input("ModifierId", sql.UniqueIdentifier, ModifierId)
        .query(`
          INSERT INTO DishGroupModifier
          (DishGroupId, ModifierId)
          VALUES
          (@DishGroupId, @ModifierId)
        `);
    } else {
      // ❌ DELETE
      await pool.request()
        .input("DishGroupId", sql.UniqueIdentifier, DishGroupId)
        .input("ModifierId", sql.UniqueIdentifier, ModifierId)
        .query(`
          DELETE FROM DishGroupModifier
          WHERE DishGroupId=@DishGroupId
          AND ModifierId=@ModifierId
        `);
    }

    res.json({ message: "DishGroup Modifier updated successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
});
//GET Modifier List (DISH GROUP MODIFIER API)
app.get("/dishgroupmodifier/:id", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("DishGroupId", sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT ModifierId
        FROM DishGroupModifier
        WHERE DishGroupId=@DishGroupId
      `);

    res.json(result.recordset);

  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
});

//GET Kitchen List (DISH GROUP KITCHEN API)
app.get("/dishgroupkitchen/:id", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("DishGroupId", sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT KitchenTypeCode
        FROM DishGroupKitchenType
        WHERE DishGroupId=@DishGroupId
      `);

    res.json(result.recordset);

  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
});


//insert dishgroupkitchen

app.post("/dishgroupkitchen", async (req, res) => {
  try {
    const { DishGroupId, KitchenTypeCode, KitchenTypeName, checked } = req.body;

    const pool = await poolPromise; // 🔥 MISSING LINE (IMPORTANT)

    if (checked) {
      await pool.request()
        .input("DishGroupId", sql.UniqueIdentifier, DishGroupId)
        .input("KitchenTypeCode", sql.Int, KitchenTypeCode)
        .input("KitchenTypeName", sql.VarChar(100), KitchenTypeName)
        .query(`
          IF NOT EXISTS (
            SELECT 1 FROM DishGroupKitchenType
            WHERE DishGroupId=@DishGroupId AND KitchenTypeCode=@KitchenTypeCode
          )
          INSERT INTO DishGroupKitchenType
          (DishGroupId, KitchenTypeCode, KitchenTypeName)
          VALUES (@DishGroupId, @KitchenTypeCode, @KitchenTypeName)
        `);

    } else {
      await pool.request()
        .input("DishGroupId", sql.UniqueIdentifier, DishGroupId)
        .input("KitchenTypeCode", sql.Int, KitchenTypeCode)
        .query(`
          DELETE FROM DishGroupKitchenType
          WHERE DishGroupId=@DishGroupId AND KitchenTypeCode=@KitchenTypeCode
        `);
    }

    res.send("OK");

  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
});
//===============================================END dishgroup==========================
//========================start dish================
app.get("/dish", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        D.DishId,
        D.DishCode,
        D.Name,
        D.ShortName,
        D.Description,
        D.DishGroupId,
        D.CurrentCost,
        D.SordCode,
        D.UnitCost,
        D.QuantityOnHand,
        D.NameInOtherLanguage,
        D.BrandId,
        D.MobileTab,
        D.isMultiPrice,
        D.isOpenitem,
        D.IsSplitDish,
        D.IsgroupDish,
        D.IsShowinKiosk,
        D.IsActive,
        D.IsPublished,
        D.IsSoldOut,
        D.iskitchenPrint,
        D.isDiscountAllowed,
        D.IsTaxAllowed,
        D.IsStockDish,
        D.isFOC,
        D.isServiceCharge,
        D.isFavourite,
        D.KitchenType,
        D.SubkitchenType,
        D.ImageId,
        DG.DishGroupName
      FROM DishMaster D
      LEFT JOIN DishGroupMaster DG ON D.DishGroupId = DG.DishGroupId
      ORDER BY DG.DishGroupName ASC, D.Name ASC
    `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Dedicated endpoint to fetch binary image on-demand when editing
app.get("/dishimage/:dishId", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("DishId", sql.UniqueIdentifier, req.params.dishId)
      .query(`
        SELECT I.ImageData
        FROM DishMaster D
        JOIN ImageList I ON D.ImageId = I.ImageId
        WHERE D.DishId = @DishId
      `);

    if (result.recordset.length > 0 && result.recordset[0].ImageData) {
      const base64 = `data:image/jpeg;base64,${result.recordset[0].ImageData.toString("base64")}`;
      res.json({ ImageData: base64 });
    } else {
      res.json({ ImageData: null });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.get("/dish/nextcode", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        ISNULL(MAX(TRY_CAST(DishCode AS INT)), 0) + 1 AS NewCode
      FROM DishMaster
    `);

    const num = result.recordset[0].NewCode;
    // Zero-pad to 3 digits: 1 → "001", 8 → "008", 12 → "012"
    const padded = String(num).padStart(3, "0");
    res.json({ code: padded });

  } catch (err) {
    console.log("DISH NEXTCODE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/dish", upload.single("image"), async (req, res) => {
  try {
    const pool = await poolPromise;
    const d = req.body;

    let dishGroups = [];

    if (d.DishGroups) {
      dishGroups = JSON.parse(d.DishGroups);
    }

    if (!d.DishCode || d.DishCode.trim() === "") {
      return res.status(400).send("DishCode required ❗");
    }

    const dishId = d.DishId ? d.DishId : uuidv4();

    // 🔥 AUTO GENERATE DISH CODE (ADD HERE)
    // const codeResult = await pool.request().query(`
    //   SELECT 
    //     ISNULL(MAX(TRY_CAST(DishCode AS INT)), 0) + 1 AS NewCode
    //   FROM DishMaster
    // `);

    // const newDishCode = codeResult.recordset[0].NewCode;

    let imageId = null;

    // IMAGE SAVE
    if (req.file) {
      imageId = uuidv4();
      const imageBuffer = fs.readFileSync(req.file.path);

      await pool.request()
        .input("ImageId", sql.UniqueIdentifier, imageId)
        .input("ImageName", sql.VarChar(100), req.file.filename)
        .input("ImageData", sql.VarBinary(sql.MAX), imageBuffer)
        .query(`
          INSERT INTO ImageList (ImageId, ImageName, ImageData)
          VALUES (@ImageId, @ImageName, @ImageData)
        `);
    }

    // CHECK EXIST
    const exists = await pool.request()
      .input("DishId", sql.UniqueIdentifier, dishId)
      .query("SELECT DishId FROM DishMaster WHERE DishId=@DishId");

    if (exists.recordset.length > 0) {

      // 🔄 UPDATE (ALL COLUMNS)
      await pool.request()
        .input("DishId", sql.UniqueIdentifier, dishId)
        .input("DishCode", sql.NVarChar, d.DishCode || "")
        .input("Name", sql.NVarChar, d.Name || "")
        .input("ShortName", sql.NVarChar, d.ShortName || "")
        .input("Description", sql.NVarChar, d.Description || "")
        .input("DishGroupId", sql.UniqueIdentifier, d.DishGroupId || null)

        .input("CurrentCost", sql.Decimal(18, 2), Number(d.CurrentCost) || 0)
        .input("SordCode", sql.Int, Number(d.SordCode) || 0)
        .input("UnitCost", sql.Decimal(18, 2), Number(d.UnitCost) || 0)
        .input("QuantityOnHand", sql.Decimal(18, 2), Number(d.QuantityOnHand) || 0)

        .input("NameInOtherLanguage", sql.NVarChar, d.NameInOtherLanguage || "")
        .input("ImageId", sql.UniqueIdentifier, imageId)
        .input("IsActive", sql.Bit, Number(d.IsActive) === 1)
        .input("IsSoldOut", sql.Bit, Number(d.IsSoldOut) === 1)
        .input("IsPublished", sql.Bit, Number(d.IsPublished) === 1)
        .input("iskitchenPrint", sql.Bit, Number(d.iskitchenPrint) === 1)
        .input("KitchenType", sql.Int, Number(d.KitchenType) || 0)
        .input("SubkitchenType", sql.Int, Number(d.SubkitchenType) || 0)
        .input("isDiscountAllowed", sql.Bit, Number(d.isDiscountAllowed) === 1)
        .input("IsTaxAllowed", sql.Bit, Number(d.IsTaxAllowed) === 1)
        .input("IsStockDish", sql.Bit, Number(d.IsStockDish) === 1)
        .input("isFOC", sql.Bit, Number(d.isFOC) === 1)
        .input("isServiceCharge", sql.Bit, Number(d.isServiceCharge) === 1)
        .input("isFavourite", sql.Bit, Number(d.isFavourite) === 1)
        .input("isMultiPrice", sql.Bit, Number(d.isMultiPrice) === 1)
        .input("isOpenitem", sql.Bit, Number(d.isOpenitem) === 1)
        .input("IsSplitDish", sql.Bit, Number(d.IsSplitDish) === 1)
        .input("IsgroupDish", sql.Bit, Number(d.IsgroupDish) === 1)
        .input("CreatedBy", sql.UniqueIdentifier, d.CreatedBy || null)
        .input("CreatedOn", sql.DateTime, new Date())
        .input("ModifiedBy", sql.UniqueIdentifier, d.ModifiedBy || null)
        .input("ModifiedOn", sql.DateTime, new Date())
        .query(`
          UPDATE DishMaster SET
            DishCode=@DishCode,
            Name=@Name,
            ShortName=@ShortName,
            Description=@Description,
            DishGroupId=@DishGroupId,
            CurrentCost=@CurrentCost,
            SordCode=@SordCode,
            UnitCost=@UnitCost,
            QuantityOnHand=@QuantityOnHand,
            NameInOtherLanguage=@NameInOtherLanguage,
            ImageId = COALESCE(@ImageId, ImageId),
            IsActive=@IsActive,
            IsSoldOut =@IsSoldOut,
            IsPublished=@IsPublished,
            iskitchenPrint=@iskitchenPrint,
            isDiscountAllowed=@isDiscountAllowed,
            IsTaxAllowed=@IsTaxAllowed,
            IsStockDish=@IsStockDish,
            isFOC=@isFOC,
            isServiceCharge=@isServiceCharge,
            isFavourite=@isFavourite,
            isMultiPrice=@isMultiPrice,
            isOpenitem=@isOpenitem,
            IsSplitDish=@IsSplitDish,
            IsgroupDish=@IsgroupDish,
            ModifiedBy=@ModifiedBy,
            ModifiedOn=@ModifiedOn
          WHERE DishId=@DishId
        `);

    } else {

      // 🆕 INSERT (ALL COLUMNS)
      await pool.request()
        .input("DishId", sql.UniqueIdentifier, dishId)
        .input("DishCode", sql.VarChar(20), d.DishCode || "")
        .input("Name", sql.NVarChar, d.Name || "")
        .input("ShortName", sql.NVarChar, d.ShortName || "")
        .input("Description", sql.NVarChar, d.Description || "")
        .input("DishGroupId", sql.UniqueIdentifier, d.DishGroupId || null)

        .input("CurrentCost", sql.Decimal(18, 2), Number(d.CurrentCost) || 0)
        .input("SordCode", sql.Int, Number(d.SordCode) || 0)
        .input("UnitCost", sql.Decimal(18, 2), Number(d.UnitCost) || 0)
        .input("QuantityOnHand", sql.Decimal(18, 2), Number(d.QuantityOnHand) || 0)

        .input("NameInOtherLanguage", sql.NVarChar, d.NameInOtherLanguage || "")
        .input("ImageId", sql.UniqueIdentifier, imageId)
        .input("IsActive", sql.Bit, Number(d.IsActive) === 1)
        .input("IsSoldOut", sql.Bit, Number(d.IsSoldOut) === 1)
        .input("IsPublished", sql.Bit, Number(d.IsPublished) === 1)

        .input("iskitchenPrint", sql.Bit, Number(d.iskitchenPrint) === 1)
        .input("KitchenType", sql.Int, Number(d.KitchenType) || 0)
        .input("SubkitchenType", sql.Int, Number(d.SubkitchenType) || 0)
        .input("isDiscountAllowed", sql.Bit, Number(d.isDiscountAllowed) === 1)
        .input("IsTaxAllowed", sql.Bit, Number(d.IsTaxAllowed) === 1)
        .input("IsStockDish", sql.Bit, Number(d.IsStockDish) === 1)
        .input("isFOC", sql.Bit, Number(d.isFOC) === 1)
        .input("isServiceCharge", sql.Bit, Number(d.isServiceCharge) === 1)
        .input("isFavourite", sql.Bit, Number(d.isFavourite) === 1)
        .input("isMultiPrice", sql.Bit, Number(d.isMultiPrice) === 1)
        .input("isOpenitem", sql.Bit, Number(d.isOpenitem) === 1)
        .input("IsSplitDish", sql.Bit, Number(d.IsSplitDish) === 1)
        .input("IsgroupDish", sql.Bit, Number(d.IsgroupDish) === 1)
        .input("CreatedBy", sql.UniqueIdentifier, d.CreatedBy || null)
        .input("CreatedOn", sql.DateTime, new Date())

        .query(`
          INSERT INTO DishMaster (
            DishId, DishCode, Name, ShortName, Description,
            DishGroupId, CurrentCost, SordCode, UnitCost, QuantityOnHand,
            NameInOtherLanguage, IsActive,IsPublished, IsSoldOut,iskitchenPrint,
            isDiscountAllowed, IsTaxAllowed, IsStockDish,
            isFOC, isServiceCharge, isFavourite, isMultiPrice, isOpenitem,IsSplitDish, IsgroupDish,
            ImageId, KitchenType, SubkitchenType,CreatedBy,CreatedOn
          )
          VALUES (
            @DishId, @DishCode, @Name, @ShortName, @Description,
            @DishGroupId, @CurrentCost, @SordCode, @UnitCost, @QuantityOnHand,
            @NameInOtherLanguage, @IsActive,@IsPublished, @IsSoldOut, @iskitchenPrint,
            @isDiscountAllowed, @IsTaxAllowed, @IsStockDish,
            @isFOC, @isServiceCharge, @isFavourite, @isMultiPrice, @isOpenitem,@IsSplitDish, @IsgroupDish,
            @ImageId, @KitchenType, @SubkitchenType,@CreatedBy,@CreatedOn
          )
        `);
    }

    // 🔥 KITCHEN SAVE
    await pool.request()
      .input("DishId", sql.UniqueIdentifier, dishId)
      .query("DELETE FROM DishKitchenType WHERE DishId=@DishId");

    let kitchens = [];

    try {
      kitchens = d.KitchenTypes
        ? JSON.parse(d.KitchenTypes)
        : [];
    } catch (e) {
      console.log("Kitchen parse error ❌", d.KitchenTypes);
      kitchens = [];
    }
    for (let k of kitchens) {
      await pool.request()
        .input("DishId", sql.UniqueIdentifier, dishId)
        .input("KitchenTypeCode", sql.Int, k.KitchenTypeCode)
        .input("KitchenTypeName", sql.VarChar(100), k.KitchenTypeName)
        .query(`
          INSERT INTO DishKitchenType (DishId, KitchenTypeCode,KitchenTypeName)
          VALUES (@DishId, @KitchenTypeCode,@KitchenTypeName)
        `);
    }

    // 🔥 MODIFIER SAVE
    await pool.request()
      .input("DishId", sql.UniqueIdentifier, dishId)
      .query("DELETE FROM DishModifier WHERE DishId=@DishId");

    let mods = [];

    try {
      mods = d.Modifiers ? JSON.parse(d.Modifiers) : [];
    } catch (e) {
      console.log("Modifier parse error ❌", d.Modifiers);
      mods = [];
    }

    for (let m of mods) {
      const modId = typeof m === "object" && m !== null ? m.ModifierId : m;
      await pool.request()
        .input("DishId", sql.UniqueIdentifier, dishId)
        .input("ModifierId", sql.UniqueIdentifier, modId)
        .query(`
          INSERT INTO DishModifier (DishId, ModifierId)
          VALUES (@DishId, @ModifierId)
        `);
    }

    // 🔥 DISH GROUP SAVE

    await pool.request()
      .input("DishId", sql.UniqueIdentifier, dishId)
      .query(`
    DELETE FROM DishGroupMapping
    WHERE DishId=@DishId
  `);

    for (let g of dishGroups) {
      await pool.request()
        .input("DishId", sql.UniqueIdentifier, dishId)
        .input("DishGroupId", sql.UniqueIdentifier, g)
        .query(`
      INSERT INTO DishGroupMapping
      (DishId, DishGroupId)
      VALUES
      (@DishId, @DishGroupId)
    `);
    }

    // 🔥 ORDER ITEM SHARE SAVE

    let orderItemShares = [];

    try {
      orderItemShares = d.OrderItemShares
        ? JSON.parse(d.OrderItemShares)
        : [];
    } catch (e) {
      orderItemShares = [];
    }

    await pool.request()
      .input("DishId", sql.UniqueIdentifier, dishId)
      .query(`
    DELETE FROM OrderItemShare
    WHERE OrderDetailId=@DishId
  `);

    for (let item of orderItemShares) {

      await pool.request()
        .input("OrderDetailId", sql.UniqueIdentifier, dishId)
        .input("CustomerName", sql.NVarChar(100), item)
        .query(`
      INSERT INTO OrderItemShare
      (
        Id,
        OrderDetailId,
        CustomerName,
        IsSelected,
        CreatedDate
      )
      VALUES
      (
        NEWID(),
        @OrderDetailId,
        @CustomerName,
        1,
        GETDATE()
      )
    `);
    }


    res.json({ message: "Saved ✅", DishId: dishId });

  } catch (err) {
    console.error("ERROR ❌", err);
    res.status(500).send(err.message);
  }
});



// ================= DELETE =================
app.delete("/dish/:id", async (req, res) => {
  try {

    const pool = await poolPromise;

    await pool.request()
      .input("DishId", sql.UniqueIdentifier, req.params.id)
      .query("DELETE FROM DishMaster WHERE DishId=@DishId");

    res.send("Deleted ✅");

  } catch (err) {
    res.status(500).send(err.message);
  }
});

//ADD / REMOVE Modifier(DISH  MODIFIER API)S
app.post("/dishmodifier", async (req, res) => {
  try {
    const { DishId, ModifierId, checked } = req.body;
    const pool = await poolPromise;

    if (checked) {
      // ✅ INSERT
      await pool.request()
        .input("DishId", sql.UniqueIdentifier, DishId)
        .input("ModifierId", sql.UniqueIdentifier, ModifierId)
        .query(`
          INSERT INTO DishModifier
          (DishId, ModifierId)
          VALUES
          (@DishId, @ModifierId)
        `);
    } else {
      // ❌ DELETE
      await pool.request()
        .input("DishId", sql.UniqueIdentifier, DishId)
        .input("ModifierId", sql.UniqueIdentifier, ModifierId)
        .query(`
          DELETE FROM DishModifier
          WHERE DishId=@DishId
          AND ModifierId=@ModifierId
        `);
    }

    res.json({ message: "Dish Modifier updated successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
});
//GET Modifier List (DISH  MODIFIER API)
app.get("/dishmodifier/:id", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("DishId", sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT ModifierId
        FROM DishModifier
        WHERE DishId=@DishId
      `);

    res.json(result.recordset);

  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
});

// ===== DishModifierGroup API — Per-dish Modifier Group selection limits =====

// GET: all modifier group configs for a given dish
app.get("/dishmodifiergroup/:dishId", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("DishId", sql.UniqueIdentifier, req.params.dishId)
      .query(`
        SELECT
          dmg.ModifierGroupId,
          dmg.MinSelectionCount,
          dmg.MaxSelectionCount,
          dmg.MultiselectAllow,
          dgm.DishGroupName
        FROM DishModifierGroup dmg
        JOIN DishGroupMaster dgm ON dgm.DishGroupId = dmg.ModifierGroupId
        WHERE dmg.DishId = @DishId
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

// POST: bulk replace all modifier group configs for a given dish
// Body: { DishId: string, ModifierGroups: [{ ModifierGroupId, MinSelectionCount, MaxSelectionCount, MultiselectAllow }] }
app.post("/dishmodifiergroup", async (req, res) => {
  try {
    const { DishId, ModifierGroups } = req.body;
    if (!DishId) return res.status(400).send("DishId required");

    const pool = await poolPromise;
    const groups = Array.isArray(ModifierGroups) ? ModifierGroups : [];

    // Delete existing mappings for this dish
    await pool.request()
      .input("DishId", sql.UniqueIdentifier, DishId)
      .query("DELETE FROM DishModifierGroup WHERE DishId=@DishId");

    // Insert the new set
    for (const g of groups) {
      await pool.request()
        .input("DishModifierGroupId", sql.UniqueIdentifier, uuidv4())
        .input("DishId", sql.UniqueIdentifier, DishId)
        .input("ModifierGroupId", sql.UniqueIdentifier, g.ModifierGroupId)
        .input("MinSelectionCount", sql.Int, Number(g.MinSelectionCount) || 0)
        .input("MaxSelectionCount", sql.Int, Number(g.MaxSelectionCount) || 0)
        .input("MultiselectAllow", sql.Bit, g.MultiselectAllow ? 1 : 0)
        .query(`
          INSERT INTO DishModifierGroup
          (DishModifierGroupId, DishId, ModifierGroupId, MinSelectionCount, MaxSelectionCount, MultiselectAllow)
          VALUES
          (@DishModifierGroupId, @DishId, @ModifierGroupId, @MinSelectionCount, @MaxSelectionCount, @MultiselectAllow)
        `);
    }

    res.json({ message: "DishModifierGroup saved ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

//GET Kitchen List (DISH  KITCHEN API)
app.get("/dishkitchen/:id", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("DishId", sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT KitchenTypeCode
        FROM DishKitchenType
        WHERE DishId=@DishId
      `);

    res.json(result.recordset);

  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
});

app.get("/dishgroupmapping/:id", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("DishId", sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT DishGroupId
        FROM DishGroupMapping
        WHERE DishId = @DishId
      `);

    res.json(result.recordset);

  } catch (err) {
    console.log("🔥 ERROR:", err);
    res.status(500).json({
      message: err.message,
      stack: err.stack
    });
  }
});

app.get("/orderitemshare/:id", async (req, res) => {
  try {

    const pool = await poolPromise;

    const result = await pool.request()
      .input("DishId", sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT CustomerName
        FROM OrderItemShare
        WHERE OrderDetailId = @DishId
      `);

    res.json(result.recordset);

  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
});


//insert dishkitchen

app.post("/dishkitchen", async (req, res) => {
  try {
    const { DishId, KitchenTypeCode, KitchenTypeName, checked } = req.body;

    const pool = await poolPromise; // 🔥 MISSING LINE (IMPORTANT)

    if (checked) {
      await pool.request()
        .input("DishId", sql.UniqueIdentifier, DishId)
        .input("KitchenTypeCode", sql.Int, KitchenTypeCode)
        .input("KitchenTypeName", sql.VarChar(100), KitchenTypeName)
        .query(`
          IF NOT EXISTS (
            SELECT 1 FROM DishKitchenType
            WHERE DishId=@DishId AND KitchenTypeCode=@KitchenTypeCode
          )
          INSERT INTO DishKitchenType
          (DishId, KitchenTypeCode, KitchenTypeName)
          VALUES (@DishId, @KitchenTypeCode, @KitchenTypeName)
        `);

    } else {
      await pool.request()
        .input("DishId", sql.UniqueIdentifier, DishId)
        .input("KitchenTypeCode", sql.Int, KitchenTypeCode)
        .query(`
          DELETE FROM DishKitchenType
          WHERE DishId=@DishId AND KitchenTypeCode=@KitchenTypeCode
        `);
    }

    res.send("OK");

  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
});



/*=====================================================end dish
/*==========================GET ALL MODIFIERS*/
app.get("/modifiermaster", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
  SELECT 
    ModifierId,
    ModifierCode,
    ModifierName,
    ConflictId,
    isActive,
    SortCode,
    isPriceAffect,
    isDishPrice,
    DishCost,
    isOpenModifier
  FROM ModifierMaster
  ORDER BY 
  CAST(SUBSTRING(ModifierCode, 3, 10) AS INT) DESC
`);

    res.json(result.recordset);

  } catch (err) {
    console.error("GET ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/modifiermaster/nextcode", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        'M_' + RIGHT('00000000' + 
          CAST(ISNULL(MAX(CAST(SUBSTRING(ModifierCode, 3, 10) AS INT)), 0) + 1 AS VARCHAR), 
        8) AS NewModifierCode
      FROM ModifierMaster
    `);

    res.json({ code: result.recordset[0].NewModifierCode });

  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
});

//modifier post
app.post("/modifiermaster", async (req, res) => {
  try {
    const {
      ModifierCode,
      ModifierName,
      ConflictId,
      isActive,
      SortCode,
      isPriceAffect,
      isDishPrice,
      DishCost,
      isOpenModifier
    } = req.body;

    if (!ModifierName) {
      return res.status(400).json({ error: "ModifierName is required" });
    }

    const pool = await poolPromise;

    //🔥 AUTO GENERATE CODE HERE
    const codeResult = await pool.request().query(`
  SELECT 
    'M_' + RIGHT('00000000' + 
      CAST(ISNULL(MAX(CAST(SUBSTRING(ModifierCode, 3, 10) AS INT)), 0) + 1 AS VARCHAR), 
    8) AS NewModifierCode
  FROM ModifierMaster
`);

    const newCode = codeResult.recordset[0].NewModifierCode;

    const modId = uuidv4();

    await pool.request()
      .input("ModifierId", sql.UniqueIdentifier, modId)
      .input("ModifierCode", sql.VarChar(50), newCode)
      .input("ModifierName", sql.NVarChar(100), ModifierName || "")
      .input(
        "ConflictId",
        sql.UniqueIdentifier,
        ConflictId && ConflictId !== "" ? ConflictId : null
      )
      .input("isActive", sql.Bit, isActive ?? true)
      .input("SortCode", sql.Int, Number(SortCode) || 0)
      .input("isPriceAffect", sql.Bit, isPriceAffect ?? false)
      .input("isDishPrice", sql.Bit, isDishPrice ?? false)
      .input("DishCost", sql.Decimal(18, 2), Number(DishCost) || 0)
      .input("isOpenModifier", sql.Bit, isOpenModifier ?? false)
      .input("CreatedBy", sql.UniqueIdentifier, req.body.CreatedBy || null)
      .input("CreatedOn", sql.DateTime, new Date())
      .query(`
        INSERT INTO ModifierMaster
        (ModifierId, ModifierCode, ModifierName, ConflictId, isActive, SortCode,
         isPriceAffect, isDishPrice, DishCost, isOpenModifier, CreatedBy,CreatedOn)
        VALUES
        (@ModifierId, @ModifierCode, @ModifierName, @ConflictId, @isActive, @SortCode,
         @isPriceAffect, @isDishPrice, @DishCost, @isOpenModifier, @CreatedBy, @CreatedOn)
      `);

    res.json({ message: "Modifier created", ModifierId: modId });

  } catch (err) {
    console.error("POST ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
//put
app.put("/modifiermaster/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;

    //  validation
    if (!id) {
      return res.status(400).json({ error: "ModifierId missing" });
    }

    const {
      ModifierCode,
      ModifierName,
      ConflictId,
      isActive,
      SortCode,
      isPriceAffect,
      isDishPrice,
      DishCost,
      isOpenModifier
    } = req.body;

    await pool.request()
      .input("ModifierId", sql.UniqueIdentifier, id)
      .input("ModifierCode", sql.VarChar(50), ModifierCode || "")
      .input("ModifierName", sql.NVarChar(100), ModifierName || "")
      .input(
        "ConflictId",
        sql.UniqueIdentifier,
        ConflictId && ConflictId !== "" ? ConflictId : null
      )
      .input("isActive", sql.Bit, isActive ?? true)
      .input("SortCode", sql.Int, Number(SortCode) || 0)
      .input("isPriceAffect", sql.Bit, isPriceAffect ?? false)
      .input("isDishPrice", sql.Bit, isDishPrice ?? false)
      .input("DishCost", sql.Decimal(18, 2), Number(DishCost) || 0)
      .input("isOpenModifier", sql.Bit, isOpenModifier ?? false)
      .input("ModifyOn", sql.DateTime, new Date())
      .query(`
        UPDATE ModifierMaster SET
          ModifierCode=@ModifierCode,
          ModifierName=@ModifierName,
          ConflictId=@ConflictId,
          isActive=@isActive,
          SortCode=@SortCode,
          isPriceAffect=@isPriceAffect,
          isDishPrice=@isDishPrice,
          DishCost=@DishCost,
          isOpenModifier=@isOpenModifier,
          ModifyOn=@ModifyOn
        WHERE ModifierId=@ModifierId
      `);

    res.json({ message: "Modifier updated" });

  } catch (err) {
    console.error("PUT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
//delete
app.delete("/modifiermaster/:id", async (req, res) => {
  try {
    console.log("DELETE ID:", req.params.id);

    const pool = await poolPromise;

    const check = await pool.request()
      .input("ModifierId", sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT 1
        FROM CategoryModifier
        WHERE ModifierId=@ModifierId

        UNION ALL

        SELECT 1
        FROM DishGroupModifier
        WHERE ModifierId=@ModifierId

        UNION ALL

        SELECT 1
        FROM DishModifier
        WHERE ModifierId=@ModifierId
      `);

    console.log("REFERENCES:", check.recordset.length);

    if (check.recordset.length > 0) {
      return res.status(400).json({
        message: "Modifier is in use. Cannot delete."
      });
    }

    await pool.request()
      .input("ModifierId", sql.UniqueIdentifier, req.params.id)
      .query(`
        DELETE FROM ModifierMaster
        WHERE ModifierId=@ModifierId
      `);

    res.json({ message: "Modifier deleted" });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

//=======================================end modifier

app.get("/dishmasterorder", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        DishId,
        Name
      FROM DishMaster
      WHERE IsActive = 1
        AND IsSplitDish = 1
        AND IsGroupDish = 0
      ORDER BY Name
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("GET DishMaster Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
/* ------------------- SERVER ------------------- */
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});