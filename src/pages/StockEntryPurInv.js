import React, { useState, useEffect } from "react";
import "./StockEntryPurInv.css"; // 🔥 CHANGE
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { BASE_URL } from "../config/api";

export default function StockEntryPurInv() {

  const navigate = useNavigate();
  const { tranNo } = useParams();

  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();

  const [rows, setRows] = useState([]);

  const [header, setHeader] = useState({
    tranNo: "PI00000001",
    vendorCode: "",
    vendorName: "",
    gstType: "",
    tranDate: `${year}-${month}-${day}`,
    tranType: "PURINV"
  });

  const [entry, setEntry] = useState({
    itemCode: "",
    desc: "",
    qty: "",
    price: "",
    total: ""
  });

  // 🔥 CALCULATION
  const handleChange = (field, value) => {
    const updated = { ...entry, [field]: value };

    const qty = Number(updated.qty || 0);
    const price = Number(updated.price || 0);
    updated.total = qty * price;

    setEntry(updated);
  };

  // 🔥 ADD ROW
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

  // 🔥 DELETE ROW (NEW 🔥)
  const deleteRow = (index) => {
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated);
  };

  // 🔥 SAVE
  const handleSave = async () => {

    if (!header.vendorCode) {
      alert("Vendor required");
      return;
    }

    if (rows.length === 0) {
      alert("No Items Added");
      return;
    }

    try {
      await axios.post(`${BASE_URL}/api/stock/save`, {
        header,
        details: rows
      });

      alert("Purchase Invoice Saved ✅");
      setRows([]);

    } catch (err) {
      console.error(err);
      alert("Save Failed ❌");
    }
  };

  const handleExit = () => {
    navigate("/StockPage");
  };

  // 🔥 EDIT LOAD
  const loadEditData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/stock/${tranNo}`);
      const data = res.data;

      setHeader({
        tranNo: data.header.TranNo,
        vendorCode: data.header.SupplierId,
        vendorName: data.header.SupplierName,
        gstType: data.header.GstType,
        tranDate: data.header.TranDate,
        tranType: data.header.TranType
      });

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
    if (tranNo) loadEditData();
  }, [tranNo]);

  return (
    <div className="inv_trans-container">

      <h2 className="inv_trans-title">Purchase Invoice</h2>

      {/* HEADER */}
      <div className="inv_trans-header-box">

        <div className="inv_trans-header-row">
          <label>Tran No</label>
          <input value={header.tranNo} readOnly className="inv_trans-box" />

          <label>Vendor Code</label>
          <input
            className="inv_trans-box"
            value={header.vendorCode}
            onChange={(e) =>
              setHeader({ ...header, vendorCode: e.target.value })
            }
          />

          <input
            className="inv_trans-box inv_trans-long"
            value={header.vendorName}
            onChange={(e) =>
              setHeader({ ...header, vendorName: e.target.value })
            }
          />

          <label>GST TYPE</label>
          <input
            className="inv_trans-box inv_trans-small"
            value={header.gstType}
            onChange={(e) =>
              setHeader({ ...header, gstType: e.target.value })
            }
          />
        </div>

        <div className="inv_trans-header-row">
          <label>Date</label>
          <input value={day} readOnly className="inv_trans-small" />
          <span>-</span>
          <input value={month} readOnly className="inv_trans-small" />
          <span>-</span>
          <input value={year} readOnly className="inv_trans-small" />
        </div>

        <div className="inv_trans-header-row">
          <label>Tran Type</label>
          <input value={header.tranType} readOnly className="inv_trans-box" />
        </div>

      </div>

      {/* TOOLBAR */}
      <div className="inv_trans-toolbar">
        <button className="inv_trans-add-btn" onClick={addRow}>+ Add</button>
        <button className="inv_trans-save-btn" onClick={handleSave}>Save</button>
        <button className="inv_trans-exit-btn" onClick={handleExit}>Exit</button>
      </div>

      {/* TABLE */}
      <div className="inv_trans-grid-box">
        <table className="inv_trans-table">

          <thead>
            <tr>
              <th>ItemCode</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
              <th>Action</th> {/* 🔥 NEW */}
            </tr>
          </thead>

          <tbody>

            {!tranNo && (
              <tr>
                <td><input value={entry.itemCode} onChange={(e)=>handleChange("itemCode",e.target.value)} /></td>
                <td><input value={entry.desc} onChange={(e)=>handleChange("desc",e.target.value)} /></td>
                <td><input value={entry.qty} onChange={(e)=>handleChange("qty",e.target.value)} /></td>
                <td><input value={entry.price} onChange={(e)=>handleChange("price",e.target.value)} /></td>
                <td>{entry.total}</td>
                <td></td>
              </tr>
            )}

            {rows.length === 0 ? (
              <tr>
                <td colSpan="6" align="center">No Data Added</td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i}>
                  <td>{row.itemCode}</td>
                  <td>{row.desc}</td>
                  <td>{row.qty}</td>
                  <td>{row.price}</td>
                  <td>{row.total}</td>
                  <td>
                    <button onClick={() => deleteRow(i)}>❌</button>
                  </td>
                </tr>
              ))
            )}

          </tbody>

        </table>
      </div>

    </div>
  );
}