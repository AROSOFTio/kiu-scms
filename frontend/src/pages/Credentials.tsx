import React, { useState } from 'react';
import { Copy, CheckCircle, Shield, Briefcase, GraduationCap, Users } from 'lucide-react';

interface Credential {
  name: string;
  email: string;
  role: string;
  password?: string;
  department?: string;
}

const demoCredentials: Record<string, Credential[]> = {
  'Top Management & Admin': [
    { name: 'Admin User', email: 'admin@kiu.ac.ug', role: 'SuperAdmin', password: 'Admin@123' },
    { name: 'Sentongo Sayid', email: 'ssayid@kiu.ac.ug', role: 'Vice Chancellor', password: 'Admin@123' },
    { name: 'Registrar User', email: 'registrar@kiu.ac.ug', role: 'Registrar', password: 'Admin@123' },
    { name: 'Quality Assurance', email: 'qa@kiu.ac.ug', role: 'Quality Assurance', password: 'Admin@123' },
    { name: 'PRO Team', email: 'pro@kiu.ac.ug', role: 'PRO', password: 'Admin@123' },
  ],
  'Heads of Department (HOD)': [
    { name: 'Bwire Fred', email: 'bfred.hod@kiu.ac.ug', role: 'HOD', department: 'Computer Science', password: 'Admin@123' },
    { name: 'Apio Presiline', email: 'papio.hod@kiu.ac.ug', role: 'HOD', department: 'Information Technology', password: 'Admin@123' },
    { name: 'HOD Software Eng', email: 'hod.se@kiu.ac.ug', role: 'HOD', department: 'Software Engineering', password: 'Admin@123' },
    { name: 'HOD Data Science', email: 'hod.ds@kiu.ac.ug', role: 'HOD', department: 'Data Science', password: 'Admin@123' },
    { name: 'HOD Business Admin', email: 'hod.ba@kiu.ac.ug', role: 'HOD', department: 'Business Admin', password: 'Admin@123' },
  ],
  'Lecturers / Staff': [
    { name: 'Lecturer One', email: 'lecturer1@kiu.ac.ug', role: 'Lecturer', department: 'Computer Science', password: 'Admin@123' },
    { name: 'Lecturer Two', email: 'lecturer2@kiu.ac.ug', role: 'Lecturer', department: 'Computer Science', password: 'Admin@123' },
    { name: 'Lecturer Three', email: 'lecturer3@kiu.ac.ug', role: 'Lecturer', department: 'Information Technology', password: 'Admin@123' },
    { name: 'Lecturer Four', email: 'lecturer4@kiu.ac.ug', role: 'Lecturer', department: 'Information Technology', password: 'Admin@123' },
    { name: 'Lecturer Five', email: 'lecturer5@kiu.ac.ug', role: 'Lecturer', department: 'Software Engineering', password: 'Admin@123' },
  ],
  'Students': [
    { name: 'Enoch Micah', email: 'enoch.micah@kiu.ac.ug', role: 'Student', department: 'Computer Science', password: 'Admin@123' },
    { name: 'Student Two', email: 'student2@kiu.ac.ug', role: 'Student', department: 'Computer Science', password: 'Admin@123' },
    { name: 'Student Three', email: 'student3@kiu.ac.ug', role: 'Student', department: 'Information Technology', password: 'Admin@123' },
    { name: 'Student Four', email: 'student4@kiu.ac.ug', role: 'Student', department: 'Information Technology', password: 'Admin@123' },
    { name: 'Student Five', email: 'student5@kiu.ac.ug', role: 'Student', department: 'Software Engineering', password: 'Admin@123' },
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
    if (title.includes('Management')) return <Shield className="w-5 h-5 text-indigo-500" />;
    if (title.includes('HOD')) return <Briefcase className="w-5 h-5 text-emerald-500" />;
    if (title.includes('Lecturers')) return <Users className="w-5 h-5 text-amber-500" />;
    return <GraduationCap className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-6">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-800">System Credentials</h1>
          <p className="text-slate-500 mt-1">Quick copy credentials for demo purposes. Click any email or password to copy.</p>
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
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-indigo-500 transition-colors" />
                    
                    <h3 className="font-semibold text-slate-800 text-sm truncate">{user.name}</h3>
                    <p className="text-xs font-medium text-slate-500 mb-3">{user.role} {user.department && `- ${user.department}`}</p>
                    
                    <div className="space-y-2">
                      <button 
                        onClick={() => handleCopy(user.email, user.email)}
                        className="w-full flex justify-between items-center bg-slate-50 hover:bg-indigo-50 p-2 rounded-lg text-xs transition-colors border border-slate-100"
                        title="Copy Email"
                      >
                        <span className="font-mono text-slate-600 truncate mr-2">{user.email}</span>
                        {copied === user.email ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
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
