
// server.js
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");
const axios = require("axios");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();

if (
  !process.env.JWT_SECRET ||
  !process.env.DB_PASSWORD ||
  !process.env.SESSION_SECRET ||
  !process.env.EMAIL_USER ||
  !process.env.EMAIL_PASS
) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

// ================= JWT SECRET =================
const JWT_SECRET = process.env.JWT_SECRET;
// ---------------- CORS ----------------
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

// -----------------------------
// Middleware
// -----------------------------
app.use(express.json());
app.use(helmet());
app.set("trust proxy", 1); // if behind a proxy
// ======================================================
// 🔐 LOGIN ATTEMPT TRACKING (ML + Security Improved)
// ======================================================

const loginAttempts = new Map();
// IP -> { count, lastAttempt, blockedUntil, reason, mlScore }

const TIME_WINDOW = 15 * 60 * 1000; // 15 minutes

// ================= CHECK LOGIN STATUS =================
function checkLoginAttempts(ip) {
  const now = Date.now();
  const data = loginAttempts.get(ip);

  if (!data) {
    return { blocked: false, count: 0 };
  }

  // Auto reset after time window
  if (now - data.lastAttempt > TIME_WINDOW) {
    loginAttempts.delete(ip);
    return { blocked: false, count: 0 };
  }

  // Check block status
  if (now < data.blockedUntil) {
    return {
      blocked: true,
      remainingTime: Math.ceil((data.blockedUntil - now) / 1000),
      reason: data.reason || "Too many failed attempts",
      mlScore: data.mlScore || 0
    };
  }

  return {
    blocked: false,
    count: data.count || 0
  };
}

// ================= RECORD FAILED LOGIN =================
function recordFailedLogin(ip, mlConfidence = 0) {
  const now = Date.now();

  let data = loginAttempts.get(ip);

  if (!data) {
    data = {
      count: 0,
      lastAttempt: now,
      blockedUntil: 0,
      reason: "",
      mlScore: 0
    };
  }

  data.count += 1;
  data.lastAttempt = now;
  data.mlScore = mlConfidence;

  // ================= ML BASED RULES =================
  let maxAttempts = 5;
  let blockMinutes = 15;
  let reason = "Brute force detected";

  if (mlConfidence > 0.7) {
    maxAttempts = 2;
    blockMinutes = 60;
    reason = "High-risk ML anomaly detected";
  } else if (mlConfidence > 0.5) {
    maxAttempts = 3;
    blockMinutes = 30;
    reason = "Suspicious behavior detected";
  } else if (mlConfidence > 0.3) {
    maxAttempts = 4;
    blockMinutes = 15;
    reason = "Moderate risk activity detected";
  }

  // ================= BLOCK USER =================
  if (data.count >= maxAttempts) {
    data.blockedUntil = now + blockMinutes * 60 * 1000;
    data.reason = reason;

    console.log(
      `🚫 BLOCKED IP: ${ip} | Attempts: ${data.count} | ML: ${mlConfidence} | Block: ${blockMinutes} min`
    );
  }

  loginAttempts.set(ip, data);
}

// ======================================================
// 🔐 JWT MIDDLEWARE
// ======================================================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "No token provided"
    });
  }

  try {
    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded; // ✅ attach user data
    next();

  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};


// ======================================================
// 🔐 ROLE AUTHORIZATION (OPTIONAL BUT POWERFUL)
// ======================================================
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    next();
  };
};




// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100 // max requests per IP
});
app.use(limiter);

// -----------------------------
// PostgreSQL connection
// -----------------------------
const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: process.env.DB_PASSWORD,
  database: "hospital_db",
  port: 5432
});

// -----------------------------
// Session (for admin login)
// -----------------------------
app.use(session({
  name: "hospital_sid",
  secret: process.env.SESSION_SECRET, // change in production
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // ✅
    sameSite: "lax"
  }
}));

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// -----------------------------
// ML Anomaly Detection
// -----------------------------
async function checkAnomaly(requestData) {
  try {
    // Extract only the fields the ML API expects
    const mlData = {
      email: requestData.email || '',
      password: requestData.password || '',
      faceDescriptor: requestData.faceDescriptor || null
    };

    const response = await axios.post('http://localhost:5001/api/ml/check_anomaly', mlData, {
      timeout: 5000 // 5 second timeout
    });

    return response.data;
  } catch (error) {
    console.error('ML API error:', error.message);
    // If ML service is down, allow the request but log the error
    return {
      is_anomaly: false,
      confidence: 0.0,
      error: 'ML service unavailable'
    };
  }
}

// -----------------------------
// Password generator
// -----------------------------
function generateRandomPassword(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// -----------------------------
// Employee tables setup
// -----------------------------
async function createEmployeeTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        empid VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        role VARCHAR(50) NOT NULL,
        department VARCHAR(100),
        starttime TIME NOT NULL,
        endtime TIME NOT NULL,
        permissions JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS employee_credentials (
        id SERIAL PRIMARY KEY,
        empid VARCHAR(10) UNIQUE NOT NULL REFERENCES employees(empid) ON DELETE CASCADE,
        password_hash VARCHAR(255) NOT NULL,
        must_change_password BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);


  } catch (err) {
    console.error("Error creating employee tables:", err);
  }
}
createEmployeeTables();

// -----------------------------
// Generate unique empID
// -----------------------------
async function generateUniqueEmpID(role) {
  let empID;
  let exists = true;

  while (exists) {
    empID = role[0].toUpperCase() + Math.floor(10000 + Math.random() * 90000);
    const result = await pool.query("SELECT 1 FROM employees WHERE empid=$1", [empID]);
    exists = result.rows.length > 0;
  }
  return empID;
}


// -----------------------------
// GET all employees (without password)
// -----------------------------
app.get("/api/employees", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        empid AS "empID",
        name,
        email,
        role,
        department,
        starttime AS "startTime",
        endtime AS "endTime",
        permissions
      FROM employees
      ORDER BY created_at DESC
    `);

    res.json({ success: true, employees: result.rows });
  } catch (err) {
    console.error("Fetch employees error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -----------------------------
// Add employee (send email with password)
// -----------------------------
app.post("/api/employees", async (req, res) => {
  try {
    // 🔍 ML Anomaly Detection Check
    const anomalyResult = await checkAnomaly(req.body);
    if (anomalyResult.is_anomaly) {
      console.log(`🚨 Anomaly detected in add employee: confidence ${anomalyResult.confidence}`);
      return res.status(403).json({
        success: false,
        message: "Suspicious activity detected. Request blocked for security."
      });
    }

    const { name, email, role, department, startTime, endTime, permissions } = req.body;
    if (!name || !email || !role || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }


    const empID = await generateUniqueEmpID(role);
    const generatedPassword = generateRandomPassword(10);
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Insert employee
    const employeeResult = await pool.query(
      `INSERT INTO employees
       (empid, name, email, role, department, starttime, endtime, permissions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, empid AS "empID", name, email, role, department, starttime AS "startTime", endtime AS "endTime", permissions`,
      [empID, name, email, role, department || null, startTime, endTime, permissions || { read: false, write: false, modify: false }]
    );

    // Insert credentials with must_change_password
    await pool.query(
      `INSERT INTO employee_credentials (empid, password_hash, must_change_password)
       VALUES ($1,$2,true)`,
      [empID, hashedPassword]
    );
    
    // -----------------------------
    // Send Email
    // -----------------------------
    // -----------------------------
    // Generate Token
    // -----------------------------
    const crypto = require("crypto");

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    // Save token
    await pool.query(
      `UPDATE employee_credentials
   SET reset_token=$1, token_expiry=$2
   WHERE empid=$3`,
      [token, expiry, empID]
    );

    // -----------------------------
    // Send Email
    // -----------------------------
    const resetLink = `http://localhost:3000/password?token=${token}`;

    const mailOptions = {
      from: '"Hospital Admin" <ushasino9@gmail.com>',
      to: email,
      subject: "Your Employee Account & Secure Password Setup",

      html: `
    <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
      
      <div style="max-width:520px; margin:auto; background:white; padding:25px; border-radius:10px;">
        
        <h2 style="color:#2c3e50; text-align:center;">
          Welcome ${name}
        </h2>

        <p>Your employee account has been successfully created.</p>

        <div style="background:#eef3f7; padding:15px; border-radius:8px; margin:15px 0;">
          <p><strong>Employee ID:</strong> ${empID}</p>
          <p><strong>Temporary Password:</strong> ${generatedPassword}</p>
        </div>

        <p style="color:#e74c3c; font-weight:bold;">
          ⚠️ This is a temporary password. You must change it after first login.
        </p>

        <p>Click below to set your password securely:</p>

        <div style="text-align:center; margin:25px 0;">
          <a href="${resetLink}" 
             style="background:#1976d2;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
             🔐 Set Your Password
          </a>
        </div>

        <p style="font-size:14px; color:#555;">
          • Link expires in <b>10 minutes</b><br/>
          • OTP verification required
        </p>

        <hr/>

        <p style="font-size:13px; color:#888;">
          If you did not request this, please ignore this email.
        </p>

        <p>
          Regards,<br/>
          <strong>Hospital Admin Team</strong>
        </p>

      </div>
    </div>
  `
    };

    // -----------------------------
    // Send Email (Async/Await)
    // -----------------------------
    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Employee created and email sent",
      employee: {
        ...employeeResult.rows[0],
        generatedPassword
      }
    });


  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }
    console.error("Add employee error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -----------------------------
// Update employee
// -----------------------------
app.put("/api/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, department, startTime, endTime, permissions } = req.body;

    // Validate required fields
    if (!name || !email || !role || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, email, role, startTime, endTime"
      });
    }

    const empResult = await pool.query('SELECT empid FROM employees WHERE id = $1', [id]);
    const updateFields = [];
    const values = [];
    let idx = 1;

    updateFields.push(`name=$${idx++}`); values.push(name);
    updateFields.push(`email=$${idx++}`); values.push(email);
    updateFields.push(`role=$${idx++}`); values.push(role);
    updateFields.push(`department=$${idx++}`); values.push(department || null);
    updateFields.push(`starttime=$${idx++}`); values.push(startTime);
    updateFields.push(`endtime=$${idx++}`); values.push(endTime);
    updateFields.push(`permissions=$${idx++}`); values.push(permissions || { read: false, write: false, modify: false });

    values.push(id);

    const result = await pool.query(
      `UPDATE employees SET ${updateFields.join(', ')} WHERE id=$${idx} RETURNING id, empid AS "empID", name, email, role, department, starttime AS "startTime", endtime AS "endTime", permissions`,
      values
    );

    res.json({ success: true, message: "Employee updated", employee: result.rows[0] });
  } catch (err) {
    console.error("Update employee error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -----------------------------
// Delete employee
// -----------------------------
app.delete("/api/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM employees WHERE id=$1", [id]);
    res.json({ success: true, message: "Employee deleted" });
  } catch (err) {
    console.error("Delete employee error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -----------------------------
// Admin login
// -----------------------------
app.post("/api/admin/login", async (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress || "unknown";

    // 🔍 Check login attempt limits
    const attemptCheck = checkLoginAttempts(clientIP);
    if (attemptCheck.blocked) {
      return res.status(403).json({
        success: false,
        message: "Suspicious activity detected. Request blocked for security."
      });
    }

    // 🔍 ML Anomaly Detection Check
    const anomalyResult = await checkAnomaly(req.body);
    if (anomalyResult.is_anomaly) {
      console.log(`🚨 Anomaly detected in admin login: confidence ${anomalyResult.confidence}`);
      // Record failed attempt with high ML confidence
      recordFailedLogin(clientIP, anomalyResult.confidence);
      return res.status(403).json({
        success: false,
        message: "Suspicious activity detected. Request blocked for security."
      });
    }

    const { adminId, password } = req.body;
    const result = await pool.query("SELECT * FROM admins WHERE admin_id=$1", [adminId]);
    if (result.rows.length === 0) {
      // Invalid admin ID - record failed attempt
      recordFailedLogin(clientIP, anomalyResult.confidence || 0.1);
      return res.json({ success: false, message: "Admin not found" });
    }

    const admin = result.rows[0];
    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      // Wrong password - record failed attempt
      recordFailedLogin(clientIP, anomalyResult.confidence || 0.2);
      return res.json({ success: false, message: "Wrong password" });
    }

    // ✅ Successful login - reset attempt counter
    loginAttempts.delete(clientIP);

    // Save session
    req.session.admin = { id: admin.id, adminId: admin.admin_id };
    res.json({ success: true, message: "Admin login successful" });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/employee/verify-token/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      `SELECT empid, token_expiry 
       FROM employee_credentials 
       WHERE reset_token=$1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.json({ success: false });
    }

    const user = result.rows[0];

    // ⏱ check expiry
    if (new Date() > new Date(user.token_expiry)) {
      return res.json({ success: false, message: "Token expired" });
    }

    res.json({ success: true, empID: user.empid });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// -----------------------------
// Send OTP API
// -----------------------------
app.post("/api/employee/send-otp", async (req, res) => {
  try {
    const { token } = req.body;

    const result = await pool.query(
      `SELECT e.email, ec.empid 
       FROM employee_credentials ec
       JOIN employees e ON ec.empid = e.empid
       WHERE ec.reset_token=$1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.json({ success: false });
    }

    const { email, empid } = result.rows[0];

    // 🔢 Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    // Save OTP
    await pool.query(
      `UPDATE employee_credentials
       SET otp=$1, otp_expiry=$2
       WHERE empid=$3`,
      [otp, expiry, empid]
    );

    // 📧 Send OTP Email
    await transporter.sendMail({
      from: '"Hospital Admin" <ushasino9@gmail.com>',
      to: email,
      subject: "Your OTP Code",
      html: `
        <h3>Your OTP Code</h3>
        <p>Your OTP is: <b>${otp}</b></p>
        <p>This OTP expires in 5 minutes.</p>
      `
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// -----------------------------
//Change Password with Token + OTP
// -----------------------------

app.post("/api/employee/change-password-token", async (req, res) => {
  try {
    const { token, newPassword, otp } = req.body;

    const result = await pool.query(
      `SELECT * FROM employee_credentials 
       WHERE reset_token=$1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.json({ success: false, message: "Invalid token" });
    }

    const user = result.rows[0];

    // ⏱ Token expiry
    if (new Date() > new Date(user.token_expiry)) {
      return res.json({ success: false, message: "Token expired" });
    }

    // 🔐 OTP check
    if (user.otp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    if (new Date() > new Date(user.otp_expiry)) {
      return res.json({ success: false, message: "OTP expired" });
    }

    // 🔒 Hash password
    const hashed = await bcrypt.hash(newPassword, 10);

    // ✅ Update + cleanup
    await pool.query(
      `UPDATE employee_credentials
       SET password_hash=$1,
           must_change_password=false,
           reset_token=NULL,
           token_expiry=NULL,
           otp=NULL,
           otp_expiry=NULL,
           updated_at=CURRENT_TIMESTAMP
       WHERE empid=$2`,
      [hashed, user.empid]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});


// -----------------------------
// Employee Login (FINAL FIXED)
// -----------------------------
app.post("/api/employee/login", async (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress || "unknown";

    // 🔍 Check login attempt limits
    const attemptCheck = checkLoginAttempts(clientIP);
    if (attemptCheck.blocked) {
      return res.status(429).json({
        success: false,
        message: `Too many failed login attempts. Try again in ${attemptCheck.remainingTime} seconds.`
      });
    }

    // 🔍 ML Anomaly Detection Check
    const anomalyResult = await checkAnomaly(req.body);

    if (anomalyResult.is_anomaly) {
      console.log(`🚨 Anomaly detected in employee login: confidence ${anomalyResult.confidence}`);

      // Record failed attempt with high ML confidence
      recordFailedLogin(clientIP, anomalyResult.confidence);

      return res.status(403).json({
        success: false,
        message: "Suspicious activity detected. Request blocked for security."
      });
    }

    const { empID, password } = req.body;

    const result = await pool.query(
      `SELECT ec.*, e.starttime, e.endtime, e.role, e.department, e.permissions
       FROM employee_credentials ec
       JOIN employees e ON ec.empid = e.empid
       WHERE ec.empid = $1`,
      [empID]
    );

    if (result.rows.length === 0) {
      // Invalid empID - record failed attempt
      recordFailedLogin(clientIP, anomalyResult.confidence || 0.1);
      return res.json({ success: false, message: "Invalid Employee ID" });
    }

    const user = result.rows[0];

    // 🔐 Password check
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      // Incorrect password - record failed attempt
      recordFailedLogin(clientIP, anomalyResult.confidence || 0.2);
      return res.json({ success: false, message: "Incorrect password" });
    }

    // 🕒 SAFE TIME CHECK (DATE BASED)
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    let startTime = new Date(`${today}T${user.starttime}`);
    let endTime = new Date(`${today}T${user.endtime}`);

    // 🌙 Night shift fix (end < start)
    if (endTime < startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }

    if (now < startTime || now > endTime) {
      return res.json({
        success: false,
        message: `Login allowed only between ${user.starttime} - ${user.endtime}`
      });
    }

    // ⚠️ Force password change
    if (user.must_change_password) {
      return res.json({
        success: true,
        mustChange: true,
        redirect: `/password?token=${user.reset_token}`
      });
    }

    // ⏳ LOGOUT TIME = endTime + 10 min
    const logoutTime = new Date(endTime);
    logoutTime.setMinutes(logoutTime.getMinutes() + 10);

    // 🔐 JWT TOKEN (expires at logout time)
    const expiresInSeconds = Math.floor(
      (logoutTime.getTime() - now.getTime()) / 1000
    );

    const token = jwt.sign(
      {
        empID: user.empid,
        role: user.role,
        permissions: user.permissions || { read: false, write: false, modify: false }
      },
      JWT_SECRET,
      { expiresIn: expiresInSeconds > 0 ? expiresInSeconds : 60 }
    );

    // ✅ Successful login - reset attempt counter
    loginAttempts.delete(clientIP);

    res.json({
      success: true,
      message: "Login successful",
      empID: user.empid,
      role: user.role,
      department: user.department,
      permissions: user.permissions || { read: false, write: false, modify: false },
      token,
      expiresAt: logoutTime,
      redirect: "/EDashboard"
    });

  } catch (err) {
    console.error("Employee login error:", err);
    res.status(500).json({ success: false });
  }
});










// ======================================================
// 👤 GET LOGGED-IN USER PROFILE
// ======================================================
app.get("/api/employee/me", verifyToken, async (req, res) => {
  try {
    const empID = req.user.empID;

    const result = await pool.query(
      `SELECT empid, role, department, starttime, endtime, permissions 
       FROM employees WHERE empid = $1`,
      [empID]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      empID: user.empid,
      role: user.role,
      department: user.department,
      startTime: user.starttime,
      endTime: user.endtime,
      permissions: user.permissions || { read: false, write: false, modify: false }
    });

  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});



// ======================================================
// 👩‍⚕️ NURSE ROUTES
// ======================================================
app.get(
  "/api/patients/:empID",
  verifyToken,
  authorizeRole(["nurse"]),
  async (req, res) => {
    const result = await pool.query("SELECT * FROM patients");
    res.json(result.rows);
  }
);


// ======================================================
// 🧪 LAB ROUTES
// ======================================================
app.get(
  "/api/lab/requests/:empID",
  verifyToken,
  authorizeRole(["lab"]),
  async (req, res) => {
    const result = await pool.query("SELECT * FROM lab_requests");
    res.json(result.rows);
  }
);

async function generateUniqueRegNo() {
  let regNo;
  let exists = true;

  while (exists) {
    // P + 6 digit number
    regNo = "P" + Math.floor(100000 + Math.random() * 900000);

    const result = await pool.query(
      "SELECT 1 FROM patients WHERE regno = $1",
      [regNo]
    );

    exists = result.rows.length > 0;
  }

  return regNo;
}
app.get("/api/patient/regno", async (req, res) => {
  try {
    const regNo = await generateUniqueRegNo();

    return res.json({
      success: true,
      regNo
    });

  } catch (err) {
    console.error("❌ RegNo Error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to generate RegNo"
    });
  }
});
app.post("/api/patient/register", async (req, res) => {
  try {
    // 🔍 ML Anomaly Detection Check
    const anomalyResult = await checkAnomaly(req.body);
    if (anomalyResult.is_anomaly) {
      console.log(`🚨 Anomaly detected in patient register: confidence ${anomalyResult.confidence}`);
      return res.status(403).json({
        success: false,
        message: "Suspicious activity detected. Request blocked for security."
      });
    }

    const {
      regNo,
      first_name,
      last_name,
      age,
      gender,
      email,
      department,
      date,
      time,
      phone,
      address
    } = req.body;

    // ✅ Validation
    if (!first_name || !email) {
      return res.status(400).json({
        success: false,
        message: "First name and email are required"
      });
    }

    // ✅ Check if email already exists
    const emailCheck = await pool.query(
      "SELECT 1 FROM patients WHERE email = $1",
      [email.trim()]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Email ${email.trim()} is already registered ❌`
      });
    }

    // ✅ Handle RegNo
    let finalRegNo = regNo || await generateUniqueRegNo();

    // ✅ Ensure unique RegNo
    const check = await pool.query(
      "SELECT 1 FROM patients WHERE regno = $1",
      [finalRegNo]
    );
    if (check.rows.length > 0) {
      finalRegNo = await generateUniqueRegNo();
    }

    // ✅ Insert into DB
    const result = await pool.query(
      `INSERT INTO patients 
       (regno, first_name, last_name, age, gender, email, department, date, time, phone, address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        finalRegNo,
        first_name.trim(),
        last_name?.trim() || null,
        age || null,
        gender || null,
        email.trim(),
        department || null,
        date || null,
        time || null,
        phone || null,
        address || null
      ]
    );



    // ✅ Send Email
    await transporter.sendMail({
      from: '"Hospital" <ushasino9@gmail.com>',
      to: email,
      subject: "Patient Registration Successful",
      html: `
        <h2>Registration Successful</h2>
        <p><b>Name:</b> ${first_name} ${last_name || ""}</p>
        <p><b>Registration No:</b> ${finalRegNo}</p>
        <p><b>Department:</b> ${department || "-"}</p>
        <p><b>Date:</b> ${date || "-"}</p>
        <p><b>Time:</b> ${time || "-"}</p>
      `
    });

    // ✅ Response
    return res.status(201).json({
      success: true,
      message: "Patient registered successfully",
      regNo: finalRegNo,
      data: result.rows[0]
    });

  } catch (err) {
    console.error("❌ Register Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});
// ---------------- REGISTER (UPDATED ROUTE) ----------------
app.post("/api/patient/adding", async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    // Trim inputs
    const fName = first_name?.trim();
    const lName = last_name?.trim() || "";
    const userEmail = email?.trim();
    const userPassword = password;

    // Validate
    if (!fName || !userEmail || !userPassword) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields"
      });
    }

    // Check duplicate email
    const existing = await pool.query(
      "SELECT 1 FROM patientslogin WHERE email = $1",
      [userEmail]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    // Insert into DB
    await pool.query(
      `INSERT INTO patientslogin 
       (first_name, last_name, email, password) 
       VALUES ($1, $2, $3, $4)`,
      [fName, lName, userEmail, hashedPassword]
    );

    return res.status(201).json({
      success: true,
      message: "Registration successful"
    });

  } catch (err) {
    console.error("Register Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
// ---------------- LOGIN (SESSION-BASED) ----------------
app.post("/api/patient/login", async (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress || "unknown";

    // 🔍 Check login attempt limits
    const attemptCheck = checkLoginAttempts(clientIP);
    if (attemptCheck.blocked) {
      return res.status(429).json({
        success: false,
        message: `Too many failed login attempts. Try again in ${attemptCheck.remainingTime} seconds.`
      });
    }

    // 🔍 ML Anomaly Detection Check
    const anomalyResult = await checkAnomaly(req.body);
    if (anomalyResult.is_anomaly) {
      console.log(`🚨 Anomaly detected in patient login: confidence ${anomalyResult.confidence}`);
      // Record failed attempt with high ML confidence
      recordFailedLogin(clientIP, anomalyResult.confidence);
      return res.redirect(302, "/blocked");
    }

    const { email, password } = req.body;

    const userEmail = email?.trim();
    const userPassword = password;

    // ✅ Validation
    if (!userEmail || !userPassword) {
      return res.status(400).json({
        success: false,
        message: "Please enter email and password"
      });
    }

    // ✅ Check user in DB
    const result = await pool.query(
      "SELECT * FROM patientslogin WHERE email = $1",
      [userEmail]
    );

    if (result.rows.length === 0) {
      // User not found - record failed attempt
      recordFailedLogin(clientIP, anomalyResult.confidence || 0.1);
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const user = result.rows[0];

    // ✅ Compare password
    const isMatch = await bcrypt.compare(userPassword, user.password);

    if (!isMatch) {
      // Invalid password - record failed attempt
      recordFailedLogin(clientIP, anomalyResult.confidence || 0.2);
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
    }

    // ✅ Successful login - reset attempt counter
    loginAttempts.delete(clientIP);

    // ✅ Store user info in session
    req.session.patient = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name || "",
      email: user.email
    };

    // ✅ Return success with session data
    return res.json({
      success: true,
      message: "Login successful",
      user: req.session.patient
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
app.get("/api/patient/appointment/:regno", async (req, res) => {


  try {
    let { regno } = req.params;

    // ✅ CLEAN INPUT (VERY IMPORTANT)
    regno = regno.trim().toUpperCase();



    if (!regno) {
      return res.status(400).json({
        success: false,
        message: "Registration number required"
      });
    }

    // ✅ CASE-INSENSITIVE SEARCH (BEST FIX)
    const result = await pool.query(
      `SELECT regno, first_name, last_name, age, gender, email,
              department, date, time, phone, address
       FROM patients
       WHERE UPPER(regno) = $1`,
      [regno]
    );



    if (result.rows.length === 0) {
      return res.json({
        success: false,
        message: "No appointment found"
      });
    }

    return res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {
    console.error("❌ Search Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// ---------------- GET patient profile ----------------
app.get("/api/patient/profile/:email?", async (req, res) => {
  try {
    let userEmail;

    // ✅ 1. PRIORITY: session (most secure)
    if (req.session && req.session.patient?.email) {
      userEmail = req.session.patient.email;
    }

    // ✅ 2. OPTIONAL: param email (only if session not available)
    else if (req.params.email) {
      userEmail = req.params.email.trim();
    }

    // ❌ No session & no email
    else {
      return res.status(401).json({
        success: false,
        user: null,
        message: "Not logged in"
      });
    }

    // ✅ Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return res.status(400).json({
        success: false,
        user: null,
        message: "Invalid email format"
      });
    }

    // ✅ Query database
    const result = await pool.query(
      "SELECT first_name, last_name, email FROM patientslogin WHERE email = $1",
      [userEmail]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        user: null,
        message: "Profile not found"
      });
    }

    // ✅ Success (IMPORTANT: use 'user')
    return res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (err) {
    console.error("❌ Profile Fetch Error:", err);
    return res.status(500).json({
      success: false,
      user: null,
      message: "Internal server error"
    });
  }
});
// ---------------- SESSION CHECK ----------------
app.get("/api/patient/session", (req, res) => {
  try {
    if (req.session && req.session.patient) {
      return res.json({
        success: true,
        user: req.session.patient
      });
    } else {
      return res.json({
        success: false,
        user: null
      });
    }
  } catch (err) {
    console.error("❌ Session Error:", err);
    return res.status(500).json({
      success: false,
      user: null
    });
  }
});

// ---------------- LOGOUT ----------------
app.post("/api/patient/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ success: false });
    }

    res.clearCookie("hospital_sid"); // important
    return res.json({ success: true });
  });
});

// GET appointments by date + department (from patients table)
app.get("/api/appointments", async (req, res) => {
  try {
    const { date, department } = req.query;

    // Validate inputs
    if (!date || !department) {
      return res.status(400).json({ success: false, message: "Date and department required" });
    }

    const result = await pool.query(
      `SELECT 
        regno,
        first_name ,
        age,
        gender,
        date,
        time,
        department
       FROM patients
       WHERE date = $1 
       AND department = $2
       ORDER BY time`,
      [date, department]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Appointments Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
; app.get("/api/lab/tests", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT DISTINCT test_name AS name FROM lab_tests ORDER BY name"
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error("Lab tests error:", err);
    res.status(500).json({ success: false });
  }
});
// ================= SAVE PRESCRIPTION =================
app.post("/api/prescriptions", async (req, res) => {
  try {
    const { regno, medicines, notes } = req.body;

    if (!regno || !medicines || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing data"
      });
    }

    // ✅ VALIDATE DATA
    const cleaned = medicines.map(m => ({
      name: m.name,
      days: Number(m.days) || 0,
      timing: {
        morning: m.timing?.morning || false,
        noon: m.timing?.noon || false,
        night: m.timing?.night || false
      }
    }));

    await pool.query(
      `INSERT INTO prescriptions (regno, medicines, notes)
       VALUES ($1, $2, $3)`,
      [regno, JSON.stringify(cleaned), notes || ""]
    );

    res.json({
      success: true,
      message: "Prescription saved"
    });

  } catch (err) {
    console.error("Prescription error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
// GET previous prescriptions for a patient
app.get("/api/prescriptions/:regno", async (req, res) => {
  try {
    const { regno } = req.params;

    if (!regno) {
      return res.status(400).json({ success: false, message: "Patient regno required" });
    }

    const result = await pool.query(
      `SELECT medicines, notes, created_at
       FROM prescriptions
       WHERE regno = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [regno]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const lastPrescription = result.rows[0];
    res.json({ success: true, data: lastPrescription });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch previous prescriptions" });
  }
});
// =======================================================
// ================= LAB TESTS ============================
// =======================================================

// 🔹 GET TEST NAMES (for dropdown)
app.get("/api/lab/tests", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT test_name AS name
      FROM lab_tests
      WHERE test_name IS NOT NULL
      ORDER BY test_name ASC
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error("Lab tests error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch lab tests"
    });
  }
});


// 🔹 SAVE LAB REQUEST (FROM DOCTOR)
app.post("/api/lab/requests", async (req, res) => {
  try {
    const { regno, tests } = req.body;

    if (!regno || !tests || tests.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing data"
      });
    }

    for (let t of tests) {
      await pool.query(
        `INSERT INTO lab_tests 
         (regno, test_name, status, created_at)
         VALUES ($1, $2, 'pending', NOW())`,
        [regno, t.name]
      );
    }

    res.json({
      success: true,
      message: "Lab tests saved"
    });

  } catch (err) {
    console.error("Save lab error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to save lab tests"
    });
  }
});


// 🔹 GET REPORTS (DOCTOR VIEW)
app.get("/api/reports/:regno", async (req, res) => {
  try {
    const { regno } = req.params;

    const result = await pool.query(`
      SELECT 
        id,
        test_name AS name,
        result,
        status,
        created_at AS date
      FROM lab_tests
      WHERE regno = $1
      ORDER BY created_at DESC
    `, [regno]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error("Reports error:", err);
    res.status(500).json({
      success: false
    });
  }
});


// 🔹 LAB SIDE - VIEW PATIENT TEST REQUESTS
app.get("/api/lab/requests/:regno", async (req, res) => {
  try {
    const { regno } = req.params;

    const result = await pool.query(`
      SELECT id, test_name, status
      FROM lab_tests
      WHERE regno = $1
    `, [regno]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});


// 🔹 COMPLETE TEST + ADD RESULT
app.put("/api/lab/complete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { result } = req.body;

    await pool.query(`
      UPDATE lab_tests
      SET status = 'completed',
          result = $1,
          completed_at = NOW()
      WHERE id = $2
    `, [result, id]);

    res.json({
      success: true,
      message: "Test completed"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});


// ================= ADMIT TO WARD =================
app.post("/api/admit", async (req, res) => {
  try {
    const { regno, name, age, gender, department, medicine, notes } = req.body;

    if (!regno || !name || !age || !gender || !department) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Convert medicine array to JSON string
    const medsJSON = medicine && medicine.length ? JSON.stringify(medicine) : null;

    const result = await pool.query(
      `INSERT INTO ward_admissions 
       (regno, name, age, gender, department, medicines, notes, admitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [regno, name, age, gender, department, medsJSON, notes]
    );

    res.json({ success: true, message: "Patient admitted to ward", data: result.rows[0] });
  } catch (err) {
    console.error("Admit Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
app.get("/api/admitted", async (req, res) => {
  try {
    const { active } = req.query; // true | false | undefined

    let query = `
      SELECT 
        id,
        regno,
        name,
        age,
        gender,
        department,
        ward_no,
        medicines,
        notes,
        admitted_at,
        discharged_at
      FROM ward_admissions
    `;

    /* ================= FILTER ================= */

    if (active === "true") {
      // ✅ Only currently admitted
      query += ` WHERE discharged_at IS NULL`;
    } else if (active === "false") {
      // ✅ Only discharged patients
      query += ` WHERE discharged_at IS NOT NULL`;
    }
    // if undefined → show all

    query += ` ORDER BY admitted_at DESC`;

    const result = await pool.query(query);

    /* ================= FORMAT DATA ================= */

    const data = result.rows.map((row) => {
      let parsedMeds = [];

      try {
        if (!row.medicines) {
          parsedMeds = [];
        } else if (typeof row.medicines === "object") {
          // Already JSON (Postgres JSON/JSONB)
          parsedMeds = row.medicines;
        } else if (typeof row.medicines === "string") {
          // Parse string safely
          parsedMeds = JSON.parse(row.medicines);
        }
      } catch (err) {
        console.warn("⚠️ Medicine parse error ID:", row.id);
        parsedMeds = [];
      }

      return {
        id: row.id,
        regno: row.regno,
        name: row.name || "Unknown",
        age: row.age,
        gender: row.gender,
        department: row.department,
        ward_no: row.ward_no ?? "Not Assigned", // ✅ better fallback
        notes: row.notes ?? "",
        admitted_at: row.admitted_at,
        discharged_at: row.discharged_at,
        isActive: !row.discharged_at, // ✅ useful for frontend
        medicines: parsedMeds,
      };
    });
    /* ================= RESPONSE ================= */

    res.json({
      success: true,
      count: data.length,
      data,
    });

  } catch (err) {
    console.error("❌ Fetch Admitted Error:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }


});
app.put("/api/discharge/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE ward_admissions
       SET discharged_at = NOW()
       WHERE id = $1`,
      [id]
    );

    res.json({ success: true, message: "Patient discharged" });
  } catch (err) {
    console.error("Discharge Error:", err);
    res.status(500).json({ success: false });
  }
});
app.put("/api/update-ward/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ward_no } = req.body;

    await pool.query(
      `UPDATE ward_admissions SET ward_no = $1 WHERE id = $2`,
      [ward_no, id]
    );

    res.json({ success: true, message: "Ward updated" });
  } catch (err) {
    console.error("Update Ward Error:", err);
    res.status(500).json({ success: false });
  }
});
app.get("/api/lab/pending", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM lab_tests WHERE result IS NULL"
  );
  res.json({ data: result.rows });
});

app.get("/api/lab/results", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM lab_tests WHERE result IS NOT NULL"
  );
  res.json({ data: result.rows });
});
const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* ✅ CREATE UPLOAD FOLDER */
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

/* ✅ STORAGE CONFIG */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

/* ✅ FILE FILTER (OPTIONAL BUT GOOD) */
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/* ✅ UPLOAD API */
app.put("/api/lab/upload/:id", upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    /* ✅ STORE FILE PATH (BETTER THAN JUST NAME) */
    const filePath = `/uploads/${req.file.filename}`;

    /* ✅ UPDATE DATABASE */
    const result = await pool.query(
      `UPDATE lab_tests
       SET result = $1,
           status = 'completed',
           completed_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [filePath, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    res.json({
      success: true,
      message: "File uploaded & test completed",
      data: result.rows[0],
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Upload failed",
    });
  }
});
app.get("/api/prescriptions", async (req, res) => {
  try {

    const result = await pool.query(`
   SELECT *
   FROM (
      SELECT DISTINCT ON (regno)
        id,
        regno,
        medicines,
        notes,
        created_at
      FROM prescriptions
      ORDER BY regno, created_at DESC
   ) latest_rx
   ORDER BY created_at DESC
 `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// -----------------------------
// Start server
// -----------------------------
const PORT = process.env.PORT || 5000;
// -----------------------------
// Start server
// -----------------------------
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
