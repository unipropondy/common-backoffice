import React, { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import "./DishGroupMigration.css";
import { BASE_URL } from "../config/api";

function DishGroupMigration() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [records, setRecords] = useState([]);
    const [summary, setSummary] = useState({
        total: 0,
        valid: 0,
        error: 0
    });
    const [loading, setLoading] = useState(false);
    const [posted, setPosted] = useState(false);
    const [migrationId, setMigrationId] = useState(null);

    // =====================================================
    // DOWNLOAD EXCEL TEMPLATE
    // =====================================================
    const downloadTemplate = () => {
        try {
            const headers = [
                "DishGroupCode",
                "DishGroupName",
                "SortCode",
                "IsActive",
                "ShortName",
                "CategoryId",
                "isKitchenprint"
            ];

            const sampleRow = [
                "001",
                "Main Course",
                1,
                1,
                "Main",
                "",
                1
            ];

            const ws = XLSX.utils.aoa_to_sheet([
                headers,
                sampleRow
            ]);

            ws["!cols"] = [
                { wch: 18 },
                { wch: 30 },
                { wch: 12 },
                { wch: 12 },
                { wch: 18 },
                { wch: 38 },
                { wch: 18 }
            ];

            const wb = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                wb,
                ws,
                "DishGroupMaster"
            );

            XLSX.writeFile(
                wb,
                "DishGroupMaster_Import_Template.xlsx"
            );

        } catch (error) {
            console.error(
                "Template error:",
                error
            );

            alert(
                "Failed to generate Excel template."
            );
        }
    };

    // =====================================================
    // FILE CHANGE
    // =====================================================
    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        setSelectedFile(file);
        setRecords([]);

        setSummary({
            total: 0,
            valid: 0,
            error: 0
        });

        setPosted(false);
        setMigrationId(null);
    };

    // =====================================================
    // UPLOAD & VALIDATE
    // =====================================================
    const handleUploadValidate = () => {
        if (!selectedFile) {
            alert("Please select an Excel file first.");
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(
                    e.target.result
                );

                const workbook = XLSX.read(data, {
                    type: "array"
                });

                const sheetName =
                    workbook.SheetNames[0];

                const sheet =
                    workbook.Sheets[sheetName];

                const rows =
                    XLSX.utils.sheet_to_json(
                        sheet,
                        {
                            defval: "",
                            raw: false
                        }
                    );

                if (rows.length === 0) {
                    alert(
                        "The Excel file has no data rows."
                    );
                    return;
                }

                let validCount = 0;
                let errorCount = 0;

                const validated = rows.map(
                    (row, index) => {

                        const remarks = [];

                        // ---------------------------------
                        // DishGroupCode
                        // ---------------------------------
                        let groupCode =
                            String(
                                row.DishGroupCode || ""
                            ).trim();

                        if (
                            groupCode &&
                            !isNaN(groupCode) &&
                            groupCode.length < 3
                        ) {
                            groupCode =
                                groupCode.padStart(
                                    3,
                                    "0"
                                );
                        }

                        if (!groupCode) {
                            remarks.push(
                                "DishGroupCode is required"
                            );
                        }

                        // ---------------------------------
                        // DishGroupName
                        // ---------------------------------
                        const groupName =
                            String(
                                row.DishGroupName || ""
                            ).trim();

                        if (!groupName) {
                            remarks.push(
                                "DishGroupName is required"
                            );
                        }

                        // ---------------------------------
                        // SortCode
                        // ---------------------------------
                        const sortCode =
                            Number(
                                row.SortCode
                            );

                        if (
                            isNaN(sortCode) ||
                            sortCode < 0
                        ) {
                            remarks.push(
                                "SortCode must be a valid number"
                            );
                        }

                        // ---------------------------------
                        // IsActive
                        // ---------------------------------
                        const isActive =
                            Number(
                                row.IsActive
                            );

                        if (
                            isNaN(isActive) ||
                            (isActive !== 0 &&
                                isActive !== 1)
                        ) {
                            remarks.push(
                                "IsActive must be 0 or 1"
                            );
                        }

                        // ---------------------------------
                        // isKitchenprint
                        // ---------------------------------
                        const isKitchenprint =
                            Number(
                                row.isKitchenprint
                            );

                        if (
                            isNaN(isKitchenprint) ||
                            (isKitchenprint !== 0 &&
                                isKitchenprint !== 1)
                        ) {
                            remarks.push(
                                "isKitchenprint must be 0 or 1"
                            );
                        }

                        const isValid =
                            remarks.length === 0;

                        if (isValid) {
                            validCount++;
                        } else {
                            errorCount++;
                        }

                        return {
                            RowNo: index + 2,

                            DishGroupCode:
                                groupCode,

                            DishGroupName:
                                groupName,

                            SortCode:
                                sortCode || 0,

                            IsActive:
                                isActive === 1
                                    ? 1
                                    : 0,

                            ShortName:
                                String(
                                    row.ShortName || ""
                                ).trim(),

                            CategoryId:
                                String(
                                    row.CategoryId || ""
                                ).trim() || null,

                            ImageId:
                                String(
                                    row.ImageId || ""
                                ).trim() || null,

                            BackColor:
                                String(
                                    row.BackColor || ""
                                ).trim(),

                            ForeColor:
                                String(
                                    row.ForeColor || ""
                                ).trim(),

                            isKitchenprint:
                                isKitchenprint === 1
                                    ? 1
                                    : 0,

                            Status:
                                isValid
                                    ? "VALID"
                                    : "ERROR",

                            Remark:
                                remarks.join(", ")
                        };
                    }
                );

                setRecords(validated);

                setSummary({
                    total: rows.length,
                    valid: validCount,
                    error: errorCount
                });

                setPosted(false);

            } catch (error) {
                console.error(
                    "Excel parse error:",
                    error
                );

                alert(
                    "Failed to read Excel file. Please use the correct template."
                );
            }
        };

        reader.readAsArrayBuffer(
            selectedFile
        );
    };

    // =====================================================
    // POST / INSERT
    // =====================================================
    const handlePost = async () => {

        const validRecords =
            records.filter(
                row => row.Status === "VALID"
            );

        if (validRecords.length === 0) {
            alert(
                "No valid records to insert."
            );
            return;
        }

        if (
            !window.confirm(
                `Insert ${validRecords.length} valid record(s) into DishGroupMaster?`
            )
        ) {
            return;
        }

        try {

            setLoading(true);

            const userId =
                localStorage.getItem(
                    "userId"
                );

            if (!userId) {
                alert(
                    "UserId not found. Please login again."
                );

                return;
            }

            // ---------------------------------------------
            // STEP 1 - SAVE MIGRATION
            // ---------------------------------------------
            const saveRes =
                await axios.post(
                    `${BASE_URL}/api/dishgroup-migration/save`,
                    {
                        fileName:
                            selectedFile?.name || "",

                        records:
                            validRecords,

                        userId:
                            userId
                    }
                );

            if (
                !saveRes.data?.success ||
                !saveRes.data?.migrationId
            ) {
                alert(
                    saveRes.data?.message ||
                    "Failed to save migration records."
                );

                return;
            }

            const currentMigrationId =
                saveRes.data.migrationId;

            setMigrationId(
                currentMigrationId
            );

            // ---------------------------------------------
            // STEP 2 - POST MIGRATION
            // ---------------------------------------------
            const postRes =
                await axios.post(
                    `${BASE_URL}/api/dishgroup-migration/post/${currentMigrationId}`,
                    {
                        userId: userId
                    }
                );

            if (postRes.data?.success) {

                alert(
                    `✅ ${validRecords.length} record(s) inserted successfully!`
                );

                setPosted(true);

            } else {

                alert(
                    "Insert failed: " +
                    (
                        postRes.data?.message ||
                        "Unknown error"
                    )
                );
            }

        } catch (error) {

            console.error(
                "POST error:",
                error
            );

            alert(
                "Insert failed: " +
                (
                    error.response?.data?.message ||
                    error.message
                )
            );

        } finally {

            setLoading(false);
        }
    };

    const hasValidRecords =
        records.some(
            row => row.Status === "VALID"
        );

    // =====================================================
    // RENDER
    // =====================================================
    return (
        <div className="dishgroup-migration-page">

            {/* HEADER */}
            <div className="dishgroup-migration-header">

                <div>
                    <h1>
                        Dish Group Migration
                    </h1>

                    <p>
                        Import Dish Group Master records
                        from Excel
                    </p>
                </div>

            </div>

            <div className="dishgroup-migration-box">

                {/* DOWNLOAD TEMPLATE */}
                <div className="migration-section">

                    <div className="section-title">
                        <span className="step-number">
                            1
                        </span>

                        <div>
                            <h3>
                                Download Excel Template
                            </h3>

                            <p>
                                Download the standard
                                DishGroupMaster template.
                            </p>
                        </div>
                    </div>

                    <button
                        className="migration-btn template-btn"
                        onClick={
                            downloadTemplate
                        }
                    >
                        ⬇ Download Template
                    </button>

                </div>

                {/* UPLOAD */}
                <div className="migration-section">

                    <div className="section-title">

                        <span className="step-number">
                            2
                        </span>

                        <div>
                            <h3>
                                Select Excel File
                            </h3>

                            <p>
                                Upload your completed
                                DishGroupMaster Excel file.
                            </p>
                        </div>

                    </div>

                    <div className="upload-row">

                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={
                                handleFileChange
                            }
                        />

                        <button
                            className="migration-btn upload-btn"
                            onClick={
                                handleUploadValidate
                            }
                            disabled={
                                !selectedFile
                            }
                        >
                            Upload & Validate
                        </button>

                    </div>

                    {selectedFile && (
                        <div className="selected-file">
                            Selected File:
                            <strong>
                                {selectedFile.name}
                            </strong>
                        </div>
                    )}

                </div>

                {/* SUMMARY */}
                {records.length > 0 && (

                    <div className="validation-section">

                        <h3>
                            Validation Result
                        </h3>

                        <div className="validation-summary">

                            <div className="summary-card">
                                <span>
                                    Total Records
                                </span>

                                <strong>
                                    {summary.total}
                                </strong>
                            </div>

                            <div className="summary-card valid-card">
                                <span>
                                    Valid Records
                                </span>

                                <strong>
                                    {summary.valid}
                                </strong>
                            </div>

                            <div className="summary-card error-card">
                                <span>
                                    Error Records
                                </span>

                                <strong>
                                    {summary.error}
                                </strong>
                            </div>

                        </div>

                    </div>
                )}

                {/* PREVIEW */}
                {records.length > 0 && (

                    <div className="preview-section">

                        <div className="preview-header">
                            <div>
                                <h3>
                                    Migration Records
                                </h3>

                                <p>
                                    Review the records
                                    before inserting.
                                </p>
                            </div>
                        </div>

                        <div className="table-container">

                            <table className="migration-table">

                                <thead>

                                    <tr>

                                        <th>
                                            Row
                                        </th>

                                        <th>
                                            Group Code
                                        </th>

                                        <th>
                                            Group Name
                                        </th>

                                        <th>
                                            Sort Code
                                        </th>

                                        <th>
                                            Is Active
                                        </th>

                                        <th>
                                            Short Name
                                        </th>

                                        <th>
                                            Category ID
                                        </th>

                                        <th>
                                            Kitchen Print
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Remark
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {records.map(
                                        row => (

                                            <tr
                                                key={
                                                    row.RowNo
                                                }
                                                className={
                                                    row.Status ===
                                                        "ERROR"
                                                        ? "row-error"
                                                        : "row-valid"
                                                }
                                            >

                                                <td>
                                                    {
                                                        row.RowNo
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        row.DishGroupCode
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        row.DishGroupName
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        row.SortCode
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        row.IsActive
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        row.ShortName ||
                                                        "—"
                                                    }
                                                </td>

                                                <td className="guid-cell">
                                                    {
                                                        row.CategoryId ||
                                                        "—"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        row.isKitchenprint
                                                    }
                                                </td>

                                                <td>

                                                    <span
                                                        className={
                                                            `status-badge ${row.Status ===
                                                                "VALID"
                                                                ? "badge-valid"
                                                                : "badge-error"
                                                            }`
                                                        }
                                                    >
                                                        {
                                                            row.Status
                                                        }
                                                    </span>

                                                </td>

                                                <td className="remark-cell">
                                                    {
                                                        row.Remark ||
                                                        "—"
                                                    }
                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>
                )}

                {/* ACTION */}
                <div className="migration-actions">

                    {records.length === 0 && (
                        <div className="no-records-hint">
                            Upload an Excel file to
                            see records here.
                        </div>
                    )}

                    <button
                        className="migration-btn post-btn"
                        onClick={handlePost}
                        disabled={
                            !hasValidRecords ||
                            loading ||
                            posted
                        }
                    >
                        {
                            loading
                                ? "Inserting..."
                                : posted
                                    ? "✅ Inserted"
                                    : "POST / INSERT"
                        }
                    </button>

                </div>

            </div>

        </div>
    );
}

export default DishGroupMigration;