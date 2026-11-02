CREATE TABLE IF NOT EXISTS contacts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  city       TEXT,
  notes      TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
