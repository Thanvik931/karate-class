import React, { useState, useEffect } from 'react';
import { User, Award, Clock, Calendar, Phone, Shield, CheckCircle2 } from 'lucide-react';
import BeltBadge from './BeltBadge';

export default function StudentPortal({ user, token, dojoInfo }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/students/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load profile');
        setProfile(data.student);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading student profile...</div>;
  }

  if (error || !profile) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-400 text-center">
        {error || 'Student profile not found'}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-red-600/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-red-900/30 border border-red-400/30">
              {profile.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{profile.name}</h1>
                <span className="font-mono text-xs font-bold bg-slate-950 text-red-400 px-2 py-0.5 rounded border border-slate-800">
                  {profile.student_code}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Active Student • Shotokan Karate Division
              </p>
            </div>
          </div>

          <div className="sm:text-right">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Rank</div>
            <BeltBadge beltRank={profile.belt_rank} className="text-sm px-4 py-1.5" />
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              <Clock className="w-4 h-4 text-red-400" /> Training Batch
            </div>
            <p className="text-sm font-bold text-white">{profile.batch}</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              <Calendar className="w-4 h-4 text-emerald-400" /> Enrollment Date
            </div>
            <p className="text-sm font-bold text-white">{profile.join_date}</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              <User className="w-4 h-4 text-blue-400" /> Contact Phone
            </div>
            <p className="text-sm font-bold text-white">{profile.contact}</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              <Phone className="w-4 h-4 text-yellow-400" /> Guardian Info ({profile.guardian_relation})
            </div>
            <p className="text-sm font-bold text-white">{profile.guardian_name}</p>
            <p className="text-xs text-slate-400 mt-0.5">Phone: {profile.guardian_phone}</p>
          </div>
        </div>

        {/* Dojo Banner */}
        <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-500" />
            <span>Ultimate Fitness Martial Arts Academy</span>
          </div>
          <div>Head Instructor: Sensei Afroz Khan (Black Belt)</div>
        </div>
      </div>
    </div>
  );
}
