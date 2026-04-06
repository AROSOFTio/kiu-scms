import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProtectedRoute from '../components/layout/ProtectedRoute';

// Foundational SCMS Pages
// Foundational SCMS Pages
import StudentDashboard from '../pages/dashboard/StudentDashboard';
import ComplaintList from '../pages/complaints/ComplaintList';
import NewComplaint from '../pages/complaints/NewComplaint';
import ComplaintDetail from '../pages/complaints/ComplaintDetail';
import ComplaintsList from '../pages/dashboard/ComplaintsList';
import StaffDashboard from '../pages/dashboard/StaffDashboard';
import StaffComplaintWorkspace from '../pages/dashboard/StaffComplaintWorkspace';

// Phase 5: Administrative Control Panel
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManagement from '../pages/admin/UserManagement';
import OrgManagement from '../pages/admin/OrgManagement';
import SystemConfig from '../pages/admin/SystemConfig';
import AuditLogs from '../pages/admin/AuditLogs';
import ReportsOverview from '../pages/admin/ReportsOverview';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="student" replace />} />
        <Route path="student" element={<StudentDashboard />} />
        <Route path="student/complaints" element={<ComplaintList />} />
        <Route path="student/complaints/new" element={<NewComplaint />} />
        <Route path="student/complaints/:id" element={<ComplaintDetail />} />
        
        {/* Administrative Management Routes */}
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/complaints" element={<ComplaintsList />} />
        <Route path="admin/users" element={<UserManagement />} />
        <Route path="admin/org" element={<OrgManagement />} />
        <Route path="admin/config" element={<SystemConfig />} />
        <Route path="admin/logs" element={<AuditLogs />} />
        <Route path="admin/reports" element={<ReportsOverview />} />

        {/* Staff Specific Routes */}
        <Route path="staff" element={<StaffDashboard />} />
        <Route path="staff/worklist" element={<ComplaintsList />} />
        <Route path="staff/complaints/:id" element={<StaffComplaintWorkspace />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
