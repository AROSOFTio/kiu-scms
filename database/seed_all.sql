-- SCMS User Seeding Script
-- Default Password for all accounts: Admin@123

USE scms_db;

-- 1. Ensure Faculties, Departments, and Roles exist
INSERT IGNORE INTO roles (name) VALUES ('Admin'), ('Staff'), ('Student'), ('Department Officer');
INSERT IGNORE INTO faculties (id, name) VALUES (1, 'Faculty of Computing and Informatics');
INSERT IGNORE INTO departments (id, faculty_id, name) VALUES (1, 1, 'Computer Science');

-- 2. Clean up existing test users if they exist
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM users WHERE email IN ('admin@kiu.ac.ug', 'officer@kiu.ac.ug', 'staff@kiu.ac.ug', 'student@kiu.ac.ug');
SET FOREIGN_KEY_CHECKS = 1;

-- 3. Insert Admin
INSERT INTO users (role_id, first_name, last_name, email, password_hash) 
VALUES (
    (SELECT id FROM roles WHERE name = 'Admin'), 
    'HOD', '', 'admin@kiu.ac.ug', 
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW'
);

-- 4. Insert Department Officer (Computer Science)
INSERT INTO users (role_id, first_name, last_name, email, password_hash) 
VALUES (
    (SELECT id FROM roles WHERE name = 'Department Officer'), 
    'John', 'Officer', 'officer@kiu.ac.ug', 
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW'
);
INSERT INTO staff (user_id, staff_number, department_id, role_id)
VALUES (
    LAST_INSERT_ID(), 'OFF-001', 1, (SELECT id FROM roles WHERE name = 'Department Officer')
);

-- 5. Insert Regular Staff (Computer Science)
INSERT INTO users (role_id, first_name, last_name, email, password_hash) 
VALUES (
    (SELECT id FROM roles WHERE name = 'Staff'), 
    'Sarah', 'Staff', 'staff@kiu.ac.ug', 
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW'
);
INSERT INTO staff (user_id, staff_number, department_id, role_id)
VALUES (
    LAST_INSERT_ID(), 'STF-001', 1, (SELECT id FROM roles WHERE name = 'Staff')
);

-- 6. Insert Test Student
INSERT INTO users (role_id, first_name, last_name, email, password_hash) 
VALUES (
    (SELECT id FROM roles WHERE name = 'Student'), 
    'Enoch', 'Student', 'student@kiu.ac.ug', 
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW'
);
INSERT INTO students (user_id, student_number, department_id)
VALUES (
    LAST_INSERT_ID(), '2026/KIU/001', 1
);
