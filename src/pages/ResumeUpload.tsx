import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Job } from '../types';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  ArrowRight,
  Briefcase,
  Sparkles,
  Download,
  Info
} from 'lucide-react';

interface ResumeUploadProps {
  selectedJobId?: number | null;
  setActiveTab: (tab: string) => void;
  onScreeningComplete?: () => void;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({
  selectedJobId,
  setActiveTab,
  onScreeningComplete
}) => {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [targetJobId, setTargetJobId] = useState<number | string>(selectedJobId || '');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [batchResult, setBatchResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch active jobs for selection
  useEffect(() => {
    async function loadJobs() {
      if (!token) return;
      try {
        const res = await fetch('/api/jobs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
          if (!targetJobId && data.length > 0) {
            setTargetJobId(data[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadJobs();
  }, [token]);

  useEffect(() => {
    if (selectedJobId) {
      setTargetJobId(selectedJobId);
    }
  }, [selectedJobId]);

  const handleFiles = (incomingFiles: FileList | File[]) => {
    const validFiles: File[] = [];
    const validExtensions = ['.pdf', '.docx', '.txt', '.rtf', '.md'];

    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i];
      const lowerName = file.name.toLowerCase();
      const hasValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));

      if (hasValidExt) {
        validFiles.push(file);
      } else {
        alert(`Skipped "${file.name}": Unsupported format. Please provide PDF, DOCX, or TXT.`);
      }
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setFiles([]);
    setBatchResult(null);
    setErrorMessage('');
  };

  // Upload handler
  const handleUploadAndScreen = async () => {
    if (!targetJobId) {
      setErrorMessage('Please select a target Job Vacancy to screen these resumes against.');
      return;
    }
    if (files.length === 0) {
      setErrorMessage('Please add at least one resume file to upload.');
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setProcessingStep('Sending resumes to server...');
    setErrorMessage('');
    setBatchResult(null);

    const formData = new FormData();
    formData.append('jobId', targetJobId.toString());
    files.forEach((f) => formData.append('files', f));

    try {
      setUploadProgress(40);
      setProcessingStep('Extracting text and invoking Python NLP extraction pipeline...');

      const res = await fetch('/api/resumes/upload-bulk', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      setUploadProgress(100);
      setProcessingStep('Screening complete. Persisted to SQLite database.');

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setBatchResult(data);
      if (onScreeningComplete) onScreeningComplete();
    } catch (err: any) {
      setErrorMessage(err.message || 'Screening pipeline failed');
    } finally {
      setUploading(false);
    }
  };

  // Helper to load test resume files directly into memory for quick review
  const loadSampleFileToQueue = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const file = new File([blob], filename, { type: 'text/plain' });
    setFiles((prev) => [...prev, file]);
  };

  const sampleCandidateResumes = [
    {
      name: 'Elena_Rostova_FullStack.txt',
      label: 'Elena Rostova (Full Stack · 4 yrs)',
      content: `Elena Rostova
elena.rostova@engineer.dev | +1 (415) 321-9988 | San Francisco, CA
B.Tech in Computer Science & Engineering (2018 - 2022)
4 years of experience as Full Stack Engineer

TECHNICAL SKILLS:
Python, React, TypeScript, Node.js, PostgreSQL, Docker, AWS, Git, REST API

CERTIFICATIONS:
AWS Certified Developer - Associate

PROJECTS:
- High-concurrency payment engine with Python and PostgreSQL
- Real-time React dashboard with WebSockets`
    },
    {
      name: 'Tariq_Mansoor_DevOps.txt',
      label: 'Tariq Mansoor (DevOps / Cloud · 3 yrs)',
      content: `Tariq Mansoor
tariq.m@cloudinfra.io | +1 (650) 444-1234 | San Jose, CA
B.Tech in Information Technology
3 years of experience as DevOps Engineer

TECHNICAL SKILLS:
Docker, Kubernetes, AWS, Linux, CI/CD, Terraform, Git, Python, Bash

CERTIFICATIONS:
Certified Kubernetes Administrator (CKA)

PROJECTS:
- Multi-cloud Kubernetes deployment orchestration
- Automated CI/CD pipeline using GitLab and Docker`
    },
    {
      name: 'Samantha_Wu_Fresher.txt',
      label: 'Samantha Wu (Junior/Fresher · 0.5 yrs)',
      content: `Samantha Wu
samantha.wu@university.edu | +1 (212) 555-9012 | New York, NY
B.Tech in Computer Science (2025 Graduate)
0.5 years internship experience as Junior Software Developer

TECHNICAL SKILLS:
Python, HTML, CSS, JavaScript, Git, SQLite

PROJECTS:
- Student Grade Management System in Python and SQLite
- Personal portfolio website`
    }
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Title */}
      <div className="border-b border-zinc-800 pb-5 dark:border-zinc-800 light:border-zinc-200">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 dark:text-zinc-100 light:text-zinc-900 font-sans">
          Bulk Resume Ingestion & Dynamic Screening
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Upload batches of resumes (PDF, DOCX, TXT). The system extracts candidate entities, evaluates job criteria via DMGT logic, and calculates dynamic fit scores.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 text-xs bg-rose-950/40 border border-rose-900 text-rose-300 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Target Job Selector */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3 dark:border-zinc-800 dark:bg-zinc-900/50 light:bg-white light:border-zinc-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase className="h-4 w-4 text-zinc-400" />
            <span>Select Target Job Vacancy *</span>
          </label>
          <span className="text-[11px] font-mono text-zinc-400">
            Resumes will be matched against this opening
          </span>
        </div>

        {jobs.length === 0 ? (
          <div className="text-xs text-zinc-400 py-2">
            No job vacancies found. Please{' '}
            <button
              onClick={() => setActiveTab('create-job')}
              className="text-zinc-200 underline font-medium hover:text-white"
            >
              create a job vacancy
            </button>{' '}
            first.
          </div>
        ) : (
          <select
            value={targetJobId}
            onChange={(e) => setTargetJobId(Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-xs text-zinc-100 focus:border-zinc-400 focus:outline-none dark:bg-zinc-950 dark:border-zinc-700 light:bg-zinc-50 light:border-zinc-300 light:text-zinc-900 cursor-pointer"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                JOB-{j.id}: {j.title} ({j.department}) — Min {j.min_experience} yrs exp · Req Skills: {(j.required_skills || []).slice(0, 3).join(', ')}...
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-indigo-400 bg-indigo-950/20 scale-[1.01]'
            : 'border-zinc-800 bg-zinc-900/30 hover:border-indigo-500/50 hover:bg-zinc-900/60 dark:border-zinc-800 dark:bg-zinc-900/30 light:bg-white light:border-zinc-300'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.rtf,.md"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30 text-indigo-400 mb-3 shadow-md shadow-indigo-500/10">
          <UploadCloud className="h-6 w-6" />
        </div>

        <h3 className="text-sm font-semibold text-zinc-100 dark:text-zinc-100 light:text-zinc-900">
          Drop multiple resumes here or click to browse
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          Supports bulk PDF, Word (.docx), and Plain Text (.txt) up to 20 files at once
        </p>
        <span className="inline-block mt-3 text-[10px] font-mono text-purple-300 bg-purple-950/50 px-2.5 py-0.5 rounded-full border border-purple-500/30">
          Real Text Extraction & Python NLP Parsing Pipeline
        </span>
      </div>

      {/* Pre-packaged sample resumes for effortless college review testing */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 dark:border-zinc-800 light:bg-zinc-50 light:border-zinc-200">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-zinc-200">
          <Info className="h-3.5 w-3.5 text-indigo-400" />
          <span>Quick Evaluation: Load Realistic Sample Resumes</span>
        </div>
        <p className="text-[11px] text-zinc-400 mb-3">
          Don't have PDF resumes on this machine? Click any profile below to inject genuine candidate text into the upload queue:
        </p>
        <div className="flex flex-wrap gap-2">
          {sampleCandidateResumes.map((sample, idx) => {
            const chipStyles = [
              'border-blue-500/40 bg-blue-950/30 text-blue-300 hover:bg-blue-900/40',
              'border-purple-500/40 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40',
              'border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40'
            ];
            const chipClass = chipStyles[idx % chipStyles.length];
            return (
              <button
                key={sample.name}
                type="button"
                onClick={() => loadSampleFileToQueue(sample.name, sample.content)}
                className={`text-xs font-mono font-medium px-3 py-1.5 rounded-lg border ${chipClass} flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm`}
              >
                <span>+ {sample.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Queued Files List */}
      {files.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4 dark:border-zinc-800 dark:bg-zinc-900/60 light:bg-white light:border-zinc-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                Queued Resumes ({files.length})
              </h2>
            </div>
            <button
              onClick={clearFiles}
              className="text-xs font-mono text-zinc-400 hover:text-rose-400 flex items-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear Queue
            </button>
          </div>

          <div className="divide-y divide-zinc-800/60 max-h-60 overflow-y-auto pr-1">
            {files.map((file, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 truncate pr-2">
                  <FileText className="h-4 w-4 text-zinc-400 shrink-0" />
                  <span className="font-mono text-zinc-200 truncate">{file.name}</span>
                  <span className="text-[10px] text-zinc-400 shrink-0">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={() => removeFile(idx)}
                  className="text-zinc-400 hover:text-rose-400 p-1 shrink-0"
                >
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Upload Progress Indicator */}
          {uploading && (
            <div className="pt-3 border-t border-zinc-800/80 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-300">{processingStep}</span>
                <span className="text-zinc-200 font-bold">{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-zinc-100 dark:bg-zinc-100 light:bg-zinc-900 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleUploadAndScreen}
              disabled={uploading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-100 text-zinc-950 font-bold text-xs hover:bg-white transition-all disabled:opacity-50 shadow-md cursor-pointer dark:bg-zinc-100 dark:text-zinc-950 light:bg-zinc-900 light:text-zinc-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{uploading ? 'Processing Resumes...' : `Process & Screen ${files.length} Resume${files.length === 1 ? '' : 's'}`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Batch Processing Results Summary */}
      {batchResult && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-5 dark:border-zinc-800 dark:bg-zinc-900/80 light:bg-white light:border-zinc-200 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-zinc-100 dark:text-zinc-100 light:text-zinc-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Batch Screening Execution Completed</span>
              </h2>
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                Processed: {batchResult.processed} · Failed: {batchResult.failed} · Total: {batchResult.total}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('screening')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-950 text-xs font-semibold hover:bg-white transition-colors cursor-pointer"
            >
              <span>View Pre-Ranking Table</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Results Cards */}
          <div className="space-y-2.5">
            {batchResult.results?.map((res: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-950/70 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-100">{res.full_name}</span>
                    <span className="text-[10px] font-mono text-zinc-400">({res.filename})</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {res.is_eligible ? (
                      <span className="text-emerald-400">✓ Satisfies Eligibility Predicates</span>
                    ) : (
                      <span className="text-rose-400">✗ {res.eligibility_reason}</span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-bold font-mono text-zinc-100">
                    {res.overall_fit_score}%
                  </span>
                  <span className="text-[10px] text-zinc-400 block font-mono">Dynamic Fit</span>
                </div>
              </div>
            ))}

            {batchResult.errors?.map((err: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg border border-rose-900/60 bg-rose-950/20 text-xs"
              >
                <div>
                  <span className="font-mono text-rose-300 font-bold">{err.filename}</span>
                  <p className="text-[11px] text-rose-400 mt-0.5">{err.error}</p>
                </div>
                <span className="text-[10px] font-mono uppercase text-rose-400 px-2 py-0.5 rounded border border-rose-900/80 bg-rose-950/40">
                  Parsing Error
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
