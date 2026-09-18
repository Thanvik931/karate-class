import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Calendar, Clock, User, Star, FileText, CheckCircle2 } from 'lucide-react';
import BeltBadge from './BeltBadge';

export default function TrainingLogs({ user, token, dojoInfo }) {
  const [batches, setBatches] = useState(dojoInfo?.batches || []);
  const [selectedBatch, setSelectedBatch] = useState(batches[0] || 'Evening Batch 1 (5:00–6:00 PM)');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Student specific notes
  const [studentNotes, setStudentNotes] = useState([]);

  // New Log Form
  const [showModal, setShowModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [logForm, setLogForm] = useState({
    date: new Date().toISOString().split('T')[0],
    batch: batches[0] || 'Evening Batch 1 (5:00–6:00 PM)',
    syllabus_covered: '',
    drills_conducted: '',
    general_notes: ''
  });
  const [ratings, setRatings] = useState({}); // { student_id: { rating: 5, note: '' } }

  const isAdminOrInst = user?.role === 'admin' || user?.role === 'instructor';

  const fetchLogs = async () => {
    setLoading(true);
    try {
      if (isAdminOrInst) {
        const res = await fetch(`/api/class-logs?batch=${encodeURIComponent(selectedBatch)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setLogs(data.logs || []);
      } else if (user?.studentDetails?.id) {
        const res = await fetch(`/api/class-logs/student/${user.studentDetails.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setStudentNotes(data.notes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchStudents = async () => {
    try {
      const res = await fetch(`/api/students?batch=${encodeURIComponent(logForm.batch)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.students) {
        setStudents(data.students);
        const initRatings = {};
        data.students.forEach(s => {
          initRatings[s.id] = { rating: 5, note: 'Good focus and posture.' };
        });
        setRatings(initRatings);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedBatch]);

  useEffect(() => {
    if (showModal) fetchBatchStudents();
  }, [showModal, logForm.batch]);

  const handleCreateLog = async (e) => {
    e.preventDefault();
    if (!logForm.syllabus_covered) return;

    const performance_notes = Object.keys(ratings).map(sId => ({
      student_id: parseInt(sId),
      rating: ratings[sId].rating,
      performance_note: ratings[sId].note
    }));

    try {
      const res = await fetch('/api/class-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...logForm, performance_notes })
      });
      if (res.ok) {
        setShowModal(false);
        setLogForm({
          date: new Date().toISOString().split('T')[0],
          batch: selectedBatch,
          syllabus_covered: '',
          drills_conducted: '',
          general_notes: ''
        });
        fetchLogs();
      }
    } catch (err) {
      alert('Failed to save training log');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white">Class & Training Session Logs</h1>
            <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">
              Module 6
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Instructor session logs detailing syllabus covered, drills, and individual student performance notes.
          </p>
        </div>

        {isAdminOrInst && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 font-bold text-xs uppercase tracking-wider text-white rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Log New Session
          </button>
        )}
      </div>

      {isAdminOrInst ? (
        <>
          {/* Batch Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md w-full sm:w-80">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Select Batch Roster
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            >
              {dojoInfo?.batches?.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Logs List */}
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Loading training logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
              No session logs recorded for {selectedBatch} yet.
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">{log.syllabus_covered}</h3>
                        <p className="text-xs text-slate-400">Instructor: {log.instructor_name} • {log.batch}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 font-mono text-xs text-emerald-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                      <Calendar className="w-3.5 h-3.5" /> {log.date}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {log.drills_conducted && (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="font-bold text-red-400 uppercase tracking-wider block mb-1">Drills Conducted</span>
                        <p className="text-slate-300">{log.drills_conducted}</p>
                      </div>
                    )}

                    {log.general_notes && (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="font-bold text-yellow-400 uppercase tracking-wider block mb-1">Instructor Notes</span>
                        <p className="text-slate-300">{log.general_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Student/Parent View */
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> My Training Session Performance Feedback
          </h2>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Loading performance notes...</div>
          ) : studentNotes.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
              No specific session feedback logged yet.
            </div>
          ) : (
            <div className="space-y-3">
              {studentNotes.map((note) => (
                <div key={note.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white text-sm">{note.syllabus_covered}</span>
                      <div className="flex items-center gap-1 text-yellow-400 text-xs">
                        {[...Array(note.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800/80 mt-2">
                      "{note.performance_note}"
                    </p>
                    <p className="text-[11px] text-slate-500 mt-2">By Sensei {note.instructor_name} • {note.batch}</p>
                  </div>

                  <div className="font-mono text-xs text-emerald-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 whitespace-nowrap">
                    {note.date}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <h3 className="font-bold text-white text-base border-b border-slate-800 pb-3">Log Class Training Session</h3>

            <form onSubmit={handleCreateLog} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Session Date *</label>
                  <input
                    type="date"
                    required
                    value={logForm.date}
                    onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Training Batch *</label>
                  <select
                    value={logForm.batch}
                    onChange={(e) => setLogForm({ ...logForm, batch: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {dojoInfo?.batches?.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Syllabus / Katas / Techniques Covered *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heian Nidan Kata breakdown & Gyaku Zuki sparring drills"
                  value={logForm.syllabus_covered}
                  onChange={(e) => setLogForm({ ...logForm, syllabus_covered: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Drills & Exercises Conducted</label>
                  <textarea
                    rows="2"
                    placeholder="e.g. 100 Gedan Barai repetitions, speed kicking on pads"
                    value={logForm.drills_conducted}
                    onChange={(e) => setLogForm({ ...logForm, drills_conducted: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">General Session Notes</label>
                  <textarea
                    rows="2"
                    placeholder="e.g. High energy session, focused on stance stability"
                    value={logForm.general_notes}
                    onChange={(e) => setLogForm({ ...logForm, general_notes: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  ></textarea>
                </div>
              </div>

              {/* Student Performance Ratings */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-2">
                  Student Performance Feedback ({students.length} Students)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {students.map((s) => (
                    <div key={s.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-white">{s.name}</span>
                        <BeltBadge beltRank={s.belt_rank} className="ml-2 text-[10px] px-1.5" />
                      </div>
                      <input
                        type="text"
                        placeholder="Performance note..."
                        value={ratings[s.id]?.note || ''}
                        onChange={(e) => setRatings({ ...ratings, [s.id]: { ...ratings[s.id], note: e.target.value } })}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-[11px]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-600 text-white rounded-xl font-bold uppercase"
                >
                  Save Training Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
