import React, { useState, useEffect, FormEvent } from 'react';
import { 
  Settings, 
  LayoutGrid, 
  Plus, 
  Save, 
  RefreshCcw, 
  AlertCircle, 
  FileText,
  ShieldCheck,
  Server,
  Mail,
  HardDrive,
  Trash2,
  Edit2
} from 'lucide-react';
import api from '../../lib/api';
import { Skeleton } from '../../components/ui/Skeleton';

export default function SystemConfig() {
  const [activeTab, setActiveTab] = useState<'categories' | 'settings'>('categories');
  const [categories, setCategories] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [catRes, setRes] = await Promise.all([
        api.get('/admin/categories'),
        api.get('/admin/settings')
      ]);
      setCategories(catRes.data.data);
      setSettings(setRes.data.data);
    } catch (err) {} finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put('/admin/settings', settings);
      alert('Settings updated successfully');
    } catch (err) {
      alert('Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-1/4" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight tracking-tighter">System Configuration</h1>
          <p className="text-gray-500 font-medium italic">Adjust global parameters and manage complaint classification.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm inline-flex gap-2">
        <button 
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'categories' ? 'bg-[#008540] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Complaint Categories
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'settings' ? 'bg-[#008540] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Settings className="h-3.5 w-3.5" />
          Global Parameters
        </button>
      </div>

      {activeTab === 'categories' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Category List */}
          <div className="lg:col-span-2 space-y-4">
             {categories.map((cat) => (
               <div key={cat.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                        <FileText className="h-6 w-6" />
                     </div>
                     <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">{cat.name}</h3>
                        <p className="text-xs text-gray-400 font-medium italic leading-relaxed">{cat.description}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                        <Edit2 className="h-4 w-4" />
                     </button>
                     <button className="p-2 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                     </button>
                  </div>
               </div>
             ))}
          </div>

          {/* Add Category Form */}
          <div>
            <div className="bg-white p-8 rounded-3xl border border-[#008540]/20 shadow-xl shadow-emerald-900/5 sticky top-8">
               <h3 className="text-xs font-black text-[#008540] uppercase tracking-[0.2em] mb-6 flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Define New Category
               </h3>
               <form className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</label>
                    <input type="text" placeholder="e.g. Financial" className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-[#008540]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                    <textarea placeholder="Describe what kind of complaints fall here..." className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-[#008540] h-24" />
                  </div>
                  <button className="w-full py-4 bg-[#008540] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-900/10 hover:shadow-xl transition-all">
                     Confirm New Category
                  </button>
               </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl">
          <form onSubmit={handleUpdateSettings} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <ShieldCheck className="h-5 w-5 text-emerald-600" />
                   <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">System Master Controls</h3>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={fetchData} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                     <RefreshCcw className="h-4 w-4" />
                  </button>
                  <button 
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2 bg-[#008540] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                     <Save className="h-3.5 w-3.5" />
                     {submitting ? 'Updating...' : 'Commit Changes'}
                  </button>
                </div>
             </div>

             <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center">
                         <Server className="h-3 w-3 mr-2" /> Application Identity
                      </h4>
                      <div className="space-y-4">
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System Name</label>
                            <input 
                               type="text" 
                               value={settings.system_name || ''} 
                               onChange={(e) => setSettings({...settings, system_name: e.target.value})}
                               className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-[#008540]" 
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Support Email</label>
                            <div className="relative group">
                               <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                               <input 
                                  type="email" 
                                  value={settings.system_email || ''} 
                                  onChange={(e) => setSettings({...settings, system_email: e.target.value})}
                                  className="w-full pl-10 pr-3 py-3 bg-gray-50 border-none rounded-xl text-xs font-bold focus:ring-[#008540]" 
                               />
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center">
                         <HardDrive className="h-3 w-3 mr-2" /> Storage & Files
                      </h4>
                      <div className="space-y-4">
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Max Upload Size (MB)</label>
                            <input 
                               type="number" 
                               value={settings.max_file_size_mb || ''} 
                               onChange={(e) => setSettings({...settings, max_file_size_mb: e.target.value})}
                               className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-[#008540]" 
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Whitelisted File Types</label>
                            <input 
                               type="text" 
                               value={settings.allowed_file_types || ''} 
                               onChange={(e) => setSettings({...settings, allowed_file_types: e.target.value})}
                               placeholder="e.g. pdf, jpg, png, docx"
                               className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-[#008540]" 
                            />
                            <p className="text-[9px] text-gray-400 font-bold italic mt-1 flex items-center">
                               <AlertCircle className="h-2.5 w-2.5 mr-1" /> comma separated values
                            </p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="p-8 bg-gray-50/50 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                   <AlertCircle className="h-6 w-6" />
                </div>
                <p className="text-xs text-amber-700 font-bold italic">
                   Warning: Changing these parameters affects the behavior of the application for all users instantly. Please verify values before committing.
                </p>
             </div>
          </form>
        </div>
      )}
    </div>
  );
}
