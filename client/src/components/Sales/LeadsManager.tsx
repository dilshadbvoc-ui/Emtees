import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { UserPlus, Edit2 } from "lucide-react";

export default function LeadsManager() {
  const { user } = useAuth();
  const isAdmin = ["super_admin", "admin"].includes(user?.role || "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  
  const [studentName, setStudentName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("New");

  const trpcContext = trpc.useContext();
  const { data: leads, isLoading } = trpc.sales.listLeads.useQuery();
  const createLead = trpc.sales.createLead.useMutation({
    onSuccess: () => {
      trpcContext.sales.listLeads.invalidate();
      setIsDialogOpen(false);
      resetForm();
    }
  });
  
  const updateStatus = trpc.sales.updateLeadStatus.useMutation({
    onSuccess: () => {
      trpcContext.sales.listLeads.invalidate();
      setSelectedLead(null);
    }
  });

  const resetForm = () => {
    setStudentName("");
    setPhone("");
    setAddress("");
    setRemarks("");
  };

  const handleCreate = () => {
    if (!studentName) return;
    createLead.mutate({ studentName, phone, address, remarks });
  };

  const handleUpdateStatus = (id: number, newStatus: string) => {
    updateStatus.mutate({ id, status: newStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Leads Management</h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              New Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-slate-100">Add New Lead</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Student Name *</Label>
                <Input id="name" value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Enter name" className="bg-white dark:bg-slate-950" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone" className="bg-white dark:bg-slate-950" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address / Location</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter address" className="bg-white dark:bg-slate-950" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Input id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Initial notes" className="bg-white dark:bg-slate-950" />
              </div>
              <Button onClick={handleCreate} disabled={createLead.isPending || !studentName} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4">
                {createLead.isPending ? "Saving..." : "Save Lead"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="text-slate-700 dark:text-slate-300">Date</TableHead>
                <TableHead className="text-slate-700 dark:text-slate-300">Student Name</TableHead>
                <TableHead className="text-slate-700 dark:text-slate-300">Contact</TableHead>
                {isAdmin && <TableHead className="text-slate-700 dark:text-slate-300">Assigned To (CA)</TableHead>}
                <TableHead className="text-slate-700 dark:text-slate-300">Remarks</TableHead>
                <TableHead className="text-slate-700 dark:text-slate-300 w-[150px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-slate-500">Loading leads...</TableCell>
                </TableRow>
              ) : leads?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-slate-500">No leads found. Create one to get started.</TableCell>
                </TableRow>
              ) : (
                leads?.map((lead) => (
                  <TableRow key={lead.id} className="border-slate-200 dark:border-slate-800">
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {format(new Date(lead.createdAt), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                      {lead.studentName}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{lead.phone || "—"}</div>
                      <div className="text-xs text-slate-500">{lead.address}</div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-slate-600">
                        {lead.salesExecutive?.name || "Unassigned"}
                      </TableCell>
                    )}
                    <TableCell className="text-sm text-slate-600 max-w-[200px] truncate" title={lead.remarks || ""}>
                      {lead.remarks || "—"}
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={lead.status} 
                        onValueChange={(val) => handleUpdateStatus(lead.id, val)}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-950">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="New">New</SelectItem>
                          <SelectItem value="Contacted">Contacted</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Converted">Converted (Closure)</SelectItem>
                          <SelectItem value="Dead">Dead / Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
