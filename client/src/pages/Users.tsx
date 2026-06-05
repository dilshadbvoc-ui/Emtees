import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Plus, Upload, Edit, Trash2 } from "lucide-react";

export default function UsersPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>(() => {
    if (location.pathname === "/students") return "student";
    if (location.pathname === "/teachers") return "teacher";
    return "all";
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editUser, setEditUser] = useState<any>(null);
  const [csvData, setCsvData] = useState("");

  // Sync role filter with pathname
  useEffect(() => {
    if (location.pathname === "/students") {
      setRoleFilter("student");
    } else if (location.pathname === "/teachers") {
      setRoleFilter("teacher");
    } else {
      setRoleFilter("all");
    }
  }, [location.pathname]);

  // Profile Stats states
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState<any>(null);

  const isAdmin = ["super_admin", "admin", "academic_head"].includes(
    user?.role || ""
  );
  const isSuperAdmin = user?.role === "super_admin";
  const modulesQuery = trpc.learning.listModules.useQuery(undefined, {
    enabled: isAdmin,
  });

  const usersQuery = trpc.user.list.useQuery(
    {
      role: roleFilter as any,
      status: statusFilter as any,
      search: search || undefined,
      limit: 50,
      offset: 0,
    },
    { enabled: isAdmin }
  );

  const userStatsQuery = trpc.admin.getUserStats.useQuery(
    { userId: selectedProfileUser?.id || 0, role: selectedProfileUser?.role },
    {
      enabled:
        !!selectedProfileUser &&
        (selectedProfileUser.role === "student" ||
          selectedProfileUser.role === "teacher"),
    }
  );

  const createUser = trpc.user.create.useMutation({
    onSuccess: () => {
      toast.success("User created");
      setOpen(false);
      usersQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const updateUser = trpc.user.update.useMutation({
    onSuccess: () => {
      toast.success("User updated");
      setEditOpen(false);
      usersQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const deleteUser = trpc.user.delete.useMutation({
    onSuccess: () => {
      toast.success("User deleted");
      setDeleteId(null);
      usersQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const importStudents = trpc.user.importStudents.useMutation({
    onSuccess: data => {
      toast.success(`Imported ${data.imported} students`);
      setImportOpen(false);
      setCsvData("");
      usersQuery.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    username: "",
    password: "",
    role: "student" as any,
    course: "",
    batch: "",
    feesTotal: 0,
    discount: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate({
      ...form,
      email: form.email || undefined,
    });
  };

  const handleEditOpen = (u: any) => {
    setEditUser({
      id: u.id,
      role: u.role,
      name: u.name,
      phone: u.phone,
      email: u.email,
      status: u.status,
      course: u.profile?.course || "",
      batch: u.profile?.batch || "",
      feesTotal: Number(u.profile?.feesTotal || 0),
      discount: Number(u.profile?.discount || 0),
    });
    setEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    updateUser.mutate(editUser);
  };

  const handleImport = () => {
    const lines = csvData.trim().split("\n").filter(Boolean);
    const students = lines.map(line => {
      const [name, phone, email, course, batch, feesTotal] = line
        .split(",")
        .map(s => s.trim());
      return {
        name,
        phone,
        email: email || undefined,
        course: course || undefined,
        batch: batch || undefined,
        feesTotal: feesTotal ? Number(feesTotal) : undefined,
      };
    });
    importStudents.mutate(students);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-700";
      case "admin":
        return "bg-orange-100 text-orange-700";
      case "academic_head":
        return "bg-purple-100 text-purple-700";
      case "teacher":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-emerald-100 text-emerald-700";
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Access restricted to administrators.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-9 w-full sm:w-56"
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {location.pathname === "/users" && (
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Admins</option>
            </select>
          )}
          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Dialog
            open={open}
            onOpenChange={val => {
              setOpen(val);
              if (val) {
                let initialRole = "student";
                if (location.pathname === "/teachers") initialRole = "teacher";
                setForm({
                  name: "",
                  phone: "",
                  email: "",
                  username: "",
                  password: "",
                  role: initialRole as any,
                  course: "",
                  batch: "",
                  feesTotal: 0,
                  discount: 0,
                });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                {location.pathname === "/students"
                  ? "Add Student"
                  : location.pathname === "/teachers"
                    ? "Add Teacher"
                    : "Add User"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {location.pathname === "/students"
                    ? "Create New Student"
                    : location.pathname === "/teachers"
                      ? "Create New Teacher"
                      : "Create New User"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Full Name"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="10+ digits"
                      value={form.phone}
                      onChange={e =>
                        setForm({ ...form, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Email{" "}
                    <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <Input
                    placeholder="Email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Username"
                      value={form.username}
                      onChange={e =>
                        setForm({ ...form, username: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="password"
                      placeholder="Min 6 characters"
                      value={form.password}
                      onChange={e =>
                        setForm({ ...form, password: e.target.value })
                      }
                    />
                  </div>
                </div>
                {location.pathname === "/users" && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                      <option value="academic_head">Academic Head</option>
                    </select>
                  </div>
                )}
                {form.role === "student" ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">
                          Course{" "}
                          <span className="text-gray-400 text-xs">
                            (optional)
                          </span>
                        </label>
                        <select
                          className="w-full border rounded-md px-3 py-2 text-sm"
                          value={form.course}
                          onChange={e => {
                            const courseName = e.target.value;
                            const matchedModule = modulesQuery.data?.find(
                              m => m.name === courseName
                            );
                            const standardFee = matchedModule
                              ? Number(matchedModule.fees || 0)
                              : 0;
                            setForm({
                              ...form,
                              course: courseName,
                              feesTotal: standardFee,
                            });
                          }}
                        >
                          <option value="">Select Course</option>
                          {modulesQuery.data?.map(m => (
                            <option key={m.id} value={m.name}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">
                          Batch{" "}
                          <span className="text-gray-400 text-xs">
                            (optional)
                          </span>
                        </label>
                        <Input
                          placeholder="Batch"
                          value={form.batch}
                          onChange={e =>
                            setForm({ ...form, batch: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">
                          Total Fees
                        </label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={form.feesTotal}
                          onChange={e =>
                            setForm({
                              ...form,
                              feesTotal: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">
                          Discount (₹) {!isSuperAdmin && "(Super Admin only)"}
                        </label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={form.discount}
                          onChange={e =>
                            setForm({
                              ...form,
                              discount: Number(e.target.value),
                            })
                          }
                          disabled={!isSuperAdmin}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">
                        Course{" "}
                        <span className="text-gray-400 text-xs">
                          (optional)
                        </span>
                      </label>
                      <Input
                        placeholder="Course"
                        value={form.course}
                        onChange={e =>
                          setForm({ ...form, course: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">
                        Batch{" "}
                        <span className="text-gray-400 text-xs">
                          (optional)
                        </span>
                      </label>
                      <Input
                        placeholder="Batch"
                        value={form.batch}
                        onChange={e =>
                          setForm({ ...form, batch: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={createUser.isPending}
                >
                  {createUser.isPending ? "Creating..." : "Create User"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Mobile Card List (hidden on desktop) */}
      <div className="md:hidden space-y-3">
        {usersQuery.data?.map((u) => (
          <Card key={u.id} className="cursor-pointer hover:border-emerald-300" onClick={() => { setSelectedProfileUser(u); setProfileOpen(true); }}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-gray-500 font-semibold">
                  {u.profile?.studentId || `ID: ${u.id}`}
                </span>
                <Badge variant={u.status === "active" ? "default" : "secondary"}>
                  {u.status}
                </Badge>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 text-sm">{u.name}</h4>
                <p className="text-xs text-gray-500">{u.phone}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge className={getRoleColor(u.role) + " text-[10px]"}>
                  {u.role.replace("_", " ")}
                </Badge>
                {(u.enrollments && u.enrollments.length > 0
                  ? u.enrollments.map((e: any) => e.batch?.module?.name).filter(Boolean).join(", ")
                  : u.profile?.course) && (
                  <Badge variant="outline" className="text-[10px]">
                    Course: {u.enrollments && u.enrollments.length > 0 ? u.enrollments.map((e: any) => e.batch?.module?.name).filter(Boolean).join(", ") : u.profile?.course}
                  </Badge>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3"
                  onClick={() => handleEditOpen(u)}
                >
                  <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
                  onClick={() => setDeleteId(u.id)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {usersQuery.data?.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No users found</p>
        )}
      </div>

      <Card className="hidden md:block">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {location.pathname === "/teachers"
                    ? "Teacher ID"
                    : "Student ID"}
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersQuery.data?.map(u => (
                <TableRow
                  key={u.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setSelectedProfileUser(u);
                    setProfileOpen(true);
                  }}
                >
                  <TableCell className="font-mono text-xs">
                    {u.profile?.studentId || "-"}
                  </TableCell>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.phone}</TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(u.role)}>
                      {u.role.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={u.status === "active" ? "default" : "secondary"}
                    >
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.enrollments && u.enrollments.length > 0
                      ? u.enrollments
                          .map((e: any) => e.batch?.module?.name)
                          .filter(Boolean)
                          .join(", ")
                      : u.profile?.course || "-"}
                  </TableCell>
                  <TableCell>
                    {u.enrollments && u.enrollments.length > 0
                      ? u.enrollments
                          .map((e: any) => e.batch?.name)
                          .filter(Boolean)
                          .join(", ")
                      : u.profile?.batch || "-"}
                  </TableCell>
                  <TableCell>
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditOpen(u)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => setDeleteId(u.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {usersQuery.data?.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-gray-500 py-8"
                  >
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editUser && (
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Full Name"
                  value={editUser.name}
                  onChange={e =>
                    setEditUser({ ...editUser, name: e.target.value })
                  }
                />
                <Input
                  placeholder="Phone"
                  value={editUser.phone}
                  onChange={e =>
                    setEditUser({ ...editUser, phone: e.target.value })
                  }
                />
              </div>
              <Input
                placeholder="Email"
                value={editUser.email || ""}
                onChange={e =>
                  setEditUser({ ...editUser, email: e.target.value })
                }
              />
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={editUser.status}
                onChange={e =>
                  setEditUser({ ...editUser, status: e.target.value })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="on_hold">On Hold</option>
              </select>
              {editUser.role === "student" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 font-medium">
                        Course
                      </label>
                      <select
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={editUser.course}
                        onChange={e => {
                          const courseName = e.target.value;
                          const matchedModule = modulesQuery.data?.find(
                            m => m.name === courseName
                          );
                          const standardFee = matchedModule
                            ? Number(matchedModule.fees || 0)
                            : 0;
                          setEditUser({
                            ...editUser,
                            course: courseName,
                            feesTotal: standardFee,
                          });
                        }}
                      >
                        <option value="">Select Course</option>
                        {modulesQuery.data?.map(m => (
                          <option key={m.id} value={m.name}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 font-medium">
                        Batch
                      </label>
                      <Input
                        placeholder="Batch"
                        value={editUser.batch || ""}
                        onChange={e =>
                          setEditUser({ ...editUser, batch: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 font-medium">
                        Total Fees
                      </label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={editUser.feesTotal}
                        onChange={e =>
                          setEditUser({
                            ...editUser,
                            feesTotal: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 font-medium">
                        Discount (₹) {!isSuperAdmin && "(Super Admin only)"}
                      </label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={editUser.discount}
                        onChange={e =>
                          setEditUser({
                            ...editUser,
                            discount: Number(e.target.value),
                          })
                        }
                        disabled={!isSuperAdmin}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-medium">
                      Course
                    </label>
                    <Input
                      placeholder="Course"
                      value={editUser.course || ""}
                      onChange={e =>
                        setEditUser({ ...editUser, course: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-medium">
                      Batch
                    </label>
                    <Input
                      placeholder="Batch"
                      value={editUser.batch || ""}
                      onChange={e =>
                        setEditUser({ ...editUser, batch: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={updateUser.isPending}
              >
                {updateUser.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={open => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The user will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && deleteUser.mutate({ id: deleteId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Import Students</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-sm text-gray-500">
              Paste CSV:{" "}
              <code className="bg-gray-100 px-1 rounded text-xs">
                name,phone,email,course,batch,feesTotal
              </code>{" "}
              (one per line)
            </p>
            <Textarea
              placeholder={
                "John Doe,9876543210,john@example.com,IELTS,Batch A,15000\nJane Smith,9876543211,,PTE,Batch B,12000"
              }
              value={csvData}
              onChange={e => setCsvData(e.target.value)}
              rows={8}
            />
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={handleImport}
              disabled={importStudents.isPending || !csvData.trim()}
            >
              {importStudents.isPending ? "Importing..." : "Import Students"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              User Profile — {selectedProfileUser?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded-lg">
              {selectedProfileUser?.role === "student" && (
                <>
                  <div>
                    <p className="text-gray-500 text-xs uppercase font-medium">
                      Student ID
                    </p>
                    <p className="font-bold text-emerald-700 font-mono">
                      {selectedProfileUser?.profile?.studentId || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase font-medium">
                      Enrollment No.
                    </p>
                    <p className="font-bold text-emerald-700 font-mono">
                      {selectedProfileUser?.profile?.enrollmentNumber || "-"}
                    </p>
                  </div>
                </>
              )}
              <div>
                <p className="text-gray-500 text-xs uppercase font-medium">
                  Username
                </p>
                <p className="font-semibold text-gray-800">
                  {selectedProfileUser?.username || "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase font-medium">
                  Role
                </p>
                <p className="font-semibold text-gray-800 capitalize">
                  {selectedProfileUser?.role?.replace("_", " ") || "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase font-medium">
                  Phone
                </p>
                <p className="font-semibold text-gray-800">
                  {selectedProfileUser?.phone || "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase font-medium">
                  Email
                </p>
                <p className="font-semibold text-gray-800">
                  {selectedProfileUser?.email || "-"}
                </p>
              </div>
            </div>

            {userStatsQuery.isLoading && (
              <p className="text-sm text-gray-500 text-center py-4">
                Loading stats...
              </p>
            )}

            {userStatsQuery.data && (
              <div className="space-y-4 border-t pt-4">
                {userStatsQuery.data.role === "student" && (
                  <>
                    <h4 className="font-semibold text-sm text-gray-700">
                      Course & Attendance Summary
                    </h4>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="text-xs py-2">
                              Batch/Course
                            </TableHead>
                            <TableHead className="text-xs py-2 text-center">
                              Attended
                            </TableHead>
                            <TableHead className="text-xs py-2 text-center">
                              Remaining
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userStatsQuery.data.courses?.map((c: any) => (
                            <TableRow key={c.batchId}>
                              <TableCell className="py-2 text-xs font-medium">
                                {c.batchName}{" "}
                                <span className="text-[10px] text-gray-400 font-normal">
                                  ({c.moduleName})
                                </span>
                              </TableCell>
                              <TableCell className="py-2 text-xs text-center font-semibold text-emerald-600">
                                {c.attended}
                              </TableCell>
                              <TableCell className="py-2 text-xs text-center font-semibold text-gray-500">
                                {c.left}
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!userStatsQuery.data.courses ||
                            userStatsQuery.data.courses.length === 0) && (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="text-center text-xs text-gray-400 py-3"
                              >
                                Not enrolled in any active batches
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg text-sm">
                      <div>
                        <p className="text-emerald-800 text-xs font-medium">
                          Base Course Fee
                        </p>
                        <p className="text-base font-bold text-emerald-900">
                          ₹{userStatsQuery.data.feesTotal?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                      <div>
                        <p className="text-emerald-800 text-xs font-medium">
                          Discount Applied
                        </p>
                        <p className="text-base font-bold text-red-600">
                          -₹{userStatsQuery.data.discount?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                      <div>
                        <p className="text-emerald-800 text-xs font-medium">
                          Unpaid/Overdue Invoices
                        </p>
                        <p className="text-base font-bold text-emerald-900">
                          ₹{userStatsQuery.data.pendingFees?.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-emerald-800 text-xs font-medium">
                          Profile Outstanding Balance
                        </p>
                        <p className="text-base font-bold text-emerald-900">
                          ₹{userStatsQuery.data.feesBalance?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {userStatsQuery.data.role === "teacher" && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Card className="bg-emerald-50/20 border-emerald-100/50">
                      <CardContent className="p-4 text-center">
                        <p className="text-gray-500 text-xs font-semibold uppercase">
                          Classes Given
                        </p>
                        <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                          {userStatsQuery.data.classesGiven}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Completed sessions
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-emerald-50/20 border-emerald-100/50">
                      <CardContent className="p-4 text-center">
                        <p className="text-gray-500 text-xs font-semibold uppercase">
                          Students Managing
                        </p>
                        <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                          {userStatsQuery.data.studentsManaged}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Active batch enrollments
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
