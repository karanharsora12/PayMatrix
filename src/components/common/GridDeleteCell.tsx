import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { ICellRendererParams } from "ag-grid-community";
import { useAlert } from "./AlertProvider";

export interface GridDeleteCellParams extends ICellRendererParams {
  onDelete: (id: any) => void | Promise<void>;
  /** Override the confirm dialog title. Default: "Delete Record?" */
  confirmTitle?: string;
  /** Override the confirm dialog message. Default: "This action cannot be undone." */
  confirmMessage?: string;
  /** A field on data to include in the message, e.g. "name" → "Delete 'Acme Corp'?" */
  nameField?: string;
}

export const GridDeleteCell: React.FC<GridDeleteCellParams> = (params) => {
  const { confirm } = useAlert();

  if (!params.data) return null;

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

    // `onConfirm` already ran the delete if user confirmed.
    // `ok` is false if user cancelled — nothing to do.
    void ok;
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-red-600 hover:text-red-600 hover:bg-transparent dark:hover:bg-red-950/50 dark:text-red-300"
      onClick={handleClick}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
};
