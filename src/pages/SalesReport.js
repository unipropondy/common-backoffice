import React, { useState } from "react";
import CafeSalesReport from "../components/CafeSalesReport";
 
function SalesReport() {
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
 
  const today = new Date();
 
  const [toDate, setToDate] = useState(formatDate(today));
  const [fromDate, setFromDate] = useState(
    formatDate(new Date(new Date().setDate(new Date().getDate() - 7)))
  );
 
  const [salesData, setSalesData] = useState([]);
  const [columns, setColumns] = useState(["Hour", "Amount"]);
 
  // ✅ This will be called from CafeSalesReport
  const handleSearch = (filters) => {
    // Parent doesn't need to fetch again - child handles it
    console.log("Search triggered with filters:", filters);
  };
 
  return (
    <div>
      <CafeSalesReport
        salesData={salesData}
        columns={columns}
        fromDate={fromDate}
        toDate={toDate}
        setFromDate={setFromDate}
        setToDate={setToDate}
        onSearch={handleSearch}
      />
    </div>
  );
}
 
export default SalesReport;

 
 