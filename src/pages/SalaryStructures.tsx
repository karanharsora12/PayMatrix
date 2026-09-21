import { useState, useEffect } from 'react';
import {
  useSalaryStructures,
  useSalaryComponents,
  useCreateSalaryStructure,
  useUpdateSalaryStructure,
  useDeleteSalaryStructure,
  useSalaryStructurePreview,
} from '@/hooks/useSalary';
import type { SalaryStructureItem, StructureComponentItem } from '@/api/salaryStructures';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  RefreshCw,
  Layers,
  Save,
  CheckCircle2,
  Calculator,
  Calendar,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/select';
import { toast } from 'sonner';

export default function SalaryStructures() {
  const { data: structuresResp, isLoading } = useSalaryStructures({ limit: 50 });
  const { data: componentsResp } = useSalaryComponents({ limit: 100 });

  const structures = structuresResp?.data || [];
  const availableComponents = componentsResp?.data || [];

  const [selectedStructure, setSelectedStructure] = useState<SalaryStructureItem | null>(null);
  const [builderComponents, setBuilderComponents] = useState<StructureComponentItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddComponentOpen, setIsAddComponentOpen] = useState(false);

  // New Structure Form
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newEffectiveFrom, setNewEffectiveFrom] = useState(
    new Date().toISOString().slice(0, 10),
  );

  // Mutations
  const createMutation = useCreateSalaryStructure();
  const updateMutation = useUpdateSalaryStructure();
  const deleteMutation = useDeleteSalaryStructure();
  const previewMutation = useSalaryStructurePreview();

  // Initialize selected structure
  useEffect(() => {
    if (!selectedStructure && structures.length > 0) {
      setSelectedStructure(structures[0]);
    } else if (selectedStructure) {
      // Refresh current selected structure data
      const refreshed = structures.find((s) => s.id === selectedStructure.id);
      if (refreshed) {
        setSelectedStructure(refreshed);
      }
    }
  }, [structures]);

  // Sync builder components when selected structure changes
  useEffect(() => {
    if (selectedStructure) {
      const comps = (selectedStructure.components || []).map((c, idx) => ({
        ...c,
        displayOrder: c.displayOrder ?? idx,
      }));
      setBuilderComponents(comps);
      setHasChanges(false);
    } else {
      setBuilderComponents([]);
      setHasChanges(false);
    }
  }, [selectedStructure?.id]);

  // Trigger preview calculation whenever builder components change
  useEffect(() => {
    if (builderComponents.length > 0) {
      previewMutation.mutate(builderComponents);
    }
  }, [builderComponents]);

  // Handle Structure Switch
  const handleSelectStructure = (struct: SalaryStructureItem) => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes in the current structure. Switch anyway?')) {
        return;
      }
    }
    setSelectedStructure(struct);
  };

  // Add Component to builder
  const handleAddComponentToBuilder = (componentId: string) => {
    const comp = availableComponents.find((c) => c.id === componentId);
    if (!comp) return;

    if (builderComponents.some((c) => c.salaryComponentId === componentId)) {
      toast.error(`Component ${comp.code} is already in this structure`);
      return;
    }

    const newComp: StructureComponentItem = {
      salaryComponentId: comp.id,
      calculationType: comp.calculationType,
      amount: comp.defaultAmount,
      percentage: comp.defaultPercentage,
      percentageOf: comp.calculationBasis || 'BASIC',
      formula: comp.formula,
      displayOrder: builderComponents.length,
      salaryComponent: comp,
    };

    setBuilderComponents((prev) => [...prev, newComp]);
    setHasChanges(true);
    setIsAddComponentOpen(false);
  };

  // Update builder component value
  const handleUpdateBuilderComponent = (index: number, updates: Partial<StructureComponentItem>) => {
    setBuilderComponents((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
    setHasChanges(true);
  };

  // Remove component from builder
  const handleRemoveBuilderComponent = (index: number) => {
    setBuilderComponents((prev) => prev.filter((_, idx) => idx !== index));
    setHasChanges(true);
  };

  // Reorder component
  const handleMove = (index: number, direction: 'UP' | 'DOWN') => {
    if (
      (direction === 'UP' && index === 0) ||
      (direction === 'DOWN' && index === builderComponents.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    setBuilderComponents((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((c, i) => ({ ...c, displayOrder: i }));
    });
    setHasChanges(true);
  };

  // Save changes to structure
  const handleSaveStructure = async () => {
    if (!selectedStructure) return;

    const payload = {
      name: selectedStructure.name,
      description: selectedStructure.description,
      effectiveFrom: selectedStructure.effectiveFrom,
      components: builderComponents.map((c, idx) => ({
        salaryComponentId: c.salaryComponentId,
        calculationType: c.calculationType,
        amount: c.amount != null ? Number(c.amount) : undefined,
        percentage: c.percentage != null ? Number(c.percentage) : undefined,
        percentageOf: c.percentageOf || undefined,
        formula: c.formula || undefined,
        minimumAmount: c.minimumAmount != null ? Number(c.minimumAmount) : undefined,
        maximumAmount: c.maximumAmount != null ? Number(c.maximumAmount) : undefined,
        displayOrder: idx,
      })),
    };

    await updateMutation.mutateAsync({ id: selectedStructure.id, data: payload });
    setHasChanges(false);
  };

  // Create structure
  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      toast.error('Code and Name are required');
      return;
    }

    const res = await createMutation.mutateAsync({
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      effectiveFrom: newEffectiveFrom,
      components: [],
    });

    setIsCreateOpen(false);
    setNewCode('');
    setNewName('');
    setNewDescription('');
    if (res) {
      setSelectedStructure((res as any)?.data || res);
    }
  };

  // Delete structure
  const handleDeleteStructure = async () => {
    if (!selectedStructure) return;
    await deleteMutation.mutateAsync(selectedStructure.id);
    setIsDeleteOpen(false);
    setSelectedStructure(null);
  };

  const previewTotals = (previewMutation.data as any)?.totals || {
    gross: 0,
    deductions: 0,
    net: 0,
    employerContribution: 0,
    monthlyCtc: 0,
    annualGross: 0,
    annualCtc: 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Salary Structure Builder</h1>
          <p className="text-sm text-muted-foreground">
            Design configurable salary templates with live mathematical preview and dependency validation.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="shadow-sm">
          <Plus className="h-4 w-4 mr-2" /> Create Structure
        </Button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Pane: Structure Master List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Salary Structures ({structures.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading structures...
            </div>
          ) : structures.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground border-dashed">
              <Layers className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <div className="text-sm font-medium">No structures found</div>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Create One
              </Button>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {structures.map((s) => {
                const isSelected = selectedStructure?.id === s.id;
                return (
                  <Card
                    key={s.id}
                    onClick={() => handleSelectStructure(s)}
                    className={`cursor-pointer transition-all border ${
                      isSelected
                        ? 'ring-2 ring-primary border-primary bg-primary/5 shadow-sm'
                        : 'hover:border-muted-foreground/30 hover:bg-muted/30'
                    }`}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-sm">{s.name}</div>
                          <div className="font-mono text-xs text-muted-foreground">{s.code}</div>
                        </div>
                        <Badge variant={s.isActive ? 'success' : 'secondary'} className="text-[10px]">
                          {s.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                        <span className="flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5" />
                          {(s.components || []).length} Components
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {s.effectiveFrom}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Pane: Visual Structure Builder Canvas */}
        <div className="lg:col-span-8 space-y-6">
          {selectedStructure ? (
            <>
              {/* Structure Control Header */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{selectedStructure.name}</CardTitle>
                      <Badge variant="outline" className="font-mono text-xs">
                        {selectedStructure.code}
                      </Badge>
                    </div>
                    {selectedStructure.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedStructure.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setIsDeleteOpen(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveStructure}
                      disabled={!hasChanges || updateMutation.isPending}
                    >
                      <Save className="h-3.5 w-3.5 mr-1" />
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Action Bar */}
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-primary" /> Structure Components
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsAddComponentOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Component
                    </Button>
                  </div>

                  {/* Components List / Builder Table */}
                  {builderComponents.length === 0 ? (
                    <div className="border border-dashed rounded-xl p-8 text-center text-muted-foreground">
                      <Layers className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No components configured in this structure yet.</p>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-3"
                        onClick={() => setIsAddComponentOpen(true)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add First Component
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {builderComponents.map((c, idx) => {
                        const compMaster =
                          c.salaryComponent ||
                          availableComponents.find((m) => m.id === c.salaryComponentId);

                        return (
                          <div
                            key={c.salaryComponentId || idx}
                            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 rounded-xl border bg-card hover:bg-muted/20 transition-colors shadow-xs"
                          >
                            {/* Reorder Buttons */}
                            <div className="flex flex-row sm:flex-col gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                onClick={() => handleMove(idx, 'UP')}
                                disabled={idx === 0}
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                onClick={() => handleMove(idx, 'DOWN')}
                                disabled={idx === builderComponents.length - 1}
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Component Name & Type */}
                            <div className="w-48 min-w-[180px]">
                              <div className="font-semibold text-sm flex items-center gap-1.5">
                                {compMaster?.name || 'Component'}
                                <span className="font-mono text-xs text-muted-foreground">
                                  ({compMaster?.code})
                                </span>
                              </div>
                              <Badge
                                variant={
                                  compMaster?.componentType === 'EARNING'
                                    ? 'success'
                                    : compMaster?.componentType === 'DEDUCTION'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                className="text-[10px] mt-1"
                              >
                                {compMaster?.componentType}
                              </Badge>
                            </div>

                            {/* Calculation Configuration Form Fields */}
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                              <div>
                                <Label className="text-[11px] text-muted-foreground">Calculation</Label>
                                <NativeSelect
                                  value={c.calculationType}
                                  onChange={(val) =>
                                    handleUpdateBuilderComponent(idx, {
                                      calculationType: val as any,
                                    })
                                  }
                                  className="h-8 text-xs"
                                >
                                  <option value="FIXED">Fixed Amount</option>
                                  <option value="PERCENTAGE">Percentage (%)</option>
                                  <option value="FORMULA">Formula</option>
                                </NativeSelect>
                              </div>

                              {c.calculationType === 'FIXED' && (
                                <div className="sm:col-span-2">
                                  <Label className="text-[11px] text-muted-foreground">Amount (₹)</Label>
                                  <Input
                                    type="number"
                                    placeholder="Amount"
                                    value={c.amount != null ? c.amount : ''}
                                    onChange={(e) =>
                                      handleUpdateBuilderComponent(idx, {
                                        amount: e.target.value ? parseFloat(e.target.value) : 0,
                                      })
                                    }
                                    className="h-8 text-xs"
                                    min="0"
                                  />
                                </div>
                              )}

                              {c.calculationType === 'PERCENTAGE' && (
                                <>
                                  <div>
                                    <Label className="text-[11px] text-muted-foreground">Rate (%)</Label>
                                    <Input
                                      type="number"
                                      placeholder="%"
                                      value={c.percentage != null ? c.percentage : ''}
                                      onChange={(e) =>
                                        handleUpdateBuilderComponent(idx, {
                                          percentage: e.target.value ? parseFloat(e.target.value) : 0,
                                        })
                                      }
                                      className="h-8 text-xs"
                                      min="0"
                                      max="100"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-[11px] text-muted-foreground">Of Component</Label>
                                    <Input
                                      placeholder="e.g. BASIC"
                                      value={c.percentageOf || 'BASIC'}
                                      onChange={(e) =>
                                        handleUpdateBuilderComponent(idx, {
                                          percentageOf: e.target.value.toUpperCase(),
                                        })
                                      }
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                </>
                              )}

                              {c.calculationType === 'FORMULA' && (
                                <div className="sm:col-span-2">
                                  <Label className="text-[11px] text-muted-foreground">Expression</Label>
                                  <Input
                                    placeholder="e.g. GROSS - BASIC - HRA"
                                    value={c.formula || ''}
                                    onChange={(e) =>
                                      handleUpdateBuilderComponent(idx, {
                                        formula: e.target.value.toUpperCase(),
                                      })
                                    }
                                    className="h-8 text-xs font-mono"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Delete Action */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive self-end sm:self-center"
                              onClick={() => handleRemoveBuilderComponent(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Live Calculation Preview Breakdown Card */}
                  <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold text-sm">Live Calculation Preview</h4>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Simulated Monthly Baseline
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-muted/40 p-3 rounded-xl border">
                        <div className="text-xs text-muted-foreground">Monthly Gross</div>
                        <div className="text-lg font-bold text-foreground mt-0.5">
                          {formatCurrency(previewTotals.gross)}
                        </div>
                      </div>

                      <div className="bg-muted/40 p-3 rounded-xl border">
                        <div className="text-xs text-muted-foreground">Deductions</div>
                        <div className="text-lg font-bold text-destructive mt-0.5">
                          {formatCurrency(previewTotals.deductions)}
                        </div>
                      </div>

                      <div className="bg-emerald-50 text-emerald-950 p-3 rounded-xl border border-emerald-200">
                        <div className="text-xs text-emerald-700 font-medium">Net Take-Home</div>
                        <div className="text-lg font-bold text-emerald-900 mt-0.5">
                          {formatCurrency(previewTotals.net)}
                        </div>
                      </div>

                      <div className="bg-primary/5 text-primary p-3 rounded-xl border border-primary/20">
                        <div className="text-xs text-primary font-medium">Monthly CTC</div>
                        <div className="text-lg font-bold mt-0.5">
                          {formatCurrency(previewTotals.monthlyCtc)}
                        </div>
                      </div>
                    </div>

                    {/* Annual Estimates */}
                    <div className="flex flex-wrap items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                      <span>
                        Annual Gross: <strong className="text-foreground">{formatCurrency(previewTotals.annualGross)}</strong>
                      </span>
                      <span>
                        Employer Contribution: <strong className="text-foreground">{formatCurrency(previewTotals.employerContribution)}/mo</strong>
                      </span>
                      <span>
                        Annual CTC: <strong className="text-foreground">{formatCurrency(previewTotals.annualCtc)}</strong>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="border border-dashed rounded-2xl p-12 text-center text-muted-foreground">
              <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <h3 className="font-semibold text-foreground text-base">Select a structure</h3>
              <p className="text-sm mt-1">Pick a structure from the left or create a new one to begin editing.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Component Dialog */}
      <Dialog open={isAddComponentOpen} onOpenChange={setIsAddComponentOpen}>
        <DialogContent className="max-w-md" onClose={() => setIsAddComponentOpen(false)}>
          <DialogHeader>
            <DialogTitle>Add Component to Structure</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label>Select Component</Label>
            <div className="max-h-60 overflow-y-auto space-y-1.5 border rounded-lg p-2">
              {availableComponents
                .filter((c) => !builderComponents.some((b) => b.salaryComponentId === c.id))
                .map((comp) => (
                  <div
                    key={comp.id}
                    onClick={() => handleAddComponentToBuilder(comp.id)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm">{comp.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{comp.code}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {comp.componentType}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddComponentOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Structure Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md" onClose={() => setIsCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>Create Salary Structure</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateStructure} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sCode">Structure Code *</Label>
              <Input
                id="sCode"
                placeholder="e.g. STAFF_2026, EXEC_01"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sName">Structure Name *</Label>
              <Input
                id="sName"
                placeholder="e.g. Standard Staff Structure"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sDesc">Description</Label>
              <Input
                id="sDesc"
                placeholder="Optional description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sDate">Effective From *</Label>
              <Input
                id="sDate"
                type="date"
                value={newEffectiveFrom}
                onChange={(e) => setNewEffectiveFrom(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Structure'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md" onClose={() => setIsDeleteOpen(false)}>
          <DialogHeader>
            <DialogTitle>Delete Salary Structure</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete structure{' '}
            <strong className="text-foreground">{selectedStructure?.name}</strong>?
            Structures assigned to active employees cannot be deleted.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteStructure}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Structure'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
