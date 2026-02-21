<div align="center">

# 🚛 FleetFlow

**Enterprise Fleet Management System — Built for the Indian logistics industry**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-010101?style=flat-square&logo=socket.io)](https://socket.io/)

*A full-stack fleet management platform featuring real-time live tracking, trip dispatch, driver performance monitoring, operational analytics, and expense management — all in a modern dark-mode UI.*

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Pages & Modules](#-pages--modules)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Real-Time Tracking](#-real-time-tracking)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)

---

## 🌟 Overview

FleetFlow is a production-grade fleet management system designed for **Indian logistics companies**. It provides operations managers, dispatchers, safety officers, and finance teams with a single platform to:

- Monitor **18+ active vehicles** on a live interactive map
- Dispatch trips between **25+ major Indian cities**
- Track **driver safety scores**, license validity, and duty status
- Log **fuel costs and operational expenses** per trip
- Generate **analytics reports** with charts, KPI cards, and PDF export
- Receive **real-time WebSocket updates** every 4 seconds — no page refresh needed

---

## ✨ Features

### 🗺️ Live Fleet Tracking
- Interactive Leaflet map powered by **OpenStreetMap** (no API key required)
- Animated truck markers with pulsing rings — 🟢 In Transit, 🟡 Dispatched
- GPS position **simulated via interpolation** (60 km/h avg between city coords)
- Click any marker for driver, vehicle, progress, and ETA popup
- Right-side trip status panel with **real-time progress bars**
- Socket.io connection indicator — live / offline pill

### 🧭 Trip Dispatcher
- Create, dispatch, and complete trips with a clean slide-in form
- Assign vehicles + drivers from dropdowns with live availability checks
- Status workflow: `DRAFT → DISPATCHED → IN_TRANSIT → COMPLETED`
- Auto-updates vehicle and dashboard status on transition

### 🚗 Vehicle Registry
- Full vehicle lifecycle management: add, edit, view, retire
- Status badges: `AVAILABLE`, `ON_TRIP`, `IN_SHOP`, `RETIRED`
- Sortable table with fuel level, mileage, type, and payload

### 🧑‍✈️ Driver Performance
- Safety Score formula: `(trips × 2) − (lateTrips × 3) − (violations × 5)`
- Color-coded score meter (🟢 ≥80 / 🟡 ≥60 / 🔴 <60)
- License expiry tracking with inline warning banner
- Driver profile card (click any row)
- Add new drivers with license and contact info

### 💰 Trip & Expense
- Log fuel liters, fuel cost, and misc expenses per completed trip
- Auto-calculates total operational cost
- Row highlighting: 🔴 High Cost (>₹50K) | 🟢 Efficient (<₹90/L)
- Triggers dashboard KPI refresh on submit

### 📊 Operational Analytics
- KPI cards: Fleet Utilization, Total Cost, Avg Fuel Efficiency, Fleet ROI
- Line chart (fuel trend), Bar chart (monthly costs), Pie chart (vehicle types)
- Rule-based AI insights panel
- **Export to PDF** via jsPDF (KPI summary + insights)

### 🔧 Maintenance & Service Logs
- Log mechanical issues with cost and resolution date
- Status flow: `NEW → IN_PROGRESS → RESOLVED`
- Auto-sets vehicle to `IN_SHOP` on new log, `AVAILABLE` on resolution

### 🔐 Authentication & RBAC
- JWT-based auth with bcrypt password hashing
- Four roles: `manager`, `dispatcher`, `safety`, `finance`
- Role-aware route protection on both frontend and backend

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Vanilla CSS (custom design system), dark-mode first |
| **State** | Zustand (global), React Query (server state) |
| **Maps** | Leaflet + react-leaflet + OpenStreetMap |
| **Charts** | Recharts |
| **PDF** | jsPDF |
| **Real-Time** | Socket.io (WebSockets) |
| **Icons** | Lucide React |
| **Backend** | Node.js, Express 5, TypeScript |
| **ORM** | Prisma |
| **Database** | PostgreSQL 16 |
| **Auth** | JWT (jsonwebtoken) + bcrypt |
| **Logging** | Morgan |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                │
│  Zustand Store │ React Query │ react-leaflet │ Recharts  │
└──────────────────────┬───────────────────────────────────┘
                       │  REST API + WebSocket (Socket.io)
┌──────────────────────▼───────────────────────────────────┐
│              Express API Server (Node.js)                │
│  Controllers │ Middleware (JWT) │ Socket.io Broadcaster  │
└──────────────────────┬───────────────────────────────────┘
                       │  Prisma ORM
┌──────────────────────▼───────────────────────────────────┐
│                  PostgreSQL Database                     │
│  users │ vehicles │ drivers │ trips │ expenses │ logs    │
└──────────────────────────────────────────────────────────┘
```

---

## 📄 Pages & Modules

| Route | Page | Access |
|---|---|---|
| `/dashboard` | KPI overview, AI insights | All |
| `/fleet` | Live tracking map + trip status | All |
| `/trips` | Trip dispatcher | Manager, Dispatcher |
| `/vehicles` | Vehicle registry | All |
| `/drivers` | Driver performance | All |
| `/expenses` | Trip & expense logger | All |
| `/maintenance` | Service log management | All |
| `/analytics` | Charts, KPIs, PDF export | All |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14
- **npm** ≥ 9

### 1. Clone & Install

```bash
git clone https://github.com/your-org/FleetFlow.git
cd FleetFlow

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure Environment

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env — set DATABASE_URL and JWT_SECRET

# Client
cp client/.env.example client/.env
# Edit client/.env — set VITE_API_URL
```

### 3. Set Up Database

```bash
cd server

# Run all migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# (Optional) Seed demo fleet data for the tracking map
npx ts-node prisma/seedFleet.ts
```

### 4. Start Development Servers

```bash
# Terminal 1 — API server (port 4000)
cd server && npm run dev

# Terminal 2 — React client (port 5173)
cd client && npm run dev
```

Open `http://localhost:5173` — log in with your registered account.

---

## 🔑 Environment Variables

### `server/.env`

```env
DATABASE_URL="postgresql://user:password@localhost:5432/fleetflow"
JWT_SECRET="your-super-secret-key-min-32-chars"
PORT=4000
```

### `client/.env`

```env
VITE_API_URL=http://localhost:4000
```

---

## 🗄️ Database Schema

```
User        — id, fullName, email, passwordHash, role
Vehicle     — id, plateNumber, make, model, year, type, status, fuelLevel, mileage
Driver      — id, fullName, phone, licenseNo, licenseExpiry, dutyStatus, violations, lateTrips
Trip        — id, tripNumber, status, origin, destination, cargo, vehicleId, driverId, startedAt, completedAt
Expense     — id, tripId, driverId, vehicleId, fuelLiters, fuelCost, miscExpense, totalCost
ServiceLog  — id, vehicleId, issue, cost, status, serviceDate, resolvedAt
```

**Enums:** `UserRole`, `VehicleStatus`, `TripStatus`, `DriverDutyStatus`, `ServiceLogStatus`

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login, returns JWT |
| `GET` | `/api/auth/me` | Get current user |

### Fleet & Tracking
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tracking` | Live fleet positions snapshot |
| `WS` | `ws://localhost:4000` | Socket.io — `fleet:positions` event every 4s |

### Vehicles
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/vehicles` | List all vehicles |
| `POST` | `/api/vehicles` | Create vehicle |
| `PATCH` | `/api/vehicles/:id` | Update vehicle |
| `DELETE` | `/api/vehicles/:id` | Delete vehicle |

### Trips
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/trips` | List all trips |
| `POST` | `/api/trips` | Create trip |
| `PATCH` | `/api/trips/:id/status` | Update trip status |

### Drivers
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/drivers/performance` | Driver safety scores |
| `GET` | `/api/drivers` | All drivers |
| `POST` | `/api/drivers` | Create driver |
| `PATCH` | `/api/drivers/:id` | Update driver |

### Expenses
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/expenses` | All expenses |
| `GET` | `/api/expenses/completed-trips` | Trips eligible for expense logging |
| `POST` | `/api/expenses` | Log expense |
| `DELETE` | `/api/expenses/:id` | Delete expense |

### Analytics & Maintenance
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics` | KPIs, monthly data, insights |
| `GET` | `/api/maintenance` | Service logs |
| `POST` | `/api/maintenance` | Create service log |
| `PATCH` | `/api/maintenance/:id` | Update log status |

---

## 🛰️ Real-Time Tracking

FleetFlow uses **Socket.io** to push fleet positions to all connected browsers every **4 seconds**.

```
Client connects → server emits immediate snapshot
       ↓
Every 4s: server queries IN_TRANSIT + DISPATCHED trips
       ↓
For each trip: interpolate position between origin & destination
  (haversine distance ÷ 60 km/h avg speed × elapsed time)
       ↓
Emit fleet:positions → all clients update map markers
```

> **Note:** GPS positions are simulated by interpolation between 25 known Indian city coordinates. Integration with a real GPS device SDK requires only swapping the `interpolatePosition()` logic in `server/src/services/tracking.service.ts`.

---

## 📁 Project Structure

```
FleetFlow/
├── client/                    # React frontend (Vite)
│   └── src/
│       ├── components/        # Layout, UI components, auth guards
│       ├── pages/             # One folder per page/feature
│       │   ├── dashboard/
│       │   ├── fleet/         # Live tracking map
│       │   ├── trips/
│       │   ├── vehicles/
│       │   ├── drivers/
│       │   ├── expenses/
│       │   ├── maintenance/
│       │   └── analytics/
│       ├── services/          # API + Socket.io client wrappers
│       ├── store/             # Zustand global state
│       └── router/            # React Router v6
│
└── server/                    # Express API
    ├── prisma/
    │   ├── schema.prisma      # Database models
    │   ├── migrations/        # Prisma migration history
    │   └── seedFleet.ts       # Demo fleet data seeder
    └── src/
        ├── controllers/       # Request handlers
        ├── routes/            # Express routers
        ├── services/          # Business logic (tracking, etc.)
        └── middleware/        # JWT auth middleware
```

---

## 👥 Roles & Permissions

| Feature | Manager | Dispatcher | Safety | Finance |
|---|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Live Tracking | ✅ | ✅ | ✅ | ✅ |
| Trip Dispatch | ✅ | ✅ | ❌ | ❌ |
| Vehicle Registry | ✅ | ✅ | ✅ | ✅ |
| Driver Performance | ✅ | ✅ | ✅ | ✅ |
| Expenses | ✅ | ✅ | ✅ | ✅ |
| Maintenance | ✅ | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ | ✅ | ✅ |

---

<div align="center">

Built with ❤️ for the Indian logistics industry · FleetFlow © 2026

</div>
