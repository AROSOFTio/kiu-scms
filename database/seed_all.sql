-- SCMS User Seeding Script
-- Default Password for all accounts: Admin@123

USE scms_db;

-- 1. Ensure Faculties, Departments, and Roles exist
INSERT IGNORE INTO roles (name) VALUES ('Admin'), ('Staff'), ('Student'), ('Department Officer');
INSERT IGNORE INTO faculties (id, name) VALUES 
(1, 'Faculty of Computing and Informatics'),
(2, 'Faculty of Business and Management'),
(3, 'Faculty of Law'),
(4, 'Faculty of Medicine');

INSERT IGNORE INTO departments (id, faculty_id, name) VALUES 
(1, 1, 'Computer Science'),
(2, 2, 'Accounting and Finance'),
(3, 3, 'Law and Jurisprudence'),
(4, 4, 'Clinical Medicine');

-- 2. Clean up existing test users if they exist
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM users WHERE email IN (
    'admin@kiu.ac.ug', 'officer@kiu.ac.ug', 'staff@kiu.ac.ug', 'student@kiu.ac.ug',
    'hod.business@kiu.ac.ug', 'hod.law@kiu.ac.ug', 'hod.medicine@kiu.ac.ug',
    'staff.business@kiu.ac.ug', 'staff.law@kiu.ac.ug', 'staff.medicine@kiu.ac.ug'
);
SET FOREIGN_KEY_CHECKS = 1;

-- 3. Insert HODs (Admin Role)
-- Global Admin/Main HOD
INSERT INTO users (role_id, first_name, last_name, email, password_hash) 
VALUES (
    (SELECT id FROM roles WHERE name = 'Admin'), 
    'HOD', '', 'admin@kiu.ac.ug', 
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW'
);

-- Business HOD
INSERT INTO users (role_id, first_name, last_name, email, password_hash) 
VALUES (
    (SELECT id FROM roles WHERE name = 'Admin'), 
    'HOD', 'Business', 'hod.business@kiu.ac.ug', 
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW'
);

-- Law HOD
INSERT INTO users (role_id, first_name, last_name, email, password_hash) 
VALUES (
    (SELECT id FROM roles WHERE name = 'Admin'), 
    'HOD', 'Law', 'hod.law@kiu.ac.ug', 
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW'
);

-- Medicine HOD
INSERT INTO users (role_id, first_name, last_name, email, password_hash) 
VALUES (
    (SELECT id FROM roles WHERE name = 'Admin'), 
    'HOD', 'Medicine', 'hod.medicine@kiu.ac.ug', 
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW'
);

-- 4. Insert Staff for different departments
-- Computer Science Staff
INSERT INTO users (role_id, first_name, last_name, email, password_hash) 
VALUES (
    (SELECT id FROM roles WHERE name = 'Staff'), 
    'Sarah', 'Staff', 'staff@kiu.ac.ug', 
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW'
);
INSERT INTO staff (user_id, staff_number, department_id, role_id)
VALUES (LAST_INSERT_ID(), 'STF-001', 1, (SELECT id FROM roles WHERE name = 'Staff'));

-- Business Staff
INSERT INTO users (role_id, first_name, last_name, email, password_hash) 
VALUES (
    (SELECT id FROM roles WHERE name = 'Staff'), 
    'James', 'Business', 'staff.business@kiu.ac.ug', 
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW'
);
INSERT INTO staff (user_id, staff_number, department_id, role_id)
VALUES (LAST_INSERT_ID(), 'STF-002', 2, (SELECT id FROM roles WHERE name = 'Staff'));

-- Law Staff
INSERT INTO users (role_id, first_name, last_name, email, password_hash) 
VALUES (
    (SELECT id FROM roles WHERE name = 'Staff'), 
    'Linda', 'Law', 'staff.law@kiu.ac.ug', 
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW'
);
INSERT INTO staff (user_id, staff_number, department_id, role_id)
VALUES (LAST_INSERT_ID(), 'STF-003', 3, (SELECT id FROM roles WHERE name = 'Staff'));

-- Medicine Staff
INSERT INTO users (role_id, first_name, last_name, email, password_hash) 
VALUES (
    (SELECT id FROM roles WHERE name = 'Staff'), 
    'Robert', 'Medicine', 'staff.medicine@kiu.ac.ug', 
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW'
);
INSERT INTO staff (user_id, staff_number, department_id, role_id)
VALUES (LAST_INSERT_ID(), 'STF-004', 4, (SELECT id FROM roles WHERE name = 'Staff'));

-- 5. Insert Test Student
INSERT INTO users (role_id, first_name, last_name, email, password_hash) 
VALUES (
    (SELECT id FROM roles WHERE name = 'Student'), 
    'Enoch', 'Student', 'student@kiu.ac.ug', 
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW'
);
INSERT INTO students (user_id, student_number, department_id)
VALUES (LAST_INSERT_ID(), '2026/KIU/001', 1);
