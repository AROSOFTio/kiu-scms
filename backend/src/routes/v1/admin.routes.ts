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

// ---------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------
// @route   GET /api/v1/admin/dashboard
router.get('/dashboard',
  requireAuth, requireRole(['HOD', 'Lecturer']),
  getAdminStats
);

// ---------------------------------------------------------------
// Complaints
// ---------------------------------------------------------------
// @route   GET /api/v1/admin/complaints
router.get('/complaints',
  requireAuth, requireRole(['HOD', 'Lecturer']),
  getAllComplaints
);

// @route   GET /api/v1/admin/complaints/:id
router.get('/complaints/:id',
  requireAuth, requireRole(['HOD', 'Lecturer']),
  getComplaintById
);

// @route   PATCH /api/v1/admin/complaints/:id/assign   — HOD only
router.patch('/complaints/:id/assign',
  requireAuth, requireRole(['HOD']),
  assignStaff
);

// @route   PATCH /api/v1/admin/complaints/:id/route    — HOD only
router.patch('/complaints/:id/route',
  requireAuth, requireRole(['HOD']),
  routeComplaint
);

// @route   PATCH /api/v1/admin/complaints/:id/status   — HOD or Lecturer
router.patch('/complaints/:id/status',
  requireAuth, requireRole(['HOD', 'Lecturer']),
  updateStatus
);

// @route   POST /api/v1/admin/complaints/:id/notes
router.post('/complaints/:id/notes',
  requireAuth, requireRole(['HOD', 'Lecturer']),
  addInternalNote
);

// @route   GET /api/v1/admin/complaints/:id/notes
router.get('/complaints/:id/notes',
  requireAuth, requireRole(['HOD', 'Lecturer']),
  getInternalNotes
);

// ---------------------------------------------------------------
// Lecturer list for assignment
// ---------------------------------------------------------------
// @route   GET /api/v1/admin/staff
router.get('/staff',
  requireAuth, requireRole(['HOD', 'Lecturer']),
  getStaffMembers
);

// ---------------------------------------------------------------
// User Management — HOD only
// ---------------------------------------------------------------
// @route   GET /api/v1/admin/users
router.get('/users',
  requireAuth, requireRole(['HOD']),
  getAllUsers
);

// @route   POST /api/v1/admin/users
router.post('/users',
  requireAuth, requireRole(['HOD']),
  createUser
);

// @route   PUT /api/v1/admin/users/:id
router.put('/users/:id',
  requireAuth, requireRole(['HOD']),
  updateUser
);

// @route   PATCH /api/v1/admin/users/:id/status
router.patch('/users/:id/status',
  requireAuth, requireRole(['HOD']),
  toggleUserStatus
);

// ---------------------------------------------------------------
// Settings — HOD only
// ---------------------------------------------------------------
router.get('/settings',
  requireAuth, requireRole(['HOD', 'Lecturer']),
  getSettings
);

router.put('/settings',
  requireAuth, requireRole(['HOD']),
  updateSettings
);

// ---------------------------------------------------------------
// Audit Logs — HOD only
// ---------------------------------------------------------------
router.get('/audit-logs',
  requireAuth, requireRole(['HOD']),
  getAuditLogs
);

// ---------------------------------------------------------------
// Organizational Structure
// ---------------------------------------------------------------
router.get('/faculties',
  requireAuth, requireRole(['HOD', 'Lecturer']),
  manageOrg.getFaculties
);
router.post('/faculties',
  requireAuth, requireRole(['HOD']),
  manageOrg.createFaculty
);
router.put('/faculties/:id',
  requireAuth, requireRole(['HOD']),
  manageOrg.updateFaculty
);
router.delete('/faculties/:id',
  requireAuth, requireRole(['HOD']),
  manageOrg.deleteFaculty
);

router.get('/departments',
  requireAuth, requireRole(['HOD', 'Lecturer']),
  manageOrg.getDepartments
);
router.post('/departments',
  requireAuth, requireRole(['HOD']),
  manageOrg.createDepartment
);
router.put('/departments/:id',
  requireAuth, requireRole(['HOD']),
  manageOrg.updateDepartment
);
router.delete('/departments/:id',
  requireAuth, requireRole(['HOD']),
  manageOrg.deleteDepartment
);

router.get('/categories',
  requireAuth, requireRole(['HOD', 'Lecturer']),
  manageOrg.getCategories
);
router.post('/categories',
  requireAuth, requireRole(['HOD']),
  manageOrg.createCategory
);
router.put('/categories/:id',
  requireAuth, requireRole(['HOD']),
  manageOrg.updateCategory
);
router.delete('/categories/:id',
  requireAuth, requireRole(['HOD']),
  manageOrg.deleteCategory
);

// ---------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------
router.get('/feedback',
  requireAuth, requireRole(['HOD', 'Lecturer']),
  getFeedback
);
router.get('/feedback/stats',
  requireAuth, requireRole(['HOD', 'Lecturer']),
  getFeedbackStats
);

// ---------------------------------------------------------------
// Reports & Exports
// ---------------------------------------------------------------
router.get('/reports/analytics',
  requireAuth, requireRole(['HOD', 'Lecturer']),
  getDetailedReports
);
router.get('/reports/export',
  requireAuth, requireRole(['HOD']),
  exportComplaintsCsv
);

export default router;
