import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  CreditCard,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = ["super_admin", "admin", "academic_head"].includes(
    user?.role || ""
  );
  const isTeacher = user?.role === "teacher";

  const statsQuery = trpc.admin.getDashboardStats.useQuery(undefined, {
    enabled: isAdmin,
  });
  const myBatches = trpc.user.myBatches.useQuery(undefined, {
    enabled: !isAdmin,
  });
  const myAttendance = trpc.class.myAttendance.useQuery(undefined, {
    enabled: user?.role === "student",
  });
  const notifications = trpc.student.myNotifications.useQuery(undefined, {
    enabled: user?.role === "student",
  });
  const myProfile = trpc.user.myProfile.useQuery(undefined, {
    enabled: user?.role === "student",
  });

  const stats = statsQuery.data;

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {isAdmin && stats && (
          <>
            <StatCard
              icon={Users}
              label="Total Students"
              value={stats.totalStudents}
              color="bg-blue-50 text-blue-600"
              to="/students"
            />
            <StatCard
              icon={GraduationCap}
              label="Teachers"
              value={stats.totalTeachers}
              color="bg-emerald-50 text-emerald-600"
              to="/teachers"
            />
            <StatCard
              icon={BookOpen}
              label="Batches"
              value={stats.totalBatches}
              color="bg-purple-50 text-purple-600"
              to="/batches"
            />
            <StatCard
              icon={Calendar}
              label="Classes Held"
              value={stats.totalClasses}
              color="bg-orange-50 text-orange-600"
              to="/classes"
            />
          </>
        )}
        {isTeacher && (
          <>
            <StatCard
              icon={Calendar}
              label="My Classes"
              value="-"
              color="bg-blue-50 text-blue-600"
              to="/classes"
            />
            <StatCard
              icon={Users}
              label="My Students"
              value="-"
              color="bg-emerald-50 text-emerald-600"
              to="/students"
            />
          </>
        )}
        {user.role === "student" && (
          <>
            <StatCard
              icon={BookOpen}
              label="My Batches"
              value={myBatches.data?.length || 0}
              color="bg-blue-50 text-blue-600"
              to="/batches"
            />
            <StatCard
              icon={Calendar}
              label="Attendance"
              value={`${myAttendance.data?.filter(a => a.status === "present").length || 0}/${myAttendance.data?.length || 0}`}
              color="bg-emerald-50 text-emerald-600"
              to="/reports"
            />
            <StatCard
              icon={CreditCard}
              label="Fees Balance"
              value={
                myProfile.data?.profile?.feesBalance
                  ? `₹${Number(myProfile.data.profile.feesBalance).toFixed(2)}`
                  : "₹0.00"
              }
              color="bg-purple-50 text-purple-600"
              to="/fees"
            />
            <StatCard
              icon={MessageCircle}
              label="Messages"
              value="-"
              color="bg-orange-50 text-orange-600"
              to="/chat"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
            {isAdmin && (
              <>
                <QuickAction
                  to="/users"
                  label="Manage Users"
                  desc="Add/edit students & teachers"
                />
                <QuickAction
                  to="/batches"
                  label="Manage Batches"
                  desc="Create modules & batches"
                />
                <QuickAction
                  to="/classes"
                  label="Schedule Classes"
                  desc="Plan live sessions"
                />
                <QuickAction
                  to="/fees"
                  label="Fee Management"
                  desc="Track payments & dues"
                />
              </>
            )}
            {isTeacher && (
              <>
                <QuickAction
                  to="/classes"
                  label="My Classes"
                  desc="View & start sessions"
                />
                <QuickAction
                  to="/chat"
                  label="Group Chat"
                  desc="Message your batches"
                />
                <QuickAction
                  to="/reports"
                  label="Reports"
                  desc="View performance data"
                />
              </>
            )}
            {user.role === "student" && (
              <>
                <QuickAction
                  to="/batches"
                  label="My Batches"
                  desc="View enrolled batches"
                />
                <QuickAction
                  to="/chat"
                  label="Group Chat"
                  desc="Chat with batch members"
                />
                <QuickAction
                  to="/classes"
                  label="Upcoming Classes"
                  desc="See scheduled sessions"
                />
                <QuickAction
                  to="/fees"
                  label="My Fees"
                  desc="View payment status"
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(user.role === "student" &&
              notifications.data?.slice(0, 5).map(n => (
                <div key={n.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium">{n.title}</p>
                    <p className="text-gray-500 text-xs">{n.message}</p>
                  </div>
                </div>
              ))) || (
              <p className="text-sm text-gray-500">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  to,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  to?: string;
}) {
  const cardContent = (
    <Card
      className={
        to
          ? "cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/20 transition-all"
          : ""
      }
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 truncate">{label}</p>
            <p className="text-xl md:text-2xl font-bold mt-0.5">{value}</p>
          </div>
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ml-2 ${color}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return to ? <Link to={to}>{cardContent}</Link> : cardContent;
}

function QuickAction({
  to,
  label,
  desc,
}: {
  to: string;
  label: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between p-4 rounded-lg border hover:border-emerald-300 hover:bg-emerald-50 transition-colors group"
    >
      <div>
        <p className="font-medium text-gray-900 group-hover:text-emerald-700">
          {label}
        </p>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
    </Link>
  );
}
