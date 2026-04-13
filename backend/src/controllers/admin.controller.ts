import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../config/database';
import { NotificationService } from '../services/notification.service';

// @desc    Get all complaints (Admin/Staff only)
export const getAllComplaints = async (req: Request, res: Response) => {
  const { status, category, search, priority, page = '1', limit = '10', startDate, endDate } = req.query as any;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (status) { where += ' AND c.status = ?'; params.push(status); }
    if (category) { where += ' AND cc.id = ?'; params.push(category); }
    if (priority) { where += ' AND c.priority = ?'; params.push(priority); }
    if (startDate) { where += ' AND c.created_at >= ?'; params.push(startDate); }
    if (endDate) { where += ' AND c.created_at <= ?'; params.push(endDate); }

    // Staff filtering: Staff only sees assigned. Dept Officer sees department cases (unless specifically checking assigned).
    const { assignedToMe } = req.query as any;
    const roleName = (req as any).user?.roleName;
    const userId = (req as any).user?.userId;

    if (roleName === 'Staff' || assignedToMe === 'true') {
      where += ' AND c.assigned_staff_id = ?';
      params.push(userId);
    } else if (roleName === 'Department Officer') {
      where += ' AND c.department_id = (SELECT department_id FROM staff WHERE user_id = ?)';
      params.push(userId);
    } else if (roleName === 'Admin') {
      // HOD Faculty Filter: If HOD is assigned to a department, restrict their view to their entire FACULTY.
      const facultyId = await getHODFacultyId(userId);
      if (facultyId) {
        where += ' AND c.department_id IN (SELECT id FROM departments WHERE faculty_id = ?)';
        params.push(facultyId);
      }
    }

    if (search) { 
      where += ' AND (c.title LIKE ? OR c.reference_number LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)'; 
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); 
    }

    const [countRows]: any = await db.query(
      `SELECT COUNT(*) as total 
       FROM complaints c
       JOIN students s ON c.student_id = s.id
       JOIN users u ON s.user_id = u.id
       ${where}`, 
      params
    );
    const total = countRows[0].total;

    const [rows]: any = await db.query(
      `SELECT c.id, c.reference_number, c.title, c.status, c.priority, c.created_at, c.updated_at,
              cc.name as category_name,
              u.first_name as student_first_name, u.last_name as student_last_name,
              su.first_name as staff_first_name, su.last_name as staff_last_name,
              f.rating as feedback_rating
       FROM complaints c
       JOIN complaint_categories cc ON c.category_id = cc.id
       JOIN students s ON c.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN users su ON c.assigned_staff_id = su.id
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

// @desc    Get single complaint details (Admin/Staff)
export const getComplaintById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user?.userId;
  const roleName = (req as any).user?.roleName;

  try {
    let where = 'WHERE c.id = ?';
    const params: any[] = [id];

    // If Staff, they might only be allowed to view it if assigned to them or if Staff has global access.
    // Assuming staff can view any case if they have the ID, or limit it: let's allow all staff to view.

    const [rows]: any = await db.query(
      `SELECT c.*, cc.name as category_name,
              u.first_name as student_first_name, u.last_name as student_last_name, u.email as student_email,
              su.first_name as staff_first_name, su.last_name as staff_last_name,
              f.rating as feedback_rating, f.comments as feedback_comments, f.created_at as feedback_date
       FROM complaints c
       JOIN complaint_categories cc ON c.category_id = cc.id
       JOIN students s ON c.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN users su ON c.assigned_staff_id = su.id
       LEFT JOIN feedback f ON c.id = f.complaint_id
       ${where}`,
      params
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Complaint not found' });
    }

    const complaint = rows[0];

    const [attachments]: any = await db.query(
      'SELECT id, file_path as file_path, file_path as file_name FROM complaint_attachments WHERE complaint_id = ?', [id]
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

    // Get the first review date (earliest event that isn't 'Submitted')
    const [reviewEvent]: any = await db.query(
      `SELECT changed_at FROM complaint_status_history 
       WHERE complaint_id = ? AND status != 'Submitted' 
       ORDER BY changed_at ASC LIMIT 1`,
      [id]
    );
    const reviewed_at = reviewEvent.length > 0 ? reviewEvent[0].changed_at : null;

    // Format response to match expected UI structure
    res.json({
      status: 'success',
      data: { 
        ...complaint, 
        reviewed_at,
        attachments: attachments.map((a: any) => ({...a, file_name: a.file_path.split('/').pop()})), 
        timeline,
        feedback: complaint.feedback_rating ? {
          rating: complaint.feedback_rating,
          comments: complaint.feedback_comments,
          date: complaint.feedback_date
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../config/database';
import { NotificationService } from '../services/notification.service';

// @desc    Get all complaints (Admin/Staff only)
export const getAllComplaints = async (req: Request, res: Response) => {
  const { status, category, search, priority, page = '1', limit = '10', startDate, endDate } = req.query as any;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (status) { where += ' AND c.status = ?'; params.push(status); }
    if (category) { where += ' AND cc.id = ?'; params.push(category); }
    if (priority) { where += ' AND c.priority = ?'; params.push(priority); }
    if (startDate) { where += ' AND c.created_at >= ?'; params.push(startDate); }
    if (endDate) { where += ' AND c.created_at <= ?'; params.push(endDate); }

    // Staff filtering: Staff only sees assigned. Dept Officer sees department cases (unless specifically checking assigned).
    const { assignedToMe } = req.query as any;
    const roleName = (req as any).user?.roleName;
    const userId = (req as any).user?.userId;

    if (roleName === 'Staff' || assignedToMe === 'true') {
      where += ' AND c.assigned_staff_id = ?';
      params.push(userId);
    } else if (roleName === 'Department Officer') {
      where += ' AND c.department_id = (SELECT department_id FROM staff WHERE user_id = ?)';
      params.push(userId);
    } else if (roleName === 'Admin') {
      // HOD Faculty Filter: If HOD is assigned to a department, restrict their view to their entire FACULTY.
      const facultyId = await getHODFacultyId(userId);
      if (facultyId) {
        where += ' AND c.department_id IN (SELECT id FROM departments WHERE faculty_id = ?)';
        params.push(facultyId);
      }
    }

    if (search) { 
      where += ' AND (c.title LIKE ? OR c.reference_number LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)'; 
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); 
    }

    const [countRows]: any = await db.query(
      `SELECT COUNT(*) as total 
       FROM complaints c
       JOIN students s ON c.student_id = s.id
       JOIN users u ON s.user_id = u.id
       ${where}`, 
      params
    );
    const total = countRows[0].total;

    const [rows]: any = await db.query(
      `SELECT c.id, c.reference_number, c.title, c.status, c.priority, c.created_at, c.updated_at,
              cc.name as category_name,
              u.first_name as student_first_name, u.last_name as student_last_name,
              su.first_name as staff_first_name, su.last_name as staff_last_name,
              f.rating as feedback_rating
       FROM complaints c
       JOIN complaint_categories cc ON c.category_id = cc.id
       JOIN students s ON c.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN users su ON c.assigned_staff_id = su.id
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

// @desc    Get single complaint details (Admin/Staff)
export const getComplaintById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user?.userId;
  const roleName = (req as any).user?.roleName;

  try {
    let where = 'WHERE c.id = ?';
    const params: any[] = [id];

    // If Staff, they might only be allowed to view it if assigned to them or if Staff has global access.
    // Assuming staff can view any case if they have the ID, or limit it: let's allow all staff to view.

    const [rows]: any = await db.query(
      `SELECT c.*, cc.name as category_name,
              u.first_name as student_first_name, u.last_name as student_last_name, u.email as student_email,
              su.first_name as staff_first_name, su.last_name as staff_last_name,
              f.rating as feedback_rating, f.comments as feedback_comments, f.created_at as feedback_date
       FROM complaints c
       JOIN complaint_categories cc ON c.category_id = cc.id
       JOIN students s ON c.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN users su ON c.assigned_staff_id = su.id
       LEFT JOIN feedback f ON c.id = f.complaint_id
       ${where}`,
      params
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Complaint not found' });
    }

    const complaint = rows[0];

    const [attachments]: any = await db.query(
      'SELECT id, file_path as file_path, file_path as file_name FROM complaint_attachments WHERE complaint_id = ?', [id]
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

    // Get the first review date (earliest event that isn't 'Submitted')
    const [reviewEvent]: any = await db.query(
      `SELECT changed_at FROM complaint_status_history 
       WHERE complaint_id = ? AND status != 'Submitted' 
       ORDER BY changed_at ASC LIMIT 1`,
      [id]
    );
    const reviewed_at = reviewEvent.length > 0 ? reviewEvent[0].changed_at : null;

    // Format response to match expected UI structure
    res.json({
      status: 'success',
      data: { 
        ...complaint, 
        reviewed_at,
        attachments: attachments.map((a: any) => ({...a, file_name: a.file_path.split('/').pop()})), 
        timeline,
        feedback: complaint.feedback_rating ? {
          rating: complaint.feedback_rating,
          comments: complaint.feedback_comments,
          date: complaint.feedback_date
        } : null
      }
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Assign a complaint to a staff member
export const assignStaff = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { staffId } = req.body;
  const adminId = (req as any).user?.userId;

  try {
    // 0. Scope Verification: Ensure HOD has permission for this complaint (Faculty-level check)
    if (!await verifyHODScope(adminId, (req as any).user?.roleName, parseInt(id))) {
      return res.status(403).json({ status: 'error', message: 'Forbidden: You do not have permission to manage complaints outside your Faculty.' });
    }

    // Verify staffId exists and has Staff or Admin role
    const [staff]: any = await db.query(
      `SELECT u.id, u.first_name, u.last_name, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ? AND r.name IN ('Staff', 'Admin')`,
      [staffId]
    );

    if (staff.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid staff member selected' });
    }

    await db.query(
      'UPDATE complaints SET assigned_staff_id = ?, status = ? WHERE id = ?',
      [staffId, 'Under Review', id]
    );

    // Add to timeline
    await db.query(
      `INSERT INTO complaint_status_history (complaint_id, status, changed_by_user_id, remarks)
       VALUES (?, 'Under Review', ?, ?)`,
      [id, adminId, `Complaint assigned to ${staff[0].first_name} ${staff[0].last_name}`]
    );

    // Notify the assigned staff
    await NotificationService.notifyAssignment(parseInt(id), staffId);

    // Notify the student about assignment (implicitly through status change)
    await NotificationService.notifyStatusChange(parseInt(id), 'Under Review', `Complaint has been assigned to ${staff[0].first_name} ${staff[0].last_name}`);

    res.json({ status: 'success', message: 'Staff assigned successfully' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get all staff members for assignment (Within HOD's Faculty)
export const getStaffMembers = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const roleName = (req as any).user?.roleName;

  try {
    let query = `SELECT u.id, u.first_name, u.last_name, u.email, r.name as role_name 
                 FROM users u 
                 JOIN roles r ON u.role_id = r.id 
                 JOIN staff s ON u.id = s.user_id
                 WHERE r.name IN ('Staff', 'Admin') AND u.is_active = 1`;
    const params: any[] = [];

    if (roleName === 'Admin') {
      const facultyId = await getHODFacultyId(userId);
      if (facultyId) {
        query += ' AND s.department_id IN (SELECT id FROM departments WHERE faculty_id = ?)';
        params.push(facultyId);
      }
    }

    query += ' ORDER BY u.first_name';
    const [rows]: any = await db.query(query, params);
    res.json({ status: 'success', data: rows });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};


// @desc    Update complaint status (Admin/Staff)
export const updateStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, remarks } = req.body;
  const userId = (req as any).user?.userId;

  if (!status || !remarks) {
    return res.status(400).json({ status: 'error', message: 'Status and remarks are required' });
  }

  try {
    // 0. Scope Verification: Ensure HOD has permission for this complaint (Faculty-level check)
    if (!await verifyHODScope(userId, (req as any).user?.roleName, parseInt(id))) {
      return res.status(403).json({ status: 'error', message: 'Forbidden: You do not have permission to manage complaints outside your Faculty.' });
    }

    await db.query(
      'UPDATE complaints SET status = ? WHERE id = ?',
      [status, id]
    );

    await db.query(
      `INSERT INTO complaint_status_history (complaint_id, status, changed_by_user_id, remarks)
       VALUES (?, ?, ?, ?)`,
      [id, status, userId, remarks]
    );

    // Notify student of status update
    await NotificationService.notifyStatusChange(parseInt(id), status, remarks);

    res.json({ status: 'success', message: 'Status updated successfully' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get Admin/Staff Dashboard Stats
export const getAdminStats = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const roleName = (req as any).user?.roleName;
  const isStaff = roleName === 'Staff';

  try {
    let statsQuery = '';
    let statusQuery = '';
    let categoryQuery = '';
    let slaQuery = '';
    let params: any[] = [];

    const hodFacultyId = roleName === 'Admin' ? await getHODFacultyId(userId) : null;
    const isRestricted = roleName === 'Staff' || roleName === 'Department Officer' || hodFacultyId !== null;

    if (roleName === 'Staff' || roleName === 'Department Officer' || hodFacultyId) {
      const filterSQL = roleName === 'Staff' 
        ? 'assigned_staff_id = ?' 
        : (hodFacultyId 
            ? 'department_id IN (SELECT id FROM departments WHERE faculty_id = ?)' 
            : 'department_id = (SELECT department_id FROM staff WHERE user_id = ?)');
      const filterParam = hodFacultyId || userId;
      
      statsQuery = `SELECT COUNT(*) as count FROM complaints WHERE ${filterSQL}`;
      statusQuery = `SELECT status, COUNT(*) as count FROM complaints WHERE ${filterSQL} GROUP BY status`;
      categoryQuery = `SELECT cc.name as category, COUNT(c.id) as count FROM complaint_categories cc LEFT JOIN complaints c ON cc.id = c.category_id AND c.${filterSQL} GROUP BY cc.name`;
      slaQuery = `SELECT 
                    SUM(CASE WHEN status NOT IN ('Resolved', 'Closed', 'Rejected') AND TIMESTAMPDIFF(HOUR, created_at, NOW()) > CASE priority WHEN 'Critical' THEN 24 WHEN 'High' THEN 48 WHEN 'Medium' THEN 72 WHEN 'Low' THEN 120 ELSE 72 END THEN 1 ELSE 0 END) as breached,
                    SUM(CASE WHEN status NOT IN ('Resolved', 'Closed', 'Rejected') AND TIMESTAMPDIFF(HOUR, created_at, NOW()) <= CASE priority WHEN 'Critical' THEN 24 WHEN 'High' THEN 48 WHEN 'Medium' THEN 72 WHEN 'Low' THEN 120 ELSE 72 END THEN 1 ELSE 0 END) as onTrack
                  FROM complaints WHERE ${filterSQL}`;
      params = [filterParam];
    } else {
      statsQuery = 'SELECT COUNT(*) as count FROM complaints';
      statusQuery = 'SELECT status, COUNT(*) as count FROM complaints GROUP BY status';
      categoryQuery = `SELECT cc.name as category, COUNT(c.id) as count FROM complaint_categories cc LEFT JOIN complaints c ON cc.id = c.category_id GROUP BY cc.name`;
      slaQuery = `SELECT 
                    SUM(CASE WHEN status NOT IN ('Resolved', 'Closed', 'Rejected') AND TIMESTAMPDIFF(HOUR, created_at, NOW()) > CASE priority WHEN 'Critical' THEN 24 WHEN 'High' THEN 48 WHEN 'Medium' THEN 72 WHEN 'Low' THEN 120 ELSE 72 END THEN 1 ELSE 0 END) as breached,
                    SUM(CASE WHEN status NOT IN ('Resolved', 'Closed', 'Rejected') AND TIMESTAMPDIFF(HOUR, created_at, NOW()) <= CASE priority WHEN 'Critical' THEN 24 WHEN 'High' THEN 48 WHEN 'Medium' THEN 72 WHEN 'Low' THEN 120 ELSE 72 END THEN 1 ELSE 0 END) as onTrack
                  FROM complaints`;
    }

    const [total]: any = await db.query(statsQuery, params);
    const [byStatus]: any = await db.query(statusQuery, params);
    const [byCategory]: any = await db.query(categoryQuery, params);
    const [slaMetrics]: any = await db.query(slaQuery, params);
    const [users]: any = await db.query('SELECT COUNT(*) as count FROM users');
    
    // Recent activity
    let activityQuery = `SELECT csh.*, c.reference_number, u.first_name, u.last_name 
                         FROM complaint_status_history csh
                         JOIN complaints c ON csh.complaint_id = c.id
                         JOIN users u ON csh.changed_by_user_id = u.id `;
    
    if (roleName === 'Staff') activityQuery += 'WHERE c.assigned_staff_id = ? OR csh.changed_by_user_id = ? ';
    else if (isRestricted) {
      if (hodFacultyId) activityQuery += 'WHERE (c.department_id IN (SELECT id FROM departments WHERE faculty_id = ?) OR csh.changed_by_user_id = ?) ';
      else activityQuery += 'WHERE (c.department_id = (SELECT department_id FROM staff WHERE user_id = ?) OR csh.changed_by_user_id = ?) ';
    }
   
    activityQuery += 'ORDER BY csh.changed_at DESC LIMIT 15';
    
    const [recent]: any = await db.query(activityQuery, (roleName === 'Staff' || isRestricted) ? [params[0], userId] : []);

    let urgentCases: any[] = [];
    if (roleName === 'Staff' || isRestricted) {
      let uQuery = `SELECT id, reference_number, title, priority, status, created_at FROM complaints WHERE status NOT IN ('Resolved', 'Closed', 'Rejected') AND (priority IN ('High', 'Critical') OR created_at < DATE_SUB(NOW(), INTERVAL 72 HOUR))`;
       if (roleName === 'Staff') uQuery += ' AND assigned_staff_id = ?';
       else if (hodFacultyId) uQuery += ' AND department_id IN (SELECT id FROM departments WHERE faculty_id = ?)';
       else uQuery += ' AND department_id = (SELECT department_id FROM staff WHERE user_id = ?)';
       uQuery += ' ORDER BY priority DESC, created_at ASC LIMIT 5';
      const [rows]: any = await db.query(uQuery, [params[0]]);
      urgentCases = rows;
    }

    let recentFeedback: any[] = [];
    if (roleName === 'Staff' || isRestricted) {
      let fQuery = `SELECT f.*, c.reference_number, u.first_name, u.last_name, u.email FROM feedback f JOIN complaints c ON f.complaint_id = c.id JOIN students s ON f.student_id = s.id JOIN users u ON s.user_id = u.id`;
      if (roleName === 'Staff') fQuery += ' WHERE c.assigned_staff_id = ?';
      else if (hodFacultyId) fQuery += ' WHERE c.department_id IN (SELECT id FROM departments WHERE faculty_id = ?)';
      else fQuery += ' WHERE c.department_id = (SELECT department_id FROM staff WHERE user_id = ?)';
      fQuery += ' ORDER BY f.created_at DESC LIMIT 3';
      const [fRows]: any = await db.query(fQuery, [params[0]]);
      recentFeedback = fRows;
    }

    res.json({
      status: 'success',
      data: {
        total: total[0].count,
        byStatus,
        byCategory,
        slaMetrics: slaMetrics[0] ? slaMetrics[0] : { breached: 0, onTrack: 0 },
        totalUsers: users[0].count,
        recentActivity: recent,
        urgentCases,
        recentFeedback,
        isStaffSpecific: isStaff
      }
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Add internal note to a complaint
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

// @desc    Get internal notes for a complaint
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

// @desc    Get all users with detailed info (Admin only)
export const getAllUsers = async (req: Request, res: Response) => {
  const { role, search, status, page = '1', limit = '20' } = req.query as any;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (role) { where += ' AND r.name = ?'; params.push(role); }
    if (status) { where += ' AND u.is_active = ?'; params.push(status === 'active' ? 1 : 0); }
    if (search) { 
      where += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)'; 
      params.push(`%${search}%`, `%${search}%`, `%${search}%`); 
    }

    const [countRows]: any = await db.query(
      `SELECT COUNT(*) as total FROM users u JOIN roles r ON u.role_id = r.id ${where}`, 
      params
    );
    const total = countRows[0].total;

    const [rows]: any = await db.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.is_active, u.created_at,
              r.name as role_name,
              CASE 
                WHEN r.name = 'Student' THEN (SELECT d.name FROM students s JOIN departments d ON s.department_id = d.id WHERE s.user_id = u.id)
                WHEN r.name = 'Staff' THEN (SELECT d.name FROM staff st JOIN departments d ON st.department_id = d.id WHERE st.user_id = u.id)
                ELSE NULL
              END as department_name,
              CASE 
                WHEN r.name = 'Student' THEN (SELECT s.student_number FROM students s WHERE s.user_id = u.id)
                WHEN r.name = 'Staff' THEN (SELECT st.staff_number FROM staff st WHERE st.user_id = u.id)
                ELSE NULL
              END as id_number
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

// @desc    Create a new user (Staff/Admin/Student)
export const createUser = async (req: Request, res: Response) => {
  const { roleName, firstName, lastName, email, password, idNumber, departmentId } = req.body;
  const adminId = (req as any).user?.userId;

  try {
    // 1. Get role ID
    const [roles]: any = await db.query('SELECT id FROM roles WHERE name = ?', [roleName]);
    if (roles.length === 0) return res.status(400).json({ status: 'error', message: 'Invalid role' });
    const roleId = roles[0].id;

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Create User record
    const [userResult]: any = await db.query(
      'INSERT INTO users (role_id, first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?, ?)',
      [roleId, firstName, lastName, email, passwordHash]
    );
    const userId = userResult.insertId;

    // 4. Role-specific record
    if (roleName === 'Student' && idNumber && departmentId) {
      await db.query('INSERT INTO students (user_id, student_number, department_id) VALUES (?, ?, ?)', [userId, idNumber, departmentId]);
    } else if (roleName === 'Staff' && idNumber && departmentId) {
      await db.query('INSERT INTO staff (user_id, staff_number, department_id) VALUES (?, ?, ?)', [userId, idNumber, departmentId]);
    }

    // 5. Log audit
    await db.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [adminId, 'CREATE_USER', `Created ${roleName}: ${firstName} ${lastName} (${email})`]
    );

    res.json({ status: 'success', message: `${roleName} created successfully`, userId });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Update an existing user
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { firstName, lastName, email, roleName, idNumber, departmentId } = req.body;
  const adminId = (req as any).user?.userId;

  try {
    // 1. Get role ID
    const [roles]: any = await db.query('SELECT id FROM roles WHERE name = ?', [roleName]);
    if (roles.length === 0) return res.status(400).json({ status: 'error', message: 'Invalid role' });
    const roleId = roles[0].id;

    // 2. Update User record
    await db.query(
      'UPDATE users SET role_id = ?, first_name = ?, last_name = ?, email = ? WHERE id = ?',
      [roleId, firstName, lastName, email, id]
    );

    // 3. Update Role-specific record
    if (roleName === 'Student' && idNumber && departmentId) {
      await db.query(
        'INSERT INTO students (user_id, student_number, department_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE student_number = ?, department_id = ?',
        [id, idNumber, departmentId, idNumber, departmentId]
      );
    } else if (roleName === 'Staff' && idNumber && departmentId) {
      await db.query(
        'INSERT INTO staff (user_id, staff_number, department_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE staff_number = ?, department_id = ?',
        [id, idNumber, departmentId, idNumber, departmentId]
      );
    }

    // 4. Log audit
    await db.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [adminId, 'UPDATE_USER', `Updated user: ${firstName} ${lastName} (${email})`]
    );

    res.json({ status: 'success', message: 'User updated successfully' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get system settings
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

// @desc    Update system settings (Bulk)
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

// @desc    Get Audit Logs
export const getAuditLogs = async (req: Request, res: Response) => {
  const { page = '1', limit = '50' } = req.query as any;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [countRows]: any = await db.query('SELECT COUNT(*) as total FROM audit_logs');
    const total = countRows[0].total;

    const [rows]: any = await db.query(
      `SELECT al.*, u.first_name, u.last_name, r.name as role_name
       FROM audit_logs al
       JOIN users u ON al.user_id = u.id
       JOIN roles r ON u.role_id = r.id
       ORDER BY al.created_at DESC LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );

    res.json({ status: 'success', data: rows, total });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Manage Organizational Structure (Faculties/Departments/Categories)
export const manageOrg = {
  getFaculties: async (req: Request, res: Response) => {
    try {
      const [rows]: any = await db.query('SELECT * FROM faculties ORDER BY name');
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
    try {
      const [rows]: any = await db.query('SELECT d.*, f.name as faculty_name FROM departments d JOIN faculties f ON d.faculty_id = f.id ORDER BY f.name, d.name');
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
  }
};

// @desc    Toggle user active status
export const toggleUserStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const userId = (req as any).user?.userId;

  try {
    // 0. Scope Verification: Ensure HOD has permission for this complaint (Faculty-level check)
    if (!await verifyHODScope(userId, (req as any).user?.roleName, parseInt(id))) {
      return res.status(403).json({ status: 'error', message: 'Forbidden: You do not have permission to manage complaints outside your Faculty.' });
    }

    await db.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
    res.json({ status: 'success', message: `User ${isActive ? 'activated' : 'suspended'} successfully` });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get all feedback with complaint details
export const getFeedback = async (req: Request, res: Response) => {
  const { page = '1', limit = '20' } = req.query as any;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [countRows]: any = await db.query('SELECT COUNT(*) as total FROM feedback');
    const total = countRows[0].total;

    const [rows]: any = await db.query(
      `SELECT f.*, c.reference_number, c.title as complaint_title, 
              u.first_name, u.last_name, u.email
       FROM feedback f
       JOIN complaints c ON f.complaint_id = c.id
       JOIN students s ON f.student_id = s.id
       JOIN users u ON s.user_id = u.id
       ORDER BY f.created_at DESC LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );

    res.json({ status: 'success', data: rows, total });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get feedback summary stats
export const getFeedbackStats = async (req: Request, res: Response) => {
  try {
    const [avg]: any = await db.query('SELECT AVG(rating) as averageRating, COUNT(*) as totalFeedback FROM feedback');
    const [distribution]: any = await db.query('SELECT rating, COUNT(*) as count FROM feedback GROUP BY rating ORDER BY rating DESC');
    
    res.json({ 
      status: 'success', 
      data: {
        averageRating: parseFloat(avg[0].averageRating || 0).toFixed(1),
        totalFeedback: avg[0].totalFeedback,
        distribution
      } 
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get detailed analytical reports
export const getDetailedReports = async (req: Request, res: Response) => {
  try {
    // 1. Distribution by Category
    const [byCategory]: any = await db.query(
      `SELECT cc.name as name, COUNT(c.id) as value 
       FROM complaint_categories cc 
       LEFT JOIN complaints c ON cc.id = c.category_id 
       GROUP BY cc.name`
    );

    // 2. Distribution by Status
    const [byStatus]: any = await db.query(
      `SELECT status as name, COUNT(*) as value FROM complaints GROUP BY status`
    );

    // 3. Trend analysis (Monthly volume for last 12 months)
    const [trends]: any = await db.query(
      `SELECT DATE_FORMAT(created_at, '%b %Y') as month, COUNT(*) as count 
       FROM complaints 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY month ORDER BY MIN(created_at)`
    );

    // 4. Resolution Efficiency (Avg hours to resolve)
    const [resolutionTime]: any = await db.query(
      `SELECT cc.name as category, 
              ROUND(AVG(TIMESTAMPDIFF(HOUR, c.created_at, c.updated_at)), 1) as avgHours
       FROM complaints c
       JOIN complaint_categories cc ON c.category_id = cc.id
       WHERE c.status IN ('Resolved', 'Closed')
       GROUP BY cc.name`
    );

    // 5. Top Resolution Actions
    const [topActions]: any = await db.query(
      `SELECT remarks as action, COUNT(*) as count 
       FROM complaint_status_history 
       WHERE status = 'Resolved' 
       GROUP BY remarks 
       ORDER BY count DESC 
       LIMIT 5`
    );

    res.json({
      status: 'success',
      data: {
        byCategory,
        byStatus,
        trends,
        resolutionTime,
        topActions
      }
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Export complaints as CSV
export const exportComplaintsCsv = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await db.query(
      `SELECT c.reference_number, c.title, c.status, c.priority, 
              cc.name as category, u.first_name as student_first, u.last_name as student_last,
              c.created_at
       FROM complaints c
       JOIN complaint_categories cc ON c.category_id = cc.id
       JOIN students s ON c.student_id = s.id
       JOIN users u ON s.user_id = u.id
       ORDER BY c.created_at DESC`
    );

    let csv = 'Reference,Title,Status,Priority,Category,Student,Date\n';
    rows.forEach((r: any) => {
      csv += `"${r.reference_number}","${r.title.replace(/"/g, '""')}","${r.status}","${r.priority}","${r.category}","${r.student_first} ${r.student_last}","${r.created_at.toISOString()}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=complaints_report_all.csv');
    res.status(200).send(csv);
  } catch (err: any) {
  }
};

// HELPER: Get the Faculty ID for an HOD (Admin assigned to a department)
const getHODFacultyId = async (userId: number): Promise<number | null> => {
  const [rows]: any = await db.query(
    `SELECT d.faculty_id 
     FROM staff s 
     JOIN departments d ON s.department_id = d.id 
     WHERE s.user_id = ?`, 
    [userId]
  );
  return rows.length > 0 ? rows[0].faculty_id : null;
};

// HELPER: Verify if an HOD has permission to manage a specific complaint (within their Faculty)
const verifyHODScope = async (userId: number, roleName: string, complaintId: number): Promise<boolean> => {
  if (roleName !== 'Admin') return true; // Global admin (no staff record) or Staff handled by other logic
  
  const facultyId = await getHODFacultyId(userId);
  if (!facultyId) return true; // Global Admin (not assigned to a department)
  
  const [rows]: any = await db.query(
    `SELECT 1 FROM complaints c 
     JOIN departments d ON c.department_id = d.id 
     WHERE c.id = ? AND d.faculty_id = ?`, 
    [complaintId, facultyId]
  );
  return rows.length > 0;
};
