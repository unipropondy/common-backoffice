import React, { useState, useEffect } from "react";
import "./Inventory.css";

import { BASE_URL } from "../config/api";

// const BASE_URL = "http://localhost:3000";

function Inventory() {
  const [showModal, setShowModal] = useState(false);
  const [inventoryList, setInventoryList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editId, setEditId] = useState(null);

  const [item, setItem] = useState({
    itemCode: "",
    description: "",
    inventoryGroup: "",
    brand: "",
    uom: "",
    grossCost: "",
    sortCode: "",
    discountAllowed: false,
    active: true,
    vendor: "",
    price: "",
    avgCost: "",
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${BASE_URL}/inventory`);
      const data = await res.json();
      setInventoryList(data);
    } catch (err) {
      console.error("GET ERROR ❌", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setItem({
      ...item,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSave = async () => {
  try {
    if (editIndex !== null) {

     const id = editId;

      console.log("ID 👉", id);

      const res = await fetch(`${BASE_URL}/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Description: item.description,
          InventoryGroup: item.inventoryGroup || "",
          BrandId: item.brand || null,
          Uom: item.uom || "",
          Price: item.price || 0,
          GrossCost: item.grossCost || 0,
          CurrentCost: item.avgCost || 0,
          QuantityOnHand: 0,
          IsActive: item.active,
          SordCode: item.sortCode || 0,
          ShortName: item.description || "",
          isDiscountAllowed: item.discountAllowed,
          VendorId: item.vendor || null
        })
      });

      const data = await res.json();

      console.log("STATUS 👉", res.status);
      console.log("RESPONSE 👉", data);

      if (!res.ok) {
        alert("Update failed ❌");
        return;
      }

    } else {

    const payload = {
  InventoryCode: item.itemCode || "",
  Description: item.description || "",
  InventoryGroup: item.inventoryGroup || "",
  BrandId: item.brand || "00000000-0000-0000-0000-000000000000",
  Uom: item.uom || "",
  Price: Number(item.price) || 0,
  GrossCost: Number(item.grossCost) || 0,
  CurrentCost: Number(item.avgCost) || 0,
  QuantityOnHand: 0,
  IsActive: item.active ?? true,
  SordCode: Number(item.sortCode) || 0,
  ShortName: item.description || "",
  isDiscountAllowed: item.discountAllowed ?? false,
  VendorId: item.vendor || "00000000-0000-0000-0000-000000000000"
};

      await fetch(`${BASE_URL}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    // ✅ COMMON SUCCESS
    setTimeout(() => {
      fetchInventory();
    }, 500);

    setShowModal(false);
    setEditIndex(null);
    resetForm();

  } catch (err) {
    console.error("SAVE ERROR ❌", err);
  }
};

  const resetForm = () => {
    setItem({
      itemCode: "",
      description: "",
      inventoryGroup: "",
      brand: "",
      uom: "",
      grossCost: "",
      sortCode: "",
      discountAllowed: false,
      active: true,
      vendor: "",
      price: "",
      avgCost: "",
    });
  };

  const handleEdit = (index) => {
    const data = inventoryList[index];

     
     setEditIndex(index);   
     setEditId(data.InventoryId);

    setItem({
      itemCode: data.InventoryCode,
      description: data.Description,
      inventoryGroup: data.InventoryGroup,
      brand: data.BrandId,
      uom: data.Uom,
      grossCost: data.GrossCost,
      sortCode: data.SordCode,
      discountAllowed: data.isDiscountAllowed,
      active: data.IsActive,
      vendor: data.VendorId,
      price: data.Price,
      avgCost: data.CurrentCost
    });

   setEditId(data.InventoryID);  // 🔥 IMPORTANT
    setShowModal(true);
  };

  return (
    <div className="inventory-container">
        <div className="inventory-header">
      <h1 className="inventory-title">Inventory</h1>

      <button
        className="in-new-btn"
        onClick={() => {
          resetForm();
          setShowModal(true);
        }}
      >
        New
      </button>
</div>
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Item Code</th>
            <th>Description</th>
            <th>Group</th>
            <th>Brand</th>
            <th>UOM</th>
            <th>Gross Cost</th>
            <th>Price</th>
            <th>Avg Cost</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {inventoryList.length === 0 ? (
            <tr>
              <td colSpan="9" style={{ textAlign: "center" }}>
                No entries yet
              </td>
            </tr>
          ) : (
            inventoryList.map((item, index) => (
              <tr
                key={index}
                onClick={() => handleEdit(index)}
                style={{ cursor: "pointer" }}
              >
                <td>{item.InventoryCode}</td>
                <td>{item.Description}</td>
                <td>{item.InventoryGroup}</td>
                <td>{item.BrandId}</td>
                <td>{item.Uom}</td>
                <td>{item.GrossCost}</td>
                <td>{item.Price}</td>
                <td>{item.CurrentCost}</td>
                <td>{item.IsActive ? "Yes" : "No"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay-in">
          <div className="modal-box-in">
            <h2>{editIndex !== null ? "Edit Item" : "Add Item"}</h2>

            <div className="form-grid">
  
  <div className="form-group">
    <label>Item Code</label>
    <input name="itemCode" value={item.itemCode} onChange={handleChange} />
  </div>

  <div className="form-group">
    <label>Description</label>
    <input name="description" value={item.description} onChange={handleChange} />
  </div>

  <div className="form-group">
    <label>Group</label>
    <input name="inventoryGroup" value={item.inventoryGroup} onChange={handleChange} />
  </div>

  <div className="form-group">
    <label>Brand</label>
    <input name="brand" value={item.brand} onChange={handleChange} />
  </div>

  <div className="form-group">
    <label>UOM</label>
    <input name="uom" value={item.uom} onChange={handleChange} />
  </div>

  <div className="form-group">
    <label>Gross Cost</label>
    <input type="number" name="grossCost" value={item.grossCost} onChange={handleChange} />
  </div>

  <div className="form-group">
    <label>Sort Code</label>
    <input type="number" name="sortCode" value={item.sortCode} onChange={handleChange} />
  </div>

  <div className="form-group">
    <label>Vendor</label>
    <input name="vendor" value={item.vendor} onChange={handleChange} />
  </div>

  <div className="form-group">
    <label>Price</label>
    <input type="number" name="price" value={item.price} onChange={handleChange} />
  </div>

  <div className="form-group">
    <label>Avg Cost</label>
    <input type="number" name="avgCost" value={item.avgCost} onChange={handleChange} />
  </div>

</div>

            <div className="checkbox-group">
              <label>
                <input type="checkbox" name="discountAllowed" checked={item.discountAllowed} onChange={handleChange} />
                Discount Allowed
              </label>

              <label>
                <input type="checkbox" name="active" checked={item.active} onChange={handleChange} />
                Active
              </label>
            </div>

            <div className="modal-buttons-in">
              <button className="save-btn-in" onClick={handleSave}>
                {editIndex !== null ? "Update" : "Save"}
              </button>
              <button className="cancel-btn-in" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;