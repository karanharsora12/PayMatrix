import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Sparkles,
} from "lucide-react";

const REMEMBERED_EMAIL_KEY = "paymatrix_remembered_identity";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const savedIdentity =
    typeof window !== "undefined"
      ? localStorage.getItem(REMEMBERED_EMAIL_KEY) || ""
      : "";

  const [email, setEmail] = useState(savedIdentity || "admin@paymatrix.com");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(Boolean(savedIdentity));
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  // If already authenticated, redirect to home
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = "Email or username is required";
    }
    if (!password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setServerError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);

      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }

      toast({
        title: "Login successful",
        description: "Welcome back!",
        variant: "success",
      });
      navigate("/");
    } catch (err: any) {
      const code =
        err?.normalizedError?.code || err?.response?.data?.error?.code;
      const rawMessage =
        err?.normalizedError?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        "";

      let userFriendlyMessage =
        "Unable to sign in right now. Please try again.";

      if (
        code === "AUTH_INVALID_CREDENTIALS" ||
        rawMessage.toLowerCase().includes("invalid")
      ) {
        userFriendlyMessage = "Invalid username or password.";
      } else if (
        code === "AUTH_ACCOUNT_DISABLED" ||
        rawMessage.toLowerCase().includes("disabled") ||
        rawMessage.toLowerCase().includes("inactive")
      ) {
        userFriendlyMessage =
          "Your account is inactive. Please contact the administrator.";
      } else if (
        err?.code === "ERR_NETWORK" ||
        rawMessage.toLowerCase().includes("network")
      ) {
        userFriendlyMessage =
          "Unable to connect to the server. Please check your connection.";
      }

      setServerError(userFriendlyMessage);
      toast({
        title: "Authentication Failed",
        description: userFriendlyMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("admin@paymatrix.com");
    setPassword("Password123!");
    setErrors({});
    setServerError(null);
  };

  return (
    <div className="h-screen w-full lg:grid lg:grid-cols-2 bg-background font-sans antialiased">
      {/* ============================================================ */}
      {/* LEFT SECTION: 50% Width Enterprise HR & Payroll Showcase   */}
      {/* ============================================================ */}
      <div className="hidden lg:flex flex-col justify-between bg-[#080e22] text-white p-10 xl:p-14 relative border-r border-slate-800/80 h-full">
        {/* Subtle patterned background grid */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
        {/* Soft background ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md shadow-primary/30">
            PM
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              PayMatrix
            </div>
            <p className="text-xs text-slate-400">
              HR & Payroll Management System
            </p>
          </div>
        </div>

        {/* Center Content with balanced vertical spacing */}
        <div className="relative z-10 max-w-lg my-auto py-8 space-y-8">
          <div>
            <h1 className="text-3xl xl:text-4xl font-bold tracking-tight text-white leading-[1.2]">
              Manage People.
              <br />
              Process Payroll.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
                Grow Better.
              </span>
            </h1>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed max-w-md">
              Everything you need to orchestrate employees, shifts, attendance,
              leave, and statutory compliance in one secure platform.
            </p>
          </div>

          {/* Key Feature Items */}
          <div className="space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 flex h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Employee Management
                </p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Onboarding, employee groups, and secure document repository.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 flex h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Attendance & Leave
                </p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Dynamic shift rosters, real-time registers, and leave
                  policies.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 flex h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Payroll & Payslips
                </p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Configurable salary structures, PF/ESI/TDS, and one-click
                  payslips.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* RIGHT SECTION: 50% Width Login Form Card                   */}
      {/* ============================================================ */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-background text-foreground h-full">
        {/* Mobile Header Branding */}
        <div className="lg:hidden flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              PM
            </div>
            <div>
              <span className="text-sm font-bold text-foreground">
                PayMatrix
              </span>
              <p className="text-[10px] text-muted-foreground">
                HR & Payroll System
              </p>
            </div>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            Secure Portal
          </span>
        </div>

        {/* Centered Login Card */}
        <div className="w-full max-w-[380px] mx-auto my-auto py-4">
          <div className="mb-5">
            <div className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
              <span>Enterprise Login</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome Back
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Sign in to access your HR & Payroll dashboard.
            </p>
          </div>

          {/* Server Error Alert Banner */}
          {serverError && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-200 text-xs"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Authentication Failed</p>
                <p className="mt-0.5 text-red-700 dark:text-red-300">
                  {serverError}
                </p>
              </div>
            </div>
          )}

          {/* Form with standard React state */}
          <form onSubmit={onSubmit} className="space-y-3.5" noValidate>
            {/* Username / Email */}
            <div className="space-y-1">
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-foreground"
              >
                Email or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="login-email"
                  type="text"
                  autoComplete="username"
                  disabled={loading}
                  placeholder="Enter your email or username"
                  className="pl-9 h-9 text-xs sm:text-sm rounded-md"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-foreground"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-xs font-medium text-primary hover:underline focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  disabled={loading}
                  placeholder="Enter your password"
                  className="pl-9 pr-9 h-9 text-xs sm:text-sm rounded-md"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                />
                <button
                  type="button"
                  tabIndex={0}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-0.5">
              <label
                htmlFor="rememberMe"
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                  disabled={loading}
                />
                <span className="text-xs text-muted-foreground">
                  Remember me
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-9 text-xs sm:text-sm font-semibold rounded-md shadow-sm mt-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </Button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          {/* <div className="mt-4 pt-3.5 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span className="flex items-center gap-1 font-medium text-[11px]">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Demo Credentials
              </span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Auto-fill
              </button>
            </div>
            <div
              onClick={handleFillDemo}
              className="p-2 rounded-md bg-muted/60 border border-border text-xs text-muted-foreground cursor-pointer hover:bg-muted transition-colors font-mono flex items-center justify-between"
            >
              <span>admin@paymatrix.com</span>
              <span className="text-muted-foreground/60">/</span>
              <span>Password123!</span>
            </div>
          </div> */}
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        open={forgotPasswordOpen} 
        onOpenChange={setForgotPasswordOpen} 
        initialEmail={email} 
      />
    </div>
  );
}
