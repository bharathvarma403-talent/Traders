# Vasavi Traders: Complete Technical Codebase Breakdown

This document is a comprehensive, precise technical audit of the Vasavi Traders web application. It is designed for senior engineers taking over the project to understand the architecture, state of completion, and critical areas requiring immediate attention.

## 🖥️ FRONTEND ARCHITECTURE

### Framework & Core Technologies
The frontend is a **Single Page Application (SPA)** built with:
- **React 18.3.1**: Chosen for component-based UI and extensive ecosystem.
- **Vite 5.4.10**: Used as the build tool and development server for fast HMR (Hot Module Replacement) and optimized bundling.
- **Client-Side Routing**: Implemented using `react-router-dom` (v7.13.1).

### Folder & File Structure
```text
FRONTEND/
├── package.json              # Dependencies and Vite scripts
├── postcss.config.js         # PostCSS configuration for Tailwind
├── src/
│   ├── main.jsx              # React mounting entry point (renders <App />)
│   ├── App.jsx               # Defines the <Router> and application page <Route>s
│   ├── index.css             # Global CSS variables, Tailwind tokens, theme definitions
│   ├── App.css               # Ancillary styling
│   ├── assets/               # Static media files
│   ├── utils/
│   │   └── apiGuard.js       # Utility to throw an error if VITE_API_URL is missing
│   ├── components/
│   │   ├── Navbar.jsx        # Sticky top navigation bar
│   │   ├── Footer.jsx        # Bottom links and contact routing
│   │   ├── Modal.jsx         # Reservation form overlay (controlled component)
│   │   └── ThreeDHero.jsx    # 3D illustration logic (Three.js integration)
│   └── pages/
│       ├── Home.jsx          # Landing page (Hero, stats, trusted brands)
│       ├── Products.jsx      # Main catalog: fetches API data, handles search/filter/compare
│       ├── Contact.jsx       # Static contact information display
│       └── NovaAssistant.jsx # AI Chatbot UI: uses Web Speech API for TTS and STT
```

### Key Pages & Component Behaviors
1. **`Products.jsx`**: 
   - Uses `axios` inside a `useEffect` to fetch products across the network.
   - Manages intense local state independently: `products`, `loading`, `searchTerm`, `categoryFilter`, `compareMode`, `compareList` (array for side-by-side spec comparison).
   - If an API request fails, it catches the error and gracefully degrades to displaying empty catalogs.
2. **`NovaAssistant.jsx`**:
   - Primary chat interface. Uses native Web Speech API integration (`SpeechRecognition`, `SpeechSynthesisUtterance`) for Telugu/English voice interaction.
   - Hardcoded UI illusions for "Crack Detection" relying on `Math.random()` to determine feedback rather than real ML endpoints.
   - Tracks chat history via a local state array of message objects.
3. **`Modal.jsx`**: 
   - Handles the actual `POST` request for `/api/reservations`. 
   - Employs local state for `status` (`idle`, `submitting`, `success`) to track request lifecycle UI.

### Styling System
- **Tailwind CSS 4.2.1**: Handles layout, spacing, and generic typography via utility classes.
- **CSS Custom Properties (Variables)**: Heavily used inside inline `style={{}}` tags across components (e.g., `var(--color-bg)`, `var(--color-surface)`). Theme source of truth resides in `index.css`.
- **Framer Motion (12.x)**: Used for smooth DOM transitions and animations.
- **Three.js & React Three Fiber (9.x)**: Renders the 3D construction visuals in the Hero section context.
- **Lucide React (0.577.x)**: SVG icon system mapped across the entire client.

### Frontend-to-Backend Interoperability
- **Methodology**: HTTP/REST calls made via `axios`.
- **Base URL**: Sourced explicitly from Vite's environment variable parser: `import.meta.env.VITE_API_URL`.
- **State Management**: Wholly reliant on localized React State (`useState`/`useEffect`). No global flux-like stores (Redux, Zustand or Context API) are implemented.
- **Authentication**: **None.** No login pages, JWT handling, storage persistence, or protected routes exist in the frontend UI.
- **Form Validations**: Lean heavily on basic HTML5 constraint validation (`required` attributes, type definitions like `pattern` or `number`). No robust validation schema libraries like Zod/Yup are utilized.

### Mobile Responsiveness
Handled purely via standard CSS Flexbox/Grid wrappers combined with Tailwind CSS mobile-first breakpoints (e.g., `md:flex-col`, `sm:px-6`). Container elements fluidly stack on smaller viewports.

---

## ⚙️ BACKEND ARCHITECTURE

### Framework & Technologies
- **Node.js**: Runtime environment.
- **Express.js 5.2.1**: Lightweight routing framework.
- **Prisma ORM 5.22.0**: Type-safe abstract database interface and SQL migration tooling generator.

### Folder & File Structure
```text
BACKEND/
├── package.json              # Defines startup scripts, postinstall hooks, dependencies
├── index.js                  # Primary application server, Express app initialization
├── seed.js                   # Populates initial Brands, Categories, and Products via Prisma
└── prisma/
    ├── dev.db                # SQLite locally generated database file
    └── schema.prisma         # Contains Data models and Database provider config
```

### API Endpoints
All routes exist flatly inside `index.js`.
1. **`GET /api/health`**
   - Returns: `{ "status": "ok", "message": "..." }`
2. **`GET /api/products`**
   - Mechanics: Performs a `.findMany()` fetching all products alongside joined `brand` data.
   - Returns: Standard Array of `Product` objects from DB.
3. **`POST /api/reservations`**
   - Accepts: `name` (str), `phone` (str), `productId` (int), `quantity` (int), `pickupDate` (datetime).
   - Mechanics: Naively validates string presence. Inserts directly into `Reservation` table.
   - Returns: Success message and the new `Reservation` object payload.
4. **`POST /api/nova`**
   - Accepts: `query` (str), optional `userId` (int)
   - Mechanics: Logs the query in the DB (`AiQuery`). Mentally processes nothing—returns a **mock string literal**: `Nova response to: "${query}"`.
   - Returns: `{ response: "..." }`

### Database Model (SQLite via Prisma)
Currently configured with **SQLite** for development. Schema includes:
- **`User`**: `id`, `name`, `phone` (Unique), `createdAt`.
- **`Brand`**: `id`, `name` (Unique), relation to Products.
- **`Product`**: `id`, `name`, `category`, `description`, `priceMin`/`Max`, `brandId` (FK), `stockStatus`.
- **`ProductRating`**: Links `rating` to a `productId` and optional `userId`.
- **`Reservation`**: `id`, `name`, `phone`, `productId`, `quantity`, `pickupDate`, `status` (Default: "Pending"). 
- **`AiQuery`**: Logging mechanism tracking raw chat prompts.

### Security, Auth, & Environment Variables
- **Authentication / Authorization**: **None.** No routing middleware safeguards existing endpoints. Anyone can hit `/api/reservations` and write to the DB instantly.
- **Environment Variables**: Managed via `dotenv`. 
  - `PORT`: Server port (Falls back to 5000).
  - `FRONTEND_URL`: Injected for dynamic CORS allowance.
  - `DATABASE_URL`: Connection string. Currently local URI (`file:./dev.db`).
- **Middleware**: Minimal. Uses standard `cors()` wrapper and `express.json()` execution parsers.
- **Error Handling**: Brittle `try...catch` loops dumping raw server errors via `console.error()` and responding HTTP 500 status codes with a generic string.

---

## 🐛 KNOWN BUGS, ERRORS & VULNERABILITIES

### 1. The "Fake" AI Features (Critical Functional Incompletion)
- **AI Nova Chat is Mocked**: The backend `/api/nova` AI endpoint lacks logic. It blindly prepends "Nova response to: " to user queries. No LLM integration pipelines exist.
- **Crack Detection Image Processing is Fake**: In `FRONTEND/src/pages/NovaAssistant.jsx` (line 74), image uploads utilize `Math.random() > 0.5` to arbitrarily conclude if a photographed wall crack is structural or superficial.

### 2. Disconnected Data Models (Schema Inconsistencies)
- **Orphaned Reservations**: The `Reservation` table accepts raw strings for `name` and `phone`, entirely bypassing the existing `User` table (which explicitly contains a `phone @unique` constraint meant for referencing). Consequently, tracking historic reservations mapped to a singular customer profile is impossible without heavy SQL string matching and refactoring.

### 3. Missing Documentation Fallbacks
- `CODEBASE_GUIDE.md` alleges `Products.jsx` "falls back to hardcoded data if API is unreachable". This is **provably false**. If the API request blocks out, the `.catch()` block fires, toggles `setLoading(false)` and the UI degrades directly to displaying an empty grid. No fallback JSON payload exists locally inside `Products.jsx`.

### 4. Zero Data Sanitization
- Input payloads traversing Express POST routes are completely unsanitized, and boundary constraints on `quantity` sizes for reservations are inherently broken (the frontend asserts `min=1`, but curl requests easily bypass this). 

### 5. Production Environment Preparation Overhead
- `schema.prisma` is actively bound to the `sqlite` provider block. To migrate this stack smoothly for highly concurrent cloud deployments via Render, developers must update the schema provider to `postgresql`, regenerate prisma types via `npx prisma generate`, track migrations over new databases, and manage dynamic connection string variables.

### 6. Empty / Pending Microservice Architecture
- The folder directory `/ai-service/` exists at the root block of the codebase but is physically empty, illustrating completely unimplemented external API architectures.

---

## 📦 OVERALL PROJECT STATUS & DEPLOYMENT

### Current Status Tracker
- ✅ **Done**: Full Frontend React component implementations, Tailwind layout architectures setup, React SPA routing logic, baseline Prisma Database schema drafting, functional Express CRUD API routes (reservations/products).
- 🟡 **Pending**: Refactoring `.prisma` configuration away from SQLite to PostgreSQL for production environments. Rewiring `Reservation` schema endpoints to link natively with the `User` schema table via Foreign keys.
- 🔴 **Not Started**: User Authentication (Admins or End Clients). Administrative CMS to fulfill orders. Practical Node/Python LLM execution bridges mapping real-time NLP/Computer Vision data via the `ai-service`.

### Deployment Environment Configuration
- **Frontend Target**: Placed natively on **Vercel** (`https://vasavi-traders-website-3gpu.vercel.app`), driven by webhook automatic Github deployments from the `main` branch. Environment variables must specify `VITE_API_URL`.
- **Backend / Database Target**: Placed on **Render**. Execution runtime parses the script `npm run start` which correctly sequences `prisma migrate deploy`, `node seed.js` and `node index.js`. Environment Variables must override `DATABASE_URL` bindings.

### Local Initialization Pipeline

**Prerequisite:** Developer requires standard `Node.js` (v18+) setup.

**1. Bootstrapping the Backend Domain:**
```bash
# Navigate to the API scope
cd BACKEND

# Install dependencies (Prisma client will auto-generate post installation)
npm install

# Push the schema definitions to establish local tables on the implicit dev.db file
npx prisma migrate dev

# Seed foundational brands and product variables
node seed.js

# Initialize server tracking via nodemon (Accessible via HTTP://localhost:5000)
npm run dev
```

**2. Bootstrapping the Frontend Client:**
```bash
# Navigate to UI scope
cd FRONTEND

# Install dependencies
npm install

# Force the connection base string globally parsing a local instance 
# NOTE: Ensure `.env` exists in FRONTEND root specifying: VITE_API_URL=http://localhost:5000
npm run dev
```
*(Development requires concurrent terminals running both servers to accurately reflect the architecture routing)*
