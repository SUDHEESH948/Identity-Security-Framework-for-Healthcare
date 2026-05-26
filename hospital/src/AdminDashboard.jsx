import React, { useState, useEffect } from "react";
import axios from "axios";
import Webcam from "react-webcam";

import {
  Container,
  Typography,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert,
  Chip,
} from "@mui/material";

import {
  Delete,
  Edit,
  Person,
  Email,
  LocalHospital,
  Healing,
  Science,
  People,
  Visibility,
  VisibilityOff
} from "@mui/icons-material";

import "./AdminDashboard.css";
import TimePicker from "./TimePicker";

const API_URL = "http://localhost:5000/api/employees";

function AdminDashboard() {

  const formatTime12Hour = (time24) => {
    if (!time24) return "";
    const [hour, minute] = time24.split(':');
    const h = parseInt(hour);
    const ap = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${minute} ${ap}`;
  };

  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    id: null,
    empID: "",
    name: "",
    email: "",
    role: "",
    department: "",
    startTime: "",
    endTime: "",
    permissions: { read: false, write: false, modify: false },
    image: null, // New field for image
  });

  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Track row-wise password visibility
  const [passwordVisible, setPasswordVisible] = useState({});

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    if (["read", "write", "modify"].includes(name)) {
      setForm(prev => ({
        ...prev,
        permissions: { ...prev.permissions, [name]: checked }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setForm({
      id: null,
      empID: "",
      name: "",
      email: "",
      role: "",
      department: "",
      startTime: "",
      endTime: "",
      permissions: { read: false, write: false, modify: false },
      image: null, // New field for image
    });
    setGeneratedPassword("");
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(API_URL);
      setEmployees(Array.isArray(res.data) ? res.data : res.data.employees || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setEmployees([]);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!form.name || !form.email || !form.role || !form.startTime || !form.endTime) {
      setSnackbar({
        open: true,
        message: "Missing required fields: name, email, role, startTime, endTime",
        severity: "error"
      });
      return;
    }

    // If there's an image, use FormData; otherwise send JSON
    const isUploadingImage = form.image !== null && form.image !== undefined;
    let config = {};
    let data;

    if (isUploadingImage) {
      // Use FormData for file uploads
      data = new FormData();
      Object.keys(form).forEach((key) => {
        if (key !== "image") {
          data.append(key, form[key]);
        }
      });
      if (form.image) {
        data.append("image", form.image);
      }
      config.headers = { "Content-Type": "multipart/form-data" };
    } else {
      // Send JSON for regular updates
      data = {
        empID: form.empID,
        name: form.name,
        email: form.email,
        role: form.role,
        department: form.department,
        startTime: form.startTime,
        endTime: form.endTime,
        permissions: form.permissions,
      };
      config.headers = { "Content-Type": "application/json" };
    }

    try {
      if (form.id) {
        await axios.put(`${API_URL}/${form.id}`, data, config);
        setSnackbar({ open: true, message: "Employee updated successfully", severity: "success" });
      } else {
        await axios.post(API_URL, data, config);
        setSnackbar({ open: true, message: "Employee added successfully", severity: "success" });
      }
      fetchEmployees();
      resetForm();
    } catch (err) {
      console.error("Error saving employee:", err);
      const errorMsg = err.response?.data?.message || "Error saving employee";
      setSnackbar({ open: true, message: errorMsg, severity: "error" });
    }
  };

  const handleEdit = (emp) => {
    setForm({
      id: emp.id,
      empID: emp.empID || emp.empid || "",
      name: emp.name || "",
      email: emp.email || "",
      role: emp.role || "",
      department: emp.department || "",
      startTime: emp.startTime || emp.starttime || "",
      endTime: emp.endTime || emp.endtime || "",
      permissions: emp.permissions || { read: false, write: false, modify: false },
      image: emp.image || null, // New field for image
    });
    setGeneratedPassword("");
  };

  const handleRemove = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setSnackbar({ open: true, message: "Employee deleted", severity: "success" });
      fetchEmployees();
    } catch (err) { console.error("Delete error:", err); }
  };

  const totals = {
    Doctor: employees.filter(e => e.role === "Doctor").length,
    Nurse: employees.filter(e => e.role === "Nurse").length,
    Staff: employees.filter(e => e.role === "Staff").length,
    Lab: employees.filter(e => e.role === "Lab").length
  };

  const roleIcons = {
    Doctor: <Healing sx={{ color: "#d32f2f" }} />,
    Nurse: <LocalHospital sx={{ color: "#1976d2" }} />,
    Staff: <People sx={{ color: "#f57c00" }} />,
    Lab: <Science sx={{ color: "#388e3c" }} />
  };

  const [images, setImages] = useState({
    front: null,
    left: null,
    right: null,
  });

  const [cameraOpen, setCameraOpen] = useState(false);
  const [currentAngle, setCurrentAngle] = useState("front");
  const webcamRef = React.useRef(null);

  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImages((prev) => ({ ...prev, [currentAngle]: imageSrc }));
    setCameraOpen(false);
  };

  const handleImageUpload = (e, angle) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => ({ ...prev, [angle]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="admin-dashboard">
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ mb: 3 }}>Hospital Admin Dashboard</Typography>

        {/* Role Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {["Doctor", "Nurse", "Staff", "Lab"].map(role => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={role}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{role}s</Typography>
                  <Typography variant="h4">{totals[role]} {roleIcons[role]}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>


        {/* Employee Form */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "15px" }}>
            <TextField label="Name" name="name" value={form.name} onChange={handleChange} required
              InputProps={{ startAdornment: (<InputAdornment position="start"><Person /></InputAdornment>) }} />
            <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required
              InputProps={{ startAdornment: (<InputAdornment position="start"><Email /></InputAdornment>) }} />
            <FormControl fullWidth>
              <InputLabel id="role-select-label">Role</InputLabel>
              <Select
                labelId="role-select-label"
                id="role-select"
                name="role"
                value={form.role}
                onChange={handleChange}
                label="Role"
                required
                MenuProps={{
                  anchorOrigin: { vertical: "bottom", horizontal: "left" },
                  transformOrigin: { vertical: "top", horizontal: "left" }
                }}
              >
                <MenuItem value="" disabled>
                  Select role
                </MenuItem>
                <MenuItem value="Doctor">Doctor</MenuItem>
                <MenuItem value="Nurse">Nurse</MenuItem>
                <MenuItem value="Staff">Staff</MenuItem>
                <MenuItem value="Lab">Lab</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="department-select-label">Department</InputLabel>
              <Select
                labelId="department-select-label"
                id="department-select"
                name="department"
                value={form.department}
                onChange={handleChange}
                label="Department"
                required
                MenuProps={{
                  anchorOrigin: { vertical: "bottom", horizontal: "left" },
                  transformOrigin: { vertical: "top", horizontal: "left" }
                }}
              >
                <MenuItem value="" disabled>
                  Select department
                </MenuItem>
                <MenuItem value="Cardiology">Cardiology</MenuItem>
                <MenuItem value="Neurology">Neurology</MenuItem>
                <MenuItem value="Orthopedics">Orthopedics</MenuItem>
                <MenuItem value="Emergency">Emergency</MenuItem>
                <MenuItem value="Radiology">Radiology</MenuItem>
                <MenuItem value="Laboratory">Laboratory</MenuItem>
                <MenuItem value="Administration">Administration</MenuItem>
              </Select>
            </FormControl>

            {generatedPassword && (
              <TextField
                label="Generated Password"
                value={showGeneratedPassword ? generatedPassword : "••••••••"}
                type={showGeneratedPassword ? "text" : "password"}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowGeneratedPassword(p => !p)} edge="end" title={showGeneratedPassword ? "Hide" : "Show"}>
                        {showGeneratedPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                      <IconButton onClick={() => navigator.clipboard.writeText(generatedPassword)} edge="end" title="Copy password">
                        <Email />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                helperText="Password has been auto-generated and stored securely"
              />
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: 500 }}>Start Time</label>
              <TimePicker value={form.startTime} onChange={(v) => setForm(prev => ({ ...prev, startTime: v }))} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: 500 }}>End Time</label>
              <TimePicker value={form.endTime} onChange={(v) => setForm(prev => ({ ...prev, endTime: v }))} />
            </div>

            <FormGroup row className="permissions-group">
              {["read", "write", "modify"].map(p => (
                <FormControlLabel
                  key={p}
                  control={<Checkbox checked={form.permissions[p]} onChange={handleChange} name={p} />}
                  label={p.charAt(0).toUpperCase() + p.slice(1)}
                />
              ))}
            </FormGroup>            <div style={{ fontSize: 13, color: '#555' }}>
              Read = access patient/report details • Write = add or save new records • Modify = edit or update existing records
            </div>
            <Button type="submit" variant="contained">{form.id ? "Update Employee" : "Add Employee"}</Button>
          </form>
        </Paper>



        {/* Employee Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Emp ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>End</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">No Employees</TableCell>
                </TableRow>
              ) : employees.map(emp => (
                <TableRow key={emp.id}>
                  <TableCell>{emp.empID}</TableCell>
                  <TableCell>{emp.name}</TableCell>
                  <TableCell>{emp.email}</TableCell>
                  <TableCell>
                    {roleIcons[emp.role] || null} {emp.role}
                  </TableCell>
                  <TableCell>{emp.department}</TableCell>
                  <TableCell>{formatTime12Hour(emp.startTime)}</TableCell>
                  <TableCell>{formatTime12Hour(emp.endTime)}</TableCell>
                  <TableCell>
                    {emp.permissions.read && <Chip label="Read" color="primary" size="small" />}
                    {emp.permissions.write && <Chip label="Write" color="success" size="small" />}
                    {emp.permissions.modify && <Chip label="Modify" color="warning" size="small" />}
                  </TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleEdit(emp)}><Edit /></IconButton>
                    <IconButton color="error" onClick={() => handleRemove(emp.id)}><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </Container>
    </div>
  );
}

export default AdminDashboard;