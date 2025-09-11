# ChatApp Project

A full-stack chat application skeleton with secure authentication, built with React (Vite) on the frontend and Node.js/Express with MongoDB on the backend.

## Tech Stack

- Frontend: React 19, Vite, Tailwind CSS 4, React Router, Redux Toolkit, React Hook Form
- Backend: Node.js, Express, Mongoose, JWT, bcrypt, cookie-parser, CORS, dotenv
- Database: MongoDB

## Monorepo Structure

```
/ (project root)
├─ backend/            # Express API server
│  ├─ models/          # Mongoose models (User)
│  ├─ routes/          # Auth routes
│  ├─ index.js         # Server entry
│  └─ .env             # Backend env (not committed)
└─ chatapp/            # React frontend
   ├─ src/
   │  ├─ components/   # UI components
   │  ├─ store/        # Redux store and slices
   │  ├─ App.jsx       # App layout
   │  └─ main.jsx      # Router setup
   └─ .env             # Frontend env (not committed)
```

## Environment Variables

See `ENVIRONMENT_SETUP.md` for full details and examples. Quick reference:

- Backend (`backend/.env`): `MONGODB_URI`, `PORT`, `NODE_ENV`, `JWT_SECRET`, `FRONTEND_URL`
- Frontend (`chatapp/.env`): `VITE_API_BASE_URL`, `VITE_API_AUTH_URL`

## Getting Started

1. Clone the repo and install dependencies:
   - Backend: `cd backend && npm install`
   - Frontend: `cd chatapp && npm install`
2. Create `.env` files in both `backend/` and `chatapp/` (see `.env.example` files or `ENVIRONMENT_SETUP.md`).
3. Start services:
   - Backend: `cd backend && node index.js`
   - Frontend: `cd chatapp && npm run dev`

Backend runs on `http://localhost:3000` and frontend on `http://localhost:5173` by default.

## Authentication Flow

- Sign Up: `POST /api/auth/signup`
  - Validates unique email, hashes password with bcrypt, stores user
- Login: `POST /api/auth/login`
  - Validates credentials, issues JWT, sets HttpOnly cookie `token`
- Verify Token: `GET /api/auth/verifyToken`
  - Validates cookie token and returns decoded payload

Cookies are set with `httpOnly`, `sameSite=strict`. CORS is configured for the frontend origin with `credentials: true`.

## Key Files

- Backend
  - `backend/index.js`: Express app, MongoDB connection, middleware, CORS, routes, env usage
  - `backend/models/user.js`: User schema (username, email, password)
  - `backend/routes/auth.js`: Signup, login, token verification
- Frontend
  - `chatapp/src/main.jsx`: Router with protected root route
  - `chatapp/src/App.jsx`: Main layout (header, sidebar, content)
  - `chatapp/src/components/ProtectedRoute.jsx`: Verifies auth via `/verifyToken`
  - `chatapp/src/components/logins/LoginForm.jsx`: Login form with error handling
  - `chatapp/src/components/logins/SignupForm.jsx`: Signup form with validation
  - `chatapp/src/store/userSlice.js`: Redux slice for auth state and user info

## Development Notes

- Environment variables are used everywhere instead of hardcoded values.
- Debug console logs were removed; only minimal startup logs remain in development.
- Image assets referenced from `src/assets/`.

## API Endpoints

```
GET  /                 # API root info
POST /api/auth/signup  # Create user
POST /api/auth/login   # Login, set JWT cookie
GET  /api/auth/verifyToken  # Verify JWT cookie
```

## Roadmap (Next Steps)

- Real-time chat using Socket.io
- Message model and persistence
- Rooms/channels and membership
- Typing indicators and online presence
- Unit/integration tests and API docs

## Scripts

- Frontend
  - `npm run dev` – Start Vite dev server
  - `npm run build` – Build frontend
  - `npm run preview` – Preview built app
  - `npm run lint` – Lint code
- Backend
  - `node index.js` – Start Express server

## License

This project is provided as-is for learning and extension.

## Real-time Chat (Socket.io)

This project includes initial Socket.io scaffolding for real-time messaging.

### Files
- Backend handler: `backend/socket/chat.js`
- Backend models: `backend/models/message.js`, `backend/models/pending.js`
- Frontend client: `chatapp/socket.js`

### Backend: Chat Socket Handler
The handler tracks online users, relays messages in real time, and persists message history. Pending messages are stored when the receiver is offline.

Key events:
- sendMessage (client → server) with sender and receiver details
  - If receiver is online, the message is delivered instantly and stored in conversation history
  - If receiver is offline, the message is stored as pending for later delivery
- Disconnect cleanup removes the user from the online users map

Message persistence:
- Message: stores conversations with text and timestamps for sender/receiver pairs
- Pending: stores messages for offline delivery with timestamps

### Frontend: Socket Client
Initialize the socket after login using the authenticated user id. Use it to send messages and subscribe to incoming messages. Ensure only a single socket instance is created per session.

### Integration Steps (to complete)
1. Create an HTTP server in the backend and attach Socket.io to it, enabling CORS for your frontend and switching to server.listen instead of app.listen.
2. Ensure the chat socket handler imports the message and pending models and is exported in the module format used by the backend.
3. Align the Socket.io server URL/port with your backend. Either run Socket.io on the same port as Express, or expose a dedicated SOCKET_URL env and use it in the frontend.
4. On user login, initialize the socket with the authenticated user id.
5. On reconnect, deliver any pending messages and move them into history.

### Suggested Environment Variables
- Frontend: VITE_SOCKET_URL pointing to the backend (e.g., http://localhost:3000)
- Backend: reuse FRONTEND_URL for CORS; optionally define SOCKET_PATH if customizing the path

Once the above steps are wired, you’ll have end-to-end real-time messaging with persistence and offline support.
