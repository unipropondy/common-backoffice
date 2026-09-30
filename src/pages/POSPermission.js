import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import "./POSPermission.css";
 import { BASE_URL } from "../config/api";
 
const API = `${BASE_URL}/api`;
 
export default function POSPermission() {
 
  const [groupCode, setGroupCode] = useState("");
  const [data, setData] = useState([]);
 
  // 🔥 FETCH
  const { refetch } = useQuery({
    queryKey: ["pos", groupCode],
    enabled: false,
    queryFn: async () => {
      const res = await axios.get(
        `${API}/pos-permission/group/${groupCode}`
      );
      setData(res.data);
      return res.data;
    }
  });
 
  // 🔥 GROUP LIST
  const { data: groupList = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await axios.get(`${API}/pos-permission/groups/lov`);
      return res.data;
    }
  });
 
  // 🔥 TOGGLE
  const toggle = (index) => {
    const updated = [...data];
    updated[index].Status = updated[index].Status ? 0 : 1;
    setData(updated);
  };
 
  // 🔥 LOAD
  const handleLoad = () => {
    if (!groupCode) {
      alert("Please select group");
      return;
    }
    refetch();
  };
 
  // 🔥 SAVE
  const saveMutation = useMutation({
    mutationFn: () =>
      axios.post(`${API}/pos-permission/group/save`, {
        groupCode,
        permissions: data,
        userId: "admin"
      }),
    onSuccess: () => alert("Saved Successfully ✅")
  });
 
  return (
    <div className="pos-page">
 
      <h2 className="pos-title">POS Permission</h2>
 
      {/* 🔥 TOP SECTION */}
      <div className="pos-top">
 
        <div className="lov-container">
 
          <label className="lov-label">Group Name</label>
 
          <div className="lov-row">
 
            <select
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value)}
            >
              <option value="">-- Select Group --</option>
 
              {groupList.map((g) => (
                <option key={g.UserGroupId} value={g.UserGroupCode}>
                  {g.UserGroupName}
                </option>
              ))}
            </select>
 
            <button className="btn-load" onClick={handleLoad}>
              Load
            </button>
 
            <button
              className="btn-save"
              onClick={() => saveMutation.mutate()}
            >
              Save
            </button>
 
          </div>
 
        </div>
 
      </div>
 
      {/* 🔥 TABLE */}
      <table className="pos-table">
        <thead>
          <tr>
            <th>Function Group</th>
            <th>Function Code</th>
            <th>Description</th>
            <th>Allow</th>
          </tr>
        </thead>
 
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="4">No Data</td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i}>
                <td>{row.FunctionGroup}</td>
                <td>{row.FunctionCode}</td>
                <td>{row.FunctionDescription}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={Boolean(row.Status)}
                    onChange={() => toggle(i)}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
 
    </div>
  );
}
 