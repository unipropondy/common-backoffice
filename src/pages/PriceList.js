import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import "./PriceList.css";
import { BASE_URL } from "../config/api";
 
const API = `${BASE_URL}/api`;
 
export default function PriceList() {
  const queryClient = useQueryClient();
 
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false); // ✅ NEW
 
  const [form, setForm] = useState({
    name: "",
    description: "",
    sortCode: "01",
    active: true
  });
 
  // 🔥 FETCH
  const { data: priceLists = [] } = useQuery({
    queryKey: ["priceLists"],
    queryFn: async () => {
      const res = await axios.get(`${API}/pricelist`);
      return res.data;
    }
  });
 
  const saveMutation = useMutation({
  mutationFn: async (data) => {
    console.log("SENDING DATA:", data); // 🔥 debug
    return await axios.post(`${API}/pricelist`, data)
  },
 
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ["priceLists"] });
 
    setShowModal(false);   // close modal
    handleNew();           // reset form
 
    alert("Saved Successfully ✅");
  },
 
  onError: (err) => {
    console.error("SAVE ERROR:", err.response?.data );
    alert(err.response?.data || "Save Failed ❌");   // 🔥 now error visible
  }
});
 
  // 🔥 SELECT
  const handleSelect = (item) => {
    setSelected(item.PriceListId);
 
    setForm({
      name: item.Name || "",
      description: item.Description || "",
      sortCode: item.SortCode || "01",
      active: item.IsActive ?? true
    });
 
    setShowModal(true); // ✅ open modal
  };
 
  // 🔥 NEW
  const handleNew = () => {
    setSelected(null);
    setForm({
      name: "",
      description: "",
      sortCode: "01",
      active: true
    });
    setShowModal(true); // ✅ open modal
  };
 
  const handleSave = () => {
  if (!form.name) return alert("Enter PriceList Name");

  const payload = {
    Name: form.name,
    Description: form.description,
    SortCode: Number(form.sortCode),
    IsActive: form.active,
  };

  if (selected) {
    // 🔥 UPDATE
    axios.put(`${API}/pricelist/${selected}`, payload)
      .then(() => {
        queryClient.invalidateQueries(["priceLists"]);
        setShowModal(false);
        handleNew();
      });
  } else {
    // 🔥 INSERT
    saveMutation.mutate(payload);
  }
};
 
  return (
    <div className="PriceList-page">
 
      {/* TITLE */}
      <div className="PriceList-table-header">
          <div className="PriceList-title">Price List</div>

          <button
            onClick={handleNew}
            className="PriceList-btn PriceList-btn-new"
          >
            New
          </button>
        </div>
 
      <div className="PriceList-container">
 
        <div className="PriceList-grid">
 
          {/* LEFT TABLE */}
          <div className="PriceList-card">
 
        
 
            <table className="PriceList-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Active</th>
                </tr>
              </thead>
 
              <tbody>
                {priceLists.length === 0 ? (
                  <tr>
                    <td colSpan="2">No Data</td>
                  </tr>
                ) : (
                  priceLists.map((p) => (
                    <tr
                      key={p.PriceListId}
                      className={
                        selected === p.PriceListId
                          ? "PriceList-active-row"
                          : ""
                      }
                      onClick={() => handleSelect(p)}
                    >
                      <td>{p.Name}</td>
 
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={p.IsActive}
                          readOnly
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
 
          </div>
 
          {/* ❌ RIGHT FORM REMOVED (now modal) */}
 
        </div>
 
      </div>
 
      {/* ✅ MODAL */}
      {showModal && (
        <div className="PriceList-modal-overlay">
          <div className="PriceList-modal-box">
 
            <h2 className="PriceList-modal-title">Price List</h2>
 
            <div className="PriceList-form-grid">
              <div className="PriceList-form-group">
                <label>PriceList Code</label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </div>
 
              <div className="PriceList-form-group">
                <label>Description</label>
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
 
              <div className="PriceList-form-group PriceList-full-width">
                <label>Sort Code</label>
                <input
                  value={form.sortCode}
                  onChange={(e) =>
                    setForm({ ...form, sortCode: e.target.value })
                  }
                />
              </div>
 
              <div className="PriceList-checkbox PriceList-full-width">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.checked })
                  }
                />
                <label>Active</label>
              </div>
 
              <div className="PriceList-modal-btn-group PriceList-full-width">
                <button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="PriceList-btn PriceList-btn-save"
                >
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="PriceList-btn PriceList-btn-close"
                >
                  Exit
                </button>
              </div>
            </div>
 
          </div>
        </div>
      )}
    </div>
  );
}

 