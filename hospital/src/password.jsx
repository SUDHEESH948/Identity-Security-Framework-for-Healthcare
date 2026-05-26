import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./password.css";

export default function PasswordPage() {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token") || "";

  const [empID, setEmpID] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [verified, setVerified] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [checkingToken, setCheckingToken] = useState(true);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpAnimating, setOtpAnimating] = useState(false);
  const [timer, setTimer] = useState(0);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (!token) {
      setMessage("Missing or invalid token.");
      setTokenValid(false);
      setCheckingToken(false);
      return;
    }

    const verify = async () => {
      setCheckingToken(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/employee/verify-token/${token}`);
        if (res.data.success) {
          setEmpID(res.data.empID);
          setTokenValid(true);
        } else {
          setMessage(res.data.message || "Invalid or expired token.");
          setTokenValid(false);
        }
      } catch (err) {
        setMessage("Unable to verify token. Try again later.");
        setTokenValid(false);
      } finally {
        setCheckingToken(false);
      }
    };

    verify();
  }, [token]);

  useEffect(() => {
    if (!timer) return;

    const id = window.setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [timer]);

  const getStrength = () => {
    if (!newPassword) return "";
    const score = [/.{8,}/, /[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].reduce(
      (acc, re) => (re.test(newPassword) ? acc + 1 : acc),
      0
    );

    if (score <= 2) return "weak";
    if (score === 3 || score === 4) return "medium";
    return "strong";
  };

  const handleSendOTP = async () => {
    if (!token) {
      setMessage("Missing token.");
      return;
    }

    setMessage("");
    setOtpAnimating(true);
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/employee/send-otp", {
        token,
      });

      if (res.data.success) {
        setOtpSent(true);
        setTimer(60);
        otpRefs.current[0]?.focus();
        setMessage("OTP sent to your registered email.");
      } else {
        setMessage(res.data.message || "Unable to send OTP.");
      }
    } catch (err) {
      setMessage("Server error. Please try again.");
    } finally {
      setLoading(false);
      window.setTimeout(() => setOtpAnimating(false), 270);
    }
  };

  const handleOtpChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    if (value && index < otp.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!newPassword) {
      setMessage("Please enter a new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (otp.some((d) => d === "")) {
      setMessage("Please enter the full OTP.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/employee/change-password-token", {
        token,
        newPassword,
        otp: otp.join("")
      });

      if (res.data.success) {
        setVerified(true);
        setRedirecting(true);
        setMessage("Password updated. Redirecting to login...");

        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
      } else {
        setMessage(res.data.message || "Unable to update password.");
      }
    } catch (err) {
      setMessage("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-container">
      <div className="password-card">

        <h2>🔐 Set New Password</h2>
        <p className="subtitle">
          {checkingToken
            ? "Checking your reset link..."
            : tokenValid
            ? "Secure your account"
            : "Reset link unavailable"}
        </p>

        {verified && (
          <div className="success-animation">
            <div className="checkmark"></div>
            <p>Password Updated Successfully</p>
          </div>
        )}

        {checkingToken ? (
          <div className="message">Please wait while we verify your link.</div>
        ) : tokenValid ? (
          <form onSubmit={handleSubmit}>

          {/* Employee ID */}
          <div className="form-group">
            <input value={empID} disabled placeholder=" " />
            <label>Employee ID</label>
          </div>

          {/* New Password */}
          <div className="form-group password-field">
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder=" "
            />
            <label>New Password</label>

            <span
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          {/* Strength */}
          <div className={`strength-bar ${getStrength()}`}>
            {getStrength().toUpperCase()}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder=" "
            />
            <label>Confirm Password</label>
          </div>

          {/* OTP Button */}
          <button
            type="button"
            className={`otp-btn ${otpAnimating ? "pulse" : ""}`}
            onClick={handleSendOTP}
            disabled={timer > 0 || !token}
          >
            {timer > 0 ? `Resend in ${timer}s` : "Send OTP"}
          </button>

          {/* OTP Boxes */}
          {otpSent && (
            <div className="otp-box-container fade-in">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  className="otp-box"
                  value={digit}
                  onChange={(e) =>
                    handleOtpChange(e.target.value, index)
                  }
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  maxLength="1"
                />
              ))}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="submit-btn"
            disabled={loading || redirecting}
          >
            {loading || redirecting ? (
              <>
                <span className="button-spinner"></span>
                <span className="button-text">
                  {redirecting ? "Redirecting..." : "Verifying..."}
                </span>
              </>
            ) : (
              "Verify & Update"
            )}
          </button>

          {message && <p className="message">{message}</p>}

        </form>
      ) : (
        <div className="invalid-token">
          <p>{message || "This reset link is invalid or has expired."}</p>
          <p>Please request a new password reset link to continue.</p>
        </div>
      )}

      </div>
    </div>
  );
}
