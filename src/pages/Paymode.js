import { useState, useEffect } from "react";
import axios from "axios";
import "./Paymode.css";
 import { BASE_URL } from "../config/api";
function Paymode() {
 
  const [mode, setMode] = useState("list");
  const [data, setData] = useState([]);
  const [editId, setEditId] = useState(null);

  const [loading, setLoading] = useState(false);
 
  const [form, setForm] = useState({
    position: "",
    paymode: "",
    description: "",
    DeviceSN: "",
    DeviceSalt: "",
    active: true,
    entertainment: false,
    YeahPayEnabled: false,
    imagePreview: null
  });
 
  // ================= FETCH =================
  const fetchData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/paymode`);
      setData(res.data);
    } catch (err) {
      console.log(err);
    }
  };
 
  useEffect(() => {
    fetchData();
  }, []);
 
  // ================= INPUT =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    });
  };
 
  // ================= IMAGE =================
  const handleImageChange = (e) => {
  const file = e.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    setForm(prev => ({
      ...prev,
      imagePreview: reader.result
    }));
  };

  reader.readAsDataURL(file);
};
 
  // ================= EDIT =================
  const handleEdit = (item) => {
    setForm({
      position: item.Position,
      paymode: item.PayMode,
      description: item.Description,
      DeviceSN: item.DeviceSN || "",
      DeviceSalt: item.DeviceSalt || "",
      active: item.Active === true || item.Active === 1,
      entertainment: item.isEntertainment === true || item.isEntertainment === 1,
      YeahPayEnabled: item.YeahPayEnabled === true || item.YeahPayEnabled === 1,
      imagePreview: item.PaymodeImage || null
    });
 
    setEditId(item.Position);
    setMode("form");
  };
 
  // ================= SAVE =================
 const handleSave = async () => {

  if (!form.position || !form.paymode) {
    alert("Fill required fields");
    return;
  }

  try {
    setLoading(true);   // 🔥 START LOADING

    const payload = {
      position: Number(form.position),
      paymode: form.paymode,
      description: form.description,
      DeviceSN: form.DeviceSN,
      DeviceSalt: form.DeviceSalt,
      active: form.active,
      entertainment: form.entertainment,
      YeahPayEnabled: form.YeahPayEnabled,
      image: form.imagePreview
    };

    if (editId !== null) {
      await axios.put(`${BASE_URL}/api/paymode/${editId}`, payload);
    } else {
      await axios.post(`${BASE_URL}/api/paymode`, payload);
    }

    await fetchData();   // 🔥 wait for data

    setMode("list");
    setEditId(null);

  } catch (err) {
    alert("Save failed");
  } finally {
    setLoading(false);   // 🔥 ALWAYS STOP (important)
  }
};
  return (
    <div className="payment-page1">
 
      {/* HEADER */}
      <div className="payment-header1">
        <h1 className="payment-title1">Paymode</h1>
      </div>
 
      {/* ================= LIST ================= */}
      {mode === "list" && (
        <div className="payment-box1">
 
          <div className="payment-bottomBtns1">
            <button
              className="payment-btn1 payment-new1"
              onClick={() => {
  setMode("form");
  setEditId(null);

  // 🔥 IMPORTANT - FORM CLEAR
  setForm({
    position: "",
    paymode: "",
    description: "",
    DeviceSN: "",
    DeviceSalt: "",
    active: true,
    entertainment: false,
    YeahPayEnabled: false,
    imagePreview: null
  });
}}
            >
              New
            </button>
          </div>
 
          <table className="payment-table1">
            <thead>
              <tr>
                <th>Position</th>
                <th>Paymode</th>
                <th>Description</th>
                <th>Active</th>
              </tr>
            </thead>
 
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan="4">No entries</td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={index} onClick={() => handleEdit(item)}>
                    <td>{item.Position}</td>
                    <td>{item.PayMode}</td>
                    <td>{item.Description}</td>
                    <td>{item.Active ? "Yes" : "No"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
 
        </div>
      )}
 
      {/* ================= FORM ================= */}
      {mode === "form" && (
        <div className="payment-modalOverlay1">
 
          <div className="payment-modal1">
 
            <h2 className="payment-modalTitle1">
              {editId ? "Edit Paymode" : "New Paymode"}
            </h2>
 
            {/* INPUTS */}
            <div className="payment-modalRow1">
 
              <div className="payment-field1">
                <label>Position</label>
                <input
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                />
              </div>
 
              <div className="payment-field1">
                <label>Paymode</label>
                <input
                  name="paymode"
                  value={form.paymode}
                  onChange={handleChange}
                />
              </div>
 
              <div className="payment-field1">
                <label>Description</label>
                <input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

               <div className="payment-field1">
                <label>DeviceSN</label>
                <input
                  name="DeviceSN"
                  value={form.DeviceSN}
                  onChange={handleChange}
                />
              </div>

              
 
            </div>
 
            {/* CHECKBOX + IMAGE */}
            <div className="payment-modalRow1">

               <div className="payment-field2">
                <label>DeviceSalt</label>
                <input
                  name="DeviceSalt"
                  value={form.DeviceSalt}
                  onChange={handleChange}
                />
              </div>
 
              <div className="payment-checkbox1">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                />
                <label>Active</label>
              </div>
 
              {/* IMAGE BOX */}
             {/* <div className="payment-imageBox1">
                {form.imagePreview ? (
                  <img
                    src={form.imagePreview}
                    alt="preview"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <span>preview</span>
                )}
              </div>*/}
 
              {/* FILE INPUT */}
             {/* <input
                type="file"
                id="scanInput"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageChange}
              />
 
              <label htmlFor="scanInput" className="payment-btn1 payment-scan1">
                Scan
              </label>
 
              <div className="payment-checkbox1">
                <input
                  type="checkbox"
                  name="entertainment"
                  checked={form.entertainment}
                  onChange={handleChange}
                />
                <label>Entertainment</label>
              </div>*/}

              <div className="payment-checkbox1">
                <input
                  type="checkbox"
                  name="YeahPayEnabled"
                  checked={form.YeahPayEnabled}
                  onChange={handleChange}
                />
                <label>YeahPayEnabled</label>
              </div>
 
            </div>
 
            {/* BUTTONS */}
            <div className="payment-modalActions1">
              <button
                className="payment-btn1 payment-save1"
                onClick={handleSave}
              >
                Save
              </button>
 
              <button
                className="payment-btn1 payment-exit1"
               onClick={() => {
  window.location.reload();   // 🔥 page refresh
}}
              >
                Cancel
              </button>
            </div>
 
          </div>
 
        </div>
      )}
 
    </div>
  );
}
 
export default Paymode;
 