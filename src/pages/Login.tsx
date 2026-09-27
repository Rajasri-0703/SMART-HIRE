import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, KeyRound, Building2, UserPlus, ArrowRight, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('recruiter@smarthire.internal');
  const [password, setPassword] = useState('admin123');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Engineering Talent');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        if (!fullName.trim()) throw new Error('Please enter your full name');
        await register(email, password, fullName, department);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail('recruiter@smarthire.internal');
    setPassword('admin123');
    setError('');
    setLoading(true);
    try {
      await login('recruiter@smarthire.internal', 'admin123');
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-zinc-950 dark:bg-zinc-950 light:bg-zinc-100">
      <div className="w-full max-w-md space-y-6">
        {/* Academic / Project Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-950 dark:bg-zinc-100 dark:text-zinc-950 light:bg-zinc-900 light:text-zinc-50 font-bold text-xl shadow-lg">
            SH
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 dark:text-zinc-100 light:text-zinc-900">
            SmartHire Portal
          </h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-600">
            AI-Powered HR Recruitment & Candidate Screening System
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 pt-1 text-[11px] font-mono text-zinc-400">
            <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">DBMS</span>
            <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">DMGT</span>
            <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">ADSA</span>
            <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">OOPJ</span>
            <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">Python</span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8 shadow-2xl backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 light:bg-white light:border-zinc-200">
          <div className="flex border-b border-zinc-800 dark:border-zinc-800 light:border-zinc-200 mb-6">
            <button
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`pb-3 text-xs font-semibold uppercase tracking-wider flex-1 text-center transition-colors border-b-2 ${
                !isRegister
                  ? 'border-zinc-100 text-zinc-100 dark:border-zinc-100 dark:text-zinc-100 light:border-zinc-900 light:text-zinc-900'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              HR Sign In
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`pb-3 text-xs font-semibold uppercase tracking-wider flex-1 text-center transition-colors border-b-2 ${
                isRegister
                  ? 'border-zinc-100 text-zinc-100 dark:border-zinc-100 dark:text-zinc-100 light:border-zinc-900 light:text-zinc-900'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Register Recruiter
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-950/40 border border-rose-900/60 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 dark:text-zinc-300 light:text-zinc-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none dark:bg-zinc-950 dark:border-zinc-700 light:bg-zinc-50 light:border-zinc-300 light:text-zinc-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 dark:text-zinc-300 light:text-zinc-700 mb-1">
                    Department
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Technical Staffing"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none dark:bg-zinc-950 dark:border-zinc-700 light:bg-zinc-50 light:border-zinc-300 light:text-zinc-900"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-300 dark:text-zinc-300 light:text-zinc-700 mb-1">
                Recruiter Email
              </label>
              <input
                type="email"
                required
                placeholder="recruiter@smarthire.internal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none dark:bg-zinc-950 dark:border-zinc-700 light:bg-zinc-50 light:border-zinc-300 light:text-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 dark:text-zinc-300 light:text-zinc-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none dark:bg-zinc-950 dark:border-zinc-700 light:bg-zinc-50 light:border-zinc-300 light:text-zinc-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-zinc-100 py-2.5 px-4 text-xs font-semibold text-zinc-950 hover:bg-white transition-all disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950 light:bg-zinc-900 light:text-zinc-50 shadow-md cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : isRegister ? 'Create Recruiter Account' : 'Access Screening Dashboard'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Quick Demo Recruiter Button */}
          {!isRegister && (
            <div className="mt-5 pt-4 border-t border-zinc-800/80 dark:border-zinc-800/80 light:border-zinc-200 text-center">
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={loading}
                className="w-full text-xs font-mono py-2 px-3 rounded-lg border border-zinc-700/80 bg-zinc-950 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors flex items-center justify-center gap-2 dark:bg-zinc-950 light:bg-zinc-100 light:border-zinc-300 light:text-zinc-800 cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>1-Click HR Login (Senior Talent Lead)</span>
              </button>
              <p className="mt-2 text-[10px] text-zinc-400 font-mono">
                Credentials: recruiter@smarthire.internal / admin123
              </p>
            </div>
          )}
        </div>

        {/* Security and role boundary statement */}
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 p-3 text-center text-[11px] text-zinc-400">
          <p>
            <strong className="text-zinc-300">Recruiter-Only System:</strong> Applicants submit resumes externally. HR uploads and triggers the automated parsing and dynamic pre-ranking pipeline.
          </p>
        </div>
      </div>
    </div>
  );
};
