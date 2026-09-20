import type { Employee,Department,Designation,Branch,AttendanceRecord,LeaveType,LeaveRequest,SalaryComponent,SalaryStructure,PayrollRun,Loan,Bonus } from "@/types"

export const departments: Department[]=[
  {code:"DEPT-ENG",name:"Engineering",manager:"Aarav Mehta",employees:342,createdAt:"2022-03-12",status:"Active"},
  {code:"DEPT-HR",name:"Human Resources",manager:"Priya Sharma",employees:48,createdAt:"2021-11-02",status:"Active"},
  {code:"DEPT-FIN",name:"Finance",manager:"Rahul Verma",employees:86,createdAt:"2021-08-14",status:"Active"},
  {code:"DEPT-MKT",name:"Marketing",manager:"Sneha Kapoor",employees:124,createdAt:"2022-01-20",status:"Active"},
  {code:"DEPT-SAL",name:"Sales",manager:"Vikram Singh",employees:210,createdAt:"2021-09-05",status:"Active"},
  {code:"DEPT-SUP",name:"Support",manager:"Ananya Desai",employees:98,createdAt:"2022-04-11",status:"Active"},
  {code:"DEPT-OPS",name:"Operations",manager:"Kunal Joshi",employees:76,createdAt:"2022-02-18",status:"Active"},
  {code:"DEPT-DES",name:"Design",manager:"Neha Gupta",employees:64,createdAt:"2022-05-30",status:"Active"},
]

export const designations: Designation[]=[
  {code:"DES-SE1",name:"Software Engineer",department:"Engineering",grade:"A",minSalary:60000,maxSalary:95000,status:"Active"},
  {code:"DES-SSE",name:"Senior Software Engineer",department:"Engineering",grade:"B",minSalary:90000,maxSalary:140000,status:"Active"},
  {code:"DES-EM",name:"Engineering Manager",department:"Engineering",grade:"C",minSalary:150000,maxSalary:220000,status:"Active"},
  {code:"DES-HRM",name:"HR Manager",department:"Human Resources",grade:"B",minSalary:80000,maxSalary:130000,status:"Active"},
  {code:"DES-ACC",name:"Accountant",department:"Finance",grade:"A",minSalary:45000,maxSalary:75000,status:"Active"},
  {code:"DES-MKT",name:"Marketing Executive",department:"Marketing",grade:"A",minSalary:40000,maxSalary:70000,status:"Active"},
]

export const branches: Branch[]=[
  {code:"BR-MUM",name:"Mumbai Corporate Office",city:"Mumbai",state:"Maharashtra",country:"India",manager:"Aarav Mehta",employees:520,address:"Bandra Kurla Complex, Mumbai",status:"Active"},
  {code:"BR-BLR",name:"Bengaluru Tech Park",city:"Bengaluru",state:"Karnataka",country:"India",manager:"Priya Sharma",employees:340,address:"Koramangala, Bengaluru",status:"Active"},
  {code:"BR-DEL",name:"Delhi Branch",city:"New Delhi",state:"Delhi",country:"India",manager:"Rahul Verma",employees:210,address:"Connaught Place, New Delhi",status:"Active"},
  {code:"BR-PUN",name:"Pune Office",city:"Pune",state:"Maharashtra",country:"India",manager:"Sneha Kapoor",employees:178,address:"Hinjawadi, Pune",status:"Active"},
]

const firstNames=["Aarav","Priya","Rahul","Sneha","Vikram","Ananya","Kunal","Neha","Arjun","Ishita","Rohan","Pooja","Aditya","Kavya","Siddharth","Meera","Nikhil","Divya","Harsh","Tanya","Manish","Shreya","Gaurav","Riya","Amit","Nisha","Vivek","Simran","Rajesh","Kriti","Suresh","Alisha","Deepak","Sakshi","Mohit","Tanvi","Pranav","Aishwarya","Yash","Sonia","Karan","Preet","Sanjay","Neel","Anjali","Varun","Ekta","Rakesh","Bhavya","Sunil"]
const lastNames=["Mehta","Sharma","Verma","Kapoor","Singh","Desai","Joshi","Gupta","Patel","Reddy","Nair","Kumar","Malhotra","Rao","Chopra","Bansal","Arora","Das","Iyer","Khan","Seth","Bhat","Menon","Shah","Yadav"]
const depts=["Engineering","Human Resources","Finance","Marketing","Sales","Support","Operations","Design"]
const desg=["Software Engineer","Senior Software Engineer","Engineering Manager","HR Manager","Accountant","Marketing Executive","Sales Executive","Support Lead"]
const branchesArr=["Mumbai Corporate Office","Bengaluru Tech Park","Delhi Branch","Pune Office"]

export const employees: Employee[] = Array.from({length:50},(_,i)=>{
  const fn=firstNames[i%firstNames.length]
  const ln=lastNames[i%lastNames.length]
  return {
    id:`emp-${i+1}`, employeeId:`EMP-${10000+i}`, firstName:fn, lastName:ln,
    email:`${fn.toLowerCase()}.${ln.toLowerCase()}@paymatrix.com`, phone:`+91 98${String(10000000 + i*123456).slice(0,8)}`,
    avatar:`https://i.pravatar.cc/150?img=${(i%70)+1}`,
    department:depts[i%depts.length], designation:desg[i%desg.length], branch:branchesArr[i%branchesArr.length],
    employmentType:(["Full-time","Part-time","Contract","Intern"] as const)[i%4],
    status:(["Active","Active","Active","On Leave","Probation"] as const)[i%5],
    joiningDate: new Date(2020 + (i%4), i%12, (i%28)+1).toISOString().slice(0,10),
    salary: 40000 + (i*3500) + (Math.random()*10000|0),
    gender: i%2?"Female":"Male", dob: new Date(1990+(i%12), i%12, 15).toISOString().slice(0,10), manager:"Aarav Mehta"
  }
})

export const attendance: AttendanceRecord[] = employees.slice(0,20).map((e,i)=>({
  id:`att-${i}`, employee:`${e.firstName} ${e.lastName}`, employeeId:e.employeeId,
  date: new Date().toISOString().slice(0,10),
  checkIn:`09:${String(15+(i%20)).padStart(2,'0')} AM`, checkOut:`06:${String(5+(i%30)).padStart(2,'0')} PM`,
  hours: 8 + (i%2?0.5:-0.2), overtime: i%5===0?1.5:0,
  status:(["Present","Present","Present","Late","Half Day"] as const)[i%5]
}))

export const leaveTypes: LeaveType[]=[
  {code:"LT-CL",name:"Casual Leave",category:"General",paid:true,allowance:12,carryForward:false,maxConsecutive:3,requiresApproval:true,status:"Active"},
  {code:"LT-SL",name:"Sick Leave",category:"General",paid:true,allowance:8,carryForward:false,maxConsecutive:5,requiresApproval:true,status:"Active"},
  {code:"LT-PL",name:"Privilege Leave",category:"General",paid:true,allowance:15,carryForward:true,maxConsecutive:15,requiresApproval:true,status:"Active"},
  {code:"LT-ML",name:"Maternity Leave",category:"Special",paid:true,allowance:182,carryForward:false,maxConsecutive:182,requiresApproval:true,status:"Active"},
  {code:"LT-LOP",name:"Loss of Pay",category:"Unpaid",paid:false,allowance:0,carryForward:false,maxConsecutive:30,requiresApproval:true,status:"Active"},
]

export const leaveRequests: LeaveRequest[] = Array.from({length:12},(_,i)=>({
  id:`LR-${2024+i}`, employee: `${employees[i].firstName} ${employees[i].lastName}`, employeeId: employees[i].employeeId,
  leaveType: leaveTypes[i%leaveTypes.length].name, from:"2026-09-10", to:"2026-09-12", days:2+i%3, reason:"Personal reason",
  status:(["Pending","Approved","Rejected"] as const)[i%3], approver:"Priya Sharma"
}))

export const salaryComponents: SalaryComponent[]=[
  {code:"E-BASIC",name:"Basic Salary",type:"Earning",calculationType:"Fixed",amount:40000,taxable:true,statutory:false,active:true},
  {code:"E-HRA",name:"House Rent Allowance",type:"Earning",calculationType:"Percentage",percentage:50,basedOn:"Basic Salary",taxable:true,statutory:false,active:true},
  {code:"E-SA",name:"Special Allowance",type:"Earning",calculationType:"Fixed",amount:10000,taxable:true,statutory:false,active:true},
  {code:"E-CONV",name:"Conveyance",type:"Earning",calculationType:"Fixed",amount:5000,taxable:false,statutory:false,active:true},
  {code:"D-PF",name:"Provident Fund",type:"Deduction",calculationType:"Percentage",percentage:12,basedOn:"Basic Salary",taxable:false,statutory:true,active:true},
  {code:"D-ESI",name:"ESI",type:"Deduction",calculationType:"Percentage",percentage:0.75,basedOn:"Gross",taxable:false,statutory:true,active:true},
  {code:"D-PT",name:"Professional Tax",type:"Deduction",calculationType:"Fixed",amount:200,taxable:false,statutory:true,active:true},
  {code:"D-IT",name:"Income Tax",type:"Deduction",calculationType:"Fixed",amount:3500,taxable:false,statutory:true,active:true},
]

export const salaryStructures: SalaryStructure[]=[
  {id:"ss-1",name:"Software Engineer — Grade A",grade:"A",earnings:[{code:"E-BASIC",name:"Basic Salary",amount:40000},{code:"E-HRA",name:"HRA",amount:20000},{code:"E-SA",name:"Special Allowance",amount:10000},{code:"E-CONV",name:"Conveyance",amount:5000}],deductions:[{code:"D-PF",name:"PF",amount:4800},{code:"D-PT",name:"Professional Tax",amount:200}],gross:75000,totalDeduction:5000,net:70000},
  {id:"ss-2",name:"Senior Engineer — Grade B",grade:"B",earnings:[{code:"E-BASIC",name:"Basic Salary",amount:65000},{code:"E-HRA",name:"HRA",amount:32500},{code:"E-SA",name:"Special Allowance",amount:15000},{code:"E-CONV",name:"Conveyance",amount:8000}],deductions:[{code:"D-PF",name:"PF",amount:7800},{code:"D-PT",name:"Professional Tax",amount:200},{code:"D-IT",name:"Income Tax",amount:5500}],gross:120500,totalDeduction:13500,net:107000},
  {id:"ss-3",name:"Engineering Manager — Grade C",grade:"C",earnings:[{code:"E-BASIC",name:"Basic Salary",amount:90000},{code:"E-HRA",name:"HRA",amount:45000},{code:"E-SA",name:"Special Allowance",amount:25000},{code:"E-CONV",name:"Conveyance",amount:10000}],deductions:[{code:"D-PF",name:"PF",amount:10800},{code:"D-IT",name:"Income Tax",amount:12000},{code:"D-PT",name:"Professional Tax",amount:200}],gross:170000,totalDeduction:23000,net:147000},
]

export const payrollRuns: PayrollRun[]=[
  {id:"PR-2026-09",period:"September 2026",employees:1248,gross:9250000,deductions:1240000,net:8010000,status:"Approved",createdAt:"2026-09-01"},
  {id:"PR-2026-08",period:"August 2026",employees:1240,gross:9120000,deductions:1210000,net:7910000,status:"Paid",createdAt:"2026-08-01"},
  {id:"PR-2026-07",period:"July 2026",employees:1230,gross:9050000,deductions:1190000,net:7860000,status:"Paid",createdAt:"2026-07-01"},
  {id:"PR-2026-06",period:"June 2026",employees:1225,gross:8980000,deductions:1180000,net:7800000,status:"Paid",createdAt:"2026-06-01"},
  {id:"PR-2026-10",period:"October 2026",employees:1255,gross:9400000,deductions:1260000,net:8140000,status:"Draft",createdAt:"2026-09-18"},
]

export const loans: Loan[]=[
  {id:"LN-001",employee:"Aarav Mehta",loanType:"Personal Loan",amount:200000,interest:10,tenure:24,emi:9200,outstanding:85000,startDate:"2025-06-01",status:"Active"},
  {id:"LN-002",employee:"Priya Sharma",loanType:"Vehicle Loan",amount:500000,interest:9,tenure:36,emi:15900,outstanding:320000,startDate:"2025-01-15",status:"Active"},
]
export const bonuses: Bonus[]=[
  {id:"BN-001",employee:"Aarav Mehta",type:"Performance Bonus",amount:50000,date:"2026-09-15",period:"September 2026",status:"Approved"},
  {id:"BN-002",employee:"Rahul Verma",type:"Festival Bonus",amount:25000,date:"2026-09-10",period:"September 2026",status:"Pending"},
]

export const payrollChart = [
  {month:"Apr", gross:88, deductions:11, net:77},
  {month:"May", gross:90, deductions:12, net:78},
  {month:"Jun", gross:89, deductions:11.8, net:78},
  {month:"Jul", gross:90.5, deductions:11.9, net:78.6},
  {month:"Aug", gross:91.2, deductions:12.1, net:79.1},
  {month:"Sep", gross:92.5, deductions:12.4, net:80.1},
]
