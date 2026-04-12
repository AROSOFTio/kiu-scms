import { Request, Response } from 'express';
import { db } from '../config/database';

// @desc    Get HOD availability
// @route   GET /api/v1/appointments/availability/:hodId
export const getHODAvailability = async (req: Request, res: Response) => {
  const { hodId } = req.params;
  try {
    const [availability]: any = await db.query(
      'SELECT day_of_week, start_time, end_time, is_available FROM hod_availability WHERE hod_id = ?',
      [hodId]
    );
    res.json({ status: 'success', data: availability });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// @desc    Update HOD availability
// @route   PUT /api/v1/appointments/availability
export const updateHODAvailability = async (req: Request, res: Response) => {
  const hodId = (req as any).user.userId;
  const { schedules } = req.body; // Array of {day_of_week, start_time, end_time, is_available}

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    for (const schedule of schedules) {
      await connection.query(
        `INSERT INTO hod_availability (hod_id, day_of_week, start_time, end_time, is_available) 
         VALUES (?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE start_time = VALUES(start_time), end_time = VALUES(end_time), is_available = VALUES(is_available)`,
        [hodId, schedule.day_of_week, schedule.start_time, schedule.end_time, schedule.is_available]
      );
    }

    await connection.commit();
    res.json({ status: 'success', message: 'Availability updated successfully' });
  } catch (err: any) {
    await connection.rollback();
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    connection.release();
  }
};

// @desc    Book an appointment
// @route   POST /api/v1/appointments
export const bookAppointment = async (req: Request, res: Response) => {
  const studentId = (req as any).user.userId;
  const { hodId, date, timeSlot, reason } = req.body;

  try {
    // Check if slot is already taken
    const [existing]: any = await db.query(
      'SELECT id FROM appointments WHERE hod_id = ? AND appointment_date = ? AND time_slot = ? AND status NOT IN ("Cancelled")',
      [hodId, date, timeSlot]
    );

    if (existing.length > 0) {
      return res.status(400).json({ status: 'error', message: 'This time slot is already booked' });
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
  const userId = (req as any).user.userId;
  const roleId = (req as any).user.roleId;

  try {
    let query = '';
    let params: any[] = [];

    if (roleId === 1) { // HOD/Admin
      query = `
        SELECT a.*, u.first_name as student_first_name, u.last_name as student_last_name 
        FROM appointments a 
        JOIN users u ON a.student_id = u.id 
        WHERE a.hod_id = ? 
        ORDER BY a.appointment_date DESC, a.time_slot ASC`;
      params = [userId];
    } else { // Student
      query = `
        SELECT a.*, u.first_name as hod_first_name, u.last_name as hod_last_name 
        FROM appointments a 
        JOIN users u ON a.hod_id = u.id 
        WHERE a.student_id = ? 
        ORDER BY a.appointment_date DESC, a.time_slot ASC`;
      params = [userId];
    }

    const [appointments]: any = await db.query(query, params);
    res.json({ status: 'success', data: appointments });
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
    // Only HOD or the Student who booked can change status (with logic checks)
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
    try {
        const [hods]: any = await db.query(
            'SELECT users.id, users.first_name, users.last_name, roles.name as role_name FROM users JOIN roles ON users.role_id = roles.id WHERE roles.name = "Admin"'
        );
        res.json({ status: 'success', data: hods });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
}
