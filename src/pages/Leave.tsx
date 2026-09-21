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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Calendar as CalendarIcon,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Pencil,
  Trash2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useLeaveTypes,
  useCreateLeaveType,
  useUpdateLeaveType,
  useDeleteLeaveType,
  useLeaveRequests,
  useCreateLeaveRequest,
  useApproveLeave,
  useRejectLeave,
  useCancelLeave,
  useLeaveBalances,
  useLeaveCalendar,
} from '@/hooks/useLeave';
import { useEmployees } from '@/hooks/useEmployees';
import type { LeaveType, LeaveRequest } from '@/api/leave';

export default function Leave() {
  const currentYear = new Date().getFullYear();
  const todayStr = new Date().toISOString().substring(0, 10);
  const currentMonthStr = todayStr.substring(0, 7);

  // Filter States
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [balanceEmpId, setBalanceEmpId] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(currentMonthStr);

  // Queries
  const { data: typesData, isLoading: typesLoading } = useLeaveTypes();
  const leaveTypes = typesData?.data ?? [];

  const { data: requestsData, isLoading: requestsLoading } = useLeaveRequests({
    status: filterStatus || undefined,
    employeeId: filterEmployeeId || undefined,
    pageSize: 50,
  });
  const requests = requestsData?.data ?? [];

  const { data: employeesData } = useEmployees({ pageSize: 100 });
  const employees = employeesData?.data ?? [];

  const { data: balancesData, isLoading: balancesLoading } = useLeaveBalances(
    balanceEmpId || (employees[0]?.id ?? undefined),
    currentYear,
  );
  const balances = balancesData ?? [];

  const fromMonthDate = `${calendarMonth}-01`;
  const toMonthDate = `${calendarMonth}-31`;
  const { data: calendarEvents } = useLeaveCalendar({
    fromDate: fromMonthDate,
    toDate: toMonthDate,
  });

  // Mutations
  const createTypeMutation = useCreateLeaveType();
  const updateTypeMutation = useUpdateLeaveType();
  const deleteTypeMutation = useDeleteLeaveType();
  const createRequestMutation = useCreateLeaveRequest();
  const approveMutation = useApproveLeave();
  const rejectMutation = useRejectLeave();
  const cancelMutation = useCancelLeave();

  // Modals
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Forms
  const [requestForm, setRequestForm] = useState({
    employeeId: '',
    leaveTypeId: '',
    fromDate: todayStr,
    toDate: todayStr,
    reason: '',
  });

  const [typeForm, setTypeForm] = useState({
    code: '',
    name: '',
    description: '',
    isPaid: true,
    annualAllowance: 12,
    carryForwardAllowed: false,
    maxCarryForwardDays: 5,
    maxConsecutiveDays: 5,
    requiresApproval: true,
    isActive: true,
  });

  // Action Handlers
  const handleOpenRequest = () => {
    setRequestForm({
      employeeId: employees[0]?.id || '',
      leaveTypeId: leaveTypes[0]?.id || '',
      fromDate: todayStr,
      toDate: todayStr,
      reason: '',
    });
    setRequestModalOpen(true);
  };

  const handleSaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.employeeId || !requestForm.leaveTypeId || !requestForm.fromDate || !requestForm.toDate) {
      toast.error('All fields are required');
      return;
    }

    try {
      await createRequestMutation.mutateAsync(requestForm);
      toast.success('Leave request submitted successfully');
      setRequestModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || 'Failed to submit leave request');
    }
  };

  const handleOpenTypeModal = (t?: LeaveType) => {
    if (t) {
      setEditingType(t);
      setTypeForm({
        code: t.code,
        name: t.name,
        description: t.description || '',
        isPaid: t.isPaid,
        annualAllowance: Number(t.annualAllowance),
        carryForwardAllowed: t.carryForwardAllowed,
        maxCarryForwardDays: Number(t.maxCarryForwardDays || 0),
        maxConsecutiveDays: t.maxConsecutiveDays || 5,
        requiresApproval: t.requiresApproval,
        isActive: t.isActive,
      });
    } else {
      setEditingType(null);
      setTypeForm({
        code: '',
        name: '',
        description: '',
        isPaid: true,
        annualAllowance: 12,
        carryForwardAllowed: false,
        maxCarryForwardDays: 5,
        maxConsecutiveDays: 5,
        requiresApproval: true,
        isActive: true,
      });
    }
    setTypeModalOpen(true);
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeForm.code.trim() || !typeForm.name.trim()) {
      toast.error('Code and Name are required');
      return;
    }

    try {
      if (editingType) {
        await updateTypeMutation.mutateAsync({ id: editingType.id, payload: typeForm });
        toast.success('Leave type updated');
      } else {
        await createTypeMutation.mutateAsync(typeForm);
        toast.success('Leave type created');
      }
      setTypeModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || 'Failed to save leave type');
    }
  };

  const handleDeleteType = async (id: string, name: string) => {
    if (!confirm(`Delete leave type "${name}"?`)) return;
    try {
      await deleteTypeMutation.mutateAsync(id);
      toast.success('Leave type deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || 'Cannot delete leave type');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync(id);
      toast.success('Leave request approved and balance deducted');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || 'Failed to approve leave');
    }
  };

  const handleOpenReject = (id: string) => {
    setRejectingRequestId(id);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequestId) return;
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is mandatory');
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        id: rejectingRequestId,
        rejectionReason: rejectionReason.trim(),
      });
      toast.success('Leave request rejected');
      setRejectModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || 'Failed to reject leave');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this leave request? If approved, balance will be restored.')) return;
    try {
      await cancelMutation.mutateAsync(id);
      toast.success('Leave request cancelled and balance restored');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || 'Failed to cancel leave');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Approved</Badge>;
      case 'PENDING':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Pending</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary">Cancelled</Badge>;
      case 'REJECTED':
      default:
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">Rejected</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage leave types, review approval workflows, calculate working day deductions, and track employee balances.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleOpenTypeModal()}>
            <Plus className="h-4 w-4 mr-2" /> Add Leave Type
          </Button>
          <Button onClick={handleOpenRequest}>
            <CalendarIcon className="h-4 w-4 mr-2" /> Request Leave
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="types">Leave Types</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="calendar">Leave Calendar</TabsTrigger>
        </TabsList>

        {/* Tab 1: Leave Requests */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardContent className="p-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <NativeSelect
                  placeholder="All Employees"
                  value={filterEmployeeId}
                  onChange={(val) => setFilterEmployeeId(val || '')}
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.employeeCode})
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="w-40">
                <NativeSelect
                  placeholder="All Statuses"
                  value={filterStatus}
                  onChange={(val) => setFilterStatus(val || '')}
                >
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CANCELLED">Cancelled</option>
                </NativeSelect>
              </div>
              <Button size="sm" variant="ghost" onClick={() => { setFilterEmployeeId(''); setFilterStatus(''); }}>
                Reset Filters
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7} className="h-12 text-center text-muted-foreground animate-pulse">
                          Loading leave requests...
                        </TableCell>
                      </TableRow>
                    ))
                  ) : requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No leave requests found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="font-medium text-sm">
                            {r.employee?.firstName} {r.employee?.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">{r.employee?.employeeCode}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {r.leaveType?.name || 'Leave'} ({r.leaveType?.code || 'LV'})
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {r.fromDate} → {r.toDate}
                        </TableCell>
                        <TableCell className="font-semibold text-sm">
                          {Number(r.totalDays)} {Number(r.totalDays) === 1 ? 'day' : 'days'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                          {r.reason || '—'}
                          {r.rejectionReason && (
                            <div className="text-red-500 font-medium">Rejection: {r.rejectionReason}</div>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(r.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                  onClick={() => handleApprove(r.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 text-xs text-red-600 hover:bg-red-50"
                                  onClick={() => handleOpenReject(r.id)}
                                  disabled={rejectMutation.isPending}
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                                </Button>
                              </>
                            )}
                            {(r.status === 'PENDING' || r.status === 'APPROVED') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => handleCancel(r.id)}
                                disabled={cancelMutation.isPending}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" /> Cancel
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Leave Types */}
        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Annual Allowance</TableHead>
                    <TableHead>Carry Forward</TableHead>
                    <TableHead>Max Consecutive</TableHead>
                    <TableHead>Approval</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typesLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-16 text-center text-muted-foreground animate-pulse">
                        Loading leave types...
                      </TableCell>
                    </TableRow>
                  ) : leaveTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                        No leave types defined. Create your standard leaves (Casual, Sick, Earned).
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaveTypes.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs font-semibold">{t.code}</TableCell>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell>
                          <Badge variant={t.isPaid ? 'success' : 'secondary'}>
                            {t.isPaid ? 'Paid' : 'Unpaid'}
                          </Badge>
                        </TableCell>
                        <TableCell>{Number(t.annualAllowance)} days</TableCell>
                        <TableCell>
                          {t.carryForwardAllowed ? `Yes (max ${t.maxCarryForwardDays ?? '∞'})` : 'No'}
                        </TableCell>
                        <TableCell>{t.maxConsecutiveDays ? `${t.maxConsecutiveDays} days` : 'Unlimited'}</TableCell>
                        <TableCell>{t.requiresApproval ? 'Required' : 'Auto'}</TableCell>
                        <TableCell>
                          <Badge variant={t.isActive ? 'success' : 'secondary'}>
                            {t.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleOpenTypeModal(t)}>
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteType(t.id, t.name)}>
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
        </TabsContent>

        {/* Tab 3: Leave Balances */}
        <TabsContent value="balances" className="space-y-4">
          <Card>
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-sm">Employee Leave Balances ({currentYear})</h3>
                <p className="text-xs text-muted-foreground">Yearly allocations, approved leaves taken, and remaining quotas</p>
              </div>
              <div className="w-64">
                <NativeSelect
                  value={balanceEmpId || (employees[0]?.id ?? '')}
                  onChange={(val) => setBalanceEmpId(val || '')}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Opening Balance</TableHead>
                    <TableHead>Allocated</TableHead>
                    <TableHead>Used Days</TableHead>
                    <TableHead>Pending Approval</TableHead>
                    <TableHead>Remaining Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balancesLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-16 text-center text-muted-foreground animate-pulse">
                        Loading balances...
                      </TableCell>
                    </TableRow>
                  ) : balances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No balance record found for this employee in {currentYear}.
                      </TableCell>
                    </TableRow>
                  ) : (
                    balances.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-semibold">
                          {b.leaveType?.name} ({b.leaveType?.code})
                        </TableCell>
                        <TableCell>{Number(b.openingBalance)}</TableCell>
                        <TableCell>{Number(b.allocatedDays)}</TableCell>
                        <TableCell className="text-amber-700 dark:text-amber-300 font-medium">
                          {Number(b.usedDays)}
                        </TableCell>
                        <TableCell className="text-blue-600 font-medium">
                          {Number(b.pendingDays)}
                        </TableCell>
                        <TableCell className="text-emerald-700 dark:text-emerald-300 font-bold text-base">
                          {Number(b.remainingDays)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Leave Calendar */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-sm">Monthly Leave Calendar</h3>
                <p className="text-xs text-muted-foreground">View all scheduled and approved employee leaves</p>
              </div>
              <Input
                type="month"
                className="w-40 h-9 text-xs"
                value={calendarMonth}
                onChange={(e) => setCalendarMonth(e.target.value)}
              />
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-muted-foreground mb-2">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 31 }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dateStr = `${calendarMonth}-${String(dayNum).padStart(2, '0')}`;
                  const dayLeaves = (calendarEvents ?? []).filter(
                    (e) => e.fromDate <= dateStr && e.toDate >= dateStr,
                  );

                  return (
                    <div
                      key={idx}
                      className={`min-h-[85px] border rounded-lg p-1.5 flex flex-col justify-between transition-colors ${
                        dayLeaves.length > 0 ? 'bg-purple-50/40 border-purple-200 dark:bg-purple-950/20' : 'bg-card'
                      }`}
                    >
                      <div className="text-xs font-semibold text-muted-foreground">{dayNum}</div>
                      <div className="space-y-1 overflow-hidden">
                        {dayLeaves.map((l) => (
                          <div
                            key={l.id}
                            className="text-[10px] bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-100 rounded px-1 py-0.5 font-medium truncate"
                            title={`${l.employee?.firstName} ${l.employee?.lastName} - ${l.leaveType?.name}`}
                          >
                            {l.employee?.firstName} ({l.leaveType?.code})
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Leave Modal */}
      <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
        <DialogContent onClose={() => setRequestModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Submit Leave Request</DialogTitle>
            <DialogDescription>
              Working days are automatically calculated excluding weekends and company holidays.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveRequest} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Employee</label>
              <NativeSelect
                value={requestForm.employeeId}
                onChange={(val) => setRequestForm({ ...requestForm, employeeId: val || '' })}
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
              <label className="text-xs font-medium text-muted-foreground">Leave Type</label>
              <NativeSelect
                value={requestForm.leaveTypeId}
                onChange={(val) => setRequestForm({ ...requestForm, leaveTypeId: val || '' })}
                required
              >
                {leaveTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code}) — {t.isPaid ? 'Paid' : 'Unpaid'}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">From Date</label>
                <Input
                  type="date"
                  value={requestForm.fromDate}
                  onChange={(e) => setRequestForm({ ...requestForm, fromDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">To Date</label>
                <Input
                  type="date"
                  value={requestForm.toDate}
                  onChange={(e) => setRequestForm({ ...requestForm, toDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Reason</label>
              <Input
                placeholder="Specify reason for leave..."
                value={requestForm.reason}
                onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setRequestModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRequestMutation.isPending}>
                {createRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent onClose={() => setRejectModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              A valid rejection reason is required so the employee understands why their request was denied.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmReject} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Rejection Reason</label>
              <Input
                placeholder="e.g. Critical release scheduled during these dates"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={rejectMutation.isPending}>
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Leave Type Modal */}
      <Dialog open={typeModalOpen} onOpenChange={setTypeModalOpen}>
        <DialogContent onClose={() => setTypeModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editingType ? 'Edit Leave Type' : 'Create Leave Type'}</DialogTitle>
            <DialogDescription>Configure quotas, carry-forward limits, and approval policies.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveType} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Code</label>
                <Input
                  placeholder="e.g. CL"
                  value={typeForm.code}
                  onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <Input
                  placeholder="e.g. Casual Leave"
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Input
                placeholder="Short description of this leave type"
                value={typeForm.description}
                onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Annual Days</label>
                <Input
                  type="number"
                  min="0"
                  value={typeForm.annualAllowance}
                  onChange={(e) => setTypeForm({ ...typeForm, annualAllowance: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Max Consecutive</label>
                <Input
                  type="number"
                  min="1"
                  value={typeForm.maxConsecutiveDays}
                  onChange={(e) => setTypeForm({ ...typeForm, maxConsecutiveDays: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Max Carry Forward</label>
                <Input
                  type="number"
                  min="0"
                  value={typeForm.maxCarryForwardDays}
                  onChange={(e) => setTypeForm({ ...typeForm, maxCarryForwardDays: Number(e.target.value) })}
                  disabled={!typeForm.carryForwardAllowed}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={typeForm.isPaid}
                  onChange={(e) => setTypeForm({ ...typeForm, isPaid: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span>Paid Leave</span>
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={typeForm.carryForwardAllowed}
                  onChange={(e) => setTypeForm({ ...typeForm, carryForwardAllowed: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span>Allow carry-forward to next calendar year</span>
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={typeForm.requiresApproval}
                  onChange={(e) => setTypeForm({ ...typeForm, requiresApproval: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span>Requires Manager / HR approval</span>
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={typeForm.isActive}
                  onChange={(e) => setTypeForm({ ...typeForm, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span>Active</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setTypeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTypeMutation.isPending || updateTypeMutation.isPending}>
                {editingType ? 'Save Changes' : 'Create Leave Type'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
