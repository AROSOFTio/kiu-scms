import { Routes, Route } from 'react-router-dom';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-primary-700">SCMS Platform</h1>
            <p className="text-gray-600">Student Complaint Management System - Kampala International University</p>
            <div className="mt-8 flex gap-4 justify-center">
              <span className="px-4 py-2 bg-white shadow rounded-md">Frontend initialized</span>
            </div>
          </div>
        </div>
      } />
    </Routes>
  );
}
