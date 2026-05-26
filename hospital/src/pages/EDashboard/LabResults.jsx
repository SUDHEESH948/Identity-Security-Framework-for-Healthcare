import React, { useState, useEffect } from "react";
import API from "../../api";

export function LabResults({ permissions }) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!permissions.read) return;
        API.get("/lab/results")
            .then((res) => {
                setResults(res.data.data || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError("Failed to load lab results.");
                setLoading(false);
            });
    }, [permissions.read]);

    if (!permissions.read) {
        return (
            <div className="card">
                <h3>Access denied</h3>
                <p>You need Read permission to view lab results.</p>
            </div>
        );
    }

    if (loading) return <p>Loading lab results...</p>;
    if (error) return <div className="card"><p>{error}</p></div>;

    if (results.length === 0) {
        return (
            <div className="card">
                <h3>Lab Results</h3>
                <p>No lab results available yet.</p>
            </div>
        );
    }

    return (
        <div className="card">
            <h3>Lab Results</h3>
            {results.map((item) => (
                <div key={item.id || `${item.regno}-${item.test_name}`} className="box lab-card">
                    <h4>{item.name} ({item.regno})</h4>
                    <p>Test: {item.test_name}</p>
                    <p>Status: {item.status || "Completed"}</p>
                    {item.report_url ? (
                        <button type="button" onClick={() => window.open(item.report_url, "_blank")}>View Report</button>
                    ) : (
                        <p>Report not yet available.</p>
                    )}
                </div>
            ))}
        </div>
    );
}
