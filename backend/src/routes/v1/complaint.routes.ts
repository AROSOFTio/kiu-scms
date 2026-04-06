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
import { requireAuth } from '../../middlewares/auth.middleware';
import { upload } from '../../middlewares/upload.middleware';

const router = Router();

// Public/Common routes (Auth required for categories too for security)
router.get('/categories', requireAuth, getCategories);

// Student routes
router.post('/', requireAuth, upload.array('attachments', 5), submitComplaint);
router.get('/', requireAuth, getMyComplaints);
router.get('/stats', requireAuth, getStudentStats);
router.get('/notifications', requireAuth, getNotifications);
router.patch('/notifications/:id/read', requireAuth, markNotificationAsRead);
router.get('/:id', requireAuth, getComplaintById);
router.post('/:id/feedback', requireAuth, submitFeedback);

export default router;
