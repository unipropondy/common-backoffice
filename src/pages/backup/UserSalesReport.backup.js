
import React, { useEffect, useState } from "react";
import "./UserSalesReport.css";
import { BASE_URL } from "../config/api";

export default function UserSalesReport() {
    const API_URL = BASE_URL;

    const [users, setUsers] = useState([]);
    const [userId, setUserId] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [sales, setSales] = useState([]);
    const [hasGeneratedReport, setHasGeneratedReport] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadUsers = async () => {
            const endpoints = [
                `${API_URL}/api/usermaster`,
                `${API_URL}/api/user-sales/users`,
                `${API_URL}/users`,
            ];

            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint);
                    if (!response.ok) {
                        continue;
                    }

                    const data = await response.json();
                    const userList = Array.isArray(data)
                        ? data
                        : data.recordset || data.users || data.data || [];

                    if (userList.length > 0) {
                        setUsers(userList);
                        return;
                    }
                } catch (err) {
                    console.warn(`Failed to load users from ${endpoint}:`, err);
                }
            }

            setUsers([]);
            setError("Unable to load users from UserMaster");
        };

        loadUsers();
    }, [API_URL]);

    const generateReport = async () => {
        if (!userId) {
            setError("Please select a user");
            setSales([]);
            return;
        }

        if (!fromDate || !toDate) {
            setError("Please select both From Date and To Date");
            setSales([]);
            return;
        }

        if (fromDate > toDate) {
            setError("From Date cannot be later than To Date");
            setSales([]);
            return;
        }

        setLoading(true);
        setError("");
        setHasGeneratedReport(false);

        try {
            const params = new URLSearchParams({
                userId,
                fromDate,
                toDate,
            });
            const response = await fetch(
                `${API_URL}/api/user-sales?${params.toString()}`
            );

            const responseText = await response.text();

            if (!response.ok) {
                let serverMessage = "Unable to load sales report";

                try {
                    const parsed = JSON.parse(responseText);
                    if (parsed && parsed.message) {
                        serverMessage = parsed.message;
                    }
                } catch {
                    if (responseText) {
                        serverMessage = responseText;
                    }
                }

                throw new Error(serverMessage);
            }

            const data = responseText ? JSON.parse(responseText) : [];
            setSales(Array.isArray(data) ? data : []);
            setHasGeneratedReport(true);
        } catch (err) {
            console.error("Sales report error:", err);
            setError(err.message || "Unable to load sales report");
            setSales([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="user-sales-report">
            <h2>User-wise Sales Report</h2>

            <div className="report-filters">
                <div className="report-filter">
                    <label htmlFor="userSelect">SELECT USER</label>
                    <select
                        id="userSelect"
                        value={userId}
                        onChange={(e) => {
                            setUserId(e.target.value);
                            setSales([]);
                            setHasGeneratedReport(false);
                            setError("");
                        }}
                    >
                        <option value="">-- Select User --</option>

                        {users.map((user) => {
                            const id = user.UserId ?? user.userId ?? "";
                            const name = user.UserName ?? user.userName ?? "Unknown";

                            return (
                                <option key={id || name} value={id}>
                                    {name}
                                </option>
                            );
                        })}
                    </select>
                </div>
                <div className="report-filter">
                    <label htmlFor="fromDate">FROM DATE</label>
                    <input
                        id="fromDate"
                        type="date"
                        value={fromDate}
                        onChange={(e) => {
                            setFromDate(e.target.value);
                            setSales([]);
                            setHasGeneratedReport(false);
                            setError("");
                        }}
                    />
                </div>
                <div className="report-filter">
                    <label htmlFor="toDate">TO DATE</label>
                    <input
                        id="toDate"
                        type="date"
                        value={toDate}
                        onChange={(e) => {
                            setToDate(e.target.value);
                            setSales([]);
                            setHasGeneratedReport(false);
                            setError("");
                        }}
                    />
                </div>
                <button
                    type="button"
                    onClick={generateReport}
                    disabled={loading}
                >
                    {loading ? "Loading..." : "Generate Report"}
                </button>
                {hasGeneratedReport && (
                    <div className="user-sales-count-card">
                        <span className="user-sales-count-label">Total Bills</span>
                        <strong className="user-sales-count-value">{sales.length}</strong>
                    </div>
                )}
            </div>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <div className="user-sales-summary">
                {sales.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Bill No</th>
                            <th>User Name</th>
                            <th>Sales Amount</th>
                        </tr>
                    </thead>

                    <tbody>
                        {sales.map((item, index) => (
                            <tr key={`${item.SettlementID}-${index}`}>
                                <td>
                                    {item.BillDate
                                        ? item.BillDate.slice(0, 10).split("-").reverse().join("/")
                                        : ""}
                                </td>
                                <td>{item.BillNo}</td>
                                <td>{item.UserName}</td>
                                <td>
                                    {Number(item.SysAmount || 0).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                ) : (
                    !loading &&
                    hasGeneratedReport &&
                    userId &&
                    !error && <p>No sales records found for this user.</p>
                )}
            </div>
        </div>
    );
}
