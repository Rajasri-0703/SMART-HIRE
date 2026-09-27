import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Candidate } from '../types';
import {
  Users,
  Search,
  Mail,
  Phone,
  GraduationCap,
  Clock,
  ChevronRight,
  Sparkles,
  FileText
} from 'lucide-react';

interface CandidatesListProps {
  onSelectCandidate: (candidateId: number) => void;
  setActiveTab: (tab: string) => void;
}

export const CandidatesList: React.FC<CandidatesListProps> = ({ onSelectCandidate, setActiveTab }) => {
  const { token } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCandidates = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const url = search ? `/api/candidates?search=${encodeURIComponent(search)}` : '/api/candidates';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCandidates();
    }, 150);
    return () => clearTimeout(handler);
  }, [search, token]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5 dark:border-zinc-800 light:border-zinc-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 dark:text-zinc-100 light:text-zinc-900 font-sans">
            Candidate Talent Directory
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Centralized repository of candidate entities extracted from ingested resumes, indexed in SQLite.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('upload')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-100 text-zinc-950 font-semibold text-xs hover:bg-white transition-colors cursor-pointer dark:bg-zinc-100 dark:text-zinc-950 light:bg-zinc-900 light:text-zinc-50 shadow-sm"
        >
          <span>Ingest More Resumes</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search by candidate name, email address, or title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900/80 text-xs text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:bg-zinc-900/80 dark:border-zinc-800 light:bg-white light:border-zinc-300 light:text-zinc-900"
        />
      </div>

      {/* Candidates Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-zinc-400 font-mono">
          Querying candidates table using B-Tree email and ID indexes...
        </div>
      ) : candidates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center bg-zinc-900/20">
          <Users className="mx-auto h-8 w-8 text-zinc-400 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-200">No Candidates Found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {search ? 'Try clearing your search query.' : 'Upload resumes via the Bulk Ingestion tab to extract candidate profiles.'}
          </p>
          <button
            onClick={() => setActiveTab('upload')}
            className="mt-4 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 text-xs hover:bg-zinc-700"
          >
            Bulk Upload Resumes
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((cand) => (
            <div
              key={cand.id}
              onClick={() => onSelectCandidate(cand.id)}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 hover:border-indigo-500/40 hover:bg-zinc-900/70 transition-all cursor-pointer flex flex-col justify-between dark:border-zinc-800 dark:bg-zinc-900/40 light:bg-white light:border-zinc-200 relative overflow-hidden group shadow-sm hover:shadow-indigo-500/10"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-60 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-zinc-100 dark:text-zinc-100 light:text-zinc-900 group-hover:text-indigo-300 transition-colors">
                      {cand.full_name}
                    </h3>
                    <p className="text-xs text-indigo-400 mt-0.5 font-medium">
                      {cand.current_title || 'Software Engineer'}
                    </p>
                  </div>
                  {cand.max_fit_score != null && (
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                      cand.max_fit_score >= 85
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                        : cand.max_fit_score >= 70
                        ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                        : 'bg-zinc-800 text-zinc-200 border-zinc-700'
                    }`}>
                      Top: {cand.max_fit_score}%
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-zinc-400 border-t border-zinc-800/60 pt-3 dark:border-zinc-800/60 light:border-zinc-200">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">{cand.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>{cand.years_experience} Years Exp</span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <GraduationCap className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span className="truncate">{cand.education || 'Degree not detected'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span>{cand.total_screenings || 1} evaluations</span>
                <span className="flex items-center gap-1 text-zinc-300 hover:text-white font-medium">
                  Profile <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
