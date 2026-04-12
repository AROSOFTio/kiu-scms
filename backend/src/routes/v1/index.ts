import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import complaintRoutes from './complaint.routes';
import adminRoutes from './admin.routes';
import appointmentRoutes from './appointment.routes';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  res.json({ message: 'API V1 operates normally' });
});

router.use('/auth', authRoutes);
router.use('/complaints', complaintRoutes);
router.use('/admin', adminRoutes);
router.use('/appointments', appointmentRoutes);

export default router;
