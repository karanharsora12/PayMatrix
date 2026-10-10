import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  colorSchemeDark,
} from "ag-grid-community";
import type {
  ColDef,
  GridApi,
  GridOptions,
  IDatasource,
  IGetRowsParams,
} from "ag-grid-community";
import apiClient from "@/api/client";
import "@/styles/ag-grid.css";
import { SearchX } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

ModuleRegistry.registerModules([AllCommunityModule]);

const NoRowsOverlay = () => {
  return (
    <div
      className="flex flex-col items-center justify-center h-full w-full p-8 select-none group"
      aria-label="No records found"
    >
      <div className="relative mb-6">
        <div
          className="absolute inset-0 bg-primary/20 blur-xl rounded-full
          transition-all duration-500
          group-hover:bg-primary/30
          group-focus-within:bg-primary/30"
        />
        <div
          className="relative flex h-20 w-20 items-center justify-center rounded-2xl
          bg-gradient-to-tr from-primary/10 to-primary/5
          border border-primary/20
          shadow-sm
          transition-all duration-500
          group-hover:scale-105 group-hover:rotate-2 group-hover:border-primary/30
          group-focus-within:scale-105 group-focus-within:rotate-2 group-focus-within:border-primary/30
          active:scale-95"
        >
          <SearchX
            className="h-10 w-10 text-primary
            transition-transform duration-500
            group-hover:scale-110
            group-focus-within:scale-110
            active:scale-90"
            strokeWidth={1.5}
          />
        </div>
      </div>
      <div className="text-center space-y-2 max-w-sm">
        <h3
          className="text-lg font-semibold tracking-tight text-foreground
          transition-colors
          group-hover:text-primary
          group-focus-within:text-primary"
        >
          No records found
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We couldn't find any data matching your criteria. Try adjusting your
          search or filters to see results.
        </p>
      </div>
    </div>
  );
};

export interface DataGridProps<TData = any> {
  rowData?: TData[];
  columnDefs: ColDef[];
  gridOptions?: GridOptions;
  onGridReady?: (params: any) => void;
  pinnedBottomRowData?: any[];
  apiName?: string;
  apiInput?: Record<string, unknown>;
  infiniteScroll?: boolean;
  pageSize?: number;
}

interface GridApiResponse<TData> {
  data?: TData[];
  summary?: any[];
  pagination?: {
    total?: number;
  };
}

const getGridResponse = <TData,>(payload: unknown): GridApiResponse<TData> => {
  if (Array.isArray(payload)) return { data: payload };

  if (payload && typeof payload === "object") {
    const response = payload as GridApiResponse<TData>;
    return {
      data: Array.isArray(response.data) ? response.data : [],
      summary: Array.isArray(response.summary) ? response.summary : undefined,
      pagination: response.pagination,
    };
  }

  return { data: [] };
};

// Light theme — tuned to match the app's clean design system
// Light theme — tuned to match the app's primary branding with distinct tinted header & filter row
const lightTheme = themeQuartz.withParams({
  backgroundColor: "hsl(0 0% 100%)",
  foregroundColor: "hsl(240 10% 3.9%)",
  headerBackgroundColor: "color-mix(in srgb, hsl(var(--primary)) 14%, white)",
  headerTextColor: "hsl(240 10% 3.9%)",
  headerFontWeight: 600,
  headerFontSize: 13,
  fontSize: 13,
  borderColor: "hsl(240 5.9% 90%)",
  accentColor: "hsl(var(--primary))",
  rowBorder: true,
  columnBorder: true,
  rowHoverColor: "color-mix(in srgb, hsl(var(--primary)) 8%, white)",
  selectedRowBackgroundColor:
    "color-mix(in srgb, hsl(var(--primary)) 12%, white)",
  rangeSelectionBackgroundColor:
    "color-mix(in srgb, hsl(var(--primary)) 15%, white)",
  rangeSelectionBorderColor: "hsl(var(--primary))",
  oddRowBackgroundColor: "color-mix(in srgb, hsl(var(--primary)) 3%, white)",
  borderRadius: 6,
  wrapperBorderRadius: 6,
  cellHorizontalPadding: 12,
  headerCellHoverBackgroundColor:
    "color-mix(in srgb, hsl(var(--primary)) 22%, white)",
  filterToolPanelGroupIndent: 12,
  iconSize: 16,
  spacing: 4,
  wrapperBorder: true,
  headerColumnBorder: true,
  headerColumnBorderHeight: "100%",
});

// Dark theme — matches the app's dark palette with clear card/surface separation
const darkTheme = themeQuartz.withPart(colorSchemeDark).withParams({
  backgroundColor: "hsl(222.2 47.4% 9.5%)",
  foregroundColor: "hsl(210 40% 98%)",
  headerBackgroundColor: "color-mix(in srgb, hsl(var(--primary)) 32%, black)",
  headerTextColor: "color-mix(in srgb, hsl(var(--primary)) 45%, white)",
  headerFontWeight: 600,
  headerFontSize: 13,
  fontSize: 13,
  borderColor: "hsl(217.2 32.6% 18.5%)",
  accentColor: "hsl(var(--primary))",
  rowBorder: true,
  columnBorder: true,
  rowHoverColor: "color-mix(in srgb, hsl(var(--primary)) 15%, transparent)",
  selectedRowBackgroundColor:
    "color-mix(in srgb, hsl(var(--primary)) 25%, transparent)",
  rangeSelectionBackgroundColor:
    "color-mix(in srgb, hsl(var(--primary)) 20%, transparent)",
  rangeSelectionBorderColor: "hsl(var(--primary))",
  oddRowBackgroundColor:
    "color-mix(in srgb, hsl(var(--primary)) 4%, transparent)",
  borderRadius: 6,
  wrapperBorderRadius: 6,
  cellHorizontalPadding: 12,
  headerCellHoverBackgroundColor:
    "color-mix(in srgb, hsl(var(--primary)) 40%, black)",
  filterToolPanelGroupIndent: 12,
  iconSize: 16,
  spacing: 4,
  wrapperBorder: true,
  headerColumnBorder: true,
  headerColumnBorderHeight: "100%",
});

export const DataGrid = React.forwardRef<AgGridReact, DataGridProps>(
  (
    {
      rowData,
      columnDefs,
      gridOptions,
      onGridReady,
      pinnedBottomRowData,
      apiName,
      apiInput,
      infiniteScroll,
      pageSize = 50,
    },
    ref,
  ) => {
    const { resolvedTheme, primaryColor } = useTheme();
    const gridApiRef = useRef<GridApi | null>(null);
    const [apiRowData, setApiRowData] = useState<any[]>([]);
    const [apiSummary, setApiSummary] = useState<any[] | undefined>();
    const isInfiniteScroll = infiniteScroll ?? true;
    const usesApi = rowData === undefined && Boolean(apiName);
    const usesInfiniteScrollApi = usesApi && isInfiniteScroll;
    const { onGridReady: gridOptionsOnGridReady, ...restGridOptions } =
      gridOptions || {};

    const defaultColDef = useMemo<ColDef>(() => {
      return {
        filter: true,
        floatingFilter: true,
        sortable: true,
        resizable: true,
        suppressFloatingFilterButton: false,
        wrapHeaderText: true,
        autoHeaderHeight: true,
        tooltipValueGetter: (p) => p.value,
      };
    }, []);

    const isDark = resolvedTheme === "dark";
    const theme = useMemo(() => {
      return isDark ? darkTheme : lightTheme;
    }, [isDark, primaryColor]);

    const datasource = useMemo<IDatasource | undefined>(() => {
      if (!usesInfiniteScrollApi) return undefined;

      let isDestroyed = false;

      return {
        getRows: async (params: IGetRowsParams) => {
          const requestedPageSize = params.endRow - params.startRow;
          const sort = params.sortModel[0];

          try {
            const response = await apiClient.post(apiName!, {
              ...apiInput,
              page: Math.floor(params.startRow / requestedPageSize) + 1,
              limit: requestedPageSize,
              sortField: sort?.colId,
              sortDirection: sort?.sort,
            });
            if (isDestroyed) return;

            const result = getGridResponse<any>(response.data);
            if (result.summary) setApiSummary(result.summary);
            const lastRow = result.pagination?.total;
            params.successCallback(result.data || [], lastRow);
          } catch (error) {
            if (!isDestroyed) {
              console.error(`Unable to load grid data from ${apiName}`, error);
              params.failCallback();
            }
          }
        },
        destroy: () => {
          isDestroyed = true;
        },
      };
    }, [apiInput, apiName, usesInfiniteScrollApi]);

    useEffect(() => {
      if (!usesApi || usesInfiniteScrollApi || !apiName) return;

      let isCurrent = true;
      apiClient
        .post(apiName, apiInput)
        .then((response) => {
          if (!isCurrent) return;
          const result = getGridResponse<any>(response.data);
          setApiRowData(result.data || []);
          setApiSummary(result.summary);
        })
        .catch((error) => {
          if (isCurrent) {
            console.error(`Unable to load grid data from ${apiName}`, error);
            setApiRowData([]);
          }
        });

      return () => {
        isCurrent = false;
      };
    }, [apiInput, apiName, usesApi, usesInfiniteScrollApi]);

    useEffect(() => {
      if (usesInfiniteScrollApi && datasource && gridApiRef.current) {
        gridApiRef.current.setGridOption("datasource", datasource);
      }
    }, [datasource, usesInfiniteScrollApi]);

    const handleGridReady = (params: any) => {
      gridApiRef.current = params.api;
      if (usesInfiniteScrollApi && datasource) {
        params.api.setGridOption("datasource", datasource);
      }
      gridOptionsOnGridReady?.(params);
      onGridReady?.(params);
    };

    const resolvedRowData =
      rowData ?? (usesInfiniteScrollApi ? undefined : apiRowData);

    return (
      <div className="h-full w-full ag-grid-custom">
        <AgGridReact
          ref={ref}
          theme={theme}
          rowData={resolvedRowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowModelType={usesInfiniteScrollApi ? "infinite" : "clientSide"}
          pagination={!isInfiniteScroll}
          paginationPageSize={isInfiniteScroll ? pageSize : 20}
          cacheBlockSize={usesInfiniteScrollApi ? pageSize : undefined}
          onGridReady={handleGridReady}
          rowSelection="single"
          animateRows={true}
          pinnedBottomRowData={pinnedBottomRowData ?? apiSummary}
          noRowsOverlayComponent={NoRowsOverlay}
          {...restGridOptions}
        />
      </div>
    );
  },
);

DataGrid.displayName = "DataGrid";
