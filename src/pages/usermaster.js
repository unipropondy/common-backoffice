import React, { useState, useEffect } from "react";
import "./usermaster.css";
import axios from "axios";
 import { BASE_URL } from "../config/api";
export default function UserMaster() {
 
  const [users, setUsers] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
 
  // ✅ SAFE localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.UserId || null;
 
  const emptyForm = {
    UserId: "",
    UserCode: "",
    UserName: "",
    UserPassword: "",
    UserGroupId: "",
    FirstName: "",
    LastName: "",
    FullName: "",
    NickName: "",
    IdentificationNo: "",
    CardNumber: "",
    isWaiter: false,
    IsDisabled: false
  };
 
  const [form, setForm] = useState(emptyForm);
 
  const API = `${BASE_URL}/api/usermaster`;
 
  useEffect(() => {
    fetchUsers();
    fetchUserGroups();
  }, []);
 
  const generateUserCode = () => {
    const timePart = Date.now().toString().slice(-7);
    const randomPart = Math.floor(Math.random() * 900 + 100);
    return `USR${timePart}${randomPart}`;
  };
 
  const fetchUsers = async () => {
    try {
      const res = await axios.get(API);
      setUsers(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchUserGroups = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/api/usergroupmaster`);

console.log("USER GROUP API:", JSON.stringify(res.data, null, 2));

    setUserGroups(res.data);
  } catch (err) {
    console.log(err);
  }
}
 

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
 
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };
 
  const saveUser = async () => {
    const userCode = form.UserCode || generateUserCode();
 
    if (!userCode || !form.UserName) {
      alert("User Code and User Name required");
      return;
    }
 
    try {
      const payload = {
        ...form,
        UserCode: userCode,
        isWaiter: form.isWaiter ? 1 : 0,
        IsDisabled: form.IsDisabled ? 1 : 0,
        CreatedBy: userId || "SYSTEM" // ✅ FIXED
      };
 
      console.log("Payload:", payload);
 
      await axios.post(API, payload);
 
      alert(editIndex !== null ? "User Updated ✅" : "User Saved ✅");
 
      setForm(emptyForm);
      setShowModal(false);
      setEditIndex(null);
 
      fetchUsers();
    } catch (err) {
      console.log(err);
      alert("Failed to save user.");
    }
  };
 
  const deleteUser = async (code) => {
    try {
      await axios.delete(`${API}/${code}`);
      fetchUsers();
    } catch (err) {
      console.log(err);
    }
  };
 
  return (
    <div className="user_container">
      <div className="user_top_bar">
        <h2 className="user_title">User Master</h2>
 
        <button
          className="user_add_btn"
          onClick={() => {
            setForm({ ...emptyForm, UserCode: generateUserCode() });
            setEditIndex(null);
            setShowModal(true);
          }}
        >
          New
        </button>
      </div>
 
      <table className="user_table">
        <thead>
          <tr>
            {/* <th>UserId</th> */}
            <th>UserCode</th>
            <th>UserName</th>
            {/* <th>UserGroupId</th> */}
            <th>Action</th>
          </tr>
        </thead>
 
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="3">No Users Added</td>
            </tr>
          ) : (
            users.map((user, index) => (
              <tr key={user.UserId}>
                {/* <td>{user.UserId}</td> */}
                <td>{user.UserCode}</td>
                <td>{user.UserName}</td>
                {/* <td>{user.UserGroupId || "-"}</td> */}
 
                <td>
                  <button
                    className="edit_btn"
                    onClick={async () => {
                      const res = await axios.get(`${API}/${user.UserCode}`);
                      const data = res.data;
 
                      setForm({
                        UserId: data.UserId || "",
                        UserCode: data.UserCode || "",
                        UserName: data.UserName || "",
                        UserPassword: data.UserPassword || "",
                        UserGroupId: data.UserGroupId || "",
                        FirstName: data.FirstName || "",
                        LastName: data.LastName || "",
                        FullName: data.FullName || "",
                        NickName: data.NickName || "",
                        IdentificationNo: data.IdentificationNo || "",
                        CardNumber: data.CardNumber || "",
                        isWaiter: data.isWaiter == 1,
                        IsDisabled: data.IsDisabled == 1
                      });
 
                      setEditIndex(index);
                      setShowModal(true);
                    }}
                  >
                    Edit
                  </button>
 
                  <button
                    className="delete_btn"
                    onClick={() => deleteUser(user.UserCode)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
 
      {showModal && (
        <div className="user_modal">
          <div className="user_modal_box">
 
            <h3>{editIndex !== null ? "Edit User" : "Add User"}</h3>
 
            <div className="user_form_grid">
              {[
                ["User Code", "UserCode"],
                ["User Name", "UserName"],
                ["Password", "UserPassword"],
                //  ["User Group Id", "UserGroupId"],
                ["First Name", "FirstName"],
                ["Last Name", "LastName"],
                ["Full Name", "FullName"],
                ["Nick Name", "NickName"],
                ["Identification No", "IdentificationNo"],
                ["Card Number", "CardNumber"]
              ].map(([label, name]) => (
                <div className="form_group" key={name}>
                  <label>{label}</label>
                  <input
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    readOnly={name === "UserCode" && editIndex === null}
                  />
                </div>
              ))}
              <div className="form_group">
                  <label>User Group</label>
                  <select
                    name="UserGroupId"
                    value={form.UserGroupId}
                    onChange={handleChange}
                  >
                        <option value="">Select Group</option>

                      {userGroups.map((group, index) => (
                        <option
                          key={index}
                          value={group.UserGroupId}
                        >
                          {group.UserGroupName}
                        </option>
                      ))}
              </select>
                </div>
            </div>
 
            <div className="user_checkbox_row">
              <label>
                <input type="checkbox" name="isWaiter" checked={form.isWaiter} onChange={handleChange} />
                Waiter
              </label>
 
              <label>
                <input type="checkbox" name="IsDisabled" checked={form.IsDisabled} onChange={handleChange} />
                Disabled
              </label>
            </div>
 
            <div className="user_modal_footer">
              <button className="user_save_btn" onClick={saveUser}>
                {editIndex !== null ? "Update" : "Save"}
              </button>
 
              <button className="user_close_btn" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
 
          </div>
        </div>
      )}
    </div>
  );
}
 