const { Client } = require('c:/GitHub/PayMatrix/backend/node_modules/pg');
const client = new Client('postgresql://postgres:Karan%40123@localhost:5432/paymatrix');

async function migrate() {
  await client.connect();
  console.log('Connected to PostgreSQL. Running Phase 7 schema updates...');

  await client.query(`
    -- 1. salary_components: add is_proratable
    ALTER TABLE salary_components 
    ADD COLUMN IF NOT EXISTS is_proratable BOOLEAN NOT NULL DEFAULT TRUE;

    -- 2. payroll_runs: add Phase 7 fields
    ALTER TABLE payroll_runs 
    ADD COLUMN IF NOT EXISTS run_number VARCHAR(40),
    ADD COLUMN IF NOT EXISTS period_year INTEGER,
    ADD COLUMN IF NOT EXISTS period_month INTEGER,
    ADD COLUMN IF NOT EXISTS total_gross NUMERIC(18,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_net NUMERIC(18,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_ctc NUMERIC(18,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS calculated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS finalized_by UUID;

    -- Backfill run_number, year, month, total_gross, total_net, created_by for existing rows
    UPDATE payroll_runs 
    SET 
      run_number = COALESCE(run_number, payroll_code),
      period_year = COALESCE(period_year, EXTRACT(YEAR FROM period_start)::int),
      period_month = COALESCE(period_month, EXTRACT(MONTH FROM period_start)::int),
      total_gross = COALESCE(total_gross, gross_amount, 0),
      total_net = COALESCE(total_net, net_amount, 0),
      created_by = COALESCE(created_by, prepared_by);

    -- Unique index on (company_id, period_year, period_month)
    CREATE UNIQUE INDEX IF NOT EXISTS payroll_runs_company_year_month_unique 
    ON payroll_runs(company_id, period_year, period_month)
    WHERE status != 'CANCELLED';

    -- 3. payroll_employees: add snapshot & attendance fields
    ALTER TABLE payroll_employees 
    ADD COLUMN IF NOT EXISTS employee_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS employee_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS department_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS designation_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS salary_structure_id UUID,
    ADD COLUMN IF NOT EXISTS salary_structure_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS calendar_days INTEGER DEFAULT 30,
    ADD COLUMN IF NOT EXISTS holiday_days NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS week_off_days NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS paid_days NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS gross_salary NUMERIC(18,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_ctc NUMERIC(18,2) DEFAULT 0;

    -- Backfill employee fields if existing
    UPDATE payroll_employees pe
    SET 
      gross_salary = COALESCE(pe.gross_salary, pe.gross_earnings, 0),
      paid_days = COALESCE(pe.paid_days, pe.present_days + pe.paid_leave_days, 0)
    WHERE pe.gross_salary = 0;

    -- 4. payroll_components: add snapshot fields
    ALTER TABLE payroll_components 
    ADD COLUMN IF NOT EXISTS component_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS component_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS calculation_basis VARCHAR(50);

    -- 5. payroll_adjustments: add type, name, is_addition, reason, updated_at
    ALTER TABLE payroll_adjustments 
    ADD COLUMN IF NOT EXISTS type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS is_addition BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS reason TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

    -- Backfill adjustments
    UPDATE payroll_adjustments 
    SET 
      type = COALESCE(type, adjustment_type::text),
      name = COALESCE(name, adjustment_type::text),
      reason = COALESCE(reason, description, 'Manual Adjustment')
    WHERE reason IS NULL;

    -- 6. payslips: add run_id, employee_id, period_year, period_month, financials
    ALTER TABLE payslips 
    ADD COLUMN IF NOT EXISTS payroll_run_id UUID REFERENCES payroll_runs(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS period_year INTEGER,
    ADD COLUMN IF NOT EXISTS period_month INTEGER,
    ADD COLUMN IF NOT EXISTS gross_salary NUMERIC(18,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_deductions NUMERIC(18,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS net_salary NUMERIC(18,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS employer_contributions NUMERIC(18,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_ctc NUMERIC(18,2) DEFAULT 0;

    -- Backfill payslip references from payroll_employees
    UPDATE payslips ps
    SET 
      payroll_run_id = pe.payroll_run_id,
      employee_id = pe.employee_id,
      gross_salary = pe.gross_earnings,
      total_deductions = pe.total_deductions,
      net_salary = pe.net_salary,
      employer_contributions = pe.employer_contributions,
      total_ctc = pe.gross_earnings + pe.employer_contributions
    FROM payroll_employees pe
    WHERE ps.payroll_employee_id = pe.id AND ps.payroll_run_id IS NULL;

    -- 7. payroll_approvals: add action, remarks, performed_by, performed_at
    ALTER TABLE payroll_approvals 
    ADD COLUMN IF NOT EXISTS action VARCHAR(50) DEFAULT 'APPROVED',
    ADD COLUMN IF NOT EXISTS remarks TEXT,
    ADD COLUMN IF NOT EXISTS performed_by UUID,
    ADD COLUMN IF NOT EXISTS performed_at TIMESTAMPTZ DEFAULT NOW();

    UPDATE payroll_approvals
    SET 
      action = COALESCE(action, status::text),
      remarks = COALESCE(remarks, comments),
      performed_by = COALESCE(performed_by, approver_id),
      performed_at = COALESCE(performed_at, approved_at, created_at)
    WHERE performed_by IS NULL;
  `);

  console.log('Phase 7 migration completed successfully!');
  await client.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
