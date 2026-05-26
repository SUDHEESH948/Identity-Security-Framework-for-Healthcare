import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaUser, FaEnvelope, FaHospital, FaCalendar, FaClock,
  FaVenusMars, FaHashtag, FaMapMarkerAlt
} from "react-icons/fa";
import "./PatientRegister.css";

function PatientRegister() {
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    email: "",
    phone: "",
    address: "",
    department: "",
    date: "",
    hour: "",
    minute: "",
    period: "AM"
  });

  const [regNo, setRegNo] = useState("Loading...");
  const [successMsg, setSuccessMsg] = useState(""); // Show registration number & email
  const [errors, setErrors] = useState({}); // Field-specific errors

  const API = axios.create({ baseURL: "http://localhost:5000/api" });

  // Fetch new regNo on page load
  useEffect(() => {
    const fetchRegNo = async () => {
      try {
        const res = await API.get("/patient/regno");
        setRegNo(res.data?.regNo || "Not Available");
      } catch {
        setRegNo("Error");
      }
    };
    fetchRegNo();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error on change
  };

  const validatePhone = (phone) => /^[0-9]{10}$/.test(phone);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validate required fields
    if (!form.name) newErrors.name = "Name is required ❌";
    if (!form.email) newErrors.email = "Email is required ❌";
    if (!form.department) newErrors.department = "Department is required ❌";
    if (!form.gender) newErrors.gender = "Gender is required ❌";
    if (!form.date) newErrors.date = "Date is required ❌";
    if (!form.hour || !form.minute || !form.period) newErrors.time = "Time is required ❌";
    if (!validatePhone(form.phone)) newErrors.phone = "Phone must be 10 digits ❌";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const nameParts = form.name.trim().split(" ");
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(" ") || "";
    const formattedTime = `${form.hour}:${form.minute} ${form.period}`;

    try {
      const res = await API.post("/patient/register", {
        regNo,
        first_name,
        last_name,
        age: form.age || null,
        gender: form.gender || null,
        email: form.email,
        department: form.department || null,
        date: form.date || null,
        time: formattedTime || null,
        phone: form.phone || null,
        address: form.address || null
      });

      if (res.data?.success) {
        // ✅ Show registration number & email in success message
        setSuccessMsg(`✅ Registered Successfully! RegNo: ${res.data.regNo}, Email: ${form.email}`);
        setForm({
          name: "",
          age: "",
          gender: "",
          email: "",
          phone: "",
          address: "",
          department: "",
          date: "",
          hour: "",
          minute: "",
          period: "AM"
        });

        // Fetch a new regNo for next registration
        const newReg = await API.get("/patient/regno");
        setRegNo(newReg.data?.regNo || "Not Available");

        setTimeout(() => setSuccessMsg(""), 5000); // Hide after 5 sec
      } else {
        // Show email error and highlight field
        if (res.data.message.includes("Email")) {
          setErrors({ email: res.data.message });
        } else {
          alert(res.data.message || "Registration failed ❌");
        }
      }
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  return (
    <div className="register-page">
      <form className="auth-container" onSubmit={handleSubmit}>
        <h2>Patient Registration</h2>

        {/* REG NO */}
        <div className="input-group">
          <FaHashtag className="icon" />
          <input value={regNo} readOnly />
        </div>

        {/* NAME */}
        <div className="input-group">
          <FaUser className="icon" />
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Full Name"
          />
        </div>
        {errors.name && <div className="error">{errors.name}</div>}

        {/* AGE */}
        <div className="input-group">
          <FaUser className="icon" />
          <input
            name="age"
            type="number"
            value={form.age}
            onChange={handleChange}
            placeholder="Age"
          />
        </div>

        {/* PHONE */}
        <div className="input-group">
          <FaUser className="icon" />
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone (10 digits)"
          />
        </div>
        {errors.phone && <div className="error">{errors.phone}</div>}

        {/* ADDRESS */}
        <div className="input-group">
          <FaMapMarkerAlt className="icon" />
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Address"
          />
        </div>

        {/* DEPARTMENT */}
        <div className="input-group">
          <FaHospital className="icon" />
          <select
            name="department"
            value={form.department}
            onChange={handleChange}
          >
            <option value="">Select Department</option>
            <option>Cardiology</option>
            <option>Neurology</option>
            <option>Orthopedic</option>
            <option>Radiology</option>
          </select>
        </div>
        {errors.department && <div className="error">{errors.department}</div>}

        {/* GENDER */}
        <div className="input-group">
          <FaVenusMars className="icon" />
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
          >
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
        {errors.gender && <div className="error">{errors.gender}</div>}

        {/* EMAIL */}
        <div className="input-group">
          <FaEnvelope className="icon" />
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className={errors.email ? "input-error" : ""}
          />
        </div>
        {errors.email && <div className="error">{errors.email}</div>}

        {/* DATE */}
        <div className="input-group">
          <FaCalendar className="icon" />
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
          />
        </div>
        {errors.date && <div className="error">{errors.date}</div>}

        {/* TIME */}
        <div className="input-group">
          <FaClock className="icon" />
          <div className="time-group">
            <select name="hour" value={form.hour} onChange={handleChange}>
              <option value="">HH</option>
              {[...Array(12)].map((_, i) => (
                <option key={i} value={String(i + 1).padStart(2, "0")}>
                  {String(i + 1).padStart(2, "0")}
                </option>
              ))}
            </select>

            <span className="colon">:</span>

            <select name="minute" value={form.minute} onChange={handleChange}>
              <option value="">MM</option>
              {[...Array(60)].map((_, i) => (
                <option key={i} value={String(i).padStart(2, "0")}>
                  {String(i).padStart(2, "0")}
                </option>
              ))}
            </select>

            <select name="period" value={form.period} onChange={handleChange}>
              <option>AM</option>
              <option>PM</option>
            </select>
          </div>
        </div>
        {errors.time && <div className="error">{errors.time}</div>}

        <button className="register-btn" type="submit">
          Register Now
        </button>

        {/* Success Message */}
        {successMsg && <div className="success-popup">{successMsg}</div>}
      </form>
    </div>
  );
}

export default PatientRegister;