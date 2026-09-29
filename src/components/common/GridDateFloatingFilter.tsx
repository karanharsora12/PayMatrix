import React, { forwardRef, useImperativeHandle, useState } from "react";
import type { IFloatingFilterParams } from "ag-grid-community";

export const GridDateFloatingFilter = forwardRef(
  (props: IFloatingFilterParams, ref) => {
    const [currentValue, setCurrentValue] = useState("");

    useImperativeHandle(ref, () => ({
      onParentModelChanged(parentModel: any) {
        if (!parentModel) {
          setCurrentValue("");
        } else {
          setCurrentValue(parentModel.filter || "");
        }
      },
    }));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;

      // Handle backspace over slash
      if (
        currentValue.endsWith("/") &&
        currentValue.length > val.length &&
        val.endsWith("/")
      ) {
        val = val.slice(0, -1);
      }

      const digits = val.replace(/\D/g, "");
      let formatted = "";

      if (digits.length > 0) formatted += digits.substring(0, 2);
      if (digits.length > 2) formatted += "/" + digits.substring(2, 4);
      if (digits.length > 4) formatted += "/" + digits.substring(4, 8);

      setCurrentValue(formatted);

      props.parentFilterInstance((instance: any) => {
        if (!formatted) {
          instance.setModel(null);
        } else {
          instance.setModel({
            type: "contains",
            filter: formatted,
          });
        }
        props.api.onFilterChanged();
      });
    };

    return (
      <div className="flex items-center w-full h-full">
        <input
          type="text"
          placeholder="dd/mm/yyyy"
          value={currentValue}
          onChange={handleChange}
          className="w-full text-xs h-7 px-2 bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground/70 text-slate-700 dark:text-slate-200"
        />
      </div>
    );
  },
);

GridDateFloatingFilter.displayName = "GridDateFloatingFilter";
