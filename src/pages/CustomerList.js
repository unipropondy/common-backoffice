import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../config/api";  
import { useNavigate } from "react-router-dom";
import "./CustomerList.css";
// export const BASE_URL = "http://localhost:5000";
function CustomerList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
  try {
    console.log("BASE URL 👉", BASE_URL);

    const res = await axios.get(`${BASE_URL}/api/customermaster`);

    console.log("API DATA 👉", res.data);

    setData(res.data);
    setLoading(false);

  } catch (err) {
    console.log("FULL ERROR ❌", err);
    console.log("SERVER 👉", err.response?.data);

    setError(err.response?.data?.error || "Failed to load data");
    setLoading(false);
  }
};

  return (
    <div className="list-container">

      <div className="list-header">
        <h2>Customer List</h2>
        <button onClick={() => navigate("/Member")}>New</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <table className="list-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Email</th>
              <th>City</th>
              <th>Phone</th>
            </tr>
          </thead>

          <tbody>
            {data.length > 0 ? (
              data.map((row) => (
                <tr
                  key={row.CustomerId}
                  onClick={() => navigate(`/Member/${row.CustomerId}`)}
                >
                  <td>{row.CustomerCode}</td>
                  <td>{row.Name}</td>
                  <td>{row.ContactPerson}</td>
                  <td>{row.EmailId1}</td>
                  <td>{row.Address1_City}</td>
                  <td>{row.Address1_Telephone1}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No Data Found</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CustomerList;