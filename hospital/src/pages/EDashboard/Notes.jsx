import React, { useState } from "react";

export function Notes({ role, permissions }) {
    const [notes, setNotes] = useState([
        { id: 1, title: "Project note", content: "Use this page to capture quick project or patient notes.", author: role?.toUpperCase() || "Staff" },
    ]);

    return (
        <div className="card">
            <h3>📝 Notes</h3>
            <p>This page is for quick notes and observations while working inside the hospital dashboard.</p>
            <div className="box">
                {notes.map((note) => (
                    <div key={note.id} className="note-card">
                        <h4>{note.title}</h4>
                        <p>{note.content}</p>
                        <small>{note.author}</small>
                    </div>
                ))}
            </div>
            {!permissions.write && (
                <div className="message-box warning-message">Write permission is required to add or edit notes.</div>
            )}
        </div>
    );
}
