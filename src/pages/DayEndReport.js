import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DayEndReport.css';
import { BASE_URL } from "../config/api";

const DayEndReport = ({ sidebarOpen }) => {
    const [selectedDate, setSelectedDate] = useState("2025-11-21");
    const [reportData, setReportData] = useState(null);
    const [orgInfo, setOrgInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [availableDates, setAvailableDates] = useState([]);

    useEffect(() => {
        const fetchAvailableDates = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/api/dayendreport/dates`);
                if (response.data.success) {
                    setAvailableDates(response.data.dates);
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
            const response = await axios.get(`${BASE_URL}/api/dayendreport`, {
                params: { fromDate: selectedDate, toDate: selectedDate }
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
        const printDate = now.toLocaleDateString('en-GB');
        const printTime = now.toLocaleTimeString('en-GB');
        const selectedDateFormatted = formatDate(selectedDate);

        let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Day End Report - ${selectedDate}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                body { 
                    font-family: 'Cambria', 'Times New Roman', serif; 
                    background: #e0e4e8; 
                    margin: 0; 
                    padding: 20px; 
                    display: flex; 
                    justify-content: center; 
                }
                .a4-page {
                    background: white;
                    width: 210mm;
                    min-height: 297mm;
                    padding: 15mm 20mm;
                    box-sizing: border-box;
                    box-shadow: 0 0 10px rgba(0,0,0,0.3);
                    color: #000;
                    border: 1px solid #ccc;
                    position: relative;
                }
                @media print {
                    body { background: white; padding: 0; display: block; }
                    .a4-page { box-shadow: none; width: 100%; min-height: auto; padding: 0; border: none; }
                }
                .header-container { 
                    text-align: center; 
                    border-bottom: 2px solid #2c3e50; 
                    padding-bottom: 15px; 
                    margin-bottom: 20px;
                    position: relative;
                }
                .logo {
                    position: absolute;
                    left: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    max-width: 100px;
                    max-height: 50px;
                }
                .company-name { 
                    font-size: 16px; 
                    font-weight: bold; 
                    color: #2c3e50; 
                    margin-bottom: 5px;
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                .company-address { 
                    font-size: 10px; 
                    color: #555; 
                    margin-top: 4px; 
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                .report-title { 
                    text-align: center; 
                    font-size: 12px; 
                    font-weight: bold; 
                    margin: 15px 0; 
                    color: #34495e; 
                    text-transform: uppercase; 
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                .report-info {
                    text-align: center;
                    margin-bottom: 20px;
                    font-size: 11px;
                    border: 1px solid #ccc;
                    padding: 8px;
                    background: #f9f9f9;
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                table { 
                    width: 80%;
                    margin: 10px auto;
                    border-collapse: collapse; 
                    font-size: 11px; 
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                th, td { 
                    padding: 6px 8px; 
                    border: 1px solid #cbd5e1; 
                    text-align: left; 
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                th { 
                    background: #334155; 
                    color: white; 
                    font-weight: bold; 
                    text-align: center; 
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                td { 
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                .footer { 
                    position: absolute;
                    bottom: 20px;
                    left: 20px;
                    font-size: 9px; 
                    color: #7f8c8d; 
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                .signature {
                    margin-top: 40px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    padding-top: 20px;
                    border-top: 1px solid #ccc;
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
                .download-particulars-cell {
                    display: flex;
                    justify-content: space-between;
                    width: 100%;
                    font-family: 'Cambria', 'Times New Roman', serif;
                }
            </style>
        </head>
        <body>
            <div class="a4-page">
                <div class="header-container">
                    <img src="https://uniprosg.com/wp-content/uploads/2024/09/unipro-logo-green-1.png" alt="Logo" class="logo" />
                    <div class="company-name">${orgInfo?.Name || "AL-HAZIMA RESTAURANT PTE LTD"}</div>
                    <div class="company-address">
                        ${orgInfo?.Address1_Line1 || "No 4, Cheong Chin Nam Road"}<br/>
                        ${orgInfo?.Address1_City || "SINGAPORE"} - ${orgInfo?.Address1_PostalCode || "599729"}<br/>
                        Phone: ${orgInfo?.Address1_Telephone1 || "65130000"}
                    </div>
                </div>
                
                <div class="report-title">DAY END REPORT</div>
                
                <div class="report-info">
                    <strong>Date:</strong> ${selectedDateFormatted} &nbsp;&nbsp;|&nbsp;&nbsp;
                    <strong>Cashier:</strong> ${reportData.cashier || "System"} &nbsp;&nbsp;|&nbsp;&nbsp;
                    <strong>RefNo:</strong> ${reportData.refNo || "1"}
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Particulars</th>
                            <th>Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Sales Detail Section -->
                        <tr style="background:#eaeff2; font-weight:bold;">
                            <td colspan="2">Sales Detail</td>
                        </tr>
                        <tr>
                            <td>Total Sales</td>
                            <td>${(reportData.salesDetail?.totalSales || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Round Off</td>
                            <td>${(reportData.salesDetail?.roundOff || 0).toFixed(2)}</td>
                        </tr>
                        <tr style="font-weight:bold;">
                            <td>Total</td>
                            <td>${(reportData.salesDetail?.netTotal || 0).toFixed(2)}</td>
                        </tr>
                        
                        <!-- Paymode Detail Section -->
                        <tr style="background:#eaeff2; font-weight:bold;">
                            <td colspan="2">Paymode Detail</td>
                        </tr>
                        <tr>
                            <td class="download-particulars-cell">
                                <span>CASH</span>
                                <span>${reportData.receiptCount || 0}</span>
                            </td>
                            <td>${Object.values(reportData.paymodeDetail || {})[0]?.toFixed(2) || 0}</td>
                        </tr>
                        <tr style="font-weight:bold;">
                            <td>Total</td>
                            <td>${Object.values(reportData.paymodeDetail || {}).reduce((a, b) => a + b, 0).toFixed(2)}</td>
                        </tr>
                        
                        <!-- Settlement Detail Section -->
                        <tr style="background:#eaeff2; font-weight:bold;">
                            <td colspan="2">Settlement Detail</td>
                        </tr>
                        <tr>
                            <td>Cash Total</td>
                            <td>${(reportData.settlementDetail?.cashTotal || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Other Total</td>
                            <td>${(reportData.settlementDetail?.otherTotal || 0).toFixed(2)}</td>
                        </tr>
                        
                        <!-- Analysis Section -->
                        <tr style="background:#eaeff2; font-weight:bold;">
                            <td colspan="2">Analysis</td>
                        </tr>
                        <tr>
                            <td>Sales Amount</td>
                            <td>${(reportData.analysis?.salesAmount || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>No of Bills</td>
                            <td>${reportData.analysis?.noOfBills || 0}</td>
                        </tr>
                        <tr>
                            <td>Avg/Bill</td>
                            <td>${(reportData.analysis?.avgPerBill || 0).toFixed(2)}</td>
                        </tr>
                        
                        <!-- Void Detail Section -->
                        <tr style="background:#eaeff2; font-weight:bold;">
                            <td colspan="2">Void Detail</td>
                        </tr>
                        <tr>
                            <td>Void Item Qty</td>
                            <td>${reportData.voidDetail?.voidItemQty || 0}</td>
                        </tr>
                        <tr>
                            <td>Void Item Amount</td>
                            <td>${(reportData.voidDetail?.voidItemAmount || 0).toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>

                <!-- Cashier Signature -->
                <div class="signature">
                    <span>Cashier Signature</span>
                    <span>_________________</span>
                </div>

                <!-- Footer at bottom left corner -->
                <div class="footer">
                    <span>Printed On: ${printDate} ${printTime}</span><br/>
                    <span>Powered by UNIPRO</span>
                </div>
            </div>
        </body>
        </html>
        `;

        const blob = new Blob([htmlContent], { type: "text/html" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `DayEndReport_${selectedDate}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

  return (
  <div className={`dayend-report ${sidebarOpen ? "sidebar-open" : ""}`}>

    {/* 🔶 HEADER */}
    {/* <div className="der-header-title">Day End Report</div> */}

    {/* 🔶 TOP FILTER */}
    <div className="der-top-section">
        <div className="der-header-row">
        <h2 className="der-title">Day End Report</h2>
      <div className="der-top-row">

        <div className="der-filter-item">
          <input
            type="date"
            className="der-date-picker"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="der-action-row">
          <button
            className="der-btn-generate"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Loading..." : "Generate"}
          </button>

          {reportData && (
            <button
              className="der-download-btn"
              onClick={handleDownload}
            >
              ⬇ Report
            </button>
          )}
        </div>
</div>
      </div>
    </div>

    {/* 🔶 TABLE */}
    <div className="der-table-container">

      {loading ? (
        <div className="der-empty">Loading...</div>

      ) : showResults && reportData ? (

        <div className="der-table-wrapper">
          <table className="der-table">

            <thead>
              <tr>
                <th>Particulars</th>
                <th className="th-center">Amount (₹)</th>
              </tr>
            </thead>

            <tbody>

              {/* 🔹 Sales Detail */}
              <tr className="section-header">
                <td colSpan="2">Sales Detail</td>
              </tr>

              <tr>
                <td>Total Sales</td>
                <td className="text-center">
                  {(reportData.salesDetail?.totalSales || 0).toFixed(2)}
                </td>
              </tr>

              <tr>
                <td>Round Off</td>
                <td className="text-center">
                  {(reportData.salesDetail?.roundOff || 0).toFixed(2)}
                </td>
              </tr>

              <tr className="total-row">
                <td><strong>Total</strong></td>
                <td className="text-center">
                  <strong>
                    {(reportData.salesDetail?.netTotal || 0).toFixed(2)}
                  </strong>
                </td>
              </tr>

              {/* 🔹 Paymode */}
              <tr className="section-header">
                <td colSpan="2">Paymode Detail</td>
              </tr>

              {Object.entries(reportData.paymodeDetail || {}).map(([key, value]) => (
                <tr key={key}>
                  <td className="particulars-cell">
                    <span>{key}</span>
                    <span className="particulars-right">
                      {reportData.receiptCount || 0}
                    </span>
                  </td>
                  <td className="text-center">{(value || 0).toFixed(2)}</td>
                </tr>
              ))}

              <tr className="total-row">
                <td><strong>Total</strong></td>
                <td className="text-center">
                  <strong>
                    {Object.values(reportData.paymodeDetail || {})
                      .reduce((a, b) => a + b, 0)
                      .toFixed(2)}
                  </strong>
                </td>
              </tr>

              {/* 🔹 Settlement */}
              <tr className="section-header">
                <td colSpan="2">Settlement Detail</td>
              </tr>

              <tr>
                <td>Cash Total</td>
                <td className="text-center">
                  {(reportData.settlementDetail?.cashTotal || 0).toFixed(2)}
                </td>
              </tr>

              <tr>
                <td>Other Total</td>
                <td className="text-center">
                  {(reportData.settlementDetail?.otherTotal || 0).toFixed(2)}
                </td>
              </tr>

              {/* 🔹 Analysis */}
              <tr className="section-header">
                <td colSpan="2">Analysis</td>
              </tr>

              <tr>
                <td>Sales Amount</td>
                <td className="text-center">
                  {(reportData.analysis?.salesAmount || 0).toFixed(2)}
                </td>
              </tr>

              <tr>
                <td>No of Bills</td>
                <td className="text-center">
                  {reportData.analysis?.noOfBills || 0}
                </td>
              </tr>

              <tr>
                <td>Avg/Bill</td>
                <td className="text-center">
                  {(reportData.analysis?.avgPerBill || 0).toFixed(2)}
                </td>
              </tr>

              {/* 🔹 Void */}
              <tr className="section-header">
                <td colSpan="2">Void Detail</td>
              </tr>

              <tr>
                <td>Void Item Qty</td>
                <td className="text-center">
                  {reportData.voidDetail?.voidItemQty || 0}
                </td>
              </tr>

              <tr>
                <td>Void Item Amount</td>
                <td className="text-center">
                  {(reportData.voidDetail?.voidItemAmount || 0).toFixed(2)}
                </td>
              </tr>

            </tbody>
          </table>
        </div>

      ) : (
        <div className="der-empty">
          Select date and click Generate to see results
        </div>
      )}

    </div>

  </div>
);
};

export default DayEndReport;