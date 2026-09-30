const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

router.get('/', async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        console.log(`📅 Day End Report - From: ${fromDate}, To: ${toDate}`);

        const pool = await poolPromise;

        // Organization Info
        const orgQuery = `
    SELECT TOP 1
        CompanyName,
        Address,
        Phone,
        Email
    FROM companysettings
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
            FROM SettlementHeader
        `;

        if (fromDate && toDate) {
            headerQuery += `
WHERE CAST(start_date AS DATE) BETWEEN @start AND @end
`;
        }

        const headerRequest = pool.request();
        if (fromDate && toDate) {
            headerRequest.input('start', sql.Date, fromDate);
            headerRequest.input('end', sql.Date, toDate);
        }

        const headerResult = await headerRequest.query(headerQuery);
        const headers = headerResult.recordset;

        console.log(`📊 Found ${headers.length} settlement records`);

        if (headers.length === 0) {
            return res.json({
                success: true,
                orgInfo: orgInfo,
                reportData: {
                    cashier: "System",
                    receiptCount: 0,
                    refNo: "",
                    salesDetail: { totalSales: 0, roundOff: 0, netTotal: 0 },
                    paymodeDetail: {},
                    settlementDetail: { cashTotal: 0, otherTotal: 0 },
                    analysis: { salesAmount: 0, noOfBills: 0, avgPerBill: 0 },
                    voidDetail: { voidItemQty: 0, voidItemAmount: 0 }
                }
            });
        }

        const settlementIds = headers.map(h => h.SettlementID).filter(Boolean);

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
            } else if (['VISA', 'MASTERCARD', 'AMEX', 'DINERS', 'JCB'].includes(mode)) {
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

        // Void details from SettlementHeader (if available)
        const totalVoidQty = headers.reduce((sum, s) => sum + (s.VoidQty || 0), 0);
        const totalVoidItemAmount = headers.reduce((sum, s) => sum + (s.VoidItemAmount || 0), 0);

        const terminalCode = headers[0]?.TerminalCode || "";
        const dayendRefNo = headers[0]?.DayendRefNo || "";

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

        console.log(`FINAL - Cash: ${cashTotal}, ReceiptCount: ${receiptCount}, Bills: ${noOfBills}, RefNo: ${dayendRefNo}`);

        res.json({
            success: true,
            orgInfo: orgInfo,
            reportData: reportData,
            fromDate: fromDate,
            toDate: toDate
        });

    } catch (err) {
        console.error("Dayend Report Error:", err);
        res.status(500).json({
            success: false,
            error: err.message
        });
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
            FROM SettlementHeader
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

