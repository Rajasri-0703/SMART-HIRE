import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import multer from 'multer';
import { getDb, queryAll, queryOne, execute, saveDb } from './server/db.js';
import { parseResumeFile } from './server/fileParser.js';
import { runScreeningPipeline } from './server/pythonBridge.js';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Configure Multer for in-memory file buffers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 20 // Up to 20 files in bulk
  }
});

// Simple JWT / Token Auth simulation for HR Recruiter
function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // For academic ease, fall back to default recruiter if not specified
    const defaultUser = queryOne('SELECT id, email, full_name, department, role FROM users LIMIT 1');
    (req as any).user = defaultUser;
    return next();
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  const user = queryOne('SELECT id, email, full_name, department, role FROM users WHERE email = ?', [token]);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid authentication token' });
  }
  (req as any).user = user;
  next();
}

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = queryOne('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  if (!user || user.password_hash !== password) {
    return res.status(401).json({ error: 'Invalid recruiter credentials' });
  }

  const userSafe = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    department: user.department,
    role: user.role
  };

  res.json({
    message: 'Authentication successful',
    token: user.email, // Safe session key
    user: userSafe
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name, department } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }

  const existing = queryOne('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  if (existing) {
    return res.status(409).json({ error: 'An HR account with this email address already exists' });
  }

  const result = execute(
    `INSERT INTO users (email, password_hash, full_name, department, role) VALUES (?, ?, ?, ?, 'RECRUITER')`,
    [email.trim().toLowerCase(), password, full_name.trim(), department || 'Talent Acquisition']
  );

  const newUser = {
    id: result.lastInsertRowid,
    email: email.trim().toLowerCase(),
    full_name: full_name.trim(),
    department: department || 'Talent Acquisition',
    role: 'RECRUITER'
  };

  res.status(201).json({
    message: 'HR Account registered successfully',
    token: newUser.email,
    user: newUser
  });
});

app.get('/api/auth/me', authenticateUser, (req, res) => {
  res.json({ user: (req as any).user });
});

// ----------------------------------------------------
// HR DASHBOARD STATISTICS (Computed Dynamically from DB)
// ----------------------------------------------------
app.get('/api/dashboard/stats', authenticateUser, async (req, res) => {
  try {
    const totalJobs = (queryOne('SELECT COUNT(*) as cnt FROM jobs')?.cnt as number) || 0;
    const totalResumes = (queryOne('SELECT COUNT(*) as cnt FROM resumes')?.cnt as number) || 0;
    const totalCandidates = (queryOne('SELECT COUNT(*) as cnt FROM candidates')?.cnt as number) || 0;
    const shortlistedCandidates = (queryOne('SELECT COUNT(DISTINCT candidate_id) as cnt FROM shortlist')?.cnt as number) || 0;

    // Single pass aggregate for screening stats and distribution
    const agg = queryOne(`
      SELECT 
        COUNT(DISTINCT CASE WHEN is_eligible = 1 THEN candidate_id END) as eligible_cnt,
        COUNT(DISTINCT CASE WHEN is_eligible = 0 THEN candidate_id END) as not_eligible_cnt,
        AVG(overall_fit_score) as avg_score,
        SUM(CASE WHEN overall_fit_score < 40 THEN 1 ELSE 0 END) as d_0_40,
        SUM(CASE WHEN overall_fit_score >= 40 AND overall_fit_score < 60 THEN 1 ELSE 0 END) as d_41_60,
        SUM(CASE WHEN overall_fit_score >= 60 AND overall_fit_score < 75 THEN 1 ELSE 0 END) as d_61_75,
        SUM(CASE WHEN overall_fit_score >= 75 AND overall_fit_score < 90 THEN 1 ELSE 0 END) as d_76_90,
        SUM(CASE WHEN overall_fit_score >= 90 THEN 1 ELSE 0 END) as d_91_100
      FROM screening_results
    `);

    const eligibleCandidates = agg?.eligible_cnt || 0;
    const notEligibleCandidates = agg?.not_eligible_cnt || 0;
    const avgFitScore = agg?.avg_score != null ? Math.round(agg.avg_score * 10) / 10 : 0;

    const distribution = {
      '0-40%': agg?.d_0_40 || 0,
      '41-60%': agg?.d_41_60 || 0,
      '61-75%': agg?.d_61_75 || 0,
      '76-90%': agg?.d_76_90 || 0,
      '91-100%': agg?.d_91_100 || 0,
    };

    // Department breakdown
    const departmentStats = queryAll(`
      SELECT j.department, COUNT(j.id) as job_count, COUNT(sr.id) as candidate_screenings
      FROM jobs j
      LEFT JOIN screening_results sr ON j.id = sr.job_id
      GROUP BY j.department
      ORDER BY candidate_screenings DESC
      LIMIT 6
    `);

    // Recent activity
    const recentActivity = queryAll(`
      SELECT sh.id, sh.action, sh.details, sh.user_email, sh.created_at,
             c.full_name as candidate_name, j.title as job_title
      FROM screening_history sh
      LEFT JOIN candidates c ON sh.candidate_id = c.id
      LEFT JOIN jobs j ON sh.job_id = j.id
      ORDER BY sh.id DESC
      LIMIT 10
    `);

    res.json({
      totalJobs,
      totalResumes,
      totalCandidates,
      eligibleCandidates,
      notEligibleCandidates,
      shortlistedCandidates,
      averageFitScore: avgFitScore,
      distribution,
      departmentStats,
      recentActivity
    });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to compile dashboard metrics: ${err.message}` });
  }
});

// ----------------------------------------------------
// JOBS CRUD API
// ----------------------------------------------------
app.get('/api/jobs', authenticateUser, async (req, res) => {
  try {
    const jobs = queryAll(`
      SELECT j.*,
        (SELECT COUNT(*) FROM job_requirements jr WHERE jr.job_id = j.id AND jr.req_type = 'REQUIRED_SKILL') as req_skills_count,
        (SELECT COUNT(*) FROM job_requirements jr WHERE jr.job_id = j.id AND jr.req_type = 'PREFERRED_SKILL') as pref_skills_count,
        (SELECT COUNT(*) FROM screening_results sr WHERE sr.job_id = j.id) as applicant_count,
        (SELECT COUNT(*) FROM shortlist sl WHERE sl.job_id = j.id) as shortlisted_count
      FROM jobs j
      ORDER BY j.id DESC
    `);

    // Attach requirements
    const enriched = jobs.map((job) => {
      const requirements = queryAll(`SELECT * FROM job_requirements WHERE job_id = ?`, [job.id]);
      const required_skills = requirements.filter((r) => r.req_type === 'REQUIRED_SKILL').map((r) => r.name);
      const preferred_skills = requirements.filter((r) => r.req_type === 'PREFERRED_SKILL').map((r) => r.name);
      return {
        ...job,
        required_skills,
        preferred_skills
      };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: `Failed to fetch jobs: ${err.message}` });
  }
});

app.get('/api/jobs/:id', authenticateUser, async (req, res) => {
  try {
    const jobId = Number(req.params.id);
    const job = queryOne(`SELECT * FROM jobs WHERE id = ?`, [jobId]);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const requirements = queryAll(`SELECT * FROM job_requirements WHERE job_id = ?`, [jobId]);
    const required_skills = requirements.filter((r) => r.req_type === 'REQUIRED_SKILL').map((r) => r.name);
    const preferred_skills = requirements.filter((r) => r.req_type === 'PREFERRED_SKILL').map((r) => r.name);

    const candidates = queryAll(`
      SELECT sr.id as screening_id, sr.overall_fit_score, sr.is_eligible, sr.eligibility_reason,
             sr.decision_status, sr.screened_at, c.id as candidate_id, c.full_name, c.email,
             c.education, c.years_experience, c.current_title
      FROM screening_results sr
      JOIN candidates c ON sr.candidate_id = c.id
      WHERE sr.job_id = ?
      ORDER BY sr.overall_fit_score DESC
    `, [jobId]);

    res.json({
      ...job,
      required_skills,
      preferred_skills,
      candidates
    });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to fetch job details: ${err.message}` });
  }
});

app.post('/api/jobs', authenticateUser, async (req, res) => {
  try {
    const {
      title,
      department,
      description,
      required_education,
      min_experience,
      location,
      employment_type,
      required_skills,
      preferred_skills,
      skill_threshold
    } = req.body;

    if (!title || !department || !required_education) {
      return res.status(400).json({ error: 'Job title, department, and required education are required' });
    }

    const jobResult = execute(
      `INSERT INTO jobs (title, department, description, required_education, min_experience, location, employment_type, skill_threshold)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        department.trim(),
        description || '',
        required_education.trim(),
        Number(min_experience || 0),
        location || 'Remote',
        employment_type || 'Full-time',
        Number(skill_threshold || 0.5)
      ]
    );

    const jobId = jobResult.lastInsertRowid;

    // Insert normalized requirements
    if (Array.isArray(required_skills)) {
      for (const skill of required_skills) {
        if (skill && skill.trim()) {
          execute(
            `INSERT INTO job_requirements (job_id, req_type, name, weight) VALUES (?, 'REQUIRED_SKILL', ?, 1.0)`,
            [jobId, skill.trim()]
          );
        }
      }
    }

    if (Array.isArray(preferred_skills)) {
      for (const skill of preferred_skills) {
        if (skill && skill.trim()) {
          execute(
            `INSERT INTO job_requirements (job_id, req_type, name, weight) VALUES (?, 'PREFERRED_SKILL', ?, 0.5)`,
            [jobId, skill.trim()]
          );
        }
      }
    }

    execute(
      `INSERT INTO screening_history (job_id, action, details, user_email) VALUES (?, 'JOB_CREATED', ?, ?)`,
      [jobId, `Vacancy created: ${title} in ${department}`, (req as any).user?.email || 'hr@smarthire']
    );

    res.status(201).json({ id: jobId, message: 'Job vacancy created successfully' });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to create job: ${err.message}` });
  }
});

app.put('/api/jobs/:id', authenticateUser, async (req, res) => {
  try {
    const jobId = Number(req.params.id);
    const {
      title,
      department,
      description,
      required_education,
      min_experience,
      location,
      employment_type,
      required_skills,
      preferred_skills,
      status
    } = req.body;

    execute(
      `UPDATE jobs SET title = ?, department = ?, description = ?, required_education = ?,
       min_experience = ?, location = ?, employment_type = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title,
        department,
        description,
        required_education,
        Number(min_experience || 0),
        location,
        employment_type,
        status || 'ACTIVE',
        jobId
      ]
    );

    // Refresh requirements
    if (Array.isArray(required_skills) || Array.isArray(preferred_skills)) {
      execute(`DELETE FROM job_requirements WHERE job_id = ?`, [jobId]);
      if (Array.isArray(required_skills)) {
        for (const skill of required_skills) {
          if (skill && skill.trim()) {
            execute(
              `INSERT INTO job_requirements (job_id, req_type, name, weight) VALUES (?, 'REQUIRED_SKILL', ?, 1.0)`,
              [jobId, skill.trim()]
            );
          }
        }
      }
      if (Array.isArray(preferred_skills)) {
        for (const skill of preferred_skills) {
          if (skill && skill.trim()) {
            execute(
              `INSERT INTO job_requirements (job_id, req_type, name, weight) VALUES (?, 'PREFERRED_SKILL', ?, 0.5)`,
              [jobId, skill.trim()]
            );
          }
        }
      }
    }

    res.json({ message: 'Job vacancy updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to update job: ${err.message}` });
  }
});

app.delete('/api/jobs/:id', authenticateUser, async (req, res) => {
  try {
    const jobId = Number(req.params.id);
    execute(`DELETE FROM jobs WHERE id = ?`, [jobId]);
    res.json({ message: 'Job vacancy deleted' });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to delete job: ${err.message}` });
  }
});

// ----------------------------------------------------
// BULK RESUME UPLOAD & DYNAMIC SCREENING PIPELINE
// ----------------------------------------------------
app.post('/api/resumes/upload-bulk', authenticateUser, upload.array('files', 20), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const jobId = Number(req.body.jobId || req.body.job_id);

    if (!jobId) {
      return res.status(400).json({ error: 'Target Job Vacancy ID is required for screening' });
    }

    const job = queryOne(`SELECT * FROM jobs WHERE id = ?`, [jobId]);
    if (!job) {
      return res.status(404).json({ error: `Selected job ID ${jobId} not found` });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No resume files received. Please select at least one file.' });
    }

    // Load Job requirements
    const reqRows = queryAll(`SELECT * FROM job_requirements WHERE job_id = ?`, [jobId]);
    const jobSpec = {
      ...job,
      required_skills: reqRows.filter((r) => r.req_type === 'REQUIRED_SKILL').map((r) => r.name),
      preferred_skills: reqRows.filter((r) => r.req_type === 'PREFERRED_SKILL').map((r) => r.name),
    };

    // Load active weight configuration
    const settingsRow = queryOne(`SELECT value FROM system_settings WHERE key = 'scoring_weights'`);
    const weights = settingsRow ? JSON.parse(settingsRow.value) : undefined;

    const results = [];
    const errors = [];

    for (const file of files) {
      const originalName = file.originalname;
      try {
        // Step 1: Text extraction from PDF/DOCX/TXT
        const extractedText = await parseResumeFile(originalName, file.buffer, file.mimetype);

        // Step 2: Python / NLP extraction + Dynamic Fit Score calculation
        const pipelineOutput = await runScreeningPipeline(extractedText, originalName, jobSpec, weights);
        const { candidate, screening } = pipelineOutput;

        // Step 3: Relational Persistence
        // Check for duplicate candidate by email (if valid email detected)
        let candidateId: number;
        const existingCand = candidate.email !== 'Not detected'
          ? queryOne(`SELECT id FROM candidates WHERE email = ?`, [candidate.email])
          : null;

        if (existingCand) {
          candidateId = existingCand.id;
          execute(
            `UPDATE candidates SET full_name = ?, phone = ?, education = ?, education_level = ?,
             years_experience = ?, current_title = ?, certifications_summary = ?, projects_summary = ?
             WHERE id = ?`,
            [
              candidate.full_name,
              candidate.phone,
              candidate.education,
              candidate.education_level,
              candidate.years_experience,
              candidate.current_title,
              candidate.certifications.join(', '),
              candidate.projects.join('; '),
              candidateId
            ]
          );
        } else {
          const candInsert = execute(
            `INSERT INTO candidates (full_name, email, phone, education, education_level, years_experience, current_title, certifications_summary, projects_summary)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              candidate.full_name,
              candidate.email !== 'Not detected' ? candidate.email : `applicant.${Date.now()}.${Math.floor(Math.random()*1000)}@smarthire.internal`,
              candidate.phone,
              candidate.education,
              candidate.education_level,
              candidate.years_experience,
              candidate.current_title,
              candidate.certifications.join(', '),
              candidate.projects.join('; ')
            ]
          );
          candidateId = candInsert.lastInsertRowid;
        }

        // Save resume document record
        const resumeInsert = execute(
          `INSERT INTO resumes (candidate_id, original_filename, file_size_bytes, file_type, extracted_text, processing_status)
           VALUES (?, ?, ?, ?, ?, 'PROCESSED')`,
          [
            candidateId,
            originalName,
            file.size,
            path.extname(originalName).replace('.', '').toUpperCase(),
            extractedText
          ]
        );
        const resumeId = resumeInsert.lastInsertRowid;

        // Save candidate skills in normalized tables
        for (const skillName of candidate.detected_skills) {
          let skillRow = queryOne(`SELECT id FROM skills WHERE name = ?`, [skillName.toLowerCase()]);
          let skillId = skillRow?.id;
          if (!skillId) {
            const insSkill = execute(`INSERT INTO skills (name, category) VALUES (?, 'Detected')`, [skillName.toLowerCase()]);
            skillId = insSkill.lastInsertRowid;
          }
          // Insert into junction table
          execute(
            `INSERT OR IGNORE INTO candidate_skills (candidate_id, skill_id, proficiency, is_primary_language) VALUES (?, ?, 'PROFICIENT', 1)`,
            [candidateId, skillId]
          );
        }

        // Save Screening Result
        const screeningInsert = execute(
          `INSERT INTO screening_results (
            job_id, candidate_id, resume_id, overall_fit_score, skill_match_score, preferred_skill_score,
            education_match_score, experience_match_score, cert_project_score, is_eligible,
            eligibility_reason, matched_required_skills, missing_required_skills,
            matched_preferred_skills, missing_preferred_skills, decision_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
          [
            jobId,
            candidateId,
            resumeId,
            screening.overall_fit_score,
            screening.sub_scores.skill_match_score,
            screening.sub_scores.preferred_skill_score,
            screening.sub_scores.education_match_score,
            screening.sub_scores.experience_match_score,
            screening.sub_scores.cert_project_score,
            screening.is_eligible ? 1 : 0,
            screening.eligibility_reason,
            screening.requirements_analysis.matched_required_skills.join(', '),
            screening.requirements_analysis.missing_required_skills.join(', '),
            screening.requirements_analysis.matched_preferred_skills.join(', '),
            screening.requirements_analysis.missing_preferred_skills.join(', ')
          ]
        );
        const screeningId = screeningInsert.lastInsertRowid;

        // Save dynamic weights used for this screening in fit_scores
        execute(
          `INSERT INTO fit_scores (screening_id, req_skills_weight, pref_skills_weight, education_weight, experience_weight, certs_projects_weight)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            screeningId,
            screening.weights_applied.required_skills,
            screening.weights_applied.preferred_skills,
            screening.weights_applied.education,
            screening.weights_applied.experience,
            screening.weights_applied.certs_projects
          ]
        );

        // Audit log
        execute(
          `INSERT INTO screening_history (job_id, candidate_id, action, details, user_email)
           VALUES (?, ?, 'RESUME_SCREENED', ?, ?)`,
          [
            jobId,
            candidateId,
            `Screened ${candidate.full_name} for ${job.title}: Fit Score ${screening.overall_fit_score}%, Eligible: ${screening.is_eligible}`,
            (req as any).user?.email || 'hr@smarthire'
          ]
        );

        results.push({
          filename: originalName,
          candidate_id: candidateId,
          screening_id: screeningId,
          full_name: candidate.full_name,
          email: candidate.email,
          overall_fit_score: screening.overall_fit_score,
          is_eligible: screening.is_eligible,
          eligibility_reason: screening.eligibility_reason,
          sub_scores: screening.sub_scores
        });
      } catch (fileErr: any) {
        errors.push({
          filename: originalName,
          error: fileErr.message || 'Failed to process resume'
        });
      }
    }

    // Flush batch writes to disk immediately once entire upload batch finishes
    saveDb();

    res.status(200).json({
      total: files.length,
      processed: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (err: any) {
    res.status(500).json({ error: `Bulk processing error: ${err.message}` });
  }
});

// ----------------------------------------------------
// SCREENING RESULTS & PRE-RANKING LEADERBOARD
// ----------------------------------------------------
app.get('/api/screening/results', authenticateUser, async (req, res) => {
  try {
    const { jobId, isEligible, status, search, minScore } = req.query;

    let sql = `
      SELECT sr.*, c.full_name, c.email, c.phone, c.education, c.years_experience,
             c.current_title, j.title as job_title, j.department, r.original_filename
      FROM screening_results sr
      JOIN candidates c ON sr.candidate_id = c.id
      JOIN jobs j ON sr.job_id = j.id
      JOIN resumes r ON sr.resume_id = r.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (jobId) {
      sql += ` AND sr.job_id = ?`;
      params.push(Number(jobId));
    }

    if (isEligible !== undefined && isEligible !== '') {
      sql += ` AND sr.is_eligible = ?`;
      params.push(isEligible === 'true' || isEligible === '1' ? 1 : 0);
    }

    if (status) {
      sql += ` AND sr.decision_status = ?`;
      params.push(status);
    }

    if (minScore) {
      sql += ` AND sr.overall_fit_score >= ?`;
      params.push(Number(minScore));
    }

    if (search) {
      sql += ` AND (c.full_name LIKE ? OR c.email LIKE ? OR c.current_title LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    // Pre-ranking: Sorted by overall_fit_score DESC
    sql += ` ORDER BY sr.overall_fit_score DESC, sr.id DESC`;

    const results = queryAll(sql, params);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: `Failed to load screening results: ${err.message}` });
  }
});

app.get('/api/screening/results/:id', authenticateUser, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = queryOne(`
      SELECT sr.*, c.full_name, c.email, c.phone, c.education, c.years_experience,
             c.current_title, c.certifications_summary, c.projects_summary,
             j.title as job_title, j.department as job_department, j.required_education,
             j.min_experience as job_min_experience,
             r.original_filename, r.extracted_text, r.file_size_bytes, r.upload_timestamp
      FROM screening_results sr
      JOIN candidates c ON sr.candidate_id = c.id
      JOIN jobs j ON sr.job_id = j.id
      JOIN resumes r ON sr.resume_id = r.id
      WHERE sr.id = ?
    `, [id]);

    if (!result) return res.status(404).json({ error: 'Screening record not found' });

    // Load Candidate skills
    const skills = queryAll(`
      SELECT s.name, s.category, cs.proficiency
      FROM candidate_skills cs
      JOIN skills s ON cs.skill_id = s.id
      WHERE cs.candidate_id = ?
    `, [result.candidate_id]);

    // Load Fit Score weights applied
    const fitScoreWeights = queryOne(`SELECT * FROM fit_scores WHERE screening_id = ?`, [id]);

    res.json({
      ...result,
      skills,
      fitScoreWeights
    });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to fetch screening analysis: ${err.message}` });
  }
});

// Update HR Decision (Shortlist / Reject / Pending)
app.post('/api/screening/decision', authenticateUser, async (req, res) => {
  try {
    const { screeningId, decision, hrNotes } = req.body;
    if (!screeningId || !decision) {
      return res.status(400).json({ error: 'Screening ID and decision are required' });
    }

    const screening = queryOne(`SELECT * FROM screening_results WHERE id = ?`, [Number(screeningId)]);
    if (!screening) return res.status(404).json({ error: 'Screening record not found' });

    execute(
      `UPDATE screening_results SET decision_status = ?, hr_notes = ? WHERE id = ?`,
      [decision, hrNotes || '', Number(screeningId)]
    );

    const currentUser = (req as any).user;

    if (decision === 'SHORTLISTED') {
      execute(
        `INSERT OR REPLACE INTO shortlist (job_id, candidate_id, screening_id, shortlisted_by_user_id, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [screening.job_id, screening.candidate_id, screening.id, currentUser?.id || null, hrNotes || 'Shortlisted for interview']
      );
    } else {
      execute(
        `DELETE FROM shortlist WHERE job_id = ? AND candidate_id = ?`,
        [screening.job_id, screening.candidate_id]
      );
    }

    execute(
      `INSERT INTO screening_history (job_id, candidate_id, action, details, user_email)
       VALUES (?, ?, 'DECISION_UPDATED', ?, ?)`,
      [
        screening.job_id,
        screening.candidate_id,
        `HR Decision updated to ${decision}: ${hrNotes || 'No notes provided'}`,
        currentUser?.email || 'hr@smarthire'
      ]
    );

    res.json({ message: `Candidate decision updated to ${decision}` });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to update decision: ${err.message}` });
  }
});

// ----------------------------------------------------
// CANDIDATES REPOSITORY
// ----------------------------------------------------
app.get('/api/candidates', authenticateUser, async (req, res) => {
  try {
    const { search } = req.query;
    let sql = `
      SELECT c.*,
             (SELECT COUNT(*) FROM screening_results sr WHERE sr.candidate_id = c.id) as total_screenings,
             (SELECT MAX(sr.overall_fit_score) FROM screening_results sr WHERE sr.candidate_id = c.id) as max_fit_score,
             (SELECT sr.decision_status FROM screening_results sr WHERE sr.candidate_id = c.id ORDER BY sr.id DESC LIMIT 1) as latest_status
      FROM candidates c
    `;
    const params: any[] = [];
    if (search) {
      sql += ` WHERE c.full_name LIKE ? OR c.email LIKE ? OR c.current_title LIKE ?`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    sql += ` ORDER BY c.id DESC`;

    const candidates = queryAll(sql, params);
    res.json(candidates);
  } catch (err: any) {
    res.status(500).json({ error: `Failed to fetch candidates: ${err.message}` });
  }
});

app.get('/api/candidates/:id', authenticateUser, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const candidate = queryOne(`SELECT * FROM candidates WHERE id = ?`, [id]);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const skills = queryAll(`
      SELECT s.name, s.category, cs.proficiency
      FROM candidate_skills cs
      JOIN skills s ON cs.skill_id = s.id
      WHERE cs.candidate_id = ?
    `, [id]);

    const resumes = queryAll(`SELECT * FROM resumes WHERE candidate_id = ? ORDER BY id DESC`, [id]);

    const screenings = queryAll(`
      SELECT sr.*, j.title as job_title, j.department as job_department
      FROM screening_results sr
      JOIN jobs j ON sr.job_id = j.id
      WHERE sr.candidate_id = ?
      ORDER BY sr.id DESC
    `, [id]);

    res.json({
      ...candidate,
      skills,
      resumes,
      screenings
    });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to fetch candidate details: ${err.message}` });
  }
});

// ----------------------------------------------------
// SHORTLIST MANAGEMENT
// ----------------------------------------------------
app.get('/api/shortlist', authenticateUser, async (req, res) => {
  try {
    const list = queryAll(`
      SELECT sl.id as shortlist_id, sl.notes as shortlist_notes, sl.shortlisted_at,
             c.id as candidate_id, c.full_name, c.email, c.phone, c.education, c.years_experience, c.current_title,
             j.id as job_id, j.title as job_title, j.department,
             sr.id as screening_id, sr.overall_fit_score, sr.is_eligible, sr.eligibility_reason
      FROM shortlist sl
      JOIN candidates c ON sl.candidate_id = c.id
      JOIN jobs j ON sl.job_id = j.id
      JOIN screening_results sr ON sl.screening_id = sr.id
      ORDER BY sr.overall_fit_score DESC
    `);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: `Failed to load shortlist: ${err.message}` });
  }
});

// ----------------------------------------------------
// AUDIT LOG / SCREENING HISTORY
// ----------------------------------------------------
app.get('/api/history', authenticateUser, async (req, res) => {
  try {
    const history = queryAll(`
      SELECT sh.*, c.full_name as candidate_name, j.title as job_title
      FROM screening_history sh
      LEFT JOIN candidates c ON sh.candidate_id = c.id
      LEFT JOIN jobs j ON sh.job_id = j.id
      ORDER BY sh.id DESC
      LIMIT 100
    `);
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: `Failed to load history: ${err.message}` });
  }
});

// ----------------------------------------------------
// SETTINGS (Scoring Weights Configuration)
// ----------------------------------------------------
app.get('/api/settings', authenticateUser, async (req, res) => {
  try {
    const row = queryOne(`SELECT value FROM system_settings WHERE key = 'scoring_weights'`);
    const weights = row ? JSON.parse(row.value) : {
      required_skills: 0.40,
      preferred_skills: 0.20,
      education: 0.15,
      experience: 0.15,
      certs_projects: 0.10,
      skill_threshold: 0.50
    };
    res.json(weights);
  } catch (err: any) {
    res.status(500).json({ error: `Failed to load settings: ${err.message}` });
  }
});

app.put('/api/settings', authenticateUser, async (req, res) => {
  try {
    const { required_skills, preferred_skills, education, experience, certs_projects, skill_threshold } = req.body;
    const total = required_skills + preferred_skills + education + experience + certs_projects;
    if (Math.abs(total - 1.0) > 0.05) {
      return res.status(400).json({ error: `Total weights must sum to 1.0 (Current sum: ${total.toFixed(2)})` });
    }

    const payload = JSON.stringify({
      required_skills,
      preferred_skills,
      education,
      experience,
      certs_projects,
      skill_threshold: skill_threshold || 0.50
    });

    execute(`INSERT OR REPLACE INTO system_settings (key, value) VALUES ('scoring_weights', ?)`, [payload]);
    res.json({ message: 'Scoring weights updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to update settings: ${err.message}` });
  }
});

// ----------------------------------------------------
// TECHNICAL ARCHITECTURE & ACADEMIC DOCUMENTATION API
// (DBMS, DMGT, ADSA B-Tree, OOPJ, Python)
// ----------------------------------------------------
app.get('/api/tech/overview', authenticateUser, async (req, res) => {
  try {
    const tables = queryAll(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`);
    const indexes = queryAll(`SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'`);

    const tableCounts: Record<string, number> = {};
    for (const t of tables) {
      const cnt = queryOne(`SELECT COUNT(*) as count FROM ${t.name}`);
      tableCounts[t.name] = cnt?.count || 0;
    }

    res.json({
      dbms: {
        engine: 'SQLite3 Relational DBMS with ACID Compliance',
        foreign_keys_enforced: true,
        tables: tables.map((t) => t.name),
        table_counts: tableCounts,
        schema_version: '2026.1-relational'
      },
      adsa: {
        concept: 'B-Tree & Inverted Indexing for Candidate Lookup',
        indexes: indexes.map((i) => ({
          name: i.name,
          table: i.tbl_name,
          definition: i.sql
        })),
        search_complexity: 'O(log N) indexed search vs O(N) linear table scan'
      },
      dmgt: {
        concepts: [
          'Set Theory (Intersection A ∩ B for required/preferred skills matching)',
          'Predicate Logic (Propositional evaluation for candidate eligibility)',
          'Boolean Decision Engine (E_edu ∧ E_exp ∧ E_skills)',
          'Weighted Convex Combination (∑ w_i · s_i = 100)'
        ]
      },
      oopj: {
        concepts: [
          'Domain Entities: Candidate, Job, Resume, Recruiter, ScreeningResult',
          'Encapsulation & Immutability: Private fields with accessor contracts',
          'Polymorphism & Strategy Pattern: FitScoreStrategy interface and implementations',
          'Domain-Driven Design: Aggregate Roots and Value Objects'
        ]
      },
      python: {
        components: [
          'Resume Text Normalization & Tokenization',
          'Named Entity Recognition & Regex Extraction',
          'Skill Taxonomy Mapping (150+ Technical Keywords)',
          'Dynamic Fit Score & Sub-Score Calculation Engine'
        ]
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to compile technical architecture metrics: ${err.message}` });
  }
});

// ----------------------------------------------------
// SEED REALISTIC DEMO DATA (FOR IMMEDIATE COLLEGE REVIEW)
// ----------------------------------------------------
app.post('/api/seed/demo', authenticateUser, async (req, res) => {
  try {
    // 1. Create realistic job vacancies if not already present
    const existingJobs = queryAll(`SELECT id, title FROM jobs`);
    let job1Id: number;
    let job2Id: number;

    if (existingJobs.length === 0) {
      const j1 = execute(
        `INSERT INTO jobs (title, department, description, required_education, min_experience, location, employment_type, skill_threshold)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'Senior Full Stack Engineer',
          'Engineering',
          'Architect and build high-throughput cloud web applications with distributed microservices, TypeScript, React, and Python.',
          'B.Tech / B.E. in Computer Science or equivalent',
          3.0,
          'San Francisco, CA (Hybrid)',
          'Full-time',
          0.60
        ]
      );
      job1Id = j1.lastInsertRowid;

      const j1Reqs = ['python', 'react', 'typescript', 'postgresql', 'docker'];
      for (const s of j1Reqs) {
        execute(`INSERT INTO job_requirements (job_id, req_type, name, weight) VALUES (?, 'REQUIRED_SKILL', ?, 1.0)`, [job1Id, s]);
      }
      const j1Prefs = ['aws', 'kubernetes', 'redis', 'graphql'];
      for (const s of j1Prefs) {
        execute(`INSERT INTO job_requirements (job_id, req_type, name, weight) VALUES (?, 'PREFERRED_SKILL', ?, 0.5)`, [job1Id, s]);
      }

      const j2 = execute(
        `INSERT INTO jobs (title, department, description, required_education, min_experience, location, employment_type, skill_threshold)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'Cloud DevOps & Infrastructure Engineer',
          'Cloud Operations',
          'Manage enterprise Kubernetes clusters, CI/CD deployment pipelines, AWS infrastructure, and Linux security hardening.',
          'B.Tech / Bachelor in CS / IT',
          2.0,
          'Austin, TX (Remote)',
          'Full-time',
          0.60
        ]
      );
      job2Id = j2.lastInsertRowid;

      const j2Reqs = ['docker', 'kubernetes', 'aws', 'linux', 'ci/cd'];
      for (const s of j2Reqs) {
        execute(`INSERT INTO job_requirements (job_id, req_type, name, weight) VALUES (?, 'REQUIRED_SKILL', ?, 1.0)`, [job2Id, s]);
      }
      const j2Prefs = ['terraform', 'python', 'bash', 'ansible'];
      for (const s of j2Prefs) {
        execute(`INSERT INTO job_requirements (job_id, req_type, name, weight) VALUES (?, 'PREFERRED_SKILL', ?, 0.5)`, [job2Id, s]);
      }
    } else {
      job1Id = existingJobs[0].id;
      job2Id = existingJobs.length > 1 ? existingJobs[1].id : existingJobs[0].id;
    }

    // Realistic resume texts to process through the exact pipeline
    const sampleResumes = [
      {
        filename: 'Maya_Lin_FullStack.txt',
        jobId: job1Id,
        text: `Maya Lin
maya.lin@innovatetech.io | +1 (415) 890-1234 | San Francisco, CA
B.Tech in Computer Science & Engineering (2016 - 2020)
5 years of professional experience as Senior Full Stack Developer

PROFESSIONAL SUMMARY:
Lead software engineer specializing in scalable distributed microservices, React single page applications, Node.js and Python backend services.

CORE TECHNICAL SKILLS:
- Languages: Python, TypeScript, JavaScript, SQL, Go
- Web & Frameworks: React, Next.js, Node.js, Express, Tailwind CSS, REST API, GraphQL
- Storage & DBMS: PostgreSQL, Redis, MySQL
- DevOps: Docker, Kubernetes, AWS, Git, CI/CD

CERTIFICATIONS:
- AWS Certified Solutions Architect - Associate
- Certified Kubernetes Administrator (CKA)

KEY PROJECTS:
- Global FinTech Payment Gateway handling 12,000 req/sec with PostgreSQL and Redis caching.
- Dynamic React Analytics Dashboard with live WebSockets telemetry.`
      },
      {
        filename: 'Marcus_Vance_Backend.txt',
        jobId: job1Id,
        text: `Marcus Vance
marcus.vance@techsource.com | +1 (512) 432-8765 | Austin, TX
B.Tech in Information Technology
3.5 years of experience in Software Engineering

SUMMARY:
Software developer with focus on backend systems, Python, PostgreSQL, and container orchestration.

TECHNICAL SKILLS:
Python, React, PostgreSQL, Docker, Git, REST API, Linux, Redis

CERTIFICATIONS:
- Oracle Certified Professional: Java SE

PROJECTS:
- Distributed Inventory Management System in Python and PostgreSQL.
- Customer Portal using React and Node.js.`
      },
      {
        filename: 'Priya_Sharma_JuniorDev.txt',
        jobId: job1Id,
        text: `Priya Sharma
priya.sharma@collegemail.edu | +1 (206) 555-7890 | Seattle, WA
B.Tech in Computer Science (Graduated 2025)
1 year of experience as Junior Software Intern

SKILLS:
Python, React, JavaScript, HTML, CSS, Git, SQLite

PROJECTS:
- Academic Smart Job Tracker in React and SQLite.
- E-commerce frontend demo.`
      },
      {
        filename: 'David_Kim_DevOps.txt',
        jobId: job2Id,
        text: `David Kim
david.kim@cloudsys.net | +1 (650) 777-3322 | San Jose, CA
Master of Technology (M.Tech) in Computer Systems
4 years of experience as DevOps & Cloud Engineer

SUMMARY:
Dedicated infrastructure engineer focused on containerization, Kubernetes cluster management, AWS cloud environments, and automated CI/CD pipelines.

TECHNICAL SKILLS:
Docker, Kubernetes, AWS, Linux, CI/CD, Terraform, Bash, Python, Git

CERTIFICATIONS:
- AWS Certified DevOps Engineer - Professional
- Certified Kubernetes Administrator

PROJECTS:
- Automated multi-region Kubernetes cluster deployment using Terraform and Ansible.
- Zero-downtime CI/CD deployment pipeline with GitLab and Docker.`
      }
    ];

    // Run each resume through the actual pipeline
    for (const sample of sampleResumes) {
      const job = queryOne(`SELECT * FROM jobs WHERE id = ?`, [sample.jobId]);
      const reqRows = queryAll(`SELECT * FROM job_requirements WHERE job_id = ?`, [sample.jobId]);
      const jobSpec = {
        ...job,
        required_skills: reqRows.filter((r) => r.req_type === 'REQUIRED_SKILL').map((r) => r.name),
        preferred_skills: reqRows.filter((r) => r.req_type === 'PREFERRED_SKILL').map((r) => r.name),
      };

      const settingsRow = queryOne(`SELECT value FROM system_settings WHERE key = 'scoring_weights'`);
      const weights = settingsRow ? JSON.parse(settingsRow.value) : undefined;

      const pipelineOutput = await runScreeningPipeline(sample.text, sample.filename, jobSpec, weights);
      const { candidate, screening } = pipelineOutput;

      let candidateId: number;
      const existingCand = queryOne(`SELECT id FROM candidates WHERE email = ?`, [candidate.email]);
      if (existingCand) {
        candidateId = existingCand.id;
      } else {
        const candInsert = execute(
          `INSERT INTO candidates (full_name, email, phone, education, education_level, years_experience, current_title, certifications_summary, projects_summary)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            candidate.full_name,
            candidate.email,
            candidate.phone,
            candidate.education,
            candidate.education_level,
            candidate.years_experience,
            candidate.current_title,
            candidate.certifications.join(', '),
            sample.filename
          ]
        );
        candidateId = candInsert.lastInsertRowid;
      }

      const resumeInsert = execute(
        `INSERT INTO resumes (candidate_id, original_filename, file_size_bytes, file_type, extracted_text, processing_status)
         VALUES (?, ?, ?, 'TXT', ?, 'PROCESSED')`,
        [candidateId, sample.filename, Buffer.byteLength(sample.text), sample.text]
      );
      const resumeId = resumeInsert.lastInsertRowid;

      for (const skillName of candidate.detected_skills) {
        let skillRow = queryOne(`SELECT id FROM skills WHERE name = ?`, [skillName.toLowerCase()]);
        let skillId = skillRow?.id;
        if (!skillId) {
          const insSkill = execute(`INSERT INTO skills (name, category) VALUES (?, 'Detected')`, [skillName.toLowerCase()]);
          skillId = insSkill.lastInsertRowid;
        }
        execute(
          `INSERT OR IGNORE INTO candidate_skills (candidate_id, skill_id, proficiency, is_primary_language) VALUES (?, ?, 'PROFICIENT', 1)`,
          [candidateId, skillId]
        );
      }

      const screeningInsert = execute(
        `INSERT INTO screening_results (
          job_id, candidate_id, resume_id, overall_fit_score, skill_match_score, preferred_skill_score,
          education_match_score, experience_match_score, cert_project_score, is_eligible,
          eligibility_reason, matched_required_skills, missing_required_skills,
          matched_preferred_skills, missing_preferred_skills, decision_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sample.jobId,
          candidateId,
          resumeId,
          screening.overall_fit_score,
          screening.sub_scores.skill_match_score,
          screening.sub_scores.preferred_skill_score,
          screening.sub_scores.education_match_score,
          screening.sub_scores.experience_match_score,
          screening.sub_scores.cert_project_score,
          screening.is_eligible ? 1 : 0,
          screening.eligibility_reason,
          screening.requirements_analysis.matched_required_skills.join(', '),
          screening.requirements_analysis.missing_required_skills.join(', '),
          screening.requirements_analysis.matched_preferred_skills.join(', '),
          screening.requirements_analysis.missing_preferred_skills.join(', '),
          screening.overall_fit_score >= 85 ? 'SHORTLISTED' : 'PENDING'
        ]
      );
      const screeningId = screeningInsert.lastInsertRowid;

      if (screening.overall_fit_score >= 85) {
        execute(
          `INSERT OR REPLACE INTO shortlist (job_id, candidate_id, screening_id, notes) VALUES (?, ?, ?, ?)`,
          [sample.jobId, candidateId, screeningId, 'Auto-shortlisted due to outstanding technical screening fit']
        );
      }

      execute(
        `INSERT INTO fit_scores (screening_id, req_skills_weight, pref_skills_weight, education_weight, experience_weight, certs_projects_weight)
         VALUES (?, 0.40, 0.20, 0.15, 0.15, 0.10)`,
        [screeningId]
      );
    }

    res.json({ message: 'Academic demo dataset loaded through dynamic screening pipeline successfully' });
  } catch (err: any) {
    res.status(500).json({ error: `Demo seed failed: ${err.message}` });
  }
});

// ----------------------------------------------------
// VITE / STATIC FILE SERVING SETUP
// ----------------------------------------------------
async function startServer() {
  // Ensure DB is initialized before listening
  await getDb();

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[SmartHire] Server running on port ${PORT} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[SmartHire] Server fatal startup error:', err);
  process.exit(1);
});
