import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, '../data.db'));

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS triage_history (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    age INTEGER,
    heart_rate REAL,
    systolic_blood_pressure REAL,
    oxygen_saturation REAL,
    respiratory_rate REAL,
    body_temperature REAL,
    pain_level INTEGER,
    chronic_disease_count INTEGER,
    previous_er_visits INTEGER,
    arrival_mode TEXT,
    symptoms TEXT,
    medical_history TEXT,
    triage_level INTEGER,
    confidence REAL,
    risk_factors TEXT,
    explanation_summary TEXT,
    explanation_clinical_summary TEXT,
    explanation_top_features TEXT,
    timestamp INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

export default db;
