import { useState, useMemo } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, startOfWeek, endOfWeek } from "date-fns";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function LeadsReportView() {
  const [period, setPeriod] = useState<"all" | "monthly" | "weekly">("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));

  const { data: rawLeads, isLoading: leadsLoading } = trpc.sales.listLeads.useQuery(undefined);
  const { data: execs, isLoading: execsLoading } = trpc.salesExecutive.listExecutives.useQuery(undefined);

  const leads = rawLeads || [];
  const executives = execs || [];

  const filteredLeads = useMemo(() => {
    if (period === "all") return leads;

    const targetDate = parseISO(`${selectedMonth}-01`);
    let start, end;

    if (period === "monthly") {
      start = startOfMonth(targetDate);
      end = endOfMonth(targetDate);
    } else { // weekly (e.g. Aug Week)
      // Just taking the first week of the selected month as an example for "weekly"
      start = startOfWeek(targetDate);
      end = endOfWeek(targetDate);
    }

    return leads.filter(lead => {
      const leadDate = new Date(lead.createdAt);
      return isWithinInterval(leadDate, { start, end });
    });
  }, [leads, period, selectedMonth]);

  // --- Analysis by Formula ---
  const totalLeads = filteredLeads.length;
  const statusCounts = filteredLeads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const convertedLeads = statusCounts["Converted"] || 0;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0.0";

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // --- ASM Wise Comparison ---
  // Group leads by ASM. First map CAs to their ASMs
  const asmWiseData = useMemo(() => {
    const asms = executives.filter(e => e.isASM);
    const groups: Record<number, any> = {};

    asms.forEach(asm => {
      if (asm.groupId) {
        groups[asm.groupId] = {
          asmName: asm.name || `ASM #${asm.id}`,
          total: 0,
          converted: 0,
          contacted: 0,
          dead: 0,
          new: 0,
        };
      }
    });

    // Add an 'Unassigned' or 'No Group' category
    groups[-1] = { asmName: "Unassigned/Direct", total: 0, converted: 0, contacted: 0, dead: 0, new: 0 };

    filteredLeads.forEach(lead => {
      const ca = executives.find(e => e.id === lead.caId);
      const groupId = ca?.groupId || -1;
      
      if (!groups[groupId]) {
         groups[groupId] = { asmName: `Group ${groupId}`, total: 0, converted: 0, contacted: 0, dead: 0, new: 0 };
      }

      groups[groupId].total++;
      if (lead.status === "Converted") groups[groupId].converted++;
      else if (lead.status === "Contacted") groups[groupId].contacted++;
      else if (lead.status === "Dead") groups[groupId].dead++;
      else groups[groupId].new++;
    });

    return Object.values(groups).filter(g => g.total > 0);
  }, [filteredLeads, executives]);

  if (leadsLoading || execsLoading) {
    return <div className="p-6 text-slate-500">Loading Leads Report...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 flex gap-4">
          <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="weekly">Weekly (1st Week)</SelectItem>
            </SelectContent>
          </Select>

          {period !== "all" && (
            <Input 
              type="month" 
              value={selectedMonth} 
              onChange={(e: any) => setSelectedMonth(e.target.value)}
              className="w-[180px]"
            />
          )}
        </CardContent>
      </Card>

      {/* KPIs & Formula Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Converted Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{convertedLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{conversionRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pending (New/Contacted)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {(statusCounts["New"] || 0) + (statusCounts["Contacted"] || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphical Representation */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ASM Wise Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle>ASM-wise Conversion Comparison</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={asmWiseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="asmName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" name="Total Leads" fill="#8884d8" />
                <Bar dataKey="converted" name="Converted" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ASM Wise Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>ASM / Team Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ASM / Group</TableHead>
                <TableHead className="text-right">Total Leads</TableHead>
                <TableHead className="text-right">New</TableHead>
                <TableHead className="text-right">Contacted</TableHead>
                <TableHead className="text-right">Converted</TableHead>
                <TableHead className="text-right">Dead</TableHead>
                <TableHead className="text-right">Conversion %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {asmWiseData.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-4">No data</TableCell></TableRow>
              ) : (
                asmWiseData.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.asmName}</TableCell>
                    <TableCell className="text-right">{row.total}</TableCell>
                    <TableCell className="text-right text-blue-600">{row.new}</TableCell>
                    <TableCell className="text-right text-amber-600">{row.contacted}</TableCell>
                    <TableCell className="text-right text-emerald-600">{row.converted}</TableCell>
                    <TableCell className="text-right text-red-600">{row.dead}</TableCell>
                    <TableCell className="text-right font-bold">
                      {((row.converted / row.total) * 100).toFixed(1)}%
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
