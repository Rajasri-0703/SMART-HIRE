import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { History, Clock, Search, User, Briefcase, FileCheck, CheckCircle2 } from 'lucide-react';

export const ScreeningHistory: React.FC = () => {
  const { token } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadHistory() {
      if (!token) return;
      try {
        setLoading(true);
        const res = await fetch('/api/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [token]);

  const filtered = history.filter((h) => {
    const s = search.toLowerCase();
    return (
      h.action?.toLowerCase().includes(s) ||
      h.details?.toLowerCase().includes(s) ||
      h.candidate_name?.toLowerCase().includes(s) ||
      h.job_title?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-5 dark:border-zinc-800 light:border-zinc-200">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 dark:text-zinc-100 light:text-zinc-900 font-sans">
          Screening Audit Trail & Activity Log
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Chronological record of resume screening executions, eligibility decisions, and HR recruiter evaluations.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Filter audit log by action, candidate, or recruiter email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900/80 text-xs text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:bg-zinc-900/80 dark:border-zinc-800 light:bg-white light:border-zinc-300 light:text-zinc-900"
        />
      </div>

      {/* Timeline table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden dark:border-zinc-800 dark:bg-zinc-900/40 light:bg-white light:border-zinc-200">
        {loading ? (
          <div className="py-16 text-center text-xs text-zinc-400 font-mono">
            Reading screening_history relational records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-400">
            No audit records match your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Candidate / Job</th>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {item.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-zinc-200 block">
                        {item.candidate_name || (item.candidate_id ? `Candidate #${item.candidate_id}` : 'General')}
                      </span>
                      {item.job_title && (
                        <span className="text-[10px] font-mono text-zinc-400">
                          {item.job_title}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-300 max-w-md">
                      {item.details}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                      {item.user_email || 'HR System'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
