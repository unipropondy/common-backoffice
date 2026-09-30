const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const os = require("os");

// ================= GET SERVER COMPUTER NAME =================
router.get("/computer-name", (req, res) => {
  try {
    // process.env.COMPUTERNAME = real Windows PC name (e.g. DESKTOP-OAOFV5P)
    // os.hostname() may return Docker container ID when running in a container
    const hostname =
      process.env.COMPUTERNAME ||
      process.env.HOSTNAME ||
      os.hostname();
    res.json({ computerName: hostname });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch computer name" });
  }
});

// ================= GET ALL TERMINALS =================
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM dbo.TerminalMaster ORDER BY TerminalCode");
    res.json(result.recordset);
  } catch (err) {
    console.error("GET Terminals Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ================= GET DRAWER PORTS =================
router.get("/drawer-ports", async (req, res) => {
  try {
    const defaultPorts = [
      "USB", "LPT1", "LPT2", "LPT3", "COM1", "COM2", "COM3", "COM4",
      "COM5", "COM6", "COM7", "COM8", "COM9", "E20", "RP"
    ];
    res.json(defaultPorts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch drawer ports" });
  }
});

// ================= GET TERMINAL TYPES =================
router.get("/terminal-types", async (req, res) => {
  try {
    const defaultTypes = ["ORDER", "PAYMENT", "KOT"];
    const pool = await poolPromise;
    const result = await pool.request().query(
      "SELECT DISTINCT RTRIM(TerminalType) AS TerminalType FROM dbo.TerminalMaster WHERE TerminalType IS NOT NULL AND RTRIM(TerminalType) <> ''"
    );
    const dbTypes = (result.recordset || []).map((r) => r.TerminalType);
    const combined = Array.from(new Set([...defaultTypes, ...dbTypes]));
    res.json(combined);
  } catch (err) {
    res.json(["ORDER", "PAYMENT", "KOT"]);
  }
});

// ================= GET LANGUAGES =================
router.get("/languages", async (req, res) => {
  try {
    const defaultLanguages = ["ENGLISH", "CHINESE", "TAMIL"];
    const pool = await poolPromise;
    const result = await pool.request().query(
      "SELECT DISTINCT RTRIM(OtherLanguage) AS Language FROM dbo.TerminalMaster WHERE OtherLanguage IS NOT NULL AND RTRIM(OtherLanguage) <> ''"
    );
    const dbLangs = (result.recordset || []).map((r) => r.Language);
    const combined = Array.from(new Set([...defaultLanguages, ...dbLangs]));
    res.json(combined);
  } catch (err) {
    res.json(["ENGLISH", "CHINESE", "TAMIL"]);
  }
});

// ================= GET DISPLAY PORTS =================
router.get("/display-ports", async (req, res) => {
  try {
    const defaultPorts = [
      "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "USB", "LPT1", "LPT2", "LPT3"
    ];
    const pool = await poolPromise;
    const result = await pool.request().query(
      "SELECT DISTINCT RTRIM(DisplayPort) AS DisplayPort FROM dbo.TerminalMaster WHERE DisplayPort IS NOT NULL AND RTRIM(DisplayPort) <> ''"
    );
    const dbPorts = (result.recordset || []).map((r) => r.DisplayPort);
    const combined = Array.from(new Set([...defaultPorts, ...dbPorts]));
    res.json(combined);
  } catch (err) {
    res.json(["COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "USB"]);
  }
});

// ================= GET DISPLAY TYPES =================
router.get("/display-types", async (req, res) => {
  try {
    const defaultTypes = ["PartnerTech", "RetailPos", "PosiFlex", "Others"];
    const pool = await poolPromise;
    const result = await pool.request().query(
      "SELECT DISTINCT RTRIM(DisplayType) AS DisplayType FROM dbo.TerminalMaster WHERE DisplayType IS NOT NULL AND RTRIM(DisplayType) <> ''"
    );
    const dbTypes = (result.recordset || []).map((r) => r.DisplayType);
    const combined = Array.from(new Set([...defaultTypes, ...dbTypes]));
    res.json(combined);
  } catch (err) {
    res.json(["PartnerTech", "RetailPos", "PosiFlex", "Others"]);
  }
});

// ================= GET CAMERA PORTS =================
router.get("/camera-ports", async (req, res) => {
  try {
    const defaultPorts = ["COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "USB"];
    const pool = await poolPromise;
    const result = await pool.request().query(
      "SELECT DISTINCT RTRIM(CameraPort) AS CameraPort FROM dbo.TerminalMaster WHERE CameraPort IS NOT NULL AND RTRIM(CameraPort) <> ''"
    );
    const dbPorts = (result.recordset || []).map((r) => r.CameraPort);
    const combined = Array.from(new Set([...defaultPorts, ...dbPorts]));
    res.json(combined);
  } catch (err) {
    res.json(["COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "USB"]);
  }
});

// ================= GET SECOND DISPLAY PORTS =================
router.get("/second-display-ports", async (req, res) => {
  try {
    const defaultPorts = ["COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "USB"];
    const pool = await poolPromise;
    const result = await pool.request().query(
      "SELECT DISTINCT RTRIM(SecondDisplayPort) AS SecondDisplayPort FROM dbo.TerminalMaster WHERE SecondDisplayPort IS NOT NULL AND RTRIM(SecondDisplayPort) <> ''"
    );
    const dbPorts = (result.recordset || []).map((r) => r.SecondDisplayPort);
    const combined = Array.from(new Set([...defaultPorts, ...dbPorts]));
    res.json(combined);
  } catch (err) {
    res.json(["COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "USB"]);
  }
});

// ================= GET PRINT TYPES =================
router.get("/print-types", async (req, res) => {
  try {
    const defaultTypes = ["NORMAL", "OPOS"];
    const pool = await poolPromise;
    const result = await pool.request().query(
      "SELECT DISTINCT RTRIM(PrintType) AS PrintType FROM dbo.TerminalMaster WHERE PrintType IS NOT NULL AND RTRIM(PrintType) <> ''"
    );
    const dbTypes = (result.recordset || []).map((r) => r.PrintType);
    const combined = Array.from(new Set([...defaultTypes, ...dbTypes]));
    res.json(combined);
  } catch (err) {
    res.json(["NORMAL", "OPOS"]);
  }
});

// ================= GET NETS PORTS =================
router.get("/nets-ports", async (req, res) => {
  try {
    const defaultPorts = ["COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "USB"];
    const pool = await poolPromise;
    const result = await pool.request().query(
      "SELECT DISTINCT RTRIM(NetsPort) AS NetsPort FROM dbo.TerminalMaster WHERE NetsPort IS NOT NULL AND RTRIM(NetsPort) <> ''"
    );
    const dbPorts = (result.recordset || []).map((r) => r.NetsPort);
    const combined = Array.from(new Set([...defaultPorts, ...dbPorts]));
    res.json(combined);
  } catch (err) {
    res.json(["COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "USB"]);
  }
});

// ================= GET IDLE TIME =================
router.get("/idle-time", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(
      "SELECT TOP 1 IdleTime FROM dbo.TerminalMaster WHERE IdleTime IS NOT NULL AND IdleTime > 0"
    );
    if (result.recordset && result.recordset.length > 0 && result.recordset[0].IdleTime) {
      res.json({ idleTime: result.recordset[0].IdleTime });
    } else {
      res.json({ idleTime: 60000 });
    }
  } catch (err) {
    res.json({ idleTime: 60000 });
  }
});

// ================= INSERT TERMINAL =================
router.post("/", async (req, res) => {
  try {
    const {
      TerminalCode,
      TerminalName,
      LocationCode,
      ComputerName,
      TillAmount,
      IdleTime,
      PrinterRequired,
      CashDrawerInterface,
      DrawerPortNo,
      isCustDisplayAttached,
      DisplayPort,
      DisplayType,
      TerminalType,
      PrintType,
      ImagePath,
      isShowCompTotal,
      OtherLangType,
      OtherLanguage,
      isSecondDisplayAttached,
      SecondDisplayPort,
      isCameraAttached,
      CameraPort,
      isSettlementprint,
      isDayendPrint,
      NetsAuto,
      NetsPort,
      AutoCash,
      CashMachineHost,
      CashMachinePort,
      isVoiceEnabled,
    } = req.body;

    if (!TerminalCode || !TerminalCode.toString().trim()) {
      return res.status(400).json({ error: "Terminal Code is required." });
    }

    const pool = await poolPromise;
    await pool.request()
      .input("TerminalCode", sql.VarChar, TerminalCode)
      .input("TerminalName", sql.VarChar, TerminalName || "")
      .input("LocationCode", sql.VarChar, LocationCode || "")
      .input("ComputerName", sql.VarChar, ComputerName || "")
      .input("TillAmount", sql.Decimal(18, 2), TillAmount ? parseFloat(TillAmount) : 0)
      .input("IdleTime", sql.Int, IdleTime ? parseInt(IdleTime, 10) : 0)
      .input("PrinterRequired", sql.Bit, PrinterRequired ? 1 : 0)
      .input("CashDrawerInterface", sql.Bit, CashDrawerInterface ? 1 : 0)
      .input("DrawerPortNo", sql.VarChar, DrawerPortNo || "")
      .input("isCustDisplayAttached", sql.Bit, isCustDisplayAttached ? 1 : 0)
      .input("DisplayPort", sql.VarChar, DisplayPort || "COM1")
      .input("DisplayType", sql.VarChar, DisplayType || "Others")
      .input("TerminalType", sql.VarChar, TerminalType || "")
      .input("PrintType", sql.VarChar, PrintType || "NORMAL")
      .input("ImagePath", sql.VarChar, ImagePath || "")
      .input("isShowCompTotal", sql.Bit, isShowCompTotal ? 1 : 0)
      .input("OtherLangType", sql.Bit, OtherLangType ? 1 : 0)
      .input("OtherLanguage", sql.VarChar, OtherLanguage || "")
      .input("isSecondDisplayAttached", sql.Bit, isSecondDisplayAttached ? 1 : 0)
      .input("SecondDisplayPort", sql.VarChar, SecondDisplayPort || "COM1")
      .input("isCameraAttached", sql.Bit, isCameraAttached ? 1 : 0)
      .input("CameraPort", sql.VarChar, CameraPort || "")
      .input("isSettlementprint", sql.Bit, isSettlementprint ? 1 : 0)
      .input("isDayendPrint", sql.Bit, isDayendPrint ? 1 : 0)
      .input("NetsAuto", sql.Bit, NetsAuto ? 1 : 0)
      .input("NetsPort", sql.VarChar, NetsPort || "COM1")
      .input("AutoCash", sql.Bit, AutoCash ? 1 : 0)
      .input("CashMachineHost", sql.VarChar, CashMachineHost || "localhost")
      .input("CashMachinePort", sql.VarChar, CashMachinePort || "8080")
      .input("isVoiceEnabled", sql.Bit, isVoiceEnabled ? 1 : 0)
      .query(`
        INSERT INTO dbo.TerminalMaster (
          TerminalId, TerminalCode, TerminalName, LocationCode, ComputerName, TillAmount, IdleTime,
          PrinterRequired, CashDrawerInterface, DrawerPortNo, isCustDisplayAttached, DisplayPort, DisplayType, TerminalType,
          PrintType, ImagePath, isShowCompTotal, OtherLangType, OtherLanguage, isSecondDisplayAttached, SecondDisplayPort,
          isCameraAttached, CameraPort, isSettlementprint, isDayendPrint, NetsAuto, NetsPort, AutoCash, CashMachineHost, CashMachinePort,
          isVoiceEnabled, CreateUser, CreateDate
        ) VALUES (
          NEWID(), @TerminalCode, @TerminalName, @LocationCode, @ComputerName, @TillAmount, @IdleTime,
          @PrinterRequired, @CashDrawerInterface, @DrawerPortNo, @isCustDisplayAttached, @DisplayPort, @DisplayType, @TerminalType,
          @PrintType, @ImagePath, @isShowCompTotal, @OtherLangType, @OtherLanguage, @isSecondDisplayAttached, @SecondDisplayPort,
          @isCameraAttached, @CameraPort, @isSettlementprint, @isDayendPrint, @NetsAuto, @NetsPort, @AutoCash, @CashMachineHost, @CashMachinePort,
          @isVoiceEnabled, NEWID(), GETDATE()
        )
      `);

    res.json({ success: true, message: "Terminal created successfully" });
  } catch (err) {
    console.error("POST Terminal Error:", err);
    res.status(500).json({ error: "Failed to create terminal." });
  }
});

// ================= UPDATE TERMINAL =================
router.put("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const {
      TerminalCode,
      TerminalName,
      LocationCode,
      ComputerName,
      TillAmount,
      IdleTime,
      PrinterRequired,
      CashDrawerInterface,
      DrawerPortNo,
      isCustDisplayAttached,
      DisplayPort,
      DisplayType,
      TerminalType,
      PrintType,
      ImagePath,
      isShowCompTotal,
      OtherLangType,
      OtherLanguage,
      isSecondDisplayAttached,
      SecondDisplayPort,
      isCameraAttached,
      CameraPort,
      isSettlementprint,
      isDayendPrint,
      NetsAuto,
      NetsPort,
      AutoCash,
      CashMachineHost,
      CashMachinePort,
      isVoiceEnabled,
    } = req.body;

    const pool = await poolPromise;
    const result = await pool.request()
      .input("ParamCode", sql.VarChar, code)
      .input("TerminalCode", sql.VarChar, TerminalCode || code)
      .input("TerminalName", sql.VarChar, TerminalName || "")
      .input("LocationCode", sql.VarChar, LocationCode || "")
      .input("ComputerName", sql.VarChar, ComputerName || "")
      .input("TillAmount", sql.Decimal(18, 2), TillAmount ? parseFloat(TillAmount) : 0)
      .input("IdleTime", sql.Int, IdleTime ? parseInt(IdleTime, 10) : 0)
      .input("PrinterRequired", sql.Bit, PrinterRequired ? 1 : 0)
      .input("CashDrawerInterface", sql.Bit, CashDrawerInterface ? 1 : 0)
      .input("DrawerPortNo", sql.VarChar, DrawerPortNo || "")
      .input("isCustDisplayAttached", sql.Bit, isCustDisplayAttached ? 1 : 0)
      .input("DisplayPort", sql.VarChar, DisplayPort || "COM1")
      .input("DisplayType", sql.VarChar, DisplayType || "Others")
      .input("TerminalType", sql.VarChar, TerminalType || "")
      .input("PrintType", sql.VarChar, PrintType || "NORMAL")
      .input("ImagePath", sql.VarChar, ImagePath || "")
      .input("isShowCompTotal", sql.Bit, isShowCompTotal ? 1 : 0)
      .input("OtherLangType", sql.Bit, OtherLangType ? 1 : 0)
      .input("OtherLanguage", sql.VarChar, OtherLanguage || "")
      .input("isSecondDisplayAttached", sql.Bit, isSecondDisplayAttached ? 1 : 0)
      .input("SecondDisplayPort", sql.VarChar, SecondDisplayPort || "COM1")
      .input("isCameraAttached", sql.Bit, isCameraAttached ? 1 : 0)
      .input("CameraPort", sql.VarChar, CameraPort || "")
      .input("isSettlementprint", sql.Bit, isSettlementprint ? 1 : 0)
      .input("isDayendPrint", sql.Bit, isDayendPrint ? 1 : 0)
      .input("NetsAuto", sql.Bit, NetsAuto ? 1 : 0)
      .input("NetsPort", sql.VarChar, NetsPort || "COM1")
      .input("AutoCash", sql.Bit, AutoCash ? 1 : 0)
      .input("CashMachineHost", sql.VarChar, CashMachineHost || "localhost")
      .input("CashMachinePort", sql.VarChar, CashMachinePort || "8080")
      .input("isVoiceEnabled", sql.Bit, isVoiceEnabled ? 1 : 0)
      .query(`
        UPDATE dbo.TerminalMaster
        SET TerminalCode = @TerminalCode,
            TerminalName = @TerminalName,
            LocationCode = @LocationCode,
            ComputerName = @ComputerName,
            TillAmount = @TillAmount,
            IdleTime = @IdleTime,
            PrinterRequired = @PrinterRequired,
            CashDrawerInterface = @CashDrawerInterface,
            DrawerPortNo = @DrawerPortNo,
            isCustDisplayAttached = @isCustDisplayAttached,
            DisplayPort = @DisplayPort,
            DisplayType = @DisplayType,
            TerminalType = @TerminalType,
            PrintType = @PrintType,
            ImagePath = @ImagePath,
            isShowCompTotal = @isShowCompTotal,
            OtherLangType = @OtherLangType,
            OtherLanguage = @OtherLanguage,
            isSecondDisplayAttached = @isSecondDisplayAttached,
            SecondDisplayPort = @SecondDisplayPort,
            isCameraAttached = @isCameraAttached,
            CameraPort = @CameraPort,
            isSettlementprint = @isSettlementprint,
            isDayendPrint = @isDayendPrint,
            NetsAuto = @NetsAuto,
            NetsPort = @NetsPort,
            AutoCash = @AutoCash,
            CashMachineHost = @CashMachineHost,
            CashMachinePort = @CashMachinePort,
            isVoiceEnabled = @isVoiceEnabled,
            ModifyDate = GETDATE()
        WHERE RTRIM(TerminalCode) = RTRIM(@ParamCode)
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Terminal not found." });
    }

    res.json({ success: true, message: "Terminal updated successfully" });
  } catch (err) {
    console.error("PUT Terminal Error:", err);
    res.status(500).json({ error: "Failed to update terminal." });
  }
});

// ================= DELETE TERMINAL =================
router.delete("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const cleanCode = (code || "").toString().trim();
    const pool = await poolPromise;
    const result = await pool.request()
      .input("TerminalCode", sql.VarChar, cleanCode)
      .query("DELETE FROM dbo.TerminalMaster WHERE RTRIM(TerminalCode) = RTRIM(@TerminalCode)");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Terminal not found." });
    }

    res.json({ success: true, message: "Terminal deleted successfully" });
  } catch (err) {
    console.error("DELETE Terminal Error:", err);
    res.status(500).json({ error: "Failed to delete terminal." });
  }
});

module.exports = router;

