# Contact book (React + Tailwind CSS + Express + SQLite)

Single-page app with full CRUD on a `contacts` table.

| Operation | HTTP route               | SQL             |
|-----------|--------------------------|-----------------|
| Create    | POST /api/contacts       | INSERT          |
| Read      | GET /api/contacts?q=     | SELECT ... LIKE |
| Update    | PUT /api/contacts/:id    | UPDATE          |
| Delete    | DELETE /api/contacts/:id | DELETE          |

## Run locally (Node.js 18+ required: https://nodejs.org)

Terminal 1 - backend (port 3001):
    cd server
    npm install
    npm start

Terminal 2 - frontend (port 5173):
    cd client
    npm install
    npm run dev

Open http://localhost:5173

The database file server/contacts.db is created automatically.
Every SQL statement is printed in the backend terminal (lines starting with "SQL>").
