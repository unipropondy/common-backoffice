import { useState, useEffect } from "react";
import axios from "axios";
import "./About.css";

import { BASE_URL } from "../config/api";
import { getLoggedInUserId } from "../utils/audit";

const isValidGuid = (id) => {
  return (
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim())
  );
};

function About() {

  const [entries, setEntries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const [displayName, setDisplayName] = useState(true);
  const [activeTab, setActiveTab] = useState("category");

  const [image, setImage] = useState(null);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [bgColor, setBgColor] = useState("#000000");
  const [textColor, setTextColor] = useState("#ff0000");

  const [modifiers, setModifiers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedModifiers, setSelectedModifiers] = useState([]);

  const [kitchens, setKitchens] = useState([]);
  const [selectedKitchens, setSelectedKitchens] = useState([]);

  const [filters, setFilters] = useState({});
  const [activeFilter, setActiveFilter] = useState(null);

  const [loading, setLoading] = useState(false);

  const filteredModifiers = modifiers.filter((m) =>
    m.ModifierName.toLowerCase().includes(search.toLowerCase())
  );


  const [form, setForm] = useState({
    CategoryId: "",
    CategoryCode: "",
    CategoryName: "",
    ShortName: "",
    SortCode: "",
    isActive: false,
    IsPublished: false,
    isDiscountAllowed: false,
    isKitchenPrint: false,
    isTaxAllowed: false,
    NameInOtherLanguage: false,
    isServiceCharge: false,
    isMemberSalesAllowed: false
  });

  useEffect(() => {

    if (successMsg) {

      const timer = setTimeout(() => {
        setSuccessMsg("");
      }, 1000);

      return () => clearTimeout(timer);

    }

  }, [successMsg]);

  /* =========================
      LOAD DATA
    ========================= */
  const fetchCategory = async () => {

    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/category`);
      setEntries(res.data);
    } catch (err) {
      console.error("Category load error:", err);
    } finally {
      setLoading(false);  // 🔥 STOP
    }

  };

  const fetchModifier = async () => {

    try {

      const res = await axios.get(`${BASE_URL}/modifier`);
      setModifiers(res.data);

    } catch (err) {

      console.error("Modifier load error:", err);

    }

  };

  const fetchKitchen = async () => {

    try {

      const res = await axios.get(`${BASE_URL}/kitchen`);
      setKitchens(res.data);

    } catch (err) {

      console.error("Kitchen load error:", err);

    }

  };

  useEffect(() => {
    fetchCategory();
    fetchModifier();
    fetchKitchen();
  }, []);

  const generateCategoryCode = (categoryList = entries) => {
    const list = Array.isArray(categoryList) ? categoryList : [];

    let maxNum = 0;
    let maxPadLength = 3;

    list.forEach((row) => {
      const codeStr = String(row.CategoryCode || "").trim();
      if (!codeStr) return;

      if (/^\d+$/.test(codeStr)) {
        const num = parseInt(codeStr, 10);
        if (!Number.isNaN(num) && num > maxNum) {
          maxNum = num;
        }
        if (codeStr.length > maxPadLength) {
          maxPadLength = codeStr.length;
        }
      } else {
        const match = codeStr.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (!Number.isNaN(num) && num > maxNum) {
            maxNum = num;
          }
          if (match[0].length > maxPadLength) {
            maxPadLength = match[0].length;
          }
        }
      }
    });

    const existingCodes = new Set(
      list.map((r) => String(r.CategoryCode || "").trim().toLowerCase())
    );

    let nextNum = maxNum + 1;
    let nextCode = String(nextNum).padStart(maxPadLength, "0");

    while (
      existingCodes.has(nextCode.toLowerCase()) ||
      existingCodes.has(String(nextNum)) ||
      existingCodes.has(String(nextNum).padStart(3, "0").toLowerCase()) ||
      existingCodes.has(String(nextNum).padStart(4, "0").toLowerCase())
    ) {
      nextNum += 1;
      nextCode = String(nextNum).padStart(maxPadLength, "0");
    }

    return nextCode;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleEdit = (row) => {
    setForm({ ...row });
    // if(row.ImageName){
    // setImage(`${BASE_URL}/images/Dish/`+ row.ImageName);
    // }
    setImage(null); // clear first

    if (row.ImageData) {
      setImage(row.ImageData);
    }

    setBgColor(row.BackColor || "#000000");
    setTextColor(row.ForeColor || "#ffffff");
    setEditIndex(row.CategoryId);
    setShowModal(true);

    /* ADD THIS */
    axios.get(`${BASE_URL}/categorykitchen/` + row.CategoryId)
      .then(res => {
        const ids = res.data.map(k => Number(k.KitchenTypeCode));
        setSelectedKitchens(ids);
      });



    axios.get(`${BASE_URL}/categorymodifier/` + row.CategoryId)
      .then(res => {
        const ids = res.data.map(m => m.ModifierId);
        setSelectedModifiers(ids);
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("IMAGE TYPE:", typeof image);
    console.log("IMAGE VALUE:", image);

    if (!form.CategoryCode || !String(form.CategoryCode).trim()) {
      alert("Please enter Category Code");
      return;
    }

    if (!form.CategoryName || !String(form.CategoryName).trim()) {
      alert("Please enter Category Name");
      return;
    }

    const isUpdate = Boolean(editIndex && form.CategoryId);
    const userId = getLoggedInUserId();

    if (!userId || !isValidGuid(userId)) {
      alert("A valid logged-in User ID is required. Please log in again.");
      return;
    }

    console.log(
      isUpdate ? "Updating category with CategoryId:" : "Inserting new category, CategoryCode:",
      isUpdate ? form.CategoryId : form.CategoryCode
    );

    try {
      setLoading(true);

      const data = new FormData();

      Object.keys(form).forEach((key) => {
        if (key === "ImageData") return;
        if (!isUpdate && key === "CategoryId") return; // Omit empty CategoryId on INSERT

        if (typeof form[key] === "boolean") {
          data.append(key, form[key] ? 1 : 0);
        } else {
          data.append(key, form[key] ?? "");
        }
      });

      data.append("BackColor", bgColor ? bgColor.toString() : "#000000");
      data.append("ForeColor", textColor ? textColor.toString() : "#ffffff");
      data.append("isDispName", displayName ? 1 : 0);

      data.append(
        "Modifiers",
        JSON.stringify(selectedModifiers)
      );

      data.append(
        "KitchenTypes",
        JSON.stringify(
          kitchens
            .filter((k) => selectedKitchens.includes(Number(k.KitchenTypeCode)))
            .map((k) => ({
              KitchenTypeCode: Number(k.KitchenTypeCode),
              KitchenTypeName: k.KitchenTypeName
            }))
        )
      );

      if (image && typeof image !== "string") {
        data.append("image", image);
      }

      if (isUpdate) {
        data.append("ModifiedBy", userId);
        data.append("ModifiedOn", new Date().toISOString());
      } else {
        data.append("CreatedBy", userId);
        data.append("CreatedOn", new Date().toISOString());
      }

      const selectedDb = localStorage.getItem("selected_db");
      if (selectedDb) {
        data.append("dbName", selectedDb);
      }

      console.log("CATEGORY REQUEST PAYLOAD:");
      for (let [k, v] of data.entries()) {
        console.log(`  ${k}:`, v instanceof File ? `File(${v.name})` : v);
      }

      const response = await axios.post(`${BASE_URL}/category`, data, {
        headers: {
          ...(selectedDb ? { "X-Db-Name": selectedDb } : {})
        }
      });

      console.log("CATEGORY SAVE STATUS:", response.status);
      console.log("CATEGORY SAVE RESPONSE:", response.data);

      if (response.status === 200 || response.status === 201) {
        // Refresh category list only after save request succeeds
        await fetchCategory();

        setEditIndex(null);
        setShowModal(false);
        setImage(null);
        setSelectedModifiers([]);
        setSelectedKitchens([]);
        setDisplayName(true);
        setBgColor("#000000");
        setTextColor("#ff0000");

        setForm({
          CategoryId: "",
          CategoryCode: "",
          CategoryName: "",
          ShortName: "",
          SortCode: "",
          isActive: false,
          IsPublished: false,
          isDiscountAllowed: false,
          isKitchenPrint: false,
          isTaxAllowed: false,
          NameInOtherLanguage: false,
          isServiceCharge: false,
          isMemberSalesAllowed: false
        });

        setSuccessMsg(response.data?.message || "Category saved successfully!");
      } else {
        throw new Error(response.data?.message || "Failed to save category");
      }
    } catch (err) {
      console.error("Category save error:", err.response?.data || err);
      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Save failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredData = entries.filter((row) => {
    return Object.keys(filters).every((key) => {
      if (!filters[key]) return true;

      let value = row[key];

      // 🔥 boolean convert
      if (typeof value === "boolean") {
        value = value.toString();
      }

      return String(value)
        .toLowerCase()
        .includes(filters[key].toLowerCase());
    });
  });

  const totalRows = filteredData.length;

  const totalPages = Math.ceil(totalRows / rowsPerPage);

  const showingFrom =
    totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;

  const showingTo = Math.min(currentPage * rowsPerPage, totalRows);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const toggleField = async (row, fieldName) => {
    try {
      const updatedValue = !row[fieldName];

      const data = new FormData();

      // 🔥 send all fields (backend expects this)
      Object.keys(row).forEach((key) => {
        if (typeof row[key] === "boolean") {
          data.append(key, row[key] ? 1 : 0);
        } else {
          data.append(key, row[key] ?? "");
        }
      });

      // 🔥 override changed field
      data.set(fieldName, updatedValue ? 1 : 0);

      await axios.post(`${BASE_URL}/category`, data, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      // UI update
      setEntries((prev) =>
        prev.map((item) =>
          item.CategoryId === row.CategoryId
            ? { ...item, [fieldName]: updatedValue }
            : item
        )
      );

    } catch (err) {
      console.log("ERROR:", err.response?.data || err.message);
      alert("Update failed");
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Delete this category?")) return;

    try {
      setLoading(true);
      await axios.delete(`${BASE_URL}/category/${id}`);
      fetchCategory();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="cat-page">

      <div className="cat-header">

        <h1 className="cat-title">Category</h1>

        <div className="cat-right">

          <button
            className="cat-new-btn"
            disabled={loading}
            onClick={() => {
              const nextCode = generateCategoryCode(entries);
              setForm({
                CategoryId: "",
                CategoryCode: nextCode,
                CategoryName: "",
                ShortName: "",
                SortCode: "",
                isActive: false,
                IsPublished: false,
                isDiscountAllowed: false,
                isKitchenPrint: false,
                isTaxAllowed: false,
                NameInOtherLanguage: false,
                isServiceCharge: false,
                isMemberSalesAllowed: false
              });

              setSelectedModifiers([]);
              setSelectedKitchens([]);
              setImage(null);
              setDisplayName(true);
              setBgColor("#000000");
              setTextColor("#ff0000");

              setEditIndex(null);
              setShowModal(true);
            }}
          >
            {loading ? "Loading..." : "New"}
          </button>

          <select
            className="rows-dropdown"
            value={rowsPerPage}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "all") {
                setRowsPerPage(filteredData.length);
              } else {
                setRowsPerPage(Number(value));
              }
              setCurrentPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
            <option value="all">All</option>
          </select>

        </div>

      </div>

      {showModal && (

        <div className="cat-modal-overlay">

          {loading && (
            <div className="modal-loader">
              <div className="spinner"></div>
            </div>
          )}

          <div className="cat-modal-content">

            <h2>Category</h2>

            <form onSubmit={handleSubmit}>

              <div className="cat-right-panel">

                <div className="cat-input-grid">   {/* 🔥 ADD THIS */}

                  <div className="cat-form-row">
                    <label>Category Code</label>
                    <input type="text" name="CategoryCode" value={form.CategoryCode} readOnly />
                  </div>

                  <div className="cat-form-row">
                    <label>
                      Category Name <span className="required">*</span>
                    </label>
                    <input type="text" name="CategoryName" value={form.CategoryName} onChange={handleChange} />
                  </div>

                  <div className="cat-form-row">
                    <label>Short Name</label>
                    <input type="text" name="ShortName" value={form.ShortName} onChange={handleChange} />
                  </div>

                  <div className="cat-form-row">
                    <label>Sort Code</label>
                    <input type="text" name="SortCode" value={form.SortCode} onChange={handleChange} />
                  </div>

                </div>   {/* 🔥 CLOSE */}

                <div className="cat-checkbox-grid">

                  <label>
                    <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
                    Active
                  </label>
                  <label>
                    <input type="checkbox" name="IsPublished" checked={form.IsPublished} onChange={handleChange} />
                    Hide in QR
                  </label>

                  <label>
                    <input type="checkbox" name="isDiscountAllowed" checked={form.isDiscountAllowed} onChange={handleChange} />
                    Discount Allowed
                  </label>

                  <label>
                    <input type="checkbox" name="isKitchenPrint" checked={form.isKitchenPrint} onChange={handleChange} />
                    Kitchen Print
                  </label>

                  <label>
                    <input type="checkbox" name="isTaxAllowed" checked={form.isTaxAllowed} onChange={handleChange} />
                    Tax Allowed
                  </label>

                  {/* <label>
          <input type="checkbox" name="NameInOtherLanguage" checked={form.NameInOtherLanguage} onChange={handleChange}/>
          Other Language
          </label> */}

                  <label>
                    <input type="checkbox" name="isServiceCharge" checked={form.isServiceCharge} onChange={handleChange} />
                    Service Charge Allowed
                  </label>

                  <label>
                    <input type="checkbox" name="isMemberSalesAllowed" checked={form.isMemberSalesAllowed} onChange={handleChange} />
                    Member Sales Allowed
                  </label>

                </div>

              </div>

              <div className="cat-right-panel">

                <div className="cat-tab-header">

                  {/* <div className={activeTab==="category"?"cat-tab active-tab":"cat-tab"} onClick={()=>setActiveTab("category")}>
          Category
          </div> */}

                  <div className={activeTab === "modifier" ? "cat-tab active-tab" : "cat-tab"} onClick={() => setActiveTab("modifier")}>
                    Modifier
                  </div>

                  <div className={activeTab === "kitchen" ? "cat-tab active-tab" : "cat-tab"} onClick={() => setActiveTab("kitchen")}>
                    Kitchen Setup
                  </div>

                </div>
                {/*
          {activeTab==="category" && (

          <div className="cat-top-row">

          <div className="cat-image-section">

          <h4>Category Image</h4>

          <div className="cat-image-box">
          {image && (
          <img
          src={typeof image==="string"?image:URL.createObjectURL(image)}
          alt="category"
          />
          )}
          </div>

          <div className="cat-image-buttons">

          <button
          type="button"
          onClick={()=>fileInputRef.current.click()}
          >
          Scan
          </button>

          <button
          type="button"
          onClick={()=>setImage(null)}
          >
          Clear
          </button>

          </div>

          <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{display:"none"}}
          onChange={(e)=>{
            if(e.target.files && e.target.files[0]){

              const selectedFile = e.target.files[0];

              console.log("FILE:", selectedFile);

            
              if (selectedFile.size > 10 * 1024 * 1024) {
                alert("Image must be less than 10MB");
                return;
              }

              setImage(selectedFile);
            }
          }}
          />

          </div>

          <div className="cat-preview-section">

          <h4>Preview</h4>
          <div className="cat-preview-box">

          {image && (
          <img
          src={typeof image==="string" ? image : URL.createObjectURL(image)}
          alt="preview"
          className="cat-preview-img"
          />
          )}

          {displayName && (
          <div
          className="cat-preview-text"
          style={{ background: bgColor, color: textColor }}
          >
          {form.CategoryName || "DRINKS"}
          </div>
          )}

          </div>

          <label className="cat-display-check">

          <input
          type="checkbox"
          checked={displayName}
          onChange={(e)=>setDisplayName(e.target.checked)}
          />

          Display Name

          </label>



          </div>

          <div className="cat-preview-buttons">

          <h4>Button Color</h4>

          <div
          className="cat-button-preview"
          style={{
          background:bgColor,
          color:textColor
          }}
          >
          {form.CategoryName || "DRINKS"}
          </div>

          <div className="cat-color-buttons">

          <button
          type="button"
          className="cat-small-btn"
          onClick={()=>bgColorRef.current.showPicker()}
          >
          Color
          </button>

          <button
          type="button"
          className="cat-small-btn"
          onClick={()=>textColorRef.current.showPicker()}
          >
          Text Color
          </button>

          <input
          type="color"
          ref={bgColorRef}
          value={bgColor}
          onChange={(e)=>setBgColor(e.target.value)}
          className="cat-hidden-color"
          />

          <input
          type="color"
          ref={textColorRef}
          value={textColor}
          onChange={(e)=>setTextColor(e.target.value)}
          className="cat-hidden-color"
          />

          </div>

          </div>

          </div>

          )} */}

                {/* tab modifier */}
                {activeTab === "modifier" && (

                  <div>

                    {modifiers.length === 0 ? (

                      <p>No modifier data</p>

                    ) : (

                      <div className="modifier-box">

                        <input
                          type="text"
                          placeholder="Search Modifier..."
                          className="modifier-search"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />

                        <div className="modifier-list">

                          {filteredModifiers.map((m) => (

                            <label key={m.ModifierId} className="modifier-item">

                              <input
                                type="checkbox"
                                checked={selectedModifiers.includes(m.ModifierId)}

                                onChange={async (e) => {

                                  const checked = e.target.checked;

                                  // 🔴 IMPORTANT FIX
                                  if (!form.CategoryId) {
                                    alert("Please save category first");
                                    return;
                                  }

                                  // state update
                                  setSelectedModifiers(prev =>
                                    checked
                                      ? [...prev, m.ModifierId]
                                      : prev.filter(id => id !== m.ModifierId)
                                  );

                                  // database update
                                  await axios.post(`${BASE_URL}/categorymodifier`, {
                                    CategoryId: form.CategoryId,
                                    ModifierId: m.ModifierId,
                                    checked: checked,
                                    ModifiedBy: localStorage.getItem("userId")

                                  });

                                }}
                              />

                              {m.ModifierName}

                            </label>
                          ))}

                        </div>

                      </div>

                    )}

                  </div>

                )}



                {/* tab kitchen */}
                {activeTab === "kitchen" && (

                  <div className="kitchen-box">

                    {kitchens.length === 0 ? (

                      <p>No kitchen data</p>

                    ) : (

                      <div className="kitchen-list-about">

                        {kitchens.map((k) => (
                          <label key={k.KitchenTypeId} className="kitchen-item1">

                            <input
                              type="checkbox"
                              checked={selectedKitchens.includes(Number(k.KitchenTypeCode))}

                              onChange={async (e) => {

                                const checked = e.target.checked;

                                // state update
                                setSelectedKitchens(prev =>
                                  checked
                                    ? [...prev, Number(k.KitchenTypeCode)]
                                    : prev.filter(id => id !== Number(k.KitchenTypeCode))
                                );

                                // IMPORTANT
                                if (!form.CategoryId) {
                                  alert("Please save category first");
                                  return;
                                }

                                await axios.post(`${BASE_URL}/categorykitchen`, {
                                  CategoryId: form.CategoryId,
                                  KitchenTypeCode: k.KitchenTypeCode,
                                  KitchenTypeName: k.KitchenTypeName,
                                  checked: checked
                                });

                              }}
                            />

                            {k.KitchenTypeName}

                          </label>
                        ))}

                      </div>

                    )}

                  </div>

                )}


              </div>

              <div className="cat-modal-buttons">

                <button type="submit" className="cat-save-btn" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </button>

                <button
                  type="button"
                  className="cat-cancel-btn"
                  onClick={() => {
                    setShowModal(false);
                    setEditIndex(null);
                  }}
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      <div className="table-responsive">
        <table className="cat-table">

          <thead>
            <tr>
              <th onClick={() => setActiveFilter("CategoryCode")}>
                Code

                {activeFilter === "CategoryCode" && (
                  <input
                    type="text"
                    onClick={(e) => e.stopPropagation()}
                    value={filters.CategoryCode || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, CategoryCode: e.target.value })
                    }
                    placeholder="Search..."
                  />
                )}
              </th>
              <th onClick={() => setActiveFilter("CategoryName")}>
                Name

                {activeFilter === "CategoryName" && (
                  <input
                    type="text"
                    onClick={(e) => e.stopPropagation()}
                    value={filters.CategoryName || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, CategoryName: e.target.value })
                    }
                  />
                )}
              </th>
              <th onClick={() => setActiveFilter("ShortName")}>
                Short

                {activeFilter === "ShortName" && (
                  <input
                    type="text"
                    onClick={(e) => e.stopPropagation()}
                    value={filters.ShortName || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, ShortName: e.target.value })
                    }
                  />
                )}
              </th>
              <th>Sort</th>
              <th onClick={() => setActiveFilter("isActive")}>
                Active

                {activeFilter === "isActive" && (
                  <select
                    onClick={(e) => e.stopPropagation()}
                    value={filters.isActive || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, isActive: e.target.value })
                    }
                  >
                    <option value="">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                )}
              </th>
              <th onClick={() => setActiveFilter("IsPublished")}>
                Hide in QR

                {activeFilter === "IsPublished" && (
                  <select
                    onClick={(e) => e.stopPropagation()}
                    value={filters.IsPublished || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, IsPublished: e.target.value })
                    }
                  >
                    <option value="">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                )}
              </th>
              <th>Discount</th>
              <th>Kitchen</th>
              <th>Tax</th>
              {/* <th>Language</th> */}
              <th>Service</th>
              <th>Member</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td colSpan="11">
                  <div className="spinner"></div>
                </td>
              </tr>

            ) : filteredData.length === 0 ? (

              <tr>
                <td colSpan="11">No entries yet</td>
              </tr>

            ) : (

              paginatedData.map((row, index) => (
                <tr key={index} onClick={() => handleEdit(row)} style={{ cursor: "pointer" }}>
                  <td>{row.CategoryCode}</td>
                  <td>{row.CategoryName}</td>
                  <td>{row.ShortName}</td>
                  <td>{row.SortCode}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={row.isActive}
                      onChange={() => toggleField(row, "isActive")}
                    />
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={row.IsPublished}
                      onChange={() => toggleField(row, "IsPublished")}
                    />
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={row.isDiscountAllowed}
                      onChange={() => toggleField(row, "isDiscountAllowed")}
                    />
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={row.isKitchenPrint}
                      onChange={() => toggleField(row, "isKitchenPrint")}
                    />
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={row.isTaxAllowed}
                      onChange={() => toggleField(row, "isTaxAllowed")}
                    />
                  </td>
                  {/* <td>{row.NameInOtherLanguage ? "Yes":"No"}</td> */}
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={row.isServiceCharge}
                      onChange={() => toggleField(row, "isServiceCharge")}
                    />
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={row.isMemberSalesAllowed}
                      onChange={() => toggleField(row, "isMemberSalesAllowed")}
                    />
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleDelete(row.CategoryId, e)}
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
      </div>

      <div className="pagination">

        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => prev - 1)}
        >
          Prev
        </button>

        <span>
          page {showingFrom}–{showingTo} of {totalRows}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(prev => prev + 1)}
        >
          Next
        </button>

      </div>

    </div>

  );

}

export default About;