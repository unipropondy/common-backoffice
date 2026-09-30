import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Permission.css";
 import { BASE_URL } from "../config/api";
 
export default function Permission() {
 
  const [groups, setGroups] = useState([]);
  const [formGroups, setFormGroups] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
 
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedFormGroup, setSelectedFormGroup] = useState("");
 
  const [selectedRows, setSelectedRows] = useState([]);
 
  const API = `${BASE_URL}/api`;
 
  // Load dropdown options on mount
  useEffect(() => {
    console.log("Permission Management - Loaded v1.1");
    axios.get(`${API}/usergroup`)
      .then(res => setGroups(res.data))
      .catch(err => console.error(err));
 
    axios.get(`${API}/form-groups`)
      .then(res => setFormGroups(res.data))
      .catch(err => console.error(err));
  }, []);
 
  // Auto-fetch permissions whenever selectedGroup or selectedFormGroup changes
  useEffect(() => {
    if (!selectedGroup) {
      // Reset table when no group is selected
      setFilteredData([]);
      setSelectedRows([]);
      return;
    }
 
    const fetchPermissions = async () => {
      try {
        const trimmedGroup = selectedGroup ? selectedGroup.toString().trim() : "";
        console.log(`[Permission] Fetching permissions for: "${trimmedGroup}"`, { formGroup: selectedFormGroup });
 
        const res = await axios.post(`${API}/permissions/fetch`, {
          userGroup: trimmedGroup,
          formGroups: selectedFormGroup ? [selectedFormGroup.trim()] : []
        });
 
        console.log("API Filter Logic Version:", res.data.version);
        const data = res.data.data.map(d => ({
          ...d,
          FormGroupCode: d.FormGroupCode?.trim(),
          FormCode: d.FormCode?.trim()
        }));
 
        setFilteredData(data);
        setSelectedRows(
          data
            .filter(d => d.AllowRead === true)
            .map(d => d.FormCode)
        );
      } catch (err) {
        console.error("Auto-fetch error:", err);
      }
    };
 
    fetchPermissions();
  }, [selectedGroup, selectedFormGroup]);
 
  // ✅ SINGLE ROW SELECT
  const handleSelect = (code) => {
    setSelectedRows(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };
 
  // ✅ SELECT ALL
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(filteredData.map(f => f.FormCode));
    } else {
      setSelectedRows([]);
    }
  };
 
  // Manual fetch (kept for the Fetch button)
  const handleFetch = async () => {
    if (!selectedGroup) return alert("Select User Group");
 
    try {
      const res = await axios.post(`${API}/permissions/fetch`, {
        userGroup: selectedGroup,
        formGroups: selectedFormGroup ? [selectedFormGroup.trim()] : []
      });
 
      console.log("Manual Fetch API Version:", res.data.version);
      const data = res.data.data.map(d => ({
        ...d,
        FormGroupCode: d.FormGroupCode?.trim(),
        FormCode: d.FormCode?.trim()
      }));
 
      setFilteredData(data);
      setSelectedRows(
        data
          .filter(d => d.AllowRead === true)
          .map(d => d.FormCode)
      );
 
    } catch (err) {
      console.error(err);
    }
  };
 
  // 🔥 UPDATE
  const handleUpdate = async () => {
    if (!selectedGroup) return alert("Select User Group");
 
    try {
      const data = filteredData.map(f => ({
        FormCode: f.FormCode,
        AllowAdd: selectedRows.includes(f.FormCode),
        AllowUpdate: selectedRows.includes(f.FormCode),
        AllowDelete: selectedRows.includes(f.FormCode),
        AllowRead: selectedRows.includes(f.FormCode)
      }));
 
      await axios.post(`${API}/permissions/update`, {
        userGroup: selectedGroup,
        data
      });
 
      alert("Updated Successfully ✅");
 
    } catch (err) {
      console.error(err);
      alert("Update Failed ❌");
    }
  };
 
  return (
    <div className="permission-container">
 
      <div className="permission-header">
        Permission Management
      </div>
 
      <div className="permission-content-wrapper">
 
        {/* TOP FORM */}
        <div className="permission-form-section">
          <div className="permission-group-content">
 
            <div className="permission-group-box">
              <label>User Group</label>
              <select value={selectedGroup} onChange={(e)=>setSelectedGroup(e.target.value)}>
                <option value="">-- Select --</option>
                <option value="ALL">ALL</option>
                {groups.map((g,i)=>(
                  <option key={i} value={g.code}>
                    {g.code}
                  </option>
                ))}
              </select>
            </div>
 
            <div className="permission-group-box">
              <label>Form Group</label>
              <select value={selectedFormGroup} onChange={(e)=>setSelectedFormGroup(e.target.value)}>
                <option value="">-- All --</option>
                {formGroups.map((fg,i)=>(
                  <option key={i} value={fg.FormGroupCode}>
                    {fg.FormGroupCode}
                  </option>
                ))}
              </select>
            </div>
 
            <div className="permission-fetch-box">
              <button className="permission-btn permission-btn-fetch" onClick={handleFetch}>
                Fetch
              </button>
            </div>
 
          </div>
        </div>
 
        {/* ACTION BUTTONS */}
        <div className="permission-top-actions">
          <button className="permission-btn permission-btn-update" onClick={handleUpdate}>
            Update
          </button>
 
          <button className="permission-btn permission-btn-close" onClick={() => window.history.back()}>
            Close
          </button>
        </div>
 
        {/* TABLE */}
        <div className="permission-content">
 
          <table className="permission-table">
 
            <thead>
              <tr>
                <th>User Group</th>
                <th>Form Group</th>
                <th>Form Code</th>
                <th>Form Name</th>
                <th>
                  <input
                    type="checkbox"
                    className="permission-checkbox"
                    onChange={handleSelectAll}
                    checked={
                      filteredData.length > 0 &&
                      selectedRows.length === filteredData.length
                    }
                  />
                </th>
              </tr>
            </thead>
 
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="4">No Data</td>
                </tr>
              ) : (
                filteredData.map((f,i)=>(
                  <tr key={i} className="permission-table-row">
 
                    <td>{f.UserGroupCode}</td>
                    <td>{f.FormGroupCode}</td>
                    <td>{f.FormCode}</td>
                    <td>{f.FormDescription}</td>
 
                    <td>
                      <input
                        type="checkbox"
                        className="permission-checkbox"
                        checked={selectedRows.includes(f.FormCode)}
                        onChange={() => handleSelect(f.FormCode)}
                      />
                    </td>
 
                  </tr>
                ))
              )}
            </tbody>
 
          </table>
 
        </div>
 
      </div>
    </div>
  );
}
 