import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { salaryComponentsApi } from '@/api/salaryComponents';
import { salaryStructuresApi } from '@/api/salaryStructures';
import type { StructureComponentItem } from '@/api/salaryStructures';
import { employeeSalaryApi } from '@/api/employeeSalary';
import { toast } from 'sonner';

// ==========================================
// Salary Components Hooks
// ==========================================
export function useSalaryComponents(params?: any) {
  return useQuery({
    queryKey: ['salary-components', params],
    queryFn: () => salaryComponentsApi.getComponents(params),
  });
}

export function useSalaryComponent(id?: string) {
  return useQuery({
    queryKey: ['salary-component', id],
    queryFn: () => (id ? salaryComponentsApi.getComponent(id) : null),
    enabled: Boolean(id),
  });
}

export function useCreateSalaryComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => salaryComponentsApi.createComponent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-components'] });
      toast.success('Salary component created successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create salary component');
    },
  });
}

export function useUpdateSalaryComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      salaryComponentsApi.updateComponent(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['salary-components'] });
      queryClient.invalidateQueries({ queryKey: ['salary-component', id] });
      toast.success('Salary component updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update salary component');
    },
  });
}

export function useDeleteSalaryComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salaryComponentsApi.deleteComponent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-components'] });
      toast.success('Salary component deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete salary component');
    },
  });
}

// ==========================================
// Salary Structures Hooks
// ==========================================
export function useSalaryStructures(params?: any) {
  return useQuery({
    queryKey: ['salary-structures', params],
    queryFn: () => salaryStructuresApi.getStructures(params),
  });
}

export function useSalaryStructure(id?: string) {
  return useQuery({
    queryKey: ['salary-structure', id],
    queryFn: () => (id ? salaryStructuresApi.getStructure(id) : null),
    enabled: Boolean(id),
  });
}

export function useCreateSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => salaryStructuresApi.createStructure(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      toast.success('Salary structure created successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create salary structure');
    },
  });
}

export function useUpdateSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      salaryStructuresApi.updateStructure(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      queryClient.invalidateQueries({ queryKey: ['salary-structure', id] });
      toast.success('Salary structure updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update salary structure');
    },
  });
}

export function useDeleteSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salaryStructuresApi.deleteStructure(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      toast.success('Salary structure deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete salary structure');
    },
  });
}

export function useSalaryStructurePreview() {
  return useMutation({
    mutationFn: (components: StructureComponentItem[]) =>
      salaryStructuresApi.previewStructure(components),
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to compute structure preview');
    },
  });
}

// ==========================================
// Employee Salary Hooks
// ==========================================
export function useEmployeeSalary(employeeId?: string) {
  return useQuery({
    queryKey: ['employee-salary', employeeId],
    queryFn: () => (employeeId ? employeeSalaryApi.getEmployeeSalary(employeeId) : null),
    enabled: Boolean(employeeId),
  });
}

export function useEmployeeSalaryHistory(employeeId?: string) {
  return useQuery({
    queryKey: ['employee-salary-history', employeeId],
    queryFn: () => (employeeId ? employeeSalaryApi.getEmployeeSalaryHistory(employeeId) : []),
    enabled: Boolean(employeeId),
  });
}

export function useAssignEmployeeSalary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: string; data: any }) =>
      employeeSalaryApi.assignOrReviseSalary(employeeId, data),
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: ['employee-salary', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee-salary-history', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['salary-preview', employeeId] });
      toast.success('Salary assigned / revised successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to assign / revise salary');
    },
  });
}

export function useCancelEmployeeSalary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      employeeId,
      salaryId,
      reason,
    }: {
      employeeId: string;
      salaryId: string;
      reason?: string;
    }) => employeeSalaryApi.cancelSalary(employeeId, salaryId, { reason }),
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: ['employee-salary', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee-salary-history', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['salary-preview', employeeId] });
      toast.success('Salary assignment cancelled');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to cancel salary assignment');
    },
  });
}

export function useSalaryPreview(
  employeeId?: string,
  params?: { month?: string; policy?: string },
) {
  return useQuery({
    queryKey: ['salary-preview', employeeId, params],
    queryFn: () => (employeeId ? employeeSalaryApi.getSalaryPreview(employeeId, params) : null),
    enabled: Boolean(employeeId),
  });
}

export function useSalaryCalculation() {
  const previewStructureMutation = useSalaryStructurePreview();
  return {
    previewStructure: previewStructureMutation.mutateAsync,
    isCalculating: previewStructureMutation.isPending,
  };
}
