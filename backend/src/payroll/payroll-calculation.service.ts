import { Injectable } from '@nestjs/common';

/**
 * PayrollCalculationService — pure calculation logic, no DB.
 * Input: employee salary snapshot, attendance, leave, bonuses, deductions, loans, statutory rules
 * Output: earnings/deductions/employerContributions + totals
 *
 * Keep separate from controller for unit testing.
 */
@Injectable()
export class PayrollCalculationService {
  calculateEmployee(input: {
    salaryComponents: Array<{ componentId: string; code: string; name: string; type: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION'; calculationType: 'FIXED' | 'PERCENTAGE' | 'FORMULA'; amount?: string; percentage?: string; formula?: string }>;
    attendance: { workingDays: number; presentDays: number; paidLeaveDays: number; unpaidLeaveDays: number; absentDays: number; overtimeMinutes: number };
    bonuses: Array<{ amount: string }>;
    deductions: Array<{ amount?: string; percentage?: string; componentType: string }>;
    loanEmi: string; // total EMI for period
    advanceRecovery: string;
    statutory?: any;
  }) {
    let basic = 0;
    const comps = input.salaryComponents.map((c) => {
      let amount = 0;
      if (c.calculationType === 'FIXED') amount = Number(c.amount ?? 0);
      else if (c.calculationType === 'PERCENTAGE') {
        // For HRA etc: % of basic
        const pct = Number(c.percentage ?? 0);
        amount = (basic * pct) / 100;
      } else if (c.calculationType === 'FORMULA' && c.formula) {
        // Very simple formula eval: replace BASIC
        try {
          const expr = c.formula.replace(/BASIC/g, String(basic));
          amount = Function(`"use strict"; return (${expr})`)();
        } catch { amount = 0; }
      }
      if (c.code === 'BASIC' || c.name === 'Basic Salary' || c.name === 'Basic') basic = amount;
      return { ...c, amount: amount.toFixed(2) };
    });

    // Pro-rate for unpaid leave/absent: LOP factor
    const totalWorking = input.attendance.workingDays || 22;
    const payableDays = totalWorking - Number(input.attendance.unpaidLeaveDays) - Number(input.attendance.absentDays);
    const payableRatio = totalWorking > 0 ? Math.max(0, payableDays / totalWorking) : 1;

    // Earnings pro-rated (except overtime)
    const earnings = comps.filter((c) => c.type === 'EARNING').map((e) => ({ ...e, amount: (Number(e.amount) * payableRatio).toFixed(2) }));
    // Add overtime: assume rate 1.5x basic hourly; basic/30/8
    let overtimeAmount = 0;
    if (input.attendance.overtimeMinutes > 0 && basic > 0) {
      const hourly = basic / 30 / 8;
      overtimeAmount = (input.attendance.overtimeMinutes / 60) * hourly * 1.5;
      earnings.push({ componentId: 'OVERTIME', code: 'OVERTIME', name: 'Overtime', type: 'EARNING', calculationType: 'FIXED', amount: overtimeAmount.toFixed(2) } as any);
    }
    // Add bonuses
    for (const b of input.bonuses) earnings.push({ componentId: 'BONUS', code: 'BONUS', name: 'Bonus', type: 'EARNING', calculationType: 'FIXED', amount: Number(b.amount).toFixed(2) } as any);

    const deductionsStatic = comps.filter((c) => c.type === 'DEDUCTION');
    const deductions = [...deductionsStatic];
    // Add dynamic deductions: loan, advance, recurring
    if (Number(input.loanEmi) > 0) deductions.push({ componentId: 'LOAN', code: 'LOAN', name: 'Loan EMI', type: 'DEDUCTION', calculationType: 'FIXED', amount: Number(input.loanEmi).toFixed(2) } as any);
    if (Number(input.advanceRecovery) > 0) deductions.push({ componentId: 'ADVANCE', code: 'ADVANCE', name: 'Advance Recovery', type: 'DEDUCTION', calculationType: 'FIXED', amount: Number(input.advanceRecovery).toFixed(2) } as any);
    for (const d of input.deductions) deductions.push({ componentId: 'RECURRING', code: 'RECURRING', name: 'Recurring Deduction', type: 'DEDUCTION', calculationType: 'FIXED', amount: Number(d.amount ?? 0).toFixed(2) } as any);

    const employerContributions = comps.filter((c) => c.type === 'EMPLOYER_CONTRIBUTION');

    const gross = earnings.reduce((s, e) => s + Number(e.amount), 0);
    const totalDeductions = deductions.reduce((s, d) => s + Number(d.amount), 0);
    const totalEmployer = employerContributions.reduce((s, e) => s + Number(e.amount), 0);
    const net = gross - totalDeductions;

    return { earnings, deductions, employerContributions, gross: gross.toFixed(2), totalDeductions: totalDeductions.toFixed(2), totalEmployer: totalEmployer.toFixed(2), net: net.toFixed(2) };
  }
}
