import React, { useState, useEffect } from "react";
import axios from "axios";
import "./PickList.css";
 import { BASE_URL } from "../config/api";
const PickList = () => {
 
  const API = `${BASE_URL}/api`;
 
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
 
  const [tableName, setTableName] = useState("UserMaster");
  const [fieldName, setFieldName] = useState("EmployeeType");
 
  const [pickListValue, setPickListValue] = useState("");
  const [pickListNumber, setPickListNumber] = useState("");
  const [isDefault, setIsDefault] = useState(false);
 
  const [data, setData] = useState([]);
 
  useEffect(() => {
    fetchData();
  }, []);
 
  const fetchData = () => {
    axios.get(`${API}/picklist/all`)
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  };
 
  const handleNew = () => {
    setPickListValue("");
    setPickListNumber("");
    setIsDefault(false);
    setIsEdit(false);
    setShowModal(true);
  };
 
  const handleEdit = (row) => {
    setTableName(row.TableName);
    setFieldName(row.FieldName);
    setPickListValue(row.PickListValue);
    setPickListNumber(row.PickListNumber);
    setIsDefault(row.isDefault === 1);
    setIsEdit(true);
    setShowModal(true);
  };
 
  const handleSave = () => {
    if (!pickListValue) return alert("Enter value");
 
    axios.post(`${API}/picklist`, {
      tableName,
      fieldName,
      value: pickListValue,
      number: Number(pickListNumber),
      isDefault
    })
    .then(() => {
      alert(isEdit ? "Updated ✅" : "Saved ✅");
      setShowModal(false);
      fetchData();
    })
    .catch(err => console.error(err));
  };
 
  const handleDelete = (row) => {
    axios.delete(`${API}/picklist`, {
      data: {
        tableName: row.TableName,
        fieldName: row.FieldName,
        value: row.PickListValue
      }
    })
    .then(() => {
      alert("Deleted ✅");
      fetchData();
    })
    .catch(err => console.error(err));
  };
 
  return (
    <div className="picklist-page">
 
      {/* ✅ HEADER */}
      <div className="picklist-header">
        <h2>PickList Master</h2>
 
        <button className="picklist-new-btn" onClick={handleNew}>
          New
        </button>
      </div>
 
      {/* ✅ TABLE */}
      <div className="picklist-container">
 
        <table className="picklist-table">
          <thead>
            <tr>
              <th>Table</th>
              <th>Field</th>
              <th>Value</th>
              <th>Number</th>
              <th>Action</th>
            </tr>
          </thead>
 
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="5">No Data</td>
              </tr>
            ) : (
              data.map((d, i) => (
                <tr key={i} onClick={() => handleEdit(d)}>
                  <td>{d.TableName}</td>
                  <td>{d.FieldName}</td>
                  <td>{d.PickListValue}</td>
                  <td>{d.PickListNumber}</td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(d);
                      }}
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
 
      {/* ✅ MODAL */}
      {showModal && (
        <div className="picklist-modal-overlay">
 
          <div className="picklist-modal-box">
 
            <h3>{isEdit ? "Edit PickList" : "Add PickList"}</h3>
 
            {/* FORM */}
            <div className="picklist-form-grid">
 
              <label>Table Name</label>
              <input value={tableName} readOnly />
 
              <label>Field Name</label>
              <input value={fieldName} readOnly />
 
              <label>PickList Value</label>
              <input
                value={pickListValue}
                onChange={(e) => setPickListValue(e.target.value)}
              />
 
              <label>PickList Number</label>
              <input
                type="number"
                value={pickListNumber}
                onChange={(e) => setPickListNumber(e.target.value)}
              />
 
            </div>
 
            {/* CHECKBOX */}
            <div className="picklist-checkbox-row">
              <label>Is Default</label>
              <input
                type="checkbox"
                checked={isDefault}
                onChange={() => setIsDefault(!isDefault)}
              />
            </div>
 
            {/* BUTTONS */}
            <div className="picklist-buttons">
 
              <button className="picklist-save-btn" onClick={handleSave}>
                {isEdit ? "Update" : "Save"}
              </button>
 
              <button
                className="picklist-close-btn"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
 
            </div>
 
          </div>
 
        </div>
      )}
 
    </div>
  );
};
 
export default PickList;
 