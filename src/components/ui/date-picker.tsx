import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerProps {
  value?: Date | string | null;
  selected?: Date | string | null;
  onChange?: (date: Date | undefined, dateString: string) => void;
  onValueChange?: (dateString: string) => void;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
  displayFormat?: string; // default "dd/MM/yyyy"
  outputFormat?: string; // default "yyyy-MM-dd"
  id?: string;
  name?: string;
  size?: "default" | "sm" | "lg";
}

export function DatePicker({
  value,
  selected,
  onChange,
  onValueChange,
  onSelect,
  placeholder = "Pick a date",
  className,
  disabled = false,
  clearable = true,
  displayFormat = "dd/MM/yyyy",
  outputFormat = "yyyy-MM-dd",
  id,
  size = "default",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Normalize incoming value to Date object
  const dateValue = React.useMemo<Date | undefined>(() => {
    const raw = value !== undefined ? value : selected;
    if (!raw) return undefined;
    if (raw instanceof Date) {
      return isValid(raw) ? raw : undefined;
    }
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (!trimmed) return undefined;
      // Try YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        const parsed = parse(trimmed.substring(0, 10), "yyyy-MM-dd", new Date());
        if (isValid(parsed)) return parsed;
      }
      // Try DD/MM/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}/.test(trimmed)) {
        const parsed = parse(trimmed.substring(0, 10), "dd/MM/yyyy", new Date());
        if (isValid(parsed)) return parsed;
      }
      const direct = new Date(trimmed);
      return isValid(direct) ? direct : undefined;
    }
    return undefined;
  }, [value, selected]);

  const handleSelect = (newDate: Date | undefined) => {
    const dateStr = newDate ? format(newDate, outputFormat) : "";
    onSelect?.(newDate);
    onChange?.(newDate, dateStr);
    onValueChange?.(dateStr);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(undefined);
    onChange?.(undefined, "");
    onValueChange?.("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          size={size}
          className={cn(
            "w-full justify-start text-left font-normal h-9 bg-background px-3 border-input hover:bg-accent/50 transition-colors",
            !dateValue && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
          <span className="flex-1 truncate text-xs sm:text-sm">
            {dateValue ? format(dateValue, displayFormat) : placeholder}
          </span>
          {clearable && dateValue && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleClear(e as any);
                }
              }}
              className="ml-auto p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 shadow-lg border rounded-lg" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}
