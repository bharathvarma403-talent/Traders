# Deployment Guide

## Recommended Architecture

- Frontend: Vercel
- Backend API: Render, Railway, Fly.io, or another Node host
- Database: Managed PostgreSQL
- Static uploads: local disk for development only; move to object storage for production if uploads must persist across redeploys

## Backend Deployment

Deploy the `BACKEND` folder as a Node service.

Suggested commands:

- Build command: `npm install && npm run build`
- Start command: `npm start`

Required environment variables:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://...
FRONTEND_URL=https://your-frontend-domain.vercel.app
JWT_SECRET=long-random-secret
JWT_REFRESH_SECRET=second-long-random-secret
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Optional one-time admin bootstrap:

```env
BOOTSTRAP_ADMIN_NAME=Production Admin
BOOTSTRAP_ADMIN_EMAIL=admin@yourdomain.com
BOOTSTRAP_ADMIN_PASSWORD=use-a-strong-password-here
```

Important:

- The server no longer creates a default admin automatically unless the bootstrap admin env vars are set.
- Run `npx prisma migrate deploy` for production migrations, or `npx prisma db push` only for controlled non-production environments.
- Do not use SQLite for production. The app is now configured for PostgreSQL.
- Local disk uploads can be lost on stateless deployments. For production-grade persistence, move uploads to S3, Cloudinary, or another object store.

## Frontend Deployment

Deploy the `FRONTEND` folder as a Vite app.

Required environment variables:

```env
VITE_API_URL=https://your-backend-domain.com
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## Google OAuth Setup

In Google Cloud Console, add:

- Local origin: `http://localhost:5173`
- Production origin: `https://your-frontend-domain.vercel.app`

If you use redirect-based flows later, also add the matching redirect URI.

## Production Checklist

- Backend starts without falling back to generated secrets.
- `JWT_SECRET` and `JWT_REFRESH_SECRET` are both set.
- `FRONTEND_URL` exactly matches the deployed frontend origin.
- Database migrations have been applied successfully.
- Admin account exists through bootstrap env vars or a controlled seed process.
- Product image uploads are backed by persistent storage if needed.
- Frontend uses the live backend `VITE_API_URL`.
- Google Sign-In works on the final domain.
- Reservation listing is verified for both admin and normal users.

## Post-Deploy Smoke Tests

- Load `/products` and confirm catalog data renders.
- Log in as a normal user and place a reservation.
- Confirm the user can only see their own reservations.
- Log in as an admin and confirm admin dashboard access works.
- Update a reservation status and verify the customer view reflects it.
- Create and edit a product with an image upload.
- Confirm browser console is clean during the main flows.
