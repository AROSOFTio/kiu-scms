import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  FileText, 
  Download, 
  User, 
  Tag, 
  AlertCircle,
  FileCheck
} from 'lucide-react';
import api from '../../lib/api';

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/complaints/${id}`);
        setComplaint(res.data.data);
      } catch (err: any) {
        setError('Failed to load complaint details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return <div className="text-center p-24 text-gray-500">Loading details...</div>;
  if (error) return <div className="text-center p-24 text-red-500">{error}</div>;
  if (!complaint) return <div className="text-center p-24">Complaint not found</div>;

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Resolved': return 'bg-green-100 text-green-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      case 'In Progress': return 'bg-amber-100 text-amber-700';
      case 'Under Review': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to List
      </button>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded uppercase tracking-wider">
                    {complaint.reference_number}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(complaint.status)}`}>
                    {complaint.status}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">{complaint.title}</h1>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-medium">Submitted on</p>
                <p className="text-sm font-bold text-gray-900">{new Date(complaint.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Description */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-primary-600" />
                  Description
                </h3>
                <div className="bg-gray-50 p-6 rounded-xl text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {complaint.description}
                </div>
              </div>

              {/* Attachments */}
              {complaint.attachments?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center">
                    <Tag className="h-4 w-4 mr-2 text-primary-600" />
                    Attachments
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {complaint.attachments.map((file: any) => (
                      <a
                        key={file.id}
                        href={`${import.meta.env.VITE_API_BASE_URL || ''}${file.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-gray-50 transition-all group"
                      >
                        <FileCheck className="h-4 w-4 text-primary-600 mr-2" />
                        <span className="text-xs text-gray-600 truncate flex-1">{file.file_path.split('/').pop()}</span>
                        <Download className="h-3 w-3 text-gray-400 group-hover:text-primary-600 ml-2" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar / Timeline */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Metadata Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-3">Complaint Info</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <Tag className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Category</p>
                  <p className="text-sm font-semibold">{complaint.category_name}</p>
                </div>
              </div>
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Priority</p>
                  <p className={`text-sm font-semibold ${
                    complaint.priority === 'Critical' ? 'text-red-600' :
                    complaint.priority === 'High' ? 'text-orange-600' : 'text-gray-900'
                  }`}>{complaint.priority}</p>
                </div>
              </div>
              <div className="flex items-start">
                <User className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Assigned To</p>
                  <p className="text-sm font-semibold">{complaint.assigned_staff || 'Not yet assigned'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-3">History Timeline</h3>
            <div className="relative pl-6 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
              {complaint.timeline?.map((event: any, idx: number) => (
                <div key={idx} className="relative">
                  <div className={`absolute left-[-21px] top-1 h-3 w-3 rounded-full border-2 border-white ring-4 ring-white ${
                    idx === complaint.timeline.length - 1 ? 'bg-primary-600 animate-pulse' : 'bg-gray-300'
                  }`} />
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">
                    {new Date(event.changed_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm font-bold text-gray-900 mb-0.5">{event.status}</p>
                  <p className="text-xs text-gray-600 italic">"{event.remarks}"</p>
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">By: {event.first_name} ({event.role_name})</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
