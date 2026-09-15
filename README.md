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

> **CampusEats** is a full-stack smart canteen management platform that replaces traditional cafeteria queues with digital pre-orders, digital tokens, online payment tracking, real-time kitchen updates, and organized pickup.
>
> 🌐 **Live Application:** [campus-eats-ruby.vercel.app](https://campus-eats-ruby.vercel.app/)  
> 📁 **GitHub Repository:** [github.com/namit27y-dotcom/CampusEats](https://github.com/namit27y-dotcom/CampusEats)

---

## 📖 Table of Contents

* [Overview](#-overview)
* [Problem Statement](#-problem-statement)
* [Key Features](#-key-features)
* [User Roles](#-user-roles)
* [Technology Stack](#-technology-stack)
* [System Architecture](#-system-architecture)
* [Project Structure](#-project-structure)
* [Database Design](#-database-design)
* [Authentication & Security](#-authentication--security)
* [Order Lifecycle](#-order-lifecycle)
* [Payment & Wallet](#-payment--wallet)
* [Real-Time Communication](#-real-time-communication)
* [API Overview](#-api-overview)
* [Installation](#-installation)
* [Environment Configuration](#-environment-configuration)
* [Running the Application](#-running-the-application)
* [Testing](#-testing)
* [End-to-End Workflow](#-end-to-end-workflow)
* [Future Improvements](#-future-improvements)
* [Project Status](#-project-status)
* [License](#-license)

---

# 🚀 Overview

CampusEats is designed for college and university campuses where students often face long queues during breaks.

Instead of waiting at the canteen counter, students can:

1. Browse the available menu.
2. Add food items to their cart.
3. Customize items where supported.
4. Select a payment method.
5. Place an order.
6. Receive a digital token.
7. Track the order in real time.
8. Collect the food when the order is ready.
9. Rate the completed order.

At the same time, kitchen staff receive and process orders through a dedicated Kitchen Display System, while counter staff handle final food collection.

Administrators can monitor the system and manage menu and user-related operations.

---

# 🎯 Problem Statement

Traditional college canteen systems commonly involve:

* Long queues during break periods.
* Manual order management.
* Physical tokens.
* Difficulty tracking order status.
* Repeated communication between students and kitchen staff.
* Limited visibility into canteen operations.
* Manual handling of refunds and order records.

CampusEats addresses these problems through a centralized digital ordering and management platform.

### Traditional Flow

```text
Student
   ↓
Physical Queue
   ↓
Place Order
   ↓
Wait
   ↓
Ask for Status
   ↓
Collect Food
```

### CampusEats Flow

```text
Student
   ↓
Browse Menu
   ↓
Pre-Order
   ↓
Digital Payment
   ↓
Digital Token
   ↓
Real-Time Tracking
   ↓
Food Ready
   ↓
Pickup Counter
```

---

# ✨ Key Features

### 👨‍🎓 Student

* Secure login and registration
* Browse available canteens
* Browse live menu
* Add/remove cart items
* Food customization
* Automatic order total calculation
* Digital token generation
* Wallet payments
* UPI/Card/Cash demo payment modes
* Order history
* Real-time order tracking
* Order cancellation where permitted
* Wallet refund for eligible cancellations
* Wallet transaction history
* Ratings and reviews for completed orders

### 👨‍🍳 Kitchen

* Dedicated Kitchen Display System
* View active incoming orders
* View student/order information
* View food items and customization details
* Accept orders
* Move orders to preparation
* Mark orders as ready
* Call digital tokens
* Real-time order updates

### 🧾 Counter

* Dedicated pickup interface
* View ready orders
* Search orders using token numbers
* Verify orders
* Mark orders as collected

### 👨‍💼 Administrator

* Dashboard statistics
* View campus users
* View orders
* Menu management
* Add menu items
* Update menu items
* Toggle menu availability
* Monitor overall canteen activity

---

# 👥 User Roles

| Role                    | Responsibilities                              |
| ----------------------- | --------------------------------------------- |
| 👨‍🎓 **Student**       | Browse, customize, order, pay, track and rate |
| 👨‍🍳 **Kitchen Staff** | Manage incoming orders and food preparation   |
| 🧾 **Counter Staff**    | Handle ready orders and customer pickup       |
| 👨‍💼 **Administrator** | Manage users, menu and system operations      |

Role-based authorization prevents users from accessing APIs outside their assigned responsibilities.

---

# 🛠️ Technology Stack

## Frontend

* **React 19**
* **TypeScript**
* **Vite**
* **Tailwind CSS**
* **React Context API**
* **Lucide React**
* **Fetch API**
* **Socket.IO Client**

## Backend

* **Node.js**
* **Express.js**
* **MySQL**
* **mysql2**
* **JWT**
* **bcryptjs**
* **Socket.IO**
* **CORS**
* **dotenv**

## Development

* Git
* GitHub
* VS Code
* npm

---

# 🏗️ System Architecture

```text
                         CAMPUS EATS
                              │
             ┌────────────────┴────────────────┐
             │                                 │
             ▼                                 ▼
     ┌─────────────────┐              ┌─────────────────┐
     │ React Frontend  │              │ Socket.IO       │
     │ Vite + TS       │◄────────────►│ Real-Time Layer │
     └────────┬────────┘              └────────┬────────┘
              │                                │
              │ REST API                       │
              │ Bearer JWT                     │
              ▼                                │
     ┌─────────────────────────────────────────┐
     │          Express.js Backend             │
     │                                         │
     │  Authentication                         │
     │  Authorization                          │
     │  Orders                                 │
     │  Menu                                   │
     │  Wallet                                 │
     │  Kitchen                                │
     │  Counter                                │
     │  Ratings                                │
     │  Admin                                  │
     └──────────────────┬──────────────────────┘
                        │
                        │ mysql2
                        ▼
              ┌────────────────────┐
              │    MySQL 8.0       │
              │ campuseats_db      │
              └────────────────────┘
```

---

# 📂 Project Structure

```text
CampusEats/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── authController.js
│   │   │   ├── canteenController.js
│   │   │   ├── counterController.js
│   │   │   ├── kitchenController.js
│   │   │   ├── menuController.js
│   │   │   ├── orderController.js
│   │   │   ├── ratingController.js
│   │   │   └── walletController.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── roleMiddleware.js
│   │   │
│   │   ├── routes/
│   │   │   ├── adminRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── canteenRoutes.js
│   │   │   ├── counterRoutes.js
│   │   │   ├── kitchenRoutes.js
│   │   │   ├── menuRoutes.js
│   │   │   ├── orderRoutes.js
│   │   │   ├── ratingRoutes.js
│   │   │   └── walletRoutes.js
│   │   │
│   │   └── server.js
│   │
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── package-lock.json
│
├── src/
│   ├── components/
│   │   ├── admin/
│   │   ├── common/
│   │   ├── counter/
│   │   ├── kitchen/
│   │   └── student/
│   │
│   ├── context/
│   │   └── AppContext.tsx
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── StudentPage.tsx
│   │   ├── KitchenPage.tsx
│   │   ├── CounterPage.tsx
│   │   └── AdminPage.tsx
│   │
│   ├── types/
│   ├── utils/
│   │   └── api.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── .gitignore
├── package.json
├── package-lock.json
├── vite.config.ts
└── README.md
```

---

# 🗄️ Database Design

The backend uses a MySQL database named:

```text
campuseats_db
```

### Main Tables

| Table                 | Purpose                                             |
| --------------------- | --------------------------------------------------- |
| `users`               | Stores student, kitchen, counter and admin accounts |
| `canteens`            | Stores canteen information                          |
| `menu_items`          | Stores food items and availability                  |
| `orders`              | Stores orders, tokens and payment information       |
| `order_items`         | Stores individual items in an order                 |
| `wallet_transactions` | Stores wallet credits and debits                    |
| `ratings`             | Stores order ratings and reviews                    |

### Important Order Fields

```text
id
user_id
canteen_id
total_amount
token_number
status
payment_method
payment_status
payment_transaction_id
created_at
```

### Order Status

```text
placed
   ↓
accepted
   ↓
preparing
   ↓
ready
   ↓
completed
```

Cancellation is supported before the order reaches the restricted preparation/ready stages.

---

# 🔐 Authentication & Security

CampusEats uses JWT-based authentication with role-based access control.

### Authentication Flow

```text
Login
  ↓
Email + Password Validation
  ↓
bcrypt Password Verification
  ↓
JWT Generation
  ↓
Frontend Stores Token
  ↓
Authorization: Bearer <token>
  ↓
JWT Middleware
  ↓
Role Authorization
  ↓
Protected API
```

### Security Measures

* Password hashing using `bcryptjs`
* JWT authentication
* JWT expiry
* Role-based authorization
* Protected backend routes
* Parameterized MySQL queries
* CORS configuration
* Environment variables for secrets
* Database transactions for sensitive operations
* Row locking for wallet deductions/refunds

> Never commit `.env`, passwords, JWT secrets or access tokens to GitHub.

---

# 🎟️ Order Lifecycle

CampusEats uses a structured order state machine.

```text
             ┌──────────────┐
             │    PLACED    │
             └──────┬───────┘
                    ↓
             ┌──────────────┐
             │   ACCEPTED   │
             └──────┬───────┘
                    ↓
             ┌──────────────┐
             │  PREPARING  │
             └──────┬───────┘
                    ↓
             ┌──────────────┐
             │    READY     │
             └──────┬───────┘
                    ↓
             ┌──────────────┐
             │  COMPLETED   │
             └──────────────┘

Cancellation
     ↓
CANCELLED
```

The frontend maps these backend statuses to its UI statuses:

```text
placed     → CONFIRMED
accepted   → ACCEPTED
preparing  → PREPARING
ready      → READY
completed  → COLLECTED
cancelled  → CANCELLED
```

---

# 💳 Payment & Wallet

CampusEats supports:

* Wallet
* UPI demo
* Card demo
* Cash

## Wallet Payment Flow

```text
Student Places Order
        ↓
Calculate Total
        ↓
Lock Wallet Row
        ↓
Check Balance
        ↓
Deduct Amount
        ↓
Create Debit Transaction
        ↓
Mark Payment as Paid
        ↓
Create Order
```

Wallet operations use database transactions to prevent inconsistent balances.

## Refund Flow

For an eligible cancellation:

```text
Cancel Order
     ↓
Verify Order Owner
     ↓
Verify Cancellation Allowed
     ↓
Lock Order + Wallet
     ↓
Credit Wallet
     ↓
Create Refund Transaction
     ↓
Mark Order Cancelled
```

The database maintains the existing payment status values:

```text
pending
paid
failed
```

Refunds are represented through wallet credit transactions rather than introducing an unsupported `refunded` payment status.

---

# 🔄 Real-Time Communication

Socket.IO provides real-time communication between the backend and connected clients.

### New Order

```text
Student
   ↓
Place Order
   ↓
Express API
   ↓
MySQL
   ↓
Socket.IO
   ↓
Kitchen Dashboard
```

### Status Update

```text
Kitchen
   ↓
Update Status
   ↓
Express API
   ↓
Socket.IO Event
   ↓
Student
   ↓
UI Updates Instantly
```

Example events include:

```text
newOrderCreated
orderStatusUpdated
```

This allows students and staff to receive updates without manually refreshing the page.

---

# 🔌 API Overview

Base API URL:

```text
http://localhost:5000/api
```

| Method | Endpoint                      | Purpose                    | Access            |
| ------ | ----------------------------- | -------------------------- | ----------------- |
| POST   | `/auth/register`              | Register user              | Public            |
| POST   | `/auth/login`                 | Login                      | Public            |
| GET    | `/auth/me`                    | Current authenticated user | Authenticated     |
| GET    | `/canteens`                   | Get active canteens        | Public/Configured |
| GET    | `/canteens/:id`               | Get canteen                | Public/Configured |
| GET    | `/menu/:canteenId`            | Get canteen menu           | Authenticated     |
| POST   | `/orders`                     | Create order               | Student           |
| GET    | `/orders/my-orders`           | Get student orders         | Student           |
| PATCH  | `/orders/:id/cancel`          | Cancel eligible order      | Student/Owner     |
| GET    | `/kitchen/orders`             | Kitchen active orders      | Kitchen/Admin     |
| PATCH  | `/kitchen/orders/:id/status`  | Update order status        | Kitchen/Admin     |
| GET    | `/counter/orders`             | Get pickup queue           | Counter/Admin     |
| PATCH  | `/counter/orders/:id/collect` | Collect order              | Counter/Admin     |
| GET    | `/wallet/balance`             | Get wallet balance         | Authenticated     |
| POST   | `/wallet/add-money`           | Add wallet money           | Authenticated     |
| GET    | `/wallet/transactions`        | Wallet history             | Authenticated     |
| POST   | `/ratings`                    | Submit rating              | Student/Owner     |
| GET    | `/ratings/:orderId`           | Get rating                 | Authenticated     |
| GET    | `/admin/stats`                | Dashboard statistics       | Admin             |
| GET    | `/admin/users`                | View users                 | Admin             |
| GET    | `/admin/orders`               | View global orders         | Admin             |

---

# ⚙️ Installation

## Prerequisites

Install the following:

* Node.js 18+
* npm
* MySQL 8+
* Git
* VS Code

---

## 1. Clone Repository

```bash
git clone https://github.com/namit27y-dotcom/CampusEats.git
cd CampusEats
```

---

## 2. Install Frontend Dependencies

From the project root:

```bash
npm install
```

---

## 3. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

---

# 🔧 Environment Configuration

Create:

```text
backend/.env
```

Use your own local credentials:

```env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=campuseats_db
DB_PORT=3306

JWT_SECRET=YOUR_SECRET_KEY
CORS_ORIGIN=http://localhost:5173
```

### Important

Do **not** upload `.env` to GitHub.

The repository already uses `.gitignore` to prevent environment files and local test credentials from being committed.

---

# 🗃️ Database Setup

Create the database:

```sql
CREATE DATABASE IF NOT EXISTS campuseats_db;
```

Then create the required CampusEats tables.

The application expects MySQL to be running on the configured port, normally:

```text
3306
```

---

# ▶️ Running the Application

CampusEats uses separate frontend and backend development servers.

## Terminal 1 — Backend

```bash
cd backend
npm run dev
```

Backend:

```text
http://localhost:5000
```

### Health Check

Open:

```text
http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "status": "OK",
  "database": "Connected"
}
```

---

## Terminal 2 — Frontend

From the project root:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Open:

```text
http://localhost:5173
```

---

# 🧪 Testing

## Frontend Build

```bash
npm run build
```

## TypeScript Check

```bash
npx tsc --noEmit
```

A successful production build should complete without compilation errors.

---

# 🔁 End-to-End Workflow

A complete CampusEats test can follow this sequence:

### 1. Student

```text
Login
 ↓
Browse Menu
 ↓
Add Items
 ↓
Customize Item
 ↓
Checkout
 ↓
Select Payment
 ↓
Place Order
 ↓
Receive Token
```

### 2. Kitchen

```text
Login as Kitchen
 ↓
Receive New Order
 ↓
Accept
 ↓
Start Preparing
 ↓
Mark Ready
```

### 3. Student

```text
Receive Real-Time READY Update
 ↓
Go to Pickup Counter
```

### 4. Counter

```text
Login as Counter
 ↓
Find Token
 ↓
Verify Order
 ↓
Mark Collected
```

### 5. Student

```text
Order Completed
 ↓
Submit Rating & Review
```

---

# 📱 Responsive Design

The frontend is designed for:

* 📱 Mobile devices
* 📟 Tablets
* 💻 Laptops
* 🖥️ Desktop screens

The interface is optimized for responsive layouts while maintaining the application's core visual design and user experience.

---

# 📊 Core System Benefits

### For Students

* Less waiting
* Digital ordering
* Easy payment
* Live status tracking
* Digital token
* Convenient pickup

### For Kitchen Staff

* Organized queue
* Clear order details
* Customization visibility
* Real-time order management

### For Counter Staff

* Token-based pickup
* Faster verification
* Reduced confusion

### For Administrators

* Centralized management
* User visibility
* Menu control
* Operational statistics

---

# 🔮 Future Improvements

Possible future enhancements include:

* 🤖 AI-powered food recommendations
* 📈 Machine-learning demand prediction
* 📊 Advanced sales analytics
* 📱 Native mobile application
* 🔔 Push notifications
* 💳 Production Razorpay/Stripe integration
* 📍 Multi-campus support
* 📦 Inventory forecasting
* 🧾 Digital receipts
* 🥗 Personalized nutrition recommendations
* 🔐 Additional production security controls

---

# 📌 Project Status

**CampusEats is currently a functional full-stack project/prototype.**

### Implemented

* ✅ React frontend
* ✅ TypeScript
* ✅ Responsive UI
* ✅ Express.js backend
* ✅ MySQL database
* ✅ JWT authentication
* ✅ bcrypt password hashing
* ✅ Role-based authorization
* ✅ Canteen APIs
* ✅ Menu APIs
* ✅ Student ordering
* ✅ Digital token generation
* ✅ Food customization
* ✅ Wallet system
* ✅ Payment tracking
* ✅ Order cancellation
* ✅ Wallet refunds
* ✅ Kitchen Display System
* ✅ Counter pickup system
* ✅ Socket.IO real-time updates
* ✅ Ratings and reviews
* ✅ Admin functionality

---

# 🔒 Production Considerations

Before deploying CampusEats to a production environment:

* Use strong production secrets.
* Use HTTPS.
* Use a production MySQL instance.
* Configure restricted CORS origins.
* Add API rate limiting.
* Add stronger request validation.
* Integrate a real payment gateway.
* Use secure production environment variables.
* Rotate all development credentials.
* Configure production logging and monitoring.

---

# 🤝 Contributing

Contributions are welcome.

Recommended workflow:

```text
Fork / Clone
    ↓
Create Feature Branch
    ↓
Make Changes
    ↓
Test
    ↓
Commit
    ↓
Push Branch
    ↓
Create Pull Request
```

Please avoid directly modifying the main branch when working collaboratively.

---

# 📄 License

This project is intended for educational, academic, portfolio, and demonstration purposes.

If the repository includes an MIT license file, the project is available under the **MIT License**.

---

# ⭐ CampusEats

### **Order Smart. Skip the Queue. Eat Fresh.**

Built to make campus food ordering **faster, smarter, and more organized.**

* 🌐 **Live Demo:** https://campus-eats-ruby.vercel.app/
* 📁 **GitHub:** https://github.com/namit27y-dotcom/CampusEats

