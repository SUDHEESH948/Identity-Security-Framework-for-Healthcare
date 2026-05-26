import React, { useState, useEffect } from "react";
import API from "../../api";
import { FaFileMedical } from "react-icons/fa";

export function Prescriptions({ appointment, canWrite, canModify }) {
    const [meds, setMeds] = useState([]);
    const [selectedMed, setSelectedMed] = useState("");
    const [timing, setTiming] = useState("");
    const [duration, setDuration] = useState("3");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });
    const [showHistory, setShowHistory] = useState(false);
    const [reportMessage, setReportMessage] = useState("");

    const [showLabModal, setShowLabModal] = useState(false);
    const [selectedLab, setSelectedLab] = useState("");
    const [labTests, setLabTests] = useState([]);

    const medicineList = ["Paracetamol", "Amoxicillin", "Ibuprofen"];
    const labList = ["Blood Test", "X-Ray", "MRI Scan"];

    const parseTimingObject = (timing) => {
        if (!timing) return "";
        if (typeof timing === "string") return timing;
        if (typeof timing !== "object") return "";

        if (timing.morning) return "Morning";
        if (timing.noon || timing.afternoon) return "Afternoon";
        if (timing.night) return "Night";
        return "";
    };

    const parsePrescriptionNotes = (notes) => {
        try {
            const parsed = typeof notes === "string" ? JSON.parse(notes) : notes;
            return { labTests: Array.isArray(parsed?.labTests) ? parsed.labTests : [] };
        } catch {
            return { labTests: [] };
        }
    };

    const serializeNotes = (labTests) => JSON.stringify({ labTests });

    useEffect(() => {
        if (!appointment) return;

        const fetchPrevious = async () => {
            try {
                setLoading(true);
                setStatus({ type: "", message: "" });

                const res = await API.get(`/prescriptions/${appointment.regno}`);

                if (res.data.success && res.data.data) {
                    const previous = res.data.data;

                    const parsedMeds = previous.medicines
                        ? typeof previous.medicines === "string"
                            ? JSON.parse(previous.medicines)
                            : previous.medicines
                        : [];

                    setMeds(
                        parsedMeds.map((m, index) => ({
                            id: Date.now() + index,
                            name: m.name || "",
                            timing: parseTimingObject(m.timing),
                            duration: m.days?.toString() || "3",
                        }))
                    );

                    const parsedNotes = parsePrescriptionNotes(previous.notes || "");
                    setLabTests(
                        parsedNotes.labTests.map((l, index) => ({
                            id: Date.now() + index,
                            name: l.name || l,
                        }))
                    );

                    if (parsedMeds.length > 0 || parsedNotes.labTests.length > 0) {
                        setStatus({ type: "success", message: "Previous prescription loaded." });
                    }
                } else {
                    setMeds([]);
                    setLabTests([]);
                }
            } catch (err) {
                console.error("Load error:", err);
                setStatus({ type: "error", message: "Unable to load previous prescription." });
            } finally {
                setLoading(false);
            }
        };

        fetchPrevious();
    }, [appointment]);

    if (!appointment) return <p>Select patient</p>;

    const addMedicine = () => {
        if (!selectedMed || !timing) return;

        const exists = meds.some((m) => m.name === selectedMed && m.timing === timing);
        if (exists) return;

        setMeds([
            ...meds,
            {
                id: Date.now(),
                name: selectedMed,
                timing,
                duration: duration || "1",
            },
        ]);

        setSelectedMed("");
        setTiming("");
        setDuration("3");
    };

    const removeMedicine = (id) => setMeds(meds.filter((m) => m.id !== id));

    const addLabTest = () => {
        if (!selectedLab) return;

        const exists = labTests.some((l) => l.name === selectedLab);
        if (exists) return;

        setLabTests([...labTests, { id: Date.now(), name: selectedLab }]);
        setSelectedLab("");
        setShowLabModal(false);
    };

    const removeLab = (id) => setLabTests(labTests.filter((l) => l.id !== id));

    const save = async () => {
        if (!appointment?.regno) {
            setStatus({ type: "error", message: "No patient selected" });
            return;
        }

        if (meds.length === 0) {
            setStatus({ type: "error", message: "At least one medicine is required" });
            return;
        }

        try {
            setLoading(true);

            const payload = {
                regno: appointment.regno,
                medicines: meds.map((m) => ({
                    name: m.name,
                    timing: {
                        morning: m.timing === "Morning",
                        noon: m.timing === "Afternoon",
                        night: m.timing === "Night",
                    },
                    days: Number(m.duration) || 1,
                })),
                notes: serializeNotes(labTests),
            };

            await API.post("/prescriptions", payload);
            setStatus({ type: "success", message: "Prescription saved successfully" });
        } catch (err) {
            console.error("SAVE ERROR:", err.response?.data || err.message);
            setStatus({ type: "error", message: err.response?.data?.message || "Save failed" });
        } finally {
            setLoading(false);
        }
    };

    const referToWard = async () => {
        if (meds.length === 0) {
            setStatus({ type: "error", message: "Add medicine before referring" });
            return;
        }

        try {
            setLoading(true);
            await API.post("/admit", {
                regno: appointment.regno,
                name: appointment.first_name,
                age: appointment.age,
                gender: appointment.gender,
                department: appointment.department,
                medicine: meds,
                notes: "Referred from prescription",
            });
            setStatus({ type: "success", message: "Patient referred to ward successfully 🏥" });
        } catch (err) {
            setStatus({ type: "error", message: "Refer failed" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h3>
                Prescription for {appointment.first_name} ({appointment.regno})
            </h3>

            <div className="prescription-actions">
                <button type="button" className="secondary" onClick={() => setShowHistory(!showHistory)}>
                    <FaFileMedical /> Patient History
                </button>
                <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                        if (appointment.report_url) {
                            window.open(appointment.report_url, "_blank");
                        } else {
                            setReportMessage("No report available for this patient yet.");
                            setTimeout(() => setReportMessage(""), 3000);
                        }
                    }}
                >
                    <FaFileMedical /> View Report
                </button>
            </div>

            {showHistory && (
                <div className="history-card">
                    <h4>Patient History</h4>
                    <p><strong>Previous medications:</strong></p>
                    {meds.length === 0 ? (
                        <p>No previous medicines recorded.</p>
                    ) : (
                        meds.map((m) => (
                            <div key={m.id} className="history-item">
                                {m.name} • {m.timing} • {m.duration || "1"} day(s)
                            </div>
                        ))
                    )}

                    <p><strong>Previously requested labs:</strong></p>
                    {labTests.length === 0 ? (
                        <p>No lab history yet.</p>
                    ) : (
                        labTests.map((l) => (
                            <div key={l.id} className="history-item">{l.name}</div>
                        ))
                    )}
                </div>
            )}

            <div className="form-row">
                <select value={selectedMed} onChange={(e) => setSelectedMed(e.target.value)}>
                    <option value="">Select Medicine</option>
                    {medicineList.map((m, i) => (
                        <option key={i} value={m}>
                            {m}
                        </option>
                    ))}
                </select>

                <select value={timing} onChange={(e) => setTiming(e.target.value)}>
                    <option value="">Time</option>
                    <option>Morning</option>
                    <option>Afternoon</option>
                    <option>Night</option>
                </select>

                <input
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Duration (days)"
                />

                <button type="button" className="secondary" onClick={addMedicine}>
                    Add
                </button>
            </div>

            <h4>Medicines</h4>
            {meds.length === 0 ? (
                <p className="empty">No medicines added yet</p>
            ) : (
                meds.map((m) => (
                    <div key={m.id} className="medicine-item">
                        <div>
                            <strong>{m.name}</strong>
                            {m.timing ? (
                                <span className="timing-badge">{m.timing}</span>
                            ) : (
                                <span className="timing-badge empty">No timing set</span>
                            )}
                            <div className="medicine-duration">{m.duration || "1"} day(s)</div>
                        </div>
                        <button type="button" className="danger" onClick={() => removeMedicine(m.id)}>
                            Remove
                        </button>
                    </div>
                ))
            )}

            <div className="section" style={{ marginTop: "20px" }}>
                <button type="button" className="secondary" onClick={() => setShowLabModal(true)}>
                    ➕ Add Lab Test
                </button>

                <h4>Lab Tests</h4>
                {labTests.length === 0 ? (
                    <p className="empty">No lab tests added yet</p>
                ) : (
                    labTests.map((l) => (
                        <div key={l.id} className="medicine-item">
                            <span>{l.name}</span>
                            <button type="button" className="danger" onClick={() => removeLab(l.id)}>
                                Remove
                            </button>
                        </div>
                    ))
                )}
            </div>

            {showLabModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h4>Select Lab Test</h4>
                        <select value={selectedLab} onChange={(e) => setSelectedLab(e.target.value)}>
                            <option value="">Select test</option>
                            {labList.map((l, i) => (
                                <option key={i} value={l}>
                                    {l}
                                </option>
                            ))}
                        </select>

                        <div className="buttons" style={{ marginTop: "15px" }}>
                            <button type="button" className="primary" onClick={addLabTest}>
                                Add
                            </button>
                            <button type="button" className="secondary" onClick={() => setShowLabModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {reportMessage && <div className="message-box success-message">{reportMessage}</div>}
            {status.message && <div className={`message-box ${status.type}`}>{status.message}</div>}

            <div className="buttons">
                <button type="button" className="primary" onClick={save} disabled={loading || !canWrite}>
                    {loading ? "Saving..." : "Save Prescription"}
                </button>
                <button type="button" className="secondary" onClick={referToWard} disabled={loading || !canModify}>
                    Refer to Ward
                </button>
            </div>

            {!canWrite && (
                <div className="message-box warning-message">
                    Write permission is required to save prescriptions.
                </div>
            )}
            {!canModify && (
                <div className="message-box warning-message">
                    Modify permission is required to refer patients to ward.
                </div>
            )}
        </div>
    );
}
