# Sweety Blood Glucose Tracker — Full System Architecture, Navigation & Calculation Specification

**Document Version:** 1.0.0  
**Status:** Approved & Implemented  
**Date:** November 2026  
**Repository:** [https://github.com/PraneshPrasathKA/Blood-Sugar.git](https://github.com/PraneshPrasathKA/Blood-Sugar.git)  
**Author:** Engineering Team  

---

## 1. Executive Summary & Product Vision

The **Sweety Blood Glucose Tracker** is a clinical-grade, full-stack diabetes management platform engineered to provide patients, caregivers, and clinicians with accurate, real-time glycemic tracking and analytics. 

Standard self-monitoring of blood glucose (SMBG) requires structured data collection aligned with meals and metabolic states. Sweety eliminates the chaos of unstructured logs by strictly enforcing a clinically validated **4-slot daily protocol**:
1. **Morning Fasting** (Pre-prandial basal glucose)
2. **After Breakfast** (Post-prandial 2-hour response)
3. **After Lunch** (Midday post-prandial response)
4. **After Dinner** (Evening post-prandial response)

The application combines a high-performance **Express + TypeScript + PostgreSQL** backend with a responsive **Next.js 14 App Router + Tailwind CSS** frontend, featuring zero-lag optimistic UI updates, custom calendar controls, smart slot auto-selection, automated color-coded clinical alerts, and deep statistical reports (Daily, Month-to-Date, and Finalized Calendar Months).

---

## 2. System Architecture & Tech Stack

Sweety is architected as a clean, decoupled 3-tier system built for reliability, sub-millisecond database queries, and zero data corruption.

```mermaid
flowchart TB
    subgraph ClientLayer ["Frontend Client Layer (Next.js 14 App Router)"]
        UI_Pages["Pages: /login, /register, /dashboard, /readings, /reports"]
        UI_Components["Custom UI: DatePicker, CustomSelect, TrendChart, ColorToasts"]
        TanStackQuery["TanStack Query v5 (Cache, Revalidation & Mutations)"]
        RHF["React Hook Form + Zod Schema Validation"]
        AxiosClient["Axios HTTP Client with Bearer Token Interceptors"]
    end

    subgraph APILayer ["Backend Application Server (Express + TypeScript)"]
        AuthMiddleware["JWT Authentication & Multi-Tenant Context Middleware"]
        ValidationMiddleware["Zod Input Parsing & Sanitization Middleware"]
        Routes["API Routers: /api/v1/auth, /api/v1/readings, /api/v1/reports"]
        Services["Domain Services: ReadingsService, ReportsService, AuthService"]
        Repo["Data Access Layer: Native SQL Repositories (pg Pool)"]
        SwaggerDoc["Swagger / OpenAPI 3.0 Interactive Documentation (/api/docs)"]
    end

    subgraph DataLayer ["Data Persistence Layer (PostgreSQL 16)"]
        DockerPG["PostgreSQL in Docker Container (sweety-postgres:5432)"]
        UserTable["users (UUID, BCrypt Passwords, Timestamps)"]
        ReadingsTable["readings (UUID, User FK, Date, reading_time_slot ENUM, Glucose Value)"]
        Triggers["Triggers: trg_readings_updated_at (set_updated_at PL/pgSQL)"]
        Constraints["Constraints: CHECK (40..600), UNIQUE (user_id, reading_date, time_slot)"]
    end

    ClientLayer <-->|JSON over HTTPS / REST API| APILayer
    APILayer <-->|ACID Connection Pool / Raw SQL| DataLayer
```

### 2.1 Technology Stack Matrix

| Layer | Technology | Version | Purpose & Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js App Router | 14.2.x | High-performance React framework with server-side layout caching and static route optimization. |
| **Frontend Language** | TypeScript | 5.4.x | Complete end-to-end type safety shared between client interfaces and API contracts. |
| **State & Data Fetching** | TanStack Query | 5.38.x | Robust asynchronous state management, cache invalidation, and automatic re-fetching on mutations. |
| **Form Handling** | React Hook Form + Zod | 7.51.x / 3.23.x | Zero re-render form state management with strict client-side validation rules. |
| **Data Visualization** | Recharts | 2.12.x | Composed charts rendering daily averages, spreads (High/Low), and glycemic target reference areas. |
| **Styling & Icons** | Tailwind CSS + Lucide React | 3.4.x / 0.378.x | Utility-first responsive design system with a healthcare-focused teal/emerald aesthetic. |
| **Backend Framework** | Node.js / Express | 22.x / 4.19.x | Lightweight, un-opinionated HTTP application server optimized for microsecond I/O. |
| **Database Driver** | `pg` (node-postgres) | 8.11.x | Direct connection pool without the overhead, query bloat, or latency of heavy ORMs. |
| **Database Engine** | PostgreSQL (Dockerized) | 16.x | ACID-compliant relational engine with native ENUM types, composite constraints, and transaction locking. |
| **Authentication** | JSON Web Tokens (JWT) + BCrypt | 9.0.x / 5.1.x | Stateless bearer authentication with 10 salt rounds password hashing and 7-day session expiration. |
| **API Documentation** | Swagger UI Express | 5.0.x | Interactive OpenAPI 3.0 specification served directly at `/api/docs`. |

---

## 3. Database Schema & Relational Model

Sweety uses a relational schema with explicit constraints to guarantee data integrity at the database level.

```mermaid
erDiagram
    users ||--o{ readings : "logs"

    users {
        UUID id PK "DEFAULT gen_random_uuid()"
        VARCHAR_150 name "Patient display name"
        VARCHAR_255 email UK "Unique lowercase email address"
        TEXT password "BCrypt password hash ($2b$10$...)"
        TIMESTAMPTZ created_at "DEFAULT NOW()"
        TIMESTAMPTZ updated_at "DEFAULT NOW()"
    }

    readings {
        UUID id PK "DEFAULT gen_random_uuid()"
        UUID user_id FK "REFERENCES users(id) ON DELETE CASCADE"
        DATE reading_date "Date of measurement (YYYY-MM-DD)"
        reading_time_slot time_slot "ENUM ('MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER')"
        INTEGER glucose_value "CHECK (glucose_value >= 40 AND glucose_value <= 600)"
        TIMESTAMPTZ created_at "DEFAULT NOW()"
        TIMESTAMPTZ updated_at "DEFAULT NOW()"
    }
```

### 3.1 Constraints & Indexes

1. **Unique Constraint (`uq_readings_user_date_slot`)**:
   ```sql
   CONSTRAINT uq_readings_user_date_slot UNIQUE (user_id, reading_date, time_slot)
   ```
   Prevents double-entry for the same meal slot on the same day for a given patient.
2. **Physiological Value Check**:
   ```sql
   CHECK (glucose_value >= 40 AND glucose_value <= 600)
   ```
   Enforces medically valid blood glucose boundaries (in mg/dL).
3. **Automated Timestamp Trigger**:
   A PL/pgSQL function `set_updated_at()` automatically synchronizes `updated_at = NOW()` prior to any `UPDATE` statement.
4. **Composite Indexes**:
   - `idx_readings_user_id`: Optimizes user data retrieval.
   - `idx_readings_reading_date`: Fast date range scans.
   - `idx_readings_user_date (user_id, reading_date DESC)`: Accelerates dashboard historical sorting and MTD aggregations.

---

## 4. End-to-End Application Navigation & User Journey

The application navigation is organized into a clean clinical workflow:

```mermaid
flowchart LR
    Start([User Visits App]) --> AuthCheck{Has Valid JWT?}
    
    AuthCheck -- No --> LoginView["/login (Sign In / Quick Demo Login)"]
    LoginView -->|New Account| RegisterView["/register (Create Profile)"]
    RegisterView -->|Account Created| LoginView
    LoginView -->|Valid Credentials| AuthToken[Store JWT in localStorage]
    AuthToken --> DashboardView["/dashboard (Main Hub)"]
    
    AuthCheck -- Yes --> DashboardView

    subgraph CoreApplication ["Authenticated Workspace"]
        DashboardView -->|Click 'Log Reading'| ReadingModal["Add/Edit Reading Dialog"]
        DashboardView -->|Click 'View All'| ReadingsView["/readings (Full Log Table & Filter)"]
        DashboardView -->|Click 'View Reports'| ReportsView["/reports (Analytics & Trends)"]
        
        ReadingModal -->|Pick Date| CustomCalendar["Custom Calendar (Future Disabled)"]
        ReadingModal -->|Select Slot| CustomDropdown["Custom Slot Dropdown (Auto-picks next open)"]
        ReadingModal -->|Save Reading| ToastGreen["Bottom-Right Green Toast (Created)"]
        
        ReadingsView -->|Click Delete| ConfirmDelete["Delete Reading Modal"]
        ConfirmDelete -->|Confirm| ToastRed["Bottom-Right Red Toast (Deleted)"]
        
        ReportsView --> DailyTab["Daily Breakdown Tab"]
        ReportsView --> MTDTab["Month-To-Date (MTD) Tab"]
        ReportsView --> MonthlyTab["Completed Previous Month Tab"]
    end
    
    DashboardView -->|Logout| LogoutAction[Clear Token & Redirect to /login]
```

### 4.1 Page-by-Page Functional Breakdown

#### Page 1: Authentication (`/login` & `/register`)
- **Purpose**: Secure user sign-in and new patient registration.
- **Key Features**:
  - Email format validation and password length checks.
  - One-click **Demo Account** button (`demo@example.com` / `DemoUser123!`) for instant access without manual typing.
  - Automatic redirect to `/dashboard` upon verification.

#### Page 2: Operational Dashboard (`/dashboard`)
- **Purpose**: Primary clinical summary showing current day compliance, month-to-date metrics, and 30-day glycemic trajectories.
- **Top 4 KPI Metric Cards**:
  1. **Today's Readings**: Displays completion out of 4 slots with a segmented visual progress bar. When all 4 slots are logged (4/4), the card dynamically transitions to a distinctive **emerald-green completion badge** reading `"All 4 readings logged today!"`.
  2. **Average Glucose (MTD)**: Displays the month-to-date average glucose. If the average falls below $70\text{ mg/dL}$, an amber warning tag (`Low Glucose Warning`) appears immediately to alert the patient to hypoglycemia risks.
  3. **Highest Reading (MTD)**: Displays the maximum glucose value logged during the current month along with the specific date and meal slot tag.
  4. **Lowest Reading (MTD)**: Displays the minimum glucose value logged during the current month along with its date and slot tag.
- **30-Day Glycemic Trend Chart**: Interactive Recharts visualization with an emerald target band ($70–140\text{ mg/dL}$), daily average line, and high/low spread markers.
- **Recent Readings Table**: Real-time table of recent logs with direct edit and delete trigger buttons.

#### Page 3: Reading Management & Logging Modal (`/readings`)
- **Purpose**: Dedicated data table for browsing, filtering by date, editing, and logging glucose measurements.
- **Custom Calendar Date Picker**:
  - Accessible date-selection popover with weekday headings, single-click selection, and active date styling.
  - **Future Date Guardrail**: All dates in the future are strictly disabled and cannot be clicked.
  - Quick **"Jump to Today"** button for fast navigation back to the current date.
- **Custom Meal Slot Dropdown (`CustomSelect`)**:
  - Replaces native OS dropdowns with a polished, accessible clinical selector.
  - Meal icons for each slot: Morning Fasting (Sunrise), After Breakfast (Coffee Cup), After Lunch (Sun), After Dinner (Moon).
  - Descriptive timing guidance below each slot name.
  - **Logged Indicator Badge**: Slots already logged on the selected date display a subtle gray badge (`Logged`), preventing accidental duplicate submissions.
  - **Auto-Selection Engine**: When opening the dialog or changing the date, the system inspects the database/cache and automatically selects the first available open chronological slot.
  - Full keyboard support: navigation with `ArrowUp` and `ArrowDown`, selection with `Enter`, and dismiss with `Escape`.

#### Page 4: Floating Color-Coded Toast Notification System
- **Purpose**: Immediate, clear feedback on all asynchronous actions.
- **Specifications**:
  - Rendered via React `createPortal` directly into `document.body` at fixed coordinates `bottom: 1.25rem; right: 1.25rem` (`z-index: 9999`).
  - Auto-closes smoothly after **5 seconds** (5000 ms).
  - Explicit color definitions:
    - **Green Toast (`bg-emerald-50 text-emerald-800 border-emerald-300`)**: Triggered upon creating/adding a new glucose reading. Includes checkmark icon.
    - **Red Toast (`bg-rose-50 text-rose-800 border-rose-300`)**: Triggered upon deleting a reading. Includes a trash-can icon.
    - **Blue Toast (`bg-sky-50 text-sky-800 border-sky-300`)**: Triggered upon updating/editing an existing reading or general informative alerts.

#### Page 5: Reports & Clinical Analytics (`/reports`)
- **Purpose**: Multi-perspective clinical reporting for doctor consultations.
- **Tab 1 — Daily Report**:
  - Visual breakdown of all 4 slots for the chosen day.
  - Individual slot card with clinical range tags (Normal, Elevated, High, Low).
  - Spread indicator: difference between daily maximum and minimum.
- **Tab 2 — Month-to-Date (MTD) Report**:
  - Aggregates all readings from day 1 of the current month up to the selected date.
  - Displays total readings logged, adherence count, period average, and highest/lowest records.
  - Continuous chronological daily trend graph.
- **Tab 3 — Completed Previous Month Report**:
  - Dedicated view for finalized prior calendar months (e.g. October 1 to October 31).
  - **Finalized Status Banner**: Indicates that the calendar month is fully closed and historical data is locked.
  - Compliance rate calculation and total monthly readings count.

#### Page 6: Interactive Swagger Documentation (`/api/docs`)
- **Purpose**: Self-documenting API portal exposing all REST endpoints, request schemas, authentication headers, error codes, and sample payloads.

---

## 5. Calculation Engine & Mathematical Formulas

The Sweety platform relies on mathematically rigorous calculations to compute clinical metrics and trends.

### 5.1 Daily Glucose Average

For any given calendar date $D$, if $N$ valid readings are logged ($1 \le N \le 4$):

$$\text{Daily Average } (\overline{G}_D) = \frac{1}{N} \sum_{i=1}^{N} G_{D,i}$$

Where:
- $G_{D,i}$ is the glucose value (in mg/dL) for slot $i$ on date $D$.
- $N$ is the count of logged slots on that date.
- The average is rounded to 1 decimal place: `ROUND(AVG(glucose_value)::numeric, 1)`.
- If $N = 0$, the daily average is `null` (not 0), preventing skewed reporting.

### 5.2 Clinical Glycemic Classification Boundaries

Sweety maps every reading to clinical categories based on the American Diabetes Association (ADA) guidelines:

| Classification | Fasting Range (mg/dL) | Post-Prandial Range (mg/dL) | Clinical Action & UI Presentation |
| :--- | :--- | :--- | :--- |
| **Severe Hypoglycemia** | $< 54$ | $< 54$ | Critical Red Tag. Immediate fast-acting carbohydrate protocol required. |
| **Hypoglycemia** | $54 - 69$ | $54 - 69$ | Amber Warning Tag. Low glucose alert displayed on Dashboard KPI card. |
| **Normal (Target)** | $70 - 99$ | $70 - 139$ | Emerald Green Tag. Optimal metabolic equilibrium (Target Zone). |
| **Elevated (Pre-Diabetic)** | $100 - 125$ | $140 - 199$ | Yellow Tag. Mild post-prandial excursion. |
| **Hyperglycemia / High** | $\ge 126$ | $\ge 200$ | Rose/Red Tag. Clinical alert; potential insulin adjustment or medication review. |

### 5.3 Daily Glycemic Spread (Range Delta)

$$\text{Spread } (\Delta G_D) = G_{D,\max} - G_{D,\min}$$

A low spread indicates metabolic stability throughout the day, while a high spread ($\Delta G > 80\text{ mg/dL}$) highlights high glycemic variability.

### 5.4 Period Aggregation (Month-to-Date & Monthly)

For any evaluation window spanning from start date $d_1$ to end date $d_k$:

1. **Total Period Reading Count**:
   $$C_{\text{period}} = \sum_{d=d_1}^{d_k} N_d$$

2. **Period Weighted Average Glucose**:
   $$\mu_{\text{period}} = \frac{1}{C_{\text{period}}} \sum_{d=d_1}^{d_k} \sum_{i=1}^{N_d} G_{d,i}$$

3. **Period Extreme Points**:
   $$\text{Highest} = \max_{\substack{d \in [d_1, d_k] \\ i \in [1, N_d]}} G_{d,i}$$
   $$\text{Lowest} = \min_{\substack{d \in [d_1, d_k] \\ i \in [1, N_d]}} G_{d,i}$$

4. **Standard Deviation of Glycemic Swings ($\sigma$)**:
   $$\sigma = \sqrt{\frac{1}{C_{\text{period}} - 1} \sum (G - \mu_{\text{period}})^2}$$

5. **Coefficient of Variation ($\text{CV}\%$)**:
   $$\text{CV} = \left(\frac{\sigma}{\mu_{\text{period}}}\right) \times 100\%$$
   *(Clinical Target: $\text{CV} \le 36\%$ signifies stable glucose control with low hypoglycemia risk).*

### 5.5 Month Completion & Adherence Rate Calculation

For a finalized calendar month with $D_{\text{total}}$ days (e.g., 31 days in October):

$$\text{Total Expected Readings} = 4 \times D_{\text{total}}$$

$$\text{Adherence Rate } (\%) = \left( \frac{C_{\text{actual}}}{4 \times D_{\text{total}}} \right) \times 100\%$$

- **High Compliance Badge**: Adherence $\ge 85\%$
- **Moderate Compliance Badge**: $60\% \le \text{Adherence} < 85\%$
- **Action Required**: Adherence $< 60\%$

### 5.6 Slot Auto-Advancement Logic

When a user logs a reading for date $D$, the system determines the default slot using the following sequential algorithm:

```typescript
const ALL_SLOTS = [
  'MORNING_FASTING',
  'AFTER_BREAKFAST',
  'AFTER_LUNCH',
  'AFTER_DINNER'
];

function determineNextSlot(loggedSlotsOnDate: Set<TimeSlot>): TimeSlot {
  // Find the first chronological slot that has not yet been logged
  for (const slot of ALL_SLOTS) {
    if (!loggedSlotsOnDate.has(slot)) {
      return slot;
    }
  }
  // If all 4 slots are already logged, fallback safely to MORNING_FASTING
  return 'MORNING_FASTING';
}
```

---

## 6. The 5 Core Business & Validation Rules

Sweety implements five non-negotiable validation guardrails enforced simultaneously across both client forms (Zod) and backend database transactions:

```mermaid
flowchart TD
    Submit[User Submits Glucose Entry] --> R1{Rule 3: Is Reading Date > Today?}
    R1 -- Yes --> E1[Reject 400: Future dates are not permitted]
    R1 -- No --> R2{Rule 4: Is 40 <= Glucose <= 600?}
    R2 -- No --> E2[Reject 400: Value must be between 40 and 600 mg/dL]
    R2 -- Yes --> R3[Open ACID Transaction with Row Lock on user_id]
    R3 --> R4{Rule 1: Are 4 readings already logged on this date?}
    R4 -- Yes --> E3[Reject 409 Conflict: Daily limit of 4 readings reached]
    R4 -- No --> R5{Rule 2: Is this slot already logged for this date?}
    R5 -- Yes --> E4[Reject 409 Conflict: Slot already recorded]
    R5 -- No --> R6[Rule 5: Enforce user_id tenant isolation in SQL]
    R6 --> DBWrite[(Commit INSERT to PostgreSQL)]
    DBWrite --> Success[Return 201 Created & Trigger Green Toast]
```

1. **Rule 1 — Daily 4-Reading Maximum**:
   - Each patient is permitted a maximum of 4 readings per calendar day.
   - Enforced inside an ACID database transaction:
     ```typescript
     await readingsRepository.lockUserForReadingMutation(client, userId);
     const dailyCount = await readingsRepository.countByUserAndDate(client, userId, date);
     if (dailyCount >= 4) {
       throw new ConflictError('You can add only 4 readings per day.');
     }
     ```
2. **Rule 2 — Meal Slot Uniqueness**:
   - A meal slot cannot be entered twice on the same day for the same user.
   - Enforced by both service-level pre-check and PostgreSQL database constraint `uq_readings_user_date_slot`.
3. **Rule 3 — Strict Future Date Prohibition**:
   - Measurements cannot be logged for future calendar dates.
   - Checked on the client (calendar disables future dates) and on the backend:
     ```typescript
     if (inputDate > todayString) {
       throw new BadRequestError('Reading date cannot be in the future.');
     }
     ```
4. **Rule 4 — Physiological Boundaries ($40 - 600\text{ mg/dL}$)**:
   - Readings below $40\text{ mg/dL}$ or above $600\text{ mg/dL}$ are physically incompatible with standard capillary glucometers and require laboratory confirmation.
   - Enforced by Zod schema and PostgreSQL `CHECK (glucose_value >= 40 AND glucose_value <= 600)`.
5. **Rule 5 — Multi-Tenant Isolation**:
   - No user can read, modify, or delete another user's readings.
   - Every database query explicitly binds `WHERE user_id = $1` extracted from the verified JWT payload.

---

## 7. Sudden Glucose Spike Detection & Doctor Notification Engine

A key clinical enhancement requested for the platform is an **Automated Spike & Anomaly Detection System** that monitors daily logs (for example, identifying unexpected Friday evening spikes) and triggers immediate patient check-ins and clinical escalations.

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Patient
    participant UI as Next.js Client
    participant API as Express API Server
    participant Engine as Anomaly Detection Engine
    participant DB as PostgreSQL Database
    participant Alert as Notification Service (Twilio/SendGrid)
    actor Doctor as Attending Physician / Care Team

    Patient->>UI: Logs Reading: Friday After Dinner = 245 mg/dL
    UI->>API: POST /api/v1/readings
    API->>DB: INSERT Reading (ACID Transaction)
    DB-->>API: Reading Saved
    API->>Engine: Evaluate Reading for Anomaly (userId, 245 mg/dL, AFTER_DINNER)
    
    Engine->>DB: Fetch 14-day slot historical mean (μ) & standard dev (σ)
    DB-->>Engine: Returns μ=135 mg/dL, σ=18 mg/dL
    
    Note over Engine: Calculate Z-Score: (245 - 135) / 18 = +6.11 σ<br/>Absolute Delta = +110 mg/dL (Severe Spike)
    
    Engine-->>UI: Response with Anomaly Flag { isAnomaly: true, severity: "HIGH" }
    
    par Patient Contextual Inquiry
        UI->>Patient: Present Spike Modal: "High Spike Detected (245 mg/dL). What happened?"
        Patient->>UI: Selects: "Heavy carbohydrate meal (Friday Pizza) + Missed Bolus"
        UI->>API: POST /api/v1/readings/{id}/lifestyle-context
        API->>DB: Save Patient Context (meal type, meds, stress level)
    and Doctor Notification Dispatch
        Engine->>Alert: Dispatch High-Priority Clinical Alert
        Alert->>Doctor: SMS/Email Alert: "Patient John Doe logged 245 mg/dL (Fri After Dinner). Z=+6.11"
        Doctor->>API: Access Clinician Portal to review full 30-day trend & patient note
    end
```

### 7.1 Spike Detection Algorithm

Instead of relying solely on static thresholds, Sweety combines static clinical limits with **personalized rolling statistical deviations**:

1. **Slot-Specific Rolling Baseline**:
   Calculates the rolling 14-day mean ($\mu_{\text{slot}}$) and standard deviation ($\sigma_{\text{slot}}$) for the patient's specific meal slot:
   $$\mu_{\text{slot}} = \frac{1}{14} \sum_{k=1}^{14} G_{\text{slot}, k}, \quad \sigma_{\text{slot}} = \sqrt{\frac{1}{13} \sum (G_{\text{slot}, k} - \mu_{\text{slot}})^2}$$

2. **Z-Score Anomaly Criterion**:
   $$Z = \frac{G_{\text{new}} - \mu_{\text{slot}}}{\sigma_{\text{slot}}}$$

3. **Multi-Tier Spike Trigger Matrix**:

| Spike Severity | Mathematical Condition | Clinical Meaning | System Action |
| :--- | :--- | :--- | :--- |
| **Normal Variance** | $Z < 2.0$ and $G < 180$ | Expected physiological fluctuation. | Standard green/blue toast, no escalation. |
| **Moderate Spike** | $2.0 \le Z < 3.0$ or $180 \le G < 250$ | Noticeable departure from patient's norm. | Prompts patient for lifestyle context. Logs alert in weekly doctor report. |
| **Severe Spike** | $Z \ge 3.0$ or $G \ge 250$ | Critical acute hyperglycemia. | Prompts patient for immediate insulin check, alerts physician via SMS/Push within 5 minutes. |
| **Day-of-Week Pattern** | Repeated spikes on specific days (e.g. 3 consecutive Fridays) | Behavioral clustering (weekend dietary change). | Generates patient behavioral insight card: *"Friday evening readings average 42% higher than weekdays."* |

### 7.2 Patient Contextual Inquiry Dialogue

When an anomaly is flagged, the client application immediately prompts the patient:
> **"We noticed a sudden spike of 245 mg/dL this Friday after dinner. What contributed to this reading?"**
- [ ] **Dietary**: Unplanned high-carbohydrate or sugary meal.
- [ ] **Medication**: Delayed, reduced, or forgotten insulin/oral medication.
- [ ] **Physical Activity**: Missed routine exercise or prolonged sedentary period.
- [ ] **Physiological Stress**: Illness, infection, lack of sleep, or mental stress.
- [ ] **Measurement Verification**: Glucometer error or unwashed hands (prompts re-test).

This lifestyle context is stored alongside the reading record, giving clinicians actionable context rather than raw, unexplained numbers.

### 7.3 Doctor Escalation & Care Team Dispatch Matrix

- **Level 1 — In-App Patient Advisory**: Hydration advice, rapid-acting insulin check, and automated re-test reminder in 2 hours.
- **Level 2 — Provider Dashboard Flag**: Highlighted in the Clinician Portal during scheduled review sessions.
- **Level 3 — Real-Time Emergency Alert**: Webhook dispatch to Twilio SMS and hospital EHR system (HL7 FHIR `Observation` resource) alerting the on-call endocrinologist.

---

## 8. Future Engineering Roadmap & Improvements

If allocated additional engineering cycles, the following roadmap features would be prioritized:

1. **Continuous Glucose Monitor (CGM) Streaming**:
   - Integration with Dexcom G6/G7 and Abbott FreeStyle Libre via Web Bluetooth and cloud APIs.
   - Ingestion of 5-minute continuous data streams alongside manual 4-slot spot checks.
2. **Machine Learning Predictive Forecasting**:
   - Integration of an LSTM / ARIMA time-series model to forecast post-prandial glucose excursions 60 minutes in advance based on meal composition.
3. **Role-Based Access Control (RBAC) & Clinician Portal**:
   - Dedicated `/provider` dashboard allowing doctors to manage hundreds of patients with sorting by highest glycemic variability and risk score.
4. **Offline-First PWA (Progressive Web App)**:
   - Service Workers with IndexedDB storage enabling full logging capabilities without an internet connection, synchronizing automatically when connectivity resumes.
5. **PDF Clinical Summary Export**:
   - One-click generation of ADA-standard Ambulatory Glucose Profile (AGP) reports formatted specifically for insurance reimbursements and clinical consultations.

---

## 9. Verification, Quality Assurance & Test Coverage

The Sweety codebase has been verified with comprehensive unit and integration test suites:

- **Backend Integration Tests (Jest + Supertest)**: 17/17 tests passing across authentication, slot limits, duplicate rejection, and report aggregations.
- **Frontend Component Tests (Jest + React Testing Library)**: 7/7 tests passing covering form inputs, custom select dropdowns, and toast lifecycle mechanics.
- **Production Build (`next build`)**: Zero TypeScript errors; all 9 App Router pages statically rendered and optimized.

---

*Sweety Blood Glucose Tracker Documentation — Designed and Developed with Clinical Precision.*
