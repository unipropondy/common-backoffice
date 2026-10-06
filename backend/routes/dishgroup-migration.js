const express = require("express");
const router = express.Router();

const { sql, poolPromise } = require("../db");
const { v4: uuidv4 } = require("uuid");

// =====================================================
// SAVE DISH GROUP MIGRATION
// =====================================================
router.post("/save", async (req, res) => {
    try {

        const {
            fileName,
            records,
            userId
        } = req.body;

        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------
        if (!records || records.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No migration records received."
            });
        }

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "UserId is required."
            });
        }

        const pool = await poolPromise;

        const migrationId = uuidv4();

        // -------------------------------------------------
        // COUNTS
        // -------------------------------------------------
        const totalRecords = records.length;

        const validRecords = records.filter(
            r => r.Status === "VALID"
        ).length;

        const errorRecords = records.filter(
            r => r.Status === "ERROR"
        ).length;

        // -------------------------------------------------
        // HEADER
        // -------------------------------------------------
        await pool.request()

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
                "PENDING"
            )

            .input(
                "CreatedBy",
                sql.UniqueIdentifier,
                userId
            )

            .query(`
                INSERT INTO DishGROUPMasterMigrationHeader
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

        // -------------------------------------------------
        // LINE
        // -------------------------------------------------
        for (const record of records) {

            await pool.request()

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
                    record.RowNo
                )

                .input(
                    "DishGroupCode",
                    sql.VarChar(100),
                    record.DishGroupCode || null
                )

                .input(
                    "DishGroupName",
                    sql.NVarChar(255),
                    record.DishGroupName || null
                )

                .input(
                    "IsActive",
                    sql.Bit,
                    record.IsActive
                )

                .input(
                    "SortCode",
                    sql.Numeric(18, 0),
                    record.SortCode || 0
                )

                .input(
                    "CategoryId",
                    sql.UniqueIdentifier,
                    record.CategoryId || null
                )

                .input(
                    "Remark",
                    sql.NVarChar(1000),
                    record.Remark || null
                )

                .input(
                    "Status",
                    sql.VarChar(20),
                    record.Status
                )

                .input(
                    "CreatedBy",
                    sql.UniqueIdentifier,
                    userId
                )

                .query(`
                    INSERT INTO DishGROUPMasterMigrationLINE
                    (
                        MigrationLineId,
                        MigrationId,
                        RowNo,
                        DishGroupCode,
                        DishGroupName,
                        IsActive,
                        SortCode,
                        CategoryId,
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
                        @DishGroupCode,
                        @DishGroupName,
                        @IsActive,
                        @SortCode,
                        @CategoryId,
                        @Remark,
                        @Status,
                        @CreatedBy,
                        GETDATE()
                    )
                `);
        }

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------
        return res.json({
            success: true,
            migrationId: migrationId,
            totalRecords: totalRecords,
            validRecords: validRecords,
            errorRecords: errorRecords,
            message: "Dish Group migration records saved successfully."
        });

    } catch (error) {

        console.error(
            "Dish Group migration save error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// =====================================================
// POST DISH GROUP MIGRATION
// =====================================================
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

            // -------------------------------------------------
            // VALIDATION
            // -------------------------------------------------
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: "UserId is required."
                });
            }

            if (!migrationId) {
                return res.status(400).json({
                    success: false,
                    message: "MigrationId is required."
                });
            }

            const pool = await poolPromise;

            // -------------------------------------------------
            // POST STORED PROCEDURE
            // -------------------------------------------------
            const result =
                await pool.request()

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
                        "sp_PostDishGroupMasterMigration"
                    );

            return res.json({
                success: true,
                message:
                    "Dish Group migration posted successfully.",
                data:
                    result.recordset || []
            });

        } catch (error) {

            console.error(
                "Dish Group migration post error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);


module.exports = router;