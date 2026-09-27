import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { ScreeningResultItem, Candidate } from '../types';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Calendar,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  FileText,
  Clock,
  Download,
  ThumbsUp,
  ThumbsDown,
  Info,
  ChevronRight
} from 'lucide-react';

interface CandidateDetailsProps {
  screeningId?: number | null;
  candidateId?: number | null;
  setActiveTab: (tab: string) => void;
  onBack?: () => void;
}

export const CandidateDetails: React.FC<CandidateDetailsProps> = ({
  screeningId,
  candidateId,
  setActiveTab,
  onBack
}) => {
  const { token } = useAuth();
  const [screening, setScreening] = useState<ScreeningResultItem | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRawResume, setShowRawResume] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!token) return;
      setLoading(true);
      try {
        if (screeningId) {
          const res = await fetch(`/api/screening/results/${screeningId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setScreening(data);
          }
        } else if (candidateId) {
          const res = await fetch(`/api/candidates/${candidateId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setCandidate(data);
            if (data.screenings && data.screenings.length > 0) {
              setScreening(data.screenings[0]);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [screeningId, candidateId, token]);

  const handleDecision = async (decision: 'SHORTLISTED' | 'REJECTED' | 'PENDING') => {
    if (!token || !screening) return;
    try {
      const res = await fetch('/api/screening/decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          screeningId: screening.id,
          decision,
          hrNotes: decisionNotes || (decision === 'SHORTLISTED' ? 'Selected for technical evaluation' : 'Declined')
        })
      });
      if (res.ok) {
        setScreening((prev) => (prev ? { ...prev, decision_status: decision, hr_notes: decisionNotes } : null));
        setActionMsg(`Decision updated to ${decision}`);
        setTimeout(() => setActionMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const downloadResumeText = () => {
    const text = screening?.extracted_text || candidate?.resumes?.[0]?.extracted_text;
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(screening?.full_name || candidate?.full_name || 'candidate').replace(/\s+/g, '_')}_Resume_Extracted.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-zinc-400 font-mono">
        Querying relational candidate profile & screening vectors from database...
      </div>
    );
  }

  const c = screening || candidate;
  if (!c) {
    return (
      <div className="p-8 text-center text-xs text-rose-400">
        Candidate details not found.
        <button
          onClick={() => (onBack ? onBack() : setActiveTab('screening'))}
          className="mt-3 block mx-auto px-3 py-1.5 rounded bg-zinc-800 text-zinc-200"
        >
          Return to Screening
        </button>
      </div>
    );
  }

  const isEligible = screening?.is_eligible === 1 || screening?.is_eligible === true;
  const matchedRequired = (screening?.matched_required_skills || '').split(',').map((s) => s.trim()).filter(Boolean);
  const missingRequired = (screening?.missing_required_skills || '').split(',').map((s) => s.trim()).filter(Boolean);
  const matchedPreferred = (screening?.matched_preferred_skills || '').split(',').map((s) => s.trim()).filter(Boolean);
  const missingPreferred = (screening?.missing_preferred_skills || '').split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4 dark:border-zinc-800 light:border-zinc-200">
        <button
          onClick={() => (onBack ? onBack() : setActiveTab('screening'))}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 font-mono transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Screening Leaderboard</span>
        </button>

        <div className="flex items-center gap-2">
          {actionMsg && (
            <span className="text-xs font-mono text-emerald-400 mr-2">✓ {actionMsg}</span>
          )}
          <button
            onClick={downloadResumeText}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 text-xs font-mono hover:bg-zinc-800 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Extracted Resume</span>
          </button>
          <button
            onClick={() => setShowRawResume(!showRawResume)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 text-xs font-medium hover:bg-zinc-700 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{showRawResume ? 'Hide Raw Text' : 'View Raw Resume Text'}</span>
          </button>
        </div>
      </div>

      {/* Raw Resume Text Modal / Drawer */}
      {showRawResume && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3 dark:border-zinc-800 light:bg-zinc-50 light:border-zinc-300">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-xs font-mono font-bold text-zinc-200">
              Raw Extracted Document Text (from {screening?.original_filename || 'Uploaded Resume'})
            </span>
            <button
              onClick={() => setShowRawResume(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Close
            </button>
          </div>
          <pre className="text-xs font-mono text-zinc-300 bg-zinc-900/80 p-4 rounded-lg overflow-x-auto max-h-72 whitespace-pre-wrap leading-relaxed">
            {screening?.extracted_text || candidate?.resumes?.[0]?.extracted_text || 'No text extracted.'}
          </pre>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-5 dark:border-zinc-800 dark:bg-zinc-900/60 light:bg-white light:border-zinc-200">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-100 dark:text-zinc-100 light:text-zinc-900 font-sans">
                {c.full_name}
              </h1>
              {screening && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider ${
                    screening.decision_status === 'SHORTLISTED'
                      ? 'bg-amber-950/50 text-amber-300 border border-amber-800/60'
                      : screening.decision_status === 'REJECTED'
                      ? 'bg-rose-950/50 text-rose-300 border border-rose-800/60'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                  }`}
                >
                  {screening.decision_status}
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-300 mt-1 font-medium">
              {c.current_title || 'Software Engineer'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 mt-3 font-mono">
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-zinc-400" />
                <span>{c.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-zinc-400" />
                <span>{c.phone || 'Not detected'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-zinc-400" />
                <span>{c.years_experience} Years Experience</span>
              </div>
            </div>
          </div>

          {/* Fit Score Display */}
          {screening && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 text-center min-w-[170px] dark:border-zinc-800 light:bg-zinc-100 light:border-zinc-200">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                Dynamic Fit Score
              </span>
              <div className="text-3xl font-bold font-mono text-zinc-100 dark:text-zinc-100 light:text-zinc-900">
                {screening.overall_fit_score}%
              </div>
              <div className="mt-2 text-[10px] font-mono">
                {isEligible ? (
                  <span className="text-emerald-400 flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Eligible (DMGT)
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center justify-center gap-1">
                    <XCircle className="h-3 w-3" /> Ineligible (DMGT)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Education & Qualifications */}
        <div className="pt-4 border-t border-zinc-800/60 dark:border-zinc-800/60 light:border-zinc-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-semibold text-zinc-400 block mb-1">Education Background</span>
            <p className="text-zinc-200">{c.education || 'Not detected'}</p>
          </div>
          <div>
            <span className="font-semibold text-zinc-400 block mb-1">Certifications Detected</span>
            <p className="text-zinc-200">{(c as any).certifications_summary || 'None detected'}</p>
          </div>
        </div>
      </div>

      {/* Dynamic Fit Score Breakdown (5 Sub-components) */}
      {screening && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4 dark:border-zinc-800 dark:bg-zinc-900/40 light:bg-white light:border-zinc-200">
          <div>
            <h2 className="text-sm font-bold text-zinc-100 dark:text-zinc-100 light:text-zinc-900 font-sans">
              Dynamic Fit Score Breakdown & Weight Analysis
            </h2>
            <p className="text-[11px] text-zinc-400">
              Evaluated by the Python Dynamic Scoring Engine against Job: {screening.job_title}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            {/* 1. Required Skills */}
            <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-950/20 dark:border-blue-500/30 relative overflow-hidden shadow-sm shadow-blue-500/5">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
              <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider block">
                Required Skills (40%)
              </span>
              <span className="text-xl font-bold font-mono text-blue-300 mt-1 block">
                {screening.skill_match_score}%
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                {matchedRequired.length} matched / {missingRequired.length} missing
              </span>
            </div>

            {/* 2. Preferred Skills */}
            <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 dark:border-indigo-500/30 relative overflow-hidden shadow-sm shadow-indigo-500/5">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
              <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider block">
                Preferred Skills (20%)
              </span>
              <span className="text-xl font-bold font-mono text-indigo-300 mt-1 block">
                {screening.preferred_skill_score}%
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                {matchedPreferred.length} matched
              </span>
            </div>

            {/* 3. Education Match */}
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 dark:border-emerald-500/30 relative overflow-hidden shadow-sm shadow-emerald-500/5">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
              <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">
                Education (15%)
              </span>
              <span className="text-xl font-bold font-mono text-emerald-300 mt-1 block">
                {screening.education_match_score}%
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                Degree tier match
              </span>
            </div>

            {/* 4. Experience Match */}
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 dark:border-amber-500/30 relative overflow-hidden shadow-sm shadow-amber-500/5">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
              <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block">
                Experience (15%)
              </span>
              <span className="text-xl font-bold font-mono text-amber-300 mt-1 block">
                {screening.experience_match_score}%
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                Years of experience
              </span>
            </div>

            {/* 5. Certs & Projects */}
            <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/20 dark:border-purple-500/30 relative overflow-hidden shadow-sm shadow-purple-500/5">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
              <span className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider block">
                Portfolio (10%)
              </span>
              <span className="text-xl font-bold font-mono text-purple-300 mt-1 block">
                {screening.cert_project_score}%
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                Certs & projects credit
              </span>
            </div>
          </div>
        </div>
      )}

      {/* DMGT Rule-Based Eligibility Engine Details */}
      {screening && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4 dark:border-zinc-800 dark:bg-zinc-900/40 light:bg-white light:border-zinc-200">
          <div>
            <h2 className="text-sm font-bold text-zinc-100 dark:text-zinc-100 light:text-zinc-900 font-sans">
              DMGT Rule-Based Eligibility Analysis
            </h2>
            <p className="text-[11px] text-zinc-400">
              Propositional Predicate Formulation: <code>Eligible = E_edu ∧ E_exp ∧ E_skills</code>
            </p>
          </div>

          <div
            className={`p-4 rounded-lg border text-xs ${
              isEligible
                ? 'bg-emerald-950/30 border-emerald-900/60 text-emerald-300'
                : 'bg-rose-950/30 border-rose-900/60 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {isEligible ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <span>{isEligible ? 'Candidate Satisfies All Eligibility Prerequisites' : 'Candidate Does Not Satisfy Rule Requirements'}</span>
            </div>
            <p className="text-[11px] font-mono leading-relaxed mt-1">
              {screening.eligibility_reason}
            </p>
          </div>
        </div>
      )}

      {/* Matched vs Missing Requirements Checklist */}
      {screening && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Matched Checklist */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-3 dark:border-zinc-800 light:bg-white light:border-zinc-200">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Matched Requirements</span>
            </h3>

            <div className="space-y-2 text-xs">
              {matchedRequired.map((skill) => (
                <div key={skill} className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-200">
                  <span className="font-mono">{skill}</span>
                  <span className="text-emerald-400 font-mono text-[11px]">Required Skill ✓</span>
                </div>
              ))}
              {matchedPreferred.map((skill) => (
                <div key={skill} className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
                  <span className="font-mono">{skill}</span>
                  <span className="text-emerald-400 font-mono text-[11px]">Preferred Skill ✓</span>
                </div>
              ))}
              {matchedRequired.length === 0 && matchedPreferred.length === 0 && (
                <p className="text-zinc-500 italic">No skills matched job requirements.</p>
              )}
            </div>
          </div>

          {/* Missing Checklist */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-3 dark:border-zinc-800 light:bg-white light:border-zinc-200">
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <XCircle className="h-4 w-4" />
              <span>Missing Requirements</span>
            </h3>

            <div className="space-y-2 text-xs">
              {missingRequired.map((skill) => (
                <div key={skill} className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-200">
                  <span className="font-mono">{skill}</span>
                  <span className="text-rose-400 font-mono text-[11px]">Missing Required Skill ✗</span>
                </div>
              ))}
              {missingPreferred.map((skill) => (
                <div key={skill} className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
                  <span className="font-mono">{skill}</span>
                  <span className="text-zinc-500 font-mono text-[11px]">Missing Preferred Skill ✗</span>
                </div>
              ))}
              {missingRequired.length === 0 && missingPreferred.length === 0 && (
                <p className="text-emerald-400 font-mono text-xs">All required and preferred competencies present!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recruiter Decision Panel */}
      {screening && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4 dark:border-zinc-800 light:bg-white light:border-zinc-200">
          <h2 className="text-sm font-bold text-zinc-100 dark:text-zinc-100 light:text-zinc-900 font-sans">
            Recruiter Screening Action & Notes
          </h2>
          <p className="text-xs text-zinc-400">
            The HR recruiter makes the definitive hiring selection. The Fit Score serves as ranking intelligence.
          </p>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Interview Notes & Screening Assessment
            </label>
            <input
              type="text"
              placeholder="e.g. Strong systems knowledge, scheduled for Technical Round 1 on Thursday..."
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none dark:bg-zinc-950 dark:border-zinc-700 light:bg-zinc-50 light:border-zinc-300 light:text-zinc-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => handleDecision('SHORTLISTED')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors cursor-pointer"
            >
              <ThumbsUp className="h-4 w-4" />
              <span>Shortlist for Interview</span>
            </button>
            <button
              onClick={() => handleDecision('REJECTED')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-colors cursor-pointer"
            >
              <ThumbsDown className="h-4 w-4" />
              <span>Reject Candidate</span>
            </button>
            <button
              onClick={() => handleDecision('PENDING')}
              className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Mark Pending Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
