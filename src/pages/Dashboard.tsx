import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { DashboardStats } from '../types';
import {
  Briefcase,
  FileText,
  Users,
  CheckCircle2,
  XCircle,
  Award,
  TrendingUp,
  PlusCircle,
  UploadCloud,
  ArrowUpRight,
  Sparkles,
  Clock,
  ChevronRight,
  Database
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  setSelectedJobId?: (id: number | null) => void;
  setSelectedCandidateId?: (id: number | null) => void;
  refreshTrigger?: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  setActiveTab,
  setSelectedJobId,
  setSelectedCandidateId,
  refreshTrigger
}) => {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load dashboard metrics from database');
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token, refreshTrigger]);

  if (loading && !stats) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent"></div>
        <p className="mt-3 text-xs text-zinc-400 font-mono">Computing database statistics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center text-xs text-rose-400">
        <p>Database Error: {error}</p>
        <button
          onClick={fetchStats}
          className="mt-3 px-3 py-1.5 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Max count for distribution scale
  const maxBucketCount = Math.max(1, ...Object.values(stats.distribution));

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Banner / Academic Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6 dark:border-zinc-800 light:border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 dark:text-zinc-100 light:text-zinc-900 font-sans">
              Recruitment Screening Command Center
            </h1>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-600 mt-1">
            Real-time pipeline metrics aggregated directly from normalized relational tables via SQLite B-tree indexes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('create-job')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-100 text-zinc-950 font-semibold text-xs hover:bg-white transition-colors dark:bg-zinc-100 dark:text-zinc-950 light:bg-zinc-900 light:text-zinc-50 cursor-pointer shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Job Vacancy</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 font-semibold text-xs hover:bg-zinc-800 transition-colors dark:border-zinc-700 dark:bg-zinc-900 light:border-zinc-300 light:bg-zinc-100 light:text-zinc-900 cursor-pointer"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Bulk Upload Resumes</span>
          </button>
        </div>
      </div>

      {/* 7 Required Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Total Jobs */}
        <div
          onClick={() => setActiveTab('jobs')}
          className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-all hover:border-blue-500/50 hover:bg-zinc-900 cursor-pointer dark:border-zinc-800 dark:bg-zinc-900/60 light:bg-white light:border-zinc-200 relative overflow-hidden group shadow-sm hover:shadow-blue-500/10"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-blue-400">Jobs</span>
            <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 group-hover:scale-110 transition-transform">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100 dark:text-zinc-100 light:text-zinc-900">
            {stats.totalJobs}
          </div>
          <span className="text-[10px] text-zinc-400 mt-1 inline-block">Active Openings</span>
        </div>

        {/* Total Resumes */}
        <div
          onClick={() => setActiveTab('upload')}
          className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-all hover:border-indigo-500/50 hover:bg-zinc-900 cursor-pointer dark:border-zinc-800 dark:bg-zinc-900/60 light:bg-white light:border-zinc-200 relative overflow-hidden group shadow-sm hover:shadow-indigo-500/10"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-indigo-400">Resumes</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 group-hover:scale-110 transition-transform">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100 dark:text-zinc-100 light:text-zinc-900">
            {stats.totalResumes}
          </div>
          <span className="text-[10px] text-zinc-400 mt-1 inline-block">Uploaded Files</span>
        </div>

        {/* Total Candidates */}
        <div
          onClick={() => setActiveTab('candidates')}
          className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-all hover:border-purple-500/50 hover:bg-zinc-900 cursor-pointer dark:border-zinc-800 dark:bg-zinc-900/60 light:bg-white light:border-zinc-200 relative overflow-hidden group shadow-sm hover:shadow-purple-500/10"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-purple-400">Candidates</span>
            <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 group-hover:scale-110 transition-transform">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100 dark:text-zinc-100 light:text-zinc-900">
            {stats.totalCandidates}
          </div>
          <span className="text-[10px] text-zinc-400 mt-1 inline-block">Extracted Profiles</span>
        </div>

        {/* Eligible Candidates */}
        <div
          onClick={() => setActiveTab('screening')}
          className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-all hover:border-emerald-500/50 hover:bg-zinc-900 cursor-pointer dark:border-zinc-800 dark:bg-zinc-900/60 light:bg-white light:border-zinc-200 relative overflow-hidden group shadow-sm hover:shadow-emerald-500/10"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">Eligible</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {stats.eligibleCandidates}
          </div>
          <span className="text-[10px] text-emerald-400/80 font-medium mt-1 inline-block">DMGT Rule Passed</span>
        </div>

        {/* Not Eligible Candidates */}
        <div
          onClick={() => setActiveTab('screening')}
          className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-all hover:border-rose-500/50 hover:bg-zinc-900 cursor-pointer dark:border-zinc-800 dark:bg-zinc-900/60 light:bg-white light:border-zinc-200 relative overflow-hidden group shadow-sm hover:shadow-rose-500/10"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-orange-400" />
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-rose-400">Ineligible</span>
            <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 group-hover:scale-110 transition-transform">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {stats.notEligibleCandidates}
          </div>
          <span className="text-[10px] text-rose-400/80 font-medium mt-1 inline-block">Criteria Deficit</span>
        </div>

        {/* Shortlisted Candidates */}
        <div
          onClick={() => setActiveTab('shortlist')}
          className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-all hover:border-amber-500/50 hover:bg-zinc-900 cursor-pointer dark:border-zinc-800 dark:bg-zinc-900/60 light:bg-white light:border-zinc-200 relative overflow-hidden group shadow-sm hover:shadow-amber-500/10"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-yellow-500" />
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-amber-400">Shortlisted</span>
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 group-hover:scale-110 transition-transform">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {stats.shortlistedCandidates}
          </div>
          <span className="text-[10px] text-amber-400/80 font-medium mt-1 inline-block">HR Priority Queue</span>
        </div>

        {/* Average Fit Score */}
        <div
          onClick={() => setActiveTab('screening')}
          className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-all hover:border-cyan-500/50 hover:bg-zinc-900 cursor-pointer dark:border-zinc-800 dark:bg-zinc-900/60 light:bg-white light:border-zinc-200 relative overflow-hidden group shadow-sm hover:shadow-cyan-500/10"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500" />
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-cyan-400">Avg Fit</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            {stats.averageFitScore}%
          </div>
          <span className="text-[10px] text-cyan-400/80 font-medium mt-1 inline-block">Dynamic Metric</span>
        </div>
      </div>

      {/* Analytics Row: Score Distribution & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic Fit Score Distribution Histogram */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 dark:border-zinc-800 dark:bg-zinc-900/40 light:bg-white light:border-zinc-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 dark:text-zinc-100 light:text-zinc-900">
                Fit Score Histogram (Dynamic Distribution)
              </h2>
              <p className="text-[11px] text-zinc-400">
                Calculated post-parsing based on configured multi-factor weights
              </p>
            </div>
            <span className="text-[11px] font-mono font-semibold text-indigo-400 bg-indigo-950/60 px-2 py-1 rounded border border-indigo-500/30">
              0% — 100%
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(stats.distribution).map(([range, count]) => {
              const pct = stats.totalCandidates > 0 ? (count / stats.totalCandidates) * 100 : 0;
              const barWidth = Math.max(4, Math.round((count / maxBucketCount) * 100));
              return (
                <div key={range} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300 font-medium">{range}</span>
                    <span className="text-zinc-100 font-bold">
                      {count} <span className="text-zinc-400 font-normal text-[10px]">({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-zinc-800/80 overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        range === '91-100%'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                          : range === '76-90%'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-sm shadow-cyan-500/50'
                          : range === '61-75%'
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-sm shadow-indigo-500/50'
                          : range === '41-60%'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-sm shadow-amber-500/50'
                          : 'bg-gradient-to-r from-rose-500 to-red-600 shadow-sm shadow-rose-500/50'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Weights: Skills (40%), Pref (20%), Edu (15%), Exp (15%), Portfolio (10%)</span>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-zinc-300 hover:text-white underline font-mono cursor-pointer"
            >
              Adjust Weights
            </button>
          </div>
        </div>

        {/* Department Openings & Screenings */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 dark:border-zinc-800 dark:bg-zinc-900/40 light:bg-white light:border-zinc-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 dark:text-zinc-100 light:text-zinc-900">
                Department Screening Load
              </h2>
              <p className="text-[11px] text-zinc-400">
                Distribution of openings and evaluated applicants by department
              </p>
            </div>
            <button
              onClick={() => setActiveTab('jobs')}
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-mono"
            >
              All Jobs <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3">
            {stats.departmentStats.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                No department activity yet. Create a job vacancy to begin.
              </div>
            ) : (
              stats.departmentStats.map((dept, i) => {
                const colors = [
                  'border-blue-500/30 text-blue-400 bg-blue-500/10',
                  'border-indigo-500/30 text-indigo-400 bg-indigo-500/10',
                  'border-purple-500/30 text-purple-400 bg-purple-500/10',
                  'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                ];
                const badgeColor = colors[i % colors.length];
                return (
                  <div
                    key={dept.department}
                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/60 dark:bg-zinc-950/60 light:bg-zinc-50 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-indigo-500' : 'bg-purple-500'}`} />
                      <div>
                        <div className="text-xs font-semibold text-zinc-200 dark:text-zinc-200 light:text-zinc-800">
                          {dept.department}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          {dept.job_count} active vacancy {dept.job_count === 1 ? '' : 'ies'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                        {dept.candidate_screenings} screened
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Screening Activity Log */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 dark:border-zinc-800 dark:bg-zinc-900/40 light:bg-white light:border-zinc-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 dark:text-zinc-100 light:text-zinc-900">
              Recent Screening & Pipeline Activity
            </h2>
            <p className="text-[11px] text-zinc-400">
              Audit log recorded in <code>screening_history</code> relational table
            </p>
          </div>
          <button
            onClick={() => setActiveTab('history')}
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-mono"
          >
            Full Audit Log <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="divide-y divide-zinc-800/60 dark:divide-zinc-800/60 light:divide-zinc-200">
          {stats.recentActivity.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              No recent screening actions recorded. Upload resumes to see live audit logs.
            </div>
          ) : (
            stats.recentActivity.slice(0, 5).map((act) => {
              const isScreened = act.action.includes('SCREEN');
              const isShortlisted = act.action.includes('DECISION') || act.action.includes('SHORTLIST');
              const isJob = act.action.includes('JOB');
              return (
                <div key={act.id} className="py-3 flex items-start justify-between gap-4 hover:bg-zinc-800/20 px-2 rounded-lg transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-1.5 border shrink-0 ${
                      isScreened
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : isShortlisted
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : isJob
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                    }`}>
                      <Clock className="h-3 w-3" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-200 dark:text-zinc-200 light:text-zinc-800 font-medium">
                        {act.details}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          isScreened
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                            : isShortlisted
                            ? 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                            : isJob
                            ? 'bg-blue-950/60 text-blue-300 border-blue-500/30'
                            : 'bg-purple-950/60 text-purple-300 border-purple-500/30'
                        }`}>
                          {act.action}
                        </span>
                        <span>·</span>
                        <span className="text-zinc-400">By: {act.user_email || 'Recruiter'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 shrink-0">
                    {act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
