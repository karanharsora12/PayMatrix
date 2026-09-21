import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/select';
import {
  Plus,
  Clock,
  Moon,
  Calendar,
  Pencil,
  Trash2,
  UserCheck,
  History,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useShifts,
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
  useAssignShift,
  useEmployeeShifts,
} from '@/hooks/useShifts';
import { useEmployees } from '@/hooks/useEmployees';
import type { Shift } from '@/api/shifts';

export default function Shifts() {
  const { data: shiftsData, isLoading } = useShifts({ pageSize: 50 });
  const shifts = shiftsData?.data ?? [];

  const { data: employeesData } = useEmployees({ pageSize: 100 });
  const employees = employeesData?.data ?? [];

  const createShiftMutation = useCreateShift();
  const updateShiftMutation = useUpdateShift();
  const deleteShiftMutation = useDeleteShift();
  const assignShiftMutation = useAssignShift();

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedShiftForAssign, setSelectedShiftForAssign] = useState<Shift | null>(null);
  const [historyEmpId, setHistoryEmpId] = useState<string | null>(null);

  // Form states
  const [form, setForm] = useState({
    code: '',
    name: '',
    startTime: '09:30',
    endTime: '18:30',
    breakMinutes: 60,
    workingHours: 8,
    graceMinutes: 15,
    overtimeAllowed: false,
    isNightShift: false,
    isActive: true,
  });

  const [assignForm, setAssignForm] = useState({
    employeeId: '',
    shiftId: '',
    effectiveFrom: new Date().toISOString().substring(0, 10),
    effectiveTo: '',
  });

  const { data: historyData, isLoading: historyLoading } = useEmployeeShifts(historyEmpId ?? undefined);

  const resetForm = () => {
    setForm({
      code: '',
      name: '',
      startTime: '09:30',
      endTime: '18:30',
      breakMinutes: 60,
      workingHours: 8,
      graceMinutes: 15,
      overtimeAllowed: false,
      isNightShift: false,
      isActive: true,
    });
    setEditingShift(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const handleOpenEdit = (s: Shift) => {
    setEditingShift(s);
    setForm({
      code: s.code,
      name: s.name,
      startTime: s.startTime.substring(0, 5),
      endTime: s.endTime.substring(0, 5),
      breakMinutes: s.breakMinutes,
      workingHours: Number(s.workingHours),
      graceMinutes: s.graceMinutes,
      overtimeAllowed: s.overtimeAllowed,
      isNightShift: s.isNightShift,
      isActive: s.isActive,
    });
    setCreateOpen(true);
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Code and Name are required');
      return;
    }

    try {
      if (editingShift) {
        await updateShiftMutation.mutateAsync({
          id: editingShift.id,
          payload: form,
        });
        toast.success('Shift updated successfully');
      } else {
        await createShiftMutation.mutateAsync(form);
        toast.success('Shift created successfully');
      }
      setCreateOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || 'Failed to save shift');
    }
  };

  const handleDeleteShift = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete shift "${name}"?`)) return;
    try {
      await deleteShiftMutation.mutateAsync(id);
      toast.success('Shift deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || 'Failed to delete shift');
    }
  };

  const handleOpenAssign = (shift?: Shift) => {
    setSelectedShiftForAssign(shift ?? null);
    setAssignForm({
      employeeId: '',
      shiftId: shift?.id ?? (shifts[0]?.id || ''),
      effectiveFrom: new Date().toISOString().substring(0, 10),
      effectiveTo: '',
    });
    setAssignOpen(true);
  };

  const handleSaveAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.employeeId || !assignForm.shiftId || !assignForm.effectiveFrom) {
      toast.error('Employee, Shift and Effective Date are required');
      return;
    }

    try {
      await assignShiftMutation.mutateAsync({
        employeeId: assignForm.employeeId,
        payload: {
          shiftId: assignForm.shiftId,
          effectiveFrom: assignForm.effectiveFrom,
          effectiveTo: assignForm.effectiveTo || undefined,
        },
      });
      toast.success('Shift assigned to employee successfully');
      setAssignOpen(false);
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to assign shift. Overlapping assignment may exist.',
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shift Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure work schedules, overnight night shifts, grace periods, and assign shifts to employees.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleOpenAssign()}>
            <UserCheck className="h-4 w-4 mr-2" />
            Assign Shift
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Shift
          </Button>
        </div>
      </div>

      {/* Shifts Table Card */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Timing</TableHead>
                <TableHead>Work Hours</TableHead>
                <TableHead>Break</TableHead>
                <TableHead>Grace</TableHead>
                <TableHead>Overtime</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={10} className="h-12 text-center text-muted-foreground animate-pulse">
                      Loading shifts...
                    </TableCell>
                  </TableRow>
                ))
              ) : shifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                    No shifts found. Create your first shift schedule.
                  </TableCell>
                </TableRow>
              ) : (
                shifts.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs font-semibold">{s.code}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>
                          {s.startTime.substring(0, 5)} - {s.endTime.substring(0, 5)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{Number(s.workingHours)}h</TableCell>
                    <TableCell>{s.breakMinutes}m</TableCell>
                    <TableCell>{s.graceMinutes}m</TableCell>
                    <TableCell>
                      <Badge variant={s.overtimeAllowed ? 'success' : 'secondary'}>
                        {s.overtimeAllowed ? 'Allowed' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {s.isNightShift ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          <Moon className="h-3 w-3" /> Night
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Regular</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.isActive ? 'success' : 'secondary'}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Assign to Employee"
                          onClick={() => handleOpenAssign(s)}
                        >
                          <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Edit Shift"
                          onClick={() => handleOpenEdit(s)}
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Delete Shift"
                          onClick={() => handleDeleteShift(s.id, s.name)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Employee Shift History Quick View */}
      <Card>
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Employee Shift History Lookup</h3>
          </div>
          <div className="w-64">
            <NativeSelect
              placeholder="Select employee to view history"
              value={historyEmpId ?? ''}
              onChange={(val) => setHistoryEmpId(val || null)}
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.employeeCode})
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
        <CardContent className="p-0">
          {historyEmpId ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shift</TableHead>
                  <TableHead>Timings</TableHead>
                  <TableHead>Effective From</TableHead>
                  <TableHead>Effective To</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground animate-pulse">
                      Loading history...
                    </TableCell>
                  </TableRow>
                ) : (historyData?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No shift assignments recorded for this employee.
                    </TableCell>
                  </TableRow>
                ) : (
                  historyData?.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        {a.shift?.name} ({a.shift?.code})
                      </TableCell>
                      <TableCell>
                        {a.shift?.startTime.substring(0, 5)} - {a.shift?.endTime.substring(0, 5)}
                      </TableCell>
                      <TableCell>{a.effectiveFrom}</TableCell>
                      <TableCell>{a.effectiveTo || 'Ongoing / Indefinite'}</TableCell>
                      <TableCell>
                        <Badge variant={!a.effectiveTo || a.effectiveTo >= new Date().toISOString().substring(0, 10) ? 'success' : 'secondary'}>
                          {!a.effectiveTo || a.effectiveTo >= new Date().toISOString().substring(0, 10) ? 'Active' : 'Expired'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Select an employee above to inspect their shift allocation timeline.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Shift Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent onClose={() => setCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editingShift ? 'Edit Shift Schedule' : 'Create New Shift'}</DialogTitle>
            <DialogDescription>
              Set shift hours, overnight parameters, grace period, and overtime allowances.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveShift} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Shift Code</label>
                <Input
                  placeholder="e.g. SH-GEN"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Shift Name</label>
                <Input
                  placeholder="e.g. General Shift"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Start Time (HH:mm)</label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">End Time (HH:mm)</label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Work Hours</label>
                <Input
                  type="number"
                  step="0.5"
                  min="1"
                  max="24"
                  value={form.workingHours}
                  onChange={(e) => setForm({ ...form, workingHours: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Break (Mins)</label>
                <Input
                  type="number"
                  min="0"
                  value={form.breakMinutes}
                  onChange={(e) => setForm({ ...form, breakMinutes: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Grace (Mins)</label>
                <Input
                  type="number"
                  min="0"
                  value={form.graceMinutes}
                  onChange={(e) => setForm({ ...form, graceMinutes: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.overtimeAllowed}
                  onChange={(e) => setForm({ ...form, overtimeAllowed: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span>Allow Overtime calculation for this shift</span>
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isNightShift}
                  onChange={(e) => setForm({ ...form, isNightShift: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span>Night Shift (crosses midnight)</span>
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span>Active</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createShiftMutation.isPending || updateShiftMutation.isPending}>
                {editingShift ? 'Save Changes' : 'Create Shift'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Shift Modal */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent onClose={() => setAssignOpen(false)}>
          <DialogHeader>
            <DialogTitle>Assign Shift to Employee</DialogTitle>
            <DialogDescription>
              Assign a work schedule to an employee. Overlapping assignment periods will be rejected.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveAssign} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Select Employee</label>
              <NativeSelect
                placeholder="Choose employee"
                value={assignForm.employeeId}
                onChange={(val) => setAssignForm({ ...assignForm, employeeId: val || '' })}
                required
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.employeeCode})
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Select Shift</label>
              <NativeSelect
                placeholder="Choose shift"
                value={assignForm.shiftId}
                onChange={(val) => setAssignForm({ ...assignForm, shiftId: val || '' })}
                required
              >
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code}) — {s.startTime.substring(0, 5)} to {s.endTime.substring(0, 5)}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Effective From</label>
                <Input
                  type="date"
                  value={assignForm.effectiveFrom}
                  onChange={(e) => setAssignForm({ ...assignForm, effectiveFrom: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Effective To <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <Input
                  type="date"
                  value={assignForm.effectiveTo}
                  onChange={(e) => setAssignForm({ ...assignForm, effectiveTo: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={assignShiftMutation.isPending}>
                {assignShiftMutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
