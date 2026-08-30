import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/exportUtils";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getCurrentMonthStr() {
  const now = new Date();
  return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
}

function getMonthOptions() {
  const now = new Date();
  const options: string[] = [];
  // 3 months back to 3 months ahead
  for (let i = -3; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    options.push(`${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`);
  }
  return options;
}

export default function SalesReportsView() {
  const [monthStr, setMonthStr] = useState<string>(getCurrentMonthStr());

  const { data: reportData, isLoading } = trpc.sales.generateDetailedReport.useQuery({
    monthStr: monthStr || undefined,
  });

  const handleExport = () => {
    if (!reportData) return;
    const headers = [
      "Closing Date", "Month", "Manager", "ASM", "Team", "CA Category", "CA Name", "Course", 
      "Adm. No", "Closure", "Name", "Total Fee", "First Inst", 
      "Second Inst", "III Installment", "Balance", "Bank", 
      "Verification", "V STATUS"
    ];
    
    const rows = reportData.map((row: any) => [
      row.closingDate ? new Date(row.closingDate).toLocaleDateString() : "",
      row.monthStr,
      row.managerName || "N/A",
      row.asmName || "N/A",
      row.teamName || "N/A",
      row.caCategory,
      row.caName,
      row.courseName,
      row.admNo,
      row.closure,
      row.studentName,
      row.totalFee,
      row.firstInst,
      row.secondInst,
      row.thirdInst,
      row.balance,
      row.bank,
      row.isVerified ? "TRUE" : "FALSE",
      row.verificationStatus
    ]);
    exportToCSV(`sales_detailed_report_${monthStr.replace(' ', '_')}`, headers, rows);
  };

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-slate-900 dark:text-slate-100">Automated Reports</CardTitle>
        <div className="flex gap-4">
          <Select value={monthStr} onValueChange={setMonthStr}>
            <SelectTrigger className="w-[180px] bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {getMonthOptions().map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExport} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-white">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-slate-500 dark:text-slate-400 py-4">Generating report...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-max text-xs">
              <TableHeader className="bg-slate-100 dark:bg-slate-800">
                <TableRow>
                  <TableHead className="text-slate-700 dark:text-slate-300">Closing Date</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Month</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Manager</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">ASM</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Team</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">CA Category</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">CA Name</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Course</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Adm. No</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300 text-center">Closure</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Name</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300 text-right">Total Fee</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300 text-right">First Inst</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300 text-right">Second Inst</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300 text-right">III Inst</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300 text-right">Balance</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Bank</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300 text-center">Verification</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">V STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!reportData || reportData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={19} className="text-center text-slate-500 py-6">No data found for this period.</TableCell>
                  </TableRow>
                ) : (
                  <>
                    {reportData.map((row: any, idx: number) => (
                      <TableRow key={idx} className="border-slate-200 dark:border-slate-800">
                        <TableCell className="text-slate-700 dark:text-slate-300">{row.closingDate ? new Date(row.closingDate).toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">{row.monthStr}</TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">{row.managerName || "N/A"}</TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">{row.asmName || "N/A"}</TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">{row.teamName || "N/A"}</TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">{row.caCategory || "—"}</TableCell>
                        <TableCell className="text-slate-900 dark:text-slate-200 font-medium">{row.caName || "—"}</TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">{row.courseName}</TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">{row.admNo}</TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300 text-center">{row.closure}</TableCell>
                        <TableCell className="text-slate-900 dark:text-slate-200">{row.studentName}</TableCell>
                        <TableCell className="text-right text-slate-700 dark:text-slate-300">{row.totalFee}</TableCell>
                        <TableCell className="text-right text-slate-700 dark:text-slate-300">{row.firstInst}</TableCell>
                        <TableCell className="text-right text-slate-700 dark:text-slate-300">{row.secondInst}</TableCell>
                        <TableCell className="text-right text-slate-700 dark:text-slate-300">{row.thirdInst}</TableCell>
                        <TableCell className="text-right text-amber-500">{row.balance}</TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">{row.bank}</TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300 text-center">{row.isVerified ? "TRUE" : "FALSE"}</TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">{row.verificationStatus}</TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <TableCell colSpan={6} className="text-right font-bold text-slate-900 dark:text-slate-100">Totals:</TableCell>
                      <TableCell className="text-center font-bold text-slate-900 dark:text-slate-100">
                        {reportData.reduce((acc: number, val: any) => acc + (val.closure || 0), 0)}
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">
                        {reportData.reduce((acc: number, val: any) => acc + (val.totalFee || 0), 0)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">
                        {reportData.reduce((acc: number, val: any) => acc + (val.firstInst || 0), 0)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">
                        {reportData.reduce((acc: number, val: any) => acc + (val.secondInst || 0), 0)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">
                        {reportData.reduce((acc: number, val: any) => acc + (val.thirdInst || 0), 0)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-amber-600 dark:text-amber-500">
                        {reportData.reduce((acc: number, val: any) => acc + (val.balance || 0), 0)}
                      </TableCell>
                      <TableCell colSpan={3}></TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
