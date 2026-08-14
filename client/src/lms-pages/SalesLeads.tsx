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
import { Search, Plus, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export default function LeadCampaigns() {
  const { user } = useAuth();
  const isAdmin = ["super_admin", "admin", "sales_manager"].includes(user?.role || "");

  const [search, setSearch] = useState("");
  const [execFilter, setExecFilter] = useState("all");
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    startDate: "",
    endDate: "",
    month: "",
    course: "",
    noOfLeads: "",
    amountSpent: "",
    dailyBudget: "",
    caId: "",
  });

  const campaignsQuery = trpc.sales.listLeadCampaigns.useQuery(undefined);
  const execsQuery = trpc.salesExecutive.listExecutives.useQuery(undefined, { enabled: isAdmin });
  const activeCoursesQuery = trpc.learning.listModules.useQuery();
  const createCampaignMutation = trpc.sales.createLeadCampaign.useMutation();
  const updateStatusMutation = trpc.sales.updateLeadCampaignStatus.useMutation();

  const activeCourses = activeCoursesQuery.data?.filter((m) => m.status === "active") || [];

  const handleRefresh = () => {
    campaignsQuery.refetch();
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.startDate || !newCampaign.endDate || !newCampaign.course || !newCampaign.month) {
      toast.error("Please fill in all required fields (Dates, Month, Course)");
      return;
    }
    
    const noOfLeads = parseInt(newCampaign.noOfLeads) || 0;
    const amountSpent = parseFloat(newCampaign.amountSpent) || 0;
    const dailyBudget = parseFloat(newCampaign.dailyBudget) || 0;
    const caId = parseInt(newCampaign.caId) || undefined;

    if (!caId && isAdmin) {
      toast.error("Please assign a Sales Executive");
      return;
    }

    try {
      await createCampaignMutation.mutateAsync({
        startDate: new Date(newCampaign.startDate).toISOString(),
        endDate: new Date(newCampaign.endDate).toISOString(),
        month: newCampaign.month,
        course: newCampaign.course,
        noOfLeads,
        amountSpent,
        dailyBudget,
        caId,
        isActive: true,
      });
      toast.success("Campaign created successfully");
      setIsCreateOpen(false);
      setNewCampaign({ startDate: "", endDate: "", month: "", course: "", noOfLeads: "", amountSpent: "", dailyBudget: "", caId: "" });
      handleRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to create campaign");
    }
  };

  const handleStatusChange = async (id: number, isActive: boolean) => {
    try {
      await updateStatusMutation.mutateAsync({ id, isActive });
      toast.success("Campaign status updated");
      handleRefresh();
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  const rawCampaigns = campaignsQuery.data || [];

  const filteredCampaigns = rawCampaigns.filter((campaign: any) => {
    if (search) {
      const searchLower = search.toLowerCase();
      const matchCourse = campaign.course.toLowerCase().includes(searchLower);
      const matchMonth = campaign.month.toLowerCase().includes(searchLower);
      if (!matchCourse && !matchMonth) return false;
    }

    if (isAdmin && execFilter !== "all" && campaign.caId?.toString() !== execFilter) {
      return false;
    }

    return true;
  }).sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Lead Campaigns</h1>
          <p className="text-xs text-gray-500 mt-1">Manage ad campaigns and budgets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={campaignsQuery.isFetching}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${campaignsQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Lead Campaign</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCampaign} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Start Date *</label>
                    <Input 
                      type="date"
                      value={newCampaign.startDate}
                      onChange={e => setNewCampaign({...newCampaign, startDate: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">End Date *</label>
                    <Input 
                      type="date"
                      value={newCampaign.endDate}
                      onChange={e => setNewCampaign({...newCampaign, endDate: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Month *</label>
                    <Select value={newCampaign.month} onValueChange={v => setNewCampaign({...newCampaign, month: v})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Course *</label>
                    <Select value={newCampaign.course} onValueChange={v => setNewCampaign({...newCampaign, course: v})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select Course" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeCourses.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700">No of Leads</label>
                    <Input 
                      type="number"
                      min="0"
                      value={newCampaign.noOfLeads}
                      onChange={e => setNewCampaign({...newCampaign, noOfLeads: e.target.value})}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Amount Spent</label>
                    <Input 
                      type="number"
                      min="0"
                      step="0.01"
                      value={newCampaign.amountSpent}
                      onChange={e => setNewCampaign({...newCampaign, amountSpent: e.target.value})}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Daily Budget</label>
                    <Input 
                      type="number"
                      min="0"
                      step="0.01"
                      value={newCampaign.dailyBudget}
                      onChange={e => setNewCampaign({...newCampaign, dailyBudget: e.target.value})}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                </div>

                {isAdmin && (
                  <div>
                    <label className="text-xs font-medium text-gray-700">Sales Executive *</label>
                    <Select value={newCampaign.caId} onValueChange={v => setNewCampaign({...newCampaign, caId: v})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select Executive" />
                      </SelectTrigger>
                      <SelectContent>
                        {execsQuery.data?.map(exec => (
                          <SelectItem key={exec.id} value={exec.id.toString()}>
                            {exec.name || `Exec #${exec.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createCampaignMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                    {createCampaignMutation.isPending ? "Creating..." : "Save Campaign"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-gray-100 shadow-sm">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by course or month..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs rounded-lg border-gray-200"
            />
          </div>

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
                <TableHead className="text-xs font-medium text-gray-500">Date Range</TableHead>
                <TableHead className="text-xs font-medium text-gray-500">Month / Course</TableHead>
                {isAdmin && <TableHead className="text-xs font-medium text-gray-500">Executive</TableHead>}
                <TableHead className="text-xs font-medium text-gray-500 text-right">Leads</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 text-right">Spent</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 text-right">Daily Limit</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="h-32 text-center text-gray-500 text-xs">
                    {campaignsQuery.isLoading ? "Loading campaigns..." : "No campaigns found."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCampaigns.map((campaign: any) => (
                  <TableRow key={campaign.id} className="hover:bg-gray-50/50">
                    <TableCell className="text-xs text-gray-600">
                      <div>{new Date(campaign.startDate).toLocaleDateString()}</div>
                      <div className="text-gray-400">to {new Date(campaign.endDate).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-gray-900">
                      {campaign.month}
                      <div className="text-[10px] text-gray-500 font-normal">{campaign.course}</div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-xs text-gray-600">
                        {campaign.courseAdvisor?.name || "-"}
                      </TableCell>
                    )}
                    <TableCell className="text-xs text-gray-900 text-right font-medium">
                      {campaign.noOfLeads}
                    </TableCell>
                    <TableCell className="text-xs text-gray-900 text-right">
                      {campaign.amountSpent}
                    </TableCell>
                    <TableCell className="text-xs text-gray-900 text-right">
                      {campaign.dailyBudget}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center">
                        <Switch
                          checked={campaign.isActive}
                          onCheckedChange={(val) => handleStatusChange(campaign.id, val)}
                        />
                      </div>
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
