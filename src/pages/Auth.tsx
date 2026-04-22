import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { FlaskConical, Loader2, Mail, Lock, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { isAllowedEmail, allowedDomainsLabel, ORG_NAME } from "@/lib/orgConfig";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate("/", { replace: true });
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;

  const validate = (): boolean => {
    if (!email || !password) {
      toast.error("กรุณากรอกอีเมลและรหัสผ่าน");
      return false;
    }
    if (!isAllowedEmail(email)) {
      toast.error(`อนุญาตเฉพาะอีเมลโดเมน: ${allowedDomainsLabel()}`);
      return false;
    }
    if (password.length < 6) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return false;
    }
    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        if (error.message.toLowerCase().includes("already")) {
          toast.error("อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ");
        } else {
          toast.error("สมัครไม่สำเร็จ: " + error.message);
        }
        return;
      }
      toast.success("สมัครสมาชิกเรียบร้อย");
      navigate("/", { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        toast.error("เข้าสู่ระบบล้มเหลว: " + error.message);
        return;
      }
      toast.success("เข้าสู่ระบบสำเร็จ");
      navigate("/", { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <FlaskConical className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{ORG_NAME}</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            สำหรับบุคลากรภายในองค์กรเท่านั้น
          </p>
        </div>

        <Card className="border-border/60 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">เข้าสู่ระบบ</CardTitle>
            <CardDescription className="text-xs">
              อนุญาตเฉพาะอีเมลโดเมน:{" "}
              <span className="font-medium text-primary">{allowedDomainsLabel()}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="signin">เข้าสู่ระบบ</TabsTrigger>
                <TabsTrigger value="signup">สมัครสมาชิก</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-3">
                  <EmailField email={email} setEmail={setEmail} />
                  <PasswordField password={password} setPassword={setPassword} />
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    เข้าสู่ระบบ
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-3">
                  <EmailField email={email} setEmail={setEmail} />
                  <PasswordField password={password} setPassword={setPassword} />
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    สมัครสมาชิก
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          หากต้องการเพิ่มโดเมนองค์กร กรุณาติดต่อผู้ดูแลระบบ
        </p>
      </div>
    </div>
  );
};

function EmailField({ email, setEmail }: { email: string; setEmail: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="email" className="text-xs">อีเมลองค์กร</Label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="email"
          type="email"
          placeholder="name@doa.in.th"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-9"
          autoComplete="email"
          required
        />
      </div>
    </div>
  );
}

function PasswordField({ password, setPassword }: { password: string; setPassword: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="password" className="text-xs">รหัสผ่าน</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="password"
          type="password"
          placeholder="อย่างน้อย 6 ตัวอักษร"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="pl-9"
          autoComplete="current-password"
          required
        />
      </div>
    </div>
  );
}

export default Auth;
