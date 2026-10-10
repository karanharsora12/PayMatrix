import React, { useState } from "react";
import {
  PRIMARY_COLOR_PRESETS,
  DEFAULT_PRIMARY_COLOR_ID,
  deriveCustomPrimary,
} from "@/constants/colorPresets";
import { useTheme } from "@/context/ThemeContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Palette, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export function PrimaryColorPicker() {
  const { primaryColor, setPrimaryColor, resetPrimaryColor, isCustomColor } = useTheme();
  const [customHex, setCustomHex] = useState(isCustomColor ? primaryColor : "#2563eb");
  const [customError, setCustomError] = useState("");

  const handleApplyCustomHex = () => {
    let cleanHex = customHex.trim();
    if (!cleanHex.startsWith("#")) {
      cleanHex = `#${cleanHex}`;
    }

    const derived = deriveCustomPrimary(cleanHex);
    if (!derived) {
      setCustomError("Enter a valid 6-character hex code (e.g. #2563eb)");
      return;
    }

    setCustomError("");
    setPrimaryColor(cleanHex);
  };

  const activePreset = PRIMARY_COLOR_PRESETS.find((p) => p.id === primaryColor);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title={`Primary Color: ${activePreset?.name || (isCustomColor ? "Custom" : "Theme Color")}`}
          className="relative text-foreground hover:bg-muted"
        >
          <Palette className="h-4 w-4" />
          {/* Subtle colored dot indicator */}
          <span
            className="absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full border border-background shadow-xs transition-colors"
            style={{
              backgroundColor: isCustomColor
                ? primaryColor
                : activePreset?.hex || "hsl(var(--primary))",
            }}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-72 p-4 shadow-xl border-border bg-popover text-popover-foreground rounded-xl"
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Primary Accent
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Customize the app's brand theme
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetPrimaryColor}
            className="text-[11px] h-7 px-2 text-muted-foreground hover:text-foreground"
            title="Reset to default indigo theme"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>

        {/* Preset Colors Grid */}
        <div className="py-3">
          <div className="text-[11px] font-semibold text-muted-foreground mb-2">
            Preset Palettes
          </div>
          <div className="grid grid-cols-5 gap-2.5">
            {PRIMARY_COLOR_PRESETS.map((preset) => {
              const isSelected = primaryColor === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setCustomError("");
                    setPrimaryColor(preset.id);
                  }}
                  title={preset.name}
                  className={cn(
                    "group relative flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all select-none",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40"
                      : "border-border/60 hover:border-border hover:bg-muted/40"
                  )}
                >
                  <span
                    className="h-6 w-6 rounded-full flex items-center justify-center shadow-xs transition-transform group-hover:scale-105"
                    style={{ backgroundColor: preset.hex }}
                  >
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-white stroke-[3] drop-shadow-xs" />
                    )}
                  </span>
                  <span className="text-[9.5px] font-medium text-muted-foreground mt-1 tracking-tight truncate w-full text-center">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Hex Picker */}
        <div className="pt-3 border-t border-border">
          <div className="text-[11px] font-semibold text-muted-foreground mb-1.5">
            Custom Hex Color
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <input
                type="color"
                value={isCustomColor ? primaryColor : activePreset?.hex || "#2563eb"}
                onChange={(e) => {
                  setCustomHex(e.target.value);
                  setCustomError("");
                  setPrimaryColor(e.target.value);
                }}
                className="h-8 w-8 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
                title="Choose color"
              />
            </div>
            <Input
              type="text"
              placeholder="#2563eb"
              value={customHex}
              onChange={(e) => {
                setCustomHex(e.target.value);
                setCustomError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleApplyCustomHex();
                }
              }}
              className="h-8 text-xs font-mono uppercase px-2"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={handleApplyCustomHex}
              className="h-8 text-xs px-2.5 shrink-0"
            >
              Apply
            </Button>
          </div>
          {customError && (
            <p className="text-[10px] text-destructive mt-1 font-medium leading-tight">
              {customError}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
