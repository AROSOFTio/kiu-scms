import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FileText, Search } from 'lucide-react';

interface PublicComplaint {
  id: number;
  reference_number: string;
  title: string;
  status: string;
  created_at: string;
  category_name: string;
  student_first_name: string;
  student_last_name: string;
  reviewed_at: string | null;
  staff_first_name: string | null;
  staff_last_name: string | null;
}

interface CategoryStat {
  category: string;
  count: number;
}

export default function TransparencyBoard() {
  const [complaints, setComplaints] = useState<PublicComplaint[]>([]);
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const res = await api.get('/complaints/public');
        setComplaints(res.data.data.complaints);
        setStats(res.data.data.categoryStats);
      } catch (err) {
        console.error('Failed to load public complaints', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, []);

  const filteredComplaints = complaints.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.reference_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-4">
        <div className="h-10 w-64 bg-gray-200 rounded-lg mb-6" />
        <div className="h-64 bg-gray-200 rounded-2xl w-full" />
        <div className="h-96 bg-gray-200 rounded-2xl w-full mt-4" />
      </div>
    );
  }

  const colors = ['#008540', '#006b33', '#10b981', '#34d399', '#059669', '#047857'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px w-6 bg-[#008540]" />
          <span className="text-[10px] font-black text-[#008540] uppercase tracking-widest">Global Overview</span>
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
          Transparency <span className="text-[#008540]">Board</span>
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-2">A public overview of all submitted grievances, categories, and their current resolution status.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <h2 className="text-sm font-black text-gray-900 tracking-tight uppercase mb-6 flex items-center">
            <FileText className="h-4 w-4 mr-2 text-[#008540]" />
            Complaints by Category
          </h2>
          <div className="flex-1 min-h-[300px] w-full">
            {stats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                  <XAxis 
                    dataKey="category" 
                    tick={{ fontSize: 10, fill: '#94a3b8' }} 
                    angle={-45} 
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium">No category data available.</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
            <h2 className="text-sm font-black text-gray-900 tracking-tight uppercase flex items-center">
              All Submissions
            </h2>
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008540]/20 focus:border-[#008540] transition-all"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-black text-gray-500 tracking-widest">
                  <th className="p-4 pl-6">Title & Ref</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Submitted By</th>
                  <th className="p-4">Submission Date</th>
                  <th className="p-4">Reviewed Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6">Handled By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400 font-medium">No complaints found.</td>
                  </tr>
                ) : (
                  filteredComplaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4 pl-6">
                        <p className="font-bold text-gray-900 mb-0.5 truncate max-w-[200px]" title={c.title}>{c.title}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{c.reference_number}</p>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600">
                          {c.category_name}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-gray-700">
                        {c.student_first_name} {c.student_last_name}
                      </td>
                      <td className="p-4 text-gray-500 font-medium text-xs">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-gray-500 font-medium text-xs">
                        {c.reviewed_at ? new Date(c.reviewed_at).toLocaleDateString() : <span className="text-gray-300 italic">Pending Reivew</span>}
                      </td>
                      <td className="p-4">
                         <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                          c.status === 'Under Review' ? 'bg-blue-100 text-blue-700' :
                          c.status === 'In Progress' ? 'bg-indigo-100 text-indigo-700' :
                          c.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {c.status === 'Submitted' ? 'Pending' : c.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6 font-medium text-gray-700">
                        {c.staff_first_name ? `${c.staff_first_name} ${c.staff_last_name}` : <span className="text-gray-300 italic">Unassigned</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
