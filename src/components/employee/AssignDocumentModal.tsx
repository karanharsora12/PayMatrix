import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { documentMasterApi } from "@/api/documentMaster";
import { useCreateDocumentAssignment } from "@/hooks/useEmployeeDocumentAssignments";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilePlus } from "lucide-react";

export function AssignDocumentModal({ employeeId }: { employeeId: string }) {
  const [open, setOpen] = useState(false);
  const [documentId, setDocumentId] = useState("");
  const [assignmentReason, setAssignmentReason] = useState("JOINING");
  const [assignedDate, setAssignedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [remarks, setRemarks] = useState("");

  const { data: docsRes } = useQuery({
    queryKey: ["documentMaster"],
    queryFn: () => documentMasterApi.list(),
  });
  const documents = (docsRes as any)?.data || [];

  const assignMutation = useCreateDocumentAssignment(employeeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentId) {
      toast.error("Validation Error", {
        description: "Please select a document.",
      });
      return;
    }

    try {
      await assignMutation.mutateAsync({
        documentId,
        assignmentReason,
        assignedDate,
        remarks,
        status: "AVAILABLE",
      });
      toast.success("Document Assigned", {
        description: "Document successfully assigned to employee.",
      });
      setOpen(false);
      setDocumentId("");
      setRemarks("");
    } catch (err: any) {
      toast.error("Assignment Failed", {
        description: err.message || "Failed to assign document.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FilePlus className="h-4 w-4 mr-2" />
          Assign Document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Document to Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Document</Label>
            <Select value={documentId} onValueChange={setDocumentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a document type" />
              </SelectTrigger>
              <SelectContent>
                {documents.map((doc: any) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assignment Reason</Label>
            <Select
              value={assignmentReason}
              onValueChange={setAssignmentReason}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="JOINING">Joining</SelectItem>
                <SelectItem value="PROMOTION">Promotion</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
                <SelectItem value="SALARY_REVISION">Salary Revision</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assigned Date</Label>
            <Input
              type="date"
              value={assignedDate}
              onChange={(e) => setAssignedDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Remarks (Optional)</Label>
            <Input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Promotion to Senior Software Engineer"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={assignMutation.isPending}>
              {assignMutation.isPending ? "Assigning..." : "Assign Document"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
