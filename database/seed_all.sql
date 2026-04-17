-- ============================================================
-- KIU SCMS — Full Demo Seed Data
-- Roles: HOD | Lecturer | Student (+ 1 SuperAdmin)
-- Demo password for ALL accounts: Admin@123
-- Hash: $2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW
-- ============================================================

USE scms_db;

-- ---------------------------------------------------------------
-- Ensure roles, faculties, departments exist (idempotent)
-- ---------------------------------------------------------------
INSERT IGNORE INTO roles (name) VALUES ('SuperAdmin'), ('HOD'), ('Lecturer'), ('Student');

INSERT IGNORE INTO faculties (id, name) VALUES
    (1, 'SONAS'),
    (2, 'SOMAC'),
    (3, 'Education');

INSERT IGNORE INTO departments (id, faculty_id, name) VALUES
    (1, 1, 'Department of Environmental Management'),
    (2, 1, 'Department of Wildlife Management & Conservation'),
    (3, 1, 'Department of Chemistry'),
    (4, 2, 'Department of Computer Science'),
    (5, 2, 'Department of Data Science and Analytics'),
    (6, 2, 'Department of Information Technology'),
    (7, 3, 'Department of Primary Education'),
    (8, 3, 'Department of Secondary Education'),
    (9, 3, 'Department of Early Childhood Education');

-- ---------------------------------------------------------------
-- SuperAdmin (hidden; not part of academic role model)
-- Login: superadmin@kiu.ac.ug / Admin@123
-- ---------------------------------------------------------------
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (1,
    (SELECT id FROM roles WHERE name = 'SuperAdmin'),
    'Super', 'Admin',
    'superadmin@kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW',
    TRUE);

-- ---------------------------------------------------------------
-- HODs — one per department (9 total)
-- ---------------------------------------------------------------

-- SONAS — Environmental Management (dept 1)
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (2, (SELECT id FROM roles WHERE name = 'HOD'),
    'Grace', 'Namukasa', 'hod.envmgt@kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (2, 'HOD/SONAS/001', 1, (SELECT id FROM roles WHERE name = 'HOD'));

-- SONAS — Wildlife Management (dept 2)
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (3, (SELECT id FROM roles WHERE name = 'HOD'),
    'Robert', 'Kizito', 'hod.wildlife@kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (3, 'HOD/SONAS/002', 2, (SELECT id FROM roles WHERE name = 'HOD'));

-- SONAS — Chemistry (dept 3)
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (4, (SELECT id FROM roles WHERE name = 'HOD'),
    'Amina', 'Ssali', 'hod.chemistry@kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (4, 'HOD/SONAS/003', 3, (SELECT id FROM roles WHERE name = 'HOD'));

-- SOMAC — Computer Science (dept 4)
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (5, (SELECT id FROM roles WHERE name = 'HOD'),
    'Patrick', 'Ouma', 'hod.cs@kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (5, 'HOD/SOMAC/001', 4, (SELECT id FROM roles WHERE name = 'HOD'));

-- SOMAC — Data Science and Analytics (dept 5)
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (6, (SELECT id FROM roles WHERE name = 'HOD'),
    'Florence', 'Nakato', 'hod.ds@kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (6, 'HOD/SOMAC/002', 5, (SELECT id FROM roles WHERE name = 'HOD'));

-- SOMAC — Information Technology (dept 6)
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (7, (SELECT id FROM roles WHERE name = 'HOD'),
    'James', 'Ssekandi', 'hod.it@kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (7, 'HOD/SOMAC/003', 6, (SELECT id FROM roles WHERE name = 'HOD'));

-- Education — Primary Education (dept 7)
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (8, (SELECT id FROM roles WHERE name = 'HOD'),
    'Mary', 'Auma', 'hod.primaryed@kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (8, 'HOD/EDU/001', 7, (SELECT id FROM roles WHERE name = 'HOD'));

-- Education — Secondary Education (dept 8)
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (9, (SELECT id FROM roles WHERE name = 'HOD'),
    'David', 'Mutegeki', 'hod.seconded@kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (9, 'HOD/EDU/002', 8, (SELECT id FROM roles WHERE name = 'HOD'));

-- Education — Early Childhood Education (dept 9)
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (10, (SELECT id FROM roles WHERE name = 'HOD'),
    'Sarah', 'Nabirye', 'hod.earlychild@kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (10, 'HOD/EDU/003', 9, (SELECT id FROM roles WHERE name = 'HOD'));

-- ---------------------------------------------------------------
-- Lecturers — one per department (9 total)
-- ---------------------------------------------------------------

-- SONAS — Environmental Management (dept 1)
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (11, (SELECT id FROM roles WHERE name = 'Lecturer'),
    'Joseph', 'Tumwesigye', 'lec.envmgt@kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (11, 'LEC/SONAS/001', 1, (SELECT id FROM roles WHERE name = 'Lecturer'));

-- SONAS — Wildlife Management (dept 2)
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (12, (SELECT id FROM roles WHERE name = 'Lecturer'),
    'Christine', 'Aheebwa', 'lec.wildlife@kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (12, 'LEC/SONAS/002', 2, (SELECT id FROM roles WHERE name = 'Lecturer'));

-- SONAS — Chemistry (dept 3)
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (13, (SELECT id FROM roles WHERE name = 'Lecturer'),
    'Brian', 'Obua', 'lec.chemistry@kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (13, 'LEC/SONAS/003', 3, (SELECT id FROM roles WHERE name = 'Lecturer'));

-- SOMAC — Computer Science (dept 4)
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (14, (SELECT id FROM roles WHERE name = 'Lecturer'),
    'Esther', 'Namutebi', 'lec.cs@kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (14, 'LEC/SOMAC/001', 4, (SELECT id FROM roles WHERE name = 'Lecturer'));

-- SOMAC — Data Science and Analytics (dept 5)
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (15, (SELECT id FROM roles WHERE name = 'Lecturer'),
    'Hassan', 'Wakiso', 'lec.ds@kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (15, 'LEC/SOMAC/002', 5, (SELECT id FROM roles WHERE name = 'Lecturer'));

-- SOMAC — Information Technology (dept 6)
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (16, (SELECT id FROM roles WHERE name = 'Lecturer'),
    'Alice', 'Kagere', 'lec.it@kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (16, 'LEC/SOMAC/003', 6, (SELECT id FROM roles WHERE name = 'Lecturer'));

-- Education — Primary Education (dept 7)
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (17, (SELECT id FROM roles WHERE name = 'Lecturer'),
    'Peter', 'Muwonge', 'lec.primaryed@kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (17, 'LEC/EDU/001', 7, (SELECT id FROM roles WHERE name = 'Lecturer'));

-- Education — Secondary Education (dept 8)
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (18, (SELECT id FROM roles WHERE name = 'Lecturer'),
    'Ruth', 'Nalwoga', 'lec.seconded@kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (18, 'LEC/EDU/002', 8, (SELECT id FROM roles WHERE name = 'Lecturer'));

-- Education — Early Childhood Education (dept 9)
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (19, (SELECT id FROM roles WHERE name = 'Lecturer'),
    'Isaac', 'Kato', 'lec.earlychild@kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id)
VALUES (19, 'LEC/EDU/003', 9, (SELECT id FROM roles WHERE name = 'Lecturer'));

-- ---------------------------------------------------------------
-- Students — spread across multiple departments
-- ---------------------------------------------------------------

-- CS dept (4): Enoch Michah
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (20, (SELECT id FROM roles WHERE name = 'Student'),
    'Enoch', 'Michah', 'student.cs1@student.kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO students (user_id, student_number, department_id)
VALUES (20, '2026/KIU/CS/001', 4);

-- CS dept (4): Zainab Nalule
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (21, (SELECT id FROM roles WHERE name = 'Student'),
    'Zainab', 'Nalule', 'student.cs2@student.kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO students (user_id, student_number, department_id)
VALUES (21, '2026/KIU/CS/002', 4);

-- IT dept (6): Daniel Ssewanyana
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (22, (SELECT id FROM roles WHERE name = 'Student'),
    'Daniel', 'Ssewanyana', 'student.it1@student.kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO students (user_id, student_number, department_id)
VALUES (22, '2026/KIU/IT/001', 6);

-- Environmental Management dept (1): Faith Nakabuye
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (23, (SELECT id FROM roles WHERE name = 'Student'),
    'Faith', 'Nakabuye', 'student.env1@student.kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO students (user_id, student_number, department_id)
VALUES (23, '2026/KIU/ENV/001', 1);

-- Data Science dept (5): Aisha Nambi
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (24, (SELECT id FROM roles WHERE name = 'Student'),
    'Aisha', 'Nambi', 'student.ds1@student.kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO students (user_id, student_number, department_id)
VALUES (24, '2026/KIU/DS/001', 5);

-- Primary Education dept (7): Michael Okello
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (25, (SELECT id FROM roles WHERE name = 'Student'),
    'Michael', 'Okello', 'student.ped1@student.kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO students (user_id, student_number, department_id)
VALUES (25, '2026/KIU/PED/001', 7);

-- Secondary Education dept (8): Lydia Atuhaire
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (26, (SELECT id FROM roles WHERE name = 'Student'),
    'Lydia', 'Atuhaire', 'student.sed1@student.kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO students (user_id, student_number, department_id)
VALUES (26, '2026/KIU/SED/001', 8);

-- Wildlife Management dept (2): Kevin Bagonza
INSERT IGNORE INTO users (id, role_id, first_name, last_name, email, password_hash, is_active)
VALUES (27, (SELECT id FROM roles WHERE name = 'Student'),
    'Kevin', 'Bagonza', 'student.wld1@student.kiu.ac.ug',
    '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW', TRUE);
INSERT IGNORE INTO students (user_id, student_number, department_id)
VALUES (27, '2026/KIU/WLD/001', 2);
