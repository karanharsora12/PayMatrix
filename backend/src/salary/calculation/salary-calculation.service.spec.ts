import test from 'node:test';
import assert from 'node:assert/strict';
import { SalaryCalculationService } from './salary-calculation.service';
import { SalaryComponentDefinition } from './salary-calculation.types';

test('SalaryCalculationService - basic structure calculation', () => {
  const service = new SalaryCalculationService(null as any);

  const components: SalaryComponentDefinition[] = [
    {
      componentId: 'comp-basic',
      code: 'BASIC',
      name: 'Basic Salary',
      componentType: 'EARNING',
      calculationType: 'FIXED',
      amount: 30000,
    },
    {
      componentId: 'comp-hra',
      code: 'HRA',
      name: 'House Rent Allowance',
      componentType: 'EARNING',
      calculationType: 'PERCENTAGE',
      percentage: 40,
      percentageOf: 'BASIC',
    },
    {
      componentId: 'comp-special',
      code: 'SPECIAL',
      name: 'Special Allowance',
      componentType: 'EARNING',
      calculationType: 'FIXED',
      amount: 5000,
    },
    {
      componentId: 'comp-pf',
      code: 'PF',
      name: 'Provident Fund (Employee)',
      componentType: 'DEDUCTION',
      calculationType: 'PERCENTAGE',
      percentage: 12,
      percentageOf: 'BASIC',
    },
    {
      componentId: 'comp-pf-er',
      code: 'PF_ER',
      name: 'Provident Fund (Employer)',
      componentType: 'EMPLOYER_CONTRIBUTION',
      calculationType: 'PERCENTAGE',
      percentage: 12,
      percentageOf: 'BASIC',
    },
  ];

  const result = service.calculateComponents(components);

  assert.equal(result.earnings.length, 3);
  assert.equal(result.deductions.length, 1);
  assert.equal(result.employerContributions.length, 1);

  // Earnings
  const basic = result.earnings.find((e) => e.code === 'BASIC')!;
  const hra = result.earnings.find((e) => e.code === 'HRA')!;
  const special = result.earnings.find((e) => e.code === 'SPECIAL')!;
  assert.equal(basic.amount, 30000);
  assert.equal(hra.amount, 12000); // 40% of 30,000
  assert.equal(special.amount, 5000);

  // Deductions
  const pf = result.deductions.find((d) => d.code === 'PF')!;
  assert.equal(pf.amount, 3600); // 12% of 30,000

  // Employer Contribution
  const pfEr = result.employerContributions.find((c) => c.code === 'PF_ER')!;
  assert.equal(pfEr.amount, 3600);

  // Totals
  assert.equal(result.totals.gross, 47000);
  assert.equal(result.totals.deductions, 3600);
  assert.equal(result.totals.net, 43400);
  assert.equal(result.totals.employerContribution, 3600);
  assert.equal(result.totals.monthlyCtc, 50600);
  assert.equal(result.totals.annualGross, 564000);
  assert.equal(result.totals.annualCtc, 607200);
});

test('SalaryCalculationService - overrides and dependent updates', () => {
  const service = new SalaryCalculationService(null as any);

  const components: SalaryComponentDefinition[] = [
    {
      componentId: 'comp-basic',
      code: 'BASIC',
      name: 'Basic',
      componentType: 'EARNING',
      calculationType: 'FIXED',
      amount: 30000,
    },
    {
      componentId: 'comp-hra',
      code: 'HRA',
      name: 'HRA',
      componentType: 'EARNING',
      calculationType: 'PERCENTAGE',
      percentage: 40,
      percentageOf: 'BASIC',
    },
  ];

  // Override BASIC from 30,000 to 45,000
  const overrides = new Map([['comp-basic', { amount: 45000 }]]);
  const result = service.calculateComponents(components, overrides);

  const basic = result.earnings.find((e) => e.code === 'BASIC')!;
  const hra = result.earnings.find((e) => e.code === 'HRA')!;

  assert.equal(basic.amount, 45000);
  assert.equal(hra.amount, 18000); // 40% of overridden 45,000
  assert.equal(result.totals.gross, 63000);
  assert.equal(result.totals.net, 63000);
});

test('SalaryCalculationService - formula component', () => {
  const service = new SalaryCalculationService(null as any);

  const components: SalaryComponentDefinition[] = [
    {
      componentId: 'comp-basic',
      code: 'BASIC',
      name: 'Basic',
      componentType: 'EARNING',
      calculationType: 'FIXED',
      amount: 25000,
    },
    {
      componentId: 'comp-hra',
      code: 'HRA',
      name: 'HRA',
      componentType: 'EARNING',
      calculationType: 'PERCENTAGE',
      percentage: 50,
      percentageOf: 'BASIC',
    },
    {
      componentId: 'comp-medical',
      code: 'MEDICAL',
      name: 'Medical Allowance',
      componentType: 'EARNING',
      calculationType: 'FORMULA',
      formula: 'BASIC * 0.10 + 500', // 25000 * 0.10 + 500 = 3000
    },
  ];

  const result = service.calculateComponents(components);

  const medical = result.earnings.find((e) => e.code === 'MEDICAL')!;
  assert.equal(medical.amount, 3000);
  assert.equal(result.totals.gross, 25000 + 12500 + 3000);
});

test('SalaryCalculationService - min and max clamps', () => {
  const service = new SalaryCalculationService(null as any);

  const components: SalaryComponentDefinition[] = [
    {
      componentId: 'comp-basic',
      code: 'BASIC',
      name: 'Basic',
      componentType: 'EARNING',
      calculationType: 'FIXED',
      amount: 10000,
    },
    {
      componentId: 'comp-allowance',
      code: 'ALLOW',
      name: 'Allowance',
      componentType: 'EARNING',
      calculationType: 'PERCENTAGE',
      percentage: 50,
      percentageOf: 'BASIC',
      maximumAmount: 3000, // 50% of 10000 = 5000, clamped to 3000
    },
  ];

  const result = service.calculateComponents(components);
  const allow = result.earnings.find((e) => e.code === 'ALLOW')!;
  assert.equal(allow.amount, 3000);
});
