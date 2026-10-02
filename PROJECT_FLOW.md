# PayMatrix Project Architecture & Flow

This document maps out the entire flow and structure of the PayMatrix project (Payroll & HRMS). It serves as a persistent guide to the tech stack, module responsibilities, and the architectural principles to follow during development to prevent bugs and anti-patterns.

---

## 1. High-Level Tech Stack
* **Frontend**: React (Vite) + TypeScript
  * **Data Fetching & State**: TanStack React Query (`src/hooks`)
  * **API Client**: Axios (`src/api`) with JWT interceptors
  * **Forms**: React Hook Form + Zod validation
  * **Styling**: Tailwind CSS + Custom UI Components (`src/components`)
* **Backend**: NestJS + TypeScript
  * **Database**: PostgreSQL
  * **ORM**: Drizzle ORM (`backend/src/db/schema`)
  * **Authentication**: Passport-JWT
  * **File Uploads**: Multer (Local disk storage in `public/uploads`)

---

## 2. Project Structure & Domains

### Backend (`backend/src`)
The backend is highly modularized, following standard NestJS domain-driven design:
* **Core / Admin**: 
  * `Auth`, `Companies`, `Branches`, `Departments`, `Designations`, `Locations`
  * `Users`, `Roles`, `Employee-Groups`
* **HRMS (Human Resources)**:
  * `Employees` (Central module)
  * `Attendance`, `Leave`, `Shifts`, `Holidays`
* **Payroll Processing**:
  * `Salary`, `Payroll`, `Bonuses`, `Deductions`, `Loans`, `Advances`, `Statutory`
* **Infrastructure**:
  * `Uploads` (File handling), `Audit` (Action logging), `Document-Master`, `Notifications`, `Reports`, `Dashboard`

### Frontend (`src`)
* `api/`: Raw Axios service wrappers corresponding to backend endpoints (e.g., `employees.ts`, `users.ts`).
* `hooks/`: React Query wrappers around the API functions (e.g., `useEmployee`, `useUsersRoles`).
* `components/`: Reusable UI components and layouts.
* `pages/`: Full-page views mapped to router paths (e.g., `AddEmployee.tsx`, `Employees.tsx`).

---

## 3. Core Architectural Rules (To Prevent Future Mistakes)

### Rule 1: Unified API Payloads (Single Source of Truth)
**Never** orchestrate complex relational data inserts from the frontend via multiple sequential API calls. 
* **Frontend Responsibility**: Aggregate all form data (including related entity IDs or sub-records) into a single cohesive payload.
* **Backend Responsibility**: The NestJS Service (e.g., `EmployeesService.create`) must handle distributing that data into the respective Drizzle tables (`employees`, `users`, `employeeAddresses`, `employeeBankAccounts`) within a single transaction-like flow. 

### Rule 2: Unified Data Fetching
* Do not fetch lists of unrelated tables (like fetching the entire `Users` list) just to find a foreign key reference on the frontend.
* The backend's `GET /entity/:id` or `GET /entity/:id/profile` endpoints must automatically query and join all necessary sub-tables (addresses, users, roles, bank accounts) and return a flattened or structured object that the frontend can immediately plug into its forms.

### Rule 3: File Uploads
* **Never** store Base64 strings directly in the database.
* **Flow**: 
  1. The frontend intercepts the file input.
  2. Submits the file instantly via `FormData` to `POST /uploads` (handled by `UploadsModule` / `Multer`).
  3. The backend saves the file physically to `public/uploads` and returns the static URL.
  4. The frontend stores this URL in state and passes it as a string inside the main entity payload (e.g., `profilePhotoUrl`).

### Rule 4: Users and Roles Mapping
* The system enforces a strict **1-to-1 relationship** between a User and a Role.
* When assigning or updating a role in the backend (`user_roles` table), always delete existing role associations for that user before inserting the new one. Do not map multiple roles to a single user in this architecture.

---

## 4. Standard Request/Response Lifecycle Example (Employee Update)

1. **User Action**: Clicks "Save" on `AddEmployee.tsx` (Edit Mode).
2. **Image Upload (If changed)**: Image was already sent to `/uploads` when selected, yielding a URL.
3. **Payload Construction**: Form data (including `roleId`, `password`, `profilePhotoUrl`, `bankName`) is bundled into `UpdateEmployeeDto`.
4. **React Query**: `updateMut.mutateAsync(payload)` calls `employeeApi.update`.
5. **Axios Client**: Attaches Bearer JWT. Sends `PATCH /employees/:id`.
6. **NestJS Controller**: Validates payload against `UpdateEmployeeDto`.
7. **NestJS Service (`EmployeesService.update`)**: 
   - Updates `employees` table.
   - Upserts `employee_addresses` and `employee_bank_accounts`.
   - Checks if user exists. If yes, hashes password (if provided) and replaces `user_roles`. If no, creates `users` and assigns `user_roles`.
   - Logs action to `audit_logs`.
8. **Response**: Returns the updated core employee row, frontend shows success toast.
