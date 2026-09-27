import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';

let dbInstance: Database | null = null;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'smarthire.sqlite');

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  // Enforce foreign keys in SQLite
  dbInstance.run('PRAGMA foreign_keys = ON;');

  initSchema(dbInstance);
  saveDb();
  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  const data = dbInstance.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function initSchema(db: Database): void {
  // 1. Users table (HR Recruiters / Admins)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      department TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'RECRUITER',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Jobs table
  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      department TEXT NOT NULL,
      description TEXT NOT NULL,
      required_education TEXT NOT NULL,
      min_experience REAL NOT NULL DEFAULT 0.0,
      location TEXT NOT NULL,
      employment_type TEXT NOT NULL DEFAULT 'Full-time',
      skill_threshold REAL NOT NULL DEFAULT 0.5,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Job Requirements table (Normalized relational design: 1-to-many from Jobs)
  db.run(`
    CREATE TABLE IF NOT EXISTS job_requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      req_type TEXT NOT NULL, -- 'REQUIRED_SKILL', 'PREFERRED_SKILL', 'EDUCATION', 'CERTIFICATION'
      name TEXT NOT NULL,
      weight REAL NOT NULL DEFAULT 1.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );
  `);

  // 4. Candidates table
  db.run(`
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT DEFAULT 'Not detected',
      education TEXT DEFAULT 'Not detected',
      education_level INTEGER DEFAULT 0,
      years_experience REAL DEFAULT 0.0,
      current_title TEXT DEFAULT 'Software Engineer',
      certifications_summary TEXT DEFAULT 'Not detected',
      projects_summary TEXT DEFAULT 'Not detected',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Resumes table (Document record linked to Candidate)
  db.run(`
    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL,
      original_filename TEXT NOT NULL,
      file_size_bytes INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      extracted_text TEXT NOT NULL,
      processing_status TEXT NOT NULL DEFAULT 'PROCESSED',
      processing_error TEXT,
      upload_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
    );
  `);

  // 6. Skills master table
  db.run(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL DEFAULT 'General'
    );
  `);

  // 7. Candidate Skills junction table (Many-to-Many normalized relational design)
  db.run(`
    CREATE TABLE IF NOT EXISTS candidate_skills (
      candidate_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      proficiency TEXT DEFAULT 'INTERMEDIATE',
      is_primary_language INTEGER DEFAULT 0,
      PRIMARY KEY (candidate_id, skill_id),
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    );
  `);

  // 8. Screening Results table
  db.run(`
    CREATE TABLE IF NOT EXISTS screening_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      candidate_id INTEGER NOT NULL,
      resume_id INTEGER NOT NULL,
      overall_fit_score REAL NOT NULL,
      skill_match_score REAL NOT NULL,
      preferred_skill_score REAL NOT NULL,
      education_match_score REAL NOT NULL,
      experience_match_score REAL NOT NULL,
      cert_project_score REAL NOT NULL,
      is_eligible INTEGER NOT NULL, -- 1 for True, 0 for False
      eligibility_reason TEXT NOT NULL,
      matched_required_skills TEXT, -- comma-separated
      missing_required_skills TEXT,
      matched_preferred_skills TEXT,
      missing_preferred_skills TEXT,
      decision_status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SHORTLISTED', 'REJECTED'
      hr_notes TEXT,
      screened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
      FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
    );
  `);

  // 9. Fit Scores table (Historical / Configurable Breakdown)
  db.run(`
    CREATE TABLE IF NOT EXISTS fit_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      screening_id INTEGER NOT NULL,
      req_skills_weight REAL NOT NULL,
      pref_skills_weight REAL NOT NULL,
      education_weight REAL NOT NULL,
      experience_weight REAL NOT NULL,
      certs_projects_weight REAL NOT NULL,
      calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (screening_id) REFERENCES screening_results(id) ON DELETE CASCADE
    );
  `);

  // 10. Shortlist table
  db.run(`
    CREATE TABLE IF NOT EXISTS shortlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      candidate_id INTEGER NOT NULL,
      screening_id INTEGER NOT NULL,
      shortlisted_by_user_id INTEGER,
      notes TEXT,
      shortlisted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
      FOREIGN KEY (screening_id) REFERENCES screening_results(id) ON DELETE CASCADE,
      FOREIGN KEY (shortlisted_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
      UNIQUE(job_id, candidate_id)
    );
  `);

  // 11. Screening History (Audit log of all recruiter actions)
  db.run(`
    CREATE TABLE IF NOT EXISTS screening_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER,
      candidate_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      user_email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 12. System Settings (e.g. weights, threshold configs)
  db.run(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // --- ADSA: B-TREE INDEXES CREATION ---
  // Demonstrating ADSA B-Tree indexing on primary query paths
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
    CREATE INDEX IF NOT EXISTS idx_candidates_experience ON candidates(years_experience);
    CREATE INDEX IF NOT EXISTS idx_screening_job_fit ON screening_results(job_id, overall_fit_score DESC);
    CREATE INDEX IF NOT EXISTS idx_screening_candidate ON screening_results(candidate_id);
    CREATE INDEX IF NOT EXISTS idx_screening_decision ON screening_results(decision_status);
    CREATE INDEX IF NOT EXISTS idx_shortlist_job ON shortlist(job_id);
    CREATE INDEX IF NOT EXISTS idx_job_req_job ON job_requirements(job_id);
    CREATE INDEX IF NOT EXISTS idx_resumes_candidate ON resumes(candidate_id);
  `);

  // Seed default HR user if none exists
  const checkUser = db.exec("SELECT COUNT(*) as count FROM users WHERE email = 'recruiter@smarthire.internal'");
  const userCount = checkUser[0]?.values[0]?.[0] as number || 0;
  if (userCount === 0) {
    db.run(
      `INSERT INTO users (email, password_hash, full_name, department, role) 
       VALUES ('recruiter@smarthire.internal', 'admin123', 'Senior Talent Lead', 'Engineering Recruiting', 'HR_ADMIN')`
    );
  }

  // Seed default scoring weights in settings
  const checkSettings = db.exec("SELECT COUNT(*) as count FROM system_settings WHERE key = 'scoring_weights'");
  const settingsCount = checkSettings[0]?.values[0]?.[0] as number || 0;
  if (settingsCount === 0) {
    const defaultWeights = JSON.stringify({
      required_skills: 0.40,
      preferred_skills: 0.20,
      education: 0.15,
      experience: 0.15,
      certs_projects: 0.10,
      skill_threshold: 0.50
    });
    db.run(`INSERT INTO system_settings (key, value) VALUES ('scoring_weights', '${defaultWeights}')`);
  }
}

/**
 * Execute parameterized query returning array of object rows
 */
export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

/**
 * Execute query returning single row or null
 */
export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

let saveScheduled = false;

export function scheduleSaveDb(): void {
  if (saveScheduled) return;
  saveScheduled = true;
  setTimeout(() => {
    saveScheduled = false;
    saveDb();
  }, 50);
}

/**
 * Execute INSERT/UPDATE/DELETE statement returning lastInsertRowid
 */
export function execute(sql: string, params: any[] = []): { lastInsertRowid: number } {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run(sql, params);
  const res = dbInstance.exec('SELECT last_insert_rowid() as id');
  const lastId = (res[0]?.values[0]?.[0] as number) || 0;
  scheduleSaveDb();
  return { lastInsertRowid: lastId };
}

