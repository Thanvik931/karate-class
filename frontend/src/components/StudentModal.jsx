import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, CheckCircle, Copy } from 'lucide-react';
import BeltBadge from './BeltBadge';

export default function StudentModal({ isOpen, onClose, onSave, student = null, beltRanks = [], batches = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    contact: '',
    belt_rank: 'White',
    batch: 'Morning (6:00–7:00 AM)',
    join_date: new Date().toISOString().split('T')[0],
    guardian_name: '',
    guardian_phone: '',
    guardian_relation: 'Father'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState(null);

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        age: student.age || '',
        contact: student.contact || '',
        belt_rank: student.belt_rank || 'White',
        batch: student.batch || batches[0] || 'Morning (6:00–7:00 AM)',
        join_date: student.join_date || new Date().toISOString().split('T')[0],
        guardian_name: student.guardian_name || '',
        guardian_phone: student.guardian_phone || '',
        guardian_relation: student.guardian_relation || 'Father'
      });
    } else {
      setFormData({
        name: '',
        age: '',
        contact: '',
        belt_rank: beltRanks[0] || 'White',
        batch: batches[0] || 'Morning (6:00–7:00 AM)',
        join_date: new Date().toISOString().split('T')[0],
        guardian_name: '',
        guardian_phone: '',
        guardian_relation: 'Father'
      });
    }
    setError('');
    setCreatedCredentials(null);
  }, [student, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.contact || !formData.guardian_name || !formData.guardian_phone) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await onSave(formData, student?.id);
      if (result && result.credentials) {
        setCreatedCredentials(result.credentials);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Error saving student profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <UserPlus className="w-5 h-5 text-red-500" />
            {student ? 'Edit Student Profile' : 'Enroll New Student'}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {createdCredentials ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 text-slate-100">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg mb-2">
                <CheckCircle className="w-6 h-6" />
                Student Enrolled Successfully!
              </div>
              <p className="text-xs text-slate-300 mb-4">
                Login accounts for the student and parent have been automatically created with the following credentials:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="font-bold text-blue-400 uppercase tracking-wider mb-2">Student Account</div>
                  <div className="space-y-1">
                    <div><span className="text-slate-400">Login ID:</span> <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded">{createdCredentials.student.username}</span></div>
                    <div><span className="text-slate-400">Password:</span> <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded">{createdCredentials.student.password}</span></div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="font-bold text-emerald-400 uppercase tracking-wider mb-2">Parent Account</div>
                  <div className="space-y-1">
                    <div><span className="text-slate-400">Login ID:</span> <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded">{createdCredentials.parent.username}</span></div>
                    <div><span className="text-slate-400">Password:</span> <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded">{createdCredentials.parent.password}</span></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const text = `Ultimate Dojo Credentials:\nStudent ID: ${createdCredentials.student.username} / Pass: ${createdCredentials.student.password}\nParent ID: ${createdCredentials.parent.username} / Pass: ${createdCredentials.parent.password}`;
                    navigator.clipboard.writeText(text);
                    alert('Credentials copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-yellow-400" /> Copy Credentials
                </button>

                <button
                  onClick={onClose}
                  className="px-5 py-2 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Done & Close
                </button>
              </div>

            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* Student Personal Info */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-800 pb-1">
                  1. Student Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="e.g. Rohan Sharma"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Age *</label>
                    <input
                      type="number"
                      required
                      min="4"
                      max="80"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="e.g. 14"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Contact Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="e.g. 9876543210"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Join Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.join_date}
                      onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Belt & Batch Assignment */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-800 pb-1">
                  2. Martial Arts Placement
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Shotokan Belt Rank</label>
                    <select
                      value={formData.belt_rank}
                      onChange={(e) => setFormData({ ...formData, belt_rank: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {beltRanks.map((belt) => (
                        <option key={belt} value={belt}>
                          {belt} Belt
                        </option>
                      ))}
                    </select>
                    <div className="mt-2">
                      <BeltBadge beltRank={formData.belt_rank} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Batch</label>
                    <select
                      value={formData.batch}
                      onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {batches.map((batch) => (
                        <option key={batch} value={batch}>
                          {batch}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Guardian Info */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-800 pb-1">
                  3. Parent / Guardian Info
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Guardian Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.guardian_name}
                      onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="e.g. Vikram Sharma"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Guardian Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.guardian_phone}
                      onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="e.g. 9876543211"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Relation</label>
                    <select
                      value={formData.guardian_relation}
                      onChange={(e) => setFormData({ ...formData, guardian_relation: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Legal Guardian</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl text-xs font-bold uppercase shadow-md flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : student ? 'Update Profile' : 'Enroll Student'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
