import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../config/api";
import "./Settlement.css";

function CashierSettlement() {
  const [totalSales, setTotalSales] = useState({});
  const [payments, setPayments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [sales, setSales] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [terminal, setTerminal] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const userId = "0";
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const formatDate = (date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return `${d}/${m}/${y} ${h}:${min}:${s}`;
  };
  useEffect(() => {
    loadTerminals();
  }, []);
  const loadTerminals = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/terminal`);
      setTerminals(res.data);
      if (res.data.length > 0) {
        setTerminal(res.data[0].TerminalCode);
      }
    } catch (err) {
      console.error("❌ TERMINAL LOAD ERROR", err);
    }
  };
  useEffect(() => {
    if (terminal) fetchData();
  }, [terminal]);
  const fetchData = async () => {
    try {
      const total = await axios.get(`${BASE_URL}/api/settlement/total-sales/${terminal}`);
      setTotalSales(total.data);
      const pay = await axios.get(`${BASE_URL}/api/settlement/payment/${terminal}/${userId}`);
      setPayments(pay.data);
      const trans = await axios.get(`${BASE_URL}/api/settlement/transactions/${terminal}/${userId}`);
      setTransactions(trans.data);
      const salesData = await axios.get(`${BASE_URL}/api/settlement/sales-summary/${terminal}`);
      setSales(salesData.data);
    } catch (err) {
      console.error("❌ FETCH DATA ERROR", err);
    }
  };
  const netSales = (totalSales.SubTotal || 0) + (totalSales.ServiceCharge || 0) + (totalSales.TotalTax || 0) - (totalSales.DiscountAmount || 0);
  const salesTotal = sales.reduce((sum, s) => sum + (parseFloat(s.Amount) || 0), 0);
  const paymentsTotal = payments.reduce((sum, p) => sum + (parseFloat(p.Amount) || 0), 0);
  const transactionsTotal = transactions.reduce((sum, t) => {
    const amt = parseFloat(t.Amount) || 0;
    return sum + (t.TransactionType === "IN" ? amt : -amt);
  }, 0);
  return (
    <div className="settle-screen">
      <div className="settle-main-container">
        <div className="settle-top-bar">
          <div className="terminal-selection">
            <span className="terminal-title">Terminal</span>
            <select value={terminal} onChange={(e) => setTerminal(e.target.value)} className="terminal-select">
              <option value="">-- Select --</option>
              {terminals.map((t, i) => (
                <option key={i} value={t.TerminalCode}>{t.TerminalName}</option>
              ))}
            </select>
          </div>
          {/* <div className="datetime-box">{formatDate(currentTime)}</div> */}
        </div>
        <div className="settle-content-grid">
          <div className="summary-section">
            <div className="section-header">Summary</div>
            <div className="summary-table-box">
              <table className="summary-table">
                <tbody>
                  <tr><td>Sales Total</td><td>{totalSales.SubTotal || 0}</td></tr>
                  <tr><td>Total Discount</td><td>{totalSales.DiscountAmount || 0}</td></tr>
                  <tr><td>Service Charge</td><td>{totalSales.ServiceCharge || 0}</td></tr>
                  <tr><td>GST</td><td>{totalSales.TotalTax || 0}</td></tr>
                  <tr><td>Round Off</td><td>{totalSales.RoundedBy || 0}</td></tr>
                  <tr><td>Tips</td><td>{totalSales.Tips || 0}</td></tr>
                  <tr className="net-sales-row"><td>Net Sales</td><td>{netSales.toFixed(2)}</td></tr>
                  <tr><td>Number Of Guests</td><td>{0}</td></tr>
                  <tr><td>Void</td><td>{0}</td></tr>
                </tbody>
              </table>
            </div>
            {/* <div className="section-footer-row">
              <div className="total-indicator" style={{ visibility: "hidden" }}>
                <span className="indicator-label">Total</span>
                <span className="indicator-val">0.00</span>
              </div>
            </div> */}
          </div>
          <div className="sales-summary-section">
            <div className="section-header">Sales Summary</div>
            <div className="table-wrapper summary-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>Paymode</th><th>Manual Amount</th></tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={i} className={p.PaymodeName === "CASH" ? "selected-row" : ""}>
                      <td className="paymode-cell">{p.PaymodeName}</td>
                      <td className="amount-cell">{p.Amount}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && (<tr><td colSpan="2" style={{ height: "100px" }}></td></tr>)}
                </tbody>
              </table>
            </div>
            <div className="section-footer-row">
              <div className="total-indicator">
                <span className="indicator-label">Total</span>
                <span className="indicator-val">{paymentsTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="transactions-section">
            <div className="section-header">Transactions</div>
            <div className="table-wrapper transaction-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>Paymode</th><th>Cash In</th><th>Cash Out</th></tr>
                </thead>
                <tbody>
                  {transactions.length > 0 ? (
                    transactions.map((t, i) => (
                      <tr key={i}>
                        <td>{t.TransactionMode}</td>
                        <td className="amount-cell">{t.TransactionType === "IN" ? t.Amount : "0.00"}</td>
                        <td className="amount-cell">{t.TransactionType === "OUT" ? t.Amount : "0.00"}</td>
                      </tr>
                    ))
                  ) : (<tr><td colSpan="3" style={{ height: "150px" }}></td></tr>)}
                </tbody>
              </table>
            </div>
            <div className="section-footer-row">
              <div className="total-indicator">
                <span className="indicator-label">Total</span>
                <span className="indicator-val">{transactionsTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="sales-section">
            <div className="section-header">Sales</div>
            <div className="table-wrapper sales-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>Paymode</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  {sales.map((s, i) => (
                    <tr key={i} className={s.Paymode === "CASH" ? "selected-row" : ""}>
                      <td className="paymode-cell">{s.Paymode}</td>
                      <td className="amount-cell">{s.Amount}</td>
                    </tr>
                  ))}
                  {sales.length === 0 && (<tr><td colSpan="2" style={{ height: "100px" }}></td></tr>)}
                </tbody>
              </table>
            </div>
            <div className="section-footer-row">
              <div className="total-indicator">
                <span className="indicator-label">Total</span>
                <span className="indicator-val">{salesTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        {/* <div className="settle-bottom-actions">
          <button className="close-button" onClick={() => window.history.back()}>Close</button>
        </div> */}
      </div>
    </div>
  );
}

export default CashierSettlement;