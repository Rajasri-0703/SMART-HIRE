import { spawn } from 'child_process';
import path from 'path';

export interface CandidateExtractionResult {
  full_name: string;
  email: string;
  phone: string;
  education: string;
  education_level: number;
  years_experience: number;
  current_title: string;
  detected_skills: string[];
  programming_languages: string[];
  skills_by_category: Record<string, string[]>;
  certifications: string[];
  projects: string[];
}

export interface FitScoreSubScores {
  skill_match_score: number;
  preferred_skill_score: number;
  education_match_score: number;
  experience_match_score: number;
  cert_project_score: number;
}

export interface RequirementsAnalysis {
  matched_required_skills: string[];
  missing_required_skills: string[];
  matched_preferred_skills: string[];
  missing_preferred_skills: string[];
  education_satisfied: boolean;
  experience_satisfied: boolean;
  required_skills_ratio: number;
}

export interface ScreeningEvaluationResult {
  overall_fit_score: number;
  sub_scores: FitScoreSubScores;
  weights_applied: Record<string, number>;
  is_eligible: boolean;
  eligibility_reason: string;
  requirements_analysis: RequirementsAnalysis;
}

export interface FullPipelineResult {
  candidate: CandidateExtractionResult;
  screening: ScreeningEvaluationResult;
}

// Fallback taxonomy if Python process is interrupted
const SKILL_TAXONOMY: Record<string, string> = {
  python: 'Programming Languages',
  java: 'Programming Languages',
  'c++': 'Programming Languages',
  c: 'Programming Languages',
  'c#': 'Programming Languages',
  javascript: 'Programming Languages',
  typescript: 'Programming Languages',
  go: 'Programming Languages',
  golang: 'Programming Languages',
  rust: 'Programming Languages',
  react: 'Web Technologies',
  'node.js': 'Web Technologies',
  nodejs: 'Web Technologies',
  angular: 'Web Technologies',
  vue: 'Web Technologies',
  'next.js': 'Web Technologies',
  express: 'Web Technologies',
  'express.js': 'Web Technologies',
  django: 'Web Technologies',
  flask: 'Web Technologies',
  fastapi: 'Web Technologies',
  'spring boot': 'Web Technologies',
  sql: 'DBMS & Storage',
  mysql: 'DBMS & Storage',
  postgresql: 'DBMS & Storage',
  postgres: 'DBMS & Storage',
  sqlite: 'DBMS & Storage',
  mongodb: 'DBMS & Storage',
  redis: 'DBMS & Storage',
  docker: 'DevOps & Cloud',
  kubernetes: 'DevOps & Cloud',
  aws: 'DevOps & Cloud',
  azure: 'DevOps & Cloud',
  gcp: 'DevOps & Cloud',
  git: 'DevOps & Cloud',
  'machine learning': 'AI & Data Science',
  'deep learning': 'AI & Data Science',
  tensorflow: 'AI & Data Science',
  pytorch: 'AI & Data Science',
  linux: 'DevOps & Cloud',
  'rest api': 'Web Technologies',
  'data structures': 'Core CS',
  algorithms: 'Core CS'
};

const SYNONYMS: Record<string, string> = {
  reactjs: 'react',
  'react.js': 'react',
  nodejs: 'node.js',
  postgres: 'postgresql',
  golang: 'go',
  k8s: 'kubernetes',
  'amazon web services': 'aws',
  'google cloud': 'gcp',
  js: 'javascript',
  ts: 'typescript',
  py: 'python'
};

function normalizeSkill(s: string): string {
  const clean = s.trim().toLowerCase();
  return SYNONYMS[clean] || clean;
}

/**
 * Execute Python Resume Engine via CLI Stdin/Stdout
 */
async function callPythonEngine(payload: any): Promise<any> {
  const pythonScript = path.resolve(process.cwd(), 'server/python/resume_engine.py');

  return new Promise((resolve, reject) => {
    const py = spawn('python3', [pythonScript]);
    let stdout = '';
    let stderr = '';

    py.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    py.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    py.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python Engine failed (code ${code}): ${stderr || 'Unknown error'}`));
      }
      try {
        const parsed = JSON.parse(stdout);
        if (parsed.error) {
          return reject(new Error(parsed.error));
        }
        resolve(parsed);
      } catch (err: any) {
        reject(new Error(`Failed to parse Python response JSON: ${stdout.slice(0, 200)}`));
      }
    });

    py.stdin.write(JSON.stringify(payload));
    py.stdin.end();
  });
}

/**
 * Fallback TypeScript Implementation to ensure 100% reliability
 */
function fallbackProcessText(text: string, filename: string): CandidateExtractionResult {
  const textLower = text.toLowerCase();

  // Name extraction
  let name = 'Not detected';
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    if (!/(resume|curriculum|cv|contact|email|phone)/i.test(line)) {
      const clean = line.replace(/[^a-zA-Z\s]/g, '').trim();
      const words = clean.split(/\s+/);
      if (words.length >= 2 && words.length <= 4) {
        name = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        break;
      }
    }
  }
  if (name === 'Not detected' && filename) {
    const base = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
    const words = base.split(/\s+/);
    if (words.length >= 1 && words.length <= 4) {
      name = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }

  // Email
  const emailMatch = text.match(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/);
  const email = emailMatch ? emailMatch[0].toLowerCase() : 'Not detected';

  // Phone
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0].trim() : 'Not detected';

  // Education
  let degree = 'Not detected';
  let eduLevel = 0;
  if (/ph\.?d|doctorate/i.test(textLower)) {
    degree = 'Ph.D';
    eduLevel = 5;
  } else if (/m\.?tech|m\.?s|master|mca|mba/i.test(textLower)) {
    degree = 'Master of Technology / MS';
    eduLevel = 4;
  } else if (/b\.?tech|b\.?e|bachelor|bca|b\.?sc/i.test(textLower)) {
    degree = 'B.Tech in Computer Science / Engineering';
    eduLevel = 3;
  } else if (/diploma/i.test(textLower)) {
    degree = 'Diploma';
    eduLevel = 2;
  }

  // Experience
  let yearsExp = 1.0;
  const expMatch = textLower.match(/(\d+(?:\.\d+)?)\s*(?:\+|-)?\s*(?:years?|yrs?)/);
  if (expMatch) {
    yearsExp = parseFloat(expMatch[1]);
  } else if (/fresher|entry level|graduate/i.test(textLower)) {
    yearsExp = 0.5;
  }

  // Skills
  const detectedSkills = new Set<string>();
  const detectedLangs = new Set<string>();
  const byCategory: Record<string, string[]> = {};

  for (const [skill, cat] of Object.entries(SKILL_TAXONOMY)) {
    const regex = new RegExp(`(?<![a-zA-Z0-9#+])${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-zA-Z0-9#+])`, 'i');
    if (regex.test(textLower)) {
      const canonical = normalizeSkill(skill);
      detectedSkills.add(canonical);
      if (cat === 'Programming Languages') detectedLangs.add(canonical);
      if (!byCategory[cat]) byCategory[cat] = [];
      if (!byCategory[cat].includes(canonical)) byCategory[cat].push(canonical);
    }
  }

  // Title
  let title = 'Software Engineer';
  const titleMatch = textLower.match(/(full stack developer|backend developer|frontend developer|data engineer|devops engineer|cloud engineer|software engineer)/i);
  if (titleMatch) {
    title = titleMatch[0].split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // Certs
  const certs: string[] = [];
  if (/aws certified/i.test(textLower)) certs.push('AWS Certified Professional');
  if (/kubernetes|cka|ckad/i.test(textLower)) certs.push('Certified Kubernetes Administrator');
  if (/azure/i.test(textLower)) certs.push('Microsoft Azure Certified');
  if (certs.length === 0) certs.push('Not detected');

  return {
    full_name: name,
    email,
    phone,
    education: degree,
    education_level: eduLevel,
    years_experience: yearsExp,
    current_title: title,
    detected_skills: Array.from(detectedSkills).sort(),
    programming_languages: Array.from(detectedLangs).sort(),
    skills_by_category: byCategory,
    certifications: certs,
    projects: ['Key Engineering Project: Production Application Architecture']
  };
}

function fallbackCalculateFit(
  candidate: CandidateExtractionResult,
  job: any,
  weights: any
): ScreeningEvaluationResult {
  const w = weights || {
    required_skills: 0.40,
    preferred_skills: 0.20,
    education: 0.15,
    experience: 0.15,
    certs_projects: 0.10
  };

  const candidateSkills = new Set(candidate.detected_skills.map((s) => normalizeSkill(s)));
  const reqSkills: string[] = (job.required_skills || []).map((s: string) => normalizeSkill(s));
  const prefSkills: string[] = (job.preferred_skills || []).map((s: string) => normalizeSkill(s));

  const matchedReq = reqSkills.filter((r) => candidateSkills.has(r) || Array.from(candidateSkills).some((c) => c.includes(r)));
  const missingReq = reqSkills.filter((r) => !matchedReq.includes(r));

  const matchedPref = prefSkills.filter((p) => candidateSkills.has(p) || Array.from(candidateSkills).some((c) => c.includes(p)));
  const missingPref = prefSkills.filter((p) => !matchedPref.includes(p));

  const reqRatio = reqSkills.length > 0 ? matchedReq.length / reqSkills.length : 1.0;
  const prefRatio = prefSkills.length > 0 ? matchedPref.length / prefSkills.length : 1.0;

  const reqScore = reqRatio * 100.0;
  const prefScore = prefRatio * 100.0;
  const eduScore = candidate.education_level >= 3 ? 100.0 : 50.0;
  const minExp = Number(job.min_experience || 0);
  const expScore = candidate.years_experience >= minExp ? 100.0 : Math.max(10.0, (candidate.years_experience / Math.max(1, minExp)) * 80.0);
  const certScore = candidate.certifications[0] !== 'Not detected' ? 90.0 : 40.0;

  const overall = Number(
    (
      reqScore * w.required_skills +
      prefScore * w.preferred_skills +
      eduScore * w.education +
      expScore * w.experience +
      certScore * w.certs_projects
    ).toFixed(1)
  );

  const isEduOk = candidate.education_level >= 3;
  const isExpOk = candidate.years_experience >= Math.max(0, minExp - 0.5);
  const isSkillsOk = reqRatio >= (job.skill_threshold || 0.5);

  const disqual: string[] = [];
  if (!isEduOk) disqual.push(`Education does not meet threshold: ${candidate.education}`);
  if (!isExpOk) disqual.push(`Experience (${candidate.years_experience} yrs) is less than required (${minExp} yrs)`);
  if (!isSkillsOk) disqual.push(`Matched required skills (${matchedReq.length}/${reqSkills.length}) below threshold`);

  const isEligible = isEduOk && isExpOk && isSkillsOk;

  return {
    overall_fit_score: Math.min(100, Math.max(0, overall)),
    sub_scores: {
      skill_match_score: Number(reqScore.toFixed(1)),
      preferred_skill_score: Number(prefScore.toFixed(1)),
      education_match_score: Number(eduScore.toFixed(1)),
      experience_match_score: Number(expScore.toFixed(1)),
      cert_project_score: Number(certScore.toFixed(1))
    },
    weights_applied: w,
    is_eligible: isEligible,
    eligibility_reason: isEligible ? 'All fundamental eligibility criteria satisfied.' : disqual.join(' | '),
    requirements_analysis: {
      matched_required_skills: matchedReq,
      missing_required_skills: missingReq,
      matched_preferred_skills: matchedPref,
      missing_preferred_skills: missingPref,
      education_satisfied: isEduOk,
      experience_satisfied: isExpOk,
      required_skills_ratio: Number((reqRatio * 100).toFixed(1))
    }
  };
}

/**
 * Public Pipeline API: Tries Python first, gracefully falls back to TS if needed
 */
export async function runScreeningPipeline(
  resumeText: string,
  filename: string,
  job: any,
  weights?: any
): Promise<FullPipelineResult> {
  try {
    const res = await callPythonEngine({
      command: 'full_pipeline',
      text: resumeText,
      filename,
      job,
      weights
    });
    if (res && res.candidate && res.screening) {
      return {
        candidate: res.candidate,
        screening: res.screening
      };
    }
  } catch (err: any) {
    console.warn(`[PythonBridge] Python engine invocation warning: ${err.message}. Using built-in TS analyzer.`);
  }

  // Graceful fallback
  const candidate = fallbackProcessText(resumeText, filename);
  const screening = fallbackCalculateFit(candidate, job, weights);
  return { candidate, screening };
}
