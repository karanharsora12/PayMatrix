import { documentMasterApi } from "@/api/documentMaster";
import { documentTypesApi } from "@/api/documentTypes";
import { ActionMenu } from "@/components/common/ActionMenu";
import { useAlert } from "@/components/common/AlertProvider";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingCard } from "@/components/common/ListingCard";
import { ListingHeader } from "@/components/common/ListingHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { ColDef } from "ag-grid-community";
import type { AgGridReact } from "ag-grid-react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Copy,
  Edit2,
  Eye,
  FileText,
  Layers,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Repeat2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface DocField {
  label: string;
  variable: string;
  type: "Text" | "Date" | "Number" | "Currency";
  required: boolean;
  description?: string;
  order: number;
}

// ─── Document Type Form Dialog ────────────────────────────────────────────────
function DocTypeFormDialog({
  open,
  onClose,
  editingType,
}: {
  open: boolean;
  onClose: () => void;
  editingType: any | null;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    if (editingType) {
      setForm({
        code: editingType.code ?? "",
        name: editingType.name ?? "",
        description: editingType.description ?? "",
        displayOrder: editingType.displayOrder ?? 0,
        isActive: editingType.isActive ?? true,
      });
    } else {
      setForm({
        code: "",
        name: "",
        description: "",
        displayOrder: 0,
        isActive: true,
      });
    }
  }, [editingType, open]);

  const createMutation = useMutation({
    mutationFn: documentTypesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documentTypes"] });
      qc.invalidateQueries({ queryKey: ["documentMasterStats"] });
      toast.success("Document type created");
      onClose();
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || "Failed to create"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      documentTypesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documentTypes"] });
      toast.success("Document type updated");
      onClose();
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || "Failed to update"),
  });

  const handleSave = () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Code and Name are required");
      return;
    }
    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Document Type</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                Type Code <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. EMPLOYMENT"
                value={form.code}
                onChange={(e) =>
                  setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                }
                disabled={!!editingType}
              />
              <p className="text-xs text-muted-foreground">
                Uppercase, max 30 chars
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>
                Type Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Employment"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              placeholder="e.g. Documents related to employee joining and employment."
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Display Order</Label>
              <Input
                type="number"
                min={0}
                value={form.displayOrder}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    displayOrder: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <div className="flex items-center gap-2 h-9">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) =>
                    setForm((p) => ({ ...p, isActive: v }))
                  }
                />
                <span className="text-sm">
                  {form.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending
              ? "Saving..."
              : editingType
                ? "Update Type"
                : "Create Type"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Document Types Tab ───────────────────────────────────────────────────────
function DocumentTypesTab({
  search,
  onEdit,
}: {
  search: string;
  onEdit: (t: any) => void;
}) {
  const qc = useQueryClient();
  const { confirm } = useAlert();

  const { data: typesRes, isLoading } = useQuery({
    queryKey: ["documentTypes"],
    queryFn: () => documentTypesApi.list({ pageSize: 100 }),
  });
  const types = typesRes?.data || [];

  const filtered = types.filter(
    (t: any) =>
      !search ||
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.code?.toLowerCase().includes(search.toLowerCase()),
  );

  const activateMutation = useMutation({
    mutationFn: documentTypesApi.activate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documentTypes"] });
      qc.invalidateQueries({ queryKey: ["documentMasterStats"] });
      toast.success("Document type activated");
    },
  });
  const deactivateMutation = useMutation({
    mutationFn: documentTypesApi.deactivate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documentTypes"] });
      qc.invalidateQueries({ queryKey: ["documentMasterStats"] });
      toast.success("Document type deactivated");
    },
  });
  const deleteMutation = useMutation({
    mutationFn: documentTypesApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documentTypes"] });
      qc.invalidateQueries({ queryKey: ["documentMasterStats"] });
      toast.success("Document type deleted");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || "Cannot delete"),
  });

  const gridRef = useRef<AgGridReact>(null);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "code",
        headerName: "Code",
        width: 140,
      },
      {
        field: "name",
        headerName: "Name",
        flex: 1.5,
        minWidth: 180,
      },
      {
        field: "description",
        headerName: "Description",
        flex: 2,
        minWidth: 200,
        valueFormatter: (p: any) => p.value || "—",
      },
      {
        field: "documentCount",
        headerName: "Documents",
        width: 120,
      },
      {
        field: "isActive",
        headerName: "Status",
        width: 120,
      },
      {
        headerName: "Actions",
        width: 80,
        sortable: false,
        filter: false,
        cellClass: "flex items-center justify-center",
        cellRenderer: (p: any) => {
          const t = p.data;
          if (!t) return null;
          return (
            <ActionMenu
              orientation="horizontal"
              items={[
                {
                  label: "Edit",
                  icon: <Edit2 className="h-3.5 w-3.5" />,
                  onClick: () => onEdit(t),
                },
                t.isActive
                  ? {
                      label: "Deactivate",
                      icon: <PowerOff className="h-3.5 w-3.5" />,
                      onClick: () => deactivateMutation.mutate(t.id),
                    }
                  : {
                      label: "Activate",
                      icon: <Power className="h-3.5 w-3.5" />,
                      onClick: () => activateMutation.mutate(t.id),
                    },
                {
                  separator: true,
                  label: "Delete",
                  icon: <Trash2 className="h-3.5 w-3.5 text-red-500" />,
                  destructive: true,
                  onClick: async () => {
                    const confirmed = await confirm({
                      title: "Delete Document Type",
                      message: `Delete "${t.name}"? This cannot be undone.`,
                      confirmText: "Delete",
                    });
                    if (confirmed) {
                      deleteMutation.mutate(t.id);
                    }
                  },
                },
              ]}
            />
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      {/* DataGrid */}
      <div className="h-[480px]">
        <DataGrid
          ref={gridRef}
          rowData={filtered}
          columnDefs={columnDefs}
          gridOptions={{
            onRowDoubleClicked: (e) => e.data && onEdit(e.data),
          }}
        />
      </div>
    </div>
  );
}

// ─── Template Editor ──────────────────────────────────────────────────────────
function TemplateEditor({
  content,
  fields,
  onChange,
}: {
  content: string;
  fields: DocField[];
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base focus:outline-none max-w-none min-h-[280px] p-4",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  const insertVar = (variable: string) => {
    editor?.chain().focus().insertContent(`{{${variable}}}`).run();
  };

  const toolbarBtns = [
    {
      label: "B",
      action: () => editor?.chain().focus().toggleBold().run(),
      active: () => editor?.isActive("bold"),
    },
    {
      label: "I",
      action: () => editor?.chain().focus().toggleItalic().run(),
      active: () => editor?.isActive("italic"),
    },
    {
      label: "U̲",
      action: () => editor?.chain().focus().toggleStrike().run(),
      active: () => editor?.isActive("strike"),
    },
    null,
    {
      label: "H1",
      action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
      active: () => editor?.isActive("heading", { level: 1 }),
    },
    {
      label: "H2",
      action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      active: () => editor?.isActive("heading", { level: 2 }),
    },
    {
      label: "P",
      action: () => editor?.chain().focus().setParagraph().run(),
      active: () => editor?.isActive("paragraph"),
    },
    null,
    {
      label: "• List",
      action: () => editor?.chain().focus().toggleBulletList().run(),
      active: () => editor?.isActive("bulletList"),
    },
    {
      label: "1. List",
      action: () => editor?.chain().focus().toggleOrderedList().run(),
      active: () => editor?.isActive("orderedList"),
    },
  ];

  return (
    <div className="space-y-3">
      {/* Variable picker */}
      {fields.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Click to insert variable into template:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {fields.map((f) => (
              <button
                key={f.variable}
                type="button"
                onClick={() => insertVar(f.variable)}
                className="text-xs px-2.5 py-1 rounded-full font-mono bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                {`{{${f.variable}}}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="border border-border rounded-xl overflow-hidden bg-card text-card-foreground">
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 p-2 border-b border-border bg-muted/40 flex-wrap">
          {toolbarBtns.map((btn, i) =>
            btn === null ? (
              <div key={i} className="w-px h-4 bg-border mx-1" />
            ) : (
              <button
                key={btn.label}
                type="button"
                onClick={btn.action}
                className={cn(
                  "px-2 py-1 text-xs rounded font-medium transition-colors",
                  btn.active?.()
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground",
                )}
              >
                {btn.label}
              </button>
            ),
          )}
        </div>
        <EditorContent editor={editor} />
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Select a Document Type first to see available dynamic variables.
        </p>
      )}
    </div>
  );
}

// ─── Document Preview ─────────────────────────────────────────────────────────
function TemplatePreview({
  content,
  documentName,
}: {
  content: string;
  documentName: string;
}) {
  // Render with sample placeholder values
  const sample =
    content.replace(
      /\{\{(\w+)\}\}/g,
      (_, v) =>
        `<span style="background:#dbeafe;color:#1e40af;padding:0 3px;border-radius:3px;font-style:italic;">[${v}]</span>`,
    ) ||
    '<p style="color:#9ca3af;text-align:center;padding:40px;">No template content yet.</p>';

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Variables shown as{" "}
        <span className="bg-primary/10 text-primary px-1 rounded text-xs font-mono">
          [VariableName]
        </span>
        . Actual values are filled in when assigned to an employee.
      </p>
      {/* A4 Paper Desk Container */}
      <div className="bg-muted/40 border border-border/50 rounded-xl p-4 md:p-6 overflow-auto max-h-[480px]">
        <div
          className="bg-white shadow-xl mx-auto text-gray-900 border border-slate-300"
          style={{
            width: "100%",
            maxWidth: "595px",
            minHeight: "842px",
            padding: "64px 72px",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "13px",
            lineHeight: "1.8",
            backgroundColor: "#ffffff",
            color: "#111827",
          }}
        >
          {/* Header decoration */}
          <div
            style={{
              borderBottom: "2px solid #1e40af",
              paddingBottom: "16px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "#6b7280",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              Official HR Communication
            </div>
            <div
              style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b" }}
            >
              {documentName || "Document Preview"}
            </div>
          </div>
          <div dangerouslySetInnerHTML={{ __html: sample }} />
        </div>
      </div>
    </div>
  );
}

// ─── Document Master Form (Full Page) ─────────────────────────────────────────
function DocumentMasterForm({
  editingDoc,
  onBack,
}: {
  editingDoc: any | null;
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!editingDoc;

  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    documentTypeId: "",
    isRequired: false,
    isRepeatable: false,
    isActive: true,
    fields: [] as DocField[],
    templateContent: "",
  });

  const [activeSection, setActiveSection] = useState<
    "info" | "template" | "preview"
  >("info");
  const [templateWarnings, setTemplateWarnings] = useState<string[]>([]);

  // Load document types
  const { data: typesRes } = useQuery({
    queryKey: ["documentTypes"],
    queryFn: () => documentTypesApi.list({ pageSize: 100 }),
  });
  const activeTypes = (typesRes?.data || []).filter((t: any) => t.isActive);

  // Load static variables for selected document type
  const { data: variables } = useQuery({
    queryKey: ["documentTypeVariables", form.documentTypeId],
    queryFn: () =>
      form.documentTypeId
        ? documentTypesApi.getVariables(form.documentTypeId)
        : Promise.resolve([]),
    enabled: !!form.documentTypeId,
  });

  useEffect(() => {
    if (variables) {
      setForm((p) => ({ ...p, fields: variables as DocField[] }));
    }
  }, [variables]);

  useEffect(() => {
    if (editingDoc) {
      setForm({
        code: editingDoc.code ?? "",
        name: editingDoc.name ?? "",
        description: editingDoc.description ?? "",
        documentTypeId: editingDoc.documentTypeId ?? "",
        isRequired: editingDoc.isRequired ?? false,
        isRepeatable: editingDoc.isRepeatable ?? false,
        isActive: editingDoc.isActive ?? true,
        fields: (editingDoc.fields as DocField[]) ?? [],
        templateContent: editingDoc.templateContent ?? "",
      });
    }
  }, [editingDoc]);

  // Validate template variables
  useEffect(() => {
    if (!form.templateContent) {
      setTemplateWarnings([]);
      return;
    }
    const usedVars = Array.from(
      form.templateContent.matchAll(/\{\{(\w+)\}\}/g),
    ).map((m) => m[1]);
    const definedVars = form.fields.map((f) => f.variable);
    const unknownVars = usedVars.filter((v) => !definedVars.includes(v));
    const unusedVars = definedVars.filter((v) => !usedVars.includes(v));
    const warnings: string[] = [];
    unknownVars.forEach((v) => warnings.push(`Unknown variable: {{${v}}}`));
    unusedVars.forEach((v) =>
      warnings.push(`Warning: {{${v}}} is defined but not used in template`),
    );
    setTemplateWarnings(warnings);
  }, [form.templateContent, form.fields]);

  const createMutation = useMutation({
    mutationFn: documentMasterApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documentMaster"] });
      qc.invalidateQueries({ queryKey: ["documentMasterStats"] });
      toast.success("Document master created");
      onBack();
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || "Failed to create"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      documentMasterApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documentMaster"] });
      qc.invalidateQueries({ queryKey: ["documentMasterStats"] });
      toast.success("Document master updated");
      onBack();
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || "Failed to update"),
  });

  const handleSave = () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Code and Name are required");
      setActiveSection("info");
      return;
    }
    // Block on unknown variables
    const unknownErrors = templateWarnings.filter((w) =>
      w.startsWith("Unknown variable"),
    );
    if (unknownErrors.length > 0) {
      toast.error(unknownErrors[0] + " — fix template before saving");
      setActiveSection("template");
      return;
    }
    const payload = {
      ...form,
      code: form.code.toUpperCase(),
      documentTypeId: form.documentTypeId || undefined,
    };
    if (isEdit) {
      updateMutation.mutate({ id: editingDoc.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const sections = [
    { key: "info", label: "Document Info", icon: FileText },
    { key: "template", label: "Template", icon: BookOpen },
    { key: "preview", label: "Preview", icon: Eye },
  ] as const;

  const errorsForSections: Record<string, number> = {};
  const unknownCount = templateWarnings.filter((w) =>
    w.startsWith("Unknown"),
  ).length;
  if (unknownCount > 0) errorsForSections["template"] = unknownCount;

  return (
    <div className="min-h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back
          </Button>
          <div>
            <h2 className="text-base font-semibold">
              {isEdit ? `Editing: ${editingDoc.name}` : "New Document Master"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isEdit
                ? `Code: ${editingDoc.code}`
                : "Create a reusable document template"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending
              ? "Saving..."
              : isEdit
                ? "Save Changes"
                : "Create Document"}
          </Button>
        </div>
      </div>

      {/* Template warnings banner */}
      {templateWarnings.length > 0 && (
        <div className="mb-4 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              {templateWarnings.map((w, i) => (
                <p
                  key={i}
                  className={cn(
                    "text-xs",
                    w.startsWith("Unknown")
                      ? "text-red-700 dark:text-red-400 font-medium"
                      : "text-amber-700 dark:text-amber-400",
                  )}
                >
                  {w}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section nav */}
      <div className="flex gap-1 mb-4 border-b pb-0">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key as any)}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-all -mb-px",
              activeSection === s.key
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground/30",
            )}
          >
            <s.icon className="h-3.5 w-3.5" />
            {s.label}
            {errorsForSections[s.key] > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full leading-none">
                {errorsForSections[s.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Section content */}
      <div className="space-y-4">
        {activeSection === "info" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Document Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>
                    Document Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. JOINING_LETTER"
                    value={form.code}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    disabled={isEdit}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique code per company. Uppercase, max 30 chars.
                    {isEdit ? " Cannot be changed after creation." : ""}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Document Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Joining Letter"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="e.g. Official letter issued to an employee upon joining."
                    value={form.description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    rows={2}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Document Type</Label>
                  <Select
                    value={form.documentTypeId || "none"}
                    onValueChange={(v) =>
                      setForm((p) => ({
                        ...p,
                        documentTypeId: v === "none" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">
                          — No type —
                        </span>
                      </SelectItem>
                      {activeTypes.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {activeTypes.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No active document types. Create one in the Document Types
                      tab.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Document Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">Required</p>
                    <p className="text-xs text-muted-foreground">
                      This document must be present for every employee.
                    </p>
                  </div>
                  <Switch
                    checked={form.isRequired}
                    onCheckedChange={(v) =>
                      setForm((p) => ({ ...p, isRequired: v }))
                    }
                  />
                </div>
                <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">Repeatable</p>
                    <p className="text-xs text-muted-foreground">
                      Allow this document to be assigned multiple times to the
                      same employee. Use for Promotion Letters, Salary
                      Revisions, Transfer Letters, etc.
                    </p>
                  </div>
                  <Switch
                    checked={form.isRepeatable}
                    onCheckedChange={(v) =>
                      setForm((p) => ({ ...p, isRepeatable: v }))
                    }
                  />
                </div>
                <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">Active</p>
                    <p className="text-xs text-muted-foreground">
                      Inactive documents cannot be newly assigned to employees.
                      Existing assignments remain accessible.
                    </p>
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) =>
                      setForm((p) => ({ ...p, isActive: v }))
                    }
                  />
                </div>

                {/* Summary badges */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {form.isRequired && (
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                      <Sparkles className="h-3 w-3 mr-1" /> Required
                    </Badge>
                  )}
                  {form.isRepeatable && (
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                      <Repeat2 className="h-3 w-3 mr-1" /> Repeatable
                    </Badge>
                  )}
                  {form.isActive ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === "template" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Template Content
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Write the document template. Use{" "}
                <span className="font-mono text-blue-600">
                  {"{{Variable}}"}
                </span>{" "}
                placeholders that will be replaced with employee data when
                assigned.
              </p>
            </CardHeader>
            <CardContent>
              <TemplateEditor
                content={form.templateContent}
                fields={form.fields}
                onChange={(html) =>
                  setForm((p) => ({ ...p, templateContent: html }))
                }
              />
            </CardContent>
          </Card>
        )}

        {activeSection === "preview" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Document Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TemplatePreview
                content={form.templateContent}
                documentName={form.name}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
// ─── Document Master List ─────────────────────────────────────────────────────
function DocumentMasterList({
  search,
  onNew,
  onEdit,
}: {
  search: string;
  onNew: () => void;
  onEdit: (doc: any) => void;
}) {
  const qc = useQueryClient();
  const { confirm } = useAlert();
  const [filterTypeId, setFilterTypeId] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("all");

  const { data: typesRes } = useQuery({
    queryKey: ["documentTypes"],
    queryFn: () => documentTypesApi.list({ pageSize: 100 }),
  });
  const types = typesRes?.data || [];

  const { data: masterRes } = useQuery({
    queryKey: ["documentMaster"],
    queryFn: () => documentMasterApi.list(),
  });
  const docs = masterRes?.data || [];

  const deleteMutation = useMutation({
    mutationFn: documentMasterApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documentMaster"] });
      qc.invalidateQueries({ queryKey: ["documentMasterStats"] });
      toast.success("Document deleted");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || "Cannot delete"),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (doc: any) => {
      const copy = {
        ...doc,
        code: doc.code + "_COPY",
        name: doc.name + " (Copy)",
      };
      delete copy.id;
      delete copy.createdAt;
      delete copy.updatedAt;
      return documentMasterApi.create(copy);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documentMaster"] });
      qc.invalidateQueries({ queryKey: ["documentMasterStats"] });
      toast.success("Document duplicated");
    },
  });

  const filtered = docs.filter((d: any) => {
    if (
      search &&
      !d.name.toLowerCase().includes(search.toLowerCase()) &&
      !d.code.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (
      filterTypeId &&
      filterTypeId !== "all" &&
      d.documentTypeId !== filterTypeId
    )
      return false;
    if (filterActive && filterActive !== "all") {
      const wantActive = filterActive === "active";
      if (d.isActive !== wantActive) return false;
    }
    return true;
  });

  const gridRef = useRef<AgGridReact>(null);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "code",
        headerName: "Code",
        width: 150,
      },
      {
        field: "name",
        headerName: "Document Name",
        flex: 1.5,
        minWidth: 200,
      },
      {
        field: "documentType.name",
        headerName: "Type",
        width: 160,
        valueFormatter: (p: any) => p.value || "—",
      },
      {
        field: "isRequired",
        headerName: "Required",
        width: 100,
      },
      {
        field: "isRepeatable",
        headerName: "Repeat",
        width: 100,
      },
      {
        field: "isActive",
        headerName: "Status",
        width: 100,
      },
      {
        headerName: "Actions",
        width: 80,
        sortable: false,
        filter: false,
        cellRenderer: (p: any) => {
          const doc = p.data;
          if (!doc) return null;
          return (
            <ActionMenu
              orientation="horizontal"
              items={[
                {
                  label: "Edit",
                  icon: <Edit2 className="h-3.5 w-3.5" />,
                  onClick: () => onEdit(doc),
                },
                {
                  label: "Duplicate",
                  icon: <Copy className="h-3.5 w-3.5" />,
                  onClick: () => {
                    // Custom alert not working here because we don't have async cell renderer easily unless we do await confirm.
                    // Wait, confirm is async but we can just fire it inside onClick
                  },
                },
                {
                  separator: true,
                  label: "Delete",
                  icon: <Trash2 className="h-3.5 w-3.5 text-red-500" />,
                  destructive: true,
                  onClick: async () => {
                    const confirmed = await confirm({
                      title: "Delete Document",
                      message: `Delete "${doc.name}"?\n\nThis is blocked if employees have assignments.`,
                      confirmText: "Delete",
                    });
                    if (confirmed) {
                      deleteMutation.mutate(doc.id);
                    }
                  },
                },
              ]}
            />
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-3">
          <Select value={filterTypeId} onValueChange={setFilterTypeId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterActive} onValueChange={setFilterActive}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="h-[520px]">
        <DataGrid
          ref={gridRef}
          rowData={filtered}
          columnDefs={columnDefs}
          gridOptions={{
            onRowDoubleClicked: (e) => e.data && onEdit(e.data),
          }}
        />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DocumentMaster() {
  const [activeTab, setActiveTab] = useState<"types" | "master">("types");

  // Master form state
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Types form state
  const [editingType, setEditingType] = useState<any | null>(null);
  const [isTypeFormOpen, setIsTypeFormOpen] = useState(false);

  const [search, setSearch] = useState("");

  const qc = useQueryClient();

  const handleNewDoc = () => {
    setEditingDoc(null);
    setIsFormOpen(true);
  };
  const handleEditDoc = (doc: any) => {
    setEditingDoc(doc);
    setIsFormOpen(true);
  };
  const handleNewType = () => {
    setEditingType(null);
    setIsTypeFormOpen(true);
  };
  const handleEditType = (t: any) => {
    setEditingType(t);
    setIsTypeFormOpen(true);
  };

  if (isFormOpen) {
    return (
      <div className="p-4 md:p-6 bg-slate-50/50 dark:bg-slate-900/20 min-h-[calc(100vh-4rem)]">
        <DocumentMasterForm
          editingDoc={editingDoc}
          onBack={() => {
            setIsFormOpen(false);
            setEditingDoc(null);
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <ListingCard>
        <ListingHeader
          title="Document Library"
          subtitle="Manage document types and reusable document master templates."
          tabs={{
            options: [
              { label: "Document Types", value: "types" },
              { label: "Document Master", value: "master" },
            ],
            value: activeTab,
            onChange: (v) => {
              setActiveTab(v as any);
              setSearch("");
            },
          }}
          searchValue={search}
          onSearchChange={setSearch}
          onRefresh={() =>
            qc.invalidateQueries({
              queryKey:
                activeTab === "types" ? ["documentTypes"] : ["documentMaster"],
            })
          }
          onAddNew={activeTab === "types" ? handleNewType : handleNewDoc}
          addButtonText={activeTab === "types" ? "Add Type" : "Add Document"}
        />

        {activeTab === "types" ? (
          <DocumentTypesTab search={search} onEdit={handleEditType} />
        ) : (
          <DocumentMasterList
            search={search}
            onNew={handleNewDoc}
            onEdit={handleEditDoc}
          />
        )}
      </ListingCard>

      <DocTypeFormDialog
        open={isTypeFormOpen}
        onClose={() => {
          setIsTypeFormOpen(false);
          setEditingType(null);
        }}
        editingType={editingType}
      />
    </div>
  );
}
