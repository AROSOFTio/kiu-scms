import { useState, useEffect, FormEvent } from 'react';
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
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';

export default function SystemConfig() {
  const [activeTab, setActiveTab] = useState<'categories' | 'settings'>('categories');
  const [categories, setCategories] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const [categoryModal, setCategoryModal] = useState<{ open: boolean; data: any | null }>({ open: false, data: null });
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });

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

  const handleUpdateSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put('/admin/settings', settings);
      toast.success('System parameters updated');
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCategory = async (e: FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const name = fd.get('name') as string;
    const description = fd.get('description') as string;
    
    setSubmitting(true);
    try {
      if (categoryModal.data) {
        await api.put(`/admin/categories/${categoryModal.data.id}`, { name, description });
        toast.success('Category updated');
      } else {
        await api.post('/admin/categories', { name, description });
        toast.success('New category added');
        (e.target as HTMLFormElement).reset();
      }
      setCategoryModal({ open: false, data: null });
      fetchData();
    } catch (err) {
      toast.error('Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!confirmDelete.id) return;
    setSubmitting(true);
    try {
      await api.delete(`/admin/categories/${confirmDelete.id}`);
      toast.success('Category removed');
      setConfirmDelete({ open: false, id: null });
      fetchData();
    } catch (err) {
      toast.error('Deletion failed');
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
          <p className="text-gray-500 font-medium">Adjust global parameters and manage complaint classification.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm inline-flex gap-2">
        <button 
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'categories' ? 'bg-[#008540] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          Complaint Categories
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'settings' ? 'bg-[#008540] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Settings className="h-4 w-4" />
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
                        <p className="text-xs text-gray-400 font-medium leading-relaxed">{cat.description}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                       onClick={() => setCategoryModal({ open: true, data: cat })}
                       className="p-2.5 hover:bg-gray-100 text-gray-400 hover:text-[#008540] rounded-xl transition-all active:scale-95"
                     >
                        <Edit2 className="h-4 w-4" />
                     </button>
                     <button 
                       onClick={() => setConfirmDelete({ open: true, id: cat.id })}
                       className="p-2.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-xl transition-all active:scale-95"
                     >
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
               <form onSubmit={handleSaveCategory} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</label>
                    <input name="name" type="text" placeholder="e.g. Financial" required className="premium-input w-full" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                    <textarea name="description" placeholder="Describe what kind of complaints fall here..." required className="premium-input w-full h-24" />
                  </div>
                  <button 
                    disabled={submitting}
                    className="w-full py-4 bg-[#008540] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/10 hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
                  >
                     {submitting ? 'Registering...' : 'Confirm New Category'}
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
                    className="flex items-center gap-2 px-6 py-2 bg-[#008540] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                     <Save className="h-4 w-4" />
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
                            <p className="text-[9px] text-gray-400 font-bold mt-1 flex items-center">
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
                <p className="text-xs text-amber-700 font-bold">
                   Warning: Changing these parameters affects the behavior of the application for all users instantly. Please verify values before committing.
                </p>
             </div>
          </form>
        </div>
      )}
      {/* Edit Category Modal */}
      <Modal 
        isOpen={categoryModal.open} 
        onClose={() => setCategoryModal({ open: false, data: null })}
        title="Edit Category"
      >
        <form onSubmit={handleSaveCategory} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category Name</label>
            <input name="name" defaultValue={categoryModal.data?.name || ''} required className="premium-input w-full" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
            <textarea name="description" defaultValue={categoryModal.data?.description || ''} required className="premium-input w-full h-32" />
          </div>
          <div className="flex gap-4 pt-4">
             <button 
               type="button" 
               onClick={() => setCategoryModal({ open: false, data: null })}
               className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
             >
                Cancel
             </button>
             <button 
               disabled={submitting}
               type="submit" 
               className="flex-1 py-4 bg-[#008540] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/10 hover:shadow-xl transition-all disabled:opacity-50"
             >
                {submitting ? 'Updating...' : 'Save Changes'}
             </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={confirmDelete.open} 
        onClose={() => setConfirmDelete({ open: false, id: null })}
        title="Remove Category"
      >
        <div className="space-y-6 text-center">
          <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
             <Trash2 className="h-10 w-10" />
          </div>
          <div>
            <h4 className="text-xl font-black text-slate-900 tracking-tighter uppercase mb-2">Are you sure?</h4>
            <p className="text-slate-500 font-medium">
              This will permanently remove the category. Existing complaints will lose their classification association.
            </p>
          </div>
          <div className="flex gap-4 pt-4">
             <button 
               onClick={() => setConfirmDelete({ open: false, id: null })}
               className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
             >
                Keep it
             </button>
             <button 
               disabled={submitting}
               onClick={handleDeleteCategory}
               className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-900/10 hover:shadow-xl transition-all disabled:opacity-50"
             >
                {submitting ? 'Removing...' : 'Yes, Delete'}
             </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
