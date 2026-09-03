import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ClassAllocationForm, ClassAllocationValue } from "@/components/ClassAllocationForm";
import {
  GraduationCap, Users, BarChart2, BookOpen,
  Phone, IdCard, RefreshCw, Download, Search,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, total: number) {
  if (!total) return "—";
  return `${Math.round((n / total) * 100)}%`;
}

function exportCSV(rows: object[], filename: string) {
  if (!rows.length) return;
  const header = Object.keys(rows[0]).join(",");
  const body = rows
    .map((r) => Object.values(r).map((v) => `"${v ?? ""}"`).join(","))
    .join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AcademicHeadPortal() {
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Queries
  const deptQuery = trpc.department.getMyDepartment.useQuery();
  const studentsQuery = trpc.department.getMyStudents.useQuery();
  const reportQuery = trpc.department.getMyStudentsReport.useQuery(
    { from: from || undefined, to: to || undefined },
    { enabled: tab === "report" },
  );

  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [selectedStudentForAllocation, setSelectedStudentForAllocation] = useState<any>(null);
  const [allocationForm, setAllocationForm] = useState<ClassAllocationValue>({
    oneToOne: { teacherId: "", designatedTime: "", sessions30: 0, sessions45: 0, sessions60: 0 },
    group: { teacherId: "", batchId: "", designatedTime: "", sessions30: 0, sessions45: 0, sessions60: 0 }
  });

  const updateAllocationMutation = trpc.department.updateStudentAllocation.useMutation({
    onSuccess: () => {
      toast.success("Teacher allocation updated successfully");
      setAllocationModalOpen(false);
      studentsQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update teacher allocation");
    }
  });

  const handleOpenAllocationModal = (student: any) => {
    setSelectedStudentForAllocation(student);
    const a = student.allocation;
    if (a) {
      setAllocationForm({
        oneToOne: {
          teacherId: a.oneToOne?.teacherId || "",
          designatedTime: a.oneToOne?.designatedTime || "",
          sessions30: a.oneToOne?.sessions30 || 0,
          sessions45: a.oneToOne?.sessions45 || 0,
          sessions60: a.oneToOne?.sessions60 || 0,
        },
        group: {
          teacherId: a.group?.teacherId || "",
          batchId: a.group?.batchId || "",
          designatedTime: a.group?.designatedTime || "",
          sessions30: a.group?.sessions30 || 0,
          sessions45: a.group?.sessions45 || 0,
          sessions60: a.group?.sessions60 || 0,
        },
      });
    } else {
      setAllocationForm({
        oneToOne: { teacherId: "", designatedTime: "", sessions30: 0, sessions45: 0, sessions60: 0 },
        group: { teacherId: "", batchId: "", designatedTime: "", sessions30: 0, sessions45: 0, sessions60: 0 }
      });
    }
    setAllocationModalOpen(true);
  };

  const dept = deptQuery.data;

  // Filtered students list
  const filteredStudents = (studentsQuery.data ?? []).filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.username?.toLowerCase().includes(q) ||
      s.studentId?.toLowerCase().includes(q) ||
      s.phoneNumber?.toLowerCase().includes(q)
    );
  });

  if (deptQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-500 mr-2" />
        <span className="text-sm text-gray-500">Loading your department…</span>
      </div>
    );
  }

  if (!dept) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          No department assigned
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          You haven't been assigned as head of any department yet. Please contact an administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ─── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30">
          <GraduationCap className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Academic Head Portal
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back, <span className="font-medium text-gray-700 dark:text-gray-300">{user?.name || user?.username}</span>
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-10 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
          <TabsTrigger
            value="overview"
            className="text-xs font-semibold flex items-center justify-center gap-1.5 py-1.5 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Department
          </TabsTrigger>
          <TabsTrigger
            value="students"
            className="text-xs font-semibold flex items-center justify-center gap-1.5 py-1.5 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950"
          >
            <Users className="w-3.5 h-3.5" />
            My Students
          </TabsTrigger>
          <TabsTrigger
            value="report"
            className="text-xs font-semibold flex items-center justify-center gap-1.5 py-1.5 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Class Report
          </TabsTrigger>
        </TabsList>

        {/* ─── Overview ──────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          {/* Dept info card */}
          <Card className="border border-gray-100 dark:border-gray-900 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                {dept.name}
                <Badge className={dept.isActive ? "ml-2 bg-emerald-100 text-emerald-700" : "ml-2 bg-gray-100 text-gray-600"}>
                  {dept.isActive ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
              {dept.description && (
                <CardDescription>{dept.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Courses</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{dept.modules?.length ?? 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Students</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    {studentsQuery.isLoading ? "…" : (studentsQuery.data?.length ?? 0)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-xs text-emerald-600 uppercase tracking-wider font-semibold mb-1">Head</p>
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {user?.name || user?.username}
                  </p>
                </div>
              </div>

              {/* Courses list */}
              {dept.modules && dept.modules.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Assigned Courses
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {dept.modules.map((m: { id: number; name: string }) => (
                      <Badge key={m.id} variant="secondary" className="text-xs">
                        {m.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Students ──────────────────────────────────────────────────── */}
        <TabsContent value="students">
          <Card className="border border-gray-100 dark:border-gray-900 shadow-sm rounded-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                  <Users className="w-5 h-5 text-emerald-600" />
                  My Students
                  <Badge variant="secondary" className="ml-1">
                    {filteredStudents.length}
                  </Badge>
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-gray-200 dark:border-gray-800"
                  onClick={() =>
                    exportCSV(
                      filteredStudents.map((s) => ({
                        Name: s.name ?? "",
                        Username: s.username ?? "",
                        "Student ID": s.studentId ?? "",
                        Phone: s.phoneNumber ?? "",
                        Batch: s.batchName ?? "",
                      })),
                      `my-students-${new Date().toISOString().slice(0, 10)}.csv`,
                    )
                  }
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Export CSV
                </Button>
              </div>
              {/* Search */}
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  placeholder="Search by name, username, ID or phone…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {studentsQuery.isLoading ? (
                <div className="flex justify-center py-10">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">
                  {search ? "No students match your search." : "No active students found in your department."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Student ID</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Enrolled</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((s) => (
                        <TableRow key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20">
                          <TableCell>
                            <div className="font-medium text-sm text-gray-800 dark:text-gray-200">
                              {s.name || s.username}
                            </div>
                            <div className="text-xs text-gray-400">{s.username}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <IdCard className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-xs font-mono">{s.studentId || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-xs">{s.phoneNumber || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {s.batchName || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-400">
                            {s.enrolledAt
                              ? new Date(s.enrolledAt).toLocaleDateString()
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                              onClick={() => handleOpenAllocationModal(s)}
                            >
                              Assign Teacher
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Class Report ───────────────────────────────────────────────── */}
        <TabsContent value="report">
          <Card className="border border-gray-100 dark:border-gray-900 shadow-sm rounded-xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                  <BarChart2 className="w-5 h-5 text-emerald-600" />
                  Student Attendance Report
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-gray-200 dark:border-gray-800"
                  onClick={() =>
                    exportCSV(
                      (reportQuery.data ?? []).map((r) => ({
                        Name: r.name,
                        Username: r.username,
                        Present: r.present,
                        Absent: r.absent,
                        Late: r.late,
                        Total: r.total,
                        "Attendance %": pct(r.present, r.total),
                      })),
                      `attendance-report-${new Date().toISOString().slice(0, 10)}.csv`,
                    )
                  }
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Export CSV
                </Button>
              </div>
              {/* Date range filter */}
              <div className="flex flex-wrap items-end gap-3 mt-2">
                <div className="space-y-1">
                  <Label className="text-xs">From</Label>
                  <Input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="h-8 text-xs w-36"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">To</Label>
                  <Input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="h-8 text-xs w-36"
                  />
                </div>
                <Button
                  size="sm"
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => reportQuery.refetch()}
                  disabled={reportQuery.isFetching}
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${reportQuery.isFetching ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {reportQuery.isLoading || reportQuery.isFetching ? (
                <div className="flex justify-center py-10">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
                </div>
              ) : !reportQuery.data || reportQuery.data.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">
                  No attendance data found for the selected period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</TableHead>
                        <TableHead className="text-center text-xs font-semibold text-emerald-600 uppercase tracking-wider">Present</TableHead>
                        <TableHead className="text-center text-xs font-semibold text-red-500 uppercase tracking-wider">Absent</TableHead>
                        <TableHead className="text-center text-xs font-semibold text-amber-500 uppercase tracking-wider">Late</TableHead>
                        <TableHead className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</TableHead>
                        <TableHead className="text-center text-xs font-semibold text-blue-600 uppercase tracking-wider">Attendance %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportQuery.data.map((r) => (
                        <TableRow key={r.studentId} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20">
                          <TableCell>
                            <div className="font-medium text-sm text-gray-800 dark:text-gray-200">
                              {r.name || r.username}
                            </div>
                            <div className="text-xs text-gray-400">{r.username}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-emerald-100 text-emerald-700 font-mono">
                              {r.present}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-red-100 text-red-700 font-mono">
                              {r.absent}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-amber-100 text-amber-700 font-mono">
                              {r.late}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {r.total}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`text-sm font-bold ${
                                r.total === 0
                                  ? "text-gray-400"
                                  : r.present / r.total >= 0.75
                                  ? "text-emerald-600"
                                  : r.present / r.total >= 0.5
                                  ? "text-amber-600"
                                  : "text-red-600"
                              }`}
                            >
                              {pct(r.present, r.total)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={allocationModalOpen} onOpenChange={setAllocationModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-50">
          <DialogHeader className="p-6 bg-white border-b border-slate-100 pb-4">
            <DialogTitle className="text-xl font-bold text-slate-800">
              Assign Teacher for {selectedStudentForAllocation?.name || selectedStudentForAllocation?.username}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            <ClassAllocationForm
              value={allocationForm}
              onChange={setAllocationForm}
              readOnlySessions={true}
              departmentId={deptQuery.data?.id}
              studentId={selectedStudentForAllocation?.id}
            />
          </div>
          <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setAllocationModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={updateAllocationMutation.isPending}
              onClick={() => {
                if (!selectedStudentForAllocation) return;
                updateAllocationMutation.mutate({
                  studentId: selectedStudentForAllocation.id,
                  allocation: allocationForm,
                });
              }}
            >
              {updateAllocationMutation.isPending ? "Saving..." : "Save Assignments"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
