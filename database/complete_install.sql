-- ============================================================
-- KIU Student Complaint Management System â€” Database Schema
-- Roles: SuperAdmin | HOD | Lecturer | Student
-- Faculties: SONAS | SOMAC | Education
-- ============================================================

-- Removed hardcoded USE statement for aaPanel compatibility

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------
-- 0. Clean Slate (Drop all tables if they exist)
-- ---------------------------------------------------------------
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS hod_availability;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS complaint_internal_notes;
DROP TABLE IF EXISTS complaint_status_history;
DROP TABLE IF EXISTS complaint_attachments;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS complaint_categories;
DROP TABLE IF EXISTS staff;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS faculties;
DROP TABLE IF EXISTS roles;

-- ---------------------------------------------------------------
-- 1. Roles
-- ---------------------------------------------------------------
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------
-- 2. Faculties
-- ---------------------------------------------------------------
CREATE TABLE faculties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------
-- 3. Departments
-- ---------------------------------------------------------------
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 4. Users
-- ---------------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- ---------------------------------------------------------------
-- 5. Students (one department per student)
-- ---------------------------------------------------------------
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    student_number VARCHAR(50) NOT NULL UNIQUE,
    department_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- ---------------------------------------------------------------
-- 6. Staff (HODs and Lecturers â€” one department per person)
-- role_id mirrors users.role_id for quick querying
-- ---------------------------------------------------------------
CREATE TABLE staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    staff_number VARCHAR(50) NOT NULL UNIQUE,
    department_id INT NOT NULL,
    role_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- ---------------------------------------------------------------
-- 7. Complaint Categories
-- ---------------------------------------------------------------
CREATE TABLE complaint_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------
-- 8. Complaints (Extended for proper lifecycle tracking)
-- ---------------------------------------------------------------
CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    category_id INT NOT NULL,
    department_id INT DEFAULT NULL,
    reference_number VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    -- Complaint Channel: how the complaint was submitted
    complaint_channel ENUM(
        'Portal Submission',
        'In Person',
        'Email',
        'Phone Call',
        'Referral from Lecturer',
        'Referral from HOD'
    ) DEFAULT 'Portal Submission',
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    status ENUM(
        'Draft',
        'Submitted',
        'Received by HOD',
        'Assigned to Lecturer',
        'In Progress',
        'Awaiting Student',
        'Resolved',
        'Closed',
        'Rejected'
    ) DEFAULT 'Draft',
    -- Routing metadata
    assigned_staff_id INT DEFAULT NULL,           -- staff.id of assigned Lecturer
    assigned_by_user_id INT DEFAULT NULL,         -- users.id of HOD who assigned
    resolved_by_user_id INT DEFAULT NULL,         -- users.id who marked resolved
    received_by_hod_at TIMESTAMP NULL,            -- when HOD first received it
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES complaint_categories(id),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_staff_id) REFERENCES staff(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------
-- 9. Complaint Attachments
-- ---------------------------------------------------------------
CREATE TABLE complaint_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 10. Complaint Status History (full lifecycle trail)
-- ---------------------------------------------------------------
CREATE TABLE complaint_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    changed_by_user_id INT NOT NULL,
    remarks TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
);

-- ---------------------------------------------------------------
-- 11. Complaint Internal Notes
-- ---------------------------------------------------------------
CREATE TABLE complaint_internal_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    user_id INT NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ---------------------------------------------------------------
-- 12. Notifications
-- ---------------------------------------------------------------
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 13. Feedback
-- ---------------------------------------------------------------
CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL UNIQUE,
    student_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 14. Audit Logs
-- ---------------------------------------------------------------
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ---------------------------------------------------------------
-- 15. System Settings
-- ---------------------------------------------------------------
CREATE TABLE system_settings (
    key_name VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------
-- 16. HOD Availability (appointment calendar)
-- ---------------------------------------------------------------
CREATE TABLE hod_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hod_id INT NOT NULL,
    available_date DATE NOT NULL,
    start_time TIME DEFAULT '09:00:00',
    end_time TIME DEFAULT '17:00:00',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_hod_date (hod_id, available_date),
    FOREIGN KEY (hod_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 17. Appointments
-- ---------------------------------------------------------------
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    hod_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (hod_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===============================================================
-- SEED DATA
-- ===============================================================

-- 1. Roles
INSERT INTO roles (name) VALUES
    ('SuperAdmin'),
    ('HOD'),
    ('Lecturer'),
    ('Student'),
    ('Registrar'),
    ('Vice Chancellor'),
    ('Quality Assurance'),
    ('PRO');

-- 2. Faculties
INSERT INTO faculties (id, name) VALUES
    (1, 'Faculty of Computing & Informatics'),
    (2, 'Faculty of Business');

-- 3. Departments
INSERT INTO departments (id, faculty_id, name) VALUES
    (1, 1, 'Computer Science'),
    (2, 1, 'Information Technology'),
    (3, 1, 'Software Engineering'),
    (4, 1, 'Data Science'),
    (5, 2, 'Business Admin');

-- 4. Complaint Categories
INSERT INTO complaint_categories (name, description) VALUES
    ('Academic',        'Issues related to lectures, exams, marks, and academic performance'),
    ('Technical',       'Portal issues, WiFi, lab equipment, software problems'),
    ('Hostel',          'Accommodation, utilities, room allocation complaints'),
    ('Financial',       'Fee payments, bursaries, scholarships, refunds'),
    ('Library',         'Books, resources, library access problems'),
    ('Administration',  'Registration, documents, certificates, staff conduct'),
    ('Other',           'General complaints not covered by other categories');

-- 5. System Settings
INSERT INTO system_settings (key_name, value) VALUES
    ('system_name',          'KIU Student Complaint Management System'),
    ('system_email',         'scms@kiu.ac.ug'),
    ('max_file_size_mb',     '10'),
    ('allowed_file_types',   'pdf,jpg,jpeg,png,doc,docx');

-- Removed Initial Admin as per Top Management wipe request.
-- ============================================================
-- KIU SCMS â€” Full Demo Seed Data (Synchronized with seed.ts)
-- Demo password for ALL accounts: Admin@123
-- Hash: $2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW
-- ============================================================

-- Removed hardcoded USE statement for aaPanel compatibility


-- 1. Roles
INSERT INTO roles (name) VALUES 
('SuperAdmin'), ('HOD'), ('Lecturer'), ('Student'), 
('Registrar'), ('Vice Chancellor'), ('Quality Assurance'), ('PRO');

-- 2. Faculties
INSERT INTO faculties (id, name) VALUES 
(1, 'Faculty of Computing & Informatics'), 
(2, 'Faculty of Business');

-- 3. Departments
INSERT INTO departments (id, faculty_id, name) VALUES 
(1, 1, 'Computer Science'),
(2, 1, 'Information Technology'),
(3, 1, 'Software Engineering'),
(4, 1, 'Data Science'),
(5, 2, 'Business Admin');

-- 4. Demo Users (Password: Admin@123)
-- All demo accounts here use Admin@123 hash for static SQL consistency.
-- The node seeder (npm run seed) will generate the full 40+ user spread.

-- HODs
INSERT INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (1, (SELECT id FROM roles WHERE name='HOD'), 'Fred', 'Bwire', 'fbwire.hod@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1);
INSERT INTO staff (user_id, staff_number, department_id, role_id) VALUES (1, 'STF/2026/0001', 1, (SELECT id FROM roles WHERE name='HOD'));

-- Lecturers
INSERT INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (2, (SELECT id FROM roles WHERE name='Lecturer'), 'Apio', 'Presiline', 'apio.presiline@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1);
INSERT INTO staff (user_id, staff_number, department_id, role_id) VALUES (2, 'STF/2026/0002', 2, (SELECT id FROM roles WHERE name='Lecturer'));

INSERT INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (3, (SELECT id FROM roles WHERE name='Lecturer'), 'Sentongo', 'Sayid', 'ssayid@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1);
INSERT INTO staff (user_id, staff_number, department_id, role_id) VALUES (3, 'STF/2026/0003', 5, (SELECT id FROM roles WHERE name='Lecturer'));

-- Students
INSERT INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (4, (SELECT id FROM roles WHERE name='Student'), 'Enoch', 'Micah', 'enoch.micah@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1);
INSERT INTO students (user_id, student_number, department_id) VALUES (4, '2026/KIU/C001', 1);

SET FOREIGN_KEY_CHECKS = 1;
