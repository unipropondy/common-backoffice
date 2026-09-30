import { API_BASE_URL } from "../config/config";
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./MemberMaster.css";

function MemberMaster({ sidebarOpen }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [usageData, setUsageData] = useState({ totalOrders: 0, totalSpent: 0, items: [], recentBills: [] });
  const [loadingUsage, setLoadingUsage] = useState(false);

  const [form, setForm] = useState({
    Name: "",
    Phone: "",
    Email: "",
    Balance: "",
    CreditLimit: "",
    CurrentBalance: "",
    Password: "",
  });

  // ================= FETCH DATA =================
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_BASE_URL + "/api/member");
      setData(res.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageData = async (member) => {
    try {
      setLoadingUsage(true);
      const res = await axios.get(`${API_BASE_URL}/api/member/${member.MemberId}/usage`);
      setUsageData(res.data);
    } catch (err) {
      console.error("Fetch Usage Error:", err);
      setUsageData({ totalOrders: 0, totalSpent: 0, items: [], recentBills: [] });
    } finally {
      setLoadingUsage(false);
    }
  };

  const openUsageModal = (member) => {
    setSelectedMember(member);
    setUsageData({ totalOrders: 0, totalSpent: 0, items: [], recentBills: [] });
    fetchUsageData(member);
    setShowUsageModal(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  // ================= OPEN MODAL =================
  const openModal = (item = null) => {
    if (item) {
      setEditId(item.MemberId);
      setForm({
        Name: item.Name || "",
        Phone: item.Phone || "",
        Email: item.Email || "",
        Balance: item.Balance !== null && item.Balance !== undefined ? item.Balance : "",
        CreditLimit: item.CreditLimit !== null && item.CreditLimit !== undefined ? item.CreditLimit : "",
        CurrentBalance: item.CurrentBalance !== null && item.CurrentBalance !== undefined ? item.CurrentBalance : "",
        Password: item.Password || "",
      });
    } else {
      setEditId(null);
      setForm({
        Name: "",
        Phone: "",
        Email: "",
        Balance: "",
        CreditLimit: "",
        CurrentBalance: "",
        Password: "",
      });
    }
    setShowModal(true);
  };

  // ================= SAVE DATA =================
  const handleSave = async () => {
    if (!form.Name.trim()) {
      alert("Please enter a member name.");
      return;
    }

    if (!form.Phone.trim()) {
      alert("Please enter a phone number. Phone number is required and must be unique.");
      return;
    }

    if (!form.Email.trim()) {
      alert("Please enter an email address. Email is required.");
      return;
    }

    if (!form.Password.trim()) {
      alert("Please enter a password. Password is required.");
      return;
    }

    // Client-side duplicate check
    const phoneExists = data.some(
      (item) => item.Phone && item.Phone.trim() === form.Phone.trim() && item.MemberId !== editId
    );
    if (phoneExists) {
      alert("This phone number is already registered to another member.");
      return;
    }

    const payload = {
      Name: form.Name,
      Phone: form.Phone,
      Email: form.Email,
      Balance: form.Balance === "" ? null : parseFloat(form.Balance),
      CreditLimit: form.CreditLimit === "" ? null : parseFloat(form.CreditLimit),
      CurrentBalance: form.CurrentBalance === "" ? null : parseFloat(form.CurrentBalance),
      Password: form.Password,
    };

    try {
      if (editId) {
        await axios.put(`${API_BASE_URL}/api/member/${editId}`, payload);
      } else {
        await axios.post(API_BASE_URL + "/api/member", payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error("Save Error:", err);
      const errMsg = err.response?.data?.error || "Failed to save data.";
      alert(errMsg);
    }
  };

  // ================= DELETE DATA =================
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this member?")) {
      try {
        await axios.delete(`${API_BASE_URL}/api/member/${id}`);
        setShowModal(false);
        fetchData();
      } catch (err) {
        console.error("Delete Error:", err);
        alert("Failed to delete member.");
      }
    }
  };

  // Helper to format currency values
  const formatCurrency = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    const num = parseFloat(val);
    return isNaN(num) ? "-" : `$${num.toFixed(2)}`;
  };

  return (
    <div className={`membermaster-page ${sidebarOpen ? "membermaster-sidebar-open" : ""}`}>
      <div className="membermaster-container">
        {/* HEADER AREA */}
        <div className="membermaster-top-header">
          <h1 className="membermaster-page-title">Member Master</h1>
          <button className="membermaster-btn-orange-new" onClick={() => openModal()}>
            New
          </button>
        </div>

        {/* TABLE AREA */}
        <div className="membermaster-table-card">
          <table className="membermaster-custom-table">
            <thead>
              <tr>
                <th style={{ width: "18%" }}>NAME</th>
                <th style={{ width: "12%" }}>PHONE</th>
                <th style={{ width: "15%" }}>EMAIL</th>
                <th style={{ width: "10%" }}>PASSWORD</th>
                <th style={{ width: "10%" }}>BALANCE</th>
                <th style={{ width: "12%" }}>CONSUMED</th>
                <th style={{ width: "13%" }}>CREDIT BALANCE</th>
                <th style={{ width: "10%" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="membermaster-text-center">Loading...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="membermaster-text-center">No members found.</td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.MemberId} onClick={() => openUsageModal(item)}>
                    <td>{item.Name}</td>
                    <td>{item.Phone || "-"}</td>
                    <td>{item.Email || "-"}</td>
                    <td>{item.Password || "-"}</td>
                    <td>{formatCurrency(item.Balance)}</td>
                    <td>{formatCurrency(item.CurrentBalance)}</td>
                    <td>{formatCurrency(item.CreditLimit)}</td>
                    <td>
                      <button
                        className="membermaster-btn-row-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(item);
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="membermaster-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="membermaster-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="membermaster-modal-header">
              <h2>Member Master</h2>
            </div>

            <div className="membermaster-form-grid">
              <div className="membermaster-form-field membermaster-field-full">
                <label>Name *</label>
                <input
                  type="text"
                  name="Name"
                  placeholder="Enter member name"
                  value={form.Name}
                  onChange={handleChange}
                  autoFocus
                />
              </div>

              <div className="membermaster-form-field">
                <label>Phone *</label>
                <input
                  type="text"
                  name="Phone"
                  placeholder="Enter phone number"
                  value={form.Phone}
                  onChange={handleChange}
                  autoComplete="new-phone"
                />
              </div>

              <div className="membermaster-form-field">
                <label>Email *</label>
                <input
                  type="email"
                  name="Email"
                  placeholder="Enter email address"
                  value={form.Email}
                  onChange={handleChange}
                  autoComplete="new-email"
                />
              </div>

              <div className="membermaster-form-field">
                <label>Password *</label>
                <input
                  type="password"
                  name="Password"
                  placeholder="Enter password"
                  value={form.Password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
              </div>

              <div className="membermaster-form-field">
                <label>Balance ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="Balance"
                  placeholder="0.00"
                  value={form.Balance}
                  onChange={handleChange}
                />
              </div>

              <div className="membermaster-form-field">
                <label>Credit Limit ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="CreditLimit"
                  placeholder="0.00"
                  value={form.CreditLimit}
                  onChange={handleChange}
                />
              </div>

              <div className="membermaster-form-field">
                <label>Consumed ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="CurrentBalance"
                  placeholder="0.00"
                  value={form.CurrentBalance}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="membermaster-modal-footer">
              {editId && (
                <button
                  className="membermaster-btn-delete-red"
                  onClick={() => handleDelete(editId)}
                >
                  Delete
                </button>
              )}
              <button className="membermaster-btn-cancel-grey" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="membermaster-btn-save-orange" onClick={handleSave}>
                {editId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* USAGE REPORT MODAL */}
      {showUsageModal && selectedMember && (
        <div className="membermaster-modal-overlay" onClick={() => setShowUsageModal(false)}>
          <div className="membermaster-analytics-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="membermaster-modal-header-close">
              <div>
                <h2 style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.5px' }}>Member Purchase History</h2>
                <div className="membermaster-modal-subtitle" style={{ fontFamily: 'system-ui, sans-serif', fontWeight: '500', color: '#666' }}>
                  Details for <strong>{selectedMember.Name}</strong> • {selectedMember.Phone || "No Phone"}
                  {usageData.createdByName && (
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                      Created by <strong style={{ color: '#ff7f27' }}>{usageData.createdByName}</strong>
                      {usageData.createdOnDate ? ` on ${new Date(usageData.createdOnDate).toLocaleDateString('en-GB')}` : ''}
                    </div>
                  )}
                </div>
              </div>
              <button className="membermaster-modal-close-icon" onClick={() => setShowUsageModal(false)}>
                &times;
              </button>
            </div>

            {loadingUsage ? (
              <div className="membermaster-text-center" style={{ padding: '30px 0', color: '#888', fontFamily: 'system-ui, sans-serif' }}>
                Loading history data...
              </div>
            ) : (
              <>
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px', marginBottom: '12px' }}>
                  {/* Financial Summary Fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px', padding: '8px 12px', background: '#fcfaf7', borderRadius: '10px', border: '1px solid #e5dcd3' }}>
                    <div style={{ textAlign: 'center', fontSize: '11px', color: '#6d645e', borderRight: '1px solid #e5dcd3' }}>
                      <div style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Balance</div>
                      <div style={{ color: '#ff7f27', fontWeight: 'bold', fontSize: '13px', marginTop: '3px' }}>{formatCurrency(usageData.balance !== undefined ? usageData.balance : selectedMember.Balance)}</div>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '11px', color: '#6d645e', borderRight: '1px solid #e5dcd3' }}>
                      <div style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Consumed</div>
                      <div style={{ color: '#ff7f27', fontWeight: 'bold', fontSize: '13px', marginTop: '3px' }}>{formatCurrency(usageData.currentBalance !== undefined ? usageData.currentBalance : selectedMember.CurrentBalance)}</div>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '11px', color: '#6d645e' }}>
                      <div style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Credit Limit</div>
                      <div style={{ color: '#ff7f27', fontWeight: 'bold', fontSize: '13px', marginTop: '3px' }}>{formatCurrency(usageData.creditLimit !== undefined ? usageData.creditLimit : selectedMember.CreditLimit)}</div>
                    </div>
                  </div>

                  <div className="membermaster-usage-kpi-row">
                    <div className="membermaster-usage-kpi-card orders" style={{ background: 'linear-gradient(135deg, #fffcf9 0%, #fff6ee 100%)', border: '1px solid #ffdcb3' }}>
                      <div className="membermaster-usage-kpi-label" style={{ color: '#d06010' }}>
                        {usageData.isThisMonth ? "Orders This Month" : "Total Orders"}
                      </div>
                      <div className="membermaster-usage-kpi-value" style={{ color: '#ff7f27', fontSize: '22px' }}>{usageData.totalOrders || 0}</div>
                    </div>
                    <div className="membermaster-usage-kpi-card spent" style={{ background: 'linear-gradient(135deg, #fdfbf9 0%, #f6ece2 100%)', border: '1px solid #e6ceb8' }}>
                      <div className="membermaster-usage-kpi-label" style={{ color: '#9e591b' }}>
                        {usageData.isThisMonth ? "Spent This Month" : "Total Spent"}
                      </div>
                      <div className="membermaster-usage-kpi-value" style={{ color: '#ff7f27', fontSize: '22px' }}>$ {(Number(usageData.totalSpent) || 0).toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="membermaster-usage-section">
                    <div className="membermaster-usage-section-title" style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#555', borderBottom: '1px solid #eee' }}>Ordered Items List</div>
                    {usageData.items && usageData.items.length > 0 ? (
                      <ul className="membermaster-usage-list" style={{ background: '#fff', border: '1px solid #f0f0f0' }}>
                        {usageData.items.map((item, idx) => (
                          <li key={idx} className="membermaster-usage-item" style={{ borderBottom: '1px solid #fafafa' }}>
                            <span style={{ fontWeight: '500', color: '#333' }}>{item.DishName}</span>
                            <strong style={{ background: '#fff0e5', color: '#ff7f27', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>{item.TotalQty} Qty</strong>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="membermaster-no-data" style={{ padding: '20px', background: '#fafafa', borderRadius: '8px', border: '1px dashed #ddd' }}>No items ordered.</div>
                    )}
                  </div>

                  <div className="membermaster-usage-section">
                    <div className="membermaster-usage-section-title" style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#555', borderBottom: '1px solid #eee' }}>Recent Bills</div>
                    {usageData.recentBills && usageData.recentBills.length > 0 ? (
                      <ul className="membermaster-usage-list" style={{ background: '#fff', border: '1px solid #f0f0f0' }}>
                        {usageData.recentBills.map((bill, idx) => (
                          <li key={idx} className="membermaster-usage-item" style={{ borderBottom: '1px solid #fafafa', alignItems: 'center' }}>
                            <div>
                              <strong style={{ color: '#333' }}>{bill.BillNo}</strong>
                              <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                                {new Date(bill.BillDate).toLocaleDateString('en-GB')}
                              </div>
                            </div>
                            <strong style={{ color: '#2c3e50', fontSize: '14px' }}>$ {Number(bill.TotalAmount).toFixed(2)}</strong>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="membermaster-no-data" style={{ padding: '20px', background: '#fafafa', borderRadius: '8px', border: '1px dashed #ddd' }}>No recent bills found.</div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                  <button className="membermaster-usage-btn-done" style={{ borderRadius: '24px', letterSpacing: '0.5px' }} onClick={() => setShowUsageModal(false)}>
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberMaster;
