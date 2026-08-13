import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function AsmPerformanceReport() {
  const [monthStr, setMonthStr] = useState(format(new Date(), "yyyy-MM"));
  const { data: asmData, isLoading } = trpc.sales.getAsmPerformance.useQuery({ monthStr });

  const handleExport = () => {
    if (!asmData || asmData.length === 0) return;
    const headers = ["CA List", "Team Leader", "ASM", "New Closure", "Old Balance", "Renewal", "Total Amount", "Closures Count"];
    const csvRows = [headers.join(",")];
    
    asmData.forEach(row => {
      csvRows.push([
        `"${row.caList}"`,
        `"${row.groupName}"`,
        `"${row.asmName}"`,
        row.firstPayment,
        row.oldBalance,
        row.renewal,
        row.firstPayment + row.oldBalance + row.renewal,
        row.closures
      ].join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asm_report_${monthStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Generate last 12 months for selector
  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(format(d, "yyyy-MM"));
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-slate-900 dark:text-slate-100">ASM Wise Performance Report</CardTitle>
            <CardDescription>Performance grouped by Area Sales Manager and Team.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={monthStr} onValueChange={setMonthStr}>
              <SelectTrigger className="w-[150px] bg-white dark:bg-slate-950">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m} value={m}>{format(new Date(m + "-01"), "MMMM yyyy")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleExport} variant="outline" className="bg-white dark:bg-slate-950">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100 dark:bg-slate-800">
                <TableRow>
                  <TableHead className="text-slate-700 dark:text-slate-300">CA List</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Team Name</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">ASM</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300 text-right">New Closure</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300 text-right">Old Balance</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300 text-right">Renewal</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300 text-right font-bold">Total</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300 text-center">Closures</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">Loading...</TableCell>
                  </TableRow>
                ) : asmData?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">No data for this month.</TableCell>
                  </TableRow>
                ) : (
                  asmData?.map((row, idx) => {
                    const rowTotal = row.firstPayment + row.oldBalance + row.renewal;
                    return (
                      <TableRow key={idx} className="border-slate-200 dark:border-slate-800">
                        <TableCell className="text-xs text-slate-600 max-w-[200px] truncate" title={row.caList}>{row.caList || "—"}</TableCell>
                        <TableCell className="font-medium text-indigo-600">{row.groupName}</TableCell>
                        <TableCell className="font-semibold text-slate-800">{row.asmName}</TableCell>
                        <TableCell className="text-right">₹{row.firstPayment.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-rose-600">₹{row.oldBalance.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-amber-600">₹{row.renewal.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">₹{rowTotal.toLocaleString()}</TableCell>
                        <TableCell className="text-center font-bold">{row.closures}</TableCell>
                      </TableRow>
                    );
                  })
                )}
                {/* Total Row */}
                {asmData && asmData.length > 0 && (
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                    <TableCell colSpan={3} className="text-right font-bold text-slate-900">GRAND TOTAL:</TableCell>
                    <TableCell className="text-right font-bold">
                      ₹{asmData.reduce((acc, curr) => acc + curr.firstPayment, 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-bold text-rose-600">
                      ₹{asmData.reduce((acc, curr) => acc + curr.oldBalance, 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-bold text-amber-600">
                      ₹{asmData.reduce((acc, curr) => acc + curr.renewal, 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">
                      ₹{asmData.reduce((acc, curr) => acc + curr.firstPayment + curr.oldBalance + curr.renewal, 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {asmData.reduce((acc, curr) => acc + curr.closures, 0)}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
