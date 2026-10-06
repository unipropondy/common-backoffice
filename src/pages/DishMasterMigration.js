import React, { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import "./DishMasterMigration.css";
import { BASE_URL } from "../config/api";

function DishMasterMigration() {

    const [selectedFile, setSelectedFile] = useState(null);
    const [records, setRecords] = useState([]);       // parsed + validated rows
    const [summary, setSummary] = useState({ total: 0, valid: 0, error: 0 });
    const [loading, setLoading] = useState(false);
    const [posted, setPosted] = useState(false);
    const [migrationId, setMigrationId] = useState(null);

    // ─────────────────────────────────────────────
    // 1. DOWNLOAD TEMPLATE
    // ─────────────────────────────────────────────
    const downloadTemplate = async () => {
        try {
            // 1. Create DishMaster Sheet
            const headers = ["DishCode", "Name", "IsActive", "SordCode", "CurrentCost", "DishGroupId", "isServiceCharge"];
            const sampleRow = ["001", "Sample Dish Name", 1, 1, 100.00, "", 0];

            const wsMaster = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
            wsMaster["!cols"] = [
                { wch: 12 }, { wch: 30 }, { wch: 10 },
                { wch: 10 }, { wch: 14 }, { wch: 38 }, { wch: 16 }
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, wsMaster, "DishMaster");

            // 2. Fetch DishGroupMaster Data & Create Second Sheet
            const res = await axios.get(`${BASE_URL}/dishgroup`);
            const dishGroups = res.data;

            if (dishGroups && dishGroups.length > 0) {
                // Only show the requested columns
                const filteredGroups = dishGroups.map(group => ({
                    DishGroupId: group.DishGroupId,
                    DishGroupName: group.DishGroupName,
                    CategoryName: group.CategoryName
                }));
                const wsGroup = XLSX.utils.json_to_sheet(filteredGroups);
                XLSX.utils.book_append_sheet(wb, wsGroup, "DishGroupMaster");
            } else {
                // If no records, just create a blank sheet with a placeholder header
                const wsGroup = XLSX.utils.aoa_to_sheet([["DishGroupId", "DishGroupName", "CategoryName"]]);
                XLSX.utils.book_append_sheet(wb, wsGroup, "DishGroupMaster");
            }

            // 3. Download the file
            XLSX.writeFile(wb, "DishMaster_Import_Template.xlsx");

        } catch (error) {
            console.error("Error generating template:", error);
            alert("Failed to fetch Dish Group data for the template.");
        }
    };

    // ─────────────────────────────────────────────
    // 2. FILE CHANGE
    // ─────────────────────────────────────────────
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setRecords([]);
            setSummary({ total: 0, valid: 0, error: 0 });
            setPosted(false);
        }
    };

    // ─────────────────────────────────────────────
    // 3. UPLOAD & VALIDATE
    // ─────────────────────────────────────────────
    const handleUploadValidate = () => {
        if (!selectedFile) {
            alert("Please select an Excel file first.");
            return;
        }

        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });

                // Read first sheet
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });

                if (rows.length === 0) {
                    alert("The Excel file has no data rows.");
                    return;
                }

                let validCount = 0;
                let errorCount = 0;

                const validated = rows.map((row, idx) => {
                    const remarks = [];

                    let parsedDishCode = String(row.DishCode || "").trim();
                    // If the user typed 1 in Excel, pad it to 001 to match previous requirements
                    if (parsedDishCode && !isNaN(parsedDishCode) && parsedDishCode.length < 3) {
                        parsedDishCode = parsedDishCode.padStart(3, '0');
                    }

                    // Required: DishCode
                    if (!parsedDishCode || parsedDishCode === "") {
                        remarks.push("DishCode is required");
                    }

                    // Required: Name
                    if (!row.Name || String(row.Name).trim() === "") {
                        remarks.push("Name is required");
                    }

                    // IsActive must be 0 or 1
                    const isActive = Number(row.IsActive);
                    if (isNaN(isActive) || (isActive !== 0 && isActive !== 1)) {
                        remarks.push("IsActive must be 0 or 1");
                    }

                    const isValid = remarks.length === 0;
                    if (isValid) validCount++; else errorCount++;

                    return {
                        RowNo: idx + 2,   // +2 because row 1 = header
                        DishCode: parsedDishCode,
                        Name: String(row.Name || "").trim(),
                        IsActive: isActive === 1 ? 1 : 0,
                        SordCode: Number(row.SordCode) || 0,
                        CurrentCost: Number(row.CurrentCost) || 0,
                        DishGroupId: String(row.DishGroupId || "").trim() || null,
                        isServiceCharge: row.isServiceCharge === 1 || row.isServiceCharge === true ? 1 : 0,
                        Status: isValid ? "VALID" : "ERROR",
                        Remark: remarks.join(", ")
                    };
                });

                setRecords(validated);
                setSummary({ total: rows.length, valid: validCount, error: errorCount });
                setPosted(false);

            } catch (err) {
                console.error("Excel parse error:", err);
                alert("Failed to read Excel file. Please use the correct template.");
            }
        };

        reader.readAsArrayBuffer(selectedFile);
    };

    // ─────────────────────────────────────────────
    // 4. POST / INSERT to DB
    // ─────────────────────────────────────────────
    const handlePost = async () => {
        const validRecords = records.filter(r => r.Status === "VALID");

        if (validRecords.length === 0) {
            alert("No valid records to insert.");
            return;
        }

        if (!window.confirm(`Insert ${validRecords.length} valid record(s) into DishMaster?`)) return;

        try {
            setLoading(true);

            const userId = localStorage.getItem("userId");

            if (!userId) {
                alert("UserId not found. Please login again.");
                return;
            }

            // Step 1: Save Excel records to DB
            const saveRes = await axios.post(
                `${BASE_URL}/api/dishmaster-migration/save`,
                {
                    fileName: selectedFile?.name || "",
                    records: validRecords,
                    userId: userId
                }
            );

            if (!saveRes.data?.success || !saveRes.data?.migrationId) {
                alert(saveRes.data?.message || "Failed to save migration records to database.");
                setLoading(false);
                return;
            }

            const currentMigrationId = saveRes.data.migrationId;
            setMigrationId(currentMigrationId);

            // Step 2: Post the migration via Stored Procedure
            const postRes = await axios.post(
                `${BASE_URL}/api/dishmaster-migration/post/${currentMigrationId}`,
                {
                    userId: userId
                }
            );

            if (postRes.data?.success) {
                alert(`✅ ${validRecords.length} record(s) inserted successfully!`);
                setPosted(true);
            } else {
                alert("Insert failed: " + (postRes.data?.message || "Unknown error"));
            }

        } catch (err) {
            console.error("POST error:", err);
            alert("Insert failed: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const hasValidRecords = records.some(r => r.Status === "VALID");

    // ─────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────
    return (
        <div className="dish-migration-page">

            {/* HEADER */}
            <div className="dish-migration-header">
                <h1>Dish Master Import</h1>
            </div>

            <div className="dish-migration-box">

                {/* STEP 1 — DOWNLOAD TEMPLATE */}
                <div className="migration-section">
                    <h3>1. Download Excel Template</h3>
                    <button className="migration-btn template-btn" onClick={downloadTemplate}>
                        ⬇ Download Excel Template
                    </button>
                </div>

                {/* STEP 2 — SELECT FILE & VALIDATE */}
                <div className="migration-section">
                    <h3>2. Select Excel File &amp; Validate</h3>

                    <div className="upload-row">
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                        />
                        <button
                            className="migration-btn upload-btn"
                            onClick={handleUploadValidate}
                            disabled={!selectedFile}
                        >
                            Upload &amp; Validate
                        </button>
                    </div>

                    {selectedFile && (
                        <div className="selected-file">
                            Selected: <strong>{selectedFile.name}</strong>
                        </div>
                    )}
                </div>

                {/* VALIDATION SUMMARY — shown after parse */}
                {records.length > 0 && (
                    <div className="validation-section">
                        <h3>Validation Result</h3>
                        <div className="validation-summary">
                            <div className="summary-card">
                                <span>Total Records</span>
                                <strong>{summary.total}</strong>
                            </div>
                            <div className="summary-card valid-card">
                                <span>Valid Records</span>
                                <strong>{summary.valid}</strong>
                            </div>
                            <div className="summary-card error-card">
                                <span>Error Records</span>
                                <strong>{summary.error}</strong>
                            </div>
                        </div>
                    </div>
                )}

                {/* PREVIEW TABLE */}
                {records.length > 0 && (
                    <div className="preview-section">
                        <h3>Migration Records</h3>
                        <div className="table-container">
                            <table className="migration-table">
                                <thead>
                                    <tr>
                                        <th>Row</th>
                                        <th>Dish Code</th>
                                        <th>Dish Name</th>
                                        <th>Is Active</th>
                                        <th>Sort Code</th>
                                        <th>Current Cost</th>
                                        <th>Dish Group ID</th>
                                        <th>Svc Charge</th>
                                        <th>Status</th>
                                        <th>Remark</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((row) => (
                                        <tr
                                            key={row.RowNo}
                                            className={row.Status === "ERROR" ? "row-error" : "row-valid"}
                                        >
                                            <td>{row.RowNo}</td>
                                            <td>{row.DishCode}</td>
                                            <td>{row.Name}</td>
                                            <td>{row.IsActive}</td>
                                            <td>{row.SordCode}</td>
                                            <td>{row.CurrentCost}</td>
                                            <td className="guid-cell">{row.DishGroupId || "—"}</td>
                                            <td>{row.isServiceCharge}</td>
                                            <td>
                                                <span className={`status-badge ${row.Status === "VALID" ? "badge-valid" : "badge-error"}`}>
                                                    {row.Status}
                                                </span>
                                            </td>
                                            <td className="remark-cell">{row.Remark || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* POST BUTTON */}
                <div className="migration-actions">
                    {records.length === 0 && (
                        <div className="no-records-hint">Upload an Excel file to see records here.</div>
                    )}
                    <button
                        className="migration-btn post-btn"
                        onClick={handlePost}
                        disabled={!hasValidRecords || loading || posted}
                    >
                        {loading ? "Inserting..." : posted ? "✅ Inserted" : "POST / INSERT"}
                    </button>
                </div>

            </div>
        </div>
    );
}

export default DishMasterMigration;