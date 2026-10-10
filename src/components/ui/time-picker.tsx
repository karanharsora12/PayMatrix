import * as React from "react";
import { Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface TimePickerProps {
  value?: string; // "HH:mm" (24h)
  onChange?: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  format12Hour?: boolean; // display in 12h with AM/PM (stores as 24h)
  minuteStep?: number;
}

export function TimePicker({
  value = "",
  onChange,
  placeholder = "Pick a time",
  disabled = false,
  className,
  id,
  format12Hour = true,
  minuteStep = 5,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse "HH:mm"
  const { hour24, minute } = React.useMemo(() => {
    if (!value || !value.includes(":")) {
      return { hour24: null, minute: null };
    }
    const [h, m] = value.split(":").map((v) => parseInt(v, 10));
    return {
      hour24: isNaN(h) ? null : h,
      minute: isNaN(m) ? null : m,
    };
  }, [value]);

  // Derived 12h representations
  const period: "AM" | "PM" = (hour24 ?? 9) >= 12 ? "PM" : "AM";
  const hour12 = hour24 === null ? null : hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;

  const displayString = React.useMemo(() => {
    if (hour24 === null || minute === null) return "";
    const mStr = String(minute).padStart(2, "0");
    if (!format12Hour) {
      return `${String(hour24).padStart(2, "0")}:${mStr}`;
    }
    const h12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const p = hour24 >= 12 ? "PM" : "AM";
    return `${String(h12).padStart(2, "0")}:${mStr} ${p}`;
  }, [hour24, minute, format12Hour]);

  const setTime = (newH24: number, newM: number) => {
    const formatted = `${String(newH24).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
    onChange?.(formatted);
  };

  const handleHourChange = (newHStr: string) => {
    const hNum = parseInt(newHStr, 10);
    const mNum = minute ?? 0;
    if (format12Hour) {
      let finalH24 = hNum;
      if (period === "AM") {
        finalH24 = hNum === 12 ? 0 : hNum;
      } else {
        finalH24 = hNum === 12 ? 12 : hNum + 12;
      }
      setTime(finalH24, mNum);
    } else {
      setTime(hNum, mNum);
    }
  };

  const handleMinuteChange = (newMStr: string) => {
    const mNum = parseInt(newMStr, 10);
    const hNum = hour24 ?? 9;
    setTime(hNum, mNum);
  };

  const handlePeriodChange = (newPeriod: "AM" | "PM") => {
    if (hour24 === null) {
      setTime(newPeriod === "AM" ? 9 : 13, minute ?? 0);
      return;
    }
    if (newPeriod === "AM" && hour24 >= 12) {
      setTime(hour24 - 12, minute ?? 0);
    } else if (newPeriod === "PM" && hour24 < 12) {
      setTime(hour24 + 12, minute ?? 0);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.("");
  };

  const hoursList = format12Hour
    ? Array.from({ length: 12 }, (_, i) => i + 1)
    : Array.from({ length: 24 }, (_, i) => i);

  // Minutes options: 00, 05, 10, ... 55
  const minutesList = Array.from(
    { length: Math.floor(60 / minuteStep) },
    (_, i) => i * minuteStep,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between text-left font-normal h-8 bg-background px-2.5 border-input hover:bg-accent/50 transition-colors text-xs",
            !displayString && "text-muted-foreground",
            className,
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Clock className="h-3.5 w-3.5 opacity-60 shrink-0" />
            <span className="truncate">{displayString || placeholder}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-1">
            {displayString && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="opacity-60 hover:opacity-100 hover:text-destructive p-0.5 rounded cursor-pointer transition-opacity"
                title="Clear time"
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex flex-col gap-2.5">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
            Select Time
          </div>

          <div className="flex items-center gap-2">
            {/* Hours */}
            <div className="flex flex-col gap-1 items-center">
              <span className="text-[10px] text-muted-foreground font-medium">Hr</span>
              <Select
                value={
                  format12Hour
                    ? hour12 !== null
                      ? String(hour12)
                      : "9"
                    : hour24 !== null
                      ? String(hour24)
                      : "9"
                }
                onValueChange={handleHourChange}
              >
                <SelectTrigger className="w-[60px] h-8 text-xs font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {hoursList.map((h) => (
                    <SelectItem key={h} value={String(h)} className="text-xs font-mono">
                      {String(h).padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="text-sm font-bold text-muted-foreground pt-4">:</span>

            {/* Minutes */}
            <div className="flex flex-col gap-1 items-center">
              <span className="text-[10px] text-muted-foreground font-medium">Min</span>
              <Select
                value={String(minute ?? 0)}
                onValueChange={handleMinuteChange}
              >
                <SelectTrigger className="w-[60px] h-8 text-xs font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {minutesList.map((m) => (
                    <SelectItem key={m} value={String(m)} className="text-xs font-mono">
                      {String(m).padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* AM / PM Toggle if 12h */}
            {format12Hour && (
              <div className="flex flex-col gap-1 items-center">
                <span className="text-[10px] text-muted-foreground font-medium">AM/PM</span>
                <Select
                  value={period}
                  onValueChange={(val) => handlePeriodChange(val as "AM" | "PM")}
                >
                  <SelectTrigger className="w-[62px] h-8 text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM" className="text-xs font-semibold">
                      AM
                    </SelectItem>
                    <SelectItem value="PM" className="text-xs font-semibold">
                      PM
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t mt-1 gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] px-2 text-muted-foreground"
              onClick={() => {
                const now = new Date();
                setTime(now.getHours(), Math.round(now.getMinutes() / 5) * 5 % 60);
              }}
            >
              Current Time
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 text-[11px] px-3"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
