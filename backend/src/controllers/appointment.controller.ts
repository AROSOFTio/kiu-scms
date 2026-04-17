import { Request, Response } from 'express';
import { db } from '../config/database';
import {
    ensureStudentProfile,
    findStudentProfile,
    STUDENT_PROFILE_DEPARTMENT_MESSAGE,
    STUDENT_PROFILE_MISSING_MESSAGE,
} from '../services/student-profile.service';

const getRoleName = async (roleId: number): Promise<string> => {
    const [rows]: any = await db.query('SELECT name FROM roles WHERE id = ?', [roleId]);
    return rows.length > 0 ? rows[0].name : '';
};

const getStaffScope = async (userId: number) => {
    const [rows]: any = await db.query(
        `SELECT s.department_id, d.faculty_id
         FROM staff s
         JOIN departments d ON s.department_id = d.id
         WHERE s.user_id = ?`,
        [userId]
    );
    return rows.length > 0 ? rows[0] : null;
};

// Helper to ensure tables exist (Production self-healing)
const ensureTablesExist = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS hod_availability (
                id INT AUTO_INCREMENT PRIMARY KEY,
                hod_id INT NOT NULL,
                available_date DATE NOT NULL,
                start_time TIME DEFAULT '09:00:00',
                end_time TIME DEFAULT '17:00:00',
                is_available BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY (hod_id, available_date),
                FOREIGN KEY (hod_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS appointments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                hod_id INT NOT NULL,
                appointment_date DATE NOT NULL,
                time_slot VARCHAR(50) NOT NULL,
                reason TEXT NOT NULL,
                status ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rejected') DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (hod_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
    } catch (err) {
        console.error('Migration Check Failed:', err);
    }
};

// @desc    Get HOD availability
// @route   GET /api/v1/appointments/availability/:hodId
export const getHODAvailability = async (req: Request, res: Response) => {
  await ensureTablesExist();
  const { hodId } = req.params;
  try {
    const [availability]: any = await db.query(
      'SELECT available_date, start_time, end_time, is_available FROM hod_availability WHERE hod_id = ? AND is_available = TRUE',
      [hodId]
    );
    // Convert dates to YYYY-MM-DD strings for easier frontend handling
    const formatted = availability.map((a: any) => ({
        ...a,
        available_date: a.available_date.toISOString().split('T')[0]
    }));
    res.json({ status: 'success', data: formatted });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Update HOD availability (Toggle specific date)
// @route   PUT /api/v1/appointments/availability
export const updateHODAvailability = async (req: Request, res: Response) => {
  await ensureTablesExist();
  const hodId = (req as any).user.userId;
  const { date, isAvailable } = req.body; 

  try {
    if (isAvailable) {
      await db.query(
        `INSERT INTO hod_availability (hod_id, available_date, is_available) 
         VALUES (?, ?, TRUE) 
         ON DUPLICATE KEY UPDATE is_available = TRUE`,
        [hodId, date]
      );
    } else {
      await db.query(
        `DELETE FROM hod_availability WHERE hod_id = ? AND available_date = ?`,
        [hodId, date]
      );
    }

    res.json({ status: 'success', message: 'Availability updated successfully' });
  } catch (err: any) {
    console.error('Database Error in updateHODAvailability:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get departments available for student appointments
// @route   GET /api/v1/appointments/departments
export const getStudentDepartments = async (req: Request, res: Response) => {
  await ensureTablesExist();
  const userId = (req as any).user.userId;

  try {
    const scope = await findStudentProfile(userId);

    if (scope.profile) {
      const [departments]: any = await db.query(
        `SELECT d.id, d.name, d.faculty_id,
                CASE WHEN d.id = ? THEN TRUE ELSE FALSE END as is_default
         FROM departments d
         WHERE d.faculty_id = ?
         ORDER BY d.name`,
        [scope.profile.departmentId, scope.profile.facultyId]
      );

      return res.json({
        status: 'success',
        data: {
          facultyId: scope.profile.facultyId,
          defaultDepartmentId: scope.profile.departmentId,
          departments,
          profileLinked: true,
        }
      });
    }

    const [departments]: any = await db.query(
      `SELECT d.id, d.name, d.faculty_id,
              FALSE as is_default
       FROM departments d
       ORDER BY d.name`
    );

    res.json({
      status: 'success',
      data: {
        facultyId: null,
        defaultDepartmentId: null,
        departments,
        profileLinked: false,
        profileMessage:
          scope.status === 'invalid_department'
            ? STUDENT_PROFILE_DEPARTMENT_MESSAGE
            : STUDENT_PROFILE_MISSING_MESSAGE,
      }
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Book an appointment
// @route   POST /api/v1/appointments
export const bookAppointment = async (req: Request, res: Response) => {
  await ensureTablesExist();
  const userId = (req as any).user.userId;
  const { hodId, contactId, departmentId, date, timeSlot, reason } = req.body;

  try {
    const studentScope = await ensureStudentProfile(userId, departmentId);
    if (!studentScope.profile) {
      const statusCode = studentScope.status === 'invalid_department' ? 400 : 403;
      return res.status(statusCode).json({ status: 'error', message: studentScope.message });
    }

    const targetContactId = contactId || hodId;
    if (!targetContactId) {
      return res.status(400).json({ status: 'error', message: 'Appointment contact is required' });
    }

    const [contacts]: any = await db.query(
      `SELECT u.id, d.id as department_id, d.faculty_id
       FROM users u
       JOIN roles r ON u.role_id = r.id
       JOIN staff s ON u.id = s.user_id
       JOIN departments d ON s.department_id = d.id
       WHERE u.id = ? AND r.name IN ('Admin', 'Department Officer', 'Staff')`,
      [targetContactId]
    );

    if (contacts.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Selected contact is not available for appointments' });
    }

    const contact = contacts[0];
    if (contact.faculty_id !== studentScope.profile.facultyId) {
      return res.status(403).json({ status: 'error', message: 'You can only book appointments within your faculty' });
    }

    if (departmentId && Number(departmentId) !== Number(contact.department_id)) {
      return res.status(400).json({ status: 'error', message: 'Selected contact does not belong to the chosen department' });
    }

    // Check if slot is already taken
    const [existing]: any = await db.query(
      'SELECT id FROM appointments WHERE hod_id = ? AND appointment_date = ? AND time_slot = ? AND status NOT IN ("Cancelled", "Rejected")',
      [targetContactId, date, timeSlot]
    );

    if (existing.length > 0) {
      return res.status(400).json({ status: 'error', message: 'This time slot is already booked' });
    }

    await db.query(
      'INSERT INTO appointments (student_id, hod_id, appointment_date, time_slot, reason) VALUES (?, ?, ?, ?, ?)',
      [userId, targetContactId, date, timeSlot, reason]
    );

    res.status(201).json({ status: 'success', message: 'Appointment booked successfully' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Get appointments for current user
// @route   GET /api/v1/appointments
export const getMyAppointments = async (req: Request, res: Response) => {
  await ensureTablesExist();
  const userId = (req as any).user.userId;
  const roleId = (req as any).user.roleId;

  try {
    const roleName = await getRoleName(roleId);
    let query = '';
    let params: any[] = [];

    if (roleName === 'Admin' || roleName === 'Department Officer' || roleName === 'Staff') {
      query = `
        SELECT a.*, u.first_name as student_first_name, u.last_name as student_last_name 
        FROM appointments a 
        JOIN users u ON a.student_id = u.id 
        WHERE a.hod_id = ? 
        ORDER BY a.appointment_date DESC, a.time_slot ASC`;
      params = [userId];
    } else { 
      query = `
        SELECT a.*, u.first_name as hod_first_name, u.last_name as hod_last_name 
        FROM appointments a 
        JOIN users u ON a.hod_id = u.id 
        WHERE a.student_id = ? 
        ORDER BY a.appointment_date DESC, a.time_slot ASC`;
      params = [userId];
    }

    const [appointments]: any = await db.query(query, params);
    
    // Format dates for frontend
    const formatted = appointments.map((a: any) => ({
        ...a,
        appointment_date: a.appointment_date.toISOString().split('T')[0]
    }));

    res.json({ status: 'success', data: formatted });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Update appointment status
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

// @desc    Get all HODs for selection
// @route   GET /api/v1/appointments/hods
export const getHODs = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { departmentId } = req.query as any;
    try {
        const scope = await findStudentProfile(userId);
        const requestedDepartmentId = departmentId ? Number(departmentId) : null;
        const targetDepartmentId = requestedDepartmentId || Number(scope.profile?.departmentId);

        if (!Number.isInteger(targetDepartmentId) || targetDepartmentId <= 0) {
            return res.status(400).json({ status: 'error', message: 'Select a department to view appointment contacts' });
        }

        const [departmentRows]: any = await db.query(
            'SELECT id, faculty_id FROM departments WHERE id = ? LIMIT 1',
            [targetDepartmentId],
        );
        if (departmentRows.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Selected department is invalid' });
        }

        const targetFacultyId = scope.profile?.facultyId ?? departmentRows[0].faculty_id;

        let query = `
            SELECT u.id, u.first_name, u.last_name, r.name as role_name, d.id as department_id, d.name as department_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            JOIN staff s ON u.id = s.user_id
            JOIN departments d ON s.department_id = d.id
            WHERE r.name IN ("Admin", "Department Officer", "Staff")
              AND d.faculty_id = ?
              AND d.id = ?`;
        const params: any[] = [targetFacultyId, targetDepartmentId];

        query += ' ORDER BY CASE WHEN r.name = "Admin" THEN 0 WHEN r.name = "Department Officer" THEN 1 ELSE 2 END, u.first_name';

        const [hods]: any = await db.query(query, params);
        res.json({ status: 'success', data: hods });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
}
