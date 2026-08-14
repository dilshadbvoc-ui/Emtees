import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Download, RefreshCw, Calendar as CalendarIcon } from "lucide-react";

export default function SalesPerformanceReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const reportQuery = trpc.sales.getSalesPerformanceReport.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const data = reportQuery.data || [];

  const handleRefresh = () => {
    reportQuery.refetch();
  };

  const handleExportCSV = () => {
    if (data.length === 0) return;
    const headers = ["Executive Name", "Leads Given", "Closures", "Closing %"];
    const csvContent = [
      headers.join(","),
      ...data.map(r => `"${r.name}",${r.leads},${r.closures},${r.percentage}`)
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Sales_Performance_Report.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">User Performance Report</h2>
          <p className="text-xs text-slate-500">Compare leads assigned vs successful closures.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            <Input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="w-[140px] text-xs h-8 bg-white dark:bg-slate-900" 
            />
            <span className="text-xs text-slate-400">to</span>
            <Input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="w-[140px] text-xs h-8 bg-white dark:bg-slate-900" 
            />
          </div>
          <Button variant="outline" size="sm" className="h-8" onClick={handleRefresh} disabled={reportQuery.isFetching}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${reportQuery.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Leads vs Closures</CardTitle>
            <CardDescription className="text-xs">Visual comparison per sales executive.</CardDescription>
          </CardHeader>
          <CardContent>
            {reportQuery.isLoading ? (
              <div className="h-[300px] flex items-center justify-center text-sm text-slate-400 animate-pulse">Loading chart data...</div>
            ) : data.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">No data available for this period.</div>
            ) : (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                    <Bar dataKey="leads" name="Leads Given" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="closures" name="Closures" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="text-xs">Executive</TableHead>
                    <TableHead className="text-xs text-right">Leads</TableHead>
                    <TableHead className="text-xs text-right">Closures</TableHead>
                    <TableHead className="text-xs text-right">Conv. %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportQuery.isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-8">Loading...</TableCell></TableRow>
                  ) : data.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-8">No records found.</TableCell></TableRow>
                  ) : (
                    data.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-xs font-medium">{row.name}</TableCell>
                        <TableCell className="text-xs text-right text-indigo-600 dark:text-indigo-400 font-semibold">{row.leads}</TableCell>
                        <TableCell className="text-xs text-right text-emerald-600 dark:text-emerald-400 font-semibold">{row.closures}</TableCell>
                        <TableCell className="text-xs text-right">
                          <span className={`px-2 py-0.5 rounded-full ${
                            row.percentage >= 15 ? 'bg-emerald-100 text-emerald-700' :
                            row.percentage >= 5 ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {row.percentage}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
