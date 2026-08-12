import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/exportUtils";

export default function SalesReportsView() {
  const [groupBy, setGroupBy] = useState<"ca" | "asm" | "group">("ca");
  const [monthStr, setMonthStr] = useState<string>("August 2025"); // Mock default for now

  const { data: report, isLoading } = trpc.sales.generateReport.useQuery({
    groupBy,
    monthStr: monthStr || undefined,
  });

  const handleExport = () => {
    if (!report) return;
    const headers = ["Identifier", "Total Closures", "Collected Revenue", "Total Fee", "Points Awarded"];
    const rows = Object.entries(report).map(([key, stats]) => [
      key,
      stats.totalClosures,
      stats.collected,
      stats.totalFee,
      stats.totalPoints
    ]);
    exportToCSV(`sales_report_${groupBy}_${monthStr.replace(' ', '_')}`, headers, rows);
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-slate-100">Automated Reports</CardTitle>
        <div className="flex gap-4">
          <Select value={monthStr} onValueChange={setMonthStr}>
            <SelectTrigger className="w-[180px] bg-slate-950 border-slate-700 text-slate-200">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="August 2025">August 2025</SelectItem>
              <SelectItem value="September 2025">September 2025</SelectItem>
            </SelectContent>
          </Select>

          <Select value={groupBy} onValueChange={(val: any) => setGroupBy(val)}>
            <SelectTrigger className="w-[180px] bg-slate-950 border-slate-700 text-slate-200">
              <SelectValue placeholder="Group By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ca">By Sales Executive (CA)</SelectItem>
              <SelectItem value="asm">By ASM</SelectItem>
              <SelectItem value="group">By Group / Team</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExport} className="border-slate-700 text-slate-300 hover:text-white">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-slate-400 py-4">Generating report...</div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-800">
              <TableRow>
                <TableHead className="text-slate-300">
                  {groupBy === 'ca' ? "CA ID" : groupBy === 'asm' ? "ASM ID" : "Group ID"}
                </TableHead>
                <TableHead className="text-slate-300 text-right">Total Closures</TableHead>
                <TableHead className="text-slate-300 text-right">Collected Revenue</TableHead>
                <TableHead className="text-slate-300 text-right">Total Fee Value</TableHead>
                <TableHead className="text-slate-300 text-right">Total Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!report || Object.keys(report).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-6">No data found for this period.</TableCell>
                </TableRow>
              ) : (
                Object.entries(report).map(([key, stats]) => (
                  <TableRow key={key} className="border-slate-800">
                    <TableCell className="text-slate-200 font-medium">{key}</TableCell>
                    <TableCell className="text-right text-slate-300">{stats.totalClosures}</TableCell>
                    <TableCell className="text-right text-emerald-400">₹{stats.collected}</TableCell>
                    <TableCell className="text-right text-slate-400">₹{stats.totalFee}</TableCell>
                    <TableCell className="text-right text-indigo-400 font-bold">{stats.totalPoints}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
