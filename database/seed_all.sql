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

-- 2. HODs (Admin Role) - Linked to departments via staff table
-- Computer Science HOD
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash) 
VALUES (1, (SELECT id FROM roles WHERE name = 'Admin'), 'HOD', 'Computing', 'admin@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW');
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (1, 'HOD-001', 1, (SELECT id FROM roles WHERE name = 'Admin'));

-- Business HOD
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash) 
VALUES (2, (SELECT id FROM roles WHERE name = 'Admin'), 'HOD', 'Business', 'hod.business@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW');
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (2, 'HOD-002', 2, (SELECT id FROM roles WHERE name = 'Admin'));

-- Law HOD
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash) 
VALUES (3, (SELECT id FROM roles WHERE name = 'Admin'), 'HOD', 'Law', 'hod.law@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW');
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (3, 'HOD-003', 3, (SELECT id FROM roles WHERE name = 'Admin'));

-- Medicine HOD
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash) 
VALUES (4, (SELECT id FROM roles WHERE name = 'Admin'), 'HOD', 'Medicine', 'hod.medicine@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW');
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (4, 'HOD-004', 4, (SELECT id FROM roles WHERE name = 'Admin'));

-- 3. Regular Staff
-- Computer Science Staff
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash) 
VALUES (5, (SELECT id FROM roles WHERE name = 'Staff'), 'Sarah', 'Staff', 'staff@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW');
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (5, 'STF-001', 1, (SELECT id FROM roles WHERE name = 'Staff'));

-- Business Staff
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash) 
VALUES (6, (SELECT id FROM roles WHERE name = 'Staff'), 'James', 'Business', 'staff.business@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW');
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (6, 'STF-002', 2, (SELECT id FROM roles WHERE name = 'Staff'));

-- 4. Test Student
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash) 
VALUES (7, (SELECT id FROM roles WHERE name = 'Student'), 'Enoch', 'Student', 'student@kiu.ac.ug', '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW');
INSERT IGNORE INTO students (user_id, student_number, department_id)
VALUES (7, '2026/KIU/001', 1);
