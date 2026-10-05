import { useState } from "react";
import { useEmployeeDocumentAssignments } from "@/hooks/useEmployeeDocumentAssignments";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { FileText, Eye } from "lucide-react";
import { DocumentViewerModal } from "./DocumentViewerModal";

interface Props {
  employee: any;
}

export function EmployeePreference({ employee }: Props) {
  const { data: assignments = [], isLoading } = useEmployeeDocumentAssignments(employee?.id || "");
  const [viewingDocument, setViewingDocument] = useState<any>(null);

  if (isLoading) {
    return <div className="text-center p-8">Loading assigned documents...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Assigned Documents</CardTitle>
          <CardDescription>
            Documents and letters assigned to this employee over their lifecycle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
              No documents assigned yet.
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment: any) => (
                <div
                  key={assignment.id}
                  className="flex items-start justify-between p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex gap-4">
                    <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{assignment.document?.name}</h4>
                      <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Assigned: {formatDate(assignment.assignedDate)}</span>
                        {assignment.assignmentReason && (
                          <span>Reason: {assignment.assignmentReason}</span>
                        )}
                      </div>
                      {assignment.remarks && (
                        <div className="text-sm mt-2 text-muted-foreground italic">
                          "{assignment.remarks}"
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant={
                        assignment.status === "COMPLETED"
                          ? "success"
                          : assignment.status === "PENDING"
                          ? "secondary"
                          : "default"
                      }
                    >
                      {assignment.status}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setViewingDocument(assignment)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DocumentViewerModal 
        isOpen={!!viewingDocument}
        onClose={() => setViewingDocument(null)}
        assignment={viewingDocument}
        employee={employee}
      />
    </>
  );
}
