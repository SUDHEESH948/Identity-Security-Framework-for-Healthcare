import React, { useState, useEffect } from "react";
import API from "./api";
import {
  FaBars,
  FaCalendarAlt,
  FaPrescriptionBottleAlt,
  FaBed,
  FaHeartbeat,
  FaFlask,
  FaFileMedicalAlt,
  FaPills,
  FaClipboardList,
} from "react-icons/fa";
import {
  Appointments,
  Prescriptions,
  NursePatients,
  Medications,
  LabPending,
  LabResults,
  Notes,
  RecordVitals,
} from "./pages/EDashboard";
import "./EDashboard.css";

/* ================= MAIN DASHBOARD ================= */
export default function HospitalDashboard() {
  const [role, setRole] = useState(null);
  const [empID, setEmpID] = useState(null);
  const [department, setDepartment] = useState(null);
  const [permissions, setPermissions] = useState({ read: false, write: false, modify: false });
  const [page, setPage] = useState("");
  const [selected, setSelected] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [summary, setSummary] = useState({ activePatients: 0, dischargesToday: 0 });
  const [summaryLoading, setSummaryLoading] = useState(false);

  const canRead = permissions.read;
  const canWrite = permissions.write;
  const canModify = permissions.modify;

  useEffect(() => {
    API.get("/employee/me")
      .then((res) => {
        const r = res.data.role.toLowerCase();
        setRole(r);
        setEmpID(res.data.empID);
        setDepartment(res.data.department);
        setPermissions(res.data.permissions || { read: false, write: false, modify: false });

        const defaults = {
          doctor: "appointments",
          nurse: "patients",
          lab: "pending",
        };
        setPage(defaults[r]);
      })
      .catch(() => {
        localStorage.clear();
        window.location.href = "/";
      });
  }, []);

  useEffect(() => {
    if (role === "nurse") {
      setSummaryLoading(true);
      API.get("/admitted")
        .then((res) => {
          const patients = res.data.data || [];
          const active = patients.filter((p) => !p.discharged_at).length;
          const dischargesToday = patients.filter((p) => {
            if (!p.discharged_at) return false;
            const dischargedDate = new Date(p.discharged_at).toDateString();
            return dischargedDate === new Date().toDateString();
          }).length;
          setSummary({ activePatients: active, dischargesToday });
        })
        .catch(() => setSummary({ activePatients: 0, dischargesToday: 0 }))
        .finally(() => setSummaryLoading(false));
    }
  }, [role]);

  if (!role || (role === "doctor" && department === null)) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className={`container role-${role} ${sidebarOpen ? "sidebar-open" : ""}`}>
      <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <FaBars />
      </button>

      {/* ================= SIDEBAR ================= */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <h3>{role.toUpperCase()}</h3>
        <p>ID: {empID}</p>

        {role === "doctor" && (
          <>
            <button onClick={() => setPage("appointments")}>
              <FaCalendarAlt /> Appointments
            </button>
            <button onClick={() => setPage("prescriptions")}>
              <FaPrescriptionBottleAlt /> Prescriptions
            </button>

          </>
        )}

        {role === "nurse" && (
          <>
            <button onClick={() => setPage("patients")}>
              <FaBed /> Patients / Ward
            </button>
            <button onClick={() => setPage("vitals")}>
              <FaHeartbeat /> Record Vitals
            </button>
            <button onClick={() => setPage("medications")}>
              <FaPills /> Medications
            </button>
          </>
        )}

        {role === "lab" && (
          <>
            <button onClick={() => setPage("pending")}>
              <FaFlask /> Pending Tests
            </button>
            <button onClick={() => setPage("results")}>
              <FaFileMedicalAlt /> Results
            </button>
            
          </>
        )}

        <button
          className="logout-button"
          onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}
        >
          <FaClipboardList /> Logout
        </button>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="content">
        <div className="dashboard-summary">
          <div className={`summary-card ${role}`}>
            <div className="summary-icon">
              <FaHeartbeat />
            </div>
            <div>
              <h4>Active patients</h4>
              <p>{summaryLoading ? "Loading..." : summary.activePatients}</p>
            </div>
          </div>
          <div className={`summary-card ${role}`}>
            <div className="summary-icon">
              <FaClipboardList />
            </div>
            <div>
              <h4>Discharges today</h4>
              <p>{summaryLoading ? "Loading..." : summary.dischargesToday}</p>
            </div>
          </div>
        </div>
        <div className="permission-banner">
          <strong>Permissions:</strong>
          <span className={`perm-pill ${canRead ? 'active' : ''}`}>Read</span>
          <span className={`perm-pill ${canWrite ? 'active' : ''}`}>Write</span>
          <span className={`perm-pill ${canModify ? 'active' : ''}`}>Modify</span>
        </div>
        {/* DOCTOR */}
        {page === "appointments" && (
          canRead ? (
            <Appointments
              department={department}
              onSelect={(p) => {
                setSelected(p);
                setPage("prescriptions");
              }}
            />
          ) : (
            <div className="card">
              <h3>Access denied</h3>
              <p>You need Read permission to view appointments and patient details.</p>
            </div>
          )
        )}

        {page === "prescriptions" && (
          canRead ? (
            <Prescriptions appointment={selected} canWrite={canWrite} canModify={canModify} />
          ) : (
            <div className="card">
              <h3>Access denied</h3>
              <p>You need Read permission to view prescription details.</p>
            </div>
          )
        )}

        {/* NURSE */}
        {page === "patients" && <NursePatients permissions={permissions} />}
        {page === "vitals" && <RecordVitals />}
        {page === "medications" && <Medications />}
        {/* LAB */}
        {page === "pending" && <LabPending permissions={permissions} />}
        {page === "results" && <LabResults permissions={permissions} />}
        {page === "notes" && <Notes role={role} permissions={permissions} />}
      </div>
    </div>
  );
}


