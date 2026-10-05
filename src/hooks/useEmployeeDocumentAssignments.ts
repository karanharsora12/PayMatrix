import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '@/api/employees';

export const documentAssignmentKeys = {
  all: (employeeId: string) => ['employee-document-assignments', employeeId] as const,
};

export function useEmployeeDocumentAssignments(employeeId: string) {
  return useQuery({
    queryKey: documentAssignmentKeys.all(employeeId),
    queryFn: () => employeeApi.listDocumentAssignments(employeeId),
    enabled: !!employeeId,
  });
}

export function useCreateDocumentAssignment(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => employeeApi.createDocumentAssignment(employeeId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentAssignmentKeys.all(employeeId) }),
  });
}

export function useUpdateDocumentAssignment(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, payload }: { assignmentId: string; payload: any }) => 
      employeeApi.updateDocumentAssignment(employeeId, assignmentId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentAssignmentKeys.all(employeeId) }),
  });
}

export function useDeleteDocumentAssignment(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => employeeApi.deleteDocumentAssignment(employeeId, assignmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentAssignmentKeys.all(employeeId) }),
  });
}
