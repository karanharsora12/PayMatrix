import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  disabled?: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedValueNode?: React.ReactNode;
  registerItem: (value: string, node: React.ReactNode) => void;
}>({
  open: false,
  setOpen: () => {},
  searchQuery: "",
  setSearchQuery: () => {},
  registerItem: () => {},
});

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  name?: string;
  children?: React.ReactNode;
}

const Select = ({
  value,
  onValueChange,
  defaultValue,
  disabled,
  children,
  onOpenChange,
  open: controlledOpen,
  name,
}: SelectProps) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue || "",
  );
  const actualValue = value !== undefined ? value : uncontrolledValue;

  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;

  const [searchQuery, setSearchQuery] = React.useState("");
  const [items, setItems] = React.useState<Record<string, React.ReactNode>>({});

  const actualOnValueChange = React.useCallback(
    (val: string) => {
      setUncontrolledValue(val);
      onValueChange?.(val);
    },
    [onValueChange],
  );

  const setOpen = React.useCallback(
    (o: boolean) => {
      setUncontrolledOpen(o);
      onOpenChange?.(o);
      if (!o) {
        setSearchQuery("");
      }
    },
    [onOpenChange],
  );

  const registerItem = React.useCallback(
    (val: string, node: React.ReactNode) => {
      setItems((prev) => {
        if (prev[val] === node) return prev;
        return { ...prev, [val]: node };
      });
    },
    [],
  );

  return (
    <SelectContext.Provider
      value={{
        value: actualValue,
        onValueChange: actualOnValueChange,
        open,
        setOpen,
        disabled,
        searchQuery,
        setSearchQuery,
        selectedValueNode: items[actualValue],
        registerItem,
      }}
    >
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        {children}
      </PopoverPrimitive.Root>
      {name && <input type="hidden" name={name} value={actualValue} />}
    </SelectContext.Provider>
  );
};

const SelectGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => <div ref={ref} {...props} />);

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }
>(({ className, placeholder, children, ...props }, ref) => {
  const { value, selectedValueNode } = React.useContext(SelectContext);
  return (
    <span
      ref={ref}
      className={cn("truncate block w-full", className)}
      {...props}
    >
      {children !== undefined ? children : (value ? selectedValueNode || value : placeholder || "")}
    </span>
  );
});
SelectValue.displayName = "SelectValue";

const SelectTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { open, disabled, searchQuery, setSearchQuery } =
    React.useContext(SelectContext);

  return (
    <PopoverPrimitive.Trigger asChild>
      <div
        ref={ref}
        className={cn(
          "flex min-h-8 w-full items-center justify-between rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs focus-within:ring-1 focus-within:ring-primary transition-colors cursor-pointer",
          disabled && "cursor-not-allowed opacity-50 pointer-events-none",
          className,
        )}
        {...props}
      >
        <div className="flex flex-1 items-center overflow-hidden gap-2 h-full relative">
          <div
            className={cn(
              "truncate w-full flex items-center pointer-events-none",
              open ? "opacity-30 absolute inset-0" : "opacity-100",
            )}
          >
            {children}
          </div>
          {open && (
            <input
              className={cn(
                "bg-transparent outline-none w-full min-w-[2rem] placeholder:text-muted-foreground relative z-10",
              )}
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />
          )}
        </div>
        <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-2" />
      </div>
    </PopoverPrimitive.Trigger>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectScrollUpButton = () => null;
const SelectScrollDownButton = () => null;

const SelectContent = React.forwardRef<HTMLDivElement, any>(
  ({ className, children, position, ...props }, ref) => {
    const { searchQuery, open } = React.useContext(SelectContext);

    const filteredChildren = React.useMemo(() => {
      if (!searchQuery) return children;

      const extractText = (node: React.ReactNode): string => {
        if (typeof node === "string" || typeof node === "number")
          return String(node);
        if (React.isValidElement(node)) return extractText((node.props as any).children);
        if (Array.isArray(node)) return node.map(extractText).join("");
        return "";
      };

      return React.Children.toArray(children).map((child) => {
        if (React.isValidElement(child)) {
          const textContent = extractText(child);
          const childProps = child.props as any;
          const valueContent = childProps.value
            ? String(childProps.value)
            : "";

          if (
            textContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
            valueContent.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            return child;
          }
          return null;
        }
        return child;
      });
    }, [children, searchQuery]);

    return (
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          ref={ref}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={cn(
            "z-50 max-h-96 w-[var(--radix-popover-trigger-width)] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            !open && "hidden",
            className,
          )}
          align="start"
          sideOffset={4}
          {...props}
        >
          {filteredChildren}
          {React.Children.count(filteredChildren) === 0 && searchQuery && (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No results found.
            </div>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    );
  },
);
SelectContent.displayName = "SelectContent";

const SelectLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 py-1 text-xs font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = "SelectLabel";

const SelectItem = React.forwardRef<HTMLDivElement, any>(
  ({ className, children, value, ...props }, ref) => {
    const {
      value: selectedValue,
      onValueChange,
      setOpen,
      registerItem,
    } = React.useContext(SelectContext);
    const isSelected = selectedValue === value;

    React.useEffect(() => {
      registerItem(value, children);
    }, [value, children, registerItem]);

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-7 text-xs outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          isSelected ? "bg-accent/50 font-medium" : "",
          className,
        )}
        onClick={() => {
          onValueChange?.(value);
          setOpen(false);
        }}
        {...props}
      >
        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
          {isSelected && <Check className="h-3.5 w-3.5" />}
        </span>
        {children}
      </div>
    );
  },
);
SelectItem.displayName = "SelectItem";

const SelectSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = "SelectSeparator";

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};

export interface NativeSelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "onChange"
> {
  value?: string;
  onChange?: (val: string) => void;
  children: React.ReactNode;
  className?: string;
  placeholder?: string;
}

export function NativeSelect({
  value,
  onChange,
  children,
  className,
  placeholder,
  disabled,
}: NativeSelectProps) {
  const options: { value: string; label: React.ReactNode }[] = [];
  let foundPlaceholder = placeholder;

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === "option") {
      const childProps = child.props as any;
      const val = childProps.value;
      if (val !== undefined && val !== "") {
        options.push({ value: String(val), label: childProps.children });
      } else if (!foundPlaceholder && val === "") {
        foundPlaceholder = childProps.children as string;
      }
    }
  });

  const selectedOption = options.find((o) => o.value === value);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={foundPlaceholder}>
          {selectedOption ? selectedOption.label : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
