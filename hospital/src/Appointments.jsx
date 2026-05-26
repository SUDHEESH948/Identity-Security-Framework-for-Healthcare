import React, { useState, useEffect } from "react";
import API from "./api";

function Appointments({ onSelect }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    API.get("/appointments")
      .then((res) => {
        setData(res.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load appointments");
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading appointments...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="card">
      <h3>Appointments</h3>
      <table className="table">
        <thead>
          <tr>
            <th>RegNo</th>
            <th>Name</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((a) => (
            <tr key={a.regno}>
              <td>{a.regno}</td>
              <td>{a.first_name}</td>
              <td>
                <button onClick={() => onSelect(a)}>Open</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Appointments;