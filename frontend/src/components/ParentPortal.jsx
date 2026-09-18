import React, { useState, useEffect } from 'react';
import { User, Award, Clock, Calendar, Phone, Shield, CheckCircle2 } from 'lucide-react';
import BeltBadge from './BeltBadge';

export default function ParentPortal({ user, token, dojoInfo }) {
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
        if (!res.ok) throw new Error(data.error || 'Failed to load child profile');
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
    return <div className="text-center py-12 text-slate-400">Loading child profile...</div>;
  }

  if (error || !profile) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-400 text-center">
        {error || 'Child student profile not found'}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">Parent Portal Overview</h1>
            <p className="text-xs text-slate-400">Welcome, {user.name} ({profile.guardian_relation})</p>
          </div>
        </div>

        {/* Child Profile Card */}
        <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Enrolled Child</div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-white">{profile.name}</h2>
                <span className="font-mono text-xs font-bold bg-slate-900 text-red-400 px-2 py-0.5 rounded border border-slate-800">
                  {profile.student_code}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Age: {profile.age} years</p>
            </div>

            <div className="sm:text-right">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Belt Level</div>
              <BeltBadge beltRank={profile.belt_rank} className="text-sm px-4 py-1.5" />
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                <Clock className="w-4 h-4 text-red-400" /> Class Batch Schedule
              </div>
              <p className="text-sm font-bold text-white">{profile.batch}</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                <Calendar className="w-4 h-4 text-emerald-400" /> Joined Dojo
              </div>
              <p className="text-sm font-bold text-white">{profile.join_date}</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                <Phone className="w-4 h-4 text-yellow-400" /> Guardian Registered Phone
              </div>
              <p className="text-sm font-bold text-white">{profile.guardian_phone}</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                <Shield className="w-4 h-4 text-blue-400" /> Head Instructor Contact
              </div>
              <p className="text-sm font-bold text-white">Afroz Khan (Black Belt)</p>
              <p className="text-xs text-slate-400 mt-0.5">Phone: 9133538828</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
