import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../config/api";
import "./tablemaster.css";

export default function TableManagement() {
  const [tables, setTables] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    TableId: "",
    TableNumber: "",
    Seats: 0,
    ReservationAllowed: false,
    DiningSection: 1,
    StartTime: "",
    EndTime: "",
    SortCode: 1,        // ✅ FIX
    PrintSection: 1,    // ✅ FIX
    Row: "",
    Col: "",
    IsTakeAway: false
  });

  useEffect(() => {
    loadTables(); // load all
  }, []);



  // ✅ LOAD FROM API (NO FRONTEND FILTER)
  const loadTables = async (section = 1) => {
    try {
    const url =
        section === 0
          ? `${BASE_URL}/api/tablemaster`
          : `${BASE_URL}/api/tablemaster?section=${section}`;

      const res = await axios.get(url);
      setTables(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ AUTO GRID
  const getPosition = (t, index) => ({
    gridRow:
      t.Row && t.Row > 0 ? Number(t.Row) : Math.floor(index / 10) + 1,
    gridColumn:
      t.Col && t.Col > 0 ? Number(t.Col) : (index % 10) + 1
  });

  // ✅ OPEN FORM
  const openForm = (table = null) => {
    if (table) {

      const [sh, sm] = (table.StartTime || "00:00").split(":");
      const [eh, em] = (table.EndTime || "00:00").split(":");

      setForm({
        ...table,
        DiningSection: Number(table.DiningSection),
        Row: table.Row || "",
        Col: table.Col || "",
        ReservationAllowed: !!table.ReservationAllowed,

        SortCode: table.SortCode || 1,        // ✅ OK
        PrintSection: table.PrintSection || 1,// ✅ OK

        StartHour: sh,
        StartMin: sm,
        EndHour: eh,
        EndMin: em
      });

    } else {

      // ✅ NO table usage here
      setForm({
        TableId: "",
        TableNumber: "",
        Seats: 0,
        ReservationAllowed: false,
        DiningSection: 1,
        Row: "",
        Col: "",

        SortCode: 1,        // ✅ FIX
        PrintSection: 1,    // ✅ FIX
        IsTakeAway: false,

        StartHour: "00",
        StartMin: "00",
        EndHour: "00",
        EndMin: "00"
      });
    }


    setShowForm(true);
  };
  //     const openForm = (table) => {
  //   if (table) {
  //     console.log("EDIT DATA:", table);

  //     setForm({
  //       ...table
  //     });
  //   } else {
  //     setForm({});
  //   }

  //   setShowForm(true);
  // };

  // ✅ CHANGE
  // const handleChange = (e) => {
  //     const { name, value, type, checked } = e.target;
  //    setForm({
  //         ...form,
  //         [name]:
  //             type === "checkbox"
  //                 ? checked
  //                 : name === "DiningSection"
  //                     ? Number(value)
  //                     : value
  //     });
  // };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "IsTakeAway") {
      setForm({
        ...form,
        IsTakeAway: checked,
        DiningSection: checked ? 4 : form.DiningSection  // 👈 auto set
      });
      return;
    }

    setForm({
      ...form,
      [name]:
        type === "checkbox"
          ? checked
          : name === "DiningSection"
            ? Number(value)
            : value
    });
  };

  // ✅ SAVE
  const saveTable = async () => {
    try {
      if (!form.TableNumber) return alert("Enter Table Number");

      // 🔥 safe pad (important)
      const pad = (v) => String(v || "0").padStart(2, "0");

      const StartTime = `${pad(form.StartHour)}:${pad(form.StartMin)}`;
      const EndTime = `${pad(form.EndHour)}:${pad(form.EndMin)}`;

      // 🔥 remove old time from form
      const { StartTime: _, EndTime: __, ...cleanForm } = form;

      await axios.post(`${BASE_URL}/api/tablemaster`, {
        ...cleanForm,

        // ✅ force correct values
        StartTime,
        EndTime,

        DiningSection: Number(form.DiningSection),
        Row: form.Row ? Number(form.Row) : 0,
        Col: form.Col ? Number(form.Col) : 0,
        Seats: Number(form.Seats) || 0,
        SortCode: Number(form.SortCode || 1),
        PrintSection: Number(form.PrintSection || 1),
        IsTakeAway: !!form.IsTakeAway
      });

      alert("Saved ✅");
      setShowForm(false);
      loadTables();

    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Save error ❌");
    }
  };
  // const deleteTable = async (id) => {
  //     try {
  //         if (!window.confirm("Delete this table?")) return;

  //         await axios.delete(`${BASE_URL}/tablemaster/${id}`);

  //         alert("Deleted ✅");
  //         loadTables(); // refresh
  //     } catch (err) {
  //         console.error(err);
  //         alert("Delete failed ❌");
  //     }
  // };
  const deleteTable = async (id) => {
    try {
      if (!id) {
        alert("Invalid Table ID ❌");
        return;
      }

      const confirmDelete = window.confirm("Delete this table?");
      if (!confirmDelete) return;

      console.log("Deleting ID:", id);

      await axios.delete(`${BASE_URL}/api/tablemaster/${id}`);

      alert("Deleted ✅");

      setShowForm(false);     // 🔥 close popup
      setForm({});            // 🔥 clear form
      loadTables(1);          // 🔥 refresh grid

    } catch (err) {
      console.error("DELETE ERROR:", err);
      alert("Delete failed ❌");
    }
  };

  return (

    <div className="container">
      <div className="page-header">
        {/* SECTION BUTTONS */}
        <div className="sections">
          <button className="sec-btn-1" onClick={() => loadTables(1)}>Section 1</button>
          <button className="sec-btn-2" onClick={() => loadTables(2)}>Section 2</button>
          <button className="sec-btn-3" onClick={() => loadTables(3)}>Section 3</button>
          <button className="sec-btn-4" onClick={() => loadTables(4)}>Take Away</button>
        </div>

        <button className="add-btn" onClick={() => openForm()}>
          + Add Table
        </button>
      </div>

      {/* GRID */}
      <div className="grid">
        {[...tables]
          .sort((a, b) => {
            // 🔥 SORT PROPERLY (1,2,3 not 1,10,100)
            const getNum = (val) =>
              parseInt(val?.replace(/[^0-9]/g, "")) || 0;

            return getNum(a.TableNumber) - getNum(b.TableNumber);
          })
          .map((t) => (
            <div
              key={t.TableId}
              className={`table-box section-${t.DiningSection}`}
              onClick={() => openForm(t)}
            >
              {t.TableNumber}
            </div>
          ))}
      </div>



      {/* FORM */}
      {/* FORM */}
      {showForm && (
        <div className="modal">
          <div className="form-pos">

            <h3 className="title">Table Master</h3>

            <div className="pos-grid">

              {/* Table Number */}
              <label>Table Number</label>
              <div className="input-with-btn">
                <input
                  name="TableNumber"
                  value={form.TableNumber}
                  onChange={handleChange}
                />
                {/* <button className="small-btn">...</button> */}
              </div>

              {/* Seats */}
              <label>Seats</label>
              <input
                className="small-input"
                name="Seats"
                type="number"
                value={form.Seats}
                onChange={handleChange}
              />

              {/* Reservation */}
              <label>Reservation Allowed</label>
              <input
                className="small-check"
                type="checkbox"
                name="ReservationAllowed"
                checked={form.ReservationAllowed}
                onChange={handleChange}
              />

              {/* Take Away */}
              <label>Take Away</label>
              <input
                className="small-check"
                type="checkbox"
                name="IsTakeAway"
                checked={form.IsTakeAway || false}
                onChange={handleChange}
              />

              {/* Section */}
              <label>Dining Section</label>
              <select
                name="DiningSection"
                value={form.DiningSection}
                onChange={handleChange}
                className="small-input"
                disabled={form.IsTakeAway}   // 👈 THIS LINE
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>

              {/* Start Time */}
              {/* Start Time */}
              <label>Start Time</label>
              <div className="time-box">
                <input
                  className="time-input"
                  maxLength="2"
                  placeholder="00"
                  value={form.StartHour || ""}
                  onChange={(e) =>
                    setForm({ ...form, StartHour: e.target.value })
                  }
                />
                <span>:</span>
                <input
                  className="time-input"
                  maxLength="2"
                  placeholder="00"
                  value={form.StartMin || ""}
                  onChange={(e) =>
                    setForm({ ...form, StartMin: e.target.value })
                  }
                />
              </div>

              {/* End Time */}
              <label>End Time</label>
              <div className="time-box">
                <input
                  className="time-input"
                  maxLength="2"
                  placeholder="00"
                  value={form.EndHour || ""}
                  onChange={(e) =>
                    setForm({ ...form, EndHour: e.target.value })
                  }
                />
                <span>:</span>
                <input
                  className="time-input"
                  maxLength="2"
                  placeholder="00"
                  value={form.EndMin || ""}
                  onChange={(e) =>
                    setForm({ ...form, EndMin: e.target.value })
                  }
                />
              </div>

              {/* Sort Code */}
              {/* <label>Sort Code</label>
        <input className="small-input"
        value={form.SortCode || ""}
         onChange={handleChange} /> */}
              {/* <input
  type="number"
  className="small-input"
  name="SortCode"              // ✅ REQUIRED
  value={form.SortCode || ""}
  onChange={handleChange}
/> */}

              {/* Print Section */}
              {/* <label>Print Section</label>
        <input className="small-input"
         value={form.PrintSection || ""}
          onChange={handleChange} /> */}
              {/* <input
  type="number"
  className="small-input"
  name="PrintSection"          // ✅ REQUIRED
  value={form.PrintSection || ""}
  onChange={handleChange}
/> */}

              {/* <div className="bottom-row">
  <div> */}
              <label>Sort Code</label>
              <input
                className="inputitem"
                type="number"
                name="SortCode"
                value={form.SortCode || ""}
                onChange={handleChange}
              />
              {/* </div> */}

              {/* <div> */}
              <label>Print Section</label>
              <input
                className="inputitem"
                type="number"
                name="PrintSection"
                value={form.PrintSection || ""}
                onChange={handleChange}
              />
              {/* </div>
</div> */}

            </div>

            {/* BUTTONS */}
            <div className="pos-buttons">
              {/* <button className="btn new">New (F6)</button> */}
              <button className="btn save" onClick={saveTable}>Save</button>

              {/* {form.TableId && (
          <button className="btn delete" onClick={() => deleteTable(form.TableId)}>
            Delete
          </button>
        )} */}

              {form.TableId && (
                <button
                  className="btn delete"
                  onClick={() => deleteTable(form.TableId)}
                >
                  Delete
                </button>
              )}

              <button className="btn exit" onClick={() => setShowForm(false)}>
                Exit
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}