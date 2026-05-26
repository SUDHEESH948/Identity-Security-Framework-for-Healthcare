import React, { useState, useEffect, useMemo } from "react";
import API from "../../api";

export function LabPending({ permissions }) {
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [file, setFile] = useState(null);
    const [reportMessage, setReportMessage] = useState("");

    useEffect(() => {
        if (!permissions.read) return;
        API.get("/lab/pending")
            .then((res) => setPatients(res.data.data || []))
            .catch(console.error);
    }, [permissions.read]);

    const grouped = useMemo(() => {
        return patients.reduce((acc, curr) => {
            if (!acc[curr.regno]) acc[curr.regno] = [];
            acc[curr.regno].push(curr);
            return acc;
        }, {});
    }, [patients]);

    if (!permissions.read) {
        return (
            <div className="card">
                <h3>Access denied</h3>
                <p>You need Read permission to access lab reports.</p>
            </div>
        );
    }

    return (
        <div className="card">
            <h3>🧪 Pending Lab Reports</h3>

            {selectedPatient && (
                <div className="box">
                    <h4>
                        {selectedPatient.name} ({selectedPatient.regno})
                    </h4>
                    <p>Test: {selectedPatient.test_name}</p>
                    <input type="file" onChange={(e) => setFile(e.target.files[0])} />
                    <br />
                    <br />
                    <button disabled={!permissions.write || !file} onClick={async () => {
                        if (!permissions.write) return;
                        try {
                            const formData = new FormData();
                            formData.append("file", file);
                            await API.put(`/lab/upload/${selectedPatient.id}`, formData, {
                                headers: { "Content-Type": "multipart/form-data" },
                            });
                            alert("Report Uploaded");
                            setPatients((prev) => prev.filter((x) => x.id !== selectedPatient.id));
                            setSelectedPatient(null);
                            setFile(null);
                        } catch (err) {
                            console.error(err);
                            alert("Upload failed");
                        }
                    }}>
                        Upload
                    </button>
                    <button onClick={() => setSelectedPatient(null)}>Cancel</button>
                </div>
            )}

            {reportMessage && (
                <div className={`message-box ${permissions.write ? "success-message" : "warning-message"}`}>
                    {reportMessage}
                </div>
            )}

            {!selectedPatient &&
                Object.keys(grouped).map((regno) => (
                    <div key={regno} className="box">
                        <h4>👤 Reg No: {regno}</h4>
                        {grouped[regno].map((p) => (
                            <div key={p.id} className="lab-card">
                                <p>
                                    <strong>{p.name}</strong>
                                </p>
                                <p>🧪 Test: {p.test_name}</p>
                                <div className="lab-actions">
                                    <button disabled={!permissions.write} onClick={() => permissions.write && setSelectedPatient(p)}>
                                        Upload Report
                                    </button>
                                    <button
                                        type="button"
                                        className="secondary"
                                        onClick={() => {
                                            if (!permissions.read) {
                                                setReportMessage("Read permission is required to view reports.");
                                                setTimeout(() => setReportMessage(""), 3000);
                                                return;
                                            }
                                            if (p.report_url) {
                                                window.open(p.report_url, "_blank");
                                            } else {
                                                setReportMessage("No report available yet for this patient.");
                                                setTimeout(() => setReportMessage(""), 3000);
                                            }
                                        }}
                                    >
                                        📄 View Report
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
        </div>
    );
}
