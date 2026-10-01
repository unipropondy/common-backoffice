const express = require("express");
const router = express.Router();

const { sql, poolPromise } = require("../db");
const { v4: uuidv4 } = require("uuid");

// =====================================================
// SAVE DISH MASTER MIGRATION
// =====================================================
router.post("/save", async (req, res) => {
    try {
        const {
            fileName,
            records,
            userId
        } = req.body;

        if (!records || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No Excel records found"
            });
        }

        const pool = await poolPromise;

        const migrationId = uuidv4();

        // ==========================================
        // CREATE HEADER
        // ==========================================

        await pool.request()
            .input("MigrationId", sql.UniqueIdentifier, migrationId)
            .input("FileName", sql.NVarChar(255), fileName || null)
            .input("TotalRecords", sql.Int, records.length)
            .input("CreatedBy", sql.UniqueIdentifier, userId || null)
            .input("CreatedOn", sql.DateTime, new Date())
            .query(`
        INSERT INTO DishMasterMigrationHeader
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
          0,
          0,
          'DRAFT',
          @CreatedBy,
          @CreatedOn
        )
      `);

        // ==========================================
        // INSERT EXCEL ROWS INTO LINE TABLE
        // ==========================================

        for (let i = 0; i < records.length; i++) {

            const row = records[i];

            const migrationLineId = uuidv4();

            await pool.request()
                .input(
                    "MigrationLineId",
                    sql.UniqueIdentifier,
                    migrationLineId
                )
                .input(
                    "MigrationId",
                    sql.UniqueIdentifier,
                    migrationId
                )
                .input(
                    "RowNo",
                    sql.Int,
                    i + 2
                )
                .input(
                    "DishCode",
                    sql.VarChar(20),
                    row.DishCode || null
                )
                .input(
                    "Name",
                    sql.NVarChar(600),
                    row.Name || null
                )
                .input(
                    "IsActive",
                    sql.Bit,
                    row.IsActive === 1 || row.IsActive === true
                )
                .input(
                    "SordCode",
                    sql.Numeric(10, 0),
                    row.SordCode || 0
                )
                .input(
                    "CurrentCost",
                    sql.Decimal(18, 2),
                    row.CurrentCost || 0
                )
                .input(
                    "DishGroupId",
                    sql.UniqueIdentifier,
                    row.DishGroupId || null
                )
                .input(
                    "isServiceCharge",
                    sql.Bit,
                    row.isServiceCharge === 1 ||
                    row.isServiceCharge === true
                )
                .input(
                    "CreatedBy",
                    sql.UniqueIdentifier,
                    userId || null
                )
                .input(
                    "CreatedOn",
                    sql.DateTime,
                    new Date()
                )
                .query(`
          INSERT INTO DishMasterMigrationLine
          (
            MigrationLineId,
            MigrationId,
            RowNo,
            DishCode,
            Name,
            IsActive,
            SordCode,
            CurrentCost,
            DishGroupId,
            isServiceCharge,
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
            @DishCode,
            @Name,
            @IsActive,
            @SordCode,
            @CurrentCost,
            @DishGroupId,
            @isServiceCharge,
            NULL,
            'PENDING',
            @CreatedBy,
            @CreatedOn
          )
        `);
        }

        // ==========================================
        // RESPONSE
        // ==========================================

        res.json({
            success: true,
            message: "Migration saved successfully",
            migrationId
        });

    } catch (err) {

        console.error("DishMaster Migration Save Error:", err);

        res.status(500).json({
            success: false,
            message: err.message || "Migration save failed"
        });
    }
});

module.exports = router;