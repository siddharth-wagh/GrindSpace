# GrindSpace CP War Room

A competitive-programming "war room" where coding squads grind Codeforces together. Drop a problem link in chat and it unfurls into rich metadata, mark solves that sync automatically from your Codeforces account, run timed contests with a live scoreboard, climb squad leaderboards, and ask the built-in Gemini "Oracle" to explain any snippet — all wrapped in a dense, dark hacker aesthetic.

## Features

- **Discord-style squads & channels** — create servers ("squads"), invite members, and chat in text channels.
- **Problem unfurling** — paste any Codeforces problem link and it expands inline with name, rating, tags, solved count, and a direct link.
- **Solve ledger** — mark problems solved manually or let the Codeforces sync pull your recent accepted submissions automatically.
- **Codeforces sync** — link your CF handle to pull rating, max rating, rank, and your latest submissions on a cron schedule.
- **Live contests** — spin up a timed contest from a set of problems (or import a real CF round), watch a real-time scoreboard via Socket.IO, then end and upsolve.
- **Squad leaderboards** — per-server rankings by solves and rating, with rank-colored handles.
- **Activity heatmap & streaks** — GitHub-style solve heatmap and streak tracking per user.
- **The Oracle** — a Gemini-powered assistant that explains code and problems on demand.
- **Command palette** — fast keyboard-driven navigation across squads, channels, and problems.

## Architecture

```
                    +-----------------------------+
                    |        Clients (Browser)    |
                    |   Vite + React 19 + Tailwind|
                    |   lucide-react, SyntaxHL     |
                    +--------------+--------------+
                                   |
                       HTTPS / WebSocket (axios + socket.io-client)
                                   |
                    +--------------v--------------+
                    |   Express 5 + Socket.IO      |
                    |   REST API + realtime events |
                    |   JWT auth (httpOnly cookie)  |
                    +---+--------+--------+--------+
                        |        |        |
            +-----------+        |        +------------------+
            |                    |                           |
   +--------v--------+  +--------v--------+        +---------v---------+
   | MongoDB Atlas   |  | Redis / Upstash |        |  Codeforces API   |
   | users, servers, |  | KV store, links,|        |  problems, subs,  |
   | channels, msgs, |  | dedupe, counters|        |  ratings, stand.  |
   | solves, contests|  +-----------------+        +-------------------+
   +-----------------+
                        +------------------+
                        |   Gemini API     |
                        |   (the Oracle)   |
                        +------------------+
```

The React SPA talks to the Express + Socket.IO backend over REST (axios, `withCredentials`) and a WebSocket. The backend persists domain data in MongoDB Atlas, uses Redis/Upstash as a KV store for link parsing, dedupe and counters, calls the Codeforces public API for problem and submission data, and calls the Gemini API to power the Oracle. Cloudinary stores uploaded profile pictures.

## Environment variables

### Backend (`backend/`)

| Variable | Description |
| --- | --- |
| `MONGO_URI` | MongoDB Atlas connection string. |
| `JWT_SECRET` | Secret used to sign auth JWTs. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for image uploads. |
| `CLOUDINARY_API_KEY` | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret. |
| `GEMINI_API_KEY` | Google Gemini API key for the Oracle. |
| `FRONTEND_URL` | Allowed origin for CORS and Socket.IO (the deployed frontend URL). |
| `REDIS_URL` | Redis / Upstash connection URL for the KV store. |
| `PORT` | Port the server listens on (defaults to 5001). |

### Frontend (`frontend/`)

| Variable | Description |
| --- | --- |
| `VITE_API_HOST` | Base URL of the backend API (e.g. `https://grindspace-backend.onrender.com`). |

## Local development

You need Node 18+, a MongoDB instance (local or Atlas), and a Redis instance (local or Upstash).

### 1. Backend

```bash
cd backend
npm install
# create backend/.env with the variables from the table above
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
# create frontend/.env with VITE_API_HOST pointing at the backend
npm run dev
```

The Vite dev server prints a local URL (typically `http://localhost:5173`). Open it in your browser.

### 3. Seed demo data (optional)

With `MONGO_URI` set in `backend/.env`, populate the database with demo squads, users, and an ended contest:

```bash
cd backend
node scripts/seed.js
```

This creates ~10 demo users (real CF handles such as `tourist`, `jiangly`, `Benq`) with the password `password123`, three squads, and one finished demo contest. The script is idempotent-ish: it skips any user, server, or contest that already exists.

## Deployment

### Backend on Render

1. Push the repo to GitHub.
2. In Render, create a new **Blueprint** and point it at the repo; it will pick up `backend/render.yaml`.
3. Render runs `npm install` and starts the service with `node index.js` from the `backend/` root.
4. Fill in the secret env vars (`MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_*`, `GEMINI_API_KEY`, `FRONTEND_URL`, `REDIS_URL`) in the Render dashboard.

### Frontend on Vercel

1. Import the repo in Vercel and set the **Root Directory** to `frontend/`.
2. `frontend/vercel.json` configures the Vite framework preset and rewrites all routes to `/index.html` for SPA routing.
3. Set `VITE_API_HOST` to your Render backend URL in the Vercel project settings.

### MongoDB Atlas

1. Create a free cluster in MongoDB Atlas.
2. Add a database user and allow network access from Render (or `0.0.0.0/0` for a quick demo).
3. Copy the connection string into `MONGO_URI`.

### Upstash Redis

1. Create a Redis database in Upstash.
2. Copy the connection URL into `REDIS_URL` on Render (and locally in `backend/.env`).

Once both services are live, point `FRONTEND_URL` (backend) at the Vercel URL and `VITE_API_HOST` (frontend) at the Render URL, then redeploy.
