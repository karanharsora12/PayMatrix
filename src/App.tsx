import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import EmployeeProfile from "@/pages/EmployeeProfile";
import AddEmployee from "@/pages/AddEmployee";
import Company from "@/pages/Company";
import WorkPolicy from "@/pages/WorkPolicy";
import Departments from "@/pages/Departments";
import Designations from "@/pages/Designations";
import Branches from "@/pages/Branches";
import Locations from "@/pages/Locations";
import EmployeeGroups from "@/pages/EmployeeGroups";
import DocumentMaster from "@/pages/DocumentMaster";
import Attendance from "@/pages/Attendance";
import MyAttendance from "@/pages/MyAttendance";
import Shifts from "@/pages/Shifts";
import Holidays from "@/pages/Holidays";
import Leave from "@/pages/Leave";
import SalaryComponents from "@/pages/SalaryComponents";
import SalaryStructures from "@/pages/SalaryStructures";
import EmployeeSalary from "@/pages/EmployeeSalary";
import Payslip from "@/pages/Payslip";
import Compliance from "@/pages/Compliance";
import Reports from "@/pages/Reports";
import UsersRoles from "@/pages/UsersRoles";
import UserParameters from "@/pages/UserParameters";
import EmailTemplates from "@/pages/EmailTemplates";
import Placeholder from "@/pages/Placeholder";
import Login from "@/pages/Login";
import { useState } from "react";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/context/AuthContext";
import {
  ProtectedRouteGuard,
  AttendanceManagerRouteGuard,
} from "@/components/common/PermissionGuard";

function Protected() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center animate-pulse">
          <div className="h-16 w-16 mb-6 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-3xl shadow-lg">
            PM
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            PayMatrix
          </div>
        </div>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  const [cmd, setCmd] = useState(false);
  return (
    <BrowserRouter>
      <CommandPalette open={cmd} onOpenChange={setCmd} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Protected />}>
          <Route element={<AppShell onOpenCommand={() => setCmd(true)} />}>
            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />

            {/* Employees */}
            <Route
              path="/employees"
              element={
                <ProtectedRouteGuard perm="employees.view">
                  <Employees />
                </ProtectedRouteGuard>
              }
            />
            <Route
              path="/employees/new"
              element={
                <ProtectedRouteGuard perm="employees.create">
                  <AddEmployee />
                </ProtectedRouteGuard>
              }
            />
            <Route
              path="/employees/:id/edit"
              element={
                <ProtectedRouteGuard perm="employees.edit">
                  <AddEmployee />
                </ProtectedRouteGuard>
              }
            />
            <Route
              path="/employees/:id"
              element={
                <ProtectedRouteGuard perm="employees.view">
                  <EmployeeProfile />
                </ProtectedRouteGuard>
              }
            />

            {/* Organization */}
            <Route
              path="/organization/company"
              element={
                <ProtectedRouteGuard perm="settings.view">
                  <Company />
                </ProtectedRouteGuard>
              }
            />
            <Route
              path="/organization/company/:id/work-policy"
              element={
                <ProtectedRouteGuard perm="settings.view">
                  <WorkPolicy />
                </ProtectedRouteGuard>
              }
            />
            <Route
              path="/branches"
              element={
                <ProtectedRouteGuard
                  anyPerm={["branches.view", "settings.view"]}
                >
                  <Branches />
                </ProtectedRouteGuard>
              }
            />
            <Route
              path="/departments"
              element={
                <ProtectedRouteGuard
                  anyPerm={["departments.view", "settings.view"]}
                >
                  <Departments />
                </ProtectedRouteGuard>
              }
            />
            <Route
              path="/designations"
              element={
                <ProtectedRouteGuard
                  anyPerm={["designations.view", "settings.view"]}
                >
                  <Designations />
                </ProtectedRouteGuard>
              }
            />
            <Route
              path="/locations"
              element={
                <ProtectedRouteGuard
                  anyPerm={["locations.view", "settings.view"]}
                >
                  <Locations />
                </ProtectedRouteGuard>
              }
            />

            {/* Attendance & Shifts */}
            <Route
              path="/my-attendance"
              element={
                <ProtectedRouteGuard perm="attendance.view">
                  <MyAttendance />
                </ProtectedRouteGuard>
              }
            />
            <Route
              path="/attendance-register"
              element={
                <AttendanceManagerRouteGuard>
                  <Attendance />
                </AttendanceManagerRouteGuard>
              }
            />
            <Route
              path="/shifts"
              element={
                <ProtectedRouteGuard
                  anyPerm={["shift.view", "attendance.view"]}
                >
                  <Shifts />
                </ProtectedRouteGuard>
              }
            />
            <Route
              path="/holidays"
              element={
                <ProtectedRouteGuard
                  anyPerm={["holiday.view", "attendance.view"]}
                >
                  <Holidays />
                </ProtectedRouteGuard>
              }
            />

            {/* Leave */}
            <Route
              path="/leave"
              element={
                <ProtectedRouteGuard perm="leave.view">
                  <Leave />
                </ProtectedRouteGuard>
              }
            />

            {/* Payroll & Salary */}
            <Route
              path="/salary-components"
              element={
                <ProtectedRouteGuard
                  anyPerm={["salary.component.view", "salary.view"]}
                >
                  <SalaryComponents />
                </ProtectedRouteGuard>
              }
            />
            <Route
              path="/salary-structures"
              element={
                <ProtectedRouteGuard
                  anyPerm={["salary.structure.view", "salary.view"]}
                >
                  <SalaryStructures />
                </ProtectedRouteGuard>
              }
            />
            <Route
              path="/employee-salary"
              element={
                <ProtectedRouteGuard
                  anyPerm={["salary.employee.view", "salary.view"]}
                >
                  <EmployeeSalary />
                </ProtectedRouteGuard>
              }
            />
            <Route
              path="/payslips"
              element={
                <ProtectedRouteGuard anyPerm={["payslip.view", "payroll.view"]}>
                  <Payslip />
                </ProtectedRouteGuard>
              }
            />
            <Route
              path="/payslips/:id"
              element={
                <ProtectedRouteGuard anyPerm={["payslip.view", "payroll.view"]}>
                  <Payslip />
                </ProtectedRouteGuard>
              }
            />

            {/* Documents & Groups */}
            <Route
              path="/employee-groups"
              element={
                <ProtectedRouteGuard perm="employees.view">
                  <EmployeeGroups />
                </ProtectedRouteGuard>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRouteGuard
                  anyPerm={["documents.view", "employees.view"]}
                >
                  <DocumentMaster />
                </ProtectedRouteGuard>
              }
            />

            {/* Administration */}
            <Route
              path="/roles"
              element={
                <ProtectedRouteGuard
                  anyPerm={["roles.view", "users.view", "settings.view"]}
                >
                  <UsersRoles />
                </ProtectedRouteGuard>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRouteGuard anyPerm={["users.view", "roles.view"]}>
                  <UsersRoles />
                </ProtectedRouteGuard>
              }
            />
            <Route
              path="/user-parameters"
              element={
                <ProtectedRouteGuard anyPerm={["roles.view", "settings.view"]}>
                  <UserParameters />
                </ProtectedRouteGuard>
              }
            />
            <Route
              path="/email-templates"
              element={
                <ProtectedRouteGuard
                  anyPerm={["email_templates.view", "settings.view"]}
                >
                  <EmailTemplates />
                </ProtectedRouteGuard>
              }
            />

            {/* Compliance & Reports */}
            <Route
              path="/compliance/:type"
              element={
                <ProtectedRouteGuard perm="reports.view">
                  <Compliance />
                </ProtectedRouteGuard>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRouteGuard perm="reports.view">
                  <Reports />
                </ProtectedRouteGuard>
              }
            />

            <Route
              path="/audit-logs"
              element={
                <ProtectedRouteGuard perm="settings.view">
                  <Placeholder title="Audit Logs" />
                </ProtectedRouteGuard>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
