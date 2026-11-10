const express = require('express');
const router = express.Router();
const pdf = require('html-pdf');
const { sql, poolPromise } = require('../db');
const { logoBase64, posLogoBase64 } = require('../config/logo');

// Helper to fetch day end calculations
async function getDayEndReportData(fromDate, toDate) {
    const pool = await poolPromise;

    // Organization Info
    const orgQuery = `
        SELECT TOP 1
            CompanyName,
            Address,
            Phone,
            Email
        FROM dbo.companysettings
    `;
    const orgResult = await pool.request().query(orgQuery);
    const orgInfo = orgResult.recordset[0] || {};

    // 1. Get SettlementHeader data
    let headerQuery = `
        SELECT
            SettlementID,
            ISNULL(SubTotal, 0) as TotalSales,
            ISNULL(RoundedBy, 0) as RoundOff,
            ISNULL(TotalTax, 0) as TotalTax,
            ISNULL(DiscountAmount, 0) as Discount,
            ISNULL(ServiceCharge, 0) as ServiceCharge,
            ISNULL(InvoiceCount, 0) as NoOfBills,
            ISNULL(VoidItemQty, 0) as VoidQty,
            ISNULL(VoidItemAmount, 0) as VoidItemAmount,
            ISNULL(TerminalCode, 'SR') as TerminalCode,
            ISNULL(DayendRefNo, 'D000001') as DayendRefNo,
            start_date
        FROM dbo.SettlementHeader
    `;

    if (fromDate && toDate) {
        headerQuery += ` WHERE CAST(start_date AS DATE) BETWEEN @start AND @end `;
    }

    const headerRequest = pool.request();
    if (fromDate && toDate) {
        headerRequest.input('start', sql.Date, fromDate);
        headerRequest.input('end', sql.Date, toDate);
    }

    const headerResult = await headerRequest.query(headerQuery);
    const headers = headerResult.recordset;

    if (headers.length === 0) {
        return {
            orgInfo,
            reportData: {
                cashier: "System",
                receiptCount: 0,
                refNo: "",
                salesDetail: { totalSales: 0, totalTax: 0, totalDiscount: 0, totalServiceCharge: 0, roundOff: 0, netTotal: 0 },
                paymodeDetail: {},
                settlementDetail: { cashTotal: 0, cardTotal: 0, otherTotal: 0 },
                analysis: { salesAmount: 0, noOfBills: 0, avgPerBill: 0 },
                voidDetail: { voidItemQty: 0, voidItemAmount: 0 }
            }
        };
    }

    // 2. Get Payment Mode Breakdown from PaymentDetail
    const paymodeQuery = `
        SELECT 
            pm.PayMode AS PayModeName,
            COUNT(DISTINCT ri.BillNumber) AS TransactionCount,
            SUM(pd.Amount) AS TotalAmount
        FROM dbo.PaymentDetail pd
        INNER JOIN (
            SELECT RestaurantBillId, BillNumber, start_date FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
            UNION
            SELECT RestaurantBillId, BillNumber, start_date FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        ) ri ON pd.RestaurantBillId = ri.RestaurantBillId
        INNER JOIN dbo.Paymode pm ON pd.Paymode = pm.Position
        WHERE CAST(ri.start_date AS DATE) BETWEEN @start AND @end
        GROUP BY pm.PayMode
        ORDER BY pm.PayMode
    `;

    const paymodeRequest = pool.request();
    paymodeRequest.input('start', sql.Date, fromDate);
    paymodeRequest.input('end', sql.Date, toDate);
    const paymodeResult = await paymodeRequest.query(paymodeQuery);

    let cashTotal = 0;
    let netsTotal = 0;
    let paynowTotal = 0;
    let cardTotal = 0;
    let upiTotal = 0;
    let receiptCount = 0;
    const paymodeDetail = {};

    paymodeResult.recordset.forEach(row => {
        const mode = (row.PayModeName || '').trim().toUpperCase();
        const amount = row.TotalAmount || 0;
        const count = row.TransactionCount || 0;

        paymodeDetail[mode] = {
            amount: amount,
            receiptCount: count
        };

        if (mode === 'CASH') {
            cashTotal = amount;
            receiptCount = count;
        } else if (mode === 'NETS') {
            netsTotal = amount;
        } else if (mode === 'PAYNOW') {
            paynowTotal = amount;
        } else if (['VISA', 'MASTERCARD', 'AMEX', 'DINERS', 'JCB', 'CARD'].includes(mode)) {
            cardTotal += amount;
        } else if (mode === 'UPI' || mode === 'UPI/GPAY') {
            upiTotal += amount;
        }
    });

    // Calculate totals from de-duplicated invoice union
    const salesSummaryQuery = `
        SELECT
            COUNT(DISTINCT ri.BillNumber) as TotalBills,
            ISNULL(SUM(ri.TotalAmount), 0) as TotalNetSales,
            ISNULL(SUM(ri.ServiceCharge), 0) as TotalServiceCharge,
            ISNULL(SUM(ri.TotalTax), 0) as TotalTax,
            ISNULL(SUM(ri.TotalDiscountAmount), 0) as TotalDiscount,
            ISNULL(SUM(ri.RoundedBy), 0) as TotalRoundOff,
            ISNULL(SUM(ri.TotalAmount + ri.ServiceCharge + ri.TotalTax + ri.RoundedBy), 0) as TotalRevenue
        FROM (
            SELECT RestaurantBillId, BillNumber, TotalAmount, ServiceCharge, TotalTax, TotalDiscountAmount, RoundedBy, start_date 
            FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
            UNION
            SELECT RestaurantBillId, BillNumber, TotalAmount, ServiceCharge, TotalTax, TotalDiscountAmount, RoundedBy, start_date 
            FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        ) ri
        WHERE CAST(ri.start_date AS DATE) BETWEEN @start AND @end
    `;

    const salesSummaryRequest = pool.request();
    salesSummaryRequest.input('start', sql.Date, fromDate);
    salesSummaryRequest.input('end', sql.Date, toDate);
    const salesSummaryResult = await salesSummaryRequest.query(salesSummaryQuery);
    const salesSummary = salesSummaryResult.recordset[0] || {};

    const totalSales = salesSummary.TotalNetSales || 0;
    const totalRoundOff = salesSummary.TotalRoundOff || 0;
    const totalTax = salesSummary.TotalTax || 0;
    const totalDiscount = salesSummary.TotalDiscount || 0;
    const totalServiceCharge = salesSummary.TotalServiceCharge || 0;
    const noOfBills = salesSummary.TotalBills || 0;
    const netTotal = totalSales + totalRoundOff;
    const avgPerBill = noOfBills > 0 ? (totalSales / noOfBills).toFixed(2) : 0;

    // Void details from SettlementHeader
    const totalVoidQty = headers.reduce((sum, s) => sum + (s.VoidQty || 0), 0);
    const totalVoidItemAmount = headers.reduce((sum, s) => sum + (s.VoidItemAmount || 0), 0);

    const terminalCode = headers[0]?.TerminalCode || "SR";
    const dayendRefNo = headers[0]?.DayendRefNo || "D000001";

    const reportData = {
        cashier: terminalCode,
        receiptCount: receiptCount,
        refNo: dayendRefNo,
        salesDetail: {
            totalSales: totalSales,
            totalTax: totalTax,
            totalDiscount: totalDiscount,
            totalServiceCharge: totalServiceCharge,
            roundOff: totalRoundOff,
            netTotal: netTotal
        },
        paymodeDetail: paymodeDetail,
        settlementDetail: {
            cashTotal: cashTotal,
            cardTotal: cardTotal,
            otherTotal: 0
        },
        analysis: {
            salesAmount: netTotal,
            noOfBills: noOfBills,
            avgPerBill: parseFloat(avgPerBill)
        },
        voidDetail: {
            voidItemQty: totalVoidQty,
            voidItemAmount: totalVoidItemAmount
        }
    };

    return { orgInfo, reportData };
}

// 1. JSON Endpoint
router.get('/', async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        console.log(`📅 Day End Report - From: ${fromDate}, To: ${toDate}`);
        const { orgInfo, reportData } = await getDayEndReportData(fromDate, toDate);
        res.json({
            success: true,
            orgInfo,
            reportData,
            fromDate,
            toDate
        });
    } catch (err) {
        console.error("Dayend Report Error:", err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// 2. Real PDF Download Endpoint
router.get('/download-pdf', async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        console.log(`📥 Downloading Day End PDF - From: ${fromDate}, To: ${toDate}`);

        const { orgInfo, reportData } = await getDayEndReportData(fromDate, toDate);

        const formatDate = (d) => {
            if (!d) return "";
            const p = d.split("-");
            return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : d;
        };

        const now = new Date();
        const printDate = now.toLocaleDateString('en-GB', { timeZone: 'Asia/Singapore' });
        const printTime = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Singapore', hour12: true });
        const dateRangeFormatted = fromDate === toDate ? formatDate(fromDate) : `${formatDate(fromDate)} to ${formatDate(toDate)}`;

        const paymodeRows = Object.entries(reportData.paymodeDetail || {}).map(([key, item]) => {
            const amt = typeof item === 'object' ? item.amount : item;
            return `
                <tr class="data-row">
                    <td>${key.toUpperCase()}</td>
                    <td>${Number(amt || 0).toFixed(2)}</td>
                </tr>
            `;
        }).join('');

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Day End Report - ${dateRangeFormatted}</title>
            <style>
                @page {
                    size: A4 portrait;
                    margin: 8mm 10mm;
                }
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                html, body {
                    background: #ffffff;
                    color: #333333;
                    font-size: 14px;
                    margin: 0;
                    padding: 0;
                }
                .report-page-wrapper {
                    box-sizing: border-box;
                    padding: 4px 6px 0 6px;
                }
                .report-main-content {
                    width: 100%;
                }
                .header-table {
                    width: 100%;
                    border-collapse: collapse;
                    border: none;
                    margin-bottom: 12px;
                    border-bottom: 2px solid #193B59;
                    padding-bottom: 8px;
                }
                .header-table td {
                    border: none;
                    vertical-align: middle;
                    padding: 4px;
                }
                .logo-cell {
                    width: 120px;
                    text-align: left;
                }
                .logo-cell img {
                    max-width: 120px;
                    max-height: 52px;
                    object-fit: contain;
                }
                .company-cell {
                    text-align: center;
                }
                .company-name {
                    font-size: 24px;
                    font-weight: bold;
                    color: #193B59;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .company-address {
                    font-size: 13.5px;
                    color: #555;
                    margin-top: 2px;
                }
                .pos-logo-cell {
                    width: 120px;
                    text-align: right;
                }
                .pos-logo-cell img {
                    max-height: 54px;
                    max-width: 75px;
                    object-fit: contain;
                }
                .report-title {
                    text-align: center;
                    font-size: 24px;
                    font-weight: bold;
                    margin: 6px 0 2px 0;
                    color: #193B59;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .report-info {
                    text-align: center;
                    margin-bottom: 12px;
                    font-size: 13px;
                    color: #555;
                }
                .pdf-kpi-container {
                    display: table;
                    width: 100%;
                    margin-bottom: 14px;
                    margin-top: 2px;
                    border-collapse: separate;
                    border-spacing: 10px 0;
                }
                .pdf-kpi-card {
                    display: table-cell;
                    background: #ffffff;
                    border: 1px solid #d3e2f2;
                    border-radius: 8px;
                    padding: 9px 4px;
                    text-align: center;
                    vertical-align: middle;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }
                .pdf-kpi-title {
                    font-size: 13px;
                    color: #193B59;
                    text-transform: uppercase;
                    font-weight: bold;
                    margin-bottom: 4px;
                    letter-spacing: 0.3px;
                }
                .pdf-kpi-value {
                    font-size: 19px;
                    font-weight: bold;
                    color: #193B59;
                }
                table.data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 6px 0 12px 0;
                    font-size: 15.5px;
                    border: 1.5px solid #193B59;
                    table-layout: fixed;
                }
                table.data-table th, table.data-table td {
                    padding: 8px 14px;
                    border: 1px solid #dce7f3;
                    text-align: center;
                    font-size: 15.5px;
                }
                table.data-table th {
                    width: 50%;
                    background-color: #193B59 !important;
                    color: #ffffff !important;
                    font-weight: bold;
                    text-transform: uppercase;
                    padding: 10px 14px;
                    font-size: 16.5px;
                    text-align: center;
                    border: 1.5px solid #193B59;
                }
                table.data-table tbody tr.data-row:nth-child(odd) {
                    background-color: #ffffff;
                }
                table.data-table tbody tr.data-row:nth-child(even) {
                    background-color: #f0f7ff;
                }
                .section-head td {
                    background-color: #dbeafe !important;
                    font-weight: bold;
                    color: #193B59;
                    font-size: 16px;
                    text-transform: uppercase;
                    padding: 8px 14px !important;
                    text-align: center !important;
                    border: 1px solid #c8d8ea;
                }
                .total-row td {
                    background-color: #dbeafe !important;
                    font-weight: bold;
                    color: #193B59;
                    font-size: 16px;
                    text-align: center !important;
                    border: 1px solid #c8d8ea;
                    padding: 9px 14px !important;
                }
            </style>
        </head>
        <body>
            <div class="report-page-wrapper">
                <div class="report-main-content">
                    <table class="header-table">
                        <tr>
                            <td class="logo-cell">
                                ${logoBase64 ? `<img src="${logoBase64}" alt="Logo">` : ''}
                            </td>
                            <td class="company-cell">
                                <div class="company-name">${orgInfo?.CompanyName || "SMART POS"}</div>
                                <div class="company-address">${orgInfo?.Address || ""}</div>
                                <div class="company-address">${orgInfo?.Phone ? `Phone: ${orgInfo.Phone}` : ""}</div>
                            </td>
                            <td class="pos-logo-cell">
                                ${posLogoBase64 ? `<img src="${posLogoBase64}" alt="POS Logo">` : ''}
                            </td>
                        </tr>
                    </table>

                    <div class="report-title">DAY END REPORT</div>
                    <div class="report-info">
                        Period: ${dateRangeFormatted} &nbsp;|&nbsp; Printed: ${printDate}, ${printTime}
                    </div>

                    <div class="pdf-kpi-container">
                        <div class="pdf-kpi-card">
                            <div class="pdf-kpi-title">TOTAL SALES</div>
                            <div class="pdf-kpi-value">${Number(reportData.salesDetail?.totalSales || 0).toFixed(2)}</div>
                        </div>
                        <div class="pdf-kpi-card">
                            <div class="pdf-kpi-title">DISCOUNT</div>
                            <div class="pdf-kpi-value">${Number(reportData.salesDetail?.totalDiscount || 0).toFixed(2)}</div>
                        </div>
                        <div class="pdf-kpi-card">
                            <div class="pdf-kpi-title">SERVICE CHARGE</div>
                            <div class="pdf-kpi-value">${Number(reportData.salesDetail?.totalServiceCharge || 0).toFixed(2)}</div>
                        </div>
                        <div class="pdf-kpi-card">
                            <div class="pdf-kpi-title">TAX</div>
                            <div class="pdf-kpi-value">${Number(reportData.salesDetail?.totalTax || 0).toFixed(2)}</div>
                        </div>
                        <div class="pdf-kpi-card">
                            <div class="pdf-kpi-title">ROUND OFF</div>
                            <div class="pdf-kpi-value">${Number(reportData.salesDetail?.roundOff || 0).toFixed(2)}</div>
                        </div>
                        <div class="pdf-kpi-card">
                            <div class="pdf-kpi-title">NET SALES</div>
                            <div class="pdf-kpi-value">${Number(reportData.salesDetail?.netTotal || 0).toFixed(2)}</div>
                        </div>
                    </div>

                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>PARTICULARS</th>
                                <th>AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="section-head">
                                <td>SALES DETAIL</td>
                                <td></td>
                            </tr>
                            <tr class="data-row">
                                <td>Total Sales</td>
                                <td>${Number(reportData.salesDetail?.totalSales || 0).toFixed(2)}</td>
                            </tr>
                            <tr class="data-row">
                                <td>Discount</td>
                                <td>${Number(reportData.salesDetail?.totalDiscount || 0).toFixed(2)}</td>
                            </tr>
                            <tr class="data-row">
                                <td>Service Charge</td>
                                <td>${Number(reportData.salesDetail?.totalServiceCharge || 0).toFixed(2)}</td>
                            </tr>
                            <tr class="data-row">
                                <td>Tax</td>
                                <td>${Number(reportData.salesDetail?.totalTax || 0).toFixed(2)}</td>
                            </tr>
                            <tr class="data-row">
                                <td>Round Off</td>
                                <td>${Number(reportData.salesDetail?.roundOff || 0).toFixed(2)}</td>
                            </tr>
                            <tr class="total-row">
                                <td>Total</td>
                                <td>${Number(reportData.salesDetail?.netTotal || 0).toFixed(2)}</td>
                            </tr>

                            <tr class="section-head">
                                <td>PAYMODE DETAIL</td>
                                <td></td>
                            </tr>
                            ${paymodeRows}

                            <tr class="section-head">
                                <td>SETTLEMENT DETAIL</td>
                                <td></td>
                            </tr>
                            <tr class="data-row">
                                <td>Cash</td>
                                <td>${Number(reportData.settlementDetail?.cashTotal || 0).toFixed(2)}</td>
                            </tr>
                            <tr class="data-row">
                                <td>Card</td>
                                <td>${Number(reportData.settlementDetail?.cardTotal || 0).toFixed(2)}</td>
                            </tr>
                            <tr class="data-row">
                                <td>Other</td>
                                <td>${Number(reportData.settlementDetail?.otherTotal || 0).toFixed(2)}</td>
                            </tr>

                            <tr class="section-head">
                                <td>ANALYSIS</td>
                                <td></td>
                            </tr>
                            <tr class="data-row">
                                <td>Sales Amount</td>
                                <td>${Number(reportData.analysis?.salesAmount || 0).toFixed(2)}</td>
                            </tr>
                            <tr class="data-row">
                                <td>No of Bills</td>
                                <td>${reportData.analysis?.noOfBills || 0}</td>
                            </tr>
                            <tr class="data-row">
                                <td>Average Per Bill</td>
                                <td>${Number(reportData.analysis?.avgPerBill || 0).toFixed(2)}</td>
                            </tr>

                            <tr class="section-head">
                                <td>VOID DETAIL</td>
                                <td></td>
                            </tr>
                            <tr class="data-row">
                                <td>Void Item Quantity</td>
                                <td>${reportData.voidDetail?.voidItemQty || 0}</td>
                            </tr>
                            <tr class="data-row">
                                <td>Void Item Amount</td>
                                <td>${Number(reportData.voidDetail?.voidItemAmount || 0).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </body>
        </html>
        `;

        const pdfOptions = {
            format: 'A4',
            orientation: 'portrait',
            zoomFactor: "1.0",
            border: { top: '8mm', right: '10mm', bottom: '0mm', left: '10mm' },
            footer: {
                height: '24mm',
                contents: {
                    default: `
                    <div style="font-family: 'Cambria', 'Times New Roman', serif; width: 100%; box-sizing: border-box; padding: 0 4px;">
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
                            <tr>
                                <td style="width: 50%; text-align: center; border: none; vertical-align: bottom;">
                                    <div style="border-top: 1.5px solid #193B59; width: 220px; margin: 0 auto; padding-top: 4px; font-size: 14px; font-weight: bold; color: #193B59;">Cashier Signature</div>
                                </td>
                                <td style="width: 50%; text-align: center; border: none; vertical-align: bottom;">
                                    <div style="border-top: 1.5px solid #193B59; width: 220px; margin: 0 auto; padding-top: 4px; font-size: 14px; font-weight: bold; color: #193B59;">Authorized Signature</div>
                                </td>
                            </tr>
                        </table>
                        <div style="border-top: 1px solid #193B59; padding-top: 4px; font-size: 11.5px; color: #555; text-align: center; margin-bottom: 2px;">
                            *** System Generated Report ***
                        </div>
                        <div style="font-size: 11px; color: #777; text-align: center;">
                            Powered by Unipro SG
                        </div>
                    </div>
                    `
                }
            }
        };

        pdf.create(htmlContent, pdfOptions).toStream((err, stream) => {
            if (err) {
                console.error("PDF generation error:", err);
                return res.status(500).send("Error generating PDF: " + err.message);
            }
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="DayEndReport_${fromDate}_to_${toDate}.pdf"`);
            stream.pipe(res);
        });

    } catch (err) {
        console.error("Day End PDF Download Error:", err);
        res.status(500).send("Server Error: " + err.message);
    }
});

// Get available dates
router.get('/dates', async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT DISTINCT
                CAST(start_date AS DATE) as OrderDate,
                COUNT(*) as OrderCount,
                SUM(ISNULL(SubTotal, 0)) as TotalAmount,
                SUM(ISNULL(InvoiceCount, 0)) as TotalBills
            FROM dbo.SettlementHeader
            WHERE start_date IS NOT NULL
            GROUP BY CAST(start_date AS DATE)
            ORDER BY CAST(start_date AS DATE) DESC
        `);

        res.json({
            success: true,
            dates: result.recordset
        });

    } catch (err) {
        console.error("Error fetching dates:", err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

module.exports = router;
