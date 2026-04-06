# Local Development Setup

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- ORM: Prisma
- Database: PostgreSQL

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 14+

## 1. Install Dependencies

```bash
cd BACKEND
npm install

cd ../FRONTEND
npm install
```

## 2. Configure Environment Variables

### Backend

Copy `BACKEND/.env.example` to `BACKEND/.env` and set:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vasavi_traders
FRONTEND_URL=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-second-long-random-secret
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Optional bootstrap admin for local or first production deploy:

```env
BOOTSTRAP_ADMIN_NAME=Vasavi Admin
BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_ADMIN_PASSWORD=use-a-strong-password-here
```

### Frontend

Create `FRONTEND/.env.local`:

```env
VITE_API_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## 3. Prepare the Database

```bash
cd BACKEND
npx prisma generate
npx prisma db push
```

To load sample products, brands, and a local admin account:

```bash
npm run seed
```

Notes:

- `npm run seed` now generates a temporary admin password unless `SEED_ADMIN_PASSWORD` is explicitly set.
- The generated password is printed once in the terminal that runs the seed command.
- Do not use generated or seeded credentials unchanged in production.

Optional local auth demo users:

```bash
npm run seed:auth
```

Optional env vars for seed scripts:

```env
SEED_ADMIN_EMAIL=vasavi@admin.com
SEED_ADMIN_PASSWORD=use-a-strong-password-here
SEED_USER_EMAIL=user@vasavitraders.com
SEED_USER_PASSWORD=use-a-strong-password-here
```

## 4. Start the App

In one terminal:

```bash
cd BACKEND
npm run dev
```

In another terminal:

```bash
cd FRONTEND
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## 5. Development Notes

- OTP login is simulated in development. The backend logs the OTP and also returns `dev_otp` only when `NODE_ENV` is not `production`.
- `GET /api/reservations` is now authenticated. Admins can see all reservations; regular users only see their own.
- Product create and update flows require a single `price` and `unit`; price ranges are no longer supported.
- Uploaded product images are limited to `jpeg`, `png`, `webp`, and `avif`, with a 5 MB size limit.

## 6. Core Routes

- `/` Home
- `/products` Product catalog
- `/login` Login and registration
- `/orders` Authenticated order history
- `/admin/dashboard` Admin console
- `/contact` Contact page
- `/nova` AI assistant
