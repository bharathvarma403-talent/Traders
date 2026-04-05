# 🚀 Deployment Guide — Vasavi Traders

## Architecture

```
GitHub Repo
│
├── FRONTEND/ ──► Vercel   (React + Vite)
└── BACKEND/  ──► Render   (Node.js + Express + SQLite)
```

---

## Part 1: Deploy Backend to Render

### Step 1 — Create a Render account

Sign up at [render.com](https://render.com).

### Step 2 — New Web Service

1. Dashboard → **New → Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Root Directory:** `BACKEND`
   - **Runtime:** Node
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `npm start`
   - **Node Version:** 18 (set in Environment)

### Step 3 — Set Environment Variables on Render

Add the following in **Environment → Add Environment Variable**:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | (generate: `openssl rand -base64 32`) |
| `JWT_REFRESH_SECRET` | (generate: `openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |
| `FRONTEND_URL` | `https://your-app.vercel.app` |
| `PORT` | `4000` |

### Step 4 — Deploy

Click **Deploy Web Service**. Render will build and start the server.

Note your **Backend URL**: `https://your-backend.onrender.com`

> ⚠️ SQLite on Render uses the ephemeral disk — data resets on each deploy. For production persistence, switch to **PostgreSQL** (change `schema.prisma` provider to `postgresql` and update `DATABASE_URL`).

---

## Part 2: Deploy Frontend to Vercel

### Step 1 — Create a Vercel account

Sign up at [vercel.com](https://vercel.com).

### Step 2 — Import Project

1. Dashboard → **Add New → Project**
2. Import your GitHub repository
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `FRONTEND`
   - Leave build commands as auto-detected

### Step 3 — Set Environment Variables on Vercel

In **Settings → Environment Variables**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://your-backend.onrender.com` |
| `VITE_GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |

### Step 4 — Deploy

Click **Deploy**. Your frontend will be live at `https://your-app.vercel.app`.

---

## Part 3: Update Google OAuth Origins

Go back to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials):

1. Edit your OAuth 2.0 Client ID
2. Add to **Authorized JavaScript origins**:
   - `https://your-app.vercel.app`
3. Add to **Authorized redirect URIs** (only if using redirect flow):
   - `https://your-app.vercel.app`
4. Save.

---

## Part 4: Post-Deployment Checklist

- [ ] Backend `/api/products` returns data
- [ ] Frontend loads and connects to backend
- [ ] Google Sign-In works on the live URL
- [ ] Admin login works (`admin@vasavitraders.com` / `admin123`)
- [ ] Users can register, place orders, track status
- [ ] Admin can see all orders with email and update status

---

## Upgrading from SQLite → PostgreSQL (Recommended for Production)

1. Update `BACKEND/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Add `DATABASE_URL` on Render pointing to a Render PostgreSQL instance
3. Run `npx prisma migrate deploy` on first deploy
4. Run `node seed.js` to seed admin user and products
