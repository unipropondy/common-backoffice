import React, { useState, useEffect } from "react";
import "./TimeEntry.css";
import { BASE_URL } from "../config/api";
export default function TimeEntryModal() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState("");
  const [staffName, setStaffName] = useState("");

  useEffect(() => {
    setUserName("");
    setPassword("");
    setStaffName("");
  }, []);

  // 🔹 Get User
  const getUser = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/timeEntry/getUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userName })
      });

      const data = await res.json();

      if (!res.ok) throw new Error();

      setUserId(data.UserId);
      setStaffName(data.FullName);

    } catch {
      setStaffName("");
    }
  };

  // 🔹 Button Action
  const handleAction = async (status) => {

      console.log("CLICKED", { userId, status });
    if (!password) {
      alert("Enter Password");
      return;
    }

    try {
      await fetch(`${BASE_URL}/api/timeEntry/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId,
          status
        })
      });

      alert("✅ Saved");

      setUserName("");
      setPassword("");
      setStaffName("");

    } catch {
      alert("Error");
    }
  };

  return (
    <div className="time-container">

      <form autoComplete="off">

        {/* 🔥 Dummy inputs (IMPORTANT) */}
        <input type="text" name="fakeuser" style={{ display: "none" }} />
        <input type="password" name="fakepass" style={{ display: "none" }} />

        {/* Header */}
        <div className="time-header">
          <h1>
            Time <span>Entry</span>
          </h1>
          <span className="time-date">{new Date().toDateString()}</span>
        </div>

        {/* Form */}
        <div className="time-form">

          <label>User ID</label>
          <input
            type="text"
            name="randomUser123"
            autoComplete="off"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onBlur={getUser}
            placeholder="Enter User ID"
          />

          <label>Password</label>
          <input
            type="password"
            name="randomPass123"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter Password"
          />

          <label>Staff Name</label>
          <input
            type="text"
            value={staffName}
            readOnly
            placeholder="Staff Name"
          />
        </div>

        {/* Buttons */}
        <div className="time-button-grid">
        <button className="time-btn time-green" onClick={() => handleAction(1)}>IN</button>
        <button className="time-btn time-red" onClick={() => handleAction(0)}>OUT</button>
        <button className="time-btn time-green" onClick={() => handleAction(4)}>BREAK IN</button>
        <button className="time-btn time-red" onClick={() => handleAction(3)}>BREAK OUT</button>
      </div>

      </form>
    </div>
  );
}