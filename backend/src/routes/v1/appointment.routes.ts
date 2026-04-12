import { Router } from 'express';
import { 
  getHODAvailability, 
  updateHODAvailability, 
  bookAppointment, 
  getMyAppointments, 
  updateAppointmentStatus,
  getHODs
} from '../../controllers/appointment.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/availability/:hodId', getHODAvailability);
router.put('/availability', updateHODAvailability);
router.post('/', bookAppointment);
router.get('/', getMyAppointments);
router.patch('/:id/status', updateAppointmentStatus);
router.get('/hods', getHODs);

export default router;
