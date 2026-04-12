import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// @desc    Login a user
export const loginUser = async (req: Request, res: Response) => {
  const { identifier, password, role, facultyId } = req.body;

  try {
    const [users]: any = await db.query(
      `SELECT users.*, roles.name as role_name 
       FROM users 
       JOIN roles ON users.role_id = roles.id 
       WHERE email = ? OR users.id IN (SELECT user_id FROM students WHERE student_number = ?)`,
      [identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    // Role Validation (if provided)
    if (role && user.role_name !== role) {
      // Allow 'Department Officer' to login as 'Staff' or 'Admin' as special cases if needed, 
      // but generally we expect a match or a compatible role.
      if (!(user.role_name === 'Department Officer' && role === 'Staff')) {
         return res.status(401).json({ status: 'error', message: `Unauthorized: You are registered as ${user.role_name}, not ${role}` });
      }
    }

    // Faculty/College Validation (if provided and user is not Admin)
    if (facultyId && user.role_name !== 'Admin') {
        let userFacultyId = null;
        if (user.role_name === 'Student') {
            const [student]: any = await db.query('SELECT d.faculty_id FROM students s JOIN departments d ON s.department_id = d.id WHERE s.user_id = ?', [user.id]);
            if (student.length > 0) userFacultyId = student[0].faculty_id;
        } else {
            const [staff]: any = await db.query('SELECT d.faculty_id FROM staff s JOIN departments d ON s.department_id = d.id WHERE s.user_id = ?', [user.id]);
            if (staff.length > 0) userFacultyId = staff[0].faculty_id;
        }

        if (userFacultyId && userFacultyId.toString() !== facultyId.toString()) {
            return res.status(401).json({ status: 'error', message: 'Incorrect College/School selected for this account' });
        }
    }

    if (!user.is_active) {
      return res.status(401).json({ status: 'error', message: 'Account is deactivated' });
    }

    const token = jwt.sign({ userId: user.id, roleId: user.role_id }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      status: 'success',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role_name
      }
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Register a new student
export const registerStudent = async (req: Request, res: Response) => {
  const { firstName, lastName, email, studentNumber, departmentId, password } = req.body;
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // 1. Verify role exists
    const [roles]: any = await connection.query(`SELECT id FROM roles WHERE name = 'Student'`);
    if (roles.length === 0) throw new Error("Student role not found in database");
    const studentRoleId = roles[0].id;

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Insert User
    const [userResult]: any = await connection.query(
      `INSERT INTO users (role_id, first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?, ?)`,
      [studentRoleId, firstName, lastName, email, passwordHash]
    );
    const newUserId = userResult.insertId;

    // 4. Insert Student details
    await connection.query(
      `INSERT INTO students (user_id, student_number, department_id) VALUES (?, ?, ?)`,
      [newUserId, studentNumber, departmentId]
    );

    await connection.commit();

    const token = jwt.sign({ userId: newUserId, roleId: studentRoleId }, JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      token,
      user: {
        id: newUserId,
        email,
        firstName,
        lastName,
        role: 'Student'
      }
    });

  } catch (err: any) {
    await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ status: 'error', message: 'Email or Student Number already exists.' });
    }
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    connection.release();
  }
};

// @desc    Get current user session
export const getCurrentUser = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  
  try {
    const [users]: any = await db.query(
      `SELECT users.id, users.email, users.first_name, users.last_name, roles.name as role_name 
       FROM users 
       JOIN roles ON users.role_id = roles.id 
       WHERE users.id = ?`,
      [userId]
    );

    if (users.length === 0) return res.status(404).json({ status: 'error', message: 'User not found' });

    res.json({
      status: 'success',
      user: {
        id: users[0].id,
        email: users[0].email,
        firstName: users[0].first_name,
        lastName: users[0].last_name,
        role: users[0].role_name
      }
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Forgot Password (Stub)
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  console.log(`[EMAIL BYPASS][AUTH] Forgot Password requested for: ${email}. Generated reset link internally.`);
  res.json({ status: 'success', message: 'If an account exists, a reset link has been generated.' });
};

// @desc    Reset Password (Stub)
export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  console.log(`[AUTH] Reset Password processed successfully for token: ${token}`);
  res.json({ status: 'success', message: 'Password has been updated locally.' });
};

// @desc    Get public departments for registration
export const getPublicDepartments = async (req: Request, res: Response) => {
  try {
    const [departments]: any = await db.query(
      `SELECT d.id, d.name, f.name as faculty_name 
       FROM departments d 
       JOIN faculties f ON d.faculty_id = f.id 
       ORDER BY f.name, d.name`
    );
    res.json({ status: 'success', data: departments });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
// @desc    Get public faculties/colleges for login/registration
export const getPublicFaculties = async (req: Request, res: Response) => {
  try {
    const [faculties]: any = await db.query(
      `SELECT id, name FROM faculties ORDER BY name`
    );
    res.json({ status: 'success', data: faculties });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
