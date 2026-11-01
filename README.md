# 🌿 Aurea Clinic & Luxury Spa - ERP Management System

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B%20%7C%20v20%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](.github/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/Tests-60%2F60%20Passing-brightgreen?style=for-the-badge&logo=node.js)](tests/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](LICENSE)

> A modern, full-featured, enterprise-grade Clinic & Luxury Spa Management ERP system built with a high-performance stack (Node.js, Express, PostgreSQL, Prisma, React 19, Vite, and Tailwind CSS v4). Featuring real-time automated WhatsApp messaging, multi-tier staff commissions, session package lifecycle tracking, smart inventory deduction, and comprehensive financial reporting.

---

## 📑 Table of Contents

- [Overview & Core Value](#-overview--core-value)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [System Architecture Diagram](#-system-architecture-diagram)
- [Prerequisites](#-prerequisites)
- [Installation & Step-by-Step Setup](#-installation--step-by-step-setup)
- [Environment Configuration](#-environment-configuration)
- [Database Setup & Seeding](#-database-setup--seeding)
- [Running the Application](#-running-the-application)
- [Automated Testing Suite](#-automated-testing-suite)
- [API Reference Overview](#-api-reference-overview)
- [Project Directory Structure](#-project-directory-structure)
- [Troubleshooting & FAQ](#-troubleshooting--faq)
- [License & Support](#-license--support)

---

## 🌟 Overview & Core Value

**Aurea Clinic & Spa ERP** is engineered specifically for premium medical clinics, physiotherapy centers, wellness resorts, and beauty spas. Traditional appointment systems frequently fail to handle the complexities of multi-session treatment packages, specialist commission calculations with client discounts, session consumables deduction from inventory, and instant client notifications.

Aurea solves these challenges natively:
- **Financial Accuracy**: Protects specialist commissions on gross service price while allowing flexible center-absorbed client discounts.
- **Client Engagement**: Direct, zero-cost WhatsApp integration for instant booking confirmations and scheduled reminder dispatches.
- **Inventory Protection**: Atomic inventory deduction on appointment booking with safeguards preventing negative stock.
- **Multi-Role Security**: Token-based authentication (JWT + scrypt password hashing) with RBAC for Admin and Receptionist staff.

---

## ⚡ Key Features

### 1. 📅 Intelligent Appointment & Booking Engine
- Multi-step booking wizard with client selector, category/service picker, and specialist assignment.
- Support for single sessions, bundle packages, and automatic deduction from active client treatment packages.
- Dynamic add-ons and session consumables directly integrated into the appointment workflow.
- Flexible payment methods supported: **Cash**, **Mobile Wallets (Vodafone Cash, etc.)**, and **InstaPay**.

### 2. 💰 Financial Management & Advanced Commission Rules
- **Protected Specialist Commissions**: Specialist commissions (percentage or fixed rent) are calculated strictly on the original gross base service price, ensuring specialist earnings remain untouched when promotional discounts are given to clients.
- **Center-Absorbed Discounts**: Promotional discounts (percentage `%` or fixed `EGP`) are absorbed 100% by the clinic/center.
- Automatic revenue recording linked to appointments and distinct invoice records.
- Expense tracking categorized by clinic operations, internal supply consumption, and maintenance.

### 3. 📦 Inventory & Consumable Control
- Real-time stock tracking with cost price vs. client selling price.
- Automatic distinction between:
  - **Client-Billed Consumables** (adds to invoice total).
  - **Operational Consumables** (billed to clinic operating expenses, 0 EGP to client).
- Internal supply dispatches and low-stock indicators.

### 4. 📲 WhatsApp Automated Messaging (Zero Third-Party Cost)
- Powered by `whatsapp-web.js` with persistent local session authentication.
- Instant automated booking confirmation upon appointment creation.
- Automated next-day appointment reminder cron job scheduled daily.
- Visual QR code scanner modal in the frontend dashboard for seamless reconnection.

### 5. 👥 Human Resources & Payroll
- Staff profiles with designated roles (`Doctor`, `Specialist`, `Receptionist`, `Nurse`, `Admin`).
- Transaction ledger tracking staff salary advances (`سلف`), bonuses (`مكافآت`), and deductions (`خصومات`).
- Monthly payroll generation calculating net salary = Base + Bonuses - Deductions - Advances.

### 6. 🖨️ Thermal Printing & Export
- Isolated thermal receipt generation (80mm standard format) using hidden zero-layout iframes.
- High-fidelity visual JPEG/PDF invoice generation with native Arabic HarfBuzz font shaping.

---

## 🛠 Architecture & Tech Stack

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
- **Framework**: [Express.js](https://expressjs.com/) (v5.x)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Compatible with Neon, Supabase, AWS RDS, Docker, or Local Postgres)
- **ORM**: [Prisma ORM](https://www.prisma.io/) (v5.22.0)
- **Authentication**: Native HMAC-SHA256 JWT tokens & scrypt password hashing with unique salt
- **Automation**: `whatsapp-web.js` + `node-cron`
- **File Uploads**: `multer` memory storage

### Frontend
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom luxury emerald and warm cream palette
- **Animations & UI**: [Framer Motion](https://www.framer.com/motion/), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
- **Charts & Data Viz**: [Recharts](https://recharts.org/)
- **Receipts & Imaging**: `html-to-image`, `html2canvas`, `jspdf`

---

## 📐 System Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer["🖥️ Frontend Client (Port 5173)"]
        UI["React 19 + Vite Dashboard"]
        State["Auth Context + Live State"]
        Print["Thermal Receipt & WhatsApp Dispatch"]
    end

    subgraph ServerLayer["⚙️ Express REST API (Port 5000)"]
        Router["Express Router & Controllers"]
        AuthMid["JWT & Scrypt Security Middleware"]
        CalcEngine["Financial & Commission Calculation Engine"]
        Cron["node-cron Automated Scheduler"]
        WClient["WhatsApp-Web.js Client Engine"]
    end

    subgraph DataLayer["🗄️ Database & External Services"]
        Prisma["Prisma ORM Client"]
        Postgres[(PostgreSQL Database)]
        WNetwork["WhatsApp Web Gateway"]
    end

    UI -->|HTTP / JSON API| Router
    Router --> AuthMid
    AuthMid --> CalcEngine
    CalcEngine --> Prisma
    Prisma --> Postgres
    Cron -->|Daily Trigger| WClient
    Router -->|Dispatch Confirmations| WClient
    WClient --> WNetwork
    Print -->|Trigger Print API| Router
```

---

## 📋 Prerequisites

Before running the system, ensure you have the following installed:

1. **Node.js**: `v18.18.0` or `v20.x` or higher ([Download Node.js](https://nodejs.org/))
2. **npm**: `v9.x` or `v10.x` (comes bundled with Node.js)
3. **PostgreSQL**: Local PostgreSQL 14+ or a cloud-hosted instance ([Neon.tech](https://neon.tech/) recommended for free instant serverless Postgres, or [Supabase](https://supabase.com/))
4. **Google Chrome / Chromium**: Installed locally (required by `whatsapp-web.js` / Puppeteer to run headless WhatsApp session)

---

## 🚀 Installation & Step-by-Step Setup

### Step 1: Clone or Navigate to the Repository

```bash
git clone https://github.com/your-organization/clinic-spa-prisma.git
cd clinic-spa-prisma
```

### Step 2: Install Backend Dependencies

From the root project directory:

```bash
npm install
```

### Step 3: Install Frontend Dependencies

Navigate to the `frontend` folder and install dependencies:

```bash
cd frontend
npm install
cd ..
```

---

## ⚙️ Environment Configuration

1. In the root directory, create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

2. Open `.env` in your text editor and set your configuration:

```env
# Database Connection URL (PostgreSQL)
# Local example:
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/aurea_db?schema=public"

# Or Cloud example (Neon / Supabase):
# DATABASE_URL="postgresql://neondb_owner:password@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Server Port (Default is 5000)
PORT=5000

# JWT Authentication Secret Key
JWT_SECRET="your-super-secure-jwt-secret-key-change-this-in-production"

# Optional Clinic Google Maps Link (appended in WhatsApp confirmation messages)
CLINIC_MAP_URL="https://maps.google.com/?q=Aurea+Clinic"
```

---

## 🗃️ Database Setup & Seeding

1. **Generate Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

2. **Push the schema directly to your PostgreSQL database**:
   ```bash
   npm run prisma:push
   ```
   *(Alternatively, run `npm run prisma:migrate` if you prefer tracked migration files).*

3. **Seed Initial Demo Data**:
   Populate initial services, categories, users, specialist staff, and default test inventory:
   ```bash
   npm run db:seed
   ```

4. *(Optional)* **Inspect Database with Prisma Studio**:
   ```bash
   npm run prisma:studio
   ```
   Opens a visual database explorer in your browser at `http://localhost:5555`.

---

## 💻 Running the Application

### Option A: One-Click Windows Launcher (Fastest)

If you are running on Windows, simply double-click:
```text
Start_Clinic.bat
```
This batch file automatically:
1. Launches the backend Express server on port `5000`.
2. Connects and initializes WhatsApp automation.
3. Launches the Vite React frontend server on port `5173`.
4. Automatically opens the dashboard in your default web browser (`http://localhost:5173`).

---

### Option B: Manual Command-Line Launch

#### 1. Start the Backend API Server:
In terminal window #1:
```bash
# From project root
npm run dev
# Server will listen on http://localhost:5000
```

#### 2. Start the Frontend Application:
In terminal window #2:
```bash
cd frontend
npm run dev
# Frontend will listen on http://localhost:5173
```

Open your browser and navigate to: **`http://localhost:5173`**

---

### 🔑 Default Credentials (After Seeding)

| Role | Username | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin` | `admin123` | Full Access: Financial reports, HR payroll, staff management, settings |
| **Receptionist** | `reception` | `reception123` | Operational Access: Appointments, client booking, checkout, inventory |

---

## 🧪 Automated Testing Suite

The repository includes a comprehensive native test suite covering **Unit**, **Validation**, and **End-to-End Integration** tests using Node.js's built-in test runner (`node:test`).

Run all test suites:
```bash
npm test
```

### Targeted Test Commands:
```bash
# Run unit tests only (Crypto, Commission Calculations, Inventory adjustments, HR)
npm run test:unit

# Run schema and input validation tests (Client formats, appointment payloads, invoices)
npm run test:validation

# Run end-to-end integration tests (Full booking -> payment -> commission check cycle)
npm run test:integration
```

All 60 tests pass with 0 failures:
```text
✔ Integration Tests: End-to-End Clinic ERP Lifecycle (10/10)
✔ Unit Tests: Authentication, JWT & Security Cryptography (8/8)
✔ Unit Tests: Financial & Business Calculations (17/17)
✔ Validation Tests: Input Rules and Integrity Constraints (25/25)
Total: 60 passed, 0 failed
```

---

## 📡 API Reference Overview

The backend exposes RESTful endpoints with strict JSON input/output:

### Authentication & Users
- `POST /api/auth/login` - Authenticate username/password, returns signed JWT and user profile.
- `GET /api/auth/me` - Validate active JWT session.
- `GET /api/users` - List users (Admin only).
- `POST /api/users` - Create a new user account.

### Appointments & Invoices
- `GET /api/appointments` - Retrieve appointment list with computed doctor commissions and invoices.
- `POST /api/appointments` - Create a booking with optional consumables and discounts; automatically creates invoice and dispatches WhatsApp notification.
- `PATCH /api/appointments/:id` - Update status (`مؤكد`, `قيد الانتظار`, `مكتمل`, `ملغي`).
- `DELETE /api/appointments/:id` - Safe cascade removal of appointment and revenue records.
- `POST /api/invoices` - Pay and finalize an invoice during checkout.

### Reports & Analytics
- `GET /api/reports/financial` - Summary of gross revenue, center net profit, expenses, and doctor dues.
- `GET /api/reports/staff` - Per-specialist commission report verifying discount isolation.

### Inventory & Supplies
- `GET /api/inventory` - Full list of stock items and pricing.
- `POST /api/inventory` - Create or restock inventory items.
- `POST /api/inventory/internal-dispatch` - Record internal clinic consumable consumption.

### WhatsApp Automation
- `GET /api/whatsapp/status` - Check if WhatsApp bot client is connected and ready.
- `POST /api/whatsapp/init` - Initialize WhatsApp Puppeteer client and generate QR code.
- `POST /api/whatsapp/send-message` - Send custom notification or appointment reminder.

---

## 📁 Project Directory Structure

```text
clinic-spa-prisma/
├── .env.example              # Sample environment configuration file
├── Start_Clinic.bat          # Automated Windows 1-click startup batch script
├── package.json              # Backend dependencies and test scripts
├── server.js                 # Primary Express server application & API routing
├── reportsController.js      # Financial & commission analytics controller
├── prisma/
│   ├── schema.prisma         # Prisma data models, relations, and enums
│   └── seed.ts               # Database demo seed script
├── tests/
│   ├── unit/                 # Unit tests (calculations, JWT, hashing)
│   ├── validation/           # Data integrity & input validation tests
│   └── integration/          # End-to-end API integration tests
├── utils/
│   ├── calculations.js       # Core business logic for commission and invoices
│   ├── cronJobs.js           # Automated daily appointment reminder cron
│   └── whatsappClient.js     # WhatsApp Web automation wrapper
└── frontend/                 # React 19 Frontend SPA
    ├── package.json          # Frontend dependencies
    ├── vite.config.ts        # Vite build configuration
    └── src/
        ├── App.tsx           # Master view router and layout
        ├── components/       # UI Modals, Calendars, Steppers, & Data Tables
        │   ├── NewAppointmentModal.tsx  # Booking wizard with live discount breakdown
        │   ├── CheckoutModal.tsx        # Payment and invoicing modal
        │   ├── ReceiptModal.tsx         # Official printable receipt modal
        │   └── WhatsAppModal.tsx        # Bot status & QR code connection modal
        ├── context/          # React Auth Context (JWT token state)
        └── utils/            # Print helper, canvas image capture & PDF generation
```

---

## ❓ Troubleshooting & FAQ

### 1. Database Connection Error (`P1001: Can't reach database server`)
- **Fix**: Verify your PostgreSQL server is running. Check your credentials and port in `.env`. If using Neon or Supabase, ensure `?sslmode=require` is appended to the connection string.

### 2. WhatsApp Client Authentication Timeout
- **Fix**: Ensure Google Chrome or Chromium is installed. Click the **WhatsApp Status** button on the top navigation bar to open the QR Code modal and scan it using your WhatsApp mobile app (`Linked Devices`).

### 3. Frontend Port Conflict (`Port 5173 is in use`)
- **Fix**: Vite will automatically select the next available port (e.g. `5174`). You can specify an explicit port in `frontend/vite.config.ts`.

### 4. Arabic Text Shaping in Receipts / Prints
- **Fix**: The system uses native SVG and system font fallbacks (`Tajawal`, `Cairo`, `Segoe UI`) rendered through an isolated hidden iframe, ensuring complete Arabic ligature shaping without reversed letters.

---

## 📄 License & Support

This software is developed as a proprietary Clinic Management ERP for **Aurea Clinic & Luxury Medical Spa**.  
All rights reserved © 2026.

For technical inquiries, system customization, or bug reports, please contact the development team or open an issue in the project repository.
