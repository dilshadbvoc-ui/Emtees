import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function HierarchyManager() {
  const { data: groups, isLoading } = trpc.sales.listGroups.useQuery();

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Teams & Hierarchy Manager</CardTitle>
          <CardDescription>
            Manage Sales Groups and ASMs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-slate-400">Loading groups...</div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-800">
                <TableRow>
                  <TableHead className="text-slate-300">Team Name</TableHead>
                  <TableHead className="text-slate-300">Description</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-slate-500 py-6">
                      No teams configured yet.
                    </TableCell>
                  </TableRow>
                )}
                {groups?.map((group) => (
                  <TableRow key={group.id} className="border-slate-800">
                    <TableCell className="text-slate-200 font-medium">{group.name}</TableCell>
                    <TableCell className="text-slate-300">{group.description || "—"}</TableCell>
                    <TableCell className="text-emerald-400">
                      {group.isActive ? "Active" : "Inactive"}
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
