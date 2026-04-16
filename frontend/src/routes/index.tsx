import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/auth/Login';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProtectedRoute from '../components/layout/ProtectedRoute';

// Foundational SCMS Pages
// Foundational SCMS Pages
import StudentDashboard from '../pages/dashboard/StudentDashboard';
import ComplaintList from '../pages/complaints/ComplaintList';
import NewComplaint from '../pages/complaints/NewComplaint';
import StudentComplaintDetail from '../pages/complaints/StudentComplaintDetail';
import ComplaintQueue from '../pages/dashboard/ComplaintQueue';
import StaffDashboard from '../pages/dashboard/StaffDashboard';
import ComplaintWorkspace from '../pages/dashboard/ComplaintWorkspace';

// Phase 5: Administrative Control Panel
import AdminDashboard from '../pages/admin/AdminDashboard';
import ReportsOverview from '../pages/admin/ReportsOverview';
import Appointments from '../pages/appointments/Appointments';

import { useAuth } from '../context/AuthContext';

function RoleRedirect() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  if (!user && !token) return <Navigate to="/login" replace />;
  
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Resolving Identity...</p>
      </div>
    );
  }

  if (user.role === 'Admin' || user.role === 'Department Officer') return <Navigate to="/dashboard/admin" replace />;
  if (user.role === 'Staff') return <Navigate to="/dashboard/staff" replace />;
  return <Navigate to="/dashboard/student" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />

      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<RoleRedirect />} />
        
        {/* Common Routes */}
        <Route path="appointments" element={<Appointments />} />
        
        {/* Student Routes */}
        <Route path="student" element={
          <ProtectedRoute allowedRoles={['Student']}><StudentDashboard /></ProtectedRoute>
        } />
        <Route path="student/complaints" element={
          <ProtectedRoute allowedRoles={['Student']}><ComplaintList /></ProtectedRoute>
        } />
        <Route path="student/complaints/new" element={
          <ProtectedRoute allowedRoles={['Student']}><NewComplaint /></ProtectedRoute>
        } />
        <Route path="student/complaints/:id" element={
          <ProtectedRoute allowedRoles={['Student']}><StudentComplaintDetail /></ProtectedRoute>
        } />
        
        {/* Administrative Management Routes */}
        <Route path="admin" element={
          <ProtectedRoute allowedRoles={['Admin', 'Department Officer']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="admin/complaints" element={
          <ProtectedRoute allowedRoles={['Admin', 'Department Officer']}><ComplaintQueue /></ProtectedRoute>
        } />
        <Route path="admin/complaints/:id" element={
          <ProtectedRoute allowedRoles={['Admin', 'Department Officer']}><ComplaintWorkspace /></ProtectedRoute>
        } />
        <Route path="admin/reports" element={
          <ProtectedRoute allowedRoles={['Admin', 'Department Officer']}><ReportsOverview /></ProtectedRoute>
        } />

        {/* Staff Specific Routes */}
        <Route path="staff" element={
          <ProtectedRoute allowedRoles={['Staff']}><StaffDashboard /></ProtectedRoute>
        } />
        <Route path="staff/worklist" element={
          <ProtectedRoute allowedRoles={['Staff']}><ComplaintQueue /></ProtectedRoute>
        } />
        <Route path="staff/complaints/:id" element={
          <ProtectedRoute allowedRoles={['Staff']}><ComplaintWorkspace /></ProtectedRoute>
        } />

      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
