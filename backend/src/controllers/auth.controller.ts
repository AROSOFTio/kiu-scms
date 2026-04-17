import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// @desc    Login a user (single form — role detected automatically)
// @route   POST /api/v1/auth/login
export const loginUser = async (req: Request, res: Response) => {
  // Accept identifier only (email, student number, or staff number)
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ status: 'error', message: 'Identifier and password are required' });
  }

  try {
    const [users]: any = await db.query(
      `SELECT users.*, roles.name AS role_name
       FROM users
       JOIN roles ON users.role_id = roles.id
       WHERE users.email = ?
          OR users.id IN (SELECT user_id FROM students WHERE student_number = ?)
          OR users.id IN (SELECT user_id FROM staff    WHERE staff_number   = ?)`,
      [identifier, identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(401).json({ status: 'error', message: 'Account is deactivated. Contact your administrator.' });
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
        role: user.role_name,   // HOD | Lecturer | Student | SuperAdmin
      },
    });
  } catch (err: any) {
    if (['ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND'].includes(err.code)) {
      return res.status(503).json({
        status: 'error',
        message: 'Login is temporarily unavailable — database connection failed.',
      });
    }
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Register a new student (self-registration)
// @route   POST /api/v1/auth/register
export const registerStudent = async (req: Request, res: Response) => {
  const { firstName, lastName, email, studentNumber, departmentId, password } = req.body;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [roles]: any = await connection.query(`SELECT id FROM roles WHERE name = 'Student'`);
    if (roles.length === 0) throw new Error('Student role not found in database');
    const studentRoleId = roles[0].id;

    // Verify department exists
    const [depts]: any = await connection.query('SELECT id FROM departments WHERE id = ?', [departmentId]);
    if (depts.length === 0) {
      await connection.rollback();
      return res.status(400).json({ status: 'error', message: 'Invalid department selected' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [userResult]: any = await connection.query(
      'INSERT INTO users (role_id, first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?, ?)',
      [studentRoleId, firstName, lastName, email, passwordHash]
    );
    const newUserId = userResult.insertId;

    await connection.query(
      'INSERT INTO students (user_id, student_number, department_id) VALUES (?, ?, ?)',
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
        role: 'Student',
      },
    });
  } catch (err: any) {
    await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ status: 'error', message: 'Email or student number already exists.' });
    }
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    connection.release();
  }
};

// @desc    Get current user session
// @route   GET /api/v1/auth/me
export const getCurrentUser = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;

  try {
    const [users]: any = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, r.name AS role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    res.json({
      status: 'success',
      user: {
        id: users[0].id,
        email: users[0].email,
        firstName: users[0].first_name,
        lastName: users[0].last_name,
        role: users[0].role_name,
      },
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Forgot Password (stub — email bypass for dev)
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  console.log(`[AUTH] Forgot Password requested for: ${email}`);
  res.json({ status: 'success', message: 'If an account exists, a reset link has been sent.' });
};

// @desc    Reset Password (stub)
export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  console.log(`[AUTH] Reset Password for token: ${token}`);
  res.json({ status: 'success', message: 'Password has been updated.' });
};

// @desc    Get departments (for registration form)
// @route   GET /api/v1/auth/departments
export const getPublicDepartments = async (req: Request, res: Response) => {
  try {
    const [departments]: any = await db.query(
      `SELECT d.id, d.name, f.name AS faculty_name
       FROM departments d
       JOIN faculties f ON d.faculty_id = f.id
       ORDER BY f.name, d.name`
    );
    res.json({ status: 'success', data: departments });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get faculties (for registration / display)
// @route   GET /api/v1/auth/faculties
export const getPublicFaculties = async (req: Request, res: Response) => {
  try {
    const [faculties]: any = await db.query('SELECT id, name FROM faculties ORDER BY name');
    res.json({ status: 'success', data: faculties });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
