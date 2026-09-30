import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ChangePassword.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { BASE_URL } from "../config/api";

export default function ChangePassword() {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const userId = localStorage.getItem("userId");
  console.log("UserId:", userId);

  const navigate = useNavigate();

  const handleSave = async () => {
    if (!oldPass || !newPass || !confirmPass) {
      alert("Please fill all fields");
      return;
    }

    if (newPass !== confirmPass) {
      alert("Password mismatch");
      return;
    }

    try {
      const userId = localStorage.getItem("userId");

      const res = await fetch(`${BASE_URL}/api/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId,
          oldPassword: oldPass,
          newPassword: newPass
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert(data.message);

      setOldPass("");
      setNewPass("");
      setConfirmPass("");

      // navigate("/usergroup");

    } catch (err) {
      console.error(err);
      alert("Error ❌");
    }
  };

  const handleClose = () => {
    setOldPass("");
    setNewPass("");
    setConfirmPass("");
  };

  return (
    <div className="change-container">
      <div className="change-password-box">
        <h3>Change Password</h3>

        <div className="change-input-group change-password-field">
        <label>Old Password</label>

        <input
          type={showOld ? "text" : "password"}
          value={oldPass}
          onChange={(e) => setOldPass(e.target.value)}
        />

        <span onClick={() => setShowOld(!showOld)}>
          {showOld ? <FaEyeSlash /> : <FaEye />}
        </span>
      </div>

        <div className="change-input-group change-password-field">
        <label>New Password</label>

        <input
          type={showNew ? "text" : "password"}
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
        />

        <span onClick={() => setShowNew(!showNew)}>
          {showNew ? <FaEyeSlash /> : <FaEye />}
        </span>
      </div>

       <div className="change-input-group change-password-field">
        <label>Confirm Password</label>

        <input
          type={showConfirm ? "text" : "password"}
          value={confirmPass}
          onChange={(e) => setConfirmPass(e.target.value)}
        />

        <span onClick={() => setShowConfirm(!showConfirm)}>
          {showConfirm ? <FaEyeSlash /> : <FaEye />}
        </span>
      </div>

        <div className="change-action-buttons">
          <button className="change-save-btn" onClick={handleSave}>
            Save
          </button>
          {/* optional close */}
          {/* <button className="change-close-btn" onClick={handleClose}>Close</button> */}
        </div>

      </div>
    </div>
  );
}