import { Request, Response } from 'express';
import { db } from '../config/database';
import {
  ensureStudentProfile,
  findStudentProfile,
} from '../services/student-profile.service';

// Helper: get role name from roleId
const getRoleName = async (roleId: number): Promise<string> => {
  const [rows]: any = await db.query('SELECT name FROM roles WHERE id = ?', [roleId]);
  return rows.length > 0 ? rows[0].name : '';
};

// @desc    Get available dates for a specific HOD
// @route   GET /api/v1/appointments/availability/:hodId
export const getHODAvailability = async (req: Request, res: Response) => {
  const { hodId } = req.params;
  try {
    const [availability]: any = await db.query(
      `SELECT available_date, start_time, end_time, is_available
       FROM hod_availability
       WHERE hod_id = ? AND is_available = TRUE`,
      [hodId]
    );
    const formatted = availability.map((a: any) => ({
      ...a,
      available_date: a.available_date.toISOString().split('T')[0],
    }));
    res.json({ status: 'success', data: formatted });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    HOD updates their own availability
// @route   PUT /api/v1/appointments/availability
export const updateHODAvailability = async (req: Request, res: Response) => {
  const hodId = (req as any).user.userId;
  const { date, isAvailable } = req.body;

  try {
    // Verify caller is actually an HOD
    const roleName = await getRoleName((req as any).user.roleId);
    if (roleName !== 'HOD') {
      return res.status(403).json({ status: 'error', message: 'Only HODs can manage availability' });
    }

    if (isAvailable) {
      await db.query(
        `INSERT INTO hod_availability (hod_id, available_date, is_available)
         VALUES (?, ?, TRUE)
         ON DUPLICATE KEY UPDATE is_available = TRUE`,
        [hodId, date]
      );
    } else {
      await db.query(
        'DELETE FROM hod_availability WHERE hod_id = ? AND available_date = ?',
        [hodId, date]
      );
    }

    res.json({ status: 'success', message: 'Availability updated successfully' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get the student's own department info (for appointment booking)
// @route   GET /api/v1/appointments/departments
export const getStudentDepartments = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  try {
    const scope = await findStudentProfile(userId);

    if (scope.profile) {
      // Return only the student's own department
      const [dept]: any = await db.query(
        `SELECT d.id, d.name, d.faculty_id, f.name AS faculty_name
         FROM departments d
         JOIN faculties f ON d.faculty_id = f.id
         WHERE d.id = ?`,
        [scope.profile.departmentId]
      );

      return res.json({
        status: 'success',
        data: {
          facultyId: scope.profile.facultyId,
          defaultDepartmentId: scope.profile.departmentId,
          departments: dept,
          profileLinked: true,
        },
      });
    }

    // No profile — return all departments as fallback
    const [departments]: any = await db.query(
      `SELECT d.id, d.name, d.faculty_id, f.name AS faculty_name
       FROM departments d
       JOIN faculties f ON d.faculty_id = f.id
       ORDER BY f.name, d.name`
    );

    res.json({
      status: 'success',
      data: {
        facultyId: null,
        defaultDepartmentId: null,
        departments,
        profileLinked: false,
        profileMessage: 'Your student profile is not linked to a department yet.',
      },
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Book an appointment with the departmental HOD
// @route   POST /api/v1/appointments
export const bookAppointment = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { hodId, date, timeSlot, reason } = req.body;

  try {
    // Ensure student profile and resolve department
    const studentScope = await ensureStudentProfile(userId, undefined);
    if (!studentScope.profile) {
      return res.status(403).json({ status: 'error', message: studentScope.message });
    }

    const studentDeptId = studentScope.profile.departmentId;

    // Validate that the target HOD belongs to the student's department
    const [hodRows]: any = await db.query(
      `SELECT u.id, s.department_id, r.name AS role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       JOIN staff s ON u.id = s.user_id
       WHERE u.id = ? AND r.name = 'HOD' AND u.is_active = 1`,
      [hodId]
    );

    if (hodRows.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Selected contact is not an active HOD.',
      });
    }

    const hod = hodRows[0];
    if (hod.department_id !== studentDeptId) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only book appointments with the HOD of your own department.',
      });
    }

    // Check slot availability
    const [existing]: any = await db.query(
      `SELECT id FROM appointments
       WHERE hod_id = ? AND appointment_date = ? AND time_slot = ?
         AND status NOT IN ('Cancelled', 'Rejected')`,
      [hodId, date, timeSlot]
    );

    if (existing.length > 0) {
      return res.status(400).json({ status: 'error', message: 'This time slot is already booked.' });
    }

    await db.query(
      'INSERT INTO appointments (student_id, hod_id, appointment_date, time_slot, reason) VALUES (?, ?, ?, ?, ?)',
      [userId, hodId, date, timeSlot, reason]
    );

    res.status(201).json({ status: 'success', message: 'Appointment booked successfully' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get appointments for current user (role-aware)
// @route   GET /api/v1/appointments
export const getMyAppointments = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const roleId = (req as any).user.roleId;

  try {
    const roleName = await getRoleName(roleId);
    let query = '';
    let params: any[] = [];

    if (roleName === 'HOD') {
      // HOD sees all incoming appointment requests
      query = `
        SELECT a.*,
               u.first_name AS student_first_name, u.last_name AS student_last_name,
               u.email AS student_email
        FROM appointments a
        JOIN users u ON a.student_id = u.id
        WHERE a.hod_id = ?
        ORDER BY a.appointment_date DESC, a.time_slot ASC`;
      params = [userId];
    } else if (roleName === 'Lecturer') {
      // Lecturers don't manage appointments as HOD; return empty
      return res.json({ status: 'success', data: [] });
    } else {
      // Student sees their own appointments
      query = `
        SELECT a.*,
               u.first_name AS hod_first_name, u.last_name AS hod_last_name
        FROM appointments a
        JOIN users u ON a.hod_id = u.id
        WHERE a.student_id = ?
        ORDER BY a.appointment_date DESC, a.time_slot ASC`;
      params = [userId];
    }

    const [appointments]: any = await db.query(query, params);
    const formatted = appointments.map((a: any) => ({
      ...a,
      appointment_date: a.appointment_date.toISOString().split('T')[0],
    }));

    res.json({ status: 'success', data: formatted });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Update appointment status (HOD confirms/rejects; Student cancels)
// @route   PATCH /api/v1/appointments/:id/status
export const updateAppointmentStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = (req as any).user.userId;

  try {
    await db.query(
      'UPDATE appointments SET status = ? WHERE id = ? AND (hod_id = ? OR student_id = ?)',
      [status, id, userId, userId]
    );
    res.json({ status: 'success', message: 'Appointment status updated' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get HOD(s) for student's own department (for booking form)
// @route   GET /api/v1/appointments/hods
export const getHODs = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  try {
    const scope = await findStudentProfile(userId);

    if (!scope.profile) {
      return res.status(400).json({
        status: 'error',
        message: 'Your student profile must be linked to a department before booking appointments.',
      });
    }

    const departmentId = scope.profile.departmentId;

    const [hods]: any = await db.query(
      `SELECT u.id, u.first_name, u.last_name, r.name AS role_name,
              d.id AS department_id, d.name AS department_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       JOIN staff s ON u.id = s.user_id
       JOIN departments d ON s.department_id = d.id
       WHERE r.name = 'HOD' AND s.department_id = ? AND u.is_active = 1
       ORDER BY u.first_name`,
      [departmentId]
    );

    res.json({ status: 'success', data: hods });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
