import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bell, Check, Megaphone } from "lucide-react";
import { toast } from "sonner";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    userId: 0,
    title: "",
    message: "",
    type: "announcement",
  });

  const isAdmin = ["super_admin", "admin", "academic_head"].includes(
    user?.role || ""
  );

  const notifications = trpc.student.myNotifications.useQuery(undefined, {
    enabled: user?.role === "student",
  });
  const adminNotifications = trpc.admin.listNotifications.useQuery(undefined, {
    enabled: isAdmin,
  });

  const markRead = trpc.student.markNotificationRead.useMutation({
    onSuccess: () => notifications.refetch(),
  });

  const sendNotification = trpc.admin.sendNotification.useMutation({
    onSuccess: () => {
      toast.success("Notification sent");
      setBroadcastOpen(false);
      setBroadcastForm({
        userId: 0,
        title: "",
        message: "",
        type: "announcement",
      });
      adminNotifications.refetch();
    },
    onError: err => toast.error(err.message),
  });

  const data =
    user?.role === "student" ? notifications.data : adminNotifications.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Notifications</h3>
          <Badge variant="secondary">
            {data?.filter(n => !n.isRead).length || 0} unread
          </Badge>
        </div>
        {isAdmin && (
          <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Megaphone className="w-4 h-4 mr-2" /> Broadcast
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Notification</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  sendNotification.mutate(broadcastForm);
                }}
                className="space-y-3 mt-2"
              >
                <Input
                  type="number"
                  placeholder="User ID"
                  value={broadcastForm.userId}
                  onChange={e =>
                    setBroadcastForm({
                      ...broadcastForm,
                      userId: Number(e.target.value),
                    })
                  }
                />
                <Input
                  placeholder="Title"
                  value={broadcastForm.title}
                  onChange={e =>
                    setBroadcastForm({
                      ...broadcastForm,
                      title: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Message"
                  value={broadcastForm.message}
                  onChange={e =>
                    setBroadcastForm({
                      ...broadcastForm,
                      message: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Type (e.g. announcement, reminder)"
                  value={broadcastForm.type}
                  onChange={e =>
                    setBroadcastForm({ ...broadcastForm, type: e.target.value })
                  }
                />
                <Button
                  type="submit"
                  className="w-full bg-emerald-600"
                  disabled={sendNotification.isPending}
                >
                  {sendNotification.isPending ? "Sending..." : "Send"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-3">
        {data?.map(n => (
          <Card
            key={n.id}
            className={
              n.isRead ? "opacity-70" : "border-l-4 border-l-emerald-500"
            }
          >
            <CardContent className="p-4 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${n.isRead ? "bg-gray-100" : "bg-emerald-100"}`}
                >
                  <Bell className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-sm text-gray-500">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                  </p>
                </div>
              </div>
              {!n.isRead && user?.role === "student" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => markRead.mutate({ id: n.id })}
                >
                  <Check className="w-4 h-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        {data?.length === 0 && (
          <p className="text-center text-gray-500 py-10">No notifications</p>
        )}
      </div>
    </div>
  );
}
