import React, { useState, useEffect } from 'react';
import { Calendar, Megaphone, Pin, Plus, Clock, ShieldAlert, User, Trash2 } from 'lucide-react';

export default function TimetableAnnouncements({ user, token }) {
  const [activeTab, setActiveTab] = useState('announcements'); // 'announcements' or 'timetable'
  const [announcements, setAnnouncements] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Announcement Modal
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annForm, setAnnForm] = useState({
    title: '',
    content: '',
    target_role: 'all',
    is_pinned: false
  });

  const isAdminOrInst = user?.role === 'admin' || user?.role === 'instructor';

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/announcements', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetable = async () => {
    try {
      const res = await fetch('/api/timetable', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setTimetable(data.schedule || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchTimetable();
  }, []);

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!annForm.title || !annForm.content) return;

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(annForm)
      });
      if (res.ok) {
        setShowAnnModal(false);
        setAnnForm({ title: '', content: '', target_role: 'all', is_pinned: false });
        fetchAnnouncements();
      }
    } catch (err) {
      alert('Failed to post announcement');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchAnnouncements();
    } catch (err) {
      alert('Failed to delete announcement');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white">Timetable & Dojo Announcements</h1>
            <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">
              Module 8
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Weekly training schedule, syllabus focus areas, and official academy announcements.
          </p>
        </div>

        {/* Tab Switcher & Post Button */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('announcements')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'announcements' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Announcements
            </button>
            <button
              onClick={() => setActiveTab('timetable')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'timetable' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Weekly Schedule
            </button>
          </div>

          {isAdminOrInst && activeTab === 'announcements' && (
            <button
              onClick={() => setShowAnnModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 font-bold text-xs uppercase tracking-wider text-white rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Post Notice
            </button>
          )}
        </div>
      </div>

      {activeTab === 'announcements' ? (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
              No announcements posted yet.
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`bg-slate-900 border rounded-2xl p-6 shadow-md transition-all ${
                    ann.is_pinned ? 'border-red-500/50 bg-slate-900/90' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      {ann.is_pinned === 1 && (
                        <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                          <Pin className="w-3 h-3 fill-current" /> Pinned
                        </span>
                      )}
                      <h3 className="font-extrabold text-white text-base">{ann.title}</h3>
                    </div>

                    {isAdminOrInst && (
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800/80 mb-3 whitespace-pre-line">
                    {ann.content}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Posted by {ann.author}</span>
                    <span>Target: {ann.target_role.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Weekly Timetable Schedule */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="w-5 h-5 text-red-500" /> Weekly Batch Training Schedule
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Monday', 'Wednesday', 'Friday'].map((day) => {
              const daySlots = timetable.filter(t => t.day_of_week === day);
              return (
                <div key={day} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="font-extrabold text-white text-sm border-b border-slate-800 pb-2 flex items-center justify-between">
                    <span>{day}</span>
                    <span className="text-slate-500 text-xs font-normal">Regular Classes</span>
                  </div>

                  <div className="space-y-3">
                    {daySlots.map((slot) => (
                      <div key={slot.id} className="bg-slate-900 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1">
                        <div className="font-bold text-red-400">{slot.batch}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{slot.time_slot}</div>
                        <div className="text-slate-200 font-medium">Focus: {slot.focus_area}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notice Modal */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Post Announcement</h3>

            <form onSubmit={handlePostAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Belt Promotion Grading Exam Date"
                  value={annForm.title}
                  onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Content Details *</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Detailed announcement instructions..."
                  value={annForm.content}
                  onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                ></textarea>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pin"
                  checked={annForm.is_pinned}
                  onChange={(e) => setAnnForm({ ...annForm, is_pinned: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="pin" className="text-slate-300 font-medium">Pin announcement to top</label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-600 text-white rounded-xl font-bold uppercase"
                >
                  Post Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
