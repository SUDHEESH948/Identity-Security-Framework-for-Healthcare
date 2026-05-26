import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App.jsx";
import Admin from "./Admin.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import PasswordPage from "./password"; 
import PatientRegister from "./PatientRegister.jsx";
import PatientLogin from "./PatientAuth.jsx";
import PatientDashboard from "./PatientDashboard";
import DoctorDashboard from "./EDashboard.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(

  <React.StrictMode>

    <BrowserRouter>

      <Routes>

        {/* Home Page */}
        <Route path="/" element={<App />} />

        {/* Admin Login Page */}
        <Route path="/admin" element={<Admin />} />

        {/* Admin Dashboard Page */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        
        <Route path="/password" element={<PasswordPage />} />
        <Route path="/patient" element={<PatientRegister />} />
        <Route path="/patientlogin" element={<PatientLogin />} />
        <Route path="/patientdashboard" element={<PatientDashboard />} />
        <Route path="/EDashboard" element={<DoctorDashboard />} />
        

      </Routes>

    </BrowserRouter>

  </React.StrictMode>

);