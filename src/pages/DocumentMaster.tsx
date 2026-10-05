import { documentMasterApi } from "@/api/documentMaster";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingCard } from "@/components/common/ListingCard";
import { ListingHeader } from "@/components/common/ListingHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { gridExportExcel, gridExportPdf, gridPrint } from "@/lib/gridExport";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { ColDef } from "ag-grid-community";
import type { AgGridReact } from "ag-grid-react";
import { Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

function DocumentTypesTab({
  data,
  queryClient,
  isAddOpen,
  setIsAddOpen,
  gridRef,
}: {
  data: any[];
  queryClient: any;
  isAddOpen: boolean;
  setIsAddOpen: (v: boolean) => void;
  gridRef: any;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    fields: [] as string[],
  });
  const [newField, setNewField] = useState("");

  const createMutation = useMutation({
    mutationFn: documentMasterApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentMaster"] });
      toast.success("Document type created");
      setIsAddOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      documentMasterApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentMaster"] });
      toast.success("Document type updated");
      setIsAddOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: documentMasterApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentMaster"] });
      toast.success("Document type deleted");
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({ code: "", name: "", description: "", fields: [] });
    setNewField("");
  };

  const handleEdit = (doc: any) => {
    setEditingId(doc.id);
    setFormData({
      code: doc.code || "",
      name: doc.name || "",
      description: doc.description || "",
      fields: doc.fields || [],
    });
    setIsAddOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure?")) deleteMutation.mutate(id);
  };

  const handleSave = () => {
    if (editingId) updateMutation.mutate({ id: editingId, data: formData });
    else createMutation.mutate(formData);
  };

  const addField = () => {
    if (!newField.trim()) return;
    if (formData.fields.includes(newField.trim())) {
      toast.error("Field already exists");
      return;
    }
    setFormData((p) => ({ ...p, fields: [...p.fields, newField.trim()] }));
    setNewField("");
  };

  const removeField = (field: string) => {
    setFormData((p) => ({ ...p, fields: p.fields.filter((f) => f !== field) }));
  };

  const columnDefs = useMemo<ColDef[]>(
    () => [
      { field: "code", headerName: "Code", width: 120 },
      { field: "name", headerName: "Name", flex: 1 },
      { field: "description", headerName: "Description", flex: 1 },
      {
        headerName: "",
        width: 80,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => (
          <div className="flex gap-1 items-center justify-center h-full">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(params.data.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <div className="h-[500px]">
        <DataGrid
          ref={gridRef}
          rowData={data}
          columnDefs={columnDefs}
          gridOptions={{
            onRowDoubleClicked: (e) => handleEdit(e.data),
          }}
        />
      </div>

      <Dialog
        open={isAddOpen}
        onOpenChange={(v) => {
          if (!v) resetForm();
          setIsAddOpen(v);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Document Code
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, code: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Document Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">
                Description
              </label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>

            <div className="border rounded-md p-4 bg-muted/30">
              <label className="text-xs font-medium mb-2 block">
                Defined Fields/Variables
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.fields.map((f) => (
                  <Badge
                    key={f}
                    variant="secondary"
                    className="px-2 py-1 flex items-center gap-1"
                  >
                    {f}
                    <button
                      type="button"
                      onClick={() => removeField(f)}
                      className="hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {formData.fields.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    No fields defined yet.
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Employee Name"
                  value={newField}
                  onChange={(e) => setNewField(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addField();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addField}>
                  Add Field
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddOpen(false)}
            >
              Close
            </Button>
            <Button onClick={handleSave}>Save Document Type</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocumentMasterTab({
  data,
  queryClient,
  gridRef,
}: {
  data: any[];
  queryClient: any;
  gridRef: any;
}) {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const selectedDoc = useMemo(
    () => data.find((d) => d.id === selectedDocId),
    [data, selectedDocId],
  );

  const updateMutation = useMutation({
    mutationFn: ({ id, dt }: { id: string; dt: any }) =>
      documentMasterApi.update(id, dt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentMaster"] });
      toast.success("Template saved successfully");
      setSelectedDocId(null);
    },
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base focus:outline-none max-w-none min-h-[400px] border rounded-md p-4 bg-white",
      },
    },
  });

  useEffect(() => {
    if (editor && selectedDoc) {
      editor.commands.setContent(selectedDoc.templateContent || "");
    }
  }, [selectedDocId, editor]);

  const handleSave = () => {
    if (!selectedDoc) return;
    updateMutation.mutate({
      id: selectedDoc.id,
      dt: { templateContent: editor?.getHTML() },
    });
  };

  const insertVariable = (field: string) => {
    editor?.chain().focus().insertContent(`{{${field}}}`).run();
  };

  const columnDefs = useMemo<ColDef[]>(
    () => [
      { field: "code", headerName: "Code", width: 120 },
      { field: "name", headerName: "Name", flex: 1 },
      {
        field: "templateContent",
        headerName: "Template Status",
        width: 150,
        cellRenderer: (params: any) => (
          <Badge variant={params.value ? "success" : "secondary"}>
            {params.value ? "Configured" : "Pending"}
          </Badge>
        ),
      },
      {
        headerName: "",
        width: 80,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => (
          <div className="flex gap-1 items-center justify-center h-full">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Are you sure you want to clear this template?")) {
                  updateMutation.mutate({
                    id: params.data.id,
                    dt: { templateContent: "" },
                  });
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  if (selectedDocId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" onClick={() => setSelectedDocId(null)}>
            ← Back to List
          </Button>
          <h2 className="text-lg font-semibold">
            Editing Template: {selectedDoc?.name}
          </h2>
        </div>

        <div className="border rounded-md p-4 bg-muted/10 space-y-4">
          <div>
            <label className="text-xs font-medium mb-2 block">
              Available Fields (Click to insert)
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedDoc?.fields?.map((f: string) => (
                <Badge
                  key={f}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => insertVariable(f)}
                >
                  {f}
                </Badge>
              ))}
              {(!selectedDoc?.fields || selectedDoc.fields.length === 0) && (
                <span className="text-xs text-muted-foreground">
                  No fields defined for this document type.
                </span>
              )}
            </div>
          </div>

          <div className="border rounded-md overflow-hidden bg-white flex flex-col">
            <div className="flex items-center gap-1 p-2 border-b bg-muted/30 flex-wrap">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={editor?.isActive("bold") ? "bg-muted" : ""}
              >
                Bold
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={editor?.isActive("italic") ? "bg-muted" : ""}
              >
                Italic
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 1 }).run()
                }
                className={
                  editor?.isActive("heading", { level: 1 }) ? "bg-muted" : ""
                }
              >
                H1
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className={
                  editor?.isActive("heading", { level: 2 }) ? "bg-muted" : ""
                }
              >
                H2
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => editor?.chain().focus().setParagraph().run()}
                className={editor?.isActive("paragraph") ? "bg-muted" : ""}
              >
                P
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={editor?.isActive("bulletList") ? "bg-muted" : ""}
              >
                Bullet List
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  editor?.chain().focus().toggleOrderedList().run()
                }
                className={editor?.isActive("orderedList") ? "bg-muted" : ""}
              >
                Numbered List
              </Button>
            </div>
            <EditorContent editor={editor} className="flex-1" />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-[500px]">
        <DataGrid
          ref={gridRef}
          rowData={data}
          columnDefs={columnDefs}
          gridOptions={{
            onRowDoubleClicked: (e) => setSelectedDocId(e.data.id),
          }}
        />
      </div>
    </div>
  );
}

export default function DocumentMaster() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("types");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const gridRef = useRef<AgGridReact>(null);

  const { data } = useQuery({
    queryKey: ["documentMaster"],
    queryFn: () => documentMasterApi.list(),
  });

  const allDocs = data?.data || [];
  const docs = allDocs.filter(
    (d: any) =>
      !searchQuery ||
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <ListingCard>
        <ListingHeader
          title="Document Management"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          tabs={{
            options: [
              { label: "Document Types", value: "types" },
              { label: "Document Master", value: "master" },
            ],
            value: activeTab,
            onChange: setActiveTab,
          }}
          onAddNew={
            activeTab === "types" ? () => setIsAddOpen(true) : undefined
          }
          addButtonText="Add Document Type"
          onRefresh={() =>
            queryClient.invalidateQueries({ queryKey: ["documentMaster"] })
          }
          onExportExcel={() =>
            gridRef.current?.api &&
            gridExportExcel(gridRef.current.api, "documents.csv")
          }
          onExportPdf={() =>
            gridRef.current?.api &&
            gridExportPdf(gridRef.current.api, "Documents")
          }
          onPrint={() =>
            gridRef.current?.api && gridPrint(gridRef.current.api, "Documents")
          }
        />

        {activeTab === "types" ? (
          <DocumentTypesTab
            data={docs}
            queryClient={queryClient}
            isAddOpen={isAddOpen}
            setIsAddOpen={setIsAddOpen}
            gridRef={gridRef}
          />
        ) : (
          <DocumentMasterTab
            data={docs}
            queryClient={queryClient}
            gridRef={gridRef}
          />
        )}
      </ListingCard>
    </div>
  );
}
