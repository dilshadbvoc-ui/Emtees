import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [tab, setTab] = useState("password");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const sendOtp = trpc.auth.sendOtp.useMutation({
    onSuccess: data => {
      toast.success(`OTP sent! (Demo: ${data.code})`);
    },
    onError: err => toast.error(err.message),
  });

  const verifyOtp = trpc.auth.verifyOtp.useMutation({
    onSuccess: data => {
      login(data);
      toast.success("Logged in with OTP");
      navigate("/");
    },
    onError: err => toast.error(err.message),
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: data => {
      login(data);
      toast.success("Logged in successfully");
      navigate("/");
    },
    onError: err => toast.error(err.message),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: data => {
      login(data);
      toast.success("Registered successfully");
      navigate("/");
    },
    onError: err => toast.error(err.message),
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    const deviceToken = `device_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    loginMutation.mutate({ username, password, deviceToken });
  };

  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !otp) return;
    const deviceToken = `device_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    verifyOtp.mutate({ phone, code: otp, deviceToken });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !username || !password) return;
    registerMutation.mutate({
      name,
      phone,
      username,
      password,
      role: "student",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-emerald-700">
            EMTEES Academy
          </CardTitle>
          <p className="text-sm text-gray-500">Learning Management System</p>
        </CardHeader>
        <CardContent>
          {!isRegister ? (
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="password">Username</TabsTrigger>
                <TabsTrigger value="otp">OTP</TabsTrigger>
              </TabsList>
              <TabsContent value="password">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <Input
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="otp">
                <form onSubmit={handleOtpVerify} className="space-y-4 mt-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Phone"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => sendOtp.mutate({ phone })}
                      disabled={sendOtp.isPending}
                    >
                      Send
                    </Button>
                  </div>
                  <Input
                    placeholder="OTP"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    maxLength={6}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={verifyOtp.isPending}
                  >
                    {verifyOtp.isPending ? "Verifying..." : "Verify & Login"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4 mt-4">
              <Input
                placeholder="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <Input
                placeholder="Phone"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
              <Input
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Registering..." : "Register"}
              </Button>
            </form>
          )}
          <p className="text-center text-sm mt-4 text-gray-500">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-emerald-600 hover:underline font-medium"
            >
              {isRegister ? "Login" : "Register"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
