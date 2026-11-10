import { BASE_URL } from "../config/config";
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from "xlsx";
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
    const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
    const downloadDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target)) {
                setDownloadDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

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

    const handlePrint = async () => {
        if (!reportData) {
            alert("Please generate a report first");
            return;
        }
        try {
            const pdfUrl = `${API_BASE}/api/dayendreport/download-pdf?fromDate=${fromDate}&toDate=${toDate}`;
            const response = await fetch(pdfUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch report PDF (status ${response.status})`);
            }
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            let printFrame = document.getElementById("dayend-pdf-print-frame");
            if (!printFrame) {
                printFrame = document.createElement("iframe");
                printFrame.id = "dayend-pdf-print-frame";
                printFrame.style.position = "fixed";
                printFrame.style.right = "0";
                printFrame.style.bottom = "0";
                printFrame.style.width = "0";
                printFrame.style.height = "0";
                printFrame.style.border = "0";
                document.body.appendChild(printFrame);
            }

            printFrame.onload = () => {
                try {
                    setTimeout(() => {
                        if (printFrame.contentWindow) {
                            printFrame.contentWindow.focus();
                            printFrame.contentWindow.print();
                        }
                    }, 300);
                } catch (e) {
                    console.error("Iframe print error, falling back to window:", e);
                    const win = window.open(blobUrl, "_blank");
                    if (win) {
                        win.onload = () => win.print();
                    }
                }
            };

            printFrame.src = blobUrl;
        } catch (err) {
            console.error("Print error:", err);
            const directUrl = `${API_BASE}/api/dayendreport/download-pdf?fromDate=${fromDate}&toDate=${toDate}`;
            window.open(directUrl, "_blank");
        }
    };

    const handleDownload = () => {
        if (!reportData) {
            alert("Please generate a report first");
            return;
        }
        const pdfUrl = `${API_BASE}/api/dayendreport/download-pdf?fromDate=${fromDate}&toDate=${toDate}`;
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.setAttribute('download', `DayEndReport_${fromDate}_to_${toDate}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExcel = () => {
        if (!reportData) {
            alert("Please generate a report first");
            return;
        }
        const exportRows = [];
        exportRows.push(["DAY END REPORT"]);
        exportRows.push([`Period: ${fromDate} to ${toDate}`]);
        exportRows.push([]);

        // Table Header
        exportRows.push(["PARTICULARS", "AMOUNT"]);

        // SALES DETAIL
        exportRows.push(["SALES DETAIL", ""]);
        exportRows.push(["Total Sales", Number(reportData.salesDetail?.totalSales || 0).toFixed(2)]);
        exportRows.push(["Discount", Number(reportData.salesDetail?.totalDiscount || 0).toFixed(2)]);
        exportRows.push(["Service Charge", Number(reportData.salesDetail?.totalServiceCharge || 0).toFixed(2)]);
        exportRows.push(["Tax", Number(reportData.salesDetail?.totalTax || 0).toFixed(2)]);
        exportRows.push(["Round Off", Number(reportData.salesDetail?.roundOff || 0).toFixed(2)]);
        exportRows.push(["Total", Number(reportData.salesDetail?.netTotal || 0).toFixed(2)]);

        // PAYMODE DETAIL
        exportRows.push(["PAYMODE DETAIL", ""]);
        Object.entries(reportData.paymodeDetail || {}).forEach(([key, item]) => {
            const amt = typeof item === 'object' ? item.amount : item;
            exportRows.push([key.toUpperCase(), Number(amt || 0).toFixed(2)]);
        });

        // SETTLEMENT DETAIL
        exportRows.push(["SETTLEMENT DETAIL", ""]);
        exportRows.push(["Cash", Number(reportData.settlementDetail?.cashTotal || 0).toFixed(2)]);
        exportRows.push(["Card", Number(reportData.settlementDetail?.cardTotal || 0).toFixed(2)]);
        exportRows.push(["Other", Number(reportData.settlementDetail?.otherTotal || 0).toFixed(2)]);

        // ANALYSIS
        exportRows.push(["ANALYSIS", ""]);
        exportRows.push(["Sales Amount", Number(reportData.analysis?.salesAmount || 0).toFixed(2)]);
        exportRows.push(["No of Bills", reportData.analysis?.noOfBills || 0]);
        exportRows.push(["Average Per Bill", Number(reportData.analysis?.avgPerBill || 0).toFixed(2)]);

        // VOID DETAIL
        exportRows.push(["VOID DETAIL", ""]);
        exportRows.push(["Void Item Quantity", reportData.voidDetail?.voidItemQty || 0]);
        exportRows.push(["Void Item Amount", Number(reportData.voidDetail?.voidItemAmount || 0).toFixed(2)]);

        const worksheet = XLSX.utils.aoa_to_sheet(exportRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DayEndReport");
        XLSX.writeFile(workbook, `DayEndReport_${fromDate}_to_${toDate}.xlsx`);
    };

    return (
        <div className={`dayend-report ${sidebarOpen ? "sidebar-open" : ""}`}>
            <div className="dayend-content-wrapper">
                {/* Clean Page Title (Matching Sales Report) */}
                <div className="dayend-page-header">
                    <h2 className="dayend-page-title">Day End Report</h2>
                </div>

                {/* Control Bar (Date Picker, Generate, Report & Download Options) */}
                <div className="dayend-control-card">
                    <div className="dayend-control-left">
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
                        <button
                            className="dayend-btn-report"
                            onClick={handleGenerate}
                            disabled={loading}
                            type="button"
                        >
                            <span className="dayend-btn-icon">↓</span> Report
                        </button>
                    </div>

                    {reportData && (
                        <div className="download-dropdown-wrapper" ref={downloadDropdownRef}>
                            <button
                                className="dayend-download-btn-inside"
                                onClick={() => setDownloadDropdownOpen(!downloadDropdownOpen)}
                                title="Download Options"
                                type="button"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                            </button>
                            {downloadDropdownOpen && (
                                <div className="download-dropdown-menu">
                                    <button
                                        type="button"
                                        className="download-dropdown-item"
                                        onClick={() => {
                                            setDownloadDropdownOpen(false);
                                            handlePrint();
                                        }}
                                    >
                                        <span className="download-dropdown-icon print">
                                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                                <rect x="6" y="14" width="12" height="8"></rect>
                                            </svg>
                                        </span>
                                        Print
                                    </button>
                                    <button
                                        type="button"
                                        className="download-dropdown-item"
                                        onClick={() => {
                                            setDownloadDropdownOpen(false);
                                            handleDownload();
                                        }}
                                    >
                                        <span className="download-dropdown-icon pdf">
                                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                                <polyline points="10 9 9 9 8 9"></polyline>
                                            </svg>
                                        </span>
                                        PDF
                                    </button>
                                    <button
                                        type="button"
                                        className="download-dropdown-item"
                                        onClick={() => {
                                            setDownloadDropdownOpen(false);
                                            handleExcel();
                                        }}
                                    >
                                        <span className="download-dropdown-icon excel">
                                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                <line x1="9" y1="3" x2="9" y2="21"></line>
                                                <line x1="15" y1="3" x2="15" y2="21"></line>
                                                <line x1="3" y1="9" x2="21" y2="9"></line>
                                                <line x1="3" y1="15" x2="21" y2="15"></line>
                                            </svg>
                                        </span>
                                        Excel
                                    </button>
                                </div>
                            )}
                        </div>
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
                                    <th className="dayend-th-amount">AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* SALES DETAIL SECTION */}
                                <tr className="dayend-section-head">
                                    <td className="dayend-td-particular dayend-section-title"><strong>SALES DETAIL</strong></td>
                                    <td className="dayend-td-amount"></td>
                                </tr>
                                <tr className="dayend-data-row">
                                    <td className="dayend-td-particular">Total Sales</td>
                                    <td className="dayend-td-amount">{(reportData.salesDetail?.totalSales || 0).toFixed(2)}</td>
                                </tr>
                                <tr className="dayend-data-row">
                                    <td className="dayend-td-particular">Discount</td>
                                    <td className="dayend-td-amount">{(reportData.salesDetail?.totalDiscount || 0).toFixed(2)}</td>
                                </tr>
                                <tr className="dayend-data-row">
                                    <td className="dayend-td-particular">Service Charge</td>
                                    <td className="dayend-td-amount">{(reportData.salesDetail?.totalServiceCharge || 0).toFixed(2)}</td>
                                </tr>
                                <tr className="dayend-data-row">
                                    <td className="dayend-td-particular">Tax</td>
                                    <td className="dayend-td-amount">{(reportData.salesDetail?.totalTax || 0).toFixed(2)}</td>
                                </tr>
                                <tr className="dayend-data-row">
                                    <td className="dayend-td-particular">Round Off</td>
                                    <td className="dayend-td-amount">{(reportData.salesDetail?.roundOff || 0).toFixed(2)}</td>
                                </tr>
                                <tr className="dayend-total-row">
                                    <td className="dayend-td-particular dayend-bold-text">Total</td>
                                    <td className="dayend-td-amount dayend-bold-text">{(reportData.salesDetail?.netTotal || 0).toFixed(2)}</td>
                                </tr>

                                {/* PAYMODE DETAIL SECTION */}
                                <tr className="dayend-section-head">
                                    <td className="dayend-td-particular dayend-section-title"><strong>PAYMODE DETAIL</strong></td>
                                    <td className="dayend-td-amount"></td>
                                </tr>
                                {Object.entries(reportData.paymodeDetail || {}).map(([key, item]) => {
                                    const amt = typeof item === 'object' ? item.amount : item;
                                    return (
                                        <tr key={key} className="dayend-data-row">
                                            <td className="dayend-td-particular">{key.toUpperCase()}</td>
                                            <td className="dayend-td-amount">{(amt || 0).toFixed(2)}</td>
                                        </tr>
                                    );
                                })}

                                {/* SETTLEMENT DETAIL SECTION */}
                                <tr className="dayend-section-head">
                                    <td className="dayend-td-particular dayend-section-title"><strong>SETTLEMENT DETAIL</strong></td>
                                    <td className="dayend-td-amount"></td>
                                </tr>
                                <tr className="dayend-data-row">
                                    <td className="dayend-td-particular">Cash</td>
                                    <td className="dayend-td-amount">{(reportData.settlementDetail?.cashTotal || 0).toFixed(2)}</td>
                                </tr>
                                <tr className="dayend-data-row">
                                    <td className="dayend-td-particular">Card</td>
                                    <td className="dayend-td-amount">{(reportData.settlementDetail?.cardTotal || 0).toFixed(2)}</td>
                                </tr>
                                <tr className="dayend-data-row">
                                    <td className="dayend-td-particular">Other</td>
                                    <td className="dayend-td-amount">{(reportData.settlementDetail?.otherTotal || 0).toFixed(2)}</td>
                                </tr>

                                {/* ANALYSIS SECTION */}
                                <tr className="dayend-section-head">
                                    <td className="dayend-td-particular dayend-section-title"><strong>ANALYSIS</strong></td>
                                    <td className="dayend-td-amount"></td>
                                </tr>
                                <tr className="dayend-data-row">
                                    <td className="dayend-td-particular">Sales Amount</td>
                                    <td className="dayend-td-amount">{(reportData.analysis?.salesAmount || 0).toFixed(2)}</td>
                                </tr>
                                <tr className="dayend-data-row">
                                    <td className="dayend-td-particular">No of Bills</td>
                                    <td className="dayend-td-amount">{reportData.analysis?.noOfBills || 0}</td>
                                </tr>
                                <tr className="dayend-data-row">
                                    <td className="dayend-td-particular">Average Per Bill</td>
                                    <td className="dayend-td-amount">{(reportData.analysis?.avgPerBill || 0).toFixed(2)}</td>
                                </tr>

                                {/* VOID DETAIL SECTION */}
                                <tr className="dayend-section-head">
                                    <td className="dayend-td-particular dayend-section-title"><strong>VOID DETAIL</strong></td>
                                    <td className="dayend-td-amount"></td>
                                </tr>
                                <tr className="dayend-data-row">
                                    <td className="dayend-td-particular">Void Item Quantity</td>
                                    <td className="dayend-td-amount">{reportData.voidDetail?.voidItemQty || 0}</td>
                                </tr>
                                <tr className="dayend-data-row">
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