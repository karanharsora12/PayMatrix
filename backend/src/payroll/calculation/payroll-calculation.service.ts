import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, gte, isNull, lte, or, sql } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../db/schema';
import { SafeFormulaEvaluator } from '../../salary/calculation/safe-formula-evaluator';
import {
  PaidDaysCalculationService,
  PayrollProrationPolicy,
} from './paid-days-calculation.service';
import {
  CalculatedComponentSnapshot,
  CalculatedEmployeeSnapshot,
  PayrollCalculationException,
  PayrollRunCalculationResult,
} from './payroll-calculation.types';

@Injectable()
export class PayrollCalculationService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private paidDaysService: PaidDaysCalculationService,
  ) {}

  /**
   * Pre-calculation validation: checks for missing salaries, attendance gaps, etc.
   */
  async validatePayrollEligibility(
    companyId: string,
    periodYear: number,
    periodMonth: number,
  ): Promise<{
    eligibleEmployees: number;
    exceptions: PayrollCalculationException[];
  }> {
    const totalCalendarDays = new Date(periodYear, periodMonth, 0).getDate();
    const periodStart = `${periodYear}-${String(periodMonth).padStart(2, '0')}-01`;
    const periodEnd = `${periodYear}-${String(periodMonth).padStart(2, '0')}-${String(totalCalendarDays).padStart(2, '0')}`;

    const employees: any[] = await this.db.query.employees.findMany({
      where: and(
        eq(schema.employees.companyId, companyId),
        sql`${schema.employees.joiningDate} <= ${periodEnd}`,
        or(
          isNull(schema.employees.lastWorkingDate),
          sql`${schema.employees.lastWorkingDate} >= ${periodStart}`,
        ),
      ),
      with: {
        department: true,
        designation: true,
      },
    });

    const exceptions: PayrollCalculationException[] = [];

    for (const emp of employees) {
      // Check effective salary structure
      const salAssignment: any = await this.db.query.employeeSalaryStructures.findFirst({
        where: and(
          eq(schema.employeeSalaryStructures.employeeId, emp.id),
          sql`${schema.employeeSalaryStructures.effectiveFrom} <= ${periodEnd}`,
          or(
            isNull(schema.employeeSalaryStructures.effectiveTo),
            sql`${schema.employeeSalaryStructures.effectiveTo} >= ${periodStart}`,
          ),
        ),
      });

      if (!salAssignment) {
        exceptions.push({
          employeeId: emp.id,
          employeeCode: emp.employeeCode || emp.id.slice(0, 8),
          employeeName: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown',
          departmentName: emp.department?.name || 'General',
          designationName: emp.designation?.title || 'Staff',
          errorCode: 'NO_SALARY_CONFIGURATION',
          message: `No active salary structure assigned for ${periodYear}-${String(periodMonth).padStart(2, '0')}`,
        });
      }
    }

    return {
      eligibleEmployees: employees.length,
      exceptions,
    };
  }

  /**
   * Execute payroll calculation for a payroll run.
   */
  async calculatePayrollRun(
    companyId: string,
    runId: string,
    options?: { policy?: PayrollProrationPolicy; userId?: string },
  ): Promise<PayrollRunCalculationResult> {
    const policy = options?.policy || 'CALENDAR_DAYS';

    // 1. Fetch run
    const run: any = await this.db.query.payrollRuns.findFirst({
      where: and(
        eq(schema.payrollRuns.id, runId),
        eq(schema.payrollRuns.companyId, companyId),
      ),
    });

    if (!run) {
      throw new NotFoundException({
        code: 'PAYROLL_RUN_NOT_FOUND',
        message: 'Payroll run not found for current company',
      });
    }

    if (!['DRAFT', 'CALCULATED'].includes(run.status)) {
      throw new BadRequestException({
        code: 'PAYROLL_INVALID_STATUS',
        message: `Cannot calculate payroll in status ${run.status}. Only DRAFT or CALCULATED runs can be calculated.`,
      });
    }

    // Set status to CALCULATING
    await this.db
      .update(schema.payrollRuns)
      .set({ status: 'CALCULATING', updatedAt: new Date() })
      .where(eq(schema.payrollRuns.id, runId));

    try {
      const periodYear = run.periodYear || parseInt(run.periodStart.slice(0, 4), 10);
      const periodMonth = run.periodMonth || parseInt(run.periodStart.slice(5, 7), 10);
      const periodStart = run.periodStart;
      const periodEnd = run.periodEnd;

      // 2. Batch load all eligible employees for this company
      const employees: any[] = await this.db.query.employees.findMany({
        where: and(
          eq(schema.employees.companyId, companyId),
          sql`${schema.employees.joiningDate} <= ${periodEnd}`,
          or(
            isNull(schema.employees.lastWorkingDate),
            sql`${schema.employees.lastWorkingDate} >= ${periodStart}`,
          ),
        ),
        with: {
          department: true,
          designation: true,
        },
      });

      const empIds = employees.map((e) => e.id);
      if (empIds.length === 0) {
        await this.db
          .update(schema.payrollRuns)
          .set({
            status: 'CALCULATED',
            employeeCount: 0,
            grossAmount: '0',
            totalGross: '0',
            totalDeductions: '0',
            totalEmployerContributions: '0',
            netAmount: '0',
            totalNet: '0',
            totalCtc: '0',
            calculatedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(schema.payrollRuns.id, runId));

        return {
          runId,
          companyId,
          periodYear,
          periodMonth,
          employeeCount: 0,
          processedCount: 0,
          exceptionCount: 0,
          totalGross: 0,
          totalDeductions: 0,
          totalEmployerContributions: 0,
          totalNet: 0,
          totalCtc: 0,
          exceptions: [],
        };
      }

      // 3. Batch load salary structures, assignments, overrides
      const salaryAssignments: any[] = await this.db.query.employeeSalaryStructures.findMany({
        where: and(
          sql`${schema.employeeSalaryStructures.employeeId} IN ${empIds}`,
          sql`${schema.employeeSalaryStructures.effectiveFrom} <= ${periodEnd}`,
          or(
            isNull(schema.employeeSalaryStructures.effectiveTo),
            sql`${schema.employeeSalaryStructures.effectiveTo} >= ${periodStart}`,
          ),
        ),
        with: {
          salaryStructure: {
            with: {
              components: {
                with: {
                  salaryComponent: true,
                },
              },
            },
          },
          components: {
            with: {
              salaryComponent: true,
            },
          },
        },
        orderBy: (s: any, { desc }: any) => [desc(s.effectiveFrom)],
      });

      // Map employeeId -> latest effective salary assignment
      const employeeSalaryMap = new Map<string, any>();
      for (const assignment of salaryAssignments) {
        if (!employeeSalaryMap.has(assignment.employeeId)) {
          employeeSalaryMap.set(assignment.employeeId, assignment);
        }
      }

      // 4. Batch load attendance logs
      const attendanceLogs: any[] = await this.db.query.attendance.findMany({
        where: and(
          sql`${schema.attendance.employeeId} IN ${empIds}`,
          gte(schema.attendance.attendanceDate, periodStart),
          lte(schema.attendance.attendanceDate, periodEnd),
        ),
      });

      const attendanceByEmp = new Map<string, any[]>();
      for (const att of attendanceLogs) {
        if (!attendanceByEmp.has(att.employeeId)) attendanceByEmp.set(att.employeeId, []);
        attendanceByEmp.get(att.employeeId)!.push(att);
      }

      // 5. Batch load approved leaves
      const approvedLeaves: any[] = await this.db.query.leaveRequests.findMany({
        where: and(
          sql`${schema.leaveRequests.employeeId} IN ${empIds}`,
          eq(schema.leaveRequests.status, 'APPROVED'),
          lte(schema.leaveRequests.fromDate, periodEnd),
          gte(schema.leaveRequests.toDate, periodStart),
        ),
        with: {
          leaveType: true,
        },
      });

      const leavesByEmp = new Map<string, any[]>();
      for (const l of approvedLeaves) {
        if (!leavesByEmp.has(l.employeeId)) leavesByEmp.set(l.employeeId, []);
        leavesByEmp.get(l.employeeId)!.push({
          ...l,
          isPaid: l.leaveType?.isPaid ?? true,
        });
      }

      // 6. Batch load company holidays
      const holidays: any[] = await this.db.query.holidays.findMany({
        where: and(
          eq(schema.holidays.companyId, companyId),
          gte(schema.holidays.holidayDate, periodStart),
          lte(schema.holidays.holidayDate, periodEnd),
        ),
      });

      // 7. Load existing adjustments for this run
      const existingAdjustments: any[] = await this.db.select({
        adj: schema.payrollAdjustments,
        pe: schema.payrollEmployees,
      })
      .from(schema.payrollAdjustments)
      .innerJoin(
        schema.payrollEmployees,
        eq(schema.payrollAdjustments.payrollEmployeeId, schema.payrollEmployees.id),
      )
      .where(eq(schema.payrollEmployees.payrollRunId, runId));

      const adjustmentsByEmp = new Map<string, any[]>();
      for (const row of existingAdjustments) {
        const empId = row.pe.employeeId;
        if (!adjustmentsByEmp.has(empId)) adjustmentsByEmp.set(empId, []);
        adjustmentsByEmp.get(empId)!.push(row.adj);
      }

      // 8. Process each employee
      const exceptions: PayrollCalculationException[] = [];
      const calculatedEmployees: CalculatedEmployeeSnapshot[] = [];

      let runGross = 0;
      let runDeductions = 0;
      let runEmployer = 0;
      let runNet = 0;
      let runCtc = 0;

      for (const emp of employees) {
        const empCode = emp.employeeCode || emp.id.slice(0, 8);
        const empName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown';
        const deptName = emp.department?.name || 'General';
        const desigName = emp.designation?.title || 'Staff';

        // Check salary assignment
        const salAssignment = employeeSalaryMap.get(emp.id);
        if (!salAssignment || !salAssignment.salaryStructure) {
          exceptions.push({
            employeeId: emp.id,
            employeeCode: empCode,
            employeeName: empName,
            departmentName: deptName,
            designationName: desigName,
            errorCode: 'NO_SALARY_CONFIGURATION',
            message: `No salary structure assigned for period ${periodStart} to ${periodEnd}`,
          });
          continue;
        }

        const structure = salAssignment.salaryStructure;
        const structComponents: any[] = structure.components || [];
        if (structComponents.length === 0) {
          exceptions.push({
            employeeId: emp.id,
            employeeCode: empCode,
            employeeName: empName,
            departmentName: deptName,
            designationName: desigName,
            errorCode: 'INVALID_SALARY_STRUCTURE',
            message: `Salary structure "${structure.name}" has no components configured`,
          });
          continue;
        }

        // Attendance & Paid Days calculation
        const empAtt = attendanceByEmp.get(emp.id) || [];
        const empLeaves = leavesByEmp.get(emp.id) || [];
        const paidDaysRes = this.paidDaysService.calculatePaidDays(
          {
            id: emp.id,
            employeeCode: empCode,
            joiningDate: emp.joiningDate,
            lastWorkingDate: emp.lastWorkingDate,
          },
          {
            year: periodYear,
            month: periodMonth,
            periodStart,
            periodEnd,
          },
          empAtt,
          empLeaves,
          holidays,
          policy,
        );

        // Map overrides from employee salary structure assignment
        const overrideMap = new Map<string, any>();
        for (const ov of salAssignment.components || []) {
          overrideMap.set(ov.salaryComponentId, ov);
        }

        // Prepare component definitions for evaluation
        const componentDefs: Array<{
          componentId: string;
          code: string;
          name: string;
          componentType: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION' | 'REIMBURSEMENT';
          calculationType: 'FIXED' | 'PERCENTAGE' | 'FORMULA';
          amount?: number;
          percentage?: number;
          percentageOf?: string;
          formula?: string;
          minimumAmount?: number;
          maximumAmount?: number;
          isTaxable: boolean;
          isProratable: boolean;
          displayOrder: number;
        }> = [];

        for (const sc of structComponents) {
          const master = sc.salaryComponent;
          if (!master) continue;

          const ov = overrideMap.get(master.id);
          const calcType = ov?.calculationType || sc.calculationType || master.calculationType;
          const amt = ov?.amount != null ? Number(ov.amount) : (sc.amount != null ? Number(sc.amount) : Number(master.defaultAmount ?? 0));
          const pct = ov?.percentage != null ? Number(ov.percentage) : (sc.percentage != null ? Number(sc.percentage) : Number(master.defaultPercentage ?? 0));
          const formula = ov?.formula || sc.formula || master.formula;
          const percentageOf = sc.percentageOf || master.calculationBasis;

          componentDefs.push({
            componentId: master.id,
            code: master.code.toUpperCase(),
            name: master.name,
            componentType: master.componentType,
            calculationType: calcType,
            amount: amt,
            percentage: pct,
            percentageOf: percentageOf ? percentageOf.toUpperCase() : undefined,
            formula,
            minimumAmount: sc.minimumAmount ? Number(sc.minimumAmount) : undefined,
            maximumAmount: sc.maximumAmount ? Number(sc.maximumAmount) : undefined,
            isTaxable: master.isTaxable ?? true,
            isProratable: master.isProratable ?? true,
            displayOrder: sc.displayOrder ?? master.displayOrder ?? 0,
          });
        }

        // Topological ordering and base evaluation
        let ordered = componentDefs;
        try {
          ordered = SafeFormulaEvaluator.getEvaluationOrder(
            componentDefs.map((c) => ({
              ...c,
              percentageOf: c.percentageOf?.toUpperCase(),
            })),
          );
        } catch (e: any) {
          exceptions.push({
            employeeId: emp.id,
            employeeCode: empCode,
            employeeName: empName,
            departmentName: deptName,
            designationName: desigName,
            errorCode: 'INVALID_SALARY_FORMULA',
            message: e.message || 'Cycle detected or formula error in salary components',
          });
          continue;
        }

        const evalContext: Record<string, number> = {};
        const calculatedComps: CalculatedComponentSnapshot[] = [];

        let empGrossEarnings = 0;
        let empTotalDeductions = 0;
        let empEmployerContributions = 0;

        for (const comp of ordered) {
          let baseAmount = 0;
          if (comp.calculationType === 'FIXED') {
            baseAmount = Number(comp.amount ?? 0);
          } else if (comp.calculationType === 'PERCENTAGE') {
            const baseKey = (comp.percentageOf || 'BASIC').toUpperCase();
            const baseVal = evalContext[baseKey] ?? 0;
            baseAmount = (baseVal * Number(comp.percentage ?? 0)) / 100;
          } else if (comp.calculationType === 'FORMULA') {
            try {
              baseAmount = SafeFormulaEvaluator.evaluate(comp.formula ?? '0', evalContext);
            } catch (err: any) {
              baseAmount = 0;
            }
          }

          if (comp.minimumAmount != null && baseAmount < comp.minimumAmount) baseAmount = comp.minimumAmount;
          if (comp.maximumAmount != null && baseAmount > comp.maximumAmount) baseAmount = comp.maximumAmount;

          baseAmount = Math.round(baseAmount * 100) / 100;
          evalContext[comp.code] = baseAmount;

          // Proration check
          let finalAmount = baseAmount;
          if (comp.isProratable && comp.componentType === 'EARNING') {
            finalAmount = Math.round(baseAmount * paidDaysRes.payableFactor * 100) / 100;
          }

          if (comp.componentType === 'EARNING') {
            empGrossEarnings += finalAmount;
          } else if (comp.componentType === 'DEDUCTION') {
            empTotalDeductions += finalAmount;
          } else if (comp.componentType === 'EMPLOYER_CONTRIBUTION') {
            empEmployerContributions += finalAmount;
          }

          calculatedComps.push({
            salaryComponentId: comp.componentId,
            componentCode: comp.code,
            componentName: comp.name,
            componentType: comp.componentType,
            calculationType: comp.calculationType,
            calculationBasis: comp.percentageOf || null,
            rate: comp.calculationType === 'PERCENTAGE' ? comp.percentage : (comp.amount || baseAmount),
            amount: finalAmount,
            isTaxable: comp.isTaxable,
            isProratable: comp.isProratable,
          });

          // Update dynamic totals in evaluation context
          evalContext['GROSS'] = Math.round(empGrossEarnings * 100) / 100;
          evalContext['NET'] = Math.round((empGrossEarnings - empTotalDeductions) * 100) / 100;
        }

        // Apply manual adjustments
        const empAdjustments = adjustmentsByEmp.get(emp.id) || [];
        let adjustmentAdditions = 0;
        let adjustmentDeductions = 0;

        for (const adj of empAdjustments) {
          const amt = Number(adj.amount || 0);
          if (adj.isAddition || ['ARREAR', 'BONUS', 'OTHER_EARNING', 'MANUAL_BONUS'].includes(adj.type || adj.adjustmentType)) {
            adjustmentAdditions += amt;
          } else {
            adjustmentDeductions += amt;
          }
        }

        const totalEmpGross = Math.round((empGrossEarnings + adjustmentAdditions) * 100) / 100;
        const totalEmpDeductions = Math.round((empTotalDeductions + adjustmentDeductions) * 100) / 100;
        const totalEmpNet = Math.round((totalEmpGross - totalEmpDeductions) * 100) / 100;
        const totalEmpEmployer = Math.round(empEmployerContributions * 100) / 100;
        const totalEmpCtc = Math.round((totalEmpGross + totalEmpEmployer) * 100) / 100;

        calculatedEmployees.push({
          employeeId: emp.id,
          employeeCode: empCode,
          employeeName: empName,
          departmentName: deptName,
          designationName: desigName,
          salaryStructureId: structure.id,
          salaryStructureName: structure.name,

          calendarDays: paidDaysRes.calendarDays,
          workingDays: paidDaysRes.workingDays,
          presentDays: paidDaysRes.presentDays,
          absentDays: paidDaysRes.absentDays,
          paidLeaveDays: paidDaysRes.paidLeaveDays,
          unpaidLeaveDays: paidDaysRes.unpaidLeaveDays,
          holidayDays: paidDaysRes.holidayDays,
          weekOffDays: paidDaysRes.weekOffDays,
          paidDays: paidDaysRes.paidDays,
          overtimeMinutes: paidDaysRes.overtimeMinutes,

          grossSalary: totalEmpGross,
          totalDeductions: totalEmpDeductions,
          employerContributions: totalEmpEmployer,
          netSalary: totalEmpNet,
          totalCtc: totalEmpCtc,

          status: 'CALCULATED',
          components: calculatedComps,
        });

        runGross += totalEmpGross;
        runDeductions += totalEmpDeductions;
        runEmployer += totalEmpEmployer;
        runNet += totalEmpNet;
        runCtc += totalEmpCtc;
      }

      // 9. Transactional save of snapshot
      await this.db.transaction(async (tx: any) => {
        // Find existing employee snapshots
        const existingPes: any[] = await tx.query.payrollEmployees.findMany({
          where: eq(schema.payrollEmployees.payrollRunId, runId),
        });

        if (existingPes.length > 0) {
          const peIds = existingPes.map((p) => p.id);
          // Delete old components
          for (const peId of peIds) {
            await tx.delete(schema.payrollComponents).where(eq(schema.payrollComponents.payrollEmployeeId, peId));
          }
          // Do not delete adjustments; keep adjustment references safe
          // Delete old employees
          await tx.delete(schema.payrollEmployees).where(eq(schema.payrollEmployees.payrollRunId, runId));
        }

        // Insert new snapshots
        for (const calcEmp of calculatedEmployees) {
          const [pe] = await tx
            .insert(schema.payrollEmployees)
            .values({
              payrollRunId: runId,
              employeeId: calcEmp.employeeId,
              employeeCode: calcEmp.employeeCode,
              employeeName: calcEmp.employeeName,
              departmentName: calcEmp.departmentName,
              designationName: calcEmp.designationName,
              salaryStructureId: calcEmp.salaryStructureId,
              salaryStructureName: calcEmp.salaryStructureName,

              workingDays: calcEmp.workingDays,
              calendarDays: calcEmp.calendarDays,
              presentDays: calcEmp.presentDays.toString() as any,
              absentDays: calcEmp.absentDays.toString() as any,
              paidLeaveDays: calcEmp.paidLeaveDays.toString() as any,
              unpaidLeaveDays: calcEmp.unpaidLeaveDays.toString() as any,
              holidayDays: calcEmp.holidayDays.toString() as any,
              weekOffDays: calcEmp.weekOffDays.toString() as any,
              paidDays: calcEmp.paidDays.toString() as any,
              overtimeMinutes: calcEmp.overtimeMinutes,

              grossEarnings: calcEmp.grossSalary.toString() as any,
              grossSalary: calcEmp.grossSalary.toString() as any,
              totalDeductions: calcEmp.totalDeductions.toString() as any,
              employerContributions: calcEmp.employerContributions.toString() as any,
              netSalary: calcEmp.netSalary.toString() as any,
              totalCtc: calcEmp.totalCtc.toString() as any,
              status: calcEmp.status,
            })
            .returning();

          // Insert component snapshots
          for (const comp of calcEmp.components) {
            await tx.insert(schema.payrollComponents).values({
              payrollEmployeeId: pe.id,
              salaryComponentId: comp.salaryComponentId,
              componentCode: comp.componentCode,
              componentName: comp.componentName,
              componentType: comp.componentType,
              calculationType: comp.calculationType,
              calculationBasis: comp.calculationBasis,
              rate: comp.rate != null ? comp.rate.toString() : null,
              amount: comp.amount.toString() as any,
              isTaxable: comp.isTaxable,
            });
          }

          // Re-attach any adjustments that were preserved for this employee
          const empAdjs = adjustmentsByEmp.get(calcEmp.employeeId) || [];
          for (const adj of empAdjs) {
            await tx
              .update(schema.payrollAdjustments)
              .set({ payrollEmployeeId: pe.id })
              .where(eq(schema.payrollAdjustments.id, adj.id));
          }
        }

        // Update run totals
        await tx
          .update(schema.payrollRuns)
          .set({
            status: 'CALCULATED',
            employeeCount: calculatedEmployees.length,
            grossAmount: (Math.round(runGross * 100) / 100).toString() as any,
            totalGross: (Math.round(runGross * 100) / 100).toString() as any,
            totalDeductions: (Math.round(runDeductions * 100) / 100).toString() as any,
            totalEmployerContributions: (Math.round(runEmployer * 100) / 100).toString() as any,
            netAmount: (Math.round(runNet * 100) / 100).toString() as any,
            totalNet: (Math.round(runNet * 100) / 100).toString() as any,
            totalCtc: (Math.round(runCtc * 100) / 100).toString() as any,
            calculatedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(schema.payrollRuns.id, runId));
      });

      // Audit log (outside tx)
      if (options?.userId) {
        await this.db
          .insert(schema.auditLogs)
          .values({
            companyId,
            userId: options.userId,
            module: 'payroll',
            entityType: 'payroll_run',
            entityId: runId,
            action: 'CALCULATE',
            newValues: {
              status: 'CALCULATED',
              employeesProcessed: calculatedEmployees.length,
              exceptions: exceptions.length,
            } as any,
          })
          .catch(() => {});
      }

      return {
        runId,
        companyId,
        periodYear,
        periodMonth,
        employeeCount: employees.length,
        processedCount: calculatedEmployees.length,
        exceptionCount: exceptions.length,
        totalGross: Math.round(runGross * 100) / 100,
        totalDeductions: Math.round(runDeductions * 100) / 100,
        totalEmployerContributions: Math.round(runEmployer * 100) / 100,
        totalNet: Math.round(runNet * 100) / 100,
        totalCtc: Math.round(runCtc * 100) / 100,
        exceptions,
      };
    } catch (err: any) {
      // Revert status to DRAFT to prevent permanently stuck CALCULATING
      await this.db
        .update(schema.payrollRuns)
        .set({ status: 'DRAFT', updatedAt: new Date() })
        .where(eq(schema.payrollRuns.id, runId));

      throw new BadRequestException({
        code: 'PAYROLL_CALCULATION_FAILED',
        message: err.message || 'Payroll calculation failed',
      });
    }
  }
}
