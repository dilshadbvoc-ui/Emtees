import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MessageCircle,
  Calendar,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  Bell,
  Menu,
  X,
  GraduationCap,
  UserCog,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: GraduationCap, label: "Students", path: "/students" },
  { icon: UserCog, label: "Teachers", path: "/teachers" },
  { icon: Users, label: "Users", path: "/users" },
  { icon: BookOpen, label: "Batches", path: "/batches" },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: Calendar, label: "Classes", path: "/classes" },
  { icon: CreditCard, label: "Fees", path: "/fees" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: Shield, label: "Discipline", path: "/discipline" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const studentNav = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: BookOpen, label: "Batches", path: "/batches" },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: Calendar, label: "Classes", path: "/classes" },
  { icon: CreditCard, label: "Fees", path: "/fees" },
  { icon: BarChart3, label: "Progress", path: "/reports" },
  { icon: Bell, label: "Alerts", path: "/notifications" },
];

const teacherNav = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: BookOpen, label: "My Batches", path: "/batches" },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: Calendar, label: "Classes", path: "/classes" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const isAdmin = ["super_admin", "admin", "academic_head"].includes(user?.role || "");
  const items = isAdmin
    ? navItems
    : user.role === "teacher"
    ? teacherNav
    : studentNav;

  const currentLabel =
    items.find(i => i.path === location.pathname)?.label || "Dashboard";

  const notificationsQuery = trpc.student.myNotifications.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 5000,
  });

  const markReadMutation = trpc.student.markNotificationRead.useMutation({
    onSuccess: () => {
      notificationsQuery.refetch();
    },
  });

  const unreadCount = notificationsQuery.data?.filter((n) => !n.isRead).length || 0;

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b flex items-center gap-3">
        <img src="/logo.png" alt="EMTEES Academy" className="h-10 w-10 object-contain" />
        <div>
          <h1 className="text-base font-bold text-emerald-700 leading-none">EMTEES</h1>
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-1">Academy</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {items.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">
              {user.role.replace(/_/g, " ")}
            </p>
          </div>
        </div>
        <Button variant="outline" className="w-full text-sm" onClick={logout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-white border-r flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white flex flex-col shadow-xl z-50">
            <div className="flex items-center justify-between px-4 pt-4">
              <span className="text-sm font-semibold text-gray-700">Menu</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-base font-semibold text-gray-800 truncate">
              {currentLabel}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Notification Bell Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-gray-100">
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="px-4 py-3 border-b flex items-center justify-between bg-emerald-50/50">
                  <span className="font-semibold text-sm text-gray-700">Notifications</span>
                  {unreadCount > 0 && (
                    <Badge className="bg-emerald-600 text-[10px]">{unreadCount} new</Badge>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {notificationsQuery.data?.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && markReadMutation.mutate({ id: n.id })}
                      className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer text-xs ${
                        !n.isRead ? "bg-emerald-50/20 font-medium" : "text-gray-500"
                      }`}
                    >
                      <p className="font-semibold text-gray-800 text-xs mb-0.5">{n.title}</p>
                      <p className="text-gray-600 mb-1">{n.message}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(n.createdAt).toLocaleDateString()} at{" "}
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ))}
                  {(!notificationsQuery.data || notificationsQuery.data.length === 0) && (
                    <p className="text-xs text-gray-400 text-center py-8">No notifications</p>
                  )}
                </div>
                <div className="p-2 border-t text-center bg-gray-50/50">
                  <Link
                    to="/notifications"
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 block w-full py-1"
                  >
                    View all notifications
                  </Link>
                </div>
              </PopoverContent>
            </Popover>

            <span className="hidden sm:block text-sm text-gray-500 truncate max-w-[120px]">
              {user.name}
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>

        {/* Mobile bottom nav */}
        <nav className="md:hidden bg-white border-t flex items-center justify-around px-1 py-1 shrink-0">
          {items.slice(0, 5).map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-0 flex-1 ${
                  active ? "text-emerald-700" : "text-gray-500"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 ${active ? "text-emerald-700" : "text-gray-400"}`}
                />
                <span className="text-[10px] font-medium truncate w-full text-center">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
