# PayMatrix — Enterprise Payroll & HRMS SaaS

PayMatrix is an enterprise-grade Payroll and Human Resource Management SaaS application built with React, Vite, NestJS, Drizzle ORM, and PostgreSQL.

---

## Phase 5: Attendance & Leave Management

Phase 5 introduces workforce management connecting shifts, attendance punches, calculation engines, and leave management ready to feed into the upcoming Salary Engine.

```text
                    PayMatrix Architecture
                              │
              ┌───────────────┼────────────────┐
              │               │                │
         Organization      Workforce         Auth
              │               │                │
       Company/Branch      Shift              Users
       Department          Attendance         Roles
       Designation         Leave              Permissions
       Employee            Holiday
              │               │
              └───────────────┼────────────────┘
                              │
                           PostgreSQL
```

### Complete Workforce Workflow

```text
Employee
   ↓
Shift (Regular / Overnight / Grace / Overtime Rules)
   ↓
Shift Assignment (Historical Timeline & Overlap Protection)
   ↓
Attendance Punches / Logs (IN, OUT, BREAK_IN, BREAK_OUT)
   ↓
AttendanceCalculationService (Working Hours, Break, Grace Period, Overtime)
   ↓
Attendance Status (PRESENT, ABSENT, HALF_DAY, LATE, ON_LEAVE, HOLIDAY, WEEK_OFF)
   ↓
Leave Types & Quotas (Annual Allowance, Carry Forward, Approval Rules)
   ↓
Leave Request (Working Days Calculation excluding Weekends & Holidays)
   ↓
Leave Approval Workflow (Approve / Reject / Cancel with Transactional Balance Restoration)
   ↓
Automated Integration (Approved Leave automatically maps to ON_LEAVE)
```

---

## Core Modules & Features

### 1. Shift Management
- **Endpoints**:
  - `GET /api/v1/shifts` — List shifts with pagination
  - `POST /api/v1/shifts` — Create shift (validates time, breaks, grace, overtime)
  - `GET /api/v1/shifts/:id` — Get shift details
  - `PATCH /api/v1/shifts/:id` — Update shift
  - `DELETE /api/v1/shifts/:id` — Delete shift (protected against active assignments)
  - `POST /api/v1/shifts/employees/:employeeId/assign` or `POST /api/v1/employees/:id/shifts` — Assign shift
  - `GET /api/v1/shifts/employees/:employeeId/assignments` or `GET /api/v1/employees/:id/shifts` — Shift history
  - `GET /api/v1/shifts/employees/:employeeId/current` or `GET /api/v1/employees/:id/shifts/current` — Current effective shift
- **Rules**:
  - Code is unique within company.
  - Supports overnight night shifts (e.g. `22:00` to `06:00`).
  - Strict overlap prevention: prevents overlapping shift assignments for the same employee (`SHIFT_ASSIGNMENT_OVERLAP`).

### 2. Holiday Management
- **Endpoints**:
  - `GET /api/v1/holidays` — List holidays with `year`, `month`, `holidayType` filters
  - `POST /api/v1/holidays` — Create holiday
  - `GET /api/v1/holidays/:id` — Get holiday
  - `PATCH /api/v1/holidays/:id` — Update holiday
  - `DELETE /api/v1/holidays/:id` — Delete holiday
- **Types**: `NATIONAL`, `FESTIVAL`, `WEEKLY_OFF`, `RESTRICTED` (optional).
- Holidays automatically exempt working day deductions in leave calculation.

### 3. Attendance Module & Calculation Engine
- **Endpoints**:
  - `GET /api/v1/attendance` — Attendance register with server-side filters (`fromDate`, `toDate`, `employeeId`, `departmentId`, `branchId`, `status`)
  - `POST /api/v1/attendance` — Record manual or calculated attendance
  - `GET /api/v1/attendance/summary` — Workforce KPIs (`totalEmployees`, `present`, `absent`, `late`, `halfDay`, `onLeave`, `holiday`, `overtimeMinutes`)
  - `GET /api/v1/attendance/calendar` — Monthly attendance calendar grid
  - `GET /api/v1/attendance/logs` — Raw punch logs
  - `POST /api/v1/attendance/logs` — Record raw biometric/web punch (IN/OUT/BREAK)
  - `GET /api/v1/employees/:id/attendance` — Employee attendance history
  - `GET /api/v1/attendance/:id` & `PATCH /api/v1/attendance/:id` — Detail and updates
- **Calculation Rules (`AttendanceCalculationService`)**:
  - **Grace Period**: Compares check-in time against `shift.startTime + shift.graceMinutes`. Within grace is not marked late. Beyond grace marks status `LATE`.
  - **Break Time**: Automatically deducted from total elapsed time.
  - **Working Minutes**: `max(0, elapsedMinutes - breakMinutes)`.
  - **Overtime**: Calculated only if `shift.overtimeAllowed` is true: `max(0, workingMinutes - expectedMinutes)`.
  - **Automated Status Hierarchy**:
    1. Approved leave exists on date → `ON_LEAVE`
    2. No punches + Company holiday → `HOLIDAY`
    3. No punches + Weekly off → `WEEK_OFF`
    4. Punches present & working hours < 50% → `HALF_DAY`
    5. Late arrival beyond grace → `LATE`
    6. Normal punches → `PRESENT`
    7. No punches → `ABSENT`

### 4. Leave Management & Approval Workflow
- **Endpoints**:
  - `GET, POST, GET/:id, PATCH/:id, DELETE /api/v1/leave/types` — Configurable leave types (CL, SL, EL, LOP)
  - `GET /api/v1/leave/requests` — Leave requests list
  - `POST /api/v1/leave/requests` — Submit request (auto-computes working days excluding weekends and holidays)
  - `POST /api/v1/leave/requests/:id/approve` — Transactional approval: deducts used and remaining balances
  - `POST /api/v1/leave/requests/:id/reject` — Rejection with mandatory `rejectionReason`
  - `POST /api/v1/leave/requests/:id/cancel` — Cancellation: restores deducted balance if previously approved
  - `GET /api/v1/leave/calendar` — Monthly leave overlays
  - `GET /api/v1/employees/:id/leave-balances` — Employee leave balance quotas
- **Working Days Calculation (`WorkingDaysCalculationService`)**:
  - Calculates actual working days between `fromDate` and `toDate`.
  - Automatically excludes weekend days (Sundays & Saturdays) and company holidays.
  - Rejects requests with 0 working days or overlapping periods (`OVERLAPPING_LEAVE`).
- **Transactional Balances (`LeaveBalanceService`)**:
  - Atomic deductions and restorations inside PostgreSQL transactions.
  - Supports year initialization, allocations, adjustments, and carry-forward limits.

---

## Phase 6: Salary Engine

### Architecture & Workflow

```text
Salary Components (Configurable Earnings, Deductions, Employer Contributions, Reimbursements)
   ↓
Salary Structure Builder (Visual Canvas, Component References, %, Formulas, Min/Max Clamps)
   ↓
Safe Formula Evaluator (AST Tokenizer + Shunting-Yard RPN Evaluator + DAG Cycle Detection)
   ↓
Employee Salary Assignment & Revision (Versioned Immutability, Effective Dates, Overrides)
   ↓
Salary Calculation Engine (Topological Sequence, Dependent Recalculation, CTC Projections)
   ↓
Attendance & Leave Integrated Simulator (Calendar Days vs Working Days, Paid Leaves, LOP)
   ↓
Monthly Payout Breakdown (Ready for Phase 7 Payroll Processing)
```

### Core Salary Endpoints

#### 1. Salary Components (`/api/v1/salary/components`)
- `GET /api/v1/salary/components` — List components with search, type, and status filtering
- `POST /api/v1/salary/components` — Create component (Validates unique code, math tokens)
- `GET /api/v1/salary/components/:id` — Get component details
- `PATCH /api/v1/salary/components/:id` — Update component
- `DELETE /api/v1/salary/components/:id` — Delete component (Guarded against active structure usage)

#### 2. Salary Structures (`/api/v1/salary/structures`)
- `GET /api/v1/salary/structures` — List structures with components count and metadata
- `POST /api/v1/salary/structures` — Create structure with component list
- `GET /api/v1/salary/structures/:id` — Get structure by ID with nested components
- `PATCH /api/v1/salary/structures/:id` — Update structure configuration
- `DELETE /api/v1/salary/structures/:id` — Delete structure (Guarded against active employee assignments)
- `POST /api/v1/salary/structures/preview` — Real-time live builder mathematical preview
- `GET/POST/PATCH/DELETE /api/v1/salary/structures/:id/components` — Manage nested components

#### 3. Employee Salary (`/api/v1/employees/:id/salary`)
- `GET /api/v1/employees/:id/salary` — Current active salary breakdown
- `GET /api/v1/employees/:id/salary/current` — Current active salary breakdown alias
- `GET /api/v1/employees/:id/salary/history` — Complete versioned assignment history
- `POST /api/v1/employees/:id/salary` — Assign new structure or record salary revision
- `POST /api/v1/employees/:id/salary/:salaryId/cancel` — Cancel future/active assignment & restore predecessor
- `GET /api/v1/employees/:id/salary/preview` — Attendance & approved leave integrated payout preview

---

## Testing Instructions

### Run Backend Unit & Workflow Tests
```powershell
cd backend
# Phase 5: Attendance & Leave Tests
.\node_modules\.bin\tsx.cmd --test src/attendance/*.spec.ts src/leave/*.spec.ts

# Phase 6: Salary Engine Tests (12/12 Passing)
.\node_modules\.bin\tsx.cmd --test src/salary/calculation/safe-formula-evaluator.spec.ts src/salary/calculation/salary-calculation.service.spec.ts src/salary/salary-workflow.spec.ts
```

Tests verify:
1. Safe AST Formula Evaluator arithmetic, operator precedence, parentheses, and variable resolution
2. Complete rejection of malicious/forbidden expressions (`eval()`, `process`, `window`, etc.)
3. Directed Acyclic Graph (DAG) cycle detection for circular salary dependencies
4. Pure salary calculation engine (Fixed, Percentage of Basic/Gross, and Formula expressions)
5. Dynamic override calculations (e.g. overriding Basic immediately updates dependent HRA and PF)
6. Minimum and maximum component amount clamping
7. Full end-to-end integration workflow: Component creation -> Structure creation -> Live preview -> Employee assignment -> Revision with predecessor closing -> History lookup -> Attendance-linked preview -> Revision cancellation and predecessor restoration

### Build Frontend & Backend
```powershell
# Frontend build (Vite + TypeScript)
cmd /c "npm run build"

# Backend build (NestJS + TypeScript)
cd backend
cmd /c "npm run build"
```

---

## API Documentation (Swagger)

Start the backend and visit:
```text
http://localhost:3001/api/docs
```
Contains full OpenAPI 3.0 documentation for all Salary Components, Structures, and Employee Salary subresources with request/response schemas and JWT authentication.
