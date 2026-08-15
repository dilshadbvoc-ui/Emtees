import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Users, Target, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function HierarchyManager() {
  const utils = trpc.useUtils();
  const { data: groups, isLoading } = trpc.sales.listGroups.useQuery();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [asmId, setAsmId] = useState<number | null>(null);
  const [managerId, setManagerId] = useState<number | null>(null);

  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<{ id: number, name: string } | null>(null);

  // Team Details State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const { data: execs } = trpc.salesExecutive.listExecutives.useQuery({});
  const asms = execs?.filter(e => e.designation === "Assistant Sales Manager (ASM)") || [];
  const managers = execs?.filter(e => e.designation === "Manager") || [];

  const { data: teamDetails, isLoading: isDetailsLoading } = trpc.sales.getTeamDetails.useQuery(
    { id: selectedGroupId as number },
    { enabled: !!selectedGroupId }
  );

  const createGroup = trpc.sales.createGroup.useMutation({
    onSuccess: () => {
      toast.success("Team created successfully");
      setIsOpen(false);
      resetForm();
      utils.sales.listGroups.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateGroup = trpc.sales.updateGroup.useMutation({
    onSuccess: () => {
      toast.success("Team updated successfully");
      setIsEditOpen(false);
      setEditingGroupId(null);
      resetForm();
      utils.sales.listGroups.invalidate();
      if (selectedGroupId === editingGroupId) {
        utils.sales.getTeamDetails.invalidate();
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteGroup = trpc.sales.deleteGroup.useMutation({
    onSuccess: () => {
      toast.success("Team deleted successfully");
      setIsDeleteOpen(false);
      setDeletingGroup(null);
      utils.sales.listGroups.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setAsmId(null);
    setManagerId(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createGroup.mutate({ name, description, asmId: asmId || undefined, managerId: managerId || undefined });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroupId) {
      updateGroup.mutate({ id: editingGroupId, name, description, asmId: asmId || null, managerId: managerId || null });
    }
  };

  const openEdit = (group: any) => {
    setEditingGroupId(group.id);
    setName(group.name);
    setDescription(group.description || "");
    setAsmId(group.asmId);
    setManagerId(group.managerId);
    setIsEditOpen(true);
  };

  const openDelete = (group: any) => {
    setDeletingGroup({ id: group.id, name: group.name });
    setIsDeleteOpen(true);
  };

  const openDetails = (group: any) => {
    setSelectedGroupId(group.id);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-slate-900 dark:text-slate-100">Teams & Hierarchy Manager</CardTitle>
            <CardDescription>
              Manage Sales Groups and ASMs.
            </CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => {
            if (open) resetForm();
            setIsOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Team
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Team Name</Label>
                  <Input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="e.g. Alpha Squad" 
                    required 
                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Optional description" 
                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Manager (Optional)</Label>
                  <Select value={managerId?.toString() || "none"} onValueChange={(val) => setManagerId(val === "none" ? null : parseInt(val))}>
                    <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                      <SelectValue placeholder="Select a manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {managers.map(m => (
                        <SelectItem key={m.id} value={m.id.toString()}>{m.name} ({m.employeeId})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assistant Sales Manager (ASM) (Optional)</Label>
                  <Select value={asmId?.toString() || "none"} onValueChange={(val) => setAsmId(val === "none" ? null : parseInt(val))}>
                    <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                      <SelectValue placeholder="Select an ASM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {asms.map(a => (
                        <SelectItem key={a.id} value={a.id.toString()}>{a.name} ({a.employeeId})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createGroup.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                    {createGroup.isPending ? "Saving..." : "Create Team"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-slate-500 dark:text-slate-400">Loading groups...</div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-100 dark:bg-slate-800">
                <TableRow>
                  <TableHead className="text-slate-700 dark:text-slate-300">Team Name</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Manager</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">ASM</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Description</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Status</TableHead>
                  <TableHead className="text-right text-slate-700 dark:text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-6">
                      No teams configured yet.
                    </TableCell>
                  </TableRow>
                )}
                {groups?.map((group) => (
                  <TableRow key={group.id} className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => openDetails(group)}>
                    <TableCell className="text-slate-900 dark:text-slate-200 font-medium">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-500" />
                        {group.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300">
                      {execs?.find(e => e.id === group.managerId)?.name || "—"}
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300">
                      {execs?.find(e => e.id === group.asmId)?.name || "—"}
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300">{group.description || "—"}</TableCell>
                    <TableCell className="text-emerald-400">
                      {group.isActive ? "Active" : "Inactive"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(group)}>
                          <Edit className="w-4 h-4 text-slate-500 hover:text-indigo-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDelete(group)}>
                          <Trash2 className="w-4 h-4 text-slate-500 hover:text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Team Name</Label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g. Alpha Squad" 
                required 
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Optional description" 
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>Manager (Optional)</Label>
              <Select value={managerId?.toString() || "none"} onValueChange={(val) => setManagerId(val === "none" ? null : parseInt(val))}>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {managers.map(m => (
                    <SelectItem key={m.id} value={m.id.toString()}>{m.name} ({m.employeeId})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assistant Sales Manager (ASM) (Optional)</Label>
              <Select value={asmId?.toString() || "none"} onValueChange={(val) => setAsmId(val === "none" ? null : parseInt(val))}>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder="Select an ASM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {asms.map(a => (
                    <SelectItem key={a.id} value={a.id.toString()}>{a.name} ({a.employeeId})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={updateGroup.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {updateGroup.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-700 dark:text-slate-300">
              Are you sure you want to delete the team <span className="font-semibold">{deletingGroup?.name}</span>? 
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Team members will have their group assignment cleared.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => deletingGroup && deleteGroup.mutate({ id: deletingGroup.id })}
              disabled={deleteGroup.isPending}
            >
              {deleteGroup.isPending ? "Deleting..." : "Delete Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Details Sheet */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-6 border-b">
            <SheetTitle className="flex items-center gap-2 text-2xl">
              <Users className="w-6 h-6 text-indigo-600" />
              {teamDetails?.group?.name || "Team Details"}
            </SheetTitle>
            <SheetDescription>
              {teamDetails?.group?.description || "Overview of team performance and members."}
            </SheetDescription>
          </SheetHeader>

          {isDetailsLoading ? (
            <div className="py-8 text-center text-slate-500">Loading team details...</div>
          ) : teamDetails ? (
            <div className="mt-6 space-y-8">
              {/* Performance Metrics */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  Team Performance
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Card className="bg-slate-50 dark:bg-slate-900/50 shadow-none border-slate-200">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <p className="text-sm text-slate-500 font-medium">Total Closures</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {teamDetails.performance.totalClosures}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-50 dark:bg-slate-900/50 shadow-none border-slate-200">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <p className="text-sm text-slate-500 font-medium">Total Points</p>
                      <p className="text-2xl font-bold text-amber-600 mt-1 flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {teamDetails.performance.totalPoints}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-50 dark:bg-slate-900/50 shadow-none border-slate-200 col-span-2 md:col-span-1">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <p className="text-sm text-slate-500 font-medium">Total Sales</p>
                      <p className="text-2xl font-bold text-emerald-600 mt-1">
                        ₹{teamDetails.performance.totalSales.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Members List */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  Team Members ({teamDetails.members.length})
                </h3>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900">
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamDetails.members.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-slate-500 py-6">
                            No members assigned to this team.
                          </TableCell>
                        </TableRow>
                      ) : (
                        teamDetails.members.map((member) => {
                          const isManager = member.id === teamDetails.group.managerId;
                          const isAsm = member.id === teamDetails.group.asmId;
                          
                          return (
                            <TableRow key={member.id}>
                              <TableCell>
                                <p className="font-medium text-slate-900 dark:text-slate-100">{member.name}</p>
                                <p className="text-xs text-slate-500 font-mono">{member.employeeId}</p>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1 items-start">
                                  <span className="text-sm">{member.designation}</span>
                                  {isManager && <Badge variant="outline" className="bg-indigo-50 text-indigo-700 text-[10px]">Manager</Badge>}
                                  {isAsm && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-[10px]">ASM</Badge>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`capitalize text-[10px] ${
                                  member.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-100'
                                }`}>
                                  {member.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-red-500">Failed to load team details.</div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
