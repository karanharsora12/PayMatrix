# PayMatrix — Database Design

> PostgreSQL + Drizzle ORM — Multi-tenant Payroll & HRMS

## 1. ER Diagram (text)

```
COMPANY
 ├── branches
 ├── departments ─── designations
 ├── employment_types
 ├── employees ─┬─ employee_addresses
 │              ├─ employee_bank_accounts
 │              ├─ employee_documents
 │              ├─ employee_group_members (via employee_groups)
 │              ├─ employee_shift_assignments ─ shifts
 │              ├─ attendance / attendance_logs
 │              ├─ employee_leave_balances ─ leave_types
 │              ├─ leave_requests
 │              ├─ employee_salary_structures ─ salary_structures ─ salary_structure_components ─ salary_components
 │              │       └─ employee_salary_components (overrides)
 │              ├─ bonuses
 │              ├─ employee_deductions
 │              ├─ employee_loans ─ loan_types + loan_installments
 │              ├─ employee_advances
 │              ├─ employee_statutory_details / employee_tax_declarations
 │              └─ payroll_employees (snapshot)
 ├── salary_components
 ├── salary_structures
 ├── statutory_rules
 ├── holidays
 ├── shifts
 ├── payroll_runs ─┬─ payroll_employees ─┬─ payroll_components ─ salary_components
 │                 │                      ├─ payroll_adjustments
 │                 │                      └─ payslips
 │                 └─ payroll_approvals
 ├── users ─┬─ user_roles ─ roles ─ role_permissions ─ permissions
 │          └─ employee_id (optional link)
 ├── audit_logs
 ├── notifications / notification_preferences
 └── company_settings
```

## 2. Table List

| Table | Purpose | PK | FKs | Important Indexes |
|-------|---------|----|-----|-------------------|
| `companies` | Tenant root | `id` | — | `code` unique, `is_active` |
| `branches` | Company offices | `id` | `company_id` | `company_id, code` unique |
| `departments` | Org units | `id` | `company_id` | `company_id, code` unique |
| `designations` | Job titles tied to dept | `id` | `company_id`, `department_id` | `company_id, code` unique |
| `employment_types` | Perm/Contract/Intern | `id` | `company_id` | `company_id, code` unique |
| `employees` | Core workforce | `id` | `company_id`, `branch/dept/desig`, `reporting_manager_id` self-ref | `company_id, employee_code` unique, `branch/dept/status` |
| `employee_addresses` | Multi-address | `id` | `employee_id` | `employee_id` |
| `employee_bank_accounts` | Salary disbursement | `id` | `employee_id` | `employee_id`, `is_primary` |
| `employee_documents` | Compliance docs | `id` | `employee_id` | `employee_id`, `document_type` |
| `employee_groups` / `employee_group_members` | Grouping for bulk ops | `id` | `company_id`, `employee_id` | `group+employee` unique |
| `shifts` | Work time definitions | `id` | `company_id` | `company_id, code` unique |
| `employee_shift_assignments` | History of shift | `id` | `employee_id`, `shift_id` | `employee_id`, `effective_from/to` |
| `holidays` | Company calendar | `id` | `company_id` | `company_id, holiday_date` unique |
| `attendance` | Processed daily | `id` | `company_id`, `employee_id` | `employee_id, attendance_date` unique |
| `attendance_logs` | Raw punches | `id` | `company_id`, `employee_id` | `employee_id, punch_time` |
| `leave_types` | Configurable types | `id` | `company_id` | `company_id, code` unique |
| `employee_leave_balances` | Yearly ledger | `id` | `employee_id`, `leave_type_id` | `employee+type+year` unique |
| `leave_requests` | Workflow | `id` | `company_id`, `employee_id`, `leave_type_id` | `employee_id`, `status`, `dates` |
| `salary_components` | Earning/Deduction master | `id` | `company_id` | `company_id, code` unique |
| `salary_structures` | Reusable templates | `id` | `company_id` | `company_id, code` unique |
| `salary_structure_components` | Template lines | `id` | `salary_structure_id`, `salary_component_id` | `structure+component` unique |
| `employee_salary_structures` | Assignment history | `id` | `employee_id`, `salary_structure_id` | `employee_id`, `effective_from` |
| `employee_salary_components` | Per-employee overrides | `id` | `employee_salary_structure_id`, `salary_component_id` | `structure+component` unique |
| `bonuses` | One-off rewards | `id` | `company_id`, `employee_id` | `employee_id`, `status` |
| `employee_deductions` | Recurring deductions | `id` | `company_id`, `employee_id`, `salary_component_id` | `employee_id`, `status` |
| `loan_types` | Loan products | `id` | `company_id` | `company_id, code` unique |
| `employee_loans` | Loan ledger | `id` | `company_id`, `employee_id`, `loan_type_id` | `employee_id`, `status` |
| `loan_installments` | EMI schedule | `id` | `employee_loan_id` | `loan_id, installment_number` unique |
| `employee_advances` | Short-term advance | `id` | `company_id`, `employee_id` | `employee_id`, `status` |
| `payroll_runs` | Period header | `id` | `company_id` | `company_id, period_start/end` unique |
| `payroll_employees` | Per-employee snapshot | `id` | `payroll_run_id`, `employee_id` | `run+employee` unique |
| `payroll_components` | Component snapshot (immutable) | `id` | `payroll_employee_id`, `salary_component_id` | `payroll_employee_id` |
| `payroll_adjustments` | Manual corrections | `id` | `payroll_employee_id` | `payroll_employee_id` |
| `payslips` | Generated artifact | `id` | `payroll_employee_id` unique | `payroll_employee_id` |
| `payroll_approvals` | Multi-level approval | `id` | `payroll_run_id` | `run_id`, `approver_id` |
| `statutory_rules` | PF/ESI/PT/TDS rules | `id` | `company_id` | `company_id, code` unique |
| `employee_statutory_details` | Per-employee statutory ids | `id` | `employee_id` unique | `employee_id` |
| `employee_tax_declarations` | FY declarations | `id` | `employee_id` | `employee+financial_year` unique |
| `users` | Login accounts | `id` | `company_id`, `employee_id` | `email` unique |
| `roles` | RBAC roles | `id` | `company_id` | `company_id, slug` unique |
| `permissions` | Module+action | `id` | — | `module, action` unique |
| `role_permissions` / `user_roles` | M2M | `id` | `role_id`, `permission_id`/`user_id` | `role+permission`/`user+role` unique |
| `audit_logs` | Immutable history | `id` | `company_id`, `user_id` | `company+entity`, `created_at` |
| `notifications` | In-app | `id` | `company_id`, `user_id` | `user_id`, `is_read` |
| `notification_preferences` | Opt-in | `id` | `user_id` | `user+type` unique |
| `company_settings` | KV store | `id` | `company_id` | `company+key` unique |

## 3. Relationship Explanation

### Company → Employee
Every business table carries `company_id`. Composite uniques like `UNIQUE(company_id, code)` allow same branch/dept codes across tenants without collision. Row-level isolation is enforced by always filtering on `company_id` (use RLS or app middleware).

### Employee → Salary
`employees` never stores salary inline. Instead `employee_salary_structures` links an employee to a `salary_structures` template with `effective_from / effective_to`. `employee_salary_components` stores per-employee overrides (amount/percentage/formula). Never overwrite — insert new assignment with new effective dates. Historical payroll looks up the assignment valid for the payroll period.

### Salary → Payroll (Snapshot principle)
`payroll_runs` is the period header; `payroll_employees` is the per-employee immutable snapshot (working days, gross, deductions, net). `payroll_components` snapshots the exact component amounts used — even if `salary_components` later changes, old payslips remain accurate. `payroll_adjustments` holds arrear/recovery/rounding lines. All payroll writes happen inside a DB transaction; `UNIQUE(company_id, period_start, period_end)` prevents double processing.

### Payroll → Payslip
`payslips` has FK `payroll_employee_id UNIQUE` — one payslip per employee per run. Regeneration creates a new file_url but never mutates `payroll_components`. Status `GENERATED → PUBLISHED → WITHDRAWN`.

### Other keys
- `employees.reporting_manager_id → employees.id` (self-ref, manager hierarchy). CTO query via recursive CTE.
- `employee_shift_assignments` with effective dates → supports history, not a static `shift_id` on employees.
- `audit_logs` JSONB old/new values → payload without schema lock.
- `branches.manager_employee_id` & `departments.manager_employee_id` are soft FKs (avoid circular DDL); enforced at app layer.

## 4. Drizzle Schema
See `src/db/schema/*.ts` (modular, one file per domain) + `src/db/schema/index.ts` barrel + `src/db/index.ts` connection helper.

Enums in `enums.ts`, helpers in `helpers.ts`.

## 5. Migration Strategy

```bash
# 1) Configure DATABASE_URL in .env
# 2) Generate SQL
npx drizzle-kit generate
# 3) Apply
npx drizzle-kit migrate
# Alternative: push for dev
npx drizzle-kit push

# Drizzle config: drizzle.config.ts (schema: ./src/db/schema/index.ts, out: ./drizzle)
```

- Keep migrations in git (`drizzle/`).
- For pgcrypto extension add `CREATE EXTENSION IF NOT EXISTS "pgcrypto"` in first migration.
- Manager FKs (branch/department → employees) added as deferred constraints if strict FK needed.
- Seed via `npx tsx src/db/seed/index.ts`.

## 6. Seed Data
See `src/db/seed/index.ts` — inserts company PMX, 3 branches, 3 depts, 4 designations, 9 salary components, 1 structure, 2 shifts, 3 holidays, 4 leave types, statutory rules, permissions+roles, 4 employees with addresses/banks, salary assignments, leave balances, attendance, and a finalized Jan 2026 payroll with payslips.

## 7. Sample Queries
See `src/db/sample-queries.ts` — 12 ready-to-use queries: directory, current salary, monthly attendance/late, leave balances/approvals, payroll summary/dept-wise, payslip, bank payment, payroll register, loan outstanding, expiring deductions, audit log, statutory totals.

## 8. Critical Rules & Invariants

- **Immutability:** Finalized payroll (`status IN (FINALIZED, PAID)`) must not be mutated — enforce via app check or Postgres trigger raising exception.
- **History:** Salary changes never overwrite; new `employee_salary_structures` row with `effective_from`.
- **Concurrency:** `UNIQUE(company_id, period_start, period_end)` + `SELECT FOR UPDATE` on payroll_runs before finalization.
- **Money:** `numeric(18,2)` for amounts, `numeric(12,4)` for percentages/rates. Never `float`.
- **Soft delete:** `deleted_at` on companies/branches/departments/designations/employees/users/leave requests etc. Hard delete never on payroll/audit.
- **Branch transfer:** Update `employees.branch_id` + keep history via audit log (or optional `employee_branch_history` table).
- **Department change:** Same — update FK + audit; alternatively insert history table if full temporal tracking needed.
- **Statutory:** `statutory_rules` has `effective_from/to` — payroll picks rule valid for `period_start`.
- **Timezone:** All timestamps `timestamptz`; shifts use `time` without tz (interpreted with company timezone).

## 9. Index & Constraint Rationale

- Composite uniques per company prevent cross-tenant code collision.
- Composite `(employee_id, attendance_date)` and `(employee_id, leave_type_id, year)` enforce business uniqueness.
- Covering indexes on `(company_id, period_start, period_end)` and `(payroll_run_id)` accelerate reports.
- Foreign keys with `ON DELETE CASCADE` for tenant wipe, `SET NULL` for optional links, `RESTRICT` for payroll/components.

## 10. Future SaaS Expansion

- Add `subscriptions` / `invoices` per company.
- Row-Level Security (RLS) policy: `company_id = current_setting('app.current_company_id')::uuid`.
- Materialized views for large reports (`mv_payroll_register`, `mv_attendance_monthly`).
- Partition `attendance` and `attendance_logs` by month.
- Add `employee_branch_history` / `employee_department_history` if strict temporal tracking required.
