# Render deployment notes (backend + frontend)

## 1) Backend service (Node/Express + Socket.IO)

**Root Directory:** `backend`

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
npm start
```

**Environment variables (set in Render):**
- `PORT=5001`
- `MONGO_URI=...` (MongoDB connection string)
- `JWT_SECRET=...`

> Your backend listens on `process.env.PORT || 5001`.

## 2) Frontend service (React/Vite)

**Root Directory:** `frontend`

**Build Command:**
```bash
npm install && npm run build
```

**Start Command (Vite preview, SPA):**
```bash
npm run preview -- --host 0.0.0.0 --port $PORT
```

**Environment variables (set in Render):**
- `VITE_SOCKET_URL=<BACKEND_RENDER_BASE_URL>` (e.g. `https://your-backend.onrender.com`)
- `VITE_API_BASE_URL=<BACKEND_RENDER_BASE_URL>` (e.g. `https://your-backend.onrender.com`)

## 3) Why these variables are needed

Your frontend already supports:
- `VITE_API_BASE_URL` in `frontend/src/utils/api.js`
- `VITE_SOCKET_URL` in `frontend/src/context/SocketContext.jsx`

So you should NOT rely on `localhost` when deploying.

## 4) Quick sanity checks after deploy

1. Visit frontend URL
2. Confirm websocket connects (browser console logs: `🔌 [SOCKET CONNECTED]`)
3. Call a REST endpoint and confirm it reaches backend (no CORS errors)


