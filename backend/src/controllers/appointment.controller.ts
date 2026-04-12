import { Request, Response } from 'express';
import { db } from '../config/database';

// @desc    Get HOD availability
// @route   GET /api/v1/appointments/availability/:hodId
export const getHODAvailability = async (req: Request, res: Response) => {
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
    try {
        const [hods]: any = await db.query(
            'SELECT users.id, users.first_name, users.last_name, roles.name as role_name FROM users JOIN roles ON users.role_id = roles.id WHERE roles.name = "Admin"'
        );
        res.json({ status: 'success', data: hods });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
}
