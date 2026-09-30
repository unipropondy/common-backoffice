import React, { useEffect, useState } from "react";
import axios from "axios";
import "./FireCourseForm.css";
import { BASE_URL } from "../config/api";

function FireCoursePage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    id: "",
    code: "",
    name: "",
  });

  // 🔹 Load Data
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/firecourse`);
      setList(res.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🔹 Pagination
  const start = (page - 1) * pageSize;
  const paginatedData = list.slice(start, start + pageSize);

  // 🔥 NEW
  const handleNew = () => {
    setForm({ id: "", code: "", name: "" });
    setShowModal(true);
  };

  // 🔥 EDIT
  const handleEdit = (item) => {
    setForm({
      id: item.FireCourseId,
      code: item.FireCourseCode,
      name: item.FireCourseName,
    });
    setShowModal(true);
  };

  // 🔥 SAVE
  const handleSave = async () => {
    try {
      await axios.post(`${BASE_URL}/api/firecourse/save`, form);
      setShowModal(false);
      loadData();
    } catch (err) {
      console.log(err);
    }
  };

  // 🔥 DELETE
  const handleDelete = async (id) => {
    try {
      if (!window.confirm("Delete this record?")) return;

      await axios.delete(`${BASE_URL}/api/firecourse/${id}`);
      loadData();
    } catch (err) {
      console.log(err);
    }
  };

  // 🔥 INPUT
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="Fire-container">

      {/* 🔥 HEADER */}
      <div className="Fire-top-bar">
        <h2>Fire Course</h2>

        <div className="Fire-top-actions">
          <button className="Fire-new-btn" onClick={handleNew}>
            + New
          </button>

          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* 📊 TABLE */}
      <div className="Fire-table-card">
        {loading ? (
          <div className="Fire-loader"></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th style={{ textAlign: "center" }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((item) => (
                <tr key={item.FireCourseId}>
                  <td>{item.FireCourseCode}</td>
                  <td>{item.FireCourseName}</td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      className="Fire-edit"
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </button>

                    <button
                      className="Fire-delete"
                      onClick={() => handleDelete(item.FireCourseId)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 🔄 PAGINATION */}
        <div className="Fire-pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Prev
          </button>

          <span>
            page {page} of {Math.ceil(list.length / pageSize)}
          </span>

          <button
            disabled={page >= list.length / pageSize}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* 🔥 MODAL */}
      {showModal && (
        <div className="Fire-modal-overlay">
          <div className="Fire-modal">
            <h2>🔥 Fire Course</h2>

            <input
              name="code"
              placeholder="Enter Code"
              value={form.code}
              onChange={handleChange}
            />

            <input
              name="name"
              placeholder="Enter Name"
              value={form.name}
              onChange={handleChange}
            />

            <div className="Fire-btn-group">
              <button className="Fire-save" onClick={handleSave}>
                Save
              </button>

              <button
                className="Fire-close"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FireCoursePage;