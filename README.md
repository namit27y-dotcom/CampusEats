# CampusEats — Smart Canteen Pre-Order & Digital Token System

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0.3-black?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

> **CampusEats** is a full-stack campus food pre-ordering, digital token generation, and real-time kitchen queue management platform. Designed specifically for universities and colleges to eliminate long canteen break lines, streamline kitchen prep workflows, and ensure contactless campus dining.

---

## Table of Contents
1. [Key Features by Role](#key-features-by-role)
2. [Dual Tech Stack Implementations](#dual-tech-stack-implementations)
3. [Quick Start: Python Flask + SQLite/MySQL App](#quick-start-python-flask--sqlitemysql-app)
4. [Quick Start: React + TypeScript App](#quick-start-react--typescript-app)
5. [Database Architecture & Schema](#database-architecture--schema)
6. [REST API Reference](#rest-api-reference)
7. [Design System & Theme Guidelines](#design-system--theme-guidelines)
8. [Project Directory Structure](#project-directory-structure)
9. [Export & Deployment](#export--deployment)

---

## Key Features by Role

### 🎓 1. Student Ordering Portal
- **Multi-Canteen Switching**: Switch between Main Academic Canteen, Engineering Block Cafe, and Hostel Mess with individual queue statuses and wait times.
- **Smart Dietary Filtering**: Instant search by meal category (`South Indian`, `North Indian`, `Snacks`, `Chinese`, `Beverages`) and dietary preference (100% Pure Veg vs. Non-Veg).
- **Meal Customizer**: Select spice levels, preparation instructions, extra dips/sambar, and add-ons before adding to cart.
- **Cashless Student Wallet**: One-click deduction from campus student IDs with real-time balance tracking.
- **Digital Token Generator**: Issues unique sequential digital tokens (e.g., `#A134`) upon checkout with automated order confirmation.
- **Live Order Tracker**: Real-time 4-stage tracking progress (`Confirmed` → `Preparing` → `Ready for Pickup` → `Collected`).
- **QR Token Verification**: Generates high-contrast QR codes for touchless scanner verification at canteen pickup counters.
- **Order History & Ratings**: View past receipts, re-order favorite meals, and submit 5-star ratings with feedback tags.

### 🍳 2. Kitchen Display System (KDS)
- **Live Ticket Pipeline**: Displays active orders grouped by status with preparation timers and itemized quantities.
- **One-Click Cooking Workflow**: Kitchen staff can advance orders from `CONFIRMED` to `PREPARING` and `READY`.
- **Live Canteen Rush Meter**: Tracks active order count and notifies chefs of queue surges.

### 📢 3. Counter Dispatch & Token Calling
- **Visual Token Board**: Displays ready-to-collect tokens categorized by pickup counter numbers.
- **Automated Voice Calling (TTS)**: Built-in speech synthesis (`Web Speech API`) announces token numbers out loud over cafeteria speakers (*"Token number A134, please collect your order at Counter 1"*).
- **One-Click Handover**: Marks orders as `COLLECTED` to instantly clear counter clutter.

### 📊 4. Admin Dashboard & Analytics
- **Live Revenue Metrics**: Real-time calculation of total revenue (₹), total tokens processed, and average ticket size.
- **Catalog & Inventory Management**: Add new food items, update pricing, toggle stock availability, and adjust preparation times.

---

## Dual Tech Stack Implementations

This project contains two fully operational implementations:

| Layer | Stack A: Flask + Bootstrap (Standard Academic & Production Web) | Stack B: React + Tailwind (Modern Interactive SPA) |
|---|---|---|
| **Location** | `/flask_canteen_app/` | `/src/` |
| **Backend** | Python 3.10+ / Flask 3.x | Express / Node.js & Vite Dev Server |
| **Database** | SQLite 3 (`canteen.db`) / MySQL Compatible | TypeScript Memory Store / Firestore Schema ready |
| **Frontend** | HTML5 + CSS3 + Bootstrap 5.3 | React 19 + TypeScript + Tailwind CSS v4 |
| **Interactivity**| Vanilla JavaScript (ES6 Fetch, DOM, Speech API) | React Hooks + Framer Motion Animations |
| **Styling** | Bootstrap 5 + Custom Charcoal/Warm Theme | Tailwind CSS v4 Utility Classes |

---

## Quick Start: Python Flask + SQLite/MySQL App

The Flask implementation is self-contained inside the `flask_canteen_app/` folder.

### 1. Prerequisites
- Python 3.8 or higher (`python3 --version`)
- `pip` package manager

### 2. Installation
```bash
# Navigate to the Flask application directory
cd flask_canteen_app

# Install dependencies
pip install -r requirements.txt
```

### 3. Run the Application
```bash
python app.py
```
*The application will automatically initialize and seed the SQLite database (`canteen.db`) on its first launch.*

### 4. Access in Browser
Open your browser and visit:
```
http://127.0.0.1:5000
```

- **Student Ordering**: `http://127.0.0.1:5000/`
- **Kitchen Display (KDS)**: `http://127.0.0.1:5000/kitchen`
- **Counter Calling**: `http://127.0.0.1:5000/counter`
- **Admin Dashboard**: `http://127.0.0.1:5000/admin`

### Switching from SQLite to MySQL (Optional)
1. Install MySQL driver:
   ```bash
   pip install mysql-connector-python
   ```
2. In `flask_canteen_app/models.py`, replace `get_db_connection()` with:
   ```python
   import mysql.connector

   def get_db_connection():
       return mysql.connector.connect(
           host="localhost",
           user="your_mysql_username",
           password="your_mysql_password",
           database="campus_canteen"
       )
   ```
3. Run `python app.py` — table creation and initial seed data run automatically.

---

## Quick Start: React + TypeScript App

The root directory contains the React SPA powering the live container preview.

### 1. Installation
```bash
npm install
```

### 2. Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 3. Production Build & Linting
```bash
# Type check and lint
npm run lint

# Production build to /dist
npm run build
```

---

## Database Architecture & Schema

The relational database model consists of four core tables:

```
┌─────────────────┐       ┌─────────────────┐
│    canteens     │       │      users      │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ name            │       │ name            │
│ location        │       │ email           │
│ status          │       │ role            │
│ wait_time_mins  │       │ student_id      │
│ current_token   │       │ wallet_balance  │
└────────┬────────┘       └────────┬────────┘
         │                         │
         │ 1:N                     │ 1:N
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│   menu_items    │       │     orders      │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ canteen_id (FK) │       │ token_number    │
│ name            │       │ user_id (FK)    │
│ description     │       │ canteen_id (FK) │
│ price           │       │ items_json      │
│ category        │       │ total_amount    │
│ is_veg          │       │ status          │
│ in_stock        │       │ pickup_counter  │
│ prep_time_mins  │       │ created_at      │
│ image_url       │       └─────────────────┘
│ rating          │
└─────────────────┘
```

### Table Definitions

#### `canteens`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique canteen identifier (e.g., `c1`) |
| `name` | TEXT | NOT NULL | Canteen location name |
| `location` | TEXT | NOT NULL | Building and floor location |
| `status` | TEXT | DEFAULT 'open' | Operating status (`open`, `closed`) |
| `wait_time_minutes`| INTEGER | DEFAULT 12 | Average live wait time in minutes |
| `current_serving_token` | TEXT | DEFAULT 'A134' | Latest token being served |

#### `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | User identifier (e.g., `u1`) |
| `name` | TEXT | NOT NULL | Full name of student or faculty |
| `email` | TEXT | NOT NULL | Campus email address |
| `role` | TEXT | NOT NULL | Role (`student`, `faculty`, `staff`) |
| `student_id` | TEXT | - | Campus roll/ID number |
| `wallet_balance` | REAL | DEFAULT 500.0 | Cashless digital wallet balance in ₹ |

#### `menu_items`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique item identifier (e.g., `m1`) |
| `canteen_id` | TEXT | FOREIGN KEY | References `canteens(id)` |
| `name` | TEXT | NOT NULL | Food item name |
| `description` | TEXT | - | Ingredients and recipe details |
| `price` | REAL | NOT NULL | Price in INR (₹) |
| `category` | TEXT | NOT NULL | Category (`South Indian`, `Snacks`, etc.) |
| `is_veg` | INTEGER | DEFAULT 1 | Dietary flag (1 = Veg, 0 = Non-Veg) |
| `in_stock` | INTEGER | DEFAULT 1 | Availability status |
| `prep_time_minutes` | INTEGER | DEFAULT 8 | Estimated cooking time in minutes |
| `image_url` | TEXT | - | Food photography asset link |
| `rating` | REAL | DEFAULT 4.5 | Average student rating out of 5.0 |

#### `orders`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Order reference ID |
| `token_number` | TEXT | NOT NULL | Public digital token (e.g., `A134`) |
| `user_id` | TEXT | NOT NULL | References `users(id)` |
| `user_name` | TEXT | NOT NULL | Customer name |
| `canteen_id` | TEXT | NOT NULL | References `canteens(id)` |
| `items_json` | TEXT | NOT NULL | Serialized JSON array of ordered items |
| `total_amount` | REAL | NOT NULL | Total billed amount |
| `status` | TEXT | NOT NULL | `CONFIRMED` / `PREPARING` / `READY` / `COLLECTED` |
| `pickup_counter`| TEXT | DEFAULT 'Counter 1' | Assigned pickup counter |
| `created_at` | TIMESTAMP | CURRENT_TIMESTAMP | Order submission timestamp |

---

## REST API Reference

| Method | Endpoint | Description | Request Payload | Response |
|---|---|---|---|---|
| `GET` | `/` | Student ordering view | Query param: `?canteen=c1` | Rendered HTML |
| `GET` | `/kitchen` | Kitchen Display System (KDS) | Query param: `?canteen=c1` | Rendered HTML |
| `GET` | `/counter` | Counter dispatch & calling board | Query param: `?canteen=c1` | Rendered HTML |
| `GET` | `/admin` | Admin dashboard & analytics | Query param: `?canteen=c1` | Rendered HTML |
| `POST` | `/api/order` | Place a new order & issue token | JSON: `{ canteen_id, items, total_amount, user_id }` | `{ success: true, token_number: "A284" }` |
| `POST` | `/api/order/<id>/status` | Update order preparation status | JSON: `{ status: "PREPARING" / "READY" / "COLLECTED" }` | `{ success: true, new_status: "READY" }` |
| `POST` | `/api/menu/add` | Add new item to canteen catalog | Form Data: `name, price, category, is_veg, ...` | HTTP 302 Redirect to `/admin` |

---

## Design System & Theme Guidelines

- **No-Blue Theme Constraint**: The application strictly avoids blue, cyan, and cold-slate palettes.
- **Neutral Charcoal Base**: Deep, modern neutrals (`zinc-900`, `zinc-800`, `zinc-100`, `#18181b`) provide high-contrast legibility without ocular fatigue.
- **Warm Culinary Accents**: Rich amber (`amber-500`), flame orange (`orange-500`), and fresh mint (`emerald-500`) highlight statuses, prices, and dietary tags.
- **Typography**:
  - Headings: `Outfit` (bold, geometric, scannable)
  - Body: `Plus Jakarta Sans` (refined readability)
  - Tokens & Prices: `JetBrains Mono` (clear numeral distinction)
- **Responsive Viewports**: Fully responsive across ultra-compact smartphones (360px), tablets, and full-screen kitchen displays.

---

## Project Directory Structure

```
.
├── flask_canteen_app/               # Python Flask + SQLite/MySQL Application
│   ├── app.py                       # Flask server, route controllers & REST API
│   ├── models.py                    # SQLite/MySQL schemas & initial database seeding
│   ├── requirements.txt             # Python dependencies (Flask, Werkzeug, Jinja2)
│   ├── README.md                    # Dedicated Flask instructions & setup guide
│   ├── static/
│   │   ├── css/
│   │   │   └── custom.css           # Typography, hover effects & custom styles
│   │   └── js/
│   │       └── main.js              # Cart management, API calls & Web Speech TTS
│   └── templates/
│       ├── base.html                # Base layout, navbar, live ticker & modal shell
│       ├── index.html               # Student menu catalog & active token cards
│       ├── kitchen.html             # Kitchen Display System (KDS)
│       ├── counter.html             # Pickup counter dispatcher & token announcer
│       └── admin.html               # Admin inventory catalog & sales dashboard
│
├── src/                             # React 19 + TypeScript + Tailwind Application
│   ├── App.tsx                      # Root state engine & view switcher
│   ├── main.tsx                     # React client bootstrap entry point
│   ├── types.ts                     # TypeScript data interfaces & enums
│   ├── index.css                    # Tailwind CSS v4 styling & animations
│   └── components/
│       ├── Header.tsx               # Top navigation, canteen selector & user badge
│       ├── student/                 # Student view, cart & tracking modals
│       ├── kitchen/                 # Kitchen Display System tickets
│       ├── counter/                 # Pickup counter board & voice announcements
│       ├── admin/                   # Admin catalog editor & metrics
│       └── common/                  # QR Code vector view & shared UI
│
├── index.html                       # Single-page HTML container entry point
├── package.json                     # Node.js dependencies & scripts
├── tsconfig.json                    # TypeScript compiler configuration
├── vite.config.ts                   # Vite build configuration
└── README.md                        # Primary project documentation
```

---

## Export & Deployment

### 1. Export as ZIP
- Click the **Settings** gear menu in Google AI Studio.
- Select **Export as ZIP** to download the complete codebase including both the React and Flask applications.

### 2. Push to GitHub
- Open **Settings → Export to GitHub**.
- Connect your GitHub repository to sync code revisions directly.

### 3. Cloud Run Deployment
- You can deploy either stack directly to Google Cloud Run using standard Docker containers or Cloud Buildpacks.

---

## License
MIT License. Built for educational institutions and campus cafeterias.
