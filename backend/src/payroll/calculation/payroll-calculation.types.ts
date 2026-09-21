import { PayrollProrationPolicy } from './paid-days-calculation.service';

export interface PayrollCalculationException {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName?: string;
  designationName?: string;
  errorCode:
    | 'NO_SALARY_CONFIGURATION'
    | 'INVALID_SALARY_STRUCTURE'
    | 'INVALID_ATTENDANCE'
    | 'INVALID_LEAVE_DATA'
    | 'INVALID_SALARY_FORMULA'
    | 'SALARY_CALCULATION_ERROR'
    | 'PAYROLL_DATA_INCONSISTENCY';
  message: string;
}

export interface CalculatedComponentSnapshot {
  salaryComponentId: string;
  componentCode: string;
  componentName: string;
  componentType: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION' | 'REIMBURSEMENT';
  calculationType: 'FIXED' | 'PERCENTAGE' | 'FORMULA';
  calculationBasis?: string | null;
  rate?: number | null;
  amount: number;
  isTaxable: boolean;
  isProratable: boolean;
}

export interface CalculatedEmployeeSnapshot {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  designationName: string;
  salaryStructureId?: string;
  salaryStructureName?: string;

  calendarDays: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  holidayDays: number;
  weekOffDays: number;
  paidDays: number;
  overtimeMinutes: number;

  grossSalary: number;
  totalDeductions: number;
  employerContributions: number;
  netSalary: number;
  totalCtc: number;

  status: 'CALCULATED' | 'HELD' | 'SKIPPED';
  components: CalculatedComponentSnapshot[];
  adjustments?: Array<{
    type: string;
    name: string;
    amount: number;
    isAddition: boolean;
    reason: string;
  }>;
}

export interface PayrollRunCalculationResult {
  runId: string;
  companyId: string;
  periodYear: number;
  periodMonth: number;
  employeeCount: number;
  processedCount: number;
  exceptionCount: number;
  totalGross: number;
  totalDeductions: number;
  totalEmployerContributions: number;
  totalNet: number;
  totalCtc: number;
  exceptions: PayrollCalculationException[];
}
