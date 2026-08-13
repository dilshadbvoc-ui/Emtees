import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function ClassReportView() {
  const { data: classes, isLoading } = trpc.admin.generateClassReport.useQuery({});

  if (isLoading) return <div>Loading class report...</div>;

  return (
    <Card className="print-card-border mt-4">
      <CardHeader>
        <CardTitle>Class Details Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Title</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Valid Students</TableHead>
                <TableHead>Status (20-min Rule)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!classes || classes.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-4">No classes found</TableCell></TableRow>
              ) : (
                classes.map((cls) => (
                  <TableRow key={cls.classId}>
                    <TableCell className="font-medium">{cls.title}</TableCell>
                    <TableCell>{cls.teacherName || "Unknown"}</TableCell>
                    <TableCell className="capitalize">{cls.classType.replace(/_/g, " ")}</TableCell>
                    <TableCell>{cls.startedAt ? format(new Date(cls.startedAt), "PPp") : "-"}</TableCell>
                    <TableCell>{cls.endedAt ? format(new Date(cls.endedAt), "PPp") : "-"}</TableCell>
                    <TableCell className="text-center">{cls.validStudents}</TableCell>
                    <TableCell>
                      {cls.isValid ? (
                        <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Valid</Badge>
                      ) : (
                        <Badge variant="destructive">Invalid</Badge>
                      )}
                    </TableCell>
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
