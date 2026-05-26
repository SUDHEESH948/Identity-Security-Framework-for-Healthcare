import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaIdCard,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCalendarAlt,
  FaFileAlt,
  FaUserCircle,
  FaClock
} from "react-icons/fa";
import "./login.css";
import TimePicker from "./TimePicker"; // adjust the path if needed
export default function App() {
  const [mode, setMode] = useState("login"); // "login" | "register" | "dashboard"
  const [msg, setMsg] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [user, setUser] = useState(null); // logged-in user

  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    regNumber: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });

  // Generate regNumber on mount
  useEffect(() => {
    const num = Math.floor(100000 + Math.random() * 900000);
    setRegisterForm((p) => ({ ...p, regNumber: `PNG${num}` }));
  }, []);

  const handleRegisterChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
    if (e.target.name === "password" || e.target.name === "confirmPassword") {
      setPasswordError("");
    }
  };

  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{7,}$/;
    if (!regex.test(password)) {
      return "Password must have uppercase, lowercase, number, special character, min 7 chars";
    }
    return "";
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    setMsg("");
    setPasswordError("");

    if (!/^\d{10}$/.test(registerForm.phone)) {
      setMsg("Phone number must be 10 digits");
      return;
    }

    const passError = validatePassword(registerForm.password);
    if (passError) {
      setPasswordError(passError);
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    const payload = { ...registerForm };
    delete payload.confirmPassword;

    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setMsg(data.message);
      if (data.success) setMode("login");
    } catch (err) {
      setMsg("Server error");
    }
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      setMsg(data.message);

      if (data.success) {
        setUser(data.user);
        setMode("dashboard");
      }
    } catch (err) {
      setMsg("Server error");
    }
  };

  // ----------------- Dashboard Component -----------------
  const Dashboard = ({ user, setMode, setUser }) => {
    const [section, setSection] = useState("appointments");
    const [name, setName] = useState(user.firstName + " " + user.lastName);
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [department, setDepartment] = useState("");
    const [nameMessage, setNameMessage] = useState("");
    const [appointments, setAppointments] = useState([]);
    const [loadingAppointments, setLoadingAppointments] = useState(false);
    
    const fetchAppointments = async () => {
      if (!user) return;
      setLoadingAppointments(true);
      try {
        const res = await fetch(`http://localhost:5000/api/appointments?regNumber=${user.regNumber}`);
        const data = await res.json();
        if (data.success) setAppointments(data.appointments);
        else setAppointments([]);
      } catch {
        setAppointments([]);
      }
      setLoadingAppointments(false);
    };

    useEffect(() => {
      if (section === "viewAppointments") fetchAppointments();
    }, [section]);

    const handleBookAppointment = async (e) => {
      e.preventDefault();
      if (!name || !date || !time || !department) return;

      try {
        const res = await fetch("http://localhost:5000/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            regNumber: user.regNumber,
            name,
            email: user.email,
            date,
            time,
            department
          })
        });
        const data = await res.json();
        alert(data.message);
        setDate(""); setTime(""); setDepartment("");
        if (section === "viewAppointments") fetchAppointments();
      } catch {
        alert("Server error");
      }
    };

    const handleCancelAppointment = async (id) => {
      if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
      try {
        const res = await fetch(`http://localhost:5000/api/appointments/${id}`, { method: "DELETE" });
        const data = await res.json();
        alert(data.message);
        fetchAppointments();
      } catch {
        alert("Server error");
      }
    };

    return (
      <div className="dashboard">
        <h2>Welcome, {user.firstName}!</h2>
        <div className="dashboard-buttons">
          <button onClick={() => setSection("profile")}> <FaUserCircle /> Profile </button>
          <button onClick={() => setSection("appointments")}> <FaCalendarAlt /> Appointments </button>
          <button onClick={() => setSection("results")}> <FaFileAlt /> Results </button>
          <button onClick={() => setSection("viewAppointments")}> <FaCalendarAlt /> View Appointments </button>
          <button onClick={() => { setMode("login"); setUser(null); }}> Logout </button>
        </div>

        <div className="dashboard-content">
          {section === "appointments" && (
            <div className="appointments-form">
              <h3>Book Appointment</h3>
              <form onSubmit={handleBookAppointment}>
                <div className="field"><FaIdCard className="icon" /><input value={user.regNumber} disabled /></div>
                <div className="field">
                  <FaUser className="icon" />
                  <input value={name} onChange={(e) => setName(e.target.value)} />
                  <button type="button" className="btn-small"
                    onClick={() => { setNameMessage(`Name updated to ${name}`); setTimeout(() => setNameMessage(""), 3000); }}> Update </button>
                </div>
                {nameMessage && <p className="success-msg">{nameMessage}</p>}
                <div className="field"><FaEnvelope className="icon" /><input value={user.email} disabled /></div>
                <div className="field"><FaCalendarAlt className="icon" /><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
                <div className="field"><FaClock className="icon" /><TimePicker value={time} onChange={setTime} /></div>
                <div className="field"><FaFileAlt className="icon" />
                  <select value={department} onChange={(e) => setDepartment(e.target.value)} required>
                    <option value="">Select Department</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                  </select>
                </div>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} className="btn" type="submit"> Book Appointment </motion.button>
              </form>
            </div>
          )}

          {section === "results" && <p>Your medical results will appear here.</p>}
          {section === "profile" && (
            <div>
              <p>Registration Number: {user.regNumber}</p>
              <p>Name: {user.firstName} {user.lastName}</p>
              <p>Email: {user.email}</p>
            </div>
          )}

          {section === "viewAppointments" && (
            <div className="appointments-list">
              <h3>Your Appointments</h3>
              {loadingAppointments ? <p>Loading...</p> :
                appointments.length === 0 ? <p>No appointments booked yet.</p> :
                  <table>
                    <thead>
                      <tr>
                        <th>Reg Number</th><th>Name</th><th>Email</th><th>Date</th><th>Time</th><th>Department</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appt) => (
                        <tr key={appt.id}>
                          <td>{appt.reg_number}</td>
                          <td>{appt.name}</td>
                          <td>{appt.email}</td>
                           <td>
                            {new Date(appt.appointment_date).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td>
                            {(() => {
                              if (!appt.appointment_time) return "";
                              let [hh, mm] = appt.appointment_time.split(":");
                              hh = parseInt(hh);
                              const ampm = hh >= 12 ? "PM" : "AM";
                              let hh12 = hh % 12;
                              if (hh12 === 0) hh12 = 12;
                              return `${hh12}:${mm} ${ampm}`;
                            })()}
                          </td>
                          <td>{appt.department}</td>
                          <td><button className="btn-small btn-red" onClick={() => handleCancelAppointment(appt.id)}>Cancel</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ----------------- App JSX -----------------
  return (
    <div className="page">
      {mode === "dashboard" ? (
        <Dashboard user={user} setMode={setMode} setUser={setUser} />
      ) : (
        <motion.div className="card" initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6 }}>
          {mode === "login" ? (
            <>
              <h2>Patient Login</h2>
              <form onSubmit={submitLogin}>
                <div className="field">
                  <FaEnvelope className="icon" />
                  <input type="email" name="email" placeholder="Email" value={loginForm.email} onChange={handleLoginChange} required />
                </div>
                <div className="field password-field">
                  <FaLock className="icon" />
                  <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={loginForm.password} onChange={handleLoginChange} required />
                  <span className="eye" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} className="btn" type="submit"> Login </motion.button>
              </form>
              <p>Don't have an account? <button className="toggle-btn" onClick={() => setMode("register")}>Register</button></p>
            </>
          ) : (
            <>
              <h2>Create Account</h2>
              <form onSubmit={submitRegister}>
                <div className="field"><FaIdCard className="icon" /><input value={registerForm.regNumber} disabled /></div>
                <div className="field"><FaUser className="icon" /><input name="firstName" placeholder="First name" value={registerForm.firstName} onChange={handleRegisterChange} required /></div>
                <div className="field"><FaUser className="icon" /><input name="lastName" placeholder="Last name" value={registerForm.lastName} onChange={handleRegisterChange} required /></div>
                <div className="field"><FaPhone className="icon" /><input name="phone" placeholder="Phone" value={registerForm.phone} onChange={handleRegisterChange} required /></div>
                <div className="field"><FaMapMarkerAlt className="icon" /><textarea name="address" placeholder="Address" value={registerForm.address} onChange={handleRegisterChange} required /></div>
                <div className="field"><FaEnvelope className="icon" /><input type="email" name="email" placeholder="Email" value={registerForm.email} onChange={handleRegisterChange} required /></div>
                <div className="field password-field"><FaLock className="icon" /><input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={registerForm.password} onChange={handleRegisterChange} required />
                  <span className="eye" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <FaEyeSlash /> : <FaEye />}</span>
                </div>
                {passwordError && <div className="field-error">{passwordError}</div>}
                <div className="field password-field"><FaLock className="icon" /><input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirm Password" value={registerForm.confirmPassword} onChange={handleRegisterChange} required />
                  <span className="eye" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <FaEyeSlash /> : <FaEye />}</span>
                </div>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} className="btn" type="submit"> Register </motion.button>
              </form>
              <p>Already have an account? <button className="toggle-btn" onClick={() => setMode("login")}>Login</button></p>
            </>
          )}
          {msg && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="msg">{msg}</motion.p>}
        </motion.div>
      )}
    </div>
  );
}