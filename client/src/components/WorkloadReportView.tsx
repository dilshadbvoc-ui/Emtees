import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function WorkloadReportView() {
  const { data: workload, isLoading } = trpc.admin.generateWorkloadReport.useQuery({});

  if (isLoading) return <div>Loading workload report...</div>;

  return (
    <Card className="print-card-border mt-4">
      <CardHeader>
        <CardTitle>Teacher Workload Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher Name</TableHead>
                <TableHead className="text-right">Total Classes</TableHead>
                <TableHead className="text-right">Group Classes</TableHead>
                <TableHead className="text-right">1-to-1 Classes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!workload || workload.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-4">No workload data found</TableCell></TableRow>
              ) : (
                workload.map((wl, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{wl.teacherName}</TableCell>
                    <TableCell className="text-right font-bold text-indigo-600">{wl.totalClasses}</TableCell>
                    <TableCell className="text-right">{wl.group}</TableCell>
                    <TableCell className="text-right">{wl.oneToOne}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
