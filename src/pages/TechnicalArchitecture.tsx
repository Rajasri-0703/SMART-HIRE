import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Database,
  Binary,
  Layers,
  Code2,
  FileTerminal,
  CheckCircle2,
  Cpu,
  BookOpen,
  GitBranch,
  Search,
  Hash
} from 'lucide-react';

export const TechnicalArchitecture: React.FC = () => {
  const { token } = useAuth();
  const [techData, setTechData] = useState<any | null>(null);
  const [activePillar, setActivePillar] = useState<'DBMS' | 'DMGT' | 'ADSA' | 'OOPJ' | 'PYTHON'>('DBMS');

  useEffect(() => {
    async function loadTechOverview() {
      if (!token) return;
      try {
        const res = await fetch('/api/tech/overview', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTechData(data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadTechOverview();
  }, [token]);

  const pillars = [
    { id: 'DBMS', label: '1. DBMS', icon: Database, desc: 'Relational Schema & Constraints' },
    { id: 'DMGT', label: '2. DMGT', icon: Binary, desc: 'Set Theory & Predicate Logic' },
    { id: 'ADSA', label: '3. ADSA', icon: Layers, desc: 'B-Tree Indexing & Complexity' },
    { id: 'OOPJ', label: '4. OOPJ', icon: Code2, desc: 'Java OOP Domain Architecture' },
    { id: 'PYTHON', label: '5. Python', icon: FileTerminal, desc: 'NLP Pipeline & Fit Scoring' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Title */}
      <div className="border-b border-zinc-800 pb-5 dark:border-zinc-800 light:border-zinc-200">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 dark:text-zinc-100 light:text-zinc-900 font-sans">
            Technical Architecture & Academic Foundations
          </h1>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
            College Academic Review
          </span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          In-depth documentation of core computer science fundamentals implemented throughout SmartHire: DBMS, DMGT, ADSA, OOPJ, and Python.
        </p>
      </div>

      {/* 5-Pillar Segmented Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 dark:border-zinc-800 dark:bg-zinc-900/60 light:bg-white light:border-zinc-200">
        {pillars.map((p) => {
          const Icon = p.icon;
          const isActive = activePillar === p.id;
          const colors: Record<string, { active: string; icon: string }> = {
            DBMS: { active: 'bg-sky-950/40 text-sky-200 border-sky-500/40 shadow-sky-500/10', icon: 'text-sky-400' },
            DMGT: { active: 'bg-amber-950/40 text-amber-200 border-amber-500/40 shadow-amber-500/10', icon: 'text-amber-400' },
            ADSA: { active: 'bg-emerald-950/40 text-emerald-200 border-emerald-500/40 shadow-emerald-500/10', icon: 'text-emerald-400' },
            OOPJ: { active: 'bg-purple-950/40 text-purple-200 border-purple-500/40 shadow-purple-500/10', icon: 'text-purple-400' },
            PYTHON: { active: 'bg-cyan-950/40 text-cyan-200 border-cyan-500/40 shadow-cyan-500/10', icon: 'text-cyan-400' },
          };
          const theme = colors[p.id];
          return (
            <button
              key={p.id}
              onClick={() => setActivePillar(p.id as any)}
              className={`p-3 rounded-lg text-left transition-all cursor-pointer border ${
                isActive
                  ? `${theme.active} shadow-sm border`
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
              }`}
            >
              <div className="flex items-center gap-2 font-mono text-xs font-bold">
                <Icon className={`h-4 w-4 ${isActive ? theme.icon : 'text-zinc-400'}`} />
                <span>{p.label}</span>
              </div>
              <span className="text-[10px] text-zinc-400 block mt-1 truncate">
                {p.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* 1. DBMS TAB */}
      {activePillar === 'DBMS' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4 dark:border-zinc-800 light:bg-white light:border-zinc-200">
            <h2 className="text-base font-bold text-zinc-100 dark:text-zinc-100 light:text-zinc-900 font-sans flex items-center gap-2">
              <Database className="h-5 w-5 text-zinc-300" />
              <span>DBMS: Relational Database Schema & Normalized Storage</span>
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              SmartHire uses an ACID-compliant relational database management system. To guarantee data integrity and eliminate update anomalies, the database schema follows <strong>Third Normal Form (3NF)</strong>. Entities are strictly decomposed into distinct tables linked via Foreign Keys with <code>ON DELETE CASCADE</code> constraints.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/80 space-y-2 text-xs">
                <h3 className="font-mono font-bold text-zinc-200">1. Normalization & Decomposition (3NF)</h3>
                <ul className="space-y-1 text-zinc-400 list-disc pl-4 text-[11px]">
                  <li><strong>1NF:</strong> All attribute values are atomic. Skills and candidate associations are not packed into comma-separated text in the core entity, but normalized into junction relations.</li>
                  <li><strong>2NF:</strong> Every non-prime attribute is fully functionally dependent on primary keys (e.g. <code>candidate_skills(candidate_id, skill_id)</code> composite key).</li>
                  <li><strong>3NF:</strong> No transitive dependencies exist. Job requirements and screening scores are isolated from generic candidate demographic records.</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/80 space-y-2 text-xs">
                <h3 className="font-mono font-bold text-zinc-200">2. Relational Integrity & Foreign Keys</h3>
                <ul className="space-y-1 text-zinc-400 list-disc pl-4 text-[11px]">
                  <li><code>job_requirements.job_id → jobs.id (CASCADE)</code></li>
                  <li><code>resumes.candidate_id → candidates.id (CASCADE)</code></li>
                  <li><code>candidate_skills → (candidates.id, skills.id)</code></li>
                  <li><code>screening_results → (jobs.id, candidates.id, resumes.id)</code></li>
                  <li><code>shortlist → (jobs.id, candidates.id, users.id)</code></li>
                </ul>
              </div>
            </div>

            {/* Live Database Tables Inspector */}
            <div className="pt-3 border-t border-zinc-800/80">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Live SQLite Relational Tables Inspector
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {techData?.dbms?.tables?.map((tableName: string) => (
                  <div
                    key={tableName}
                    className="p-3 rounded-lg border border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs"
                  >
                    <span className="font-mono text-zinc-300">{tableName}</span>
                    <span className="font-mono text-zinc-400 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {techData.dbms.table_counts[tableName] ?? 0} rows
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DMGT TAB */}
      {activePillar === 'DMGT' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4 dark:border-zinc-800 light:bg-white light:border-zinc-200">
            <h2 className="text-base font-bold text-zinc-100 dark:text-zinc-100 light:text-zinc-900 font-sans flex items-center gap-2">
              <Binary className="h-5 w-5 text-zinc-300" />
              <span>DMGT: Discrete Mathematics, Set Theory & Predicate Logic</span>
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Candidate screening and eligibility determination in SmartHire are grounded in <strong>Discrete Mathematics and Graph Theory (DMGT)</strong> principles. We employ set intersection, Jaccard similarity metrics, and formal propositional predicate calculus to evaluate applicant qualifications objectively.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Set Theory */}
              <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/80 space-y-3 text-xs">
                <h3 className="font-mono font-bold text-zinc-200">1. Set-Theoretic Competency Matching</h3>
                <p className="text-[11px] text-zinc-400">
                  Let U be the universe of all standardized technical competencies.
                  Let R_job ⊆ U denote required skills for vacancy j, and C_cand ⊆ U denote skills extracted from resume r.
                </p>
                <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-300">
                  Matched Skills = R_job ∩ C_cand<br />
                  Missing Skills = R_job \ C_cand<br />
                  Skill Match Ratio S = |R_job ∩ C_cand| / |R_job|
                </div>
              </div>

              {/* Predicate Calculus */}
              <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/80 space-y-3 text-xs">
                <h3 className="font-mono font-bold text-zinc-200">2. Propositional Predicate Eligibility Engine</h3>
                <p className="text-[11px] text-zinc-400">
                  A candidate is classified as <code>Eligible</code> if and only if the logical conjunction of all mandatory criteria predicates evaluates to TRUE:
                </p>
                <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-300">
                  E_edu(c, j) ≡ (Level(c.edu) ≥ Level(j.req_edu))<br />
                  E_exp(c, j) ≡ (c.years_exp ≥ j.min_exp - 0.5)<br />
                  E_skills(c, j) ≡ (S ≥ j.threshold)<br />
                  Eligible(c, j) ⇔ E_edu ∧ E_exp ∧ E_skills
                </div>
              </div>
            </div>

            {/* Truth Table */}
            <div className="pt-3 border-t border-zinc-800/80">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Eligibility Boolean Truth Table (Conjunctive Predicates)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] font-mono border border-zinc-800 rounded">
                  <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400">
                    <tr>
                      <th className="p-2">E_edu (Education)</th>
                      <th className="p-2">E_exp (Experience)</th>
                      <th className="p-2">E_skills (Skill Threshold)</th>
                      <th className="p-2">Eligible (E_edu ∧ E_exp ∧ E_skills)</th>
                      <th className="p-2">System Disposition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    <tr className="bg-emerald-950/20 text-emerald-300">
                      <td className="p-2">TRUE</td>
                      <td className="p-2">TRUE</td>
                      <td className="p-2">TRUE</td>
                      <td className="p-2 font-bold">TRUE</td>
                      <td className="p-2 font-sans">Eligible for Interview Pre-Ranking</td>
                    </tr>
                    <tr className="text-zinc-400">
                      <td className="p-2">FALSE</td>
                      <td className="p-2">TRUE</td>
                      <td className="p-2">TRUE</td>
                      <td className="p-2 text-rose-400 font-bold">FALSE</td>
                      <td className="p-2 font-sans text-rose-400">Disqualified: Education Deficit</td>
                    </tr>
                    <tr className="text-zinc-400">
                      <td className="p-2">TRUE</td>
                      <td className="p-2">FALSE</td>
                      <td className="p-2">TRUE</td>
                      <td className="p-2 text-rose-400 font-bold">FALSE</td>
                      <td className="p-2 font-sans text-rose-400">Disqualified: Experience Deficit</td>
                    </tr>
                    <tr className="text-zinc-400">
                      <td className="p-2">TRUE</td>
                      <td className="p-2">TRUE</td>
                      <td className="p-2">FALSE</td>
                      <td className="p-2 text-rose-400 font-bold">FALSE</td>
                      <td className="p-2 font-sans text-rose-400">Disqualified: Critical Skills Gap</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. ADSA TAB */}
      {activePillar === 'ADSA' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4 dark:border-zinc-800 light:bg-white light:border-zinc-200">
            <h2 className="text-base font-bold text-zinc-100 dark:text-zinc-100 light:text-zinc-900 font-sans flex items-center gap-2">
              <Layers className="h-5 w-5 text-zinc-300" />
              <span>ADSA: Advanced Data Structures, Algorithms & B-Tree Indexing</span>
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Searching and filtering hundreds of applicant resumes demands rigorous asymptotic efficiency. In SmartHire, we utilize <strong>B-Tree (Balanced Tree) database indexes</strong> to achieve logarithmic time complexity O(log N) for candidate lookups, avoiding degenerate linear table scans O(N).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/80 space-y-2 text-xs">
                <h3 className="font-mono font-bold text-zinc-200">1. Why B-Trees for Candidate Searching?</h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  A B-Tree is a self-balancing search tree in which internal nodes can have more than two child pointers. Because SQLite stores database pages on persistent disk blocks:
                </p>
                <ul className="space-y-1 text-zinc-400 list-disc pl-4 text-[11px]">
                  <li><strong>High Fan-out:</strong> Each B-Tree page holds dozens of keys, keeping tree height shallow (h ≤ 3 for tens of thousands of candidates).</li>
                  <li><strong>I/O Minimization:</strong> Finding a candidate with a specific email or fit score takes at most h page reads (O(log N)).</li>
                  <li><strong>Range Scans:</strong> Leaf pages are linked sequentially, enabling rapid range queries (e.g. <code>WHERE overall_fit_score &gt;= 75</code>).</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/80 space-y-2 text-xs">
                <h3 className="font-mono font-bold text-zinc-200">2. Time & Space Complexity Analysis</h3>
                <div className="space-y-1.5 font-mono text-[11px] pt-1">
                  <div className="flex justify-between p-2 rounded bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-400">Unindexed Table Scan</span>
                    <span className="text-rose-400 font-bold">O(N) time</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-400">B-Tree Exact Key Lookup</span>
                    <span className="text-emerald-400 font-bold">O(log N) time</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-400">B-Tree Pre-Ranking Sort</span>
                    <span className="text-emerald-400 font-bold">O(K log N) time</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-400">B-Tree Storage Overhead</span>
                    <span className="text-zinc-300 font-bold">O(N) space</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Real Database Indexes */}
            <div className="pt-3 border-t border-zinc-800/80">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Explicit Database B-Tree Indexes Configured in SmartHire
              </h3>
              <div className="space-y-2">
                {techData?.adsa?.indexes?.map((idx: any) => (
                  <div
                    key={idx.name}
                    className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-zinc-200">{idx.name}</span>
                      <span className="text-zinc-500 text-[11px] ml-2">on {idx.table}</span>
                    </div>
                    <code className="text-[11px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded truncate max-w-md">
                      {idx.definition || `INDEX ON ${idx.table}`}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. OOPJ TAB */}
      {activePillar === 'OOPJ' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4 dark:border-zinc-800 light:bg-white light:border-zinc-200">
            <h2 className="text-base font-bold text-zinc-100 dark:text-zinc-100 light:text-zinc-900 font-sans flex items-center gap-2">
              <Code2 className="h-5 w-5 text-zinc-300" />
              <span>OOPJ: Object-Oriented Programming in Java Architecture</span>
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              The application's domain logic is structured following standard Object-Oriented Programming in Java principles. The enterprise domain model features encapsulation, inheritance from an abstract base entity, polymorphism via Strategy interfaces, and clean Separation of Concerns.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/80 space-y-2 text-xs">
                <h3 className="font-mono font-bold text-zinc-200">1. Core OOP Principles Demonstrated</h3>
                <ul className="space-y-1.5 text-zinc-400 list-disc pl-4 text-[11px]">
                  <li><strong>Encapsulation:</strong> Entity attributes (e.g. <code>candidate.yearsOfExperience</code>, <code>job.minExperienceYears</code>) are private and governed by accessors and invariant validators.</li>
                  <li><strong>Inheritance:</strong> Domain models extend <code>BaseEntity</code> to inherit common audit metadata (<code>id</code>, <code>createdAt</code>, <code>updatedAt</code>).</li>
                  <li><strong>Polymorphism:</strong> Strategy Pattern is employed for candidate scoring: <code>interface FitScoreStrategy</code> allows runtime swapping of linear vs weighted algorithms.</li>
                  <li><strong>Domain Value Objects:</strong> <code>FitScore</code> is an immutable value object encapsulating sub-score calculations.</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/80 space-y-2 text-xs">
                <h3 className="font-mono font-bold text-zinc-200">2. Java Source File In Codebase</h3>
                <p className="text-[11px] text-zinc-400">
                  The complete production-ready Java class hierarchy is included in the project repository at:
                </p>
                <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-300">
                  <code>/server/java/SmartHireCore.java</code>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Package: <code>org.smarthire.core</code><br />
                  Entities: <code>Candidate</code>, <code>Job</code>, <code>Resume</code>, <code>Recruiter</code>, <code>ScreeningResult</code>, <code>FitScore</code>, <code>RuleBasedEligibilityEngine</code>.
                </p>
              </div>
            </div>

            {/* Code Snippet Preview */}
            <div className="pt-3 border-t border-zinc-800/80 space-y-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                Java Strategy Pattern Implementation (Excerpt from SmartHireCore.java)
              </h3>
              <pre className="text-[11px] font-mono text-zinc-300 bg-zinc-950 p-4 rounded-lg border border-zinc-800 overflow-x-auto leading-relaxed">
{`interface FitScoreStrategy {
    FitScore calculate(Candidate candidate, Job job, Map<String, Double> weights);
}

class WeightedFitScoreStrategy implements FitScoreStrategy {
    @Override
    public FitScore calculate(Candidate candidate, Job job, Map<String, Double> weights) {
        Set<String> candidateSkills = candidate.getDetectedSkills();
        List<String> reqSkills = job.getRequiredSkills();

        long matchedReqCount = reqSkills.stream()
                .filter(req -> candidateSkills.contains(req) || candidateSkills.stream().anyMatch(cs -> cs.contains(req)))
                .count();
        double reqRatio = reqSkills.isEmpty() ? 1.0 : (double) matchedReqCount / reqSkills.size();
        double reqScore = reqRatio * 100.0;

        double wSkills = weights.getOrDefault("required_skills", 0.40);
        // ... weights combination (sum w_i * s_i) ...
        return new FitScore(total, reqScore, prefScore, eduScore, expScore, certScore);
    }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 5. PYTHON TAB */}
      {activePillar === 'PYTHON' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4 dark:border-zinc-800 light:bg-white light:border-zinc-200">
            <h2 className="text-base font-bold text-zinc-100 dark:text-zinc-100 light:text-zinc-900 font-sans flex items-center gap-2">
              <FileTerminal className="h-5 w-5 text-zinc-300" />
              <span>Python: Resume Parsing, NLP Extraction & Dynamic Fit Scoring Service</span>
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              The resume text extraction and scoring pipeline is powered by an asynchronous <strong>Python 3 backend service</strong> (<code>server/python/resume_engine.py</code>). When resumes are uploaded in bulk, the server feeds extracted text into the Python runtime through a JSON standard stream protocol.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/80 space-y-2 text-xs">
                <h3 className="font-mono font-bold text-zinc-200">1. NLP & Entity Extraction Pipeline</h3>
                <ul className="space-y-1 text-zinc-400 list-disc pl-4 text-[11px]">
                  <li><strong>Contact Information:</strong> Regular expressions for international phone formats and RFC-5322 compliant emails.</li>
                  <li><strong>Candidate Name:</strong> Header heuristics, capitalization analysis, and suppression of document keywords.</li>
                  <li><strong>Education Level:</strong> Hierarchy matching mapping degrees to ordinal values (Ph.D=5, Master=4, Bachelor=3, Diploma=2).</li>
                  <li><strong>Experience Calculation:</strong> Chronological date range span extraction and text-based year deduction.</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/80 space-y-2 text-xs">
                <h3 className="font-mono font-bold text-zinc-200">2. Taxonomy & Fuzzy Skill Normalization</h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Matches candidate vocabulary against a curated 150+ technology dictionary spanning Web Frameworks, DBMS, Cloud/DevOps, AI/ML, and Core CS.
                </p>
                <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-300">
                  Synonym Mapping: <code>reactjs → react</code>, <code>postgres → postgresql</code>, <code>k8s → kubernetes</code>, <code>golang → go</code>
                </div>
              </div>
            </div>

            {/* Dynamic Formula Display */}
            <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950 space-y-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                Transparent Dynamic Fit Score Formula (0 to 100)
              </h3>
              <div className="p-3 rounded bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-200 text-center leading-relaxed">
                FitScore = (Score_req * 0.40) + (Score_pref * 0.20) + (Score_edu * 0.15) + (Score_exp * 0.15) + (Score_portfolio * 0.10)
              </div>
              <p className="text-[11px] text-zinc-400 text-center">
                *Weights are fully configurable via the Settings panel and dynamically persisted in the SQLite <code>system_settings</code> table.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
