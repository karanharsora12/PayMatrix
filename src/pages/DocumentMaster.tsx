import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataGrid } from "@/components/common/DataGrid";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { documentMasterApi } from "@/api/documentMaster";
import type { ColDef } from "ag-grid-community";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

function DocumentTypesTab({ data, queryClient }: { data: any[], queryClient: any }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", description: "", fields: [] as string[] });
  const [newField, setNewField] = useState("");

  const createMutation = useMutation({
    mutationFn: documentMasterApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentMaster"] });
      toast.success("Document type created");
      setOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => documentMasterApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentMaster"] });
      toast.success("Document type updated");
      setOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: documentMasterApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentMaster"] });
      toast.success("Document type deleted");
    }
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
    setOpen(true);
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
    setFormData(p => ({ ...p, fields: [...p.fields, newField.trim()] }));
    setNewField("");
  };

  const removeField = (field: string) => {
    setFormData(p => ({ ...p, fields: p.fields.filter(f => f !== field) }));
  };

  const columnDefs = useMemo<ColDef[]>(() => [
    { field: "code", headerName: "Code", width: 120 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    {
      headerName: "Actions",
      width: 120,
      cellRenderer: (params: any) => (
        <div className="flex gap-1 items-center justify-center h-full">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(params.data)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(params.data.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ], []);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { resetForm(); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Add Document Type
        </Button>
      </div>
      <div className="h-[500px]">
        <DataGrid rowData={data} columnDefs={columnDefs} />
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingId ? "Edit Document Type" : "Add Document Type"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1 block">Document Code</label>
                <Input value={formData.code} onChange={e => setFormData(p => ({ ...p, code: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Document Name</label>
                <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Description</label>
              <Input value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
            </div>
            
            <div className="border rounded-md p-4 bg-muted/30">
              <label className="text-xs font-medium mb-2 block">Defined Fields/Variables</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.fields.map(f => (
                  <Badge key={f} variant="secondary" className="px-2 py-1 flex items-center gap-1">
                    {f}
                    <button type="button" onClick={() => removeField(f)} className="hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {formData.fields.length === 0 && <span className="text-xs text-muted-foreground">No fields defined yet.</span>}
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="e.g. Employee Name" 
                  value={newField} 
                  onChange={e => setNewField(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addField(); } }}
                />
                <Button type="button" variant="outline" onClick={addField}>Add Field</Button>
              </div>
            </div>

            <Button className="w-full" onClick={handleSave}>Save Document Type</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocumentMasterTab({ data, queryClient }: { data: any[], queryClient: any }) {
  const [selectedDocId, setSelectedDocId] = useState<string>("");

  const selectedDoc = useMemo(() => data.find(d => d.id === selectedDocId), [data, selectedDocId]);

  const updateMutation = useMutation({
    mutationFn: ({ id, dt }: { id: string, dt: any }) => documentMasterApi.update(id, dt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentMaster"] });
      toast.success("Template saved successfully");
    }
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none max-w-none min-h-[400px] border rounded-md p-4 bg-white',
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
      dt: { templateContent: editor?.getHTML() }
    });
  };

  const insertVariable = (field: string) => {
    editor?.chain().focus().insertContent(`{{${field}}}`).run();
  };

  return (
    <div className="space-y-6">
      <div className="w-64">
        <label className="text-xs font-medium mb-1 block">Select Document Type</label>
        <Select value={selectedDocId} onValueChange={setSelectedDocId}>
          <SelectTrigger><SelectValue placeholder="Choose a document..." /></SelectTrigger>
          <SelectContent>
            {data.map(d => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedDoc && (
        <div className="border rounded-md p-4 bg-muted/10 space-y-4">
          <div>
            <label className="text-xs font-medium mb-2 block">Available Fields (Click to insert)</label>
            <div className="flex flex-wrap gap-2">
              {selectedDoc.fields?.map((f: string) => (
                <Badge 
                  key={f} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => insertVariable(f)}
                >
                  {f}
                </Badge>
              ))}
              {(!selectedDoc.fields || selectedDoc.fields.length === 0) && (
                <span className="text-xs text-muted-foreground">No fields defined for this document type.</span>
              )}
            </div>
          </div>

          <div className="border rounded-md overflow-hidden bg-white flex flex-col">
            <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
              <Button size="sm" variant="ghost" onClick={() => editor?.chain().focus().toggleBold().run()} className={editor?.isActive('bold') ? 'bg-muted' : ''}>Bold</Button>
              <Button size="sm" variant="ghost" onClick={() => editor?.chain().focus().toggleItalic().run()} className={editor?.isActive('italic') ? 'bg-muted' : ''}>Italic</Button>
              <div className="w-px h-4 bg-border mx-1" />
              <Button size="sm" variant="ghost" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className={editor?.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}>H1</Button>
              <Button size="sm" variant="ghost" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={editor?.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}>H2</Button>
              <Button size="sm" variant="ghost" onClick={() => editor?.chain().focus().setParagraph().run()} className={editor?.isActive('paragraph') ? 'bg-muted' : ''}>P</Button>
              <div className="w-px h-4 bg-border mx-1" />
              <Button size="sm" variant="ghost" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={editor?.isActive('bulletList') ? 'bg-muted' : ''}>Bullet List</Button>
              <Button size="sm" variant="ghost" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={editor?.isActive('orderedList') ? 'bg-muted' : ''}>Numbered List</Button>
            </div>
            <EditorContent editor={editor} className="flex-1" />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DocumentMaster() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["documentMaster"],
    queryFn: () => documentMasterApi.list(),
  });

  const docs = data?.data || [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Document Management</h1>
      
      <Tabs defaultValue="types" className="w-full">
        <TabsList>
          <TabsTrigger value="types">Document Types</TabsTrigger>
          <TabsTrigger value="master">Document Master</TabsTrigger>
        </TabsList>
        <TabsContent value="types" className="mt-4">
          <DocumentTypesTab data={docs} queryClient={queryClient} />
        </TabsContent>
        <TabsContent value="master" className="mt-4">
          <DocumentMasterTab data={docs} queryClient={queryClient} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
