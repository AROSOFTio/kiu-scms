-- ============================================================
-- KIU Student Complaint Management System - Database Schema
-- Roles: HOD | Lecturer | Student
-- Faculties: Faculty of Computing & Informatics | Faculty of Business
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
-- 6. Staff (HODs and Lecturers - one department per person)
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
-- END OF SCHEMA
-- ===============================================================
-- ============================================================
-- KIU SCMS - Full Demo Seed Data (Synchronized with seed.ts)
-- Demo password for ALL accounts: Admin@123
-- Hash: $2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW
-- ============================================================

-- Removed hardcoded USE statement for aaPanel compatibility


-- 1. Roles
INSERT INTO roles (id, name) VALUES
(1, 'HOD'),
(2, 'Lecturer'),
(3, 'Student');

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

-- 6. Demo Users (Password: Admin@123)
-- All demo accounts here use Admin@123 hash for static SQL consistency.
-- Distribution:
--   1 HOD per department = 5 HODs
--   5 Lecturers per department = 25 Lecturers
--   5 Students per department = 25 Students
--   Total demo users = 55

INSERT INTO users (id, role_id, first_name, last_name, email, password_hash, is_active) VALUES
(1, 1, 'Fred', 'Bwire', 'fbwire.hod@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(2, 2, 'Alice', 'Nanteza', 'lec1.computerscience@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(3, 2, 'Brian', 'Kato', 'lec2.computerscience@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(4, 2, 'Claire', 'Atwine', 'lec3.computerscience@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(5, 2, 'Daniel', 'Mugisha', 'lec4.computerscience@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(6, 2, 'Esther', 'Nankya', 'lec5.computerscience@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(7, 3, 'Enoch', 'Micah', 'enoch.micah@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(8, 3, 'Brian', 'Tumwesigye', 'std2.computerscience@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(9, 3, 'Carol', 'Namugerwa', 'std3.computerscience@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(10, 3, 'Diana', 'Akoth', 'std4.computerscience@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(11, 3, 'Ethan', 'Mugenyi', 'std5.computerscience@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(12, 1, 'Sarah', 'Namusoke', 'hod.informationtechnology@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(13, 2, 'Apio', 'Presiline', 'apio.presiline@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(14, 2, 'Denis', 'Ssemanda', 'lec2.informationtechnology@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(15, 2, 'Fiona', 'Nabirye', 'lec3.informationtechnology@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(16, 2, 'John', 'Mwesige', 'lec4.informationtechnology@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(17, 2, 'Lydia', 'Namata', 'lec5.informationtechnology@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(18, 3, 'Faith', 'Nalubega', 'std1.informationtechnology@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(19, 3, 'Henry', 'Ssembatya', 'std2.informationtechnology@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(20, 3, 'Irene', 'Namutebi', 'std3.informationtechnology@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(21, 3, 'Joel', 'Twinamatsiko', 'std4.informationtechnology@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(22, 3, 'Kevin', 'Ochan', 'std5.informationtechnology@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(23, 1, 'Isaac', 'Kato', 'hod.softwareengineering@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(24, 2, 'Mark', 'Turyasingura', 'lec1.softwareengineering@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(25, 2, 'Peace', 'Atuhaire', 'lec2.softwareengineering@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(26, 2, 'Ronald', 'Ssekandi', 'lec3.softwareengineering@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(27, 2, 'Sharon', 'Mirembe', 'lec4.softwareengineering@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(28, 2, 'Victor', 'Twinomujuni', 'lec5.softwareengineering@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(29, 3, 'Lillian', 'Auma', 'std1.softwareengineering@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(30, 3, 'Martin', 'Sserwanja', 'std2.softwareengineering@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(31, 3, 'Naomi', 'Kyomugisha', 'std3.softwareengineering@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(32, 3, 'Oscar', 'Muhwezi', 'std4.softwareengineering@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(33, 3, 'Patricia', 'Aciro', 'std5.softwareengineering@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(34, 1, 'Miriam', 'Ayo', 'hod.datascience@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(35, 2, 'Anna', 'Akello', 'lec1.datascience@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(36, 2, 'David', 'Otema', 'lec2.datascience@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(37, 2, 'Grace', 'Alupo', 'lec3.datascience@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(38, 2, 'Moses', 'Okello', 'lec4.datascience@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(39, 2, 'Ruth', 'Chebet', 'lec5.datascience@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(40, 3, 'Queen', 'Nakato', 'std1.datascience@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(41, 3, 'Richard', 'Okidi', 'std2.datascience@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(42, 3, 'Stella', 'Namirembe', 'std3.datascience@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(43, 3, 'Timothy', 'Opiro', 'std4.datascience@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(44, 3, 'Violet', 'Achieng', 'std5.datascience@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(45, 1, 'Brian', 'Ssenkaaba', 'hod.businessadmin@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(46, 2, 'Sentongo', 'Sayid', 'ssayid@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(47, 2, 'Brenda', 'Nakalema', 'lec2.businessadmin@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(48, 2, 'Charles', 'Byaruhanga', 'lec3.businessadmin@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(49, 2, 'Diana', 'Naigaga', 'lec4.businessadmin@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(50, 2, 'Peter', 'Walusimbi', 'lec5.businessadmin@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(51, 3, 'Winnie', 'Nantege', 'std1.businessadmin@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(52, 3, 'Xavier', 'Mugerwa', 'std2.businessadmin@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(53, 3, 'Yvonne', 'Atuhairwe', 'std3.businessadmin@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(54, 3, 'Zedekiah', 'Ssenyonjo', 'std4.businessadmin@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1),
(55, 3, 'Tracy', 'Namuli', 'std5.businessadmin@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', 1);

INSERT INTO staff (user_id, staff_number, department_id, role_id) VALUES
(1, 'STF/2026/0001', 1, 1),
(2, 'STF/2026/0002', 1, 2),
(3, 'STF/2026/0003', 1, 2),
(4, 'STF/2026/0004', 1, 2),
(5, 'STF/2026/0005', 1, 2),
(6, 'STF/2026/0006', 1, 2),
(12, 'STF/2026/0007', 2, 1),
(13, 'STF/2026/0008', 2, 2),
(14, 'STF/2026/0009', 2, 2),
(15, 'STF/2026/0010', 2, 2),
(16, 'STF/2026/0011', 2, 2),
(17, 'STF/2026/0012', 2, 2),
(23, 'STF/2026/0013', 3, 1),
(24, 'STF/2026/0014', 3, 2),
(25, 'STF/2026/0015', 3, 2),
(26, 'STF/2026/0016', 3, 2),
(27, 'STF/2026/0017', 3, 2),
(28, 'STF/2026/0018', 3, 2),
(34, 'STF/2026/0019', 4, 1),
(35, 'STF/2026/0020', 4, 2),
(36, 'STF/2026/0021', 4, 2),
(37, 'STF/2026/0022', 4, 2),
(38, 'STF/2026/0023', 4, 2),
(39, 'STF/2026/0024', 4, 2),
(45, 'STF/2026/0025', 5, 1),
(46, 'STF/2026/0026', 5, 2),
(47, 'STF/2026/0027', 5, 2),
(48, 'STF/2026/0028', 5, 2),
(49, 'STF/2026/0029', 5, 2),
(50, 'STF/2026/0030', 5, 2);

INSERT INTO students (user_id, student_number, department_id) VALUES
(7, '2026/KIU/CS001', 1),
(8, '2026/KIU/CS002', 1),
(9, '2026/KIU/CS003', 1),
(10, '2026/KIU/CS004', 1),
(11, '2026/KIU/CS005', 1),
(18, '2026/KIU/IT001', 2),
(19, '2026/KIU/IT002', 2),
(20, '2026/KIU/IT003', 2),
(21, '2026/KIU/IT004', 2),
(22, '2026/KIU/IT005', 2),
(29, '2026/KIU/SE001', 3),
(30, '2026/KIU/SE002', 3),
(31, '2026/KIU/SE003', 3),
(32, '2026/KIU/SE004', 3),
(33, '2026/KIU/SE005', 3),
(40, '2026/KIU/DS001', 4),
(41, '2026/KIU/DS002', 4),
(42, '2026/KIU/DS003', 4),
(43, '2026/KIU/DS004', 4),
(44, '2026/KIU/DS005', 4),
(51, '2026/KIU/BA001', 5),
(52, '2026/KIU/BA002', 5),
(53, '2026/KIU/BA003', 5),
(54, '2026/KIU/BA004', 5),
(55, '2026/KIU/BA005', 5);

SET FOREIGN_KEY_CHECKS = 1;
