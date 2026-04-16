-- KIU SCMS
-- Manual student profile linking helpers
--
-- A valid student account needs:
-- 1. users.role_id -> Student
-- 2. one matching students row where students.user_id = users.id
--
-- Without both records, the account can log in but cannot submit complaints.

-- 1. Find student-role users that are not linked yet
SELECT
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  r.name AS role_name,
  s.id AS student_profile_id,
  s.student_number,
  s.department_id
FROM users u
JOIN roles r ON r.id = u.role_id
LEFT JOIN students s ON s.user_id = u.id
WHERE r.name = 'Student'
ORDER BY u.id;

-- 2. Convert Enoch into a linked student account
-- Update the email / student number / department as needed.
START TRANSACTION;

SET @student_role_id := (SELECT id FROM roles WHERE name = 'Student' LIMIT 1);
SET @user_id := (SELECT id FROM users WHERE email = 'enoch@kiu.ac.ug' LIMIT 1);

UPDATE users
SET role_id = @student_role_id,
    first_name = 'Enoch',
    last_name = 'Student'
WHERE id = @user_id;

DELETE FROM staff WHERE user_id = @user_id;

INSERT INTO students (user_id, student_number, department_id)
VALUES (@user_id, '2026/KIU/002', 1)
ON DUPLICATE KEY UPDATE
  student_number = VALUES(student_number),
  department_id = VALUES(department_id);

COMMIT;

-- 3. Create a brand new student account manually
-- Demo password hash below corresponds to password: Admin@123
-- Replace names, email, student number, and department.
SET @student_role_id := (SELECT id FROM roles WHERE name = 'Student' LIMIT 1);

INSERT INTO users (role_id, first_name, last_name, email, password_hash, is_active)
VALUES (
  @student_role_id,
  'New',
  'Student',
  'newstudent@kiu.ac.ug',
  '$2b$12$gwzusvLSAEzNeF.lkW8uxe3Nsf7Z3FPNkpbQvPbVA7o1hCID/A5LW',
  1
);

SET @new_user_id := LAST_INSERT_ID();

INSERT INTO students (user_id, student_number, department_id)
VALUES (@new_user_id, '2026/KIU/010', 1);

-- 4. Verify student links after changes
SELECT
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  s.student_number,
  d.name AS department_name,
  f.name AS faculty_name
FROM users u
JOIN roles r ON r.id = u.role_id AND r.name = 'Student'
JOIN students s ON s.user_id = u.id
JOIN departments d ON d.id = s.department_id
JOIN faculties f ON f.id = d.faculty_id
ORDER BY u.id;
