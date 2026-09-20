import { relations } from "drizzle-orm";
import { date, index, integer, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { pk, timestamps } from "./helpers";

export const employeeDocuments = pgTable(
  "employee_documents",
  {
    id: pk(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    documentType: varchar("document_type", { length: 60 }).notNull(), // e.g. AADHAAR, PAN, PASSPORT, OFFER_LETTER
    documentName: varchar("document_name", { length: 255 }).notNull(),
    fileUrl: text("file_url").notNull(),
    fileName: varchar("file_name", { length: 255 }),
    fileSize: integer("file_size"), // bytes
    mimeType: varchar("mime_type", { length: 120 }),
    issueDate: date("issue_date"),
    expiryDate: date("expiry_date"),
    uploadedBy: uuid("uploaded_by"), // references users.id (added after users table; kept as uuid without FK to avoid cycle)
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    index("employee_documents_employee_id_idx").on(t.employeeId),
    index("employee_documents_type_idx").on(t.documentType),
  ],
);

export const employeeDocumentsRelations = relations(employeeDocuments, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeDocuments.employeeId],
    references: [employees.id],
  }),
}));
