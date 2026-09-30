import React, { useState, useEffect } from "react";
import "./PrinterModal.css";
import axios from "axios";
import { BASE_URL } from "../config/api";
export default function PrintMasterPage() {
  const [showModal, setShowModal] = useState(false);
  const [data, setData] = useState([]);

  const [editId, setEditId] = useState(null);

  const [printerTypeList, setPrinterTypeList] = useState([]);
  const [sectionList, setSectionList] = useState([]);
  const [kitchenList, setKitchenList] = useState([]);

  const [form, setForm] = useState({
    PrinterName: "",
    PrinterPath: "",
    PrinterIP: "",
    PrinterType: "",
    PrintSection: "",
    KitchenTypeName: "",
    PrintCopy: "",
    IsActive: true,
  });

   useEffect(() => {
    fetchPrinters();
    fetchLov();
  }, []);

  const fetchLov = async () => {
  try {
    const [typeRes, sectionRes, kitchenRes] = await Promise.all([
      axios.get(`${BASE_URL}/api/printer/printer-type`),
      axios.get(`${BASE_URL}/api/printer/print-section`),
      axios.get(`${BASE_URL}/api/printer/kitchen-type`)
    ]);

    setPrinterTypeList(typeRes.data);
    setSectionList(sectionRes.data);
    setKitchenList(kitchenRes.data);

  } catch (err) {
    console.log(err);
  }
};

  const fetchPrinters = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/printer`);
      console.log(res.data);
      setData(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleEdit = async (item) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/printer/${item.PrinterId}`);

      setForm({
        PrinterName: res.data.PrinterName || "",
        PrinterPath: res.data.PrinterPath || "",
        PrinterIP: res.data.PrinterIP || "",
        PrinterType: res.data.PrinterType || "",
        PrintSection: res.data.PrintSection || "",
        KitchenTypeName: res.data.KitchenTypeName || "",
        PrintCopy: res.data.PrintCopy || "",
        IsActive: res.data.IsActive || false,
      });

      setEditId(item.PrinterId);
      setShowModal(true);

    } catch (err) {
      console.log(err);
    }
  };

   const handleSave = async (e) => {
  e.preventDefault();

  try {
    if (editId) {
      // 🔥 UPDATE
      await axios.put(`${BASE_URL}/api/printer/${editId}`, form);
    } else {
      // 🔥 INSERT
      await axios.post(`${BASE_URL}/api/printer`, form);
    }

    fetchPrinters();

    setForm({
      PrinterName: "",
      PrinterPath: "",
      PrinterIP: "",
      PrinterType: "",
      PrintSection: "",
      KitchenTypeName: "",
      PrintCopy: "",
      IsActive: true,
    });

    setEditId(null);
    setShowModal(false);

  } catch (err) {
    console.log(err);
  }
};

  return (
    <div className="pm-container">

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
       <div className="pm-header-row">
          <h2>Printer Settings</h2>

         <button
        className="pm-new-btn"
        onClick={() => {
  setForm({
    PrinterName: "",
    PrinterPath: "",
    PrinterIP: "",
    PrinterType: "",
    PrintSection: "",
    KitchenTypeValue: "",
    PrintCopy: "",
    IsActive: true,
  });
  setEditId(null);
  setShowModal(true);
}}
      >
        New
      </button>
        </div>
      </div>

      {/* REPORT TABLE */}
      <table className="pm-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>IP</th>
            <th>Type</th>
            <th>Section</th>
            <th>Active</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="5">No Data</td>
            </tr>
          ) : (
            data.map((item, i) => (
              <tr
                key={i}
                onClick={() => handleEdit(item)}
                style={{ cursor: "pointer" }}
              >
                <td>{item.PrinterName}</td>
                <td>{item.PrinterIP}</td>
                <td>{item.PrinterTypeName}</td>
                <td>{item.PrintSectionName}</td>
                <td>{item.IsActive ? "Yes" : "No"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* MODAL */}
      {showModal && (
        <div className="pm-modal-overlay">
          <div className="pm-form">
            <h2>Print Master</h2>

            <form onSubmit={handleSave}>
              <div className="pm-grid">

               <div className="pm-field">
                  <label>Printer Name</label>
                  <input
                    name="PrinterName"
                    value={form.PrinterName}
                    onChange={handleChange}
                  />
                </div>

                <div className="pm-field">
                  <label>Printer Path</label>
                  <input
                    name="PrinterPath"
                    value={form.PrinterPath}
                    onChange={handleChange}
                  />
                </div>

                <div className="pm-field">
                  <label>Printer IP</label>
                  <input
                    name="PrinterIP"
                    value={form.PrinterIP}
                    onChange={handleChange}
                  />
                </div>

                <div className="pm-field">
                  <label>Printer Type</label>
                  <select
                    name="PrinterType"
                    value={form.PrinterType}
                    onChange={handleChange}
                  >
                    <option value="">Select Printer Type</option>
                    {printerTypeList.map((item) => (
                      <option key={item.PickListNumber} value={item.PickListNumber}>
                        {item.PickListValue}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pm-field">
                  <label>Section</label>
                  <select
                    name="PrintSection"
                    value={form.PrintSection}
                    onChange={handleChange}
                  >
                    <option value="">Select Section</option>
                    {sectionList.map((item) => (
                      <option key={item.PickListNumber} value={item.PickListNumber}>
                        {item.PickListValue}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pm-field">
                  <label>Kitchen Type</label>
                  <select
                    name="KitchenTypeName"
                    value={form.KitchenTypeName}
                    onChange={handleChange}
                  >
                    <option value="">Select Kitchen Type</option>
                    {kitchenList.map((item) => (
                      <option key={item.PickListNumber} value={item.PickListNumber}>
                        {item.PickListValue}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pm-field">
                  <label>Print Copy</label>
                  <input
                    type="number"
                    name="PrintCopy"
                    value={form.PrintCopy}
                    onChange={handleChange}
                  />
                </div>

                <label className="pm-checkbox">
                  <input
                    type="checkbox"
                    name="IsActive"
                    checked={form.IsActive}
                    onChange={handleChange}
                  />
                  Active
                </label>

              </div>

              <div className="pm-actions">
                <button type="submit" className="pm-save-btn">Save</button>
                <button type="button" className="pm-cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}