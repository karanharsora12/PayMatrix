/**
 * PayMatrix — Seed Script
 *
 * Run with:  npx tsx src/db/seed/index.ts
 * Requires:  DATABASE_URL env + `pg` + `tsx`
 *
 * This is an idempotent-ish seed for local/dev. It inserts one company,
 * branches, departments, designations, salary components/structures, leave types,
 * shifts, holidays, statutory rules, roles/permissions, and sample employees
 * with attendance + payroll history.
 *
 * NOTE: For brevity this file uses hard-coded UUIDs so FK references are
 * deterministic. In production use `gen_random_uuid()` defaults.
 */

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

// Import schema tables for typed inserts (optional, but helpful)
import * as schema from "../schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/paymatrix",
});
const db = drizzle(pool, { schema });

// Deterministic UUIDs for seed
const IDS = {
  company: "11111111-1111-4111-8111-111111111111",
  branchHq: "22222222-2222-4222-8222-222222222222",
  branchPune: "22222222-2222-4222-8222-222222222223",
  branchBlr: "22222222-2222-4222-8222-222222222224",
  deptEng: "33333333-3333-4333-8333-333333333331",
  deptHr: "33333333-3333-4333-8333-333333333332",
  deptFinance: "33333333-3333-4333-8333-333333333333",
  desSwe: "44444444-4444-4444-8444-444444444441",
  desSrSwe: "44444444-4444-4444-8444-444444444442",
  desHrMgr: "44444444-4444-4444-8444-444444444443",
  desAcc: "44444444-4444-4444-8444-444444444444",
  empAlice: "55555555-5555-4555-8555-555555555551",
  empBob: "55555555-5555-4555-8555-555555555552",
  empCarol: "55555555-5555-4555-8555-555555555553",
  empDave: "55555555-5555-4555-8555-555555555554",
};

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Extensions
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // ---------------------------------------------------------------
    // Company
    // ---------------------------------------------------------------
    await client.query(
      `INSERT INTO companies (id, code, name, legal_name, email, phone, city, state, country, currency, timezone, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true)
       ON CONFLICT (code) DO NOTHING`,
      [
        IDS.company,
        "PMX",
        "PayMatrix Technologies",
        "PayMatrix Technologies Pvt Ltd",
        "hello@paymatrix.example",
        "+91-9876543210",
        "Mumbai",
        "Maharashtra",
        "India",
        "INR",
        "Asia/Kolkata",
      ],
    );

    // ---------------------------------------------------------------
    // Branches
    // ---------------------------------------------------------------
    await client.query(
      `INSERT INTO branches (id, company_id, code, name, city, state, is_active) VALUES
       ($1,$2,'HQ','Head Office - Mumbai','Mumbai','Maharashtra',true),
       ($3,$2,'PUNE','Pune Office','Pune','Maharashtra',true),
       ($4,$2,'BLR','Bengaluru Office','Bengaluru','Karnataka',true)
       ON CONFLICT DO NOTHING`,
      [IDS.branchHq, IDS.company, IDS.branchPune, IDS.branchBlr],
    );

    // ---------------------------------------------------------------
    // Departments
    // ---------------------------------------------------------------
    await client.query(
      `INSERT INTO departments (id, company_id, code, name, is_active) VALUES
       ($1,$2,'ENG','Engineering',true),
       ($3,$2,'HR','Human Resources',true),
       ($4,$2,'FIN','Finance',true)
       ON CONFLICT DO NOTHING`,
      [IDS.deptEng, IDS.company, IDS.deptHr, IDS.deptFinance],
    );

    // ---------------------------------------------------------------
    // Designations
    // ---------------------------------------------------------------
    await client.query(
      `INSERT INTO designations (id, company_id, department_id, code, name, grade, minimum_salary, maximum_salary, is_active) VALUES
       ($1,$2,$3,'SWE','Software Engineer','G5','500000','1200000',true),
       ($4,$2,$3,'SR_SWE','Senior Software Engineer','G6','1000000','2000000',true),
       ($5,$2,$6,'HR_MGR','HR Manager','G6','800000','1500000',true),
       ($7,$2,$8,'ACC','Accountant','G5','400000','900000',true)
       ON CONFLICT DO NOTHING`,
      [IDS.desSwe, IDS.company, IDS.deptEng, IDS.desSrSwe, IDS.desHrMgr, IDS.deptHr, IDS.desAcc, IDS.deptFinance],
    );

    // ---------------------------------------------------------------
    // Employment Types
    // ---------------------------------------------------------------
    await client.query(
      `INSERT INTO employment_types (company_id, code, name, is_active) VALUES
       ($1,'PERM','Permanent',true),
       ($1,'CONTRACT','Contract',true),
       ($1,'INTERN','Intern',true)
       ON CONFLICT DO NOTHING`,
      [IDS.company],
    );

    // ---------------------------------------------------------------
    // Salary Components
    // ---------------------------------------------------------------
    await client.query(
      `INSERT INTO salary_components (company_id, code, name, component_type, calculation_type, is_taxable, is_statutory, display_order, is_active) VALUES
       ($1,'BASIC','Basic','EARNING','FIXED',true,false,1,true),
       ($1,'HRA','House Rent Allowance','EARNING','PERCENTAGE',true,false,2,true),
       ($1,'SPECIAL','Special Allowance','EARNING','FIXED',true,false,3,true),
       ($1,'CONVEYANCE','Conveyance','EARNING','FIXED',false,false,4,true),
       ($1,'PF_EE','Provident Fund (Employee)','DEDUCTION','PERCENTAGE',false,true,10,true),
       ($1,'ESI_EE','ESI (Employee)','DEDUCTION','PERCENTAGE',false,true,11,true),
       ($1,'PT','Professional Tax','DEDUCTION','FIXED',false,true,12,true),
       ($1,'TDS','Income Tax (TDS)','DEDUCTION','FIXED',false,true,13,true),
       ($1,'PF_ER','Provident Fund (Employer)','EMPLOYER_CONTRIBUTION','PERCENTAGE',false,true,20,true)
       ON CONFLICT DO NOTHING`,
      [IDS.company],
    );

    // ---------------------------------------------------------------
    // Salary Structure: Standard
    // ---------------------------------------------------------------
    const structId = "66666666-6666-4666-8666-666666666666";
    await client.query(
      `INSERT INTO salary_structures (id, company_id, code, name, effective_from, is_active) VALUES
       ($1,$2,'STD_2025','Standard Structure 2025','2025-04-01',true)
       ON CONFLICT DO NOTHING`,
      [structId, IDS.company],
    );
    // Map component codes to ids for structure components
    const compRows = await client.query(`SELECT id, code FROM salary_components WHERE company_id=$1`, [
      IDS.company,
    ]);
    const compByCode = Object.fromEntries(compRows.rows.map((r: any) => [r.code, r.id]));
    const structureComponents: Array<[string, string, string, number]> = [
      ["BASIC", "FIXED", "40000", 1],
      ["HRA", "PERCENTAGE", "40", 2], // 40% of BASIC
      ["SPECIAL", "FIXED", "15000", 3],
      ["CONVEYANCE", "FIXED", "1600", 4],
      ["PF_EE", "PERCENTAGE", "12", 10],
      ["PT", "FIXED", "200", 12],
    ];
    for (const [code, calcType, val, order] of structureComponents) {
      const compId = compByCode[code];
      if (!compId) continue;
      const amount = calcType === "FIXED" ? val : null;
      const pct = calcType === "PERCENTAGE" ? val : null;
      await client.query(
        `INSERT INTO salary_structure_components (salary_structure_id, salary_component_id, calculation_type, amount, percentage, display_order)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
        [structId, compId, calcType, amount, pct, order],
      );
    }

    // ---------------------------------------------------------------
    // Shifts + Holidays + Leave Types + Statutory Rules
    // ---------------------------------------------------------------
    await client.query(
      `INSERT INTO shifts (company_id, code, name, start_time, end_time, break_minutes, working_hours, grace_minutes, is_active) VALUES
       ($1,'GENERAL','General Shift','09:30','18:30',60,8,15,true),
       ($1,'NIGHT','Night Shift','21:00','06:00',60,8,15,true)
       ON CONFLICT DO NOTHING`,
      [IDS.company],
    );
    await client.query(
      `INSERT INTO holidays (company_id, name, holiday_date, holiday_type, is_active) VALUES
       ($1,'Republic Day','2026-01-26','NATIONAL',true),
       ($1,'Holi','2026-03-03','FESTIVAL',true),
       ($1,'Independence Day','2026-08-15','NATIONAL',true)
       ON CONFLICT DO NOTHING`,
      [IDS.company],
    );
    await client.query(
      `INSERT INTO leave_types (company_id, code, name, is_paid, annual_allowance, carry_forward_allowed, max_carry_forward_days, requires_approval, is_active) VALUES
       ($1,'CL','Casual Leave',true,12,true,5,true,true),
       ($1,'SL','Sick Leave',true,8,false,0,true,true),
       ($1,'EL','Earned Leave',true,15,true,30,true,true),
       ($1,'LOP','Loss of Pay',false,0,false,0,true,true)
       ON CONFLICT DO NOTHING`,
      [IDS.company],
    );
    await client.query(
      `INSERT INTO statutory_rules (company_id, code, name, statutory_type, calculation_type, employee_percentage, employer_percentage, maximum_limit, effective_from, is_active) VALUES
       ($1,'PF_2025','PF Rule 2025','PF','PERCENTAGE',12,12,15000,'2025-04-01',true),
       ($1,'ESI_2025','ESI Rule 2025','ESI','PERCENTAGE',0.75,3.25,21000,'2025-04-01',true),
       ($1,'PT_MH','Professional Tax MH','PT','FIXED',null,null,2500,'2025-04-01',true)
       ON CONFLICT DO NOTHING`,
      [IDS.company],
    );

    // ---------------------------------------------------------------
    // Permissions + Roles
    // ---------------------------------------------------------------
    const modules = ["employees", "attendance", "leave", "salary", "payroll", "reports", "settings", "users"];
    const actions = ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT"];
    for (const m of modules) {
      for (const a of actions) {
        await client.query(
          `INSERT INTO permissions (module, action, description) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
          [m, a as any, `${a} ${m}`],
        );
      }
    }
    await client.query(
      `INSERT INTO roles (company_id, name, slug, is_system_role) VALUES
       ($1,'Super Admin','SUPER_ADMIN',true),
       ($1,'HR Manager','HR_MANAGER',false),
       ($1,'Payroll Admin','PAYROLL_ADMIN',false),
       ($1,'Employee','EMPLOYEE',false)
       ON CONFLICT DO NOTHING`,
      [IDS.company],
    );

    // ---------------------------------------------------------------
    // Employees
    // ---------------------------------------------------------------
    await client.query(
      `INSERT INTO employees (id, company_id, branch_id, department_id, designation_id, employee_code, first_name, last_name, email, phone, joining_date, employment_status, reporting_manager_id, is_active)
       VALUES
       ($1,$2,$3,$4,$5,'PMX0001','Alice','Sharma','alice.sharma@paymatrix.example','+91-9000000001','2023-04-10','CONFIRMED',NULL,true),
       ($6,$2,$3,$4,$5,'PMX0002','Bob','Verma','bob.verma@paymatrix.example','+91-9000000002','2023-06-15','CONFIRMED',$1,true),
       ($7,$2,$3,$4,$8,'PMX0003','Carol','Nair','carol.nair@paymatrix.example','+91-9000000003','2024-01-20','PROBATION',$6,true),
       ($9,$2,$10,$11,$12,'PMX0004','Dave','Khan','dave.khan@paymatrix.example','+91-9000000004','2022-11-01','CONFIRMED',NULL,true)
       ON CONFLICT DO NOTHING`,
      [
        IDS.empAlice,
        IDS.company,
        IDS.branchHq,
        IDS.deptEng,
        IDS.desSrSwe,
        IDS.empBob,
        IDS.empCarol,
        IDS.desSwe,
        IDS.empDave,
        IDS.branchPune,
        IDS.deptFinance,
        IDS.desAcc,
      ],
    );

    // Update branch managers
    await client.query(`UPDATE branches SET manager_employee_id=$1 WHERE id=$2`, [IDS.empAlice, IDS.branchHq]);
    await client.query(`UPDATE departments SET manager_employee_id=$1 WHERE id=$2`, [IDS.empAlice, IDS.deptEng]);

    // Employee addresses / bank / docs
    await client.query(
      `INSERT INTO employee_addresses (employee_id, address_type, address_line_1, city, state, country, postal_code, is_primary) VALUES
       ($1,'CURRENT','A-101, Lake View','Mumbai','Maharashtra','India','400001',true)
       ON CONFLICT DO NOTHING`,
      [IDS.empAlice],
    );
    await client.query(
      `INSERT INTO employee_bank_accounts (employee_id, bank_name, account_number, ifsc_code, account_holder_name, is_primary, is_active) VALUES
       ($1,'HDFC Bank','50100123456789','HDFC0000123','Alice Sharma',true,true),
       ($2,'ICICI Bank','002201987654','ICIC0000022','Bob Verma',true,true)
       ON CONFLICT DO NOTHING`,
      [IDS.empAlice, IDS.empBob],
    );

    // Employee salary assignments (historical)
    await client.query(
      `INSERT INTO employee_salary_structures (employee_id, salary_structure_id, effective_from, gross_salary, annual_ctc, status) VALUES
       ($1,$2,'2025-04-01',80000,960000,'ACTIVE'),
       ($3,$2,'2025-04-01',65000,780000,'ACTIVE')
       ON CONFLICT DO NOTHING`,
      [IDS.empAlice, structId, IDS.empBob],
    );

    // Leave balances 2026
    const ltRows = await client.query(`SELECT id, code FROM leave_types WHERE company_id=$1`, [IDS.company]);
    const ltByCode = Object.fromEntries(ltRows.rows.map((r: any) => [r.code, r.id]));
    for (const empId of [IDS.empAlice, IDS.empBob, IDS.empCarol]) {
      for (const code of ["CL", "SL", "EL"]) {
        await client.query(
          `INSERT INTO employee_leave_balances (employee_id, leave_type_id, year, opening_balance, allocated_days, used_days, remaining_days)
           VALUES ($1,$2,2026,0, $3, 0, $3) ON CONFLICT DO NOTHING`,
          [empId, ltByCode[code], code === "CL" ? 12 : code === "SL" ? 8 : 15],
        );
      }
    }

    // Sample attendance (Jan 2026) for Alice
    await client.query(
      `INSERT INTO attendance (company_id, employee_id, attendance_date, check_in, check_out, working_minutes, status) VALUES
       ($1,$2,'2026-01-02','2026-01-02 09:32+05:30','2026-01-02 18:35+05:30',480,'PRESENT'),
       ($1,$2,'2026-01-03','2026-01-03 09:45+05:30','2026-01-03 18:40+05:30',470,'LATE'),
       ($1,$2,'2026-01-06','2026-01-06 09:30+05:30','2026-01-06 18:30+05:30',480,'PRESENT')
       ON CONFLICT DO NOTHING`,
      [IDS.company, IDS.empAlice],
    );

    // Sample payroll run Jan 2026 (FINALIZED) — demonstrates immutability
    const runId = "77777777-7777-4777-8777-777777777777";
    await client.query(
      `INSERT INTO payroll_runs (id, company_id, payroll_code, period_start, period_end, pay_date, employee_count, gross_amount, total_deductions, net_amount, status)
       VALUES ($1,$2,'PAY-2026-01','2026-01-01','2026-01-31','2026-02-05',2,145000,15000,130000,'FINALIZED')
       ON CONFLICT DO NOTHING`,
      [runId, IDS.company],
    );
    const peAliceId = "88888888-8888-4888-8888-888888888881";
    const peBobId = "88888888-8888-4888-8888-888888888882";
    await client.query(
      `INSERT INTO payroll_employees (id, payroll_run_id, employee_id, working_days, present_days, paid_leave_days, absent_days, gross_earnings, total_deductions, net_salary, status) VALUES
       ($1,$2,$3,22,22,0,0,80000,8000,72000,'PAID'),
       ($4,$2,$5,22,20,1,1,65000,7000,58000,'PAID')
       ON CONFLICT DO NOTHING`,
      [peAliceId, runId, IDS.empAlice, peBobId, IDS.empBob],
    );
    // Payroll components snapshot
    for (const [peId, basic, hra] of [
      [peAliceId, 40000, 16000],
      [peBobId, 32000, 12800],
    ] as const) {
      await client.query(
        `INSERT INTO payroll_components (payroll_employee_id, salary_component_id, component_type, calculation_type, amount, is_taxable)
         VALUES ($1,$2,'EARNING','FIXED',$3,true), ($1,$4,'EARNING','PERCENTAGE',$5,true)
         ON CONFLICT DO NOTHING`,
        [peId, compByCode["BASIC"], basic, compByCode["HRA"], hra],
      );
    }
    await client.query(
      `INSERT INTO payslips (payroll_employee_id, payslip_number, file_url, status) VALUES
       ($1,'PS-2026-01-0001',NULL,'PUBLISHED'),
       ($2,'PS-2026-01-0002',NULL,'PUBLISHED')
       ON CONFLICT DO NOTHING`,
      [peAliceId, peBobId],
    );

    await client.query("COMMIT");
    console.log("✓ Seed completed");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Seed failed, rolled back:", e);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
