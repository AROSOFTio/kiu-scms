import { Request, Response } from 'express';
import { db } from '../config/database';
import { NotificationService } from '../services/notification.service';
import path from 'path';

// Helper: Generate reference number like KIU-CMP-2026-000123
const generateReference = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const [rows]: any = await db.query(
    'SELECT COUNT(*) as total FROM complaints WHERE YEAR(created_at) = ?', [year]
  );
  const seq = (parseInt(rows[0].total) + 1).toString().padStart(6, '0');
  return `KIU-CMP-${year}-${seq}`;
};

// @desc    Submit a new complaint
export const submitComplaint = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { title, categoryId, description, priority } = req.body;

  try {
    // Get student record
    const [students]: any = await db.query(
      'SELECT id, department_id FROM students WHERE user_id = ?', [userId]
    );
    if (students.length === 0) {
      return res.status(403).json({ status: 'error', message: 'Only students can submit complaints' });
    }
    const studentId = students[0].id;
    const departmentId = students[0].department_id;

    const reference = await generateReference();

    // Insert complaint
    const [result]: any = await db.query(
      `INSERT INTO complaints (student_id, category_id, department_id, title, description, priority, status, reference_number)
       VALUES (?, ?, ?, ?, ?, ?, 'Submitted', ?)`,
      [studentId, categoryId, departmentId, title, description, priority || 'Medium', reference]
    );
    const complaintId = result.insertId;

    // Handle file attachments
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files as Express.Multer.File[]) {
        const relPath = `/uploads/${file.filename}`;
        await db.query(
          'INSERT INTO complaint_attachments (complaint_id, file_path, file_type) VALUES (?, ?, ?)',
          [complaintId, relPath, path.extname(file.originalname).toLowerCase()]
        );
      }
    }

    // Insert initial status history
    await db.query(
      `INSERT INTO complaint_status_history (complaint_id, status, changed_by_user_id, remarks)
       VALUES (?, 'Submitted', ?, 'Complaint submitted by student')`,
      [complaintId, userId]
    );

    // 1. Send in-app notification to student
    await NotificationService.sendInApp(
      userId, 
      'Complaint Received', 
      `Your complaint ${reference} has been successfully submitted and is awaiting review.`
    );

    // 2. Notify HODs of the Faculty (College-wide oversight)
    const [hods]: any = await db.query(
      `SELECT DISTINCT u.id FROM users u
       JOIN roles r ON u.role_id = r.id
       JOIN staff s ON u.id = s.user_id
       JOIN departments d ON s.department_id = d.id
       WHERE r.name = 'Admin' AND d.faculty_id = (SELECT faculty_id FROM departments WHERE id = ?)`,
      [departmentId]
    );

    for (const hod of hods) {
      await NotificationService.sendInApp(
        hod.id,
        'Faculty Action: New Case',
        `A new complaint ${reference} has been submitted in your Faculty and requires your oversight.`
      );
    }

    res.status(201).json({
      status: 'success',
      message: 'Complaint submitted successfully',
      data: { id: complaintId, reference }
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get complaints for current student
export const getMyComplaints = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { status, category, search, page = '1', limit = '10' } = req.query as any;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const displayStatusSql = `COALESCE((SELECT csh.status FROM complaint_status_history csh WHERE csh.complaint_id = c.id ORDER BY csh.changed_at DESC, csh.id DESC LIMIT 1), c.status)`;

  try {
    const [students]: any = await db.query('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) return res.json({ status: 'success', data: [], total: 0 });
    const studentId = students[0].id;

    let where = 'WHERE c.student_id = ?';
    const params: any[] = [studentId];

    if (status) { where += ` AND ${displayStatusSql} = ?`; params.push(status); }
    if (category) { where += ' AND c.category_id = ?'; params.push(category); }
    if (search) { where += ' AND (c.title LIKE ? OR c.reference_number LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const [countRows]: any = await db.query(
      `SELECT COUNT(*) as total FROM complaints c ${where}`, params
    );
    const total = countRows[0].total;

    const [rows]: any = await db.query(
      `SELECT c.id, c.reference_number, c.title, c.status, c.priority, c.created_at, c.updated_at,
              ${displayStatusSql} as display_status,
              cc.name as category_name
       FROM complaints c
       JOIN complaint_categories cc ON c.category_id = cc.id
       ${where}
       ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({ status: 'success', data: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get single complaint details with timeline
export const getComplaintById = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { id } = req.params;

  try {
    const [rows]: any = await db.query(
      `SELECT c.*, cc.name as category_name,
              u.first_name, u.last_name, u.email
       FROM complaints c
       JOIN complaint_categories cc ON c.category_id = cc.id
       JOIN students s ON c.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE c.id = ? AND s.user_id = ?`,
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Complaint not found' });
    }

    const [attachments]: any = await db.query(
      'SELECT * FROM complaint_attachments WHERE complaint_id = ?', [id]
    );

    const [timeline]: any = await db.query(
      `SELECT csh.*, u.first_name, u.last_name, r.name as role_name
       FROM complaint_status_history csh
       JOIN users u ON csh.changed_by_user_id = u.id
       JOIN roles r ON u.role_id = r.id
       WHERE csh.complaint_id = ?
       ORDER BY csh.changed_at ASC`,
      [id]
    );

    res.json({
      status: 'success',
      data: {
        ...rows[0],
        display_status: timeline.length > 0 ? timeline[timeline.length - 1].status : rows[0].status,
        attachments,
        timeline
      }
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get student dashboard stats
export const getStudentStats = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;

  try {
    const [students]: any = await db.query('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) return res.json({ status: 'success', data: {} });
    const studentId = students[0].id;

    const [total]: any = await db.query('SELECT COUNT(*) as count FROM complaints WHERE student_id = ?', [studentId]);
    const [open]: any = await db.query(`SELECT COUNT(*) as count FROM complaints WHERE student_id = ? AND status NOT IN ('Resolved','Closed','Rejected')`, [studentId]);
    const [resolved]: any = await db.query(`SELECT COUNT(*) as count FROM complaints WHERE student_id = ? AND status = 'Resolved'`, [studentId]);
    const [recent]: any = await db.query(
      `SELECT c.id, c.reference_number, c.title, c.status, c.priority, c.created_at,
              COALESCE((SELECT csh.status FROM complaint_status_history csh WHERE csh.complaint_id = c.id ORDER BY csh.changed_at DESC, csh.id DESC LIMIT 1), c.status) as display_status,
              cc.name as category_name
       FROM complaints c JOIN complaint_categories cc ON c.category_id = cc.id
       WHERE c.student_id = ? ORDER BY c.created_at DESC LIMIT 5`,
      [studentId]
    );

    res.json({
      status: 'success',
      data: {
        total: total[0].count,
        open: open[0].count,
        resolved: resolved[0].count,
        recent
      }
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get complaint categories (public)
export const getCategories = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await db.query('SELECT id, name, description FROM complaint_categories ORDER BY name');
    res.json({ status: 'success', data: rows });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Submit feedback for a resolved complaint
export const submitFeedback = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { id } = req.params;
  const { rating, comments } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ status: 'error', message: 'Valid rating (1-5) is required' });
  }

  try {
    // 1. Verify complaint belongs to student and is resolved/closed
    const [complaints]: any = await db.query(
      `SELECT c.id, c.student_id 
       FROM complaints c
       JOIN students s ON c.student_id = s.id
       WHERE c.id = ? AND s.user_id = ? AND c.status IN ('Resolved', 'Closed')`,
      [id, userId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Complaint not found or not in a state allowing feedback' 
      });
    }

    const studentId = complaints[0].student_id;

    // 2. Insert feedback (using ON DUPLICATE KEY UPDATE since complaint_id is unique)
    await db.query(
      `INSERT INTO feedback (complaint_id, student_id, rating, comments)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), comments = VALUES(comments)`,
      [id, studentId, rating, comments]
    );

    res.json({ status: 'success', message: 'Feedback submitted successfully' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get user notifications
export const getNotifications = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;

  try {
    const [rows]: any = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [userId]
    );
    res.json({ status: 'success', data: rows });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Mark notification as read
export const markNotificationAsRead = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { id } = req.params;

  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    res.json({ status: 'success', message: 'Notification marked as read' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get all public complaints for transparency board
export const getPublicComplaints = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const roleId = (req as any).user.roleId;

  try {
    const [roles]: any = await db.query('SELECT name FROM roles WHERE id = ?', [roleId]);
    const roleName = roles.length > 0 ? roles[0].name : '';

    let studentFilter = '';
    const queryParams: any[] = [];

    if (roleName === 'Student') {
      const [students]: any = await db.query('SELECT id FROM students WHERE user_id = ?', [userId]);
      if (students.length > 0) {
        studentFilter = 'WHERE c.student_id = ?';
        queryParams.push(students[0].id);
      }
    } else if (roleName === 'Admin') {
      // HOD Faculty Filter: Restrict transparency board to their own faculty
      const [staff]: any = await db.query(
        'SELECT d.faculty_id FROM staff s JOIN departments d ON s.department_id = d.id WHERE s.user_id = ?',
        [userId]
      );
      if (staff.length > 0) {
        studentFilter = 'WHERE c.department_id IN (SELECT id FROM departments WHERE faculty_id = ?)';
        queryParams.push(staff[0].faculty_id);
      }
    }
    const [rows]: any = await db.query(
      `SELECT c.id, c.reference_number, c.title, c.status, c.created_at, 
              cc.name as category_name,
              u.first_name as student_first_name, u.last_name as student_last_name,
              (SELECT changed_at FROM complaint_status_history WHERE complaint_id = c.id AND status != 'Submitted' ORDER BY changed_at ASC LIMIT 1) as reviewed_at,
              su.first_name as staff_first_name, su.last_name as staff_last_name
       FROM complaints c
       JOIN complaint_categories cc ON c.category_id = cc.id
       JOIN students s ON c.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN users su ON c.assigned_staff_id = su.id
       ${studentFilter}
       ORDER BY c.created_at DESC`,
       queryParams
    );

    const [stats]: any = await db.query(
      `SELECT cc.name as category, COUNT(c.id) as count 
       FROM complaint_categories cc 
       JOIN complaints c ON cc.id = c.category_id 
       ${studentFilter}
       GROUP BY cc.name`,
       queryParams
    );

    res.json({ 
      status: 'success', 
      data: {
        complaints: rows,
        categoryStats: stats
      } 
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

