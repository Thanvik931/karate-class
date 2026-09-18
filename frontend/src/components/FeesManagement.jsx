import React, { useState, useEffect } from 'react';
import { IndianRupee, Bell, CheckCircle2, AlertTriangle, Clock, Plus, Search, Filter, ShieldCheck } from 'lucide-react';

export default function FeesManagement({ user, token }) {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [students, setStudents] = useState([]);

  // Fee creation form
  const [form, setForm] = useState({
    student_id: '',
    month_year: new Date().toISOString().slice(0, 7),
    amount: 2000,
    due_date: `${new Date().toISOString().slice(0, 7)}-05`,
    notes: 'Monthly dojo training fee'
  });

  const isAdminOrInst = user?.role === 'admin' || user?.role === 'instructor';

  const fetchFees = async () => {
    setLoading(true);
    try {
      if (isAdminOrInst) {
        let url = `/api/fees`;
        if (statusFilter) url += `?status=${statusFilter}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setFees(data.feeRecords || []);
      } else if (user?.studentDetails?.id) {
        const res = await fetch(`/api/fees/student/${user.studentDetails.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setFees(data.feeRecords || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
        if (data.students.length > 0) setForm(prev => ({ ...prev, student_id: data.students[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFees();
  }, [statusFilter]);

  useEffect(() => {
    if (showModal) fetchStudents();
  }, [showModal]);

  const handleMarkPaid = async (feeId) => {
    const payment_method = window.prompt('Enter payment method (e.g. UPI, Cash, Online Bank Transfer):', 'UPI / Online');
    if (!payment_method) return;

    try {
      const res = await fetch(`/api/fees/${feeId}/pay`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ payment_method })
      });
      if (res.ok) fetchFees();
    } catch (err) {
      alert('Failed to update payment status');
    }
  };

  const handleCreateFee = async (e) => {
    e.preventDefault();
    if (!form.student_id || !form.month_year || !form.amount || !form.due_date) return;

    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setShowModal(false);
        fetchFees();
      }
    } catch (err) {
      alert('Failed to generate fee record');
    }
  };

  // Stats
  const totalCollected = fees.filter(f => f.status === 'paid').reduce((acc, f) => acc + (f.amount || 0), 0);
  const totalDue = fees.filter(f => f.status !== 'paid').reduce((acc, f) => acc + (f.amount || 0), 0);
  const overdueCount = fees.filter(f => f.status === 'overdue').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white">Fees Management & Reminders</h1>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">
              Module 7
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track student fee payments, auto-reminders for due/overdue dues, and payment statements.
          </p>
        </div>

        {user.role === 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 font-bold text-xs uppercase tracking-wider text-white rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Issue Fee Invoice
          </button>
        )}
      </div>

      {/* Overdue Alert Reminder Bar */}
      {overdueCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 text-amber-300 text-xs">
          <Bell className="w-5 h-5 text-amber-400 animate-bounce flex-shrink-0" />
          <div>
            <span className="font-bold">Auto Payment Reminder:</span> You have <span className="font-extrabold underline">{overdueCount} overdue fee payment(s)</span> requiring attention. Auto-alerts have been sent to guardians.
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {isAdminOrInst && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Fees Collected</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">₹{totalCollected.toLocaleString()}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Pending Dues</div>
            <div className="text-2xl font-black text-yellow-400 mt-1">₹{totalDue.toLocaleString()}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Overdue Accounts</div>
            <div className="text-2xl font-black text-red-400 mt-1">{overdueCount} Accounts</div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      {isAdminOrInst && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md w-full sm:w-64">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
          >
            <option value="">All Statuses (Paid / Due / Overdue)</option>
            <option value="paid">Paid Only</option>
            <option value="due">Due Only</option>
            <option value="overdue">Overdue Only</option>
          </select>
        </div>
      )}

      {/* Fees Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading fee records...</div>
      ) : fees.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
          No fee records found.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="divide-y divide-slate-800">
            {fees.map((fee) => (
              <div key={fee.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${
                    fee.status === 'paid'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : fee.status === 'overdue'
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  }`}>
                    ₹
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm">
                        {fee.student_name ? `${fee.student_name} (${fee.student_code})` : `Month: ${fee.month_year}`}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        fee.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : fee.status === 'overdue'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }`}>
                        {fee.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Period: <span className="font-mono text-slate-200">{fee.month_year}</span> • Due Date: <span className="text-slate-300">{fee.due_date}</span>
                    </p>
                    {fee.guardian_phone && (
                      <p className="text-[11px] text-slate-500">Guardian Contact: {fee.guardian_name} ({fee.guardian_phone})</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-base font-extrabold text-white">₹{fee.amount}</div>
                    {fee.payment_date && (
                      <div className="text-[11px] text-slate-400">Paid: {fee.payment_date} ({fee.payment_method})</div>
                    )}
                  </div>

                  {user.role === 'admin' && fee.status !== 'paid' && (
                    <button
                      onClick={() => handleMarkPaid(fee.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
                    >
                      Record Payment
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issue Fee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Issue Monthly Fee Invoice</h3>

            <form onSubmit={handleCreateFee} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Select Student *</label>
                <select
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.student_code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Fee Month (YYYY-MM) *</label>
                <input
                  type="month"
                  required
                  value={form.month_year}
                  onChange={(e) => setForm({ ...form, month_year: e.target.value, due_date: `${e.target.value}-05` })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: parseInt(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Due Date *</label>
                <input
                  type="date"
                  required
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
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
                  Issue Fee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
