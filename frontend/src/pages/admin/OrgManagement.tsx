import { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Users, 
  ChevronRight, 
  ChevronDown,
  Trash2,
  Edit2,
  LayoutGrid,
  Search
} from 'lucide-react';
import api from '../../lib/api';
import { Skeleton } from '../../components/ui/Skeleton';

export default function OrgManagement() {
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFaculties, setExpandedFaculties] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      const [facRes, depRes] = await Promise.all([
        api.get('/admin/faculties'),
        api.get('/admin/departments')
      ]);
      setFaculties(facRes.data.data);
      setDepartments(depRes.data.data);
    } catch (err) {} finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedFaculties(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-1/4" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight tracking-tighter">Institutional Structure</h1>
          <p className="text-gray-500 font-medium italic">Manage the hierarchy of faculties and academic departments.</p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center px-4 py-2 bg-white border border-gray-100 text-gray-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all">
            <Plus className="mr-2 h-3 w-3" />
            Add Faculty
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-[#008540] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md hover:shadow-lg transition-all">
            <Plus className="mr-2 h-3 w-3" />
            Add Department
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Hierarchy Explorer */}
        <div className="lg:col-span-3 space-y-4">
           {faculties.map((faculty) => {
             const facultyDeps = departments.filter(d => d.faculty_id === faculty.id);
             const isExpanded = expandedFaculties.includes(faculty.id);

             return (
               <div key={faculty.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300">
                  <div 
                    onClick={() => toggleExpand(faculty.id)}
                    className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 group-hover:scale-110 transition-transform">
                          <Building2 className="h-6 w-6" />
                       </div>
                       <div>
                          <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">{faculty.name}</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                             {facultyDeps.length} Departments Managed
                          </p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 hover:bg-white text-gray-400 hover:text-primary-600 rounded-lg shadow-sm border border-transparent hover:border-gray-100">
                             <Edit2 className="h-4 w-4" />
                          </button>
                       </div>
                       {isExpanded ? <ChevronDown className="h-5 w-5 text-gray-300" /> : <ChevronRight className="h-5 w-5 text-gray-300" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-gray-50/50 border-t border-gray-50 p-4 space-y-2">
                       {facultyDeps.length === 0 ? (
                         <p className="p-6 text-center text-xs text-gray-300 italic font-medium">No departments registered for this faculty.</p>
                       ) : facultyDeps.map(dep => (
                         <div key={dep.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-50 shadow-sm hover:border-[#008540]/30 transition-all group">
                            <div className="flex items-center gap-3">
                               <MapPin className="h-4 w-4 text-gray-300 group-hover:text-[#008540] transition-colors" />
                               <span className="text-xs font-bold text-gray-700">{dep.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="flex items-center text-[10px] font-black text-gray-300 uppercase tracking-widest mr-4">
                                  <Users className="h-3 w-3 mr-1" /> 24 Staff
                               </div>
                               <button className="p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-50 text-gray-400 hover:text-rose-500 rounded-lg transition-all">
                                  <Trash2 className="h-4 w-4" />
                               </button>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
               </div>
             );
           })}
        </div>

        {/* Quick Insights Slider */}
        <div className="space-y-6">
           <div className="bg-[#008540] p-8 rounded-3xl text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
              <LayoutGrid className="h-8 w-8 text-emerald-200 mb-6" />
              <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-4">Search Index</h4>
              <div className="relative group/search">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50 group-hover/search:text-white transition-colors" />
                 <input 
                    type="text" 
                    placeholder="Find unit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-white/10 border-none rounded-xl text-xs font-bold placeholder:text-white/40 focus:ring-2 focus:ring-white/20 transition-all"
                 />
              </div>
           </div>

           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest border-b border-gray-50 pb-2 flex items-center">
                 <Building2 className="h-3.5 w-3.5 mr-2 text-primary-600" /> Organizational Depth
              </h3>
              <div className="space-y-4 pt-2">
                 <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-500">Total Faculties</span>
                    <span className="font-black text-gray-900">{faculties.length}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-500">Active Depts</span>
                    <span className="font-black text-gray-900">{departments.length}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-500">Orphaned Depts</span>
                    <span className="font-black text-rose-600">0</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
