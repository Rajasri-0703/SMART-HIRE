import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Job, ScreeningResultItem } from '../types';
import {
  Briefcase,
  ArrowLeft,
  MapPin,
  Clock,
  GraduationCap,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Award,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface JobDetailsProps {
  jobId: number;
  setActiveTab: (tab: string) => void;
  onSelectCandidate: (candidateId: number) => void;
  onUploadForJob: (jobId: number) => void;
}

export const JobDetails: React.FC<JobDetailsProps> = ({
  jobId,
  setActiveTab,
  onSelectCandidate,
  onUploadForJob
}) => {
  const { token } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJob = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Job not found');
      const data = await res.json();
      setJob(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [jobId, token]);

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-zinc-400 font-mono">
        Querying vacancy details from SQLite relational database...
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-8 text-center text-xs text-rose-400">
        <p>Error: {error || 'Vacancy not found'}</p>
        <button
          onClick={() => setActiveTab('jobs')}
          className="mt-3 px-3 py-1.5 rounded bg-zinc-800 text-zinc-200"
        >
          Back to Jobs
        </button>
      </div>
    );
  }

  const candidates = job.candidates || [];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 dark:border-zinc-800 light:border-zinc-200">
        <button
          onClick={() => setActiveTab('jobs')}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 font-mono transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>All Vacancies</span>
        </button>
        <button
          onClick={() => onUploadForJob(job.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-950 font-semibold text-xs hover:bg-white transition-colors dark:bg-zinc-100 dark:text-zinc-950 light:bg-zinc-900 light:text-zinc-50 cursor-pointer shadow-sm"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Upload Resumes for this Job</span>
        </button>
      </div>

      {/* Main Vacancy Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4 dark:border-zinc-800 dark:bg-zinc-900/60 light:bg-white light:border-zinc-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-100 dark:text-zinc-100 light:text-zinc-900 font-sans">
                {job.title}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-800/60 bg-emerald-950/40 text-emerald-300">
                {job.status}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Department: {job.department} · {job.employment_type}
            </p>
          </div>
          <div className="text-right sm:border-l sm:border-zinc-800 sm:pl-4">
            <span className="text-xs font-mono text-zinc-400 block">Job Reference</span>
            <span className="text-xs font-mono font-bold text-zinc-200">JOB-{job.id}</span>
          </div>
        </div>

        {job.description && (
          <p className="text-xs text-zinc-300 leading-relaxed pt-2 border-t border-zinc-800/60 dark:border-zinc-800/60 light:border-zinc-200">
            {job.description}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-zinc-800/60 text-xs text-zinc-300 dark:border-zinc-800/60 light:border-zinc-200">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-400 shrink-0" />
            <span>Minimum {job.min_experience} Years Experience</span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-zinc-400 shrink-0" />
            <span className="truncate">{job.required_education}</span>
          </div>
        </div>

        {/* Requirements Breakdown */}
        <div className="pt-4 border-t border-zinc-800/60 grid grid-cols-1 sm:grid-cols-2 gap-4 dark:border-zinc-800/60 light:border-zinc-200">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Required Skills ({job.required_skills?.length || 0})
            </span>
            <div className="flex flex-wrap gap-1">
              {(job.required_skills || []).map((s) => (
                <span
                  key={s}
                  className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700/60"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Preferred Skills ({job.preferred_skills?.length || 0})
            </span>
            <div className="flex flex-wrap gap-1">
              {(job.preferred_skills || []).map((s) => (
                <span
                  key={s}
                  className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800/60 text-zinc-300 border border-zinc-700/40"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Screened Candidates Pre-Ranking for this Vacancy */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4 dark:border-zinc-800 dark:bg-zinc-900/40 light:bg-white light:border-zinc-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 dark:text-zinc-100 light:text-zinc-900">
              Evaluated Candidates & Pre-Ranking
            </h2>
            <p className="text-[11px] text-zinc-400">
              Ordered by Python dynamic composite fit score (indexed via <code>idx_screening_job_fit</code>)
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {candidates.length} Candidate{candidates.length === 1 ? '' : 's'} Evaluated
          </span>
        </div>

        {candidates.length === 0 ? (
          <div className="py-10 text-center rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40">
            <p className="text-xs text-zinc-400">No resumes have been screened for this opening yet.</p>
            <button
              onClick={() => onUploadForJob(job.id)}
              className="mt-3 px-3 py-1.5 rounded bg-zinc-800 text-zinc-200 text-xs hover:bg-zinc-700 cursor-pointer"
            >
              Upload Resumes Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Pre-Rank</th>
                  <th className="py-2.5 px-3">Candidate</th>
                  <th className="py-2.5 px-3">Education</th>
                  <th className="py-2.5 px-3">Experience</th>
                  <th className="py-2.5 px-3">Eligibility</th>
                  <th className="py-2.5 px-3">Fit Score</th>
                  <th className="py-2.5 px-3">Decision</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {candidates.map((c: any, index: number) => {
                  const eligible = c.is_eligible === 1 || c.is_eligible === true;
                  return (
                    <tr
                      key={c.screening_id}
                      className="hover:bg-zinc-800/40 transition-colors cursor-pointer"
                      onClick={() => onSelectCandidate(c.candidate_id)}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-zinc-400">
                        #{index + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-zinc-100 dark:text-zinc-100 light:text-zinc-900">
                          {c.full_name}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">{c.email}</div>
                      </td>
                      <td className="py-3 px-3 text-zinc-300 max-w-xs truncate">
                        {c.education}
                      </td>
                      <td className="py-3 px-3 font-mono text-zinc-300">
                        {c.years_experience} yrs
                      </td>
                      <td className="py-3 px-3">
                        {eligible ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                            <CheckCircle2 className="h-3 w-3" /> Eligible
                          </span>
                        ) : (
                          <span
                            title={c.eligibility_reason}
                            className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium"
                          >
                            <XCircle className="h-3 w-3" /> Ineligible
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-zinc-100 dark:text-zinc-100 light:text-zinc-900">
                            {c.overall_fit_score}%
                          </span>
                          <div className="w-12 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full bg-zinc-200 rounded-full"
                              style={{ width: `${c.overall_fit_score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                            c.decision_status === 'SHORTLISTED'
                              ? 'bg-amber-950/40 text-amber-300 border border-amber-800/60'
                              : c.decision_status === 'REJECTED'
                              ? 'bg-rose-950/40 text-rose-300 border border-rose-800/60'
                              : 'bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                          }`}
                        >
                          {c.decision_status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCandidate(c.candidate_id);
                          }}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium inline-flex items-center gap-1"
                        >
                          <span>Profile</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
