export interface User {
  id: number;
  email: string;
  full_name: string;
  department: string;
  role: string;
}

export interface Job {
  id: number;
  title: string;
  department: string;
  description: string;
  required_education: string;
  min_experience: number;
  location: string;
  employment_type: string;
  skill_threshold: number;
  status: 'ACTIVE' | 'PAUSED' | 'CLOSED';
  created_at: string;
  updated_at: string;
  required_skills: string[];
  preferred_skills: string[];
  req_skills_count?: number;
  pref_skills_count?: number;
  applicant_count?: number;
  shortlisted_count?: number;
  candidates?: ScreeningResultItem[];
}

export interface Candidate {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  education: string;
  education_level: number;
  years_experience: number;
  current_title: string;
  certifications_summary: string;
  projects_summary: string;
  created_at: string;
  total_screenings?: number;
  max_fit_score?: number;
  latest_status?: string;
  skills?: CandidateSkill[];
  resumes?: ResumeRecord[];
  screenings?: ScreeningResultItem[];
}

export interface CandidateSkill {
  name: string;
  category: string;
  proficiency: string;
}

export interface ResumeRecord {
  id: number;
  candidate_id: number;
  original_filename: string;
  file_size_bytes: number;
  file_type: string;
  extracted_text: string;
  processing_status: string;
  processing_error?: string;
  upload_timestamp: string;
}

export interface FitScoreSubScores {
  skill_match_score: number;
  preferred_skill_score: number;
  education_match_score: number;
  experience_match_score: number;
  cert_project_score: number;
}

export interface ScreeningResultItem {
  id: number;
  job_id: number;
  candidate_id: number;
  resume_id: number;
  overall_fit_score: number;
  skill_match_score: number;
  preferred_skill_score: number;
  education_match_score: number;
  experience_match_score: number;
  cert_project_score: number;
  is_eligible: number | boolean;
  eligibility_reason: string;
  matched_required_skills: string;
  missing_required_skills: string;
  matched_preferred_skills: string;
  missing_preferred_skills: string;
  decision_status: 'PENDING' | 'SHORTLISTED' | 'REJECTED';
  hr_notes?: string;
  screened_at: string;
  full_name?: string;
  email?: string;
  phone?: string;
  education?: string;
  years_experience?: number;
  current_title?: string;
  job_title?: string;
  department?: string;
  job_department?: string;
  original_filename?: string;
  extracted_text?: string;
  skills?: CandidateSkill[];
  fitScoreWeights?: {
    req_skills_weight: number;
    pref_skills_weight: number;
    education_weight: number;
    experience_weight: number;
    certs_projects_weight: number;
  };
}

export interface DashboardStats {
  totalJobs: number;
  totalResumes: number;
  totalCandidates: number;
  eligibleCandidates: number;
  notEligibleCandidates: number;
  shortlistedCandidates: number;
  averageFitScore: number;
  distribution: Record<string, number>;
  departmentStats: {
    department: string;
    job_count: number;
    candidate_screenings: number;
  }[];
  recentActivity: {
    id: number;
    action: string;
    details: string;
    user_email: string;
    created_at: string;
    candidate_name?: string;
    job_title?: string;
  }[];
}

export interface ScoringWeights {
  required_skills: number;
  preferred_skills: number;
  education: number;
  experience: number;
  certs_projects: number;
  skill_threshold: number;
}
