import React, { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import "./CategoryMigration.css";
import { BASE_URL } from "../config/api";

function CategoryMigration() {

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
    // DOWNLOAD TEMPLATE
    // =====================================================

    const downloadTemplate = () => {

        try {

            const headers = [
                "CategoryCode",
                "CategoryName",
                "ShortName",
                "SortCode",
                "isActive"
            ];


            const sampleRow = [
                "001",
                "Food",
                "Food",
                1,
                1
            ];


            const worksheet = XLSX.utils.aoa_to_sheet([
                headers,
                sampleRow
            ]);


            worksheet["!cols"] = [
                { wch: 18 },
                { wch: 25 },
                { wch: 18 },
                { wch: 12 },
                { wch: 12 }
            ];


            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "CategoryMaster"
            );


            XLSX.writeFile(
                workbook,
                "CategoryMaster_Import_Template.xlsx"
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

        if (!file) {
            return;
        }


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
    // CONVERT BIT VALUE
    // =====================================================

    const parseBitValue = (
        value,
        fieldName,
        remarks
    ) => {

        const valueText =
            String(
                value ?? ""
            )
                .trim()
                .toLowerCase();


        if (valueText === "") {

            remarks.push(
                `${fieldName} is required`
            );

            return null;
        }


        if (
            valueText === "1" ||
            valueText === "true"
        ) {

            return 1;
        }


        if (
            valueText === "0" ||
            valueText === "false"
        ) {

            return 0;
        }


        remarks.push(
            `${fieldName} must be 0 or 1`
        );

        return null;
    };


    // =====================================================
    // GUID VALIDATION
    // =====================================================

    const isValidGuid = (value) => {

        const guidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        return guidRegex.test(value);
    };


    // =====================================================
    // TIME VALIDATION
    // =====================================================

    const isValidTime = (value) => {

        if (!value) {
            return true;
        }

        const timeRegex =
            /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

        return timeRegex.test(
            String(value).trim()
        );
    };


    // =====================================================
    // UPLOAD & VALIDATE
    // =====================================================

    const handleUploadValidate = () => {

        if (!selectedFile) {

            alert(
                "Please select an Excel file first."
            );

            return;
        }


        const reader = new FileReader();


        reader.onload = (e) => {

            try {

                const data =
                    new Uint8Array(
                        e.target.result
                    );


                const workbook =
                    XLSX.read(
                        data,
                        {
                            type: "array"
                        }
                    );


                if (
                    !workbook.SheetNames ||
                    workbook.SheetNames.length === 0
                ) {

                    alert(
                        "Excel file does not contain any sheet."
                    );

                    return;
                }


                const sheetName =
                    workbook.SheetNames[0];


                const worksheet =
                    workbook.Sheets[
                    sheetName
                    ];


                const rows =
                    XLSX.utils.sheet_to_json(
                        worksheet,
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


                // =================================================
                // VALIDATE ROWS
                // =================================================

                const validatedRecords =
                    rows.map(
                        (row, index) => {

                            const remarks = [];


                            // =========================================
                            // CATEGORY CODE
                            // =========================================

                            let categoryCode =
                                String(
                                    row.CategoryCode || ""
                                ).trim();


                            if (
                                categoryCode &&
                                !isNaN(categoryCode) &&
                                categoryCode.length < 3
                            ) {

                                categoryCode =
                                    categoryCode.padStart(
                                        3,
                                        "0"
                                    );
                            }


                            if (!categoryCode) {

                                remarks.push(
                                    "CategoryCode is required"
                                );
                            }


                            // =========================================
                            // DUPLICATE CATEGORY CODE
                            // =========================================

                            const duplicateCode =
                                rows.some(
                                    (
                                        otherRow,
                                        otherIndex
                                    ) => {

                                        if (
                                            otherIndex ===
                                            index
                                        ) {
                                            return false;
                                        }


                                        let otherCode =
                                            String(
                                                otherRow.CategoryCode ||
                                                ""
                                            ).trim();


                                        if (
                                            otherCode &&
                                            !isNaN(otherCode) &&
                                            otherCode.length < 3
                                        ) {

                                            otherCode =
                                                otherCode.padStart(
                                                    3,
                                                    "0"
                                                );
                                        }


                                        return (
                                            otherCode ===
                                            categoryCode
                                        );
                                    }
                                );


                            if (
                                categoryCode &&
                                duplicateCode
                            ) {

                                remarks.push(
                                    "Duplicate CategoryCode in Excel"
                                );
                            }


                            // =========================================
                            // CATEGORY NAME
                            // =========================================

                            const categoryName =
                                String(
                                    row.CategoryName || ""
                                ).trim();


                            if (!categoryName) {

                                remarks.push(
                                    "CategoryName is required"
                                );
                            }


                            // =========================================
                            // SHORT NAME
                            // =========================================

                            const shortName =
                                String(
                                    row.ShortName || ""
                                ).trim();


                            // =========================================
                            // OTHER LANGUAGE
                            // =========================================

                            const nameInOtherLanguage =
                                String(
                                    row.NameInOtherLanguage ||
                                    ""
                                ).trim();


                            // =========================================
                            // IMAGE ID
                            // =========================================

                            let imageId =
                                String(
                                    row.ImageId || ""
                                ).trim();


                            if (imageId) {

                                if (
                                    !isValidGuid(
                                        imageId
                                    )
                                ) {

                                    remarks.push(
                                        "ImageId must be a valid GUID"
                                    );
                                }

                            } else {

                                imageId = null;
                            }


                            // =========================================
                            // COLORS
                            // =========================================

                            const backColor =
                                String(
                                    row.BackColor || ""
                                ).trim();


                            const foreColor =
                                String(
                                    row.ForeColor || ""
                                ).trim();


                            // =========================================
                            // BIT FIELDS
                            // =========================================

                            const isKitchenPrint = 1;

                            const isDiscountAllowed = 0;

                            const isServiceCharge = 0;

                            const isDispName = 0;

                            const isMemberSalesAllowed = 0;

                            const IsTaxAllowed = 0;

                            const isActive =
                                parseBitValue(
                                    row.isActive,
                                    "isActive",
                                    remarks
                                );


                            const isPublished = 0;


                            // =========================================
                            // SORT CODE
                            // =========================================

                            const sortCodeValue =
                                String(
                                    row.SortCode ?? ""
                                ).trim();


                            const sortCode =
                                Number(
                                    sortCodeValue
                                );


                            if (
                                sortCodeValue === "" ||
                                isNaN(sortCode) ||
                                sortCode < 0
                            ) {

                                remarks.push(
                                    "SortCode must be a valid number"
                                );
                            }


                            // =========================================
                            // CATEGORY IMAGE
                            // =========================================

                            const categoryImage =
                                String(
                                    row.CategoryImage || ""
                                ).trim();


                            // =========================================
                            // AVAILABLE TIME
                            // =========================================

                            const availableTimeFrom =
                                String(
                                    row.AvailableTimeFrom ||
                                    ""
                                ).trim();


                            const availableTimeTo =
                                String(
                                    row.AvailableTimeTo ||
                                    ""
                                ).trim();


                            if (
                                availableTimeFrom &&
                                !isValidTime(
                                    availableTimeFrom
                                )
                            ) {

                                remarks.push(
                                    "AvailableTimeFrom must be valid time"
                                );
                            }


                            if (
                                availableTimeTo &&
                                !isValidTime(
                                    availableTimeTo
                                )
                            ) {

                                remarks.push(
                                    "AvailableTimeTo must be valid time"
                                );
                            }


                            // =========================================
                            // FINAL STATUS
                            // =========================================

                            const isValid =
                                remarks.length === 0;


                            if (isValid) {

                                validCount++;

                            } else {

                                errorCount++;
                            }


                            return {

                                RowNo:
                                    index + 2,

                                CategoryCode:
                                    categoryCode,

                                CategoryName:
                                    categoryName,

                                ShortName:
                                    shortName,

                                NameInOtherLanguage:
                                    nameInOtherLanguage,

                                ImageId:
                                    imageId,

                                BackColor:
                                    backColor,

                                ForeColor:
                                    foreColor,

                                isKitchenPrint:
                                    isKitchenPrint,

                                isDiscountAllowed:
                                    isDiscountAllowed,

                                isServiceCharge:
                                    isServiceCharge,

                                IsDispName:
                                    isDispName,

                                isMemberSalesAllowed:
                                    isMemberSalesAllowed,

                                IsTaxAllowed:
                                    IsTaxAllowed,

                                SortCode:
                                    sortCode || 0,

                                isActive:
                                    isActive,

                                CategoryImage:
                                    categoryImage,

                                IsPublished:
                                    isPublished,

                                AvailableTimeFrom:
                                    availableTimeFrom ||
                                    null,

                                AvailableTimeTo:
                                    availableTimeTo ||
                                    null,

                                Status:
                                    isValid
                                        ? "VALID"
                                        : "ERROR",

                                Remark:
                                    remarks.join(
                                        ", "
                                    )
                            };
                        }
                    );


                setRecords(
                    validatedRecords
                );


                setSummary({

                    total:
                        rows.length,

                    valid:
                        validCount,

                    error:
                        errorCount
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
    // SAVE + POST
    // =====================================================

    const handlePost = async () => {

        if (
            records.length === 0
        ) {

            alert(
                "No records available."
            );

            return;
        }


        if (
            summary.error > 0
        ) {

            alert(
                "Please correct all error records before posting."
            );

            return;
        }


        const validRecords =
            records.filter(
                row =>
                    row.Status === "VALID"
            );


        if (
            validRecords.length === 0
        ) {

            alert(
                "No valid records to insert."
            );

            return;
        }


        const confirmPost =
            window.confirm(
                `Insert ${validRecords.length} category record(s) into CategoryMaster?`
            );


        if (!confirmPost) {
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


            // =============================================
            // SAVE HEADER + LINE
            // =============================================

            const saveResponse =
                await axios.post(
                    `${BASE_URL}/api/category-migration/save`,
                    {
                        fileName:
                            selectedFile?.name || "",

                        records:
                            records,

                        userId:
                            userId
                    }
                );


            if (
                !saveResponse.data?.success
            ) {

                alert(
                    saveResponse.data?.message ||
                    "Failed to save migration."
                );

                return;
            }


            const currentMigrationId =
                saveResponse.data.migrationId;


            if (!currentMigrationId) {

                alert(
                    "Migration ID was not returned."
                );

                return;
            }


            setMigrationId(
                currentMigrationId
            );


            // =============================================
            // POST MIGRATION
            // =============================================

            const postResponse =
                await axios.post(
                    `${BASE_URL}/api/category-migration/post/${currentMigrationId}`,
                    {
                        userId:
                            userId
                    }
                );


            if (
                postResponse.data?.success
            ) {

                alert(
                    `✅ ${validRecords.length} category record(s) inserted successfully!`
                );


                setPosted(true);

            } else {

                alert(
                    postResponse.data?.message ||
                    "Category migration failed."
                );
            }


        } catch (error) {

            console.error(
                "Category migration error:",
                error
            );


            alert(
                error.response?.data?.message ||
                error.message ||
                "Category migration failed."
            );


        } finally {

            setLoading(false);
        }
    };


    const hasValidRecords =
        records.some(
            row =>
                row.Status === "VALID"
        );


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="category-migration-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="category-migration-header">

                <h1>
                    Category Master Migration
                </h1>

                <p>
                    Import Category Master
                    records from Excel
                </p>

            </div>


            <div className="category-migration-box">

                {/* =================================================
                    STEP 1
                ================================================= */}

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
                                Category Master migration template.
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


                {/* =================================================
                    STEP 2
                ================================================= */}

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
                                Category Master Excel file.
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
                                {
                                    selectedFile.name
                                }
                            </strong>

                        </div>

                    )}

                </div>


                {/* =================================================
                    VALIDATION SUMMARY
                ================================================= */}

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
                                    {
                                        summary.total
                                    }
                                </strong>

                            </div>


                            <div className="summary-card valid-card">

                                <span>
                                    Valid Records
                                </span>

                                <strong>
                                    {
                                        summary.valid
                                    }
                                </strong>

                            </div>


                            <div className="summary-card error-card">

                                <span>
                                    Error Records
                                </span>

                                <strong>
                                    {
                                        summary.error
                                    }
                                </strong>

                            </div>

                        </div>

                    </div>

                )}


                {/* =================================================
                    PREVIEW
                ================================================= */}

                {records.length > 0 && (

                    <div className="preview-section">

                        <div className="preview-header">

                            <h3>
                                Migration Records
                            </h3>

                            <p>
                                Review the records before posting.
                            </p>

                        </div>


                        <div className="table-container">

                            <table className="migration-table">

                                <thead>

                                    <tr>

                                        <th>Row</th>

                                        <th>Code</th>

                                        <th>Category Name</th>

                                        <th>Short Name</th>

                                        <th>Sort Code</th>

                                        <th>Active</th>

                                        <th>Status</th>

                                        <th>Remark</th>

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
                                                        row.CategoryCode
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        row.CategoryName
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        row.ShortName ||
                                                        "—"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        row.SortCode
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        row.isActive
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


                {/* =================================================
                    ACTION
                ================================================= */}

                <div className="migration-actions">

                    {records.length === 0 && (

                        <span className="no-records-hint">
                            Upload an Excel file to
                            see records here.
                        </span>

                    )}


                    {summary.error > 0 && (

                        <span className="error-hint">
                            ⚠ Please correct all
                            error records before posting.
                        </span>

                    )}


                    <button
                        className="migration-btn post-btn"
                        onClick={
                            handlePost
                        }
                        disabled={
                            !hasValidRecords ||
                            summary.error > 0 ||
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

export default CategoryMigration;