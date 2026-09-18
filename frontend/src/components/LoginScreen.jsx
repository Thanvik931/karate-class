import React, { useState } from 'react';
import { Shield, User, Lock, Award, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e, customUser, customPass) => {
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
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

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
    handleSubmit(null, u, p);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/40 via-slate-950 to-slate-950 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 shadow-xl shadow-red-900/40 mb-4 border border-red-400/30">
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

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900/90 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs text-center font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Login ID / Code
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 h-4 text-slate-500" />
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
                  <Lock className="h-4 h-4 text-slate-500" />
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

          {/* Quick Demo Login Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
              Quick Test Logins (Phase 1 Demo)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin', 'admin123')}
                className="flex flex-col items-start p-2.5 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-left transition-colors cursor-pointer group"
              >
                <span className="font-bold text-red-400 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Admin (Owner)
                </span>
                <span className="text-[11px] text-slate-400">Afroz Khan</span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">admin / admin123</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('instructor1', 'inst123')}
                className="flex flex-col items-start p-2.5 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-left transition-colors cursor-pointer group"
              >
                <span className="font-bold text-yellow-400 flex items-center gap-1">
                  <Award className="w-3 h-3" /> Instructor
                </span>
                <span className="text-[11px] text-slate-400">Rahul Sharma</span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">instructor1 / inst123</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('STU001', 'stu123')}
                className="flex flex-col items-start p-2.5 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-left transition-colors cursor-pointer group"
              >
                <span className="font-bold text-blue-400 flex items-center gap-1">
                  <User className="w-3 h-3" /> Student
                </span>
                <span className="text-[11px] text-slate-400">Aarav Patel</span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">STU001 / stu123</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('PAR001', 'par123')}
                className="flex flex-col items-start p-2.5 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-left transition-colors cursor-pointer group"
              >
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Parent
                </span>
                <span className="text-[11px] text-slate-400">Suresh Patel</span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">PAR001 / par123</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
