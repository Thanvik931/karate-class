import React, { useState } from 'react';
import { Shield, User, Lock, Award, ArrowRight, CheckCircle2, Key, UserPlus, Phone, Calendar, Clock, AlertCircle } from 'lucide-react';

export default function LoginScreen({ onLoginSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Registration State
  const [regForm, setRegForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'student',
    phone: '',
    admin_security_pin: '',
    age: '12',
    batch: 'Morning (6:00–7:00 AM)',
    guardian_name: '',
    guardian_phone: '',
    guardian_relation: 'Father'
  });

  const handleLoginSubmit = async (e, customUser, customPass) => {
    if (e) e.preventDefault();
    const u = customUser || username;
    const p = customPass || password;

    if (!u || !p) {
      setError('Please enter both Login ID and Password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regForm.name || !regForm.username || !regForm.password) {
      setError('Please fill in all required registration fields');
      return;
    }

    if ((regForm.role === 'admin' || regForm.role === 'instructor') && !regForm.admin_security_pin) {
      setError('Admin Security PIN required to register Admin/Instructor roles.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
    handleLoginSubmit(null, u, p);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/40 via-slate-950 to-slate-950 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 shadow-xl shadow-red-900/40 mb-3 border border-red-400/30">
          <Shield className="w-11 h-11 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
          Ultimate Fitness
        </h1>
        <h2 className="text-lg font-bold text-red-500 uppercase tracking-widest mt-0.5">
          Martial Arts Academy
        </h2>
        <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-2">
          <Award className="w-4 h-4 text-yellow-500" />
          Shotokan Style Karate • Head Instructor: Afroz Khan (Black Belt)
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/90 backdrop-blur-md py-6 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-8">
          
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold mb-6">
            <button
              type="button"
              onClick={() => { setIsRegisterMode(false); setError(''); }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                !isRegisterMode ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegisterMode(true); setError(''); }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                isRegisterMode ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs text-center font-medium mb-4">
              {error}
            </div>
          )}

          {!isRegisterMode ? (
            /* Sign In Form */
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Login ID / Code
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin, STU001, PAR001"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-slate-900 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            /* Self Registration Form */
            <form className="space-y-4 text-xs" onSubmit={handleRegisterSubmit}>
              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Verma"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Login ID / Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STU009 or username"
                    value={regForm.username}
                    onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Role Type *
                </label>
                <select
                  value={regForm.role}
                  onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500"
                >
                  <option value="student">Student Account</option>
                  <option value="parent">Parent Account</option>
                  <option value="instructor">Instructor Account (Requires Security PIN)</option>
                  <option value="admin">Admin / Owner Account (Requires Security PIN)</option>
                </select>
              </div>

              {/* Security PIN for Admin / Instructor */}
              {(regForm.role === 'admin' || regForm.role === 'instructor') && (
                <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl space-y-1">
                  <label className="block font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                    <Key className="w-3.5 h-3.5" /> Master Admin Security PIN *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter Master Security PIN (e.g. DOJO2026)"
                    value={regForm.admin_security_pin}
                    onChange={(e) => setRegForm({ ...regForm, admin_security_pin: e.target.value })}
                    className="block w-full px-3 py-2 bg-slate-950 border border-red-500/50 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Security Protection: Prevents unauthorized users from registering as Admin or Instructor. Demo Security PIN: <code className="text-yellow-400 font-mono font-bold">DOJO2026</code>
                  </p>
                </div>
              )}

              {/* Extra Student Fields */}
              {regForm.role === 'student' && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Age</label>
                      <input
                        type="number"
                        min="4"
                        max="80"
                        value={regForm.age}
                        onChange={(e) => setRegForm({ ...regForm, age: e.target.value })}
                        className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={regForm.phone}
                        onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                        className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Preferred Batch</label>
                    <select
                      value={regForm.batch}
                      onChange={(e) => setRegForm({ ...regForm, batch: e.target.value })}
                      className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    >
                      <option value="Morning (6:00–7:00 AM)">Morning (6:00–7:00 AM)</option>
                      <option value="Evening Batch 1 (5:00–6:00 PM)">Evening Batch 1 (5:00–6:00 PM)</option>
                      <option value="Evening Batch 2 (6:30–7:30 PM)">Evening Batch 2 (6:30–7:30 PM)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Guardian Name</label>
                      <input
                        type="text"
                        placeholder="Guardian Name"
                        value={regForm.guardian_name}
                        onChange={(e) => setRegForm({ ...regForm, guardian_name: e.target.value })}
                        className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Guardian Phone</label>
                      <input
                        type="tel"
                        placeholder="Guardian Phone"
                        value={regForm.guardian_phone}
                        onChange={(e) => setRegForm({ ...regForm, guardian_phone: e.target.value })}
                        className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-slate-900 transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? 'Registering Account...' : 'Register Account'}
                {!loading && <UserPlus className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* Quick Demo Login Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center flex items-center justify-center gap-1">
              <Key className="w-3 h-3 text-yellow-400" /> Demo Accounts (Quick Test)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin', 'admin123')}
                className="flex flex-col items-start p-2 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-left transition-colors cursor-pointer group"
              >
                <span className="font-bold text-red-400 flex items-center gap-1 text-[11px]">
                  <Shield className="w-3 h-3" /> Admin (Afroz Khan)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">admin / admin123</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('instructor1', 'inst123')}
                className="flex flex-col items-start p-2 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-left transition-colors cursor-pointer group"
              >
                <span className="font-bold text-yellow-400 flex items-center gap-1 text-[11px]">
                  <Award className="w-3 h-3" /> Instructor (Rahul)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">instructor1 / inst123</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('STU001', 'stu123')}
                className="flex flex-col items-start p-2 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-left transition-colors cursor-pointer group"
              >
                <span className="font-bold text-blue-400 flex items-center gap-1 text-[11px]">
                  <User className="w-3 h-3" /> Student (Aarav)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">STU001 / stu123</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('PAR001', 'par123')}
                className="flex flex-col items-start p-2 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-left transition-colors cursor-pointer group"
              >
                <span className="font-bold text-emerald-400 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3" /> Parent (Suresh)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">PAR001 / par123</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
