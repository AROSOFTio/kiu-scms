import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../config/database';
import { NotificationService } from '../services/notification.service';

// ===========================================================
// HELPERS
// ===========================================================

/**
 * Get the department_id of an HOD from their user_id.
 * Returns null for unassigned HODs (fail-closed pattern).
 */
const getHODDepartmentId = async (userId: number): Promise<number | null> => {
  const [rows]: any = await db.query(
    `SELECT s.department_id
     FROM staff s
     JOIN users u ON s.user_id = u.id
     JOIN roles r ON u.role_id = r.id
     WHERE s.user_id = ? AND r.name = 'HOD'`,
    [userId]
  );
  return rows.length > 0 ? rows[0].department_id : null;
};

/**
 * Verify that an HOD has permission to access the given complaint.
 * HODs can only manage complaints within their own department.
 * Non-HOD roles always return true (handled by route-level middleware).
 */
const verifyHODComplaintScope = async (
  userId: number,
  roleName: string,
  complaintId: number
): Promise<boolean> => {
  if (roleName !== 'HOD') return true;

  const departmentId = await getHODDepartmentId(userId);
  if (!departmentId) return false; // Fail-closed: unassigned HOD has no scope

  const [rows]: any = await db.query(
    'SELECT 1 FROM complaints WHERE id = ? AND department_id = ?',
    [complaintId, departmentId]
  );
  return rows.length > 0;
};

/**
 * Verify that an HOD has permission to manage the given user.
 * HODs can only manage users in their own department.
 */
const verifyHODUserScope = async (
  adminId: number,
  adminRole: string,
  targetUserId: number
): Promise<boolean> => {
  if (adminRole !== 'HOD') return true;

  const departmentId = await getHODDepartmentId(adminId);
  if (!departmentId) return false; // Fail-closed

  const [rows]: any = await db.query(
    `SELECT 1 FROM users u
     LEFT JOIN students s  ON u.id = s.user_id
     LEFT JOIN staff st    ON u.id = st.user_id
     WHERE u.id = ?
       AND (s.department_id = ? OR st.department_id = ?)`,
    [targetUserId, departmentId, departmentId]
  );
  return rows.length > 0;
};

// ===========================================================
// COMPLAINTS
// ===========================================================

// @desc    Get all complaints (HOD / Lecturer)
// @route   GET /api/v1/admin/complaints
export const getAllComplaints = async (req: Request, res: Response) => {
  const { status, statuses, category, search, priority, page = '1', limit = '10', startDate, endDate } = req.query as any;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const displayStatusSql = `COALESCE((SELECT csh.status FROM complaint_status_history csh WHERE csh.complaint_id = c.id ORDER BY csh.changed_at DESC, csh.id DESC LIMIT 1), c.status)`;

  const roleName = (req as any).user?.roleName;
  const userId = (req as any).user?.userId;

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    // Multi-status filter
    const statusList = (Array.isArray(statuses) ? statuses.join(',') : String(statuses || ''))
      .split(',').map((v: string) => v.trim()).filter(Boolean);

    if (statusList.length > 0) {
      where += ` AND ${displayStatusSql} IN (${statusList.map(() => '?').join(',')})`;
      params.push(...statusList);
    } else if (status) {
      where += ` AND ${displayStatusSql} = ?`;
      params.push(status);
    }

    if (category)  { where += ' AND cc.id = ?';       params.push(category); }
    if (priority)  { where += ' AND c.priority = ?';   params.push(priority); }
    if (startDate) { where += ' AND c.created_at >= ?'; params.push(startDate); }
    if (endDate)   { where += ' AND c.created_at <= ?'; params.push(endDate); }

    // Scope by role
    if (roleName === 'HOD') {
      const deptId = await getHODDepartmentId(userId);
      if (deptId) {
        where += ' AND c.department_id = ?';
        params.push(deptId);
      } else {
        where += ' AND 1=0'; // Fail-closed
      }
    } else if (roleName === 'Lecturer') {
      // Lecturers see only complaints assigned to them
      where += ' AND c.assigned_staff_id = (SELECT id FROM staff WHERE user_id = ? LIMIT 1)';
      params.push(userId);
    }

    if (search) {
      where += ' AND (c.title LIKE ? OR c.reference_number LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countRows]: any = await db.query(
      `SELECT COUNT(*) AS total
       FROM complaints c
       JOIN complaint_categories cc ON c.category_id = cc.id
       JOIN students s ON c.student_id = s.id
       JOIN users u ON s.user_id = u.id
       ${where}`,
      params
    );
    const total = countRows[0].total;

    const [rows]: any = await db.query(
      `SELECT c.id, c.reference_number, c.title, c.status, c.priority,
              c.complaint_channel, c.created_at, c.updated_at,
              ${displayStatusSql} AS display_status,
              cc.name AS category_name,
              d.name AS department_name,
              u.first_name AS student_first_name, u.last_name AS student_last_name,
              lu.first_name AS lecturer_first_name, lu.last_name AS lecturer_last_name,
              f.rating AS feedback_rating
       FROM complaints c
       JOIN complaint_categories cc ON c.category_id = cc.id
       JOIN students s ON c.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN staff ast ON c.assigned_staff_id = ast.id
       LEFT JOIN users lu ON ast.user_id = lu.id
       LEFT JOIN feedback f ON c.id = f.complaint_id
       ${where}
       ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({ status: 'success', data: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get single complaint (HOD / Lecturer view)
// @route   GET /api/v1/admin/complaints/:id
export const getComplaintById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user?.userId;
  const roleName = (req as any).user?.roleName;

  try {
    // Department-level scope check for HOD
    if (!await verifyHODComplaintScope(userId, roleName, parseInt(id))) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You can only view complaints in your department.',
      });
    }

    const [rows]: any = await db.query(
      `SELECT c.*,
              cc.name AS category_name,
              d.name AS department_name,
              u.first_name AS student_first_name, u.last_name AS student_last_name, u.email AS student_email,
              lu.first_name AS lecturer_first_name, lu.last_name AS lecturer_last_name,
              abu.first_name AS assigned_by_first, abu.last_name AS assigned_by_last,
              f.rating AS feedback_rating, f.comments AS feedback_comments, f.created_at AS feedback_date
       FROM complaints c
       JOIN complaint_categories cc ON c.category_id = cc.id
       JOIN students s ON c.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN staff ast ON c.assigned_staff_id = ast.id
       LEFT JOIN users lu ON ast.user_id = lu.id
       LEFT JOIN users abu ON c.assigned_by_user_id = abu.id
       LEFT JOIN feedback f ON c.id = f.complaint_id
       WHERE c.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Complaint not found' });
    }

    const complaint = rows[0];

    const [attachments]: any = await db.query(
      'SELECT id, file_path, file_path AS file_name FROM complaint_attachments WHERE complaint_id = ?', [id]
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

    const [reviewEvent]: any = await db.query(
      `SELECT changed_at FROM complaint_status_history
       WHERE complaint_id = ? AND status != 'Submitted'
       ORDER BY changed_at ASC LIMIT 1`,
      [id]
    );

    const reviewed_at = reviewEvent.length > 0 ? reviewEvent[0].changed_at : null;
    const display_status = timeline.length > 0 ? timeline[timeline.length - 1].status : complaint.status;

    res.json({
      status: 'success',
      data: {
        ...complaint,
        display_status,
        reviewed_at,
        attachments: attachments.map((a: any) => ({ ...a, file_name: a.file_path.split('/').pop() })),
        timeline,
        feedback: complaint.feedback_rating
          ? { rating: complaint.feedback_rating, comments: complaint.feedback_comments, date: complaint.feedback_date }
          : null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Assign complaint to a Lecturer (HOD only)
// @route   PATCH /api/v1/admin/complaints/:id/assign
export const assignStaff = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { staffId } = req.body;
  const hodUserId = (req as any).user?.userId;

  try {
    if (!await verifyHODComplaintScope(hodUserId, 'HOD', parseInt(id))) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You can only manage complaints in your department.',
      });
    }

    // Get HOD's department
    const hodDeptId = await getHODDepartmentId(hodUserId);
    if (!hodDeptId) {
      return res.status(403).json({ status: 'error', message: 'HOD department not found' });
    }

    // Validate: selected person must be a Lecturer in the same department
    const [lecturers]: any = await db.query(
      `SELECT st.id, u.id AS user_id, u.first_name, u.last_name
       FROM staff st
       JOIN users u ON st.user_id = u.id
       JOIN roles r ON u.role_id = r.id
       WHERE st.id = ? AND r.name = 'Lecturer' AND st.department_id = ?`,
      [staffId, hodDeptId]
    );

    if (lecturers.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid lecturer selected. Lecturers must belong to your department.',
      });
    }

    const lecturer = lecturers[0];

    await db.query(
      `UPDATE complaints
       SET assigned_staff_id = ?, assigned_by_user_id = ?, status = 'Assigned to Lecturer'
       WHERE id = ?`,
      [lecturer.id, hodUserId, id]
    );

    await db.query(
      `INSERT INTO complaint_status_history (complaint_id, status, changed_by_user_id, remarks)
       VALUES (?, 'Assigned to Lecturer', ?, ?)`,
      [id, hodUserId, `Complaint assigned to Lecturer ${lecturer.first_name} ${lecturer.last_name}`]
    );

    // Notify lecturer
    await NotificationService.notifyAssignment(parseInt(id), lecturer.id);

    // Notify student of status update
    await NotificationService.notifyStatusChange(
      parseInt(id),
      'Assigned to Lecturer',
      `Your complaint has been assigned to Lecturer ${lecturer.first_name} ${lecturer.last_name} for handling.`
    );

    res.json({ status: 'success', message: 'Complaint assigned to lecturer successfully' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Route complaint (HOD internal routing with remarks)
// @route   PATCH /api/v1/admin/complaints/:id/route
export const routeComplaint = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { destination, staffId, remarks } = req.body;
  const hodUserId = (req as any).user?.userId;
  const roleName = (req as any).user?.roleName;

  if (!destination) {
    return res.status(400).json({ status: 'error', message: 'Routing destination is required' });
  }

  try {
    if (!await verifyHODComplaintScope(hodUserId, roleName, parseInt(id))) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You can only manage complaints in your department.',
      });
    }

    const hodDeptId = await getHODDepartmentId(hodUserId);

    let assignedLecturer: any = null;
    if (staffId && hodDeptId) {
      const [staffRows]: any = await db.query(
        `SELECT st.id, u.first_name, u.last_name
         FROM staff st
         JOIN users u ON st.user_id = u.id
         JOIN roles r ON u.role_id = r.id
         WHERE st.id = ? AND r.name = 'Lecturer' AND st.department_id = ?`,
        [staffId, hodDeptId]
      );
      assignedLecturer = staffRows[0] || null;
    }

    await db.query(
      `UPDATE complaints
       SET assigned_staff_id = ?, assigned_by_user_id = ?, status = 'Assigned to Lecturer'
       WHERE id = ?`,
      [assignedLecturer ? assignedLecturer.id : null, hodUserId, id]
    );

    const routingMessage = [
      `Routed to: ${destination}`,
      assignedLecturer ? `Assigned to Lecturer ${assignedLecturer.first_name} ${assignedLecturer.last_name}` : '',
      remarks ? String(remarks).trim() : '',
    ].filter(Boolean).join('. ');

    await db.query(
      `INSERT INTO complaint_status_history (complaint_id, status, changed_by_user_id, remarks)
       VALUES (?, 'Assigned to Lecturer', ?, ?)`,
      [id, hodUserId, routingMessage]
    );

    if (assignedLecturer) {
      await NotificationService.notifyAssignment(parseInt(id), assignedLecturer.id);
    }

    await NotificationService.notifyStatusChange(parseInt(id), 'Assigned to Lecturer', routingMessage);

    res.json({ status: 'success', message: 'Complaint routed successfully' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get lecturers for assignment (HOD sees only their department)
// @route   GET /api/v1/admin/staff
export const getStaffMembers = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const roleName = (req as any).user?.roleName;

  try {
    let query = `SELECT st.id, u.first_name, u.last_name, u.email,
                        r.name AS role_name, d.name AS department_name
                 FROM staff st
                 JOIN users u ON u.id = st.user_id
                 JOIN roles r ON u.role_id = r.id
                 JOIN departments d ON st.department_id = d.id
                 WHERE r.name = 'Lecturer' AND u.is_active = 1`;
    const params: any[] = [];

    if (roleName === 'HOD') {
      const deptId = await getHODDepartmentId(userId);
      if (deptId) {
        query += ' AND st.department_id = ?';
        params.push(deptId);
      } else {
        query += ' AND 1=0';
      }
    }

    query += ' ORDER BY u.first_name';
    const [rows]: any = await db.query(query, params);
    res.json({ status: 'success', data: rows });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Update complaint status (HOD or Lecturer)
// @route   PATCH /api/v1/admin/complaints/:id/status
export const updateStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, remarks } = req.body;
  const userId = (req as any).user?.userId;
  const roleName = (req as any).user?.roleName;

  if (!status || !remarks) {
    return res.status(400).json({ status: 'error', message: 'Status and remarks are required' });
  }

  try {
    // Lecturers can only update status on complaints assigned to them
    if (roleName === 'Lecturer') {
      const [staffRow]: any = await db.query('SELECT id FROM staff WHERE user_id = ?', [userId]);
      if (staffRow.length === 0) {
        return res.status(403).json({ status: 'error', message: 'Lecturer profile not found' });
      }
      const [assignment]: any = await db.query(
        'SELECT id FROM complaints WHERE id = ? AND assigned_staff_id = ?',
        [id, staffRow[0].id]
      );
      if (assignment.length === 0) {
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: You can only update status on complaints assigned to you.',
        });
      }
    } else if (roleName === 'HOD') {
      if (!await verifyHODComplaintScope(userId, 'HOD', parseInt(id))) {
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: You can only manage complaints in your department.',
        });
      }
    }

    // Track who resolved it
    const resolvedStatuses = ['Resolved', 'Closed'];
    const resolvedByClause = resolvedStatuses.includes(status)
      ? ', resolved_by_user_id = ?'
      : '';
    const updateParams = resolvedStatuses.includes(status)
      ? [status, userId, id]
      : [status, id];

    await db.query(
      `UPDATE complaints SET status = ?${resolvedByClause} WHERE id = ?`,
      updateParams
    );

    await db.query(
      `INSERT INTO complaint_status_history (complaint_id, status, changed_by_user_id, remarks)
       VALUES (?, ?, ?, ?)`,
      [id, status, userId, remarks]
    );

    await NotificationService.notifyStatusChange(parseInt(id), status, remarks);

    res.json({ status: 'success', message: 'Status updated successfully' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get dashboard stats (HOD / Lecturer)
// @route   GET /api/v1/admin/dashboard
export const getAdminStats = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const roleName = (req as any).user?.roleName;

  try {
    let filterSQL = '';
    let filterParam: any = null;

    if (roleName === 'HOD') {
      const deptId = await getHODDepartmentId(userId);
      if (deptId) {
        filterSQL = 'department_id = ?';
        filterParam = deptId;
      } else {
        filterSQL = '1=0';
      }
    } else if (roleName === 'Lecturer') {
      filterSQL = 'assigned_staff_id = (SELECT id FROM staff WHERE user_id = ? LIMIT 1)';
      filterParam = userId;
    }

    const params = filterParam !== null ? [filterParam] : [];
    const scopedFilter = filterSQL
      .replace(/\bassigned_staff_id\b/g, 'c.assigned_staff_id')
      .replace(/\bdepartment_id\b/g, 'c.department_id');
    const displayStatusSql = `COALESCE((SELECT csh.status FROM complaint_status_history csh WHERE csh.complaint_id = c.id ORDER BY csh.changed_at DESC, csh.id DESC LIMIT 1), c.status)`;

    const [total]: any = await db.query(`SELECT COUNT(*) AS count FROM complaints WHERE ${filterSQL}`, params);
    const [byStatus]: any = await db.query(
      `SELECT ${displayStatusSql} AS status, COUNT(*) AS count
       FROM complaints c WHERE ${scopedFilter} GROUP BY ${displayStatusSql}`,
      params
    );
    const [byCategory]: any = await db.query(
      `SELECT cc.name AS category, COUNT(c.id) AS count
       FROM complaint_categories cc
       LEFT JOIN complaints c ON cc.id = c.category_id AND c.${filterSQL}
       GROUP BY cc.name`,
      params
    );
    const [slaMetrics]: any = await db.query(
      `SELECT
         SUM(CASE WHEN status NOT IN ('Resolved','Closed','Rejected')
                   AND TIMESTAMPDIFF(HOUR, created_at, NOW()) > CASE priority
                       WHEN 'Critical' THEN 24 WHEN 'High' THEN 48
                       WHEN 'Medium' THEN 72 WHEN 'Low' THEN 120 ELSE 72 END
             THEN 1 ELSE 0 END) AS breached,
         SUM(CASE WHEN status NOT IN ('Resolved','Closed','Rejected')
                   AND TIMESTAMPDIFF(HOUR, created_at, NOW()) <= CASE priority
                       WHEN 'Critical' THEN 24 WHEN 'High' THEN 48
                       WHEN 'Medium' THEN 72 WHEN 'Low' THEN 120 ELSE 72 END
             THEN 1 ELSE 0 END) AS onTrack
       FROM complaints WHERE ${filterSQL}`,
      params
    );

    // HOD-specific: unassigned count
    let unassigned = 0;
    if (roleName === 'HOD') {
      const deptId = await getHODDepartmentId(userId);
      if (deptId) {
        const [ua]: any = await db.query(
          `SELECT COUNT(*) AS count FROM complaints
           WHERE department_id = ? AND assigned_staff_id IS NULL
             AND status NOT IN ('Resolved','Closed','Rejected')`,
          [deptId]
        );
        unassigned = ua[0].count;
      }
    }

    // Recent activity
    const [recent]: any = await db.query(
      `SELECT csh.*, c.reference_number, u.first_name, u.last_name
       FROM complaint_status_history csh
       JOIN complaints c ON csh.complaint_id = c.id
       JOIN users u ON csh.changed_by_user_id = u.id
       WHERE ${filterSQL.replace('department_id', 'c.department_id').replace('assigned_staff_id', 'c.assigned_staff_id')}
          OR csh.changed_by_user_id = ?
       ORDER BY csh.changed_at DESC LIMIT 15`,
      [...params, userId]
    );

    // Urgent cases
    const [urgentCases]: any = await db.query(
      `SELECT id, reference_number, title, priority, status, created_at
       FROM complaints
       WHERE status NOT IN ('Resolved','Closed','Rejected')
         AND (priority IN ('High','Critical') OR created_at < DATE_SUB(NOW(), INTERVAL 72 HOUR))
         AND ${filterSQL}
       ORDER BY priority DESC, created_at ASC LIMIT 5`,
      params
    );

    // Recent feedback
    const [recentFeedback]: any = await db.query(
      `SELECT f.*, c.reference_number, u.first_name, u.last_name, u.email
       FROM feedback f
       JOIN complaints c ON f.complaint_id = c.id
       JOIN students s ON f.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE c.${filterSQL}
       ORDER BY f.created_at DESC LIMIT 3`,
      params
    );

    res.json({
      status: 'success',
      data: {
        total: total[0].count,
        unassigned,
        byStatus,
        byCategory,
        slaMetrics: slaMetrics[0] || { breached: 0, onTrack: 0 },
        recentActivity: recent,
        urgentCases,
        recentFeedback,
        isLecturerSpecific: roleName === 'Lecturer',
      },
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Add internal note
// @route   POST /api/v1/admin/complaints/:id/notes
export const addInternalNote = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { note } = req.body;
  const userId = (req as any).user?.userId;

  if (!note) {
    return res.status(400).json({ status: 'error', message: 'Note content is required' });
  }

  try {
    await db.query(
      'INSERT INTO complaint_internal_notes (complaint_id, user_id, note) VALUES (?, ?, ?)',
      [id, userId, note]
    );
    res.json({ status: 'success', message: 'Internal note added' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get internal notes
// @route   GET /api/v1/admin/complaints/:id/notes
export const getInternalNotes = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const [rows]: any = await db.query(
      `SELECT cin.*, u.first_name, u.last_name
       FROM complaint_internal_notes cin
       JOIN users u ON cin.user_id = u.id
       WHERE cin.complaint_id = ?
       ORDER BY cin.created_at DESC`,
      [id]
    );
    res.json({ status: 'success', data: rows });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ===========================================================
// USER MANAGEMENT (HOD scoped to own department)
// ===========================================================

// @desc    Get all users (HOD scoped to department)
// @route   GET /api/v1/admin/users
export const getAllUsers = async (req: Request, res: Response) => {
  const { role, search, status, page = '1', limit = '20' } = req.query as any;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const adminId = (req as any).user?.userId;
  const adminRole = (req as any).user?.roleName;

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    // HOD sees only users in their department
    if (adminRole === 'HOD') {
      const deptId = await getHODDepartmentId(adminId);
      if (deptId) {
        where += ` AND (
          u.id IN (SELECT user_id FROM students WHERE department_id = ?)
          OR
          u.id IN (SELECT user_id FROM staff WHERE department_id = ?)
        )`;
        params.push(deptId, deptId);
      } else {
        where += ' AND 1=0';
      }
    }

    if (role)   { where += ' AND r.name = ?';       params.push(role); }
    if (status) { where += ' AND u.is_active = ?';  params.push(status === 'active' ? 1 : 0); }
    if (search) {
      where += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countRows]: any = await db.query(
      `SELECT COUNT(*) AS total FROM users u JOIN roles r ON u.role_id = r.id ${where}`,
      params
    );
    const total = countRows[0].total;

    const [rows]: any = await db.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.is_active, u.created_at,
              r.name AS role_name,
              CASE
                WHEN r.name = 'Student' THEN (SELECT d.name FROM students s JOIN departments d ON s.department_id = d.id WHERE s.user_id = u.id)
                ELSE (SELECT d.name FROM staff st JOIN departments d ON st.department_id = d.id WHERE st.user_id = u.id)
              END AS department_name,
              CASE
                WHEN r.name = 'Student' THEN (SELECT s.student_number FROM students s WHERE s.user_id = u.id)
                ELSE (SELECT st.staff_number FROM staff st WHERE st.user_id = u.id)
              END AS id_number
       FROM users u
       JOIN roles r ON u.role_id = r.id
       ${where}
       ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({ status: 'success', data: rows, total });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Create a new user (HOD scoped to department)
// @route   POST /api/v1/admin/users
export const createUser = async (req: Request, res: Response) => {
  const { roleName, firstName, lastName, email, password, idNumber, departmentId } = req.body;
  const adminId = (req as any).user?.userId;
  const adminRole = (req as any).user?.roleName;
  const staffRoles = ['HOD', 'Lecturer'];

  try {
    // Scope: HOD can only create users in their own department
    if (adminRole === 'HOD' && departmentId) {
      const hodDeptId = await getHODDepartmentId(adminId);
      if (!hodDeptId || parseInt(departmentId) !== hodDeptId) {
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: You can only create users in your own department.',
        });
      }
    }

    // Prevent duplicate HODs in the same department
    if (roleName === 'HOD' && departmentId) {
      const [existingHod]: any = await db.query(
        `SELECT u.id FROM users u
         JOIN roles r ON u.role_id = r.id
         JOIN staff s ON u.id = s.user_id
         WHERE r.name = 'HOD' AND s.department_id = ?`,
        [departmentId]
      );
      if (existingHod.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'This department already has an HOD. A department can only have one HOD.',
        });
      }
    }

    // Get role ID
    const [roles]: any = await db.query('SELECT id FROM roles WHERE name = ?', [roleName]);
    if (roles.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid role. Use: HOD, Lecturer, or Student' });
    }
    const roleId = roles[0].id;

    const passwordHash = await bcrypt.hash(password, 10);

    const [userResult]: any = await db.query(
      'INSERT INTO users (role_id, first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?, ?)',
      [roleId, firstName, lastName, email, passwordHash]
    );
    const userId = userResult.insertId;

    if (roleName === 'Student' && idNumber && departmentId) {
      await db.query(
        'INSERT INTO students (user_id, student_number, department_id) VALUES (?, ?, ?)',
        [userId, idNumber, departmentId]
      );
    } else if (staffRoles.includes(roleName) && idNumber && departmentId) {
      await db.query(
        'INSERT INTO staff (user_id, staff_number, department_id, role_id) VALUES (?, ?, ?, ?)',
        [userId, idNumber, departmentId, roleId]
      );
    }

    await db.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [adminId, 'CREATE_USER', `Created ${roleName}: ${firstName} ${lastName} (${email})`]
    );

    res.json({ status: 'success', message: `${roleName} created successfully`, userId });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ status: 'error', message: 'Email or ID number already exists.' });
    }
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Update an existing user
// @route   PUT /api/v1/admin/users/:id
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { firstName, lastName, email, roleName, idNumber, departmentId } = req.body;
  const adminId = (req as any).user?.userId;
  const adminRole = (req as any).user?.roleName;
  const staffRoles = ['HOD', 'Lecturer'];

  try {
    if (!await verifyHODUserScope(adminId, adminRole, parseInt(id))) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You can only manage users in your department.',
      });
    }

    // HOD cannot move users outside their department
    if (adminRole === 'HOD' && departmentId) {
      const hodDeptId = await getHODDepartmentId(adminId);
      if (!hodDeptId || parseInt(departmentId) !== hodDeptId) {
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: You can only assign users to your own department.',
        });
      }
    }

    const [roles]: any = await db.query('SELECT id FROM roles WHERE name = ?', [roleName]);
    if (roles.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid role' });
    }
    const roleId = roles[0].id;

    await db.query(
      'UPDATE users SET role_id = ?, first_name = ?, last_name = ?, email = ? WHERE id = ?',
      [roleId, firstName, lastName, email, id]
    );

    if (roleName === 'Student' && idNumber && departmentId) {
      await db.query('DELETE FROM staff WHERE user_id = ?', [id]);
      await db.query(
        `INSERT INTO students (user_id, student_number, department_id) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE student_number = ?, department_id = ?`,
        [id, idNumber, departmentId, idNumber, departmentId]
      );
    } else if (staffRoles.includes(roleName) && idNumber && departmentId) {
      await db.query('DELETE FROM students WHERE user_id = ?', [id]);
      await db.query(
        `INSERT INTO staff (user_id, staff_number, department_id, role_id) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE staff_number = ?, department_id = ?, role_id = ?`,
        [id, idNumber, departmentId, roleId, idNumber, departmentId, roleId]
      );
    }

    await db.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [adminId, 'UPDATE_USER', `Updated user: ${firstName} ${lastName} (${email})`]
    );

    res.json({ status: 'success', message: 'User updated successfully' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Toggle user active status
// @route   PATCH /api/v1/admin/users/:id/status
export const toggleUserStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const adminId = (req as any).user?.userId;
  const adminRole = (req as any).user?.roleName;

  try {
    if (!await verifyHODUserScope(adminId, adminRole, parseInt(id))) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You can only manage users in your department.',
      });
    }

    await db.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
    res.json({ status: 'success', message: `User ${isActive ? 'activated' : 'suspended'} successfully` });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ===========================================================
// SETTINGS & AUDIT
// ===========================================================

export const getSettings = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await db.query('SELECT * FROM system_settings');
    const settings: any = {};
    rows.forEach((r: any) => { settings[r.key_name] = r.value; });
    res.json({ status: 'success', data: settings });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  const settings = req.body;
  const adminId = (req as any).user?.userId;

  try {
    for (const [key, value] of Object.entries(settings)) {
      await db.query('UPDATE system_settings SET value = ? WHERE key_name = ?', [value, key]);
    }
    await db.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [adminId, 'UPDATE_SETTINGS', 'System-wide settings updated']
    );
    res.json({ status: 'success', message: 'Settings updated successfully' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  const { page = '1', limit = '50' } = req.query as any;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const adminId = (req as any).user?.userId;
  const adminRole = (req as any).user?.roleName;

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (adminRole === 'HOD') {
      const deptId = await getHODDepartmentId(adminId);
      if (deptId) {
        where += ` AND al.user_id IN (
          SELECT user_id FROM staff WHERE department_id = ?
          UNION
          SELECT user_id FROM students WHERE department_id = ?
        )`;
        params.push(deptId, deptId);
      } else {
        where += ' AND 1=0';
      }
    }

    const [countRows]: any = await db.query(
      `SELECT COUNT(*) AS total FROM audit_logs al JOIN users u ON al.user_id = u.id ${where}`,
      params
    );

    const [rows]: any = await db.query(
      `SELECT al.*, u.first_name, u.last_name, r.name AS role_name
       FROM audit_logs al
       JOIN users u ON al.user_id = u.id
       JOIN roles r ON u.role_id = r.id
       ${where}
       ORDER BY al.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({ status: 'success', data: rows, total: countRows[0].total });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ===========================================================
// ORGANIZATIONAL STRUCTURE
// ===========================================================
export const manageOrg = {
  getFaculties: async (req: Request, res: Response) => {
    const adminId = (req as any).user?.userId;
    const adminRole = (req as any).user?.roleName;
    try {
      let query = 'SELECT * FROM faculties';
      const params: any[] = [];
      if (adminRole === 'HOD') {
        const deptId = await getHODDepartmentId(adminId);
        if (deptId) {
          query += ' WHERE id = (SELECT faculty_id FROM departments WHERE id = ?)';
          params.push(deptId);
        } else {
          query += ' WHERE id = 0';
        }
      }
      query += ' ORDER BY name';
      const [rows]: any = await db.query(query, params);
      res.json({ status: 'success', data: rows });
    } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); }
  },
  createFaculty: async (req: Request, res: Response) => {
    try {
      await db.query('INSERT INTO faculties (name) VALUES (?)', [req.body.name]);
      res.json({ status: 'success', message: 'Faculty created' });
    } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); }
  },
  getDepartments: async (req: Request, res: Response) => {
    const adminId = (req as any).user?.userId;
    const adminRole = (req as any).user?.roleName;
    try {
      let query = 'SELECT d.*, f.name AS faculty_name FROM departments d JOIN faculties f ON d.faculty_id = f.id';
      const params: any[] = [];
      if (adminRole === 'HOD') {
        const deptId = await getHODDepartmentId(adminId);
        if (deptId) {
          query += ' WHERE d.id = ?';
          params.push(deptId);
        } else {
          query += ' WHERE d.id = 0';
        }
      }
      query += ' ORDER BY f.name, d.name';
      const [rows]: any = await db.query(query, params);
      res.json({ status: 'success', data: rows });
    } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); }
  },
  createDepartment: async (req: Request, res: Response) => {
    try {
      await db.query('INSERT INTO departments (faculty_id, name) VALUES (?, ?)', [req.body.facultyId, req.body.name]);
      res.json({ status: 'success', message: 'Department created' });
    } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); }
  },
  getCategories: async (req: Request, res: Response) => {
    try {
      const [rows]: any = await db.query('SELECT * FROM complaint_categories ORDER BY name');
      res.json({ status: 'success', data: rows });
    } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); }
  },
  createCategory: async (req: Request, res: Response) => {
    try {
      await db.query('INSERT INTO complaint_categories (name, description) VALUES (?, ?)', [req.body.name, req.body.description]);
      res.json({ status: 'success', message: 'Category created' });
    } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); }
  },
  updateFaculty: async (req: Request, res: Response) => {
    try {
      await db.query('UPDATE faculties SET name = ? WHERE id = ?', [req.body.name, req.params.id]);
      res.json({ status: 'success', message: 'Faculty updated' });
    } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); }
  },
  deleteFaculty: async (req: Request, res: Response) => {
    try {
      await db.query('DELETE FROM faculties WHERE id = ?', [req.params.id]);
      res.json({ status: 'success', message: 'Faculty deleted' });
    } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); }
  },
  updateDepartment: async (req: Request, res: Response) => {
    try {
      await db.query('UPDATE departments SET faculty_id = ?, name = ? WHERE id = ?', [req.body.facultyId, req.body.name, req.params.id]);
      res.json({ status: 'success', message: 'Department updated' });
    } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); }
  },
  deleteDepartment: async (req: Request, res: Response) => {
    try {
      await db.query('DELETE FROM departments WHERE id = ?', [req.params.id]);
      res.json({ status: 'success', message: 'Department deleted' });
    } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); }
  },
  updateCategory: async (req: Request, res: Response) => {
    try {
      await db.query('UPDATE complaint_categories SET name = ?, description = ? WHERE id = ?', [req.body.name, req.body.description, req.params.id]);
      res.json({ status: 'success', message: 'Category updated' });
    } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); }
  },
  deleteCategory: async (req: Request, res: Response) => {
    try {
      await db.query('DELETE FROM complaint_categories WHERE id = ?', [req.params.id]);
      res.json({ status: 'success', message: 'Category deleted' });
    } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); }
  },
};

// ===========================================================
// FEEDBACK & REPORTS
// ===========================================================

export const getFeedback = async (req: Request, res: Response) => {
  const { page = '1', limit = '20' } = req.query as any;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const adminId = (req as any).user?.userId;
  const adminRole = (req as any).user?.roleName;

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];
    if (adminRole === 'HOD') {
      const deptId = await getHODDepartmentId(adminId);
      if (deptId) {
        where += ' AND c.department_id = ?';
        params.push(deptId);
      } else {
        where += ' AND 1=0';
      }
    } else if (adminRole === 'Lecturer') {
      const [staffRow]: any = await db.query('SELECT id FROM staff WHERE user_id = ?', [adminId]);
      if (staffRow.length > 0) {
        where += ' AND c.assigned_staff_id = ?';
        params.push(staffRow[0].id);
      } else {
        where += ' AND 1=0';
      }
    }

    const [countRows]: any = await db.query(
      `SELECT COUNT(*) AS total FROM feedback f JOIN complaints c ON f.complaint_id = c.id ${where}`,
      params
    );

    const [rows]: any = await db.query(
      `SELECT f.*, c.reference_number, c.title AS complaint_title,
              u.first_name, u.last_name, u.email
       FROM feedback f
       JOIN complaints c ON f.complaint_id = c.id
       JOIN students s ON f.student_id = s.id
       JOIN users u ON s.user_id = u.id
       ${where}
       ORDER BY f.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({ status: 'success', data: rows, total: countRows[0].total });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

export const getFeedbackStats = async (req: Request, res: Response) => {
  const adminId = (req as any).user?.userId;
  const adminRole = (req as any).user?.roleName;

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];
    if (adminRole === 'HOD') {
      const deptId = await getHODDepartmentId(adminId);
      if (deptId) { where += ' AND c.department_id = ?'; params.push(deptId); }
      else { where += ' AND 1=0'; }
    }

    const [avg]: any = await db.query(
      `SELECT AVG(f.rating) AS averageRating, COUNT(f.id) AS totalFeedback
       FROM feedback f JOIN complaints c ON f.complaint_id = c.id ${where}`,
      params
    );
    const [distribution]: any = await db.query(
      `SELECT f.rating, COUNT(f.id) AS count
       FROM feedback f JOIN complaints c ON f.complaint_id = c.id ${where}
       GROUP BY f.rating ORDER BY f.rating DESC`,
      params
    );

    res.json({
      status: 'success',
      data: {
        averageRating: parseFloat(avg[0].averageRating || 0).toFixed(1),
        totalFeedback: avg[0].totalFeedback,
        distribution,
      },
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

export const getDetailedReports = async (req: Request, res: Response) => {
  const adminId = (req as any).user?.userId;
  const adminRole = (req as any).user?.roleName;

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];
    if (adminRole === 'HOD') {
      const deptId = await getHODDepartmentId(adminId);
      if (deptId) { where += ' AND c.department_id = ?'; params.push(deptId); }
      else { where += ' AND 1=0'; }
    } else if (adminRole === 'Lecturer') {
      const [staffRow]: any = await db.query('SELECT id FROM staff WHERE user_id = ?', [adminId]);
      if (staffRow.length > 0) { where += ' AND c.assigned_staff_id = ?'; params.push(staffRow[0].id); }
      else { where += ' AND 1=0'; }
    }

    const [byCategory]: any = await db.query(
      `SELECT cc.name AS name, COUNT(c.id) AS value
       FROM complaint_categories cc LEFT JOIN complaints c ON cc.id = c.category_id ${where}
       GROUP BY cc.name`, params
    );
    const [byStatus]: any = await db.query(
      `SELECT status AS name, COUNT(*) AS value FROM complaints c ${where} GROUP BY status`, params
    );
    const [trends]: any = await db.query(
      `SELECT DATE_FORMAT(created_at, '%b %Y') AS month, COUNT(*) AS count
       FROM complaints c ${where} AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY month ORDER BY MIN(created_at)`, params
    );
    const [resolutionTime]: any = await db.query(
      `SELECT cc.name AS category, ROUND(AVG(TIMESTAMPDIFF(HOUR, c.created_at, c.updated_at)), 1) AS avgHours
       FROM complaints c JOIN complaint_categories cc ON c.category_id = cc.id
       ${where} AND c.status IN ('Resolved','Closed')
       GROUP BY cc.name`, params
    );

    res.json({ status: 'success', data: { byCategory, byStatus, trends, resolutionTime } });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

export const exportComplaintsCsv = async (req: Request, res: Response) => {
  const adminId = (req as any).user?.userId;
  const adminRole = (req as any).user?.roleName;

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];
    if (adminRole === 'HOD') {
      const deptId = await getHODDepartmentId(adminId);
      if (deptId) { where += ' AND c.department_id = ?'; params.push(deptId); }
      else { where += ' AND 1=0'; }
    }

    const [rows]: any = await db.query(
      `SELECT c.reference_number, c.title, c.status, c.priority, c.complaint_channel,
              cc.name AS category, d.name AS department,
              u.first_name AS student_first, u.last_name AS student_last,
              c.created_at
       FROM complaints c
       JOIN complaint_categories cc ON c.category_id = cc.id
       JOIN students s ON c.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN departments d ON c.department_id = d.id
       ${where}
       ORDER BY c.created_at DESC`, params
    );

    let csv = 'Reference,Title,Status,Priority,Channel,Category,Department,Student,Date\n';
    rows.forEach((r: any) => {
      csv += `"${r.reference_number}","${String(r.title).replace(/"/g, '""')}","${r.status}","${r.priority}","${r.complaint_channel}","${r.category}","${r.department}","${r.student_first} ${r.student_last}","${r.created_at.toISOString()}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=complaints_report.csv');
    res.status(200).send(csv);
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
