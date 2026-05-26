import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./App.css";

function App() {
  const navigate = useNavigate();

  const [empID, setEmpID] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ================= VALIDATION =================
  const validate = () => {
    let newErrors = {};

    if (!empID.trim()) newErrors.empID = "Employee ID is required";
    if (!password.trim()) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================= TIME CHECK (12:03 AM RULE) =================
  const isLoginTimeAllowed = () => {
    const now = new Date();

    const hours = now.getHours();
    const minutes = now.getMinutes();

    const totalMinutes = hours * 60 + minutes;

    // ❗ Allow login only after 12:03 AM
    const start = 0 * 60 + 3; // 00:03 AM

    return totalMinutes >= start;
  };

  // ================= LOGIN =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    // ⛔ BLOCK LOGIN IF TIME NOT ALLOWED
    if (!isLoginTimeAllowed()) {
      setMessage("❌ Login allowed only after 12:03 AM");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await axios.post(
        "http://localhost:5000/api/employee/login",
        { empID, password }
      );

      if (!res.data.success) {
        setMessage(res.data.message || "Login failed");
        return;
      }

      if (res.data.mustChange) {
        window.location.href = res.data.redirect;
        return;
      }

      const employeeData = {
        empID: res.data.empID,
        role: res.data.role?.toLowerCase(),
        department: res.data.department,
        permissions: res.data.permissions || {
          read: false,
          write: false,
          modify: false,
        },
        token: res.data.token,
        expiresAt: res.data.expiresAt,
      };

      localStorage.setItem("employee", JSON.stringify(employeeData));

      // ================= AUTO LOGOUT =================
      if (res.data.expiresAt) {
        const expiryTime = new Date(res.data.expiresAt).getTime();
        const timeLeft = expiryTime - Date.now();

        if (timeLeft > 0) {
          setTimeout(() => {
            alert("Session expired ⏰");
            localStorage.removeItem("employee");
            navigate("/");
          }, timeLeft);
        }
      }

      setMessage("Login successful ✅");

      setTimeout(() => {
        navigate(res.data.redirect || "/EDashboard");
      }, 500);

    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message || "Server error. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
  return (
    <div className="main">
      <div className="login-card">

        <h2>🏥 Employee Login</h2>

        <form onSubmit={handleSubmit} autoComplete="on">

          {/* EMPLOYEE ID */}
          <div className="input-box">
            <label>Employee ID</label>
            <span className="icon">🪪</span>

            <input
              type="text"
              placeholder="Employee ID"
              value={empID}
              onChange={(e) => setEmpID(e.target.value)}
            />

            {errors.empID && <p className="error">{errors.empID}</p>}
          </div>

          {/* PASSWORD */}
          <div className="input-box password-box">
            <label>Password</label>
            <span className="icon">🔒</span>

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <span
              className="eye"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁"}
            </span>

            {errors.password && <p className="error">{errors.password}</p>}
          </div>

          {/* BUTTON */}
          <button className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* MESSAGE */}
          {message && <p className="message">{message}</p>}

        </form>
      </div>
    </div>
  );
}

export default App;