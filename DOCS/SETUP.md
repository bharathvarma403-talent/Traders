# 🔧 Local Development Setup Guide

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18.x |
| npm | ≥ 9.x |
| Git | Any recent |

---

## 1. Clone & Install

```bash
git clone <your-repo-url>
cd web_2
```

### Backend

```bash
cd BACKEND
npm install
```

### Frontend

```bash
cd ../FRONTEND
npm install
```

---

## 2. Configure Environment Variables

### Backend — `BACKEND/.env`

Copy the example file:
```bash
cp .env.example .env
```

Edit `.env` and set:
```env
JWT_SECRET=some_long_random_string_here
JWT_REFRESH_SECRET=another_long_random_string_here
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
DATABASE_URL=file:./dev.db
PORT=4000
```

### Frontend — `FRONTEND/.env.local`

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
VITE_API_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## 3. Set Up Google OAuth (for Sign-In with Google)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Enable **"Google Identity Services"**
3. Navigate to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Add Authorized JavaScript origins:
   - `http://localhost:5173` (dev)
   - `https://your-frontend.vercel.app` (prod)
6. Copy the **Client ID** → paste into both `.env` files above

---

## 4. Database Setup

The project uses **SQLite** via Prisma. The database file is created automatically.

```bash
cd BACKEND
npx prisma db push        # Apply schema to dev.db
node seed.js              # Seed products, brands, and admin user
```

**Admin credentials after seeding:**
| Field | Value |
|-------|-------|
| Email | admin@vasavitraders.com |
| Password | admin123 |

---

## 5. Run the Development Servers

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd BACKEND
npm run dev
# → Server running on http://localhost:4000
```

**Terminal 2 — Frontend:**
```bash
cd FRONTEND
npm run dev
# → App running on http://localhost:5173
```

---

## 6. OTP Testing (Development)

Phone OTP is simulated in development mode. When you click **Send OTP**:
1. The OTP is printed to the **backend console** log
2. The OTP is also returned in the API response as `dev_otp` and shown on the login page

To wire in a real SMS provider (e.g., MSG91, Twilio), edit `BACKEND/server.js` at the `POST /api/auth/send-otp` route and replace the console.log line with your SMS API call.

---

## 7. Features Overview

| Feature | Route |
|---------|-------|
| Home | `/` |
| Products Catalog | `/products` |
| Login / Register | `/login` |
| My Dashboard | `/user-dashboard` |
| Contact | `/contact` |
| Nova AI Assistant | `/nova` |
| Admin Dashboard | `/admin-dashboard` |

---

## 8. API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register new user |
| POST | `/api/auth/login` | None | Email + password login |
| POST | `/api/auth/google` | None | Google OAuth login |
| POST | `/api/auth/send-otp` | None | Send phone OTP |
| POST | `/api/auth/verify-otp` | None | Verify OTP → JWT |
| POST | `/api/auth/refresh` | None | Refresh access token |
| GET | `/api/auth/me` | JWT | Get current user |
| GET | `/api/products` | None | List all products |
| POST | `/api/reservations` | Optional JWT | Create reservation |
| GET | `/api/reservations` | None | Get reservations (filter by phone/userId/status) |
| PATCH | `/api/reservations/:id/status` | None | Update order status |
| POST | `/api/nova` | None | Nova AI query |
