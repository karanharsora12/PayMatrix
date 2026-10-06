/**
 * PayMatrix — Seed Script
 *
 * Run with:  npx tsx src/db/seed/index.ts
 * Requires:  DATABASE_URL env + `pg` + `tsx`
 *
 * This is an idempotent seed for production/dev. It inserts one default company,
 * branches, departments, designations, salary components/structures, leave types,
 * shifts, holidays, statutory rules, roles/permissions, document templates,
 * and the super admin user.
 */

import dotenv from "dotenv";
import path from "path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../schema";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in .env");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool, { schema });

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Extensions
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // ---------------------------------------------------------------
    // Company
    // ---------------------------------------------------------------
    const companyRes = await client.query(
      `INSERT INTO companies (id, code, name, legal_name, email, phone, city, state, country, currency, timezone, is_active)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
       ON CONFLICT (code) DO UPDATE SET name = $2
       RETURNING id`,
      [
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
    const companyId = companyRes.rows[0].id;

    // ---------------------------------------------------------------
    // Branches
    // ---------------------------------------------------------------
    const branchRes = await client.query(
      `INSERT INTO branches (id, company_id, code, name, city, state, is_active) VALUES
       (gen_random_uuid(), $1, 'HQ', 'Head Office - Mumbai', 'Mumbai', 'Maharashtra', true),
       (gen_random_uuid(), $1, 'PUNE', 'Pune Office', 'Pune', 'Maharashtra', true),
       (gen_random_uuid(), $1, 'BLR', 'Bengaluru Office', 'Bengaluru', 'Karnataka', true)
       ON CONFLICT (company_id, code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, code`,
      [companyId]
    );

    // ---------------------------------------------------------------
    // Departments
    // ---------------------------------------------------------------
    const deptRes = await client.query(
      `INSERT INTO departments (id, company_id, code, name, is_active) VALUES
       (gen_random_uuid(), $1, 'ENG', 'Engineering', true),
       (gen_random_uuid(), $1, 'HR', 'Human Resources', true),
       (gen_random_uuid(), $1, 'FIN', 'Finance', true)
       ON CONFLICT (company_id, code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, code`,
      [companyId]
    );
    const depts = Object.fromEntries(deptRes.rows.map(r => [r.code, r.id]));

    // ---------------------------------------------------------------
    // Designations
    // ---------------------------------------------------------------
    await client.query(
      `INSERT INTO designations (id, company_id, department_id, code, name, grade, minimum_salary, maximum_salary, is_active) VALUES
       (gen_random_uuid(), $1, $2, 'SWE', 'Software Engineer', 'G5', '500000', '1200000', true),
       (gen_random_uuid(), $1, $2, 'SR_SWE', 'Senior Software Engineer', 'G6', '1000000', '2000000', true),
       (gen_random_uuid(), $1, $3, 'HR_MGR', 'HR Manager', 'G6', '800000', '1500000', true),
       (gen_random_uuid(), $1, $4, 'ACC', 'Accountant', 'G5', '400000', '900000', true)
       ON CONFLICT (company_id, code) DO UPDATE SET name = EXCLUDED.name`,
      [companyId, depts['ENG'], depts['HR'], depts['FIN']]
    );

    // ---------------------------------------------------------------
    // Employment Types
    // ---------------------------------------------------------------
    await client.query(
      `INSERT INTO employment_types (id, company_id, code, name, is_active) VALUES
       (gen_random_uuid(), $1, 'PERM', 'Permanent', true),
       (gen_random_uuid(), $1, 'CONTRACT', 'Contract', true),
       (gen_random_uuid(), $1, 'INTERN', 'Intern', true)
       ON CONFLICT (company_id, code) DO UPDATE SET name = EXCLUDED.name`,
      [companyId]
    );

    // ---------------------------------------------------------------
    // Salary Components
    // ---------------------------------------------------------------
    await client.query(
      `INSERT INTO salary_components (id, company_id, code, name, component_type, calculation_type, is_taxable, is_statutory, display_order, is_active) VALUES
       (gen_random_uuid(), $1, 'BASIC', 'Basic', 'EARNING', 'FIXED', true, false, 1, true),
       (gen_random_uuid(), $1, 'HRA', 'House Rent Allowance', 'EARNING', 'PERCENTAGE', true, false, 2, true),
       (gen_random_uuid(), $1, 'SPECIAL', 'Special Allowance', 'EARNING', 'FIXED', true, false, 3, true),
       (gen_random_uuid(), $1, 'CONVEYANCE', 'Conveyance', 'EARNING', 'FIXED', false, false, 4, true),
       (gen_random_uuid(), $1, 'PF_EE', 'Provident Fund (Employee)', 'DEDUCTION', 'PERCENTAGE', false, true, 10, true),
       (gen_random_uuid(), $1, 'ESI_EE', 'ESI (Employee)', 'DEDUCTION', 'PERCENTAGE', false, true, 11, true),
       (gen_random_uuid(), $1, 'PT', 'Professional Tax', 'DEDUCTION', 'FIXED', false, true, 12, true),
       (gen_random_uuid(), $1, 'TDS', 'Income Tax (TDS)', 'DEDUCTION', 'FIXED', false, true, 13, true),
       (gen_random_uuid(), $1, 'PF_ER', 'Provident Fund (Employer)', 'EMPLOYER_CONTRIBUTION', 'PERCENTAGE', false, true, 20, true)
       ON CONFLICT (company_id, code) DO UPDATE SET name = EXCLUDED.name`,
      [companyId]
    );

    // ---------------------------------------------------------------
    // Salary Structure: Standard
    // ---------------------------------------------------------------
    const structRes = await client.query(
      `INSERT INTO salary_structures (id, company_id, code, name, effective_from, is_active) VALUES
       (gen_random_uuid(), $1, 'STD_2025', 'Standard Structure 2025', '2025-04-01', true)
       ON CONFLICT (company_id, code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [companyId]
    );
    const structId = structRes.rows[0].id;
    
    const compRows = await client.query(`SELECT id, code FROM salary_components WHERE company_id=$1`, [companyId]);
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
      
      // we don't have a unique key to conflict on easily, we just catch if it fails or assume it's fine.
      // Drizzle generates UUIDs for pk() anyway.
      // If we run idempotently this might duplicate rows if we're not careful.
      // To be safe we'll delete existing components for this structure first:
      await client.query(`DELETE FROM salary_structure_components WHERE salary_structure_id = $1 AND salary_component_id = $2`, [structId, compId]);
      
      await client.query(
        `INSERT INTO salary_structure_components (id, salary_structure_id, salary_component_id, calculation_type, amount, percentage, display_order)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)`,
        [structId, compId, calcType, amount, pct, order]
      );
    }

    // ---------------------------------------------------------------
    // Shifts + Holidays + Leave Types + Statutory Rules
    // ---------------------------------------------------------------
    await client.query(
      `INSERT INTO shifts (id, company_id, code, name, start_time, end_time, break_minutes, working_hours, grace_minutes, is_active) VALUES
       (gen_random_uuid(), $1, 'GENERAL', 'General Shift', '09:30', '18:30', 60, 8, 15, true),
       (gen_random_uuid(), $1, 'NIGHT', 'Night Shift', '21:00', '06:00', 60, 8, 15, true)
       ON CONFLICT (company_id, code) DO UPDATE SET name = EXCLUDED.name`,
      [companyId]
    );
    
    // We'll just delete all holidays and re-insert for idempotence since there is no code
    await client.query(`DELETE FROM holidays WHERE company_id = $1`, [companyId]);
    await client.query(
      `INSERT INTO holidays (id, company_id, name, holiday_date, holiday_type, is_active) VALUES
       (gen_random_uuid(), $1, 'Republic Day', '2026-01-26', 'NATIONAL', true),
       (gen_random_uuid(), $1, 'Holi', '2026-03-03', 'FESTIVAL', true),
       (gen_random_uuid(), $1, 'Independence Day', '2026-08-15', 'NATIONAL', true)`,
      [companyId]
    );
    
    await client.query(
      `INSERT INTO leave_types (id, company_id, code, name, is_paid, annual_allowance, carry_forward_allowed, max_carry_forward_days, requires_approval, is_active) VALUES
       (gen_random_uuid(), $1, 'CL', 'Casual Leave', true, 12, true, 5, true, true),
       (gen_random_uuid(), $1, 'SL', 'Sick Leave', true, 8, false, 0, true, true),
       (gen_random_uuid(), $1, 'EL', 'Earned Leave', true, 15, true, 30, true, true),
       (gen_random_uuid(), $1, 'LOP', 'Loss of Pay', false, 0, false, 0, true, true)
       ON CONFLICT (company_id, code) DO UPDATE SET name = EXCLUDED.name`,
      [companyId]
    );
    
    await client.query(
      `INSERT INTO statutory_rules (id, company_id, code, name, statutory_type, calculation_type, employee_percentage, employer_percentage, maximum_limit, effective_from, is_active) VALUES
       (gen_random_uuid(), $1, 'PF_2025', 'PF Rule 2025', 'PF', 'PERCENTAGE', 12, 12, 15000, '2025-04-01', true),
       (gen_random_uuid(), $1, 'ESI_2025', 'ESI Rule 2025', 'ESI', 'PERCENTAGE', 0.75, 3.25, 21000, '2025-04-01', true),
       (gen_random_uuid(), $1, 'PT_MH', 'Professional Tax MH', 'PT', 'FIXED', null, null, 2500, '2025-04-01', true)
       ON CONFLICT (company_id, code) DO UPDATE SET name = EXCLUDED.name`,
      [companyId]
    );

    // ---------------------------------------------------------------
    // Permissions + Roles
    // ---------------------------------------------------------------
    const modules = ["employees", "attendance", "leave", "salary", "payroll", "reports", "settings", "users"];
    const actions = ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT"];
    
    // delete old permissions for idempotence
    await client.query(`DELETE FROM permissions`);
    for (const m of modules) {
      for (const a of actions) {
        await client.query(
          `INSERT INTO permissions (id, module, action, description) VALUES (gen_random_uuid(), $1, $2, $3)`,
          [m, a, `${a} ${m}`]
        );
      }
    }
    
    await client.query(
      `INSERT INTO roles (id, company_id, name, slug, is_system_role) VALUES
       (gen_random_uuid(), $1, 'Super Admin', 'SUPER_ADMIN', true),
       (gen_random_uuid(), $1, 'HR Manager', 'HR_MANAGER', false),
       (gen_random_uuid(), $1, 'Payroll Admin', 'PAYROLL_ADMIN', false),
       (gen_random_uuid(), $1, 'Employee', 'EMPLOYEE', false)
       ON CONFLICT (company_id, slug) DO UPDATE SET name = EXCLUDED.name`,
      [companyId]
    );

    // ---------------------------------------------------------------
    // Document Types & Master Configurations
    // ---------------------------------------------------------------
    const docTypes = [
      { code: 'JOINING_LETTER', name: 'Joining Letter', description: 'Standard joining letter for new employees' },
      { code: 'SALARY_REVISION', name: 'Salary Revision Letter', description: 'Given during appraisals' },
      { code: 'PROMOTION_LETTER', name: 'Promotion Letter', description: 'Given upon promotion' },
      { code: 'RELIEVING_LETTER', name: 'Relieving Letter', description: 'Given at exit' },
      { code: 'EXPERIENCE_LETTER', name: 'Experience Letter', description: 'Experience certificate' }
    ];

    for (const dt of docTypes) {
      const typeRes = await client.query(
        `INSERT INTO document_types (id, company_id, code, name, description, is_active)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, true)
         ON CONFLICT (company_id, code) DO UPDATE SET name = $3
         RETURNING id`,
        [companyId, dt.code, dt.name, dt.description]
      );
      const typeId = typeRes.rows[0].id;

      let templateContent = "";
      if (dt.code === 'JOINING_LETTER') {
        templateContent = "<h2>Joining Letter</h2><p>Dear {{EmployeeName}},</p><p>Welcome to {{CompanyName}}. Your joining date is {{DateOfJoining}}.</p>";
      } else if (dt.code === 'SALARY_REVISION') {
        templateContent = "<h2>Salary Revision</h2><p>Dear {{EmployeeName}},</p><p>Your salary has been revised to {{BasicSalary}} effective from {{EffectiveDate}}.</p>";
      } else if (dt.code === 'PROMOTION_LETTER') {
        templateContent = "<h2>Promotion Letter</h2><p>Dear {{EmployeeName}},</p><p>Congratulations on your promotion to {{NewDesignation}}.</p>";
      } else if (dt.code === 'RELIEVING_LETTER') {
        templateContent = "<h2>Relieving Letter</h2><p>Dear {{EmployeeName}},</p><p>This is to confirm your relieving from {{CompanyName}}.</p>";
      } else if (dt.code === 'EXPERIENCE_LETTER') {
        templateContent = "<h2>Experience Letter</h2><p>Dear {{EmployeeName}},</p><p>This certifies that you worked at {{CompanyName}} from {{DateOfJoining}} to {{CurrentDate}}.</p>";
      }

      await client.query(
        `INSERT INTO document_master (id, company_id, document_type_id, code, name, description, is_required, is_repeatable, template_content, is_active)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, true, $6, true)
         ON CONFLICT (company_id, code) DO UPDATE SET name = EXCLUDED.name`,
        [companyId, typeId, dt.code + "_STD", dt.name + " (Standard)", "Default template", templateContent]
      );
    }

    // ---------------------------------------------------------------
    // Admin User
    // ---------------------------------------------------------------
    const ADMIN_HASH = "$2b$10$4jCeNIO9X0DF0r9/X7DTGOX5pGIUvlrYeaITCxp.MGPaFcdtUiqAG";
    await client.query(
      `INSERT INTO users (id, company_id, email, password_hash, is_active)
       VALUES (gen_random_uuid(), $1, 'admin@paymatrix.com', $2, true)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2, is_active = true`,
      [companyId, ADMIN_HASH]
    );

    await client.query(
      `INSERT INTO user_roles (id, user_id, role_id)
       SELECT gen_random_uuid(), u.id, r.id FROM users u, roles r
       WHERE u.email = 'admin@paymatrix.com' AND r.slug = 'SUPER_ADMIN'
       ON CONFLICT DO NOTHING`
    );

    await client.query("COMMIT");
    console.log("✓ Default setup seed completed successfully!");

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
