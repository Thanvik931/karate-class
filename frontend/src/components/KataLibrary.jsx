import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Edit2, Trash2, Shield, Sparkles } from 'lucide-react';
import BeltBadge from './BeltBadge';

export default function KataLibrary({ user, token, dojoInfo }) {
  const [katas, setKatas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [beltFilter, setBeltFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingKata, setEditingKata] = useState(null);
  const [form, setForm] = useState({
    name: '',
    japanese_name: '',
    belt_level: 'Yellow',
    description: ''
  });

  const isAdminOrInst = user?.role === 'admin' || user?.role === 'instructor';
  const beltRanks = dojoInfo?.belt_ranks || [];

  const fetchKatas = async () => {
    setLoading(true);
    try {
      let url = '/api/katas';
      if (beltFilter) url += `?belt=${encodeURIComponent(beltFilter)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setKatas(data.katas || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKatas();
  }, [beltFilter]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description) return;

    const method = editingKata ? 'PUT' : 'POST';
    const url = editingKata ? `/api/katas/${editingKata.id}` : '/api/katas';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setShowModal(false);
        setEditingKata(null);
        setForm({ name: '', japanese_name: '', belt_level: 'Yellow', description: '' });
        fetchKatas();
      }
    } catch (err) {
      alert('Failed to save Kata');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this Kata entry?')) return;
    try {
      const res = await fetch(`/api/katas/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchKatas();
    } catch (err) {
      alert('Failed to delete Kata');
    }
  };

  const filteredKatas = katas.filter(k => 
    k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (k.japanese_name && k.japanese_name.includes(searchTerm)) ||
    k.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white">Shotokan Kata Library</h1>
            <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">
              Phase 3
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official catalog of traditional Shotokan forms (Katas), mapped by belt level and descriptions.
          </p>
        </div>

        {isAdminOrInst && (
          <button
            onClick={() => {
              setEditingKata(null);
              setForm({ name: '', japanese_name: '', belt_level: 'Yellow', description: '' });
              setShowModal(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 font-bold text-xs uppercase tracking-wider text-white rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Kata
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search katas by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={beltFilter}
            onChange={(e) => setBeltFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Belt Levels</option>
            {beltRanks.map((b) => (
              <option key={b} value={b}>{b} Belt</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kata Cards */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading Kata Library...</div>
      ) : filteredKatas.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
          No Katas found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredKatas.map((kata) => (
            <div
              key={kata.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                      {kata.name}
                      {kata.japanese_name && (
                        <span className="text-xs text-red-400 font-normal">({kata.japanese_name})</span>
                      )}
                    </h3>
                  </div>
                  <BeltBadge beltRank={kata.belt_level} />
                </div>

                <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                  {kata.description}
                </p>
              </div>

              {isAdminOrInst && (
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingKata(kata);
                      setForm({
                        name: kata.name,
                        japanese_name: kata.japanese_name || '',
                        belt_level: kata.belt_level,
                        description: kata.description
                      });
                      setShowModal(true);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-yellow-400" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(kata.id)}
                    className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-lg text-xs font-semibold flex items-center gap-1 border border-red-800/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">
              {editingKata ? 'Edit Kata Entry' : 'Add New Kata Entry'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Kata Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heian Shodan"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Japanese Kanji / Name</label>
                <input
                  type="text"
                  placeholder="e.g. 平安初段"
                  value={form.japanese_name}
                  onChange={(e) => setForm({ ...form, japanese_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Target Belt Level *</label>
                <select
                  value={form.belt_level}
                  onChange={(e) => setForm({ ...form, belt_level: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  {beltRanks.map((b) => (
                    <option key={b} value={b}>{b} Belt</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Description & Key Points *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Short description of movement sequence and key stances..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  Save Kata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
