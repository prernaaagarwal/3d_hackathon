# BACKEND.md — Backend Development Rules

## PropIntel · Node.js + Express + Supabase

---

## Implementation Status

> **Backend is 100% feature-complete for MVP.** All endpoints tested E2E.
> Last verified: March 14, 2026.

| Module | Status | Notes |
|--------|--------|-------|
| Authentication (Supabase JWT) | ✅ Done | Middleware validates token on all protected routes |
| Property CRUD | ✅ Done | Full CRUD with Zod validation, pagination, RLS |
| ROI Calculator | ✅ Done | Gross/net yield, IRR (5yr/10yr), mortgage, cashflow projections |
| Market Data (Public) | ✅ Done | Area stats, property browsing, no auth required |
| 3D Tour Management | ✅ Done | Create, list, toggle visibility, public viewer |
| 3D Generation (World Labs) | ✅ Done | Multi-image Marble API, job submit + polling, auto-updates tour |
| AI Content (Gemini 2.5 Flash) | ✅ Done | Property descriptions, ROI narratives |
| Developer Intelligence | ✅ Done | Crustdata B2B enrichment + Gemini analysis reports |
| Image Upload Pipeline | ✅ Done | UploadThing upload → Uploadcare CDN re-hosting with transforms |
| Database Schema + RLS | ✅ Done | 5 tables, triggers, indexes, all RLS policies |

---

## 1. Project Structure

```
backend/
├── .gitignore
├── package.json
├── tsconfig.json
├── scripts/
│   └── migrate.ts              # Database migration utility
├── supabase/
│   └── migrations/
│       ├── 20260314000000_initial_schema.sql
│       └── 20260314000001_rls_policies.sql
└── src/
    ├── index.ts                  # App entry point, Express setup
    ├── config/
    │   ├── env.ts                # Zod-validated environment variables
    │   ├── supabase.ts           # Supabase admin + per-request client
    │   ├── gemini.ts             # Google Gemini AI client (@google/genai)
    │   └── uploadthing.ts        # UploadThing file router config
    ├── middleware/
    │   ├── auth.ts               # JWT validation (supabaseAdmin.auth.getUser)
    │   ├── validate.ts           # Request body validation (Zod schemas)
    │   ├── errorHandler.ts       # Global error handler with AppError codes
    │   └── rateLimiter.ts        # In-memory rate limiting (100 req/min)
    ├── routes/
    │   ├── property.routes.ts    # Property CRUD (GET/POST/PATCH/DELETE)
    │   ├── roi.routes.ts         # ROI calculate, save, history
    │   ├── market.routes.ts      # Public market data (areas, stats, properties)
    │   ├── tour.routes.ts        # Tour CRUD + visibility toggle
    │   ├── job.routes.ts         # 3D job submit + status polling
    │   ├── upload.routes.ts      # CDN re-hosting + image transforms
    │   ├── ai.routes.ts          # Gemini property descriptions + ROI narratives
    │   └── developer.routes.ts   # Crustdata search + Gemini developer reports
    ├── services/
    │   ├── property.service.ts   # Property business logic
    │   ├── roi.service.ts        # ROI calculation engine (IRR, yield, cashflow)
    │   ├── market.service.ts     # Market data aggregation (uses admin client)
    │   ├── tour.service.ts       # Tour management + public tour access
    │   ├── worldApi.service.ts   # World Labs Marble API (submit + poll)
    │   ├── uploadcare.service.ts # Uploadcare CDN upload + image transforms
    │   ├── ai.service.ts         # Gemini AI content generation (3 generators)
    │   └── crustdata.service.ts  # Crustdata B2B company intelligence
    ├── models/
    │   ├── property.model.ts     # Supabase queries for properties
    │   ├── tour.model.ts         # Supabase queries for tours
    │   └── user.model.ts         # Supabase queries for users/profiles
    ├── utils/
    │   ├── logger.ts             # Structured JSON logging
    │   ├── errors.ts             # AppError, NotFoundError, ForbiddenError
    │   └── helpers.ts            # extractBearerToken, general utilities
    └── types/
        ├── api.types.ts           # Express request augmentation (req.user, req.token)
        └── models.types.ts        # Database model TypeScript interfaces
```

---

## 2. Express Setup Rules

### App Initialization

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Auth: Handled entirely by Supabase Auth on the frontend.
// No /api/auth routes needed — the backend only validates JWTs via authMiddleware.

// Routes
app.use('/api/properties', authMiddleware, propertyRoutes);
app.use('/api/roi', authMiddleware, roiRoutes);
app.use('/api/market', marketRoutes);  // Public
app.use('/api/tours', authMiddleware, tourRoutes);
app.use('/api/jobs', authMiddleware, jobRoutes);
app.use('/api/uploads', authMiddleware, uploadRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/developers', authMiddleware, developerRoutes);

// Error handling (must be last)
app.use(errorHandler);
```

### Rules

- **TypeScript strict mode** — all files must be `.ts`, no `.js`.
- **Always validate request bodies** using Zod schemas in the `validate` middleware.
- **Never use `any`** — define explicit types for all request/response objects.
- **Max 300 lines per file.** Extract into services if route handlers grow.

---

## 3. Route Handler Pattern

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { propertyService } from '../services/property.service';
import { AppError } from '../utils/errors';

const router = Router();

const createPropertySchema = z.object({
  address: z.string().min(1),
  price: z.number().positive(),
  bedrooms: z.number().int().min(0),
  sqft: z.number().positive(),
});

router.post('/', validate(createPropertySchema), async (req, res, next) => {
  try {
    const property = await propertyService.create(req.body, req.user.id);
    res.status(201).json({ data: property });
  } catch (error) {
    next(error);
  }
});

export { router as propertyRoutes };
```

---

## 4. Authentication Middleware

```typescript
import { createClient } from '@supabase/supabase-js';

export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing token', code: 'AUTH_MISSING' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token', code: 'AUTH_INVALID' });

  req.user = user;
  next();
};
```

---

## 5. Error Handling

### Custom Error Classes

```typescript
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super('Access denied', 403, 'FORBIDDEN');
  }
}
```

### Global Error Handler

```typescript
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  // Log error (never log to console in production)
  logger.error({ err, req: { method: req.method, url: req.url } });

  res.status(statusCode).json({
    error: err.message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
```

---

## 6. Supabase Client Setup

```typescript
import { createClient } from '@supabase/supabase-js';

// Service role client — ONLY for backend admin operations
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Per-request client — respects RLS using user's JWT
export const createUserClient = (token: string) =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
```

### Rules

- **Never use `supabaseAdmin` in user-facing routes** — always create a per-request client.
- **Always pass the user's JWT** to the per-request client so RLS policies are enforced.
- **Service role key** is only for: webhooks, cron jobs, admin scripts, migrations.

---

## 7. Environment Variables

Validate all env vars at startup (see `src/config/env.ts`):

```typescript
const envSchema = z.object({
  PORT: z.string().default('3001'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  WORLD_LABS_API_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  CRUSTDATA_API_KEY: z.string().optional().default(''),  // Falls back to mock data
  UPLOADTHING_TOKEN: z.string().min(1),
  UPLOADCARE_PUBLIC_KEY: z.string().min(1),
  UPLOADCARE_SECRET_KEY: z.string().min(1),
  FRONTEND_URL: z.string().url().optional().default('http://localhost:3000'),
});
```

---

## 8. API Endpoint Reference (for Frontend)

All responses follow the format `{ data: T }` or `{ data: T, pagination: {...} }`.
Auth endpoints require `Authorization: Bearer <supabase_jwt>` header.

### Health (Public)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check — returns `{ status: 'ok' }` |

### Properties (Auth Required)
| Method | Path | Body / Params | Response |
|--------|------|---------------|----------|
| GET | `/api/properties` | `?page=1&limit=20` | `{ data: Property[], pagination }` |
| GET | `/api/properties/:id` | — | `{ data: Property }` |
| POST | `/api/properties` | `{ address, area, property_type, bedrooms, bathrooms, sqft, price_aed, annual_rent_aed?, service_charge_aed?, latitude?, longitude?, description?, images? }` | `{ data: Property }` |
| PATCH | `/api/properties/:id` | Partial of above | `{ data: Property }` |
| DELETE | `/api/properties/:id` | — | `204 No Content` |

### ROI Calculator (Auth Required)
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/roi/calculate` | `{ purchase_price, annual_rent, service_charge?, has_mortgage?, down_payment_pct?, mortgage_rate_pct?, mortgage_term_years?, holding_period_years?, appreciation_rate_pct?, property_id? }` | `{ data: { gross_yield, net_yield, monthly_cashflow, irr_5yr, irr_10yr, cashflow_projection[] } }` |
| POST | `/api/roi/save` | Same as calculate | `{ data: { calculation, result } }` |
| GET | `/api/roi/history` | — | `{ data: RoiCalculation[] }` |

### Market Data (Public — No Auth)
| Method | Path | Params | Response |
|--------|------|--------|----------|
| GET | `/api/market/areas` | — | `{ data: string[] }` |
| GET | `/api/market/stats` | `?area=Downtown` | `{ data: AreaStats[] }` |
| GET | `/api/market/properties` | `?area=&property_type=&min_price=&max_price=&min_bedrooms=&page=&limit=` | `{ data: Property[], pagination }` |

### Tours (Auth Required)
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/tours` | — | `{ data: Tour[] }` |
| GET | `/api/tours/:id` | — | `{ data: Tour }` |
| POST | `/api/tours` | `{ property_id, quality?, photo_count }` | `{ data: Tour }` |
| PATCH | `/api/tours/:id/visibility` | `{ is_public: boolean }` | `{ data: Tour }` |

### Tours — Public Viewer (No Auth)
| Method | Path | Response |
|--------|------|----------|
| GET | `/api/tours/public/:id` | `{ data: Tour }` (only if `is_public: true`) |

### 3D Generation Jobs (Auth Required)
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/jobs/:tourId/submit` | `{ photo_urls: string[] }` (min 2, max 8 used) | `{ data: { job_id, status } }` |
| GET | `/api/jobs/:tourId/status` | — | `{ data: { status, operation_id, world_id?, processing_time_ms? } }` |

### Image Uploads (Auth Required)
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/uploads/to-cdn` | `{ file_urls: string[] }` (UploadThing URLs) | `{ data: [{ original_url, cdn_url, thumbnail_url, uuid, size, mime_type }] }` |
| POST | `/api/uploads/transform` | `{ uuid, width?, height?, format? }` | `{ data: { cdn_url, uuid } }` |

### AI Content Generation (Auth Required)
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/ai/property-description` | `{ address, area, propertyType, bedrooms, bathrooms, sqft, priceAed, annualRentAed? }` | `{ data: { description: string } }` |
| POST | `/api/ai/roi-narrative` | `{ area, purchasePrice, annualRent, grossYield, netYield, monthlyCashflow, irr5yr, irr10yr, holdingPeriodYears, appreciationRatePct, hasMortgage }` | `{ data: { narrative: string } }` |

### Developer Intelligence (Auth Required)
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/developers/search` | `{ name: string }` | `{ data: CrustdataCompanyProfile }` |
| POST | `/api/developers/report` | `{ name: string }` | `{ data: { profile, report } }` |

### UploadThing (Public — handled by UploadThing SDK)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/uploadthing` | UploadThing route handler (frontend uploads directly) |

---

## 9. Key Implementation Details for Frontend

### Authentication Flow
- Frontend handles signup/login via Supabase Auth SDK directly
- Backend receives JWT in `Authorization: Bearer <token>` header
- `req.user` and `req.token` are available in all auth-protected routes

### Image Upload Flow
1. Frontend uploads images via UploadThing SDK → gets UploadThing URLs
2. Frontend sends URLs to `POST /api/uploads/to-cdn` → gets Uploadcare CDN URLs
3. Frontend uses CDN URLs for display (with smart crop, WebP, quality transforms)
4. CDN URLs are stored on property records via `PATCH /api/properties/:id`

### 3D Tour Generation Flow
1. Frontend creates a tour: `POST /api/tours` (with `property_id`)
2. Frontend submits photos: `POST /api/jobs/:tourId/submit` (with `photo_urls`)
3. Frontend polls status: `GET /api/jobs/:tourId/status` (every 5-10s)
4. When `status === 'complete'`, `world_id` is available
5. Use `world_id` to render Gaussian Splat in 3D viewer
6. World Labs viewer URL: `https://marble.worldlabs.ai/world/{world_id}`

### World Labs Asset URLs (after completion)
Fetch world details via `GET https://api.worldlabs.ai/marble/v1/worlds/{world_id}`:
- `assets.splats.spz_urls.full_res` — Full resolution `.spz` Gaussian Splat
- `assets.splats.spz_urls.500k` — 500k resolution `.spz` (recommended for web)
- `assets.splats.spz_urls.100k` — 100k resolution `.spz` (mobile/preview)
- `assets.thumbnail_url` — `.webp` thumbnail
- `assets.imagery.pano_url` — Panoramic image
- `world_marble_url` — Link to World Labs Marble viewer

### ROI Calculation
- `POST /api/roi/calculate` returns results without saving (for preview)
- `POST /api/roi/save` calculates AND saves to Supabase (for history)
- `GET /api/roi/history` retrieves past calculations with linked property info
