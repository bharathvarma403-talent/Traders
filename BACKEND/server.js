require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const prisma = new PrismaClient();
const isProduction = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Ensure uploads folder exists (Render fix)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ─── Config ────────────────────────────────────────────────────────────────
const readSecret = (name) => {
    const configured = String(process.env[name] || '').trim();
    if (configured) return configured;

    if (isProduction) {
        throw new Error(`${name} environment variable is required in production.`);
    }

    const generated = crypto.randomBytes(32).toString('hex');
    console.warn(`[config] ${name} is not set. Generated an ephemeral development secret.`);
    return generated;
};

const JWT_SECRET = readSecret('JWT_SECRET');
const JWT_REFRESH_SECRET = readSecret('JWT_REFRESH_SECRET');
const GOOGLE_CLIENT_IDS = [...new Set(
    [
        process.env.GOOGLE_CLIENT_IDS,
        process.env.GOOGLE_CLIENT_ID,
        process.env.VITE_GOOGLE_CLIENT_ID,
    ]
        .flatMap((value) => String(value || '').split(','))
        .map((value) => value.trim())
        .filter(Boolean)
        .filter((value) => /^[a-z0-9_-]+\.apps\.googleusercontent\.com$/i.test(value))
)];
const GOOGLE_CLIENT_ID = GOOGLE_CLIENT_IDS[0] || null;
const googleClient = new OAuth2Client();

const RESERVATION_STATUS_VALUES = ['Pending', 'Accepted', 'Rejected', 'Completed'];
const RESERVATION_STATUSES = new Set(RESERVATION_STATUS_VALUES);
const STOCK_STATUS_VALUES = ['In Stock', 'Out of Stock'];
const allowedUploadMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

// ─── In-memory OTP store { phone: { otp, expiry } } ────────────────────────
const otpStore = new Map();
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// ─── CORS ──────────────────────────────────────────────────────────────────
const configuredOrigins = String(process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const isAllowedOrigin = (origin) => {
    if (!origin) return true;
    if (configuredOrigins.includes(origin)) return true;
    if (!isProduction && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin)) {
        return true;
    }
    return false;
};

app.use((req, res, next) => {
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
});

app.use(cors({
    origin(origin, callback) {
        if (isAllowedOrigin(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(uploadDir));

// ─── Multer Storage Config ─────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(
            null,
            Date.now() +
            '-' +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname).toLowerCase()
        );
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter(req, file, cb) {
        if (!allowedUploadMimeTypes.has(file.mimetype)) {
            return cb(new Error('Only JPG, PNG, WebP, and AVIF images are allowed.'));
        }
        return cb(null, true);
    },
});

// ─── Rate Limiters ─────────────────────────────────────────────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { error: 'Too many OTP requests. Please wait 10 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── Zod Schemas ───────────────────────────────────────────────────────────
const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    password: z.string().length(6, 'Password must be exactly 6 digits').regex(/^\d{6}$/, 'Password must be 6 digits'),
    phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number').optional(),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'Password is required'),
});

const loginPhoneSchema = z.object({
    phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number'),
    password: z.string().min(1, 'Password is required'),
});

const sendOtpSchema = z.object({
    phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number'),
});

const verifyOtpSchema = z.object({
    phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
});

const parseDateOnly = (value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return null;
    const parsed = new Date(`${trimmed}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const reservationSchema = z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive('Quantity must be at least 1'),
    pickupDate: z.string().trim().refine((value) => {
        const parsed = parseDateOnly(value);
        if (!parsed) return false;
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return parsed >= startOfToday;
    }, 'Pickup date must be today or later'),
    phoneNumber: z.string().regex(/^\+?[0-9]{7,15}$/, 'A valid phone number is required to place an order'),
    notes: z.string().trim().max(500).optional(),
});

const stockUpdateSchema = z.object({
    stockStatus: z.enum(STOCK_STATUS_VALUES).optional(),
    stockCount: z.coerce.number().int().min(0).optional(),
}).refine((value) => value.stockStatus !== undefined || value.stockCount !== undefined, {
    message: 'No valid fields to update.',
});

const productUpsertSchema = z.object({
    name: z.string().trim().min(2, 'Product name is required.').max(120),
    category: z.string().trim().min(2, 'Category is required.').max(60),
    subcategory: z.string().trim().min(2, 'Subcategory is required.').max(80),
    unit: z.string().trim().min(1, 'Unit is required.').max(30),
    description: z.string().trim().min(10, 'Description must be at least 10 characters.').max(1000),
    price: z.coerce.number().positive('Price must be greater than zero.'),
    brandName: z.string().trim().min(2, 'Brand is required.').max(100),
    stockCount: z.coerce.number().int().min(0).optional(),
});

// ─── Validation Middleware Factory ─────────────────────────────────────────
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const msg = result.error.issues.map((e) => e.message).join('; ');
        return res.status(400).json({ error: msg });
    }
    req.validatedBody = result.data;
    next();
};

const parseWithSchema = (schema, payload) => {
    const result = schema.safeParse(payload);
    if (!result.success) {
        return { error: result.error.issues.map((issue) => issue.message).join('; ') };
    }
    return { data: result.data };
};

// ─── Auth Middleware ────────────────────────────────────────────────────────
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
};

const optionalAuthenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        try {
            req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        } catch {
            // ignore
        }
    }
    next();
};

const authorize = (roles = []) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
};

// ─── Token Helpers ─────────────────────────────────────────────────────────
const signAccessToken = (user) =>
    jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

const signRefreshToken = (user) =>
    jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

const safeUser = (u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone ?? null, role: u.role });
const normalizeEmail = (value = '') => value.trim().toLowerCase();
const isGoogleClientId = (value = '') => /^[a-z0-9_-]+\.apps\.googleusercontent\.com$/i.test(String(value).trim());

const findUserByEmail = async (email) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return null;

    const exactMatch = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exactMatch) return exactMatch;

    const [caseInsensitiveMatch] = await prisma.$queryRaw`
        SELECT *
        FROM "User"
        WHERE LOWER("email") = LOWER(${normalizedEmail})
        LIMIT 1
    `;

    return caseInsensitiveMatch || null;
};

// ─── Enrichment Helpers ────────────────────────────────────────────────────
const enrichReservations = async (reservations) => {
    const productIds = [...new Set(reservations.map((r) => r.productId).filter(Boolean))];
    const products = productIds.length
        ? await prisma.product.findMany({ where: { id: { in: productIds } }, include: { brand: true } })
        : [];
    const productMap = new Map(products.map((p) => [p.id, p]));

    const userIds = [...new Set(reservations.map((r) => r.userId).filter(Boolean))];
    const users = userIds.length
        ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true, phone: true } })
        : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return reservations.map((r) => ({
        ...r,
        product: productMap.get(r.productId) || null,
        linkedUser: r.userId ? (userMap.get(r.userId) || null) : null,
        email: r.email || (r.userId ? userMap.get(r.userId)?.email : null) || null,
    }));
};

// ─── Update lastLoginAt helper ─────────────────────────────────────────────
const updateLastLogin = async (userId) => {
    try {
        await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
    } catch { /* non-critical */ }
};

const formatCurrency = (value) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const LEGACY_PRODUCT_ALIASES = {
    'UltraTech PPC': 'PPC Blended Cement',
    'UltraTech OPC': 'OPC 53 Grade Cement',
    'KCP Cement': 'OPC 53 Grade Cement',
    'Walker Cement': 'PPC Blended Cement',
    'Birla White': 'Acrylic Wall Putty',
    'Asian Paints (Emulsion)': 'Royal Emulsion Interior Paint',
    'ACC Primer': 'Royal Emulsion Interior Paint',
    'Apex Primer': 'WeatherCoat Exterior Paint',
    'Cooling Paints': 'WeatherCoat Exterior Paint',
    'Paint Brushes': 'Professional Paint Roller 9-Inch',
    '1/18 Wire (~1-1.5 sqmm)': 'FR PVC Insulated Wire 1.5 sqmm',
    'Wire 2.5 sqmm': 'FR PVC Insulated Wire 2.5 sqmm',
    'Wire 4.0 sqmm': 'FR PVC Insulated Wire 2.5 sqmm',
    '6A Switch': 'Penta 6A 1-Way Switch',
    '16A Switch': 'MCB 32A Double Pole',
    'MCB': 'MCB 32A Double Pole',
    'Ceiling Fan': 'High Speed Ceiling Fan 1200mm',
    '3/4 inch CPVC Pipe': 'CPVC SDR 11 Pipe 1-Inch',
    '1 inch CPVC Pipe': 'CPVC SDR 11 Pipe 1-Inch',
    'L Bend Fitting': 'Brass Ball Valve 1-Inch',
    'T Bend Fitting': 'Brass Ball Valve 1-Inch',
    '3 inch PVC Pipe': 'UPVC Schedule 40 Pipe 2-Inch',
    '4 inch PVC Pipe': 'UPVC Schedule 40 Pipe 2-Inch',
    '1000 L Tank': 'Triple Layer Water Tank 1000L',
};

const resolveRecommendedProductNames = (products) => [...new Set(
    [...products].map((name) => LEGACY_PRODUCT_ALIASES[name] || name)
)];

// ═══════════════════════════════════════════════════════════════════════════╗
//  NOVA AI — Construction Knowledge Engine
// ═══════════════════════════════════════════════════════════════════════════╝

const CONSTRUCTION_KNOWLEDGE = {
    plastering: {
        keywords: ['plaster', 'plastering', 'ప్లాస్టర్', 'wall plaster', 'rendering'],
        en: `**Plastering Guide:**\n• Internal walls: Use cement:sand ratio of 1:4 (PPC cement recommended)\n• External walls: Use 1:3 ratio with waterproofing additive\n• Thickness: 12-15mm for internal, 15-20mm for external\n• Cure for minimum 7 days by keeping the surface moist\n• Use UltraTech PPC for best plastering results`,
        te: `ప్లాస్టరింగ్ గైడ్:\n• లోపలి గోడలు: సిమెంట్:ఇసుక నిష్పత్తి 1:4 (PPC సిమెంట్ ఉత్తమం)\n• బయటి గోడలు: 1:3 నిష్పత్తి వాటర్‌ప్రూఫింగ్‌తో\n• మందం: లోపల 12-15mm, బయట 15-20mm\n• కనీసం 7 రోజులు నీటితో క్యూరింగ్ చేయండి`,
        products: ['UltraTech PPC', 'Birla White']
    },
    cement_mix: {
        keywords: ['cement mix', 'mix ratio', 'concrete', 'cement ratio', 'సిమెంట్', 'concrete mix', 'mortar'],
        en: `**Cement & Concrete Mix Ratios:**\n• M10 (Lean Mix): 1:3:6 (cement:sand:aggregate) — For foundations\n• M15 (Standard): 1:2:4 — For general construction\n• M20 (Structural): 1:1.5:3 — For RCC slabs, beams, columns\n• M25 (High Strength): 1:1:2 — For heavy load structures\n• For 1000 sq ft slab (5" thick): ~200 bags of cement, 40 cubic ft sand, 80 cubic ft aggregate\n• Always use OPC cement for structural work (UltraTech OPC recommended)`,
        te: `సిమెంట్ & కాంక్రీట్ మిక్స్ రేషియోలు:\n• M10: 1:3:6 — పునాదులకు\n• M15: 1:2:4 — సాధారణ నిర్మాణానికి\n• M20: 1:1.5:3 — RCC స్లాబ్‌లు, బీమ్‌లు\n• M25: 1:1:2 — భారీ భారం నిర్మాణాలకు\n• 1000 చ.అ. స్లాబ్‌కు: ~200 సిమెంటు సంచులు అవసరం`,
        products: ['UltraTech OPC', 'KCP Cement', 'Walker Cement']
    },
    brick_laying: {
        keywords: ['brick', 'bricklaying', 'bonding pattern', 'ఇటుకలు', 'masonry', 'brick work'],
        en: `**Brick Laying & Bonding:**\n• English Bond: Alternating header and stretcher courses — strongest bond\n• Flemish Bond: Headers and stretchers in same course — decorative + strong\n• Stretcher Bond: All stretchers — used for partition walls\n• Mortar: Use 1:4 cement:sand ratio for brick mortar\n• Soak bricks in water for 2 hours before laying\n• Standard brick size: 230 x 110 x 75 mm\n• ~500 bricks per 100 sq ft for 9" wall`,
        te: `ఇటుక పనులు & బాండింగ్:\n• ఇంగ్లిష్ బాండ్: హెడర్ మరియు స్ట్రెచర్ మార్చి — బలమైన\n• ఫ్లెమిష్ బాండ్: అలంకార + బలమైన\n• మోర్టార్: 1:4 సిమెంట్:ఇసుక నిష్పత్తి\n• ఇటుకలను 2 గంటలు నీటిలో నానబెట్టండి`,
        products: ['KCP Cement', 'UltraTech PPC']
    },
    waterproofing: {
        keywords: ['waterproof', 'waterproofing', 'leak', 'leakage', 'వాటర్‌ప్రూఫ్', 'seepage', 'water seepage', 'dampness'],
        en: `**Waterproofing Systems:**\n• Terrace: Apply polymer-modified cement coating (Dr. Fixit or Fosroc)\n• Bathroom: Use waterproofing membrane before tiling, especially at joints\n• Basement: External membrane + drainage + sump pump\n• Foundation: Bitumen coating on external face\n• Expansion joints: Use PU sealant\n• For old terraces: Clean + prime + 2 coats of elastomeric waterproofing\n• Always maintain slope (1:100) for water drainage`,
        te: `వాటర్‌ప్రూఫింగ్ వ్యవస్థలు:\n• టెర్రస్: పాలిమర్ సిమెంట్ కోటింగ్ వేయండి\n• బాత్రూమ్: టైలింగ్ ముందు మెంబ్రేన్ వాడండి\n• బేస్మెంట్: బయటి మెంబ్రేన్ + డ్రైనేజ్\n• ఎప్పుడూ నీటి ప్రవాహానికి వాలు (1:100) ఉంచండి`,
        products: ['UltraTech OPC', 'Birla White']
    },
    flooring: {
        keywords: ['floor', 'flooring', 'tile', 'marble', 'granite', 'vitrified', 'ceramic', 'టైల్', 'నేల'],
        en: `**Flooring Guide:**\n• Vitrified tiles: Best for living areas, low maintenance, 60x60 or 80x80 cm\n• Ceramic tiles: Budget-friendly, good for bathrooms and kitchens\n• Marble: Premium look, needs regular polishing, avoid in kitchens\n• Granite: Extremely durable, ideal for high-traffic areas and staircases\n• Laying: Use 1:3 cement:sand bed + tile adhesive for vitrified\n• Grout: Use epoxy grout for bathrooms, cement grout for dry areas\n• Spacers: 2mm for rectified tiles, 3-5mm for rustic`,
        te: `ఫ్లోరింగ్ గైడ్:\n• విట్రిఫైడ్ టైల్స్: లివింగ్ ఏరియాలకు ఉత్తమం\n• సిరామిక్ టైల్స్: బడ్జెట్ ఫ్రెండ్లీ, బాత్రూమ్‌లకు\n• మార్బుల్: ప్రీమియం, క్రమం తప్పకుండా పాలిష్ అవసరం\n• గ్రానైట్: అత్యంత మన్నికైన, సిడిరి భాగాలకు`,
        products: ['UltraTech OPC', 'Birla White']
    },
    paint: {
        keywords: ['paint', 'painting', 'primer', 'emulsion', 'పెయింట్', 'రంగు', 'distemper', 'texture'],
        en: `**Paint & Coating Guide:**\n• Interior: Use acrylic emulsion (Asian Paints Tractor Emulsion or Royale)\n• Exterior: Weather-resistant exterior emulsion with anti-fungal\n• Primer: Always apply 1 coat of primer before painting — use ACC or Apex Primer\n• Sequence: Putty (2 coats) → Primer (1 coat) → Emulsion (2-3 coats)\n• For new walls: Wait 28 days after plastering before painting\n• Anti-fungal: Use in high-humidity areas (bathrooms, kitchens)\n• Cooling paints: Reduce roof temperature by 5-8°C\n• Paint peeling causes: Moisture, poor primer, painting on damp wall`,
        te: `పెయింట్ & కోటింగ్ గైడ్:\n• లోపల: ఆక్రిలిక్ ఎమల్షన్ వాడండి\n• బయట: వెదర్-రెసిస్టెంట్ ఎక్స్‌టీరియర్ ఎమల్షన్\n• ప్రైమర్: పెయింట్ ముందు ఒక కోటు ప్రైమర్ తప్పనిసరి\n• క్రమం: పుట్టీ → ప్రైమర్ → ఎమల్షన్ (2-3 కోట్లు)\n• కొత్త గోడలు: ప్లాస్టరింగ్ తర్వాత 28 రోజులు వేచి ఉండండి`,
        products: ['Asian Paints (Emulsion)', 'ACC Primer', 'Apex Primer', 'Cooling Paints', 'Paint Brushes']
    },
    cracks: {
        keywords: ['crack', 'cracked', 'wall crack', 'పగుళ్లు', 'structural crack', 'hairline'],
        en: `**Crack Analysis & Repair:**\n• Hairline cracks (<1mm): Non-structural. Fill with crack filler putty, then prime and paint\n• Settlement cracks (1-5mm): May indicate foundation issue. Monitor for 3 months\n• Structural cracks (>5mm, diagonal): SERIOUS — consult structural engineer immediately\n• Plaster cracks: Remove loose plaster, re-plaster with 1:3 mix, cure 7 days\n• Thermal cracks: Caused by heat expansion. Use flexible sealant\n• Prevention: Proper curing, expansion joints every 30m, wire mesh at junctions`,
        te: `పగుళ్ల విశ్లేషణ & మరమ్మత్తు:\n• హెయిర్‌లైన్ పగుళ్లు (<1mm): ప్రమాదకరం కాదు. క్రాక్ ఫిల్లర్ పుట్టీతో పూడ్చండి\n• సెటిల్‌మెంట్ పగుళ్లు (1-5mm): పునాది సమస్య. 3 నెలలు పర్యవేక్షించండి\n• స్ట్రక్చరల్ క్రాక్స్ (>5mm): తీవ్రమైన — ఇంజనీర్‌ను సంప్రదించండి`,
        products: ['Birla White', 'UltraTech PPC']
    },
    roof: {
        keywords: ['roof', 'roofing', 'terrace', 'slab', 'పైకప్పు', 'roof repair', 'roof leak'],
        en: `**Roof & Terrace Repair:**\n• Slab casting: Use M20 mix (1:1.5:3), minimum 5" thickness for residential\n• Steel reinforcement: 8mm and 10mm TMT bars in both directions\n• Curing: Keep wet for 14-21 days minimum\n• Waterproofing: Apply 2 coats of polymer coating after curing\n• Roof tiles: Clay tiles last 50+ years, concrete tiles 30+ years\n• Leak repair: Identify source, chip plaster, apply waterproof coating, re-plaster`,
        te: `పైకప్పు & టెర్రస్ మరమ్మత్తు:\n• స్లాబ్: M20 మిక్స్ (1:1.5:3), కనీసం 5" మందం\n• స్టీల్: 8mm మరియు 10mm TMT బార్లు\n• క్యూరింగ్: కనీసం 14-21 రోజులు తడిగా ఉంచండి\n• వాటర్‌ప్రూఫింగ్: 2 కోట్లు పాలిమర్ కోటింగ్`,
        products: ['UltraTech OPC', 'KCP Cement']
    },
    damp: {
        keywords: ['damp', 'moisture', 'seepage', 'efflorescence', 'తేమ', 'fungus', 'mold', 'mould'],
        en: `**Damp, Seepage & Efflorescence:**\n• Rising damp: Inject DPC (Damp Proof Course) at plinth level\n• Seepage through walls: Apply external waterproof coating\n• Efflorescence (white salt deposits): Brush off, apply dilute HCl acid wash, then seal\n• Anti-fungal treatment: Clean with bleach solution, apply anti-fungal primer\n• Bathroom seepage: Re-do waterproofing membrane + grouting\n• Prevention: Proper drainage slope, DPC at plinth, waterproofing on terraces`,
        te: `తేమ, ఊట & ఎఫ్లోరెసెన్స్:\n• రైజింగ్ డ్యాంప్: ప్లింత్ స్థాయిలో DPC ఇంజెక్ట్ చేయండి\n• గోడల ద్వారా ఊట: బయటి వాటర్‌ప్రూఫ్ కోటింగ్\n• ఎఫ్లోరెసెన్స్: బ్రష్ చేసి, ఆసిడ్ వాష్, సీల్ చేయండి\n• బాత్రూమ్ ఊట: వాటర్‌ప్రూఫింగ్ మెంబ్రేన్ మళ్లీ చేయండి`,
        products: ['Birla White', 'ACC Primer']
    },
    electrical: {
        keywords: ['wire', 'wiring', 'switch', 'socket', 'mcb', 'electrical', 'ఎలక్ట్రికల్', 'fan', 'circuit'],
        en: `**Electrical Installation Guide:**\n• House wiring: Use 1.5 sqmm for lights, 2.5 sqmm for power sockets, 4.0 sqmm for ACs\n• Always use ISI-marked wires (Havells recommended)\n• MCB sizing: 6A for lights, 16A for power, 32A for AC circuits\n• Earthing: Essential for safety — use GI pipe earthing or plate earthing\n• Fan wiring: Use 1.5 sqmm wire with regulator\n• Always use conduit pipes (PVC) for concealed wiring\n• Circuit breaker: Install separate MCBs for each circuit`,
        te: `ఎలక్ట్రికల్ ఇన్‌స్టలేషన్:\n• ఇంటి వైరింగ్: లైట్లకు 1.5 sqmm, సాకెట్లకు 2.5 sqmm, ACలకు 4.0 sqmm\n• ISI మార్క్ వైర్లు వాడండి (Havells ఉత్తమం)\n• MCB సైజింగ్: లైట్లకు 6A, పవర్‌కు 16A, AC కోసం 32A\n• ఎర్తింగ్: భద్రతకు తప్పనిసరి`,
        products: ['1/18 Wire (~1-1.5 sqmm)', 'Wire 2.5 sqmm', 'Wire 4.0 sqmm', '6A Switch', '16A Switch', 'MCB', 'Ceiling Fan']
    },
    pipes: {
        keywords: ['pipe', 'plumbing', 'cpvc', 'pvc', 'fitting', 'పైపు', 'plumber'],
        en: `**Plumbing & Pipes Guide:**\n• Hot water: Use CPVC pipes (Ashirvad brand recommended)\n• Cold water supply: CPVC or uPVC pipes\n• Drainage: Use PVC pipes — 3" for bathroom, 4" for toilet\n• Fittings: L-bend for corners, T-bend for branch connections\n• Pipe jointing: Use CPVC solvent cement for CPVC, rubber ring for PVC\n• Water tank: 1000L tank for family of 4-5 (200L per person per day)\n• Always test pressure before closing walls`,
        te: `ప్లంబింగ్ & పైపుల గైడ్:\n• వేడి నీరు: CPVC పైపులు (Ashirvad)\n• చల్లని నీరు: CPVC లేదా uPVC\n• డ్రైనేజ్: PVC — బాత్రూమ్‌కు 3", టాయిలెట్‌కు 4"\n• ట్యాంక్: 4-5 మంది కుటుంబానికి 1000L`,
        products: ['3/4 inch CPVC Pipe', '1 inch CPVC Pipe', 'L Bend Fitting', 'T Bend Fitting', '3 inch PVC Pipe', '4 inch PVC Pipe', '1000 L Tank']
    },
    safety: {
        keywords: ['safety', 'site safety', 'precaution', 'helmet', 'భద్రత', 'ppe'],
        en: `**Construction Site Safety:**\n• PPE: Hard hat, safety boots, gloves, high-vis vest mandatory\n• Scaffolding: Check stability daily, use guardrails\n• Electrical work: Always switch off mains before working\n• Excavation: Shore trenches deeper than 4 feet\n• First aid kit: Must be available on site at all times\n• Fire extinguisher: Keep near welding/cutting areas\n• No work during thunderstorms or heavy rain`,
        te: `నిర్మాణ స్థల భద్రత:\n• PPE: హార్డ్ హ్యాట్, సేఫ్టీ బూట్లు, గ్లోవ్స్ తప్పనిసరి\n• స్కాఫోల్డింగ్: రోజూ స్థిరత్వం చెక్ చేయండి\n• ఎలక్ట్రికల్ పని: ముందు మెయిన్స్ ఆఫ్ చేయండి\n• ఫస్ట్ ఎయిడ్ కిట్: ఎప్పుడూ అందుబాటులో ఉండాలి`
    },
    wood: {
        keywords: ['wood', 'timber', 'termite', 'చెక్క', 'wood treatment', 'polish'],
        en: `**Wood Treatment & Care:**\n• Termite prevention: Apply anti-termite chemical at foundation level\n• Wood polish: Use melamine or PU polish for doors and furniture\n• Teak wood: Best for doors and windows (most termite-resistant)\n• Plywood: Use marine plywood (BWP) for bathroom cabinets\n• Wood seasoning: Air-dry for 6 months or kiln-dry before use\n• Maintenance: Re-polish every 3-5 years`,
        te: `చెక్క చికిత్స & సంరక్షణ:\n• చెదపురుగు నివారణ: పునాది స్థాయిలో యాంటీ-టెర్మైట్ కెమికల్\n• టేకు: తలుపులు మరియు కిటికీలకు ఉత్తమం\n• ప్లైవుడ్: బాత్రూమ్ క్యాబినెట్లకు BWP మెరైన్ ప్లైవుడ్`
    },
    corrosion: {
        keywords: ['rust', 'corrosion', 'iron', 'metal', 'తుప్పు', 'steel', 'rebar'],
        en: `**Metal & Iron Corrosion Prevention:**\n• TMT rebars: Apply anti-corrosive primer before embedding in concrete\n• Iron gates: Sand blast → zinc primer → enamel paint (2 coats)\n• Window grills: Use galvanized steel or apply regular paint every 2 years\n• Red oxide primer: Essential base coat for all metal surfaces\n• Stainless steel: Best for coastal areas (no rusting)\n• Concrete cover: Maintain minimum 25mm cover over rebars to prevent corrosion`,
        te: `లోహం & ఇనుము తుప్పు నివారణ:\n• TMT రీబార్లు: కాంక్రీట్‌లో ఉంచే ముందు యాంటీ-కరోసివ్ ప్రైమర్\n• ఇనుప గేట్లు: జింక్ ప్రైమర్ → ఎనామెల్ పెయింట్ (2 కోట్లు)\n• రెడ్ ఆక్సైడ్ ప్రైమర్: అన్ని లోహ ఉపరితలాలకు తప్పనిసరి`,
        products: ['ACC Primer', 'Apex Primer']
    },
};

const processNovaQuery = async (query) => {
    const q = query.toLowerCase();
    let matchedTopics = [];
    let recommendedProducts = new Set();

    // Find matching topics
    for (const [topic, data] of Object.entries(CONSTRUCTION_KNOWLEDGE)) {
        for (const keyword of data.keywords) {
            if (q.includes(keyword.toLowerCase())) {
                matchedTopics.push(data);
                if (data.products) {
                    data.products.forEach(p => recommendedProducts.add(p));
                }
                break;
            }
        }
    }

    // If no specific topic matched, provide a general response
    if (matchedTopics.length === 0) {
        // Check if it's a greeting
        if (q.match(/\b(hi|hello|hey|నమస్కారం|నమస్తే|హాయ్)\b/i)) {
            return {
                en: "Hello! I'm Nova, your AI construction assistant at Vasavi Traders. I can help you with:\n• Cement mix ratios & material estimation\n• Plastering, brick laying & waterproofing\n• Paint selection, primers & coatings\n• Electrical wiring & plumbing\n• Crack analysis & repair\n• Flooring, roofing & damp treatment\n• Wood treatment & metal corrosion prevention\n• Construction site safety\n\nAsk me anything about construction!",
                te: "నమస్కారం! నేను నోవా, వసవి ట్రేడర్స్ AI నిర్మాణ సహాయకురాలిని. సిమెంట్ మిక్స్ రేషియోలు, ప్లాస్టరింగ్, వాటర్‌ప్రూఫింగ్, పెయింట్, ఎలక్ట్రికల్, ప్లంబింగ్, పగుళ్ల మరమ్మత్తు మరియు మరిన్ని విషయాలలో నేను మీకు సహాయపడగలను. నిర్మాణం గురించి ఏదైనా అడగండి!",
                products: []
            };
        }

        return {
            en: `I understand you're asking about "${query}". While I specialize in construction topics, let me help you:\n\n**Common Construction Topics I Cover:**\n• Cement, concrete & mortar mix ratios\n• Plastering, brick laying, and masonry\n• Waterproofing & damp treatment\n• Paint, primers & protective coatings\n• Electrical wiring & plumbing\n• Crack diagnosis & repair\n• Flooring (marble, granite, tiles)\n• Roof repair & structural work\n• Wood treatment & metal corrosion\n• Construction site safety\n\nPlease try asking about any of these topics!`,
            te: `"${query}" గురించి మీ ప్రశ్న అర్థమైంది. నేను నిర్మాణ విషయాలలో ప్రత్యేకత కలిగి ఉన్నాను. దయచేసి సిమెంట్, ప్లాస్టరింగ్, వాటర్‌ప్రూఫింగ్, పెయింట్, ఎలక్ట్రికల్, ప్లంబింగ్ వంటి అంశాల గురించి అడగండి.`,
            products: []
        };
    }

    // Build response from matched topics
    const enParts = matchedTopics.map(t => t.en);
    const teParts = matchedTopics.map(t => t.te);

    // Fetch product details for recommendations
    let productDetails = [];
    if (recommendedProducts.size > 0) {
        try {
            const resolvedNames = resolveRecommendedProductNames(recommendedProducts);
            const products = await prisma.product.findMany({
                where: { name: { in: resolvedNames } },
                include: { brand: true },
            });
            productDetails = products.map(p => ({
                name: p.name,
                brand: p.brand?.name,
                price: formatCurrency(p.price),
                inStock: p.stockStatus === 'In Stock',
            }));
        } catch { /* non-critical */ }
    }

    let enResponse = enParts.join('\n\n');
    let teResponse = teParts.join('\n\n');

    if (productDetails.length > 0) {
        enResponse += `\n\n**📦 Recommended from Vasavi Traders:**\n`;
        enResponse += productDetails.map(p =>
            `• ${p.name} (${p.brand}) — ${p.price} ${p.inStock ? '✅ In Stock' : '❌ Out of Stock'}`
        ).join('\n');

        teResponse += `\n\n📦 వసవి ట్రేడర్స్ నుండి సిఫారసు:\n`;
        teResponse += productDetails.map(p =>
            `• ${p.name} (${p.brand}) — ${p.price} ${p.inStock ? '✅ స్టాక్‌లో ఉంది' : '❌ స్టాక్‌లో లేదు'}`
        ).join('\n');
    }

    return { en: enResponse, te: teResponse, products: productDetails };
};

// ═══════════════════════════════════════════════════════════════════════════╗
//  AUTH ROUTES
// ═══════════════════════════════════════════════════════════════════════════╝

// ── Register ────────────────────────────────────────────────────────────────
app.post('/api/auth/register', authLimiter, validate(registerSchema), async (req, res) => {
    const { name, email, password, phone } = req.validatedBody;

    try {
        const normalizedEmail = normalizeEmail(email);
        const existingEmail = await findUserByEmail(normalizedEmail);
        const existingPhone = phone ? await prisma.user.findUnique({ where: { phone } }) : null;
        
        const existingUser = existingEmail || existingPhone;

        if (existingUser) {
            // Auto-login only when the existing account has a local password.
            const isMatch = existingUser.password
                ? await bcrypt.compare(password, existingUser.password)
                : false;

            if (isMatch) {
                // Update last login
                await prisma.user.update({ where: { id: existingUser.id }, data: { lastLoginAt: new Date() } });
                const accessToken = signAccessToken(existingUser);
                const refreshToken = signRefreshToken(existingUser);
                return res.status(200).json({ 
                    message: "Welcome back! You are an existing user. Login successful.", 
                    token: accessToken, 
                    refreshToken, 
                    user: safeUser(existingUser) 
                });
            }

            return res.status(409).json({
                error: existingUser.googleId
                    ? 'An account already exists for this email. Please sign in with Google or use the correct local password.'
                    : 'Welcome back! An account already exists. Please log in with the correct password.',
                redirectToLogin: true,
            });
        }

        const hashed = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { name, email: normalizedEmail, password: hashed, phone: phone || null, role: 'USER', lastLoginAt: new Date() },
        });

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);

        res.status(201).json({ token: accessToken, refreshToken, user: safeUser(user) });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// ── Login (email + password) ────────────────────────────────────────────────
app.post('/api/auth/login', authLimiter, validate(loginSchema), async (req, res) => {
    const { email, password } = req.validatedBody;

    try {
        const user = await findUserByEmail(email);
        if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });

        await updateLastLogin(user.id);
        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);

        res.json({ token: accessToken, refreshToken, user: safeUser(user) });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// ── Login (phone + password) ────────────────────────────────────────────────
app.post('/api/auth/login-phone', authLimiter, validate(loginPhoneSchema), async (req, res) => {
    const { phone, password } = req.validatedBody;

    try {
        const user = await prisma.user.findUnique({ where: { phone } });
        if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });

        await updateLastLogin(user.id);
        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);

        res.json({ token: accessToken, refreshToken, user: safeUser(user) });
    } catch (err) {
        console.error('Phone login error:', err);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// ── Google OAuth ────────────────────────────────────────────────────────────
app.post('/api/auth/google', authLimiter, async (req, res) => {
    const { credential, clientId } = req.body;
    if (!credential) return res.status(400).json({ error: 'Credential token required.' });

    // Identify which Client IDs we should trust
    const requestClientId = isGoogleClientId(clientId) ? clientId.trim() : null;
    const allowedGoogleClientIds = [...new Set([
        GOOGLE_CLIENT_ID,
        requestClientId,
        ...GOOGLE_CLIENT_IDS,
    ])].filter(Boolean);

    if (allowedGoogleClientIds.length === 0) {
        return res.status(500).json({
            error: 'Google OAuth is not configured on the server. Please check your BACKEND/.env file.',
        });
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: allowedGoogleClientIds,
        });

        const payload = ticket.getPayload();
        if (!payload?.email || payload.email_verified === false) {
            return res.status(401).json({ error: 'Google account email could not be verified.' });
        }

        const { email, name, sub: googleId } = payload;
        const normalizedEmail = normalizeEmail(email);

        let user = await findUserByEmail(normalizedEmail);

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: normalizedEmail,
                    name: name || normalizedEmail.split('@')[0],
                    googleId,
                    role: 'USER',
                    lastLoginAt: new Date(),
                },
            });
        } else {
            if (!user.googleId) {
                user = await prisma.user.update({ where: { id: user.id }, data: { googleId } });
            }
            await updateLastLogin(user.id);
        }

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);
        res.json({ token: accessToken, refreshToken, user: safeUser(user) });
    } catch (err) {
        console.error('Google Auth Security Error:', {
            message: err.message,
            tokenAudience: err.payload?.aud, // Only available if verification fails due to aud
            allowedAudiences: allowedGoogleClientIds,
        });

        const isAudienceMismatch = /audience|recipient/i.test(err.message || '');
        
        res.status(401).json({
            error: isAudienceMismatch
                ? 'Security Error: Google Client ID mismatch. Please ensure your Vercel and Render environments share the same GOOGLE_CLIENT_ID.'
                : 'Unable to verify your Google sign-in. Your session may have expired or the token is invalid.',
        });
    }
});

// ── Send OTP ────────────────────────────────────────────────────────────────
app.post('/api/auth/send-otp', otpLimiter, validate(sendOtpSchema), async (req, res) => {
    const { phone } = req.validatedBody;
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = Date.now() + OTP_EXPIRY_MS;
    otpStore.set(phone, { otp, expiry });

    if (!isProduction) {
        console.log(`[OTP] Phone: ${phone} -> OTP: ${otp} (expires in 5 min)`);
    }
    res.json({
        message: 'OTP sent successfully.',
        ...(!isProduction && { dev_otp: otp }),
    });
});

// ── Verify OTP ───────────────────────────────────────────────────────────────
app.post('/api/auth/verify-otp', authLimiter, validate(verifyOtpSchema), async (req, res) => {
    const { phone, otp } = req.validatedBody;

    const stored = otpStore.get(phone);
    if (!stored) return res.status(400).json({ error: 'No OTP requested for this number.' });
    if (Date.now() > stored.expiry) {
        otpStore.delete(phone);
        return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    if (stored.otp !== otp) return res.status(400).json({ error: 'Incorrect OTP.' });

    otpStore.delete(phone);

    try {
        let user = await prisma.user.findUnique({ where: { phone } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    name: `User ${phone.slice(-4)}`,
                    email: `${phone.replace(/\+/g, '')}@otp.vasavitraders.com`,
                    phone,
                    role: 'USER',
                    lastLoginAt: new Date(),
                },
            });
        } else {
            await updateLastLogin(user.id);
        }

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);
        res.json({ token: accessToken, refreshToken, user: safeUser(user) });
    } catch (err) {
        console.error('OTP verify error:', err);
        res.status(500).json({ error: 'Verification failed.' });
    }
});

// ── Refresh Token ────────────────────────────────────────────────────────────
app.post('/api/auth/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required.' });

    try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) return res.status(401).json({ error: 'User not found.' });

        const newAccessToken = signAccessToken(user);
        const newRefreshToken = signRefreshToken(user);
        res.json({ token: newAccessToken, refreshToken: newRefreshToken, user: safeUser(user) });
    } catch {
        res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }
});

// ── Get Current User ─────────────────────────────────────────────────────────
app.get('/api/auth/me', authenticate, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json({ user: safeUser(user) });
    } catch {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════╗
//  PRODUCTS
// ═══════════════════════════════════════════════════════════════════════════╝
app.get('/api/products', async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            include: { brand: true },
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        });
        res.json(products);
    } catch (err) {
        console.error('GET /api/products error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── Stock Management (Admin) ────────────────────────────────────────────────
app.patch('/api/products/:id/stock', authenticate, authorize(['ADMIN']), async (req, res) => {
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId)) return res.status(400).json({ error: 'Invalid product id.' });

    const parsed = parseWithSchema(stockUpdateSchema, req.body);
    if (parsed.error) {
        return res.status(400).json({ error: parsed.error });
    }

    const data = {};
    if (parsed.data.stockStatus !== undefined) data.stockStatus = parsed.data.stockStatus;
    if (parsed.data.stockCount !== undefined) {
        data.stockCount = parsed.data.stockCount;
        if (parsed.data.stockStatus === undefined) {
            data.stockStatus = parsed.data.stockCount > 0 ? 'In Stock' : 'Out of Stock';
        }
    }

    try {
        const updated = await prisma.product.update({ where: { id: productId }, data, include: { brand: true } });
        res.json(updated);
    } catch (err) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'Product not found.' });
        console.error('PATCH /api/products/:id/stock error:', err);
        res.status(500).json({ error: 'Failed to update product.' });
    }
});

// ── Add Product (Admin) ─────────────────────────────────────────────────────
app.post('/api/admin/products', authenticate, authorize(['ADMIN']), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Product image is required.' });
        }

        const parsed = parseWithSchema(productUpsertSchema, req.body);
        if (parsed.error) {
            return res.status(400).json({ error: parsed.error });
        }

        const { name, category, subcategory, unit, description, price, brandName, stockCount } = parsed.data;

        // Upsert Brand
        const brand = await prisma.brand.upsert({
            where: { name: brandName },
            update: {},
            create: { name: brandName },
        });

        const imageUrl = req.file ? '/uploads/' + req.file.filename : null;

        const product = await prisma.product.create({
            data: {
                name,
                category,
                subcategory,
                description: description || null,
                price,
                unit,
                brandId: brand.id,
                stockCount: stockCount ?? 100,
                stockStatus: (stockCount ?? 100) > 0 ? 'In Stock' : 'Out of Stock',
                imageUrl,
            },
            include: { brand: true }
        });

        res.status(201).json(product);
    } catch (err) {
        console.error('POST /api/admin/products error:', err);
        res.status(500).json({ error: 'Failed to create product.' });
    }
});

// ── Delete Product (Admin) ──────────────────────────────────────────────────
app.delete('/api/admin/products/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId)) return res.status(400).json({ error: 'Invalid product id.' });
    try {
        await prisma.product.delete({ where: { id: productId } });
        res.json({ message: 'Product deleted successfully.' });
    } catch (err) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'Product not found.' });
        console.error('DELETE /api/admin/products/:id error:', err);
        res.status(500).json({ error: 'Failed to delete product.' });
    }
});

// ── Update Product (Admin) ──────────────────────────────────────────────────
app.put('/api/admin/products/:id', authenticate, authorize(['ADMIN']), upload.single('image'), async (req, res) => {
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId)) return res.status(400).json({ error: 'Invalid product id.' });
    
    try {
        const parsed = parseWithSchema(productUpsertSchema, req.body);
        if (parsed.error) {
            return res.status(400).json({ error: parsed.error });
        }

        const { name, category, subcategory, unit, description, price, brandName, stockCount } = parsed.data;

        // Upsert Brand
        let brandId = null;
        if (brandName) {
            const brand = await prisma.brand.upsert({
                where: { name: brandName },
                update: {},
                create: { name: brandName }
            });
            brandId = brand.id;
        }

        const updateData = {
            name,
            category,
            subcategory,
            description,
            price,
            unit,
            stockCount: stockCount ?? 0,
            stockStatus: (stockCount ?? 0) > 0 ? 'In Stock' : 'Out of Stock',
            brandId
        };

        if (req.file) {
            updateData.imageUrl = `/uploads/${req.file.filename}`;
        }

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: updateData,
            include: { brand: true }
        });

        res.json(updatedProduct);
    } catch (err) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'Product not found.' });
        console.error('PUT /api/admin/products/:id error:', err);
        res.status(500).json({ error: 'Failed to update product.' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════╗
//  RESERVATIONS / ORDERS
// ═══════════════════════════════════════════════════════════════════════════╝
app.post('/api/reservations', authenticate, async (req, res) => {
    const body = {
        ...req.body,
        productId: Number(req.body.productId),
        quantity: Number(req.body.quantity),
    };

    const result = reservationSchema.safeParse(body);
    if (!result.success) {
        const msg = result.error.issues.map((e) => e.message).join('; ');
        return res.status(400).json({ error: msg });
    }

    const { productId, quantity, pickupDate, phoneNumber, notes } = result.data;

    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, name: true, email: true, phone: true } });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const phoneToUse = phoneNumber || user.phone;
        if (!phoneToUse) return res.status(400).json({ error: 'Phone number is required to place an order so the Admin can contact you.' });

        // Check product stock
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return res.status(404).json({ error: 'Product not found.' });
        if (product.stockStatus === 'Out of Stock') return res.status(400).json({ error: 'This product is currently out of stock.' });
        if (quantity > product.stockCount) {
            return res.status(400).json({ error: `Only ${product.stockCount} unit(s) are currently available.` });
        }

        if (phoneToUse !== user.phone) {
            const conflictingUser = await prisma.user.findFirst({
                where: {
                    phone: phoneToUse,
                    NOT: { id: user.id },
                },
                select: { id: true },
            });

            if (conflictingUser) {
                return res.status(409).json({ error: 'That phone number is already linked to another account.' });
            }

            await prisma.user.update({
                where: { id: user.id },
                data: { phone: phoneToUse },
            });
        }

        const pickupDateValue = parseDateOnly(pickupDate);
        if (!pickupDateValue) {
            return res.status(400).json({ error: 'Pickup date must be valid.' });
        }

        const reservation = await prisma.reservation.create({
            data: {
                name: user.name,
                phone: phoneToUse,
                email: user.email,
                userId: req.user.id,
                productId,
                quantity,
                pickupDate: pickupDateValue,
                notes: notes || null,
            },
        });
        const [enriched] = await enrichReservations([reservation]);
        res.status(201).json(enriched);
    } catch (err) {
        console.error('POST /api/reservations error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reservations', authenticate, async (req, res) => {
    const phone = String(req.query.phone || '').trim();
    const status = String(req.query.status || '').trim();
    const userId = req.query.userId ? Number(req.query.userId) : null;
    const where = {};

    if (status) {
        if (!RESERVATION_STATUSES.has(status)) return res.status(400).json({ error: 'Invalid status.' });
        where.status = status;
    }

    if (req.user.role === 'ADMIN') {
        if (phone) where.phone = phone;
        if (userId) where.userId = userId;
    } else {
        where.userId = req.user.id;
    }

    try {
        const reservations = await prisma.reservation.findMany({ where, orderBy: { createdAt: 'desc' } });
        res.json(await enrichReservations(reservations));
    } catch (err) {
        console.error('GET /api/reservations error:', err);
        res.status(500).json({ error: 'Failed to fetch reservations.' });
    }
});

app.patch('/api/reservations/:id/status', authenticate, authorize(['ADMIN']), async (req, res) => {
    const reservationId = Number(req.params.id);
    const nextStatus = String(req.body.status || '').trim();

    if (!Number.isInteger(reservationId)) return res.status(400).json({ error: 'Invalid reservation id.' });
    if (!RESERVATION_STATUSES.has(nextStatus)) return res.status(400).json({ error: 'Invalid status.' });

    try {
        const updated = await prisma.reservation.update({
            where: { id: reservationId },
            data: { status: nextStatus },
        });
        const [enriched] = await enrichReservations([updated]);
        res.json(enriched);
    } catch (err) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'Reservation not found.' });
        console.error('PATCH /api/reservations/:id/status error:', err);
        res.status(500).json({ error: 'Failed to update reservation.' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════╗
//  ADMIN — Users
// ═══════════════════════════════════════════════════════════════════════════╝
app.get('/api/admin/users', authenticate, authorize(['ADMIN']), async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, phone: true, role: true, lastLoginAt: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(users);
    } catch (err) {
        console.error('GET /api/admin/users error:', err);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════╗
//  NOVA AI
// ═══════════════════════════════════════════════════════════════════════════╝
app.post('/api/nova', async (req, res) => {
    const { query, userId } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is missing.' });

    try {
        const result = await processNovaQuery(query);
        const responseText = `${result.en}\n\n---\n\n${result.te}`;
        const record = await prisma.aiQuery.create({ data: { query, response: responseText, userId: userId ?? null } });
        console.log('AI Query record created:', record.id);
        res.json({
            response: responseText,
            en: result.en,
            te: result.te,
            products: result.products || [],
        });
    } catch (err) {
        console.error('POST /api/nova error:', err);
        res.status(500).json({ error: err.message });
    }
});
app.get("/", (req, res) => {
    res.send("API is running 🚀");
});

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: "OK" });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err);
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
    }
    if (err.message?.includes('Only JPG, PNG, WebP, and AVIF images are allowed.')) {
        return res.status(400).json({ error: err.message });
    }
    if (err.message?.includes('not allowed by CORS')) {
        return res.status(403).json({ error: 'Request origin is not allowed.' });
    }
    res.status(500).json({ error: 'An unexpected error occurred.' });
});

// ─── Ensure Default Admin Exists ───────────────────────────────────────────
const ensureAdminExists = async () => {
    try {
        const adminEmail = normalizeEmail(process.env.BOOTSTRAP_ADMIN_EMAIL || '');
        const adminPassword = String(process.env.BOOTSTRAP_ADMIN_PASSWORD || '');
        const adminName = String(process.env.BOOTSTRAP_ADMIN_NAME || 'Vasavi Admin').trim() || 'Vasavi Admin';

        if (!adminEmail || !adminPassword) {
            return;
        }

        const existingAdmin = await prisma.user.findFirst({ where: { email: { equals: adminEmail, mode: 'insensitive' } } });
        if (!existingAdmin) {
            const hashed = await bcrypt.hash(adminPassword, 12);
            await prisma.user.create({
                data: {
                    name: adminName,
                    email: adminEmail,
                    password: hashed,
                    role: 'ADMIN'
                }
            });
            console.log(`Created bootstrap admin: ${adminEmail}`);
        }
    } catch (err) {
        console.error('Failed to create bootstrap admin:', err.message);
    }
};

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await ensureAdminExists();
});

module.exports = app;
