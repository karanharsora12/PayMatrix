export type ComponentType = 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION' | 'REIMBURSEMENT';
export type CalculationType = 'FIXED' | 'PERCENTAGE' | 'FORMULA';
export type SalaryPolicy = 'CALENDAR_DAYS' | 'WORKING_DAYS' | 'FIXED_MONTHLY';

export interface SalaryComponentDefinition {
  componentId: string;
  code: string;
  name: string;
  componentType: ComponentType;
  calculationType: CalculationType;
  amount?: number | null;
  percentage?: number | null;
  percentageOf?: string | null;
  formula?: string | null;
  minimumAmount?: number | null;
  maximumAmount?: number | null;
  displayOrder?: number;
  isTaxable?: boolean;
  isStatutory?: boolean;
}

export interface CalculatedComponentItem {
  componentId: string;
  code: string;
  name: string;
  componentType: ComponentType;
  calculationType: CalculationType;
  percentage?: number | null;
  percentageOf?: string | null;
  formula?: string | null;
  amount: number;
  isTaxable?: boolean;
  isStatutory?: boolean;
}

export interface SalaryTotals {
  gross: number;
  deductions: number;
  net: number;
  employerContribution: number;
  reimbursements: number;
  monthlyCtc: number;
  annualGross: number;
  annualCtc: number;
}

export interface SalaryCalculationResult {
  employeeId?: string;
  salaryDate: string;
  structure: {
    id?: string;
    code?: string;
    name?: string;
  };
  earnings: CalculatedComponentItem[];
  deductions: CalculatedComponentItem[];
  employerContributions: CalculatedComponentItem[];
  reimbursements: CalculatedComponentItem[];
  totals: SalaryTotals;
}

export interface AttendanceSummary {
  calendarDays: number;
  workingDays: number;
  presentDays: number;
  halfDays: number;
  lateDays: number;
  absentDays: number;
  onLeaveDays: number;
  holidayDays: number;
  weekOffDays: number;
}

export interface LeaveSummary {
  paidLeaveDays: number;
  unpaidLeaveDays: number; // Loss of pay (LOP)
  totalLeaveDays: number;
}

export interface SalaryPreviewResponse {
  employeeId: string;
  employeeName: string;
  month: string;
  salaryPolicy: SalaryPolicy;
  structure: {
    id: string;
    code: string;
    name: string;
  };
  attendanceSummary: AttendanceSummary;
  leaveSummary: LeaveSummary;
  paidDays: number;
  unpaidDays: number;
  payableFactor: number;
  baseSalary: SalaryTotals;
  estimatedPayable: {
    payableGross: number;
    payableDeductions: number;
    payableNet: number;
    monthlyCtc: number;
  };
  breakdown: {
    earnings: CalculatedComponentItem[];
    deductions: CalculatedComponentItem[];
    employerContributions: CalculatedComponentItem[];
  };
}
