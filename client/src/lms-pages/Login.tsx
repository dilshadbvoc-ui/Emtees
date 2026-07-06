import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Login() {
  const router = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason");
    if (reason) {
      toast.error(reason, { duration: 5000 });
      // Remove query parameter without reload
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      login(data);
      toast.success("Logged in successfully");
      router("/");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    const deviceToken = `device_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    loginMutation.mutate({ username, password, deviceToken });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#091221] to-[#1D2A44] p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-md">
        <CardHeader className="text-center pb-2 flex flex-col items-center">
          <img src="/logo.jpg" alt="EMTEES Academy Logo" className="h-20 w-auto object-contain rounded-md mb-2" />
          <CardTitle className="text-2xl font-bold text-[#1D2A44]">EMTEES Academy</CardTitle>
          <p className="text-sm text-gray-500">Learning Management System</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit" className="w-full bg-[#C8102E] hover:bg-[#A50C22] text-white font-medium" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

