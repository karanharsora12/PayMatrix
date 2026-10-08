import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen } from "lucide-react";
import type { DashboardDocuments } from "@/api/dashboard";
import { EmptyState, StatTile } from "./helpers";

export function DocumentsCard({ documents }: { documents: DashboardDocuments }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Documents</CardTitle>
        <Badge variant="outline">
          {documents.scope === "SELF" ? "My documents" : "Company wide"}
        </Badge>
      </CardHeader>
      <CardContent>
        {documents.total === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No documents assigned"
            description="Assigned documents will appear here with their acknowledgement status."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Total" value={documents.total} accent="text-blue-600" />
            <StatTile
              label="Pending"
              value={documents.pending}
              accent="text-amber-600"
            />
            <StatTile
              label="Available"
              value={documents.available}
              accent="text-violet-600"
            />
            <StatTile
              label="Completed"
              value={documents.completed}
              hint={`${documents.acknowledged} acknowledged`}
              accent="text-emerald-600"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
