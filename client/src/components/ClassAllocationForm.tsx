import React from "react";
import { trpc } from "@/providers/trpc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface ClassAllocationValue {
  oneToOne: {
    teacherId: number | "";
    designatedTime: string;
    sessions30: number;
    sessions45: number;
    sessions60: number;
    completed30?: number;
    completed45?: number;
    completed60?: number;
  };
  group: {
    teacherId: number | "";
    batchId: number | "";
    designatedTime: string;
    sessions30: number;
    sessions45: number;
    sessions60: number;
    completed30?: number;
    completed45?: number;
    completed60?: number;
  };
}

interface ClassAllocationFormProps {
  value: ClassAllocationValue;
  onChange: (value: ClassAllocationValue) => void;
  readOnlySessions?: boolean;
  departmentId?: number | null;
  studentId?: number | null;
}

export function ClassAllocationForm({ value, onChange, readOnlySessions = false, departmentId, studentId }: ClassAllocationFormProps) {
  const teachersQuery = trpc.user.list.useQuery({ role: "teacher", status: "active", limit: 200 });
  const batchesQuery = trpc.learning.listBatches.useQuery(undefined);
  const profileQuery = trpc.students.getProfile.useQuery(
    { id: Number(studentId) },
    { enabled: !!studentId && Number(studentId) > 0 }
  );

  const teacherConductedSummary = React.useMemo(() => {
    if (!profileQuery.data?.classHistory) return [];

    const o2oCompleted = profileQuery.data.classHistory.filter(
      (item: any) => item.sessionType === "one_to_one" && (item.status === "completed" || item.status === "present")
    );

    const countsMap = new Map<string, { teacherId: number | null; teacherName: string; count: number }>();

    for (const s of o2oCompleted) {
      const key = s.teacherId ? String(s.teacherId) : (s.teacherName || "Unknown Teacher");
      const existing = countsMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        countsMap.set(key, {
          teacherId: s.teacherId ? Number(s.teacherId) : null,
          teacherName: s.teacherName || "Unknown Teacher",
          count: 1,
        });
      }
    }

    return Array.from(countsMap.values());
  }, [profileQuery.data?.classHistory]);

  const filteredTeachers = React.useMemo(() => {
    if (!teachersQuery.data) return [];
    if (!departmentId) return teachersQuery.data;
    return teachersQuery.data.filter((t: any) => t.departmentId === departmentId);
  }, [teachersQuery.data, departmentId]);

  const handleO2OChange = (field: string, val: any) => {
    onChange({
      ...value,
      oneToOne: {
        ...value.oneToOne,
        [field]: val,
      },
    });
  };

  const handleGroupChange = (field: string, val: any) => {
    onChange({
      ...value,
      group: {
        ...value.group,
        [field]: val,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* One-to-One Allocation Section */}
      <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-4">
        <h4 className="font-bold text-xs text-emerald-800 uppercase tracking-wider">One-to-One Sessions Allocation</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Assigned Teacher</Label>
            <select
              value={value.oneToOne.teacherId}
              onChange={(e) => handleO2OChange("teacherId", e.target.value !== "" ? Number(e.target.value) : "")}
              className="h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-xs outline-none"
            >
              <option value="">Select Teacher</option>
              {filteredTeachers.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name} ({t.unionId})</option>
              ))}
            </select>
            {value.oneToOne.teacherId !== "" && value.oneToOne.teacherId !== null && (
              <div className="flex items-center justify-between text-[10px] bg-slate-100 rounded px-2 py-1 mt-1">
                <span className="text-slate-600 font-medium truncate">
                  Current: {filteredTeachers.find((t: any) => t.id === value.oneToOne.teacherId)?.name || "Selected"}
                </span>
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700 font-bold underline shrink-0 ml-1"
                  onClick={() => handleO2OChange("teacherId", "")}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Designated Time</Label>
            <Input
              type="time"
              value={value.oneToOne.designatedTime || ""}
              onChange={(e) => handleO2OChange("designatedTime", e.target.value)}
              className="h-9 text-xs bg-white"
            />
          </div>
          <div className="space-y-4 border rounded-md p-4 bg-white col-span-1 md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-700">Allocated Sessions</h4>

            {teacherConductedSummary.length > 0 && (
              <div className="p-3 bg-emerald-50/60 border border-emerald-100/80 rounded-lg space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Conducted Classes History by Teacher
                </span>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {teacherConductedSummary.map((t) => {
                    const isCurrent = value.oneToOne.teacherId !== "" && value.oneToOne.teacherId !== null && Number(value.oneToOne.teacherId) === Number(t.teacherId);
                    return (
                      <div
                        key={t.teacherId || t.teacherName}
                        className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 border ${
                          isCurrent
                            ? "bg-emerald-100/90 text-emerald-900 border-emerald-300 font-medium"
                            : "bg-white text-slate-700 border-slate-200"
                        }`}
                      >
                        <span className="font-semibold">{t.teacherName}</span>
                        {isCurrent ? (
                          <span className="text-[9px] text-emerald-800 font-bold bg-emerald-200/80 px-1 py-0.5 rounded uppercase">Current</span>
                        ) : (
                          <span className="text-[9px] text-slate-500 font-bold bg-slate-100 px-1 py-0.5 rounded uppercase">Previous</span>
                        )}
                        <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-emerald-700 text-white font-bold text-[10px]">
                          {t.count} {t.count === 1 ? "class" : "classes"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">30 Min Sessions</Label>
                <Input
                  type="number"
                  min="0"
                  value={value.oneToOne.sessions30}
                  onChange={(e) => handleO2OChange("sessions30", Number(e.target.value))}
                  disabled={readOnlySessions}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">45 Min Sessions</Label>
                <Input
                  type="number"
                  min="0"
                  value={value.oneToOne.sessions45}
                  onChange={(e) => handleO2OChange("sessions45", Number(e.target.value))}
                  disabled={readOnlySessions}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">60 Min Sessions</Label>
                <Input
                  type="number"
                  min="0"
                  value={value.oneToOne.sessions60}
                  onChange={(e) => handleO2OChange("sessions60", Number(e.target.value))}
                  disabled={readOnlySessions}
                />
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-emerald-700 mb-3">Already Taken (Completed)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-emerald-700">30 Min Sessions</Label>
                  <Input
                    type="number"
                    min="0"
                    value={value.oneToOne.completed30 || 0}
                    onChange={(e) => handleO2OChange("completed30", Number(e.target.value))}
                    disabled={readOnlySessions}
                    className="border-emerald-200 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-emerald-700">45 Min Sessions</Label>
                  <Input
                    type="number"
                    min="0"
                    value={value.oneToOne.completed45 || 0}
                    onChange={(e) => handleO2OChange("completed45", Number(e.target.value))}
                    disabled={readOnlySessions}
                    className="border-emerald-200 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-emerald-700">60 Min Sessions</Label>
                  <Input
                    type="number"
                    min="0"
                    value={value.oneToOne.completed60 || 0}
                    onChange={(e) => handleO2OChange("completed60", Number(e.target.value))}
                    disabled={readOnlySessions}
                    className="border-emerald-200 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-4 text-[10px] font-semibold text-slate-500">
          <span>Total Allocated: {value.oneToOne.sessions30 + value.oneToOne.sessions45 + value.oneToOne.sessions60}</span>
          <span className="text-emerald-600">Total Completed: {(value.oneToOne.completed30 || 0) + (value.oneToOne.completed45 || 0) + (value.oneToOne.completed60 || 0)}</span>
          <span className="text-blue-600">Remaining: {Math.max(0, (value.oneToOne.sessions30 + value.oneToOne.sessions45 + value.oneToOne.sessions60) - ((value.oneToOne.completed30 || 0) + (value.oneToOne.completed45 || 0) + (value.oneToOne.completed60 || 0)))}</span>
        </div>
      </div>

      {/* Group Allocation Section */}
      <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-4">
        <h4 className="font-bold text-xs text-emerald-800 uppercase tracking-wider">Group Sessions Allocation</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Assigned Teacher</Label>
            <select
              value={value.group.teacherId}
              onChange={(e) => handleGroupChange("teacherId", e.target.value !== "" ? Number(e.target.value) : "")}
              className="h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-xs outline-none"
            >
              <option value="">Select Teacher</option>
              {filteredTeachers.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name} ({t.unionId})</option>
              ))}
            </select>
            {value.group.teacherId !== "" && value.group.teacherId !== null && (
              <div className="flex items-center justify-between text-[10px] bg-slate-100 rounded px-2 py-1 mt-1">
                <span className="text-slate-600 font-medium truncate">
                  Current: {filteredTeachers.find((t: any) => t.id === value.group.teacherId)?.name || "Selected"}
                </span>
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700 font-bold underline shrink-0 ml-1"
                  onClick={() => handleGroupChange("teacherId", "")}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Assigned Batch</Label>
            <select
              value={value.group.batchId}
              onChange={(e) => handleGroupChange("batchId", e.target.value !== "" ? Number(e.target.value) : "")}
              className="h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-xs outline-none"
            >
              <option value="">Select Batch</option>
              {batchesQuery.data?.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {value.group.batchId !== "" && value.group.batchId !== null && (
              <div className="flex items-center justify-between text-[10px] bg-slate-100 rounded px-2 py-1 mt-1">
                <span className="text-slate-600 font-medium truncate">
                  Current: {batchesQuery.data?.find((b: any) => b.id === value.group.batchId)?.name || "Selected"}
                </span>
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700 font-bold underline shrink-0 ml-1"
                  onClick={() => handleGroupChange("batchId", "")}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Designated Time</Label>
            <Input
              type="time"
              value={value.group.designatedTime || ""}
              onChange={(e) => handleGroupChange("designatedTime", e.target.value)}
              className="h-9 text-xs bg-white"
            />
          </div>
          <div className="space-y-4 border rounded-md p-4 bg-white col-span-1 md:col-span-3">
            <h4 className="text-sm font-semibold text-gray-700">Allocated Sessions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">30 Min Sessions</Label>
                <Input
                  type="number"
                  min="0"
                  value={value.group.sessions30}
                  onChange={(e) => handleGroupChange("sessions30", Number(e.target.value))}
                  disabled={readOnlySessions}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">45 Min Sessions</Label>
                <Input
                  type="number"
                  min="0"
                  value={value.group.sessions45}
                  onChange={(e) => handleGroupChange("sessions45", Number(e.target.value))}
                  disabled={readOnlySessions}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">60 Min Sessions</Label>
                <Input
                  type="number"
                  min="0"
                  value={value.group.sessions60}
                  onChange={(e) => handleGroupChange("sessions60", Number(e.target.value))}
                  disabled={readOnlySessions}
                />
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-emerald-700 mb-3">Already Taken (Completed)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-emerald-700">30 Min Sessions</Label>
                  <Input
                    type="number"
                    min="0"
                    value={value.group.completed30 || 0}
                    onChange={(e) => handleGroupChange("completed30", Number(e.target.value))}
                    disabled={readOnlySessions}
                    className="border-emerald-200 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-emerald-700">45 Min Sessions</Label>
                  <Input
                    type="number"
                    min="0"
                    value={value.group.completed45 || 0}
                    onChange={(e) => handleGroupChange("completed45", Number(e.target.value))}
                    disabled={readOnlySessions}
                    className="border-emerald-200 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-emerald-700">60 Min Sessions</Label>
                  <Input
                    type="number"
                    min="0"
                    value={value.group.completed60 || 0}
                    onChange={(e) => handleGroupChange("completed60", Number(e.target.value))}
                    disabled={readOnlySessions}
                    className="border-emerald-200 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-4 text-[10px] font-semibold text-slate-500">
          <span>Total Allocated: {value.group.sessions30 + value.group.sessions45 + value.group.sessions60}</span>
          <span className="text-emerald-600">Total Completed: {(value.group.completed30 || 0) + (value.group.completed45 || 0) + (value.group.completed60 || 0)}</span>
          <span className="text-blue-600">Remaining: {Math.max(0, (value.group.sessions30 + value.group.sessions45 + value.group.sessions60) - ((value.group.completed30 || 0) + (value.group.completed45 || 0) + (value.group.completed60 || 0)))}</span>
        </div>
      </div>
    </div>
  );
}
