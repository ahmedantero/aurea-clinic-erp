# 🏛️ Aurea Clinic & Spa ERP — Architectural Blueprint & System Diagrams

This document outlines the architecture, data models, workflows, and automated lifecycle processes of the **Aurea Clinic & Luxury Spa ERP** system using standardized Mermaid.js diagrams.

---

## 1. High-Level System Architecture & Component Topology

The system uses a decoupled client-server architecture with an Express.js business engine, PostgreSQL persistence via Prisma ORM, and local background daemon integration for WhatsApp messaging and cron scheduling.

```mermaid
flowchart TD
  subgraph ClientApp["💻 Frontend Application (React 19 + Vite)"]
    direction TB
    UI["Rich User Interface & Steppers\n(Tailwind CSS v4 + Framer Motion)"]
    AuthContext["Auth Context & JWT Bearer Storage"]
    ThermalEngine["Isolated Receipt Printer\n(Hidden IFrame Engine)"]
    VisualCanvas["Arabic Native Invoice Renderer\n(HarfBuzz SVG / Canvas)"]
  end

  subgraph APIGateway["🛡️ Express Gateway & Middleware (Port 5000)"]
    direction TB
    CORS["CORS Policy & Strict Headers\n(Cache-Control: no-store)"]
    JWTAuth["Custom JWT Verification\n(Native Node Crypto HMAC-SHA256)"]
    ScryptHasher["Scrypt Password Hasher\n(Salt + Safe Timing Compare)"]
  end

  subgraph CoreModules["⚙️ Core Business Engines"]
    direction TB
    ApptModule["Appointments & Package Engine\n(Auto Session Deductions)"]
    FinanceModule["Financial & Commission Engine\n(Gross Base vs Discount Absorption)"]
    InventoryModule["Inventory Stock & Consumables\n(Negative-Stock Guard)"]
    HRModule["HR, Transactions & Payroll\n(Base + Bonus - Deduction - Advance)"]
  end

  subgraph AutomationServices["🤖 Background Services & Daemon"]
    direction TB
    WBot["WhatsApp-Web.js Session Bot\n(Local Auth Persistence)"]
    CronDaemon["node-cron Scheduler\n(Daily Next-Day Reminders)"]
  end

  subgraph StorageLayer["🗄️ Persistence & External Gateways"]
    PrismaClient["Prisma Client ORM"]
    PostgreSQL[("PostgreSQL Database\n(Standard / Neon / Supabase)")]
    WhatsAppGateway["WhatsApp Web Gateway\n(End-to-End Encrypted)"]
  end

  UI -->|HTTP Requests| CORS
  CORS --> JWTAuth
  JWTAuth --> CoreModules
  
  ApptModule --> FinanceModule
  ApptModule --> InventoryModule
  FinanceModule --> PrismaClient
  InventoryModule --> PrismaClient
  HRModule --> PrismaClient
  
  PrismaClient --> PostgreSQL
  
  ApptModule -.->|Dispatch Confirmations| WBot
  CronDaemon -.->|Query Upcoming Visits| PrismaClient
  CronDaemon -.->|Trigger Reminder Messages| WBot
  WBot --> WhatsAppGateway
  
  UI --> ThermalEngine
  UI --> VisualCanvas
```

---

## 2. Entity-Relationship Diagram (Database Architecture)

The PostgreSQL database contains 19 models managed via Prisma ORM, balancing transactional integrity, auditability, and financial traceability.

```mermaid
erDiagram
  CATEGORIES ||--o{ SERVICES : contains
  SERVICES ||--o{ SERVICE_CONSUMABLES : requires
  INVENTORY_ITEMS ||--o{ SERVICE_CONSUMABLES : supplied_as
  INVENTORY_ITEMS ||--o{ APPOINTMENT_CONSUMABLES : used_in
  INVENTORY_ITEMS ||--o{ INTERNAL_DISPATCHES : dispensed_in
  
  CLIENTS ||--o{ APPOINTMENTS : books
  CLIENTS ||--o{ INVOICES : billed_to
  CLIENTS ||--o{ CLIENT_PACKAGES : owns
  
  STAFF ||--o{ APPOINTMENTS : performs
  STAFF_MEMBERS ||--o| STAFF : links_to
  STAFF_MEMBERS ||--o{ STAFF_TRANSACTIONS : incurs
  STAFF_MEMBERS ||--o{ PAYROLL_RECORDS : receives
  
  PACKAGES ||--o{ CLIENT_PACKAGES : defines
  PACKAGES ||--o{ APPOINTMENTS : bundled_in
  
  APPOINTMENTS ||--|| INVOICES : generates
  APPOINTMENTS ||--o| REVENUES : records
  APPOINTMENTS ||--o{ APPOINTMENT_CONSUMABLES : charges
  CLIENT_PACKAGES ||--o{ APPOINTMENTS : redeems
  
  USERS ||--o{ APPOINTMENTS : creates
  USERS ||--o{ INVOICES : creates
  USERS ||--o{ EXPENSES : logs
  USERS ||--o{ REVENUES : logs

  CATEGORIES {
    string id PK
    string name
    datetime createdAt
  }

  SERVICES {
    string id PK
    string category_id FK
    string name
    float min_price
    int duration_minutes
    int sessions_count
  }

  STAFF {
    string id PK
    string name
    string specialty
    string commission_type
    float commission_value
  }

  CLIENTS {
    string id PK
    string name
    string phone
    int loyalty_points
  }

  APPOINTMENTS {
    string id PK
    string client_id FK
    string staff_id FK
    string service_id FK
    string package_id FK
    string client_package_id FK
    datetime appointment_date
    string status
    float final_price
    string payment_method
  }

  INVOICES {
    string id PK
    string client_id FK
    string appointment_id FK
    float total_amount
    float discount_applied
    float net_amount
    string payment_method
  }

  INVENTORY_ITEMS {
    string id PK
    string item_name
    float unit_cost
    float selling_price
    float quantity_in_stock
  }

  REVENUES {
    string id PK
    float amount
    string category
    string source
    string reference_id
  }

  EXPENSES {
    string id PK
    float amount
    string expense_type
    string notes
  }

  STAFF_MEMBERS {
    string id PK
    string name
    string role
    float base_salary
    string status
  }
```

---

## 3. End-to-End Booking, Protected Commission & Discount Sequence

This sequence diagram illustrates how specialist commissions are calculated strictly on the original **gross service base price** and protected against promotional client discounts, with the clinic absorbing the entire discount.

```mermaid
sequenceDiagram
  autonumber
  actor Receptionist as Receptionist / User
  participant Modal as NewAppointmentModal (UI)
  participant Server as Express Server (server.js)
  participant Calc as Calculations Engine (calculations.js)
  participant Tx as Prisma $transaction
  participant DB as PostgreSQL Database
  participant WhatsApp as WhatsApp Daemon

  Receptionist->>Modal: Select Client, Service (1,000 EGP), Specialist (25%), & Add Discount (200 EGP)
  Modal->>Modal: Compute Gross (1,000 EGP) - Discount (200 EGP) = Net (800 EGP)
  Modal->>Server: POST /api/appointments (gross=1000, discount=200, net=800)
  
  Server->>Calc: calculateSpecialistCommission(Gross: 1000, Commission: 25%)
  Note over Calc: Commission = 1,000 * 25% = 250 EGP<br/>(Gross Base is completely isolated from discount)
  Calc-->>Server: Doctor Commission = 250 EGP

  Server->>Tx: Execute Atomic Transaction
  Tx->>DB: Check & decrement inventory for consumables (if any)
  Tx->>DB: INSERT INTO revenues (amount: 800 EGP, source: 'APPOINTMENT')
  Tx->>DB: INSERT INTO appointments (status: 'مؤكد', final_price: 800 EGP)
  Tx->>DB: INSERT INTO invoices (total: 1000, discount: 200, net: 800)
  Tx-->>Server: Transaction committed successfully

  Server-->>WhatsApp: Async trigger booking confirmation (Non-blocking)
  WhatsApp-->>Receptionist: Background delivery to client WhatsApp
  Server-->>Modal: 201 Created (Appointment + Invoice + Commission: 250 EGP)
  
  Modal->>Modal: Prompt Thermal Receipt (Prints Gross: 1000, Discount: 200, Net: 800)
  Modal-->>Receptionist: Display Success State & Close Modal
```

---

## 4. WhatsApp Automation & Cron Reminder Lifecycle

The background messaging subsystem operates with zero external SaaS fees using headless browser automation and node-cron.

```mermaid
stateDiagram-v2
  [*] --> Disconnected

  Disconnected --> Initializing: POST /api/whatsapp/init or App Startup
  Initializing --> QRGenerated: Client initialized & QR emitted
  QRGenerated --> Authenticated: User scans QR code via WhatsApp Mobile
  QRGenerated --> QRGenerated: Refresh QR if unauthenticated (timeout)
  
  Authenticated --> Ready: Session cached in .wwebjs_auth
  
  state Ready {
    [*] --> Idle
    Idle --> SendingBookingConfirmation: On new appointment creation (Async)
    SendingBookingConfirmation --> Idle: Message sent with Google Maps link
    
    Idle --> RunningCronJob: Daily Schedule (e.g., 08:00 AM)
    RunningCronJob --> FetchingTomorrowAppointments: Query DB for date = tomorrow
    FetchingTomorrowAppointments --> DispatchingBatchReminders: Loop through confirmed appointments
    DispatchingBatchReminders --> Idle: Batch completion
  }
  
  Ready --> Disconnected: Phone disconnected / logout
```

---

## 5. Multi-Session Client Treatment Package State Machine

Treatment packages (e.g. 6-session physical therapy or skincare package) follow an automated state lifecycle from purchase to completion:

```mermaid
stateDiagram-v2
  [*] --> PurchaseInitiated: Client purchases package in Booking or POS
  PurchaseInitiated --> ACTIVE: Create ClientPackage (totalSessions: N, usedSessions: 1, status: ACTIVE)

  state ACTIVE {
    DeductionPending --> SessionConsumed: Client books visit linked to package
    SessionConsumed --> BalanceCheck: Decrement remaining sessions
    BalanceCheck --> DeductionPending: usedSessions < totalSessions (Remaining > 0)
  }

  BalanceCheck --> COMPLETED: usedSessions == totalSessions
  COMPLETED --> [*]: Package fully consumed (0 sessions left)
```
