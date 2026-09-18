import React, { useState, useEffect } from 'react';
import { Languages, Plus, Search, Edit2, Trash2, Tag } from 'lucide-react';

export default function Glossary({ user, token }) {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [form, setForm] = useState({
    japanese_term: '',
    english_meaning: '',
    category: 'General'
  });

  const isAdminOrInst = user?.role === 'admin' || user?.role === 'instructor';
  const categories = ['Etiquette', 'Stances', 'Strikes', 'Kicks', 'Blocks', 'Commands', 'General'];

  const fetchTerms = async () => {
    setLoading(true);
    try {
      let query = new URLSearchParams();
      if (searchTerm) query.append('search', searchTerm);
      if (categoryFilter) query.append('category', categoryFilter);

      const res = await fetch(`/api/glossary?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setTerms(data.terms || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, [searchTerm, categoryFilter]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.japanese_term || !form.english_meaning) return;

    const method = editingTerm ? 'PUT' : 'POST';
    const url = editingTerm ? `/api/glossary/${editingTerm.id}` : '/api/glossary';

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
        setEditingTerm(null);
        setForm({ japanese_term: '', english_meaning: '', category: 'General' });
        fetchTerms();
      }
    } catch (err) {
      alert('Failed to save term');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this terminology term?')) return;
    try {
      const res = await fetch(`/api/glossary/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchTerms();
    } catch (err) {
      alert('Failed to delete term');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white">Karate Terminology Glossary</h1>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">
              Phase 3
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Searchable dictionary of Japanese karate terms, commands, techniques, and English meanings.
          </p>
        </div>

        {isAdminOrInst && (
          <button
            onClick={() => {
              setEditingTerm(null);
              setForm({ japanese_term: '', english_meaning: '', category: 'General' });
              setShowModal(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 font-bold text-xs uppercase tracking-wider text-white rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Term
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search term or English meaning (e.g., Sensei, Bow, Kick)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Glossary List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading terminology...</div>
      ) : terms.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
          No terms found matching your query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {terms.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-md flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-extrabold text-white text-base tracking-wide">{item.japanese_term}</h3>
                  <span className="bg-slate-950 text-slate-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-800 uppercase flex items-center gap-1">
                    <Tag className="w-3 h-3 text-red-400" /> {item.category}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/60">
                  {item.english_meaning}
                </p>
              </div>

              {isAdminOrInst && (
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => {
                      setEditingTerm(item);
                      setForm({
                        japanese_term: item.japanese_term,
                        english_meaning: item.english_meaning,
                        category: item.category
                      });
                      setShowModal(true);
                    }}
                    className="p-1 text-slate-400 hover:text-yellow-400 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
              {editingTerm ? 'Edit Terminology Term' : 'Add Terminology Term'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Japanese Term *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zenkutsu Dachi"
                  value={form.japanese_term}
                  onChange={(e) => setForm({ ...form, japanese_term: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">English Meaning *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Front stance (forward weight stance)"
                  value={form.english_meaning}
                  onChange={(e) => setForm({ ...form, english_meaning: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
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
                  Save Term
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
