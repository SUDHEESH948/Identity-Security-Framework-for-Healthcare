import React, { useState, useEffect, useMemo } from "react";
import API from "../../api";

export function NursePatients({ permissions }) {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [viewMode, setViewMode] = useState("admitted");
    const [searchRegNo, setSearchRegNo] = useState("");
    const [patientVitals, setPatientVitals] = useState({});
    const [medTracking, setMedTracking] = useState({});
    const [medicineInput, setMedicineInput] = useState({});
    const [trackingMessage, setTrackingMessage] = useState("");

    useEffect(() => {
        if (!permissions.read) return;

        setLoading(true);
        API.get("/admitted")
            .then((res) => {
                setPatients(res.data.data || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError("Failed loading patients");
                setLoading(false);
            });
    }, [permissions.read]);

    const filteredPatients = useMemo(() => {
        return patients.filter((p) => {
            if (
                searchRegNo &&
                !(p.regno || "")
                    .toString()
                    .toLowerCase()
                    .includes(searchRegNo.toLowerCase())
            ) {
                return false;
            }

            if (viewMode === "admitted") {
                return !p.discharged_at;
            }

            if (viewMode === "discharged") {
                return p.discharged_at;
            }

            return true;
        });
    }, [patients, searchRegNo, viewMode]);

    if (!permissions.read) {
        return (
            <div className="card">
                <h3>Access Denied</h3>
            </div>
        );
    }

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    const grouped = useMemo(() => {
        return Object.values(
            filteredPatients.reduce((acc, p) => {
                if (!acc[p.regno]) {
                    acc[p.regno] = [];
                }
                acc[p.regno].push(p);
                return acc;
            }, {})
        );
    }, [filteredPatients]);

    const saveVitals = async (patientId) => {
        const v = patientVitals[patientId] || {};
        if (!v.bp || !v.temp || !v.pulse) {
            setTrackingMessage("Fill all vital fields");
            return;
        }

        try {
            await API.post("/save-vitals", {
                patient_id: patientId,
                bp: v.bp,
                temp: v.temp,
                pulse: v.pulse,
            });

            setTrackingMessage("Vitals saved successfully");
        } catch (err) {
            console.error(err);
            setTrackingMessage("Error saving vitals");
        }

        setTimeout(() => setTrackingMessage(""), 3000);
    };

    const addTrackedMedicine = async (patientId) => {
        const medName = medicineInput[patientId];
        if (!medName) return;

        try {
            await API.post("/medications", {
                patient_id: patientId,
                medicine: medName,
            });

            setMedTracking((prev) => ({
                ...prev,
                [patientId]: [
                    ...(prev[patientId] || []),
                    {
                        id: Date.now(),
                        name: medName,
                        administered: false,
                    },
                ],
            }));

            setMedicineInput({
                ...medicineInput,
                [patientId]: "",
            });
        } catch (err) {
            console.error(err);
        }
    };

    const toggleAdministered = (patientId, id) => {
        setMedTracking((prev) => ({
            ...prev,
            [patientId]: prev[patientId].map((item) =>
                item.id === id ? { ...item, administered: !item.administered } : item
            ),
        }));
    };

    const readmitPatient = async (id) => {
        try {
            await API.put(`/readmit/${id}`);
            setPatients((prev) =>
                prev.map((x) => (x.id === id ? { ...x, discharged_at: null } : x))
            );
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="card">
            <h3>🏥 Patients</h3>

            <div className="panel-buttons">
                <button onClick={() => setViewMode("admitted")} className="primary-button">
                    Admitted Patients
                </button>
                <button onClick={() => setViewMode("discharged")} className="secondary-button">
                    Discharged Patients
                </button>
            </div>

            <input
                type="text"
                placeholder="Search Reg No"
                value={searchRegNo}
                onChange={(e) => setSearchRegNo(e.target.value)}
            />

            {grouped.map((group, idx) => {
                const sortedGroup = [...group].sort(
                    (a, b) => new Date(b.admitted_at) - new Date(a.admitted_at)
                );
                const latest = sortedGroup[0];

                return (
                    <div key={latest.regno + idx} className="patient-card">
                        <h4>
                            {latest.name} ({latest.regno})
                        </h4>
                        <p>
                            Age: {latest.age} | Gender: {latest.gender}
                        </p>

                        <div className="box">
                            <h4>Record Vitals</h4>
                            <input
                                placeholder="BP"
                                value={patientVitals[latest.id]?.bp || ""}
                                onChange={(e) =>
                                    setPatientVitals({
                                        ...patientVitals,
                                        [latest.id]: {
                                            ...(patientVitals[latest.id] || {}),
                                            bp: e.target.value,
                                        },
                                    })
                                }
                            />
                            <input
                                placeholder="Temperature"
                                value={patientVitals[latest.id]?.temp || ""}
                                onChange={(e) =>
                                    setPatientVitals({
                                        ...patientVitals,
                                        [latest.id]: {
                                            ...(patientVitals[latest.id] || {}),
                                            temp: e.target.value,
                                        },
                                    })
                                }
                            />
                            <input
                                placeholder="Pulse"
                                value={patientVitals[latest.id]?.pulse || ""}
                                onChange={(e) =>
                                    setPatientVitals({
                                        ...patientVitals,
                                        [latest.id]: {
                                            ...(patientVitals[latest.id] || {}),
                                            pulse: e.target.value,
                                        },
                                    })
                                }
                            />
                            <button disabled={!permissions.write} onClick={() => saveVitals(latest.id)}>
                                Save Vitals
                            </button>
                        </div>

                        <div className="box">
                            <h4>Medication</h4>
                            <input
                                value={medicineInput[latest.id] || ""}
                                placeholder="Add Medicine"
                                onChange={(e) =>
                                    setMedicineInput({
                                        ...medicineInput,
                                        [latest.id]: e.target.value,
                                    })
                                }
                            />
                            <button disabled={!permissions.write} onClick={() => addTrackedMedicine(latest.id)}>
                                Add
                            </button>

                            {(medTracking[latest.id] || []).map((item) => (
                                <div key={item.id} className="medicine-tracking-item">
                                    <strong>{item.name}</strong>
                                    <div>{item.administered ? "Administered" : "Pending"}</div>
                                    <button
                                        disabled={!permissions.write}
                                        onClick={() => toggleAdministered(latest.id, item.id)}
                                    >
                                        {item.administered ? "Undo" : "Mark Done"}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {sortedGroup
                            .filter((p, index) => p.ward_no || index === 0)
                            .map((p) => (
                                <div key={p.id} className="history-box">
                                    {!p.discharged_at && (
                                        <div>
                                            <p>Ward: {p.ward_no || "Not Assigned"}</p>
                                            {!p.ward_no ? (
                                                <>
                                                    <input
                                                        placeholder="Enter Ward"
                                                        disabled={!permissions.modify}
                                                        value={p.ward_no || ""}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setPatients((prev) =>
                                                                prev.map((x) =>
                                                                    x.id === p.id ? { ...x, ward_no: value } : x
                                                                )
                                                            );
                                                        }}
                                                    />
                                                    <button
                                                        disabled={!permissions.modify || !p.ward_no}
                                                        onClick={async () => {
                                                            try {
                                                                await API.put(`/update-ward/${p.id}`, { ward_no: p.ward_no });
                                                            } catch (err) {
                                                                console.error(err);
                                                            }
                                                        }}
                                                    >
                                                        Update
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="ward-assigned">✔ Ward Assigned</span>
                                            )}
                                        </div>
                                    )}

                                    <p>Status: {p.discharged_at ? "Discharged" : "Active"}</p>

                                    {!p.discharged_at && (
                                        <button
                                            disabled={!permissions.modify}
                                            onClick={async () => {
                                                if (!window.confirm("Discharge patient?")) return;
                                                try {
                                                    await API.put(`/discharge/${p.id}`);
                                                    setPatients((prev) =>
                                                        prev.map((x) =>
                                                            x.id === p.id ? { ...x, discharged_at: new Date() } : x
                                                        )
                                                    );
                                                } catch (err) {
                                                    console.error(err);
                                                }
                                            }}
                                        >
                                            Discharge
                                        </button>
                                    )}

                                    {p.discharged_at && (
                                        <button disabled={!permissions.modify} onClick={() => readmitPatient(p.id)}>
                                            Re-Admit
                                        </button>
                                    )}
                                </div>
                            ))}
                    </div>
                );
            })}

            {trackingMessage && <div className="success-message">{trackingMessage}</div>}
        </div>
    );
}
