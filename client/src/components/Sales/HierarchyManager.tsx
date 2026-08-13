import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function HierarchyManager() {
  const utils = trpc.useUtils();
  const { data: groups, isLoading } = trpc.sales.listGroups.useQuery();
  
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createGroup = trpc.sales.createGroup.useMutation({
    onSuccess: () => {
      toast.success("Team created successfully");
      setIsOpen(false);
      setName("");
      setDescription("");
      utils.sales.listGroups.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createGroup.mutate({ name, description });
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
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Team
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
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
                  <TableHead className="text-slate-700 dark:text-slate-300">Description</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-slate-500 py-6">
                      No teams configured yet.
                    </TableCell>
                  </TableRow>
                )}
                {groups?.map((group) => (
                  <TableRow key={group.id} className="border-slate-200 dark:border-slate-800">
                    <TableCell className="text-slate-900 dark:text-slate-200 font-medium">{group.name}</TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300">{group.description || "—"}</TableCell>
                    <TableCell className="text-emerald-400">
                      {group.isActive ? "Active" : "Inactive"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
