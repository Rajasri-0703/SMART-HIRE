import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Job } from '../types';
import {
  Briefcase,
  PlusCircle,
  Search,
  MapPin,
  Clock,
  GraduationCap,
  Users,
  ChevronRight,
  Trash2,
  UploadCloud,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface JobsListProps {
  setActiveTab: (tab: string) => void;
  onSelectJob: (id: number) => void;
  onUploadForJob: (id: number) => void;
}

export const JobsList: React.FC<JobsListProps> = ({ setActiveTab, onSelectJob, onUploadForJob }) => {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [deleteError, setDeleteError] = useState('');

  const fetchJobs = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load vacancies');
      const data = await res.json();
      setJobs(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [token]);

  const handleDeleteJob = async (jobId: number, title: string) => {
    if (!token) return;
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will delete associated requirements and screening evaluations.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
      } else {
        const d = await res.json();
        setDeleteError(d.error || 'Failed to delete');
      }
    } catch (err: any) {
      setDeleteError(err.message);
    }
  };

  const departments = Array.from(new Set(jobs.map((j) => j.department))).filter(Boolean);

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.department.toLowerCase().includes(search.toLowerCase()) ||
      j.description.toLowerCase().includes(search.toLowerCase());
    const matchesDept = departmentFilter === 'ALL' || j.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5 dark:border-zinc-800 light:border-zinc-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 dark:text-zinc-100 light:text-zinc-900 font-sans">
            Job Openings & Screening Criteria
          </h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-600 mt-1">
            Manage vacancies and configure mandatory skill requirements for automated fit evaluation.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('create-job')}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 text-zinc-950 font-semibold text-xs hover:bg-white transition-all shadow-sm dark:bg-zinc-100 dark:text-zinc-950 light:bg-zinc-900 light:text-zinc-50 cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Job Vacancy</span>
        </button>
      </div>

      {deleteError && (
        <div className="flex items-center gap-2 p-3 text-xs bg-rose-950/40 border border-rose-900 text-rose-300 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search job titles, skills, or departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900/80 text-xs text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/80 light:bg-white light:border-zinc-300 light:text-zinc-900"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/80 text-xs text-zinc-300 focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/80 light:bg-white light:border-zinc-300 light:text-zinc-800 cursor-pointer"
        >
          <option value="ALL">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Job Vacancy Cards */}
      {loading ? (
        <div className="py-12 text-center text-xs text-zinc-400 font-mono">
          Loading jobs from relational database...
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center bg-zinc-900/20">
          <Briefcase className="mx-auto h-8 w-8 text-zinc-400 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-200">No Job Vacancies Found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {search ? 'Try adjusting your search criteria.' : 'Create your first job opening to begin screening candidates.'}
          </p>
          <button
            onClick={() => setActiveTab('create-job')}
            className="mt-4 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 text-xs hover:bg-zinc-700"
          >
            Create Job Vacancy
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 hover:border-indigo-500/40 hover:bg-zinc-900/70 transition-all dark:border-zinc-800 dark:bg-zinc-900/40 light:bg-white light:border-zinc-200 relative overflow-hidden group shadow-sm hover:shadow-indigo-500/10"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-60 group-hover:opacity-100 transition-opacity" />
              <div>
                {/* Title & Department */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-zinc-100 dark:text-zinc-100 light:text-zinc-900 group-hover:text-indigo-300 transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                      <span className="font-semibold text-indigo-400">{job.department}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-zinc-400">{job.employment_type}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-950/40 text-emerald-300">
                    {job.status}
                  </span>
                </div>

                {/* Job metadata details */}
                <div className="mt-4 space-y-1.5 text-xs text-zinc-400 border-t border-zinc-800/60 pt-3 dark:border-zinc-800/60 light:border-zinc-200">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>Min {job.min_experience} yrs experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span className="truncate">{job.required_education}</span>
                  </div>
                </div>

                {/* Skills Preview */}
                <div className="mt-4 pt-3 border-t border-zinc-800/60 dark:border-zinc-800/60 light:border-zinc-200">
                  <div className="text-[11px] font-medium text-zinc-400 mb-1.5">
                    Required Skills ({job.required_skills?.length || 0})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(job.required_skills || []).slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-500/30 font-medium"
                      >
                        {s}
                      </span>
                    ))}
                    {(job.required_skills?.length || 0) > 4 && (
                      <span className="text-[11px] font-mono text-zinc-400 px-1 py-0.5">
                        +{(job.required_skills?.length || 0) - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer: Metrics & Action buttons */}
              <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <div className="text-[11px] font-mono text-zinc-400">
                  <span className="text-zinc-100 font-bold">{job.applicant_count || 0}</span> evaluated
                  {job.shortlisted_count ? (
                    <span className="text-amber-400 font-semibold ml-1">· {job.shortlisted_count} shortlisted</span>
                  ) : ''}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onUploadForJob(job.id)}
                    title="Upload Resumes for this Vacancy"
                    className="p-1.5 rounded-lg text-purple-400 hover:text-purple-200 hover:bg-purple-950/40 border border-purple-500/30 transition-colors cursor-pointer"
                  >
                    <UploadCloud className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onSelectJob(job.id)}
                    title="View Job Details and Candidate Rankings"
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-sm shadow-indigo-500/10"
                  >
                    <span>View</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteJob(job.id, job.title)}
                    title="Delete Job"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
