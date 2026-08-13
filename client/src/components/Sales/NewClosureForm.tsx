import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  onSuccess?: () => void;
}

export default function NewClosureForm({ onSuccess }: Props) {
  const { user } = useAuth();
  const isAdmin = ["super_admin", "admin"].includes(user?.role || "");

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [course, setCourse] = useState("");
  const [type, setType] = useState("New Closure");
  const [admNo, setAdmNo] = useState("");
  const [studentName, setStudentName] = useState("");
  const [totalFee, setTotalFee] = useState("");
  const [firstInst, setFirstInst] = useState("");
  const [secondInst, setSecondInst] = useState("");
  const [thirdInst, setThirdInst] = useState("");
  const [bank, setBank] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  const [caId, setCaId] = useState<string>("");

  const utils = trpc.useUtils();
  const createClosure = trpc.sales.createClosure.useMutation({
    onSuccess: () => {
      toast.success("Closure recorded successfully");
      utils.sales.listClosures.invalidate();
      if (onSuccess) onSuccess();
      // Reset form
      setCourse(""); setAdmNo(""); setStudentName(""); setTotalFee(""); setFirstInst("");
      setSecondInst(""); setThirdInst(""); setBank(""); setVerificationStatus("");
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const { data: executives } = trpc.salesExecutive.listExecutives.useQuery(undefined, {
    enabled: isAdmin,
  });

  const { data: modules } = trpc.learning.listModules.useQuery();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !type || !totalFee) {
      toast.error("Please fill required fields");
      return;
    }

    createClosure.mutate({
      closingDate: new Date(date),
      courseName: course,
      type,
      admNo,
      studentName,
      totalFee: parseFloat(totalFee),
      firstInst: parseFloat(firstInst) || 0,
      secondInst: parseFloat(secondInst) || 0,
      thirdInst: parseFloat(thirdInst) || 0,
      bank,
      verificationStatus,
      caId: isAdmin && caId ? parseInt(caId) : undefined,
    });
  };

  const previewBalance = parseFloat(totalFee || "0") - (parseFloat(firstInst || "0") + parseFloat(secondInst || "0") + parseFloat(thirdInst || "0"));

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-slate-900 dark:text-slate-100">New Data Entry (Closure)</CardTitle>
        <CardDescription>Enter sales details. Balance and Points are calculated automatically.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Date</Label>
              <Input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200"
                required
              />
            </div>
            
            {isAdmin && (
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Sales Executive (CA)</Label>
                <Select value={caId} onValueChange={setCaId}>
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200">
                    <SelectValue placeholder="Select CA" />
                  </SelectTrigger>
                  <SelectContent>
                    {executives?.map(ex => (
                      <SelectItem key={ex.id} value={ex.id.toString()}>{ex.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New Closure">New Closure</SelectItem>
                  <SelectItem value="Old Balance">Old Balance</SelectItem>
                  <SelectItem value="Renewal">Renewal</SelectItem>
                  <SelectItem value="Upgrade">Upgrade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Course</Label>
              <Select value={course} onValueChange={setCourse}>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {modules?.map(m => (
                    <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Admission No</Label>
              <Input 
                placeholder="Leave blank if pending" 
                value={admNo} 
                onChange={e => setAdmNo(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Student Name</Label>
              <Input 
                value={studentName} 
                onChange={e => setStudentName(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Total Fee</Label>
              <Input 
                type="number" 
                value={totalFee} 
                onChange={e => setTotalFee(e.target.value)}
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">First Inst</Label>
              <Input 
                type="number" 
                value={firstInst} 
                onChange={e => setFirstInst(e.target.value)}
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Second Inst</Label>
              <Input 
                type="number" 
                value={secondInst} 
                onChange={e => setSecondInst(e.target.value)}
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Third Inst</Label>
              <Input 
                type="number" 
                value={thirdInst} 
                onChange={e => setThirdInst(e.target.value)}
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Bank</Label>
              <Input 
                placeholder="e.g. Federal, UPI"
                value={bank} 
                onChange={e => setBank(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Verification Status</Label>
              <Input 
                placeholder="e.g. NOT VERIFIED"
                value={verificationStatus} 
                onChange={e => setVerificationStatus(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Balance Preview</Label>
              <div className="h-10 flex items-center px-3 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 text-amber-500 font-bold">
                ₹{previewBalance > 0 ? previewBalance : 0}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={createClosure.isPending} className="bg-indigo-600 hover:bg-indigo-700">
              {createClosure.isPending ? "Saving..." : "Save Closure"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
