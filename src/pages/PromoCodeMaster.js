import React, { useState, useEffect } from "react";
import axios from "axios";
import "./PromoCodeMaster.css";
import { BASE_URL } from "../config/api";

const emptyForm = {
  PromoId: "",
  PromoCode: "",
  PromoName: "",
  DiscountType: "AMOUNT",
  DiscountValue: "",
  MaxUsage: "",
  UsedCount: 0,
  PromoImage: "",
  IsActive: true,
};

export default function PromoCodeMaster() {
  const [showModal, setShowModal] = useState(false);
  //   const [search, setSearch] = useState("");
  const [promoCodes, setPromoCodes] = useState([]);
  //   const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchPromoCodes = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/promocode`);

      if (res.data.success) {
        setPromoCodes(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  useEffect(() => {
    const handleGlobalPaste = (e) => {
      if (!showModal) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          const reader = new FileReader();
          reader.onloadend = () => {
            setFormData(prev => ({
              ...prev,
              PromoImage: reader.result
            }));
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    };

    document.addEventListener("paste", handleGlobalPaste);
    return () => {
      document.removeEventListener("paste", handleGlobalPaste);
    };
  }, [showModal]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          PromoImage: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {

    if (!formData.PromoCode.trim()) {
      alert("Promo Code is required");
      return;
    }

    const payload = {
      ...formData,
      DiscountValue: Number(formData.DiscountValue) || 0,
      MaxUsage: Number(formData.MaxUsage) || 0,
      UsedCount: Number(formData.UsedCount) || 0,
    };

    try {

      if (formData.PromoId) {

        await axios.put(
          `${BASE_URL}/api/promocode/${formData.PromoId}`,
          payload
        );

        alert("Updated Successfully");

      } else {

        await axios.post(
          `${BASE_URL}/api/promocode`,
          payload
        );

        alert("Saved Successfully");

      }

      fetchPromoCodes();

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
        `${BASE_URL}/api/promocode/${id}`
      );

      fetchPromoCodes();

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
        <h2>Promo Code Master</h2>
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
                <th>Promo Code</th>
                <th>Promo Name</th>
                <th>Image</th>
                <th>Discount Type</th>
                <th>Discount Value</th>
                <th>Max Usage</th>
                <th>Used Count</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            {/* <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="10">No Members Found</td></tr>
            ) : filtered.map((m,i)=>( */}
            <tbody>
              {promoCodes.length === 0 ? (
                <tr>
                  <td colSpan="10">No Promo Codes Found</td>
                </tr>
              ) : (
                promoCodes.map((m, i) => (
                  <tr key={i}>
                    <td>{m.PromoCode}</td>
                    <td>{m.PromoName}</td>
                    <td>
                      {m.PromoImage ? (
                        <img src={m.PromoImage} alt="Promo" style={{ width: "50px", height: "50px", objectFit: "cover" }} />
                      ) : (
                        "No Image"
                      )}
                    </td>
                    <td>{m.DiscountType}</td>
                    <td>{m.DiscountValue}</td>
                    <td>{m.MaxUsage}</td>
                    <td>{m.UsedCount}</td>
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
                        onClick={() => handleDelete(m.PromoId)}
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
            <h3>{formData.PromoId ? "Edit Promo Code" : "New Promo Code"}</h3>

            <div className="member-form">

              <div className="member-field">
                <label>Promo Code</label>
                <input
                  type="text"
                  name="PromoCode"
                  value={formData.PromoCode}
                  onChange={handleChange}
                />
              </div>

              <div className="member-field">
                <label>Promo Name</label>
                <input
                  type="text"
                  name="PromoName"
                  value={formData.PromoName}
                  onChange={handleChange}
                />
              </div>

              {/* <div className="member-field">
          <label>Promo Image</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '5px' }}>
            {formData.PromoImage && (
              <img src={formData.PromoImage} alt="Promo Preview" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid #ccc" }} />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{
                width: "100%",
                padding: "5px",
                border: "1px solid #d9d9d9",
                borderRadius: "8px",
                background: "#fff",
                fontSize: "14px",
                height: "42px",
                boxSizing: "border-box"
              }}
            />
          </div>
        </div> */}

              <div className="member-field">
                <label>Promo Image</label>

                <div
                  className="promo-image-box"
                  tabIndex={0}
                  onPaste={(e) => {
                    const items = e.clipboardData?.items;

                    if (!items) return;

                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.startsWith("image/")) {
                        const file = items[i].getAsFile();

                        if (!file) return;

                        const reader = new FileReader();

                        reader.onload = () => {
                          setFormData(prev => ({
                            ...prev,
                            PromoImage: reader.result
                          }));
                        };

                        reader.readAsDataURL(file);
                        break;
                      }
                    }
                  }}
                >

                  {formData.PromoImage ? (

                    <div className="promo-image-preview">

                      <img
                        src={formData.PromoImage}
                        alt="Promo"
                      />

                      <div className="promo-image-actions">

                        {/* Choose another image */}
                        <label className="promo-choose-btn">
                          📁 Choose Image

                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleImageUpload}
                          />
                        </label>

                        {/* Delete */}
                        <button
                          type="button"
                          className="promo-delete-btn"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              PromoImage: ""
                            }));
                          }}
                        >
                          🗑️ Delete
                        </button>

                      </div>

                    </div>

                  ) : (

                    <div className="promo-empty">

                      <div className="promo-paste-icon">
                        📋
                      </div>

                      <div className="promo-paste-title">
                        Copy an image and paste here
                      </div>

                      <div className="promo-paste-subtitle">
                        Press Ctrl + V
                      </div>

                      <label className="promo-choose-btn">
                        📁 Choose Image

                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={handleImageUpload}
                        />
                      </label>

                    </div>

                  )}

                </div>
              </div>

              <div className="member-field">
                <label>Discount Type</label>
                <select
                  name="DiscountType"
                  value={formData.DiscountType}
                  onChange={handleChange}
                >
                  <option value="AMOUNT">Amount</option>
                  <option value="PERCENTAGE">Percentage</option>
                </select>
              </div>

              <div className="member-field">
                <label>Discount Value</label>
                <input
                  type="number"
                  name="DiscountValue"
                  value={formData.DiscountValue}
                  onChange={handleChange}
                />
              </div>

              <div className="member-field">
                <label>Max Usage</label>
                <input
                  type="number"
                  name="MaxUsage"
                  value={formData.MaxUsage}
                  onChange={handleChange}
                />
              </div>

              <div className="member-field">
                <label>Used Count</label>
                <input
                  type="number"
                  name="UsedCount"
                  value={formData.UsedCount}
                  readOnly
                />
              </div>

              <div className="member-field member-active-field">
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
                <button
                  className="member-save-btn"
                  onClick={handleSave}
                >
                  Save
                </button>

                <button
                  className="member-cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
