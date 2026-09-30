import { useState, useEffect } from "react";
import axios from "axios";
import "./Barcode.css";
import { BASE_URL } from "../config/api";
 
function Barcode() {
 
  const [mode, setMode] = useState("list");
  const [data, setData] = useState([]);
  const [editId, setEditId] = useState(null);
 
  const [form, setForm] = useState({
    DishId: "",
    dishCode: "",
    dishName: "",
    dishGroup: "",
    price: "",
    BarCode: ""
  });
 
  const [showPopup, setShowPopup] = useState(false);
  const [dishList, setDishList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
 
  // ================= FETCH BARCODE =================
  const fetchData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/barcode`);
      setData(res.data);
    } catch (err) {
      console.error("❌ Barcode Fetch Error:", err);
      alert("Backend not working");
    }
  };
 
  useEffect(() => {
    fetchData();
  }, []);
 
  // ================= FETCH DISH LIST =================
  const fetchDishList = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/barcode/dish-list`
      );
      setDishList(res.data);
    } catch (err) {
      console.error("❌ FETCH ERROR:", err);
      alert("Error loading dish list");
    }
  };
 
  // ================= DELETE =================
  const handleDelete = async () => {
    if (!editId) return;
 
    if (!window.confirm("Are you sure you want to delete this barcode?")) {
      return;
    }
 
    try {
      const res = await axios.delete(
        `${BASE_URL}/api/barcode/${editId}`
      );
 
      if (res.data.message === "Deleted ✅") {
        alert("Deleted Successfully");
        fetchData();
        setMode("list");
      } else {
        alert(res.data.message || "Delete failed");
      }
    } catch (err) {
      console.error("❌ DELETE ERROR:", err);
      alert("Delete failed");
    }
  };
 
  // ================= SAVE =================
  const handleSave = async () => {
    try {
      if (!form.BarCode) {
        alert("Enter Barcode");
        return;
      }
 
      if (!form.DishId) {
        alert("Select Dish");
        return;
      }
 
      if (editId) {
        const res = await axios.put(
          `${BASE_URL}/api/barcode/${editId}`,
          {
            DishId: form.DishId,
            BarCode: form.BarCode,
            Description: form.dishName
          }
        );
 
        if (res.data.message === "Updated ✅") {
          alert("Updated Successfully");
        } else {
          alert(res.data.message || "Update failed");
          return;
        }
      } else {
        const res = await axios.post(
          `${BASE_URL}/api/barcode`,
          {
            DishId: form.DishId,
            BarCode: form.BarCode,
            Description: form.dishName
          }
        );
 
        if (res.data.message === "Saved ✅") {
          alert("Saved Successfully");
        } else {
          alert(res.data.message || "Save failed");
          return;
        }
      }
 
      fetchData();
      setMode("list");
 
    } catch (err) {
      console.error("❌ SAVE ERROR:", err);
      alert("Save failed");
    }
  };
 
  return (
    <div className="Barcode-page">
 
      {/* ================= LIST ================= */}
      {mode === "list" && (
        <>
          <div className="Barcode-header">
            <h2>Barcode</h2>
            <button onClick={() => {
              setEditId(null);
              setForm({
                DishId: "",
                dishCode: "",
                dishName: "",
                dishGroup: "",
                price: "",
                BarCode: ""
              });
              setMode("form");
            }}>New</button>
          </div>
 
          <table className="Barcode-table">
            <thead>
              <tr>
                <th>BarCode</th>
                <th>Description</th>
              </tr>
            </thead>
 
            <tbody>
              {data.length > 0 ? (
                data.map((item, i) => (
                  <tr
                    key={i}
                    onClick={() => {
                      setEditId(item.Id);

                      setForm({
                        DishId: item.DishId || "",
                        dishCode: item.DishCode || "",
                        dishName: item.DishName || item.Description || "",
                        dishGroup: item.DishGroupName || "",
                        price: item.Price || "",
                        BarCode: item.BarCode
                      });

                      setMode("form");
                    }}
                  >
                    <td>{item.BarCode}</td>
                    <td>{item.Description}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2">No Data</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
 
      {/* ================= FORM ================= */}
      {mode === "form" && (
        <div className="Barcode-card">
 
          <div className="Barcode-form-header">
            <h2>Barcode</h2>
 
            <div className="Barcode-actions">
              <button className="save-btn" onClick={handleSave}>
                Save
              </button>
 
              <button
                className="delete-btn"
                onClick={handleDelete}
                disabled={!editId}
                style={{
                  opacity: editId ? 1 : 0.5,
                  cursor: editId ? "pointer" : "not-allowed"
                }}
              >
                Delete
              </button>
 
              <button
                className="cancel-btn"
                onClick={() => setMode("list")}
              >
                Cancel
              </button>
            </div>
          </div>
 
          <div className="Barcode-grid">
 
            {/* Dish Code + LOV */}
            <div className="form-row">
              <label>Dish Code</label>
 
              <div className="input-group">
                <input value={form.dishCode} readOnly />
 
                <button
                  className="lov-btn"
                  onClick={() => {
                    setShowPopup(true);
                    fetchDishList();
                  }}
                >
                  ...
                </button>
              </div>
            </div>
 
            <div className="form-row">
              <label>Dish Group</label>
              <input value={form.dishGroup} readOnly />
            </div>
 
            <div className="form-row">
              <label>BarCode</label>
              <input
                value={form.BarCode}
                onChange={(e) =>
                  setForm({ ...form, BarCode: e.target.value })
                }
              />
            </div>
 
            <div className="form-row">
              <label>Dish Name</label>
              <input value={form.dishName} readOnly />
            </div>
 
            <div className="form-row">
              <label>Price</label>
              <input value={form.price} readOnly />
            </div>
 
          </div>
        </div>
      )}
 
      {/* ================= POPUP ================= */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
 
            <div className="popup-header">
              <h3>Select Dish</h3>
              <button onClick={() => {
                setShowPopup(false);
                setSearchTerm("");
              }}>X</button>
            </div>
 
            <div className="popup-search-container">
              <input
                type="text"
                placeholder="Search dish name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
 
            <table className="popup-table">
              <thead>
                <tr>
                  <th>Dish Code</th>
                  <th>Dish Name</th>
                  <th>Price</th>
                </tr>
              </thead>
 
              <tbody>
                {dishList
                  .filter(item =>
                    item.DishName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.DishCode?.toString().includes(searchTerm)
                  )
                  .length > 0 ? (
                  dishList
                    .filter(item =>
                      item.DishName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      item.DishCode?.toString().includes(searchTerm)
                    )
                    .map((item, i) => (
                    <tr
                      key={i}
                      onClick={() => {
                        setForm({
                          DishId: item.DishId,
                          dishCode: item.DishCode,
                          dishName: item.DishName,
                          dishGroup: item.DishGroupName || "",
                          price: item.CurrentCost,
                          BarCode: ""
                        });
 
                        setShowPopup(false);
                      }}
                    >
                      <td>{item.DishCode}</td>
                      <td>{item.DishName}</td>
                      <td>{item.CurrentCost}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3">No Data Found</td>
                  </tr>
                )}
              </tbody>
 
            </table>
 
          </div>
        </div>
      )}
 
    </div>
  );
}
 
export default Barcode;
 
 
 