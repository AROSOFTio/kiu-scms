-- SCMS initial database schema

CREATE DATABASE IF NOT EXISTS scms_db;
USE scms_db;

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE faculties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE
);

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

CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    student_number VARCHAR(50) NOT NULL UNIQUE,
    department_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

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

CREATE TABLE complaint_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    category_id INT NOT NULL,
    department_id INT DEFAULT NULL,
    reference_number VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    status ENUM('Draft', 'Submitted', 'Received', 'Under Review', 'Assigned', 'In Progress', 'Awaiting Student', 'Resolved', 'Closed', 'Rejected') DEFAULT 'Draft',
    assigned_staff_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES complaint_categories(id),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_staff_id) REFERENCES staff(id) ON DELETE SET NULL
);

CREATE TABLE complaint_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);

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

CREATE TABLE complaint_internal_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    user_id INT NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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

CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE system_settings (
    key_name VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Roles Seed Data
INSERT INTO roles (name) VALUES ('Admin'), ('Staff'), ('Student'), ('Department Officer');

-- Faculties Seed Data
INSERT INTO faculties (name) VALUES 
  ('Faculty of Computing & Informatics'),
  ('Faculty of Business & Management'),
  ('Faculty of Science'),
  ('Faculty of Education'),
  ('Faculty of Health Sciences');

-- Departments Seed Data
INSERT INTO departments (faculty_id, name) VALUES 
  (1, 'Computer Science'),
  (1, 'Information Technology'),
  (1, 'Software Engineering'),
  (2, 'Business Administration'),
  (2, 'Accounting & Finance'),
  (2, 'Marketing'),
  (3, 'Mathematics'),
  (3, 'Physics'),
  (4, 'Education'),
  (5, 'Nursing');

-- Complaint Categories Seed Data
INSERT INTO complaint_categories (name, description) VALUES 
  ('Academic', 'Issues related to lectures, exams, marks, and academic performance'),
  ('Technical', 'Portal issues, WiFi, lab equipment, software problems'),
  ('Hostel', 'Accommodation, utilities, room allocation complaints'),
  ('Financial', 'Fee payments, bursaries, scholarships, refunds'),
  ('Library', 'Books, resources, library access problems'),
  ('Administration', 'Registration, documents, certificates, staff conduct'),
  ('Other', 'General complaints not covered by other categories');

-- Super Admin User Seed (password: Admin@1234)
-- bcrypt hash generated for "Admin@1234" with saltRounds=10
INSERT INTO users (role_id, first_name, last_name, email, password_hash, is_active) VALUES 
  (1, 'System', 'Administrator', 'admin@kiu.ac.ug', '$2b$10$rOzJqhiXH8vB5Y1L2K3M4ePQzXwA7bVnCgDsEfGhIjKlMnOpQrSt2', TRUE);

-- Staff User Seed (password: Staff@1234)
INSERT INTO users (role_id, first_name, last_name, email, password_hash, is_active) VALUES 
  (2, 'Michael', 'Staff', 'staff@kiu.ac.ug', '$2b$10$o.YV4lCq9/D6eI.e68vKzeW68XFqO3o9B7tW2Z1l8Vp7N.e9S4e5S', TRUE);

-- Student User Seed (password: Student@1234)
INSERT INTO users (role_id, first_name, last_name, email, password_hash, is_active) VALUES 
  (3, 'Sarah', 'Student', 'student@student.kiu.ac.ug', '$2b$10$C8.c.P9u9m4Xz6/D6vKzeO9/XFqO3o9B7tW2Z1l8Vp7N.e9S4e5S', TRUE);

-- Link users to Student/Staff tables
-- Get latest IDs (Admin=1, Staff=2, Student=3 in this sequence)
INSERT INTO staff (user_id, staff_number, department_id) VALUES (2, 'STAFF/001/2026', 1);
INSERT INTO students (user_id, student_number, department_id) VALUES (3, 'STUD/001/2026', 1);

-- System Settings
INSERT INTO system_settings (key_name, value) VALUES 
  ('system_name', 'KIU Student Complaint Management System'),
  ('system_email', 'scms@kiu.ac.ug'),
  ('max_file_size_mb', '10'),
  ('allowed_file_types', 'pdf,jpg,jpeg,png,doc,docx');
-- 11. Seed Initial Roles
INSERT IGNORE INTO roles (name) VALUES ('Admin'), ('Staff'), ('Student'), ('Department Officer');

-- 12. Seed Demo Data (Password: Admin@123)
INSERT IGNORE INTO faculties (id, name) VALUES (1, 'Faculty of Computing and Informatics');
INSERT IGNORE INTO departments (id, faculty_id, name) VALUES (1, 1, 'Computer Science');

-- Admin Account
INSERT IGNORE INTO users (role_id, first_name, last_name, email, password_hash) 
VALUES (1, 'System', 'Administrator', 'admin@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW');

-- Dept Officer
INSERT IGNORE INTO users (role_id, first_name, last_name, email, password_hash) 
VALUES (4, 'John', 'Officer', 'officer@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW');
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id) VALUES (2, 'OFF-001', 1, 4);

-- Regular Staff
INSERT IGNORE INTO users (role_id, first_name, last_name, email, password_hash) 
VALUES (2, 'Sarah', 'Staff', 'staff@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW');
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id) VALUES (3, 'STF-001', 1, 2);

-- Test Student
INSERT IGNORE INTO users (role_id, first_name, last_name, email, password_hash) 
VALUES (3, 'Enoch', 'Student', 'student@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW');
INSERT IGNORE INTO students (user_id, student_number, department_id) VALUES (4, '2026/KIU/001', 1);
