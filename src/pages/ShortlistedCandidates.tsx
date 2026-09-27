import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  Search,
  Mail,
  Phone,
  Briefcase,
  Trash2,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';

interface ShortlistProps {
  onSelectCandidate: (candidateId: number) => void;
  onSelectScreening: (screeningId: number) => void;
  setActiveTab: (tab: string) => void;
}

export const ShortlistedCandidates: React.FC<ShortlistProps> = ({
  onSelectCandidate,
  onSelectScreening,
  setActiveTab
}) => {
  const { token } = useAuth();
  const [shortlist, setShortlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchShortlist = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/shortlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setShortlist(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShortlist();
  }, [token]);

  const handleRemove = async (screeningId: number) => {
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
          decision: 'PENDING',
          hrNotes: 'Removed from shortlist'
        })
      });
      if (res.ok) {
        setShortlist((prev) => prev.filter((item) => item.screening_id !== screeningId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = shortlist.filter((item) => {
    const s = search.toLowerCase();
    return (
      item.full_name?.toLowerCase().includes(s) ||
      item.job_title?.toLowerCase().includes(s) ||
      item.email?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5 dark:border-zinc-800 light:border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 dark:text-zinc-100 light:text-zinc-900 font-sans">
              Shortlisted Candidates Queue
            </h1>
            <span className="text-xs font-mono font-semibold text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-500/40 shadow-sm shadow-amber-500/10">
              {shortlist.length} Priority Candidate{shortlist.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Top pre-ranked candidates approved by HR recruiters for technical interview scheduling.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('screening')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
        >
          <span>Evaluate More in Pre-Ranking</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Filter shortlisted candidates by name, job opening, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900/80 text-xs text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:bg-zinc-900/80 dark:border-zinc-800 light:bg-white light:border-zinc-300 light:text-zinc-900"
        />
      </div>

      {/* List / Cards */}
      {loading ? (
        <div className="py-16 text-center text-xs text-zinc-400 font-mono">
          Querying shortlist relational junction table...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center bg-zinc-900/20">
          <Award className="mx-auto h-8 w-8 text-zinc-400 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-200">No Shortlisted Candidates Yet</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Review candidate pre-rankings in the Screening tab and click the thumbs-up button to add candidates here.
          </p>
          <button
            onClick={() => setActiveTab('screening')}
            className="mt-4 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 text-xs hover:bg-zinc-700"
          >
            Go to Pre-Ranking Leaderboard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.shortlist_id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-amber-500/40 transition-all space-y-4 dark:border-zinc-800 dark:bg-zinc-900/50 light:bg-white light:border-zinc-200 relative overflow-hidden group shadow-sm hover:shadow-amber-500/10"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-yellow-500" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3
                    onClick={() => onSelectCandidate(item.candidate_id)}
                    className="text-base font-bold text-zinc-100 hover:text-amber-300 transition-colors cursor-pointer dark:text-zinc-100 light:text-zinc-900"
                  >
                    {item.full_name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                    <Briefcase className="h-3 w-3 text-indigo-400" />
                    <span><strong className="text-zinc-300 font-semibold">{item.job_title}</strong> ({item.department})</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-mono font-bold text-amber-300">
                    {item.overall_fit_score}%
                  </span>
                  <span className="text-[10px] text-emerald-400 block font-mono font-semibold">
                    ✓ DMGT Verified
                  </span>
                </div>
              </div>

              {/* Contact info & Notes */}
              <div className="space-y-1.5 text-xs text-zinc-400 pt-2 border-t border-zinc-800/60 font-mono">
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-sky-400" />
                  <span>{item.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-emerald-400" />
                  <span>{item.phone || 'N/A'}</span>
                </div>
              </div>

              {item.shortlist_notes && (
                <div className="p-2.5 rounded bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300">
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block mb-0.5">HR Assessment Note</span>
                  <p>{item.shortlist_notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                <button
                  onClick={() => onSelectScreening(item.screening_id)}
                  className="text-zinc-300 hover:text-white flex items-center gap-1 font-medium cursor-pointer"
                >
                  <span>View Full Screening Vectors</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => handleRemove(item.screening_id)}
                  title="Remove from shortlist"
                  className="text-zinc-400 hover:text-rose-400 p-1 flex items-center gap-1 text-[11px] font-mono cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
