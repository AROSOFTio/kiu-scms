import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import {
  getAllComplaints,
  getAdminStats,
  getStaffMembers,
  assignStaff,
  routeComplaint,
  updateStatus,
  addInternalNote,
  getInternalNotes,
  getAllUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  getSettings,
  updateSettings,
  getAuditLogs,
  manageOrg,
  getFeedback,
  getFeedbackStats,
  getDetailedReports,
  exportComplaintsCsv,
  getComplaintById,
} from '../../controllers/admin.controller';

const router = Router();

/**
 * Role definitions used throughout admin routes:
 *   FULL_ADMIN  — can do everything (HOD-level + SuperAdmin oversight)
 *   STAFF_READ  — all staff roles that can at least read/view
 *   Lecturer    — has limited write access only on assigned complaints
 */
const FULL_ADMIN  = ['HOD', 'SuperAdmin'] as const;
const STAFF_READ  = ['HOD', 'SuperAdmin', 'Lecturer'] as const;

// ---------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------
// @route   GET /api/v1/admin/dashboard
router.get('/dashboard',
  requireAuth, requireRole([...STAFF_READ]),
  getAdminStats
);

// ---------------------------------------------------------------
// Complaints
// ---------------------------------------------------------------
// @route   GET /api/v1/admin/complaints
router.get('/complaints',
  requireAuth, requireRole([...STAFF_READ]),
  getAllComplaints
);

// @route   GET /api/v1/admin/complaints/:id
router.get('/complaints/:id',
  requireAuth, requireRole([...STAFF_READ]),
  getComplaintById
);

// @route   PATCH /api/v1/admin/complaints/:id/assign   — HOD / SuperAdmin only
router.patch('/complaints/:id/assign',
  requireAuth, requireRole([...FULL_ADMIN]),
  assignStaff
);

// @route   PATCH /api/v1/admin/complaints/:id/route    — HOD / SuperAdmin only
router.patch('/complaints/:id/route',
  requireAuth, requireRole([...FULL_ADMIN]),
  routeComplaint
);

// @route   PATCH /api/v1/admin/complaints/:id/status   — HOD / SuperAdmin / Lecturer
router.patch('/complaints/:id/status',
  requireAuth, requireRole([...STAFF_READ]),
  updateStatus
);

// @route   POST /api/v1/admin/complaints/:id/notes
router.post('/complaints/:id/notes',
  requireAuth, requireRole([...STAFF_READ]),
  addInternalNote
);

// @route   GET /api/v1/admin/complaints/:id/notes
router.get('/complaints/:id/notes',
  requireAuth, requireRole([...STAFF_READ]),
  getInternalNotes
);

// ---------------------------------------------------------------
// Lecturer list for assignment
// ---------------------------------------------------------------
// @route   GET /api/v1/admin/staff
router.get('/staff',
  requireAuth, requireRole([...STAFF_READ]),
  getStaffMembers
);

// ---------------------------------------------------------------
// User Management — HOD / SuperAdmin only
// ---------------------------------------------------------------
// @route   GET /api/v1/admin/users
router.get('/users',
  requireAuth, requireRole([...FULL_ADMIN]),
  getAllUsers
);

// @route   POST /api/v1/admin/users
router.post('/users',
  requireAuth, requireRole([...FULL_ADMIN]),
  createUser
);

// @route   PUT /api/v1/admin/users/:id
router.put('/users/:id',
  requireAuth, requireRole([...FULL_ADMIN]),
  updateUser
);

// @route   PATCH /api/v1/admin/users/:id/status
router.patch('/users/:id/status',
  requireAuth, requireRole([...FULL_ADMIN]),
  toggleUserStatus
);

// ---------------------------------------------------------------
// Settings
// ---------------------------------------------------------------
router.get('/settings',
  requireAuth, requireRole([...STAFF_READ]),
  getSettings
);

router.put('/settings',
  requireAuth, requireRole([...FULL_ADMIN]),
  updateSettings
);

// ---------------------------------------------------------------
// Audit Logs — HOD / SuperAdmin only
// ---------------------------------------------------------------
router.get('/audit-logs',
  requireAuth, requireRole([...FULL_ADMIN]),
  getAuditLogs
);

// ---------------------------------------------------------------
// Organizational Structure
// ---------------------------------------------------------------
router.get('/faculties',
  requireAuth, requireRole([...STAFF_READ]),
  manageOrg.getFaculties
);
router.post('/faculties',
  requireAuth, requireRole([...FULL_ADMIN]),
  manageOrg.createFaculty
);
router.put('/faculties/:id',
  requireAuth, requireRole([...FULL_ADMIN]),
  manageOrg.updateFaculty
);
router.delete('/faculties/:id',
  requireAuth, requireRole([...FULL_ADMIN]),
  manageOrg.deleteFaculty
);

router.get('/departments',
  requireAuth, requireRole([...STAFF_READ]),
  manageOrg.getDepartments
);
router.post('/departments',
  requireAuth, requireRole([...FULL_ADMIN]),
  manageOrg.createDepartment
);
router.put('/departments/:id',
  requireAuth, requireRole([...FULL_ADMIN]),
  manageOrg.updateDepartment
);
router.delete('/departments/:id',
  requireAuth, requireRole([...FULL_ADMIN]),
  manageOrg.deleteDepartment
);

router.get('/categories',
  requireAuth, requireRole([...STAFF_READ]),
  manageOrg.getCategories
);
router.post('/categories',
  requireAuth, requireRole([...FULL_ADMIN]),
  manageOrg.createCategory
);
router.put('/categories/:id',
  requireAuth, requireRole([...FULL_ADMIN]),
  manageOrg.updateCategory
);
router.delete('/categories/:id',
  requireAuth, requireRole([...FULL_ADMIN]),
  manageOrg.deleteCategory
);

// ---------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------
router.get('/feedback',
  requireAuth, requireRole([...STAFF_READ]),
  getFeedback
);
router.get('/feedback/stats',
  requireAuth, requireRole([...STAFF_READ]),
  getFeedbackStats
);

// ---------------------------------------------------------------
// Reports & Exports
// ---------------------------------------------------------------
router.get('/reports/analytics',
  requireAuth, requireRole([...STAFF_READ]),
  getDetailedReports
);
router.get('/reports/export',
  requireAuth, requireRole([...FULL_ADMIN]),
  exportComplaintsCsv
);

export default router;
