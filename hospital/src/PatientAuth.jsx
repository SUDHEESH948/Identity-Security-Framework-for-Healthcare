import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import "./PatientAuth.css";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true
});

function PatientAuth() {
  const navigate = useNavigate();

  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ---------------- HANDLE CHANGE ----------------
  const handleChange = (e, type) => {
    const { name, value } = e.target;
    if (type === "login") {
      setLoginForm(prev => ({ ...prev, [name]: value }));
    } else {
      setRegisterForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // ---------------- CHECK SESSION ----------------
  const checkSession = async () => {
    try {
      const res = await API.get("/patient/session");

      if (res.data.success) {
        navigate("/patientdashboard", { replace: true });
      }
    } catch (err) {
      console.log("No active session");
      // ❌ DO NOTHING (important fix)
    } finally {
      setCheckingSession(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  // ---------------- LOGIN ----------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const emailTrimmed = loginForm.email.trim().toLowerCase();

      const res = await API.post("/patient/login", {
        ...loginForm,
        email: emailTrimmed
      });

      if (res.data?.success) {
        setSuccessMsg("Login successful ✅");

        setTimeout(() => {
          navigate("/patientdashboard", { replace: true });
        }, 500);
      } else {
        setErrorMsg(res.data?.message || "Login failed ❌");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- REGISTER ----------------
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (registerForm.password !== registerForm.confirmPassword) {
      setErrorMsg("Passwords do not match ❌");
      return;
    }

    setLoading(true);

    const nameParts = registerForm.name.trim().split(" ");
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(" ") || "";

    try {
      const res = await API.post("/patient/adding", {
        first_name,
        last_name,
        email: registerForm.email.trim().toLowerCase(),
        password: registerForm.password
      });

      if (res.data?.success) {
        setSuccessMsg("Registration successful ✅");

        setRegisterForm({
          name: "",
          email: "",
          password: "",
          confirmPassword: ""
        });

        setTimeout(() => {
          setIsFlipped(false);
          setSuccessMsg("");
        }, 1000);
      } else {
        setErrorMsg(res.data?.message || "Registration failed ❌");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- LOADING SCREEN ----------------
  if (checkingSession) {
    return (
      <div className="auth-page">
        <p style={{ textAlign: "center", marginTop: "50px" }}>
          Checking session...
        </p>
      </div>
    );
  }

  // ---------------- UI ----------------
  return (
    <div className="auth-page">
      <div className={`auth-card ${isFlipped ? "flipped" : ""}`}>

        {/* LOGIN */}
        <div className="auth-face auth-front">
          <h2>Login</h2>

          {errorMsg && <div className="error">{errorMsg}</div>}
          {successMsg && <div className="success">{successMsg}</div>}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <FaEnvelope />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={(e) => handleChange(e, "login")}
                required
              />
            </div>

            <div className="input-group">
              <FaLock />
              <input
                type={showLoginPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => handleChange(e, "login")}
                required
              />
              <span onClick={() => setShowLoginPassword(!showLoginPassword)}>
                {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Please wait..." : "Login"}
            </button>
          </form>

          <p>
            Don't have an account?{" "}
            <span onClick={() => setIsFlipped(true)}>Register</span>
          </p>
        </div>

        {/* REGISTER */}
        <div className="auth-face auth-back">
          <h2>Register</h2>

          {errorMsg && <div className="error">{errorMsg}</div>}
          {successMsg && <div className="success">{successMsg}</div>}

          <form onSubmit={handleRegister}>
            <div className="input-group">
              <FaUser />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={registerForm.name}
                onChange={(e) => handleChange(e, "register")}
                required
              />
            </div>

            <div className="input-group">
              <FaEnvelope />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={registerForm.email}
                onChange={(e) => handleChange(e, "register")}
                required
              />
            </div>

            <div className="input-group">
              <FaLock />
              <input
                type={showRegisterPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={registerForm.password}
                onChange={(e) => handleChange(e, "register")}
                required
              />
              <span onClick={() => setShowRegisterPassword(!showRegisterPassword)}>
                {showRegisterPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="input-group">
              <FaLock />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={registerForm.confirmPassword}
                onChange={(e) => handleChange(e, "register")}
                required
              />
              <span onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Please wait..." : "Register"}
            </button>
          </form>

          <p>
            Already have an account?{" "}
            <span onClick={() => setIsFlipped(false)}>Login</span>
          </p>
        </div>

      </div>
    </div>
  );
}

export default PatientAuth;