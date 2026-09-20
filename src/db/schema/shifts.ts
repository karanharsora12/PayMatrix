import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  time,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { employees } from "./employees";
import { pk, ratePrecision, timestamps } from "./helpers";

export const shifts = pgTable(
  "shifts",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 30 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    breakMinutes: integer("break_minutes").default(0).notNull(),
    workingHours: numeric("working_hours", ratePrecision),
    graceMinutes: integer("grace_minutes").default(0).notNull(),
    overtimeAllowed: boolean("overtime_allowed").default(false).notNull(),
    isNightShift: boolean("is_night_shift").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    uniqueIndex("shifts_company_code_unique").on(t.companyId, t.code),
    index("shifts_company_id_idx").on(t.companyId),
  ],
);

export const employeeShiftAssignments = pgTable(
  "employee_shift_assignments",
  {
    id: pk(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    shiftId: uuid("shift_id")
      .notNull()
      .references(() => shifts.id, { onDelete: "restrict" }),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    index("employee_shift_assignments_employee_id_idx").on(t.employeeId),
    index("employee_shift_assignments_shift_id_idx").on(t.shiftId),
    index("employee_shift_assignments_effective_idx").on(t.effectiveFrom, t.effectiveTo),
  ],
);

export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  company: one(companies, {
    fields: [shifts.companyId],
    references: [companies.id],
  }),
  assignments: many(employeeShiftAssignments),
}));

export const employeeShiftAssignmentsRelations = relations(employeeShiftAssignments, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeShiftAssignments.employeeId],
    references: [employees.id],
  }),
  shift: one(shifts, {
    fields: [employeeShiftAssignments.shiftId],
    references: [shifts.id],
  }),
}));
