import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiEye, FiEyeOff, FiLogIn, FiDatabase } from "react-icons/fi";
import "./Login.css";
import { BASE_URL } from "../config/api";
import cafeImg from "../assets/usg1.png";

// ─── Available User Codes (DB Names) ───────────────────────────────────────────
// Add more entries here as needed
// const USER_CODE_LIST = [
//   { label: "UCS Pondy",     value: "UCSPONDY" },
//   { label: "UCS Conestone", value: "UCSCONESTONE" },
//   { label: "UCS Kindee",    value: "UCSKINDEE" },
//   { label: "UCS Komban",    value: "UCSKOMBAN" },
// ];
// ──────────────────────────────────────────────────────────────────────────────

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  // ── User Code typeahead state ──
  // const [dbInput, setDbInput] = useState("");     
  // const [selectedDb, setSelectedDb] = useState(null);   
  // const [suggestions, setSuggestions] = useState([]);   
  // const [suggestOpen, setSuggestOpen] = useState(false);
  // const [activeIndex, setActiveIndex] = useState(-1);  
  // const dbWrapRef = useRef(null);
  // const inputRef = useRef(null);
  const [branchCode, setBranchCode] = useState("");
  // Close suggestion list when clicking outside
  // useEffect(() => {
  //   const handler = (e) => {
  //     if (dbWrapRef.current && !dbWrapRef.current.contains(e.target)) {
  //       setSuggestOpen(false);
  //     }
  //   };
  //   document.addEventListener("mousedown", handler);
  //   return () => document.removeEventListener("mousedown", handler);
  // }, []);

  // Filter list every time the input text changes
  // const handleDbInput = (e) => {
  //   const val = e.target.value;
  //   setDbInput(val);
  //   setSelectedDb(null);   // clear confirmed selection when user edits
  //   setActiveIndex(-1);

  //   if (val.trim() === "") {
  //     setSuggestions([]);
  //     setSuggestOpen(false);
  //     return;
  //   }

  //   const q = val.toLowerCase();
  //   const filtered = USER_CODE_LIST.filter(
  //     (item) =>
  //       item.label.toLowerCase().includes(q) ||
  //       item.value.toLowerCase().includes(q)
  //   );
  //   setSuggestions(filtered);
  //   setSuggestOpen(filtered.length > 0);
  // };

  // Keyboard navigation through suggestions
  // const handleDbKeyDown = (e) => {
  //   if (!suggestOpen) return;

  //   if (e.key === "ArrowDown") {
  //     e.preventDefault();
  //     setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
  //   } else if (e.key === "ArrowUp") {
  //     e.preventDefault();
  //     setActiveIndex((prev) => Math.max(prev - 1, 0));
  //   } else if (e.key === "Enter") {
  //     e.preventDefault();
  //     if (activeIndex >= 0 && suggestions[activeIndex]) {
  //       selectDb(suggestions[activeIndex]);
  //     }
  //   } else if (e.key === "Escape") {
  //     setSuggestOpen(false);
  //   }
  // };

  // const selectDb = (item) => {
  //   setSelectedDb(item);
  //   setDbInput(item.label);      // show friendly label in the input
  //   setSuggestions([]);
  //   setSuggestOpen(false);
  //   setActiveIndex(-1);
  // };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // const finalDbName = selectedDb ? selectedDb.value : dbInput.trim();

    // if (!finalDbName) {
    //   alert("Please enter or select a User Code before signing in.");
    //   inputRef.current?.focus();
    //   return;
    // }

    if (!branchCode.trim()) {
      alert("Please enter Branch Code");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          branchCode: branchCode.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("userId", data.user.UserId);
        localStorage.setItem("selected_db", data.dbname);
        navigate("/home");
      } else {
        alert(data.message || "Invalid Username ❌");
      }
    } catch (err) {
      console.log(err);
      alert("Server error ❌");
    }
  };

  // Highlight matched portion of text
  // const highlight = (text, query) => {
  //   if (!query.trim()) return text;
  //   const idx = text.toLowerCase().indexOf(query.toLowerCase());
  //   if (idx === -1) return text;
  //   return (
  //     <>
  //       {text.slice(0, idx)}
  //       <mark className="db-highlight">{text.slice(idx, idx + query.length)}</mark>
  //       {text.slice(idx + query.length)}
  //     </>
  //   );
  // };

  return (
    <div className="login-page">
      <div className="bg-shape shape1"></div>
      <div className="bg-shape shape2"></div>

      <div className="login-wrapper">

        <div className="login-external-brand">
          <div className="logo-wrapper">
            <img src={cafeImg} alt="Cafe" className="login-logo" />
          </div>
          <div className="brand-text-group">
            <h1 className="external-brand-name">Smart POS</h1>
            <p className="external-brand-subtitle">Backoffice System</p>
          </div>
        </div>

        <div className="login-card">
          <div className="login-card-header">
            <h2 className="login-card-title">Sign In</h2>
            <p className="login-card-subtitle">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">

            {/* ── Company Code ── */}
            <div className="login-input-group">
              <label>Company CODE</label>

              <div className="login-input-field">
                <FiDatabase className="input-icon" />

                <input
                  type="text"
                  placeholder="Enter Company Code"
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* ── User ID ── */}
            <div className="login-input-group">
              <label>USER ID</label>
              <div className="login-input-field">
                <FiUser className="input-icon" />
                <input
                  type="text"
                  name="username"
                  placeholder="Enter Username"
                  value={form.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* ── Password ── */}
            <div className="login-input-group">
              <label>PASSWORD</label>
              <div className="login-input-field">
                <FiLock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter Password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn">
              <span className="icon-box"><FiLogIn /></span>
              Sign In
            </button>
          </form>
        </div>
      </div>

      <div className="footer-text">© 2026 Unipro Softwares SG Pte Ltd</div>
    </div>
  );
}

export default Login;
