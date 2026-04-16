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

router.get('/availability/:hodId', getHODAvailability);
router.get('/departments', requireRole(['Student']), getStudentDepartments);
router.get('/hods', requireRole(['Student']), getHODs);
router.put('/availability', requireRole(['Admin', 'Staff', 'Department Officer']), updateHODAvailability);
router.post('/', requireRole(['Student']), bookAppointment);
router.get('/', getMyAppointments);
router.patch('/:id/status', updateAppointmentStatus);

export default router;
