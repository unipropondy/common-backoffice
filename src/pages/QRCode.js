import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";

import "./QRCode.css";
import { BASE_URL } from "../config/api";

export default function TableMaster() {

  // =========================
  // STATE
  // =========================

  const [tables, setTables] = useState([]);


  const [tableMasterList, setTableMasterList] =
    useState([]);

  const [showQRModal, setShowQRModal] =
    useState(false);

  const [selectedTable, setSelectedTable] =
    useState(null);

  const [showAddModal, setShowAddModal] =
    useState(false);

   const [tableId, setTableId] =
  useState("");

  const [tableNo, setTableNo] =
    useState("");

    const [QRLink, setQRLink] =
  useState("");

  const [editId, setEditId] =
  useState(null);

  // =========================
  // PAGE LOAD
  // =========================

  useEffect(() => {

    getQRTables();

    getTableMaster();

  }, []);

  // =========================
  // GET QR TABLES
  // =========================

  const getQRTables = async () => {

    try {

      const response = await fetch(
        `${BASE_URL}/qrmaster`
      );

      const data = await response.json();

      console.log("QR DATA:", data);

      setTables(
        Array.isArray(data)
          ? data
          : data.recordset || []
      );

    }

    catch (error) {

      console.log(error);

      setTables([]);

    }

  };

  // =========================
  // GET TABLE MASTER
  // =========================

  const getTableMaster = async () => {

    try {

     const response = await fetch(
  `${BASE_URL}/api/tablemaster`
);

      const data = await response.json();

      console.log("TABLE MASTER:", data);

      setTableMasterList(
        Array.isArray(data)
          ? data
          : data.recordset || []
      );

    }

    catch (error) {

      console.log(error);

      setTableMasterList([]);

    }

  };

  // =========================
  // OPEN QR MODAL
  // =========================

  const openQRModal = (table) => {

    setSelectedTable(table);

    setShowQRModal(true);

  };

  // =========================
  // CLOSE QR MODAL
  // =========================

  const closeQRModal = () => {

    setShowQRModal(false);

    setSelectedTable(null);

  };

  // =========================
  // ADD QR TABLE
  // =========================

  const addTable = async () => {

    if (!tableNo) {

      alert("Select Table");

      return;

    }

   try {

        // const qrCode =
        //   `${BASE_URL}/menu?table=${tableNo}`;

        //  const qrCode =
        //  `${QRLink}?table=${tableNo}`;

        const qrCode =
          `${QRLink}?tableId=${tableId}&table=${tableNo}`;

        const url = editId
          ? `${BASE_URL}/qrmaster/${editId}`
          : `${BASE_URL}/qrmaster`;

        const method = editId
          ? "PUT"
          : "POST";

        const response = await fetch(
          url,
          {
            method: method,

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              TableId: tableId,
              TableNo: tableNo,
              QRCode: qrCode,
              QRLink: qrCode,
            }),

          }
        );

      const data = await response.text();

      console.log(data);

      // Refresh Grid
      getQRTables();

      // Clear
      setTableId("");
      setTableNo("");
      setQRLink("");
      setEditId(null);

      // Close Modal
      setShowAddModal(false);

    }

    catch (error) {

      console.log(error);

    }

  };

    // =========================
  // EDIT QR
  // =========================

  const editQR = (table) => {

  setEditId(table.Id);

  setTableId(table.TableId);

  setTableNo(table.TableNo);

  setQRLink(table.QRLink);

  setShowAddModal(true);

};


  // =========================
  // DELETE QR
  // =========================

  const deleteQR = async (id) => {

    const confirmDelete =
      window.confirm(
        "Are you sure want to delete?"
      );

    if (!confirmDelete) return;

    try {

      await fetch(
        `${BASE_URL}/qrmaster/${id}`,
        {
          method: "DELETE",
        }
      );

      getQRTables();

    }

    catch (error) {

      console.log(error);

    }

  };


  // =========================
  // JSX
  // =========================

  return (

    <div className="qr-table-master-container">

      {/* HEADER */}

      <div className="qr-header-section">

        <h1 className="qr-title">
          QR Master
        </h1>

       <button
        className="qr-new-btn"
       onClick={() => {

          // CLEAR OLD DATA
          setEditId(null);

          setTableId("");

          setTableNo("");

          setQRLink("");

          // OPEN MODAL
          setShowAddModal(true);

        }}
      >
        New
      </button>

      </div>

      {/* TABLE */}

      <table className="qr-table-master-table">

        <thead>

          <tr>

            <th>Table No.</th>
            <th>QR</th>
            <th>Action</th>

          </tr>

        </thead>

        <tbody>

          {Array.isArray(tables) &&
            tables.map((table) => (

              <tr key={table.Id}>

               <td>

                <span
                  className="qr-edit-link"
                  onClick={() =>
                    editQR(table)
                  }
                >
                  {table.TableNo}
                </span>

              </td>

                <td>

                  <button
                    className="qr-btn"
                    onClick={() =>
                      openQRModal(table)
                    }
                  >
                    View QR
                  </button>

                </td>

                 <td>

                  <button
                    className="qr-delete-btn"
                    onClick={() =>
                      deleteQR(table.Id)
                    }
                  >
                    Delete
                  </button>

                </td>

              </tr>

            ))}

        </tbody>

      </table>

      {/* ========================= */}
      {/* QR MODAL */}
      {/* ========================= */}

      {showQRModal &&
        selectedTable && (

        <div className="qr-modal-overlay">

          <div className="qr-modal-box">

            <button
              className="qr-close-btn"
              onClick={closeQRModal}
            >
              ×
            </button>

            <h2 className="qr-modal-title">
             {selectedTable.TableNumber}
            </h2>

            <div className="qr-container">

              <QRCode
                value={
                  selectedTable.QRLink
                }
                size={220}
              />

            </div>

            <p className="qr-url">
              {selectedTable.QRCode}
            </p>

          </div>

        </div>

      )}

      {/* ========================= */}
      {/* ADD MODAL */}
      {/* ========================= */}

      {showAddModal && (

        <div className="qr-modal-overlay">

          <div className="qr-modal-box">

            <button
              className="qr-close-btn"
              onClick={() =>
                setShowAddModal(false)
              }
            >
              ×
            </button>

            <h2 className="qr-modal-title">
              Add QR Table
            </h2>

            {/* TABLE MASTER LOV */}

            <label className="qr-label">
              Table NO.
            </label>

          <select
  value={tableId}
  onChange={(e) => {

    const selectedId =
      e.target.value;

    setTableId(selectedId);

    const selectedTable =
      tableMasterList.find(
        (x) =>
          String(x.TableId) ===
          String(selectedId)
      );

    if (selectedTable) {

      setTableNo(
        selectedTable.TableNumber
      );

    }

  }}
  className="qr-table-input"
>
  <option value="">
    Select Table
  </option>

  {tableMasterList.map((table) => (

    <option
      key={table.TableId}
      value={table.TableId}
    >
      {table.TableNumber}
    </option>

  ))}
</select>
           
           <label className="qr-label">
            QR Link
          </label>
            <input
              type="text"
              placeholder="Enter QR Link"
              value={QRLink}
              onChange={(e) =>
                setQRLink(e.target.value)
              }
              className="qr-table-input"
            />

            <button
              className="qr-save-btn"
              onClick={addTable}
            >
              Save
            </button>

          </div>

        </div>

      )}

    </div>

  );

}