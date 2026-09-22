import { designations } from "@/mock/data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useMemo } from "react";
import type { ColDef } from "ag-grid-community";
import { DataGrid } from "@/components/common/DataGrid";
export default function Designations() {
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "code",
        headerName: "Code",
        width: 120,
        cellClass: "font-mono text-xs",
      },
      { field: "name", headerName: "Name", flex: 1 },
      { field: "department", headerName: "Department", flex: 1 },
      {
        field: "grade",
        headerName: "Grade",
        width: 120,
        cellRenderer: (params: any) => (
          <Badge variant="outline">{params.value}</Badge>
        ),
      },
      {
        field: "minSalary",
        headerName: "Min",
        width: 150,
        valueFormatter: (params: any) => formatCurrency(params.value),
      },
      {
        field: "maxSalary",
        headerName: "Max",
        width: 150,
        valueFormatter: (params: any) => formatCurrency(params.value),
      },
      {
        field: "status",
        headerName: "Status",
        width: 150,
        cellRenderer: (params: any) => (
          <Badge variant="success">{params.value}</Badge>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-xl font-semibold">Designations</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Designation
        </Button>
      </div>
      <div className="h-[500px]">
        <DataGrid rowData={designations} columnDefs={columnDefs} />
      </div>
    </div>
  );
}
