import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'pizza.db');

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initDb(db);
  }
  return db;
}

function initDb(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      cancel_token TEXT UNIQUE NOT NULL,
      cancelled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const insertSetting = db.prepare(
    `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`
  );

  const defaults: [string, string][] = [
    ['next_date', ''],
    ['description', 'Fresh wood-fired pizzas from my backyard brick oven. Made with love, local ingredients, and very hot fire.'],
    ['total_pizzas', '12'],
    ['contact', ''],
  ];

  for (const [key, value] of defaults) {
    insertSetting.run(key, value);
  }
}

export default getDb;
