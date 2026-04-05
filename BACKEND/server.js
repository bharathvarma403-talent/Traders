require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── ENV VALIDATION ─────────────────────────────────────
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    console.error("❌ Missing JWT secrets");
    process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// ─── INIT ───────────────────────────────────────────────
const app = express();
const prisma = new PrismaClient();

// DB connection check
prisma.$connect()
    .then(() => console.log("✅ Database connected"))
    .catch((err) => {
        console.error("❌ DB connection failed:", err);
        process.exit(1);
    });

// ─── CREATE UPLOAD FOLDER ───────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// ─── MIDDLEWARE ─────────────────────────────────────────
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// ─── CORS ───────────────────────────────────────────────
app.use(cors({
    origin: "*", // you can restrict later
}));

// Static files
app.use('/uploads', express.static(uploadDir));

// ─── MULTER ─────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) =>
        cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// ─── ROOT ROUTE (IMPORTANT) ─────────────────────────────
app.get("/", (req, res) => {
    res.send("🚀 Vasavi Traders Backend is Running Successfully!");
});

// ─── HEALTH ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// ─── SAMPLE ROUTE (TEST) ────────────────────────────────
app.get('/api/test', (req, res) => {
    res.json({ message: "API working perfectly 🚀" });
});

// ─── ERROR HANDLER ──────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
});

// ─── START SERVER ───────────────────────────────────────
const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});