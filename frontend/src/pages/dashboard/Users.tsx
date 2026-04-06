import { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, 
  Search, 
  Shield, 
  Mail, 
  Calendar,
  UserCheck,
  UserX,
  Loader2,
  AlertCircle
} from 'lucide-react';
import api from '../../lib/api';
import { TableRowSkeleton } from '../../components/ui/Skeleton';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role_name: string;
  is_active: number;
  created_at: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data);
    } catch (err) {
      setError('Failed to fetch user directory');
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleStatus = async (user: User) => {
    setSubmittingId(user.id);
    try {
      const newStatus = user.is_active === 1 ? 0 : 1;
      await api.patch(`/admin/users/${user.id}/status`, { isActive: newStatus });
      setUsers(users.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u));
    } catch (err) {
      alert('Failed to update user status');
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.first_name + ' ' + u.last_name + ' ' + u.email).toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === '' || u.role_name === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">User Directory</h1>
          <p className="text-gray-500 mt-1 font-medium italic">Manage institutional accounts and access levels.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#008540] transition-all text-sm font-bold text-gray-800"
          />
        </div>
        <select 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-black text-gray-800 focus:ring-2 focus:ring-[#008540] transition-all"
        >
          <option value="">All Roles</option>
          <option value="Admin">Administrators</option>
          <option value="Staff">Staff Members</option>
          <option value="Student">Students</option>
        </select>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
              <tr>
                <th className="px-6 py-4">User Identity</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined On</th>
                <th className="px-6 py-4 text-right">Administrative Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <>
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center text-gray-400 italic font-medium">No users found matching your criteria.</td>
                </tr>
              ) : filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center">
                       <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4 text-gray-400 font-black border border-gray-50">
                          {u.first_name[0]}{u.last_name[0]}
                       </div>
                       <div>
                          <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">{u.first_name} {u.last_name}</p>
                          <p className="text-[10px] text-gray-400 font-bold flex items-center mt-0.5"><Mail className="h-2.5 w-2.5 mr-1" /> {u.email}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                     <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                       u.role_name === 'Admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                       u.role_name === 'Staff' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                       'bg-gray-50 text-gray-500 border-gray-200'
                     }`}>
                        {u.role_name}
                     </span>
                  </td>
                  <td className="px-6 py-5">
                     <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${u.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-tighter ${u.is_active ? 'text-emerald-600' : 'text-red-600'}`}>
                           {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                     </div>
                  </td>
                  <td className="px-6 py-5 text-gray-500 text-xs font-medium">
                     {new Date(u.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-5 text-right">
                     <button 
                       onClick={() => toggleStatus(u)}
                       disabled={submittingId === u.id}
                       className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-black transition-all shadow-sm active:scale-95 disabled:opacity-50 ${
                         u.is_active 
                          ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                       }`}
                     >
                        {submittingId === u.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        ) : u.is_active ? (
                          <UserX className="h-3 w-3 mr-2" />
                        ) : (
                          <UserCheck className="h-3 w-3 mr-2" />
                        )}
                        {u.is_active ? 'Suspend Account' : 'Activate Account'}
                     </button>
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
