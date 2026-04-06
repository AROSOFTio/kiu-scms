import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { 
  getAllComplaints, 
  getAdminStats, 
  getStaffMembers, 
  assignStaff, 
  updateStatus 
} from '../../controllers/admin.controller';

const router = Router();

// @route   GET /api/v1/admin/dashboard
// @desc    Get dashboard metrics for administrative overview
router.get('/dashboard', requireAuth, requireRole(['Admin', 'Staff']), getAdminStats);

// @route   GET /api/v1/admin/complaints
// @desc    Get all complaints with pagination/filters (Admin/Staff only)
router.get('/complaints', requireAuth, requireRole(['Admin', 'Staff']), getAllComplaints);

// @route   GET /api/v1/admin/staff
// @desc    Get all active staff members for assignment
router.get('/staff', requireAuth, requireRole(['Admin']), getStaffMembers);

// @route   PATCH /api/v1/admin/complaints/:id/assign
// @desc    Assign a complaint to a specific staff member
router.patch('/complaints/:id/assign', requireAuth, requireRole(['Admin']), assignStaff);

// @route   PATCH /api/v1/admin/complaints/:id/status
// @desc    Update complaint status with remarks (Timeline)
router.patch('/complaints/:id/status', requireAuth, requireRole(['Admin', 'Staff']), updateStatus);

export default router;
