import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Building2, Plus, Pencil, Trash2, BookOpen, User, Search, RefreshCw, Check
} from "lucide-react";

type Dept = {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  head?: { id: number; name: string; username: string } | null;
  modules: { id: number; name: string }[];
  createdAt: Date;
};

function DeptForm({
  initial,
  onSuccess,
  onCancel,
}: {
  initial?: Partial<Dept>;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [headUserId, setHeadUserId] = useState<string>(initial?.head?.id ? String(initial.head.id) : "");
  const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>(
    initial?.modules?.map((m) => m.id) || []
  );

  const headsQuery = trpc.department.listAcademicHeads.useQuery();
  const modulesQuery = trpc.learning.listModules.useQuery();

  const createMut = trpc.department.create.useMutation({
    onSuccess: () => { toast.success("Department created"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.department.update.useMutation({
    onSuccess: () => { toast.success("Department updated"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const toggleModule = (id: number) => {
    setSelectedModuleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      headUserId: headUserId ? parseInt(headUserId) : null,
      moduleIds: selectedModuleIds,
      isActive: true,
    };
    if (initial?.id) {
      updateMut.mutate({ id: initial.id, ...payload });
    } else {
      createMut.mutate(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Department Name *</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Engineering Department"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description..."
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Academic Head</label>
        <Select value={headUserId} onValueChange={setHeadUserId}>
          <SelectTrigger>
            <SelectValue placeholder="Select academic head..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— None —</SelectItem>
            {headsQuery.data?.map((h) => (
              <SelectItem key={h.id} value={String(h.id)}>
                {h.name} ({h.username})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Assigned Courses
          <span className="ml-2 text-xs text-gray-500">({selectedModuleIds.length} selected)</span>
        </label>
        <div className="border rounded-lg max-h-40 overflow-y-auto divide-y">
          {modulesQuery.data?.length === 0 && (
            <p className="text-xs text-gray-400 p-3">No courses found</p>
          )}
          {modulesQuery.data?.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleModule(m.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                selectedModuleIds.includes(m.id) ? "bg-blue-50 text-blue-700" : "text-gray-700"
              }`}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                selectedModuleIds.includes(m.id) ? "bg-blue-600 border-blue-600" : "border-gray-300"
              }`}>
                {selectedModuleIds.includes(m.id) && <Check className="w-3 h-3 text-white" />}
              </div>
              {m.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={createMut.isPending || updateMut.isPending} className="flex-1">
          {initial?.id ? "Update Department" : "Create Department"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export default function Departments() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editDept, setEditDept] = useState<Dept | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const listQuery = trpc.department.list.useQuery();
  const deleteMut = trpc.department.delete.useMutation({
    onSuccess: () => { toast.success("Department deleted"); setDeleteId(null); listQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (listQuery.data || []).filter(
    (d) => d.name.toLowerCase().includes(search.toLowerCase())
  );

  const isAdmin = ["super_admin", "admin"].includes(user?.role || "");

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Departments</h1>
            <p className="text-sm text-gray-500">Manage academic departments and their assigned courses</p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditDept(null); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> New Department
          </Button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Departments", value: listQuery.data?.length ?? 0, color: "text-indigo-600" },
          { label: "Active", value: listQuery.data?.filter((d) => d.isActive).length ?? 0, color: "text-green-600" },
          { label: "With Head", value: listQuery.data?.filter((d) => d.head).length ?? 0, color: "text-blue-600" },
          {
            label: "Total Courses",
            value: listQuery.data?.reduce((a, d) => a + d.modules.length, 0) ?? 0,
            color: "text-orange-600",
          },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="ghost" size="icon" onClick={() => listQuery.refetch()}>
          <RefreshCw className={`w-4 h-4 ${listQuery.isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Department</TableHead>
              <TableHead>Academic Head</TableHead>
              <TableHead>Assigned Courses</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {listQuery.isLoading && (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-gray-400">Loading...</TableCell></TableRow>
            )}
            {!listQuery.isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No departments found</p>
                </TableCell>
              </TableRow>
            )}
            {filtered.map((dept) => (
              <TableRow key={dept.id} className="hover:bg-gray-50">
                <TableCell>
                  <div>
                    <p className="font-semibold text-gray-900">{dept.name}</p>
                    {dept.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{dept.description}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {dept.head ? (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{dept.head.name}</p>
                        <p className="text-xs text-gray-400">@{dept.head.username}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Not assigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {dept.modules.length === 0 && <span className="text-xs text-gray-400 italic">None</span>}
                    {dept.modules.slice(0, 3).map((m) => (
                      <Badge key={m.id} variant="secondary" className="text-xs">
                        <BookOpen className="w-2.5 h-2.5 mr-1" />
                        {m.name}
                      </Badge>
                    ))}
                    {dept.modules.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{dept.modules.length - 3} more</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={dept.isActive ? "default" : "secondary"}>
                    {dept.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => { setEditDept(dept as Dept); setShowForm(true); }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setDeleteId(dept.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editDept ? "Edit Department" : "Create Department"}</DialogTitle>
          </DialogHeader>
          <DeptForm
            initial={editDept || undefined}
            onSuccess={() => { setShowForm(false); listQuery.refetch(); }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Department?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">This action cannot be undone. All module assignments will be removed.</p>
          <div className="flex gap-2 mt-4">
            <Button
              variant="destructive" className="flex-1"
              onClick={() => deleteId && deleteMut.mutate({ id: deleteId })}
              disabled={deleteMut.isPending}
            >
              Delete
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
