import { Request, Response } from 'express';
import { db } from '../config/database';

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

// @desc    Book an appointment
// @route   POST /api/v1/appointments
export const bookAppointment = async (req: Request, res: Response) => {
  await ensureTablesExist();
  const studentId = (req as any).user.userId;
  const { hodId, date, timeSlot, reason } = req.body;

  try {
    // Check if slot is already taken
    const [existing]: any = await db.query(
      'SELECT id FROM appointments WHERE hod_id = ? AND appointment_date = ? AND time_slot = ? AND status NOT IN ("Cancelled", "Rejected")',
      [hodId, date, timeSlot]
    );

    if (existing.length > 0) {
      return res.status(400).json({ status: 'error', message: 'This time slot is already booked' });
    }

    // SCOPE CHECK: Ensure student is booking with an HOD in their own Faculty
    const [sc]: any = await db.query(
      `SELECT (SELECT d.faculty_id FROM students s JOIN departments d ON s.department_id = d.id WHERE s.user_id = ?) as studentFaculty,
              (SELECT d.faculty_id FROM staff st JOIN departments d ON st.department_id = d.id WHERE st.user_id = ?) as hodFaculty`,
      [studentId, hodId]
    );
    
    if (sc.length > 0 && sc[0].studentFaculty && sc[0].hodFaculty && sc[0].studentFaculty !== sc[0].hodFaculty) {
      return res.status(403).json({ status: 'error', message: 'Forbidden: You can only book appointments with HODs in your own Faculty' });
    }

    await db.query(
      'INSERT INTO appointments (student_id, hod_id, appointment_date, time_slot, reason) VALUES (?, ?, ?, ?, ?)',
      [studentId, hodId, date, timeSlot, reason]
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
    let query = '';
    let params: any[] = [];

    // roleId 1 is Admin (HOD)
    if (roleId === 1) { 
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
    try {
        // 1. Get student's faculty
        const [si]: any = await db.query(
            `SELECT d.faculty_id FROM students s JOIN departments d ON s.department_id = d.id WHERE s.user_id = ?`,
            [userId]
        );
        
        let query = `
            SELECT u.id, u.first_name, u.last_name, r.name as role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            JOIN staff s ON u.id = s.user_id
            JOIN departments d ON s.department_id = d.id
            WHERE r.name = "Admin"`;
        const params: any[] = [];

        if (si.length > 0) {
            query += ' AND d.faculty_id = ?';
            params.push(si[0].faculty_id);
        }

        const [hods]: any = await db.query(query, params);
        res.json({ status: 'success', data: hods });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
}
