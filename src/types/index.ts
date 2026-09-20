export type EmployeeStatus="Active"|"Inactive"|"On Leave"|"Probation"
export type EmploymentType="Full-time"|"Part-time"|"Contract"|"Intern"
export interface Employee{ id:string; employeeId:string; firstName:string; lastName:string; email:string; phone:string; avatar:string; department:string; designation:string; branch:string; employmentType:EmploymentType; status:EmployeeStatus; joiningDate:string; salary:number; manager?:string; gender:string; dob:string; }
export interface Department{ code:string; name:string; manager:string; employees:number; status:string; createdAt:string }
export interface Designation{ code:string; name:string; department:string; grade:string; minSalary:number; maxSalary:number; status:string }
export interface Branch{ code:string; name:string; city:string; state:string; country:string; manager:string; employees:number; status:string; address:string }
export interface AttendanceRecord{ id:string; employee:string; employeeId:string; date:string; checkIn:string; checkOut:string; hours:number; overtime:number; status:"Present"|"Absent"|"Late"|"Half Day"|"On Leave" }
export interface LeaveType{ code:string; name:string; category:string; paid:boolean; allowance:number; carryForward:boolean; maxConsecutive:number; requiresApproval:boolean; status:string }
export interface LeaveRequest{ id:string; employee:string; employeeId:string; leaveType:string; from:string; to:string; days:number; reason:string; status:"Pending"|"Approved"|"Rejected"; approver:string }
export interface SalaryComponent{ code:string; name:string; type:"Earning"|"Deduction"; calculationType:"Fixed"|"Percentage"|"Formula"; amount?:number; percentage?:number; basedOn?:string; taxable:boolean; statutory:boolean; active:boolean }
export interface SalaryStructure{ id:string; name:string; grade:string; earnings:{code:string;name:string;amount:number}[]; deductions:{code:string;name:string;amount:number}[]; gross:number; totalDeduction:number; net:number }
export interface PayrollRun{ id:string; period:string; employees:number; gross:number; deductions:number; net:number; status:"Draft"|"Processing"|"Processed"|"Approved"|"Paid"|"Cancelled"; createdAt:string }
export interface Payslip{ id:string; employee:string; employeeId:string; period:string; earnings:{name:string;amount:number}[]; deductions:{name:string;amount:number}[]; gross:number; totalDeduction:number; net:number }
export interface Loan{ id:string; employee:string; loanType:string; amount:number; interest:number; tenure:number; emi:number; outstanding:number; startDate:string; status:string }
export interface Bonus{ id:string; employee:string; type:string; amount:number; date:string; period:string; status:string }
