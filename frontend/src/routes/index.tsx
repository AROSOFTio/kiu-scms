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
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import AdminReports from '../pages/dashboard/AdminReports';
import ComplaintsList from '../pages/dashboard/ComplaintsList';
import Users from '../pages/dashboard/Users';

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
        
        {/* Admin/Staff Shared Routes */}
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/complaints" element={<ComplaintsList />} />
        <Route path="admin/reports" element={<AdminReports />} />
        <Route path="admin/users" element={<Users />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
