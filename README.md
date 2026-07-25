# 🔐 Identity Security Framework for Healthcare
A Secure Healthcare Identity Management System with AI-Based Threat Detection and Role-Based Access Control.

This project is designed to protect patient and employee identities by providing secure authentication, access control, activity monitoring, and AI-powered security analysis. The system combines Full Stack technologies with Machine Learning to detect suspicious activities and prevent unauthorized access to healthcare information.


## 🚀 Tech Stack

| Category | Technologies |
|----------|--------------|
| Frontend | React.js, Tailwind CSS |
| Backend | Node.js, Express.js |
| AI/ML Processing | Flask, Python, Machine Learning Models |
<img width="1185" height="380" alt="image" src="https://github.com/user-attachments/assets/7355767c-b218-48d0-bb4c-53fec67f4ae6" />
<img width="560" height="387" alt="image" src="https://github.com/user-attachments/assets/a7bfb6f0-b41c-4132-9dcb-7ac93f253154" />
<img width="556" height="255" alt="image" src="https://github.com/user-attachments/assets/7aa9888e-5285-49ff-9237-a14cd3e4d762" />

## 📄 Pages & Features
### 👨‍💼 Admin Management Page

The Admin Management Page provides complete control over employee identity and access management. Administrators can add, edit, and manage employee profiles, assign roles, update departments, and configure access permissions.

The admin can also set access time restrictions by defining start and end times for each employee, ensuring that users can access the system only during authorized periods.

#### Features:
- Add and manage employee details
- Edit employee roles and departments
- Assign and modify access permissions
- Control employee access duration using start and end times
- Manage role-based access control (RBAC)
- Monitor and update employee privileges

#### Employee Access Details:

| Emp ID | Name | Email | Role | Department | Start Time | End Time | Permissions |
|--------|------|-------|------|------------|------------|----------|-------------|
| D82864 | Sudheesh KS | kssudheesh818@gmail.com | Doctor | Cardiology | 12:06 AM | 12:21 PM | Read, Write, Modify |

This module improves healthcare security by limiting unauthorized access and ensuring that employees only access resources according to their assigned permissions.

<img width="1212" height="1021" alt="image" src="https://github.com/user-attachments/assets/a25cf14e-d635-4d95-b21d-1d7b44a847ce" />

### 📧 Email Verification & Secure Account Activation

The Email Verification module provides a secure onboarding process when an admin creates a new employee account. After adding an employee, the system automatically generates a unique Employee ID and a temporary One-Time Password (OTP) and sends them to the registered email address.

A secure verification link is also sent to the employee's email. The link has an expiration time of **5 minutes** to prevent unauthorized access and improve account security.

#### Features:
- Admin creates employee accounts
- Automatic generation of Employee ID and temporary password
- Secure email notification system
- Time-limited verification link (expires after 10 minutes)
- First-time login verification
- Mandatory password modification after initial login
- Prevents unauthorized account activation

#### Workflow:
1. Admin adds a new employee with role, department, and permissions.
2. System generates Employee ID and temporary password.
3. Verification link and login credentials are sent to the employee's registered email.
4. Employee verifies the account within 10 minutes.
5. Employee logs in using the temporary password.
6. System forces the employee to create a new secure password.
7. Employee gains access based on assigned permissions and access time limits.

This module enhances healthcare security by ensuring verified user onboarding and preventing unauthorized account access.

<img width="932" height="983" alt="WhatsApp Image 2026-07-26 at 12 17 13 AM" src="https://github.com/user-attachments/assets/673b4040-e52f-4955-b7a5-26c4a844df6e" />

### 🧑‍⚕️ Patient Management Page

The Patient Management Page provides a secure platform for patients to register, log in, manage their profiles, and access healthcare services. Patients can create an account, update their personal information, book appointments, and receive email notifications for important activities.

#### Features:
- Patient registration and secure login
- Profile creation and management
- Update personal and contact information
- Appointment booking system
- Email notifications for appointment confirmations and updates
- Secure storage of patient healthcare information
- Role-based access and authentication

#### Workflow:
1. Patient creates an account through the registration page.
2. System verifies patient details and securely stores the information.
3. Patient logs in using authenticated credentials.
4. Patient manages profile information and updates details when required.
5. Patient books appointments with available healthcare providers.
6. Confirmation emails are sent for appointment details.
7. Patient can view and manage healthcare-related information securely.

This module improves patient experience by providing secure access to healthcare services while maintaining privacy and protecting sensitive medical data.
<img width="742" height="807" alt="image" src="https://github.com/user-attachments/assets/0d81039d-8f13-41e8-b0bc-de73080af56f" />
<img width="752" height="787" alt="image" src="https://github.com/user-attachments/assets/40c4baae-58d0-4970-b457-1b604435311e" />
<img width="998" height="1376" alt="image" src="https://github.com/user-attachments/assets/b5904eb0-25cc-4ae8-a130-f53b44f4e848" />
<img width="898" height="1058" alt="image" src="https://github.com/user-attachments/assets/decc133b-b4c1-4728-88ad-44aa99a6fed1" />
<img width="1027" height="1392" alt="image" src="https://github.com/user-attachments/assets/918ad23d-0776-49cd-8c61-4cbd971dc701" />
### 👨‍⚕️ Doctor Management Page

The Doctor Management Page provides a secure healthcare workspace where doctors can access patient information and manage medical activities based on their assigned working hours and permissions. Doctors can log in only during their authorized working time to ensure secure access control.

#### Features:
- Secure doctor login with working hour restrictions
- View assigned appointments
- Access patient medical history
- View laboratory test reports
- Add medicines and prescriptions
- Refer patients to hospital wards
- Manage patient treatment details
- Secure access based on role and permissions

#### Workflow:
1. Doctor logs in using verified credentials.
2. System checks the doctor's assigned working hours and permissions.
3. Doctor can view scheduled patient appointments.
4. Doctor accesses patient history and previous medical records.
5. Doctor reviews laboratory test reports.
6. Doctor adds medicines and prescriptions based on diagnosis.
7. Doctor can refer patients to suitable wards for further treatment.
8. All activities are securely recorded for monitoring and auditing.

This module ensures secure doctor access, improves healthcare workflow efficiency, and protects sensitive patient information through role-based access control.
<img width="1031" height="1342" alt="image" src="https://github.com/user-attachments/assets/0860ecc0-04c4-42b9-ad9b-cc7253a66b1b" />
<img width="827" height="856" alt="image" src="https://github.com/user-attachments/assets/97abd5e3-312f-4ade-9b78-565aaf04685b" />
<img width="822" height="619" alt="image" src="https://github.com/user-attachments/assets/6f616302-ff26-4363-b5a6-641af80cf3e2" />
### 👩‍⚕️ Nurse Management Page

The Nurse Management Page provides a secure healthcare workspace for nurses to manage patient care activities. Nurses can access the system using verified credentials, and access is controlled based on assigned working hours and permissions.

#### Features:
- Secure nurse login with verified credentials
- Working hour and permission-based access control
- View assigned patient appointments and schedules
- Medicine reminders and medication tracking
- Add patient health records such as:
  - Blood pressure
  - Sugar level
  - Temperature
  - Other vital health information
- View patient medical records and history
- Update patient care details
- Maintain accurate and secure healthcare records

#### Workflow:
1. Nurse logs in using verified credentials.
2. System validates the nurse's assigned working hours and permissions.
3. Nurse views scheduled patient appointments and assigned patients.
4. Nurse receives medicine reminders and updates medication status.
5. Nurse records patient health information such as blood pressure, sugar levels, and other vital signs.
6. Nurse can view previous patient records and medical history.
7. All updates are securely stored and tracked for healthcare monitoring.

This module improves nursing workflow efficiency by enabling secure patient care management while maintaining data privacy and access control.
<img width="875" height="1197" alt="image" src="https://github.com/user-attachments/assets/f4fa39ec-c8f9-4136-97d8-50dcd8dc5f5d" />
### 🧪 Laboratory Management Page

The Laboratory Management Page provides a secure platform for laboratory staff to manage patient test information. Lab technicians can access assigned test requests, upload medical reports, and update test statuses while maintaining secure healthcare data management.

#### Features:
- Secure laboratory staff login
- View assigned patient test requests
- Upload laboratory test results and reports
- Update test status (Pending, Processing, Completed)
- Manage patient test information
- Maintain secure medical records
- Provide updated reports to doctors and patients

#### Workflow:
1. Lab technician logs in using verified credentials.
2. System checks assigned permissions and access control.
3. Lab staff views pending patient test requests.
4. Technician performs tests and uploads the results.
5. Test status is updated based on progress.
<img width="838" height="1152" alt="image" src="https://github.com/user-attachments/assets/6b9082a7-e0c0-457c-997d-dc6a8f1827ad" />


This module improves laboratory workflow efficiency by providing secure test management, real-time status updates, and controlled access to medical reports.
### 🔐 Security & AI Threat Detection Page

The Security Module provides an intelligent security layer for the healthcare system by combining Machine Learning-based anomaly detection with rule-based security mechanisms. It analyzes user login behavior, detects suspicious activities, and prevents unauthorized access in real time.

### 🤖 Machine Learning & AI Features

The system analyzes multiple security parameters to identify abnormal user behavior:

- Login time analysis
- Login day analysis
- Input length analysis
- Character distribution analysis
- Entropy (randomness) calculation
- Bot detection
- IP behavior analysis
- User activity tracking
- Failed login attempt monitoring

### 🛠️ Technology Implementation

#### 1. Python
- Main programming language.
- Used for data processing, feature extraction, ML model development, and API creation.

#### 2. Flask
- Backend framework for ML services.
- Provides REST APIs:
  - `/api/ml/check_anomaly` → Detects suspicious activities.
  - `/api/ml/train` → Trains the machine learning model.

#### 3. Machine Learning (Scikit-learn)
- Uses the **Isolation Forest Algorithm**.
- Detects abnormal user behavior without requiring labeled attack data.

#### 4. NumPy
- Performs mathematical operations.
- Used for feature arrays, statistical calculations, mean, and variance analysis.

#### 5. Pandas
- Processes and manages training datasets.
- Reads CSV files and prepares data for ML models.

#### 6. StandardScaler
- Normalizes security features before ML prediction.
- Improves model accuracy and performance.

#### 7. Joblib
- Saves and loads trained ML models.
- Stores models as `.pkl` files for future predictions.

#### 8. Rule-Based Security Engine
Detects known security attacks using predefined patterns:
- SQL Injection
- Cross-Site Scripting (XSS)
- Path Traversal
- Command Injection

#### 9. Feature Engineering
Converts user behavior data into security features:

- Login time
- Input length
- Entropy value
- IP activity
- Failed attempts
- Face descriptor values
- User behavior patterns

#### 10. JSON API Communication
- Transfers anomaly detection results between frontend, backend, and ML services.

---

### 🚨 Login Attempt Tracking & ML-Based Blocking

The authentication security system monitors login attempts and applies adaptive blocking based on user risk level.

#### Features:
- Tracks failed login attempts using IP address
- Monitors suspicious login patterns
- Calculates ML risk scores
- Automatically blocks high-risk users
- Prevents brute-force attacks

### 🔒 Automatic Blocking Logic

| ML Risk Score | Security Action |
|---------------|----------------|
| > 0.7 | Block after 2 failed attempts for 60 minutes |
| > 0.5 | Block after 3 failed attempts for 30 minutes |
| > 0.3 | Block after 4 failed attempts for 15 minutes |
| Normal Risk | Block after 5 failed attempts for 15 minutes |

### Overall Security Approach

This project implements a **Hybrid Cybersecurity System** by combining:

- Flask-based AI/ML services
- Machine Learning anomaly detection
- Rule-based attack detection
- Login behavior monitoring
- Real-time threat prevention

The system provides adaptive authentication security and protects healthcare data from unauthorized access and cyber threats.
<img width="635" height="756" alt="image" src="https://github.com/user-attachments/assets/aaaef674-92d7-417a-b632-6d2f01a41bec" />
<img width="923" height="982" alt="image" src="https://github.com/user-attachments/assets/317e7557-ed0c-4f30-a471-651de719dc5c" />

# 🗄️ Database Details

## PostgreSQL Database Management System

The **Identity Security Framework for Healthcare** uses **PostgreSQL** as the primary database management system for securely storing, managing, and retrieving healthcare-related information.

PostgreSQL is an open-source relational database management system that provides high reliability, strong security, data integrity, scalability, and efficient handling of structured healthcare data.

## Database Responsibilities

The PostgreSQL database manages:

- 🔐 User authentication details
  - Login credentials
  - Role information
  - Access permissions

- 👨‍💼 Employee Information
  - Employee ID
  - Name
  - Email
  - Role
  - Department
  - Working hours
  - Access permissions

- 🧑‍⚕️ Patient Records
  - Patient profile details
  - Personal information
  - Medical history
  - Health records

- 📅 Appointment Details
  - Patient appointments
  - Doctor assignments
  - Appointment status
  - Scheduling information

- 🧪 Medical Reports
  - Laboratory test details
  - Test results
  - Report status

- 💊 Prescriptions
  - Doctor prescriptions
  - Medicine details
  - Dosage information






PostgreSQL ensures secure and reliable storage of sensitive healthcare information while supporting the application's authentication, authorization, and AI-based security monitoring features.
