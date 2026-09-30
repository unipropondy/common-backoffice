import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./Member.css";
import { BASE_URL } from "../config/api";
import { useNavigate, useParams } from "react-router-dom";

function Customer() {
  const { id } = useParams(); 
  console.log("PARAM ID 👉", id);

  const [form, setForm] = useState({
  id: "",   // ✅ ADD THIS LINE
  code: "",
  contactPerson: "",
  companyName: "",
  ic: "",
  email: "",
  phone: "",
  homePhone: "",
  dob: "",
  category: "Standard",
  classification: "Regular",
  homeAddress: "",
  officeAddress: "",
  city: "Singapore",
  postalCode: "",
  invoiceDate: "",
  mealRate: 0,
  memberMeal: false,
  noSales: false,
  cardNo: "",
  tagId: "",
  paidAmount: 0,
  servicePercent: 0,
  serviceValue: 0,
  fromDate: "",
  toDate: "",
  currentBalance: 0,
  lastTopupDate: "",
  cash: 0,
});

  const [activeTab, setActiveTab] = useState("meal");

  const [mealList, setMealList] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);

   const navigate = useNavigate();

   const fetchNewCode = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/api/customermember/newcode`);

    console.log("AUTO NEW CODE 👉", res.data);

    setForm(prev => ({
      ...prev,
      id: "",
      code: res.data.code
    }));

  } catch (err) {
    console.log("NEW CODE ERROR ❌", err);
  }
};

  // 🔥 ADD HERE
useEffect(() => {
  if (id) {
    // 🔵 EDIT MODE
    fetchCustomerById(id);
  } else {
    // 🟢 NEW MODE
    fetchNewCode();
  }
}, [id]);
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };
  

  // ✅ ADD (dummy row for now / later popup add pannalam)
  const handleAddMeal = () => {
    const newRow = {
      dishCode: "NEW",
      dishName: "New Dish",
      startDate: "",
      endDate: "",
      veg: 0,
      nonVeg: 0,
      qty: 0
    };
    setMealList([...mealList, newRow]);
  };

  // ✅ DELETE SELECTED ROW
  const handleDeleteMeal = () => {
    if (selectedIndex === null) return;
    const updated = mealList.filter((_, i) => i !== selectedIndex);
    setMealList(updated);
    setSelectedIndex(null);
  };

  const handleMealChange = (index, field, value) => {
  const updated = [...mealList];   // copy array
  updated[index][field] = value;   // update value
  setMealList(updated);            // set state
};

// 🔥 ADD HERE
const fetchCustomerById = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/api/customermember/${id}`);

    const data = res.data;

    console.log("EDIT DATA 👉", data);

    if (data) {
      setForm({
        id: data.CustomerId || "",
        code: data.CustomerCode || "",
        contactPerson: data.ContactPerson || "",
        companyName: data.Name || "",
        email: data.EmailId1 || "",
        phone: data.Address1_Telephone1 || "",
        city: data.Address1_City || "Singapore",

        homeAddress: "",
        postalCode: "",
        dob: "",
        category: "Standard",
        classification: "Regular",
        officeAddress: "",
        homePhone: "",
        invoiceDate: "",
        mealRate: 0,
        memberMeal: false,
        noSales: false,
         fromDate: data.FromDate ? data.FromDate.split("T")[0] : "",
        toDate: data.ToDate ? data.ToDate.split("T")[0] : "",
        lastTopupDate: data.InvoiceDate ? data.InvoiceDate.split("T")[0] : "",
        currentBalance: data.TotalPoints || 0,
        cash: data.RedeemPoints || 0,
        cardNo: data.CardNo || ""
      });
    }

  } catch (err) {
    console.log("FETCH ERROR ❌", err);
  }
};
  const icInputRef = useRef();
  const photoInputRef = useRef();

  const [photoFile, setPhotoFile] = useState(null);
const [icFile, setIcFile] = useState(null);

  // ✅ SAVE
 const handleSave = async () => {
  try {

    const userId = localStorage.getItem("userId");

    console.log("SENDING 👉", form);

    const res = await axios.post(`${BASE_URL}/api/customermember`, {
      CustomerId: form.id || null,

      Name: form.companyName,
      ContactPerson: form.contactPerson,
      EmailId1: form.email,

      Address1_Line1: form.homeAddress,
      Address1_City: form.city,
      Address1_PostalCode: form.postalCode,
      Address1_Telephone1: form.phone,

      DOB: form.dob || null,

      // 🔥 ADD THIS BLOCK (VERY IMPORTANT)
      CategoryCode: 1,
      ClassificationCode: 1,
      Address1_TypeCode: 1,
      StatusCode: 1,

      // 🔥 VALUE CARD
      FromDate: form.fromDate || null,
      ToDate: form.toDate || null,
      InvoiceDate: form.lastTopupDate || null,

      OpeningBalance: form.paidAmount || 0,
      TotalPoints: form.currentBalance || 0,
      RedeemPoints: form.cash || 0,

      CardNo: form.cardNo || "",

      CreatedBy: userId || "00000000-0000-0000-0000-000000000001"
    });

    setForm(prev => ({
      ...prev,
      id: res.data.CustomerId,
      code: res.data.CustomerCode
    }));

    alert("Saved Successfully");

  } catch (err) {
    console.log("ERROR FULL ❌", err);
    console.log("ERROR DATA ❌", err.response?.data);
    alert(err.response?.data?.error || "Save failed");
  }
};

  return (
    
    <div className="mem-main-container">

      <div className="mem-header-bar">
  <div className="mem-page-title">Customer Master</div>

  <div className="mem-header-actions">
  <button className="mem-save-btn" onClick={handleSave}>
    Save
  </button>

   <button className="mem-exit-btn" onClick={() => navigate("/CustomerList")}>
    Exit
  </button>
</div>
</div>

      {/* FORM */}
      <table className="mem-form-table">
        <tbody>

          <tr>
            <td>Code</td>
            <td><input name="code" value={form.code} disabled /></td>

            <td>Category Code</td>
            <td>
              <select name="category" value={form.category} onChange={handleChange}>
                <option>Standard</option>
              </select>
            </td>
          </tr>

          <tr>
            <td>Contact Name*</td>
            <td>
              <input name="contactPerson" value={form.contactPerson} onChange={handleChange} />
            </td>

            <td>Classification</td>
            <td>
              <select name="classification" value={form.classification} onChange={handleChange}>
                <option>Regular</option>
              </select>
            </td>
          </tr>

          <tr>
            <td>Company Name</td>
            <td>
              <input name="companyName" value={form.companyName} onChange={handleChange} />
            </td>

            <td>Email Id</td>
            <td>
              <input name="email" value={form.email} onChange={handleChange} />
            </td>
          </tr>

          <tr>
            <td>IC/Passport No</td>
            <td>
              <input name="ic" value={form.ic} onChange={handleChange} />
            </td>

            <td>Hand Phone</td>
            <td>
              <input name="phone" value={form.phone} onChange={handleChange} />
            </td>
          </tr>

          <tr>
            <td>Home Address</td>
            <td>
              <input name="homeAddress" value={form.homeAddress} onChange={handleChange} />
            </td>

            <td>Office Address</td>
            <td>
              <input name="officeAddress" value={form.officeAddress} onChange={handleChange} />
            </td>
          </tr>

          <tr>
            <td>City</td>
            <td><input value="Singapore" readOnly /></td>

            <td>City</td>
            <td><input value="Singapore" readOnly /></td>
          </tr>

          <tr>
            <td>Postal Code</td>
            <td>
              <input name="postalCode" value={form.postalCode} onChange={handleChange} />
            </td>

            <td>Postal Code</td>
            <td><input /></td>
          </tr>

          <tr>
            <td>DOB</td>
            <td>
              <input type="date" name="dob" value={form.dob} onChange={handleChange} />
            </td>

            <td>Invoice Date</td>
            <td>
              <input type="date" name="invoiceDate" value={form.invoiceDate} onChange={handleChange} />
            </td>
          </tr>

          <tr>
            <td>Phone No.*</td>
            <td>
              <input name="homePhone" value={form.homePhone} onChange={handleChange} />
            </td>

            <td>Meal Rate</td>
            <td>
              <input name="mealRate" value={form.mealRate} onChange={handleChange} />
            </td>
          </tr>

         <tr>
  <td></td>
  <td></td>

  <td colSpan="2">
    <div className="mem-checkbox-group">

      <label className="mem-checkbox">
        <input
          type="checkbox"
          name="memberMeal"
          checked={form.memberMeal}
          onChange={handleChange}
        />
        Member Meal
      </label>

      <label className="mem-checkbox">
        <input
          type="checkbox"
          name="noSales"
          checked={form.noSales}
          onChange={handleChange}
        />
        No Sales
      </label>

    </div>
  </td>
</tr>

        </tbody>
      </table>

      {/* TABS */}
      <div className="mem-tabs">

        <div className="mem-tab-header">
          <button className={activeTab==="meal"?"active":""} onClick={()=>setActiveTab("meal")}>Customer Meal</button>
                <button 
        className={activeTab==="value"?"active":""} 
        onClick={()=>setActiveTab("value")}
      >
        Value Card
      </button>
          <button 
            className={activeTab==="other"?"active":""}
            onClick={()=>setActiveTab("other")}
          >
            Other Detail
          </button>
        </div>

        {activeTab === "meal" && (
          <div className="mem-tab-content">

             <div className="mem-meal-header">
      <div className="mem-meal-actions">
        <button className="mem-btn-add" onClick={handleAddMeal}>Add</button>
        <button className="mem-btn-delete" onClick={handleDeleteMeal}>Delete</button>
        <button className="mem-btn-save" onClick={handleSave}>Save</button>
      </div>
    </div>

            {/* GRID */}
            <table className="mem-meal-table">
              <thead>
                <tr>
                  <th>Dish Code</th>
                  <th>Dish Name</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Veg</th>
                  <th>Non-Veg</th>
                  <th>Qty</th>
                </tr>
              </thead>

              <tbody>
                {mealList.map((m, i) => (
                  <tr
                    key={i}
                    onClick={() => setSelectedIndex(i)}
                    className={selectedIndex === i ? "mem-selected-row" : ""}
                  >
                   <td>
                    <input
                      value={m.dishCode}
                      onChange={(e) => handleMealChange(i, "dishCode", e.target.value)}
                    />
                  </td>
                     <td>
                  <input
                    value={m.dishName}
                    onChange={(e) => handleMealChange(i, "dishName", e.target.value)}
                  />
                </td>
                    <td>
                      <input
                        type="date"
                        value={m.startDate}
                        onChange={(e) => handleMealChange(i, "startDate", e.target.value)}
                      />
                    </td>
                   <td>
                    <input
                      type="date"
                      value={m.endDate}
                      onChange={(e) => handleMealChange(i, "endDate", e.target.value)}
                    />
                  </td>
                                    <td>
                    <input
                      type="number"
                      value={m.veg}
                      onChange={(e) => handleMealChange(i, "veg", e.target.value)}
                    />
                  </td>
                                <td>
                    <input
                      type="number"
                      value={m.nonVeg}
                      onChange={(e) => handleMealChange(i, "nonVeg", e.target.value)}
                    />
                  </td>
                                    <td>
                    <input
                      type="number"
                      value={m.qty}
                      onChange={(e) => handleMealChange(i, "qty", e.target.value)}
                    />
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>


          </div>
        )}

       {activeTab === "value" && (
       <div className="mem-tab-content">

       <div className="mem-value-card-container">

      <div className="mem-value-card-grid">

        {/* LEFT */}
        <div className="mem-value-left">

          <div className="mem-form-row">
            <label>Card Number</label>
            <div className="input-with-btn">
              <input 
                name="cardNo"
                value={form.cardNo}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="mem-form-row">
            <label>Tag ID</label>
            <input 
              name="tagId"
              value={form.tagId}
              onChange={handleChange}
            />
          </div>

          <div className="mem-form-row">
            <label>Paid Amount</label>
            <input 
              name="paidAmount"
              value={form.paidAmount}
              onChange={handleChange}
            />
          </div>

          <div className="mem-form-row">
            <label>Service %</label>
            <input 
              name="servicePercent"
              value={form.servicePercent}
              onChange={handleChange}
            />
          </div>

          <div className="mem-form-row">
            <label>Service Value</label>
            <input 
              name="serviceValue"
              value={form.serviceValue}
              onChange={handleChange}
            />
          </div>

        </div>

        {/* RIGHT */}
        <div className="mem-value-right">

          <div className="mem-form-row">
            <label>From Date</label>
            <div className="input-with-btn">
              <input
                type="date"
                name="fromDate"
                value={form.fromDate}
                onChange={handleChange}
              />
              {/* <button type="button">📅</button> */}
            </div>
          </div>

          <div className="mem-form-row">
          <label>To Date</label>
          <div className="input-with-btn">
            <input
              type="date"
              name="toDate"
              value={form.toDate}
              onChange={handleChange}
            />
            {/* <button type="button">📅</button> */}
          </div>
        </div>

         <div className="mem-form-row">
          <label>Current Balance</label>
          <input
            name="currentBalance"
            value={form.currentBalance}
            onChange={handleChange}
          />
        </div>

          <div className="mem-form-row">
          <label>Last Top Up Date</label>
          <input
            type="date"
            name="lastTopupDate"
            value={form.lastTopupDate}
            onChange={handleChange}
          />
        </div>

          <div className="mem-form-row">
            <label>CASH</label>
            <input 
            name="cash"
            value={form.cash}
            onChange={handleChange}
          />
          </div>

        </div>

      </div>

    </div>

  </div>
)}

{activeTab === "other" && (
  <div className="mem-tab-content">

    <div className="mem-other-box">

      <div className="mem-other-grid">

        {/* LEFT */}
        <div className="mem-other-left">

          <div className="mem-form-row">
            <label>Route Code</label>
            <div className="mem-input-with-btn">
              <input />
              <button className="mem-dot-btn">.</button>
            </div>
          </div>

          <div className="mem-form-row">
            <label>Route Name</label>
            <input />
          </div>

          <div className="mem-form-row">
            <label>Opening Balance</label>
            <input className="mem-amount" value="0" readOnly />
          </div>

        </div>

        {/* RIGHT */}
        <div className="mem-other-right">

          {/* PHOTO INPUT */}
              <input
                type="file"
                ref={photoInputRef}
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  console.log("PHOTO:", file);
                  alert("Photo Selected: " + file?.name);
                }}
              />

              <button
                className="upload-big"
                onClick={() => {
                  if (photoInputRef.current) {
                    photoInputRef.current.click();
                  }
                }}
              >
                Upload Photo
              </button>

              {/* IC INPUT */}
              <input
                type="file"
                ref={icInputRef}
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  console.log("IC:", file);
                  alert("IC Selected: " + file?.name);
                }}
              />

              <button
                className="mem-upload-big"
                onClick={() => {
                  if (icInputRef.current) {
                    icInputRef.current.click();
                  }
                }}
              >
                Upload IC
              </button>

        </div>

      </div>

    </div>

  </div>
)}
      </div>

     </div>
  );
}

export default Customer;