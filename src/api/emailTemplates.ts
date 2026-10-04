import { api, unwrap, type Paginated } from "./client";

export interface EmailTemplate {
  id: string;
  companyId: string;
  templateCode: string;
  templateName: string;
  templateType: string;
  description?: string | null;
  subject: string;
  bodyHtml: string;
  status: "ACTIVE" | "INACTIVE";
  isDefault: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  versions?: EmailTemplateVersion[];
}

export interface EmailTemplateVersion {
  id: string;
  templateId: string;
  versionNo: number;
  subject: string;
  bodyHtml: string;
  changeSummary?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export interface EmailVariableDefinition {
  variable: string;
  label: string;
  category: "Employee" | "Payslip" | "Leave" | "Attendance" | "Company" | "System";
  description: string;
  sampleValue?: string;
  templateTypes: string[];
}

export interface EmailLog {
  id: string;
  companyId: string;
  templateId?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  toEmail: string;
  cc?: string | null;
  bcc?: string | null;
  subject: string;
  bodyHtml?: string | null;
  status: "PENDING" | "SENT" | "FAILED";
  sentAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  template?: {
    templateCode: string;
    templateName: string;
    templateType: string;
  } | null;
}

export interface CreateEmailTemplatePayload {
  templateCode: string;
  templateName: string;
  templateType: string;
  description?: string;
  subject: string;
  bodyHtml: string;
  status?: "ACTIVE" | "INACTIVE";
  isDefault?: boolean;
}

export interface UpdateEmailTemplatePayload {
  templateCode?: string;
  templateName?: string;
  templateType?: string;
  description?: string;
  subject?: string;
  bodyHtml?: string;
  status?: "ACTIVE" | "INACTIVE";
  isDefault?: boolean;
  changeSummary?: string;
}

export interface DuplicateEmailTemplatePayload {
  newTemplateCode: string;
  newTemplateName: string;
}

export interface TestEmailPayload {
  toEmail: string;
  templateType?: string;
  subject?: string;
  bodyHtml?: string;
}

export interface QueryEmailTemplatesParams {
  search?: string;
  templateType?: string;
  status?: "ACTIVE" | "INACTIVE" | "ALL";
  isDefault?: boolean | string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const emailTemplatesApi = {
  list: async (params?: QueryEmailTemplatesParams): Promise<Paginated<EmailTemplate>> => {
    const res = await api.get("/email-templates", { params });
    const unwrapped = unwrap<EmailTemplate[]>(res);
    return {
      data: unwrapped.data || [],
      meta: unwrapped.meta || {
        page: params?.page ?? 1,
        pageSize: params?.limit ?? 20,
        total: unwrapped.data?.length ?? 0,
        totalPages: 1,
      },
    };
  },

  get: async (id: string): Promise<EmailTemplate> => {
    const res = await api.get(`/email-templates/${id}`);
    return unwrap<EmailTemplate>(res).data;
  },

  create: async (data: CreateEmailTemplatePayload): Promise<EmailTemplate> => {
    const res = await api.post("/email-templates", data);
    return unwrap<EmailTemplate>(res).data;
  },

  update: async (id: string, data: UpdateEmailTemplatePayload): Promise<EmailTemplate> => {
    const res = await api.patch(`/email-templates/${id}`, data);
    return unwrap<EmailTemplate>(res).data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/email-templates/${id}`);
  },

  duplicate: async (id: string, data: DuplicateEmailTemplatePayload): Promise<EmailTemplate> => {
    const res = await api.post(`/email-templates/${id}/duplicate`, data);
    return unwrap<EmailTemplate>(res).data;
  },

  toggleStatus: async (id: string): Promise<EmailTemplate> => {
    const res = await api.post(`/email-templates/${id}/toggle-status`);
    return unwrap<EmailTemplate>(res).data;
  },

  setDefault: async (id: string): Promise<EmailTemplate> => {
    const res = await api.post(`/email-templates/${id}/set-default`);
    return unwrap<EmailTemplate>(res).data;
  },

  getVariables: async (templateType?: string): Promise<{
    variables: EmailVariableDefinition[];
    categories: Record<string, EmailVariableDefinition[]>;
    supportedTypes: Array<{ value: string; label: string }>;
  }> => {
    const res = await api.get("/email-templates/variables", {
      params: templateType ? { templateType } : undefined,
    });
    return unwrap<any>(res).data;
  },

  sendTestEmail: async (data: TestEmailPayload, templateId?: string): Promise<{
    success: boolean;
    status: string;
    logId?: string;
    simulated?: boolean;
    message: string;
  }> => {
    const url = templateId
      ? `/email-templates/${templateId}/test-email`
      : "/email-templates/test-email";
    const res = await api.post(url, data);
    return unwrap<any>(res).data;
  },

  listLogs: async (params?: { page?: number; limit?: number; templateId?: string }): Promise<Paginated<EmailLog>> => {
    const res = await api.get("/email-templates/logs", { params });
    const unwrapped = unwrap<EmailLog[]>(res);
    return {
      data: unwrapped.data || [],
      meta: unwrapped.meta || {
        page: params?.page ?? 1,
        pageSize: params?.limit ?? 20,
        total: unwrapped.data?.length ?? 0,
        totalPages: 1,
      },
    };
  },

  // Payslip integration
  sendPayslipEmail: async (payslipId: string): Promise<{
    toEmail: string;
    subject: string;
    status: string;
    message: string;
  }> => {
    const res = await api.post(`/payslips/${payslipId}/send-email`);
    return unwrap<any>(res).data;
  },

  sendBatchPayslipEmails: async (payslipIds: string[]): Promise<{
    total: number;
    sentCount: number;
    failCount: number;
    details: any[];
  }> => {
    const res = await api.post("/payslips/send-batch-emails", { payslipIds });
    return unwrap<any>(res).data;
  },
};
