# SYNCSPACE - Connect. Collaborate. In real time.

CodeAlpha Full Stack Internship Task 4: real-time communication app with WebRTC video, Socket.IO signaling, chat, file sharing, and a collaborative whiteboard.

## Features
- JWT auth (register/login/me/logout) with bcrypt hashing
- Dashboard: profile, stats, create/join room, recent rooms, recent activity
- Rooms with unique room codes, membership checks, owner delete
- WebRTC mesh video: camera/mic permission flow, local preview, remote streams, mic/camera toggles, join/leave presence
- Screen sharing via getDisplayMedia with track replacement and start/stop events
- Real-time chat via Socket.IO, persisted to PostgreSQL, with history
- File sharing: validated uploads (25MB default), progress, download links, file:shared broadcast
- Collaborative whiteboard: canvas pencil/eraser/width/colors, stroke sync + clear sync
- Participant list with mic/camera/screen states
- Connection status: connecting/connected/reconnecting/disconnected (real socket state)

## Tech stack
- Frontend: React + Vite, Tailwind CSS, Lucide React, Framer Motion, socket.io-client
- Backend: Node.js + Express + Socket.IO, multer uploads
- DB: PostgreSQL + Prisma
- Auth: JWT + bcrypt

## Architecture
- REST for identity/rooms/history/files; Socket.IO for signaling + live events.
- WebRTC mesh: each joiner exchanges offer/answer + ICE with every existing peer (STUN only; practical for small rooms). Modular peer layer in frontend/src/webrtc/useRoom.js so an SFU (LiveKit/mediasoup) can replace it later.
- Signaling flow: room:join -> server validates JWT + membership -> room:participants + participant:joined -> offer/answer/ICE -> ontrack renders remote video -> participant:left removes peer and stops tracks.

## Database schema
- User(id, name, email unique, password, avatar, timestamps)
- Room(id, roomCode unique, name, ownerId, timestamps)
- RoomParticipant(id, roomId, userId unique together, joinedAt, leftAt)
- Message(id, roomId, userId, content, createdAt)
- SharedFile(id, roomId, userId, fileName, fileUrl, fileSize, mimeType, createdAt)

## Environment variables
Backend/backend/.env (see backend/.env.example):
- DATABASE_URL, JWT_SECRET (32+ chars), JWT_EXPIRES_IN=7d, PORT=5004, NODE_ENV=development, CORS_ORIGIN=http://localhost:5174, MAX_FILE_MB=25
Frontend/frontend/.env (see frontend/.env.example):
- VITE_API_URL=http://localhost:5004

## Production deployment (split architecture)
Vercel hosts ONLY the static React/Vite frontend. The Node.js + Express +
Socket.IO server must run on a persistent Node host (Render/Railway). The
Vercel static site does NOT serve the REST API or Socket.IO - so the frontend
must never fall back to window.location.origin in production.

### Backend (Render or Railway)
- Root directory: `SYNCSPACE/backend`
- Build command: `npm install && npm run build && npm run db:deploy`
  (`build` = `prisma generate`, `db:deploy` = `prisma migrate deploy`)
- Start command: `npm start`  (runs `node src/server.js`)
- Environment:
  - NODE_ENV=production
  - PORT=5004 (or leave to the host - Render/Railway inject PORT; the server reads it)
  - DATABASE_URL=<your managed PostgreSQL connection string, same DB for all devices>
  - JWT_SECRET=<32+ char random string, never reuse the frontend or commit it>
  - CORS_ORIGIN=https://codealpha-syncspace-ltv9va6qk-mr0utkarsh.vercel.app,http://localhost:5174
    (CORS_ORIGINS works as an alias)
  - JWT_EXPIRES_IN=7d, MAX_FILE_MB=25 (optional)
- The backend refuses to start in production without an explicit CORS origin.

### Frontend (Vercel)
- Root directory: `SYNCSPACE/frontend`
- Build command: `npm run build` (Vite)
- Environment (Project -> Settings -> Environment Variables, then REDeploy):
  - VITE_API_URL=https://YOUR-DEPLOYED-BACKEND-URL  (no trailing slash; this
    is the Render/Railway origin and is used for BOTH REST and Socket.IO)
- If VITE_API_URL is missing in a production build the app logs a clear error
  instead of silently calling the Vercel origin.

### Deployment verification
- `curl https://YOUR-DEPLOYED-BACKEND-URL/api/health` -> `{"success":true,...}`
- Open the Vercel site, register on two devices, create a room on device A,
  join with the room code on device B: membership and presence both come from
  the single PostgreSQL database, and the socket status shows "connected".

## Installation
1. Backend: cd backend, npm install
2. Frontend: cd frontend, npm install

## PostgreSQL setup
- Easiest: cd backend, npm run db:local (embedded PostgreSQL on port 55434, database syncspace). Keep it running.
- Or point DATABASE_URL at your own PostgreSQL.

## Prisma commands
- npx prisma migrate dev --name init
- npx prisma generate
- npm run db:seed (or prisma db seed)
- npx prisma studio

## Run locally
- Terminal 1 (DB): cd backend, npm run db:local
- Terminal 2 (API): cd backend, npm run dev (http://localhost:5004)
- Terminal 3 (web): cd frontend, npm run dev (http://localhost:5174)
- Seed users: alice@syncspace.dev, bob@syncspace.dev, cara@syncspace.dev (password: password123)

## Verification tooling
Automated smoke tests live in `_tools/` (run with the API + DB up):
- `node _tools/api-smoke.mjs` - 44 REST/auth/authorization/upload checks
- `node _tools/socket-smoke.mjs` - 40 real-time Socket.IO signaling checks between two users
- `node _tools/db-check.mjs` - row counts + confirms passwords are bcrypt-hashed

Both suites pass 84/84, and `npm run build` produces a clean production bundle.

## Local WebRTC testing
- Allow camera/mic when prompted. Use two browser tabs/windows with two different users, join the same room code, and verify remote video/audio appears.
- Test mic/camera toggles, screen share, chat both directions, file upload/download, whiteboard strokes clearing on both sides, leave/rejoin, and refresh reconnect.
- Browser media APIs require localhost or HTTPS in deployment; document HTTPS for production.
- Keyboard shortcuts in the call: `M` mic, `C` camera, `S` screen share, `L` leave.
- The "speaking" ring on a video tile is driven by a real Web Audio `AnalyserNode`, so it only lights up on actual audio energy.

## Known limitations
- Mesh scales to small rooms (4-6); larger rooms need an SFU.
- STUN-only (no TURN); restrictive NATs may fail without a TURN server.
- Uploads stored on local disk under backend/uploads (use S3/R2 in production).
- No E2EE; add DTLS/SRTP defaults plus app-level encryption for sensitive use.

## Future improvements
- TURN server, SFU migration, recording, breakout rooms, reactions, typing indicators, paginated history, S3 storage, E2EE, mobile apps.
