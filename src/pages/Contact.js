import { useState, useEffect } from "react";
import axios from "axios";
import "./Contact.css";
import { BASE_URL } from "../config/api";
function Contact() {
  const [entries, setEntries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState({});
  const [activeFilter, setActiveFilter] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.UserId;

  const [form, setForm] = useState({
    kitchen_code: "",
    kitchen_name: "",
    active: "Yes",
  });

 

  useEffect(() => {
    fetchKitchen();
  }, []);

  const fetchKitchen = async () => {
    try {
      setLoading(true);   // 🔥 START
      const res = await axios.get(`${BASE_URL}/kitchen`);
      const data = res.data.map((item) => ({
        id: item.KitchenTypeId,
        kitchen_code: item.KitchenTypeCode,
        kitchen_name: item.KitchenTypeName,
        active: item.isActive ? "Yes" : "No",
      }));
      setEntries(data);
    } catch (err) {
      alert("Failed to load kitchen data");
    } finally {
    setLoading(false);  
  }
  };

  const fetchNextCode = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/kitchen/nextcode`);
      setForm({
        kitchen_code: res.data.NextNumber,
        kitchen_name: "",
        active: "Yes",
      });
    } catch (err) {
      console.log(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const openNewModal = () => {
    fetchNextCode();
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (entry) => {
    setForm(entry);
    setEditingId(entry.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this kitchen?")) return;

    try {
      await axios.delete(`${BASE_URL}/kitchen/${id}`);
      fetchKitchen();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

 if (!form.kitchen_name.trim()) {
  alert("Kitchen Name must be entered ❗");
  return;
}

  try {
    setLoading(true); // 🔥 START LOADING

    const payload = {
      BusinessUnitId: "FBFD4E31-5C91-4DEC-86EA-989D3B5639CA",
      KitchenTypeCode: parseInt(form.kitchen_code),
      KitchenTypeName: form.kitchen_name,
      isActive: form.active === "Yes" ? 1 : 0,
      CreatedBy: userId,
    };

    if (editingId) {
      await axios.put(`${BASE_URL}/kitchen/${editingId}`, payload);
    } else {
      await axios.post(`${BASE_URL}/kitchen`, payload);
    }

    setSuccessMsg(editingId ? "Updated Successfully" : "Saved Successfully");

setTimeout(() => {
  setSuccessMsg("");
}, 3000);

    setForm({
      kitchen_code: "",
      kitchen_name: "",
      active: "Yes",
    });

    setShowModal(false);
    fetchKitchen();

  } catch (err) {
    alert("Save failed");
  } finally {
    setLoading(false); // 🔥 STOP LOADING
  }
};

const toggleActive = async (row) => {
  try {
    const newStatus = row.active === "Yes" ? "No" : "Yes";

    await axios.put(`${BASE_URL}/kitchen/${row.id}`, {
      KitchenTypeCode: row.kitchen_code,
      KitchenTypeName: row.kitchen_name,
      isActive: newStatus === "Yes" ? 1 : 0,
      CreatedBy: userId,
    });

    fetchKitchen(); // refresh table
  } catch (err) {
    alert("Update failed");
  }
};

const handleSelectAll = async (checked) => {
  try {
    const updated = entries.map((item) => ({
      ...item,
      active: checked ? "Yes" : "No",
    }));

    setEntries(updated);

    await Promise.all(
      updated.map((row) =>
        axios.put(`${BASE_URL}/kitchen/${row.id}`, {
          KitchenTypeCode: row.kitchen_code,
          KitchenTypeName: row.kitchen_name,
          isActive: checked ? 1 : 0,
          CreatedBy: userId,
        })
      )
    );
  } catch (err) {
    alert("Update failed");
    fetchKitchen();
  }
};
  const filteredData = entries.filter((row) => {
  return Object.keys(filters).every((key) => {
    if (!filters[key]) return true;

    let value = row[key];

    return String(value)
      .toLowerCase()
      .includes(filters[key].toLowerCase());
  });
});

  const totalRows = filteredData.length;

      const totalPages =
        rowsPerPage === "ALL"
          ? 1
          : Math.ceil(totalRows / rowsPerPage);

      const startIndex =
        rowsPerPage === "ALL"
          ? 0
          : (currentPage - 1) * rowsPerPage;

      const endIndex =
        rowsPerPage === "ALL"
          ? totalRows
          : startIndex + rowsPerPage;

      const paginatedData =
        rowsPerPage === "ALL"
          ? filteredData
          : filteredData.slice(startIndex, endIndex);

          const showingFrom = totalRows === 0 ? 0 : startIndex + 1;

  const showingTo =
  rowsPerPage === "ALL"
    ? totalRows
    : Math.min(startIndex + rowsPerPage, totalRows);

  return (
    <div className="kitchen_container">

 {/* 🔥 ADD THIS */}
    {successMsg && (
      <div className="success-popup">
        {successMsg}
      </div>
    )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

     <h1 className="kitchen_title">Kitchen</h1>

     {/* <div className="kitchen-btn-right" style={{ display: "flex", gap: "10px" }}></div> */}
     
   <div className="kitchen-btn-right">
        <button className="kitchen_new_btn" onClick={openNewModal}>
          New
        </button>

        {/* 🔥 ROW SELECT */}
        <select
          value={rowsPerPage}
          onChange={(e) => {
            const value = e.target.value;
            setRowsPerPage(value === "ALL" ? "ALL" : Number(value));
            setCurrentPage(1);
          }}
        >
           <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={30}>30</option>
          <option value={40}>40</option>
          <option value={50}>50</option>
          <option value="ALL">ALL</option>
        </select>

      </div>
      </div>

      {showModal && (
        <div className="kitchen_modal">
          <div className="kitchen_modal_box">
            <h2>{editingId ? "Edit Kitchen" : "New Kitchen"}</h2>

            <form onSubmit={handleSubmit}>
            <div className="kitchen_form_grid">

  <div className="kitchen_field">
    <label>Kitchen Code</label>
  <input
  type="number"
  name="kitchen_code"
  value={form.kitchen_code}
  readOnly   // 🔥 IMPORTANT
/>
  </div>

  <div className="kitchen_field">
    <label>
  Kitchen Name <span className="required">*</span>
</label>
    <input
      type="text"
      name="kitchen_name"
      value={form.kitchen_name}
      onChange={handleChange}
    />
  </div>

 <div className="kitchen_field">
  <label>Active</label>

  <input
    type="checkbox"
    name="active"
    checked={form.active === "Yes"}
    onChange={(e) =>
      setForm({
        ...form,
        active: e.target.checked ? "Yes" : "No",
      })
    }
  />
</div>
</div>
              <div className="kitchen_modal_footer">
                <button type="submit" className="kitchen_save_btn" disabled={loading}>
                  {loading ? "Saving..." : editingId ? "Update" : "Save"}
                </button>

                <button
                  type="button"
                  className="kitchen_cancel_btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="kitchen_table">
        <thead>
          <tr>
           {/* <th>S.No</th> */}

<th onClick={() => setActiveFilter("kitchen_code")}>
  Kitchen Code

  {activeFilter === "kitchen_code" && (
    <input
      type="text"
      onClick={(e) => e.stopPropagation()}
      value={filters.kitchen_code || ""}
      onChange={(e) =>
        setFilters({ ...filters, kitchen_code: e.target.value })
      }
    />
  )}
</th>

<th onClick={() => setActiveFilter("kitchen_name")}>
  Kitchen Name

  {activeFilter === "kitchen_name" && (
    <input
      type="text"
      onClick={(e) => e.stopPropagation()}
      value={filters.kitchen_name || ""}
      onChange={(e) =>
        setFilters({ ...filters, kitchen_name: e.target.value })
      }
    />
  )}
</th>
<th>
  <div className="active-header">
    <input
      type="checkbox"
      checked={
        entries.length > 0 &&
        entries.every((row) => row.active === "Yes")
      }
      onChange={(e) => handleSelectAll(e.target.checked)}
    />
  </div>
</th>

<th>Actions</th>
          </tr>
        </thead>

       <tbody>

{loading ? (
  <tr>
    <td colSpan="4" style={{ textAlign: "center", height: "80px" }}>
      <div className="spinner"></div>
    </td>
  </tr>

) : filteredData.length === 0 ? (

  <tr>
    <td colSpan="4">No Data Found</td>
  </tr>

) : (

  filteredData.map((row, index) => (
   <tr
  key={row.id}
  onClick={() => handleEdit(row)}
  style={{ cursor: "pointer" }}
>
  <td>{row.kitchen_code}</td>
  <td>{row.kitchen_name}</td>
<td
  onClick={(e) => e.stopPropagation()}   /* 🔥 STOP ROW CLICK HERE */
>
  <input
    type="checkbox"
    checked={row.active === "Yes"}
    onChange={(e) => {
      e.stopPropagation();   // extra safety
      toggleActive(row);
    }}
  />
</td>
<td onClick={(e) => e.stopPropagation()}>
  <button 
    onClick={() => handleDelete(row.id)} 
    style={{ backgroundColor: "#ff4d4d", color: "white", border: "none", padding: "5px 10px", borderRadius: "5px", cursor: "pointer" }}
  >
    Delete
  </button>
</td>
</tr>
  ))

)}

</tbody>
      </table>

      <div style={{ marginTop: "10px", display: "flex", gap: "10px", alignItems: "center" }}>

  <button
    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
    disabled={currentPage === 1}
  >
    Prev
  </button>

  <span>
    page {showingFrom}–{showingTo} of {totalRows}
  </span>

  <button
    onClick={() =>
      setCurrentPage((p) => Math.min(p + 1, totalPages))
    }
    disabled={currentPage === totalPages}
  >
    Next
  </button>

</div>
    </div>
  );
}

export default Contact;