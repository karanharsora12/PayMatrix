import { Button } from "@/components/ui/button";
import { Save, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFooterAction {
  label: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  form?: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

interface FormFooterProps {
  formId?: string;
  isDirty?: boolean;
  statusText?: string;
  onSave?: () => void;
  onClear?: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  clearLabel?: string;
  isSaving?: boolean;
  /** Extra custom actions rendered before Save */
  extraActions?: FormFooterAction[];
  className?: string;
}

export function FormFooter({
  formId,
  isDirty,
  statusText,
  onSave,
  onClear,
  onCancel,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  clearLabel = "Clear",
  isSaving = false,
  extraActions = [],
  className,
}: FormFooterProps) {
  const hint = statusText
    ? statusText
    : isDirty
      ? "Unsaved changes"
      : "All fields marked * are required";

  return (
    <div
      className={cn(
        "sticky bottom-0 z-30 mt-auto",
        "bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm",
        "border-t border-slate-200 dark:border-slate-800",
        "shadow-[0_-2px_12px_rgba(0,0,0,0.06)]",
        className,
      )}
    >
      <div className="px-6 py-3 flex items-center justify-end">
        <div className="flex items-center gap-2">
          {onClear && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-muted-foreground hover:text-foreground gap-1.5 h-8"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {clearLabel}
            </Button>
          )}

          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="gap-1.5 h-8"
            >
              <X className="h-3.5 w-3.5" />
              {cancelLabel}
            </Button>
          )}

          {/* Extra custom actions */}
          {extraActions.map((action, i) => (
            <Button
              key={i}
              type={action.type ?? "button"}
              form={action.form}
              variant={action.variant ?? "outline"}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn("gap-1.5 h-8", action.className)}
            >
              {action.icon}
              {action.loading ? "Loading..." : action.label}
            </Button>
          ))}

          <Button
            type="submit"
            form={formId}
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="gap-1.5 h-8 min-w-[110px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Saving..." : saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
