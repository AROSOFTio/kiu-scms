import { useState } from 'react';
import { Copy, CheckCircle, Briefcase, GraduationCap, Users } from 'lucide-react';

interface Credential {
  name: string;
  email: string;
  role: string;
  password?: string;
  department?: string;
}

const demoCredentials: Record<string, Credential[]> = {
  'Heads of Department (HOD)': [
    { name: 'Fred Bwire', email: 'fbwire.hod@kiu.ac.ug', role: 'HOD', department: 'Computer Science', password: 'Admin@123' },
    { name: 'HOD Info Technology', email: 'hod.informationtechnology@kiu.ac.ug', role: 'HOD', department: 'Information Technology', password: 'Admin@123' },
    { name: 'HOD Software Eng', email: 'hod.softwareengineering@kiu.ac.ug', role: 'HOD', department: 'Software Engineering', password: 'Admin@123' },
    { name: 'HOD Data Science', email: 'hod.datascience@kiu.ac.ug', role: 'HOD', department: 'Data Science', password: 'Admin@123' },
    { name: 'HOD Business Admin', email: 'hod.businessadmin@kiu.ac.ug', role: 'HOD', department: 'Business Admin', password: 'Admin@123' },
  ],
  'Lecturers / Staff': [
    { name: 'Lecturer 1 Computer', email: 'lec1.computerscience@kiu.ac.ug', role: 'Lecturer', department: 'Computer Science', password: 'Admin@123' },
    { name: 'Lecturer 2 Computer', email: 'lec2.computerscience@kiu.ac.ug', role: 'Lecturer', department: 'Computer Science', password: 'Admin@123' },
    { name: 'Lecturer 3 Computer', email: 'lec3.computerscience@kiu.ac.ug', role: 'Lecturer', department: 'Computer Science', password: 'Admin@123' },
    { name: 'Lecturer 4 Computer', email: 'lec4.computerscience@kiu.ac.ug', role: 'Lecturer', department: 'Computer Science', password: 'Admin@123' },
    { name: 'Lecturer 5 Computer', email: 'lec5.computerscience@kiu.ac.ug', role: 'Lecturer', department: 'Computer Science', password: 'Admin@123' },
    
    { name: 'Apio Presiline', email: 'apio.presiline@kiu.ac.ug', role: 'Lecturer', department: 'Information Technology', password: 'Admin@123' },
    { name: 'Lecturer 2 Information', email: 'lec2.informationtechnology@kiu.ac.ug', role: 'Lecturer', department: 'Information Technology', password: 'Admin@123' },
    { name: 'Lecturer 3 Information', email: 'lec3.informationtechnology@kiu.ac.ug', role: 'Lecturer', department: 'Information Technology', password: 'Admin@123' },
    { name: 'Lecturer 4 Information', email: 'lec4.informationtechnology@kiu.ac.ug', role: 'Lecturer', department: 'Information Technology', password: 'Admin@123' },
    { name: 'Lecturer 5 Information', email: 'lec5.informationtechnology@kiu.ac.ug', role: 'Lecturer', department: 'Information Technology', password: 'Admin@123' },

    { name: 'Lecturer 1 Software', email: 'lec1.softwareengineering@kiu.ac.ug', role: 'Lecturer', department: 'Software Engineering', password: 'Admin@123' },
    { name: 'Lecturer 2 Software', email: 'lec2.softwareengineering@kiu.ac.ug', role: 'Lecturer', department: 'Software Engineering', password: 'Admin@123' },
    { name: 'Lecturer 3 Software', email: 'lec3.softwareengineering@kiu.ac.ug', role: 'Lecturer', department: 'Software Engineering', password: 'Admin@123' },
    { name: 'Lecturer 4 Software', email: 'lec4.softwareengineering@kiu.ac.ug', role: 'Lecturer', department: 'Software Engineering', password: 'Admin@123' },
    { name: 'Lecturer 5 Software', email: 'lec5.softwareengineering@kiu.ac.ug', role: 'Lecturer', department: 'Software Engineering', password: 'Admin@123' },

    { name: 'Lecturer 1 Data', email: 'lec1.datascience@kiu.ac.ug', role: 'Lecturer', department: 'Data Science', password: 'Admin@123' },
    { name: 'Lecturer 2 Data', email: 'lec2.datascience@kiu.ac.ug', role: 'Lecturer', department: 'Data Science', password: 'Admin@123' },
    { name: 'Lecturer 3 Data', email: 'lec3.datascience@kiu.ac.ug', role: 'Lecturer', department: 'Data Science', password: 'Admin@123' },
    { name: 'Lecturer 4 Data', email: 'lec4.datascience@kiu.ac.ug', role: 'Lecturer', department: 'Data Science', password: 'Admin@123' },
    { name: 'Lecturer 5 Data', email: 'lec5.datascience@kiu.ac.ug', role: 'Lecturer', department: 'Data Science', password: 'Admin@123' },

    { name: 'Sentongo Sayid', email: 'ssayid@kiu.ac.ug', role: 'Lecturer', department: 'Business Admin', password: 'Admin@123' },
    { name: 'Lecturer 2 Business', email: 'lec2.businessadmin@kiu.ac.ug', role: 'Lecturer', department: 'Business Admin', password: 'Admin@123' },
    { name: 'Lecturer 3 Business', email: 'lec3.businessadmin@kiu.ac.ug', role: 'Lecturer', department: 'Business Admin', password: 'Admin@123' },
    { name: 'Lecturer 4 Business', email: 'lec4.businessadmin@kiu.ac.ug', role: 'Lecturer', department: 'Business Admin', password: 'Admin@123' },
    { name: 'Lecturer 5 Business', email: 'lec5.businessadmin@kiu.ac.ug', role: 'Lecturer', department: 'Business Admin', password: 'Admin@123' },
  ],
  'Students': [
    { name: 'Enoch Micah', email: 'enoch.micah@kiu.ac.ug', role: 'Student', department: 'Computer Science', password: 'Admin@123' },
    { name: 'Stud Comp2', email: 'std.comp2@kiu.ac.ug', role: 'Student', department: 'Computer Science', password: 'Admin@123' },
    { name: 'Stud Comp3', email: 'std.comp3@kiu.ac.ug', role: 'Student', department: 'Computer Science', password: 'Admin@123' },
    { name: 'Stud Comp4', email: 'std.comp4@kiu.ac.ug', role: 'Student', department: 'Computer Science', password: 'Admin@123' },
    { name: 'Stud Comp5', email: 'std.comp5@kiu.ac.ug', role: 'Student', department: 'Computer Science', password: 'Admin@123' },

    { name: 'Stud Bus1', email: 'std.bus1@kiu.ac.ug', role: 'Student', department: 'Business Admin', password: 'Admin@123' },
    { name: 'Stud Bus2', email: 'std.bus2@kiu.ac.ug', role: 'Student', department: 'Business Admin', password: 'Admin@123' },
    { name: 'Stud Bus3', email: 'std.bus3@kiu.ac.ug', role: 'Student', department: 'Business Admin', password: 'Admin@123' },
    { name: 'Stud Bus4', email: 'std.bus4@kiu.ac.ug', role: 'Student', department: 'Business Admin', password: 'Admin@123' },
    { name: 'Stud Bus5', email: 'std.bus5@kiu.ac.ug', role: 'Student', department: 'Business Admin', password: 'Admin@123' },
  ]
};

export default function Credentials() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const getSectionIcon = (title: string) => {
    if (title.includes('HOD')) return <Briefcase className="w-5 h-5 text-emerald-500" />;
    if (title.includes('Lecturers')) return <Users className="w-5 h-5 text-amber-500" />;
    return <GraduationCap className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-6">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">System Credentials</h1>
            <p className="text-slate-500 mt-1">Quick copy credentials for demo purposes. Click any email or password to copy.</p>
          </div>
          <a href="/login" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition">
            Back to Login
          </a>
        </div>

        <div className="space-y-8">
          {Object.entries(demoCredentials).map(([category, users]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                {getSectionIcon(category)}
                <h2 className="text-xl font-bold text-slate-700">{category}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {users.map((user, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-[#34b05a] transition-colors" />
                    
                    <h3 className="font-semibold text-slate-800 text-sm truncate">{user.name}</h3>
                    <p className="text-xs font-medium text-slate-500 mb-3 truncate" title={`${user.role} ${user.department ? `- ${user.department}` : ''}`}>
                      {user.role} {user.department && `- ${user.department}`}
                    </p>
                    
                    <div className="space-y-2">
                      <button 
                        onClick={() => handleCopy(user.email, user.email)}
                        className="w-full flex justify-between items-center bg-slate-50 hover:bg-[#34b05a]/10 p-2 rounded-lg text-xs transition-colors border border-slate-100"
                        title="Copy Email"
                      >
                        <span className="font-mono text-slate-600 truncate mr-2">{user.email}</span>
                        {copied === user.email ? (
                          <CheckCircle className="w-3.5 h-3.5 text-[#34b05a] flex-shrink-0" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        )}
                      </button>

                      <button 
                        onClick={() => handleCopy(user.password || 'Admin@123', user.password || 'Admin@123')}
                        className="w-full flex justify-between items-center bg-slate-50 hover:bg-emerald-50 p-2 rounded-lg text-xs transition-colors border border-slate-100"
                        title="Copy Password"
                      >
                        <span className="font-mono text-slate-600 truncate mr-2">{user.password || 'Admin@123'}</span>
                        {copied === (user.password || 'Admin@123') ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
