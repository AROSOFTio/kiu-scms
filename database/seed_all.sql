-- ============================================================
-- KIU SCMS — Full Demo Seed Data (Synchronized with seed.ts)
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
