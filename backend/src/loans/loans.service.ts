import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
@Injectable()
export class LoansService {
  constructor(@Inject(DRIZZLE) private db: any) {}
  async list(companyId: string, dto: PaginationDto) {
    const where = eq(schema.employeeLoans.companyId, companyId);
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.employeeLoans).where(where).then((r: any) => Number(r[0].count));
    const rows = await this.db.query.employeeLoans.findMany({ where, with: { employee: true, loanType: true }, limit: dto.limit, offset: dto.offset });
    return paginated(rows, total, dto, 'Loans fetched');
  }
  async get(companyId: string, id: string) {
    const row = await this.db.query.employeeLoans.findFirst({ where: (l: any, { eq, and }: any) => and(eq(l.id, id), eq(l.companyId, companyId)), with: { installments: true } });
    if (!row) throw new NotFoundException('Loan not found');
    return { success: true, data: row };
  }
  async create(companyId: string, dto: any, userId: string) {
    // Calculate EMI: P*r*(1+r)^n / ((1+r)^n -1)
    const P = Number(dto.principalAmount);
    const r = Number(dto.interestRate ?? 0) / 12 / 100;
    const n = Number(dto.tenureMonths);
    let emi = P / n;
    if (r > 0) emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = emi * n;
    const [loan] = await this.db.insert(schema.employeeLoans).values({ companyId, employeeId: dto.employeeId, loanTypeId: dto.loanTypeId, principalAmount: P.toString() as any, interestRate: (dto.interestRate ?? 0).toString() as any, tenureMonths: n, emiAmount: emi.toFixed(2) as any, startDate: dto.startDate, totalAmount: total.toFixed(2) as any, paidAmount: '0' as any, outstandingAmount: total.toFixed(2) as any, status: 'PENDING' }).returning();
    // Generate installments
    for (let i = 1; i <= n; i++) {
      const due = new Date(dto.startDate);
      due.setMonth(due.getMonth() + i - 1);
      await this.db.insert(schema.loanInstallments).values({ employeeLoanId: loan.id, installmentNumber: i, dueDate: due.toISOString().slice(0, 10) as any, principalAmount: (P / n).toFixed(2) as any, interestAmount: (emi - P / n).toFixed(2) as any, totalAmount: emi.toFixed(2) as any, paidAmount: '0' as any, outstandingAmount: emi.toFixed(2) as any, status: 'PENDING' });
    }
    return { success: true, data: loan, message: 'Loan created' };
  }
  async approve(companyId: string, id: string) {
    const [row] = await this.db.update(schema.employeeLoans).set({ status: 'APPROVED', updatedAt: new Date() }).where(and(eq(schema.employeeLoans.id, id), eq(schema.employeeLoans.companyId, companyId))).returning();
    if (!row) throw new NotFoundException('Loan not found');
    return { success: true, data: row, message: 'Loan approved' };
  }
  async reject(companyId: string, id: string) {
    const [row] = await this.db.update(schema.employeeLoans).set({ status: 'REJECTED', updatedAt: new Date() }).where(and(eq(schema.employeeLoans.id, id), eq(schema.employeeLoans.companyId, companyId))).returning();
    return { success: true, data: row, message: 'Loan rejected' };
  }
  async disburse(companyId: string, id: string) {
    const loan: any = await this.db.query.employeeLoans.findFirst({ where: (l: any, { eq, and }: any) => and(eq(l.id, id), eq(l.companyId, companyId)) });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== 'APPROVED') throw new BadRequestException({ code: 'LOAN_INVALID_STATUS', message: 'Only approved loans can be disbursed' });
    const [row] = await this.db.update(schema.employeeLoans).set({ status: 'DISBURSED', updatedAt: new Date() }).where(eq(schema.employeeLoans.id, id)).returning();
    return { success: true, data: row, message: 'Loan disbursed' };
  }
  async installments(id: string) {
    const rows = await this.db.query.loanInstallments.findMany({ where: (i: any, { eq }: any) => eq(i.employeeLoanId, id), orderBy: (i: any, { asc }: any) => asc(i.installmentNumber) });
    return { success: true, data: rows };
  }
}

