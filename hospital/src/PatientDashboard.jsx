import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import PatientRegister from "./PatientRegister";
import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaCalendarCheck,
  FaUserPlus,
  FaUser,
  FaSignOutAlt,
  FaDownload
} from "react-icons/fa";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./PatientDashboard.css";

// API
const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true
});

function PatientDashboard() {
  const navigate = useNavigate();
  const appointmentRef = useRef();

  const [activePage, setActivePage] = useState("home");
  const [searchId, setSearchId] = useState("");
  const [appointment, setAppointment] = useState(null);

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // ---------------- SESSION ----------------
  const fetchSessionProfile = async () => {
    try {
      const res = await API.get("/patient/session");

      if (res.data.success && res.data.user) {
        setProfile(res.data.user);
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Session Error:", err);
      navigate("/", { replace: true });
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchSessionProfile();
  }, []);

  // ---------------- SEARCH ----------------
  const handleSearch = async () => {
    if (!searchId) return;

    try {
      const cleanId = searchId.trim().toUpperCase();
      const res = await API.get(`/patient/appointment/${cleanId}`);

      if (res.data.success) {
        setAppointment(res.data.data);
      } else {
        setAppointment(null);
      }
    } catch (err) {
      console.error("Search Error:", err);
      setAppointment(null);
    }
  };

  // ---------------- LOGOUT ----------------
  const handleLogout = async () => {
    try {
      await API.post("/patient/logout");

      localStorage.removeItem("token");
      sessionStorage.clear();

      navigate("/patientlogin", { replace: true });

    } catch (err) {
      console.error("Logout error:", err);

      // FORCE NAVIGATION even if backend fails
      navigate("/patientlogin", { replace: true });
    }
  };

  // ---------------- FORMAT DATE ----------------
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  // ---------------- PDF DOWNLOAD ----------------
  const downloadPDF = async () => {
    const element = appointmentRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`Appointment-${appointment.regno}.pdf`);
    } catch (err) {
      console.error("PDF Error:", err);
    }
  };

  // ---------------- LOADING ----------------
  if (loadingProfile) {
    return <p style={{ textAlign: "center", marginTop: "50px" }}>Loading...</p>;
  }

  return (
    <div className="dashboard">

      {/* SIDEBAR */}
      <div className="dashboard-nav">
        

        <span className={activePage === "home" ? "active" : ""} onClick={() => setActivePage("home")}>
          <FaHome /> Home
        </span>

        <span className={activePage === "appointments" ? "active" : ""} onClick={() => setActivePage("appointments")}>
          <FaCalendarCheck /> Appointments
        </span>

        <span className={activePage === "book" ? "active" : ""} onClick={() => setActivePage("book")}>
          <FaUserPlus /> Book
        </span>

        <span className={activePage === "profile" ? "active" : ""} onClick={() => setActivePage("profile")}>
          <FaUser /> Profile
        </span>

        <span className="logout" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </span>
      </div>

      {/* CONTENT */}
      <div className="dashboard-content">

        {/* HOME */}
        {activePage === "home" && (
          <div className="card">
            <h2>Welcome 👋</h2>
            <p>Hello, {profile?.first_name || "User"}</p>
          </div>
        )}

        {/* APPOINTMENTS */}
        {activePage === "appointments" && (
          <div className="card">
            <h3>Search Appointment</h3>

            <div className="search-box">
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>

                <input
                  type="text"
                  placeholder="Enter Registration Number"
                  value={searchId}
                  onChange={(e) =>
                    setSearchId(e.target.value.toUpperCase().replace(/\s/g, ""))
                  }
                />
              </div>

              <button className="search-btn" onClick={handleSearch}>
                Search
              </button>


              
            </div>

            {appointment ? (
              <>
                <div className="appointment-details" ref={appointmentRef}>
                  <h2>🏥 Hospital Appointment</h2>

                  <p><strong>Reg No:</strong> {appointment.regno}</p>
                  <p><strong>Name:</strong> {appointment.first_name} {appointment.last_name}</p>
                  <p><strong>Age:</strong> {appointment.age || "-"}</p>
                  <p><strong>Gender:</strong> {appointment.gender || "-"}</p>
                  <p><strong>Email:</strong> {appointment.email}</p>
                  <p><strong>Department:</strong> {appointment.department || "-"}</p>
                  <p><strong>Date:</strong> {formatDate(appointment.date)}</p>
                  <p><strong>Time:</strong> {appointment.time || "-"}</p>
                  <p><strong>Phone:</strong> {appointment.phone || "-"}</p>
                  <p><strong>Address:</strong> {appointment.address || "-"}</p>
                </div>

                <button className="pdf-btn" onClick={downloadPDF}>
                  <FaDownload /> Download PDF
                </button>
              </>
            ) : (
              <p className="no-data">No appointment found</p>
            )}
          </div>
        )}

        {/* BOOK */}
        {activePage === "book" && <PatientRegister />}

        {/* PROFILE */}
        {activePage === "profile" && (
          <div className="card">
            <h3>Profile</h3>
            <p><strong>First Name:</strong> {profile?.first_name}</p>
            <p><strong>Last Name:</strong> {profile?.last_name}</p>
            <p><strong>Email:</strong> {profile?.email}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientDashboard;