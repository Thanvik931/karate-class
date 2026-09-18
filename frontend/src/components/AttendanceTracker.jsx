import React, { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle2, XCircle, AlertCircle, Save, Bell } from 'lucide-react';
import BeltBadge from './BeltBadge';

export default function AttendanceTracker({ user, token, dojoInfo }) {
  const [batches, setBatches] = useState(dojoInfo?.batches || []);
  const [selectedBatch, setSelectedBatch] = useState(batches[0] || 'Evening Batch 1 (5:00–6:00 PM)');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { student_id: { status: 'present'|'absent'|'late', notes: '' } }
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [error, setError] = useState('');

  const isAdminOrInst = user?.role === 'admin' || user?.role === 'instructor';

  // Fetch students for selected batch
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students?batch=${encodeURIComponent(selectedBatch)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStudents(data.students || []);
        fetchAttendance(data.students || []);
      }
    } catch (err) {
      setError('Failed to fetch batch roster');
    } finally {
      setLoading(false);
    }
  };

  // Fetch existing attendance records for date & batch
  const fetchAttendance = async (studentList) => {
    try {
      const res = await fetch(`/api/attendance?date=${selectedDate}&batch=${encodeURIComponent(selectedBatch)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      const initialAtt = {};
      studentList.forEach(s => {
        initialAtt[s.id] = { status: 'present', notes: '' };
      });

      if (res.ok && data.records) {
        data.records.forEach(r => {
          initialAtt[r.student_id] = { status: r.status, notes: r.notes || '' };
        });
      }

      setAttendance(initialAtt);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedBatch, selectedDate]);

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleSaveAttendance = async () => {
    setSaveSuccess('');
    setError('');
    const attendanceData = Object.keys(attendance).map(studentId => ({
      student_id: parseInt(studentId),
      status: attendance[studentId].status,
      notes: attendance[studentId].notes
    }));

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          date: selectedDate,
          batch: selectedBatch,
          attendanceData
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save attendance');

      setSaveSuccess('Daily batch attendance saved & parent alerts logged!');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white">Batch Attendance Tracking</h1>
            <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">
              Phase 2 Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mark daily student attendance by batch. Auto-logs absent/late alerts for parents.
          </p>
        </div>

        {isAdminOrInst && (
          <button
            onClick={handleSaveAttendance}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 font-bold text-xs uppercase tracking-wider text-white rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Attendance
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {saveSuccess}
        </div>
      )}

      {/* Selectors */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Select Training Batch
          </label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
          >
            {dojoInfo?.batches?.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
          />
        </div>
      </div>

      {/* Roster Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading batch roster...</div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
          No active students assigned to {selectedBatch}.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="divide-y divide-slate-800">
            {students.map((student) => {
              const currentAtt = attendance[student.id] || { status: 'present', notes: '' };
              return (
                <div
                  key={student.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 hover:bg-slate-950/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-white text-sm">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{student.name}</span>
                        <span className="font-mono text-[10px] bg-slate-950 text-red-400 px-1.5 py-0.5 rounded border border-slate-800">
                          {student.student_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <BeltBadge beltRank={student.belt_rank} className="text-[10px] px-2 py-0.5" />
                        <span className="text-[11px] text-slate-400">Guardian: {student.guardian_name} ({student.guardian_phone})</span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!isAdminOrInst}
                      onClick={() => handleStatusChange(student.id, 'present')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        currentAtt.status === 'present'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Present
                    </button>

                    <button
                      type="button"
                      disabled={!isAdminOrInst}
                      onClick={() => handleStatusChange(student.id, 'late')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        currentAtt.status === 'late'
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" /> Late
                    </button>

                    <button
                      type="button"
                      disabled={!isAdminOrInst}
                      onClick={() => handleStatusChange(student.id, 'absent')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        currentAtt.status === 'absent'
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Absent
                    </button>

                    {/* Auto-Alert indicator if absent/late */}
                    {currentAtt.status !== 'present' && (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg flex items-center gap-1 font-semibold">
                        <Bell className="w-3 h-3 animate-pulse" /> Parent Alert Logged
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
