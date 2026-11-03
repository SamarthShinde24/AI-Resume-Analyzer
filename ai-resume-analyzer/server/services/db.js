import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.resolve(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dataDir, "resume_analyzer.db");
const db = new Database(dbPath);

// Enable WAL mode for high performance concurrent reads and writes
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS analysis_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    file_name TEXT,
    role_title TEXT,
    match_score INTEGER,
    job_description TEXT,
    result_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS kanban_applications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'saved',
    match_score INTEGER DEFAULT 0,
    resume_version TEXT DEFAULT 'v1',
    location TEXT,
    salary TEXT,
    interview_round TEXT,
    due_date TEXT,
    priority TEXT DEFAULT 'Normal',
    notes TEXT,
    url TEXT,
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_history_user ON analysis_history(user_id);
  CREATE INDEX IF NOT EXISTS idx_kanban_user ON kanban_applications(user_id);
`);

// Prepared Statements for Performance
const stmtInsertUser = db.prepare(`
  INSERT INTO users (id, email, password_hash, name)
  VALUES (@id, @email, @password_hash, @name)
`);

const stmtFindUserByEmail = db.prepare(`
  SELECT * FROM users WHERE email = ?
`);

const stmtFindUserById = db.prepare(`
  SELECT id, email, name, created_at FROM users WHERE id = ?
`);

const stmtInsertHistory = db.prepare(`
  INSERT INTO analysis_history (id, user_id, file_name, role_title, match_score, job_description, result_json, created_at)
  VALUES (@id, @user_id, @file_name, @role_title, @match_score, @job_description, @result_json, @created_at)
`);

const stmtGetHistory = db.prepare(`
  SELECT * FROM analysis_history WHERE user_id = ? ORDER BY created_at DESC
`);

const stmtDeleteHistory = db.prepare(`
  DELETE FROM analysis_history WHERE id = ? AND user_id = ?
`);

const stmtGetKanban = db.prepare(`
  SELECT * FROM kanban_applications WHERE user_id = ? ORDER BY date_updated DESC
`);

const stmtUpsertKanban = db.prepare(`
  INSERT INTO kanban_applications (
    id, user_id, company, role, stage, match_score, resume_version,
    location, salary, interview_round, due_date, priority, notes, url,
    date_added, date_updated
  ) VALUES (
    @id, @user_id, @company, @role, @stage, @match_score, @resume_version,
    @location, @salary, @interview_round, @due_date, @priority, @notes, @url,
    @date_added, @date_updated
  )
  ON CONFLICT(id) DO UPDATE SET
    company = excluded.company,
    role = excluded.role,
    stage = excluded.stage,
    match_score = excluded.match_score,
    resume_version = excluded.resume_version,
    location = excluded.location,
    salary = excluded.salary,
    interview_round = excluded.interview_round,
    due_date = excluded.due_date,
    priority = excluded.priority,
    notes = excluded.notes,
    url = excluded.url,
    date_updated = excluded.date_updated
`);

const stmtUpdateKanbanStage = db.prepare(`
  UPDATE kanban_applications
  SET stage = ?, date_updated = CURRENT_TIMESTAMP
  WHERE id = ? AND user_id = ?
`);

const stmtDeleteKanban = db.prepare(`
  DELETE FROM kanban_applications WHERE id = ? AND user_id = ?
`);

// Repository API
export const dbRepository = {
  // Users
  createUser({ id, email, passwordHash, name }) {
    stmtInsertUser.run({
      id,
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      name: name || null,
    });
    return this.findUserById(id);
  },

  findUserByEmail(email) {
    if (!email) return null;
    return stmtFindUserByEmail.get(email.toLowerCase().trim()) || null;
  },

  findUserById(id) {
    return stmtFindUserById.get(id) || null;
  },

  // History
  saveHistory(userId, { id, fileName, roleTitle, matchScore, jobDescription, resultJson, createdAt }) {
    const recordId = id || `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    stmtInsertHistory.run({
      id: recordId,
      user_id: userId,
      file_name: fileName || "Resume.pdf",
      role_title: roleTitle || "Target Role",
      match_score: matchScore || 0,
      job_description: jobDescription || "",
      result_json: typeof resultJson === "string" ? resultJson : JSON.stringify(resultJson),
      created_at: createdAt || new Date().toISOString(),
    });
    return recordId;
  },

  getUserHistory(userId) {
    const rows = stmtGetHistory.all(userId);
    return rows.map((r) => {
      let parsed = null;
      try {
        parsed = JSON.parse(r.result_json);
      } catch {
        parsed = {};
      }
      return {
        id: r.id,
        fileName: r.file_name,
        roleTitle: r.role_title,
        matchScore: r.match_score,
        jobDescription: r.job_description,
        result: parsed,
        createdAt: r.created_at,
      };
    });
  },

  deleteHistory(userId, historyId) {
    const res = stmtDeleteHistory.run(historyId, userId);
    return res.changes > 0;
  },

  // Kanban
  getUserKanban(userId) {
    const rows = stmtGetKanban.all(userId);
    return rows.map((r) => ({
      id: r.id,
      company: r.company,
      role: r.role,
      stage: r.stage,
      matchScore: r.match_score,
      resumeVersion: r.resume_version,
      location: r.location,
      salary: r.salary,
      interviewRound: r.interview_round,
      dueDate: r.due_date,
      priority: r.priority,
      notes: r.notes,
      url: r.url,
      dateAdded: r.date_added,
      dateUpdated: r.date_updated,
    }));
  },

  saveKanbanJob(userId, job) {
    const now = new Date().toISOString();
    const jobId = job.id || `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    stmtUpsertKanban.run({
      id: jobId,
      user_id: userId,
      company: job.company || "Target Company",
      role: job.role || "Target Role",
      stage: job.stage || "saved",
      match_score: Number(job.matchScore) || 75,
      resume_version: job.resumeVersion || "v1",
      location: job.location || "Remote",
      salary: job.salary || "",
      interview_round: job.interviewRound || "",
      due_date: job.dueDate || "",
      priority: job.priority || "Normal",
      notes: job.notes || "",
      url: job.url || "",
      date_added: job.dateAdded || now,
      date_updated: now,
    });
    return jobId;
  },

  updateKanbanStage(userId, jobId, newStage) {
    const res = stmtUpdateKanbanStage.run(newStage, jobId, userId);
    return res.changes > 0;
  },

  deleteKanbanJob(userId, jobId) {
    const res = stmtDeleteKanban.run(jobId, userId);
    return res.changes > 0;
  },

  bulkSync(userId, { history = [], kanban = [] }) {
    const syncTx = db.transaction(() => {
      let historyCount = 0;
      let kanbanCount = 0;

      for (const h of history) {
        if (!h) continue;
        try {
          this.saveHistory(userId, {
            id: h.id,
            fileName: h.fileName,
            roleTitle: h.roleTitle,
            matchScore: h.score || h.matchScore,
            jobDescription: h.jobDescription,
            resultJson: h.result,
            createdAt: h.timestamp || h.createdAt,
          });
          historyCount++;
        } catch {
          // Ignore duplicate / conflicting IDs
        }
      }

      for (const k of kanban) {
        if (!k) continue;
        try {
          this.saveKanbanJob(userId, k);
          kanbanCount++;
        } catch {
          // Ignore duplicate / conflicting IDs
        }
      }

      return { historyCount, kanbanCount };
    });

    return syncTx();
  },

  getStats() {
    const userCount = db.prepare("SELECT count(*) as count FROM users").get().count;
    const historyCount = db.prepare("SELECT count(*) as count FROM analysis_history").get().count;
    const kanbanCount = db.prepare("SELECT count(*) as count FROM kanban_applications").get().count;
    return {
      dbPath,
      userCount,
      historyCount,
      kanbanCount,
    };
  },
};

export default db;
