import React, { useState, useEffect } from "react";
import API from "../../api";

export function Medications() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        API.get("/prescriptions")
            .then((res) => {
                setPatients(res.data.data || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if ("Notification" in window) {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        const checkMedicineAlerts = () => {
            const now = new Date();
            const hour = now.getHours();
            let dueSlot = "";

            if (hour >= 6 && hour < 12) {
                dueSlot = "morning";
            } else if (hour >= 12 && hour < 18) {
                dueSlot = "noon";
            } else if (hour >= 18 && hour < 24) {
                dueSlot = "night";
            }

            if (!dueSlot) return;

            const dueList = [];

            patients.forEach((patient) => {
                (patient.medicines || []).forEach((med) => {
                    if (med.timing && med.timing[dueSlot] && !med.administered) {
                        dueList.push(`${patient.regno} - ${med.name}`);
                    }
                });
            });

            setAlerts(dueList);

            if (dueList.length > 0 && Notification.permission === "granted") {
                new Notification("Medication Reminder", {
                    body: `${dueList.length} medication dose(s) due now`,
                });
            }
        };

        checkMedicineAlerts();
        const interval = setInterval(checkMedicineAlerts, 60000);
        return () => clearInterval(interval);
    }, [patients]);

    const formatTiming = (timing) => {
        if (!timing) return "Not Set";
        const slots = [];
        if (timing.morning) slots.push("Morning");
        if (timing.noon) slots.push("Afternoon");
        if (timing.night) slots.push("Night");
        return slots.length ? slots.join(", ") : "Not Set";
    };

    const markGiven = (patientId, medIndex) => {
        setPatients((prev) =>
            prev.map((p) =>
                p.id === patientId
                    ? {
                        ...p,
                        medicines: p.medicines.map((m, i) =>
                            i === medIndex ? { ...m, administered: !m.administered } : m
                        ),
                    }
                    : p
            )
        );

        setMessage("Medication status updated");
        setTimeout(() => setMessage(""), 3000);
    };

    if (loading) return <p>Loading medications...</p>;

    return (
        <div className="card">
            <h3>💊 Medication Dashboard</h3>

            {alerts.length > 0 && (
                <div className="warning-message">
                    <h4>⏰ Medication Due Alerts</h4>
                    {alerts.map((a, i) => (
                        <div key={i}>• {a}</div>
                    ))}
                </div>
            )}

            {patients.length === 0 ? (
                <p>No active prescriptions found.</p>
            ) : (
                patients.map((patient) => (
                    <div key={patient.id} className="box medication-box">
                        <h4>Patient {patient.regno}</h4>
                        {patient.medicines.map((med, index) => (
                            <div key={index} className="medicine-card">
                                <p>
                                    <strong>Medicine:</strong> {med.name}
                                </p>
                                <p>
                                    <strong>Schedule:</strong> {formatTiming(med.timing)}
                                </p>
                                <p>
                                    <strong>Duration:</strong> {med.days || 1} days
                                </p>
                                <div className="medicine-action">
                                    <p style={{ margin: 0 }}>
                                        <strong>Status:</strong> {med.administered ? "Given" : "Not Given"}
                                    </p>
                                    <button
                                        type="button"
                                        className={med.administered ? "secondary" : "primary"}
                                        onClick={() => markGiven(patient.id, index)}
                                    >
                                        {med.administered ? "Mark Not Given" : "Mark Given"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ))
            )}

            <button type="button" className="secondary">
                📄 View Medication History
            </button>

            {message && <div className="success-message">{message}</div>}
        </div>
    );
}
