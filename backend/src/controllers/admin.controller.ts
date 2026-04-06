import { Request, Response } from 'express';
import { db } from '../config/database';

// @desc    Get all complaints (Admin/Staff only)
export const getAllComplaints = async (req: Request, res: Response) => {
  const { status, category, search, priority, page = '1', limit = '10' } = req.query as any;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (status) { where += ' AND c.status = ?'; params.push(status); }
    if (category) { where += ' AND c.category_id = ?'; params.push(category); }
    if (priority) { where += ' AND c.priority = ?'; params.push(priority); }
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
              su.first_name as staff_first_name, su.last_name as staff_last_name
       FROM complaints c
       JOIN complaint_categories cc ON c.category_id = cc.id
       JOIN students s ON c.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN users su ON c.assigned_staff_id = su.id
       ${where}
       ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({ status: 'success', data: rows, total, page: parseInt(page), limit: parseInt(limit) });
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

    res.json({ status: 'success', message: 'Staff assigned successfully' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get all staff members for assignment
export const getStaffMembers = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await db.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE r.name IN ('Staff', 'Admin') AND u.is_active = 1
       ORDER BY u.first_name`
    );
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
    await db.query(
      'UPDATE complaints SET status = ? WHERE id = ?',
      [status, id]
    );

    await db.query(
      `INSERT INTO complaint_status_history (complaint_id, status, changed_by_user_id, remarks)
       VALUES (?, ?, ?, ?)`,
      [id, status, userId, remarks]
    );

    res.json({ status: 'success', message: 'Status updated successfully' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get Admin Dashboard Stats
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const [total]: any = await db.query('SELECT COUNT(*) as count FROM complaints');
    const [byStatus]: any = await db.query('SELECT status, COUNT(*) as count FROM complaints GROUP BY status');
    const [byCategory]: any = await db.query(
      `SELECT cc.name as category, COUNT(c.id) as count 
       FROM complaint_categories cc 
       LEFT JOIN complaints c ON cc.id = c.category_id 
       GROUP BY cc.name`
    );
    const [users]: any = await db.query('SELECT COUNT(*) as count FROM users');
    
    // Recent activity (last 5 status changes)
    const [recent]: any = await db.query(
      `SELECT csh.*, c.reference_number, u.first_name, u.last_name 
       FROM complaint_status_history csh
       JOIN complaints c ON csh.complaint_id = c.id
       JOIN users u ON csh.changed_by_user_id = u.id
       ORDER BY csh.changed_at DESC LIMIT 5`
    );

    res.json({
      status: 'success',
      data: {
        total: total[0].count,
        byStatus,
        byCategory,
        totalUsers: users[0].count,
        recentActivity: recent
      }
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get all users (Admin only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await db.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.is_active, u.created_at,
              r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC`
    );
    res.json({ status: 'success', data: rows });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Toggle user active status
export const toggleUserStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    await db.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
    res.json({ status: 'success', message: `User ${isActive ? 'activated' : 'suspended'} successfully` });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
