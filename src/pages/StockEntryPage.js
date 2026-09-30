import React, { useState } from "react";
import "./StockEntryPage.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../config/api";

export default function StockEntryPage() {

  const navigate = useNavigate();
  const { tranNo } = useParams();

   const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    const [rows, setRows] = useState([]);

  const [header, setHeader] = useState({
    tranNo: "P00000001",
    vendorCode: "",
    vendorName: "",
    gstType: "",
    tranDate: "2026-04-15",
    tranType: "PURORD"
  });

  const [entry, setEntry] = useState({
    itemCode: "",
    desc: "",
    qty: "",
    price: "",
    total: ""
  });

  // HANDLE INPUT
  const handleChange = (field, value) => {
    const updated = { ...entry, [field]: value };

    const qty = Number(updated.qty || 0);
    const price = Number(updated.price || 0);
    updated.total = qty * price;

    setEntry(updated);
  };

  // ADD ROW
  const addRow = () => {
    if (!entry.itemCode || !entry.qty || !entry.price) return;

    setRows([...rows, entry]);

    setEntry({
      itemCode: "",
      desc: "",
      qty: "",
      price: "",
      total: ""
    });
  };

  // SAVE (API CALL)
  const handleSave = async () => {

  if (!header.vendorCode) {
    alert("Vendor required");
    return;
  }

  if (rows.length === 0) {
    alert("No Items Added");
    return;
  }

  // 👉 payload create pannunga (IMPORTANT)
  const payload = {
    tranNo: header.tranNo,
    supplierId: header.vendorCode,
    supplierName: header.vendorName,
    tranDate: header.tranDate,
    tranType: header.tranType,
    gstType: header.gstType,
    gstPerc: 7,
    items: rows
  };

  try {
    // 👉 correct API call
    await axios.post(
  `${BASE_URL}/api/stock/save`,
  {
    header,
    details: rows
  }
);

    alert("Saved Successfully ✅");
    setRows([]);

  } catch (err) {
    console.error(err);
    alert("Save Failed ❌");
  }
};

  const handleExit = () => {
  navigate("/StockPage");
};

// const { tranNo } = useParams();

// 🔥 ADD THIS FUNCTION HERE
const loadEditData = async () => {
  try {
    const res = await axios.get(
      `${BASE_URL}/api/stock/${tranNo}`
    );

    const data = res.data;

    // ✅ HEADER
    setHeader({
      tranNo: data.header.TranNo,
      vendorCode: data.header.SupplierId,
      vendorName: data.header.SupplierName,
      gstType: data.header.GstType,
      tranDate: data.header.TranDate,
      tranType: data.header.TranType
    });

    // ✅ DETAILS FIX
    const formattedRows = data.details.map(d => ({
      itemCode: d.ItemCode,
      desc: d.Description,
      qty: d.Qty,
      price: d.Price,
      total: d.Amount
    }));

    setRows(formattedRows);

  } catch (err) {
    console.log("EDIT LOAD ERROR ❌", err);
  }
};

useEffect(() => {
  if (tranNo) {
    loadEditData();
  }
}, [tranNo]);

  return (
    <div className="trans-container">

      <h2 className="trans-title">Stock Transaction</h2>

      {/* HEADER */}
      <div className="trans-header-box">

        <div className="trans-header-row">
          <label>Tran No</label>
          <input value={header.tranNo} readOnly className="trans-box" />
          <button className="trans-small-btn">...</button>

          <label>Vendor Code</label>
         <input
              className="trans-box"
              value={header.vendorCode}   // ✅ ADD THIS
              onChange={(e) =>
                setHeader({ ...header, vendorCode: e.target.value })
              }
            />
          <button className="trans-small-btn">...</button>
          <input
              className="trans-box trans-long"
              value={header.vendorName}   // ✅ ADD THIS
              onChange={(e) =>
                setHeader({ ...header, vendorName: e.target.value })
              }
            />

          <label>GST TYPE</label>
          <input
            className="trans-box trans-small"
            value={header.gstType}   // ✅ ADD THIS
            onChange={(e) =>
              setHeader({ ...header, gstType: e.target.value })
            }
          />
        </div>

        <div className="trans-header-row">
          <label>TranDate</label>
          <input value={day} readOnly className="trans-small" />
          <span>-</span>
          <input value={month} readOnly className="trans-small" />
          <span>-</span>
          <input value={year} readOnly className="trans-small" />
        </div>

        <div className="trans-header-row">
          <label>Tran Type</label>
          <input value={header.tranType} readOnly className="trans-box" />
        </div>

      </div>

      {/* TOOLBAR */}
      <div className="trans-toolbar">
        <button className="trans-add-top-btn" onClick={addRow}>+ Add</button>
        <button className="trans-save-top-btn" onClick={handleSave}>Save</button>

        <button className="trans-exit-btn" onClick={handleExit}>
        Exit
        </button>
      </div>

      {/* TABLE */}
      <div className="trans-grid-box">
        <table className="trans-table">

          <thead>
            <tr>
              <th>ItemCode</th>
              <th>Description</th>
              <th>Gst Type</th>
              <th>Uom</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Disc%</th>
              <th>Disc$</th>
              <th>Foc</th>
              <th>NetPrice</th>
              <th>Total</th>
              <th>Tax</th>
              <th>Gst Amt</th>
              {/* <th>Action</th> */}
            </tr>
          </thead>

          <tbody>

           {!tranNo && (
          <tr className="trans-entry-row">
            <td><input value={entry.itemCode} onChange={(e)=>handleChange("itemCode",e.target.value)} /></td>
            <td><input value={entry.desc} onChange={(e)=>handleChange("desc",e.target.value)} /></td>
            <td>Zero</td>
            <td>Nos</td>
            <td><input value={entry.qty} onChange={(e)=>handleChange("qty",e.target.value)} /></td>
            <td><input value={entry.price} onChange={(e)=>handleChange("price",e.target.value)} /></td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td>{entry.total}</td>
            <td>0</td>
            <td>0</td>
            {/* <td>
              <button className="trans-small-add" onClick={addRow}>+</button>
            </td> */}
          </tr>
          )}

            {rows.length === 0 ? (
              <tr>
                <td colSpan="14" align="center">No Data Added</td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i}>
                  <td>{row.itemCode}</td>
                  <td>{row.desc}</td>
                  <td>Zero</td>
                  <td>Nos</td>
                  <td>{row.qty}</td>
                  <td>{row.price}</td>
                  <td>0</td>
                  <td>0</td>
                  <td>0</td>
                  <td>0</td>
                  <td>{row.total}</td>
                  <td>0</td>
                  <td>0</td>
                  {/* <td></td> */}
                </tr>
              ))
            )}

          </tbody>

        </table>
      </div>

    </div>
  );
}