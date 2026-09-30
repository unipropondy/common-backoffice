import React, { useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import "./Modifier.css";
import { BASE_URL } from "../config/api";

function Modifier() {
const API = `${BASE_URL}`;
  const [showModal, setShowModal] = useState(false);
  const [modifierList, setModifierList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);

  const [modifier, setModifier] = useState({
     ModifierId: "",
    ModifierCode: "",
    ModifierName: "",
    ConflictId: "",
    isActive: true,
    SortCode: "",
    isPriceAffect: false,
    isDishPrice: false,   // ✅ ADD
    DishCost: 0,          // ✅ ADD
    isOpenModifier: false,
  });
useEffect(() => {
  loadModifiers();
}, []);

const loadModifiers = async () => {
  try {
    const res = await axios.get(`${API}/modifiermaster`);
    setModifierList(res.data);
  } catch (err) {
    console.error("LOAD ERROR", err);
  }
};
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setModifier({
      ...modifier,
      [name]: type === "checkbox" ? checked : value,
    });
  };

 const handleSave = async () => {
  try {

   const cleanData = {
  ...modifier,

  isPriceAffect: modifier.isPriceAffect ? true : false,
  isDishPrice: modifier.isDishPrice ? true : false,
  DishCost: Number(modifier.DishCost) || 0,

  ModifierName: modifier.ModifierName.trim(),
  ConflictId:
    modifier.ConflictId && modifier.ConflictId.length === 36
      ? modifier.ConflictId
      : null,

  isActive:
    modifier.isActive === true || modifier.isActive === "true",
};

    console.log("Sending:", cleanData);

    if (modifier.ModifierId) {
      await axios.put(
        `${API}/modifiermaster/${modifier.ModifierId}`,
        cleanData   
      );
    } else {
      await axios.post(`${API}/modifiermaster`, cleanData);
    }

    loadModifiers();
    setShowModal(false);
    setEditIndex(null);

  } catch (err) {
    console.log("SERVER ERROR:", err.response?.data);
  }
};

const handleDelete = async (id) => {
  try {
    await axios.delete(`${API}/modifiermaster/${id}`);
    loadModifiers();
  } catch (err) {
    console.error("DELETE ERROR", err.response?.data);
    alert(JSON.stringify(err.response?.data));
  }
};

  const handleEdit = (index) => {
  const item = modifierList[index];
console.log("ITEM:", item); // debug
  setModifier({
    ModifierId: item.ModifierId || "",
    ModifierCode: item.ModifierCode || "",
    ModifierName: item.ModifierName || "",
    ConflictId: item.ConflictId || "",
    isActive: item.isActive ?? true,
    SortCode: item.SortCode || "",
    isPriceAffect: item.isPriceAffect ?? false,
      isDishPrice: item.isDishPrice ?? false,   // ✅ ADD
  DishCost: item.DishCost || 0,   
    isOpenModifier: item.isOpenModifier ?? false,
  });

  setEditIndex(index);
  setShowModal(true);
};

  return (
    <div className="modifier-container">

       <div className="modifier-header">
  <h1 className="modifier-title">Modifier</h1>

  <button
  className="modifier-new-btn"
  onClick={async () => {
  try {
    const res = await axios.get(`${API}/modifiermaster/nextcode`);

    setModifier({
      ModifierId: "",
      ModifierCode: res.data.code, // 🔥 AUTO VALUE
      ModifierName: "",
      ConflictId: "",
      isActive: true,
      SortCode: "",
      isPriceAffect: false,
      isOpenModifier: false,
    });

    setEditIndex(null);
    setShowModal(true);

  } catch (err) {
    console.log("ERROR:", err);
  }
}}
  >
  New
  </button>
 </div>

      <table className="modifier-table">

        <thead>
          <tr>
            <th>Modifier Code</th>
            <th>Modifier Name</th>
            <th>Active</th>
            <th>Sort Code</th>
            <th>Price Affect</th>
            <th>Open Modifier</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {modifierList.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>
                No entries yet
              </td>
            </tr>
          ) : (

            modifierList.map((item, index) => (

             <tr key={index} style={{ cursor: "pointer" }}>

                  <td onClick={() => handleEdit(index)}>{item.ModifierCode}</td>
                  <td onClick={() => handleEdit(index)}>{item.ModifierName}</td>
                  <td onClick={() => handleEdit(index)}>{item.isActive ? "Active" : "Inactive"}</td>
                  <td onClick={() => handleEdit(index)}>{item.SortCode}</td>
                  <td onClick={() => handleEdit(index)}>{item.isPriceAffect ? "Yes" : "No"}</td>
                  <td onClick={() => handleEdit(index)}>{item.isOpenModifier ? "Yes" : "No"}</td>
                    
                     <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // 🔥 VERY IMPORTANT
                            handleDelete(item.ModifierId);
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


      {showModal && (

        <div className="modifier-modal-overlay-md">

          <div className="modifier-modal-box-md">

            <h2>{editIndex !== null ? "Edit Modifier" : "Add Modifier"}</h2>

            <div className="modifier-form">

              <div className="modifier-form-row">
                <label>Modifier Code</label>
                <input
                  name="ModifierCode"
                  value={modifier.ModifierCode}
                  disabled
                />
              </div>

              <div className="modifier-form-row">
                <label>Modifier Name</label>
                <input
                  name="ModifierName"
                  value={modifier.ModifierName}
                  onChange={handleChange}
                />
              </div>

              <div className="modifier-form-row">
                <label>Conflict Id</label>
               <select
                name="ConflictId"
                value={modifier.ConflictId || ""}
                onChange={handleChange}
              >
                <option value="">None</option>

                {modifierList.map((m) => (
                  <option key={m.ModifierId} value={m.ModifierId}>
                    {m.ModifierName}
                  </option>
                ))}

              </select>
              </div>

              <div className="modifier-form-row">
                <label>Active</label>
               <select
                name="isActive"
                 value={modifier.isActive}
                 onChange={(e) =>
              setModifier({
      ...modifier,
      isActive: e.target.value === "true",
    })
  }
  >
                  <option value={true}>Active</option>
                  <option value={false}>Inactive</option>
                </select>
              </div>

              <div className="modifier-form-row">
                <label>Sort Code</label>
                <input
                  type="number"
                  name="SortCode"
                  value={modifier.SortCode}
                  onChange={handleChange}
                />
              </div>


{/* Price Affect */}
<div className="modifier-form-row">
  <label>Price Affect</label>

  <div className="price-section">
    
    {/* Price Affect Checkbox */}
    <label className="checkbox-inline">
      <input
        type="checkbox"
        name="isPriceAffect"
        checked={modifier.isPriceAffect}
        onChange={handleChange}
      />
      <span className="yesno">[Yes/No]</span>
    </label>

    {/* SHOW ONLY IF CHECKED */}
    {modifier.isPriceAffect && (
      <div className="price-box">
        
        {/* Change Price */}
        <label className="checkbox-inline">
          <input
            type="checkbox"
            name="isDishPrice"
            checked={modifier.isDishPrice || false}
            onChange={handleChange}
          />
          Change Price
        </label>

        {/* Cost */}
        <input
          type="number"
          placeholder="Cost"
          value={modifier.DishCost || ""}
          onChange={(e) =>
            setModifier({
              ...modifier,
              DishCost: e.target.value,
            })
          }
          disabled={!modifier.isDishPrice}
          className="amount-input"
        />
      </div>
    )}
  </div>
</div>


{/* Open Modifier */}

<div className="modifier-checkbox-row">

<span className="modifier-label">Open Modifier</span>

<input
type="checkbox"
name="isOpenModifier"
checked={modifier.isOpenModifier}
onChange={handleChange}
/>

</div>


              <div className="modifier-modal-buttons-md">

                <button className="modifier-save-btn-md" onClick={handleSave}>
                  {editIndex !== null ? "Update" : "Save"}
                </button>

                <button
                  className="modifier-cancel-btn-md"
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

export default Modifier;