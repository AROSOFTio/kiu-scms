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
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/ui/Modal';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const toast = useToast();

  const [userModal, setUserModal] = useState<{ open: boolean; data: any | null }>({ open: false, data: null });
  const [submitting, setSubmitting] = useState(false);

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

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/admin/departments');
      setDepartments(res.data.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const toggleStatus = async (id: number, current: boolean) => {
    try {
      await api.patch(`/admin/users/${id}/status`, { isActive: !current });
      toast.success(current ? 'System Access Suspended.' : 'Identity Access Restored.');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to augment user clearance.');
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(fd.entries());
    setSubmitting(true);
    try {
      if (userModal.data) {
        await api.put(`/admin/users/${userModal.data.id}`, data);
        toast.success('Identity profile updated');
      } else {
        await api.post('/admin/users', data);
        toast.success('New identity registered successfully');
      }
      setUserModal({ open: false, data: null });
      fetchUsers();
    } catch (err) {
      toast.error('Failed to finalize identity record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tighter">Unified Identity Center</h1>
          <p className="text-slate-500 font-medium mt-2">Oversee credentials for students, staff, and HODs.</p>
        </div>
        <button 
          onClick={() => setUserModal({ open: true, data: null })}
          className="inline-flex items-center px-8 py-4 bg-[#008540] text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-emerald-900/20 hover:-translate-y-1 hover:shadow-emerald-900/40 active:scale-95 transition-all"
        >
          <UserPlus className="mr-3 h-5 w-5" />
          Register Identity
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100/60 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search active identities or institutional IDs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="premium-input pl-14 bg-slate-50 border-none"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto relative">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="premium-input pl-12 pr-10 w-full md:w-56 appearance-none font-bold bg-slate-50 border-none"
          >
            <option value="">All Affiliations</option>
            <option value="Student">Scholars</option>
            <option value="Staff">Faculty</option>
            <option value="Admin">Overseers</option>
          </select>
        </div>
      </div>

      {/* Premium Table Component */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>User Profile</TableHeaderCell>
            <TableHeaderCell>Institutional ID</TableHeaderCell>
            <TableHeaderCell>Access Tier</TableHeaderCell>
            <TableHeaderCell>Department</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Controls</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
             <>
               <TableRowSkeleton />
               <TableRowSkeleton />
               <TableRowSkeleton />
               <TableRowSkeleton />
               <TableRowSkeleton />
             </>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>
                 <div className="py-16 text-center text-slate-400 font-bold">No identities matched your criteria.</div>
              </TableCell>
            </TableRow>
          ) : (
             users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-700 font-black text-sm shadow-inner group-hover:scale-105 transition-transform duration-300">
                      {user.first_name[0]}{user.last_name[0]}
                    </div>
                    <div>
                      <p className="text-base font-black text-slate-900 tracking-tight">{user.first_name} {user.last_name}</p>
                      <div className="flex items-center text-xs uppercase tracking-widest text-slate-400 font-bold mt-1 group-hover:text-emerald-600/80 transition-colors">
                          <Mail className="h-3 w-3 mr-1.5" />
                          {user.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">{user.id_number || 'SYSTEM RECORD'}</span>
                </TableCell>
                <TableCell>
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest ${
                    user.role_name === 'Admin' ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100/50' :
                    user.role_name === 'Staff' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/50' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/50'
                  }`}>
                    {user.role_name}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm font-bold text-slate-500">
                    <Building2 className="h-4 w-4 mr-2 text-slate-300 group-hover:text-emerald-400 transition-colors" />
                    {user.department_name || 'Unassigned'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className={`flex items-center gap-2.5 text-xs font-black uppercase tracking-widest ${user.is_active ? 'text-emerald-500' : 'text-slate-400'}`}>
                    <div className={`h-2.5 w-2.5 rounded-full ${user.is_active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-300'}`} />
                    {user.is_active ? 'Active' : 'Suspended'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <button 
                      onClick={() => toggleStatus(user.id, user.is_active)}
                      title={user.is_active ? 'Suspend Clearance' : 'Restore Clearance'}
                      className={`p-2.5 rounded-xl transition-all ${user.is_active ? 'hover:bg-red-50 text-slate-300 hover:text-red-500 hover:scale-110 active:scale-95' : 'hover:bg-emerald-50 text-slate-300 hover:text-emerald-500 hover:scale-110 active:scale-95'}`}
                    >
                        {user.is_active ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                    </button>
                    <button 
                      onClick={() => setUserModal({ open: true, data: user })}
                      className="p-2.5 hover:bg-slate-50 text-slate-300 hover:text-slate-600 rounded-xl transition-all hover:scale-110 active:scale-95"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
             ))
          )}
        </TableBody>
      </Table>

      <Modal 
        isOpen={userModal.open} 
        onClose={() => setUserModal({ open: false, data: null })}
        title={userModal.data ? 'Update Identity' : 'Register New Identity'}
      >
        <form onSubmit={handleSaveUser} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">First Name</label>
                <input name="firstName" defaultValue={userModal.data?.first_name || ''} required className="premium-input w-full" />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Name</label>
                <input name="lastName" defaultValue={userModal.data?.last_name || ''} required className="premium-input w-full" />
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
             <input type="email" name="email" defaultValue={userModal.data?.email || ''} required className="premium-input w-full" />
          </div>

          {!userModal.data && (
            <div className="space-y-2">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Initial Password</label>
               <input type="password" name="password" required className="premium-input w-full" />
            </div>
          )}

          <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Institutional Affiliation</label>
             <select name="roleName" defaultValue={userModal.data?.role_name || ''} required className="premium-input w-full">
                <option value="">Select Role</option>
                <option value="Student">Student</option>
                <option value="Staff">Staff</option>
                <option value="Admin">HOD</option>
             </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Institutional ID</label>
                <input name="idNumber" defaultValue={userModal.data?.id_number || ''} className="premium-input w-full" placeholder="e.g. ST/001" />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Department</label>
                <select name="departmentId" defaultValue={userModal.data?.department_id || ''} className="premium-input w-full">
                   <option value="">N/A</option>
                   {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
             </div>
          </div>

          <div className="flex gap-4 pt-4">
             <button 
               type="button" 
               onClick={() => setUserModal({ open: false, data: null })}
               className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
             >
                Cancel
             </button>
             <button 
               disabled={submitting}
               type="submit" 
               className="flex-1 py-4 bg-[#008540] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/10 hover:shadow-xl transition-all disabled:opacity-50"
             >
                {submitting ? 'Committing...' : (userModal.data ? 'Update Profile' : 'Gain Access')}
             </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
