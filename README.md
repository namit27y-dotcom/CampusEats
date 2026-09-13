# CampusEats — Smart Canteen Pre-Order & Digital Token System

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **CampusEats** is a full-stack smart canteen pre-ordering, digital token issuance, and kitchen display platform designed for university campuses. It eliminates break-time cafeteria rush by replacing physical queues with digital pre-orders, real-time token tracking via Socket.IO, campus wallet transactions, and fast contactless order handover.

---

## Table of Contents
1. [Key Features](#key-features)
2. [User Roles](#user-roles)
3. [Tech Stack](#tech-stack)
4. [System Architecture](#system-architecture)
5. [Project Structure](#project-structure)
6. [Database Schema](#database-schema)
7. [Authentication & Security](#authentication--security)
8. [API Overview](#api-overview)
9. [Installation & Setup](#installation--setup)
10. [Running the Application](#running-the-application)
11. [End-to-End Testing Guide](#end-to-end-testing-guide)
12. [Future Improvements](#future-improvements)

---

## Key Features

- **Digital Token Engine**: Generates unique alphanumeric tokens (e.g. `TK-101`) for every order for easy queue tracking.
- **Real-Time Live Sync**: Powered by Socket.IO, kitchen tickets update automatically without page refreshes, and students receive instant notifications when meals are ready.
- **Campus Wallet & Atomic Refunds**: Integrated wallet debiting and automated transactional refunds upon order cancellation.
- **Kitchen Display System (KDS)**: Ticket management with item details, special instructions, and progression from `ACCEPTED` to `PREPARING` and `READY`.
- **Dedicated Pickup Counter**: Counter staff view ready orders, search tokens, and mark items `COLLECTED`.
- **Verified Reviews & Ratings**: Only students who completed their meal pickup can submit ratings and feedback.
- **Fully Responsive UI**: Optimized for mobile devices (320px–430px), tablets (768px–1024px), and desktops.
- **Modern Login & Quick Personas**: 1-click test account switching across all four campus roles.

---

## User Roles

| Role | Access & Responsibilities |
|---|---|
| **Student** | Browse campus canteens, customize menu items, checkout via wallet or cash/UPI demo, track live digital token status, cancel orders with instant refunds, and leave ratings. |
| **Kitchen Staff** | View incoming orders in real time, view meal customizations and prep notes, transition order states (`ACCEPTED` -> `PREPARING` -> `READY`). |
| **Counter Staff** | Dedicated pickup interface, view ready orders, search by digital token number, and complete customer handover (`COLLECTED`). |
| **Administrator** | Real-time analytics (revenue, order counts, active queues), manage cafeteria menu items, toggle stock availability, and view campus-wide users and orders. |

---

## Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Vanilla CSS custom scrollbars & ambient glow
- **Icons**: Lucide React
- **Client Networking**: Native Fetch API with typed centralized wrappers (`apiRequest`)
- **Real-Time Client**: `socket.io-client` v4.8

### Backend
- **Runtime**: Node.js (ES Modules)
- **Web Framework**: Express.js
- **Database**: MySQL 8.x (`mysql2/promise` connection pool)
- **Authentication**: JSON Web Tokens (JWT) + `bcryptjs` for secure password hashing
- **WebSockets**: Socket.IO v4.8 (Rooms + Event Broadcasting)
- **Security**: CORS, Parameterized SQL queries, Role-based middleware

---

## System Architecture

```
┌────────────────────────────────────────────────────────┐
│               Frontend (React 19 + Vite)               │
│      Student UI │ Kitchen KDS │ Counter │ Admin        │
└──────────────┬───────────────────────────▲─────────────┘
               │                           │
         HTTP REST APIs                Socket.IO
       (Bearer JWT Auth)            Live State Broadcast
               │                           │
┌──────────────▼───────────────────────────┴─────────────┐
│               Express.js Backend (Node.js)             │
│   ├── authMiddleware & roleMiddleware                  │
│   ├── Controllers (auth, order, kitchen, counter, etc.)│
│   └── Socket.IO Event Engine                           │
└──────────────────────────────┬─────────────────────────┘
                               │
                      Parameterized SQL
                     Atomic Transactions
                               │
┌──────────────────────────────▼─────────────────────────┐
│                     MySQL Database                     │
│    users │ canteens │ menu_items │ orders │ ratings    │
└────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
CampusEats/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               # MySQL connection pool
│   │   ├── controllers/
│   │   │   ├── adminController.js    # Admin metrics, users, orders
│   │   │   ├── authController.js     # Register, login, me
│   │   │   ├── counterController.js  # Counter order retrieval & collection
│   │   │   ├── kitchenController.js  # Kitchen KDS queue & status advancement
│   │   │   ├── menuController.js     # Menu retrieval & admin item management
│   │   │   ├── orderController.js    # Order creation, cancellation & refund
│   │   │   ├── ratingController.js   # Order ratings & feedback
│   │   │   └── walletController.js   # Wallet balance, top-up, transactions
│   │   ├── middlewares/
│   │   │   └── authMiddleware.js     # JWT verification & role authorization
│   │   ├── routes/
│   │   │   ├── adminRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── counterRoutes.js
│   │   │   ├── kitchenRoutes.js
│   │   │   ├── menuRoutes.js
│   │   │   ├── orderRoutes.js
│   │   │   ├── ratingRoutes.js
│   │   │   └── walletRoutes.js
│   │   └── server.js                 # Express server & Socket.IO initialization
│   ├── package.json
│   └── .env                          # Backend environment configuration
│
├── src/
│   ├── components/
│   │   ├── admin/                    # Admin panel & analytics
│   │   ├── common/                   # Shared UI, modals, toasts, cart
│   │   ├── counter/                  # Counter pickup view
│   │   ├── kitchen/                  # Kitchen KDS displays
│   │   ├── student/                  # Menu browsing, active tokens, checkout
│   │   └── Header.tsx                # Role switcher, wallet balance, profile
│   ├── context/
│   │   └── AppContext.tsx            # Global state, real-time sync, role guards
│   ├── pages/
│   │   ├── LoginPage.tsx             # Modern auth card & quick test accounts
│   │   ├── StudentPage.tsx
│   │   ├── KitchenPage.tsx
│   │   ├── CounterPage.tsx
│   │   └── AdminPage.tsx
│   ├── types/
│   │   └── index.ts                  # Shared TypeScript interfaces
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── README.md
```

---

## Database Schema

The system uses a relational MySQL database named `campuseats_db`:

- **`users`**: `id`, `name`, `email`, `password` (bcrypt hash), `role` (`student`, `kitchen`, `counter`, `admin`), `wallet_balance`.
- **`canteens`**: `id`, `name`, `location`, `opening_time`, `closing_time`, `is_active`.
- **`menu_items`**: `id`, `canteen_id`, `name`, `description`, `price`, `category`, `prep_time_minutes`, `is_veg`, `is_available`, `stock_quantity`.
- **`orders`**: `id`, `token_number`, `user_id`, `canteen_id`, `total_amount`, `payment_method`, `payment_status` (`pending`, `paid`, `failed`), `status` (`placed`, `accepted`, `preparing`, `ready`, `completed`, `cancelled`), `created_at`.
- **`order_items`**: `id`, `order_id`, `menu_item_id`, `quantity`, `price`, `customization`.
- **`wallet_transactions`**: `id`, `user_id`, `amount`, `type` (`credit`, `debit`), `reference`, `created_at`.
- **`ratings`**: `id`, `order_id`, `user_id`, `rating` (1–5), `review`, `created_at`.

> **Note on Schema Safety**: The column `orders.payment_status` strictly adheres to `ENUM('pending', 'paid', 'failed')`. Order cancellations maintain `payment_status = 'paid'`, set `status = 'cancelled'`, and record refunds as a `credit` transaction in `wallet_transactions`.

---

## Authentication & Security

1. **Password Security**: Passwords are encrypted before database insertion using `bcryptjs` (salt rounds = 10).
2. **JWT Tokens**: Emitted upon successful login with an expiration time. Transmitted in standard `Authorization: Bearer <token>` HTTP headers.
3. **Role-Based Access Control (RBAC)**:
   - `authMiddleware`: Verifies token signature and checks expiry.
   - `roleMiddleware(...allowedRoles)`: Rejects unauthorized roles with HTTP 403 Forbidden.
4. **SQL Injection Defense**: 100% of queries use parameterized bindings (`?`) via `mysql2/promise`.
5. **Session Verification**: The `/api/auth/me` endpoint ensures frontend local state stays strictly synchronized with the database.

---

## API Overview

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Create a new user account | Public |
| `POST` | `/api/auth/login` | Authenticate and receive JWT | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile & balance | Authenticated |
| `GET` | `/api/menu` | Browse menu items by canteen | Authenticated |
| `POST` | `/api/menu` | Add new menu item | Admin |
| `PUT` | `/api/menu/:id` | Update menu item details | Admin |
| `PATCH` | `/api/menu/:id/toggle` | Toggle menu item availability | Admin |
| `POST` | `/api/orders` | Create an order with wallet debit & token | Student |
| `GET` | `/api/orders/my-orders` | Fetch personal order history with ratings | Student |
| `PATCH` | `/api/orders/:id/cancel` | Cancel order and execute wallet refund | Student (Owner) |
| `GET` | `/api/kitchen/orders` | Active kitchen queue with customizations | Kitchen / Admin |
| `PATCH` | `/api/kitchen/orders/:id/status`| Update prep status (`preparing`, `ready`) | Kitchen / Admin |
| `GET` | `/api/counter/orders` | Ready orders awaiting customer pickup | Counter / Admin |
| `PATCH` | `/api/counter/orders/:id/collect`| Complete handover (`completed`) | Counter / Admin |
| `GET` | `/api/wallet/balance` | Retrieve current wallet balance | Authenticated |
| `POST` | `/api/wallet/add-money` | Top-up student wallet | Authenticated |
| `GET` | `/api/wallet/transactions` | Fetch wallet transaction statement | Authenticated |
| `POST` | `/api/ratings` | Submit rating & review for completed meal | Student (Owner) |
| `GET` | `/api/admin/stats` | Campus analytics, revenue, order totals | Admin |
| `GET` | `/api/admin/users` | Campus user directory (passwords hidden) | Admin |
| `GET` | `/api/admin/orders` | Global orders overview | Admin |

---

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- MySQL Server running locally on port 3306

### 1. Clone the Repository
```bash
git clone https://github.com/namit27y-dotcom/CampusEats.git
cd CampusEats
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Configure Backend Environment
Create a `.env` file inside the `backend/` directory:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=campuseats_db
JWT_SECRET=your_super_secret_jwt_key
CORS_ORIGIN=http://localhost:5173
```

### 4. Database Setup
Import the provided SQL schema or initialize the database tables in MySQL:
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS campuseats_db;"
```

---

## Running the Application

### Terminal 1 — Backend Server
```bash
cd backend
npm start
```
*Backend runs on `http://localhost:5000`*

### Terminal 2 — Frontend Development Server
```bash
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## End-to-End Testing Guide

You can sign in using the **Quick Test Accounts** on the login page:

| Persona | Email | Password |
|---|---|---|
| **Student** | `student@campuseats.com` | `student123` |
| **Kitchen Staff** | `kitchen@campuseats.com` | `kitchen123` |
| **Counter Staff** | `counter@campuseats.com` | `counter123` |
| **Administrator** | `admin@campuseats.com` | `admin123` |

### Recommended Test Lifecycle:
1. **Student**: Log in, top up wallet if needed, add food items to cart, checkout. A digital token (e.g. `TK-101`) is generated.
2. **Kitchen**: Log in as Kitchen. The new order ticket appears in real time via Socket.IO. Click **Start Preparing** $\to$ **Mark Ready**.
3. **Counter**: Log in as Counter. The order appears in the Ready queue. Click **Mark Collected**.
4. **Student**: The token marks as completed. Student submits a 5-star rating with review.

---

## Future Improvements

- **Native Mobile Apps**: React Native or Flutter companion apps for students with push notifications.
- **Automated Food Lockers**: Integration with IoT smart pickup lockers that unlock via QR scan.
- **Production Payment Gateway**: Direct integration with Razorpay / Stripe for automated UPI/Card webhooks.
- **AI Demand Prediction**: Machine learning model forecasting peak break rush based on semester schedules.

---

## License
This project is open source and available under the [MIT License](LICENSE).
