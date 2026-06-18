import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "lexis.db");

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      isbn TEXT UNIQUE,
      category TEXT DEFAULT '其他',
      publisher TEXT,
      publish_date TEXT,
      quantity INTEGER DEFAULT 1,
      available INTEGER DEFAULT 1,
      location TEXT,
      language TEXT DEFAULT '中文',
      rating REAL DEFAULT 4.5,
      review_count INTEGER DEFAULT 0,
      cover_color TEXT DEFAULT '#1A2B44',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS readers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reader_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      student_id TEXT,
      reader_type TEXT DEFAULT '本科生',
      status TEXT DEFAULT '信用良好',
      borrow_limit INTEGER DEFAULT 15,
      fines REAL DEFAULT 0,
      expiry_date TEXT,
      joined_at TEXT DEFAULT (date('now')),
      avatar_color TEXT DEFAULT '#10B981'
    );

    CREATE TABLE IF NOT EXISTS borrowings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reader_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      borrowed_at TEXT DEFAULT (datetime('now')),
      due_date TEXT NOT NULL,
      returned_at TEXT,
      renewed_count INTEGER DEFAULT 0,
      status TEXT DEFAULT '已借出',
      FOREIGN KEY (reader_id) REFERENCES readers(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      book_title TEXT,
      reader_name TEXT,
      status TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      ip_address TEXT,
      status TEXT DEFAULT '成功',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ip_whitelist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ip_range TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT '管理员',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT,
      type TEXT DEFAULT 'info',
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}
