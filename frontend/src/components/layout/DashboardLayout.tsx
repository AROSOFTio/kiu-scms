import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Bell, LayoutDashboard, FileText, PlusCircle, Settings, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function DashboardLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter navigation based on role
  
  const navigation = user?.role === 'Admin' ? [
    { name: 'Admin Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { name: 'Grievance Records', href: '/dashboard/admin/complaints', icon: FileText },
    { name: 'User Management', href: '/dashboard/admin/users', icon: Users },
    { name: 'Statistics', href: '/dashboard/admin/reports', icon: Settings },
  ] : user?.role === 'Staff' ? [
    { name: 'Staff Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { name: 'Assigned Cases', href: '/dashboard/admin/complaints', icon: FileText },
  ] : [
    { name: 'Dashboard', href: '/dashboard/student', icon: LayoutDashboard },
    { name: 'My Complaints', href: '/dashboard/student/complaints', icon: FileText },
    { name: 'Submit Complaint', href: '/dashboard/student/complaints/new', icon: PlusCircle },
  ];

  const userName = user ? `${user.firstName} ${user.lastName}` : 'User';
  const userInitials = user ? `${user.firstName[0]}${user.lastName[0]}` : 'U';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#08271c] text-gray-300 flex-shrink-0 flex flex-col">
        {/* User Card */}
        <div className="p-6 flex flex-col items-center border-b border-[#12553a]">
          <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-xl mb-3 border-2 border-primary-400">
            {userInitials}
          </div>
          <h3 className="text-white font-bold text-sm tracking-wide text-center uppercase">{userName}</h3>
          <p className="text-xs text-primary-300 mt-1">{user?.role || 'User'}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <div className="px-4 text-xs font-semibold text-primary-400 mb-2 uppercase tracking-wider">SCMS Menu</div>
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center px-6 py-3 text-sm transition-colors ${
                      isActive 
                        ? 'text-white border-l-4 border-white bg-[#104631]' 
                        : 'hover:text-white hover:bg-[#104631] border-l-4 border-transparent'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 mr-3 ${isActive ? 'text-white' : 'text-primary-300'}`} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-[#008540] flex items-center justify-between px-6 border-b border-[#12553a] shadow-sm tracking-wide">
          <div className="flex items-center">
            <div className="text-white font-bold text-lg tracking-wider uppercase">
              KIU SCMS
            </div>
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-primary-50">
            <button className="hover:text-white relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-0 right-0 block h-1.5 w-1.5 rounded-full bg-red-400 ring-2 ring-[#008540]" />
            </button>
            <button className="hover:text-white transition-colors">Change password</button>
            <button onClick={handleLogout} className="flex items-center hover:text-white transition-colors font-medium">
              Logout
              <LogOut className="h-4 w-4 ml-1.5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-[#f8f9fa] p-6 text-gray-800">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
