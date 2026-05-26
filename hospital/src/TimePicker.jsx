import React, { useState, useEffect, useCallback } from "react";
import "./TimePicker.css";

const TimePicker = ({ value, onChange }) => {

  const getInitialState = useCallback((val) => {
    if (val) {
      const [h24, m] = val.split(":");
      const h = parseInt(h24);
      const ap = h >= 12 ? "PM" : "AM";
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;

      return {
        hour: h12.toString().padStart(2, "0"),
        minute: m,
        ampm: ap
      };
    }
    return { hour: "12", minute: "00", ampm: "AM" };
  }, []);

  const initial = getInitialState(value);

  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [ampm, setAmPm] = useState(initial.ampm);

  // Sync when parent value changes
  useEffect(() => {
    const newInitial = getInitialState(value);

    if (
      newInitial.hour !== hour ||
      newInitial.minute !== minute ||
      newInitial.ampm !== ampm
    ) {
      setHour(newInitial.hour);
      setMinute(newInitial.minute);
      setAmPm(newInitial.ampm);
    }
  }, [value, getInitialState]); // fixed deps

  // Update parent only when internal state changes
  useEffect(() => {
    const h24 =
      ampm === "PM"
        ? (parseInt(hour) % 12) + 12
        : parseInt(hour) % 12;

    const formatted = `${h24.toString().padStart(2, "0")}:${minute}`;

    if (formatted !== value) {
      onChange(formatted);
    }
  }, [hour, minute, ampm]); // no value dependency

  return (
    <div className="timepicker">
      <select value={hour} onChange={(e) => setHour(e.target.value)}>
        {[...Array(12)].map((_, i) => {
          const num = (i + 1).toString().padStart(2, "0");
          return <option key={num} value={num}>{num}</option>;
        })}
      </select>

      :

      <select value={minute} onChange={(e) => setMinute(e.target.value)}>
        {[...Array(60)].map((_, i) => {
          const num = i.toString().padStart(2, "0");
          return <option key={num} value={num}>{num}</option>;
        })}
      </select>

      <select value={ampm} onChange={(e) => setAmPm(e.target.value)}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
};

export default TimePicker;