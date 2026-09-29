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
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-red-600 hover:text-red-600 hover:bg-transparent dark:hover:bg-red-950/50 dark:text-red-300"
      onClick={() => params.onDelete(params.data.id)}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
};
