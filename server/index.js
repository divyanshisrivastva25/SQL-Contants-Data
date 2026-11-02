import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import fs from "fs";

const db = new Database("contacts.db", { verbose: (sql) => console.log("SQL>", sql.replace(/\s+/g, " ").trim()) });
db.exec(fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));

const app = express();
app.use(cors());
app.use(express.json());

const clean = (b) => ({
  name: (b.name || "").trim(),
  email: (b.email || "").trim(),
  phone: (b.phone || "").trim(),
  city: (b.city || "").trim(),
  notes: (b.notes || "").trim(),
});

const phoneOk = (p) => !p || /^\+\d{1,4} \d{6,12}$/.test(p);

// READ (all, with optional search)
app.get("/api/contacts", (req, res) => {
  const q = `%${req.query.q || ""}%`;
  const rows = db
    .prepare(
      `SELECT * FROM contacts
       WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR city LIKE ?
       ORDER BY name COLLATE NOCASE`
    )
    .all(q, q, q, q);
  res.json(rows);
});

// CREATE
app.post("/api/contacts", (req, res) => {
  const c = clean(req.body);
  if (!c.name) return res.status(400).json({ error: "Name is required." });
  if (!phoneOk(c.phone)) return res.status(400).json({ error: "Enter a valid phone number." });
  const info = db
    .prepare(
      "INSERT INTO contacts (name, email, phone, city, notes) VALUES (@name, @email, @phone, @city, @notes)"
    )
    .run(c);
  res.status(201).json(db.prepare("SELECT * FROM contacts WHERE id = ?").get(info.lastInsertRowid));
});

// UPDATE
app.put("/api/contacts/:id", (req, res) => {
  const c = clean(req.body);
  if (!c.name) return res.status(400).json({ error: "Name is required." });
  if (!phoneOk(c.phone)) return res.status(400).json({ error: "Enter a valid phone number." });
  const info = db
    .prepare(
      "UPDATE contacts SET name=@name, email=@email, phone=@phone, city=@city, notes=@notes WHERE id=@id"
    )
    .run({ ...c, id: req.params.id });
  if (!info.changes) return res.status(404).json({ error: "Contact not found." });
  res.json(db.prepare("SELECT * FROM contacts WHERE id = ?").get(req.params.id));
});

// DELETE
app.delete("/api/contacts/:id", (req, res) => {
  const info = db.prepare("DELETE FROM contacts WHERE id = ?").run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: "Contact not found." });
  res.status(204).end();
});

app.listen(3001, () => console.log("API running on http://localhost:3001"));
