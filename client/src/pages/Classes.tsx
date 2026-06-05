import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Plus,
  Play,
  Square,
  Video,
  Calendar,
  Clock,
  XCircle,
  ClipboardList,
} from "lucide-react";
import JitsiMeet from "@/components/JitsiMeet";

// Generate a unique Jitsi room name for a class
function generateRoomName(classId: number, title: string): string {
  const slug = title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  return `emtees-${slug}-${classId}`;
}

export default function ClassesPage() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [attendanceClassId, setAttendanceClassId] = useState<number | null>(
    null
  );
  const [attendanceStudentId, setAttendanceStudentId] = useState("");
  const [attendanceChatCount, setAttendanceChatCount] = useState(0);
  const [otoOpen, setOtoOpen] = useState(false);
  const [otoForm, setOtoForm] = useState({
    teacherId: 0,
    studentId: 0,
    sessionLength: 30,
    scheduledAt: "",
  });

  // Jitsi state
  const [jitsiRoom, setJitsiRoom] = useState<string | null>(null);

  const isAdmin = ["super_admin", "admin", "academic_head"].includes(
    user?.role || ""
  );
  const isTeacher = user?.role === "teacher";

  const classesQuery = trpc.class.list.useQuery(undefined, {
    enabled: isAdmin || isTeacher,
  });
  const myClasses = trpc.class.list.useQuery(undefined, {
    enabled: user?.role === "student",
  });
  const oneToOneQuery = trpc.class.listOneToOne.useQuery(undefined, {
    enabled: isAdmin || isTeacher,
  });
  const batchesQuery = trpc.learning.listBatches.useQuery(undefined, {
    enabled: isAdmin || isTeacher,
  });
  const modulesQuery = trpc.learning.listModules.useQuery(undefined, {
    enabled: isAdmin || isTeacher,
  });
  const teachersQuery = trpc.user.list.useQuery(
    { role: "teacher", limit: 200 },
    { enabled: isAdmin }
  );
  const studentsQuery = trpc.user.list.useQuery(
    { role: "student", limit: 200 },
    { enabled: isAdmin }
  );

  const createClass = trpc.class.create.useMutation({
    onSuccess: () => {
      toast.success("Class scheduled");
      setOpen(false);
      classesQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const startClass = trpc.class.start.useMutation({
    onSuccess: () => {
      toast.success("Class started");
      classesQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const endClass = trpc.class.end.useMutation({
    onSuccess: () => {
      toast.success("Class ended");
      setJitsiRoom(null);
      classesQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const cancelClass = trpc.class.cancel.useMutation({
    onSuccess: () => {
      toast.success("Class cancelled");
      classesQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const recordAttendance = trpc.class.recordAttendance.useMutation({
    onSuccess: () => {
      toast.success("Attendance recorded");
    },
    onError: err => toast.error(err.message),
  });

  const createOneToOne = trpc.class.createOneToOne.useMutation({
    onSuccess: () => {
      toast.success("Session created");
      setOtoOpen(false);
      oneToOneQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const [form, setForm] = useState<{
    batchIds: number[];
    moduleId?: number;
    title: string;
    description: string;
    scheduledAt: string;
  }>({
    batchIds: [],
    moduleId: undefined,
    title: "",
    description: "",
    scheduledAt: "",
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.batchIds.length === 0) {
      toast.error("Please select at least one batch");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Please enter a class title");
      return;
    }
    if (!form.scheduledAt) {
      toast.error("Please select a date and time");
      return;
    }
    createClass.mutate({
      ...form,
      batchId: form.batchIds[0],
      scheduledAt: new Date(form.scheduledAt),
    });
  };

  const getBatchDisplayNames = (cls: any) => {
    const ids = cls.batchIds || (cls.batchId ? [cls.batchId] : []);
    if (ids.length === 0) return cls.batch?.name || "No batches";
    const names = ids
      .map((id: number) => {
        const match = batchesQuery.data?.find(b => b.id === id);
        return match ? match.name : null;
      })
      .filter(Boolean);
    return names.length > 0
      ? names.join(", ")
      : cls.batch?.name || "No batches";
  };

  const handleStartClass = (cls: any) => {
    const room = generateRoomName(cls.id, cls.title);
    startClass.mutate({ id: cls.id });
    setJitsiRoom(room);
  };

  const joinClassMutation = trpc.class.joinClass.useMutation({
    onError: err => console.error(err.message),
  });

  const handleJoinClass = (cls: any) => {
    const room = generateRoomName(cls.id, cls.title);
    joinClassMutation.mutate({ classId: cls.id });
    setJitsiRoom(room);
  };

  const handleJoinOneToOne = (session: any) => {
    const room = `emtees-1on1-${session.id}`;
    setJitsiRoom(room);
  };

  const data = isAdmin || isTeacher ? classesQuery.data : myClasses.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="secondary">Scheduled</Badge>;
      case "ongoing":
        return <Badge className="bg-green-500 text-white">🔴 Live</Badge>;
      case "completed":
        return <Badge variant="outline">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <>
      {/* Jitsi fullscreen overlay */}
      {jitsiRoom && user && (
        <JitsiMeet
          roomName={jitsiRoom}
          displayName={user.name}
          onClose={() => setJitsiRoom(null)}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Classes & Sessions</h3>
          {(isAdmin || isTeacher) && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" /> Schedule Class
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule New Class</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-3 mt-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Batches <span className="text-red-500">*</span>
                    </label>
                    <div className="border rounded-md p-2 max-h-36 overflow-y-auto space-y-1.5 bg-gray-50">
                      {batchesQuery.data?.map(b => {
                        const isChecked = form.batchIds.includes(b.id);
                        return (
                          <label
                            key={b.id}
                            className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                const newIds = isChecked
                                  ? form.batchIds.filter(id => id !== b.id)
                                  : [...form.batchIds, b.id];
                                setForm({ ...form, batchIds: newIds });
                              }}
                              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            <span className="font-medium text-gray-700">
                              {b.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              ({b.module?.name})
                            </span>
                          </label>
                        );
                      })}
                      {batchesQuery.data?.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-4">
                          No batches available
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Module{" "}
                      <span className="text-gray-400 text-xs">(optional)</span>
                    </label>
                    <select
                      value={form.moduleId || 0}
                      onChange={e =>
                        setForm({
                          ...form,
                          moduleId: Number(e.target.value) || undefined,
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value={0}>Select a Module (None)</option>
                      {modulesQuery.data?.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Class title"
                      value={form.title}
                      onChange={e =>
                        setForm({ ...form, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Description{" "}
                      <span className="text-gray-400 text-xs">(optional)</span>
                    </label>
                    <Input
                      placeholder="Description"
                      value={form.description}
                      onChange={e =>
                        setForm({ ...form, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Scheduled At <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="datetime-local"
                      value={form.scheduledAt}
                      onChange={e =>
                        setForm({ ...form, scheduledAt: e.target.value })
                      }
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    💡 Video call is built-in — no meeting URL needed.
                  </p>
                  <Button type="submit" className="w-full bg-emerald-600">
                    Schedule
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs defaultValue="classes">
          <TabsList>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            {(isAdmin || isTeacher) && (
              <TabsTrigger value="one-to-one">1-on-1 Sessions</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="classes">
            <div className="grid grid-cols-1 gap-4 mt-4">
              {data?.map(cls => (
                <Card key={cls.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{cls.title}</h4>
                          {getStatusBadge(cls.status)}
                        </div>
                        <p className="text-sm text-gray-500">
                          {cls.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-emerald-600" />{" "}
                            {cls.scheduledAt
                              ? new Date(cls.scheduledAt).toLocaleString()
                              : "-"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-emerald-600" />{" "}
                            {cls.duration || 0} min
                          </span>
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs font-medium">
                            Batches: {getBatchDisplayNames(cls)}
                          </span>
                          {(cls.module?.name ||
                            (cls.batch as any)?.module?.name) && (
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                              Module:{" "}
                              {cls.module?.name ||
                                (cls.batch as any)?.module?.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {/* Join button for ongoing classes */}
                        {cls.status === "ongoing" && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleJoinClass(cls)}
                          >
                            <Video className="w-4 h-4 mr-1" /> Join Class
                          </Button>
                        )}

                        {/* Teacher controls */}
                        {isTeacher &&
                          cls.teacherId === user?.id &&
                          cls.status === "scheduled" && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleStartClass(cls)}
                            >
                              <Play className="w-4 h-4 mr-1" /> Start & Join
                            </Button>
                          )}
                        {isTeacher &&
                          cls.teacherId === user?.id &&
                          cls.status === "ongoing" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => endClass.mutate({ id: cls.id })}
                            >
                              <Square className="w-4 h-4 mr-1" /> End Class
                            </Button>
                          )}

                        {/* Cancel */}
                        {(isAdmin ||
                          (isTeacher && cls.teacherId === user?.id)) &&
                          cls.status === "scheduled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => cancelClass.mutate({ id: cls.id })}
                            >
                              <XCircle className="w-4 h-4 mr-1" /> Cancel
                            </Button>
                          )}

                        {/* Attendance */}
                        {(isTeacher || isAdmin) &&
                          (cls.status === "ongoing" ||
                            cls.status === "completed") && (
                            <Dialog
                              open={attendanceClassId === cls.id}
                              onOpenChange={open =>
                                setAttendanceClassId(open ? cls.id : null)
                              }
                            >
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <ClipboardList className="w-4 h-4 mr-1" />{" "}
                                  Attendance
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    Record Attendance — {cls.title}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3 mt-2">
                                  <Input
                                    type="number"
                                    placeholder="Student ID"
                                    value={attendanceStudentId}
                                    onChange={e =>
                                      setAttendanceStudentId(e.target.value)
                                    }
                                  />
                                  <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600">
                                      Chat Count:
                                    </label>
                                    <Input
                                      type="number"
                                      className="w-24"
                                      value={attendanceChatCount}
                                      onChange={e =>
                                        setAttendanceChatCount(
                                          Number(e.target.value)
                                        )
                                      }
                                      min={0}
                                    />
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    Students with ≥4 chat messages are marked
                                    present.
                                  </p>
                                  <Button
                                    className="w-full bg-emerald-600"
                                    onClick={() => {
                                      if (!attendanceStudentId) return;
                                      recordAttendance.mutate({
                                        classId: cls.id,
                                        studentId: Number(attendanceStudentId),
                                        chatCount: attendanceChatCount,
                                      });
                                    }}
                                    disabled={!attendanceStudentId}
                                  >
                                    Record
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {data?.length === 0 && (
                <p className="text-center text-gray-400 py-10">
                  No classes found.
                </p>
              )}
            </div>
          </TabsContent>

          {(isAdmin || isTeacher) && (
            <TabsContent value="one-to-one">
              <div className="space-y-4 mt-4">
                {isAdmin && (
                  <div className="flex justify-end">
                    <Dialog open={otoOpen} onOpenChange={setOtoOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                          <Plus className="w-4 h-4 mr-2" /> New Session
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create 1-on-1 Session</DialogTitle>
                        </DialogHeader>
                        <form
                          onSubmit={e => {
                            e.preventDefault();
                            createOneToOne.mutate({
                              ...otoForm,
                              scheduledAt: new Date(otoForm.scheduledAt),
                            });
                          }}
                          className="space-y-3 mt-2"
                        >
                          <div className="space-y-1">
                            <label className="text-sm font-medium">
                              Teacher <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={otoForm.teacherId}
                              onChange={e =>
                                setOtoForm({
                                  ...otoForm,
                                  teacherId: Number(e.target.value),
                                })
                              }
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value={0}>Select Teacher</option>
                              {teachersQuery.data?.map(t => (
                                <option key={t.id} value={t.id}>
                                  {t.name} ({t.username})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium">
                              Student <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={otoForm.studentId}
                              onChange={e =>
                                setOtoForm({
                                  ...otoForm,
                                  studentId: Number(e.target.value),
                                })
                              }
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value={0}>Select Student</option>
                              {studentsQuery.data?.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.username})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium">
                              Session Length (min){" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="number"
                              placeholder="Session Length (min)"
                              value={otoForm.sessionLength}
                              onChange={e =>
                                setOtoForm({
                                  ...otoForm,
                                  sessionLength: Number(e.target.value),
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium">
                              Scheduled At{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="datetime-local"
                              value={otoForm.scheduledAt}
                              onChange={e =>
                                setOtoForm({
                                  ...otoForm,
                                  scheduledAt: e.target.value,
                                })
                              }
                            />
                          </div>
                          <Button
                            type="submit"
                            className="w-full bg-emerald-600"
                          >
                            Create
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
                <Card>
                  <CardContent className="p-0 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Teacher</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Length</TableHead>
                          <TableHead>Scheduled</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {oneToOneQuery.data?.map(s => (
                          <TableRow key={s.id}>
                            <TableCell>{s.teacher?.name || "-"}</TableCell>
                            <TableCell>{s.student?.name || "-"}</TableCell>
                            <TableCell>{s.sessionLength} min</TableCell>
                            <TableCell>
                              {s.scheduledAt
                                ? new Date(s.scheduledAt).toLocaleString()
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  s.status === "completed"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {s.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {(s.status === "scheduled" ||
                                s.status === "ongoing") && (
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => handleJoinOneToOne(s)}
                                >
                                  <Video className="w-3 h-3 mr-1" /> Join
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );
}
