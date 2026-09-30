const express = require("express");
const router = express.Router();
const pdf = require("html-pdf");
const axios = require("axios"); 
const { poolPromise } = require('../db');

// ✅ CONFIGURATION
const config = {
  defaults: {
    rowsPerPage: 20,
    dateFormat: 103,
    footerText: "*** System Generated Report ***",
    footerPoweredBy: "Powered by Unipro"
  }
};

// ✅ Get company details from database
const getCompanyDetails = async () => {
  try {
    const pool = await poolPromise;  
    const result = await pool.request().query(`
      SELECT TOP 1 
        Name,
        Address1_Line1,
        Address1_Line2,
        Address1_Line3,
        Address1_City,
        Address1_State,
        Address1_PostalCode,
        Address1_Telephone1,
        Address1_Telephone2
      FROM UCS.dbo.Organization
      WHERE Name IS NOT NULL AND Name != ''
    `);

    if (result.recordset && result.recordset[0]) {
      console.log("✅ Company found:", result.recordset[0].Name);
      return result.recordset[0];
    }
    console.log("⚠️ No company data found");
    return {};
  } catch (err) {
    console.error("Error fetching company:", err.message);
    return {};
  }
};

// ✅ Get system settings from database
const getSystemSettings = async () => {
  try {
    const pool = await poolPromise;
    
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SystemSettings' AND xtype='U')
        CREATE TABLE SystemSettings (
          SettingId INT IDENTITY(1,1) PRIMARY KEY,
          SettingKey NVARCHAR(100) NOT NULL UNIQUE,
          SettingValue NVARCHAR(MAX),
          Description NVARCHAR(500),
          UpdatedDate DATETIME DEFAULT GETDATE()
        )
      `);
    } catch(e) {
      // Table might already exist
    }
    
    const result = await pool.request().query(`
      SELECT SettingKey, SettingValue FROM SystemSettings
    `);
    
    const settings = {};
    result.recordset.forEach(row => {
      settings[row.SettingKey] = row.SettingValue;
    });
    
    return settings;
  } catch (err) {
    console.error("Error fetching settings:", err);
    return {};
  }
};

// ✅ Get logo
const getLogoBase64 = async () => {
  try {
    const settings = await getSystemSettings();
    let logoUrl = settings.CompanyLogoUrl;
    
    if (!logoUrl) {
      logoUrl = "https://uniprosg.com/wp-content/uploads/2024/09/unipro-logo-green-1.png";
      console.log("⚠️ Using default logo URL");
    }
    
    console.log("Fetching logo from:", logoUrl);
    
    const response = await axios.get(logoUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    const mimeType = response.headers['content-type'] || 'image/png';
    console.log("✅ Logo loaded successfully");
    return `data:${mimeType};base64,${base64}`;
  } catch (err) {
    console.error("❌ Logo fetch error:", err.message);
    return null;
  }
};

const getReportQuery = (params) => {
  const { orderSales, dayEnd, bySales, byItem, fromDate, toDate, category, dishGroup } = params;

  const finalFrom = fromDate;
  const finalTo = toDate;

  const dateFilter = (field) => {
    if (finalFrom && finalTo) {
      return `AND ${field} >= '${finalFrom}' AND ${field} <= '${finalTo} 23:59:59'`;
    }
    return "";
  };

  if (bySales === "Summary") {
    return {
      query: `
        SELECT 
          CONVERT(VARCHAR, InvoiceDate, ${config.defaults.dateFormat}) AS Date,
          ROUND(SUM(ItemSales), 2) AS Sales,
          ROUND(SUM(FOC), 2) AS FOC,
          ROUND(SUM(Discount), 2) AS Disc,
          ROUND(SUM(SVC), 2) AS SVC,
          ROUND(SUM(Tax), 2) AS Tax,
          ROUND(SUM(Tips), 2) AS Tips,
          ROUND(SUM(Rnd), 2) AS Rnd,
          ROUND(SUM(ENT), 2) AS ENT,
          ROUND(SUM(Cash), 2) AS Cash,
          ROUND(SUM(Master), 2) AS Master,
          ROUND(SUM(Visa), 2) AS Visa
        FROM vw_Paymodesales
        WHERE InvoiceDate >= '${finalFrom}' 
          AND InvoiceDate <= '${finalTo} 23:59:59'
        GROUP BY CONVERT(VARCHAR, InvoiceDate, ${config.defaults.dateFormat})
        ORDER BY MIN(InvoiceDate)
      `
    };
  }

  if (bySales === "Journal") {
    return {
      query: `
        SELECT 
          CONVERT(VARCHAR, sh.LastDayEndDate, ${config.defaults.dateFormat}) AS Date,
          CAST(sh.SubTotal AS DECIMAL(10,2)) AS SubTotal,
          CAST(ISNULL(sh.DiscountAmount, 0) AS DECIMAL(10,2)) AS Discount,
          CAST(ISNULL(sh.ServiceCharge, 0) AS DECIMAL(10,2)) AS [Service Charge],
          CAST(ISNULL(sh.TotalTax, 0) AS DECIMAL(10,2)) AS [Total Tax],
          CAST(ISNULL(sh.Tips, 0) AS DECIMAL(10,2)) AS Tips,
          sh.TotalPax,
          org.GstType,
          CAST(ISNULL(sh.RoundedBy, 0) AS DECIMAL(10,2)) AS [Round Off]
        FROM UCS.dbo.SettlementHeader sh
        INNER JOIN UCS.dbo.vw_Organization org ON sh.BusinessUnitId = org.BusinessUnitId
        WHERE sh.LastDayEndDate >= '${finalFrom}' 
          AND sh.LastDayEndDate <= '${finalTo} 23:59:59'
          AND sh.isDayEnd = 1
        ORDER BY sh.LastDayEndDate
      `
    };
  }

  if (byItem === "Month") {
    let monthQuery = `
      SELECT 
        vw.TotalDetailLineAmount, 
        vw.OrderDateTime, 
        vw.DishName,
        dgm.DishGroupName,
        cm.CategoryName
      FROM UCS.dbo.Vw_MonthwiseSales vw
      LEFT JOIN UCS.dbo.DishMaster dm ON vw.DishName = dm.Name
      LEFT JOIN UCS.dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
      LEFT JOIN UCS.dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
      WHERE vw.OrderDateTime >= '${finalFrom}' 
        AND vw.OrderDateTime <= '${finalTo} 23:59:59'
    `;

    if (category && category !== "") {
      monthQuery += ` AND cm.CategoryName = '${category}'`;
    }

    if (dishGroup && dishGroup !== "") {
      monthQuery += ` AND dgm.DishGroupName = '${dishGroup}'`;
    }

    return { query: monthQuery };
  }

  if (byItem === "Qty") {
    let qtyQuery = `
      SELECT 
        DATEPART(YEAR, vw.OrderDateTime) AS Year,
        DATENAME(MONTH, vw.OrderDateTime) AS Month,
        vw.DishName AS Item,
        dgm.DishGroupName,
        CAST(SUM(vw.TotalDetailLineAmount) AS DECIMAL(10,2)) AS Amount
      FROM UCS.dbo.Vw_MonthwiseSales vw
      LEFT JOIN UCS.dbo.DishMaster dm ON vw.DishName = dm.Name
      LEFT JOIN UCS.dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
      LEFT JOIN UCS.dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
      WHERE vw.OrderDateTime >= '${finalFrom}' 
        AND vw.OrderDateTime <= '${finalTo} 23:59:59'
    `;

    if (category && category !== "") {
      qtyQuery += ` AND cm.CategoryName = '${category}'`;
    }

    if (dishGroup && dishGroup !== "") {
      qtyQuery += ` AND dgm.DishGroupName = '${dishGroup}'`;
    }

    qtyQuery += `
      GROUP BY 
        DATEPART(YEAR, vw.OrderDateTime),
        DATENAME(MONTH, vw.OrderDateTime),
        vw.DishName,
        dgm.DishGroupName
      ORDER BY 
        DATEPART(YEAR, vw.OrderDateTime),
        MIN(vw.OrderDateTime),
        Amount DESC
    `;

    return { query: qtyQuery };
  }

  if (orderSales === "Hourly") {
    return {
      query: `
        SELECT 
          CONCAT(
            FORMAT(DATEPART(HOUR, ri.OrderDateTime), '00'), ':00 - ',
            FORMAT(DATEPART(HOUR, ri.OrderDateTime) + 1, '00'), ':00'
          ) AS Hour,
          CAST(SUM(rd.TotalDetailLineAmount) AS DECIMAL(10,2)) AS Amount
        FROM UCS.dbo.RestaurantInvoice ri
        INNER JOIN UCS.dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
        WHERE 1=1
          ${dateFilter('ri.OrderDateTime')}
        GROUP BY DATEPART(HOUR, ri.OrderDateTime)
        ORDER BY DATEPART(HOUR, ri.OrderDateTime)
      `
    };
  }

  if (orderSales === "Daywise") {
    return {
      query: `
        SELECT 
          CONVERT(VARCHAR, ri.OrderDateTime, ${config.defaults.dateFormat}) AS Date,
          COUNT(DISTINCT ri.OrderId) AS [No of Bills],
          CAST(SUM(rd.Quantity) AS DECIMAL(10,2)) AS Qty,
          CAST(SUM(rd.TotalDetailLineAmount) AS DECIMAL(10,2)) AS Amount
        FROM UCS.dbo.RestaurantInvoice ri
        JOIN UCS.dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
        WHERE 1=1
          ${dateFilter('ri.OrderDateTime')}
        GROUP BY CONVERT(VARCHAR, ri.OrderDateTime, ${config.defaults.dateFormat})
        ORDER BY MIN(ri.OrderDateTime)
      `
    };
  }

  if (orderSales === "Itemwise") {
    const escapedCategory = category ? category.replace(/'/g, "''") : "";
    const escapedDishGroup = dishGroup ? dishGroup.replace(/'/g, "''") : "";

    return {
      query: `
        SELECT 
          dm.Name AS Item,
          SUM(rd.Quantity) AS Qty,
          SUM(rd.TotalDetailLineAmount) AS Amount
        FROM UCS.dbo.RestaurantOrderDetail rd
        JOIN UCS.dbo.DishMaster dm ON rd.DishId = dm.DishId
        JOIN UCS.dbo.RestaurantInvoice ri ON rd.OrderId = ri.OrderId
        LEFT JOIN UCS.dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
        LEFT JOIN UCS.dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
        WHERE 1=1
          ${dateFilter('ri.OrderDateTime')}
          ${category ? `AND cm.CategoryName = '${escapedCategory}'` : ''}
          ${dishGroup ? `AND dgm.DishGroupName = '${escapedDishGroup}'` : ''}
        GROUP BY dm.Name
        ORDER BY Amount DESC
      `
    };
  }

  if (orderSales === "Group") {
    return {
      query: `
        SELECT 
          ISNULL(dgm.DishGroupName, 'Uncategorized') AS [Group],
          SUM(rd.Quantity) AS Qty,
          SUM(rd.TotalDetailLineAmount) AS Amount
        FROM UCS.dbo.RestaurantOrderDetail rd
        JOIN UCS.dbo.DishMaster dm ON rd.DishId = dm.DishId
        JOIN UCS.dbo.RestaurantInvoice ri ON rd.OrderId = ri.OrderId
        LEFT JOIN UCS.dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
        WHERE 1=1
          ${dateFilter('ri.OrderDateTime')}
        GROUP BY dgm.DishGroupName
        ORDER BY Amount DESC
      `
    };
  }

  if (dayEnd === "Paymode") {
    return {
      query: `
        SELECT 
          CONVERT(VARCHAR, InvoiceDate, ${config.defaults.dateFormat}) AS Date,
          ROUND(SUM(ItemSales), 2) AS Sales,
          ROUND(SUM(FOC), 2) AS FOC,
          ROUND(SUM(Discount), 2) AS Disc,
          ROUND(SUM(SVC), 2) AS SVC,
          ROUND(SUM(Tax), 2) AS Tax,
          ROUND(SUM(Tips), 2) AS Tips,
          ROUND(SUM(Rnd), 2) AS Rnd,
          ROUND(SUM(ENT), 2) AS ENT,
          ROUND(SUM(Cash), 2) AS Cash,
          ROUND(SUM(Master), 2) AS Master,
          ROUND(SUM(Visa), 2) AS Visa
        FROM vw_Paymodesales
        WHERE InvoiceDate >= '${finalFrom}' 
          AND InvoiceDate <= '${finalTo} 23:59:59'
        GROUP BY CONVERT(VARCHAR, InvoiceDate, ${config.defaults.dateFormat})
        ORDER BY MIN(InvoiceDate)
      `
    };
  }

  if (dayEnd === "Terminal") {
    return {
      query: `
        SELECT 
          CONVERT(VARCHAR, ri.InvoiceDate, ${config.defaults.dateFormat}) AS Date,
          ri.TerminalCode,
          ROUND(SUM(ri.TotalAmount), 2) AS Amount
        FROM UCS.dbo.RestaurantInvoice ri
        WHERE ri.InvoiceDate >= '${finalFrom}' 
          AND ri.InvoiceDate <= '${finalTo} 23:59:59'
        GROUP BY 
          CONVERT(VARCHAR, ri.InvoiceDate, ${config.defaults.dateFormat}),
          ri.TerminalCode
        ORDER BY 
          MIN(ri.InvoiceDate),
          ri.TerminalCode
      `
    };
  }

  if (dayEnd === "Journal") {
    return {
      query: `
        SELECT 
          CONVERT(VARCHAR, sh.LastDayEndDate, ${config.defaults.dateFormat}) AS Date,
          CAST(sh.SubTotal AS DECIMAL(10,2)) AS SubTotal,
          CAST(ISNULL(sh.DiscountAmount, 0) AS DECIMAL(10,2)) AS Discount,
          CAST(ISNULL(sh.ServiceCharge, 0) AS DECIMAL(10,2)) AS [Service Charge],
          CAST(ISNULL(sh.TotalTax, 0) AS DECIMAL(10,2)) AS [Total Tax],
          CAST(ISNULL(sh.Tips, 0) AS DECIMAL(10,2)) AS Tips,
          sh.TotalPax,
          org.GstType,
          CAST(ISNULL(sh.RoundedBy, 0) AS DECIMAL(10,2)) AS [Round Off]
        FROM UCS.dbo.SettlementHeader sh
        INNER JOIN UCS.dbo.vw_Organization org ON sh.BusinessUnitId = org.BusinessUnitId
        WHERE sh.LastDayEndDate >= '${finalFrom}' 
          AND sh.LastDayEndDate <= '${finalTo} 23:59:59'
          AND sh.isDayEnd = 1
        ORDER BY sh.LastDayEndDate
      `
    };
  }

  if (dayEnd === "JournalSummary") {
    return {
      query: `
        SELECT 
          CONVERT(VARCHAR, sh.LastDayEndDate, ${config.defaults.dateFormat}) AS Date,
          CAST(SUM(sh.SubTotal) AS DECIMAL(10,2)) AS [Sub Total],
          CAST(SUM(ISNULL(sh.DiscountAmount, 0)) AS DECIMAL(10,2)) AS Discount,
          CAST(SUM(ISNULL(sh.ServiceCharge, 0)) AS DECIMAL(10,2)) AS [Service Charge],
          CAST(SUM(sh.SubTotal) - SUM(ISNULL(sh.DiscountAmount, 0)) + SUM(ISNULL(sh.ServiceCharge, 0)) AS DECIMAL(10,2)) AS [Gross Total],
          CAST(SUM(ISNULL(sh.TotalTax, 0)) AS DECIMAL(10,2)) AS [Total Tax],
          CAST(SUM(ISNULL(sh.RoundedBy, 0)) AS DECIMAL(10,2)) AS [Round],
          CAST(SUM(sh.SubTotal) - SUM(ISNULL(sh.DiscountAmount, 0)) + SUM(ISNULL(sh.ServiceCharge, 0)) + SUM(ISNULL(sh.TotalTax, 0)) + SUM(ISNULL(sh.RoundedBy, 0)) AS DECIMAL(10,2)) AS [Net Total]
        FROM UCS.dbo.SettlementHeader sh
        WHERE sh.LastDayEndDate >= '${finalFrom}' 
          AND sh.LastDayEndDate <= '${finalTo} 23:59:59'
        GROUP BY CONVERT(VARCHAR, sh.LastDayEndDate, ${config.defaults.dateFormat})
        ORDER BY MIN(sh.LastDayEndDate)
      `
    };
  }

  if (dayEnd === "Transaction") {
    return {
      query: `
        SELECT 
          TransactionMode,
          CAST(SUM(Amount) AS DECIMAL(10,2)) AS Amount
        FROM UCS.dbo.TransactionMaster
        WHERE isSettlement = 1
          AND TransactionDate >= '${finalFrom}' 
          AND TransactionDate <= '${finalTo} 23:59:59'
        GROUP BY TransactionMode
        
        UNION ALL
        
        SELECT 
          'No Transactions Found' AS TransactionMode,
          0 AS Amount
        WHERE NOT EXISTS (
          SELECT 1 FROM UCS.dbo.TransactionMaster
          WHERE isSettlement = 1
            AND TransactionDate >= '${finalFrom}' 
            AND TransactionDate <= '${finalTo} 23:59:59'
        )
      `
    };
  }

  return {
    query: `
      SELECT 
        CONVERT(VARCHAR, ri.OrderDateTime, ${config.defaults.dateFormat}) AS Date,
        COUNT(DISTINCT ri.OrderId) AS [No of Bills],
        CAST(SUM(rd.Quantity) AS DECIMAL(10,2)) AS Qty,
        CAST(SUM(rd.TotalDetailLineAmount) AS DECIMAL(10,2)) AS Amount
      FROM UCS.dbo.RestaurantInvoice ri
      JOIN UCS.dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
      WHERE 1=1
        ${dateFilter('ri.OrderDateTime')}
      GROUP BY CONVERT(VARCHAR, ri.OrderDateTime, ${config.defaults.dateFormat})
      ORDER BY MIN(ri.OrderDateTime)
    `
  };
};

// ✅ GST REPORT API
router.get("/gst-report-data", async (req, res) => {
  try {
    const pool = await poolPromise; 
    let { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "fromDate and toDate are required" });
    }

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    endDate.setDate(endDate.getDate() + 1);
    
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];

    const query = `
      SELECT 
        CONVERT(VARCHAR, InvoiceDate, ${config.defaults.dateFormat}) AS Date,
        ROUND(SUM(TotalLineItemAmount), 2) AS TotalSales,
        ROUND(SUM(TotalTax), 2) AS TotalTax
      FROM UCS.dbo.RestaurantInvoice
      WHERE CAST(InvoiceDate AS DATE) >= CAST('${formattedStartDate}' AS DATE)
        AND CAST(InvoiceDate AS DATE) < CAST('${formattedEndDate}' AS DATE)
      GROUP BY CONVERT(VARCHAR, InvoiceDate, ${config.defaults.dateFormat})
      ORDER BY MIN(InvoiceDate)
    `;

    const result = await pool.request().query(query);
    const rawData = result.recordset || [];

    const grandTotalSales = rawData.reduce((sum, row) => sum + (row.TotalSales || 0), 0);
    const grandTotalTax = rawData.reduce((sum, row) => sum + (row.TotalTax || 0), 0);

    res.json({
      sales: rawData,
      columns: ['Date', 'Total Sales', 'Total Tax'],
      grandTotal: grandTotalSales,
      grandTotalTax: grandTotalTax
    });

  } catch (err) {
    console.error("GST Report Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GST PDF DOWNLOAD
router.get("/download-gst-pdf", async (req, res) => {
  try {
    const pool = await poolPromise;
    const company = await getCompanyDetails();
    const settings = await getSystemSettings();
    const logoBase64 = await getLogoBase64();
    let { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).send("fromDate and toDate are required");
    }

    const toDateObj = new Date(toDate);
    const nextDay = new Date(toDateObj);
    nextDay.setDate(nextDay.getDate() + 1);
    const toDateNextDay = nextDay.toISOString().split('T')[0];

    const query = `
      SELECT 
        CONVERT(VARCHAR, InvoiceDate, ${config.defaults.dateFormat}) AS Date,
        ROUND(SUM(TotalLineItemAmount), 2) AS TotalSales,
        ROUND(SUM(TotalTax), 2) AS TotalTax
      FROM UCS.dbo.RestaurantInvoice
      WHERE InvoiceDate >= '${fromDate}'
        AND InvoiceDate < '${toDateNextDay}'
      GROUP BY CONVERT(VARCHAR, InvoiceDate, ${config.defaults.dateFormat})
      ORDER BY MIN(InvoiceDate)
    `;

    const result = await pool.request().query(query);
    const rawData = result.recordset || [];

    if (rawData.length === 0) {
      return res.status(404).send("No data found for the selected criteria");
    }

    const currentDate = new Date().toLocaleDateString('en-GB');
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const currentDateTime = `${currentDate}, ${currentTime}`;

    const grandTotalSales = rawData.reduce((sum, row) => sum + (row.TotalSales || 0), 0);
    const grandTotalTax = rawData.reduce((sum, row) => sum + (row.TotalTax || 0), 0);

    const addressParts = [];
    if (company.Address1_Line1) addressParts.push(company.Address1_Line1);
    if (company.Address1_Line2) addressParts.push(company.Address1_Line2);
    if (company.Address1_Line3) addressParts.push(company.Address1_Line3);
    if (company.Address1_City) addressParts.push(company.Address1_City);
    if (company.Address1_State) addressParts.push(company.Address1_State);
    let fullAddress = addressParts.join(", ");
    if (company.Address1_PostalCode) {
      fullAddress = fullAddress ? `${fullAddress} ${company.Address1_PostalCode}` : company.Address1_PostalCode;
    }

    const companyName = company.Name || "";
    const companyPhone = company.Address1_Telephone1 || "";

    const formatCurrency = (value) => {
      if (value === undefined || value === null) return '0.00';
      return value.toLocaleString('en-SG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };

    const footerText = settings.FooterText || config.defaults.footerText;
    const footerPoweredBy = settings.FooterPoweredBy || config.defaults.footerPoweredBy;

    const html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>GST Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Cambria', 'Times New Roman', serif; font-size: 11px; color: #333; background: white; padding: 20px; }
        .header-table { width: 100%; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #1a3c5a; }
        .header-table td { border: none; padding: 0; }
        .logo-cell { width: 120px; text-align: left; vertical-align: middle; }
        .logo-cell img { max-height: 60px; max-width: 100px; object-fit: contain; }
        .company-cell { text-align: center; vertical-align: middle; }
        .company-name { font-size: 16px; font-weight: 800; color: #1a3c5a; text-transform: uppercase; }
        .company-address { font-size: 10px; color: #555; margin-top: 5px; }
        .company-contact { font-size: 9px; color: #666; margin-top: 3px; }
        .spacer-cell { width: 120px; }
        .report-title { text-align: center; font-size: 16px; font-weight: 800; color: #1a3c5a; margin: 10px 0 5px; text-transform: uppercase; }
        .report-subtitle { text-align: center; font-size: 11px; color: #555; margin-bottom: 20px; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 10px; }
        .data-table th { background-color: #1a3c5a; color: white; padding: 8px 10px; text-align: center; border: 1px solid #2a4c6a; font-weight: 600; }
        .data-table td { border: 1px solid #e0e0e0; padding: 6px 10px; }
        .data-table td:first-child { text-align: left; }
        .data-table td:not(:first-child) { text-align: right; }
        .data-table tr:nth-child(even) { background-color: #f9f9f9; }
        .total-row td { 
          background-color: #eef2f8; 
          font-weight: 700; 
          border-top: 2px solid #1a3c5a;
        }
      </style>
    </head>
    <body>
      <table class="header-table">
        <tr><td class="logo-cell">${logoBase64 ? `<img src="${logoBase64}" alt="Company Logo">` : ''}</td>
        <td class="company-cell">
          <div class="company-name">${companyName || 'Company Name Not Found'}</div>
          <div class="company-address">${fullAddress || 'Address Not Found'}</div>
          ${companyPhone ? `<div class="company-contact">Phone: ${companyPhone}</div>` : ''}
        </td>
        <td class="spacer-cell"></td>
      </table>
      <div class="report-title">GST REPORT</div>
      <div class="report-subtitle">As on ${fromDate} to ${toDate}</div>
      
      <table class="data-table">
        <thead>
          <tr><th>DATE</th><th>TOTAL SALES (S$)</th><th>TOTAL TAX (S$)</th></tr>
        </thead>
        <tbody>
          ${rawData.map(row => `
            <tr>
              <td>${row.Date || '-'}</td>
              <td>${formatCurrency(row.TotalSales)}</td>
              <td>${formatCurrency(row.TotalTax)}</td>
            </tr>
          `).join("")}
          <tr class="total-row">
            <td style="text-align: right;"><strong>TOTAL</strong></td>
            <td style="text-align: right;"><strong>${formatCurrency(grandTotalSales)}</strong></td>
            <td style="text-align: right;"><strong>${formatCurrency(grandTotalTax)}</strong></td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>`;

    const pdfOptions = { 
      format: 'A4', 
      border: { top: '0.5cm', right: '0.5cm', bottom: '1.2cm', left: '0.5cm' }, 
      footer: {
        height: "12mm",
        contents: {
          default: `
            <div style="border-top: 1px solid #eee; padding-top: 5px; font-family: 'Cambria', 'Times New Roman', serif;">
              <div style="text-align: center; font-size: 8px; color: #888; margin-bottom: 3px;">${footerText}</div>
              <div style="text-align: center; font-size: 8px; color: #aaa;">${footerPoweredBy}</div>
            </div>
          `
        }
      },
      printBackground: true 
    };
    pdf.create(html, pdfOptions).toStream((err, stream) => {
      if (err) return res.status(500).send(err.message);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="gst_report.pdf"');
      stream.pipe(res);
    });
  } catch (err) {
    console.error("GST PDF Error:", err);
    res.status(500).send(err.message);
  }
});

// ✅ API for table data
router.get("/salesreport", async (req, res) => {
  try {
    let { fromDate, toDate } = req.query;

    if (fromDate && toDate && fromDate > toDate) {
      [fromDate, toDate] = [toDate, fromDate];
    }

    const pool = await poolPromise;
    const queryConfig = getReportQuery({
      orderSales: req.query.orderSales,
      dayEnd: req.query.dayEnd,
      bySales: req.query.bySales,
      byItem: req.query.byItem,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      category: req.query.category,
      dishGroup: req.query.dishGroup
    });

    const result = await pool.request().query(queryConfig.query);

    let grandTotal = null;
    if (req.query.orderSales === "Hourly") {
      grandTotal = result.recordset.reduce((sum, row) => sum + (row.Amount || 0), 0);
    }
    if (req.query.bySales === "Journal") {
      grandTotal = result.recordset.reduce((sum, row) => sum + (row.SubTotal || 0), 0);
    }
    if (req.query.dayEnd === "Journal") {
      grandTotal = result.recordset.reduce((sum, row) => sum + (row.SubTotal || 0), 0);
    }
    if (req.query.dayEnd === "JournalSummary") {
      grandTotal = result.recordset.reduce((sum, row) => sum + (row['Net Total'] || 0), 0);
    }
    if (req.query.dayEnd === "Transaction") {
      grandTotal = result.recordset.reduce((sum, row) => sum + (row.Amount || 0), 0);
    }

    return res.json({
      sales: result.recordset,
      columns: result.recordset.length > 0 ? Object.keys(result.recordset[0]) : [],
      grandTotal: grandTotal
    });

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ API for company info
router.get("/company-info", async (req, res) => {
  try {
    const company = await getCompanyDetails();
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ API for Categories
router.get("/categories", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        CategoryId,
        CategoryName
      FROM UCS.dbo.CategoryMaster 
      WHERE CategoryName IS NOT NULL AND CategoryName != ''
        AND isActive = 1
      ORDER BY SortCode, CategoryName
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Categories error:", err);
    res.status(500).json([]);
  }
});

// ✅ API for Dish Groups
router.get("/dishgroups", async (req, res) => {
  try {
    const { categoryId } = req.query;
    const pool = await poolPromise;

    let query = `
      SELECT DISTINCT 
        dgm.DishGroupId,
        dgm.DishGroupName
      FROM UCS.dbo.DishGroupMaster dgm
      WHERE dgm.DishGroupName IS NOT NULL 
        AND dgm.DishGroupName != ''
        AND dgm.isActive = 1
    `;

    if (categoryId && categoryId !== "" && categoryId !== "undefined" && categoryId !== "null") {
      query += ` AND dgm.CategoryId = '${categoryId}'`;
    }

    query += ` ORDER BY dgm.DishGroupName`;

    const result = await pool.request().query(query);
    res.json(result.recordset.map(r => r.DishGroupName));

  } catch (err) {
    console.error("DishGroups error:", err);
    res.status(500).json([]);
  }
});

// ✅ API: Category LOV
router.get("/category-lov", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        CategoryId,
        CategoryCode,
        CategoryName,
        ShortName,
        BackColor,
        ForeColor,
        isKitchenPrint,
        isDiscountAllowed,
        isServiceCharge,
        isActive
      FROM UCS.dbo.CategoryMaster
      WHERE isActive = 1
      ORDER BY SortCode, CategoryName
    `);
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (err) {
    console.error("Category LOV error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ API: DishGroup LOV
router.get("/dishgroup-lov", async (req, res) => {
  try {
    const { categoryId } = req.query;
    const pool = await poolPromise;

    let query = `
      SELECT 
        dgm.DishGroupId,
        dgm.DishGroupCode,
        dgm.DishGroupName,
        dgm.ShortName,
        dgm.SortCode,
        dgm.KitchenSortCode,
        dgm.BackColor,
        dgm.ForeColor,
        dgm.isActive,
        cm.CategoryId,
        cm.CategoryName
      FROM UCS.dbo.DishGroupMaster dgm
      LEFT JOIN UCS.dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
      WHERE dgm.isActive = 1
    `;

    if (categoryId && categoryId !== "") {
      query += ` AND dgm.CategoryId = '${categoryId}'`;
    }

    query += ` ORDER BY dgm.KitchenSortCode, dgm.DishGroupName`;

    const result = await pool.request().query(query);
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (err) {
    console.error("DishGroup LOV error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ API: Get system settings
router.get("/settings", async (req, res) => {
  try {
    const settings = await getSystemSettings();
    res.json({
      success: true,
      data: settings
    });
  } catch (err) {
    console.error("Settings error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ API: Update system settings
router.post("/settings", async (req, res) => {
  try {
    const pool = await poolPromise;
    const settings = req.body;
    
    for (const [key, value] of Object.entries(settings)) {
      await pool.request()
        .input('key', key)
        .input('value', value)
        .query(`
          MERGE INTO SystemSettings AS target
          USING (SELECT @key AS SettingKey, @value AS SettingValue) AS source
          ON target.SettingKey = source.SettingKey
          WHEN MATCHED THEN
            UPDATE SET SettingValue = source.SettingValue, UpdatedDate = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (SettingKey, SettingValue, UpdatedDate)
            VALUES (source.SettingKey, source.SettingValue, GETDATE());
        `);
    }
    
    res.json({
      success: true,
      message: "Settings updated successfully"
    });
  } catch (err) {
    console.error("Update settings error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ DIRECT PDF DOWNLOAD - FIXED WITH TOTAL FOR ALL REPORTS
router.get("/download-pdf", async (req, res) => {
  try {
    console.log("=== DOWNLOAD PDF CALLED ===");
    
    const pool = await poolPromise;
    const queryConfig = getReportQuery(req.query);
    const company = await getCompanyDetails();
    const settings = await getSystemSettings();
    const logoBase64 = await getLogoBase64();
    const result = await pool.request().query(queryConfig.query);
    const rawData = result.recordset || [];

    if (rawData.length === 0) {
      return res.status(404).send("No data found for the selected criteria");
    }

    const fromDate = req.query.fromDate || "";
    const toDate = req.query.toDate || "";
    const currentDate = new Date().toLocaleDateString('en-GB');
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const currentDateTime = `${currentDate}, ${currentTime}`;

    const footerText = (settings && settings.FooterText) || config.defaults.footerText;
    const footerPoweredBy = (settings && settings.FooterPoweredBy) || config.defaults.footerPoweredBy;

    let reportTitle = "SALES REPORT";
    let displayColumns = [];
    let mappedData = [];
    let isHourlyReport = false;
    let isTerminalReport = false;

    if (req.query.orderSales === "Hourly") {
      reportTitle = "HOURLY SALES REPORT";
      displayColumns = ['Time', 'Value'];
      mappedData = rawData.map(row => ({ Time: row.Hour, Value: row.Amount }));
      isHourlyReport = true;
    }
    else if (req.query.orderSales === "Daywise") {
      reportTitle = "DAYWISE SALES REPORT";
      displayColumns = ['Date', 'No of Bills', 'Qty', 'Amount'];
      mappedData = rawData;
    }
    else if (req.query.orderSales === "Itemwise") {
      reportTitle = "ITEMWISE SALES REPORT";
      displayColumns = ['Item', 'Qty', 'Amount'];
      mappedData = rawData;
    }
    else if (req.query.orderSales === "Group") {
      reportTitle = "GROUP WISE SALES REPORT";
      displayColumns = ['Group', 'Qty', 'Amount'];
      mappedData = rawData;
    }
    else if (req.query.byItem === "Month") {
      reportTitle = "MONTH WISE SALES REPORT";
      displayColumns = ['Date', 'DishName', 'Amount', 'DishGroup', 'Category'];
      
      const formatDate = (dateValue) => {
        if (!dateValue) return '-';
        try {
          const d = new Date(dateValue);
          if (isNaN(d.getTime())) return dateValue;
          return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        } catch(e) {
          return dateValue;
        }
      };
      
      mappedData = rawData.map(row => ({
        Date: formatDate(row.OrderDateTime),
        DishName: row.DishName || '-',
        Amount: Number(row.TotalDetailLineAmount) || 0,
        DishGroup: row.DishGroupName || '-',
        Category: row.CategoryName || '-'
      }));
    }
    else if (req.query.byItem === "Qty") {
      reportTitle = "QUANTITY WISE SALES REPORT";
      displayColumns = ['Year', 'Month', 'Item', 'DishGroup', 'Amount'];
      mappedData = rawData.map(row => ({
        Year: row.Year || '-',
        Month: row.Month || '-',
        Item: row.Item || '-',
        DishGroup: row.DishGroupName || '-',
        Amount: Number(row.Amount) || 0
      }));
    }
    else if (req.query.bySales === "Summary") {
      reportTitle = "SALES SUMMARY REPORT";
      displayColumns = ['Date', 'Sales', 'FOC', 'Disc', 'SVC', 'Tax', 'Tips', 'Rnd', 'ENT', 'Cash', 'Master', 'Visa'];
      mappedData = rawData;
    }
    else if (req.query.bySales === "Journal") {
      reportTitle = "SALES JOURNAL REPORT";
      displayColumns = ['Date', 'SubTotal', 'Discount', 'Service Charge', 'Total Tax', 'Tips', 'TotalPax', 'GstType', 'Round Off'];
      mappedData = rawData;
    }
    else if (req.query.dayEnd === "Paymode") {
      reportTitle = "PAYMODE COLLECTION REPORT";
      displayColumns = ['Date', 'Sales', 'FOC', 'Disc', 'SVC', 'Tax', 'Tips', 'Rnd', 'ENT', 'Cash', 'Master', 'Visa'];
      mappedData = rawData.map(row => ({
        Date: row.Date || row.InvoiceDate || '',
        Sales: Number(row.Sales || row.ItemSales || 0),
        FOC: Number(row.FOC || 0),
        Disc: Number(row.Disc || row.Discount || 0),
        SVC: Number(row.SVC || 0),
        Tax: Number(row.Tax || 0),
        Tips: Number(row.Tips || 0),
        Rnd: Number(row.Rnd || 0),
        ENT: Number(row.ENT || 0),
        Cash: Number(row.Cash || 0),
        Master: Number(row.Master || 0),
        Visa: Number(row.Visa || 0)
      }));
    }
    else if (req.query.dayEnd === "Journal") {
      reportTitle = "SALES JOURNAL REPORT";
      displayColumns = ['Date', 'SubTotal', 'Discount', 'Service Charge', 'Total Tax', 'Tips', 'TotalPax', 'GstType', 'Round Off'];
      mappedData = rawData;
    }
    else if (req.query.dayEnd === "Terminal") {
      reportTitle = "TERMINAL SALES REPORT";
      
      const processedData = [];
      let currentDateTemp = null;
      let dayTotal = 0;
      let grandTotalAmount = 0;
      
      rawData.forEach((row, index) => {
        const rowDate = row.Date;
        const amount = parseFloat(row.Amount) || 0;
        
        if (currentDateTemp !== rowDate) {
          if (currentDateTemp !== null) {
            processedData.push({
              Date: " DAY TOTAL ",
              TerminalCode: "",
              Amount: dayTotal,
              isTotalRow: true
            });
          }
          currentDateTemp = rowDate;
          dayTotal = 0;
        }
        
        processedData.push({
          Date: rowDate,
          TerminalCode: row.TerminalCode,
          Amount: amount,
          isTotalRow: false
        });
        
        dayTotal += amount;
        grandTotalAmount += amount;
      });
      
      if (currentDateTemp !== null) {
        processedData.push({
          Date: " DAY TOTAL ",
          TerminalCode: "",
          Amount: dayTotal,
          isTotalRow: true
        });
      }
      
      // Add GRAND TOTAL row at the end
      processedData.push({
        Date: "GRAND TOTAL",
        TerminalCode: "",
        Amount: grandTotalAmount,
        isTotalRow: true,
        isGrandTotal: true
      });
      
      displayColumns = ['Date', 'TerminalCode', 'Amount'];
      mappedData = processedData;
      isTerminalReport = true;
    }
    else if (req.query.dayEnd === "Transaction") {
      reportTitle = "TRANSACTION REPORT";
      displayColumns = ['TransactionMode', 'Amount'];
      mappedData = rawData.map(row => ({
        TransactionMode: row.TransactionMode,
        Amount: Number(row.Amount || 0)
      }));
    }
    else {
      displayColumns = Object.keys(rawData[0]);
      mappedData = rawData;
    }

    const addressParts = [];
    if (company.Address1_Line1) addressParts.push(company.Address1_Line1);
    if (company.Address1_Line2) addressParts.push(company.Address1_Line2);
    if (company.Address1_Line3) addressParts.push(company.Address1_Line3);
    if (company.Address1_City) addressParts.push(company.Address1_City);
    if (company.Address1_State) addressParts.push(company.Address1_State);
    let fullAddress = addressParts.join(", ");
    if (company.Address1_PostalCode) {
      fullAddress = fullAddress ? `${fullAddress} - ${company.Address1_PostalCode}` : company.Address1_PostalCode;
    }

    const companyName = company.Name || "";
    const companyPhone = company.Address1_Telephone1 || "";

    // ✅ Calculate totals for numeric columns (excluding date and text columns)
    const nonTotalColumns = ['Date', 'Month', 'Item', 'DishGroupName', 'CategoryName', 'GstType', 'Hour', 'Group', 'TransactionMode', 'TerminalCode', 'DishName', 'OrderDateTime', 'TotalDetailLineAmount', 'Year', 'No of Bills', 'Qty', 'Time'];
    const totalColumns = displayColumns.filter(col => !nonTotalColumns.includes(col) && col !== 'Date');
    
    // Calculate grand totals (excluding DAY TOTAL rows)
    const grandTotals = {};
    totalColumns.forEach(col => {
      let sum = 0;
      for (let j = 0; j < mappedData.length; j++) {
        // Skip DAY TOTAL rows for grand total calculation if not terminal report
        if (isTerminalReport && mappedData[j].Date === " DAY TOTAL ") {
          continue;
        }
        const val = mappedData[j][col];
        if (typeof val === 'number') {
          sum += val;
        } else if (val && !isNaN(Number(val))) {
          sum += Number(val);
        }
      }
      grandTotals[col] = sum.toFixed(2);
    });
    
    console.log("Display Columns:", displayColumns);
    console.log("Total Columns:", totalColumns);
    console.log("Grand Totals:", grandTotals);

    // Build table rows
    let tableRows = '';
    mappedData.forEach((row, idx) => {
      const isDayTotal = row.Date === " DAY TOTAL ";
      const isGrandTotal = row.Date === "GRAND TOTAL";
      const rowClass = isDayTotal ? 'day-total-row' : (isGrandTotal ? 'grand-total-row' : '');
      
      tableRows += `
        <tr class="${rowClass}">
          ${displayColumns.map((col, colIdx) => {
            let val = row[col];
            const isNumber = typeof val === 'number';
            const alignment = (colIdx === 0 || col === 'TerminalCode') ? 'left' : 'right';
            let displayValue = (val || val === 0) ? val : '-';
            if (isNumber) {
              displayValue = val.toFixed(2);
            }
            let style = `text-align: ${alignment}; padding: 6px 10px; border: 1px solid #e0e0e0;`;
            if (isDayTotal || isGrandTotal) {
              style += ' background-color: #eef2f8; font-weight: bold;';
            }
            if (isGrandTotal) {
              style += ' border-top: 2px solid #1a3c5a;';
            }
            return `<td style="${style}">${displayValue}</td>`;
          }).join("")}
        </tr>
      `;
    });
    
    // ✅ Build TOTAL row for non-terminal, non-hourly reports
    let totalRow = '';
    if (!isHourlyReport && !isTerminalReport && totalColumns.length > 0) {
      let totalCells = '<td style="text-align: right; font-weight: bold; padding: 6px 10px; border: 1px solid #e0e0e0; background-color: #eef2f8;"><strong>TOTAL</strong></td>';
      for (let i = 1; i < displayColumns.length; i++) {
        const col = displayColumns[i];
        if (totalColumns.includes(col)) {
          totalCells += `<td style="text-align: right; font-weight: bold; padding: 6px 10px; border: 1px solid #e0e0e0; background-color: #eef2f8;">${grandTotals[col]} </td>`;
        } else {
          totalCells += `<td style="text-align: right; padding: 6px 10px; border: 1px solid #e0e0e0; background-color: #eef2f8;">- <td>`;
        }
      }
      totalRow = `<tr class="total-row">${totalCells}<tr>`;
    }
    
    // ✅ For Hourly Report - special TOTAL line
    let hourlyTotalHtml = '';
    if (isHourlyReport) {
      let totalValue = 0;
      mappedData.forEach(row => {
        totalValue += Number(row.Value) || 0;
      });
      hourlyTotalHtml = `
        <div style="margin-top: 20px; padding: 10px 15px; background: #eef2f8; border-top: 2px solid #1a3c5a; text-align: right; font-weight: bold;">
          <strong>TOTAL: ${totalValue.toFixed(2)}</strong>
        </div>
      `;
    }

    const pageHeader = `
      <table class="header-table">
        <tr>
          <td class="logo-cell">
            ${logoBase64 ? `<img src="${logoBase64}" alt="Company Logo" style="max-height:60px;max-width:100px;">` : ''}
           </td>
          <td class="company-cell">
            <div class="company-name">${companyName || 'Company Name Not Found'}</div>
            <div class="company-address">${fullAddress || 'Address Not Found'}</div>
            ${companyPhone ? `<div class="company-phone">Phone: ${companyPhone}</div>` : ''}
           </td>
          <td class="spacer-cell"> </td>
        </tr>
      </table>
      <div class="report-title">${reportTitle}</div>
      <div class="report-subtitle">Period: ${fromDate} to ${toDate} | Printed: ${currentDateTime}</div>
    `;

    const html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${reportTitle}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Cambria', 'Times New Roman', serif; font-size: 11px; color: #333; background: white; padding: 20px; }
        .header-table { width: 100%; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #1a3c5a; }
        .header-table td { border: none; padding: 0; }
        .logo-cell { width: 120px; text-align: left; vertical-align: middle; }
        .logo-cell img { max-height: 60px; max-width: 100px; object-fit: contain; }
        .company-cell { text-align: center; vertical-align: middle; }
        .company-name { font-size: 16px; font-weight: 800; color: #1a3c5a; text-transform: uppercase; }
        .company-address, .company-phone { font-size: 10px; color: #555; margin-top: 3px; }
        .spacer-cell { width: 120px; }
        .report-title { text-align: center; font-size: 16px; font-weight: 800; color: #1a3c5a; margin: 10px 0 5px; text-transform: uppercase; }
        .report-subtitle { text-align: center; font-size: 11px; color: #555; margin-bottom: 20px; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 10px; }
        .data-table th { background-color: #1a3c5a; color: white; padding: 8px 10px; text-align: center; border: 1px solid #2a4c6a; font-weight: 600; }
        .data-table td { border: 1px solid #e0e0e0; padding: 6px 10px; }
        .data-table tr:nth-child(even) { background-color: #f9f9f9; }
        .total-row td, .day-total-row td { background-color: #eef2f8 !important; font-weight: 700; }
        .grand-total-row td { background-color: #1a3c5a !important; color: white !important; font-weight: 700; }
        @media print {
          body { padding: 0; margin: 0; }
          .data-table th { background-color: #1a3c5a !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .data-table tr:nth-child(even) { background-color: #f9f9f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .total-row td, .day-total-row td { background-color: #eef2f8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .grand-total-row td { background-color: #1a3c5a !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      ${pageHeader}
      
      <table class="data-table">
        <thead>
          <tr>${displayColumns.map(col => `<th>${col}</th>`).join("")}</thead>
        <tbody>
          ${tableRows}
          ${totalRow}
        </tbody>
      </table>
      
      ${hourlyTotalHtml}
      
      <div style="text-align: center; font-size: 8px; color: #888; margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee;">
        <div>${footerText}</div>
        <div>${footerPoweredBy}</div>
      </div>
    </body>
    </html>`;
    
    const pdfOptions = {
      format: 'A4',
      border: { top: '0.5cm', right: '0.5cm', bottom: '0.5cm', left: '0.5cm' },
      printBackground: true,
      orientation: 'portrait'
    };

    pdf.create(html, pdfOptions).toStream((err, stream) => {
      if (err) {
        console.error("PDF Generation Error:", err);
        return res.status(500).send(err.message);
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');
      stream.pipe(res);
    });

  } catch (err) {
    console.error("PDF Generation ERROR:", err);
    res.status(500).send(err.message);
  }
});

// Keep old endpoints for compatibility
router.get("/sales-pdf", async (req, res) => {
  res.redirect(`/api/reports/download-pdf?${new URLSearchParams(req.query).toString()}`);
});

router.get("/paymode-html", async (req, res) => {
  res.redirect(`/api/reports/download-pdf?${new URLSearchParams(req.query).toString()}&dayEnd=Paymode`);
});

router.get("/terminal-html", async (req, res) => {
  res.redirect(`/api/reports/download-pdf?${new URLSearchParams(req.query).toString()}&dayEnd=Terminal`);
});

module.exports = router;