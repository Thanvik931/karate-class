import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Square,
  Award,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  UserCheck,
  Calendar,
  Shield,
  FileText,
  CheckCircle2
} from 'lucide-react';
import BeltBadge from './BeltBadge';

export default function SyllabusManager({ user, token, dojoInfo, onRefreshDojo }) {
  const [activeTab, setActiveTab] = useState('syllabus'); // 'syllabus' or 'promotions'
  const [beltRanks, setBeltRanks] = useState(dojoInfo?.belt_ranks || []);
  const [selectedBelt, setSelectedBelt] = useState('Yellow');
  const [syllabusItems, setSyllabusItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [completedItemIds, setCompletedItemIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New Syllabus Item state
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    belt_rank: 'Yellow',
    title: '',
    category: 'Kihon',
    description: ''
  });

  // Promotion Form state
  const [promotionForm, setPromotionForm] = useState({
    student_id: '',
    new_belt: 'Yellow',
    notes: '',
    promotion_date: new Date().toISOString().split('T')[0]
  });
  const [promotionHistory, setPromotionHistory] = useState([]);
  const [promotionSuccess, setPromotionSuccess] = useState('');

  const isAdminOrInst = user?.role === 'admin' || user?.role === 'instructor';

  // Fetch Students list
  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.students) {
        setStudents(data.students);
        if (!selectedStudentId && data.students.length > 0) {
          setSelectedStudentId(data.students[0].id);
          setPromotionForm(prev => ({ ...prev, student_id: data.students[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Syllabus Items for selected belt
  const fetchSyllabusItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/syllabus?belt=${encodeURIComponent(selectedBelt)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSyllabusItems(data.items || []);
      }
    } catch (err) {
      setError('Failed to load syllabus items');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Student Progress (completed items)
  const fetchStudentProgress = async () => {
    if (!selectedStudentId) return;
    try {
      const res = await fetch(`/api/syllabus/student/${selectedStudentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCompletedItemIds(data.completedIds || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Promotion History for selected student
  const fetchPromotionHistory = async () => {
    if (!selectedStudentId) return;
    try {
      const res = await fetch(`/api/promotions/student/${selectedStudentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPromotionHistory(data.history || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAdminOrInst) {
      fetchStudents();
    }
  }, []);

  useEffect(() => {
    fetchSyllabusItems();
  }, [selectedBelt]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentProgress();
      fetchPromotionHistory();
    }
  }, [selectedStudentId]);

  // Toggle checklist item progress
  const handleToggleProgress = async (itemId) => {
    if (!isAdminOrInst || !selectedStudentId) return;
    try {
      const res = await fetch(`/api/syllabus/student/${selectedStudentId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ syllabus_item_id: itemId })
      });
      if (res.ok) {
        fetchStudentProgress();
      }
    } catch (err) {
      alert('Error updating progress');
    }
  };

  // Save Syllabus Item (Add/Edit)
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.title) return;

    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `/api/syllabus/${editingItem.id}` : '/api/syllabus';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...itemForm, belt_rank: selectedBelt })
      });
      if (res.ok) {
        setShowItemModal(false);
        setEditingItem(null);
        setItemForm({ belt_rank: selectedBelt, title: '', category: 'Kihon', description: '' });
        fetchSyllabusItems();
      }
    } catch (err) {
      alert('Failed to save syllabus item');
    }
  };

  // Delete Syllabus Item
  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this syllabus requirement item?')) return;
    try {
      const res = await fetch(`/api/syllabus/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchSyllabusItems();
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  // Handle Belt Promotion
  const handlePromoteStudent = async (e) => {
    e.preventDefault();
    setPromotionSuccess('');
    if (!promotionForm.student_id || !promotionForm.new_belt) return;

    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(promotionForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to promote student');

      setPromotionSuccess(data.message);
      fetchStudents();
      fetchPromotionHistory();
      if (onRefreshDojo) onRefreshDojo();
    } catch (err) {
      alert(err.message);
    }
  };

  const currentStudent = students.find(s => String(s.id) === String(selectedStudentId));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white">Belt & Syllabus Management</h1>
            <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">
              Phase 3
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track belt-wise Shotokan requirements, log student syllabus progress, and manage official belt promotions.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('syllabus')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'syllabus' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Syllabus Checklist
          </button>
          <button
            onClick={() => setActiveTab('promotions')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'promotions' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Belt Promotion Log
          </button>
        </div>
      </div>

      {activeTab === 'syllabus' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Belt Selection & Student Context */}
          <div className="space-y-4">
            {/* Belt Picker */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Select Shotokan Belt Rank
              </label>
              <div className="grid grid-cols-2 gap-2">
                {beltRanks.map((belt) => (
                  <button
                    key={belt}
                    onClick={() => setSelectedBelt(belt)}
                    className={`px-3 py-2 rounded-xl text-xs text-left flex items-center justify-between border transition-all cursor-pointer ${
                      selectedBelt === belt
                        ? 'border-red-500 bg-red-500/10 font-bold text-white shadow-sm'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{belt} Belt</span>
                    <BeltBadge beltRank={belt} className="text-[10px] px-2 py-0.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Student Progress Picker (Admin/Instructor) */}
            {isAdminOrInst && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Track Progress for Student
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.student_code}) - Current: {s.belt_rank}
                    </option>
                  ))}
                </select>

                {currentStudent && (
                  <div className="mt-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{currentStudent.name}</div>
                      <div className="text-slate-400 text-[11px]">Completed: {completedItemIds.length} items</div>
                    </div>
                    <BeltBadge beltRank={currentStudent.belt_rank} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Syllabus Requirements Checklist */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-red-500" />
                    {selectedBelt} Belt Requirement Syllabus
                  </h2>
                </div>

                {isAdminOrInst && (
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setItemForm({ belt_rank: selectedBelt, title: '', category: 'Kihon', description: '' });
                      setShowItemModal(true);
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                )}
              </div>

              {/* Checklist Items */}
              {loading ? (
                <div className="text-center py-8 text-slate-400 text-xs">Loading syllabus...</div>
              ) : syllabusItems.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No syllabus items added for {selectedBelt} belt yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {syllabusItems.map((item) => {
                    const isDone = completedItemIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                          isDone
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {isAdminOrInst ? (
                            <button
                              onClick={() => handleToggleProgress(item.id)}
                              className="mt-0.5 text-emerald-400 hover:scale-110 transition-transform cursor-pointer"
                            >
                              {isDone ? (
                                <CheckSquare className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-500" />
                              )}
                            </button>
                          ) : (
                            <span className="mt-0.5">
                              {isDone ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-600" />
                              )}
                            </span>
                          )}

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{item.title}</span>
                              <span className="bg-slate-800 text-slate-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-700 uppercase">
                                {item.category}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                            )}
                          </div>
                        </div>

                        {isAdminOrInst && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setItemForm({
                                  belt_rank: item.belt_rank,
                                  title: item.title,
                                  category: item.category,
                                  description: item.description
                                });
                                setShowItemModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-yellow-400 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Promotions Log Tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Promote Student Form */}
          {isAdminOrInst && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md h-fit">
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                <TrendingUp className="w-5 h-5 text-red-500" /> Promote Student
              </h2>

              <form onSubmit={handlePromoteStudent} className="space-y-4 text-xs">
                {promotionSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl font-semibold">
                    {promotionSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Select Student</label>
                  <select
                    value={promotionForm.student_id}
                    onChange={(e) => {
                      const id = e.target.value;
                      setPromotionForm({ ...promotionForm, student_id: id });
                      setSelectedStudentId(id);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.student_code}) - Current: {s.belt_rank}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Promote To New Belt Rank</label>
                  <select
                    value={promotionForm.new_belt}
                    onChange={(e) => setPromotionForm({ ...promotionForm, new_belt: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {beltRanks.map((belt) => (
                      <option key={belt} value={belt}>
                        {belt} Belt
                      </option>
                    ))}
                  </select>
                  <div className="mt-2">
                    <BeltBadge beltRank={promotionForm.new_belt} />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Promotion Date</label>
                  <input
                    type="date"
                    required
                    value={promotionForm.promotion_date}
                    onChange={(e) => setPromotionForm({ ...promotionForm, promotion_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Examiner Notes / Grade</label>
                  <textarea
                    rows="2"
                    placeholder="e.g. Excellent kata execution and spirit (Kiai)."
                    value={promotionForm.notes}
                    onChange={(e) => setPromotionForm({ ...promotionForm, notes: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 font-bold uppercase tracking-wider text-white rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Confirm Promotion
                </button>
              </form>
            </div>
          )}

          {/* Promotion History Log */}
          <div className={`space-y-4 ${isAdminOrInst ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                <FileText className="w-5 h-5 text-red-500" />
                Belt Promotion History Log {currentStudent && `(${currentStudent.name})`}
              </h2>

              {promotionHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No promotion logs recorded for this student yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {promotionHistory.map((log) => (
                    <div
                      key={log.id}
                      className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <BeltBadge beltRank={log.old_belt} className="text-[10px] px-2" />
                          <span className="text-slate-500 font-bold">➔</span>
                          <BeltBadge beltRank={log.new_belt} className="text-[10px] px-2" />
                        </div>
                        <p className="text-slate-300">{log.notes || 'Promoted upon successful grading exam.'}</p>
                        <p className="text-[11px] text-slate-500 mt-1">Examiner: {log.promoted_by}</p>
                      </div>

                      <div className="text-right text-slate-400">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                          {log.promotion_date}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">
              {editingItem ? 'Edit Syllabus Requirement' : 'Add Syllabus Requirement'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Requirement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heian Shodan Kata"
                  value={itemForm.title}
                  onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Category</label>
                <select
                  value={itemForm.category}
                  onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Kihon">Kihon (Basic Technique)</option>
                  <option value="Kata">Kata (Forms)</option>
                  <option value="Kumite">Kumite (Sparring)</option>
                  <option value="Stance">Stance (Dachi)</option>
                  <option value="Theory">Theory & Etiquette</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Description</label>
                <textarea
                  rows="3"
                  placeholder="Short explanation of key points..."
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-600 text-white rounded-xl font-bold uppercase"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
