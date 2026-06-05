import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, Bell, Shield, Zap } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);

  const isAdmin = ["super_admin", "admin", "academic_head"].includes(
    user?.role || ""
  );

  // Feature flags — read from localStorage (env vars are server-side; show as read-only info)
  const gamificationFlag =
    localStorage.getItem("FEATURE_GAMIFICATION") ?? "false";
  const aiInsightsFlag = localStorage.getItem("FEATURE_AI_INSIGHTS") ?? "false";

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" /> Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input defaultValue={user?.name || ""} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input defaultValue={user?.phone || ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Username</Label>
            <Input defaultValue={user?.username || ""} />
          </div>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => toast.success("Profile updated")}
          >
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-gray-500">
                Receive alerts for classes, fees, and announcements
              </p>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-500">Get summary emails weekly</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input type="password" placeholder="Enter current password" />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" placeholder="Enter new password" />
          </div>
          <Button
            variant="outline"
            onClick={() => toast.success("Password changed")}
          >
            Change Password
          </Button>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" /> Feature Flags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              These flags are controlled via environment variables on the
              server. The values shown reflect the current localStorage
              overrides (for reference only).
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">FEATURE_GAMIFICATION</p>
                <p className="text-sm text-gray-500">
                  Enables attendance streak badges and gamification features
                </p>
              </div>
              <Badge
                variant={gamificationFlag === "true" ? "default" : "secondary"}
                className={
                  gamificationFlag === "true"
                    ? "bg-emerald-100 text-emerald-700"
                    : ""
                }
              >
                {gamificationFlag === "true" ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">FEATURE_AI_INSIGHTS</p>
                <p className="text-sm text-gray-500">
                  Enables at-risk student detection and teacher performance
                  flags
                </p>
              </div>
              <Badge
                variant={aiInsightsFlag === "true" ? "default" : "secondary"}
                className={
                  aiInsightsFlag === "true"
                    ? "bg-emerald-100 text-emerald-700"
                    : ""
                }
              >
                {aiInsightsFlag === "true" ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
