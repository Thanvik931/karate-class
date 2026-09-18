import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, MapPin, Award, Plus, UserPlus, Medal, Shield } from 'lucide-react';
import BeltBadge from './BeltBadge';

export default function CompetitionsEvents({ user, token }) {
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompId, setSelectedCompId] = useState('');
  const [participations, setParticipations] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Competition Modal
  const [showCompModal, setShowCompModal] = useState(false);
  const [compForm, setCompForm] = useState({
    title: '',
    event_type: 'Tournament',
    event_date: new Date().toISOString().split('T')[0],
    venue: '',
    description: '',
    entry_fee: 500
  });

  // Participation Form Modal
  const [showPartModal, setShowPartModal] = useState(false);
  const [partForm, setPartForm] = useState({
    student_id: '',
    category: 'Junior Kata',
    result: 'Registered',
    notes: ''
  });

  const isAdminOrInst = user?.role === 'admin' || user?.role === 'instructor';

  const fetchCompetitions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/competitions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.competitions) {
        setCompetitions(data.competitions);
        if (data.competitions.length > 0 && !selectedCompId) {
          setSelectedCompId(data.competitions[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipations = async () => {
    if (!selectedCompId) return;
    try {
      const res = await fetch(`/api/competitions/${selectedCompId}/participations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setParticipations(data.participations || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.students) {
        setStudents(data.students);
        if (data.students.length > 0) setPartForm(prev => ({ ...prev, student_id: data.students[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  useEffect(() => {
    if (selectedCompId) fetchParticipations();
  }, [selectedCompId]);

  useEffect(() => {
    if (showPartModal) fetchStudents();
  }, [showPartModal]);

  const handleCreateCompetition = async (e) => {
    e.preventDefault();
    if (!compForm.title || !compForm.event_date || !compForm.venue) return;

    try {
      const res = await fetch('/api/competitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(compForm)
      });
      if (res.ok) {
        setShowCompModal(false);
        fetchCompetitions();
      }
    } catch (err) {
      alert('Failed to create event');
    }
  };

  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    if (!partForm.student_id || !partForm.category) return;

    try {
      const res = await fetch(`/api/competitions/${selectedCompId}/participations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(partForm)
      });
      if (res.ok) {
        setShowPartModal(false);
        fetchParticipations();
      }
    } catch (err) {
      alert('Failed to register student');
    }
  };

  const selectedComp = competitions.find(c => String(c.id) === String(selectedCompId));

  const getResultBadge = (result) => {
    switch (result) {
      case 'Gold Medal':
        return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase flex items-center gap-1">🥇 Gold Medal</span>;
      case 'Silver Medal':
        return <span className="bg-slate-300/20 text-slate-200 border border-slate-300/40 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase flex items-center gap-1">🥈 Silver Medal</span>;
      case 'Bronze Medal':
        return <span className="bg-amber-700/20 text-amber-400 border border-amber-700/40 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase flex items-center gap-1">🥉 Bronze Medal</span>;
      case 'Participant':
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase">Participant</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase">Registered</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white">Competitions, Camps & Events</h1>
            <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">
              Module 9
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Log state/national karate tournaments, training camps, student registrations, and medal results.
          </p>
        </div>

        {isAdminOrInst && (
          <button
            onClick={() => setShowCompModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 font-bold text-xs uppercase tracking-wider text-white rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Event
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading competitions...</div>
      ) : competitions.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
          No competitions or events logged yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Events Selector Column */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Championship / Event
            </label>
            <div className="space-y-3">
              {competitions.map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => setSelectedCompId(comp.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    String(selectedCompId) === String(comp.id)
                      ? 'bg-slate-900 border-red-500 shadow-lg'
                      : 'bg-slate-950 border-slate-800 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      {comp.event_type}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-400" /> {comp.event_date}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-sm mt-1">{comp.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-400" /> {comp.venue}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Event Details & Participations Roster Column */}
          <div className="lg:col-span-2 space-y-4">
            {selectedComp && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
                  <div>
                    <h2 className="text-lg font-extrabold text-white">{selectedComp.title}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedComp.description}</p>
                    <p className="text-xs text-slate-300 mt-1">
                      Venue: <span className="font-semibold text-white">{selectedComp.venue}</span> • Entry Fee: <span className="font-mono text-emerald-400">₹{selectedComp.entry_fee}</span>
                    </p>
                  </div>

                  {isAdminOrInst && (
                    <button
                      onClick={() => setShowPartModal(true)}
                      className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" /> Register Student
                    </button>
                  )}
                </div>

                {/* Participations List */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Student Participants & Medal Results ({participations.length})
                  </h3>

                  {participations.length === 0 ? (
                    <div className="text-center py-8 bg-slate-950 border border-slate-800/80 rounded-xl text-slate-400 text-xs">
                      No students registered for this event yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {participations.map((part) => (
                        <div
                          key={part.id}
                          className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{part.student_name}</span>
                              <span className="font-mono text-[10px] bg-slate-900 text-red-400 px-1.5 py-0.5 rounded border border-slate-800">
                                {part.student_code}
                              </span>
                              <BeltBadge beltRank={part.belt_rank} className="text-[10px] px-2 py-0.5" />
                            </div>
                            <p className="text-slate-400 mt-1">
                              Category: <span className="text-slate-200 font-semibold">{part.category}</span>
                            </p>
                            {part.notes && <p className="text-[11px] text-slate-500 mt-0.5">{part.notes}</p>}
                          </div>

                          <div>{getResultBadge(part.result)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showCompModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Create Tournament / Camp Event</h3>

            <form onSubmit={handleCreateCompetition} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Shotokan Championship 2026"
                  value={compForm.title}
                  onChange={(e) => setCompForm({ ...compForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Event Type</label>
                <select
                  value={compForm.event_type}
                  onChange={(e) => setCompForm({ ...compForm, event_type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Tournament">Tournament</option>
                  <option value="Camp">Training Camp</option>
                  <option value="Grading Exam">Grading Exam</option>
                  <option value="Seminar">Seminar</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Event Date *</label>
                <input
                  type="date"
                  required
                  value={compForm.event_date}
                  onChange={(e) => setCompForm({ ...compForm, event_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Venue *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indoor Stadium, Hyderabad"
                  value={compForm.venue}
                  onChange={(e) => setCompForm({ ...compForm, venue: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Description</label>
                <textarea
                  rows="2"
                  placeholder="Event details and categories..."
                  value={compForm.description}
                  onChange={(e) => setCompForm({ ...compForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-600 text-white rounded-xl font-bold uppercase"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Participation Modal */}
      {showPartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Register Student & Log Result</h3>

            <form onSubmit={handleRegisterStudent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Select Student *</label>
                <select
                  value={partForm.student_id}
                  onChange={(e) => setPartForm({ ...partForm, student_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.student_code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Competition Category *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Junior Kata (12-14 yrs) or Under 50kg Kumite"
                  value={partForm.category}
                  onChange={(e) => setPartForm({ ...partForm, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Result / Medal</label>
                <select
                  value={partForm.result}
                  onChange={(e) => setPartForm({ ...partForm, result: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Registered">Registered</option>
                  <option value="Participant">Participant Certificate</option>
                  <option value="Gold Medal">🥇 Gold Medal</option>
                  <option value="Silver Medal">🥈 Silver Medal</option>
                  <option value="Bronze Medal">🥉 Bronze Medal</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Notes / Performance</label>
                <input
                  type="text"
                  placeholder="e.g. Outstanding Heian Nidan performance"
                  value={partForm.notes}
                  onChange={(e) => setPartForm({ ...partForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPartModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-600 text-white rounded-xl font-bold uppercase"
                >
                  Save Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
