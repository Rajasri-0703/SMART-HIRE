import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { ScoringWeights } from '../types';
import { Sliders, Save, CheckCircle2, AlertCircle, RotateCcw, Database } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { token } = useAuth();
  const [weights, setWeights] = useState<ScoringWeights>({
    required_skills: 0.40,
    preferred_skills: 0.20,
    education: 0.15,
    experience: 0.15,
    certs_projects: 0.10,
    skill_threshold: 0.50
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetchSettings = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWeights(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const currentTotal = Number(
    (
      weights.required_skills +
      weights.preferred_skills +
      weights.education +
      weights.experience +
      weights.certs_projects
    ).toFixed(2)
  );

  const isValidTotal = Math.abs(currentTotal - 1.0) < 0.01;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidTotal) {
      setError(`Weights must sum up to exactly 100% (Currently ${(currentTotal * 100).toFixed(0)}%)`);
      return;
    }
    if (!token) return;

    setSaving(true);
    setError('');
    setMsg('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(weights)
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to update scoring parameters');
      }
      setMsg('Dynamic scoring weights updated in SQLite system_settings table.');
      setTimeout(() => setMsg(''), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    setWeights({
      required_skills: 0.40,
      preferred_skills: 0.20,
      education: 0.15,
      experience: 0.15,
      certs_projects: 0.10,
      skill_threshold: 0.50
    });
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="border-b border-zinc-800 pb-5 dark:border-zinc-800 light:border-zinc-200">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 dark:text-zinc-100 light:text-zinc-900 font-sans">
          Dynamic Fit Score & Screening Weight Parameters
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Configure linear multi-criteria decision weights applied across all newly ingested resumes.
        </p>
      </div>

      {msg && (
        <div className="flex items-center gap-2 p-3 text-xs bg-emerald-950/40 border border-emerald-900 text-emerald-300 rounded-lg">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs bg-rose-950/40 border border-rose-900 text-rose-300 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-5 dark:border-zinc-800 dark:bg-zinc-900/50 light:bg-white light:border-zinc-200">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">
                Composite Fit Score Convex Weights (∑ w_i = 1.0)
              </h2>
              <p className="text-[11px] text-zinc-400">
                Sum of all weight factors must equal exactly 100% (1.00)
              </p>
            </div>
            <div
              className={`font-mono text-xs px-2.5 py-1 rounded font-bold ${
                isValidTotal
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900'
                  : 'bg-rose-950/60 text-rose-400 border border-rose-900'
              }`}
            >
              Total Weight: {(currentTotal * 100).toFixed(0)}%
            </div>
          </div>

          {/* 1. Required Skills Weight */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label className="font-medium text-zinc-200">
                1. Required Skills Match Weight (Mandatory Criteria)
              </label>
              <span className="font-mono text-zinc-100 font-bold">
                {(weights.required_skills * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={weights.required_skills}
              onChange={(e) =>
                setWeights({ ...weights, required_skills: parseFloat(e.target.value) })
              }
              className="w-full accent-zinc-200"
            />
            <p className="text-[11px] text-zinc-400">
              Set intersection between candidate detected skills and job mandatory skill specifications.
            </p>
          </div>

          {/* 2. Preferred Skills Weight */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label className="font-medium text-zinc-200">
                2. Preferred Skills Match Weight (Nice-to-Have Criteria)
              </label>
              <span className="font-mono text-zinc-100 font-bold">
                {(weights.preferred_skills * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.40"
              step="0.05"
              value={weights.preferred_skills}
              onChange={(e) =>
                setWeights({ ...weights, preferred_skills: parseFloat(e.target.value) })
              }
              className="w-full accent-zinc-200"
            />
            <p className="text-[11px] text-zinc-400">
              Rewards candidates with bonus/secondary tech competencies.
            </p>
          </div>

          {/* 3. Education Match Weight */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label className="font-medium text-zinc-200">
                3. Education Qualification Weight
              </label>
              <span className="font-mono text-zinc-100 font-bold">
                {(weights.education * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.30"
              step="0.05"
              value={weights.education}
              onChange={(e) =>
                setWeights({ ...weights, education: parseFloat(e.target.value) })
              }
              className="w-full accent-zinc-200"
            />
            <p className="text-[11px] text-zinc-400">
              Evaluates degree hierarchy (Ph.D &gt; Master &gt; Bachelor &gt; Diploma).
            </p>
          </div>

          {/* 4. Experience Match Weight */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label className="font-medium text-zinc-200">
                4. Professional Experience Weight
              </label>
              <span className="font-mono text-zinc-100 font-bold">
                {(weights.experience * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.30"
              step="0.05"
              value={weights.experience}
              onChange={(e) =>
                setWeights({ ...weights, experience: parseFloat(e.target.value) })
              }
              className="w-full accent-zinc-200"
            />
            <p className="text-[11px] text-zinc-400">
              Proportionate score according to minimum years demanded by vacancy.
            </p>
          </div>

          {/* 5. Certifications & Projects */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label className="font-medium text-zinc-200">
                5. Relevant Certifications & Projects Weight
              </label>
              <span className="font-mono text-zinc-100 font-bold">
                {(weights.certs_projects * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.25"
              step="0.05"
              value={weights.certs_projects}
              onChange={(e) =>
                setWeights({ ...weights, certs_projects: parseFloat(e.target.value) })
              }
              className="w-full accent-zinc-200"
            />
            <p className="text-[11px] text-zinc-400">
              Bonus credit for industry credentials (AWS, CKA, Azure) and production projects.
            </p>
          </div>

          {/* 6. Skill Threshold */}
          <div className="pt-4 border-t border-zinc-800/80 space-y-1.5">
            <div className="flex justify-between text-xs">
              <label className="font-medium text-zinc-200">
                6. Default DMGT Minimum Skill Threshold
              </label>
              <span className="font-mono text-zinc-100 font-bold">
                {(weights.skill_threshold * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.30"
              max="0.90"
              step="0.05"
              value={weights.skill_threshold}
              onChange={(e) =>
                setWeights({ ...weights, skill_threshold: parseFloat(e.target.value) })
              }
              className="w-full accent-zinc-200"
            />
            <p className="text-[11px] text-zinc-400">
              Minimum percentage of required skills a candidate must match to satisfy eligibility predicate logic.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={resetDefaults}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 font-mono transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset to Academic Defaults</span>
          </button>

          <button
            type="submit"
            disabled={saving || !isValidTotal}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-zinc-100 text-zinc-950 font-bold text-xs hover:bg-white transition-all disabled:opacity-40 cursor-pointer dark:bg-zinc-100 dark:text-zinc-950 light:bg-zinc-900 light:text-zinc-50 shadow-md"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Updating Parameters...' : 'Save Parameters'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
