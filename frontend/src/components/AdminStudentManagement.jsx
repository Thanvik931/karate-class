import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Shield,
  Phone,
  Clock,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Key
} from 'lucide-react';
import BeltBadge from './BeltBadge';
import StudentModal from './StudentModal';

export default function AdminStudentManagement({ user, token, dojoInfo, onRefreshDojo }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [beltFilter, setBeltFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (beltFilter) queryParams.append('belt', beltFilter);
      if (batchFilter) queryParams.append('batch', batchFilter);

      const res = await fetch(`/api/students?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch students');

      setStudents(data.students || []);
      if (onRefreshDojo) onRefreshDojo();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [searchTerm, beltFilter, batchFilter]);

  const handleOpenAddModal = () => {
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleSaveStudent = async (formData, studentId) => {
    const method = studentId ? 'PUT' : 'POST';
    const url = studentId ? `/api/students/${studentId}` : '/api/students';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to save student details');
    }

    fetchStudents();
    return data;
  };

  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate ${name}'s profile?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete student');

      fetchStudents();
    } catch (err) {
      alert(err.message);
    }
  };

  const activeCount = dojoInfo ? dojoInfo.active_students_count : 0;
  const maxCapacity = dojoInfo ? dojoInfo.max_capacity : 50;
  const isFull = activeCount >= maxCapacity;

  return (
    <div className="space-y-6">
      {/* Top Banner & Dojo Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white">Student Roster & Profiles</h1>
              <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">
                Phase 1 Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Manage Shotokan karate student registrations, belt ranks, batch allocations, and guardian contact profiles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user.role === 'admin' && (
              <button
                onClick={handleOpenAddModal}
                disabled={isFull}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                  isFull
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Enroll New Student
              </button>
            )}
          </div>
        </div>

        {/* Capacity Limit Alert Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
              <Users className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <span className="text-slate-400">Total Enrolled Students:</span>{' '}
              <span className="font-extrabold text-white text-sm">{activeCount} / {maxCapacity}</span>
              <span className="text-slate-500 ml-2">({maxCapacity - activeCount} slots remaining)</span>
            </div>
          </div>

          {isFull && (
            <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30 font-semibold">
              <AlertTriangle className="w-4 h-4" />
              Dojo capacity limit reached (Max 50)
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, student code (STU001), phone, or guardian..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Belt Filter */}
        <div className="w-full sm:w-48">
          <select
            value={beltFilter}
            onChange={(e) => setBeltFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Belt Ranks</option>
            {dojoInfo?.belt_ranks?.map((belt) => (
              <option key={belt} value={belt}>
                {belt} Belt
              </option>
            ))}
          </select>
        </div>

        {/* Batch Filter */}
        <div className="w-full sm:w-60">
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Batches</option>
            {dojoInfo?.batches?.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Profiles Table / Cards */}
      {loading ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-sm">
          Loading student profiles...
        </div>
      ) : error ? (
        <div className="text-center py-8 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs">
          {error}
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
          No student profiles found matching criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {students.map((student) => (
            <div
              key={student.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">{student.name}</h3>
                      <span className="text-[10px] font-mono font-extrabold bg-slate-950 text-red-400 px-2 py-0.5 rounded border border-slate-800">
                        {student.student_code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Age: <span className="text-slate-200 font-semibold">{student.age} yrs</span> • Joined: <span className="text-slate-200">{student.join_date}</span>
                    </p>
                  </div>

                  <BeltBadge beltRank={student.belt_rank} />
                </div>

                {/* Batch Tag */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 mb-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                    <Clock className="w-3.5 h-3.5 text-red-400" />
                    <span>{student.batch}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>Student Contact: {student.contact}</span>
                  </div>
                </div>

                {/* Guardian Details */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/50 text-xs space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Guardian Details ({student.guardian_relation})
                  </div>
                  <div className="font-semibold text-slate-200">{student.guardian_name}</div>
                  <div className="text-slate-400 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400" /> {student.guardian_phone}
                  </div>
                </div>

                {/* Account Credentials info */}
                <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Key className="w-3 h-3 text-slate-600" /> Student Login ID: <span className="font-mono text-slate-300">{student.student_username}</span>
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEditModal(student)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-yellow-400" /> Edit
                </button>

                {user.role === 'admin' && (
                  <button
                    onClick={() => handleDeleteStudent(student.id, student.name)}
                    className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-lg text-xs font-semibold flex items-center gap-1 border border-red-800/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveStudent}
        student={selectedStudent}
        beltRanks={dojoInfo?.belt_ranks || []}
        batches={dojoInfo?.batches || []}
      />
    </div>
  );
}
