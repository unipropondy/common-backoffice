const express = require("express");
const router = express.Router();

const { sql, poolPromise } = require("../db");
const { v4: uuidv4 } = require("uuid");


// ============================================================
// SAVE CATEGORY MASTER MIGRATION
// ============================================================

router.post("/save", async (req, res) => {

    try {

        const {
            fileName,
            records,
            userId
        } = req.body;


        // ========================================================
        // VALIDATION
        // ========================================================

        if (!userId) {

            return res.status(400).json({
                success: false,
                message: "UserId is required"
            });
        }


        if (
            !records ||
            !Array.isArray(records) ||
            records.length === 0
        ) {

            return res.status(400).json({
                success: false,
                message: "No migration records found"
            });
        }


        // ========================================================
        // DATABASE
        // ========================================================

        const pool = await poolPromise;

        const transaction =
            new sql.Transaction(pool);


        try {

            await transaction.begin();


            // ====================================================
            // MIGRATION ID
            // ====================================================

            const migrationId =
                uuidv4();


            // ====================================================
            // SUMMARY
            // ====================================================

            const totalRecords =
                records.length;


            const validRecords =
                records.filter(
                    row =>
                        String(row.Status)
                            .toUpperCase() === "VALID"
                ).length;


            const errorRecords =
                records.filter(
                    row =>
                        String(row.Status)
                            .toUpperCase() === "ERROR"
                ).length;


            // ====================================================
            // HEADER STATUS
            // ====================================================

            const headerStatus =
                errorRecords > 0
                    ? "ERROR"
                    : "PENDING";


            // ====================================================
            // INSERT HEADER
            // ====================================================

            await new sql.Request(transaction)

                .input(
                    "MigrationId",
                    sql.UniqueIdentifier,
                    migrationId
                )

                .input(
                    "FileName",
                    sql.NVarChar(255),
                    fileName || ""
                )

                .input(
                    "TotalRecords",
                    sql.Int,
                    totalRecords
                )

                .input(
                    "ValidRecords",
                    sql.Int,
                    validRecords
                )

                .input(
                    "ErrorRecords",
                    sql.Int,
                    errorRecords
                )

                .input(
                    "Status",
                    sql.VarChar(20),
                    headerStatus
                )

                .input(
                    "CreatedBy",
                    sql.UniqueIdentifier,
                    userId
                )

                .query(`
                    INSERT INTO CategoryMasterMigrationHeader
                    (
                        MigrationId,
                        FileName,
                        TotalRecords,
                        ValidRecords,
                        ErrorRecords,
                        Status,
                        CreatedBy,
                        CreatedOn
                    )
                    VALUES
                    (
                        @MigrationId,
                        @FileName,
                        @TotalRecords,
                        @ValidRecords,
                        @ErrorRecords,
                        @Status,
                        @CreatedBy,
                        GETDATE()
                    )
                `);


            // ====================================================
            // INSERT MIGRATION LINES
            // ====================================================

            for (
                const record of records
            ) {

                await new sql.Request(transaction)

                    .input(
                        "MigrationLineId",
                        sql.UniqueIdentifier,
                        uuidv4()
                    )

                    .input(
                        "MigrationId",
                        sql.UniqueIdentifier,
                        migrationId
                    )

                    .input(
                        "RowNo",
                        sql.Int,
                        Number(record.RowNo)
                    )

                    .input(
                        "CategoryCode",
                        sql.VarChar(100),
                        record.CategoryCode || null
                    )

                    .input(
                        "CategoryName",
                        sql.NVarChar(255),
                        record.CategoryName || null
                    )

                    .input(
                        "ShortName",
                        sql.VarChar(100),
                        record.ShortName || null
                    )

                    .input(
                        "NameInOtherLanguage",
                        sql.NVarChar(255),
                        record.NameInOtherLanguage || null
                    )

                    .input(
                        "ImageId",
                        sql.UniqueIdentifier,
                        record.ImageId || null
                    )

                    .input(
                        "BackColor",
                        sql.VarChar(50),
                        record.BackColor || null
                    )

                    .input(
                        "ForeColor",
                        sql.VarChar(50),
                        record.ForeColor || null
                    )

                    .input(
                        "isKitchenPrint",
                        sql.Bit,
                        record.isKitchenPrint
                    )

                    .input(
                        "isDiscountAllowed",
                        sql.Bit,
                        record.isDiscountAllowed
                    )

                    .input(
                        "isServiceCharge",
                        sql.Bit,
                        record.isServiceCharge
                    )

                    .input(
                        "IsDispName",
                        sql.Bit,
                        record.IsDispName
                    )

                    .input(
                        "isMemberSalesAllowed",
                        sql.Bit,
                        record.isMemberSalesAllowed
                    )

                    .input(
                        "IsTaxAllowed",
                        sql.Bit,
                        record.IsTaxAllowed
                    )

                    .input(
                        "SortCode",
                        sql.Int,
                        record.SortCode
                    )

                    .input(
                        "isActive",
                        sql.Bit,
                        record.isActive
                    )

                    .input(
                        "CategoryImage",
                        sql.NVarChar(sql.MAX),
                        record.CategoryImage || null
                    )

                    .input(
                        "IsPublished",
                        sql.Bit,
                        record.IsPublished
                    )

                    .input(
                        "AvailableTimeFrom",
                        sql.Time,
                        record.AvailableTimeFrom || null
                    )

                    .input(
                        "AvailableTimeTo",
                        sql.Time,
                        record.AvailableTimeTo || null
                    )

                    .input(
                        "Remark",
                        sql.NVarChar(1000),
                        record.Remark || null
                    )

                    .input(
                        "Status",
                        sql.VarChar(20),
                        record.Status || "PENDING"
                    )

                    .input(
                        "CreatedBy",
                        sql.UniqueIdentifier,
                        userId
                    )

                    .query(`
                        INSERT INTO CategoryMasterMigrationLINE
                        (
                            MigrationLineId,
                            MigrationId,
                            RowNo,
                            CategoryCode,
                            CategoryName,
                            ShortName,
                            NameInOtherLanguage,
                            ImageId,
                            BackColor,
                            ForeColor,
                            isKitchenPrint,
                            isDiscountAllowed,
                            isServiceCharge,
                            IsDispName,
                            isMemberSalesAllowed,
                            IsTaxAllowed,
                            SortCode,
                            isActive,
                            CategoryImage,
                            IsPublished,
                            AvailableTimeFrom,
                            AvailableTimeTo,
                            Remark,
                            Status,
                            CreatedBy,
                            CreatedOn
                        )
                        VALUES
                        (
                            @MigrationLineId,
                            @MigrationId,
                            @RowNo,
                            @CategoryCode,
                            @CategoryName,
                            @ShortName,
                            @NameInOtherLanguage,
                            @ImageId,
                            @BackColor,
                            @ForeColor,
                            @isKitchenPrint,
                            @isDiscountAllowed,
                            @isServiceCharge,
                            @IsDispName,
                            @isMemberSalesAllowed,
                            @IsTaxAllowed,
                            @SortCode,
                            @isActive,
                            @CategoryImage,
                            @IsPublished,
                            @AvailableTimeFrom,
                            @AvailableTimeTo,
                            @Remark,
                            @Status,
                            @CreatedBy,
                            GETDATE()
                        )
                    `);
            }


            // ====================================================
            // COMMIT
            // ====================================================

            await transaction.commit();


            // ====================================================
            // RESPONSE
            // ====================================================

            return res.status(200).json({

                success: true,

                message:
                    "Category migration saved successfully",

                migrationId,

                totalRecords,

                validRecords,

                errorRecords
            });


        } catch (transactionError) {

            try {

                await transaction.rollback();

            } catch (rollbackError) {

                console.error(
                    "Rollback error:",
                    rollbackError
                );
            }


            throw transactionError;
        }


    } catch (error) {

        console.error(
            "Category migration save error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to save category migration"
        });
    }
});


// ============================================================
// POST CATEGORY MASTER MIGRATION
// ============================================================

router.post(
    "/post/:migrationId",
    async (req, res) => {

        try {

            const {
                migrationId
            } = req.params;


            const {
                userId
            } = req.body;


            // ==================================================
            // VALIDATION
            // ==================================================

            if (!migrationId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "MigrationId is required"
                });
            }


            if (!userId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "UserId is required"
                });
            }


            // ==================================================
            // EXECUTE STORED PROCEDURE
            // ==================================================

            const pool =
                await poolPromise;


            const result =
                await pool
                    .request()

                    .input(
                        "MigrationId",
                        sql.UniqueIdentifier,
                        migrationId
                    )

                    .input(
                        "PostedBy",
                        sql.UniqueIdentifier,
                        userId
                    )

                    .execute(
                        "sp_PostCategoryMasterMigration"
                    );


            // ==================================================
            // RESPONSE
            // ==================================================

            const response =
                result.recordset?.[0];


            return res.status(200).json({

                success:
                    response?.Success === 1
                        ? true
                        : true,

                message:
                    response?.Message ||
                    "Category migration posted successfully",

                migrationId
            });


        } catch (error) {

            console.error(
                "Category migration post error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to post category migration"
            });
        }
    }
);


module.exports = router;