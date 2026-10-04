export interface EmailVariableDefinition {
  variable: string; // e.g. EmployeeName
  label: string; // e.g. Employee Name
  category: 'Employee' | 'Payslip' | 'Leave' | 'Attendance' | 'Company' | 'System';
  description: string;
  sampleValue?: string;
  templateTypes: string[]; // ['Payslip', 'Leave', 'Attendance', 'Employee', 'General']
}

export const EMAIL_TEMPLATE_TYPES = [
  { value: 'Payslip', label: 'Payslip' },
  { value: 'Leave', label: 'Leave' },
  { value: 'Attendance', label: 'Attendance' },
  { value: 'Employee', label: 'Employee Lifecycle' },
  { value: 'General', label: 'General Notification' },
] as const;

export type EmailTemplateType = (typeof EMAIL_TEMPLATE_TYPES)[number]['value'];

export const EMAIL_VARIABLE_DEFINITIONS: EmailVariableDefinition[] = [
  // ─── Company Variables (Available in all types) ─────────────────────────────
  {
    variable: 'CompanyName',
    label: 'Company Name',
    category: 'Company',
    description: 'Legal registered name of the employer company',
    sampleValue: 'PayMatrix Technologies Pvt Ltd',
    templateTypes: ['Payslip', 'Leave', 'Attendance', 'Employee', 'General'],
  },
  {
    variable: 'CompanyAddress',
    label: 'Company Address',
    category: 'Company',
    description: 'Official registered address of the company',
    sampleValue: 'Tower B, Tech Park, Financial District, Cyber City',
    templateTypes: ['Payslip', 'Leave', 'Attendance', 'Employee', 'General'],
  },
  {
    variable: 'CompanyEmail',
    label: 'Company Support Email',
    category: 'Company',
    description: 'Corporate or HR contact email',
    sampleValue: 'hr@paymatrix.com',
    templateTypes: ['Payslip', 'Leave', 'Attendance', 'Employee', 'General'],
  },
  {
    variable: 'CompanyPhone',
    label: 'Company Phone',
    category: 'Company',
    description: 'Official contact phone number',
    sampleValue: '+91 (022) 4567-8900',
    templateTypes: ['Payslip', 'Leave', 'Attendance', 'Employee', 'General'],
  },

  // ─── Employee Variables (Available in all types) ───────────────────────────
  {
    variable: 'EmployeeName',
    label: 'Employee Full Name',
    category: 'Employee',
    description: 'First and last name of the employee',
    sampleValue: 'Sample Employee',
    templateTypes: ['Payslip', 'Leave', 'Attendance', 'Employee', 'General'],
  },
  {
    variable: 'EmployeeCode',
    label: 'Employee ID / Code',
    category: 'Employee',
    description: 'Unique corporate employee code',
    sampleValue: 'EMP-001',
    templateTypes: ['Payslip', 'Leave', 'Attendance', 'Employee', 'General'],
  },
  {
    variable: 'DepartmentName',
    label: 'Department',
    category: 'Employee',
    description: 'Employee allocated department',
    sampleValue: 'Engineering',
    templateTypes: ['Payslip', 'Leave', 'Attendance', 'Employee', 'General'],
  },
  {
    variable: 'DesignationName',
    label: 'Designation',
    category: 'Employee',
    description: 'Employee job title / role',
    sampleValue: 'Senior Software Engineer',
    templateTypes: ['Payslip', 'Leave', 'Attendance', 'Employee', 'General'],
  },
  {
    variable: 'BranchName',
    label: 'Branch / Office Location',
    category: 'Employee',
    description: 'Work branch or physical office location',
    sampleValue: 'Main Branch',
    templateTypes: ['Payslip', 'Leave', 'Attendance', 'Employee', 'General'],
  },
  {
    variable: 'EmployeeEmail',
    label: 'Employee Work Email',
    category: 'Employee',
    description: 'Work email address of employee',
    sampleValue: 'employee@paymatrix.com',
    templateTypes: ['Payslip', 'Leave', 'Attendance', 'Employee', 'General'],
  },
  {
    variable: 'JoiningDate',
    label: 'Date of Joining',
    category: 'Employee',
    description: 'Official date employee joined the company',
    sampleValue: '15-Jan-2023',
    templateTypes: ['Employee', 'General'],
  },
  {
    variable: 'ExitDate',
    label: 'Last Working Day / Exit Date',
    category: 'Employee',
    description: 'Official relieving or exit date',
    sampleValue: '31-Oct-2026',
    templateTypes: ['Employee', 'General'],
  },

  // ─── Payslip Specific Variables ────────────────────────────────────────────
  {
    variable: 'PayMonth',
    label: 'Pay Month & Year',
    category: 'Payslip',
    description: 'Payroll processing month & calendar year',
    sampleValue: 'September 2026',
    templateTypes: ['Payslip'],
  },
  {
    variable: 'PayslipNumber',
    label: 'Payslip Reference Number',
    category: 'Payslip',
    description: 'Unique identifier for payslip voucher',
    sampleValue: 'PAY-2026-09-00104',
    templateTypes: ['Payslip'],
  },
  {
    variable: 'BasicSalary',
    label: 'Basic Salary',
    category: 'Payslip',
    description: 'Monthly basic earnings amount',
    sampleValue: '₹25,000.00',
    templateTypes: ['Payslip'],
  },
  {
    variable: 'GrossSalary',
    label: 'Gross Salary',
    category: 'Payslip',
    description: 'Total earnings before deductions',
    sampleValue: '₹42,500.00',
    templateTypes: ['Payslip'],
  },
  {
    variable: 'TotalDeductions',
    label: 'Total Deductions',
    category: 'Payslip',
    description: 'Combined statutory and loan/advance deductions',
    sampleValue: '₹7,500.00',
    templateTypes: ['Payslip'],
  },
  {
    variable: 'NetSalary',
    label: 'Net Pay (Take-Home)',
    category: 'Payslip',
    description: 'Final disbursed amount credited to bank account',
    sampleValue: '₹35,000.00',
    templateTypes: ['Payslip'],
  },
  {
    variable: 'NetSalaryInWords',
    label: 'Net Pay in Words',
    category: 'Payslip',
    description: 'Spelled-out textual representation of net salary',
    sampleValue: 'Thirty-Five Thousand Rupees Only',
    templateTypes: ['Payslip'],
  },
  {
    variable: 'PaymentDate',
    label: 'Disbursement Date',
    category: 'Payslip',
    description: 'Date salary was remitted or generated',
    sampleValue: '30-Sep-2026',
    templateTypes: ['Payslip'],
  },
  {
    variable: 'BankName',
    label: 'Bank Name',
    category: 'Payslip',
    description: 'Employee receiving bank',
    sampleValue: 'HDFC Bank',
    templateTypes: ['Payslip'],
  },
  {
    variable: 'BankAccountNo',
    label: 'Masked Bank Account',
    category: 'Payslip',
    description: 'Partially hidden bank account number',
    sampleValue: '•••• 4321',
    templateTypes: ['Payslip'],
  },

  // ─── Leave Specific Variables ──────────────────────────────────────────────
  {
    variable: 'LeaveType',
    label: 'Leave Type',
    category: 'Leave',
    description: 'Category of leave (e.g. Paid Leave, Sick Leave, Casual Leave)',
    sampleValue: 'Paid Annual Leave',
    templateTypes: ['Leave'],
  },
  {
    variable: 'FromDate',
    label: 'Leave From Date',
    category: 'Leave',
    description: 'Start date of leave duration',
    sampleValue: '10-Oct-2026',
    templateTypes: ['Leave'],
  },
  {
    variable: 'ToDate',
    label: 'Leave To Date',
    category: 'Leave',
    description: 'End date of leave duration',
    sampleValue: '12-Oct-2026',
    templateTypes: ['Leave'],
  },
  {
    variable: 'TotalDays',
    label: 'Total Leave Days',
    category: 'Leave',
    description: 'Calculated number of working days requested',
    sampleValue: '3 days',
    templateTypes: ['Leave'],
  },
  {
    variable: 'Reason',
    label: 'Leave Reason',
    category: 'Leave',
    description: 'Reason provided by the employee',
    sampleValue: 'Family function in hometown',
    templateTypes: ['Leave'],
  },
  {
    variable: 'LeaveStatus',
    label: 'Leave Status',
    category: 'Leave',
    description: 'Workflow decision status (APPROVED, REJECTED, PENDING)',
    sampleValue: 'APPROVED',
    templateTypes: ['Leave'],
  },
  {
    variable: 'RejectionReason',
    label: 'Rejection Reason',
    category: 'Leave',
    description: 'Reason stated by manager if rejected',
    sampleValue: 'Critical sprint release window',
    templateTypes: ['Leave'],
  },
  {
    variable: 'ApproverName',
    label: 'Approver / Manager Name',
    category: 'Leave',
    description: 'Name of the authorizing manager',
    sampleValue: 'Rahul Mehta',
    templateTypes: ['Leave'],
  },

  // ─── Attendance Specific Variables ─────────────────────────────────────────
  {
    variable: 'AttendanceDate',
    label: 'Attendance Date',
    category: 'Attendance',
    description: 'Date for the attendance log or reminder',
    sampleValue: '04-Oct-2026',
    templateTypes: ['Attendance'],
  },
  {
    variable: 'CheckInTime',
    label: 'Check-In Punch Time',
    category: 'Attendance',
    description: 'First recorded punch in time',
    sampleValue: '09:05 AM',
    templateTypes: ['Attendance'],
  },
  {
    variable: 'CheckOutTime',
    label: 'Check-Out Punch Time',
    category: 'Attendance',
    description: 'Last recorded punch out time',
    sampleValue: '06:15 PM',
    templateTypes: ['Attendance'],
  },
  {
    variable: 'AttendanceStatus',
    label: 'Attendance Status',
    category: 'Attendance',
    description: 'Marked attendance state (PRESENT, HALF_DAY, LATE, ABSENT)',
    sampleValue: 'PRESENT',
    templateTypes: ['Attendance'],
  },

  // ─── System Variables ──────────────────────────────────────────────────────
  {
    variable: 'CurrentDate',
    label: 'Current Date',
    category: 'System',
    description: 'Calendar date when email is generated',
    sampleValue: '04-Oct-2026',
    templateTypes: ['Payslip', 'Leave', 'Attendance', 'Employee', 'General'],
  },
  {
    variable: 'CurrentYear',
    label: 'Current Year',
    category: 'System',
    description: 'Current 4-digit calendar year',
    sampleValue: '2026',
    templateTypes: ['Payslip', 'Leave', 'Attendance', 'Employee', 'General'],
  },
];

// Pre-seeded production templates
export const DEFAULT_EMAIL_TEMPLATES = [
  {
    templateCode: 'PAYSLIP_MONTHLY',
    templateName: 'Monthly Payslip Notification',
    templateType: 'Payslip',
    description: 'Default template for dispatching monthly employee payslips with PDF attachment.',
    subject: 'Payslip for {{PayMonth}} - {{EmployeeName}}',
    bodyHtml: `<p>Dear <strong>{{EmployeeName}}</strong>,</p>
<p>We are pleased to inform you that your payslip for <strong>{{PayMonth}}</strong> has been processed and is ready for download.</p>
<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
  <h3 style="margin-top: 0; color: #0f172a; font-size: 16px;">Employee & Payroll Summary</h3>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
    <tr>
      <td style="padding: 6px 0; color: #64748b;"><strong>Employee ID:</strong></td>
      <td style="padding: 6px 0; color: #0f172a;">{{EmployeeCode}}</td>
      <td style="padding: 6px 0; color: #64748b;"><strong>Department:</strong></td>
      <td style="padding: 6px 0; color: #0f172a;">{{DepartmentName}}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #64748b;"><strong>Designation:</strong></td>
      <td style="padding: 6px 0; color: #0f172a;">{{DesignationName}}</td>
      <td style="padding: 6px 0; color: #64748b;"><strong>Gross Salary:</strong></td>
      <td style="padding: 6px 0; color: #0f172a;">{{GrossSalary}}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #64748b;"><strong>Total Deductions:</strong></td>
      <td style="padding: 6px 0; color: #dc2626;">{{TotalDeductions}}</td>
      <td style="padding: 6px 0; color: #64748b;"><strong>Net Salary Paid:</strong></td>
      <td style="padding: 6px 0; color: #16a34a; font-size: 16px;"><strong>{{NetSalary}}</strong></td>
    </tr>
  </table>
</div>
<p>Please find attached the official PDF payslip (Reference: <code>{{PayslipNumber}}</code>) for your financial records.</p>
<p>If you notice any discrepancies or have questions regarding your remuneration, please reach out to the HR / Payroll department.</p>
<br/>
<p>Warm regards,<br/><strong>{{CompanyName}}</strong><br/><span style="color: #64748b; font-size: 13px;">HR & Payroll Department</span></p>`,
    isDefault: true,
  },
  {
    templateCode: 'LEAVE_APPROVAL',
    templateName: 'Leave Request Approved',
    templateType: 'Leave',
    description: 'Notification sent to an employee when their leave request is approved.',
    subject: 'Leave Request Approved: {{LeaveType}} ({{FromDate}} to {{ToDate}})',
    bodyHtml: `<p>Dear <strong>{{EmployeeName}}</strong>,</p>
<p>Your leave application for <strong>{{LeaveType}}</strong> from <strong>{{FromDate}}</strong> to <strong>{{ToDate}}</strong> (Total: <strong>{{TotalDays}}</strong>) has been <span style="color: #16a34a; font-weight: bold;">APPROVED</span> by {{ApproverName}}.</p>
<p>Your leave balance has been updated accordingly in the system.</p>
<br/>
<p>Best regards,<br/><strong>{{CompanyName}}</strong><br/>HR Department</p>`,
    isDefault: true,
  },
  {
    templateCode: 'LEAVE_REJECTION',
    templateName: 'Leave Request Rejected',
    templateType: 'Leave',
    description: 'Notification sent when a leave application cannot be accommodated.',
    subject: 'Update on Leave Request: {{LeaveType}}',
    bodyHtml: `<p>Dear <strong>{{EmployeeName}}</strong>,</p>
<p>We regret to inform you that your leave request for <strong>{{LeaveType}}</strong> from <strong>{{FromDate}}</strong> to <strong>{{ToDate}}</strong> could not be approved at this time.</p>
<p><strong>Reason for rejection:</strong> {{RejectionReason}}</p>
<p>Please connect with your reporting manager ({{ApproverName}}) for any queries or rescheduling.</p>
<br/>
<p>Warm regards,<br/><strong>{{CompanyName}}</strong></p>`,
    isDefault: false,
  },
  {
    templateCode: 'EMPLOYEE_WELCOME',
    templateName: 'Welcome to the Team',
    templateType: 'Employee',
    description: 'Onboarding welcome email sent to newly joined employees.',
    subject: 'Welcome to {{CompanyName}}, {{EmployeeName}}!',
    bodyHtml: `<p>Dear <strong>{{EmployeeName}}</strong>,</p>
<p>A warm welcome to <strong>{{CompanyName}}</strong>! We are thrilled to have you join our team as <strong>{{DesignationName}}</strong> in the <strong>{{DepartmentName}}</strong> department.</p>
<p>Your Employee ID is <strong>{{EmployeeCode}}</strong>.</p>
<p>Our HR team is here to support you throughout your onboarding journey.</p>
<br/>
<p>Welcome aboard!<br/><strong>{{CompanyName}} Team</strong></p>`,
    isDefault: true,
  },
  {
    templateCode: 'GENERAL_NOTICE',
    templateName: 'General Employee Announcement',
    templateType: 'General',
    description: 'Generic announcement or notification template.',
    subject: 'Important Announcement from {{CompanyName}}',
    bodyHtml: `<p>Dear <strong>{{EmployeeName}}</strong>,</p>
<p>Please take note of the following announcement from the management.</p>
<br/>
<p>Sincerely,<br/><strong>{{CompanyName}}</strong></p>`,
    isDefault: true,
  },
];
