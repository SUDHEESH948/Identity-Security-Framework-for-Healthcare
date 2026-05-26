import React, { useState, useEffect } from "react";
import API from "../../api";

export function Appointments({ onSelect, department }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!department) {
            return;
        }

        const fetchAppointments = async () => {
            setLoading(true);
            setError(null);

            const today = new Date().toISOString().split("T")[0];
            const url = `/appointments?date=${today}&department=${encodeURIComponent(department)}`;

            try {
                const res = await API.get(url);
                if (res.data.success) {
                    setData(res.data.data || []);
                } else {
                    setError(res.data.message || "Failed to load appointments");
                }
            } catch (err) {
                const status = err.response?.status;
                const message = err.response?.data?.message || err.message;
                setError(`Failed to load appointments (${status}): ${message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [department]);

    if (loading) return <p>Loading appointments...</p>;
    if (error)
        return (
            <div className="error-box">
                <p>
                    <strong>Error:</strong> {error}
                </p>
                <p>
                    <strong>Department:</strong> {department || "Not set"}
                </p>
                <p>
                    <strong>Today's Date:</strong> {new Date().toISOString().split("T")[0]}
                </p>
            </div>
        );

    return (
        <div className="card">
            <h3>
                Appointments for {department} - {new Date().toISOString().split("T")[0]}
            </h3>
            {data.length === 0 ? (
                <p>No appointments scheduled for today in your department.</p>
            ) : (
                <table className="table">
                    <thead>
                        <tr>
                            <th>RegNo</th>
                            <th>Name</th>
                            <th>Time</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((a) => (
                            <tr key={a.regno}>
                                <td>{a.regno}</td>
                                <td>{a.first_name}</td>
                                <td>{a.time}</td>
                                <td>
                                    <button onClick={() => onSelect(a)}>Open</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
