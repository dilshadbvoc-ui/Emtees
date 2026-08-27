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
  };
  group: {
    teacherId: number | "";
    batchId: number | "";
    designatedTime: string;
    sessions30: number;
    sessions45: number;
    sessions60: number;
  };
}

interface ClassAllocationFormProps {
  value: ClassAllocationValue;
  onChange: (value: ClassAllocationValue) => void;
  readOnlySessions?: boolean;
  departmentId?: number | null;
}

export function ClassAllocationForm({ value, onChange, readOnlySessions = false, departmentId }: ClassAllocationFormProps) {
  const teachersQuery = trpc.user.list.useQuery({ role: "teacher", status: "active", limit: 200 });
  const batchesQuery = trpc.learning.listBatches.useQuery(undefined);

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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
          <div className="space-y-4 border rounded-md p-4 bg-white col-span-2">
            <h4 className="text-sm font-semibold text-gray-700">Allocated Sessions</h4>
            <div className="grid grid-cols-3 gap-4">
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
          </div>
        </div>
        <p className="text-[10px] text-right font-semibold text-slate-500">
          Total One-to-One: {value.oneToOne.sessions30 + value.oneToOne.sessions45 + value.oneToOne.sessions60} Sessions
        </p>
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
          <div className="space-y-4 border rounded-md p-4 bg-white col-span-3">
            <h4 className="text-sm font-semibold text-gray-700">Allocated Sessions</h4>
            <div className="grid grid-cols-3 gap-4">
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
          </div>
        </div>
        <p className="text-[10px] text-right font-semibold text-slate-500">
          Total Group: {value.group.sessions30 + value.group.sessions45 + value.group.sessions60} Sessions
        </p>
      </div>
    </div>
  );
}
