const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// 🔍 GET
router.get("/", async (req, res) => {
  try {
    console.log("GET HIT");

    const pool = await poolPromise;
    const { section } = req.query;

    let query = `
      SELECT 
        TableId,
        TableNumber,
        Seats,
        Row,
        Col,
        DiningSection,
        ReservationAllowed,
        StartTime,
        EndTime,
        SortCode,
        PrintSection,
        IsTakeAway,
        Status
      FROM TableMaster
      WHERE 1=1
    `;

    const request = pool.request();

    if (section && Number(section) !== 0) {
      query += " AND DiningSection = @section";
      request.input("section", sql.Int, Number(section));
    }

    query += " ORDER BY TableNumber";

    const result = await request.query(query);

    res.json(result.recordset);

  } catch (err) {
    console.error("TABLE GET ERROR:", err);
    res.status(500).send(err.message);
  }
});


// ➕ POST
router.post("/", async (req, res) => {
  try {
    console.log("POST HIT", req.body);

    const {
      TableId,
      TableNumber,
      Seats,
      Row,
      Col,
      DiningSection,
      ReservationAllowed,
      StartTime,
      EndTime,
      SortCode,
      PrintSection,
      IsTakeAway
    } = req.body;

    const pool = await poolPromise;

    let tblId = TableId || require("uuid").v4();

    const exists = await pool.request()
      .input("TableId", sql.UniqueIdentifier, tblId)
      .query("SELECT TableId FROM TableMaster WHERE TableId=@TableId");

    if (exists.recordset.length > 0) {
      // UPDATE
      await pool.request()
        .input("TableId", sql.UniqueIdentifier, tblId)
        .input("TableNumber", sql.VarChar(20), TableNumber)
        .input("Seats", sql.Int, Number(Seats))
        .input("Row", sql.Int, Number(Row) || 0)
        .input("Col", sql.Int, Number(Col) || 0)
        .input("DiningSection", sql.Int, Number(DiningSection))
        .input("ReservationAllowed", sql.Bit, ReservationAllowed ? 1 : 0)
        .input("StartTime", sql.VarChar(5), StartTime || "00:00")
        .input("EndTime", sql.VarChar(5), EndTime || "00:00")
        .input("SortCode", sql.Int, Number(SortCode))
        .input("PrintSection", sql.Int, Number(PrintSection))
        .input("IsTakeAway", sql.Bit, IsTakeAway ? 1 : 0)
        .query(`
          UPDATE TableMaster SET
            TableNumber=@TableNumber,
            Seats=@Seats,
            Row=@Row,
            Col=@Col,
            DiningSection=@DiningSection,
            ReservationAllowed=@ReservationAllowed,
            StartTime=@StartTime,
            EndTime=@EndTime,
            SortCode=@SortCode,
            PrintSection=@PrintSection,
            IsTakeAway=@IsTakeAway
          WHERE TableId=@TableId
        `);

    } else {
      // INSERT
      await pool.request()
        .input("TableId", sql.UniqueIdentifier, tblId)
        .input("TableNumber", sql.VarChar(20), TableNumber)
        .input("Seats", sql.Int, Number(Seats))
        .input("Row", sql.Int, Number(Row) || 0)
        .input("Col", sql.Int, Number(Col) || 0)
        .input("DiningSection", sql.Int, Number(DiningSection))
        .input("ReservationAllowed", sql.Bit, ReservationAllowed ? 1 : 0)
        .input("StartTime", sql.VarChar(5), StartTime || "00:00")
        .input("EndTime", sql.VarChar(5), EndTime || "00:00")
        .input("SortCode", sql.Int, Number(SortCode))
        .input("PrintSection", sql.Int, Number(PrintSection))
        .input("IsTakeAway", sql.Bit, IsTakeAway ? 1 : 0)
        .input("Status", sql.Bit, 1)
        .query(`
          INSERT INTO TableMaster
          (TableId, TableNumber, Seats, Row, Col, DiningSection,
           ReservationAllowed, StartTime, EndTime,
           SortCode, PrintSection, IsTakeAway, Status)
          VALUES
          (@TableId, @TableNumber, @Seats, @Row, @Col, @DiningSection,
           @ReservationAllowed, @StartTime, @EndTime,
           @SortCode, @PrintSection, @IsTakeAway, @Status)
        `);
    }

    res.json({ message: "Saved successfully" });

  } catch (err) {
    console.error("SAVE ERROR:", err);
    res.status(500).send(err.message);
  }
});


// ❌ DELETE
router.delete("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool.request()
      .input("TableId", sql.UniqueIdentifier, req.params.id)
      .query("DELETE FROM TableMaster WHERE TableId=@TableId");

    res.json({ message: "Deleted" });

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

module.exports = router;