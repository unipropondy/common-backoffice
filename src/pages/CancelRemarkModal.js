import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CancelRemarkModal.css";
import { BASE_URL } from "../config/api";

const API = `${BASE_URL}`;

export default function CancelRemarks() {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    CRCode: "",
    CRName: "",
    SortCode: ""
  });

  // 🔥 GET DATA
  const fetchData = async () => {
    const res = await axios.get(`${API}/api/cancelRemarks`);
    setData(res.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔥 INPUT CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // 🔥 SAVE
  const handleSave = async (e) => {
    e.preventDefault();

    try {
      if (editId) {
       await axios.put(`${API}/api/cancelRemarks/${editId}`, form);
      } else {
       await axios.post(`${API}/api/cancelRemarks`, form);
      }

      fetchData();
      setShowModal(false);
      setEditId(null);

    } catch (err) {
      console.log(err);
    }
  };

  // 🔥 DELETE
  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/api/cancelRemarks/${editId}`);
      fetchData();
      setShowModal(false);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="cancel-container">

      <div className="cancel-header">
        <h2>Cancel Remarks</h2>

        <button
          className="cancel-new-btn"
          onClick={() => {
            setForm({
              CRCode: "",
              CRName: "",
              SortCode: ""
            });
            setEditId(null);
            setShowModal(true);
          }}
        >
          New
        </button>
      </div>

      {/* TABLE */}
      <table className="cancel-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Sort</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item, i) => (
            <tr
              key={i}
              onClick={() => {
                setForm({
                  CRCode: item.CancelRemarkCode,
                  CRName: item.CancelRemarkName,
                  SortCode: item.SortCode
                });
                setEditId(item.CancelRemarkCode);
                setShowModal(true);
              }}
            >
              <td>{item.CancelRemarkCode}</td>
              <td>{item.CancelRemarkName}</td>
              <td>{item.SortCode}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 🔥 MODAL */}
      {showModal && (
        <div className="cancel-modal-overlay">
  <div className="cancel-modal-box">

    <h2 className="cancel-title">Cancel Remarks Master</h2>

    <form onSubmit={handleSave} className="cancel-form-grid">

      <div className="cancel-form-group">
        <label>Code</label>
        <input
          name="CRCode"
          value={form.CRCode}
          onChange={handleChange}
        />
      </div>

      <div className="cancel-form-group">
        <label>Name</label>
        <input
          name="CRName"
          value={form.CRName}
          onChange={handleChange}
        />
      </div>

      <div className="cancel-form-group full">
        <label>Sort Code</label>
        <input
          name="SortCode"
          value={form.SortCode}
          onChange={handleChange}
        />
      </div>

      <div className="actions full">
        <button type="submit" className="btn cl-save">Save</button>

        {editId && (
          <button
            type="button"
            className="cancel-btn delete"
            onClick={handleDelete}
          >
            Delete
          </button>
        )}

        <button
          type="button"
          className="cancel-btn exit"
          onClick={() => setShowModal(false)}
        >
          Exit
        </button>
      </div>

    </form>

  </div>
</div>
      )}

    </div>
  );
}