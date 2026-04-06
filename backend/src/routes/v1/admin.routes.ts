import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { 
  getAllComplaints, 
  getAdminStats, 
  getStaffMembers, 
  assignStaff, 
  updateStatus,
  addInternalNote,
  getInternalNotes,
  getAllUsers,
  createUser,
  getSettings,
  updateSettings,
  getAuditLogs,
  manageOrg,
  getFeedback,
  getFeedbackStats,
  getDetailedReports,
  exportComplaintsCsv
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
router.get('/staff', requireAuth, requireRole(['Admin', 'Staff']), getStaffMembers);

// @route   PATCH /api/v1/admin/complaints/:id/assign
// @desc    Assign a complaint to a specific staff member
router.patch('/complaints/:id/assign', requireAuth, requireRole(['Admin', 'Staff']), assignStaff);

// @route   PATCH /api/v1/admin/complaints/:id/status
// @desc    Update complaint status with remarks (Timeline)
router.patch('/complaints/:id/status', requireAuth, requireRole(['Admin', 'Staff']), updateStatus);

// @route   GET /api/v1/admin/users
// @desc    Get all users (Admin only)
router.get('/users', requireAuth, requireRole(['Admin']), getAllUsers);

// @route   POST /api/v1/admin/users
// @desc    Create a new user (Staff/Admin/Student)
router.post('/users', requireAuth, requireRole(['Admin']), createUser);

// @route   GET /api/v1/admin/settings
// @desc    Get system settings
router.get('/settings', requireAuth, requireRole(['Admin', 'Staff']), getSettings);

// @route   PUT /api/v1/admin/settings
// @desc    Update system settings
router.put('/settings', requireAuth, requireRole(['Admin']), updateSettings);

// @route   GET /api/v1/admin/audit-logs
// @desc    Get administrative audit logs
router.get('/audit-logs', requireAuth, requireRole(['Admin']), getAuditLogs);

// Organizational Structure
router.get('/faculties', requireAuth, requireRole(['Admin', 'Staff']), manageOrg.getFaculties);
router.post('/faculties', requireAuth, requireRole(['Admin']), manageOrg.createFaculty);

router.get('/departments', requireAuth, requireRole(['Admin', 'Staff']), manageOrg.getDepartments);
router.post('/departments', requireAuth, requireRole(['Admin']), manageOrg.createDepartment);

router.get('/categories', requireAuth, requireRole(['Admin', 'Staff']), manageOrg.getCategories);
router.post('/categories', requireAuth, requireRole(['Admin']), manageOrg.createCategory);

// Feedback retrieval
router.get('/feedback', requireAuth, requireRole(['Admin', 'Staff']), getFeedback);
router.get('/feedback/stats', requireAuth, requireRole(['Admin', 'Staff']), getFeedbackStats);

// Analytical Reports & Exports
router.get('/reports/analytics', requireAuth, requireRole(['Admin', 'Staff']), getDetailedReports);
router.get('/reports/export', requireAuth, requireRole(['Admin']), exportComplaintsCsv);

export default router;
