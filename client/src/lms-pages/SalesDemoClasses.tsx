import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Video, Plus, Copy, CheckCircle2, XCircle, Clock, ChevronDown,
  User, BookOpen, Phone, Mail, Calendar, RefreshCw, ExternalLink,
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string; Icon: any }> = {
  pending:   { label: "Pending",   color: "bg-yellow-100 text-yellow-700",  Icon: Clock },
  completed: { label: "Completed", color: "bg-green-100 text-green-700",    Icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-600",        Icon: XCircle },
};

function BookDemoDialog({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [teacherId, setTeacherId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");

  const teachersQuery = trpc.salesExecutive.getAvailableTeachers.useQuery();
  const modulesQuery = trpc.learning.listModules.useQuery();
  const createMut = trpc.salesExecutive.createDemoClass.useMutation({
    onSuccess: () => { toast.success("Demo class created!"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !studentName.trim()) return;
    createMut.mutate({
      teacherId: parseInt(teacherId),
      studentName: studentName.trim(),
      studentPhone: studentPhone || undefined,
      studentEmail: studentEmail || undefined,
      moduleId: moduleId ? parseInt(moduleId) : undefined,
      scheduledAt: scheduledAt || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Student Name *</label>
          <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Full name" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Phone</label>
            <Input value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} placeholder="+91..." />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
            <Input type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} placeholder="student@example.com" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Assign Teacher *</label>
          <Select value={teacherId} onValueChange={setTeacherId} required>
            <SelectTrigger>
              <SelectValue placeholder="Select available teacher..." />
            </SelectTrigger>
            <SelectContent>
              {teachersQuery.data?.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.name} ({t.username})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Course (optional)</label>
          <Select value={moduleId} onValueChange={setModuleId}>
            <SelectTrigger>
              <SelectValue placeholder="Select course..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— None —</SelectItem>
              {modulesQuery.data?.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Scheduled Date & Time</label>
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Notes</label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes for the teacher..." />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={createMut.isPending || !teacherId || !studentName.trim()} className="flex-1 gap-2">
          <Video className="w-4 h-4" /> Create Demo Class
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}

function CompleteDialog({
  demo,
  onSuccess,
  onClose,
}: {
  demo: any;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [durationMinutes, setDurationMinutes] = useState("");
  const [converted, setConverted] = useState(false);
  const [notes, setNotes] = useState(demo.notes || "");

  const completeMut = trpc.salesExecutive.completeDemoClass.useMutation({
    onSuccess: () => { toast.success("Demo marked as completed"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Duration (minutes)</label>
        <Input
          type="number" min={1} max={180}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          placeholder="e.g. 45"
        />
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
        <input
          id="converted"
          type="checkbox"
          checked={converted}
          onChange={(e) => setConverted(e.target.checked)}
          className="w-4 h-4 rounded accent-green-600"
        />
        <label htmlFor="converted" className="text-sm font-medium text-green-800 cursor-pointer">
          Student converted to enrollment
        </label>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Notes</label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={() =>
            completeMut.mutate({
              id: demo.id,
              durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
              convertedToEnrollment: converted,
              notes: notes || undefined,
            })
          }
          disabled={completeMut.isPending}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Completed
        </Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

function JitsiLinkCard({ demoId, jitsiRoom }: { demoId: number; jitsiRoom: string }) {
  const [copied, setCopied] = useState(false);
  const jitsiHost = import.meta.env.VITE_JITSI_HOST || "meet.gecouncil.com";
  const link = `https://${jitsiHost}/${jitsiRoom}`;

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 bg-gray-50 border rounded px-3 py-1.5 text-xs text-gray-600 truncate font-mono">
        {link}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={copy} className="gap-1 flex-shrink-0">
        {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Copied!" : "Copy"}
      </Button>
      <a href={link} target="_blank" rel="noopener noreferrer">
        <Button type="button" variant="ghost" size="sm">
          <ExternalLink className="w-3.5 h-3.5" />
        </Button>
      </a>
    </div>
  );
}

export default function SalesDemoClasses() {
  const { user } = useAuth();
  const [showBook, setShowBook] = useState(false);
  const [completeDemo, setCompleteDemo] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "cancelled">("all");

  const listQuery = trpc.salesExecutive.listDemoClasses.useQuery({ status: statusFilter });

  const cancelMut = trpc.salesExecutive.cancelDemoClass.useMutation({
    onSuccess: () => { toast.success("Demo cancelled"); listQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const demos = listQuery.data || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-xl">
            <Video className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Demo Classes</h1>
            <p className="text-sm text-gray-500">Book and manage demo sessions for prospective students</p>
          </div>
        </div>
        <Button onClick={() => setShowBook(true)} className="gap-2 bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4" /> Book Demo Class
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: demos.length, cls: "text-gray-800" },
          { label: "Pending", value: demos.filter((d) => d.status === "pending").length, cls: "text-yellow-600" },
          { label: "Completed", value: demos.filter((d) => d.status === "completed").length, cls: "text-green-600" },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter + refresh */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={() => listQuery.refetch()}>
          <RefreshCw className={`w-4 h-4 ${listQuery.isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Demo list */}
      {listQuery.isLoading && (
        <div className="text-center py-16 text-gray-400">Loading demo classes...</div>
      )}
      {!listQuery.isLoading && demos.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <Video className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No demo classes yet</p>
            <p className="text-sm text-gray-400 mt-1">Book a demo session to get started</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {demos.map((demo) => {
          const st = STATUS_MAP[demo.status] || STATUS_MAP.pending;
          return (
            <Card key={demo.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{demo.studentName}</h3>
                      <Badge className={`${st.color} border-0 text-xs`}>
                        <st.Icon className="w-3 h-3 mr-1" />
                        {st.label}
                      </Badge>
                      {demo.convertedToEnrollment && (
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs">Converted ✓</Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                      {demo.studentPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {demo.studentPhone}
                        </span>
                      )}
                      {demo.studentEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {demo.studentEmail}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Teacher: <span className="font-medium text-gray-700">{(demo as any).teacher?.name || "—"}</span>
                      </span>
                      {(demo as any).module && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {(demo as any).module.name}
                        </span>
                      )}
                      {demo.scheduledAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(demo.scheduledAt).toLocaleString()}
                        </span>
                      )}
                      {demo.durationMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {demo.durationMinutes} min
                        </span>
                      )}
                    </div>

                    {/* Jitsi link for pending */}
                    {demo.status === "pending" && (
                      <JitsiLinkCard demoId={demo.id} jitsiRoom={demo.jitsiRoom} />
                    )}

                    {demo.notes && (
                      <p className="text-xs text-gray-500 mt-2 italic">"{demo.notes}"</p>
                    )}
                  </div>

                  {/* Actions */}
                  {demo.status === "pending" && (
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-700 border-green-200 hover:bg-green-50 gap-1"
                        onClick={() => setCompleteDemo(demo)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-1"
                        onClick={() => cancelMut.mutate({ id: demo.id })}
                        disabled={cancelMut.isPending}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Book Dialog */}
      <Dialog open={showBook} onOpenChange={setShowBook}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-600" /> Book Demo Class
            </DialogTitle>
          </DialogHeader>
          <BookDemoDialog
            onSuccess={() => { setShowBook(false); listQuery.refetch(); }}
            onClose={() => setShowBook(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      {completeDemo && (
        <Dialog open={!!completeDemo} onOpenChange={() => setCompleteDemo(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Mark Demo Completed — {completeDemo.studentName}</DialogTitle>
            </DialogHeader>
            <CompleteDialog
              demo={completeDemo}
              onSuccess={() => { setCompleteDemo(null); listQuery.refetch(); }}
              onClose={() => setCompleteDemo(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
