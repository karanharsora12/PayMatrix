import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

@Injectable()
export class PayslipPdfService {
  /**
   * Generates a professional binary PDF Buffer for an immutable payslip snapshot.
   */
  async generatePdf(payslip: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 36,
          info: {
            Title: `Payslip - ${payslip.payslipNumber || 'Document'}`,
            Author: payslip.company?.name || 'PayMatrix Technologies',
            Subject: `Salary Slip for ${payslip.periodMonth}/${payslip.periodYear}`,
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        const primaryColor = '#1e3a8a'; // Deep Navy
        const darkText = '#1e293b'; // Slate 800
        const mutedText = '#64748b'; // Slate 500
        const borderColor = '#cbd5e1'; // Slate 300
        const lightBg = '#f8fafc'; // Slate 50
        const successColor = '#059669'; // Emerald 600

        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December',
        ];
        const monthLabel = `${monthNames[(payslip.periodMonth || 1) - 1] || payslip.periodMonth} ${payslip.periodYear || ''}`;

        // ================= HEADER =================
        doc.rect(36, 36, 523, 72).fill(primaryColor);

        doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold');
        doc.text(payslip.company?.legalName || payslip.company?.name || 'PayMatrix Technologies Pvt Ltd', 50, 48, {
          width: 320,
        });

        doc.fontSize(9).font('Helvetica');
        doc.text(payslip.company?.address || 'Corporate Headquarters • Financial Division', 50, 70, {
          width: 320,
        });

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('PAYSLIP FOR', 380, 46, { align: 'right', width: 165 });
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text(monthLabel, 380, 60, { align: 'right', width: 165 });
        doc.fontSize(9).font('Helvetica');
        doc.text(payslip.payslipNumber || '', 380, 80, { align: 'right', width: 165 });

        let currentY = 120;

        // ================= EMPLOYEE & STATUTORY INFO =================
        doc.rect(36, currentY, 523, 85).fillAndStroke(lightBg, borderColor);

        doc.fillColor(darkText).fontSize(9).font('Helvetica-Bold');
        doc.text('EMPLOYEE DETAILS', 46, currentY + 8);
        doc.text('PAYMENT & STATUTORY DETAILS', 310, currentY + 8);

        doc.strokeColor(borderColor).lineWidth(0.5)
          .moveTo(46, currentY + 22).lineTo(290, currentY + 22).stroke()
          .moveTo(310, currentY + 22).lineTo(545, currentY + 22).stroke();

        const emp = payslip.employee || {};
        doc.font('Helvetica').fontSize(8.5).fillColor(darkText);

        // Left column: Employee details
        doc.text(`Name:`, 46, currentY + 28);
        doc.font('Helvetica-Bold').text(emp.name || 'N/A', 110, currentY + 28);
        doc.font('Helvetica');

        doc.text(`Employee ID:`, 46, currentY + 42);
        doc.font('Helvetica-Bold').text(emp.code || 'N/A', 110, currentY + 42);
        doc.font('Helvetica');

        doc.text(`Department:`, 46, currentY + 56);
        doc.text(emp.department || 'General', 110, currentY + 56);

        doc.text(`Designation:`, 46, currentY + 70);
        doc.text(emp.designation || 'Staff', 110, currentY + 70);

        // Right column: Bank & Statutory
        const bank = emp.bankAccount;
        const stat = emp.statutory;

        doc.text(`Bank Name:`, 310, currentY + 28);
        doc.text(bank?.bankName || 'Direct Transfer', 390, currentY + 28);

        doc.text(`Account No:`, 310, currentY + 42);
        doc.text(bank?.accountNumber ? `•••• ${bank.accountNumber.slice(-4)}` : 'N/A', 390, currentY + 42);

        doc.text(`IFSC / Branch:`, 310, currentY + 56);
        doc.text(bank?.ifscCode || 'N/A', 390, currentY + 56);

        doc.text(`PAN / UAN:`, 310, currentY + 70);
        doc.text(`${stat?.panNumber || '—'} / ${stat?.uanNumber || '—'}`, 390, currentY + 70);

        currentY += 95;

        // ================= ATTENDANCE SUMMARY =================
        const att = payslip.attendance || {};
        doc.rect(36, currentY, 523, 40).fillAndStroke('#eff6ff', '#bfdbfe');

        const attCols = [
          { label: 'Calendar Days', val: att.calendarDays ?? 30 },
          { label: 'Working Days', val: att.workingDays ?? 22 },
          { label: 'Present Days', val: att.presentDays ?? 0 },
          { label: 'Paid Leaves', val: att.paidLeaveDays ?? 0 },
          { label: 'Unpaid / LOP', val: att.unpaidLeaveDays ?? 0 },
          { label: 'Absent Days', val: att.absentDays ?? 0 },
          { label: 'Payable Days', val: att.paidDays ?? 0, bold: true },
        ];

        const colWidth = 523 / attCols.length;
        attCols.forEach((col, i) => {
          const x = 36 + i * colWidth;
          doc.fillColor(mutedText).fontSize(7.5).font('Helvetica');
          doc.text(col.label, x, currentY + 6, { width: colWidth, align: 'center' });

          doc.fillColor(col.bold ? successColor : darkText).fontSize(10).font(col.bold ? 'Helvetica-Bold' : 'Helvetica');
          doc.text(String(col.val), x, currentY + 20, { width: colWidth, align: 'center' });
        });

        currentY += 50;

        // ================= EARNINGS & DEDUCTIONS TABLES =================
        const tableW = 256;
        const leftTableX = 36;
        const rightTableX = 303;

        // Headers
        doc.rect(leftTableX, currentY, tableW, 22).fill(primaryColor);
        doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
        doc.text('EARNINGS', leftTableX + 10, currentY + 6);
        doc.text('AMOUNT (INR)', leftTableX + 160, currentY + 6, { width: 85, align: 'right' });

        doc.rect(rightTableX, currentY, tableW, 22).fill('#dc2626');
        doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
        doc.text('DEDUCTIONS', rightTableX + 10, currentY + 6);
        doc.text('AMOUNT (INR)', rightTableX + 160, currentY + 6, { width: 85, align: 'right' });

        currentY += 22;

        const earnings: any[] = payslip.earnings || [];
        const deductions: any[] = payslip.deductions || [];
        const maxRows = Math.max(earnings.length, deductions.length, 6);

        const rowHeight = 18;
        const tableStartY = currentY;

        for (let i = 0; i < maxRows; i++) {
          const rowY = tableStartY + i * rowHeight;
          const isEven = i % 2 === 0;

          // Left row background
          if (isEven) {
            doc.rect(leftTableX, rowY, tableW, rowHeight).fill(lightBg);
            doc.rect(rightTableX, rowY, tableW, rowHeight).fill(lightBg);
          }

          // Earnings item
          const ern = earnings[i];
          if (ern) {
            const name = ern.componentName || ern.salaryComponent?.name || ern.componentCode || 'Allowance';
            const amt = Number(ern.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            doc.fillColor(darkText).fontSize(8).font('Helvetica');
            doc.text(name, leftTableX + 8, rowY + 5, { width: 160 });
            doc.text(amt, leftTableX + 160, rowY + 5, { width: 85, align: 'right' });
          }

          // Deductions item
          const ded = deductions[i];
          if (ded) {
            const name = ded.componentName || ded.salaryComponent?.name || ded.componentCode || 'Deduction';
            const amt = Number(ded.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            doc.fillColor(darkText).fontSize(8).font('Helvetica');
            doc.text(name, rightTableX + 8, rowY + 5, { width: 160 });
            doc.text(amt, rightTableX + 160, rowY + 5, { width: 85, align: 'right' });
          }

          // Row dividers
          doc.strokeColor(borderColor).lineWidth(0.5)
            .moveTo(leftTableX, rowY + rowHeight).lineTo(leftTableX + tableW, rowY + rowHeight).stroke()
            .moveTo(rightTableX, rowY + rowHeight).lineTo(rightTableX + tableW, rowY + rowHeight).stroke();
        }

        currentY = tableStartY + maxRows * rowHeight;

        // Outer borders for tables
        doc.strokeColor(borderColor).lineWidth(0.5)
          .rect(leftTableX, tableStartY, tableW, maxRows * rowHeight).stroke()
          .rect(rightTableX, tableStartY, tableW, maxRows * rowHeight).stroke();

        // Total Gross & Total Deductions bar
        const grossVal = Number(payslip.totals?.grossSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        const dedVal = Number(payslip.totals?.totalDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

        doc.rect(leftTableX, currentY, tableW, 24).fill('#e2e8f0');
        doc.fillColor(darkText).fontSize(8.5).font('Helvetica-Bold');
        doc.text('TOTAL GROSS SALARY', leftTableX + 8, currentY + 7);
        doc.text(`₹ ${grossVal}`, leftTableX + 150, currentY + 7, { width: 95, align: 'right' });

        doc.rect(rightTableX, currentY, tableW, 24).fill('#fee2e2');
        doc.fillColor('#991b1b').fontSize(8.5).font('Helvetica-Bold');
        doc.text('TOTAL DEDUCTIONS', rightTableX + 8, currentY + 7);
        doc.text(`₹ ${dedVal}`, rightTableX + 150, currentY + 7, { width: 95, align: 'right' });

        currentY += 34;

        // ================= NET PAY BANNER =================
        const netSalaryNum = Number(payslip.totals?.netSalary || 0);
        const netVal = netSalaryNum.toLocaleString('en-IN', { minimumFractionDigits: 2 });

        doc.rect(36, currentY, 523, 48).fillAndStroke('#ecfdf5', successColor);

        doc.fillColor(darkText).fontSize(9).font('Helvetica-Bold');
        doc.text('NET SALARY PAYABLE:', 50, currentY + 12);
        doc.fillColor(successColor).fontSize(16).font('Helvetica-Bold');
        doc.text(`₹ ${netVal}`, 300, currentY + 10, { width: 245, align: 'right' });

        doc.fillColor(mutedText).fontSize(8).font('Helvetica-Oblique');
        doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')} • Payment Mode: Bank Direct Deposit`, 50, currentY + 30);

        currentY += 60;

        // ================= FOOTER / SIGN-OFF =================
        doc.fillColor(mutedText).fontSize(7.5).font('Helvetica');
        doc.text(
          'Note: This document is an electronically produced salary statement and does not require a physical signature.',
          36,
          740,
          { width: 523, align: 'center' },
        );
        doc.text(
          `Confidential • Generated by PayMatrix HRMS System • ${payslip.company?.legalName || 'PayMatrix'}`,
          36,
          752,
          { width: 523, align: 'center' },
        );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
