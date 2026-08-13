"use client";

import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export default function SalesLeads() {
  const { user } = useAuth();
  const isAdmin = ["super_admin", "admin", "sales_manager"].includes(user?.role || "");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [execFilter, setExecFilter] = useState("all");
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    studentName: "",
    phone: "",
    address: "",
    remarks: "",
  });

  const leadsQuery = trpc.sales.listLeads.useQuery(undefined);
  
  const execsQuery = trpc.salesExecutive.listExecutives.useQuery(undefined, { enabled: isAdmin });
  const createLeadMutation = trpc.sales.createLead.useMutation();
  const updateStatusMutation = trpc.sales.updateLeadStatus.useMutation();

  const handleRefresh = () => {
    leadsQuery.refetch();
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.studentName) {
      toast.error("Student name is required");
      return;
    }
    
    try {
      await createLeadMutation.mutateAsync({
        studentName: newLead.studentName,
        phone: newLead.phone,
        address: newLead.address,
        remarks: newLead.remarks,
      });
      toast.success("Lead created successfully");
      setIsCreateOpen(false);
      setNewLead({ studentName: "", phone: "", address: "", remarks: "" });
      handleRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to create lead");
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      toast.success("Lead status updated");
      handleRefresh();
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  const rawLeads = leadsQuery.data || [];

  const filteredLeads = rawLeads.filter((lead: any) => {
    if (search) {
      const searchLower = search.toLowerCase();
      const matchName = lead.studentName.toLowerCase().includes(searchLower);
      const matchPhone = lead.phone?.toLowerCase().includes(searchLower) || false;
      if (!matchName && !matchPhone) return false;
    }

    if (statusFilter !== "all" && lead.status !== statusFilter) {
      return false;
    }

    if (isAdmin && execFilter !== "all" && lead.caId?.toString() !== execFilter) {
      return false;
    }

    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New": return "bg-blue-100 text-blue-800";
      case "Contacted": return "bg-yellow-100 text-yellow-800";
      case "Converted": return "bg-emerald-100 text-emerald-800";
      case "Dead": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Sales Leads</h1>
          <p className="text-xs text-gray-500 mt-1">Manage and track your student leads</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={leadsQuery.isFetching}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${leadsQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateLead} className="space-y-4 pt-4">
                <div>
                  <label className="text-xs font-medium text-gray-700">Student Name *</label>
                  <Input 
                    value={newLead.studentName}
                    onChange={e => setNewLead({...newLead, studentName: e.target.value})}
                    placeholder="Enter full name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Phone</label>
                  <Input 
                    value={newLead.phone}
                    onChange={e => setNewLead({...newLead, phone: e.target.value})}
                    placeholder="Enter phone number"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Address</label>
                  <Input 
                    value={newLead.address}
                    onChange={e => setNewLead({...newLead, address: e.target.value})}
                    placeholder="Enter address"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Remarks</label>
                  <Textarea 
                    value={newLead.remarks}
                    onChange={e => setNewLead({...newLead, remarks: e.target.value})}
                    placeholder="Add initial notes..."
                    className="mt-1 resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createLeadMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                    {createLeadMutation.isPending ? "Creating..." : "Save Lead"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-gray-100 shadow-sm">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs rounded-lg border-gray-200"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="text-xs rounded-lg border-gray-200 bg-white">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Contacted">Contacted</SelectItem>
              <SelectItem value="Converted">Converted</SelectItem>
              <SelectItem value="Dead">Dead</SelectItem>
            </SelectContent>
          </Select>

          {isAdmin && (
            <Select value={execFilter} onValueChange={setExecFilter}>
              <SelectTrigger className="text-xs rounded-lg border-gray-200 bg-white">
                <SelectValue placeholder="All Executives" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Executives</SelectItem>
                {execsQuery.data?.map((exec) => (
                  <SelectItem key={exec.id} value={exec.id.toString()}>
                    {exec.name || `Exec #${exec.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="text-xs font-medium text-gray-500">Student</TableHead>
                <TableHead className="text-xs font-medium text-gray-500">Contact</TableHead>
                {isAdmin && <TableHead className="text-xs font-medium text-gray-500">Sales Exec</TableHead>}
                <TableHead className="text-xs font-medium text-gray-500">Remarks</TableHead>
                <TableHead className="text-xs font-medium text-gray-500">Status</TableHead>
                <TableHead className="text-xs font-medium text-gray-500">Created</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="h-32 text-center text-gray-500 text-xs">
                    {leadsQuery.isLoading ? "Loading leads..." : "No leads found."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead: any) => (
                  <TableRow key={lead.id} className="hover:bg-gray-50/50">
                    <TableCell className="text-xs font-medium text-gray-900">
                      {lead.studentName}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      <div>{lead.phone || "-"}</div>
                      {lead.address && <div className="text-[10px] text-gray-400 mt-0.5">{lead.address}</div>}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-xs text-gray-600">
                        {lead.salesExecutive?.user?.name || "-"}
                      </TableCell>
                    )}
                    <TableCell className="text-xs text-gray-600 max-w-[200px] truncate">
                      {lead.remarks || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${getStatusColor(lead.status)} text-[10px]`}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[11px] text-gray-500">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Select 
                        value={lead.status} 
                        onValueChange={(val) => handleStatusChange(lead.id, val)}
                      >
                        <SelectTrigger className="w-[110px] ml-auto h-7 text-[10px] bg-white">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="text-[10px]">
                          <SelectItem value="New">New</SelectItem>
                          <SelectItem value="Contacted">Contacted</SelectItem>
                          <SelectItem value="Converted">Converted</SelectItem>
                          <SelectItem value="Dead">Dead</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
