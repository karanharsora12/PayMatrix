/**
 * PayMatrix — Sample Queries
 *
 * These are reference SQL queries showing how the schema supports
 * reporting and app workflows. Use in NestJS via Drizzle `db.execute(sql`...`)`
 * or via Knex/queryBuilder.
 *
 * All queries are company-isolated: always filter by company_id.
 */

// ---------------------------------------------------------------------------
// 1. Employee directory (with branch/department/designation + manager)
// ---------------------------------------------------------------------------
export const Q_EMPLOYEE_DIRECTORY = `
SELECT
  e.employee_code, e.first_name, e.last_name, e.email, e.phone,
  b.name  AS branch, d.name AS department, des.name AS designation,
  m.first_name || ' ' || m.last_name AS manager,
  e.employment_status, e.joining_date
FROM employees e
LEFT JOIN branches b      ON b.id = e.branch_id
LEFT JOIN departments d   ON d.id = e.department_id
LEFT JOIN designations des ON des.id = e.designation_id
LEFT JOIN employees m     ON m.id = e.reporting_manager_id
WHERE e.company_id = $1
  AND e.deleted_at IS NULL
ORDER BY e.employee_code;
`;

// ---------------------------------------------------------------------------
// 2. Employee current salary (effective as of a given date)
// ---------------------------------------------------------------------------
export const Q_EMPLOYEE_CURRENT_SALARY = `
SELECT ess.*, ss.code, ss.name AS structure_name
FROM employee_salary_structures ess
JOIN salary_structures ss ON ss.id = ess.salary_structure_id
WHERE ess.employee_id = $1
  AND ess.effective_from <= $2
  AND (ess.effective_to IS NULL OR ess.effective_to >= $2)
ORDER BY ess.effective_from DESC
LIMIT 1;

-- With components:
SELECT sc.code, sc.name, esc.calculation_type, esc.amount, esc.percentage
FROM employee_salary_components esc
JOIN salary_components sc ON sc.id = esc.salary_component_id
WHERE esc.employee_salary_structure_id = $1
ORDER BY sc.display_order;
`;

// ---------------------------------------------------------------------------
// 3. Monthly attendance report
// ---------------------------------------------------------------------------
export const Q_MONTHLY_ATTENDANCE = `
SELECT employee_id, attendance_date, status, working_minutes, overtime_minutes
FROM attendance
WHERE company_id = $1
  AND attendance_date BETWEEN $2 AND $3
ORDER BY employee_id, attendance_date;

-- Late report:
SELECT e.employee_code, e.first_name, a.attendance_date, a.check_in
FROM attendance a
JOIN employees e ON e.id = a.employee_id
WHERE a.company_id = $1 AND a.status = 'LATE'
  AND a.attendance_date BETWEEN $2 AND $3;
`;

// ---------------------------------------------------------------------------
// 4. Leave balance for an employee/year
// ---------------------------------------------------------------------------
export const Q_LEAVE_BALANCE = `
SELECT lt.code, lt.name, b.opening_balance, b.allocated_days, b.used_days, b.pending_days, b.remaining_days
FROM employee_leave_balances b
JOIN leave_types lt ON lt.id = b.leave_type_id
WHERE b.employee_id = $1 AND b.year = $2;

-- Pending approvals for a manager:
SELECT lr.*, e.employee_code, lt.name AS leave_type
FROM leave_requests lr
JOIN employees e ON e.id = lr.employee_id
JOIN leave_types lt ON lt.id = lr.leave_type_id
WHERE lr.company_id = $1 AND lr.status = 'PENDING'
ORDER BY lr.created_at;
`;

// ---------------------------------------------------------------------------
// 5. Payroll summary for a period
// ---------------------------------------------------------------------------
export const Q_PAYROLL_SUMMARY = `
SELECT pr.payroll_code, pr.period_start, pr.period_end, pr.employee_count,
       pr.gross_amount, pr.total_deductions, pr.net_amount, pr.status
FROM payroll_runs pr
WHERE pr.company_id = $1
  AND pr.period_start = $2 AND pr.period_end = $3;

-- Department-wise payroll (join via employees):
SELECT d.name AS department, COUNT(*) AS emp_count, SUM(pe.net_salary) AS total_net
FROM payroll_employees pe
JOIN payroll_runs pr ON pr.id = pe.payroll_run_id
JOIN employees e ON e.id = pe.employee_id
LEFT JOIN departments d ON d.id = e.department_id
WHERE pr.id = $1
GROUP BY d.name;
`;

// ---------------------------------------------------------------------------
// 6. Payslip (employee + components + adjustments)
// ---------------------------------------------------------------------------
export const Q_PAYSLIP = `
SELECT pe.*, e.employee_code, e.first_name, e.last_name, ps.payslip_number, ps.file_url
FROM payroll_employees pe
JOIN employees e ON e.id = pe.employee_id
LEFT JOIN payslips ps ON ps.payroll_employee_id = pe.id
WHERE pe.id = $1;

SELECT sc.code, sc.name, pc.component_type, pc.amount
FROM payroll_components pc
JOIN salary_components sc ON sc.id = pc.salary_component_id
WHERE pc.payroll_employee_id = $1
ORDER BY sc.display_order;

SELECT adjustment_type, description, amount FROM payroll_adjustments
WHERE payroll_employee_id = $1;
`;

// ---------------------------------------------------------------------------
// 7. Bank payment report (for net salary transfer)
// ---------------------------------------------------------------------------
export const Q_BANK_PAYMENT_REPORT = `
SELECT e.employee_code, e.first_name || ' ' || e.last_name AS name,
       ba.bank_name, ba.account_number, ba.ifsc_code,
       pe.net_salary
FROM payroll_employees pe
JOIN employees e ON e.id = pe.employee_id
JOIN employee_bank_accounts ba ON ba.employee_id = e.id AND ba.is_primary = true
WHERE pe.payroll_run_id = $1
ORDER BY e.employee_code;
`;

// ---------------------------------------------------------------------------
// 8. Payroll register (all employees in a run, flat)
// ---------------------------------------------------------------------------
export const Q_PAYROLL_REGISTER = `
SELECT e.employee_code, e.first_name, e.last_name,
       pe.working_days, pe.present_days, pe.paid_leave_days, pe.absent_days,
       pe.gross_earnings, pe.total_deductions, pe.employer_contributions, pe.net_salary
FROM payroll_employees pe
JOIN employees e ON e.id = pe.employee_id
WHERE pe.payroll_run_id = $1
ORDER BY e.employee_code;
`;

// ---------------------------------------------------------------------------
// 9. Loan outstanding
// ---------------------------------------------------------------------------
export const Q_LOAN_OUTSTANDING = `
SELECT el.id, lt.name, el.principal_amount, el.outstanding_amount, el.status,
       (SELECT COUNT(*) FROM loan_installments li WHERE li.employee_loan_id = el.id AND li.status = 'PAID') AS paid_installments
FROM employee_loans el
JOIN loan_types lt ON lt.id = el.loan_type_id
WHERE el.employee_id = $1;
`;

// ---------------------------------------------------------------------------
// 10. Deductions expiring soon
// ---------------------------------------------------------------------------
export const Q_DEDUCTIONS_EXPIRING = `
SELECT ed.*, sc.name FROM employee_deductions ed
JOIN salary_components sc ON sc.id = ed.salary_component_id
WHERE ed.company_id = $1 AND ed.status = 'ACTIVE'
  AND ed.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days';
`;

// ---------------------------------------------------------------------------
// 11. Audit log for an entity
// ---------------------------------------------------------------------------
export const Q_AUDIT_LOG = `
SELECT al.action, al.old_values, al.new_values, al.created_at, u.email AS actor
FROM audit_logs al
LEFT JOIN users u ON u.id = al.user_id
WHERE al.company_id = $1 AND al.entity_type = $2 AND al.entity_id = $3
ORDER BY al.created_at DESC;
`;

// ---------------------------------------------------------------------------
// 12. Tax/PF report for a payroll run
// ---------------------------------------------------------------------------
export const Q_STATUTORY_REPORT = `
SELECT sc.code, sc.name, SUM(pc.amount) AS total
FROM payroll_components pc
JOIN salary_components sc ON sc.id = pc.salary_component_id
JOIN payroll_employees pe ON pe.id = pc.payroll_employee_id
WHERE pe.payroll_run_id = $1 AND sc.is_statutory = true
GROUP BY sc.code, sc.name;
`;
