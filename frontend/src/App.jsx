import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import Navbar from './components/Navbar';
import AdminStudentManagement from './components/AdminStudentManagement';
import StudentPortal from './components/StudentPortal';
import ParentPortal from './components/ParentPortal';
import AttendanceTracker from './components/AttendanceTracker';
import SyllabusManager from './components/SyllabusManager';
import KataLibrary from './components/KataLibrary';
import Glossary from './components/Glossary';
import TrainingLogs from './components/TrainingLogs';
import FeesManagement from './components/FeesManagement';
import TimetableAnnouncements from './components/TimetableAnnouncements';
import CompetitionsEvents from './components/CompetitionsEvents';
import {
  Users,
  CalendarCheck,
  Award,
  BookOpen,
  Languages,
  ClipboardList,
  IndianRupee,
  Megaphone,
  Trophy
} from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('dojo_token') || '');
  const [user, setUser] = useState(null);
  const [dojoInfo, setDojoInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roster'); 

  const fetchDojoInfo = async () => {
    try {
      const res = await fetch('/api/dojo/info');
      const data = await res.json();
      if (res.ok) setDojoInfo(data);
    } catch (err) {
      console.error('Failed to fetch dojo info:', err);
    }
  };

  useEffect(() => {
    fetchDojoInfo();

    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          if (!res.ok) throw new Error('Session expired');
          return res.json();
        })
        .then((data) => {
          setUser(data.user);
        })
        .catch(() => {
          handleLogout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleLoginSuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('dojo_token', authToken);
    fetchDojoInfo();
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('dojo_token');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Initializing Ultimate Dojo ERP...
      </div>
    );
  }

  if (!token || !user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdminOrInst = user.role === 'admin' || user.role === 'instructor';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar user={user} dojoInfo={dojoInfo} onLogout={handleLogout} />

      {/* Complete ERP Navigation Bar */}
      <div className="bg-slate-900 border-b border-slate-800 py-2.5 px-4 sm:px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto text-xs font-bold scrollbar-none">
          {isAdminOrInst ? (
            <>
              <button
                onClick={() => setActiveTab('roster')}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'roster' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" /> 1-3. Student Roster
              </button>

              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'attendance' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <CalendarCheck className="w-4 h-4 text-blue-400" /> 4. Daily Attendance
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'roster' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" /> My Profile
            </button>
          )}

          <button
            onClick={() => setActiveTab('syllabus')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'syllabus' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4 text-yellow-400" /> 5. Belt & Syllabus
          </button>

          <button
            onClick={() => setActiveTab('katas')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'katas' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-400" /> Kata Library
          </button>

          <button
            onClick={() => setActiveTab('glossary')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'glossary' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Languages className="w-4 h-4 text-sky-400" /> Terminology
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'logs' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4 text-purple-400" /> 6. Training Logs
          </button>

          <button
            onClick={() => setActiveTab('fees')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'fees' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <IndianRupee className="w-4 h-4 text-emerald-400" /> 7. Fees Management
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'announcements' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Megaphone className="w-4 h-4 text-indigo-400" /> 8. Timetable & News
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'events' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" /> 9. Competitions & Medals
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'roster' && (
          isAdminOrInst ? (
            <AdminStudentManagement
              user={user}
              token={token}
              dojoInfo={dojoInfo}
              onRefreshDojo={fetchDojoInfo}
            />
          ) : user.role === 'student' ? (
            <StudentPortal user={user} token={token} dojoInfo={dojoInfo} />
          ) : (
            <ParentPortal user={user} token={token} dojoInfo={dojoInfo} />
          )
        )}

        {activeTab === 'attendance' && (
          <AttendanceTracker user={user} token={token} dojoInfo={dojoInfo} />
        )}

        {activeTab === 'syllabus' && (
          <SyllabusManager
            user={user}
            token={token}
            dojoInfo={dojoInfo}
            onRefreshDojo={fetchDojoInfo}
          />
        )}

        {activeTab === 'katas' && (
          <KataLibrary user={user} token={token} dojoInfo={dojoInfo} />
        )}

        {activeTab === 'glossary' && (
          <Glossary user={user} token={token} />
        )}

        {activeTab === 'logs' && (
          <TrainingLogs user={user} token={token} dojoInfo={dojoInfo} />
        )}

        {activeTab === 'fees' && (
          <FeesManagement user={user} token={token} />
        )}

        {activeTab === 'announcements' && (
          <TimetableAnnouncements user={user} token={token} />
        )}

        {activeTab === 'events' && (
          <CompetitionsEvents user={user} token={token} />
        )}
      </main>

      <footer className="bg-slate-950 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        <p>Ultimate Fitness Martial Arts Academy ERP • Shotokan Karate Division</p>
        <p className="mt-0.5 text-[11px] text-slate-600">All 9 ERP Modules Fully Built & Functional</p>
      </footer>
    </div>
  );
}
