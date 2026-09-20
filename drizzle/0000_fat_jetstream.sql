CREATE TYPE "public"."account_type" AS ENUM('SAVINGS', 'CURRENT', 'SALARY', 'NRO', 'NRE');--> statement-breakpoint
CREATE TYPE "public"."address_type" AS ENUM('PERMANENT', 'CURRENT', 'EMERGENCY');--> statement-breakpoint
CREATE TYPE "public"."adjustment_type" AS ENUM('ARREAR', 'RECOVERY', 'MANUAL_BONUS', 'MANUAL_DEDUCTION', 'ROUNDING', 'CORRECTION', 'LOAN_RECOVERY', 'ADVANCE_RECOVERY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."advance_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'RECOVERING', 'RECOVERED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."attendance_punch_type" AS ENUM('IN', 'OUT', 'BREAK_IN', 'BREAK_OUT');--> statement-breakpoint
CREATE TYPE "public"."attendance_source" AS ENUM('BIOMETRIC', 'WEB', 'MOBILE', 'MANUAL', 'API');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('PRESENT', 'ABSENT', 'HALF_DAY', 'LATE', 'ON_LEAVE', 'HOLIDAY', 'WEEK_OFF', 'ON_DUTY', 'WFH');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'CALCULATE', 'FINALIZE', 'GENERATE', 'EXPORT', 'IMPORT');--> statement-breakpoint
CREATE TYPE "public"."blood_group" AS ENUM('A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG');--> statement-breakpoint
CREATE TYPE "public"."bonus_status" AS ENUM('PENDING', 'APPROVED', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."bonus_type" AS ENUM('PERFORMANCE', 'FESTIVAL', 'ANNUAL', 'PROJECT', 'REFERRAL', 'RETENTION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."calculation_type" AS ENUM('FIXED', 'PERCENTAGE', 'FORMULA');--> statement-breakpoint
CREATE TYPE "public"."deduction_status" AS ENUM('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."employment_status" AS ENUM('PROBATION', 'CONFIRMED', 'NOTICE_PERIOD', 'RESIGNED', 'TERMINATED', 'RETIRED', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');--> statement-breakpoint
CREATE TYPE "public"."holiday_type" AS ENUM('NATIONAL', 'FESTIVAL', 'WEEKLY_OFF', 'RESTRICTED');--> statement-breakpoint
CREATE TYPE "public"."leave_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."loan_installment_status" AS ENUM('PENDING', 'DUE', 'PAID', 'OVERDUE', 'WAIVED', 'SKIPPED');--> statement-breakpoint
CREATE TYPE "public"."loan_status" AS ENUM('PENDING', 'APPROVED', 'DISBURSED', 'RECOVERING', 'CLOSED', 'REJECTED', 'DEFAULTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."marital_status" AS ENUM('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('PAYROLL', 'LEAVE', 'ATTENDANCE', 'LOAN', 'ADVANCE', 'BONUS', 'SYSTEM', 'APPROVAL', 'GENERAL');--> statement-breakpoint
CREATE TYPE "public"."payroll_approval_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."payroll_employee_status" AS ENUM('DRAFT', 'CALCULATED', 'HELD', 'APPROVED', 'PAID', 'SKIPPED');--> statement-breakpoint
CREATE TYPE "public"."payroll_run_status" AS ENUM('DRAFT', 'CALCULATING', 'CALCULATED', 'PENDING_APPROVAL', 'APPROVED', 'FINALIZED', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payslip_status" AS ENUM('GENERATED', 'PUBLISHED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."permission_action" AS ENUM('VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'EXPORT', 'IMPORT');--> statement-breakpoint
CREATE TYPE "public"."salary_component_type" AS ENUM('EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION');--> statement-breakpoint
CREATE TYPE "public"."salary_structure_status" AS ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."statutory_type" AS ENUM('PF', 'ESI', 'PT', 'TDS', 'LWF', 'GRATUITY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."tax_declaration_status" AS ENUM('DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."tax_regime" AS ENUM('OLD', 'NEW', 'NOT_APPLICABLE');--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"legal_name" varchar(255),
	"logo_url" text,
	"email" varchar(255),
	"phone" varchar(30),
	"website" varchar(255),
	"tax_number" varchar(100),
	"registration_number" varchar(100),
	"address" text,
	"city" varchar(120),
	"state" varchar(120),
	"country" varchar(120) DEFAULT 'India',
	"postal_code" varchar(20),
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"timezone" varchar(60) DEFAULT 'Asia/Kolkata' NOT NULL,
	"date_format" varchar(20) DEFAULT 'DD/MM/YYYY',
	"financial_year_start" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"manager_employee_id" uuid,
	"email" varchar(255),
	"phone" varchar(30),
	"address" text,
	"city" varchar(120),
	"state" varchar(120),
	"country" varchar(120) DEFAULT 'India',
	"postal_code" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"manager_employee_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "designations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"department_id" uuid,
	"code" varchar(30) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"grade" varchar(20),
	"level" integer,
	"minimum_salary" numeric(18, 2),
	"maximum_salary" numeric(18, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "employment_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"department_id" uuid,
	"designation_id" uuid,
	"employee_code" varchar(30) NOT NULL,
	"first_name" varchar(120) NOT NULL,
	"middle_name" varchar(120),
	"last_name" varchar(120) NOT NULL,
	"gender" "gender",
	"date_of_birth" date,
	"marital_status" "marital_status",
	"blood_group" "blood_group",
	"email" varchar(255),
	"personal_email" varchar(255),
	"phone" varchar(30),
	"alternate_phone" varchar(30),
	"joining_date" date NOT NULL,
	"confirmation_date" date,
	"resignation_date" date,
	"last_working_date" date,
	"employment_type_id" uuid,
	"employment_status" "employment_status" DEFAULT 'PROBATION' NOT NULL,
	"reporting_manager_id" uuid,
	"profile_photo_url" text,
	"pan_number" varchar(20),
	"national_id_number" varchar(30),
	"pf_number" varchar(50),
	"esi_number" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "employee_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"address_type" "address_type" NOT NULL,
	"address_line_1" text NOT NULL,
	"address_line_2" text,
	"city" varchar(120),
	"state" varchar(120),
	"country" varchar(120) DEFAULT 'India',
	"postal_code" varchar(20),
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"bank_name" varchar(255) NOT NULL,
	"branch_name" varchar(255),
	"account_number" varchar(50) NOT NULL,
	"ifsc_code" varchar(20),
	"account_holder_name" varchar(255),
	"account_type" "account_type" DEFAULT 'SAVINGS',
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"document_type" varchar(60) NOT NULL,
	"document_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"file_name" varchar(255),
	"file_size" integer,
	"mime_type" varchar(120),
	"issue_date" date,
	"expiry_date" date,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_group_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_shift_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"shift_id" uuid NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(255) NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"break_minutes" integer DEFAULT 0 NOT NULL,
	"working_hours" numeric(12, 4),
	"grace_minutes" integer DEFAULT 0 NOT NULL,
	"overtime_allowed" boolean DEFAULT false NOT NULL,
	"is_night_shift" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holidays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"holiday_date" date NOT NULL,
	"holiday_type" "holiday_type" DEFAULT 'NATIONAL' NOT NULL,
	"description" text,
	"is_optional" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"attendance_date" date NOT NULL,
	"check_in" timestamp with time zone,
	"check_out" timestamp with time zone,
	"working_minutes" integer,
	"break_minutes" integer DEFAULT 0,
	"overtime_minutes" integer DEFAULT 0,
	"status" "attendance_status" DEFAULT 'PRESENT' NOT NULL,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"punch_time" timestamp with time zone NOT NULL,
	"punch_type" "attendance_punch_type" NOT NULL,
	"source" "attendance_source" DEFAULT 'BIOMETRIC' NOT NULL,
	"device_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_leave_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"leave_type_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"opening_balance" numeric(12, 4) DEFAULT '0' NOT NULL,
	"allocated_days" numeric(12, 4) DEFAULT '0' NOT NULL,
	"used_days" numeric(12, 4) DEFAULT '0' NOT NULL,
	"pending_days" numeric(12, 4) DEFAULT '0' NOT NULL,
	"remaining_days" numeric(12, 4) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"leave_type_id" uuid NOT NULL,
	"from_date" date NOT NULL,
	"to_date" date NOT NULL,
	"total_days" numeric(12, 4) NOT NULL,
	"reason" text,
	"status" "leave_status" DEFAULT 'PENDING' NOT NULL,
	"approved_by" uuid,
	"approved_at" date,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"is_paid" boolean DEFAULT true NOT NULL,
	"annual_allowance" numeric(12, 4) DEFAULT '0' NOT NULL,
	"carry_forward_allowed" boolean DEFAULT false NOT NULL,
	"max_carry_forward_days" numeric(12, 4),
	"max_consecutive_days" integer,
	"requires_approval" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(40) NOT NULL,
	"name" varchar(255) NOT NULL,
	"component_type" "salary_component_type" NOT NULL,
	"calculation_type" "calculation_type" DEFAULT 'FIXED' NOT NULL,
	"default_amount" numeric(18, 2),
	"default_percentage" numeric(12, 4),
	"calculation_basis" varchar(40),
	"formula" text,
	"is_taxable" boolean DEFAULT true NOT NULL,
	"is_statutory" boolean DEFAULT false NOT NULL,
	"is_recurring" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_structure_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salary_structure_id" uuid NOT NULL,
	"salary_component_id" uuid NOT NULL,
	"calculation_type" "calculation_type" NOT NULL,
	"amount" numeric(18, 2),
	"percentage" numeric(12, 4),
	"formula" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_structures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(40) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_salary_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_salary_structure_id" uuid NOT NULL,
	"salary_component_id" uuid NOT NULL,
	"calculation_type" "calculation_type" NOT NULL,
	"amount" numeric(18, 2),
	"percentage" numeric(12, 4),
	"formula" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_salary_structures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"salary_structure_id" uuid NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"basic_salary" numeric(18, 2),
	"gross_salary" numeric(18, 2),
	"annual_ctc" numeric(18, 2),
	"status" "salary_structure_status" DEFAULT 'ACTIVE' NOT NULL,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bonuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"bonus_type" "bonus_type" NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"bonus_date" date NOT NULL,
	"payroll_period" varchar(20),
	"is_taxable" boolean DEFAULT true NOT NULL,
	"remarks" text,
	"status" "bonus_status" DEFAULT 'PENDING' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_deductions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"salary_component_id" uuid NOT NULL,
	"amount" numeric(18, 2),
	"percentage" numeric(12, 4),
	"start_date" date NOT NULL,
	"end_date" date,
	"is_recurring" boolean DEFAULT true NOT NULL,
	"remarks" text,
	"status" "deduction_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"loan_type_id" uuid NOT NULL,
	"principal_amount" numeric(18, 2) NOT NULL,
	"interest_rate" numeric(12, 4),
	"tenure_months" integer NOT NULL,
	"emi_amount" numeric(18, 2) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"total_amount" numeric(18, 2),
	"paid_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"outstanding_amount" numeric(18, 2) NOT NULL,
	"status" "loan_status" DEFAULT 'PENDING' NOT NULL,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loan_installments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_loan_id" uuid NOT NULL,
	"installment_number" integer NOT NULL,
	"due_date" date NOT NULL,
	"principal_amount" numeric(18, 2) NOT NULL,
	"interest_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(18, 2) NOT NULL,
	"paid_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"outstanding_amount" numeric(18, 2) NOT NULL,
	"status" "loan_installment_status" DEFAULT 'PENDING' NOT NULL,
	"paid_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loan_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"maximum_amount" numeric(18, 2),
	"interest_rate" numeric(12, 4),
	"maximum_tenure" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_advances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"advance_date" date NOT NULL,
	"recovery_start_date" date,
	"recovery_end_date" date,
	"recovery_amount" numeric(18, 2),
	"remarks" text,
	"status" "advance_status" DEFAULT 'PENDING' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payroll_employee_id" uuid NOT NULL,
	"adjustment_type" "adjustment_type" NOT NULL,
	"description" text,
	"amount" numeric(18, 2) NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payroll_run_id" uuid NOT NULL,
	"approver_id" uuid NOT NULL,
	"approval_level" integer DEFAULT 1 NOT NULL,
	"status" "payroll_approval_status" DEFAULT 'PENDING' NOT NULL,
	"comments" text,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payroll_employee_id" uuid NOT NULL,
	"salary_component_id" uuid NOT NULL,
	"component_type" "salary_component_type" NOT NULL,
	"calculation_type" "calculation_type" NOT NULL,
	"quantity" numeric(12, 4),
	"rate" numeric(12, 4),
	"amount" numeric(18, 2) NOT NULL,
	"is_taxable" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payroll_run_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"working_days" integer NOT NULL,
	"present_days" numeric(12, 4) NOT NULL,
	"paid_leave_days" numeric(12, 4) DEFAULT '0' NOT NULL,
	"unpaid_leave_days" numeric(12, 4) DEFAULT '0' NOT NULL,
	"absent_days" numeric(12, 4) DEFAULT '0' NOT NULL,
	"overtime_minutes" integer DEFAULT 0 NOT NULL,
	"gross_earnings" numeric(18, 2) NOT NULL,
	"total_deductions" numeric(18, 2) NOT NULL,
	"employer_contributions" numeric(18, 2) DEFAULT '0' NOT NULL,
	"net_salary" numeric(18, 2) NOT NULL,
	"status" "payroll_employee_status" DEFAULT 'CALCULATED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"payroll_code" varchar(40) NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"pay_date" date,
	"employee_count" integer DEFAULT 0 NOT NULL,
	"gross_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"total_deductions" numeric(18, 2) DEFAULT '0' NOT NULL,
	"total_employer_contributions" numeric(18, 2) DEFAULT '0' NOT NULL,
	"net_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"status" "payroll_run_status" DEFAULT 'DRAFT' NOT NULL,
	"prepared_by" uuid,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payslips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payroll_employee_id" uuid NOT NULL,
	"payslip_number" varchar(40) NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"file_url" text,
	"status" "payslip_status" DEFAULT 'GENERATED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payslips_payroll_employee_id_unique" UNIQUE("payroll_employee_id"),
	CONSTRAINT "payslips_payslip_number_unique" UNIQUE("payslip_number")
);
--> statement-breakpoint
CREATE TABLE "employee_statutory_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"pan_number" varchar(20),
	"pf_number" varchar(50),
	"uan_number" varchar(20),
	"esi_number" varchar(50),
	"professional_tax_number" varchar(50),
	"tax_regime" "tax_regime" DEFAULT 'NEW' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employee_statutory_details_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "employee_tax_declarations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"financial_year" varchar(10) NOT NULL,
	"tax_regime" "tax_regime" NOT NULL,
	"declared_income" numeric(18, 2),
	"declared_deductions" numeric(18, 2),
	"proof_documents" text,
	"status" "tax_declaration_status" DEFAULT 'DRAFT' NOT NULL,
	"submitted_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "statutory_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(40) NOT NULL,
	"name" varchar(255) NOT NULL,
	"statutory_type" "statutory_type" NOT NULL,
	"calculation_type" "calculation_type" DEFAULT 'PERCENTAGE' NOT NULL,
	"employee_percentage" numeric(12, 4),
	"employer_percentage" numeric(12, 4),
	"minimum_limit" numeric(18, 2),
	"maximum_limit" numeric(18, 2),
	"effective_from" date NOT NULL,
	"effective_to" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module" varchar(80) NOT NULL,
	"action" "permission_action" NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"name" varchar(120) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"description" text,
	"is_system_role" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"employee_id" uuid,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"user_id" uuid,
	"module" varchar(80) NOT NULL,
	"entity_type" varchar(80) NOT NULL,
	"entity_id" uuid,
	"action" "audit_action" NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"notification_type" "notification_type" NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"entity_type" varchar(80),
	"entity_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"key" varchar(120) NOT NULL,
	"value" text,
	"value_type" varchar(20) DEFAULT 'STRING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designations" ADD CONSTRAINT "designations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designations" ADD CONSTRAINT "designations_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employment_types" ADD CONSTRAINT "employment_types_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_designation_id_designations_id_fk" FOREIGN KEY ("designation_id") REFERENCES "public"."designations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_addresses" ADD CONSTRAINT "employee_addresses_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_bank_accounts" ADD CONSTRAINT "employee_bank_accounts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_group_members" ADD CONSTRAINT "employee_group_members_employee_group_id_employee_groups_id_fk" FOREIGN KEY ("employee_group_id") REFERENCES "public"."employee_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_group_members" ADD CONSTRAINT "employee_group_members_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_groups" ADD CONSTRAINT "employee_groups_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_shift_assignments" ADD CONSTRAINT "employee_shift_assignments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_shift_assignments" ADD CONSTRAINT "employee_shift_assignments_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_leave_balances" ADD CONSTRAINT "employee_leave_balances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_leave_balances" ADD CONSTRAINT "employee_leave_balances_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_types" ADD CONSTRAINT "leave_types_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_components" ADD CONSTRAINT "salary_components_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_structure_components" ADD CONSTRAINT "salary_structure_components_salary_structure_id_salary_structures_id_fk" FOREIGN KEY ("salary_structure_id") REFERENCES "public"."salary_structures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_structure_components" ADD CONSTRAINT "salary_structure_components_salary_component_id_salary_components_id_fk" FOREIGN KEY ("salary_component_id") REFERENCES "public"."salary_components"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_salary_components" ADD CONSTRAINT "employee_salary_components_employee_salary_structure_id_employee_salary_structures_id_fk" FOREIGN KEY ("employee_salary_structure_id") REFERENCES "public"."employee_salary_structures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_salary_components" ADD CONSTRAINT "employee_salary_components_salary_component_id_salary_components_id_fk" FOREIGN KEY ("salary_component_id") REFERENCES "public"."salary_components"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_salary_structures" ADD CONSTRAINT "employee_salary_structures_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_salary_structures" ADD CONSTRAINT "employee_salary_structures_salary_structure_id_salary_structures_id_fk" FOREIGN KEY ("salary_structure_id") REFERENCES "public"."salary_structures"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_deductions" ADD CONSTRAINT "employee_deductions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_deductions" ADD CONSTRAINT "employee_deductions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_deductions" ADD CONSTRAINT "employee_deductions_salary_component_id_salary_components_id_fk" FOREIGN KEY ("salary_component_id") REFERENCES "public"."salary_components"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_loans" ADD CONSTRAINT "employee_loans_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_loans" ADD CONSTRAINT "employee_loans_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_loans" ADD CONSTRAINT "employee_loans_loan_type_id_loan_types_id_fk" FOREIGN KEY ("loan_type_id") REFERENCES "public"."loan_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_installments" ADD CONSTRAINT "loan_installments_employee_loan_id_employee_loans_id_fk" FOREIGN KEY ("employee_loan_id") REFERENCES "public"."employee_loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_types" ADD CONSTRAINT "loan_types_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_advances" ADD CONSTRAINT "employee_advances_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_advances" ADD CONSTRAINT "employee_advances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_adjustments" ADD CONSTRAINT "payroll_adjustments_payroll_employee_id_payroll_employees_id_fk" FOREIGN KEY ("payroll_employee_id") REFERENCES "public"."payroll_employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_approvals" ADD CONSTRAINT "payroll_approvals_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_components" ADD CONSTRAINT "payroll_components_payroll_employee_id_payroll_employees_id_fk" FOREIGN KEY ("payroll_employee_id") REFERENCES "public"."payroll_employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_components" ADD CONSTRAINT "payroll_components_salary_component_id_salary_components_id_fk" FOREIGN KEY ("salary_component_id") REFERENCES "public"."salary_components"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_employees" ADD CONSTRAINT "payroll_employees_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_employees" ADD CONSTRAINT "payroll_employees_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payroll_employee_id_payroll_employees_id_fk" FOREIGN KEY ("payroll_employee_id") REFERENCES "public"."payroll_employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_statutory_details" ADD CONSTRAINT "employee_statutory_details_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_tax_declarations" ADD CONSTRAINT "employee_tax_declarations_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statutory_rules" ADD CONSTRAINT "statutory_rules_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "companies_code_unique" ON "companies" USING btree ("code");--> statement-breakpoint
CREATE INDEX "companies_is_active_idx" ON "companies" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "branches_company_code_unique" ON "branches" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "branches_company_id_idx" ON "branches" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "branches_is_active_idx" ON "branches" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "departments_company_code_unique" ON "departments" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "departments_company_id_idx" ON "departments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "departments_is_active_idx" ON "departments" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "designations_company_code_unique" ON "designations" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "designations_company_id_idx" ON "designations" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "designations_department_id_idx" ON "designations" USING btree ("department_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employment_types_company_code_unique" ON "employment_types" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "employment_types_company_id_idx" ON "employment_types" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_company_code_unique" ON "employees" USING btree ("company_id","employee_code");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_company_email_unique" ON "employees" USING btree ("company_id","email");--> statement-breakpoint
CREATE INDEX "employees_company_id_idx" ON "employees" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "employees_branch_id_idx" ON "employees" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "employees_department_id_idx" ON "employees" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "employees_designation_id_idx" ON "employees" USING btree ("designation_id");--> statement-breakpoint
CREATE INDEX "employees_reporting_manager_idx" ON "employees" USING btree ("reporting_manager_id");--> statement-breakpoint
CREATE INDEX "employees_employment_status_idx" ON "employees" USING btree ("employment_status");--> statement-breakpoint
CREATE INDEX "employees_is_active_idx" ON "employees" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "employees_joining_date_idx" ON "employees" USING btree ("joining_date");--> statement-breakpoint
CREATE INDEX "employee_addresses_employee_id_idx" ON "employee_addresses" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_addresses_type_idx" ON "employee_addresses" USING btree ("address_type");--> statement-breakpoint
CREATE INDEX "employee_bank_accounts_employee_id_idx" ON "employee_bank_accounts" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_bank_accounts_is_primary_idx" ON "employee_bank_accounts" USING btree ("is_primary");--> statement-breakpoint
CREATE INDEX "employee_documents_employee_id_idx" ON "employee_documents" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_documents_type_idx" ON "employee_documents" USING btree ("document_type");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_group_members_group_employee_unique" ON "employee_group_members" USING btree ("employee_group_id","employee_id");--> statement-breakpoint
CREATE INDEX "employee_group_members_employee_id_idx" ON "employee_group_members" USING btree ("employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_groups_company_code_unique" ON "employee_groups" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "employee_groups_company_id_idx" ON "employee_groups" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "employee_shift_assignments_employee_id_idx" ON "employee_shift_assignments" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_shift_assignments_shift_id_idx" ON "employee_shift_assignments" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "employee_shift_assignments_effective_idx" ON "employee_shift_assignments" USING btree ("effective_from","effective_to");--> statement-breakpoint
CREATE UNIQUE INDEX "shifts_company_code_unique" ON "shifts" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "shifts_company_id_idx" ON "shifts" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "holidays_company_date_unique" ON "holidays" USING btree ("company_id","holiday_date");--> statement-breakpoint
CREATE INDEX "holidays_company_id_idx" ON "holidays" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "holidays_date_idx" ON "holidays" USING btree ("holiday_date");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_employee_date_unique" ON "attendance" USING btree ("employee_id","attendance_date");--> statement-breakpoint
CREATE INDEX "attendance_company_id_idx" ON "attendance" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "attendance_employee_id_idx" ON "attendance" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "attendance_date_idx" ON "attendance" USING btree ("attendance_date");--> statement-breakpoint
CREATE INDEX "attendance_status_idx" ON "attendance" USING btree ("status");--> statement-breakpoint
CREATE INDEX "attendance_company_date_idx" ON "attendance" USING btree ("company_id","attendance_date");--> statement-breakpoint
CREATE INDEX "attendance_logs_company_id_idx" ON "attendance_logs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "attendance_logs_employee_id_idx" ON "attendance_logs" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "attendance_logs_punch_time_idx" ON "attendance_logs" USING btree ("punch_time");--> statement-breakpoint
CREATE INDEX "attendance_logs_employee_punch_idx" ON "attendance_logs" USING btree ("employee_id","punch_time");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_leave_balances_emp_type_year_unique" ON "employee_leave_balances" USING btree ("employee_id","leave_type_id","year");--> statement-breakpoint
CREATE INDEX "employee_leave_balances_employee_id_idx" ON "employee_leave_balances" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_leave_balances_leave_type_id_idx" ON "employee_leave_balances" USING btree ("leave_type_id");--> statement-breakpoint
CREATE INDEX "employee_leave_balances_year_idx" ON "employee_leave_balances" USING btree ("year");--> statement-breakpoint
CREATE INDEX "leave_requests_company_id_idx" ON "leave_requests" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "leave_requests_employee_id_idx" ON "leave_requests" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "leave_requests_leave_type_id_idx" ON "leave_requests" USING btree ("leave_type_id");--> statement-breakpoint
CREATE INDEX "leave_requests_status_idx" ON "leave_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leave_requests_dates_idx" ON "leave_requests" USING btree ("from_date","to_date");--> statement-breakpoint
CREATE UNIQUE INDEX "leave_types_company_code_unique" ON "leave_types" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "leave_types_company_id_idx" ON "leave_types" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "salary_components_company_code_unique" ON "salary_components" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "salary_components_company_id_idx" ON "salary_components" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "salary_components_type_idx" ON "salary_components" USING btree ("component_type");--> statement-breakpoint
CREATE INDEX "salary_components_is_active_idx" ON "salary_components" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "salary_structure_components_structure_component_unique" ON "salary_structure_components" USING btree ("salary_structure_id","salary_component_id");--> statement-breakpoint
CREATE INDEX "salary_structure_components_structure_id_idx" ON "salary_structure_components" USING btree ("salary_structure_id");--> statement-breakpoint
CREATE INDEX "salary_structure_components_component_id_idx" ON "salary_structure_components" USING btree ("salary_component_id");--> statement-breakpoint
CREATE UNIQUE INDEX "salary_structures_company_code_unique" ON "salary_structures" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "salary_structures_company_id_idx" ON "salary_structures" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "salary_structures_effective_idx" ON "salary_structures" USING btree ("effective_from","effective_to");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_salary_components_structure_component_unique" ON "employee_salary_components" USING btree ("employee_salary_structure_id","salary_component_id");--> statement-breakpoint
CREATE INDEX "employee_salary_components_component_id_idx" ON "employee_salary_components" USING btree ("salary_component_id");--> statement-breakpoint
CREATE INDEX "employee_salary_structures_employee_id_idx" ON "employee_salary_structures" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_salary_structures_structure_id_idx" ON "employee_salary_structures" USING btree ("salary_structure_id");--> statement-breakpoint
CREATE INDEX "employee_salary_structures_effective_idx" ON "employee_salary_structures" USING btree ("effective_from","effective_to");--> statement-breakpoint
CREATE INDEX "bonuses_company_id_idx" ON "bonuses" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "bonuses_employee_id_idx" ON "bonuses" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "bonuses_bonus_date_idx" ON "bonuses" USING btree ("bonus_date");--> statement-breakpoint
CREATE INDEX "bonuses_status_idx" ON "bonuses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "employee_deductions_company_id_idx" ON "employee_deductions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "employee_deductions_employee_id_idx" ON "employee_deductions" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_deductions_component_id_idx" ON "employee_deductions" USING btree ("salary_component_id");--> statement-breakpoint
CREATE INDEX "employee_deductions_status_idx" ON "employee_deductions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "employee_loans_company_id_idx" ON "employee_loans" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "employee_loans_employee_id_idx" ON "employee_loans" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_loans_loan_type_id_idx" ON "employee_loans" USING btree ("loan_type_id");--> statement-breakpoint
CREATE INDEX "employee_loans_status_idx" ON "employee_loans" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "loan_installments_loan_number_unique" ON "loan_installments" USING btree ("employee_loan_id","installment_number");--> statement-breakpoint
CREATE INDEX "loan_installments_loan_id_idx" ON "loan_installments" USING btree ("employee_loan_id");--> statement-breakpoint
CREATE INDEX "loan_installments_due_date_idx" ON "loan_installments" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "loan_installments_status_idx" ON "loan_installments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "loan_types_company_code_unique" ON "loan_types" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "loan_types_company_id_idx" ON "loan_types" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "employee_advances_company_id_idx" ON "employee_advances" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "employee_advances_employee_id_idx" ON "employee_advances" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_advances_status_idx" ON "employee_advances" USING btree ("status");--> statement-breakpoint
CREATE INDEX "employee_advances_date_idx" ON "employee_advances" USING btree ("advance_date");--> statement-breakpoint
CREATE INDEX "payroll_adjustments_payroll_employee_id_idx" ON "payroll_adjustments" USING btree ("payroll_employee_id");--> statement-breakpoint
CREATE INDEX "payroll_adjustments_type_idx" ON "payroll_adjustments" USING btree ("adjustment_type");--> statement-breakpoint
CREATE INDEX "payroll_approvals_run_id_idx" ON "payroll_approvals" USING btree ("payroll_run_id");--> statement-breakpoint
CREATE INDEX "payroll_approvals_approver_id_idx" ON "payroll_approvals" USING btree ("approver_id");--> statement-breakpoint
CREATE INDEX "payroll_approvals_status_idx" ON "payroll_approvals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payroll_components_payroll_employee_id_idx" ON "payroll_components" USING btree ("payroll_employee_id");--> statement-breakpoint
CREATE INDEX "payroll_components_component_id_idx" ON "payroll_components" USING btree ("salary_component_id");--> statement-breakpoint
CREATE INDEX "payroll_components_type_idx" ON "payroll_components" USING btree ("component_type");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_employees_run_employee_unique" ON "payroll_employees" USING btree ("payroll_run_id","employee_id");--> statement-breakpoint
CREATE INDEX "payroll_employees_run_id_idx" ON "payroll_employees" USING btree ("payroll_run_id");--> statement-breakpoint
CREATE INDEX "payroll_employees_employee_id_idx" ON "payroll_employees" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "payroll_employees_status_idx" ON "payroll_employees" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_runs_company_period_unique" ON "payroll_runs" USING btree ("company_id","period_start","period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_runs_company_code_unique" ON "payroll_runs" USING btree ("company_id","payroll_code");--> statement-breakpoint
CREATE INDEX "payroll_runs_company_id_idx" ON "payroll_runs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "payroll_runs_status_idx" ON "payroll_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payroll_runs_period_idx" ON "payroll_runs" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "payslips_payroll_employee_id_idx" ON "payslips" USING btree ("payroll_employee_id");--> statement-breakpoint
CREATE INDEX "employee_statutory_details_employee_id_idx" ON "employee_statutory_details" USING btree ("employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_tax_declarations_employee_year_unique" ON "employee_tax_declarations" USING btree ("employee_id","financial_year");--> statement-breakpoint
CREATE INDEX "employee_tax_declarations_employee_id_idx" ON "employee_tax_declarations" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_tax_declarations_status_idx" ON "employee_tax_declarations" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "statutory_rules_company_code_unique" ON "statutory_rules" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "statutory_rules_company_id_idx" ON "statutory_rules" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "statutory_rules_type_idx" ON "statutory_rules" USING btree ("statutory_type");--> statement-breakpoint
CREATE INDEX "statutory_rules_effective_idx" ON "statutory_rules" USING btree ("effective_from","effective_to");--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_module_action_unique" ON "permissions" USING btree ("module","action");--> statement-breakpoint
CREATE INDEX "permissions_module_idx" ON "permissions" USING btree ("module");--> statement-breakpoint
CREATE UNIQUE INDEX "role_permissions_role_permission_unique" ON "role_permissions" USING btree ("role_id","permission_id");--> statement-breakpoint
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_company_slug_unique" ON "roles" USING btree ("company_id","slug");--> statement-breakpoint
CREATE INDEX "roles_company_id_idx" ON "roles" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_roles_user_role_unique" ON "user_roles" USING btree ("user_id","role_id");--> statement-breakpoint
CREATE INDEX "user_roles_user_id_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_roles_role_id_idx" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_company_id_idx" ON "users" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "users_employee_id_idx" ON "users" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "users_is_active_idx" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "audit_logs_company_id_idx" ON "audit_logs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_module_idx" ON "audit_logs" USING btree ("module");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_company_entity_idx" ON "audit_logs" USING btree ("company_id","entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_preferences_user_type_unique" ON "notification_preferences" USING btree ("user_id","notification_type");--> statement-breakpoint
CREATE INDEX "notification_preferences_user_id_idx" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_company_id_idx" ON "notifications" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "company_settings_company_key_unique" ON "company_settings" USING btree ("company_id","key");--> statement-breakpoint
CREATE INDEX "company_settings_company_id_idx" ON "company_settings" USING btree ("company_id");