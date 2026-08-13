import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { IndianRupee, Users, TrendingUp, AlertCircle } from "lucide-react";

export default function DashboardView() {
  const { data: stats, isLoading } = trpc.sales.getDashboardStats.useQuery();

  if (isLoading) {
    return <div className="text-slate-500 animate-pulse">Loading dashboard statistics...</div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-2">
              <IndianRupee className="w-4 h-4" />
              <h3 className="font-medium text-sm">Monthly Revenue</h3>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              ₹{stats.totalRevenue.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-2">
              <Users className="w-4 h-4" />
              <h3 className="font-medium text-sm">Monthly Closures</h3>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.totalClosures}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <h3 className="font-medium text-sm">Total Pipeline</h3>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              ₹{stats.totalPipeline.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-rose-500 dark:text-rose-400 mb-2">
              <AlertCircle className="w-4 h-4" />
              <h3 className="font-medium text-sm">Outstanding Balance</h3>
            </div>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-500">
              ₹{stats.outstanding.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Revenue Trend (Last 6 Months)</CardTitle>
            <CardDescription>First installment revenue over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                  <CartesianGrid stroke="#ccc" strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Closures Trend Chart */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Closures Trend (Last 6 Months)</CardTitle>
            <CardDescription>Number of total closures made over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid stroke="#ccc" strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: number) => [value, 'Closures']}
                    cursor={{ fill: '#334155', opacity: 0.1 }}
                  />
                  <Bar dataKey="closures" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
