import React, { useState, useEffect } from "react";
import axios from "axios";
import "./MemberMaster.css";
import { BASE_URL } from "../config/api";

const emptyForm = {
  MemberId: "",
  Name: "",
  Phone: "",
  Email: "",
  Address: "",
  CreditLimit: "",
  Balance: "",
  CurrentBalance: "",
  Promocode: "",
  Promoamount: "",
  IsActive: true,
};

export default function MemberMaster() {
  const [showModal, setShowModal] = useState(false);
//   const [search, setSearch] = useState("");
  const [members, setMembers] = useState([]);
//   const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchMembers = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/api/member`);

    if (res.data.success) {
      setMembers(res.data.data);
    }
  } catch (err) {
    console.error(err);
  }
};

useEffect(() => {
  fetchMembers();
}, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

 const handleSave = async () => {

  if (!formData.Name.trim()) {
    alert("Member Name is required");
    return;
  }

  try {

    if (formData.MemberId) {

      await axios.put(
        `${BASE_URL}/api/member/${formData.MemberId}`,
        formData
      );

      alert("Updated Successfully");

    } else {

      await axios.post(
        `${BASE_URL}/api/member`,
        formData
      );

      alert("Saved Successfully");

    }

    fetchMembers();

    setFormData(emptyForm);
    setShowModal(false);

  } catch (err) {

    console.error(err);

  }

};

  const handleEdit = (item) => {
  setFormData(item);
  setShowModal(true);
};

  const handleDelete = async (id) => {

  if (!window.confirm("Delete this member?"))
    return;

  try {

    await axios.delete(
      `${BASE_URL}/api/member/${id}`
    );

    fetchMembers();

  } catch (err) {

    console.error(err);

  }

};

//   const filtered = members.filter((m) =>
//     [m.Name, m.Phone, m.Email]
//       .join(" ")
//       .toLowerCase()
//       .includes(search.toLowerCase())
//   );

  return (
    <div className="member-page">
      <div className="member-header">
        <h2>Member Master</h2>
        <button
            className="member-new-btn"
            onClick={() => {
                setFormData(emptyForm);
                setShowModal(true);
            }}
            >
            + New
            </button>
      </div>

      {/* <div className="search-section">
        <input
          placeholder="Search..."
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
        />
      </div> */}

      <div className="member-table-container">
        <div className="member-table-scroll">
        <table className="member-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              {/* <th>Email</th> */}
              <th>Credit</th>
              <th>Balance</th>
              <th>Current</th>
              <th>Promo Code</th>
              <th>Promo %</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          {/* <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="10">No Members Found</td></tr>
            ) : filtered.map((m,i)=>( */}
            <tbody>
            {members.length === 0 ? (
                <tr>
                <td colSpan="10">No Members Found</td>
                </tr>
            ) : (
                members.map((m, i) => (
                <tr key={i}>
                    <td>{m.Name}</td>
                    <td>{m.Phone}</td>
                    {/* <td>{m.Email}</td> */}
                    <td>{m.CreditLimit}</td>
                    <td>{m.Balance}</td>
                    <td>{m.CurrentBalance}</td>
                    <td>{m.Promocode}</td>
                    <td>{m.Promoamount}</td>
                    <td>{m.IsActive ? "Active" : "Inactive"}</td>
                    
                 <td className="member-action">
                    <button
                        className="member-edit-link"
                        onClick={() => handleEdit(m)}
                    >
                        Edit
                    </button>

                    <button
                        className="member-delete-btn"
                        onClick={() => handleDelete(m.MemberId)}
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

      {showModal && (
        <div className="member-modal-overlay">
          <div className="member-modal">
            <h3>{formData.MemberId ? "Edit Member" : "New Member"}</h3>
            <div className="member-form">
           <div className="member-field">
                <label>Member Name</label>
                <input
                    type="text"
                    name="Name"
                    value={formData.Name}
                    onChange={handleChange}
                />
            </div>
            <div className="member-field">
                <label>Phone</label>
                <input
                    type="text"
                    name="Phone"
                    value={formData.Phone}
                    onChange={handleChange}
                />
            </div>
                        <div className="member-field">
                <label>Email</label>
                <input
                    type="email"
                    name="Email"
                    value={formData.Email}
                    onChange={handleChange}
                />
            </div>
                    <div className="member-field">
                <label>Address</label>
                <textarea
                    name="Address"
                    value={formData.Address}
                    onChange={handleChange}
                />
            </div>
                        <div className="member-field">
                <label>Credit Limit</label>
                <input
                    type="number"
                    name="CreditLimit"
                    value={formData.CreditLimit}
                    onChange={handleChange}
                />
            </div>
                    <div className="member-field">
                <label>Balance</label>
                <input
                    type="number"
                    name="Balance"
                    value={formData.Balance}
                    onChange={handleChange}
                />
            </div>
                    <div className="member-field">
                <label>Current Balance</label>
                <input
                    type="number"
                    name="CurrentBalance"
                    value={formData.CurrentBalance}
                    onChange={handleChange}
                />
            </div>
                    <div className="member-field">
                <label>Promo Code</label>
                <input
                    type="text"
                    name="Promocode"
                    value={formData.Promocode}
                    onChange={handleChange}
                />
            </div>
            <div className="member-field">
            <label>Promo Amount</label>
            <input
                type="number"
                name="Promoamount"
                value={formData.Promoamount}
                onChange={handleChange}
            />
        </div>

        <div className="member-field member-active-field">
            {/* <label>Active</label> */}

            <label className="member-status-check">
                <input
                    type="checkbox"
                    name="IsActive"
                    checked={formData.IsActive}
                    onChange={handleChange}
                />
                <span>Active</span>
            </label>
        </div>

            <div className="member-modal-footer">
              <button className="member-save-btn" onClick={handleSave}>Save</button>
              <button className="member-cancel-btn" onClick={()=>setShowModal(false)}>Cancel</button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
