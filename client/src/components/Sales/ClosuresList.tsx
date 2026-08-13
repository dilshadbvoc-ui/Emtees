import { trpc } from "@/providers/trpc";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function ClosuresList() {
  const { data: closures, isLoading } = trpc.sales.listClosures.useQuery({});

  if (isLoading) return <div>Loading closures...</div>;

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="text-slate-900 dark:text-slate-100">Recent Closures</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader className="bg-slate-100 dark:bg-slate-800">
            <TableRow>
              <TableHead className="text-slate-700 dark:text-slate-300">Date</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300">Student</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300">Course</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300">Type</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 text-right">Total Fee</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 text-right">Balance</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 text-right">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {closures?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-500 py-6">No closures found.</TableCell>
              </TableRow>
            )}
            {closures?.map((closure) => (
              <TableRow key={closure.id} className="border-slate-200 dark:border-slate-800">
                <TableCell className="text-slate-700 dark:text-slate-300">{format(new Date(closure.closingDate), "MMM dd, yyyy")}</TableCell>
                <TableCell className="text-slate-900 dark:text-slate-200 font-medium">
                  {closure.studentName || "N/A"}
                  <div className="text-xs text-slate-500">{closure.admNo}</div>
                </TableCell>
                <TableCell className="text-slate-700 dark:text-slate-300">{closure.courseName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-indigo-400 border-indigo-900">
                    {closure.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-slate-900 dark:text-slate-200">₹{closure.totalFee}</TableCell>
                <TableCell className="text-right text-amber-400">₹{closure.balance}</TableCell>
                <TableCell className="text-right text-emerald-400 font-bold">{closure.points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
