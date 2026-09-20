import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { branches } from "./branches";
import { companies } from "./companies";
import { departments } from "./departments";
import { designations } from "./designations";
import { bloodGroupEnum, employmentStatusEnum, genderEnum, maritalStatusEnum } from "./enums";
import { pk, timestamps } from "./helpers";

export const employees = pgTable(
  "employees",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id").references(() => branches.id, { onDelete: "set null" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    designationId: uuid("designation_id").references(() => designations.id, { onDelete: "set null" }),

    employeeCode: varchar("employee_code", { length: 30 }).notNull(),

    firstName: varchar("first_name", { length: 120 }).notNull(),
    middleName: varchar("middle_name", { length: 120 }),
    lastName: varchar("last_name", { length: 120 }).notNull(),

    gender: genderEnum("gender"),
    dateOfBirth: date("date_of_birth"),
    maritalStatus: maritalStatusEnum("marital_status"),
    bloodGroup: bloodGroupEnum("blood_group"),

    email: varchar("email", { length: 255 }),
    personalEmail: varchar("personal_email", { length: 255 }),
    phone: varchar("phone", { length: 30 }),
    alternatePhone: varchar("alternate_phone", { length: 30 }),

    joiningDate: date("joining_date").notNull(),
    confirmationDate: date("confirmation_date"),
    resignationDate: date("resignation_date"),
    lastWorkingDate: date("last_working_date"),

    employmentTypeId: uuid("employment_type_id"),
    employmentStatus: employmentStatusEnum("employment_status").default("PROBATION").notNull(),

    reportingManagerId: uuid("reporting_manager_id"),

    profilePhotoUrl: text("profile_photo_url"),

    panNumber: varchar("pan_number", { length: 20 }),
    nationalIdNumber: varchar("national_id_number", { length: 30 }), // Aadhaar
    pfNumber: varchar("pf_number", { length: 50 }),
    esiNumber: varchar("esi_number", { length: 50 }),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("employees_company_code_unique").on(t.companyId, t.employeeCode),
    uniqueIndex("employees_company_email_unique").on(t.companyId, t.email),
    index("employees_company_id_idx").on(t.companyId),
    index("employees_branch_id_idx").on(t.branchId),
    index("employees_department_id_idx").on(t.departmentId),
    index("employees_designation_id_idx").on(t.designationId),
    index("employees_reporting_manager_idx").on(t.reportingManagerId),
    index("employees_employment_status_idx").on(t.employmentStatus),
    index("employees_is_active_idx").on(t.isActive),
    index("employees_joining_date_idx").on(t.joiningDate),
  ],
);

export const employeesRelations = relations(employees, ({ one, many }) => ({
  company: one(companies, {
    fields: [employees.companyId],
    references: [companies.id],
  }),
  branch: one(branches, {
    fields: [employees.branchId],
    references: [branches.id],
  }),
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  designation: one(designations, {
    fields: [employees.designationId],
    references: [designations.id],
  }),
  manager: one(employees, {
    fields: [employees.reportingManagerId],
    references: [employees.id],
    relationName: "manager_reports",
  }),
  reports: many(employees, { relationName: "manager_reports" }),
}));
