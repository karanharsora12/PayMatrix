import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  FileText,
  Calendar,
  User,
  Building2,
  CheckCircle2,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  assignment: any;
  employee: any;
}

export function DocumentViewerModal({
  isOpen,
  onClose,
  assignment,
  employee,
}: Props) {
  if (!assignment || !employee) return null;

  const doc = assignment.document;

  const resolvePath = (obj: any, path: string): string => {
    try {
      const cleanPath = path.trim();

      if (
        cleanPath === "employeeName" ||
        cleanPath === "Employee" ||
        cleanPath === "candidateName"
      ) {
        return `${obj.firstName || ""} ${obj.lastName || ""}`.trim();
      }

      if (cleanPath === "company.name") {
        return obj.company?.name || "PayMatrix Technologies";
      }
      if (cleanPath === "company.address") {
        return (
          obj.company?.address ||
          [obj.company?.city, obj.company?.state, obj.company?.country]
            .filter(Boolean)
            .join(", ") ||
          "Corporate Headquarters"
        );
      }
      if (cleanPath === "company.email") {
        return obj.company?.email || "hr@paymatrix.com";
      }
      if (cleanPath === "company.phone") {
        return obj.company?.phone || "+91-9876543210";
      }
      if (cleanPath === "address") {
        return (
          obj.address ||
          [obj.branch?.name, obj.branch?.city].filter(Boolean).join(", ") ||
          "—"
        );
      }

      const val = cleanPath
        .split(".")
        .reduce((acc, part) => acc && acc[part], obj);
      if (val === undefined || val === null) return "";
      if (typeof val === "string" && val.match(/^\d{4}-\d{2}-\d{2}/)) {
        return new Date(val).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      }
      return String(val);
    } catch {
      return "";
    }
  };

  let content = doc?.templateContent || "";

  // Replace all {{token}} matches in content
  content = content.replace(
    /\{\{\s*([\w.]+)\s*\}\}/g,
    (_match: string, key: string) => {
      const val = resolvePath(employee, key);
      return val !== undefined && val !== null ? val : "";
    },
  );

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${doc?.name || "Document"} - ${employee.firstName} ${employee.lastName}</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 40px; 
              line-height: 1.6;
              color: #222;
              max-width: 800px;
              margin: 0 auto;
            }
            @media print {
              body { padding: 0; }
              @page { margin: 1.5cm; }
            }
            table { border-collapse: collapse; width: 100%; margin: 16px 0; }
            td, th { border: 1px solid #ccc; padding: 8px 12px; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>{doc?.name || "Document Preview"}</span>
            {assignment.assignmentReason && (
              <Badge variant="secondary" className="text-xs font-normal">
                {assignment.assignmentReason}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs flex flex-wrap items-center gap-2 text-muted-foreground pt-0.5">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <User className="h-3 w-3 text-primary" />
              {employee.firstName} {employee.lastName}
            </span>
            <span>•</span>
            <span>
              Code:{" "}
              <span className="font-mono">{employee.employeeCode || "—"}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Assigned:{" "}
              {assignment.assignedDate
                ? new Date(assignment.assignedDate).toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    },
                  )
                : "—"}
            </span>
            {employee.designation?.name && (
              <>
                <span>•</span>
                <span>{employee.designation.name}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Preview Canvas Container matching EmailTemplates modal aesthetic */}
        <div className="space-y-3 py-1">
          <div className="border rounded-lg bg-slate-50/70 dark:bg-slate-900/40 p-4 overflow-y-auto max-h-[60vh] shadow-inner">
            {content ? (
              <div
                className="bg-white dark:bg-card text-foreground rounded-md shadow-sm border border-slate-200/80 dark:border-slate-800 p-8 md:p-12 mx-auto max-w-3xl"
                style={{
                  fontFamily:
                    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  fontSize: "13px",
                  lineHeight: "1.75",
                }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-3">
                <Building2 className="h-10 w-10 opacity-30" />
                <p className="text-sm">
                  No template content configured for this document.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end border-t pt-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={handlePrint}
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Export PDF
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
