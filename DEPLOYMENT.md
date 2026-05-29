# 🚀 Render Cloud Deployment Guide

Deploy **Nebula Chat** (Backend + Frontend) to Render in 10 minutes.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Push to GitHub](#push-to-github)
3. [Create Render Services](#create-render-services)
4. [Environment Variables](#environment-variables)
5. [Deploy & Verify](#deploy--verify)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

✅ **GitHub Account** — Repository pushed publicly  
✅ **Render Account** — Free account at [render.com](https://render.com)  
✅ **MongoDB Atlas** (Optional) — For production database, or use JSON fallback  

---

## Step 1: Push to GitHub

First, ensure your repository is on GitHub:

```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

> Your repo must be **public** or Render must have access via GitHub integration.

---

## Step 2: Create Render Services

### Method A: Blueprint (Recommended) ⭐

The `render.yaml` file contains the entire configuration:

1. **Sign in** to [Render Dashboard](https://dashboard.render.com)
2. Click **Blueprints** (left sidebar)
3. Click **New Blueprint Instance**
4. Select your GitHub repository
5. Render auto-detects `render.yaml`
6. Click **Create Blueprint**

✅ Both backend and frontend services will deploy simultaneously.

### Method B: Manual Setup

If `render.yaml` doesn't work, create services manually:

#### Backend Service
1. Go to **Web Services** → **New Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Name**: `nebula-chat-backend`
   - **Runtime**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Choose **Free Plan** and click **Create Web Service**

#### Frontend Service
1. Go to **Static Sites** → **New Static Site**
2. Connect your GitHub repo
3. Configure:
   - **Name**: `nebula-chat-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Choose **Free Plan** and click **Create**

---

## Step 3: Environment Variables

After services are created, set environment variables:

### Backend Environment Variables

Go to **Backend Service** → **Settings** → **Environment Variables**

| Variable | Value | Required |
|----------|-------|----------|
| `PORT` | `5001` | ✅ |
| `MONGO_URI` | MongoDB connection string* | ❌ |
| `JWT_SECRET` | Any random string (Render can auto-generate) | ✅ |
| `NODE_ENV` | `production` | ✅ |

**MongoDB Connection String:**
- Create free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Get connection string like: `mongodb+srv://username:password@cluster.mongodb.net/nebula?retryWrites=true`
- If not provided, backend uses JSON file fallback (`db_fallback.json`)

### Frontend Environment Variables

Go to **Frontend Service** → **Settings** → **Environment Variables**

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://nebula-chat-backend.onrender.com` |
| `VITE_SOCKET_URL` | `https://nebula-chat-backend.onrender.com` |

> Replace `nebula-chat-backend` with your actual backend service name!

---

## Step 4: Deploy & Verify

### Auto-Deploy
Every push to `main` triggers automatic deployment on Render.

### Manual Deploy
In Render Dashboard → Service → **Manual Deploy** → **Deploy latest commit**

### Monitor Deployment
1. Go to service page
2. Click **Logs** tab
3. Watch build and startup logs

```
✅ Expected output:
- Backend: "Server running on port 5001"
- Frontend: "Built successfully"
```

### Verify in Browser

1. **Visit Frontend URL**  
   Example: `https://nebula-chat-frontend.onrender.com`

2. **Check Browser Console** (F12 → Console)  
   Should show: `🔌 [SOCKET CONNECTED]`

3. **Test Chat**  
   - Go to Contacts
   - Send a message
   - Verify real-time updates

4. **Check Network** (F12 → Network)  
   - API calls to `https://nebula-chat-backend.onrender.com`
   - WebSocket connection `wss://nebula-chat-backend.onrender.com`

---

## Step 5: Custom Domain (Optional)

Go to **Service Settings** → **Custom Domain**
- Add your domain (e.g., `nebula.yourdomain.com`)
- Render auto-provisions SSL certificate

---

## Troubleshooting

### Troubleshooting

**❌ "failed to read dockerfile: open Dockerfile: no such file or directory"**

**Why:** Render detects a Dockerfile but build context is wrong.

**Fix:** ✅ Already applied!
- Removed broken Dockerfiles (backend & frontend)
- render.yaml now uses **Source Code build** (no Docker needed)
- Just push to GitHub and redeploy

### ❌ Frontend shows connection errors

**Symptom:** Browser console shows `CORS errors` or `Connection refused`

**Fix:**
1. Check Backend Service URL is correct
2. Update `VITE_API_BASE_URL` and `VITE_SOCKET_URL`
3. Redeploy frontend

```bash
# Verify backend is running
curl https://nebula-chat-backend.onrender.com/health
```

### ❌ C++ Build Issues

**Symptom:** Logs show `/cpp_core: not found` during build

**Why:** If using Docker, build context doesn't include `cpp_core/`

**Solution:**
1. Go to Backend Service → **Settings**
2. Change **Build Method** to **Source Code** (not Docker)
3. Redeploy

### ❌ Database connection fails

**Symptom:** Backend logs show `MongoError` or database warnings

**Options:**
1. **Add MongoDB:** Create [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster, copy connection string to `MONGO_URI`
2. **Use Fallback:** Backend automatically uses `db_fallback.json` if MongoDB unavailable

### ❌ Free plan limitations

**Note:** Render's free tier includes:
- Spins down after 15 minutes of inactivity
- Limited memory (512 MB)
- Limited bandwidth (100 GB/month)

**Upgrade:** Go to Service → **Settings** → **Plan** → Upgrade to **Starter**

---

## Performance Tips

### Reduce Cold Starts
- Upgrade to paid plan (avoids spin-down)
- Keep backend active with monitoring service (UptimeRobot)

### Optimize Frontend Build
```bash
cd frontend
npm run build  # Creates minimal dist/
```

### Database Performance
- Use MongoDB Atlas (faster than JSON file)
- Index frequently queried fields

---

## Logs & Debugging

### View Real-Time Logs
```bash
# Terminal (requires Render CLI)
render logs --service nebula-chat-backend --tail
```

Or via Dashboard:
1. Service → **Logs** tab
2. Filter by **Error**, **Warn**, **Info**

### Common Log Patterns

```
✅ Backend Ready:
  "Server running on port 5001"
  "Database connected"

✅ Frontend Built:
  "Built in 2.34s"
  "✓ built successfully"

❌ Backend Failed:
  "npm ERR! code"
  "Cannot find module"
```

---

## Next Steps

- ✅ Deployed to Render
- 🎨 [Custom styling](./frontend/src/styles)
- 📊 [Analytics dashboard](./frontend/src/components)
- 🔐 [User management](./backend/src/controllers)

---

## Support

**Issues?**
- Check [Render Docs](https://render.com/docs)
- Review logs in Dashboard
- GitHub Issues: `skothiyal069-lgtm/Nebula`

---

*Created under sector 0x7FF - Nebula Communications Protocol.*
