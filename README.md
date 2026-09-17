# 🍽️ CampusEats — Smart Canteen Pre-Order & Digital Token System

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?logo=vercel&logoColor=white)](https://campus-eats-ruby.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?logo=github&logoColor=white)](https://github.com/namit27y-dotcom/CampusEats)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

> **CampusEats** is a production-hardened full-stack smart canteen pre-ordering platform. It replaces cafeteria queues with digital pre-orders, server-authoritative inventory, Razorpay payment processing (Test Mode), PDF invoices with verification QR codes, AI-assisted meal recommendations, and authenticated real-time Kitchen & Pickup Display Systems.
>
> 🌐 **Live Application:** [campus-eats-ruby.vercel.app](https://campus-eats-ruby.vercel.app/)  
> 📁 **GitHub Repository:** [github.com/namit27y-dotcom/CampusEats](https://github.com/namit27y-dotcom/CampusEats)

---

## 📖 Table of Contents

* [Overview & Architecture](#-overview--architecture)
* [System Security & Hardening](#-system-security--hardening)
* [Key Features by Role](#-key-features-by-role)
* [Technology Stack](#-technology-stack)
* [Database Design & Migrations](#-database-design--migrations)
* [Order Lifecycle State Machine](#-order-lifecycle-state-machine)
* [Payment & Razorpay Test Mode](#-payment--razorpay-test-mode)
* [PDF Invoice & Safe QR Verification](#-pdf-invoice--safe-qr-verification)
* [AI Assistant & Smart Recommendations](#-ai-assistant--smart-recommendations)
* [Real-Time WebSocket Layer](#-real-time-websocket-layer)
* [API Reference](#-api-reference)
* [Environment Configuration](#-environment-configuration)
* [Local Setup & Docker](#-local-setup--docker)
* [Automated Test Suite (77 Assertions)](#-automated-test-suite-77-assertions)
* [Production Deployment Guide](#-production-deployment-guide)
* [License](#-license)

---

# 🚀 Overview & Architecture

CampusEats solves campus cafeteria congestion through a unified digital pipeline:

```text
Student App (React 19 + Vite) ───[ HTTPS / Bearer JWT ]───► Express 5 API (Helmet + Rate Limits)
         │                                                            │
         │                                              ┌─────────────┴─────────────┐
         ▼                                              ▼                           ▼
Socket.IO Client (JWT Handshake) ──[ WebSocket ]──► Socket.IO Rooms        MySQL 8.0 Engine
         │                                         (order_*, canteen_*)   (Transactions & Locks)
         ▼                                              ▲                           ▲
Kitchen & Pickup Display                                └─────── Gemini AI / PDF ───┘
```

---

# 🔐 System Security & Hardening

* **Password Security**: Enforced 8+ characters, at least 1 number, at least 1 special character via `bcryptjs`.
* **Registration Privilege Hardening**: Public registration endpoint strictly forces the `student` role. Staff roles (`kitchen`, `counter`, `admin`) are restricted to administrative provisioning.
* **Brute-Force Protection**: Express rate limiting protects `/api/auth/login` and `/api/auth/register` (10 requests per 15 minutes per IP). General API is limited to 500 requests per 15 minutes.
* **Server-Authoritative Pricing & Stock**: Cart prices sent from the client are completely disregarded. Total amounts, item availability, and stock balances are calculated and decremented server-side with database row-level locking (`FOR UPDATE`).
* **Socket.IO Room Authorization**: WebSocket connections require a JWT handshake. Students are strictly restricted to listening to their own `order_<id>` rooms. Staff are isolated to their authorized `canteen_<id>` rooms. Sensitive global events are blocked.
* **Security Headers**: Production-ready security headers implemented via `helmet`.

---

# ✨ Key Features by Role

### 👨‍🎓 Student
* Authenticated registration and JWT session management.
* Live canteen browsing with dietary tags (Veg/Non-Veg, Prep times).
* **AI Meal Assistant**: Natural language dietary and budget recommendations powered by Google Gemini (with DB validation).
* Customizable cart with server-side inventory validation.
* **Razorpay Test-Mode Checkout** & Campus Wallet balance payments with transactional consistency.
* Real-time order tracking modal with live status indicators and elapsed timers.
* **PDF Invoice / Receipt Download**: Itemized PDF receipts with safe verification QR codes.
* Order history and interactive rating submissions.

### 👨‍🍳 Kitchen Staff
* Dedicated Kitchen Display System (KDS).
* Live incoming order queue with audio/visual alerts.
* State transitions: `placed` ➔ `accepted` ➔ `preparing` ➔ `ready`.
* Real-time multi-client synchronization via Socket.IO.

### 🧾 Counter Staff
* Dedicated Pickup Verification Dashboard.
* Search and verify digital tokens with canteen-level authorization.
* Atomic completion: Transition `ready` ➔ `completed` (`COLLECTED`).
* Prevents re-collection or unauthorized canteen pickup.

### 👨‍💼 Administrator
* Real database aggregated metrics (no hardcoded baselines): total revenue, live orders, active users, top-selling items, revenue charts.
* Menu item management with stock quantity controls and tracking toggles.
* User account oversight and role inspection.

---

# 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript 5.8, Vite 6.4, Tailwind CSS v4, Lucide React, Socket.IO Client |
| **Backend** | Node.js 20+, Express.js 5.x, MySQL2, JWT, bcryptjs, Helmet, Express-Rate-Limit, Socket.IO 4.x |
| **Payments** | Razorpay SDK (Test Mode Integration with HMAC-SHA256 verification) |
| **Documents** | PDFKit (Streaming PDF Invoices), QRCode (Safe Token Verification Links) |
| **AI Integration**| Google GenAI SDK (`@google/genai` Gemini 2.5 Flash) with fallback grounding |
| **Container** | Docker, Docker Compose, Alpine Linux |

---

# 🗄️ Database Design & Migrations

The application runs on MySQL 8.0 with transactional engines (`InnoDB`).

### Main Tables
* `users` — id, name, email, password, role (`student`, `kitchen`, `counter`, `admin`), canteen_id, created_at.
* `canteens` — id, name, location, is_active, created_at.
* `menu_items` — id, canteen_id, name, description, price, category, is_veg, is_available, stock_quantity, is_tracked, prep_time.
* `orders` — id, user_id, canteen_id, total_amount, token_number, status, payment_method, payment_status, payment_transaction_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, created_at.
* `order_items` — id, order_id, menu_item_id, quantity, price, customization, extra_amount.
* `wallet_transactions` — id, user_id, amount, transaction_type, order_id, balance_after, created_at.
* `ratings` — id, order_id, user_id, rating, comment, created_at.

### Migrations
1. `backend/scripts/migration_phase2_inventory.sql`: Adds `stock_quantity` and `is_tracked` columns safely and idempotently.
2. `backend/scripts/migration_phase3_payments.sql`: Adds `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` columns.

---

# 🎟️ Order Lifecycle State Machine

Order state progression is enforced strictly server-side:

```text
    ┌──────────────┐
    │    PLACED    │ ── (Created by Student, Stock decremented)
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │   ACCEPTED   │ ── (Kitchen acknowledges order)
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  PREPARING   │ ── (Food preparation in progress)
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │    READY     │ ── (Token called, ready at counter)
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  COMPLETED   │ ── (Counter verifies token & marks collected)
    └──────────────┘

* Cancellation: Allowed only in `placed` or `accepted` stage (restores stock & refunds wallet).
```

---

# 💳 Payment & Razorpay Test Mode

> [!NOTE]
> **Razorpay is currently configured in TEST MODE.** Live payments are disabled by design until production API keys are provided.

* **Order Creation (`POST /api/payment/create-order`)**: Backend re-computes total from DB menu prices and creates a Razorpay order in INR paise.
* **Signature Verification (`POST /api/payment/verify-signature`)**: Computes `crypto.createHmac("sha256", secret)` over `order_id|payment_id` and compares securely.
* **Duplicate Prevention**: Verified transactions cannot be reused.
* **Wallet System**: Supports transactional balance top-up, atomic debits with `FOR UPDATE` row locking, and automated refunds on eligible cancellation.

---

# 📄 PDF Invoice & Safe QR Verification

* **Endpoint**: `GET /api/orders/:id/invoice`
* **Security**: Enforces ownership check (students can only fetch their own orders; staff/admin can fetch all).
* **Generation**: Streamed directly via `PDFKit` as `application/pdf`.
* **Safe QR Code**: Embedded QR code contains a safe public verification URL (`https://campus-eats-ruby.vercel.app/verify?orderId=...&token=...`) with **no sensitive JWTs, secrets, or database credentials**.

---

# 🤖 AI Assistant & Smart Recommendations

* **Endpoint**: `POST /api/ai/recommend` (Protected by JWT and rate limited to 30 req/15min).
* **Grounding**: Queries current available menu items directly from the database and injects them as grounding context into the Gemini prompt.
* **Validation Filter**: Discards any hallucinated menu items that do not exist in the database or violate dietary constraints.
* **Fallback Engine**: If AI is offline, seamlessly falls back to a deterministic rule-based dietary/budget matching engine.

---

# 🔌 API Reference

Base API URL: `http://localhost:5000/api`

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/auth/register` | `POST` | Public | Register student account (enforces complexity & role) |
| `/auth/login` | `POST` | Public | Login and receive Bearer JWT token |
| `/auth/me` | `GET` | Authenticated | Get current user profile and role |
| `/canteens` | `GET` | Authenticated | List all active campus canteens |
| `/menu/:canteenId` | `GET` | Authenticated | Get menu items with availability & stock |
| `/menu/:id/stock` | `PATCH` | Admin | Update item stock quantity & tracking toggle |
| `/orders` | `POST` | Student | Place order with server-authoritative stock deduction |
| `/orders/my-orders` | `GET` | Student | Retrieve user order history |
| `/orders/:id/invoice` | `GET` | Student/Staff | Download itemized PDF receipt with QR code |
| `/payment/create-order`| `POST` | Student | Create Razorpay test-mode payment order |
| `/payment/verify-signature`| `POST`| Student | Verify Razorpay payment signature & update order |
| `/ai/recommend` | `POST` | Student | Get AI-grounded meal recommendations |
| `/kitchen/orders` | `GET` | Kitchen/Admin | List active kitchen orders |
| `/kitchen/orders/:id/status`| `PATCH`| Kitchen/Admin| Transition order state |
| `/counter/orders` | `GET` | Counter/Admin | List ready pickup queue |
| `/counter/orders/:id/collect`| `PATCH`| Counter/Admin| Verify token and mark collected |
| `/admin/stats` | `GET` | Admin | Aggregate real database analytics |
| `/health` | `GET` | Public | Service health & database connectivity check |

---

# 🔧 Environment Configuration

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
VITE_USE_MOCK=false
```

### Backend (`backend/.env`)
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=campuseats
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173

# Payment Gateway (Razorpay Test Mode)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_test_secret

# AI Assistant (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key
```

---

# ⚙️ Local Setup & Docker

### Option 1: Docker Compose (Recommended for full-stack)
```bash
# Start MySQL & Backend in containers
docker-compose up -d

# Start Frontend
npm install
npm run dev
```

### Option 2: Standard Node.js
```bash
# 1. Start Backend
cd backend
npm install
npm run dev

# 2. Start Frontend (in separate terminal)
cd ..
npm install
npm run dev
```

---

# 🧪 Automated Test Suite (77 Assertions)

The repository includes a comprehensive 4-suite automated test harness verifying all security, business logic, payment, and AI pipelines:

```bash
# Phase 1: Security & Validation (30 tests)
node backend/scripts/testPhase1Security.js

# Phase 2: Inventory & Real Analytics (17 tests)
node backend/scripts/testPhase2.js

# Phase 3A: Razorpay & PDF Invoices (14 tests)
node backend/scripts/testPhase3Payments.js

# Phase 3B: Gemini AI & Complete Flow (16 tests)
node backend/scripts/testPhase3BAiAndFlow.js
```

**Total Test Coverage: 77/77 assertions passing (0 failures).**

---

# 🚢 Production Deployment Guide

### 1. Frontend (Vercel)
* **Framework Preset**: Vite
* **Build Command**: `npm run build`
* **Output Directory**: `dist`
* **Environment Variables**:
  * `VITE_API_URL`: `https://your-backend-api.onrender.com/api`
  * `VITE_WS_URL`: `https://your-backend-api.onrender.com`
  * `VITE_USE_MOCK`: `false`

### 2. Backend (Render / Railway)
* **Runtime**: Node.js 20+
* **Root Directory**: `backend`
* **Build Command**: `npm install`
* **Start Command**: `npm start`
* **Health Check Path**: `/api/health`
* **Environment Variables**: `PORT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `JWT_SECRET`, `CLIENT_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `GEMINI_API_KEY`.

### 3. Database (Aiven / PlanetScale / AWS RDS MySQL)
* Run `backend/scripts/migration_phase2_inventory.sql` and `backend/scripts/migration_phase3_payments.sql`.

---

# 📄 License

This project is open source and available under the **MIT License**.
