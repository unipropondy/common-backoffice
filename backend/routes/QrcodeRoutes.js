const express = require("express");

const router = express.Router();

const { sql, poolPromise } = require("../db");


// ================= GET =================

router.get("/", async (req, res) => {

  try {

    console.log("🔥 QR GET HIT");

    const pool = await poolPromise;

    const result = await pool.request()

      .query(`
      
      SELECT
        Id,
        TableId,
        TableNo,
        QRLink
      FROM dbo.QRMaster
      ORDER BY Id DESC
      
      `);

    res.json(result.recordset);

  }

  catch (err) {

    console.error("❌ GET ERROR:", err);

    res.status(500).json({
      error: err.message
    });

  }

});


// ================= INSERT =================

router.post("/", async (req, res) => {

  try {

  const {
  TableId,
  TableNo,
  QRLink
} = req.body;

    if (!TableNo || !QRLink) {

      return res.status(400).send(
        "Missing Fields"
      );

    }

    const pool = await poolPromise;

    await pool.request()

    .input(
    "TableId",
    sql.UniqueIdentifier,
    TableId
  )

      .input(
        "TableNo",
        sql.VarChar,
        TableNo
      )

      .input(
        "QRLink",
        sql.VarChar,
        QRLink
      )

      .query(`

        INSERT INTO dbo.QRMaster
        (
         TableId,
          TableNo,
          QRLink
        )
        VALUES
        (
        @TableId,
          @TableNo,
          @QRLink
        )

      `);

    res.send(
      "Inserted Successfully"
    );

  }

  catch (err) {

    console.error(
      "❌ INSERT ERROR:",
      err
    );

    res.status(500).send(
      err.message
    );

  }

});

// ================= DELETE =================

router.delete("/:id", async (req, res) => {

  try {

    console.log("🔥 DELETE HIT");

    const pool = await poolPromise;

    await pool.request()

      .input("Id", sql.Int, req.params.id)

      .query(`
      
        DELETE FROM dbo.QRMaster
        WHERE Id = @Id
      
      `);

    res.json({
      message: "Deleted Successfully"
    });

  }

  catch (err) {

    console.error("❌ DELETE ERROR:", err);

    res.status(500).json({
      error: err.message
    });

  }

});


// ================= UPDATE =================

router.put("/:id", async (req, res) => {

  try {

    const {
  TableId,
  TableNo,
  QRLink
} = req.body;

    const { id } = req.params;

    console.log("🔥 UPDATE HIT:", id);

    const pool = await poolPromise;

    const result = await pool.request()

      .input("Id", sql.Int, id)

       .input(
    "TableId",
    sql.UniqueIdentifier,
    TableId
  )

      .input("TableNo", sql.VarChar, TableNo)

    //   .input("QRCode", sql.VarChar, QRCode)
.input("QRLink", sql.VarChar, QRLink)
      .query(`

        UPDATE dbo.QRMaster

        SET
        
           TableId = @TableId,   
          TableNo = @TableNo,

          QRLink  = @QRLink 

        WHERE Id = @Id

      `);

    console.log(
      "Rows affected:",
      result.rowsAffected[0]
    );

    if (result.rowsAffected[0] === 0) {

      return res.status(404).json({

        error: "No record found"

      });

    }

    res.json({

      message: "Updated Successfully"

    });

  }

  catch (err) {

    console.error("❌ UPDATE ERROR:", err);

    res.status(500).json({
      error: err.message
    });

  }

});


module.exports = router;