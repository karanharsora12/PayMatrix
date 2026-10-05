import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import {
  emailTemplatesApi,
  type CreateEmailTemplatePayload,
  type DuplicateEmailTemplatePayload,
  type QueryEmailTemplatesParams,
  type TestEmailPayload,
  type UpdateEmailTemplatePayload,
} from "@/api/emailTemplates";

export const emailTemplateKeys = {
  all: ["email-templates"] as const,
  list: (params: QueryEmailTemplatesParams = {}) =>
    [...emailTemplateKeys.all, "list", params] as const,
  detail: (id: string) => [...emailTemplateKeys.all, "detail", id] as const,
  variables: (templateType?: string) =>
    [...emailTemplateKeys.all, "variables", templateType || "ALL"] as const,
  logs: (params?: any) => [...emailTemplateKeys.all, "logs", params] as const,
};

export function useEmailTemplates(params: QueryEmailTemplatesParams = {}) {
  return useQuery({
    queryKey: emailTemplateKeys.list(params),
    queryFn: () => emailTemplatesApi.list(params),
  });
}

export function useEmailTemplate(id?: string) {
  return useQuery({
    queryKey: emailTemplateKeys.detail(id || ""),
    queryFn: () => emailTemplatesApi.get(id!),
    enabled: !!id,
  });
}

export function useEmailVariables(templateType?: string) {
  return useQuery({
    queryKey: emailTemplateKeys.variables(templateType),
    queryFn: () => emailTemplatesApi.getVariables(templateType),
  });
}

export function useEmailLogs(params?: any) {
  return useQuery({
    queryKey: emailTemplateKeys.logs(params),
    queryFn: () => emailTemplatesApi.listLogs(params),
  });
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEmailTemplatePayload) => emailTemplatesApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.all });
      toast.success(`Email template "${res.templateName}" created successfully`);
    },
    onError: (err: any) => {
      toast.error(err.normalizedError?.message || err.message || "Failed to create email template");
    },
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmailTemplatePayload }) =>
      emailTemplatesApi.update(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.all });
      toast.success(`Email template "${res.templateName}" updated successfully`);
    },
    onError: (err: any) => {
      toast.error(err.normalizedError?.message || err.message || "Failed to update email template");
    },
  });
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emailTemplatesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.all });
      toast.success("Email template deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.normalizedError?.message || err.message || "Failed to delete email template");
    },
  });
}

export function useDuplicateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DuplicateEmailTemplatePayload }) =>
      emailTemplatesApi.duplicate(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.all });
      toast.success(`Duplicate template "${res.templateName}" created successfully`);
    },
    onError: (err: any) => {
      toast.error(err.normalizedError?.message || err.message || "Failed to duplicate email template");
    },
  });
}

export function useToggleEmailTemplateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emailTemplatesApi.toggleStatus(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.all });
      toast.success(`Template status updated to ${res.status}`);
    },
    onError: (err: any) => {
      toast.error(err.normalizedError?.message || err.message || "Failed to change template status");
    },
  });
}

export function useSetDefaultEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emailTemplatesApi.setDefault(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.all });
      toast.success(`"${res.templateName}" is now the default template for ${res.templateType}`);
    },
    onError: (err: any) => {
      toast.error(err.normalizedError?.message || err.message || "Failed to set default template");
    },
  });
}

export function useSendTestEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, templateId }: { data: TestEmailPayload; templateId?: string }) =>
      emailTemplatesApi.sendTestEmail(data, templateId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.logs() });
      if (res.simulated) {
        toast.info(res.message);
      } else {
        toast.success(res.message);
      }
    },
    onError: (err: any) => {
      toast.error(err.normalizedError?.message || err.message || "Failed to send test email");
    },
  });
}

export function useSendPayslipEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payslipId: string) => emailTemplatesApi.sendPayslipEmail(payslipId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.logs() });
      toast.success(res.message || `Payslip email dispatched to ${res.toEmail}`);
    },
    onError: (err: any) => {
      toast.error(err.normalizedError?.message || err.message || "Failed to send payslip email");
    },
  });
}
