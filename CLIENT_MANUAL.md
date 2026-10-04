# PayMatrix: Client User Manual & Payroll Workflow Guide

Welcome to **PayMatrix**, your comprehensive Payroll and HR Management System. This guide is designed to help you understand the core concepts of the platform and provides a step-by-step example of how to process an employee from onboarding through to their first payslip.

---

## 🏗️ 1. Core Architecture

PayMatrix is organized into sequential modules that build upon each other:

1. **Organization Data**: Your company's foundation (Branches, Departments, Designations).
2. **Employee Data**: The people who work for you, linked to the Organization Data.
3. **Attendance & Leave**: The tracking of time worked and time off.
4. **Payroll Configuration**: The rules for how people are paid (Salary Components, Structures).
5. **Payroll Processing**: The actual calculation of wages, generating payslips, and compliance reporting.

---

## 📝 2. Example Entry: The End-to-End Workflow

Let's walk through an example of onboarding a new employee, **Sarah Jenkins**, setting up her salary, and running her first payroll.

### Step 1: Set Up the Organization Foundation
*Before hiring Sarah, the company structure must exist.*
1. Navigate to **Organization > Departments**. Add a new department called `"Engineering"`.
2. Navigate to **Organization > Designations**. Add a new designation called `"Frontend Developer"`.
3. Navigate to **Organization > Branches**. Ensure your primary office branch (e.g., `"HQ - New York"`) is set up.

### Step 2: Onboard the Employee
*Now we add Sarah to the system.*
1. Navigate to **Employees > Employees** and click **Add New Employee**.
2. Enter Sarah's personal details (Name, Email, DOB).
3. Under the **Job Details** tab, link her to the organization structure we just built:
   - **Department:** Engineering
   - **Designation:** Frontend Developer
   - **Branch:** HQ - New York
4. Save the employee record. Sarah will automatically be assigned a unique Employee ID.

### Step 3: Define Salary Components
*Salary components are the building blocks of a paycheck (Earnings and Deductions).*
1. Navigate to **Payroll > Salary Components**.
2. Ensure you have the standard components created. For example:
   - **Basic Pay:** Earning, Type: Percentage of CTC (e.g., 50%).
   - **House Rent Allowance (HRA):** Earning, Type: Percentage of Basic (e.g., 40%).
   - **Special Allowance:** Earning, Type: Flat Amount (or remainder of CTC).
   - **Provident Fund (PF):** Deduction, Type: Percentage of Basic (e.g., 12%).

### Step 4: Create a Salary Structure
*A structure groups components together into a template.*
1. Navigate to **Payroll > Salary Structures** and click **Create Structure**.
2. Name it `"Standard Engineering Tier 1"`.
3. Add the components we verified in Step 3 (Basic Pay, HRA, Special Allowance).
4. Save the structure. This template can now be reused for any Tier 1 Engineer.

### Step 5: Assign Salary to the Employee
*Now we tell the system how much Sarah makes.*
1. Navigate to **Payroll > Employee Salary**.
2. Select **Sarah Jenkins**.
3. Choose the `"Standard Engineering Tier 1"` salary structure.
4. Enter her **Annual CTC** (Cost to Company), for example, `$120,000`.
5. The system will automatically project her monthly earnings and deductions based on the rules defined in the structure (e.g., Basic Pay becomes $5,000/month, PF deduction becomes $600/month).

### Step 6: Track Time & Attendance (End of Month)
*When the month ends, we review Sarah's attendance.*
1. Throughout the month, Sarah's daily punches are recorded under **Attendance > Attendance Register**.
2. If Sarah takes a sick day, it is logged under **Leave > Leave Requests**.
3. At the end of the month, the system calculates her **Loss of Pay (LOP)** days. If she worked 29 out of 30 days and took 1 unapproved day off, her LOP is 1.

### Step 7: Run Payroll
*Time to generate the paychecks.*
1. Navigate to **Payroll > Payroll Runs** and click **New Payroll Run**.
2. Select the **Pay Period** (e.g., `September 2026`).
3. Select the **Department** (`Engineering`) or run it for the whole company.
4. Click **Process**. 
5. The PayMatrix engine will automatically calculate Sarah's final payout:
   - *Formula: (Monthly Gross - LOP Deductions) - Statutory Deductions (Tax, PF).*
6. Review the draft payroll sheet. If everything looks correct, click **Approve & Finalize**.

### Step 8: Distribute Payslips
*Give Sarah her finalized slip.*
1. Navigate to **Payroll > Payslips**.
2. Select the `September 2026` run.
3. You can view, print, or email Sarah's beautifully formatted, itemized payslip directly from the dashboard.

---

## 💡 3. Quick Tips for Daily Operations

* **Inline Editing:** In any data grid (like Departments or Shifts), you can simply **Double-Click** a row to edit it quickly. No need to look for an edit button!
* **Global Search:** Use the search bars at the top of list views to quickly find specific employees or records.
* **Compliance Checks:** Always ensure your **Compliance** settings (Tax brackets, PF percentages) are updated annually under the Compliance menu to ensure automated payroll calculations remain legally compliant.

---
*Generated by PayMatrix Systems*
