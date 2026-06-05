import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Clock, Users, UserMinus, Edit } from "lucide-react";

export default function BatchesPage() {
  const { user } = useAuth();
  const [openModule, setOpenModule] = useState(false);
  const [openBatch, setOpenBatch] = useState(false);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);

  // Edit states
  const [editModuleOpen, setEditModuleOpen] = useState(false);
  const [editModuleData, setEditModuleData] = useState<any>(null);
  const [editBatchOpen, setEditBatchOpen] = useState(false);
  const [editBatchData, setEditBatchData] = useState<any>(null);

  const isAdmin = ["super_admin", "admin", "academic_head"].includes(
    user?.role || ""
  );
  const isSuperAdmin = user?.role === "super_admin";

  const modulesQuery = trpc.learning.listModules.useQuery();
  const batchesQuery = trpc.learning.listBatches.useQuery(
    selectedModule ? { moduleId: selectedModule } : undefined
  );
  const myBatches = trpc.user.myBatches.useQuery(undefined, {
    enabled: !isAdmin,
  });
  const teachersQuery = trpc.user.list.useQuery(
    { role: "teacher", limit: 100, offset: 0 },
    { enabled: isAdmin }
  );
  const studentsQuery = trpc.user.list.useQuery(
    { role: "student", limit: 200, offset: 0 },
    { enabled: isAdmin }
  );

  // Flexibility request states
  const [requestBatchChangeOpen, setRequestBatchChangeOpen] = useState(false);
  const [requestHoldOpen, setRequestHoldOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [targetBatchId, setTargetBatchId] = useState<number | null>(null);
  const [requestReason, setRequestReason] = useState("");
  const [adminNoteInput, setAdminNoteInput] = useState<{
    [key: number]: string;
  }>({});

  const availableBatchesQuery = trpc.learning.listBatches.useQuery(
    selectedEnrollment?.batch?.moduleId
      ? { moduleId: selectedEnrollment.batch.moduleId }
      : undefined,
    { enabled: !!selectedEnrollment }
  );
  const otherBatches = availableBatchesQuery.data?.filter(
    b => b.id !== selectedEnrollment?.batchId
  );

  const myRequestsQuery = trpc.student.myRequests.useQuery(undefined, {
    enabled: user?.role === "student",
  });
  const listRequestsQuery = trpc.admin.listRequests.useQuery(undefined, {
    enabled: isAdmin,
  });

  const submitRequest = trpc.student.createRequest.useMutation({
    onSuccess: () => {
      toast.success("Request submitted successfully");
      setRequestBatchChangeOpen(false);
      setRequestHoldOpen(false);
      setRequestReason("");
      setTargetBatchId(null);
      setSelectedEnrollment(null);
      myRequestsQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const resolveRequest = trpc.admin.resolveRequest.useMutation({
    onSuccess: () => {
      toast.success("Request resolved");
      listRequestsQuery.refetch();
      batchesQuery.refetch();
      myBatches.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const handleResolve = (
    requestId: number,
    status: "approved" | "rejected"
  ) => {
    resolveRequest.mutate({
      requestId,
      status,
      note: adminNoteInput[requestId] || "",
    });
  };

  const createModule = trpc.learning.createModule.useMutation({
    onSuccess: () => {
      toast.success("Module created");
      setOpenModule(false);
      modulesQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const createBatch = trpc.learning.createBatch.useMutation({
    onSuccess: () => {
      toast.success("Batch created");
      setOpenBatch(false);
      batchesQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const updateModule = trpc.learning.updateModule.useMutation({
    onSuccess: () => {
      toast.success("Module updated");
      setEditModuleOpen(false);
      modulesQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const updateBatch = trpc.learning.updateBatch.useMutation({
    onSuccess: () => {
      toast.success("Batch updated");
      setEditBatchOpen(false);
      batchesQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const enrollStudent = trpc.learning.enrollStudent.useMutation({
    onSuccess: () => {
      toast.success("Student enrolled");
      batchesQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const removeStudent = trpc.learning.removeStudent.useMutation({
    onSuccess: () => {
      toast.success("Student removed");
      batchesQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const [moduleForm, setModuleForm] = useState({
    name: "",
    description: "",
    fees: 0,
    maxStudents: 50,
    minStudents: 5,
  });
  const [batchForm, setBatchForm] = useState({
    moduleId: 0,
    name: "",
    timeSlot: "",
    maxStudents: 30,
    teacherId: 0,
  });
  const [enrollBatchId, setEnrollBatchId] = useState<number | null>(null);
  const [enrollStudentId, setEnrollStudentId] = useState("");

  return (
    <div className="space-y-6">
      <Tabs defaultValue={isAdmin ? "modules" : "my"}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="batches">Batches</TabsTrigger>
            {(user?.role === "student" || user?.role === "teacher") && (
              <TabsTrigger value="my">My Batches</TabsTrigger>
            )}
            {isAdmin && <TabsTrigger value="requests">Requests</TabsTrigger>}
          </TabsList>
          {isAdmin && (
            <div className="flex gap-2">
              <Dialog open={openModule} onOpenChange={setOpenModule}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" /> Module
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Module</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      createModule.mutate(moduleForm);
                    }}
                    className="space-y-3 mt-2"
                  >
                    <Input
                      placeholder="Module Name"
                      value={moduleForm.name}
                      onChange={e =>
                        setModuleForm({ ...moduleForm, name: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Description"
                      value={moduleForm.description}
                      onChange={e =>
                        setModuleForm({
                          ...moduleForm,
                          description: e.target.value,
                        })
                      }
                    />
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 font-medium">
                        Course Fee (₹) {!isSuperAdmin && "(Super Admin only)"}
                      </label>
                      <Input
                        type="number"
                        placeholder="Course Fee"
                        value={moduleForm.fees || ""}
                        onChange={e =>
                          setModuleForm({
                            ...moduleForm,
                            fees: Number(e.target.value),
                          })
                        }
                        disabled={!isSuperAdmin}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600">
                      Create
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Dialog open={openBatch} onOpenChange={setOpenBatch}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" /> Batch
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Batch</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      createBatch.mutate({
                        ...batchForm,
                        teacherId: batchForm.teacherId || undefined,
                      });
                    }}
                    className="space-y-3 mt-2"
                  >
                    <select
                      className="w-full border rounded-md px-3 py-2"
                      value={batchForm.moduleId}
                      onChange={e =>
                        setBatchForm({
                          ...batchForm,
                          moduleId: Number(e.target.value),
                        })
                      }
                    >
                      <option value={0}>Select Module</option>
                      {modulesQuery.data?.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <Input
                      placeholder="Batch Name"
                      value={batchForm.name}
                      onChange={e =>
                        setBatchForm({ ...batchForm, name: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Time Slot (e.g. 7 AM)"
                      value={batchForm.timeSlot}
                      onChange={e =>
                        setBatchForm({ ...batchForm, timeSlot: e.target.value })
                      }
                    />
                    <select
                      className="w-full border rounded-md px-3 py-2"
                      value={batchForm.teacherId}
                      onChange={e =>
                        setBatchForm({
                          ...batchForm,
                          teacherId: Number(e.target.value),
                        })
                      }
                    >
                      <option value={0}>Select Teacher (optional)</option>
                      {teachersQuery.data?.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" className="w-full bg-emerald-600">
                      Create
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        <TabsContent value="modules">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modulesQuery.data?.map(mod => (
              <Card
                key={mod.id}
                className="cursor-pointer hover:border-emerald-300"
                onClick={() => setSelectedModule(mod.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg">{mod.name}</CardTitle>
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={e => {
                        e.stopPropagation();
                        setEditModuleData({
                          id: mod.id,
                          name: mod.name,
                          description: mod.description || "",
                          fees: Number(mod.fees || 0),
                          maxStudents: mod.maxStudents || 50,
                          minStudents: mod.minStudents || 5,
                          status: mod.status || "active",
                        });
                        setEditModuleOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-3">
                    {mod.description || "No description"}
                  </p>
                  <div className="flex flex-col gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" /> Max {mod.maxStudents}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" /> Min {mod.minStudents}
                      </span>
                    </div>
                    <div className="font-semibold text-emerald-600">
                      Course Fee: ₹{mod.fees || "0.00"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="batches">
          <div className="space-y-4">
            {selectedModule && (
              <p className="text-sm text-gray-500">
                Showing batches for:{" "}
                {modulesQuery.data?.find(m => m.id === selectedModule)?.name}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {batchesQuery.data?.map(batch => (
                <Card key={batch.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-1.5">
                        {batch.name}
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              setEditBatchData({
                                id: batch.id,
                                name: batch.name,
                                timeSlot: batch.timeSlot || "",
                                teacherId: batch.teacherId || 0,
                                maxStudents: batch.maxStudents || 30,
                                status: batch.status || "active",
                              });
                              setEditBatchOpen(true);
                            }}
                          >
                            <Edit className="w-3.5 h-3.5 text-gray-500 hover:text-gray-700" />
                          </Button>
                        )}
                      </CardTitle>
                      <Badge
                        variant={
                          batch.status === "active" ? "default" : "secondary"
                        }
                      >
                        {batch.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />{" "}
                        {batch.timeSlot || "Not set"}
                      </p>
                      <p className="text-gray-600">
                        Teacher: {batch.teacher?.name || "Not assigned"}
                      </p>
                      <p className="text-gray-600">
                        Module: {batch.module?.name || "-"}
                      </p>
                      <p className="text-gray-600">
                        Max Students: {batch.maxStudents}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-700">
                          Enrolled Students (
                          {(batch as any).enrollments?.length || 0}/
                          {batch.maxStudents})
                        </span>
                        {isAdmin && (
                          <Dialog
                            open={enrollBatchId === batch.id}
                            onOpenChange={open => {
                              setEnrollBatchId(open ? batch.id : null);
                              setEnrollStudentId("");
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" /> Add
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Enroll Student in {batch.name}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3 mt-2">
                                <select
                                  className="w-full border rounded-md px-3 py-2 text-sm"
                                  value={enrollStudentId}
                                  onChange={e =>
                                    setEnrollStudentId(e.target.value)
                                  }
                                >
                                  <option value="">Select Student</option>
                                  {studentsQuery.data?.map(s => (
                                    <option key={s.id} value={s.id}>
                                      {s.name} - {s.profile?.studentId || s.id}{" "}
                                      (
                                      {s.profile?.enrollmentNumber ||
                                        "No Enrollment"}
                                      )
                                    </option>
                                  ))}
                                </select>
                                <Button
                                  className="w-full bg-emerald-600"
                                  onClick={() => {
                                    enrollStudent.mutate({
                                      batchId: batch.id,
                                      studentId: Number(enrollStudentId),
                                    });
                                    setEnrollBatchId(null);
                                  }}
                                  disabled={!enrollStudentId}
                                >
                                  Enroll
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>

                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {!(batch as any).enrollments ||
                        (batch as any).enrollments.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">
                            No students enrolled
                          </p>
                        ) : (
                          (batch as any).enrollments.map((enrollment: any) => (
                            <div
                              key={enrollment.id}
                              className="flex items-center justify-between text-xs bg-gray-50 hover:bg-gray-100 p-1.5 rounded border border-gray-100"
                            >
                              <div className="truncate mr-2 text-gray-600">
                                <span className="font-medium text-gray-800">
                                  {enrollment.student?.name}
                                </span>
                                <span className="text-gray-400 ml-1">
                                  (
                                  {enrollment.student?.profile?.studentId ||
                                    `ID: ${enrollment.studentId}`}
                                  )
                                </span>
                              </div>
                              {isAdmin && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-5 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Are you sure you want to remove ${enrollment.student?.name} from this batch?`
                                      )
                                    ) {
                                      removeStudent.mutate({
                                        batchId: batch.id,
                                        studentId: enrollment.studentId,
                                      });
                                    }
                                  }}
                                >
                                  <UserMinus className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {(user?.role === "student" || user?.role === "teacher") && (
          <TabsContent value="my">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {user.role === "teacher"
                ? (myBatches.data as any)?.map((batch: any) => (
                    <Card key={batch.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{batch.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-600">
                            Module: {batch.module?.name}
                          </p>
                          <p className="text-gray-600">
                            Time: {batch.timeSlot || "Not set"}
                          </p>
                          <Badge
                            variant={
                              batch.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {batch.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                : (myBatches.data as any)?.map((enrollment: any) => (
                    <Card key={enrollment.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {enrollment.batch?.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-600">
                            Module: {enrollment.batch?.module?.name}
                          </p>
                          <p className="text-gray-600">
                            Time: {enrollment.batch?.timeSlot}
                          </p>
                          <p className="text-gray-600">
                            Teacher: {enrollment.batch?.teacher?.name}
                          </p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t">
                            <Badge>{enrollment.status}</Badge>
                            {enrollment.status === "active" && (
                              <div className="flex gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 px-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => {
                                    setSelectedEnrollment(enrollment);
                                    setRequestBatchChangeOpen(true);
                                  }}
                                >
                                  Change Batch
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 px-2 text-red-600 hover:bg-red-50 border-red-200"
                                  onClick={() => {
                                    setSelectedEnrollment(enrollment);
                                    setRequestHoldOpen(true);
                                  }}
                                >
                                  Hold
                                </Button>
                              </div>
                            )}
                            {enrollment.status === "on_hold" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 px-2 text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                onClick={() => {
                                  submitRequest.mutate({
                                    requestType: "rejoin",
                                    fromBatchId: enrollment.batchId,
                                    reason: "Rejoining from hold",
                                  });
                                }}
                              >
                                Rejoin
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
            </div>

            {/* Student request history */}
            {user?.role === "student" &&
              myRequestsQuery.data &&
              myRequestsQuery.data.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h4 className="font-semibold text-gray-700">
                    Request History
                  </h4>
                  <div className="border rounded-lg bg-white overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">
                            From Batch
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">
                            To Batch
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">
                            Reason
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">
                            Admin Response
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {myRequestsQuery.data.map(req => (
                          <tr key={req.id}>
                            <td className="px-4 py-3 font-medium capitalize">
                              {req.requestType.replace("_", " ")}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {req.fromBatch?.name || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {req.toBatch?.name || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-500 truncate max-w-xs">
                              {req.reason || "-"}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  req.status === "approved"
                                    ? "default"
                                    : req.status === "rejected"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {req.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              {req.adminNote || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="requests">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Flexibility & Batch Change Requests
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {listRequestsQuery.data?.map(req => (
                  <Card
                    key={req.id}
                    className="border-l-4 border-l-emerald-500"
                  >
                    <CardHeader className="py-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-md font-bold text-gray-800">
                          {req.student?.name}
                        </CardTitle>
                        <Badge
                          variant={
                            req.status === "approved"
                              ? "default"
                              : req.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {req.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pb-4">
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p className="font-semibold text-gray-700">
                            Request Type:
                          </p>
                          <p className="capitalize">
                            {req.requestType.replace("_", " ")}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700">
                            Requested On:
                          </p>
                          <p>
                            {new Date(req.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {req.fromBatch && (
                          <div>
                            <p className="font-semibold text-gray-700">
                              From Batch:
                            </p>
                            <p>{req.fromBatch.name}</p>
                          </div>
                        )}
                        {req.toBatch && (
                          <div>
                            <p className="font-semibold text-gray-700">
                              To Batch:
                            </p>
                            <p>{req.toBatch.name}</p>
                          </div>
                        )}
                      </div>
                      {req.reason && (
                        <div className="bg-gray-50 p-2.5 rounded text-sm text-gray-600 border border-gray-100">
                          <p className="font-semibold text-gray-700 text-xs mb-1">
                            Reason:
                          </p>
                          <p className="italic">"{req.reason}"</p>
                        </div>
                      )}
                      {req.status === "pending" ? (
                        <div className="pt-2 border-t space-y-2">
                          <Input
                            placeholder="Add admin note or reason for decision (optional)"
                            value={adminNoteInput[req.id] || ""}
                            onChange={e =>
                              setAdminNoteInput({
                                ...adminNoteInput,
                                [req.id]: e.target.value,
                              })
                            }
                          />
                          <div className="flex justify-end gap-2 pt-1">
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => handleResolve(req.id, "approved")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleResolve(req.id, "rejected")}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ) : (
                        req.adminNote && (
                          <div className="pt-2 border-t text-sm text-gray-500">
                            <span className="font-semibold">
                              Admin Response:
                            </span>{" "}
                            {req.adminNote}
                          </div>
                        )
                      )}
                    </CardContent>
                  </Card>
                ))}
                {listRequestsQuery.data?.length === 0 && (
                  <p className="text-gray-400 text-center py-8">
                    No requests found
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Student Batch Change Request Dialog */}
      <Dialog
        open={requestBatchChangeOpen}
        onOpenChange={setRequestBatchChangeOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Batch Change</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">
                Current Batch
              </p>
              <p className="text-sm font-semibold">
                {selectedEnrollment?.batch?.name} (
                {selectedEnrollment?.batch?.timeSlot})
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Select New Batch</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={targetBatchId || ""}
                onChange={e => setTargetBatchId(Number(e.target.value))}
              >
                <option value="">Select a batch</option>
                {otherBatches?.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.timeSlot || "No time slot"}) -{" "}
                    {b.teacher?.name || "No teacher"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Reason for Change</label>
              <Input
                placeholder="Why do you want to change batches?"
                value={requestReason}
                onChange={e => setRequestReason(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                if (!targetBatchId) {
                  toast.error("Please select a target batch");
                  return;
                }
                submitRequest.mutate({
                  requestType: "batch_change",
                  fromBatchId: selectedEnrollment.batchId,
                  toBatchId: targetBatchId,
                  reason: requestReason,
                });
              }}
            >
              Submit Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Hold Request Dialog */}
      <Dialog open={requestHoldOpen} onOpenChange={setRequestHoldOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Batch Hold (Leave)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">
                Current Batch
              </p>
              <p className="text-sm font-semibold">
                {selectedEnrollment?.batch?.name}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Reason for Hold</label>
              <Input
                placeholder="E.g., Medical leave, traveling, exam prep..."
                value={requestReason}
                onChange={e => setRequestReason(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                submitRequest.mutate({
                  requestType: "hold",
                  fromBatchId: selectedEnrollment.batchId,
                  reason: requestReason,
                });
              }}
            >
              Submit Hold Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Module Dialog */}
      <Dialog open={editModuleOpen} onOpenChange={setEditModuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
          </DialogHeader>
          {editModuleData && (
            <form
              onSubmit={e => {
                e.preventDefault();
                updateModule.mutate(editModuleData);
              }}
              className="space-y-3 mt-2"
            >
              <Input
                placeholder="Module Name"
                value={editModuleData.name}
                onChange={e =>
                  setEditModuleData({ ...editModuleData, name: e.target.value })
                }
              />
              <Input
                placeholder="Description"
                value={editModuleData.description}
                onChange={e =>
                  setEditModuleData({
                    ...editModuleData,
                    description: e.target.value,
                  })
                }
              />
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-medium">
                  Course Fee (₹) {!isSuperAdmin && "(Super Admin only)"}
                </label>
                <Input
                  type="number"
                  placeholder="Course Fee"
                  value={editModuleData.fees || ""}
                  onChange={e =>
                    setEditModuleData({
                      ...editModuleData,
                      fees: Number(e.target.value),
                    })
                  }
                  disabled={!isSuperAdmin}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-medium">
                    Max Students
                  </label>
                  <Input
                    type="number"
                    placeholder="Max Students"
                    value={editModuleData.maxStudents}
                    onChange={e =>
                      setEditModuleData({
                        ...editModuleData,
                        maxStudents: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-medium">
                    Min Students
                  </label>
                  <Input
                    type="number"
                    placeholder="Min Students"
                    value={editModuleData.minStudents}
                    onChange={e =>
                      setEditModuleData({
                        ...editModuleData,
                        minStudents: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-medium">
                  Status
                </label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={editModuleData.status}
                  onChange={e =>
                    setEditModuleData({
                      ...editModuleData,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <Button type="submit" className="w-full bg-emerald-600">
                Save Changes
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Batch Dialog */}
      <Dialog open={editBatchOpen} onOpenChange={setEditBatchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
          </DialogHeader>
          {editBatchData && (
            <form
              onSubmit={e => {
                e.preventDefault();
                updateBatch.mutate(editBatchData);
              }}
              className="space-y-3 mt-2"
            >
              <Input
                placeholder="Batch Name"
                value={editBatchData.name}
                onChange={e =>
                  setEditBatchData({ ...editBatchData, name: e.target.value })
                }
              />
              <Input
                placeholder="Time Slot"
                value={editBatchData.timeSlot}
                onChange={e =>
                  setEditBatchData({
                    ...editBatchData,
                    timeSlot: e.target.value,
                  })
                }
              />
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={editBatchData.teacherId}
                onChange={e =>
                  setEditBatchData({
                    ...editBatchData,
                    teacherId: Number(e.target.value),
                  })
                }
              >
                <option value={0}>Select Teacher (optional)</option>
                {teachersQuery.data?.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-medium">
                    Max Students
                  </label>
                  <Input
                    type="number"
                    placeholder="Max Students"
                    value={editBatchData.maxStudents}
                    onChange={e =>
                      setEditBatchData({
                        ...editBatchData,
                        maxStudents: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-medium">
                    Status
                  </label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={editBatchData.status}
                    onChange={e =>
                      setEditBatchData({
                        ...editBatchData,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <Button type="submit" className="w-full bg-emerald-600">
                Save Changes
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
