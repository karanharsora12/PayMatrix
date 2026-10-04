import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean;
  hidden?: boolean;
}

export interface ActionMenuProps {
  items?: ActionMenuItem[];
  children?: React.ReactNode;
  trigger?: React.ReactNode;
  triggerVariant?: "ghost" | "outline" | "default" | "secondary";
  triggerSize?: "sm" | "default" | "icon";
  triggerClassName?: string;
  orientation?: "horizontal" | "vertical";
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  contentClassName?: string;
}

export function ActionMenu({
  items,
  children,
  trigger,
  triggerVariant = "ghost",
  triggerSize = "sm",
  triggerClassName,
  orientation = "horizontal",
  align = "end",
  side = "bottom",
  contentClassName,
}: ActionMenuProps) {
  const Icon = orientation === "vertical" ? MoreVertical : MoreHorizontal;

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            variant={triggerVariant}
            size={triggerSize}
            className={cn(
              "h-7 w-7 p-0 rounded-md hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring text-muted-foreground hover:text-foreground",
              triggerClassName
            )}
            title="More actions"
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        )}
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align={align}
          side={side}
          sideOffset={4}
          className={cn(
            "z-50 min-w-[9.5rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 text-xs",
            contentClassName
          )}
        >
          {items
            ? items
                .filter((item) => !item.hidden)
                .map((item, index) => (
                  <React.Fragment key={index}>
                    {item.separator && index > 0 && (
                      <DropdownMenuPrimitive.Separator className="-mx-1 my-1 h-px bg-muted" />
                    )}
                    <DropdownMenuPrimitive.Item
                      disabled={item.disabled}
                      onSelect={(e) => {
                        e.preventDefault();
                        if (!item.disabled) {
                          item.onClick();
                        }
                      }}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                        item.destructive &&
                          "text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
                      )}
                    >
                      {item.icon && (
                        <span className="h-3.5 w-3.5 shrink-0 opacity-70">
                          {item.icon}
                        </span>
                      )}
                      <span className="flex-1 truncate">{item.label}</span>
                    </DropdownMenuPrimitive.Item>
                  </React.Fragment>
                ))
            : children}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

export const ActionMenuItem = DropdownMenuPrimitive.Item;
export const ActionMenuSeparator = DropdownMenuPrimitive.Separator;
