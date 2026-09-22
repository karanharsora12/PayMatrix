import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { ICellRendererParams } from "ag-grid-community";

export interface GridDeleteCellParams extends ICellRendererParams {
  onDelete: (id: any) => void;
}

export const GridDeleteCell: React.FC<GridDeleteCellParams> = (params) => {
  if (!params.data) return null;
  return (
    <div className="flex items-center gap-2 h-full">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
        onClick={() => params.onDelete(params.data.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
