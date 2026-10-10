import type { EmailLog, EmailTemplate } from "@/api/emailTemplates";
import { useAlert } from "@/components/common/AlertProvider";
import { ActionMenu } from "@/components/common/ActionMenu";
import { DataGrid } from "@/components/common/DataGrid";
import { GridDateFloatingFilter } from "@/components/common/GridDateFloatingFilter";
import { ListingCard } from "@/components/common/ListingCard";
import { ListingHeader } from "@/components/common/ListingHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  useCreateEmailTemplate,
  useDeleteEmailTemplate,
  useDuplicateEmailTemplate,
  useEmailLogs,
  useEmailTemplates,
  useEmailVariables,
  useSendTestEmail,
  useSetDefaultEmailTemplate,
  useToggleEmailTemplateStatus,
  useUpdateEmailTemplate,
} from "@/hooks/useEmailTemplates";
import { useQueryClient } from "@tanstack/react-query";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { ColDef } from "ag-grid-community";
import type { AgGridReact } from "ag-grid-react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Mail,
  Pencil,
  Plus,
  Power,
  Send,
  Sparkles,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/use-toast";

const TEMPLATE_TYPES = [
  { value: "ALL", label: "All Types" },
  { value: "Payslip", label: "Payslip" },
  { value: "Leave", label: "Leave" },
  { value: "Attendance", label: "Attendance" },
  { value: "Employee", label: "Employee Lifecycle" },
  { value: "General", label: "General Notification" },
];

import { useAuth } from "@/context/AuthContext";

export default function EmailTemplates() {
  const { confirm } = useAlert();
  const { hasPermission } = useAuth();
  const canAdd =
    hasPermission("settings.create") || hasPermission("email_templates.create");
  const canEdit =
    hasPermission("settings.edit") || hasPermission("email_templates.edit");
  const canDelete =
    hasPermission("settings.delete") || hasPermission("email_templates.delete");

  const queryClient = useQueryClient();
  const gridRef = useRef<AgGridReact>(null);
  const logsGridRef = useRef<AgGridReact>(null);

  // Tab state: 'templates' | 'logs'
  const [activeTab, setActiveTab] = useState<string>("templates");

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [defaultFilter, setDefaultFilter] = useState<string>("ALL");

  // Main list query
  const {
    data: templatesRes,
    isLoading,
    refetch,
  } = useEmailTemplates({
    search: search.trim() || undefined,
    templateType: typeFilter !== "ALL" ? typeFilter : undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    isDefault: defaultFilter === "DEFAULT" ? true : undefined,
  });

  const templates = templatesRes?.data || [];

  // Logs query
  const {
    data: logsRes,
    isLoading: logsLoading,
    refetch: refetchLogs,
  } = useEmailLogs({
    limit: 50,
  });
  const logs = logsRes?.data || [];

  // Variable definitions query
  const { data: varData } = useEmailVariables();

  // Mutations
  const createMutation = useCreateEmailTemplate();
  const updateMutation = useUpdateEmailTemplate();
  const deleteMutation = useDeleteEmailTemplate();
  const duplicateMutation = useDuplicateEmailTemplate();
  const toggleStatusMutation = useToggleEmailTemplateStatus();
  const setDefaultMutation = useSetDefaultEmailTemplate();
  const sendTestMutation = useSendTestEmail();

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicatingTemplate, setDuplicatingTemplate] =
    useState<EmailTemplate | null>(null);
  const [testEmailModalOpen, setTestEmailModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    templateCode: "",
    templateName: "",
    templateType: "Payslip",
    description: "",
    subject: "",
    bodyHtml: "<p></p>",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    isDefault: false,
    changeSummary: "",
  });

  // Duplicate form state
  const [duplicateForm, setDuplicateForm] = useState({
    newTemplateCode: "",
    newTemplateName: "",
  });

  // Test email state
  const [testRecipient, setTestRecipient] = useState("admin@paymatrix.com");

  // Variable picker dropdown state
  const [varDropdownOpen, setVarDropdownOpen] = useState(false);
  const [subjectVarDropdownOpen, setSubjectVarDropdownOpen] = useState(false);

  // Tiptap editor setup
  const editor = useEditor({
    extensions: [StarterKit],
    content: formData.bodyHtml || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[260px] p-4 text-foreground bg-transparent",
      },
    },
  });

  // Sync editor content when editingTemplate changes
  useEffect(() => {
    if (editor && editModalOpen) {
      editor.commands.setContent(formData.bodyHtml || "<p></p>");
    }
  }, [editModalOpen, editor]);

  // Insert variable into editor at cursor
  const handleInsertVariable = (varName: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(`{{${varName}}}`).run();
    setVarDropdownOpen(false);
  };

  // Insert variable into subject field
  const handleInsertSubjectVariable = (varName: string) => {
    setFormData((prev) => ({
      ...prev,
      subject: prev.subject
        ? `${prev.subject} {{${varName}}}`
        : `{{${varName}}}`,
    }));
    setSubjectVarDropdownOpen(false);
  };

  // Filter variables for selected template type
  const availableVariables = useMemo(() => {
    if (!varData?.variables) return [];
    return varData.variables.filter(
      (v) =>
        v.templateTypes.includes(formData.templateType) ||
        v.templateTypes.includes("General"),
    );
  }, [varData, formData.templateType]);

  // Group variables by category
  const groupedVariables = useMemo(() => {
    const groups: Record<string, typeof availableVariables> = {};
    for (const v of availableVariables) {
      if (!groups[v.category]) groups[v.category] = [];
      groups[v.category].push(v);
    }
    return groups;
  }, [availableVariables]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingTemplate(null);
    const initialBody = "<p>Dear <strong>{{EmployeeName}}</strong>,</p><p></p>";
    setFormData({
      templateCode: "",
      templateName: "",
      templateType: typeFilter !== "ALL" ? typeFilter : "Payslip",
      description: "",
      subject: "",
      bodyHtml: initialBody,
      status: "ACTIVE",
      isDefault: false,
      changeSummary: "",
    });
    if (editor) {
      editor.commands.setContent(initialBody);
    }
    setEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (tpl: EmailTemplate) => {
    setEditingTemplate(tpl);
    setFormData({
      templateCode: tpl.templateCode,
      templateName: tpl.templateName,
      templateType: tpl.templateType,
      description: tpl.description || "",
      subject: tpl.subject,
      bodyHtml: tpl.bodyHtml,
      status: tpl.status,
      isDefault: tpl.isDefault,
      changeSummary: "",
    });
    if (editor) {
      editor.commands.setContent(tpl.bodyHtml);
    }
    setEditModalOpen(true);
  };

  // Open Duplicate Modal
  const handleOpenDuplicate = (tpl: EmailTemplate) => {
    setDuplicatingTemplate(tpl);
    setDuplicateForm({
      newTemplateCode: `${tpl.templateCode}_COPY`,
      newTemplateName: `${tpl.templateName} (Copy)`,
    });
    setDuplicateModalOpen(true);
  };

  // Save (Create or Update)
  const handleSave = async () => {
    if (!formData.templateCode.trim()) {
      toast.error("Template Code is required");
      return;
    }
    if (!formData.templateName.trim()) {
      toast.error("Template Name is required");
      return;
    }
    if (!formData.subject.trim()) {
      toast.error("Subject is required");
      return;
    }

    const bodyHtml = editor ? editor.getHTML() : "";
    if (!bodyHtml || bodyHtml === "<p></p>") {
      toast.error("Email Body is required");
      return;
    }

    if (editingTemplate) {
      await updateMutation.mutateAsync({
        id: editingTemplate.id,
        data: {
          templateCode: formData.templateCode.toUpperCase().trim(),
          templateName: formData.templateName.trim(),
          templateType: formData.templateType,
          description: formData.description.trim() || undefined,
          subject: formData.subject.trim(),
          bodyHtml,
          status: formData.status,
          isDefault: formData.isDefault,
          changeSummary: formData.changeSummary.trim() || undefined,
        },
      });
    } else {
      await createMutation.mutateAsync({
        templateCode: formData.templateCode.toUpperCase().trim(),
        templateName: formData.templateName.trim(),
        templateType: formData.templateType,
        description: formData.description.trim() || undefined,
        subject: formData.subject.trim(),
        bodyHtml,
        status: formData.status,
        isDefault: formData.isDefault,
      });
    }
    setEditModalOpen(false);
  };

  // Handle Duplicate Submit
  const handleDuplicateSubmit = async () => {
    if (!duplicatingTemplate) return;
    if (!duplicateForm.newTemplateCode.trim()) {
      toast.error("New Template Code is required");
      return;
    }
    if (!duplicateForm.newTemplateName.trim()) {
      toast.error("New Template Name is required");
      return;
    }

    await duplicateMutation.mutateAsync({
      id: duplicatingTemplate.id,
      data: {
        newTemplateCode: duplicateForm.newTemplateCode.toUpperCase().trim(),
        newTemplateName: duplicateForm.newTemplateName.trim(),
      },
    });
    setDuplicateModalOpen(false);
  };

  // Handle Send Test Email
  const handleTriggerTestEmail = (tpl?: EmailTemplate) => {
    if (tpl) {
      setEditingTemplate(tpl);
      setFormData({
        templateCode: tpl.templateCode,
        templateName: tpl.templateName,
        templateType: tpl.templateType,
        description: tpl.description || "",
        subject: tpl.subject,
        bodyHtml: tpl.bodyHtml || "",
        status: tpl.status,
        isDefault: tpl.isDefault,
        changeSummary: "",
      });
    }
    setTestEmailModalOpen(true);
  };

  const handleExecuteSendTest = async () => {
    if (!testRecipient.trim() || !testRecipient.includes("@")) {
      toast.error("Please enter a valid recipient email address");
      return;
    }

    const subject = formData.subject;
    const bodyHtml = editor
      ? editor.getHTML()
      : editingTemplate?.bodyHtml || "";

    await sendTestMutation.mutateAsync({
      templateId: editingTemplate?.id,
      data: {
        toEmail: testRecipient.trim(),
        templateType: formData.templateType,
        subject,
        bodyHtml,
      },
    });
    setTestEmailModalOpen(false);
  };

  // AG-Grid column definitions for Templates
  const templateColumns: ColDef[] = useMemo(
    () => [
      {
        headerName: "Sr.",
        valueGetter: (p: any) =>
          p.node?.rowIndex != null ? p.node.rowIndex + 1 : "",
        width: 65,
        suppressMenu: true,
      },
      {
        headerName: "Template Code",
        field: "templateCode",
        width: 200,
      },
      {
        headerName: "Template Name",
        field: "templateName",
        width: 220,
      },
      {
        headerName: "Type",
        field: "templateType",
        width: 100,
        cellRenderer: (p: any) => {
          const type = p.value;
          let color = "bg-blue-50 text-blue-700 border-blue-200";
          if (type === "Payslip")
            color = "bg-emerald-50 text-emerald-700 border-emerald-200";
          else if (type === "Leave")
            color = "bg-amber-50 text-amber-700 border-amber-200";
          else if (type === "Attendance")
            color = "bg-purple-50 text-purple-700 border-purple-200";
          else if (type === "Employee")
            color = "bg-indigo-50 text-indigo-700 border-indigo-200";
          return (
            <Badge variant="outline" className={`font-medium ${color}`}>
              {type}
            </Badge>
          );
        },
      },
      {
        headerName: "Subject",
        field: "subject",
        width: 200,
      },
      {
        headerName: "Status",
        field: "status",
        width: 105,
      },
      {
        headerName: "Default",
        field: "isDefault",
        width: 100,
      },
      {
        headerName: "Updated",
        field: "updatedAt",
        width: 130,
        valueFormatter: (p: any) =>
          p.value ? new Date(p.value).toLocaleDateString("en-IN") : "—",
      },
      {
        headerName: "Actions",
        width: 80,
        sortable: false,
        filter: false,
        cellClass: "flex items-center justify-center",
        cellRenderer: (p: any) => {
          const tpl: EmailTemplate = p.data;
          return (
            <ActionMenu
              orientation="horizontal"
              items={[
                {
                  label: "Edit Template",
                  icon: <Pencil className="h-3.5 w-3.5" />,
                  onClick: () => handleOpenEdit(tpl),
                  hidden: !canEdit,
                },
                {
                  label: "Send Test Email",
                  icon: <Send className="h-3.5 w-3.5" />,
                  onClick: () => handleTriggerTestEmail(tpl),
                  hidden: !canEdit,
                },
                {
                  label: "Duplicate",
                  icon: <Copy className="h-3.5 w-3.5" />,
                  onClick: () => handleOpenDuplicate(tpl),
                  hidden: !canAdd,
                },
                {
                  label: tpl.isDefault ? "Default Template" : "Set as Default",
                  icon: <Star className="h-3.5 w-3.5" />,
                  onClick: () => setDefaultMutation.mutate(tpl.id),
                  disabled: tpl.isDefault,
                  hidden: !canEdit,
                },
                {
                  label: tpl.status === "ACTIVE" ? "Deactivate" : "Activate",
                  icon: <Power className="h-3.5 w-3.5" />,
                  onClick: () => toggleStatusMutation.mutate(tpl.id),
                  hidden: !canEdit,
                },
                {
                  label: "Delete",
                  icon: <Trash2 className="h-3.5 w-3.5" />,
                  destructive: true,
                  separator: true,
                  hidden: !canDelete,
                  onClick: async () => {
                    if (
                      await confirm({
                        message: `Are you sure you want to delete template "${tpl.templateName}"?`,
                      })
                    ) {
                      deleteMutation.mutate(tpl.id);
                    }
                  },
                },
              ]}
            />
          );
        },
      },
    ],
    [canAdd, canEdit, canDelete],
  );

  // AG-Grid column definitions for Logs
  const logColumns: ColDef[] = useMemo(
    () => [
      {
        headerName: "Sr.",
        valueGetter: (p: any) =>
          p.node?.rowIndex != null ? p.node.rowIndex + 1 : "",
        width: 65,
      },
      {
        headerName: "Status",
        field: "status",
        width: 120,
        cellRenderer: (p: any) => {
          const status: EmailLog["status"] = p.value;
          if (status === "SENT") {
            return (
              <Badge className="bg-emerald-600 text-white flex items-center gap-1 w-fit">
                <CheckCircle2 className="h-3 w-3" /> Sent
              </Badge>
            );
          } else if (status === "FAILED") {
            return (
              <Badge
                variant="destructive"
                className="flex items-center gap-1 w-fit"
              >
                <XCircle className="h-3 w-3" /> Failed
              </Badge>
            );
          } else {
            return (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 w-fit"
              >
                <Clock className="h-3 w-3" /> Pending
              </Badge>
            );
          }
        },
      },
      {
        headerName: "Recipient",
        field: "toEmail",
        width: 230,
        cellRenderer: (p: any) => (
          <span className="font-mono text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
            {p.value}
          </span>
        ),
      },
      {
        headerName: "Reference",
        field: "referenceType",
        width: 130,
        cellRenderer: (p: any) => (
          <Badge variant="outline" className="font-normal text-xs">
            {p.value || "General"}
          </Badge>
        ),
      },
      {
        headerName: "Subject",
        field: "subject",
        minWidth: 200,
        cellRenderer: (p: any) => (
          <span
            className="truncate block text-slate-700 dark:text-slate-300"
            title={p.value}
          >
            {p.value}
          </span>
        ),
      },
      {
        headerName: "Sent / Created At",
        field: "createdAt",
        width: 180,
        valueFormatter: (p: any) => {
          if (!p.value) return "—";
          const d = new Date(p.value);
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const year = d.getFullYear();
          const time = d.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          return `${day}/${month}/${year} ${time}`;
        },
        filter: "agTextColumnFilter",
        floatingFilterComponent: GridDateFloatingFilter,
      },
      {
        headerName: "Error / Details",
        field: "errorMessage",
        width: 240,
        cellRenderer: (p: any) => (
          <span
            className="text-xs text-muted-foreground truncate block"
            title={p.value}
          >
            {p.value || "—"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <ListingCard>
      {/* Header with Search and Actions */}
      <ListingHeader
        title="Email Template Master"
        subtitle={`${templates.length} templates`}
        searchValue={search}
        onSearchChange={setSearch}
        onAddNew={canAdd ? handleOpenAdd : undefined}
        addButtonText="Create Template"
        onRefresh={() => {
          refetch();
          refetchLogs();
        }}
        tabs={{
          options: [
            { label: "Templates", value: "templates" },
            { label: "Email Logs", value: "logs" },
          ],
          value: activeTab,
          onChange: setActiveTab,
        }}
      />

      {activeTab === "templates" ? (
        <div className="space-y-3">
          {/* Quick Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 flex-wrap">
                {TEMPLATE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTypeFilter(t.value)}
                    className={`px-3 py-1.5 rounded-md text-xs transition-colors border font-medium ${
                      typeFilter === t.value
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border-border"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground font-medium">
                  Status:
                </span>
                <Select
                  value={statusFilter}
                  onValueChange={(val: any) => setStatusFilter(val)}
                >
                  <SelectTrigger className="h-7 w-28 text-xs bg-background border-input">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground font-medium">
                  Default:
                </span>
                <Select value={defaultFilter} onValueChange={setDefaultFilter}>
                  <SelectTrigger className="h-7 w-28 text-xs bg-background border-input">
                    <SelectValue placeholder="Default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="DEFAULT">Default Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* AG-Grid Data Table */}
          <div className="h-[520px] w-full border border-border rounded-sm overflow-hidden bg-card">
            <DataGrid
              ref={gridRef}
              rowData={templates}
              columnDefs={templateColumns}
              gridOptions={{
                onRowDoubleClicked: (e) => handleOpenEdit(e.data),
                rowHeight: 40,
                headerHeight: 38,
              }}
            />
          </div>
        </div>
      ) : (
        /* Logs Tab */
        <div className="space-y-3">
          <div className="h-[520px] w-full border border-border rounded-sm overflow-hidden bg-card">
            <DataGrid
              ref={logsGridRef}
              rowData={logs}
              columnDefs={logColumns}
              gridOptions={{
                rowHeight: 40,
                headerHeight: 38,
              }}
            />
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* ADD / EDIT TEMPLATE MODAL                                                  */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              {editingTemplate
                ? `Template: ${editingTemplate.templateName}`
                : "Create New Email Template"}
            </DialogTitle>
            <DialogDescription>
              Configure the email subject, rich HTML body, dynamic variable
              placeholders, and defaults.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Row 1: Code, Name, Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold">
                  Template Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. PAYSLIP_MONTHLY"
                  value={formData.templateCode}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      templateCode: e.target.value
                        .toUpperCase()
                        .replace(/\s+/g, "_"),
                    }))
                  }
                  className="h-8 text-xs font-mono mt-1"
                />
                <span className="text-[10px] text-muted-foreground">
                  Unique identifier used by backend services
                </span>
              </div>

              <div>
                <Label className="text-xs font-semibold">
                  Template Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. Monthly Payslip Notification"
                  value={formData.templateName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      templateName: e.target.value,
                    }))
                  }
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">
                  Template Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.templateType}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, templateType: val }))
                  }
                >
                  <SelectTrigger className="h-8 text-xs mt-1 bg-background border-input">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Payslip">Payslip</SelectItem>
                    <SelectItem value="Leave">Leave</SelectItem>
                    <SelectItem value="Attendance">Attendance</SelectItem>
                    <SelectItem value="Employee">Employee Lifecycle</SelectItem>
                    <SelectItem value="General">
                      General Notification
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Description */}
            <div>
              <Label className="text-xs font-semibold">Description</Label>
              <Input
                placeholder="Brief explanation of when and how this email is dispatched..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="h-8 text-xs mt-1"
              />
            </div>

            {/* Row 3: Subject with Insert Variable Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs font-semibold">
                  Email Subject <span className="text-red-500">*</span>
                </Label>
              </div>

              <Input
                placeholder="e.g. Payslip for {{PayMonth}} - {{EmployeeName}}"
                value={formData.subject}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subject: e.target.value }))
                }
                className="h-8 text-xs font-medium"
              />
            </div>

            {/* Row 4: Variable Quick-Click Palette */}
            <div className="bg-muted/40 border border-border rounded-lg p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Supported Dynamic Variables for {formData.templateType} (Click
                  to insert in body):
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Substituted at runtime with live employee & payroll values
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                {availableVariables.map((v) => (
                  <Badge
                    key={v.variable}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all text-[11px] py-0.5 px-2 bg-card text-foreground flex items-center gap-1 border-border"
                    onClick={() => handleInsertVariable(v.variable)}
                    title={v.description}
                  >
                    <span>{v.label}</span>
                    <span className="text-[10px] opacity-75 font-mono">{`{{${v.variable}}}`}</span>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Row 5: Rich Text Editor for Email Body */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Email Body (HTML) <span className="text-red-500">*</span>
                </Label>
              </div>

              {/* Tiptap Toolbar & Editor Container */}
              <div className="border border-border rounded-md overflow-hidden bg-card text-card-foreground shadow-xs">
                <div className="flex items-center gap-1 p-1.5 border-b border-border bg-muted/40 flex-wrap text-xs">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    className={`h-7 px-2 font-bold ${editor?.isActive("bold") ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : ""}`}
                  >
                    B
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    className={`h-7 px-2 italic ${editor?.isActive("italic") ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : ""}`}
                  >
                    I
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => editor?.chain().focus().toggleStrike().run()}
                    className={`h-7 px-2 line-through ${editor?.isActive("strike") ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : ""}`}
                  >
                    S
                  </Button>

                  <div className="w-px h-4 bg-border mx-1" />

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      editor?.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                    className={`h-7 px-2 font-semibold ${editor?.isActive("heading", { level: 2 }) ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : ""}`}
                  >
                    H2
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      editor?.chain().focus().toggleHeading({ level: 3 }).run()
                    }
                    className={`h-7 px-2 font-semibold ${editor?.isActive("heading", { level: 3 }) ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : ""}`}
                  >
                    H3
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => editor?.chain().focus().setParagraph().run()}
                    className={`h-7 px-2 ${editor?.isActive("paragraph") ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : ""}`}
                  >
                    P
                  </Button>

                  <div className="w-px h-4 bg-border mx-1" />

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      editor?.chain().focus().toggleBulletList().run()
                    }
                    className={`h-7 px-2 ${editor?.isActive("bulletList") ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : ""}`}
                  >
                    • Bullet
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      editor?.chain().focus().toggleOrderedList().run()
                    }
                    className={`h-7 px-2 ${editor?.isActive("orderedList") ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : ""}`}
                  >
                    1. Numbered
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      editor?.chain().focus().toggleBlockquote().run()
                    }
                    className={`h-7 px-2 ${editor?.isActive("blockquote") ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : ""}`}
                  >
                    Quote
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      editor?.chain().focus().setHorizontalRule().run()
                    }
                    className="h-7 px-2"
                  >
                    Line
                  </Button>
                </div>

                <EditorContent editor={editor} className="min-h-[260px]" />
              </div>
            </div>

            {/* Row 6: Status & Default Switches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-3 rounded-md border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold">Active Status</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Only active templates are used for business dispatches.
                  </p>
                </div>
                <Switch
                  checked={formData.status === "ACTIVE"}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: checked ? "ACTIVE" : "INACTIVE",
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    Default for {formData.templateType}
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Setting this default replaces any prior default for this
                    type.
                  </p>
                </div>
                <Switch
                  checked={formData.isDefault}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isDefault: checked }))
                  }
                />
              </div>
            </div>

            {/* Version Change Summary (if editing existing) */}
            {editingTemplate && (
              <div>
                <Label className="text-xs font-semibold">
                  Change Summary / Version Notes (Optional)
                </Label>
                <Input
                  placeholder="e.g. Updated salary breakdown table formatting"
                  value={formData.changeSummary}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      changeSummary: e.target.value,
                    }))
                  }
                  className="h-8 text-xs mt-1"
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 text-emerald-600 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                onClick={() => handleTriggerTestEmail()}
              >
                <Send className="h-3.5 w-3.5" />
                Test Email
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs"
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingTemplate
                    ? "Update Template"
                    : "Save Template"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* DUPLICATE TEMPLATE MODAL                                                   */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={duplicateModalOpen} onOpenChange={setDuplicateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Copy className="h-4 w-4 text-indigo-600" />
              Duplicate Template
            </DialogTitle>
            <DialogDescription>
              Create a new copy of "{duplicatingTemplate?.templateName}" without
              modifying the original.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-semibold">
                New Template Code *
              </Label>
              <Input
                value={duplicateForm.newTemplateCode}
                onChange={(e) =>
                  setDuplicateForm((prev) => ({
                    ...prev,
                    newTemplateCode: e.target.value
                      .toUpperCase()
                      .replace(/\s+/g, "_"),
                  }))
                }
                className="h-8 text-xs font-mono mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">
                New Template Name *
              </Label>
              <Input
                value={duplicateForm.newTemplateName}
                onChange={(e) =>
                  setDuplicateForm((prev) => ({
                    ...prev,
                    newTemplateName: e.target.value,
                  }))
                }
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setDuplicateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleDuplicateSubmit}
              disabled={duplicateMutation.isPending}
            >
              {duplicateMutation.isPending ? "Duplicating..." : "Create Copy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TEST EMAIL DISPATCH MODAL                                                  */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={testEmailModalOpen} onOpenChange={setTestEmailModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Send className="h-4 w-4 text-emerald-600" />
              Send Test Email
            </DialogTitle>
            <DialogDescription>
              Dispatches a test email using current draft templates with mock
              variables.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-semibold">
                Recipient Email Address *
              </Label>
              <Input
                type="email"
                placeholder="e.g. yourname@company.com"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-xs text-amber-800 space-y-1">
              <div className="flex items-center gap-1 font-semibold">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                Sample Data Safeguard
              </div>
              <p className="text-[11px] leading-relaxed">
                Test emails render using safe, mocked business data. No actual
                employee salary or personal data will ever be sent during
                template testing.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setTestEmailModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              onClick={handleExecuteSendTest}
              disabled={sendTestMutation.isPending}
            >
              <Send className="h-3 w-3" />
              {sendTestMutation.isPending ? "Sending..." : "Send Test Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ListingCard>
  );
}
