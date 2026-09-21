import { pgEnum } from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Employment / Employee
// ---------------------------------------------------------------------------
export const genderEnum = pgEnum("gender", ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]);
export const maritalStatusEnum = pgEnum("marital_status", [
  "SINGLE",
  "MARRIED",
  "DIVORCED",
  "WIDOWED",
  "SEPARATED",
]);
export const bloodGroupEnum = pgEnum("blood_group", [
  "A_POS",
  "A_NEG",
  "B_POS",
  "B_NEG",
  "AB_POS",
  "AB_NEG",
  "O_POS",
  "O_NEG",
]);
export const employmentStatusEnum = pgEnum("employment_status", [
  "PROBATION",
  "CONFIRMED",
  "NOTICE_PERIOD",
  "RESIGNED",
  "TERMINATED",
  "RETIRED",
  "INACTIVE",
]);

// ---------------------------------------------------------------------------
// Address / Document
// ---------------------------------------------------------------------------
export const addressTypeEnum = pgEnum("address_type", ["PERMANENT", "CURRENT", "EMERGENCY"]);
export const accountTypeEnum = pgEnum("account_type", ["SAVINGS", "CURRENT", "SALARY", "NRO", "NRE"]);

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------
export const attendanceStatusEnum = pgEnum("attendance_status", [
  "PRESENT",
  "ABSENT",
  "HALF_DAY",
  "LATE",
  "ON_LEAVE",
  "HOLIDAY",
  "WEEK_OFF",
  "ON_DUTY",
  "WFH",
]);

export const attendancePunchTypeEnum = pgEnum("attendance_punch_type", [
  "IN",
  "OUT",
  "BREAK_IN",
  "BREAK_OUT",
]);

export const attendanceSourceEnum = pgEnum("attendance_source", [
  "BIOMETRIC",
  "WEB",
  "MOBILE",
  "MANUAL",
  "API",
]);

export const holidayTypeEnum = pgEnum("holiday_type", ["NATIONAL", "FESTIVAL", "WEEKLY_OFF", "RESTRICTED"]);

// ---------------------------------------------------------------------------
// Leave
// ---------------------------------------------------------------------------
export const leaveStatusEnum = pgEnum("leave_status", ["PENDING", "APPROVED", "REJECTED", "CANCELLED"]);

// ---------------------------------------------------------------------------
// Salary / Payroll
// ---------------------------------------------------------------------------
export const salaryComponentTypeEnum = pgEnum("salary_component_type", [
  "EARNING",
  "DEDUCTION",
  "EMPLOYER_CONTRIBUTION",
  "REIMBURSEMENT",
]);

export const calculationTypeEnum = pgEnum("calculation_type", ["FIXED", "PERCENTAGE", "FORMULA"]);

export const salaryStructureStatusEnum = pgEnum("salary_structure_status", [
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED",
  "HISTORICAL",
  "CANCELLED",
]);

export const payrollRunStatusEnum = pgEnum("payroll_run_status", [
  "DRAFT",
  "CALCULATING",
  "CALCULATED",
  "PENDING_APPROVAL",
  "APPROVED",
  "FINALIZED",
  "PAID",
  "CANCELLED",
]);

export const payrollEmployeeStatusEnum = pgEnum("payroll_employee_status", [
  "DRAFT",
  "CALCULATED",
  "HELD",
  "APPROVED",
  "PAID",
  "SKIPPED",
]);

export const payslipStatusEnum = pgEnum("payslip_status", ["GENERATED", "PUBLISHED", "WITHDRAWN"]);

export const payrollApprovalStatusEnum = pgEnum("payroll_approval_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const bonusTypeEnum = pgEnum("bonus_type", [
  "PERFORMANCE",
  "FESTIVAL",
  "ANNUAL",
  "PROJECT",
  "REFERRAL",
  "RETENTION",
  "OTHER",
]);

export const bonusStatusEnum = pgEnum("bonus_status", ["PENDING", "APPROVED", "PAID", "CANCELLED"]);

export const deductionStatusEnum = pgEnum("deduction_status", ["ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]);

export const advanceStatusEnum = pgEnum("advance_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "RECOVERING",
  "RECOVERED",
  "CANCELLED",
]);

// ---------------------------------------------------------------------------
// Loans
// ---------------------------------------------------------------------------
export const loanStatusEnum = pgEnum("loan_status", [
  "PENDING",
  "APPROVED",
  "DISBURSED",
  "RECOVERING",
  "CLOSED",
  "REJECTED",
  "DEFAULTED",
  "CANCELLED",
]);

export const loanInstallmentStatusEnum = pgEnum("loan_installment_status", [
  "PENDING",
  "DUE",
  "PAID",
  "OVERDUE",
  "WAIVED",
  "SKIPPED",
]);

// ---------------------------------------------------------------------------
// Payroll adjustment
// ---------------------------------------------------------------------------
export const adjustmentTypeEnum = pgEnum("adjustment_type", [
  "ARREAR",
  "RECOVERY",
  "MANUAL_BONUS",
  "MANUAL_DEDUCTION",
  "ROUNDING",
  "CORRECTION",
  "LOAN_RECOVERY",
  "ADVANCE_RECOVERY",
  "OTHER",
]);

// ---------------------------------------------------------------------------
// Statutory / Tax
// ---------------------------------------------------------------------------
export const statutoryTypeEnum = pgEnum("statutory_type", [
  "PF",
  "ESI",
  "PT",
  "TDS",
  "LWF",
  "GRATUITY",
  "OTHER",
]);

export const taxRegimeEnum = pgEnum("tax_regime", ["OLD", "NEW", "NOT_APPLICABLE"]);

export const taxDeclarationStatusEnum = pgEnum("tax_declaration_status", [
  "DRAFT",
  "SUBMITTED",
  "VERIFIED",
  "REJECTED",
]);

// ---------------------------------------------------------------------------
// Auth / RBAC
// ---------------------------------------------------------------------------
export const permissionActionEnum = pgEnum("permission_action", [
  "VIEW",
  "CREATE",
  "EDIT",
  "DELETE",
  "APPROVE",
  "EXPORT",
  "IMPORT",
]);

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------
export const auditActionEnum = pgEnum("audit_action", [
  "CREATE",
  "UPDATE",
  "DELETE",
  "SOFT_DELETE",
  "RESTORE",
  "LOGIN",
  "LOGOUT",
  "APPROVE",
  "REJECT",
  "CALCULATE",
  "FINALIZE",
  "GENERATE",
  "EXPORT",
  "IMPORT",
]);

// ---------------------------------------------------------------------------
// Notification
// ---------------------------------------------------------------------------
export const notificationTypeEnum = pgEnum("notification_type", [
  "PAYROLL",
  "LEAVE",
  "ATTENDANCE",
  "LOAN",
  "ADVANCE",
  "BONUS",
  "SYSTEM",
  "APPROVAL",
  "GENERAL",
]);
