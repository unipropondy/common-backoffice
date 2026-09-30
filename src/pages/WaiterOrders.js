import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/config";
import "./WaiterOrders.css";
import {
  FaUserTie,
  FaCalendarAlt,
  FaSearch,
  FaReceipt,
  FaMoneyBillWave,
  FaEye,
  FaTimes,
  FaClock
} from "react-icons/fa";

export default function WaiterOrders({ sidebarOpen }) {
  const singaporeToday = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Singapore"
  });

  const [waiters, setWaiters] = useState([]);
  const [selectedWaiter, setSelectedWaiter] = useState("");
  const [fromDate, setFromDate] = useState(singaporeToday);
  const [toDate, setToDate] = useState(singaporeToday);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch users/waiters list on load
  useEffect(() => {
    const fetchWaiters = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/waiter-orders/users`);
        if (Array.isArray(response.data)) {
          setWaiters(response.data);
          if (response.data.length > 0) {
            setSelectedWaiter(response.data[0].UserName);
          }
        }
      } catch (err) {
        console.error("Failed to fetch waiters:", err);
      }
    };
    fetchWaiters();
  }, []);

  const handleSearch = async () => {
    if (!selectedWaiter) {
      alert("Please select a user / waiter.");
      return;
    }
    if (!fromDate || !toDate) {
      alert("Please select both From Date and To Date.");
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/waiter-orders`, {
        params: {
          userName: selectedWaiter,
          fromDate,
          toDate
        }
      });
      if (Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Failed to fetch waiter orders:", err);
      alert("Failed to fetch waiter orders data.");
    } finally {
      setLoading(false);
    }
  };

  const totalOrdersCount = orders.length;
  const totalOrdersAmount = orders.reduce(
    (sum, item) => sum + (parseFloat(item.SysAmount) || 0),
    0
  );

  return (
    <div className={`waiter-orders-page ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="wo-container">
        {/* Header Card */}
        <div className="wo-header-card">
          <div className="wo-header-left">
            <div className="wo-header-icon-circle">
              <FaUserTie />
            </div>
            <div className="wo-header-title-area">
              <h1>Waiter Orders</h1>
              <p>Filter settlement orders by user and date range</p>
              <div className="wo-header-underline"></div>
            </div>
          </div>
        </div>

        {/* Filter Card */}
        <div className="wo-filter-card">
          <div className="wo-filter-grid">
            <div className="wo-filter-item">
              <label>Select Waiter / User</label>
              <div className="wo-input-wrapper">
                <FaUserTie className="wo-input-icon" />
                <select
                  className="wo-filter-select"
                  value={selectedWaiter}
                  onChange={(e) => setSelectedWaiter(e.target.value)}
                >
                  <option value="">-- Select Waiter --</option>
                  {waiters.map((w) => (
                    <option key={w.UserId} value={w.UserName}>
                      {w.UserName} {w.FullName ? `(${w.FullName})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="wo-filter-item">
              <label>From Date</label>
              <div className="wo-input-wrapper">
                <input
                  type="date"
                  className="wo-filter-date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
            </div>

            <div className="wo-filter-item">
              <label>To Date</label>
              <div className="wo-input-wrapper">
                <input
                  type="date"
                  className="wo-filter-date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>

            <div className="wo-filter-item">
              <button
                className="wo-btn-search"
                onClick={handleSearch}
                disabled={loading}
              >
                <FaSearch /> {loading ? "Loading..." : "Search"}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {searched && (
          <div className="wo-summary-grid">
            <div className="wo-summary-card">
              <div className="wo-summary-icon-box">
                <FaReceipt />
              </div>
              <div className="wo-summary-info">
                <span className="wo-summary-label">Total Orders</span>
                <span className="wo-summary-value">{totalOrdersCount}</span>
              </div>
            </div>

            <div className="wo-summary-card">
              <div className="wo-summary-icon-box">
                <FaMoneyBillWave />
              </div>
              <div className="wo-summary-info">
                <span className="wo-summary-label">Total Amount</span>
                <span className="wo-summary-value">
                  ${totalOrdersAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="wo-table-card">
          <div className="wo-table-wrapper">
            <table className="wo-table">
              <thead>
                <tr>
                  <th>
                    <div className="wo-th-flex">
                      <FaReceipt /> Bill No
                    </div>
                  </th>
                  <th>
                    <div className="wo-th-flex">
                      <FaClock /> Settlement Date & Time
                    </div>
                  </th>
                  <th>
                    <div className="wo-th-flex">
                      <FaMoneyBillWave /> Amount ($)
                    </div>
                  </th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4">
                      <div className="wo-empty-state">
                        <p>Fetching waiter orders data...</p>
                      </div>
                    </td>
                  </tr>
                ) : !searched ? (
                  <tr>
                    <td colSpan="4">
                      <div className="wo-empty-state">
                        <div className="wo-empty-icon-box">
                          <FaUserTie />
                        </div>
                        <h3>Select Waiter and Date Range</h3>
                        <p>Click Search to view settlements processed by the selected waiter.</p>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="4">
                      <div className="wo-empty-state">
                        <div className="wo-empty-icon-box">
                          <FaReceipt />
                        </div>
                        <h3>No Orders Found</h3>
                        <p>No settlement records found for the selected waiter in this date range.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((item, index) => {
                    const billDate = item.LastSettlementDate || item.start_date;
                    const dateFormatted = billDate
                      ? new Date(billDate).toLocaleDateString("en-GB")
                      : "-";
                    const timeFormatted = billDate
                      ? new Date(billDate).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true
                        })
                      : "";

                    return (
                      <tr key={item.SettlementID || index}>
                        <td style={{ fontWeight: "700" }}>{item.BillNo || item.RefNo || "-"}</td>
                        <td>
                          <div className="wo-date-cell">
                            <FaCalendarAlt className="wo-date-cell-icon" />
                            <div className="wo-date-cell-text">
                              <span className="wo-date-main">{dateFormatted}</span>
                              {timeFormatted && (
                                <span className="wo-time-sub">{timeFormatted}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="wo-amount-badge">
                            ${(parseFloat(item.SysAmount) || 0).toFixed(2)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="wo-btn-view-details"
                            onClick={() => setSelectedOrder(item)}
                          >
                            <FaEye /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedOrder && (
        <div className="wo-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="wo-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="wo-modal-header">
              <div className="wo-modal-header-left">
                <FaReceipt style={{ color: "#ff6b00" }} />
                <h2>Order Details</h2>
              </div>
              <button
                className="wo-modal-close-btn"
                onClick={() => setSelectedOrder(null)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="wo-modal-body">
              <div className="wo-modal-info-list">
                <div className="wo-modal-info-item">
                  <span className="wo-modal-info-label">Bill No</span>
                  <span className="wo-modal-info-val">
                    {selectedOrder.BillNo || selectedOrder.RefNo || "-"}
                  </span>
                </div>

                <div className="wo-modal-info-item">
                  <span className="wo-modal-info-label">Settlement Date</span>
                  <span className="wo-modal-info-val">
                    {selectedOrder.LastSettlementDate || selectedOrder.start_date
                      ? new Date(
                          selectedOrder.LastSettlementDate || selectedOrder.start_date
                        ).toLocaleString("en-GB")
                      : "-"}
                  </span>
                </div>

                <div className="wo-modal-info-item">
                  <span className="wo-modal-info-label">Sys Amount</span>
                  <span className="wo-modal-info-val" style={{ color: "#ff6b00" }}>
                    ${(parseFloat(selectedOrder.SysAmount) || 0).toFixed(2)}
                  </span>
                </div>

                {selectedOrder.Cashier && (
                  <div className="wo-modal-info-item">
                    <span className="wo-modal-info-label">Cashier</span>
                    <span className="wo-modal-info-val">{selectedOrder.Cashier}</span>
                  </div>
                )}

                {selectedOrder.MobileNo && (
                  <div className="wo-modal-info-item">
                    <span className="wo-modal-info-label">Mobile No</span>
                    <span className="wo-modal-info-val">{selectedOrder.MobileNo}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="wo-modal-footer">
              <button
                className="wo-btn-modal-close"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
