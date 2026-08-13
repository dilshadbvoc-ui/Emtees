import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function PointsEngineConfig() {
  const { data: rules, isLoading } = trpc.sales.listPointsRules.useQuery();

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Points Calculation Engine</CardTitle>
          <CardDescription>
            Configure the dynamic rules that calculate points based on closures and payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-slate-500 dark:text-slate-400">Loading rules...</div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-100 dark:bg-slate-800">
                <TableRow>
                  <TableHead className="text-slate-700 dark:text-slate-300">Rule Name</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Priority</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Course Match</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Min Payment %</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Action / Formula</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-6">
                      No points rules configured yet. Defaults to 0 points.
                    </TableCell>
                  </TableRow>
                )}
                {rules?.map((rule) => (
                  <TableRow key={rule.id} className="border-slate-200 dark:border-slate-800">
                    <TableCell className="text-slate-900 dark:text-slate-200 font-medium">{rule.name}</TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300">{rule.priority}</TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300">{rule.courseMatch || "Any"}</TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300">{rule.minPaymentPercent ? `${rule.minPaymentPercent}%` : "N/A"}</TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300 font-mono text-sm text-indigo-400">
                      {rule.fixedPointsAward ? `+${rule.fixedPointsAward} pts` : rule.formula}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
