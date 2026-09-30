import React, { useState, useEffect } from "react";
import "./usergroup.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../config/api";
 
export default function UserGroup() {
 
  const navigate = useNavigate();
 
  const [groups, setGroups] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showModal, setShowModal] = useState(false);
 
  const initialFormData = {
    id: null,
    code: "",
    name: "",
    active: true,
    createdDate: "",
    modifyDate: "",
  };
 
  const [formData, setFormData] = useState(initialFormData);
 
  // =============================
  // 🔥 FETCH GROUPS
  // =============================
  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/usergroup`); // ✅ PORT FIX
      setGroups(res.data);
    } catch (err) {
      console.log("Fetch error:", err);
    }
  };
 
  useEffect(() => {
    fetchGroups();
  }, []);
 
  // ESC close
  useEffect(() => {
    const esc = (e) => {
      if (e.key === "Escape") setShowModal(false);
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);
 
  // =============================
  // SELECT ROW (EDIT)
  // =============================
  const handleSelect = (index) => {
    setSelectedIndex(index);
    setFormData(groups[index]);
    setShowModal(true);
  };
 
  // =============================
  // INPUT CHANGE
  // =============================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
 
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };
 
  // =============================
  // NEW
  // =============================
  const handleNew = () => {
    setFormData(initialFormData);
    setSelectedIndex(null);
    setShowModal(true);
  };
 
  // =============================
  // SAVE (INSERT / UPDATE)
  // =============================
  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      alert("Please fill all fields");
      return;
    }
 
    try {
      await axios.post(`${BASE_URL}/api/usergroup`, formData); // ✅ PORT FIX
      alert("Saved");
      fetchGroups(); // 🔥 refresh
      setShowModal(false);
      setSelectedIndex(null);
    } catch (err) {
      console.log(err);
    }
  };
 
  // =============================
  // DELETE 🔥 (API)
  // =============================
  const handleDelete = async () => {
    if (selectedIndex === null) {
      alert("Select a record");
      return;
    }
 
    const selected = groups[selectedIndex];
 
    if (window.confirm("Delete this record?")) {
      try {
        await axios.delete(`${BASE_URL}/api/usergroup/${selected.code}`);
        fetchGroups(); // 🔥 refresh
        setShowModal(false);
        setSelectedIndex(null);
      } catch (err) {
        console.log(err);
      }
    }
  };
 
  const handleClose = () => {
    setShowModal(false);
    setSelectedIndex(null);
  };
 
  return (
    <div id="usergroup-container" className="usergroup-container1">
 
      <div id="full-page" className="usergroup-full-page1">
 
        {/* HEADER */}
        <div id="top-bar1" className="usergroup-top-bar1">
          <h2 id="top-title1" className="usergroup-top-title1">User Group</h2>
 
          <button id="btn-new1" className="usergroup-btn-new1" onClick={handleNew}>
            New
          </button>
        </div>
 
        {/* TABLE */}
        <table id="styled-table1" className="usergroup-styled-table1">
          <thead>
            <tr>
              <th>ID</th>
              <th>Code</th>
              <th>Name</th>
              <th>Active</th>
              <th>Created</th>
              <th>Modified</th>
            </tr>
          </thead>
 
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td colSpan="6">No records available</td>
              </tr>
            ) : (
              groups.map((grp, index) => (
                <tr key={grp.id} onClick={() => handleSelect(index)}>
                  <td>{grp.id}</td>
                  <td>{grp.code}</td>
                  <td>{grp.name}</td>
                  <td>{grp.active ? "Yes" : "No"}</td>
                  <td>{grp.createdDate || "-"}</td>
                  <td>{grp.modifyDate || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
 
      </div>
 
      {/* MODAL */}
      {showModal && (
        <div id="form-overlay1" className="usergroup-form-overlay1">
          <div id="form-modal1" className="usergroup-form-modal1">
 
            <h2 id="form-title1" className="usergroup-form-title1">User Group Setup</h2>
 
            <div id="form-left1" className="usergroup-form-left1">
 
              <label>
                <span>ID</span>
                <input type="text" name="id" value={formData.id || ""} readOnly />
              </label>
 
              <label>
                <span>Code</span>
                <input type="text" name="code" value={formData.code} onChange={handleChange} />
              </label>
 
              <label>
                <span>Name</span>
                <input type="text" name="name" value={formData.name} onChange={handleChange} />
              </label>
 
              <label>
                <span>Active</span>
                <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} />
              </label>
 
            </div>
 
            <div id="button-box1" className="usergroup-button-box1">
              <button id="save-btn1" className="usergroup-save-btn1" onClick={handleSave}>Save</button>
              <button id="delete-btn1" className="usergroup-delete-btn1" onClick={handleDelete}>Delete</button>
              <button id="cancel-btn1" className="usergroup-cancel-btn1" onClick={handleClose}>Close</button>
            </div>
 
          </div>
        </div>
      )}
 
    </div>
  );
}
 