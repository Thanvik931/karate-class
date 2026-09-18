import React from 'react';
import { Shield, User, LogOut, Users, Phone, Award } from 'lucide-react';

export default function Navbar({ user, dojoInfo, onLogout }) {
  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">Admin (Owner)</span>;
      case 'instructor':
        return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">Instructor</span>;
      case 'student':
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">Student</span>;
      case 'parent':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">Parent</span>;
      default:
        return null;
    }
  };

  const activeCount = dojoInfo ? dojoInfo.active_students_count : 0;
  const maxCapacity = dojoInfo ? dojoInfo.max_capacity : 50;
  const capacityPercent = dojoInfo ? dojoInfo.capacity_percentage : 0;

  return (
    <nav className="bg-slate-950 border-b border-slate-800 text-white sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Dojo Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-md shadow-red-900/30 border border-red-400/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white uppercase">
                  Ultimate Fitness
                </span>
                <span className="hidden sm:inline text-xs bg-red-600/30 text-red-300 font-semibold px-2 py-0.5 rounded-md border border-red-500/30">
                  Shotokan
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>Head Instructor: Afroz Khan</span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-0.5 text-slate-300">
                  <Phone className="w-3 h-3 text-red-400" /> 9133538828
                </span>
              </p>
            </div>
          </div>

          {/* Dojo Capacity Indicator & User Badge */}
          <div className="flex items-center gap-4">
            {/* Dojo Capacity Metric */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Users className="w-4 h-4 text-red-400" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Dojo Capacity:</span>
                  <span className="font-bold text-white">{activeCount} / {maxCapacity}</span>
                </div>
                <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-0.5">
                  <div
                    className={`h-full rounded-full ${
                      capacityPercent >= 90 ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 to-yellow-500'
                    }`}
                    style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* User Badge */}
            <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-100">{user?.name || user?.username}</div>
                <div className="mt-0.5">{getRoleBadge(user?.role)}</div>
              </div>

              <button
                onClick={onLogout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
