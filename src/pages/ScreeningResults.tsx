import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { ScreeningResultItem, Job } from '../types';
import {
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Award,
  ChevronRight,
  Eye,
  FileText,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Download,
  Info
} from 'lucide-react';

interface ScreeningResultsProps {
  onSelectScreening: (id: number) => void;
  onSelectCandidate: (candidateId: number) => void;
  selectedJobId?: number | null;
}

export const ScreeningResults: React.FC<ScreeningResultsProps> = ({
  onSelectScreening,
  onSelectCandidate,
  selectedJobId
}) => {
  const { token } = useAuth();
  const [results, setResults] = useState<ScreeningResultItem[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [jobFilter, setJobFilter] = useState<string>(selectedJobId ? selectedJobId.toString() : '');
  const [eligibilityFilter, setEligibilityFilter] = useState<string>('ALL');
  const [decisionFilter, setDecisionFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [minScore, setMinScore] = useState<number>(0);
  const [actionSuccess, setActionSuccess] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const fetchResults = async () => {
    if (!token) return;
    try {
      setLoading(true);
      let url = `/api/screening/results?`;
      if (jobFilter) url += `jobId=${jobFilter}&`;
      if (eligibilityFilter !== 'ALL') url += `isEligible=${eligibilityFilter === 'ELIGIBLE' ? '1' : '0'}&`;
      if (decisionFilter !== 'ALL') url += `status=${decisionFilter}&`;
      if (minScore > 0) url += `minScore=${minScore}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [token]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchResults();
      setCurrentPage(1);
    }, 150);
    return () => clearTimeout(handler);
  }, [jobFilter, eligibilityFilter, decisionFilter, minScore, search, token]);

  const handleDecision = async (screeningId: number, decision: 'SHORTLISTED' | 'REJECTED' | 'PENDING') => {
    if (!token) return;
    try {
      const res = await fetch('/api/screening/decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          screeningId,
          decision,
          hrNotes: decision === 'SHORTLISTED' ? 'Candidate prioritized for technical interview' : 'Does not match opening'
        })
      });
      if (res.ok) {
        setResults((prev) =>
          prev.map((r) => (r.id === screeningId ? { ...r, decision_status: decision } : r))
        );
        setActionSuccess(`Updated candidate status to ${decision}`);
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Pagination slice
  const totalPages = Math.ceil(results.length / pageSize) || 1;
  const paginatedResults = results.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header with Pre-Ranking Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5 dark:border-zinc-800 light:border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 dark:text-zinc-100 light:text-zinc-900 font-sans">
              Screening Results & Pre-Ranking Leaderboard
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/10">
              ADSA B-Tree Ordered
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Candidates dynamically pre-ranked by composite fit score.
            <strong className="text-zinc-300 ml-1">
              Note: This is an HR decision-support tool, not an automated hiring decision.
            </strong>
          </p>
        </div>

        {actionSuccess && (
          <div className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search candidate name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/80 text-xs text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:bg-zinc-900/80 dark:border-zinc-800 light:bg-white light:border-zinc-300 light:text-zinc-900"
          />
        </div>

        {/* Job Filter */}
        <div>
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/80 text-xs text-zinc-200 focus:border-zinc-500 focus:outline-none dark:bg-zinc-900/80 dark:border-zinc-800 light:bg-white light:border-zinc-300 light:text-zinc-800 cursor-pointer"
          >
            <option value="">All Job Vacancies</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                JOB-{j.id}: {j.title}
              </option>
            ))}
          </select>
        </div>

        {/* Eligibility Filter */}
        <div>
          <select
            value={eligibilityFilter}
            onChange={(e) => setEligibilityFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/80 text-xs text-zinc-200 focus:border-zinc-500 focus:outline-none dark:bg-zinc-900/80 dark:border-zinc-800 light:bg-white light:border-zinc-300 light:text-zinc-800 cursor-pointer"
          >
            <option value="ALL">All Eligibility</option>
            <option value="ELIGIBLE">Eligible Only (DMGT Passed)</option>
            <option value="INELIGIBLE">Ineligible Only</option>
          </select>
        </div>

        {/* Decision Status Filter */}
        <div>
          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/80 text-xs text-zinc-200 focus:border-zinc-500 focus:outline-none dark:bg-zinc-900/80 dark:border-zinc-800 light:bg-white light:border-zinc-300 light:text-zinc-800 cursor-pointer"
          >
            <option value="ALL">All Decisions</option>
            <option value="PENDING">Pending Review</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Screening Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden dark:border-zinc-800 dark:bg-zinc-900/40 light:bg-white light:border-zinc-200">
        {loading ? (
          <div className="py-16 text-center text-xs text-zinc-400 font-mono">
            Executing parameterized SQL query on screening_results index...
          </div>
        ) : results.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Sparkles className="mx-auto h-8 w-8 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-200">No Screening Records Found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Upload resumes for a job vacancy to populate the pre-ranking table with dynamic fit scores.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-mono uppercase text-[10px] dark:bg-zinc-950/60 light:bg-zinc-100">
                <tr>
                  <th className="py-3 px-3 text-center">Rank</th>
                  <th className="py-3 px-3">Candidate</th>
                  <th className="py-3 px-3">Job Vacancy</th>
                  <th className="py-3 px-3">Education & Exp</th>
                  <th className="py-3 px-3">Matched Skills</th>
                  <th className="py-3 px-3">Missing Skills</th>
                  <th className="py-3 px-3">Eligibility</th>
                  <th className="py-3 px-3">Fit Score</th>
                  <th className="py-3 px-3">HR Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {paginatedResults.map((r, index) => {
                  const globalRank = (currentPage - 1) * pageSize + index + 1;
                  const isEligible = r.is_eligible === 1 || r.is_eligible === true;
                  const matchedSkills = (r.matched_required_skills || '').split(',').map((s) => s.trim()).filter(Boolean);
                  const missingSkills = (r.missing_required_skills || '').split(',').map((s) => s.trim()).filter(Boolean);

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-zinc-800/30 transition-colors"
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-zinc-400">
                        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-md ${
                          globalRank === 1
                            ? 'bg-amber-400/20 text-amber-300 font-bold'
                            : globalRank === 2
                            ? 'bg-zinc-200/20 text-zinc-200'
                            : globalRank === 3
                            ? 'bg-amber-700/20 text-amber-500'
                            : 'text-zinc-400'
                        }`}>
                          #{globalRank}
                        </span>
                      </td>

                      {/* Candidate */}
                      <td className="py-3.5 px-3">
                        <button
                          onClick={() => onSelectCandidate(r.candidate_id)}
                          className="text-left font-semibold text-zinc-100 hover:text-white dark:text-zinc-100 light:text-zinc-900 block"
                        >
                          {r.full_name}
                        </button>
                        <span className="text-[11px] text-zinc-400 font-mono block">
                          {r.email}
                        </span>
                      </td>

                      {/* Job */}
                      <td className="py-3.5 px-3">
                        <span className="font-medium text-zinc-200 block truncate max-w-[140px]">
                          {r.job_title}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {r.department}
                        </span>
                      </td>

                      {/* Education & Experience */}
                      <td className="py-3.5 px-3 max-w-[150px]">
                        <span className="text-zinc-300 block truncate" title={r.education}>
                          {r.education}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {r.years_experience} yrs experience
                        </span>
                      </td>

                      {/* Matched Skills */}
                      <td className="py-3.5 px-3 max-w-[140px]">
                        <div className="flex flex-wrap gap-1">
                          {matchedSkills.length === 0 ? (
                            <span className="text-[10px] text-zinc-400">None detected</span>
                          ) : (
                            matchedSkills.slice(0, 3).map((s) => (
                              <span
                                key={s}
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40"
                              >
                                {s} ✓
                              </span>
                            ))
                          )}
                          {matchedSkills.length > 3 && (
                            <span className="text-[10px] font-mono text-zinc-400">
                              +{matchedSkills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Missing Skills */}
                      <td className="py-3.5 px-3 max-w-[140px]">
                        <div className="flex flex-wrap gap-1">
                          {missingSkills.length === 0 ? (
                            <span className="text-[10px] text-emerald-400 font-mono">0 missing</span>
                          ) : (
                            missingSkills.slice(0, 2).map((s) => (
                              <span
                                key={s}
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800/40"
                              >
                                {s} ✗
                              </span>
                            ))
                          )}
                          {missingSkills.length > 2 && (
                            <span className="text-[10px] font-mono text-zinc-400">
                              +{missingSkills.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Eligibility */}
                      <td className="py-3.5 px-3">
                        {isEligible ? (
                          <span
                            title="Satisfies education, experience, and skill threshold rules"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium font-mono"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Eligible
                          </span>
                        ) : (
                          <span
                            title={r.eligibility_reason}
                            className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium font-mono cursor-help"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Ineligible
                          </span>
                        )}
                      </td>

                      {/* Dynamic Fit Score */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold text-sm ${
                            r.overall_fit_score >= 85
                              ? 'text-emerald-400'
                              : r.overall_fit_score >= 70
                              ? 'text-cyan-300'
                              : r.overall_fit_score >= 50
                              ? 'text-amber-300'
                              : 'text-rose-400'
                          }`}>
                            {r.overall_fit_score}%
                          </span>
                          <div className="w-14 h-2 rounded-full bg-zinc-800/90 overflow-hidden p-0.5">
                            <div
                              className={`h-full rounded-full transition-all ${
                                r.overall_fit_score >= 85
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/40'
                                  : r.overall_fit_score >= 70
                                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-sm shadow-cyan-500/40'
                                  : r.overall_fit_score >= 50
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-sm shadow-amber-500/40'
                                  : 'bg-gradient-to-r from-rose-500 to-red-500 shadow-sm shadow-rose-500/40'
                              }`}
                              style={{ width: `${r.overall_fit_score}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Decision Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                            r.decision_status === 'SHORTLISTED'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                              : r.decision_status === 'REJECTED'
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/40'
                              : 'bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                          }`}
                        >
                          {r.decision_status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Analysis / Details */}
                          <button
                            onClick={() => onSelectScreening(r.id)}
                            title="View Full Screening Analysis Breakdown"
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-indigo-600/30 hover:text-indigo-300 text-zinc-300 border border-zinc-700 hover:border-indigo-500/40 transition-colors cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {/* Shortlist */}
                          <button
                            onClick={() => handleDecision(r.id, 'SHORTLISTED')}
                            title="Shortlist for Interview"
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                              r.decision_status === 'SHORTLISTED'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
                                : 'bg-zinc-800 hover:bg-emerald-950/60 hover:text-emerald-300 text-zinc-400 border-zinc-700 hover:border-emerald-500/40'
                            }`}
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </button>

                          {/* Reject */}
                          <button
                            onClick={() => handleDecision(r.id, 'REJECTED')}
                            title="Reject Candidate"
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                              r.decision_status === 'REJECTED'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-500/20'
                                : 'bg-zinc-800 hover:bg-rose-950/60 hover:text-rose-300 text-zinc-400 border-zinc-700 hover:border-rose-500/40'
                            }`}
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {results.length > pageSize && (
          <div className="flex items-center justify-between p-4 border-t border-zinc-800/80 bg-zinc-950/40 text-xs text-zinc-400 font-mono">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, results.length)} of {results.length} evaluated candidates
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-200 disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
