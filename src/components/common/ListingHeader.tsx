import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  FileText,
  FileSpreadsheet,
  Printer,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ListingHeaderProps {
  title: string | React.ReactNode;
  subtitle?: string;
  count?: number | string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onAddNew?: () => void;
  onRefresh?: () => void | Promise<any>;
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
  addButtonText?: string;
  tabs?: {
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
  };
}

export function ListingHeader({
  title,
  subtitle,
  count,
  searchValue,
  onSearchChange,
  onAddNew,
  onRefresh,
  onExportPdf,
  onExportExcel,
  onPrint,
  addButtonText = "Add New",
  tabs,
}: ListingHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await Promise.resolve(onRefresh());
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  return (
    <div className="flex items-center justify-between pb-2 mb-3 border-b border-border">
      {/* Title or Tabs */}
      <div className="flex items-center gap-2">
        {tabs ? (
          <div className="flex items-end gap-1 px-1">
            {tabs.options.map((t) => {
              const isActive = tabs.value === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => tabs.onChange(t.value)}
                  className={cn(
                    "relative px-3 py-1.5 text-sm font-medium tracking-wide border-b-2 transition-all duration-200 rounded",
                    isActive
                      ? "text-primary bg-primary/10 border-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent",
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        ) : (
          <h1 className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-1.5">
            <span>{title}</span>
            {(subtitle || count !== undefined) && (
              <span className="text-xs font-semibold text-primary">
                {subtitle ? `(${subtitle})` : `(${count})`}
              </span>
            )}
          </h1>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {onSearchChange !== undefined && (
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search here..."
              value={searchValue || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 pr-3 h-[30px] w-48 md:w-64 text-sm rounded-sm bg-background border-input"
            />
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {onAddNew && (
            <Button
              onClick={onAddNew}
              size="icon"
              className="h-7 w-7 rounded-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-transform active:scale-95"
              title={addButtonText}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}

          {onExportPdf && (
            <Button
              onClick={onExportPdf}
              size="icon"
              className="h-7 w-7 rounded-sm bg-red-500 hover:bg-red-600 text-white shadow-sm transition-transform active:scale-95"
              title="Export PDF"
            >
              <FileText className="h-4 w-4" />
            </Button>
          )}

          {onExportExcel && (
            <Button
              onClick={onExportExcel}
              size="icon"
              className="h-7 w-7 rounded-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-transform active:scale-95"
              title="Export Excel"
            >
              <FileSpreadsheet className="h-4 w-4" />
            </Button>
          )}

          {onPrint && (
            <Button
              onClick={onPrint}
              size="icon"
              className="h-7 w-7 rounded-sm bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-transform active:scale-95"
              title="Print"
            >
              <Printer className="h-4 w-4" />
            </Button>
          )}

          {onRefresh && (
            <Button
              onClick={handleRefresh}
              size="icon"
              className="h-7 w-7 rounded-sm bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-transform active:scale-95"
              title="Refresh"
            >
              <RefreshCw
                className={cn("h-4 w-4", isRefreshing && "animate-spin")}
              />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
