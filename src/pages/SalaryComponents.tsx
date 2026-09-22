import { useState } from 'react';
import {
  useSalaryComponents,
  useCreateSalaryComponent,
  useUpdateSalaryComponent,
  useDeleteSalaryComponent,
} from '@/hooks/useSalary';
import type { SalaryComponentItem } from '@/api/salaryComponents';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataGrid } from '@/components/common/DataGrid';
import type { ColDef } from 'ag-grid-community';
import { useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, ShieldCheck, RefreshCw, Calculator } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function SalaryComponents() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SalaryComponentItem | null>(null);
  const [editingComponent, setEditingComponent] = useState<SalaryComponentItem | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [componentType, setComponentType] = useState<any>('EARNING');
  const [calculationType, setCalculationType] = useState<any>('FIXED');
  const [defaultAmount, setDefaultAmount] = useState('');
  const [defaultPercentage, setDefaultPercentage] = useState('');
  const [calculationBasis, setCalculationBasis] = useState('BASIC');
  const [formula, setFormula] = useState('');
  const [isTaxable, setIsTaxable] = useState(true);
  const [isStatutory, setIsStatutory] = useState(false);
  const [isRecurring, setIsRecurring] = useState(true);
  const [displayOrder, setDisplayOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  // Queries & Mutations
  const { data: resp, isLoading } = useSalaryComponents({
    limit: 100,
    search: search || undefined,
    componentType: activeTab === 'ALL' ? undefined : activeTab,
  });

  const components = resp?.data || [];
  const createMutation = useCreateSalaryComponent();
  const updateMutation = useUpdateSalaryComponent();
  const deleteMutation = useDeleteSalaryComponent();

  const resetForm = () => {
    setEditingComponent(null);
    setCode('');
    setName('');
    setDescription('');
    setComponentType('EARNING');
    setCalculationType('FIXED');
    setDefaultAmount('');
    setDefaultPercentage('');
    setCalculationBasis('BASIC');
    setFormula('');
    setIsTaxable(true);
    setIsStatutory(false);
    setIsRecurring(true);
    setDisplayOrder('0');
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
    setDescription(comp.description || '');
    setComponentType(comp.componentType);
    setCalculationType(comp.calculationType);
    setDefaultAmount(comp.defaultAmount != null ? String(comp.defaultAmount) : '');
    setDefaultPercentage(comp.defaultPercentage != null ? String(comp.defaultPercentage) : '');
    setCalculationBasis(comp.calculationBasis || 'BASIC');
    setFormula(comp.formula || '');
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
      toast.error('Component name is required');
      return;
    }

    const payload: any = {
      name: name.trim(),
      description: description.trim() || undefined,
      componentType,
      calculationType,
      defaultAmount: defaultAmount ? parseFloat(defaultAmount) : undefined,
      defaultPercentage: defaultPercentage ? parseFloat(defaultPercentage) : undefined,
      calculationBasis: calculationType === 'PERCENTAGE' ? calculationBasis : undefined,
      formula: calculationType === 'FORMULA' ? formula : undefined,
      isTaxable,
      isStatutory,
      isRecurring,
      displayOrder: parseInt(displayOrder, 10) || 0,
      isActive,
    };

    if (editingComponent) {
      await updateMutation.mutateAsync({ id: editingComponent.id, data: payload });
    } else {
      if (!code.trim()) {
        toast.error('Component code is required');
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

  const componentsColDefs = useMemo<ColDef[]>(() => [
    { 
      field: "displayOrder", 
      headerName: "#", 
      width: 70, 
      cellClass: "text-center font-mono text-xs text-muted-foreground",
      valueGetter: (p) => p.data.displayOrder ?? (p.node?.rowIndex != null ? p.node.rowIndex + 1 : 0)
    },
    { field: "code", headerName: "Code", width: 100, cellClass: "font-mono text-xs font-semibold text-primary" },
    { 
      field: "name", 
      headerName: "Component Name", 
      flex: 1, 
      cellRenderer: (p: any) => (
        <div className="flex flex-col justify-center h-full">
          <div className="font-medium text-sm leading-tight">{p.value}</div>
          {p.data.description && (
            <div className="text-xs text-muted-foreground line-clamp-1 leading-tight">
              {p.data.description}
            </div>
          )}
        </div>
      )
    },
    { 
      field: "componentType", 
      headerName: "Type", 
      width: 150,
      cellRenderer: (p: any) => (
        <Badge
          variant={
            p.value === 'EARNING'
              ? 'success'
              : p.value === 'DEDUCTION'
              ? 'destructive'
              : p.value === 'EMPLOYER_CONTRIBUTION'
              ? 'secondary'
              : 'outline'
          }
          className="capitalize text-xs"
        >
          {p.value === 'EMPLOYER_CONTRIBUTION' ? 'Employer' : p.value.toLowerCase()}
        </Badge>
      )
    },
    { 
      field: "calculationType", 
      headerName: "Calculation", 
      width: 150,
      cellClass: "text-xs",
      cellRenderer: (p: any) => (
        <div className="flex items-center h-full">
          <span className="font-medium">{p.value}</span>
          {p.value === 'PERCENTAGE' && (
            <span className="text-muted-foreground ml-1">of {p.data.calculationBasis || 'BASIC'}</span>
          )}
        </div>
      )
    },
    { 
      field: "defaultRate", 
      headerName: "Default Rate / Value", 
      width: 180,
      cellClass: "text-xs font-medium",
      cellRenderer: (p: any) => {
        const c = p.data;
        if (c.calculationType === 'FIXED') {
          return c.defaultAmount ? formatCurrency(Number(c.defaultAmount)) : '—';
        } else if (c.calculationType === 'PERCENTAGE') {
          return c.defaultPercentage ? `${c.defaultPercentage}%` : '—';
        } else {
          return <span className="font-mono text-xs text-muted-foreground">{c.formula || 'Formula'}</span>;
        }
      }
    },
    { 
      field: "flags", 
      headerName: "Flags", 
      width: 120,
      cellRenderer: (p: any) => (
        <div className="flex items-center gap-1 h-full">
          {p.data.isTaxable && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">Tax</Badge>
          )}
          {p.data.isStatutory && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-blue-50 text-blue-700 border-blue-200">
              <ShieldCheck className="h-2.5 w-2.5 mr-0.5" /> Stat
            </Badge>
          )}
        </div>
      )
    },
    { 
      field: "isActive", 
      headerName: "Status", 
      width: 100,
      cellRenderer: (p: any) => (
        <Badge variant={p.value ? 'success' : 'secondary'} className="text-xs">
          {p.value ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      headerName: "Actions",
      width: 120,
      sortable: false,
      filter: false,
      cellRenderer: (p: any) => (
        <div className="flex items-center justify-end gap-1 h-full">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleOpenEdit(p.data)}>
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(p.data)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ], []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Salary Components</h1>
          <p className="text-sm text-muted-foreground">
            Configure flexible earnings, deductions, statutory contributions, and reimbursements.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="shadow-sm">
          <Plus className="h-4 w-4 mr-2" /> Add Component
        </Button>
      </div>

      {/* Tabs & Search Filter */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="ALL">All ({components.length})</TabsTrigger>
            <TabsTrigger value="EARNING">Earnings</TabsTrigger>
            <TabsTrigger value="DEDUCTION">Deductions</TabsTrigger>
            <TabsTrigger value="EMPLOYER_CONTRIBUTION">Employer Contributions</TabsTrigger>
            <TabsTrigger value="REIMBURSEMENT">Reimbursements</TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <TabsContent value={activeTab} className="m-0">
          <Card className="overflow-hidden border shadow-sm">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading salary components...
              </div>
            ) : components.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Calculator className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <h3 className="font-semibold text-foreground text-base">No components found</h3>
                <p className="text-sm mt-1">Get started by creating your first salary component.</p>
                <Button onClick={handleOpenAdd} variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" /> Add Component
                </Button>
              </div>
            ) : (
              <div className="h-[500px]">
                <DataGrid rowData={components} columnDefs={componentsColDefs} />
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg" onClose={() => setIsModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>
              {editingComponent ? `Edit Component: ${editingComponent.code}` : 'Create Salary Component'}
            </DialogTitle>
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
                  <option value="EMPLOYER_CONTRIBUTION">Employer Contribution</option>
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
            {calculationType === 'FIXED' && (
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

            {calculationType === 'PERCENTAGE' && (
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
                    onChange={(e) => setCalculationBasis(e.target.value.toUpperCase())}
                  />
                </div>
              </div>
            )}

            {calculationType === 'FORMULA' && (
              <div className="space-y-1.5">
                <Label htmlFor="formula">Formula Expression</Label>
                <Input
                  id="formula"
                  placeholder="e.g. GROSS - BASIC - HRA"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value.toUpperCase())}
                />
                <p className="text-[11px] text-muted-foreground">
                  Allowed operators: +, -, *, /, (, ). Use component codes like BASIC, HRA, GROSS.
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
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingComponent ? 'Save Changes' : 'Create Component'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md" onClose={() => setDeleteTarget(null)}>
          <DialogHeader>
            <DialogTitle>Delete Salary Component</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete component{' '}
            <strong className="text-foreground font-semibold">{deleteTarget?.name} ({deleteTarget?.code})</strong>?
            This operation cannot be undone. Components referenced in active structures cannot be deleted.
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
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Component'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
