import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { BASE_URL } from "../config/api";
import "./Terminal.css";

function CustomSelect({ name, value, onChange, options, placeholder = "", width = "100px" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="custom-dropdown-wrapper" style={{ width }} ref={ref}>
      <div className="custom-dropdown-selected" onClick={() => setOpen(!open)}>
        <span>{value || placeholder}</span>
        <span className="custom-dropdown-arrow">▾</span>
      </div>

      {open && (
        <div className="custom-dropdown-menu">
          <div
            className="custom-dropdown-item"
            onClick={() => {
              onChange({ target: { name, value: "" } });
              setOpen(false);
            }}
          >
            &nbsp;
          </div>
          {options.map((opt) => (
            <div
              key={opt}
              className={`custom-dropdown-item ${value === opt ? "selected" : ""}`}
              onClick={() => {
                onChange({ target: { name, value: opt } });
                setOpen(false);
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Terminal({ sidebarOpen }) {
  const [currentScreen, setCurrentScreen] = useState("list");
  const [selectedTerminal, setSelectedTerminal] = useState(null);
  const [terminals, setTerminals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listSearchFilter, setListSearchFilter] = useState("");

  const initialFormData = {
    TerminalId: null,
    TerminalCode: "",
    TerminalName: "",
    LocationCode: "",
    ComputerName: "",
    TillAmount: 0,
    IdleTime: 0,
    PrinterRequired: false,
    CashDrawerInterface: false,
    DrawerPortNo: "",
    isCustDisplayAttached: false,
    DisplayPort: "COM1",
    DisplayType: "Others",
    TerminalType: "",
    PrintType: "NORMAL",
    ImagePath: "",
    isShowCompTotal: false,
    OtherLangType: false,
    OtherLanguage: "",
    isSecondDisplayAttached: false,
    SecondDisplayPort: "COM1",
    isCameraAttached: false,
    CameraPort: "",
    isSettlementprint: false,
    isDayendPrint: false,
    NetsAuto: false,
    NetsPort: "COM1",
    AutoCash: false,
    CashMachineHost: "localhost",
    CashMachinePort: "8080",
    isVoiceEnabled: false,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [showHelpSearch, setShowHelpSearch] = useState(false);
  const [helpSearchText, setHelpSearchText] = useState("");
  const [hoveredHelpRow, setHoveredHelpRow] = useState(null);
  const [fetchingComputerName, setFetchingComputerName] = useState(false);
  const [drawerPorts, setDrawerPorts] = useState([
    "USB", "LPT1", "LPT2", "LPT3", "COM1", "COM2", "COM3", "COM4",
    "COM5", "COM6", "COM7", "COM8", "COM9", "E20", "RP"
  ]);
  const [terminalTypes, setTerminalTypes] = useState(["ORDER", "PAYMENT", "KOT"]);
  const [languages, setLanguages] = useState(["ENGLISH", "CHINESE", "TAMIL"]);
  const [displayPorts, setDisplayPorts] = useState([
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "USB"
  ]);
  const [displayTypes, setDisplayTypes] = useState(["PartnerTech", "RetailPos", "PosiFlex", "Others"]);
  const [cameraPorts, setCameraPorts] = useState([
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "USB"
  ]);
  const [secondDisplayPorts, setSecondDisplayPorts] = useState([
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "USB"
  ]);
  const [printTypes, setPrintTypes] = useState(["NORMAL", "OPOS"]);
  const [netsPorts, setNetsPorts] = useState([
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "USB"
  ]);

  const filteredHelpTerminals = terminals.filter((t) => {
    if (!helpSearchText.trim()) return true;
    const query = helpSearchText.toLowerCase();
    const code = (t.TerminalCode || "").toString().toLowerCase();
    const name = (t.TerminalName || "").toString().toLowerCase();
    const location = (t.LocationCode || "").toString().toLowerCase();
    return code.includes(query) || name.includes(query) || location.includes(query);
  });

  const filteredListTerminals = terminals.filter((t) => {
    if (!listSearchFilter.trim()) return true;
    const query = listSearchFilter.toLowerCase();
    const code = (t.TerminalCode || "").toString().toLowerCase();
    const name = (t.TerminalName || "").toString().toLowerCase();
    const computer = (t.ComputerName || "").toString().toLowerCase();
    const type = (t.TerminalType || "").toString().toLowerCase();
    return code.includes(query) || name.includes(query) || computer.includes(query) || type.includes(query);
  });

  const fetchTerminals = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/terminal`);
      const cleaned = (res.data || []).map((t) => ({
        ...t,
        TerminalCode: (t.TerminalCode || "").toString().trim(),
        TerminalName: (t.TerminalName || "").toString().trim(),
        LocationCode: (t.LocationCode || "").toString().trim(),
        ComputerName: (t.ComputerName || "").toString().trim(),
        DrawerPortNo: (t.DrawerPortNo || "").toString().trim(),
        OtherLanguage: (t.OtherLanguage || "").toString().trim(),
        DisplayPort: (t.DisplayPort || "COM1").toString().trim(),
        DisplayType: (t.DisplayType || "Others").toString().trim(),
        CameraPort: (t.CameraPort || "").toString().trim(),
        SecondDisplayPort: (t.SecondDisplayPort || "COM1").toString().trim(),
        PrintType: (t.PrintType || "NORMAL").toString().trim(),
        NetsPort: (t.NetsPort || "COM1").toString().trim(),
        CashMachineHost: (t.CashMachineHost || "localhost").toString().trim(),
        CashMachinePort: (t.CashMachinePort || "8080").toString().trim(),
        IdleTime: t.IdleTime !== undefined && t.IdleTime !== null ? t.IdleTime : 60000,
      }));
      setTerminals(cleaned);
    } catch (err) {
      console.error("Error fetching terminals:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrawerPorts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/terminal/drawer-ports`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setDrawerPorts(res.data);
      }
    } catch (err) {
      console.error("Error fetching drawer ports:", err);
    }
  };

  const fetchTerminalTypes = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/terminal/terminal-types`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setTerminalTypes(res.data);
      }
    } catch (err) {
      console.error("Error fetching terminal types:", err);
    }
  };

  const fetchLanguages = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/terminal/languages`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setLanguages(res.data);
      }
    } catch (err) {
      console.error("Error fetching languages:", err);
    }
  };

  const fetchDisplayPorts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/terminal/display-ports`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setDisplayPorts(res.data);
      }
    } catch (err) {
      console.error("Error fetching display ports:", err);
    }
  };

  const fetchDisplayTypes = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/terminal/display-types`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setDisplayTypes(res.data);
      }
    } catch (err) {
      console.error("Error fetching display types:", err);
    }
  };

  const fetchCameraPorts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/terminal/camera-ports`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setCameraPorts(res.data);
      }
    } catch (err) {
      console.error("Error fetching camera ports:", err);
    }
  };

  const fetchSecondDisplayPorts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/terminal/second-display-ports`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setSecondDisplayPorts(res.data);
      }
    } catch (err) {
      console.error("Error fetching second display ports:", err);
    }
  };

  const fetchPrintTypes = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/terminal/print-types`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setPrintTypes(res.data);
      }
    } catch (err) {
      console.error("Error fetching print types:", err);
    }
  };

  const fetchNetsPorts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/terminal/nets-ports`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setNetsPorts(res.data);
      }
    } catch (err) {
      console.error("Error fetching nets ports:", err);
    }
  };

  const fetchDefaultIdleTime = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/terminal/idle-time`);
      if (res.data && res.data.idleTime !== undefined) {
        setFormData((prev) => ({
          ...prev,
          IdleTime: prev.IdleTime !== undefined && prev.IdleTime !== null && prev.IdleTime !== "" ? prev.IdleTime : res.data.idleTime,
        }));
      }
    } catch (err) {
      console.error("Error fetching idle time:", err);
    }
  };

  const openHelpSearch = () => {
    fetchTerminals();
    setHelpSearchText("");
    setShowHelpSearch(true);
  };

  const fetchComputerName = async () => {
    try {
      setFetchingComputerName(true);
      const res = await axios.get(
      "http://127.0.0.1:5050/computer-name"
    );
          if (res.data && res.data.computerName) {
        setFormData((prev) => ({ ...prev, ComputerName: res.data.computerName }));
      }
    } catch (err) {
      console.error("Error fetching computer name:", err);
      alert("Could not retrieve computer name from server.");
    } finally {
      setFetchingComputerName(false);
    }
  };

  useEffect(() => {
    fetchTerminals();
    fetchDrawerPorts();
    fetchTerminalTypes();
    fetchLanguages();
    fetchDisplayPorts();
    fetchDisplayTypes();
    fetchCameraPorts();
    fetchSecondDisplayPorts();
    fetchPrintTypes();
    fetchNetsPorts();
    fetchDefaultIdleTime();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSave = async () => {
    const code = (formData.TerminalCode || "").toString().trim();
    if (!code) {
      alert("Terminal Code is required.");
      return;
    }

    try {
      const existing = terminals.find(
        (t) => (t.TerminalCode || "").toString().trim().toLowerCase() === code.toLowerCase()
      );

      if (selectedTerminal || existing) {
        const targetCode = selectedTerminal
          ? selectedTerminal.TerminalCode.toString().trim()
          : existing.TerminalCode.toString().trim();
        await axios.put(
          `${BASE_URL}/api/terminal/${encodeURIComponent(targetCode)}`,
          formData
        );
        alert("Terminal updated successfully!");
      } else {
        await axios.post(`${BASE_URL}/api/terminal`, formData);
        alert("Terminal created successfully!");
      }
      await fetchTerminals();
      setCurrentScreen("list");
      setSelectedTerminal(null);
    } catch (err) {
      console.error("Error saving terminal:", err);
      alert(err.response?.data?.error || "Failed to save terminal settings.");
    }
  };

  const handleDelete = async () => {
    const code = (selectedTerminal?.TerminalCode || formData.TerminalCode || "").toString().trim();
    if (!code) {
      alert("No terminal code selected to delete.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete terminal ${code}?`)) {
      return;
    }

    try {
      await axios.delete(
        `${BASE_URL}/api/terminal/${encodeURIComponent(code)}`
      );
      alert("Terminal deleted successfully!");
      await fetchTerminals();
      setCurrentScreen("list");
      setSelectedTerminal(null);
      setFormData(initialFormData);
    } catch (err) {
      console.error("Error deleting terminal:", err);
      alert(err.response?.data?.error || "Failed to delete terminal.");
    }
  };

  const handleNew = () => {
    setSelectedTerminal(null);
    setFormData(initialFormData);
    setCurrentScreen("form");
  };

  const selectTerminal = (terminal) => {
    setFormData({
      ...initialFormData,
      ...terminal,
      DrawerPortNo: (terminal.DrawerPortNo || "").toString().trim(),
      OtherLanguage: (terminal.OtherLanguage || "").toString().trim(),
      DisplayPort: (terminal.DisplayPort || "COM1").toString().trim(),
      DisplayType: (terminal.DisplayType || "Others").toString().trim(),
      CameraPort: (terminal.CameraPort || "").toString().trim(),
      SecondDisplayPort: (terminal.SecondDisplayPort || "COM1").toString().trim(),
      PrintType: (terminal.PrintType || "NORMAL").toString().trim(),
      NetsPort: (terminal.NetsPort || "COM1").toString().trim(),
      CashMachineHost: (terminal.CashMachineHost || "localhost").toString().trim(),
      CashMachinePort: (terminal.CashMachinePort || "8080").toString().trim(),
      IdleTime: terminal.IdleTime !== undefined && terminal.IdleTime !== null ? terminal.IdleTime : 60000,
      PrinterRequired: !!terminal.PrinterRequired,
      CashDrawerInterface: !!terminal.CashDrawerInterface,
      isCustDisplayAttached: !!terminal.isCustDisplayAttached,
      isShowCompTotal: !!terminal.isShowCompTotal,
      OtherLangType: !!terminal.OtherLangType,
      isSecondDisplayAttached: !!terminal.isSecondDisplayAttached,
      isCameraAttached: !!terminal.isCameraAttached,
      isSettlementprint: !!terminal.isSettlementprint,
      isDayendPrint: !!terminal.isDayendPrint,
      NetsAuto: !!terminal.NetsAuto,
      AutoCash: !!terminal.AutoCash,
      isVoiceEnabled: !!terminal.isVoiceEnabled,
    });
    setSelectedTerminal(terminal);
    setCurrentScreen("form");
  };

  return (
    <div className={`terminal-page ${sidebarOpen ? "sidebar-open" : ""}`}>
      {/* LIST SCREEN */}
      {currentScreen === "list" && (
        <div className="terminal-container">
          {/* HEADER CONTROL BAR */}
          <div className="terminal-header-bar">
            <div className="header-title-section">
              <h2 className="terminal-page-title">Terminal Management</h2>
              <span className="terminal-page-subtitle">Configure cash registers, receipt printers & hardware ports</span>
            </div>

            <div className="header-action-section">
              <div className="search-box-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="terminal-search-input"
                  placeholder="Search terminal, PC, or type..."
                  value={listSearchFilter}
                  onChange={(e) => setListSearchFilter(e.target.value)}
                />
                {listSearchFilter && (
                  <button className="clear-search-btn" onClick={() => setListSearchFilter("")}>✕</button>
                )}
              </div>
              <button className="terminal-new-btn" onClick={handleNew}>
                <span className="plus-icon">+</span> Add New Terminal
              </button>
            </div>
          </div>

          {/* TERMINALS TABLE */}
          <div className="table-responsive-container">
            <table className="terminal-table">
              <thead>
                <tr>
                  <th>Terminal Code</th>
                  <th>Terminal Name</th>
                  <th>Computer Name</th>
                  <th>Till Amount</th>
                  <th>Type</th>
                  <th>Idle Time</th>
                  <th>Peripherals</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="table-loading-cell">
                      <div className="table-spinner"></div>
                      <span>Loading registers...</span>
                    </td>
                  </tr>
                ) : filteredListTerminals.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="table-empty-cell">
                      <div className="empty-icon">📁</div>
                      <span>No terminal records found</span>
                    </td>
                  </tr>
                ) : (
                  filteredListTerminals.map((t, i) => {
                    const typeUpper = (t.TerminalType || "GENERAL").toUpperCase();
                    let badgeClass = "badge-general";
                    if (typeUpper === "PAYMENT") badgeClass = "badge-payment";
                    if (typeUpper === "ORDER") badgeClass = "badge-order";
                    if (typeUpper === "KOT") badgeClass = "badge-kot";

                    return (
                      <tr key={t.TerminalId || t.TerminalCode || i} className="terminal-table-row">
                        <td className="font-semibold text-primary">{t.TerminalCode}</td>
                        <td>{t.TerminalName}</td>
                        <td className="text-secondary">{t.ComputerName || "-"}</td>
                        <td>${parseFloat(t.TillAmount || 0).toFixed(2)}</td>
                        <td>
                          <span className={`type-badge ${badgeClass}`}>
                            {t.TerminalType || "STANDARD"}
                          </span>
                        </td>
                        <td>{t.IdleTime ? `${t.IdleTime} ms` : "-"}</td>
                        <td>
                          <div className="peripherals-pill-group">
                            {t.PrinterRequired && <span className="p-pill" title="Printer Required">🖨️</span>}
                            {t.CashDrawerInterface && <span className="p-pill" title="Cash Drawer Enabled">💵</span>}
                            {t.isCustDisplayAttached && <span className="p-pill" title="Customer Display Attached">🖥️</span>}
                            {t.NetsAuto && <span className="p-pill" title="Nets Auto Connected">💳</span>}
                            {!t.PrinterRequired && !t.CashDrawerInterface && !t.isCustDisplayAttached && !t.NetsAuto && (
                              <span className="p-pill-none">-</span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <div className="action-buttons-wrapper">
                            <button
                              className="action-btn edit-btn"
                              title="Edit Terminal"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectTerminal(t);
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              className="action-btn delete-btn"
                              title="Delete Terminal"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTerminal(t);
                                handleDelete();
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {currentScreen === "form" && (
        <div className="terminal-form-overlay">
          <div className="terminal-form-modal">
            {/* MODAL HEADER */}
            <div className="modal-header-container">
              <div className="modal-title-box">
                <div className="modal-header-icon">{selectedTerminal ? "✏️" : "✨"}</div>
                <div>
                  <h2 className="terminal-form-title">
                    {selectedTerminal ? `Edit Terminal: ${selectedTerminal.TerminalCode}` : "New Terminal Setup"}
                  </h2>
                  <span className="modal-header-subtitle">Configure register settings, hardware ports & automatic features</span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-x"
                onClick={() => setCurrentScreen("list")}
              >
                ✕
              </button>
            </div>

            {/* MODAL FORM BODY */}
            <div className="terminal-form-body">
              {/* SECTION 1: CORE CONFIGURATION */}
              <div className="form-section-card">
                <div className="section-card-header">
                  <span className="section-icon">⚙️</span>
                  <h3 className="section-title">Core & Register Details</h3>
                </div>

                <div className="form-grid-3col">
                  {/* Terminal Code */}
                  <div className="form-group-item">
                    <label className="terminal-group-label">Terminal Code <span className="req-star">*</span></label>
                    <div className="terminal-field-group">
                      <input
                        className="terminal-input terminal-input-medium"
                        name="TerminalCode"
                        value={formData.TerminalCode || ""}
                        onChange={handleInputChange}
                        disabled={!!selectedTerminal}
                        placeholder="e.g. T1"
                      />
                      <button
                        type="button"
                        className="terminal-small-btn"
                        onClick={openHelpSearch}
                        title="Lookup Existing Terminals"
                      >
                        ...
                      </button>
                    </div>
                  </div>

                  {/* Terminal Name */}
                  <div className="form-group-item">
                    <label className="terminal-group-label">Terminal Name</label>
                    <input
                      className="terminal-input"
                      name="TerminalName"
                      value={formData.TerminalName || ""}
                      onChange={handleInputChange}
                      placeholder="e.g. Cashier Counter 1"
                    />
                  </div>

                  {/* Location Code */}
                  <div className="form-group-item">
                    <label className="terminal-group-label">Location Code</label>
                    <input
                      className="terminal-input"
                      name="LocationCode"
                      value={formData.LocationCode || ""}
                      onChange={handleInputChange}
                      placeholder="HQ"
                    />
                  </div>

                  {/* Computer Name */}
                  <div className="form-group-item">
                    <label className="terminal-group-label">Computer Name</label>
                    <div className="terminal-field-group">
                      <input
                        className="terminal-input"
                        name="ComputerName"
                        value={formData.ComputerName || ""}
                        onChange={handleInputChange}
                        placeholder="POS-DESKTOP-01"
                      />
                      <button
                        type="button"
                        className="terminal-icon-btn fetch-pc-btn"
                        data-tooltip="Auto-fill computer name"
                        onClick={fetchComputerName}
                        disabled={fetchingComputerName}
                      >
                        {fetchingComputerName ? (
                          <span className="pc-btn-spinner" />
                        ) : (
                          <span style={{ fontSize: "16px" }}>💻</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Till Amount */}
                  <div className="form-group-item">
                    <label className="terminal-group-label">Till Amount ($)</label>
                    <input
                      type="number"
                      className="terminal-input"
                      name="TillAmount"
                      value={formData.TillAmount ?? 0}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Terminal Type */}
                  <div className="form-group-item">
                    <label className="terminal-group-label">Terminal Type</label>
                    <select
                      className="terminal-select"
                      name="TerminalType"
                      value={formData.TerminalType || ""}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Type</option>
                      {terminalTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="checkbox-row-container" style={{ marginTop: "12px" }}>
                  <label className="modern-checkbox-label">
                    <input
                      type="checkbox"
                      name="isShowCompTotal"
                      checked={!!formData.isShowCompTotal}
                      onChange={handleCheckboxChange}
                    />
                    <span>Show Computer Total Summary</span>
                  </label>
                </div>
              </div>

              {/* SECTION 2: HARDWARE & PERIPHERALS */}
              <div className="form-section-card">
                <div className="section-card-header">
                  <span className="section-icon">🖨️</span>
                  <h3 className="section-title">Hardware & Peripherals</h3>
                </div>

                <div className="form-grid-2col">
                  {/* Cash Drawer Interface */}
                  <div className="form-group-item">
                    <div className="inline-checkbox-card">
                      <label className="modern-checkbox-label">
                        <input
                          type="checkbox"
                          name="CashDrawerInterface"
                          checked={!!formData.CashDrawerInterface}
                          onChange={handleCheckboxChange}
                        />
                        <span>Cash Drawer Interface</span>
                      </label>
                      {formData.CashDrawerInterface && (
                        <div className="nested-config-box">
                          <label className="terminal-inline-label">Drawer Port No</label>
                          <CustomSelect
                            name="DrawerPortNo"
                            value={formData.DrawerPortNo || ""}
                            onChange={handleInputChange}
                            options={drawerPorts}
                            width="110px"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Printer Required */}
                  <div className="form-group-item">
                    <div className="inline-checkbox-card">
                      <label className="modern-checkbox-label">
                        <input
                          type="checkbox"
                          name="PrinterRequired"
                          checked={!!formData.PrinterRequired}
                          onChange={handleCheckboxChange}
                        />
                        <span>Printer Required</span>
                      </label>
                      {formData.PrinterRequired && (
                        <div className="nested-config-box">
                          <label className="terminal-inline-label">Printer Type</label>
                          <CustomSelect
                            name="PrintType"
                            value={formData.PrintType || "NORMAL"}
                            onChange={handleInputChange}
                            options={printTypes}
                            width="110px"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-grid-2col" style={{ marginTop: "10px" }}>
                  {/* Image Path */}
                  <div className="form-group-item">
                    <label className="terminal-group-label">Image Path</label>
                    <div className="terminal-field-group">
                      <input
                        className="terminal-input"
                        name="ImagePath"
                        value={formData.ImagePath || ""}
                        onChange={handleInputChange}
                        placeholder="D:\UNIPRO\CAFE\BACKOFFICE\BIN\IMAGES\"
                      />
                      <button type="button" className="terminal-icon-btn" title="Browse File Path">
                        🖥️
                      </button>
                    </div>
                  </div>

                  {/* Terminal Idle Time */}
                  <div className="form-group-item">
                    <label className="terminal-group-label">Terminal Idle Time (ms)</label>
                    <input
                      type="number"
                      className="terminal-input"
                      name="IdleTime"
                      value={formData.IdleTime ?? 60000}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: CUSTOMER DISPLAYS & MEDIA */}
              <div className="form-section-card">
                <div className="section-card-header">
                  <span className="section-icon">📺</span>
                  <h3 className="section-title">Displays, Video & Audio</h3>
                </div>

                <div className="form-grid-2col">
                  {/* Display Attached */}
                  <div className="form-group-item">
                    <div className="inline-checkbox-card">
                      <label className="modern-checkbox-label">
                        <input
                          type="checkbox"
                          name="isCustDisplayAttached"
                          checked={!!formData.isCustDisplayAttached}
                          onChange={handleCheckboxChange}
                        />
                        <span>Customer Display Attached</span>
                      </label>
                      {formData.isCustDisplayAttached && (
                        <div className="nested-config-box flex-wrap-gap">
                          <div>
                            <label className="terminal-inline-label">Port</label>
                            <CustomSelect
                              name="DisplayPort"
                              value={formData.DisplayPort || "COM1"}
                              onChange={handleInputChange}
                              options={displayPorts}
                              width="100px"
                            />
                          </div>
                          <div>
                            <label className="terminal-inline-label">Type</label>
                            <CustomSelect
                              name="DisplayType"
                              value={formData.DisplayType || "Others"}
                              onChange={handleInputChange}
                              options={displayTypes}
                              width="110px"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Second Display Attached */}
                  <div className="form-group-item">
                    <div className="inline-checkbox-card">
                      <label className="modern-checkbox-label">
                        <input
                          type="checkbox"
                          name="isSecondDisplayAttached"
                          checked={!!formData.isSecondDisplayAttached}
                          onChange={handleCheckboxChange}
                        />
                        <span>Second Display Attached</span>
                      </label>
                      {formData.isSecondDisplayAttached && (
                        <div className="nested-config-box">
                          <label className="terminal-inline-label">Port</label>
                          <CustomSelect
                            name="SecondDisplayPort"
                            value={formData.SecondDisplayPort || "COM1"}
                            onChange={handleInputChange}
                            options={secondDisplayPorts}
                            width="110px"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-grid-3col" style={{ marginTop: "10px" }}>
                  {/* Camera Attached */}
                  <div className="form-group-item">
                    <div className="inline-checkbox-card">
                      <label className="modern-checkbox-label">
                        <input
                          type="checkbox"
                          name="isCameraAttached"
                          checked={!!formData.isCameraAttached}
                          onChange={handleCheckboxChange}
                        />
                        <span>Camera Attached</span>
                      </label>
                      {formData.isCameraAttached && (
                        <div className="nested-config-box" style={{ marginTop: "6px" }}>
                          <label className="terminal-inline-label">Port</label>
                          <CustomSelect
                            name="CameraPort"
                            value={formData.CameraPort || ""}
                            onChange={handleInputChange}
                            options={cameraPorts}
                            width="100px"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Other Language */}
                  <div className="form-group-item">
                    <div className="inline-checkbox-card">
                      <label className="modern-checkbox-label">
                        <input
                          type="checkbox"
                          name="OtherLangType"
                          checked={!!formData.OtherLangType}
                          onChange={handleCheckboxChange}
                        />
                        <span>Other Language</span>
                      </label>
                      {formData.OtherLangType && (
                        <div className="nested-config-box" style={{ marginTop: "6px" }}>
                          <CustomSelect
                            name="OtherLanguage"
                            value={formData.OtherLanguage || ""}
                            onChange={handleInputChange}
                            options={languages}
                            width="110px"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Voice Enabled */}
                  <div className="form-group-item">
                    <div className="inline-checkbox-card">
                      <label className="modern-checkbox-label">
                        <input
                          type="checkbox"
                          name="isVoiceEnabled"
                          checked={!!formData.isVoiceEnabled}
                          onChange={handleCheckboxChange}
                        />
                        <span>Voice Prompt Enabled</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: AUTOMATION & ELECTRONIC PAYMENTS */}
              <div className="form-section-card">
                <div className="section-card-header">
                  <span className="section-icon">💳</span>
                  <h3 className="section-title">Automation & Payments</h3>
                </div>

                <div className="form-grid-2col">
                  {/* Settlement & Dayend Print */}
                  <div className="form-group-item flex-col-gap8">
                    <label className="modern-checkbox-label">
                      <input
                        type="checkbox"
                        name="isSettlementprint"
                        checked={!!formData.isSettlementprint}
                        onChange={handleCheckboxChange}
                      />
                      <span>Auto Settlement Print (Shift Close)</span>
                    </label>

                    <label className="modern-checkbox-label">
                      <input
                        type="checkbox"
                        name="isDayendPrint"
                        checked={!!formData.isDayendPrint}
                        onChange={handleCheckboxChange}
                      />
                      <span>Auto Dayend Print (Z-Report)</span>
                    </label>
                  </div>

                  {/* Nets Auto */}
                  <div className="form-group-item">
                    <div className="inline-checkbox-card">
                      <label className="modern-checkbox-label">
                        <input
                          type="checkbox"
                          name="NetsAuto"
                          checked={!!formData.NetsAuto}
                          onChange={handleCheckboxChange}
                        />
                        <span>Nets / EFTPOS Auto</span>
                      </label>
                      {formData.NetsAuto && (
                        <div className="nested-config-box">
                          <label className="terminal-inline-label">Port</label>
                          <CustomSelect
                            name="NetsPort"
                            value={formData.NetsPort || "COM1"}
                            onChange={handleInputChange}
                            options={netsPorts}
                            width="110px"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-grid-1col" style={{ marginTop: "10px" }}>
                  {/* Cash Auto */}
                  <div className="inline-checkbox-card">
                    <label className="modern-checkbox-label">
                      <input
                        type="checkbox"
                        name="AutoCash"
                        checked={!!formData.AutoCash}
                        onChange={handleCheckboxChange}
                      />
                      <span>Auto Cash Machine Integration</span>
                    </label>
                    {formData.AutoCash && (
                      <div className="nested-config-box flex-wrap-gap" style={{ marginTop: "8px" }}>
                        <div>
                          <label className="terminal-inline-label">Host</label>
                          <input
                            className="terminal-input terminal-input-host"
                            name="CashMachineHost"
                            value={formData.CashMachineHost || "localhost"}
                            onChange={handleInputChange}
                            placeholder="localhost"
                          />
                        </div>
                        <div>
                          <label className="terminal-inline-label">Port</label>
                          <input
                            className="terminal-input terminal-input-port"
                            name="CashMachinePort"
                            value={formData.CashMachinePort || "8080"}
                            onChange={handleInputChange}
                            placeholder="8080"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* BUTTON BAR */}
            <div className="terminal-button-box">
              <button className="terminal-save-btn" onClick={handleSave}>
                💾 Save Terminal
              </button>
              <button className="terminal-delete-btn" onClick={handleDelete}>
                🗑️ Delete
              </button>
              <button className="terminal-cancel-btn" onClick={() => setCurrentScreen("list")}>
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HELP SEARCH POPUP */}
      {showHelpSearch && (
        <div className="help-search-overlay" onClick={() => setShowHelpSearch(false)}>
          <div className="help-search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="help-search-header">
              <div className="help-search-title">
                <span className="search-title-icon">📋</span>
                <span>Select Terminal Lookup</span>
              </div>
              <div className="help-search-header-controls">
                <button
                  type="button"
                  className="help-search-win-btn"
                  onClick={() => setShowHelpSearch(false)}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="help-search-input-row">
              <span className="help-search-input-label">Filter</span>
              <input
                className="help-search-input-box"
                value={helpSearchText}
                onChange={(e) => setHelpSearchText(e.target.value)}
                placeholder="Search by code, name or location..."
                autoFocus
              />
            </div>

            <div className="help-search-accent-banner"></div>

            <div className="help-search-grid-container">
              <table className="help-search-table">
                <thead>
                  <tr>
                    <th style={{ width: "28px" }}></th>
                    <th>Terminal Code</th>
                    <th>Terminal Name</th>
                    <th>Location Code</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHelpTerminals.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", padding: "16px", color: "#888" }}>
                        No matching terminals found
                      </td>
                    </tr>
                  ) : (
                    filteredHelpTerminals.map((t, idx) => (
                      <tr
                        key={t.TerminalId || t.TerminalCode || idx}
                        onClick={() => {
                          selectTerminal(t);
                          setShowHelpSearch(false);
                        }}
                        onMouseEnter={() => setHoveredHelpRow(idx)}
                        onMouseLeave={() => setHoveredHelpRow(null)}
                      >
                        <td className="help-search-indicator">
                          {hoveredHelpRow === idx ? "▶" : ""}
                        </td>
                        <td className="font-semibold">{t.TerminalCode}</td>
                        <td>{t.TerminalName}</td>
                        <td>{t.LocationCode}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
