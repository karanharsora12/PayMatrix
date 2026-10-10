import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { ICellRendererParams } from "ag-grid-community";
import { useAlert } from "./AlertProvider";
import { useAuth } from "@/context/AuthContext";

export interface GridDeleteCellParams extends ICellRendererParams {
  onDelete: (id: any) => void | Promise<void>;
  /** Override the confirm dialog title. Default: "Delete Record?" */
  confirmTitle?: string;
  /** Override the confirm dialog message. Default: "This action cannot be undone." */
  confirmMessage?: string;
  /** A field on data to include in the message, e.g. "name" → "Delete 'Acme Corp'?" */
  nameField?: string;
  /** Permission string to check, e.g. "departments.delete" */
  perm?: string;
  /** Module name to automatically check `${module}.delete` */
  module?: string;
}

export const GridDeleteCell: React.FC<GridDeleteCellParams> = (params) => {
  const { confirm } = useAlert();
  const { hasPermission } = useAuth();

  if (!params.data) return null;

  // Enforce delete permission if configured
  if (params.perm && !hasPermission(params.perm)) {
    return null;
  }
  if (params.module && !hasPermission(`${params.module}.delete`)) {
    return null;
  }

  const recordName = params.nameField ? params.data[params.nameField] : undefined;

  const handleClick = async () => {
    const message = recordName
      ? `Are you sure you want to delete "${recordName}"? This action cannot be undone.`
      : (params.confirmMessage ?? "This action cannot be undone.");

    const ok = await confirm({
      title: params.confirmTitle ?? "Delete Record?",
      message,
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        await params.onDelete(params.data.id);
      },
    });

    void ok;
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
      onClick={handleClick}
      title="Delete"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
};
