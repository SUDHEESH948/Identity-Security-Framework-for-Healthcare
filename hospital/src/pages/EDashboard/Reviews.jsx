import React from "react";

const pageList = [
    { name: "Appointments", role: "Doctor", purpose: "Manage today's appointments and select patients for prescription work." },
    { name: "Prescriptions", role: "Doctor", purpose: "Create and save prescriptions, track medications, and refer patients to the ward." },
    { name: "Patients / Ward", role: "Nurse", purpose: "View admitted and discharged patients, assign wards, and manage current patient care." },
    { name: "Record Vitals", role: "Nurse", purpose: "Record vitals and review prescription records for on-duty nurses." },
    { name: "Medications", role: "Nurse", purpose: "Track medication schedules and mark doses as administered." },
    { name: "Pending Tests", role: "Lab", purpose: "Upload pending lab reports and manage test workflows." },
    { name: "Results", role: "Lab", purpose: "Review completed lab results and open report files." },
    { name: "Notes", role: "All", purpose: "Store quick notes and patient reminders during daily work." },
    { name: "Page Review", role: "All", purpose: "Review the project pages and understand their purpose in one place." },
];

const uniqueFeatures = [
    "Role-based dashboard navigation for doctors, nurses, and lab staff.",
    "Permission-aware actions (read, write, modify) across the dashboard.",
    "Shared API client in hospital/src/api.js for consistent backend calls.",
    "Lab report upload workflow with file support.",
    "Patient workflows with appointments, prescriptions, vitals, and medications.",
    "Notes and review pages for documentation and onboarding.",
];

export function PageReview() {
    return (
        <div className="card">
            <h3>📘 Project Page Review</h3>
            <p>This page explains the hospital dashboard pages and makes the project easier to understand.</p>

            <div className="box">
                <h4>Page overview</h4>
                <ul>
                    {pageList.map((item) => (
                        <li key={item.name}>
                            <strong>{item.name}</strong> ({item.role}) — {item.purpose}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="box">
                <h4>Unique features</h4>
                <ul>
                    {uniqueFeatures.map((feature) => (
                        <li key={feature}>{feature}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
