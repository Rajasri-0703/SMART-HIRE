import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase,
  Plus,
  X,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Sliders
} from 'lucide-react';

interface CreateJobProps {
  setActiveTab: (tab: string) => void;
  onJobCreated?: (newJobId: number) => void;
}

export const CreateJob: React.FC<CreateJobProps> = ({ setActiveTab, onJobCreated }) => {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [description, setDescription] = useState('');
  const [requiredEducation, setRequiredEducation] = useState('B.Tech / B.E. in Computer Science or equivalent');
  const [minExperience, setMinExperience] = useState<number>(2.0);
  const [location, setLocation] = useState('San Francisco, CA (Hybrid)');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [skillThreshold, setSkillThreshold] = useState<number>(0.50);

  const [requiredSkills, setRequiredSkills] = useState<string[]>(['python', 'react', 'sql']);
  const [preferredSkills, setPreferredSkills] = useState<string[]>(['docker', 'aws', 'typescript']);
  const [reqSkillInput, setReqSkillInput] = useState('');
  const [prefSkillInput, setPrefSkillInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleAddReqSkill = () => {
    const val = reqSkillInput.trim().toLowerCase();
    if (val && !requiredSkills.includes(val)) {
      setRequiredSkills([...requiredSkills, val]);
      setReqSkillInput('');
    }
  };

  const handleRemoveReqSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill));
  };

  const handleAddPrefSkill = () => {
    const val = prefSkillInput.trim().toLowerCase();
    if (val && !preferredSkills.includes(val)) {
      setPreferredSkills([...preferredSkills, val]);
      setPrefSkillInput('');
    }
  };

  const handleRemovePrefSkill = (skill: string) => {
    setPreferredSkills(preferredSkills.filter((s) => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError('');
    setLoading(true);

    try {
      if (requiredSkills.length === 0) {
        throw new Error('Please specify at least one required skill for automated matching.');
      }

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          department,
          description,
          required_education: requiredEducation,
          min_experience: minExperience,
          location,
          employment_type: employmentType,
          required_skills: requiredSkills,
          preferred_skills: preferredSkills,
          skill_threshold: skillThreshold
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create job');

      setSuccess(true);
      if (onJobCreated) onJobCreated(data.id);
      setTimeout(() => {
        setActiveTab('jobs');
      }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 dark:border-zinc-800 light:border-zinc-200">
        <button
          onClick={() => setActiveTab('jobs')}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 font-mono transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Jobs</span>
        </button>
        <span className="text-xs font-mono text-zinc-400">
          Normalized Relational DBMS Entity Creation
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 dark:text-zinc-100 light:text-zinc-900 font-sans">
          Create Job Vacancy & Criteria
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Define candidate eligibility rules and required competencies used by the Python matching pipeline.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs bg-rose-950/40 border border-rose-900 text-rose-300 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 text-xs bg-emerald-950/40 border border-emerald-900 text-emerald-300 rounded-lg">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Job vacancy saved to database successfully! Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-5 dark:border-zinc-800 dark:bg-zinc-900/50 light:bg-white light:border-zinc-200">
          <h2 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800/80 pb-2">
            1. Role Specification
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Backend Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none dark:bg-zinc-950 dark:border-zinc-700 light:bg-zinc-50 light:border-zinc-300 light:text-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Department *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-zinc-400 focus:outline-none dark:bg-zinc-950 dark:border-zinc-700 light:bg-zinc-50 light:border-zinc-300 light:text-zinc-900"
              >
                <option value="Engineering">Engineering</option>
                <option value="Cloud Operations">Cloud Operations</option>
                <option value="Data & Analytics">Data & Analytics</option>
                <option value="AI & Machine Learning">AI & Machine Learning</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Information Security">Information Security</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Job Description
            </label>
            <textarea
              rows={4}
              placeholder="Outline primary engineering responsibilities, architectural duties, and technology stack..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none dark:bg-zinc-950 dark:border-zinc-700 light:bg-zinc-50 light:border-zinc-300 light:text-zinc-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Location
              </label>
              <input
                type="text"
                placeholder="e.g. Remote / New York, NY"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none dark:bg-zinc-950 dark:border-zinc-700 light:bg-zinc-50 light:border-zinc-300 light:text-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Employment Type
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-zinc-400 focus:outline-none dark:bg-zinc-950 dark:border-zinc-700 light:bg-zinc-50 light:border-zinc-300 light:text-zinc-900"
              >
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Screening Rules & Competencies */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-5 dark:border-zinc-800 dark:bg-zinc-900/50 light:bg-white light:border-zinc-200">
          <h2 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800/80 pb-2">
            2. Minimum Qualifications & DMGT Decision Parameters
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Required Education *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. B.Tech / Bachelor in Computer Science"
                value={requiredEducation}
                onChange={(e) => setRequiredEducation(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none dark:bg-zinc-950 dark:border-zinc-700 light:bg-zinc-50 light:border-zinc-300 light:text-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Minimum Experience (Years) *
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="25"
                required
                value={minExperience}
                onChange={(e) => setMinExperience(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none dark:bg-zinc-950 dark:border-zinc-700 light:bg-zinc-50 light:border-zinc-300 light:text-zinc-900 font-mono"
              />
            </div>
          </div>

          {/* Required Skills Adder */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Required Skills (Strict Match – Weight 40%) *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type skill and press Add (e.g. python, react, sql, docker)"
                value={reqSkillInput}
                onChange={(e) => setReqSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddReqSkill(); } }}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none dark:bg-zinc-950 dark:border-zinc-700 light:bg-zinc-50 light:border-zinc-300 light:text-zinc-900"
              />
              <button
                type="button"
                onClick={handleAddReqSkill}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {requiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-200"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveReqSkill(skill)}
                    className="text-zinc-400 hover:text-rose-400 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Preferred Skills Adder */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Preferred Skills (Nice-to-have – Weight 20%)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type preferred skill and press Add (e.g. aws, kubernetes, redis)"
                value={prefSkillInput}
                onChange={(e) => setPrefSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPrefSkill(); } }}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none dark:bg-zinc-950 dark:border-zinc-700 light:bg-zinc-50 light:border-zinc-300 light:text-zinc-900"
              />
              <button
                type="button"
                onClick={handleAddPrefSkill}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {preferredSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800/60 border border-zinc-700/60 text-xs font-mono text-zinc-300"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePrefSkill(skill)}
                    className="text-zinc-400 hover:text-rose-400 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* DMGT Minimum Required Skill Threshold */}
          <div className="pt-2 border-t border-zinc-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Minimum Required Skill Match Ratio (DMGT Threshold)
              </label>
              <span className="text-xs font-mono font-bold text-zinc-200">
                {Math.round(skillThreshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.30"
              max="1.0"
              step="0.05"
              value={skillThreshold}
              onChange={(e) => setSkillThreshold(parseFloat(e.target.value))}
              className="w-full accent-zinc-200"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Candidates must match at least {Math.round(skillThreshold * 100)}% of required skills to satisfy the DMGT eligibility predicate.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('jobs')}
            className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white rounded-lg transition-colors disabled:opacity-50 shadow-sm cursor-pointer dark:bg-zinc-100 dark:text-zinc-950 light:bg-zinc-900 light:text-zinc-50"
          >
            {loading ? 'Saving Vacancy to Database...' : 'Save Job Vacancy'}
          </button>
        </div>
      </form>
    </div>
  );
};
