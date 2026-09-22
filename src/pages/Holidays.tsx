import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataGrid } from '@/components/common/DataGrid';
import type { ColDef } from 'ag-grid-community';
import { useMemo } from 'react';
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
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  PartyPopper,
  Flag,
  CalendarCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useHolidays,
  useCreateHoliday,
  useUpdateHoliday,
  useDeleteHoliday,
} from '@/hooks/useHolidays';
import type { Holiday } from '@/api/holidays';

export default function Holidays() {
  const currentYear = new Date().getFullYear();

  // Filter state
  const [filterYear, setFilterYear] = useState<number>(currentYear);
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  const { data: holidaysData, isLoading } = useHolidays({
    year: filterYear,
    month: filterMonth ? Number(filterMonth) : undefined,
    holidayType: filterType || undefined,
    pageSize: 50,
  });
  const holidays = holidaysData?.data ?? [];

  const createHolidayMutation = useCreateHoliday();
  const updateHolidayMutation = useUpdateHoliday();
  const deleteHolidayMutation = useDeleteHoliday();

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  const [form, setForm] = useState({
    name: '',
    holidayDate: new Date().toISOString().substring(0, 10),
    holidayType: 'NATIONAL',
    description: '',
    isOptional: false,
    isActive: true,
  });

  const handleOpenCreate = () => {
    setEditingHoliday(null);
    setForm({
      name: '',
      holidayDate: `${filterYear}-01-01`,
      holidayType: 'NATIONAL',
      description: '',
      isOptional: false,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (h: Holiday) => {
    setEditingHoliday(h);
    setForm({
      name: h.name,
      holidayDate: h.holidayDate,
      holidayType: h.holidayType,
      description: h.description || '',
      isOptional: h.isOptional,
      isActive: h.isActive,
    });
    setModalOpen(true);
  };

  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.holidayDate) {
      toast.error('Holiday name and date are required');
      return;
    }

    try {
      if (editingHoliday) {
        await updateHolidayMutation.mutateAsync({
          id: editingHoliday.id,
          payload: form,
        });
        toast.success('Holiday updated successfully');
      } else {
        await createHolidayMutation.mutateAsync(form as any);
        toast.success('Holiday created successfully');
      }
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || 'Failed to save holiday');
    }
  };

  const handleDeleteHoliday = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteHolidayMutation.mutateAsync(id);
      toast.success('Holiday deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || 'Failed to delete holiday');
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'NATIONAL':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <Flag className="h-3 w-3" /> National
          </span>
        );
      case 'FESTIVAL':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <PartyPopper className="h-3 w-3" /> Festival
          </span>
        );
      case 'RESTRICTED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            <CalendarCheck className="h-3 w-3" /> Restricted
          </span>
        );
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const holidaysColDefs = useMemo<ColDef[]>(() => [
    { field: "name", headerName: "Holiday Name", flex: 1, cellClass: "font-semibold text-sm" },
    { field: "holidayDate", headerName: "Date", width: 120, cellClass: "font-mono text-sm" },
    { 
      field: "day", 
      headerName: "Day", 
      width: 120, 
      cellClass: "text-sm text-muted-foreground",
      valueGetter: (p) => p.data.holidayDate ? new Date(p.data.holidayDate + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }) : '—'
    },
    { 
      field: "holidayType", 
      headerName: "Type", 
      width: 150,
      cellRenderer: (p: any) => getTypeBadge(p.value)
    },
    { 
      field: "isOptional", 
      headerName: "Optional", 
      width: 120,
      cellRenderer: (p: any) => (
        <Badge variant={p.value ? 'secondary' : 'outline'}>{p.value ? 'Optional' : 'Mandatory'}</Badge>
      )
    },
    { field: "description", headerName: "Description", flex: 1, cellClass: "text-xs text-muted-foreground truncate" },
    {
      headerName: "Actions",
      width: 120,
      sortable: false,
      filter: false,
      cellRenderer: (p: any) => (
        <div className="flex items-center justify-end gap-1 h-full">
          <Button size="sm" variant="ghost" className="h-8 w-8" onClick={() => handleOpenEdit(p.data)}>
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8" onClick={() => handleDeleteHoliday(p.data.id, p.data.name)}>
            <Trash2 className="h-3.5 w-3.5 text-red-500" />
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
          <h1 className="text-2xl font-bold tracking-tight">Holiday Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure national holidays, festive celebrations, and restricted optional holidays for working day calculations.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Holiday
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Year:</span>
            <Input
              type="number"
              className="w-28 h-9 text-xs"
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value) || currentYear)}
            />
          </div>
          <div className="w-40">
            <NativeSelect
              placeholder="All Months"
              value={filterMonth}
              onChange={(val) => setFilterMonth(val || '')}
            >
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </NativeSelect>
          </div>
          <div className="w-40">
            <NativeSelect
              placeholder="All Holiday Types"
              value={filterType}
              onChange={(val) => setFilterType(val || '')}
            >
              <option value="NATIONAL">National Holiday</option>
              <option value="FESTIVAL">Festival</option>
              <option value="RESTRICTED">Restricted Holiday</option>
            </NativeSelect>
          </div>
          <Button size="sm" variant="ghost" onClick={() => { setFilterYear(currentYear); setFilterMonth(''); setFilterType(''); }}>
            Reset Filters
          </Button>
        </CardContent>
      </Card>

      {/* Holidays Table */}
      <div className="h-[500px]">
        <DataGrid rowData={holidays} columnDefs={holidaysColDefs} />
      </div>

      {/* Create / Edit Holiday Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent onClose={() => setModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editingHoliday ? 'Edit Holiday' : 'Add Company Holiday'}</DialogTitle>
            <DialogDescription>
              Holidays automatically exempt working day deductions in leave calculation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveHoliday} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Holiday Name</label>
              <Input
                placeholder="e.g. Independence Day"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Holiday Date</label>
                <Input
                  type="date"
                  value={form.holidayDate}
                  onChange={(e) => setForm({ ...form, holidayDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Holiday Type</label>
                <NativeSelect
                  value={form.holidayType}
                  onChange={(val) => setForm({ ...form, holidayType: val || 'NATIONAL' })}
                >
                  <option value="NATIONAL">National Holiday</option>
                  <option value="FESTIVAL">Festival</option>
                  <option value="RESTRICTED">Restricted Holiday</option>
                </NativeSelect>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Input
                placeholder="Details or holiday notes..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isOptional}
                  onChange={(e) => setForm({ ...form, isOptional: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span>Optional / Floating Holiday</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createHolidayMutation.isPending || updateHolidayMutation.isPending}>
                {editingHoliday ? 'Save Changes' : 'Create Holiday'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
