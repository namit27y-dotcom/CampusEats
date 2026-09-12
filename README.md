# CampusEats — Smart Canteen Pre-Order & Digital Token System

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.1-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployable-black?logo=vercel&logoColor=white)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **CampusEats** is a production-grade campus food pre-ordering, digital token issuance, and live kitchen display system. It eliminates peak break-time canteen congestion by replacing physical lines with smart mobile pre-ordering, live token status tracking, and contactless QR pickup verification.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features by Role](#features-by-role)
3. [Tech Stack](#tech-stack)
4. [Architecture & Folder Structure](#architecture--folder-structure)
5. [Installation & Local Setup](#installation--local-setup)
6. [Environment Variables](#environment-variables)
7. [Development & Build Commands](#development--build-commands)
8. [Vercel Deployment Guide](#vercel-deployment-guide)
9. [Database & Service Integration Guide](#database--service-integration-guide)

---

## Project Overview

College and university cafeterias face extreme rush during 15-to-30 minute class breaks, resulting in crowded counters, delayed orders, and food waste. **CampusEats** solves this through a unified role-based portal:

- **Students & Faculty** browse canteens across campus, customize dishes, place pre-orders, and receive instant digital tokens.
- **Kitchen Staff** process tickets in order of arrival with live prep timers, advancing tickets from `CONFIRMED` to `PREPARING` and `READY`.
- **Counter Staff** view ready tokens, call tokens aloud using the **Web Speech API**, and verify orders using high-contrast QR tokens before handoff.
- **Canteen Administrators** track live revenue, order volume, and ticket averages while managing menu items, prices, stock availability, and cooking prep times in real time.

---

## Features by Role

### 🎓 1. Student & Faculty Ordering Portal
- **Multi-Canteen Selection**: Toggle between Main Canteen, Engineering Block Cafe, and Hostel Mess with live wait times and serving tokens.
- **Dietary & Category Filters**: Filter by 100% Pure Veg vs. Non-Veg, and categories (`South Indian`, `North Indian`, `Snacks`, `Beverages`, `Combos`).
- **Item Customization**: Customize spice level, add-ons (extra sambar, cheese, dips), and special preparation requests.
- **Cart & Financials**: Subtotal, campus discounts, and tax computation with item quantity management.
- **Flexible Checkout & Campus Wallet**: Pay via cashless Campus Wallet, UPI, Card, or Pay on Pickup.
- **Instant Digital Token Generation**: Generates sequential digital tokens (e.g. `#A135`) with persistent order confirmation.
- **Live 4-Stage Tracker**: Real-time status pipeline (`CONFIRMED` → `PREPARING` → `READY` → `COLLECTED`).
- **QR Code Verification**: High-contrast SVG QR token displayed on screen for touchless counter scanner check-in.
- **Order History & Feedback**: View past receipts, re-order favorites with one click, and submit 5-star ratings and food quality reviews.

### 🍳 2. Kitchen Display System (KDS)
- **Live Ticket Board**: Categorized ticket columns with item quantities, customization notes, and preparation elapsed timers.
- **Kitchen Workflow Engine**: One-tap progression: `CONFIRMED` → `PREPARING` → `READY`.
- **Auto-Simulation Option**: Built-in queue simulator for automated kitchen order progression during demonstrations.
- **Rush Hour Load Meter**: Real-time monitor tracking active orders and kitchen backlog.

### 📢 3. Pickup Counter Dispatch & Calling Board
- **Live Token Board**: Clean, high-contrast display of tokens ready for customer collection, arranged by counter number.
- **Automated Voice Calling (Web Speech API)**: Cafeteria announcement audio (*"Token number A135, please collect your order at Counter 1"*).
- **One-Click Handover**: Mark tokens as `COLLECTED` to clear counter queues and notify students.
- **Quick Token Lookup**: Instant token search to verify and clear collected orders.

### 📊 4. Admin Dashboard & Inventory Manager
- **Live Sales Analytics**: Track total gross revenue (₹), total tokens generated, average ticket value, and completion rates.
- **Menu Catalog Management**: Add new dishes, adjust prices, edit item descriptions, and update photo URLs.
- **Stock Availability Toggles**: Mark items in-stock or out-of-stock instantly with stock quantity tracking.
- **Prep Time Adjustments**: Dynamically alter estimated preparation times during high-volume rush periods.
- **Real-Time Order Activity Feed**: Audit trail of all campus transactions with timestamps.

---

## Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Framework** | [React 19](https://react.dev/) | Modern functional UI with concurrent rendering and hooks |
| **Language** | [TypeScript 5.8](https://www.typescriptlang.org/) | Strict type safety for all models, props, state, and services |
| **Build Tool** | [Vite 6](https://vitejs.dev/) | Sub-second dev server boot and optimized production bundle |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | High-performance CSS engine with warm culinary styling |
| **Icons** | [Lucide React](https://lucide.dev/) | Modern, accessible SVG icon library |
| **Animations** | [Motion](https://motion.dev/) | Fluid micro-interactions and route/state transitions |
| **AI Assistant** | [Google Gemini](https://ai.google.dev/) / Smart Engine | Meal recommendations and natural language cafeteria Q&A |
| **Audio & Speech** | Web Speech API | Native browser text-to-speech for cafeteria token announcements |
| **Persistence** | LocalStorage State | Robust, fault-tolerant persistence with zero setup required |
| **Deployment** | [Vercel](https://vercel.com/) | Zero-config static output deployment with SPA rewrites |

---

## Architecture & Folder Structure

CampusEats uses a clean modular architecture separating presentation, state management, services, and types:

```
src/
├── components/
│   ├── common/
│   │   └── QRCodeView.tsx            # High-contrast QR code vector generator
│   ├── student/
│   │   ├── StudentView.tsx           # Menu catalog, search, and category filter
│   │   ├── CartModal.tsx             # Slide-over cart, wallet payment & checkout
│   │   ├── OrderTrackingModal.tsx    # 4-stage tracking progress & QR pass
│   │   └── OrderHistoryModal.tsx     # Past order receipts, reorder & ratings
│   ├── kitchen/
│   │   └── KitchenDisplaySystem.tsx  # KDS ticket columns & status progression
│   ├── counter/
│   │   └── CounterDashboard.tsx      # Ready token board & speech synthesizer
│   ├── admin/
│   │   └── AdminPanel.tsx            # Revenue metrics & menu/inventory editor
│   └── Header.tsx                    # Role switcher, canteen selector & wallet
│
├── pages/                            # Role view page wrappers
│   ├── StudentPage.tsx
│   ├── KitchenPage.tsx
│   ├── CounterPage.tsx
│   ├── AdminPage.tsx
│   └── index.ts
│
├── services/                         # Clean service layer (backend-ready)
│   ├── storageService.ts             # Typed storage persistence & fallbacks
│   ├── canteenService.ts             # Canteens & menu catalog operations
│   ├── orderService.ts               # Token generator & order financial math
│   └── index.ts
│
├── types/                            # Centralized TypeScript definitions
│   └── index.ts                      # Interfaces: Order, MenuItem, Canteen, etc.
│
├── hooks/                            # Custom React hooks
│   ├── useApp.ts                     # Context access hook
│   └── index.ts
│
├── utils/
│   └── soundEffects.ts               # Web Speech API token announcer & chimes
│
├── context/
│   └── AppContext.tsx                # Centralized state provider & reducers
│
├── data/
│   └── mockData.ts                   # Initial seed data for canteens & menus
│
├── App.tsx                           # Root application layout & active order bar
├── main.tsx                          # React 19 entry point
└── index.css                         # Tailwind CSS v4 imports & theme styles
```

---

## Installation & Local Setup

### 1. Prerequisites
- **Node.js**: `v18.0.0` or later (Node.js 20+ recommended)
- **npm**: `v9.0.0` or later

### 2. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-username/campuseats.git

# Enter the project directory
cd campuseats

# Install dependencies
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser to access the application.

---

## Environment Variables

The application runs seamlessly without requiring mandatory external API keys for core pre-ordering and token management. For optional external services, copy the template:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `APP_URL` | Optional | Host URL of the deployed application |
| `GEMINI_API_KEY` | Optional | Google GenAI key for AI-assisted meal recommendations |

---

## Development & Build Commands

| Command | Action |
|---|---|
| `npm run dev` | Starts Vite local development server on `http://localhost:3000` |
| `npm run build` | Compiles TypeScript and builds production bundles to `/dist` |
| `npm run preview` | Runs a local static preview server of the `/dist` build |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) to verify zero errors |
| `npm run clean` | Removes build artifacts (`dist/`) |

---

## Vercel Deployment Guide

CampusEats is pre-configured with a production-ready `vercel.json` for one-click deployment:

### Deploying via Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy directly
vercel
```

### Deploying via Vercel Web Dashboard
1. Push your code to your **GitHub**, **GitLab**, or **Bitbucket** repository.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your `campuseats` repository.
4. Set the build configuration:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Click **Deploy**. Vercel will build and host your application with global CDN caching and SSL.

---

## License

This project is licensed under the MIT License — open for university and cafeteria deployments.
