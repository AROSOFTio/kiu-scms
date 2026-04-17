import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/auth/Login';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProtectedRoute from '../components/layout/ProtectedRoute';

// Student pages
import StudentDashboard from '../pages/dashboard/StudentDashboard';
import ComplaintList from '../pages/complaints/ComplaintList';
import NewComplaint from '../pages/complaints/NewComplaint';
import StudentComplaintDetail from '../pages/complaints/StudentComplaintDetail';

// HOD pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import ComplaintQueue from '../pages/dashboard/ComplaintQueue';
import ComplaintWorkspace from '../pages/dashboard/ComplaintWorkspace';
import ReportsOverview from '../pages/admin/ReportsOverview';

// Lecturer pages
import StaffDashboard from '../pages/dashboard/StaffDashboard';

// Shared
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
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Resolving Identity…</p>
      </div>
    );
  }

  if (user.role === 'HOD' || user.role === 'SuperAdmin') return <Navigate to="/dashboard/hod" replace />;
  if (user.role === 'Lecturer') return <Navigate to="/dashboard/lecturer" replace />;
  return <Navigate to="/dashboard/student" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      {/* All dashboard routes share the layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Role dispatcher */}
        <Route index element={<RoleRedirect />} />

        {/* ─────────────────────────────────────── STUDENT ── */}
        <Route
          path="student"
          element={<ProtectedRoute allowedRoles={['Student']}><StudentDashboard /></ProtectedRoute>}
        />
        <Route
          path="student/complaints"
          element={<ProtectedRoute allowedRoles={['Student']}><ComplaintList /></ProtectedRoute>}
        />
        <Route
          path="student/complaints/new"
          element={<ProtectedRoute allowedRoles={['Student']}><NewComplaint /></ProtectedRoute>}
        />
        <Route
          path="student/complaints/:id"
          element={<ProtectedRoute allowedRoles={['Student']}><StudentComplaintDetail /></ProtectedRoute>}
        />

        {/* ─────────────────────────────────────── HOD ── */}
        <Route
          path="hod"
          element={<ProtectedRoute allowedRoles={['HOD', 'SuperAdmin']}><AdminDashboard /></ProtectedRoute>}
        />
        <Route
          path="hod/complaints"
          element={<ProtectedRoute allowedRoles={['HOD', 'SuperAdmin']}><ComplaintQueue /></ProtectedRoute>}
        />
        <Route
          path="hod/complaints/:id"
          element={<ProtectedRoute allowedRoles={['HOD', 'SuperAdmin']}><ComplaintWorkspace /></ProtectedRoute>}
        />
        <Route
          path="hod/reports"
          element={<ProtectedRoute allowedRoles={['HOD', 'SuperAdmin']}><ReportsOverview /></ProtectedRoute>}
        />

        {/* Legacy /dashboard/admin/* → redirect to /dashboard/hod/* */}
        <Route path="admin" element={<Navigate to="/dashboard/hod" replace />} />
        <Route path="admin/complaints" element={<Navigate to="/dashboard/hod/complaints" replace />} />
        <Route path="admin/complaints/:id" element={<Navigate to="/dashboard/hod" replace />} />
        <Route path="admin/reports" element={<Navigate to="/dashboard/hod/reports" replace />} />

        {/* ─────────────────────────────────────── LECTURER ── */}
        <Route
          path="lecturer"
          element={<ProtectedRoute allowedRoles={['Lecturer']}><StaffDashboard /></ProtectedRoute>}
        />
        <Route
          path="lecturer/complaints/:id"
          element={<ProtectedRoute allowedRoles={['Lecturer']}><ComplaintWorkspace /></ProtectedRoute>}
        />

        {/* Legacy /dashboard/staff/* → redirect to /dashboard/lecturer/* */}
        <Route path="staff" element={<Navigate to="/dashboard/lecturer" replace />} />
        <Route path="staff/worklist" element={<Navigate to="/dashboard/lecturer" replace />} />
        <Route path="staff/complaints/:id" element={<Navigate to="/dashboard/lecturer" replace />} />

        {/* ─────────────────────────────────────── SHARED ── */}
        <Route path="appointments" element={<Appointments />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
