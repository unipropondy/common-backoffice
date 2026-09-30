import React, { useState, useEffect } from "react";
import "./StockEntryPurRet.css";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { BASE_URL } from "../config/api";

export default function StockEntryPurRet() {

  const navigate = useNavigate();
  const { tranNo } = useParams();

  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();

  const [rows, setRows] = useState([]);

  // 🔥 PURRET
  const [header, setHeader] = useState({
    tranNo: "PR00000001",
    vendorCode: "",
    vendorName: "",
    gstType: "",
    tranDate: `${year}-${month}-${day}`,
    tranType: "PURRET"
  });

  const [entry, setEntry] = useState({
    itemCode: "",
    desc: "",
    qty: "",
    price: "",
    total: ""
  });

  const handleChange = (field, value) => {
    const updated = { ...entry, [field]: value };
    const qty = Number(updated.qty || 0);
    const price = Number(updated.price || 0);
    updated.total = qty * price;
    setEntry(updated);
  };

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

  const deleteRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

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

      alert("Purchase Return Saved ✅");
      setRows([]);

    } catch (err) {
      console.error(err);
      alert("Save Failed ❌");
    }
  };

  const handleExit = () => {
    navigate("/StockPage");
  };

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
    <div className="ret_trans-container">

      <h2 className="ret_trans-title">Purchase Return</h2>

      <div className="ret_trans-header-box">

        <div className="ret_trans-header-row">
          <label>Tran No</label>
          <input value={header.tranNo} readOnly className="ret_trans-box" />

          <label>Vendor Code</label>
          <input
            className="ret_trans-box"
            value={header.vendorCode}
            onChange={(e) =>
              setHeader({ ...header, vendorCode: e.target.value })
            }
          />

          <input
            className="ret_trans-box ret_trans-long"
            value={header.vendorName}
            onChange={(e) =>
              setHeader({ ...header, vendorName: e.target.value })
            }
          />

          <label>GST TYPE</label>
          <input
            className="ret_trans-box ret_trans-small"
            value={header.gstType}
            onChange={(e) =>
              setHeader({ ...header, gstType: e.target.value })
            }
          />
        </div>

        <div className="ret_trans-header-row">
          <label>Date</label>
          <input value={day} readOnly className="ret_trans-small" />
          <span>-</span>
          <input value={month} readOnly className="ret_trans-small" />
          <span>-</span>
          <input value={year} readOnly className="ret_trans-small" />
        </div>

        <div className="ret_trans-header-row">
          <label>Tran Type</label>
          <input value={header.tranType} readOnly className="ret_trans-box" />
        </div>

      </div>

      <div className="ret_trans-toolbar">
        <button className="ret_trans-add-btn" onClick={addRow}>+ Add</button>
        <button className="ret_trans-save-btn" onClick={handleSave}>Save</button>
        <button className="ret_trans-exit-btn" onClick={handleExit}>Exit</button>
      </div>

      <div className="ret_trans-grid-box">
        <table className="ret_trans-table">

          <thead>
            <tr>
              <th>ItemCode</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
              <th>Action</th>
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