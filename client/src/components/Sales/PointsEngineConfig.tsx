import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PointsEngineConfig() {
  const utils = trpc.useUtils();
  const { data: rules, isLoading } = trpc.sales.listPointsRules.useQuery();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [priority, setPriority] = useState(0);
  const [courseMatch, setCourseMatch] = useState("");
  const [minPaymentPercent, setMinPaymentPercent] = useState("");
  const [fixedPointsAward, setFixedPointsAward] = useState("");
  const [formula, setFormula] = useState("");

  const createRule = trpc.sales.createPointsRule.useMutation({
    onSuccess: () => {
      toast.success("Points rule created successfully");
      setIsOpen(false);
      setName("");
      setPriority(0);
      setCourseMatch("");
      setMinPaymentPercent("");
      setFixedPointsAward("");
      setFormula("");
      utils.sales.listPointsRules.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createRule.mutate({
      name,
      priority: Number(priority),
      courseMatch: courseMatch || undefined,
      minPaymentPercent: minPaymentPercent ? Number(minPaymentPercent) : undefined,
      fixedPointsAward: fixedPointsAward ? Number(fixedPointsAward) : undefined,
      formula: formula || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-slate-900 dark:text-slate-100">Points Calculation Engine</CardTitle>
            <CardDescription>
              Configure the dynamic rules that calculate points based on closures and payments.
            </CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <DialogHeader>
                <DialogTitle>Create New Points Rule</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4 grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Rule Name *</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Full Payment Bonus" />
                </div>
                
                <div className="space-y-2">
                  <Label>Priority (Higher runs first)</Label>
                  <Input type="number" value={priority} onChange={e => setPriority(Number(e.target.value))} required />
                </div>

                <div className="space-y-2">
                  <Label>Course Match (Optional)</Label>
                  <Input value={courseMatch} onChange={e => setCourseMatch(e.target.value)} placeholder="e.g. Diploma" />
                </div>

                <div className="space-y-2">
                  <Label>Min Payment % (Optional)</Label>
                  <Input type="number" value={minPaymentPercent} onChange={e => setMinPaymentPercent(e.target.value)} placeholder="e.g. 50" />
                </div>

                <div className="space-y-2">
                  <Label>Fixed Points Award (Optional)</Label>
                  <Input type="number" value={fixedPointsAward} onChange={e => setFixedPointsAward(e.target.value)} placeholder="e.g. 100" />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Dynamic Formula (Optional)</Label>
                  <Input value={formula} onChange={e => setFormula(e.target.value)} placeholder="e.g. (received_amount / total_fee) * 100" />
                  <p className="text-xs text-slate-500">Variables available: received_amount, total_fee</p>
                </div>

                <div className="col-span-2 flex justify-end pt-4">
                  <Button type="submit" disabled={createRule.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                    {createRule.isPending ? "Saving..." : "Create Rule"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
