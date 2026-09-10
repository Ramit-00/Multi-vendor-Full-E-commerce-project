# Enterprise Multi-Vendor E-Commerce Platform

A production-grade, highly scalable, and secure full-stack multi-vendor e-commerce platform built with Node.js, Express, React 18, TypeScript, Tailwind CSS, PostgreSQL (via Prisma), MongoDB Atlas (via Mongoose), and Cloudinary.

---

## Architectural Highlights

### 1. Dual-Database Hybrid Storage Engine
- **PostgreSQL (Prisma ORM)**: Provides ACID-compliant transactional consistency for core financial entities:
  - Users & Authentication
  - Sellers & Onboarding State
  - Addresses & Customer Profiles
  - Products, Variants & Inventory
  - Orders, Order Items & Stock Reservations
  - Payments, Razorpay Orders & Stripe Transactions
  - Coupons, Discounts & Redemptions
  - Seller Payouts & Commission Ledgers
- **MongoDB Atlas (Mongoose)**: Manages flexible document structures, hierarchical categories, product specifications/attributes, real-time chat sessions, and asynchronous notification caches.

### 2. Cloudinary CDN & Zero-Local-Storage Architecture
- **Zero Local Static Storage**: No user or vendor images are saved to local disk.
- **Automated Media Lifecycle**: All product imagery is uploaded directly or via signed backend signatures (`/api/sellers/product/cloudinary-sign`) to Cloudinary CDN.
- **Asset Reclaim on Deletion**: Deleting a product automatically purges its image assets from Cloudinary via API destroy hooks, preventing orphaned assets.

### 3. Financial & Commerce Engine
- **Atomic Stock Management**: Enforces strict concurrency safety when processing checkout requests.
- **Advanced Coupon Engine**: Supports percentage & fixed discounts, `minOrderValue`, `maxDiscount` caps, validity intervals, and user redemption limits (`perUserLimit`).
- **Automated Tax Invoice Generation**: `GET /api/orders/:orderId/invoice` generates compliance-ready HTML and printable PDF invoices featuring tax breakdowns, seller details, customer shipping addresses, and payment order IDs.
- **Seller Payouts Engine**: Complete payout ledger tracking earnings, platform commissions, net vendor payouts, and transaction histories (`/api/payouts`).
- **Bulk Vendor Operations**: High-performance batch product ingestion (`POST /api/sellers/products/bulk-create`) and JSON/CSV catalog export (`GET /api/sellers/products/export`).

### 4. Enterprise Security Shield & Zero Vulnerability
- **Rate Limiting & Anti-Brute-Force**: Configured via `express-rate-limit`:
  - Strict 30 attempts per 15-minute window for OTP generation, login, and registration routes.
  - 30 requests per minute ceiling on AI Chatbot endpoints.
  - 1000 requests per 15-minute global API limit.
- **Dual-Layer Master Admin Vault**: Requires a secret SHA-256 Master Secret Key header (`x-master-secret-key`) in addition to bcrypt-hashed administrator credentials.
- **Input Sanitization & Injection Defense**: NoSQL query sanitization, parameter validation, and IDOR guards across all customer/seller/admin routes.
- **HTTP Security Headers**: Powered by Helmet (`Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`).
- **Automated Security Test Suite**: Run `npm run security:check` in `backend` to execute 23 automated regression checks before any commit or deployment.

### 5. AI Shopping Assistant (Google Gemini)
- Integrated natural language conversational shopping assistant (`/api/chat/ask-ai`).
- Multi-turn conversation persistence in MongoDB Atlas (`ChatSession`).
- Context-aware product recommendations with direct catalog linking.

### 6. Modern Frontend (React 18 + TypeScript)
- Built with React 18, Vite, TypeScript, Tailwind CSS, Redux Toolkit, and Material UI (MUI).
- Size and color variant selection matrix with dynamic stock validation.
- Real-time low-stock inventory warnings for sellers.
- Multi-address checkout flow with default address selection.
- Dynamic SEO & OpenGraph tags for rich social sharing.
- Production build passes with 0 TypeScript/ESLint errors (`npm run build`).

---

## Project Structure

```
Multi-vendor-Full-E-commerce-project/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma              # PostgreSQL relational schema
│   ├── scripts/
│   │   └── security-check.js          # 23-check automated security test suite
│   ├── src/
│   │   ├── config/
│   │   │   ├── cloudinary.js          # Cloudinary SDK & asset deletion
│   │   │   ├── cloudinaryImageMap.json # Catalog CDN URL map
│   │   │   ├── mongoose.js            # MongoDB Atlas connection pool
│   │   │   ├── prisma.js              # PostgreSQL client singleton
│   │   │   └── razorpayClient.js      # Payment gateway configuration
│   │   ├── controllers/               # Business logic controllers
│   │   ├── middleware/                # Rate limiters & security guards
│   │   ├── models/                    # MongoDB Mongoose schemas
│   │   ├── routers/                   # Express route definitions
│   │   ├── services/                  # Core domain & transactional services
│   │   └── utils/                     # JWT provider, emailer, OTP generator
│   ├── .env.example                   # Sanitized backend environment template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── admin/                     # Admin control vault & seller approvals
│   │   ├── customer/                  # Storefront, cart, checkout, invoice
│   │   ├── seller/                    # Vendor portal, inventory, payouts
│   │   ├── Redux Toolkit/             # Global state slices
│   │   └── util/                      # Cloudinary uploaders & formatters
│   ├── .env.example                   # Sanitized frontend environment template
│   └── package.json
│
├── vercel.json                        # Serverless deployment configuration
├── .gitignore                         # Comprehensive secret isolation rules
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL database (or Supabase instance)
- MongoDB database (or MongoDB Atlas cluster)
- Cloudinary account for media delivery

### Environment Configuration

#### 1. Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```
Fill in your credentials:
```env
PORT=8080
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<dbname>?connection_limit=10"
DIRECT_URL="postgresql://<user>:<password>@<host>:5432/<dbname>"
MONGO_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority"
SECRET_KEY="your_jwt_secret_key"

# Cloudinary CDN
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Master Administrator Credentials
ADMIN_SECRET_KEY="your_master_secret_key"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your_admin_password_here"

# Optional Integrations
GEMINI_API_KEY="your_gemini_api_key"
GOOGLE_CLIENT_ID="your_google_client_id"
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
STRIPE_SECRET_KEY="your_stripe_secret_key"

# Upstash Redis (Edge Caching & Distributed Rate Limiting)
UPSTASH_REDIS_REST_URL="https://your-database.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_upstash_redis_token"
```

#### 2. Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:
```bash
cp frontend/.env.example frontend/.env
```
```env
VITE_API_URL=http://localhost:8080
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```

---

## Installation & Running

### 1. Database Setup
Run Prisma migrations to generate the PostgreSQL schema:
```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

### 2. Start Backend Server
```bash
cd backend
npm install
npm run dev
```
Backend runs on `http://localhost:8080`.

### 3. Start Frontend Dev Server
```bash
cd frontend
npm install
npm run dev
```
Storefront runs on `http://localhost:5173`.

---

## Automated Verification & Security Checks

Run the automated security and regression test suite:
```bash
cd backend
npm run security:check
```

### Verified Criteria (23/23 PASS):
- [x] Dual database connectivity (PostgreSQL + MongoDB Atlas)
- [x] Zero local static storage & Cloudinary CDN asset reachability
- [x] OWASP HTTP security headers (`nosniff`, `DENY`, `HSTS`)
- [x] Rate limiting headers on `/auth/signin`, `/auth/signup`, `/sellers`
- [x] Rejection of test backdoors, dummy OTPs, and mock Google tokens
- [x] Strict RBAC & IDOR authorization boundaries
- [x] Master Admin SHA-256 Vault authentication verification
- [x] Complete isolation of environment files from Git tracking

To verify the frontend production build:
```bash
cd frontend
npm run build
```

---

## License
MIT License. Built for enterprise multi-vendor e-commerce operations.
