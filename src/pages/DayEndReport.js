import { BASE_URL } from "../config/config";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DayEndReport.css';
import { logoBase64, posLogoBase64 } from "../config/logo";

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : (process.env.REACT_APP_API_URL || BASE_URL);

const DayEndReport = ({ sidebarOpen }) => {
    const singaporeToday = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Singapore'
    });
    const [fromDate, setFromDate] = useState(singaporeToday);
    const [toDate, setToDate] = useState(singaporeToday);
    const [reportData, setReportData] = useState(null);
    const [orgInfo, setOrgInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [availableDates, setAvailableDates] = useState([]);

    useEffect(() => {
        const fetchAvailableDates = async () => {
            try {
                const response = await axios.get(API_BASE + '/api/dayendreport/dates');
                if (response.data.success) {
                    setAvailableDates(response.data.dates);
                    if (response.data.dates && response.data.dates.length > 0) {
                        const latestDate = response.data.dates[0].OrderDate?.split('T')[0] || singaporeToday;
                        setFromDate(latestDate);
                        setToDate(latestDate);
                    }
                }
            } catch (error) {
                console.log("Could not fetch available dates");
            }
        };
        fetchAvailableDates();
    }, []);

    const formatDate = (d) => {
        if (!d) return "";
        const p = d.split("-");
        return `${p[2]}-${p[1]}-${p[0]}`;
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const response = await axios.get(API_BASE + '/api/dayendreport', {
                params: { fromDate: fromDate, toDate: toDate }
            });

            console.log("API Response:", response.data);

            if (response.data.success) {
                const backendData = response.data;

                const formattedData = {
                    cashier: backendData.reportData?.cashier || "System",
                    receiptCount: backendData.reportData?.receiptCount || 0,
                    refNo: backendData.reportData?.refNo || "",
                    salesDetail: {
                        totalSales: backendData.reportData?.salesDetail?.totalSales || 0,
                        totalTax: backendData.reportData?.salesDetail?.totalTax || 0,
                        totalDiscount: backendData.reportData?.salesDetail?.totalDiscount || 0,
                        totalServiceCharge: backendData.reportData?.salesDetail?.totalServiceCharge || 0,
                        roundOff: backendData.reportData?.salesDetail?.roundOff || 0,
                        netTotal: backendData.reportData?.salesDetail?.netTotal || 0
                    },
                    paymodeDetail: backendData.reportData?.paymodeDetail || {},
                    settlementDetail: backendData.reportData?.settlementDetail || {},
                    analysis: backendData.reportData?.analysis || {},
                    voidDetail: backendData.reportData?.voidDetail || {}
                };

                setReportData(formattedData);
                setOrgInfo(backendData.orgInfo);
                setShowResults(true);
            } else {
                alert("No data found");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to fetch report data");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!reportData) {
            alert("Please generate a report first");
            return;
        }

        const now = new Date();

        const printDate = now.toLocaleDateString('en-GB', {
            timeZone: 'Asia/Singapore'
        });

        const printTime = now.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Singapore',
            hour12: true
        });
        const dateRangeText = fromDate === toDate ? fromDate : `${fromDate}_to_${toDate}`;
        const dateRangeFormatted = fromDate === toDate ? formatDate(fromDate) : `${formatDate(fromDate)} to ${formatDate(toDate)}`;

        let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Day End Report - ${dateRangeFormatted}</title>
            <style>
                @page {
                    size: A4 portrait;
                    margin: 6mm 8mm;
                }
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                html, body {
                    background: #ffffff;
                    margin: 0;
                    padding: 0;
                    font-family: 'Cambria', 'Times New Roman', serif;
                    color: #333333;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .a4-page {
                    width: 100%;
                    max-width: 210mm;
                    margin: 0 auto;
                    padding: 4mm 6mm;
                    box-sizing: border-box;
                    background: white;
                    display: flex;
                    flex-direction: column;
                    min-height: 277mm;
                }
                .header-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1.5px solid #193B59;
                    padding-bottom: 8px;
                    margin-bottom: 10px;
                }
                .logo { 
                    max-width: 120px; 
                    max-height: 52px; 
                    object-fit: contain;
                }
                .header-center {
                    text-align: center;
                    flex: 1;
                }
                .company-name { 
                    font-size: 22px; 
                    font-weight: bold; 
                    color: #193B59; 
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .company-address { 
                    font-size: 13px; 
                    color: #555; 
                    margin-top: 2px; 
                }
                .pos-badge {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                }
                .pos-badge img {
                    max-height: 54px;
                    max-width: 75px;
                    object-fit: contain;
                    display: block;
                }
                .report-title { 
                    text-align: center; 
                    font-size: 22px; 
                    font-weight: bold; 
                    margin: 10px 0 4px 0; 
                    color: #193B59; 
                    text-transform: uppercase; 
                    letter-spacing: 1px;
                }
                .report-info {
                    text-align: center;
                    margin-bottom: 14px;
                    font-size: 13.5px;
                    color: #555;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 10px 0 20px 0; 
                    font-size: 15px; 
                    border: 1px solid #d3d3d3;
                }
                th, td { 
                    padding: 8px 14px; 
                    border: 1px solid #d3d3d3; 
                    text-align: left; 
                    font-size: 15px; 
                }
                th { 
                    background: #193B59; 
                    color: #ffffff; 
                    font-weight: bold; 
                    text-transform: uppercase;
                    text-align: left;
                    border: 1px solid #193B59;
                    padding: 10px 14px;
                    font-size: 16px;
                }
                .section-head td {
                    background-color: #eaeff2 !important;
                    font-weight: bold;
                    color: #193B59;
                    font-size: 15.5px;
                    text-transform: uppercase;
                    padding: 8px 14px;
                    text-align: left !important;
                }
                .total-row td {
                    background-color: #eef2f8 !important;
                    font-weight: bold;
                    color: #193B59;
                    border-top: 1.5px solid #193B59;
                    font-size: 15px;
                    padding: 8px 14px;
                }
                .signature-container {
                    margin-top: auto;
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    color: #333;
                    page-break-inside: avoid;
                    padding-top: 24px;
                }
                .sig-box {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .sig-line {
                    border-top: 1px solid #333;
                    width: 160px;
                    padding-top: 6px;
                    text-align: center;
                    font-size: 12px;
                    font-weight: bold;
                    color: #333;
                }
                .footer-bar { 
                    margin-top: 20px;
                    text-align: center;
                    padding-top: 10px; 
                    border-top: 1px solid #e1e6eb;
                    page-break-inside: avoid;
                }
                .system-footer {
                    font-size: 11px;
                    color: #888888;
                    margin-bottom: 3px;
                }
                .powered-footer {
                    font-size: 10.5px;
                    color: #aaaaaa;
                    font-weight: 600;
                }
                .amount-col {
                    text-align: right;
                }
                th.amount-col {
                    text-align: center;
                }
                tr {
                    page-break-inside: avoid;
                }
            </style>
        </head>
        <body>
            <div class="a4-page">
                <div class="header-container">
                    <div style="flex: 1;">
                        <img src="${logoBase64}" alt="Unipro Logo" class="logo" />
                    </div>
                    <div class="header-center">
                        <div class="company-name">${orgInfo?.CompanyName || "SMART POS"}</div>
                        <div class="company-address">${orgInfo?.Address || ""}</div>
                        <div class="company-address">${orgInfo?.Phone ? `Phone: ${orgInfo.Phone}` : ""}</div>
                    </div>
                    <div style="flex: 1; display: flex; justify-content: flex-end;">
                        <div class="pos-badge">
                            <img src="${posLogoBase64}" alt="POS Logo" />
                        </div>
                    </div>
                </div>
                
                <div class="report-title">DAY END REPORT</div>
                
                <div class="report-info">
                    Period: ${dateRangeFormatted} &nbsp;|&nbsp; Printed: ${printDate}, ${printTime}
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>PARTICULARS</th>
                            <th class="amount-col">AMOUNT ($)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Sales Detail Section -->
                        <tr class="section-head">
                            <td colspan="2">SALES DETAIL</td>
                        </tr>
                        <tr>
                            <td>Total Sales</td>
                            <td class="amount-col">${(reportData.salesDetail?.totalSales || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Discount</td>
                            <td class="amount-col">${(reportData.salesDetail?.totalDiscount || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Service Charge</td>
                            <td class="amount-col">${(reportData.salesDetail?.totalServiceCharge || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Tax</td>
                            <td class="amount-col">${(reportData.salesDetail?.totalTax || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Round Off</td>
                            <td class="amount-col">${(reportData.salesDetail?.roundOff || 0).toFixed(2)}</td>
                        </tr>
                        <tr class="total-row">
                            <td><strong>Total</strong></td>
                            <td class="amount-col">${(reportData.salesDetail?.netTotal || 0).toFixed(2)}</td>
                        </tr>
                        
                        <!-- Paymode Detail Section -->
                        <tr class="section-head">
                            <td colspan="2">PAYMODE DETAIL</td>
                        </tr>
                        ${Object.entries(reportData.paymodeDetail || {}).map(([key, item]) => {
                            const amt = typeof item === 'object' ? item.amount : item;
                            const count = typeof item === 'object' ? item.receiptCount : 0;
                            return `
                            <tr>
                                <td>
                                    <table style="width: 100%; border: none !important; margin: 0 !important; padding: 0 !important; background: transparent !important;">
                                        <tr>
                                            <td style="border: none !important; padding: 0 !important; text-align: left !important; background: transparent !important; color: inherit !important;">${key}</td>
                                            <td style="border: none !important; padding: 0 !important; text-align: right !important; background: transparent !important; color: #555 !important; font-weight: 600;">${count}</td>
                                        </tr>
                                    </table>
                                </td>
                                <td class="amount-col">${(amt || 0).toFixed(2)}</td>
                            </tr>
                            `;
                        }).join('')}
                        <tr class="total-row">
                            <td><strong>Total</strong></td>
                            <td class="amount-col">${Object.values(reportData.paymodeDetail || {}).reduce((sum, item) => sum + (typeof item === 'object' ? item.amount : item), 0).toFixed(2)}</td>
                        </tr>
                        
                        <!-- Settlement Detail Section -->
                        <tr class="section-head">
                            <td colspan="2">SETTLEMENT DETAIL</td>
                        </tr>
                        <tr>
                            <td>Cash Total</td>
                            <td class="amount-col">${(reportData.settlementDetail?.cashTotal || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Other Total</td>
                            <td class="amount-col">${(reportData.settlementDetail?.otherTotal || 0).toFixed(2)}</td>
                        </tr>
                        
                        <!-- Analysis Section -->
                        <tr class="section-head">
                            <td colspan="2">ANALYSIS</td>
                        </tr>
                        <tr>
                            <td>Sales Amount</td>
                            <td class="amount-col">${(reportData.analysis?.salesAmount || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>No of Bills</td>
                            <td class="amount-col">${reportData.analysis?.noOfBills || 0}</td>
                        </tr>
                        <tr>
                            <td>Avg/Bill</td>
                            <td class="amount-col">${(reportData.analysis?.avgPerBill || 0).toFixed(2)}</td>
                        </tr>
                        
                        <!-- Void Detail Section -->
                        <tr class="section-head">
                            <td colspan="2">VOID DETAIL</td>
                        </tr>
                        <tr>
                            <td>Void Item Qty</td>
                            <td class="amount-col">${reportData.voidDetail?.voidItemQty || 0}</td>
                        </tr>
                        <tr>
                            <td>Void Item Amount</td>
                            <td class="amount-col">${(reportData.voidDetail?.voidItemAmount || 0).toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="signature-container">
                    <div class="sig-box">
                        <div class="sig-line">Cashier Signature</div>
                    </div>
                    <div class="sig-box">
                        <div class="sig-line">Authorized Signature</div>
                    </div>
                </div>

                <div class="footer-bar">
                    <div class="system-footer">*** System Generated Report ***</div>
                    <div class="powered-footer">Powered by Unipro SG</div>
                </div>
            </div>
            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
        `;

        const blob = new Blob([htmlContent], { type: "text/html" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `DayEndReport_${dateRangeText}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className={`dayend-report ${sidebarOpen ? "sidebar-open" : ""}`}>
            <div className="dayend-content-wrapper">
                {/* Header Banner */}
                <div className="dayend-header-card">
                    <div className="dayend-header-left">
                        <div className="dayend-icon-box">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="3" y1="9" x2="21" y2="9"></line>
                                <line x1="9" y1="21" x2="9" y2="9"></line>
                                <path d="M13 13h4"></path>
                                <path d="M13 17h4"></path>
                            </svg>
                        </div>
                        <div className="dayend-header-text">
                            <h2>Day End Report</h2>
                            <p>Select a date and click Generate to see results</p>
                        </div>
                    </div>
                </div>

                {/* Control Bar (Date & Buttons) */}
                <div className="dayend-control-card">
                    <input
                        type="date"
                        className="dayend-date-picker"
                        value={fromDate}
                        onChange={(e) => {
                            setFromDate(e.target.value);
                            setToDate(e.target.value);
                        }}
                    />
                    <button
                        className="dayend-btn-generate"
                        onClick={handleGenerate}
                        disabled={loading}
                    >
                        <span className="dayend-btn-icon">⚙</span> Generate
                    </button>

                    {reportData && (
                        <button
                            className="dayend-btn-report"
                            onClick={handleDownload}
                        >
                            <span className="dayend-btn-icon">↓</span> Report
                        </button>
                    )}
                </div>

                {/* Screen Table Card */}
                {loading ? (
                    <div className="dayend-empty-card">Loading report data...</div>
                ) : showResults && reportData ? (
                    <div className="dayend-table-card">
                        <table className="dayend-table">
                            <thead>
                                <tr>
                                    <th className="dayend-th-particular">PARTICULARS</th>
                                    <th className="dayend-th-amount">AMOUNT ($)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* SALES DETAIL SECTION */}
                                <tr className="dayend-section-head">
                                    <td colSpan="2">SALES DETAIL</td>
                                </tr>
                                <tr>
                                    <td className="dayend-td-particular">Total Sales</td>
                                    <td className="dayend-td-amount">{(reportData.salesDetail?.totalSales || 0).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td className="dayend-td-particular">Discount</td>
                                    <td className="dayend-td-amount">{(reportData.salesDetail?.totalDiscount || 0).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td className="dayend-td-particular">Service Charge</td>
                                    <td className="dayend-td-amount">{(reportData.salesDetail?.totalServiceCharge || 0).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td className="dayend-td-particular">Tax</td>
                                    <td className="dayend-td-amount">{(reportData.salesDetail?.totalTax || 0).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td className="dayend-td-particular">Round Off</td>
                                    <td className="dayend-td-amount">{(reportData.salesDetail?.roundOff || 0).toFixed(2)}</td>
                                </tr>
                                <tr className="dayend-total-row">
                                    <td className="dayend-td-particular dayend-bold-text">Total</td>
                                    <td className="dayend-td-amount dayend-bold-text">{(reportData.salesDetail?.netTotal || 0).toFixed(2)}</td>
                                </tr>

                                {/* PAYMODE DETAIL SECTION */}
                                <tr className="dayend-section-head">
                                    <td colSpan="2">PAYMODE DETAIL</td>
                                </tr>
                                {Object.entries(reportData.paymodeDetail || {}).map(([key, item]) => {
                                    const amt = typeof item === 'object' ? item.amount : item;
                                    const count = typeof item === 'object' ? (item.receiptCount || 0) : 0;
                                    return (
                                        <tr key={key}>
                                            <td className="dayend-td-particular">{key.toUpperCase()}</td>
                                            <td className="dayend-td-paymode-combined">
                                                <div className="dayend-paymode-col-count">{count}</div>
                                                <div className="dayend-paymode-col-amount">{(amt || 0).toFixed(2)}</div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                <tr className="dayend-total-row">
                                    <td className="dayend-td-particular dayend-bold-text">Total</td>
                                    <td className="dayend-td-paymode-combined">
                                        <div className="dayend-paymode-col-count dayend-bold-text">
                                            {Object.values(reportData.paymodeDetail || {}).reduce((sum, item) => sum + (typeof item === 'object' ? (item.receiptCount || 0) : 0), 0)}
                                        </div>
                                        <div className="dayend-paymode-col-amount dayend-bold-text">
                                            {Object.values(reportData.paymodeDetail || {}).reduce((sum, item) => sum + (typeof item === 'object' ? item.amount : item), 0).toFixed(2)}
                                        </div>
                                    </td>
                                </tr>

                                {/* SETTLEMENT DETAIL SECTION */}
                                <tr className="dayend-section-head">
                                    <td colSpan="2">SETTLEMENT DETAIL</td>
                                </tr>
                                <tr>
                                    <td className="dayend-td-particular">Cash Total</td>
                                    <td className="dayend-td-amount">{(reportData.settlementDetail?.cashTotal || 0).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td className="dayend-td-particular">Other Total</td>
                                    <td className="dayend-td-amount">{(reportData.settlementDetail?.otherTotal || 0).toFixed(2)}</td>
                                </tr>
                                <tr className="dayend-total-row">
                                    <td className="dayend-td-particular dayend-bold-text">Total</td>
                                    <td className="dayend-td-amount dayend-bold-text">
                                        {((reportData.settlementDetail?.cashTotal || 0) + (reportData.settlementDetail?.otherTotal || 0)).toFixed(2)}
                                    </td>
                                </tr>

                                {/* ANALYSIS SECTION */}
                                <tr className="dayend-section-head">
                                    <td colSpan="2">ANALYSIS</td>
                                </tr>
                                <tr>
                                    <td className="dayend-td-particular">Sales Amount</td>
                                    <td className="dayend-td-amount">{(reportData.analysis?.salesAmount || 0).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td className="dayend-td-particular">No of Bills</td>
                                    <td className="dayend-td-amount">{reportData.analysis?.noOfBills || 0}</td>
                                </tr>
                                <tr>
                                    <td className="dayend-td-particular">Avg/Bill</td>
                                    <td className="dayend-td-amount">{(reportData.analysis?.avgPerBill || 0).toFixed(2)}</td>
                                </tr>

                                {/* VOID DETAIL SECTION */}
                                <tr className="dayend-section-head">
                                    <td colSpan="2">VOID DETAIL</td>
                                </tr>
                                <tr>
                                    <td className="dayend-td-particular">Void Item Qty</td>
                                    <td className="dayend-td-amount">{reportData.voidDetail?.voidItemQty || 0}</td>
                                </tr>
                                <tr>
                                    <td className="dayend-td-particular">Void Item Amount</td>
                                    <td className="dayend-td-amount">{(reportData.voidDetail?.voidItemAmount || 0).toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="dayend-empty-card">Select date and click Generate to see results</div>
                )}
            </div>
        </div>
    );
};

export default DayEndReport;