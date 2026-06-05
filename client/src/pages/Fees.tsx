import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Wallet,
} from "lucide-react";

export default function FeesPage() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const isAdmin = ["super_admin", "admin", "academic_head"].includes(
    user?.role || ""
  );

  const paymentsQuery = trpc.admin.listPayments.useQuery(
    statusFilter !== "all" ? { status: statusFilter } : undefined,
    { enabled: isAdmin }
  );
  const myPayments = trpc.admin.listPayments.useQuery(
    { studentId: user?.id },
    { enabled: !isAdmin && !!user?.id }
  );
  const myProfile = trpc.user.myProfile.useQuery(undefined, {
    enabled: !isAdmin,
  });
  const studentsQuery = trpc.user.list.useQuery(
    { role: "student", limit: 200, offset: 0 },
    { enabled: isAdmin }
  );
  const modulesQuery = trpc.learning.listModules.useQuery(undefined, {
    enabled: isAdmin,
  });
  const createPayment = trpc.admin.createPayment.useMutation({
    onSuccess: () => {
      toast.success("Payment record created");
      setOpen(false);
      paymentsQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });
  const recordPayment = trpc.admin.recordPayment.useMutation({
    onSuccess: () => {
      toast.success("Payment recorded");
      paymentsQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const [form, setForm] = useState({
    studentId: 0,
    courseId: 0,
    amount: 0,
    type: "tuition",
    dueDate: "",
  });

  const data = isAdmin ? paymentsQuery.data : myPayments.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-emerald-100 text-emerald-700">
            <CheckCircle className="w-3 h-3 mr-1" /> Paid
          </Badge>
        );
      case "unpaid":
        return (
          <Badge variant="secondary">
            <AlertCircle className="w-3 h-3 mr-1" /> Unpaid
          </Badge>
        );
      case "partial":
        return <Badge className="bg-yellow-100 text-yellow-700">Partial</Badge>;
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Student balance card */}
      {!isAdmin && myProfile.data?.profile && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" /> My Fees Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Total Fees</p>
                <p className="text-xl font-bold text-gray-800">
                  ₹{myProfile.data.profile.feesTotal || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Paid</p>
                <p className="text-xl font-bold text-emerald-600">
                  ₹{myProfile.data.profile.feesPaid || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Balance</p>
                <p className="text-xl font-bold text-red-600">
                  ₹{myProfile.data.profile.feesBalance || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Fees & Payments</h3>
          {isAdmin && (
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
            </select>
          )}
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" /> Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Payment Record</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  createPayment.mutate({
                    ...form,
                    courseId: form.courseId || undefined,
                    dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
                  });
                }}
                className="space-y-3 mt-2"
              >
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-medium">
                    Select Student
                  </label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={form.studentId}
                    onChange={e => {
                      const id = Number(e.target.value);
                      const studentObj = studentsQuery.data?.find(
                        s => s.id === id
                      );
                      const studentCourseName = studentObj?.profile?.course;
                      const matchedModule = modulesQuery.data?.find(
                        m => m.name === studentCourseName
                      );
                      setForm({
                        ...form,
                        studentId: id,
                        courseId: matchedModule ? matchedModule.id : 0,
                      });
                    }}
                  >
                    <option value={0}>Select Student</option>
                    {studentsQuery.data?.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} - {s.profile?.studentId || s.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-medium">
                    Select Course
                  </label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={form.courseId}
                    onChange={e =>
                      setForm({ ...form, courseId: Number(e.target.value) })
                    }
                  >
                    <option value={0}>Select Course</option>
                    {modulesQuery.data?.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-medium">
                    Amount (₹)
                  </label>
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={form.amount}
                    onChange={e =>
                      setForm({ ...form, amount: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-medium">
                    Payment Type
                  </label>
                  <Input
                    placeholder="Type (tuition/exam/other)"
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-medium">
                    Due Date
                  </label>
                  <Input
                    type="date"
                    placeholder="Due Date"
                    value={form.dueDate}
                    onChange={e =>
                      setForm({ ...form, dueDate: e.target.value })
                    }
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-emerald-600"
                  disabled={!form.studentId || !form.amount}
                >
                  Create
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Paid At</TableHead>
                {isAdmin && <TableHead>Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{p.student?.name || "-"}</TableCell>
                  <TableCell>{(p as any).course?.name || "-"}</TableCell>
                  <TableCell>₹{p.amount}</TableCell>
                  <TableCell className="capitalize">{p.type}</TableCell>
                  <TableCell>{getStatusBadge(p.status)}</TableCell>
                  <TableCell>
                    {p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "-"}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      {p.status !== "paid" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            recordPayment.mutate({
                              paymentId: p.id,
                              amount: Number(p.amount),
                            })
                          }
                        >
                          <CreditCard className="w-3 h-3 mr-1" /> Record
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
