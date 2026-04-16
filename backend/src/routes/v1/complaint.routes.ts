import { Router } from 'express';
import { 
  submitComplaint, 
  getMyComplaints, 
  getComplaintById, 
  getStudentStats,
  getCategories,
  submitFeedback,
  getNotifications,
  markNotificationAsRead
} from '../../controllers/complaint.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { upload } from '../../middlewares/upload.middleware';

const router = Router();

// Public/Common routes (Auth required for categories too for security)
router.get('/categories', requireAuth, getCategories);

// Student routes
router.post('/', requireAuth, requireRole(['Student']), upload.array('attachments', 5), submitComplaint);
router.get('/', requireAuth, requireRole(['Student']), getMyComplaints);
router.get('/stats', requireAuth, requireRole(['Student']), getStudentStats);
router.get('/notifications', requireAuth, getNotifications);
router.patch('/notifications/:id/read', requireAuth, markNotificationAsRead);
router.get('/:id', requireAuth, requireRole(['Student']), getComplaintById);
router.post('/:id/feedback', requireAuth, requireRole(['Student']), submitFeedback);

export default router;
