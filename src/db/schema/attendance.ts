import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { employees } from "./employees";
import { attendancePunchTypeEnum, attendanceSourceEnum, attendanceStatusEnum } from "./enums";
import { pk, timestamps } from "./helpers";

export const attendance = pgTable(
  "attendance",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    attendanceDate: date("attendance_date").notNull(),

    checkIn: timestamp("check_in", { withTimezone: true }),
    checkOut: timestamp("check_out", { withTimezone: true }),

    workingMinutes: integer("working_minutes"),
    breakMinutes: integer("break_minutes").default(0),
    overtimeMinutes: integer("overtime_minutes").default(0),

    status: attendanceStatusEnum("status").default("PRESENT").notNull(),

    remarks: text("remarks"),

    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    uniqueIndex("attendance_employee_date_unique").on(t.employeeId, t.attendanceDate),
    index("attendance_company_id_idx").on(t.companyId),
    index("attendance_employee_id_idx").on(t.employeeId),
    index("attendance_date_idx").on(t.attendanceDate),
    index("attendance_status_idx").on(t.status),
    index("attendance_company_date_idx").on(t.companyId, t.attendanceDate),
  ],
);

export const attendanceLogs = pgTable(
  "attendance_logs",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    punchTime: timestamp("punch_time", { withTimezone: true }).notNull(),
    punchType: attendancePunchTypeEnum("punch_type").notNull(),
    source: attendanceSourceEnum("source").default("BIOMETRIC").notNull(),
    deviceId: varchar("device_id", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("attendance_logs_company_id_idx").on(t.companyId),
    index("attendance_logs_employee_id_idx").on(t.employeeId),
    index("attendance_logs_punch_time_idx").on(t.punchTime),
    index("attendance_logs_employee_punch_idx").on(t.employeeId, t.punchTime),
  ],
);

export const attendanceRelations = relations(attendance, ({ one }) => ({
  company: one(companies, {
    fields: [attendance.companyId],
    references: [companies.id],
  }),
  employee: one(employees, {
    fields: [attendance.employeeId],
    references: [employees.id],
  }),
}));

export const attendanceLogsRelations = relations(attendanceLogs, ({ one }) => ({
  company: one(companies, {
    fields: [attendanceLogs.companyId],
    references: [companies.id],
  }),
  employee: one(employees, {
    fields: [attendanceLogs.employeeId],
    references: [employees.id],
  }),
}));
