# Render fix: backend Docker build failing with "/cpp_core": not found

## What the error means
Render is building the **backend Dockerfile** (`backend/Dockerfile`). That Dockerfile runs:

- `COPY cpp_core/ /cpp_core`

So the Docker **build context** must include `cpp_core/` at the same level as `backend/`.

Your current Render settings likely set build context to `backend/` only, so `cpp_core/` isn’t included in the Docker context.

## Fix options

### Option A (recommended): switch backend Render to “Source Code”
- Backend **Build method**: Source Code
- Root Directory: `backend`
- Build command: `npm install`
- Start command: `npm start`

This avoids Docker entirely, so `cpp_core` path issues disappear.

### Option B: keep Docker build, but set build context to repo root
- Backend **Root Directory / build context**: `WhatClone/` (the repo root that contains both `backend/` and `cpp_core/`)
- Dockerfile: `backend/Dockerfile`

This ensures `cpp_core/` is available during Docker `COPY`.

## After change
Redeploy backend and confirm logs no longer show the `/cpp_core` not found error.

