import React, { useState, useEffect } from "react";
import "./StockPage.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/api";

export default function StockPage() {

  const [activeTab, setActiveTab] = useState("PURORD");
  const [apiData, setApiData] = useState([]);
  const navigate = useNavigate();

  // 🔥 LOAD DATA WHEN TAB CHANGE
useEffect(() => {
  loadData(activeTab);
}, [activeTab]);

const loadData = async (type) => {
  try {
    const res = await axios.get(
      `${BASE_URL}/api/stock?tranType=${type}`
    );
    setApiData(res.data);
  } catch (err) {
    console.error(err);
  }
};

  // 🔥 DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;

    try {
      await axios.delete(`${BASE_URL}/api/stock/${id}`);
      loadData(activeTab); // reload
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="stock-container">

      {/* Header */}
      <div className="stock-header">
        <h1 className="stock-title">Stock Transaction</h1>
      </div>

      {/* Tabs + Right Section */}
      <div className="stock-top-bar">

        {/* Tabs */}
        <div className="stock-tabs">

          <div
            className={activeTab === "PURORD" ? "stock-tab active" : "stock-tab"}
            onClick={() => setActiveTab("PURORD")}
          >
            Purchase Order
          </div>

          <div
            className={activeTab === "PURINV" ? "stock-tab active" : "stock-tab"}
            onClick={() => setActiveTab("PURINV")}
          >
            Purchase
          </div>

          <div
            className={activeTab === "PURRET" ? "stock-tab active" : "stock-tab"}
            onClick={() => setActiveTab("PURRET")}
          >
            Purchase Return
          </div>

        </div>

        {/* Right Section */}
        <div className="stock-right">
          <button
            className="stock-new-btn"
           onClick={() => {
            if (activeTab === "PURINV") {
              navigate("/StockEntryPurInv");
            } else if (activeTab === "PURORD") {
              navigate("/StockEntryPage");
            } else if (activeTab === "PURRET") {
              navigate("/StockEntryPurRet"); // later create pannalaam
            }
          }}
          >
            New
          </button>

          <select className="stock-select">
            <option>10</option>
            <option>25</option>
          </select>
        </div>

      </div>

      {/* Table */}
      <div className="stock-table-box">
        <table className="stock-table">

          <thead>
            <tr>
              <th>Tran No</th>
              <th>Tran Type</th>
              <th>Supplier</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {apiData.length === 0 ? (
              <tr>
                <td colSpan="5" align="center">No Data</td>
              </tr>
            ) : (
              apiData.map((item, i) => (
                <tr key={i}>
                  <td>{item.TranNo}</td>
                  <td>{item.TranType}</td>
                  <td>{item.SupplierName}</td>
                  <td>₹{item.NetAmount}</td>
                  <td>
                    <button
                      className="stock-edit-btn"
                      onClick={() => {
                    if (item.TranType === "PURINV") {
                      navigate(`/StockEntryPurInv/${item.TranNo}`);
                    } else if (item.TranType === "PURORD") {
                      navigate(`/StockEntryPage/${item.TranNo}`);
                    } else if (item.TranType === "PURRET") {
                      navigate(`/StockEntryPurRet/${item.TranNo}`);
                    }
                  }}
                    >
                      Edit
                    </button>

                    <button
                      className="stock-delete-btn"
                      onClick={() => handleDelete(item.TranId)}
                    >
                      Delete
                    </button>
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