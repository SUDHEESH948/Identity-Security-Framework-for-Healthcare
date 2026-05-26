import React, { useState, useEffect } from "react";
import "./timepicker.css";

const TimePicker = ({ value, onChange }) => {
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmPm] = useState("AM");

  useEffect(() => {
    if (value) {
      const [h24, m] = value.split(':');
      const h = parseInt(h24);
      const ap = h >= 12 ? "PM" : "AM";
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      setHour(h12.toString().padStart(2, "0"));
      setMinute(m);
      setAmPm(ap);
    }
  }, [value]);

  const updateTime = (h, m, ap) => {
    const h24 = ap === "PM" ? (parseInt(h) % 12) + 12 : parseInt(h) % 12;
    onChange(`${h24.toString().padStart(2, "0")}:${m}`);
  };

  useEffect(() => {
    updateTime(hour, minute, ampm);
  }, [hour, minute, ampm]);

  return (
    <div className="timepicker">
      <select value={hour} onChange={(e) => setHour(e.target.value)} className="timepicker-select">
        {[...Array(12)].map((_, i) => {
          const num = (i + 1).toString().padStart(2, "0");
          return <option key={num} value={num}>{num}</option>;
        })}
      </select>
      :
      <select value={minute} onChange={(e) => setMinute(e.target.value)} className="timepicker-select">
        {[...Array(60)].map((_, i) => {
          const num = i.toString().padStart(2, "0");
          return <option key={num} value={num}>{num}</option>;
        })}
      </select>
      <select value={ampm} onChange={(e) => setAmPm(e.target.value)} className="timepicker-select">
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
};

export default TimePicker;