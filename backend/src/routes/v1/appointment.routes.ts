import { Router } from 'express';
import { 
  getStudentDepartments,
  getHODAvailability, 
  updateHODAvailability, 
  bookAppointment, 
  getMyAppointments, 
  updateAppointmentStatus,
  getHODs
} from '../../controllers/appointment.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/availability/:hodId', requireRole(['HOD', 'Student']), getHODAvailability);
router.get('/departments', requireRole(['Student']), getStudentDepartments);
router.get('/hods', requireRole(['Student']), getHODs);
router.put('/availability', requireRole(['HOD']), updateHODAvailability);
router.post('/', requireRole(['Student']), bookAppointment);
router.get('/', requireRole(['HOD', 'Lecturer', 'Student']), getMyAppointments);
router.patch('/:id/status', requireRole(['HOD', 'Student']), updateAppointmentStatus);

export default router;
