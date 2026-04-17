import { Request, Response } from 'express';
import { db } from '../config/database';
import { NotificationService } from '../services/notification.service';
import { ensureStudentProfile } from '../services/student-profile.service';
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
// @route   POST /api/v1/complaints
export const submitComplaint = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { title, categoryId, description, departmentId, complaintChannel } = req.body;

  try {
    // 1. Resolve student profile — department is enforced from student record
    const studentProfile = await ensureStudentProfile(userId, departmentId);
    if (!studentProfile.profile) {
      const statusCode = studentProfile.status === 'invalid_department' ? 400 : 403;
      return res.status(statusCode).json({ status: 'error', message: studentProfile.message });
    }
    const studentId = studentProfile.profile.studentId;
    const resolvedDepartmentId = studentProfile.profile.departmentId;

    // 2. Find the HOD of the student's department (role = 'HOD')
    const [hods]: any = await db.query(
      `SELECT s.id AS staff_id, u.id AS user_id, u.first_name, u.last_name
       FROM staff s
       JOIN users u ON s.user_id = u.id
       JOIN roles r ON u.role_id = r.id
       WHERE s.department_id = ? AND r.name = 'HOD' AND u.is_active = 1
       LIMIT 1`,
      [resolvedDepartmentId]
    );
    const primaryHod = hods[0] || null;

    const reference = await generateReference();

    // 3. Determine channel (default: Portal Submission)
    const channel = complaintChannel || 'Portal Submission';

    // 4. Insert complaint — routed directly to HOD, no staff assignment yet
    const [result]: any = await db.query(
      `INSERT INTO complaints
         (student_id, category_id, department_id, title, description, complaint_channel,
          priority, status, reference_number, received_by_hod_at)
       VALUES (?, ?, ?, ?, ?, ?, 'Medium', 'Submitted', ?, NOW())`,
      [studentId, categoryId, resolvedDepartmentId, title, description, channel, reference]
    );
    const complaintId = result.insertId;

    // 5. Handle file attachments
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files as Express.Multer.File[]) {
        const relPath = `/uploads/${file.filename}`;
        await db.query(
          'INSERT INTO complaint_attachments (complaint_id, file_path, file_type) VALUES (?, ?, ?)',
          [complaintId, relPath, path.extname(file.originalname).toLowerCase()]
        );
      }
    }

    // 6. Insert history: Submitted
    await db.query(
      `INSERT INTO complaint_status_history (complaint_id, status, changed_by_user_id, remarks)
       VALUES (?, 'Submitted', ?, 'Complaint submitted by student via ${channel}')`,
      [complaintId, userId]
    );

    // 7. Insert history: Received by HOD
    if (primaryHod) {
      await db.query(
        `INSERT INTO complaint_status_history (complaint_id, status, changed_by_user_id, remarks)
         VALUES (?, 'Received by HOD', ?, 'Complaint automatically routed to departmental HOD')`,
        [complaintId, primaryHod.user_id]
      );

      // Update complaint status to Received by HOD
      await db.query(
        `UPDATE complaints SET status = 'Received by HOD' WHERE id = ?`,
        [complaintId]
      );
    }

    // 8. In-app notifications
    await NotificationService.sendInApp(
      userId,
      'Complaint Received',
      `Your complaint ${reference} has been submitted and forwarded to your departmental HOD.`
    );

    if (primaryHod) {
      await NotificationService.sendInApp(
        primaryHod.user_id,
        'New Department Complaint',
        `A new complaint (${reference}) has been submitted by a student in your department and requires your review.`
      );
    }

    res.status(201).json({
      status: 'success',
      message: 'Complaint submitted successfully',
      data: { id: complaintId, reference },
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get complaints for current student
// @route   GET /api/v1/complaints
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
    if (search) {
      where += ' AND (c.title LIKE ? OR c.reference_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countRows]: any = await db.query(
      `SELECT COUNT(*) as total FROM complaints c ${where}`, params
    );
    const total = countRows[0].total;

    const [rows]: any = await db.query(
      `SELECT c.id, c.reference_number, c.title, c.status, c.priority,
              c.complaint_channel, c.created_at, c.updated_at,
              ${displayStatusSql} AS display_status,
              cc.name AS category_name,
              d.name AS department_name
       FROM complaints c
       JOIN complaint_categories cc ON c.category_id = cc.id
       LEFT JOIN departments d ON c.department_id = d.id
       ${where}
       ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({ status: 'success', data: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get single complaint details with timeline (student view)
// @route   GET /api/v1/complaints/:id
export const getComplaintById = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { id } = req.params;

  try {
    const [rows]: any = await db.query(
      `SELECT c.*, cc.name AS category_name,
              d.name AS department_name,
              u.first_name, u.last_name, u.email,
              lu.first_name AS lecturer_first_name, lu.last_name AS lecturer_last_name
       FROM complaints c
       JOIN complaint_categories cc ON c.category_id = cc.id
       JOIN students s ON c.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN staff ast ON c.assigned_staff_id = ast.id
       LEFT JOIN users lu ON ast.user_id = lu.id
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
      `SELECT csh.*, u.first_name, u.last_name, r.name AS role_name
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
        timeline,
      },
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get student dashboard statistics
// @route   GET /api/v1/complaints/stats
export const getStudentStats = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const displayStatusSql = `COALESCE((SELECT csh.status FROM complaint_status_history csh WHERE csh.complaint_id = c.id ORDER BY csh.changed_at DESC, csh.id DESC LIMIT 1), c.status)`;

  try {
    const [students]: any = await db.query('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) return res.json({ status: 'success', data: {} });
    const studentId = students[0].id;

    const [total]: any = await db.query(
      'SELECT COUNT(*) as count FROM complaints WHERE student_id = ?', [studentId]
    );
    const [open]: any = await db.query(
      `SELECT COUNT(*) as count FROM complaints c
       WHERE c.student_id = ? AND ${displayStatusSql} NOT IN ('Resolved','Closed','Rejected')`,
      [studentId]
    );
    const [resolved]: any = await db.query(
      `SELECT COUNT(*) as count FROM complaints c
       WHERE c.student_id = ? AND ${displayStatusSql} IN ('Resolved','Closed')`,
      [studentId]
    );
    const [recent]: any = await db.query(
      `SELECT c.id, c.reference_number, c.title, c.status, c.priority,
              c.complaint_channel, c.created_at,
              COALESCE((SELECT csh.status FROM complaint_status_history csh WHERE csh.complaint_id = c.id ORDER BY csh.changed_at DESC, csh.id DESC LIMIT 1), c.status) AS display_status,
              cc.name AS category_name,
              d.name AS department_name
       FROM complaints c
       JOIN complaint_categories cc ON c.category_id = cc.id
       LEFT JOIN departments d ON c.department_id = d.id
       WHERE c.student_id = ?
       ORDER BY c.created_at DESC LIMIT 5`,
      [studentId]
    );

    res.json({
      status: 'success',
      data: {
        total: total[0].count,
        open: open[0].count,
        resolved: resolved[0].count,
        recent,
      },
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get complaint categories (public)
// @route   GET /api/v1/complaints/categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await db.query('SELECT id, name, description FROM complaint_categories ORDER BY name');
    res.json({ status: 'success', data: rows });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Submit feedback for a resolved/closed complaint
// @route   POST /api/v1/complaints/:id/feedback
export const submitFeedback = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { id } = req.params;
  const { rating, comments } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ status: 'error', message: 'Valid rating (1-5) is required' });
  }

  try {
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
        message: 'Complaint not found or not eligible for feedback',
      });
    }

    const studentId = complaints[0].student_id;

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

// @desc    Get in-app notifications for current user
// @route   GET /api/v1/complaints/notifications
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

// @desc    Mark a notification as read
// @route   PATCH /api/v1/complaints/notifications/:id/read
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

// @desc    Transparency board — scoped by role
// @route   GET /api/v1/complaints/public
export const getPublicComplaints = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const roleId = (req as any).user.roleId;

  try {
    const [roles]: any = await db.query('SELECT name FROM roles WHERE id = ?', [roleId]);
    const roleName = roles.length > 0 ? roles[0].name : '';

    let filter = '';
    const queryParams: any[] = [];

    if (roleName === 'Student') {
      const [students]: any = await db.query('SELECT id FROM students WHERE user_id = ?', [userId]);
      if (students.length > 0) {
        filter = 'WHERE c.student_id = ?';
        queryParams.push(students[0].id);
      }
    } else if (roleName === 'HOD') {
      // HOD sees only their own department
      const [staffRow]: any = await db.query(
        'SELECT department_id FROM staff WHERE user_id = ?', [userId]
      );
      if (staffRow.length > 0) {
        filter = 'WHERE c.department_id = ?';
        queryParams.push(staffRow[0].department_id);
      } else {
        filter = 'WHERE 1=0';
      }
    } else if (roleName === 'Lecturer') {
      // Lecturer sees only assigned complaints
      const [staffRow]: any = await db.query(
        'SELECT id FROM staff WHERE user_id = ?', [userId]
      );
      if (staffRow.length > 0) {
        filter = 'WHERE c.assigned_staff_id = ?';
        queryParams.push(staffRow[0].id);
      } else {
        filter = 'WHERE 1=0';
      }
    }

    const [rows]: any = await db.query(
      `SELECT c.id, c.reference_number, c.title, c.status, c.complaint_channel,
              c.created_at, cc.name AS category_name,
              d.name AS department_name,
              u.first_name AS student_first_name, u.last_name AS student_last_name,
              lu.first_name AS lecturer_first_name, lu.last_name AS lecturer_last_name
       FROM complaints c
       JOIN complaint_categories cc ON c.category_id = cc.id
       JOIN students s ON c.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN staff ast ON c.assigned_staff_id = ast.id
       LEFT JOIN users lu ON ast.user_id = lu.id
       ${filter}
       ORDER BY c.created_at DESC`,
      queryParams
    );

    const [stats]: any = await db.query(
      `SELECT cc.name AS category, COUNT(c.id) AS count
       FROM complaint_categories cc
       JOIN complaints c ON cc.id = c.category_id
       ${filter}
       GROUP BY cc.name`,
      queryParams
    );

    res.json({
      status: 'success',
      data: { complaints: rows, categoryStats: stats },
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
