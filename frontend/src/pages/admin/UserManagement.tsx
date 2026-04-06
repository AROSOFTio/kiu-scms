import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  Mail,
  Building2,
  Edit2
} from 'lucide-react';
import api from '../../lib/api';
import { Skeleton } from '../../components/ui/Skeleton';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users', { 
        params: { search, role: roleFilter } 
      });
      setUsers(res.data.data);
    } catch (err) {} finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const toggleStatus = async (id: number, current: boolean) => {
    try {
      await api.patch(`/admin/users/${id}/status`, { isActive: !current });
      fetchUsers();
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  if (loading && users.length === 0) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-1/4" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight tracking-tighter">Unified Identity Center</h1>
          <p className="text-gray-500 font-medium italic">Oversee accounts for students, staff, and system administrators.</p>
        </div>
        <button className="inline-flex items-center px-6 py-3 bg-[#008540] text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/10 hover:translate-y-[-1px] active:scale-95 transition-all">
          <UserPlus className="mr-2 h-4 w-4" />
          Register New Account
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by name, email, or credentials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#008540] transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="h-4 w-4 text-gray-400" />
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-[#008540]"
          >
            <option value="">All Roles</option>
            <option value="Student">Students</option>
            <option value="Staff">Staff</option>
            <option value="Admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">User Profile</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Institutional ID</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Role</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Affiliation</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-black text-xs">
                        {user.first_name[0]}{user.last_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">{user.first_name} {user.last_name}</p>
                        <div className="flex items-center text-[10px] text-gray-400 font-bold group-hover:text-primary-600 transition-colors">
                           <Mail className="h-3 w-3 mr-1" />
                           {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-black text-gray-400 font-mono">{user.id_number || 'SYSTEM'}</td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                      user.role_name === 'Admin' ? 'bg-amber-50 text-amber-600' :
                      user.role_name === 'Staff' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {user.role_name}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center text-xs font-bold text-gray-500">
                      <Building2 className="h-3.5 w-3.5 mr-2 text-gray-300" />
                      {user.department_name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${user.is_active ? 'text-emerald-500' : 'text-rose-500'}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                      {user.is_active ? 'Active' : 'Suspended'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => toggleStatus(user.id, user.is_active)}
                        title={user.is_active ? 'Suspend User' : 'Activate User'}
                        className={`p-2 rounded-lg transition-colors ${user.is_active ? 'hover:bg-rose-50 text-rose-400 hover:text-rose-600' : 'hover:bg-emerald-50 text-emerald-400 hover:text-emerald-600'}`}
                      >
                         {user.is_active ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                      </button>
                      <button className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
