import { useParams, useNavigate } from "react-router-dom";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ArrowLeft, Printer } from "lucide-react";
import { useMemo } from "react";

export default function SalesPerformanceDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const reportQuery = trpc.sales.getSalesPerformanceReport.useQuery({
    // Fetch a slightly broader range if needed or leave empty to get all
  });

  const data = reportQuery.data || [];
  
  // Find the specific user from the aggregated report
  const user = data.find((u: any) => u.id.toString() === userId);

  // Group closures by date for the chart
  const chartData = useMemo(() => {
    if (!user || !user.closuresList) return [];
    
    const dateMap = new Map();
    user.closuresList.forEach((c: any) => {
      if (!c.closingDate) return;
      const dateStr = new Date(c.closingDate).toLocaleDateString();
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
    });

    return Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, closures: count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [user]);

  const handlePrint = () => {
    window.print();
  };

  if (reportQuery.isLoading) {
    return <div className="flex justify-center p-8">Loading details...</div>;
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="p-8 text-center text-slate-500">User not found or no performance data available.</div>
      </div>
    );
  }

  // Generate suggestions
  const getSuggestions = (percentage: number) => {
    if (percentage === 0) {
      return "Critical: No conversions recorded. Ensure leads are being contacted within 24 hours. Consider reviewing the sales script and initial pitch approach.";
    } else if (percentage < 5) {
      return "Improvement Needed: Conversion rate is below target. Focus on better lead qualification and consistent follow-ups. Try identifying common objections and prepare rebuttals.";
    } else if (percentage < 15) {
      return "Good: Performance is steady. To reach the next tier, focus on up-selling or optimizing the closing techniques on warm leads.";
    } else {
      return "Excellent: Conversion rate is outstanding! Maintain current strategies and consider mentoring peers on successful closing tactics.";
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto print:max-w-full print:m-0 print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => navigate(-1)} className="hover:bg-slate-100">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Report
        </Button>
        <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700">
          <Printer className="w-4 h-4 mr-2" /> Export PDF (Print)
        </Button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 print:border-none print:shadow-none shadow-sm">
        <div className="border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Sales Performance Report</h1>
          <p className="text-sm text-slate-500 mt-1">Detailed metrics and analysis for {user.name}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-none border-slate-100 bg-slate-50">
            <CardContent className="p-4 text-center">
              <div className="text-sm text-slate-500 font-medium">Total Leads</div>
              <div className="text-2xl font-bold text-indigo-600 mt-1">{user.leads}</div>
            </CardContent>
          </Card>
          <Card className="shadow-none border-slate-100 bg-slate-50">
            <CardContent className="p-4 text-center">
              <div className="text-sm text-slate-500 font-medium">Total Closures</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{user.closures}</div>
            </CardContent>
          </Card>
          <Card className="shadow-none border-slate-100 bg-slate-50">
            <CardContent className="p-4 text-center">
              <div className="text-sm text-slate-500 font-medium">Conversion Rate</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">{user.percentage}%</div>
            </CardContent>
          </Card>
          <Card className="shadow-none border-slate-100 bg-slate-50">
            <CardContent className="p-4 text-center">
              <div className="text-sm text-slate-500 font-medium">Performance Level</div>
              <div className={`text-lg font-bold mt-2 ${user.percentage >= 15 ? 'text-emerald-600' : user.percentage >= 5 ? 'text-amber-600' : 'text-rose-600'}`}>
                {user.percentage >= 15 ? 'High' : user.percentage >= 5 ? 'Average' : 'Needs Focus'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Closure Timeline</h3>
          <div className="h-[300px] w-full border border-slate-100 rounded-lg p-4 pt-6">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="closures" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} name="Closures" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No closure timeline data available</div>
            )}
          </div>
        </div>

        <div className="mb-8 bg-blue-50/50 p-5 rounded-lg border border-blue-100">
          <h3 className="text-md font-semibold text-blue-900 mb-2">Performance Action Plan & Suggestions</h3>
          <p className="text-sm text-blue-800 leading-relaxed">
            {getSuggestions(user.percentage)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:space-y-8">
          <div>
            <h3 className="text-md font-semibold text-slate-800 mb-3">Leads Given (Campaigns)</h3>
            <div className="border border-slate-200 rounded-md">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Course</TableHead>
                    <TableHead className="text-xs text-right">Leads</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.campaignsList?.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-xs text-slate-400 py-4">No campaigns found.</TableCell></TableRow>
                  ) : (
                    user.campaignsList
                      ?.slice()
                      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell className="text-xs">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs">{c.course}</TableCell>
                          <TableCell className="text-xs text-right font-medium">{c.noOfLeads}</TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div>
            <h3 className="text-md font-semibold text-slate-800 mb-3">Recent Closures</h3>
            <div className="border border-slate-200 rounded-md">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Student Name</TableHead>
                    <TableHead className="text-xs">Course</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.closuresList?.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-xs text-slate-400 py-4">No closures found.</TableCell></TableRow>
                  ) : (
                    user.closuresList
                      ?.slice()
                      .sort((a: any, b: any) => new Date(b.closingDate).getTime() - new Date(a.closingDate).getTime())
                      .map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell className="text-xs">{c.closingDate ? new Date(c.closingDate).toLocaleDateString() : "-"}</TableCell>
                          <TableCell className="text-xs">{c.studentName || "Unknown"}</TableCell>
                          <TableCell className="text-xs">{c.course || "-"}</TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
