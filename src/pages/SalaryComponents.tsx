import type { SalaryComponentItem } from "@/api/salaryComponents";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingCard } from "@/components/common/ListingCard";
import { ListingHeader } from "@/components/common/ListingHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import {
  useCreateSalaryComponent,
  useDeleteSalaryComponent,
  useSalaryComponents,
  useUpdateSalaryComponent,
} from "@/hooks/useSalary";
import { gridExportExcel, gridExportPdf, gridPrint } from "@/lib/gridExport";
import { formatCurrency } from "@/lib/utils";
import type { ColDef } from "ag-grid-community";
import type { AgGridReact } from "ag-grid-react";
import { Calculator, Edit2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export default function SalaryComponents() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SalaryComponentItem | null>(
    null,
  );
  const [editingComponent, setEditingComponent] =
    useState<SalaryComponentItem | null>(null);

  // Form state
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [componentType, setComponentType] = useState<any>("EARNING");
  const [calculationType, setCalculationType] = useState<any>("FIXED");
  const [defaultAmount, setDefaultAmount] = useState("");
  const [defaultPercentage, setDefaultPercentage] = useState("");
  const [calculationBasis, setCalculationBasis] = useState("BASIC");
  const [formula, setFormula] = useState("");
  const [isTaxable, setIsTaxable] = useState(true);
  const [isStatutory, setIsStatutory] = useState(false);
  const [isRecurring, setIsRecurring] = useState(true);
  const [displayOrder, setDisplayOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const gridRef = useRef<AgGridReact>(null);

  // Queries & Mutations
  const {
    data: resp,
    isLoading,
    refetch,
  } = useSalaryComponents({
    limit: 100,
    search: search || undefined,
    componentType: activeTab === "ALL" ? undefined : activeTab,
  });

  const components = resp?.data || [];
  const createMutation = useCreateSalaryComponent();
  const updateMutation = useUpdateSalaryComponent();
  const deleteMutation = useDeleteSalaryComponent();

  const resetForm = () => {
    setEditingComponent(null);
    setCode("");
    setName("");
    setDescription("");
    setComponentType("EARNING");
    setCalculationType("FIXED");
    setDefaultAmount("");
    setDefaultPercentage("");
    setCalculationBasis("BASIC");
    setFormula("");
    setIsTaxable(true);
    setIsStatutory(false);
    setIsRecurring(true);
    setDisplayOrder("0");
    setIsActive(true);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (comp: SalaryComponentItem) => {
    setEditingComponent(comp);
    setCode(comp.code);
    setName(comp.name);
    setDescription(comp.description || "");
    setComponentType(comp.componentType);
    setCalculationType(comp.calculationType);
    setDefaultAmount(
      comp.defaultAmount != null ? String(comp.defaultAmount) : "",
    );
    setDefaultPercentage(
      comp.defaultPercentage != null ? String(comp.defaultPercentage) : "",
    );
    setCalculationBasis(comp.calculationBasis || "BASIC");
    setFormula(comp.formula || "");
    setIsTaxable(comp.isTaxable);
    setIsStatutory(comp.isStatutory);
    setIsRecurring(comp.isRecurring);
    setDisplayOrder(String(comp.displayOrder ?? 0));
    setIsActive(comp.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Component name is required");
      return;
    }

    const payload: any = {
      name: name.trim(),
      description: description.trim() || undefined,
      componentType,
      calculationType,
      defaultAmount: defaultAmount ? parseFloat(defaultAmount) : undefined,
      defaultPercentage: defaultPercentage
        ? parseFloat(defaultPercentage)
        : undefined,
      calculationBasis:
        calculationType === "PERCENTAGE" ? calculationBasis : undefined,
      formula: calculationType === "FORMULA" ? formula : undefined,
      isTaxable,
      isStatutory,
      isRecurring,
      displayOrder: parseInt(displayOrder, 10) || 0,
      isActive,
    };

    if (editingComponent) {
      await updateMutation.mutateAsync({
        id: editingComponent.id,
        data: payload,
      });
    } else {
      if (!code.trim()) {
        toast.error("Component code is required");
        return;
      }
      payload.code = code.trim().toUpperCase();
      await createMutation.mutateAsync(payload);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const componentsColDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "displayOrder",
        headerName: "#",
        width: 70,
        valueGetter: (p) =>
          p.data.displayOrder ??
          (p.node?.rowIndex != null ? p.node.rowIndex + 1 : 0),
      },
      { field: "code", headerName: "Code", width: 100 },
      {
        field: "name",
        headerName: "Component Name",
        width: 150,
      },
      {
        field: "componentType",
        headerName: "Type",
        width: 150,
      },
      {
        field: "calculationType",
        headerName: "Calculation",
        width: 150,
      },
      {
        field: "defaultRate",
        headerName: "Default Rate / Value",
        width: 100,
      },
      {
        field: "flags",
        headerName: "Flags",
        width: 60,
      },
      {
        field: "isActive",
        headerName: "Status",
        width: 100,
      },
      {
        headerName: "",
        width: 60,
        sortable: false,
        filter: false,
        cellRenderer: (p: any) => (
          <div className="flex items-center justify-end gap-1 h-full">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteTarget(p.data)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <ListingCard>
        <ListingHeader
          title="Salary Components"
          subtitle="Configure flexible earnings, deductions, statutory contributions, and reimbursements."
          count={components.length}
          searchValue={search}
          onSearchChange={setSearch}
          onAddNew={handleOpenAdd}
          addButtonText="Add Component"
          onRefresh={refetch}
          onExportExcel={() =>
            gridRef.current?.api &&
            gridExportExcel(gridRef.current.api, "salary_components.csv")
          }
          onExportPdf={() =>
            gridRef.current?.api &&
            gridExportPdf(gridRef.current.api, "Salary Components")
          }
          onPrint={() =>
            gridRef.current?.api &&
            gridPrint(gridRef.current.api, "Salary Components")
          }
          tabs={{
            options: [
              { label: "All", value: "ALL" },
              { label: "Earnings", value: "EARNING" },
              { label: "Deductions", value: "DEDUCTION" },
              {
                label: "Employer Contributions",
                value: "EMPLOYER_CONTRIBUTION",
              },
              { label: "Reimbursements", value: "REIMBURSEMENT" },
            ],
            value: activeTab,
            onChange: setActiveTab,
          }}
        />

        <div className="h-[500px]">
          <DataGrid
            ref={gridRef}
            rowData={components}
            columnDefs={componentsColDefs}
            gridOptions={{
              onRowDoubleClicked: (params) => handleOpenEdit(params.data),
            }}
          />
        </div>
      </ListingCard>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Salary Component</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="code">Component Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g. HRA, BASIC, PF"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  disabled={Boolean(editingComponent)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Component Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. House Rent Allowance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc">Description</Label>
              <Input
                id="desc"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Component Type *</Label>
                <NativeSelect
                  value={componentType}
                  onChange={(val) => setComponentType(val)}
                >
                  <option value="EARNING">Earning</option>
                  <option value="DEDUCTION">Deduction</option>
                  <option value="EMPLOYER_CONTRIBUTION">
                    Employer Contribution
                  </option>
                  <option value="REIMBURSEMENT">Reimbursement</option>
                </NativeSelect>
              </div>

              <div className="space-y-1.5">
                <Label>Calculation Type *</Label>
                <NativeSelect
                  value={calculationType}
                  onChange={(val) => setCalculationType(val)}
                >
                  <option value="FIXED">Fixed Amount</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FORMULA">Formula Expression</option>
                </NativeSelect>
              </div>
            </div>

            {/* Dynamic Calculation Fields */}
            {calculationType === "FIXED" && (
              <div className="space-y-1.5">
                <Label htmlFor="amount">Default Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={defaultAmount}
                  onChange={(e) => setDefaultAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            {calculationType === "PERCENTAGE" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pct">Percentage (%)</Label>
                  <Input
                    id="pct"
                    type="number"
                    placeholder="e.g. 40"
                    value={defaultPercentage}
                    onChange={(e) => setDefaultPercentage(e.target.value)}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="basis">Percentage Of</Label>
                  <Input
                    id="basis"
                    placeholder="e.g. BASIC or GROSS"
                    value={calculationBasis}
                    onChange={(e) =>
                      setCalculationBasis(e.target.value.toUpperCase())
                    }
                  />
                </div>
              </div>
            )}

            {calculationType === "FORMULA" && (
              <div className="space-y-1.5">
                <Label htmlFor="formula">Formula Expression</Label>
                <Input
                  id="formula"
                  placeholder="e.g. GROSS - BASIC - HRA"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value.toUpperCase())}
                />
                <p className="text-[11px] text-muted-foreground">
                  Allowed operators: +, -, *, /, (, ). Use component codes like
                  BASIC, HRA, GROSS.
                </p>
              </div>
            )}

            {/* Flags */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTaxable}
                  onChange={(e) => setIsTaxable(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                Taxable
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isStatutory}
                  onChange={(e) => setIsStatutory(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                Statutory
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                Recurring
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  min="0"
                />
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                  />
                  Active in calculations
                </label>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingComponent ? "Save Changes" : "Create Component"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Salary Component</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete component{" "}
            <strong className="text-foreground font-semibold">
              {deleteTarget?.name} ({deleteTarget?.code})
            </strong>
            ? This operation cannot be undone. Components referenced in active
            structures cannot be deleted.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Component"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
