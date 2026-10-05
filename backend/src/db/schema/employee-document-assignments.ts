import { relations } from "drizzle-orm";
import { index, pgTable, text, uuid, varchar, timestamp, date } from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { documentMaster } from "./document-master";
import { pk, timestamps } from "./helpers";
import { users } from "./users";

export const employeeDocumentAssignments = pgTable(
  "employee_document_assignments",
  {
    id: pk(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documentMaster.id, { onDelete: "cascade" }),
    assignmentReason: varchar("assignment_reason", { length: 100 }), // JOINING, PROMOTION, TRANSFER, SALARY_REVISION, OTHER
    assignedDate: date("assigned_date").notNull(),
    status: varchar("status", { length: 50 }).default("PENDING").notNull(), // PENDING, GENERATED, AVAILABLE, ACKNOWLEDGED, COMPLETED, REJECTED
    remarks: text("remarks"),
    createdBy: uuid("created_by")
      .references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("emp_doc_assign_emp_idx").on(t.employeeId),
    index("emp_doc_assign_doc_idx").on(t.documentId),
    index("emp_doc_assign_status_idx").on(t.status),
  ],
);

export const employeeDocumentAssignmentsRelations = relations(employeeDocumentAssignments, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeDocumentAssignments.employeeId],
    references: [employees.id],
  }),
  document: one(documentMaster, {
    fields: [employeeDocumentAssignments.documentId],
    references: [documentMaster.id],
  }),
  creator: one(users, {
    fields: [employeeDocumentAssignments.createdBy],
    references: [users.id],
  }),
}));
